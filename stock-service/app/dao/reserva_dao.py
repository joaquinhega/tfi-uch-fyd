from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Reserva, ReservaItem


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

    def canastas(self) -> list[set[int]]:
        """Artículos de cada reserva vigente: la materia prima de las recomendaciones."""
        filas = self.session.execute(
            select(ReservaItem.id_pedido, ReservaItem.articulo_id).join(Reserva).where(Reserva.estado == "RESERVADA")
        )
        canastas: dict[str, set[int]] = defaultdict(set)
        for id_pedido, articulo_id in filas:
            canastas[id_pedido].add(articulo_id)
        return list(canastas.values())