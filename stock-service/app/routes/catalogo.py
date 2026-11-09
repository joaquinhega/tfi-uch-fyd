from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import ArticuloIn, ArticuloOut, ArticuloUpdateIn, ErrorOut, RecomendacionOut
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
    return CatalogoService(session).recomendar(articulo_id)


@router.get("/articulos", response_model=list[ArticuloOut], summary="listarArticulos",
            dependencies=[Depends(exigir_admin)], responses={403: {"model": ErrorOut}})
def listar_articulos(session: Session = Depends(get_session)):
    return CatalogoService(session).listar_todos()


@router.post("/articulos", response_model=ArticuloOut, status_code=201, summary="crearArticulo",
             dependencies=[Depends(exigir_admin)],
             responses={400: {"model": ErrorOut}, 403: {"model": ErrorOut}, 409: {"model": ErrorOut}})
def crear_articulo(datos: ArticuloIn, session: Session = Depends(get_session)):
    return CatalogoService(session).crear(datos)


@router.put("/articulos/{articulo_id}", response_model=ArticuloOut, summary="actualizarArticulo",
            description="Modifica nombre, stock o precio. activo=false es la baja lógica; activo=true la reactiva.",
            dependencies=[Depends(exigir_admin)],
            responses={400: {"model": ErrorOut}, 403: {"model": ErrorOut}, 404: {"model": ErrorOut}})
def actualizar_articulo(articulo_id: int, datos: ArticuloUpdateIn, session: Session = Depends(get_session)):
    return CatalogoService(session).actualizar(articulo_id, datos)