from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import Pedido


# Patrón DAO (TP2 §4.1)
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
        """Solo pasa a EN_ESPERA si la reserva todavía no terminó (evita pisar un resultado final)."""
        resultado = self.session.execute(
            update(Pedido).where(Pedido.id == pedido_id, Pedido.estado == "PENDIENTE").values(estado="EN_ESPERA")
        )
        return resultado.rowcount == 1