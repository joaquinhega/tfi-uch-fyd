import os
import re
from dataclasses import dataclass

AUTH_URL = os.getenv("AUTH_URL", "http://auth-service:3000")

PUBLICA = "publica"
AUTENTICADO = "autenticado"
ADMIN = "admin"


@dataclass(frozen=True)
class Regla:
    metodo: str
    patron: re.Pattern
    destino: str
    politica: str


# Tabla de ruteo y políticas de acceso (WS-Policy aplicado en un punto central, TP3 §5).
# Cualquier ruta que no esté acá se rechaza con 404.
REGLAS = [
    Regla("POST", re.compile(r"^/api/v1/auth/registro$"), AUTH_URL, PUBLICA),
    Regla("POST", re.compile(r"^/api/v1/auth/login$"), AUTH_URL, PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/auth/openapi\.yaml$"), AUTH_URL, PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/auth/usuarios$"), AUTH_URL, ADMIN),
    Regla("PATCH", re.compile(r"^/api/v1/auth/usuarios/[^/]+/(activar|desactivar)$"), AUTH_URL, ADMIN),
]


def buscar_regla(metodo: str, path: str) -> Regla | None:
    for regla in REGLAS:
        if regla.metodo == metodo and regla.patron.match(path):
            return regla
    return None


def path_interno(path: str) -> str:
    """/api/v1/auth/login -> /v1/login (ruta dentro del servicio)."""
    return re.sub(r"^/api/v1/[^/]+", "/v1", path)