from decimal import Decimal

from psycopg.errors import LockNotAvailable
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

from app.config import LOCK_TIMEOUT_SECONDS
from app.dao.articulo_dao import ArticuloDao
from app.dao.reserva_dao import ReservaDao
from app.errores import ErrorNegocio
from app.logger import log
from app.models import Reserva, ReservaItem
from app.schemas import ItemReservaOut, ReservaIn, ReservaOut


def a_salida(reserva: Reserva) -> ReservaOut:
    items = [
        ItemReservaOut(
            articulo_id=i.articulo_id,
            cantidad=i.cantidad,
            precio_unitario=i.precio_unitario,
            subtotal=i.precio_unitario * i.cantidad,
        )
        for i in reserva.items
    ]
    total = sum((i.subtotal for i in items), Decimal("0"))
    return ReservaOut(id_pedido=reserva.id_pedido, estado=reserva.estado, items=items, total=total)


class ReservaService:
    def __init__(self, session: Session):
        self.session = session
        self.articulos = ArticuloDao(session)
        self.reservas = ReservaDao(session)

    def _limitar_espera(self) -> None:
        self.session.execute(text(f"SET LOCAL lock_timeout = '{LOCK_TIMEOUT_SECONDS}s'"))

    # reservarStock: transacción ACID
    def reservar(self, datos: ReservaIn) -> tuple[ReservaOut, bool]:
        cantidades: dict[int, int] = {}
        for item in datos.items:
            cantidades[item.articulo_id] = cantidades.get(item.articulo_id, 0) + item.cantidad

        try:
            with self.session.begin():
                self._limitar_espera()

                # Idempotencia
                existente = self.reservas.obtener(datos.id_pedido)
                if existente:
                    return a_salida(existente), False

                articulos = {a.id: a for a in self.articulos.bloquear(sorted(cantidades))}

                faltantes = [i for i in cantidades if i not in articulos]
                if faltantes:
                    raise ErrorNegocio(404, "ARTICULO_NO_ENCONTRADO", f"No existen los artículos {faltantes}")

                insuficientes = [i for i, cant in cantidades.items() if articulos[i].stock < cant]
                if insuficientes:
                    raise ErrorNegocio(409, "STOCK_INSUFICIENTE", f"Stock insuficiente para los artículos {insuficientes}")

                reserva = Reserva(id_pedido=datos.id_pedido, estado="RESERVADA")
                for articulo_id, cantidad in cantidades.items():
                    articulo = articulos[articulo_id]
                    articulo.stock -= cantidad
                    reserva.items.append(
                        ReservaItem(articulo_id=articulo_id, cantidad=cantidad, precio_unitario=articulo.precio)
                    )
                self.reservas.agregar(reserva)
        except IntegrityError:
            self.session.rollback()
            existente = self.reservas.obtener(datos.id_pedido)
            if existente:
                return a_salida(existente), False
            raise
        except OperationalError as error:
            if isinstance(error.orig, LockNotAvailable):
                raise ErrorNegocio(503, "RESERVA_DEMORADA", "El stock está bloqueado por otra operación; reintente") from error
            raise

        log("info", "stock reservado", id_pedido=datos.id_pedido, items=cantidades)
        return a_salida(reserva), True

    # liberarStock: compensación
    def liberar(self, id_pedido: str) -> ReservaOut:
        with self.session.begin():
            self._limitar_espera()
            reserva = self.reservas.obtener(id_pedido, bloquear=True)
            if reserva is None:
                raise ErrorNegocio(404, "RESERVA_NO_ENCONTRADA", f"No existe una reserva para el pedido {id_pedido}")
            if reserva.estado == "LIBERADA":
                return a_salida(reserva)

            cantidades = {i.articulo_id: i.cantidad for i in reserva.items}
            for articulo in self.articulos.bloquear(sorted(cantidades)):
                articulo.stock += cantidades[articulo.id]
            reserva.estado = "LIBERADA"

        log("info", "stock liberado (compensación)", id_pedido=id_pedido, items=cantidades)
        return a_salida(reserva)