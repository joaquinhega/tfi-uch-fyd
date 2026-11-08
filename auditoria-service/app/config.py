import os

from sqlalchemy.engine import URL


def _requerida(nombre: str) -> str:
    valor = os.getenv(nombre)
    if not valor:
        raise RuntimeError(f"Falta la variable de entorno {nombre}")
    return valor


DATABASE_URL = URL.create(
    "postgresql+psycopg",
    username=_requerida("AUDITORIA_DB_USER"),
    password=_requerida("AUDITORIA_DB_PASSWORD"),
    host=os.getenv("AUDITORIA_DB_HOST", "auditoria-db"),
    port=5432,
    database=_requerida("AUDITORIA_DB_NAME"),
)