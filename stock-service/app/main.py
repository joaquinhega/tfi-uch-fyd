from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registra las tablas antes de crearlas)
from app.db import Base, engine
from app.errores import ErrorNegocio
from app.logger import log
from app.routes import catalogo, reservas
from app.seed import cargar_datos_de_prueba


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    cargar_datos_de_prueba()
    log("info", "servicio iniciado")
    yield


app = FastAPI(
    title="stock-api",
    version="1.0.0",
    description="Contrato del Servicio de Stock/Catálogo de UCH-FyD. Se consume a través del API Gateway.",
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
    return {"status": "ok", "service": "stock"}


app.include_router(catalogo.router)
app.include_router(reservas.router)