import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app import models  # noqa: F401
from app.db import Base, SessionLocal, engine
from app.errores import ErrorNegocio
from app.logger import correlation_id, log
from app.routes import auditoria
from app.services.auditoria_service import AuditoriaService


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        AuditoriaService(session).crear_genesis_si_falta()
    log("info", "servicio iniciado")
    yield


app = FastAPI(title="auditoria-api", version="1.0.0", lifespan=lifespan,
              openapi_url="/v1/openapi.json", docs_url=None, redoc_url=None)


@app.middleware("http")
async def correlacion_y_registro(request: Request, call_next):
    token = correlation_id.set(request.headers.get("X-Correlation-ID") or str(uuid.uuid4()))
    inicio = time.perf_counter()
    try:
        respuesta = await call_next(request)
        if request.url.path != "/health":
            log("info", "solicitud atendida", metodo=request.method, ruta=request.url.path,
                status=respuesta.status_code, ms=round((time.perf_counter() - inicio) * 1000, 1))
        return respuesta
    finally:
        correlation_id.reset(token)


@app.exception_handler(ErrorNegocio)
async def manejar_error_negocio(_request: Request, exc: ErrorNegocio):
    return JSONResponse(status_code=exc.status, content={"codigo": exc.codigo, "mensaje": exc.mensaje})


@app.exception_handler(RequestValidationError)
async def manejar_validacion(_request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"codigo": "DATOS_INVALIDOS", "mensaje": str(exc.errors())})


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok", "service": "auditoria"}


app.include_router(auditoria.router)