import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from app.rutas import ADMIN, PUBLICA, buscar_regla, path_interno
from app.seguridad import validar_token

app = FastAPI(title="UCH-FyD API Gateway", version="1.0.0")


def error(status: int, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"codigo": codigo, "mensaje": mensaje})


@app.get("/health")
def health():
    return {"status": "ok", "service": "gateway"}


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
    headers = {}
    if "content-type" in request.headers:
        headers["content-type"] = request.headers["content-type"]
    if identidad:
        headers["X-User-Id"] = identidad["id"]
        headers["X-User-Role"] = identidad["rol"]
        headers["X-User-Email"] = identidad["email"]

    url = regla.destino + path_interno(path)
    if request.url.query:
        url += f"?{request.url.query}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as cliente:
            resp = await cliente.request(request.method, url, content=await request.body(), headers=headers)
    except httpx.RequestError:
        # En el Sprint 4 esto pasa a estar controlado por el Circuit Breaker
        return error(503, "SERVICIO_NO_DISPONIBLE", "El servicio no está disponible en este momento")

    return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))