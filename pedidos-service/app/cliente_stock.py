import httpx

from app.circuit_breaker import CircuitBreaker
from app.config import CB_FAIL_MAX, CB_RESET_TIMEOUT_SECONDS, STOCK_HTTP_TIMEOUT_SECONDS, STOCK_URL
from app.contexto import correlation_id


class FalloStock(Exception):
    """Stock no respondió o respondió con error del servidor (cuenta como fallo para el Circuit Breaker)."""


_http = httpx.Client(base_url=STOCK_URL, timeout=STOCK_HTTP_TIMEOUT_SECONDS)
circuito_stock = CircuitBreaker("stock", CB_FAIL_MAX, CB_RESET_TIMEOUT_SECONDS)


def _post(ruta: str, cuerpo: dict | None = None) -> httpx.Response:
    try:
        # El ID de correlación se reenvía a Stock: el mismo pedido se sigue en los logs de ambos servicios
        respuesta = _http.post(ruta, json=cuerpo, headers={"X-Correlation-ID": correlation_id.get()})
    except httpx.RequestError as error:
        raise FalloStock(f"sin respuesta de Stock ({type(error).__name__})") from error
    if respuesta.status_code >= 500:
        raise FalloStock(f"Stock respondió {respuesta.status_code}")
    return respuesta  # 2xx y 4xx son respuestas válidas del contrato (por ejemplo, 409 sin stock)


# Operaciones del contrato stock-api que consume Pedidos (TP3 §2.2), siempre a través del Circuit Breaker
def reservar(id_pedido: str, items: list[dict]) -> httpx.Response:
    return circuito_stock.llamar(_post, "/v1/reservas", {"id_pedido": id_pedido, "items": items})


def liberar(id_pedido: str) -> httpx.Response:
    return circuito_stock.llamar(_post, f"/v1/reservas/{id_pedido}/liberar")