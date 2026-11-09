from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Articulo


# DAO
class ArticuloDao:
    def __init__(self, session: Session):
        self.session = session

    def listar(self, solo_activos: bool = False) -> list[Articulo]:
        consulta = select(Articulo).order_by(Articulo.id)
        if solo_activos:
            consulta = consulta.where(Articulo.activo)
        return list(self.session.scalars(consulta))

    def existe_codigo(self, codigo: str) -> bool:
        return self.session.scalar(select(func.count()).select_from(Articulo).where(Articulo.codigo == codigo)) > 0

    def obtener(self, articulo_id: int) -> Articulo | None:
        return self.session.get(Articulo, articulo_id)

    # Bloqueo pesimista (FOR UPDATE), ordenado por id
    def bloquear(self, ids: list[int]) -> list[Articulo]:
        consulta = select(Articulo).where(Articulo.id.in_(ids)).order_by(Articulo.id).with_for_update()
        return list(self.session.scalars(consulta))

    def contar(self) -> int:
        return self.session.scalar(select(func.count()).select_from(Articulo))

    def agregar(self, articulo: Articulo) -> None:
        self.session.add(articulo)