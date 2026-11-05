from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Articulo


# Patrón DAO (TP2 §4.1): la lógica de negocio no conoce SQL ni PostgreSQL.
class ArticuloDao:
    def __init__(self, session: Session):
        self.session = session

    def listar(self) -> list[Articulo]:
        return list(self.session.scalars(select(Articulo).order_by(Articulo.id)))

    def obtener(self, articulo_id: int) -> Articulo | None:
        return self.session.get(Articulo, articulo_id)

    def bloquear(self, ids: list[int]) -> list[Articulo]:
        """SELECT ... FOR UPDATE: bloqueo pesimista de las filas (TP1 ADR-02).

        Se bloquea siempre en orden de id para que dos reservas con varios artículos
        no se esperen mutuamente para siempre (deadlock).
        """
        consulta = select(Articulo).where(Articulo.id.in_(ids)).order_by(Articulo.id).with_for_update()
        return list(self.session.scalars(consulta))

    def contar(self) -> int:
        return self.session.scalar(select(func.count()).select_from(Articulo))

    def agregar(self, articulo: Articulo) -> None:
        self.session.add(articulo)