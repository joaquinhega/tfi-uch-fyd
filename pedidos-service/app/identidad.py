from dataclasses import dataclass

from fastapi import Request

from app.errores import ErrorNegocio


@dataclass(frozen=True)
class Identidad:
    id: str
    rol: str
    email: str

    @property
    def es_admin(self) -> bool:
        return self.rol == "ADMIN"


# El Gateway valida el token y reenvía la identidad (TP3 §5).
# Este servicio confía en esos encabezados porque solo es accesible desde la red interna.
def exigir_identidad(request: Request) -> Identidad:
    usuario_id = request.headers.get("X-User-Id")
    if not usuario_id:
        raise ErrorNegocio(401, "NO_AUTENTICADO", "Falta la identidad del usuario: el pedido debe llegar por el Gateway")
    return Identidad(usuario_id, request.headers.get("X-User-Role", ""), request.headers.get("X-User-Email", ""))