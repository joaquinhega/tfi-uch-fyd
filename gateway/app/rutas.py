import os
import re
from dataclasses import dataclass

# Find-Bind-Execute sin registry (TP3 §2.2, ADR-08): el Gateway conoce cada servicio por configuración
SERVICIOS = {
    "auth": os.getenv("AUTH_URL", "http://auth-service:3000"),
    "stock": os.getenv("STOCK_URL", "http://stock-service:8000"),
    "pedidos": os.getenv("PEDIDOS_URL", "http://pedidos-service:8000"),
    "auditoria": os.getenv("AUDITORIA_URL", "http://auditoria-service:8000"),
}

PUBLICA = "publica"
AUTENTICADO = "autenticado"
ADMIN = "admin"


@dataclass(frozen=True)
class Regla:
    metodo: str
    patron: re.Pattern
    servicio: str
    politica: str
    prefijo_interno: str = "/v1"


UUID = r"[0-9a-fA-F-]{36}"

# Tabla de ruteo y políticas de acceso (TP3 §5). Lo que no está acá responde 404 (rutas internas).
REGLAS = [
    # auth-api
    Regla("POST", re.compile(r"^/api/v1/auth/registro$"), "auth", PUBLICA),
    Regla("POST", re.compile(r"^/api/v1/auth/login$"), "auth", PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/auth/openapi\.yaml$"), "auth", PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/auth/usuarios$"), "auth", ADMIN),
    Regla("PATCH", re.compile(r"^/api/v1/auth/usuarios/[^/]+/(activar|desactivar)$"), "auth", ADMIN),
    # stock-api
    Regla("GET", re.compile(r"^/api/v1/stock/catalogo$"), "stock", PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/stock/catalogo/\d+$"), "stock", PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/stock/openapi\.json$"), "stock", PUBLICA),
    Regla("PUT", re.compile(r"^/api/v1/stock/articulos/\d+$"), "stock", ADMIN),
    # pedidos-api
    Regla("GET", re.compile(r"^/api/v1/pedidos/openapi\.json$"), "pedidos", PUBLICA),
    Regla("POST", re.compile(r"^/api/v1/pedidos$"), "pedidos", AUTENTICADO, "/v1/pedidos"),
    Regla("GET", re.compile(r"^/api/v1/pedidos$"), "pedidos", AUTENTICADO, "/v1/pedidos"),
    Regla("GET", re.compile(rf"^/api/v1/pedidos/{UUID}$"), "pedidos", AUTENTICADO, "/v1/pedidos"),
    # auditoria-api: solo lectura y verificación, solo ADMIN
    Regla("GET", re.compile(r"^/api/v1/auditoria/bloques$"), "auditoria", ADMIN),
    Regla("GET", re.compile(r"^/api/v1/auditoria/verificacion$"), "auditoria", ADMIN),
]


def buscar_regla(metodo: str, path: str) -> Regla | None:
    for regla in REGLAS:
        if regla.metodo == metodo and regla.patron.match(path):
            return regla
    return None


def url_destino(path: str, regla: Regla) -> str:
    """/api/v1/auth/login -> http://auth-service:3000/v1/login"""
    return SERVICIOS[regla.servicio] + regla.prefijo_interno + re.sub(r"^/api/v1/[^/]+", "", path)