import httpx

from app.config import AUDITORIA_URL
from app.logger import correlation_id, log

_http = httpx.Client(base_url=AUDITORIA_URL, timeout=httpx.Timeout(3.0, connect=2.0))


# Blockchain: si Auditoría falla, el pedido sigue
def registrar_evento(tipo: str, datos: dict) -> None:
    try:
        respuesta = _http.post(
            "/v1/eventos",
            json={"tipo": tipo, "servicio": "pedidos", "datos": datos},
            headers={"X-Correlation-ID": correlation_id.get()},
        )
        respuesta.raise_for_status()
    except httpx.HTTPError as error:
        log("warning", "no se pudo registrar el evento en auditoría", tipo=tipo, error=str(error))