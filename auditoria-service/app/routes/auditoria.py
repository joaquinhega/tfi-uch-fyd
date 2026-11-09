from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.db import get_session
from app.errores import ErrorNegocio
from app.schemas import BloqueOut, EventoIn, VerificacionOut
from app.services.auditoria_service import AuditoriaService

router = APIRouter(prefix="/v1", tags=["Auditoría"])


def exigir_admin(request: Request) -> None:
    if request.headers.get("X-User-Role") != "ADMIN":
        raise ErrorNegocio(403, "ROL_INSUFICIENTE", "Operación reservada al rol ADMIN")


@router.post("/eventos", response_model=BloqueOut, status_code=201, summary="registrarEvento")
def registrar_evento(evento: EventoIn, session: Session = Depends(get_session)):
    return AuditoriaService(session).registrar(evento)


@router.get("/bloques", response_model=list[BloqueOut], summary="consultarBloques", dependencies=[Depends(exigir_admin)])
def consultar_bloques(limite: int = Query(50, ge=1, le=500), session: Session = Depends(get_session)):
    return AuditoriaService(session).listar(limite)


@router.get("/verificacion", response_model=VerificacionOut, summary="verificarCadena", dependencies=[Depends(exigir_admin)])
def verificar_cadena(session: Session = Depends(get_session)):
    return AuditoriaService(session).verificar()