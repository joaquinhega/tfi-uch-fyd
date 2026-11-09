from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import Pedido


# DAO
class PedidoDao:
    def __init__(self, session: Session):
        self.session = session

    def agregar(self, pedido: Pedido) -> None:
        self.session.add(pedido)

    def obtener(self, pedido_id: str) -> Pedido | None:
        return self.session.get(Pedido, pedido_id)

    def listar(self, usuario_id: str | None = None) -> list[Pedido]:
        consulta = select(Pedido).order_by(Pedido.numero.desc())
        if usuario_id is not None:
            consulta = consulta.where(Pedido.usuario_id == usuario_id)
        return list(self.session.scalars(consulta))

    def marcar_en_espera_si_pendiente(self, pedido_id: str) -> bool:
        resultado = self.session.execute(
            update(Pedido).where(Pedido.id == pedido_id, Pedido.estado == "PENDIENTE").values(estado="EN_ESPERA")
        )
        return resultado.rowcount == 1

    def pendientes(self, antiguedad_segundos: float = 0) -> list[str]:
        limite = datetime.now(timezone.utc) - timedelta(seconds=antiguedad_segundos)
        consulta = select(Pedido.id).where(Pedido.estado.in_(("PENDIENTE", "EN_ESPERA")), Pedido.fecha <= limite)
        return list(self.session.scalars(consulta))

    def con_motivo(self, motivo: str) -> list[str]:
        return list(self.session.scalars(select(Pedido.id).where(Pedido.motivo == motivo)))