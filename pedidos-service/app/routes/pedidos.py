from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.identidad import Identidad, exigir_identidad
from app.schemas import ErrorOut, PedidoIn, PedidoOut
from app.services.pedido_service import PedidoService, codigo_http

router = APIRouter(prefix="/v1/pedidos", tags=["Pedidos"])


@router.post(
    "",
    response_model=PedidoOut,
    status_code=201,
    summary="crearPedido",
    responses={
        202: {"model": PedidoOut, "description": "EN_ESPERA: la reserva superó el plazo blando de 2 s; consultar luego"},
        400: {"model": ErrorOut},
        401: {"model": ErrorOut},
        409: {"model": PedidoOut, "description": "RECHAZADO: sin stock o artículo inexistente"},
        500: {"model": PedidoOut, "description": "RECHAZADO: falló después de reservar; la reserva fue liberada"},
        503: {"model": PedidoOut, "description": "RECHAZADO: Stock no disponible (Circuit Breaker)"},
    },
)
def crear_pedido(datos: PedidoIn, identidad: Identidad = Depends(exigir_identidad)):
    pedido = PedidoService().crear(datos, identidad)
    return JSONResponse(status_code=codigo_http(pedido), content=pedido.model_dump(mode="json"))


@router.get("", response_model=list[PedidoOut], summary="listarPedidos")
def listar_pedidos(identidad: Identidad = Depends(exigir_identidad)):
    return PedidoService().listar(identidad)


@router.get("/{pedido_id}", response_model=PedidoOut, summary="consultarPedido", responses={404: {"model": ErrorOut}})
def consultar_pedido(pedido_id: str, identidad: Identidad = Depends(exigir_identidad)):
    return PedidoService().consultar(pedido_id, identidad)