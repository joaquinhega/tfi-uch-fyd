from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ItemPedidoIn(BaseModel):
    articulo_id: int
    cantidad: int = Field(gt=0)


class PedidoIn(BaseModel):
    nombre_cliente: str = Field(min_length=1, max_length=120)
    items: list[ItemPedidoIn] = Field(min_length=1)


class ItemPedidoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    articulo_id: int
    cantidad: int
    precio_unitario: Decimal | None
    subtotal: Decimal | None


class PedidoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    numero: int
    fecha: datetime
    usuario_email: str
    nombre_cliente: str
    estado: str
    motivo: str | None
    detalle: str | None
    total: Decimal | None
    items: list[ItemPedidoOut]


class ErrorOut(BaseModel):
    codigo: str
    mensaje: str