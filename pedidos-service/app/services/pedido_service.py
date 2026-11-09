import contextvars
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as PlazoVencido
from decimal import Decimal

from app import cliente_stock
from app.circuit_breaker import CircuitoAbierto
from app.cliente_auditoria import registrar_evento
from app.cliente_stock import FalloStock
from app.config import FAULT_AFTER_RESERVE, REINTENTO_SEGUNDOS, RESERVA_TIMEOUT_SECONDS
from app.dao.pedido_dao import PedidoDao
from app.db import SessionLocal
from app.errores import ErrorNegocio
from app.identidad import Identidad
from app.logger import log
from app.models import Pedido, PedidoItem
from app.schemas import PedidoIn, PedidoOut

_ejecutor = ThreadPoolExecutor(max_workers=20, thread_name_prefix="reserva")

CODIGO_HTTP_POR_MOTIVO = {
    "SIN_STOCK": 409,
    "ARTICULO_NO_ENCONTRADO": 409,
    "RESERVA_RECHAZADA": 409,
    "STOCK_NO_DISPONIBLE": 503,
    "ERROR_INTERNO_COMPENSADO": 500,
    "COMPENSACION_PENDIENTE": 500,
}


def codigo_http(pedido: PedidoOut) -> int:
    if pedido.estado == "ACEPTADO":
        return 201
    if pedido.estado in ("PENDIENTE", "EN_ESPERA"):
        return 202
    return CODIGO_HTTP_POR_MOTIVO.get(pedido.motivo or "", 409)


def _rechazar(pedido_id: str, motivo: str, detalle: str) -> None:
    with SessionLocal() as session, session.begin():
        pedido = PedidoDao(session).obtener(pedido_id)
        pedido.estado = "RECHAZADO"
        pedido.motivo = motivo
        pedido.detalle = detalle[:300]
    log("info", "pedido RECHAZADO", pedido_id=pedido_id, motivo=motivo, detalle=detalle)
    registrar_evento("PEDIDO_RECHAZADO", {"pedido_id": pedido_id, "motivo": motivo})


def _confirmar(pedido_id: str, reserva: dict) -> None:
    with SessionLocal() as session, session.begin():
        # Inyección de fallo
        if FAULT_AFTER_RESERVE:
            raise RuntimeError("Fallo inyectado después de reservar (FAULT_AFTER_RESERVE=true)")
        pedido = PedidoDao(session).obtener(pedido_id)
        precios = {i["articulo_id"]: Decimal(str(i["precio_unitario"])) for i in reserva["items"]}
        total = Decimal("0")
        for item in pedido.items:
            item.precio_unitario = precios[item.articulo_id]
            item.subtotal = item.precio_unitario * item.cantidad
            total += item.subtotal
        pedido.total = total
        pedido.estado = "ACEPTADO"
        pedido.motivo = None
        pedido.detalle = None
        usuario = pedido.usuario_email
        cantidad_items = len(pedido.items)
    log("info", "pedido ACEPTADO", pedido_id=pedido_id, total=total)
    registrar_evento("PEDIDO_ACEPTADO", {
        "pedido_id": pedido_id, "usuario": usuario, "total": str(total), "items": cantidad_items,
    })


# Compensación: liberarStock
def _compensar(pedido_id: str) -> bool:
    try:
        respuesta = cliente_stock.liberar(pedido_id)
        if respuesta.status_code == 200:
            log("info", "compensación realizada: stock liberado", pedido_id=pedido_id)
            return True
        log("error", "compensación rechazada por Stock", pedido_id=pedido_id, status=respuesta.status_code)
    except (CircuitoAbierto, FalloStock) as error:
        log("critical", "no se pudo compensar; se reintentará", pedido_id=pedido_id, error=str(error))
    return False


def procesar_reserva(pedido_id: str, recuperacion: bool = False) -> None:
    with SessionLocal() as session:
        pedido = PedidoDao(session).obtener(pedido_id)
        items = [{"articulo_id": i.articulo_id, "cantidad": i.cantidad} for i in pedido.items]

    try:
        respuesta = cliente_stock.reservar(pedido_id, items)
    except (CircuitoAbierto, FalloStock) as error:
        # En recuperación no se rechaza: la reserva pudo haberse hecho; se reintenta más tarde
        if recuperacion:
            return log("warning", "recuperación postergada: Stock no disponible", pedido_id=pedido_id)
        return _rechazar(pedido_id, "STOCK_NO_DISPONIBLE", str(error))

    if respuesta.status_code in (200, 201):
        try:
            _confirmar(pedido_id, respuesta.json())
        except Exception as error:
            log("error", "el pedido falló después de reservar; se compensa", pedido_id=pedido_id, error=str(error))
            if _compensar(pedido_id):
                _rechazar(pedido_id, "ERROR_INTERNO_COMPENSADO", "Error al confirmar el pedido; la reserva fue liberada")
            else:
                _rechazar(pedido_id, "COMPENSACION_PENDIENTE", "Error al confirmar el pedido; se reintentará liberar la reserva")
        return

    mensaje = respuesta.json().get("mensaje", "") if respuesta.content else ""
    if respuesta.status_code == 409:
        return _rechazar(pedido_id, "SIN_STOCK", mensaje)
    if respuesta.status_code == 404:
        return _rechazar(pedido_id, "ARTICULO_NO_ENCONTRADO", mensaje)
    return _rechazar(pedido_id, "RESERVA_RECHAZADA", f"Stock respondió {respuesta.status_code}: {mensaje}")


# Recuperación: pedidos sin resolver (por ejemplo, tras un reinicio) y compensaciones pendientes
def recuperar(antiguedad_segundos: float) -> None:
    with SessionLocal() as session:
        dao = PedidoDao(session)
        pendientes, compensaciones = dao.pendientes(antiguedad_segundos), dao.con_motivo("COMPENSACION_PENDIENTE")
    for pedido_id in pendientes:
        log("info", "recuperando pedido sin resolver", pedido_id=pedido_id)
        procesar_reserva(pedido_id, recuperacion=True)
    for pedido_id in compensaciones:
        if _compensar(pedido_id):
            with SessionLocal() as session, session.begin():
                pedido = PedidoDao(session).obtener(pedido_id)
                pedido.motivo = "ERROR_INTERNO_COMPENSADO"
                pedido.detalle = "Error al confirmar el pedido; la reserva fue liberada"


def iniciar_recuperacion() -> None:
    def ciclo():
        recuperar(antiguedad_segundos=0)
        while True:
            time.sleep(REINTENTO_SEGUNDOS)
            try:
                recuperar(antiguedad_segundos=120)
            except Exception as error:
                log("error", "falló el ciclo de recuperación", error=str(error))

    threading.Thread(target=ciclo, daemon=True, name="recuperacion").start()


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

        # Modo degradado: plazo blando -> EN_ESPERA
        futuro = _ejecutor.submit(contextvars.copy_context().run, procesar_reserva, pedido_id)
        try:
            futuro.result(timeout=RESERVA_TIMEOUT_SECONDS)
        except PlazoVencido:
            with SessionLocal() as session, session.begin():
                if PedidoDao(session).marcar_en_espera_si_pendiente(pedido_id):
                    log("warning", "pedido EN ESPERA: la reserva superó el plazo blando",
                        pedido_id=pedido_id, plazo_segundos=RESERVA_TIMEOUT_SECONDS)

        return PedidoOut.model_validate(self._leer(pedido_id))

    def consultar(self, pedido_id: str, identidad: Identidad) -> PedidoOut:
        pedido = self._leer(pedido_id)
        if pedido is None or (not identidad.es_admin and pedido.usuario_id != identidad.id):
            raise ErrorNegocio(404, "PEDIDO_NO_ENCONTRADO", f"No existe el pedido {pedido_id}")
        return PedidoOut.model_validate(pedido)

    def listar(self, identidad: Identidad) -> list[PedidoOut]:
        with SessionLocal() as session:
            pedidos = PedidoDao(session).listar(None if identidad.es_admin else identidad.id)
            return [PedidoOut.model_validate(p) for p in pedidos]