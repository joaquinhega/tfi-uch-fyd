from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registra las tablas antes de crearlas)
from app.cliente_stock import circuito_stock
from app.db import Base, engine
from app.errores import ErrorNegocio
from app.logger import log
from app.routes import pedidos


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    log("info", "servicio iniciado")
    yield


app = FastAPI(
    title="pedidos-api",
    version="1.0.0",
    description="Contrato del Servicio de Pedidos de UCH-FyD. Se consume a través del API Gateway.",
    lifespan=lifespan,
    openapi_url="/v1/openapi.json",
    docs_url=None,
    redoc_url=None,
)


@app.exception_handler(ErrorNegocio)
async def manejar_error_negocio(_request: Request, exc: ErrorNegocio):
    return JSONResponse(status_code=exc.status, content={"codigo": exc.codigo, "mensaje": exc.mensaje})


@app.exception_handler(RequestValidationError)
async def manejar_validacion(_request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"codigo": "DATOS_INVALIDOS", "mensaje": str(exc.errors())})


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok", "service": "pedidos", "circuito_stock": circuito_stock.estado}


app.include_router(pedidos.router)