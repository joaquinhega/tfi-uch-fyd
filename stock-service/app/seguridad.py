from fastapi import Request

from app.errores import ErrorNegocio


# El Gateway valida el token y reenvía la identidad (TP3 §5).
# Este servicio confía en el encabezado porque solo es accesible desde la red interna.
def exigir_admin(request: Request) -> None:
    if request.headers.get("X-User-Role") != "ADMIN":
        raise ErrorNegocio(403, "ROL_INSUFICIENTE", "Operación reservada al rol ADMIN")