from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ArticuloOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nombre: str
    categoria: str
    descripcion: str
    imagen: str | None
    stock: int
    precio: Decimal
    activo: bool


class ArticuloIn(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    nombre: str = Field(min_length=1, max_length=120)
    categoria: str = Field(min_length=1, max_length=40)
    descripcion: str = Field(default="", max_length=400)
    imagen: str | None = Field(default=None, max_length=200)
    stock: int = Field(ge=0)
    precio: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class ArticuloUpdateIn(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=120)
    categoria: str | None = Field(default=None, min_length=1, max_length=40)
    descripcion: str | None = Field(default=None, max_length=400)
    imagen: str | None = Field(default=None, max_length=200)
    stock: int | None = Field(default=None, ge=0)
    precio: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    activo: bool | None = None

    @model_validator(mode="after")
    def al_menos_un_campo(self):
        campos = (self.nombre, self.categoria, self.descripcion, self.imagen, self.stock, self.precio, self.activo)
        if all(v is None for v in campos):
            raise ValueError("Indicar al menos un campo")
        return self


class RecomendacionOut(BaseModel):
    articulo_id: int
    nombre: str
    veces: int
    soporte: float
    confianza: float
    lift: float


class ItemReservaIn(BaseModel):
    articulo_id: int
    cantidad: int = Field(gt=0)


class ReservaIn(BaseModel):
    id_pedido: str = Field(min_length=1, max_length=36)
    items: list[ItemReservaIn] = Field(min_length=1)


class ItemReservaOut(BaseModel):
    articulo_id: int
    nombre: str
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