from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Identity, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    numero: Mapped[int] = mapped_column(Integer, Identity(), unique=True)  # número visible del pedido (TP1 §1.1)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    usuario_id: Mapped[str] = mapped_column(String(64), index=True)
    usuario_email: Mapped[str] = mapped_column(String(120))
    nombre_cliente: Mapped[str] = mapped_column(String(120))  # puede no ser el usuario (TP1 supuesto 4)
    estado: Mapped[str] = mapped_column(String(12))  # PENDIENTE | EN_ESPERA | ACEPTADO | RECHAZADO
    motivo: Mapped[str | None] = mapped_column(String(40), nullable=True)
    detalle: Mapped[str | None] = mapped_column(String(300), nullable=True)
    total: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    items: Mapped[list["PedidoItem"]] = relationship(
        back_populates="pedido", cascade="all, delete-orphan", lazy="selectin", order_by="PedidoItem.id"
    )


class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pedido_id: Mapped[str] = mapped_column(ForeignKey("pedidos.id"))
    articulo_id: Mapped[int] = mapped_column(Integer)  # referencia lógica: el artículo vive en la base de Stock
    cantidad: Mapped[int] = mapped_column(Integer)
    precio_unitario: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)  # congelado (RF-05)
    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    pedido: Mapped[Pedido] = relationship(back_populates="items")