from sqlalchemy.orm import Session

from app.cache import CacheCatalogo
from app.config import CACHE_TTL_SECONDS, IA_MINIMO_PEDIDOS
from app.dao.articulo_dao import ArticuloDao
from app.dao.reserva_dao import ReservaDao
from app.errores import ErrorNegocio
from app.ia import reglas_de_asociacion
from app.logger import log
from app.models import Articulo
from app.schemas import ArticuloIn, ArticuloOut, ArticuloUpdateIn, RecomendacionOut

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
        datos = [ArticuloOut.model_validate(a) for a in self.dao.listar(solo_activos=True)]
        cache_catalogo.guardar(datos)
        log("info", "catálogo leído de la base", cache="MISS", articulos=len(datos))
        return datos

    def consultar_articulo(self, articulo_id: int) -> ArticuloOut:
        for articulo in self.consultar_catalogo():
            if articulo.id == articulo_id:
                return articulo
        raise ErrorNegocio(404, "ARTICULO_NO_ENCONTRADO", f"No existe el artículo {articulo_id}")

    def recomendar(self, articulo_id: int) -> list[RecomendacionOut]:
        self.consultar_articulo(articulo_id)
        nombres = {a.id: a.nombre for a in self.consultar_catalogo()}
        canastas = ReservaDao(self.session).canastas()
        # IA: sin suficientes pedidos no se sugiere nada
        if len(canastas) < IA_MINIMO_PEDIDOS:
            return []
        reglas = reglas_de_asociacion(canastas, articulo_id)
        log("info", "recomendaciones calculadas", articulo_id=articulo_id, cantidad=len(reglas))
        return [RecomendacionOut(nombre=nombres[r["articulo_id"]], **r) for r in reglas if r["articulo_id"] in nombres]

    # ABM de artículos (admin)
    def listar_todos(self) -> list[ArticuloOut]:
        return [ArticuloOut.model_validate(a) for a in self.dao.listar()]

    def crear(self, datos: ArticuloIn) -> ArticuloOut:
        codigo = datos.codigo.strip().upper()
        with self.session.begin():
            if self.dao.existe_codigo(codigo):
                raise ErrorNegocio(409, "CODIGO_EXISTENTE", f"Ya existe un artículo con código {codigo}")
            articulo = Articulo(codigo=codigo, nombre=datos.nombre.strip(), stock=datos.stock, precio=datos.precio)
            self.dao.agregar(articulo)
        cache_catalogo.invalidar()
        log("info", "artículo creado", codigo=codigo)
        return ArticuloOut.model_validate(articulo)

    def actualizar(self, articulo_id: int, datos: ArticuloUpdateIn) -> ArticuloOut:
        with self.session.begin():
            bloqueados = self.dao.bloquear([articulo_id])
            if not bloqueados:
                raise ErrorNegocio(404, "ARTICULO_NO_ENCONTRADO", f"No existe el artículo {articulo_id}")
            articulo = bloqueados[0]
            for campo, valor in datos.model_dump(exclude_none=True).items():
                setattr(articulo, campo, valor.strip() if isinstance(valor, str) else valor)

        # Invalidación de caché
        cache_catalogo.invalidar()
        log("info", "artículo actualizado; caché invalidada", articulo_id=articulo_id, **datos.model_dump(exclude_none=True))
        return ArticuloOut.model_validate(articulo)