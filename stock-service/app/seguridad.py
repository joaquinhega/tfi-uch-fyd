from fastapi import Request

from app.errores import ErrorNegocio


def exigir_admin(request: Request) -> None:
    if request.headers.get("X-User-Role") != "ADMIN":
        raise ErrorNegocio(403, "ROL_INSUFICIENTE", "Operación reservada al rol ADMIN")