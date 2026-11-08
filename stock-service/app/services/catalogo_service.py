from sqlalchemy.orm import Session

from app.cache import CacheCatalogo
from app.config import CACHE_TTL_SECONDS
from app.dao.articulo_dao import ArticuloDao
from app.dao.reserva_dao import ReservaDao
from app.errores import ErrorNegocio
from app.ia import reglas_de_asociacion
from app.logger import log
from app.schemas import ArticuloOut, ArticuloUpdateIn, RecomendacionOut

cache_catalogo = CacheCatalogo(CACHE_TTL_SECONDS)


class CatalogoService:
    def __init__(self, session: Session):
        self.session = session
        self.dao = ArticuloDao(session)

    def consultar_catalogo(self) -> list[ArticuloOut]:
        datos = cache_catalogo.obtener()
        if datos is not None:
            log("info", "catálogo servido desde caché", cache="HIT")
            return datos
        datos = [ArticuloOut.model_validate(a) for a in self.dao.listar()]
        cache_catalogo.guardar(datos)
        log("info", "catálogo leído de la base", cache="MISS", articulos=len(datos))
        return datos

    def consultar_articulo(self, articulo_id: int) -> ArticuloOut:
        for articulo in self.consultar_catalogo():
            if articulo.id == articulo_id:
                return articulo
        raise ErrorNegocio(404, "ARTICULO_NO_ENCONTRADO", f"No existe el artículo {articulo_id}")

    def recomendar(self, articulo_id: int) -> list[RecomendacionOut]:
        """IA (ADR-17): artículos que suelen comprarse junto con el indicado."""
        self.consultar_articulo(articulo_id)  # 404 si no existe
        nombres = {a.id: a.nombre for a in self.consultar_catalogo()}
        reglas = reglas_de_asociacion(ReservaDao(self.session).canastas(), articulo_id)
        log("info", "recomendaciones calculadas", articulo_id=articulo_id, cantidad=len(reglas))
        return [RecomendacionOut(nombre=nombres.get(r["articulo_id"], f"Artículo {r['articulo_id']}"), **r) for r in reglas]

    def actualizar_stock_y_precio(self, articulo_id: int, datos: ArticuloUpdateIn) -> ArticuloOut:
        """RF-04 (solo admin). Bloquea la fila para no pisar una reserva en curso y luego invalida la caché."""
        with self.session.begin():
            bloqueados = self.dao.bloquear([articulo_id])
            if not bloqueados:
                raise ErrorNegocio(404, "ARTICULO_NO_ENCONTRADO", f"No existe el artículo {articulo_id}")
            articulo = bloqueados[0]
            if datos.stock is not None:
                articulo.stock = datos.stock
            if datos.precio is not None:
                articulo.precio = datos.precio

        cache_catalogo.invalidar()
        log("info", "artículo actualizado por admin; caché invalidada",
            articulo_id=articulo_id, stock=articulo.stock, precio=articulo.precio)
        return ArticuloOut.model_validate(articulo)