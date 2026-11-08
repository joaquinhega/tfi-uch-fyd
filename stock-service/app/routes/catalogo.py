from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import ArticuloOut, ArticuloUpdateIn, ErrorOut, RecomendacionOut
from app.seguridad import exigir_admin
from app.services.catalogo_service import CatalogoService

router = APIRouter(prefix="/v1", tags=["Catálogo"])


@router.get("/catalogo", response_model=list[ArticuloOut], summary="consultarCatalogo")
def consultar_catalogo(session: Session = Depends(get_session)):
    return CatalogoService(session).consultar_catalogo()


@router.get("/catalogo/{articulo_id}", response_model=ArticuloOut, summary="consultarArticulo",
            responses={404: {"model": ErrorOut}})
def consultar_articulo(articulo_id: int, session: Session = Depends(get_session)):
    return CatalogoService(session).consultar_articulo(articulo_id)


@router.get("/catalogo/{articulo_id}/recomendaciones", response_model=list[RecomendacionOut],
            summary="recomendarArticulos", responses={404: {"model": ErrorOut}})
def recomendar_articulos(articulo_id: int, session: Session = Depends(get_session)):
    """IA: artículos que suelen comprarse junto con el indicado (reglas de asociación)."""
    return CatalogoService(session).recomendar(articulo_id)


@router.put("/articulos/{articulo_id}", response_model=ArticuloOut, summary="actualizarStockYPrecio",
            dependencies=[Depends(exigir_admin)],
            responses={400: {"model": ErrorOut}, 403: {"model": ErrorOut}, 404: {"model": ErrorOut}})
def actualizar_stock_y_precio(articulo_id: int, datos: ArticuloUpdateIn, session: Session = Depends(get_session)):
    return CatalogoService(session).actualizar_stock_y_precio(articulo_id, datos)