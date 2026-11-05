import os
import re
from dataclasses import dataclass

AUTH_URL = os.getenv("AUTH_URL", "http://auth-service:3000")
STOCK_URL = os.getenv("STOCK_URL", "http://stock-service:8000")
PEDIDOS_URL = os.getenv("PEDIDOS_URL", "http://pedidos-service:8000")

PUBLICA = "publica"
AUTENTICADO = "autenticado"
ADMIN = "admin"


@dataclass(frozen=True)
class Regla:
    metodo: str
    patron: re.Pattern
    destino: str
    politica: str
    prefijo_interno: str = "/v1"


UUID = r"[0-9a-fA-F-]{36}"

# Tabla de ruteo y políticas de acceso (WS-Policy aplicado en un punto central, TP3 §5).
# Cualquier ruta que no esté acá se rechaza con 404 (por ejemplo, reservar y liberar stock, que son internas).
REGLAS = [
    # auth-api
    Regla("POST", re.compile(r"^/api/v1/auth/registro$"), AUTH_URL, PUBLICA),
    Regla("POST", re.compile(r"^/api/v1/auth/login$"), AUTH_URL, PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/auth/openapi\.yaml$"), AUTH_URL, PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/auth/usuarios$"), AUTH_URL, ADMIN),
    Regla("PATCH", re.compile(r"^/api/v1/auth/usuarios/[^/]+/(activar|desactivar)$"), AUTH_URL, ADMIN),
    # stock-api
    Regla("GET", re.compile(r"^/api/v1/stock/catalogo$"), STOCK_URL, PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/stock/catalogo/\d+$"), STOCK_URL, PUBLICA),
    Regla("GET", re.compile(r"^/api/v1/stock/openapi\.json$"), STOCK_URL, PUBLICA),
    Regla("PUT", re.compile(r"^/api/v1/stock/articulos/\d+$"), STOCK_URL, ADMIN),
    # pedidos-api
    Regla("GET", re.compile(r"^/api/v1/pedidos/openapi\.json$"), PEDIDOS_URL, PUBLICA),
    Regla("POST", re.compile(r"^/api/v1/pedidos$"), PEDIDOS_URL, AUTENTICADO, "/v1/pedidos"),
    Regla("GET", re.compile(r"^/api/v1/pedidos$"), PEDIDOS_URL, AUTENTICADO, "/v1/pedidos"),
    Regla("GET", re.compile(rf"^/api/v1/pedidos/{UUID}$"), PEDIDOS_URL, AUTENTICADO, "/v1/pedidos"),
]


def buscar_regla(metodo: str, path: str) -> Regla | None:
    for regla in REGLAS:
        if regla.metodo == metodo and regla.patron.match(path):
            return regla
    return None


def path_interno(path: str, regla: Regla) -> str:
    """Traduce la ruta pública a la ruta dentro del servicio.

    /api/v1/auth/login       -> /v1/login
    /api/v1/stock/catalogo   -> /v1/catalogo
    /api/v1/pedidos/<id>     -> /v1/pedidos/<id>
    """
    return regla.prefijo_interno + re.sub(r"^/api/v1/[^/]+", "", path)