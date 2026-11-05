from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Reserva


class ReservaDao:
    def __init__(self, session: Session):
        self.session = session

    def obtener(self, id_pedido: str, bloquear: bool = False) -> Reserva | None:
        consulta = select(Reserva).where(Reserva.id_pedido == id_pedido)
        if bloquear:
            consulta = consulta.with_for_update()
        return self.session.scalars(consulta).first()

    def agregar(self, reserva: Reserva) -> None:
        self.session.add(reserva)