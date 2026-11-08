from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Bloque(Base):
    """Bloque de la cadena de auditoría: guarda el hash del bloque anterior."""

    __tablename__ = "bloques"

    indice: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    ts: Mapped[str] = mapped_column(String(40))  # texto ISO: se guarda tal cual entró al hash
    tipo: Mapped[str] = mapped_column(String(40))
    servicio: Mapped[str] = mapped_column(String(20))
    datos: Mapped[dict] = mapped_column(JSON)
    hash_anterior: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64), unique=True)
    correlation_id: Mapped[str] = mapped_column(String(36))