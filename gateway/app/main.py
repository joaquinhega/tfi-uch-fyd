import time
import uuid
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from app.circuit_breaker import CircuitBreaker, CircuitoAbierto
from app.config import CB_FAIL_MAX, CB_RESET_TIMEOUT_SECONDS, IP_BLOCKLIST, TIMEOUT_SERVICIOS_SECONDS
from app.contexto import correlation_id
from app.logger import log
from app.rutas import ADMIN, PUBLICA, SERVICIOS, buscar_regla, url_destino
from app.seguridad import validar_token


class FalloServicio(Exception):
    """El servicio no respondió (caída o timeout). Es lo único que cuenta como fallo para el Circuit Breaker."""


# Un Circuit Breaker por servicio: una caída de Stock no afecta a Autenticación ni a Pedidos
circuitos = {nombre: CircuitBreaker(nombre, CB_FAIL_MAX, CB_RESET_TIMEOUT_SECONDS) for nombre in SERVICIOS}
_http = httpx.AsyncClient(timeout=TIMEOUT_SERVICIOS_SECONDS)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    log("info", "gateway iniciado", ip_bloqueadas=sorted(IP_BLOCKLIST))
    yield
    await _http.aclose()


app = FastAPI(title="UCH-FyD API Gateway", version="1.0.0", lifespan=lifespan)


def error(status: int, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"codigo": codigo, "mensaje": mensaje})


@app.middleware("http")
async def correlacion_filtro_ip_y_registro(request: Request, call_next):
    # El ID lo genera siempre el Gateway: es el punto de entrada y no se confía en lo que mande el cliente
    cid = str(uuid.uuid4())
    token = correlation_id.set(cid)
    inicio = time.perf_counter()
    ip = request.client.host if request.client else "desconocida"
    try:
        if request.url.path != "/health" and ip in IP_BLOCKLIST:
            log("warning", "solicitud rechazada: IP bloqueada", ip=ip, ruta=request.url.path)
            respuesta = error(403, "IP_BLOQUEADA", "El acceso desde esta IP está bloqueado")
        else:
            respuesta = await call_next(request)
        respuesta.headers["X-Correlation-ID"] = cid
        if request.url.path != "/health":
            log("info", "solicitud", metodo=request.method, ruta=request.url.path, ip=ip,
                status=respuesta.status_code, ms=round((time.perf_counter() - inicio) * 1000, 1))
        return respuesta
    finally:
        correlation_id.reset(token)


@app.get("/health")
def health():
    return {"status": "ok", "service": "gateway", "circuitos": {n: c.estado for n, c in circuitos.items()}}


async def _enviar(metodo: str, url: str, cuerpo: bytes, headers: dict) -> httpx.Response:
    try:
        return await _http.request(metodo, url, content=cuerpo, headers=headers)
    except httpx.RequestError as e:
        raise FalloServicio(type(e).__name__) from e


@app.api_route("/api/{resto:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def punto_unico_de_entrada(resto: str, request: Request):
    path = f"/api/{resto}"
    regla = buscar_regla(request.method, path)
    if regla is None:
        return error(404, "RUTA_NO_ENCONTRADA", f"{request.method} {path}")

    identidad = None
    if regla.politica != PUBLICA:
        identidad, motivo = validar_token(request.headers.get("authorization"))
        if identidad is None:
            return error(401, "NO_AUTENTICADO", motivo)
        if regla.politica == ADMIN and identidad["rol"] != "ADMIN":
            return error(403, "ROL_INSUFICIENTE", "Operación reservada al rol ADMIN")

    # Solo se reenvía lo necesario; la identidad la fija el Gateway, nunca el cliente
    headers = {"X-Correlation-ID": correlation_id.get()}
    if "content-type" in request.headers:
        headers["content-type"] = request.headers["content-type"]
    if identidad:
        headers["X-User-Id"] = identidad["id"]
        headers["X-User-Role"] = identidad["rol"]
        headers["X-User-Email"] = identidad["email"]

    url = url_destino(path, regla)
    if request.url.query:
        url += f"?{request.url.query}"

    try:
        resp = await circuitos[regla.servicio].llamar(_enviar, request.method, url, await request.body(), headers)
    except CircuitoAbierto:
        return error(503, "SERVICIO_NO_DISPONIBLE", f"El servicio {regla.servicio} no está disponible (circuito abierto)")
    except FalloServicio as e:
        return error(503, "SERVICIO_NO_DISPONIBLE", f"El servicio {regla.servicio} no respondió ({e})")

    return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))