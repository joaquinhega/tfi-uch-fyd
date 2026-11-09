from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import ErrorOut, ReservaIn, ReservaOut
from app.services.reserva_service import ReservaService

# Rutas internas: solo Pedidos
router = APIRouter(prefix="/v1", tags=["Reservas (internas)"])


@router.post(
    "/reservas",
    response_model=ReservaOut,
    status_code=201,
    summary="reservarStock",
    responses={404: {"model": ErrorOut}, 409: {"model": ErrorOut}, 503: {"model": ErrorOut}},
)
def reservar_stock(datos: ReservaIn, response: Response, session: Session = Depends(get_session)):
    reserva, creada = ReservaService(session).reservar(datos)
    if not creada:
        response.status_code = 200
    return reserva


@router.post(
    "/reservas/{id_pedido}/liberar",
    response_model=ReservaOut,
    summary="liberarStock",
    responses={404: {"model": ErrorOut}, 503: {"model": ErrorOut}},
)
def liberar_stock(id_pedido: str, session: Session = Depends(get_session)):
    return ReservaService(session).liberar(id_pedido)