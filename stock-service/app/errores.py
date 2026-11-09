from fastapi.openapi.utils import get_openapi


class ErrorNegocio(Exception):
    def __init__(self, status: int, codigo: str, mensaje: str):
        super().__init__(mensaje)
        self.status = status
        self.codigo = codigo
        self.mensaje = mensaje

ERROR_400 = {
    "description": "Datos inválidos",
    "content": {"application/json": {"schema": {
        "type": "object", "properties": {"codigo": {"type": "string"}, "mensaje": {"type": "string"}},
    }}},
}


# Contrato: los errores de validación se documentan como 400 (FastAPI los declara como 422)
def contrato_con_400(app):
    if app.openapi_schema:
        return app.openapi_schema
    esquema = get_openapi(title=app.title, version=app.version, description=app.description, routes=app.routes)
    for operaciones in esquema["paths"].values():
        for operacion in operaciones.values():
            if operacion["responses"].pop("422", None):
                operacion["responses"].setdefault("400", ERROR_400)
    for nombre in ("HTTPValidationError", "ValidationError"):
        esquema.get("components", {}).get("schemas", {}).pop(nombre, None)
    app.openapi_schema = esquema
    return esquema
