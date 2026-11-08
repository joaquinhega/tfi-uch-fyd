from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EventoIn(BaseModel):
    tipo: str = Field(pattern=r"^[A-Z_]{3,40}$")
    servicio: str = Field(min_length=1, max_length=20)
    datos: dict[str, Any] = Field(default_factory=dict)


class BloqueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    indice: int
    ts: str
    tipo: str
    servicio: str
    datos: dict[str, Any]
    hash_anterior: str
    hash: str
    correlation_id: str


class VerificacionOut(BaseModel):
    valida: bool
    bloques_verificados: int
    primer_bloque_invalido: int | None
    motivo: str | None