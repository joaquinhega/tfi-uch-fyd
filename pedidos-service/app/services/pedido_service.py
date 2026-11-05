import contextvars
import uuid
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as PlazoVencido
from decimal import Decimal

from app import cliente_stock
from app.circuit_breaker import CircuitoAbierto
from app.cliente_stock import FalloStock
from app.config import FAULT_AFTER_RESERVE, RESERVA_TIMEOUT_SECONDS
from app.dao.pedido_dao import PedidoDao
from app.db import SessionLocal
from app.errores import ErrorNegocio
from app.identidad import Identidad
from app.logger import log
from app.models import Pedido, PedidoItem
from app.schemas import PedidoIn, PedidoOut

# Hilos donde corre la reserva: permite responder EN_ESPERA sin cortar la reserva en curso
_ejecutor = ThreadPoolExecutor(max_workers=20, thread_name_prefix="reserva")

CODIGO_HTTP_POR_MOTIVO = {
    "SIN_STOCK": 409,
    "ARTICULO_NO_ENCONTRADO": 409,
    "RESERVA_RECHAZADA": 409,
    "STOCK_NO_DISPONIBLE": 503,
    "ERROR_INTERNO_COMPENSADO": 500,
}


def codigo_http(pedido: PedidoOut) -> int:
    if pedido.estado == "ACEPTADO":
        return 201
    if pedido.estado in ("PENDIENTE", "EN_ESPERA"):
        return 202
    return CODIGO_HTTP_POR_MOTIVO.get(pedido.motivo or "", 409)


# ---------- Pasos de la reserva (corren en segundo plano) ----------

def _rechazar(pedido_id: str, motivo: str, detalle: str) -> None:
    with SessionLocal() as session, session.begin():
        pedido = PedidoDao(session).obtener(pedido_id)
        pedido.estado = "RECHAZADO"
        pedido.motivo = motivo
        pedido.detalle = detalle[:300]
    log("info", "pedido RECHAZADO", pedido_id=pedido_id, motivo=motivo, detalle=detalle)


def _confirmar(pedido_id: str, reserva: dict) -> None:
    with SessionLocal() as session, session.begin():
        if FAULT_AFTER_RESERVE:
            raise RuntimeError("Fallo inyectado después de reservar (FAULT_AFTER_RESERVE=true)")
        pedido = PedidoDao(session).obtener(pedido_id)
        precios = {i["articulo_id"]: Decimal(str(i["precio_unitario"])) for i in reserva["items"]}
        total = Decimal("0")
        for item in pedido.items:
            item.precio_unitario = precios[item.articulo_id]  # precio congelado al momento del pedido (RF-05)
            item.subtotal = item.precio_unitario * item.cantidad
            total += item.subtotal
        pedido.total = total
        pedido.estado = "ACEPTADO"
        pedido.motivo = None
        pedido.detalle = None
    log("info", "pedido ACEPTADO", pedido_id=pedido_id, total=total)


def _compensar(pedido_id: str) -> None:
    """Compensación (TP3 ADR-09): el pedido falló después de reservar, se devuelve el stock."""
    try:
        respuesta = cliente_stock.liberar(pedido_id)
        if respuesta.status_code == 200:
            log("info", "compensación realizada: stock liberado", pedido_id=pedido_id)
            return
        log("error", "compensación rechazada por Stock", pedido_id=pedido_id, status=respuesta.status_code)
    except (CircuitoAbierto, FalloStock) as error:
        log("critical", "no se pudo compensar: el stock queda retenido hasta reintentar", pedido_id=pedido_id, error=str(error))


def procesar_reserva(pedido_id: str) -> None:
    with SessionLocal() as session:
        pedido = PedidoDao(session).obtener(pedido_id)
        items = [{"articulo_id": i.articulo_id, "cantidad": i.cantidad} for i in pedido.items]

    try:
        respuesta = cliente_stock.reservar(pedido_id, items)
    except CircuitoAbierto as error:
        return _rechazar(pedido_id, "STOCK_NO_DISPONIBLE", str(error))
    except FalloStock as error:
        return _rechazar(pedido_id, "STOCK_NO_DISPONIBLE", str(error))

    if respuesta.status_code in (200, 201):
        try:
            _confirmar(pedido_id, respuesta.json())
        except Exception as error:
            log("error", "el pedido falló después de reservar; se compensa", pedido_id=pedido_id, error=str(error))
            _compensar(pedido_id)
            _rechazar(pedido_id, "ERROR_INTERNO_COMPENSADO", "Error al confirmar el pedido; la reserva fue liberada")
        return

    mensaje = respuesta.json().get("mensaje", "") if respuesta.content else ""
    if respuesta.status_code == 409:
        return _rechazar(pedido_id, "SIN_STOCK", mensaje)
    if respuesta.status_code == 404:
        return _rechazar(pedido_id, "ARTICULO_NO_ENCONTRADO", mensaje)
    return _rechazar(pedido_id, "RESERVA_RECHAZADA", f"Stock respondió {respuesta.status_code}: {mensaje}")


# ---------- Operaciones del contrato pedidos-api ----------

class PedidoService:
    def _leer(self, pedido_id: str) -> Pedido | None:
        with SessionLocal() as session:
            return PedidoDao(session).obtener(pedido_id)

    def crear(self, datos: PedidoIn, identidad: Identidad) -> PedidoOut:
        pedido_id = str(uuid.uuid4())
        with SessionLocal() as session, session.begin():
            PedidoDao(session).agregar(Pedido(
                id=pedido_id,
                usuario_id=identidad.id,
                usuario_email=identidad.email,
                nombre_cliente=datos.nombre_cliente.strip(),
                estado="PENDIENTE",
                items=[PedidoItem(articulo_id=i.articulo_id, cantidad=i.cantidad) for i in datos.items],
            ))
        log("info", "pedido recibido", pedido_id=pedido_id, usuario=identidad.email)

        # copy_context: la reserva en segundo plano conserva el ID de correlación para los logs
        futuro = _ejecutor.submit(contextvars.copy_context().run, procesar_reserva, pedido_id)
        try:
            futuro.result(timeout=RESERVA_TIMEOUT_SECONDS)
        except PlazoVencido:
            # Plazo blando superado (TP2 §6): no se rechaza, queda EN ESPERA y se resuelve en segundo plano
            with SessionLocal() as session, session.begin():
                if PedidoDao(session).marcar_en_espera_si_pendiente(pedido_id):
                    log("warning", "pedido EN ESPERA: la reserva superó el plazo blando",
                        pedido_id=pedido_id, plazo_segundos=RESERVA_TIMEOUT_SECONDS)

        return PedidoOut.model_validate(self._leer(pedido_id))

    def consultar(self, pedido_id: str, identidad: Identidad) -> PedidoOut:
        pedido = self._leer(pedido_id)
        # A un pedido ajeno se responde 404 (no 403) para no revelar que existe
        if pedido is None or (not identidad.es_admin and pedido.usuario_id != identidad.id):
            raise ErrorNegocio(404, "PEDIDO_NO_ENCONTRADO", f"No existe el pedido {pedido_id}")
        return PedidoOut.model_validate(pedido)

    def listar(self, identidad: Identidad) -> list[PedidoOut]:
        with SessionLocal() as session:
            pedidos = PedidoDao(session).listar(None if identidad.es_admin else identidad.id)
            return [PedidoOut.model_validate(p) for p in pedidos]