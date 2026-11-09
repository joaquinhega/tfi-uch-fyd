import os

from sqlalchemy.engine import URL


def _requerida(nombre: str) -> str:
    valor = os.getenv(nombre)
    if not valor:
        raise RuntimeError(f"Falta la variable de entorno {nombre}")
    return valor


DATABASE_URL = URL.create(
    "postgresql+psycopg",
    username=_requerida("STOCK_DB_USER"),
    password=_requerida("STOCK_DB_PASSWORD"),
    host=os.getenv("STOCK_DB_HOST", "stock-db"),
    port=5432,
    database=_requerida("STOCK_DB_NAME"),
)

CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "30"))

LOCK_TIMEOUT_SECONDS = int(os.getenv("LOCK_TIMEOUT_SECONDS", "30"))

MODO_DEMO = os.getenv("MODO", "produccion") == "demo"
CATALOGO_INICIAL = os.getenv("CATALOGO_INICIAL", "datos/catalogo.json")
IA_MINIMO_PEDIDOS = int(os.getenv("IA_MINIMO_PEDIDOS", "20"))