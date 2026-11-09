from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Articulo(Base):
    __tablename__ = "articulos"
    # Restricción stock >= 0
    __table_args__ = (CheckConstraint("stock >= 0", name="ck_stock_no_negativo"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True)
    nombre: Mapped[str] = mapped_column(String(120))
    stock: Mapped[int] = mapped_column(Integer)
    precio: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Reserva(Base):
    __tablename__ = "reservas"

    id_pedido: Mapped[str] = mapped_column(String(36), primary_key=True)
    estado: Mapped[str] = mapped_column(String(10))
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizada_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    items: Mapped[list["ReservaItem"]] = relationship(
        back_populates="reserva", cascade="all, delete-orphan", lazy="selectin"
    )


class ReservaItem(Base):
    __tablename__ = "reserva_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_pedido: Mapped[str] = mapped_column(ForeignKey("reservas.id_pedido"))
    articulo_id: Mapped[int] = mapped_column(ForeignKey("articulos.id"))
    cantidad: Mapped[int] = mapped_column(Integer)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    reserva: Mapped[Reserva] = relationship(back_populates="items")