from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models import Bloque


class BloqueDao:
    def __init__(self, session: Session):
        self.session = session

    def bloquear_cadena(self) -> None:
        """Candado de transacción: dos eventos simultáneos se encadenan de a uno."""
        self.session.execute(text("SELECT pg_advisory_xact_lock(16)"))

    def ultimo(self) -> Bloque | None:
        return self.session.scalars(select(Bloque).order_by(Bloque.indice.desc()).limit(1)).first()

    def agregar(self, bloque: Bloque) -> None:
        self.session.add(bloque)

    def listar(self, limite: int) -> list[Bloque]:
        return list(self.session.scalars(select(Bloque).order_by(Bloque.indice.desc()).limit(limite)))

    def todos(self) -> list[Bloque]:
        return list(self.session.scalars(select(Bloque).order_by(Bloque.indice)))