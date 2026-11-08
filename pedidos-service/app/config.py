import os

from sqlalchemy.engine import URL


def _requerida(nombre: str) -> str:
    valor = os.getenv(nombre)
    if not valor:
        raise RuntimeError(f"Falta la variable de entorno {nombre}")
    return valor


DATABASE_URL = URL.create(
    "postgresql+psycopg",
    username=_requerida("PEDIDOS_DB_USER"),
    password=_requerida("PEDIDOS_DB_PASSWORD"),
    host=os.getenv("PEDIDOS_DB_HOST", "pedidos-db"),
    port=5432,
    database=_requerida("PEDIDOS_DB_NAME"),
)

STOCK_URL = os.getenv("STOCK_URL", "http://stock-service:8000")
AUDITORIA_URL = os.getenv("AUDITORIA_URL", "http://auditoria-service:8000")
# Mayor que el lock_timeout de Stock (30 s): una reserva en espera no se corta antes de tiempo
STOCK_HTTP_TIMEOUT_SECONDS = float(os.getenv("STOCK_HTTP_TIMEOUT_SECONDS", "35"))

# Plazo blando de la operación crítica (TP2 §6): pasado este tiempo, el pedido queda EN ESPERA
RESERVA_TIMEOUT_SECONDS = float(os.getenv("RESERVA_TIMEOUT_SECONDS", "2"))

# Circuit Breaker Pedidos -> Stock (TP3 §3)
CB_FAIL_MAX = int(os.getenv("CB_FAIL_MAX", "3"))
CB_RESET_TIMEOUT_SECONDS = float(os.getenv("CB_RESET_TIMEOUT_SECONDS", "15"))

# Inyección de fallos: simula un error DESPUÉS de reservar para demostrar la compensación
FAULT_AFTER_RESERVE = os.getenv("FAULT_AFTER_RESERVE", "false").lower() == "true"