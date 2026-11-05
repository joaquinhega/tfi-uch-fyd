from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ArticuloOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nombre: str
    stock: int
    precio: Decimal


class ArticuloUpdateIn(BaseModel):
    stock: int | None = Field(default=None, ge=0)
    precio: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)

    @model_validator(mode="after")
    def al_menos_un_campo(self):
        if self.stock is None and self.precio is None:
            raise ValueError("Indicar stock, precio o ambos")
        return self


class ItemReservaIn(BaseModel):
    articulo_id: int
    cantidad: int = Field(gt=0)


class ReservaIn(BaseModel):
    id_pedido: str = Field(min_length=1, max_length=36)
    items: list[ItemReservaIn] = Field(min_length=1)


class ItemReservaOut(BaseModel):
    articulo_id: int
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal


class ReservaOut(BaseModel):
    id_pedido: str
    estado: str
    items: list[ItemReservaOut]
    total: Decimal


class ErrorOut(BaseModel):
    codigo: str
    mensaje: str