import httpx

from app.circuit_breaker import CircuitBreaker
from app.config import CB_FAIL_MAX, CB_RESET_TIMEOUT_SECONDS, STOCK_HTTP_TIMEOUT_SECONDS, STOCK_URL
from app.logger import correlation_id


class FalloStock(Exception):
    pass


_http = httpx.Client(base_url=STOCK_URL, timeout=STOCK_HTTP_TIMEOUT_SECONDS)
# Circuit Breaker Pedidos -> Stock
circuito_stock = CircuitBreaker("stock", CB_FAIL_MAX, CB_RESET_TIMEOUT_SECONDS)


def _post(ruta: str, cuerpo: dict | None = None) -> httpx.Response:
    try:
        respuesta = _http.post(ruta, json=cuerpo, headers={"X-Correlation-ID": correlation_id.get()})
    except httpx.RequestError as error:
        raise FalloStock(f"sin respuesta de Stock ({type(error).__name__})") from error
    if respuesta.status_code >= 500:
        raise FalloStock(f"Stock respondió {respuesta.status_code}")
    return respuesta


def reservar(id_pedido: str, items: list[dict]) -> httpx.Response:
    return circuito_stock.llamar(_post, "/v1/reservas", {"id_pedido": id_pedido, "items": items})


def liberar(id_pedido: str) -> httpx.Response:
    return circuito_stock.llamar(_post, f"/v1/reservas/{id_pedido}/liberar")