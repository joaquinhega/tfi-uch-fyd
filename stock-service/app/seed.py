import json
from decimal import Decimal

from sqlalchemy import func, select

from app.config import CATALOGO_INICIAL, MODO_DEMO
from app.dao.articulo_dao import ArticuloDao
from app.db import SessionLocal
from app.logger import log
from app.models import Articulo, Reserva, ReservaItem


def _cargar_articulos(session, articulos: list[dict]) -> None:
    dao = ArticuloDao(session)
    if dao.contar() > 0:
        return
    for a in articulos:
        dao.agregar(Articulo(codigo=a["codigo"], nombre=a["nombre"], stock=a["stock"], precio=Decimal(a["precio"])))
    session.flush()
    log("info", "catálogo inicial cargado", cantidad=len(articulos))


# Historial para la IA: solo en modo demo
def _cargar_historial(session, historial: list[dict]) -> None:
    if session.scalar(select(func.count()).select_from(Reserva).where(Reserva.id_pedido.like("hist-%"))):
        return
    por_codigo = {a.codigo: a for a in ArticuloDao(session).listar()}
    numero = 0
    for grupo in historial:
        articulos = [por_codigo[c] for c in grupo["articulos"]]
        for _ in range(grupo["pedidos"]):
            numero += 1
            session.add(Reserva(
                id_pedido=f"hist-{numero:04d}",
                estado="RESERVADA",
                items=[ReservaItem(articulo_id=a.id, cantidad=1, precio_unitario=a.precio) for a in articulos],
            ))
    log("info", "historial de demo cargado", pedidos=numero)


def cargar_datos_iniciales() -> None:
    with open(CATALOGO_INICIAL, encoding="utf-8") as archivo:
        datos = json.load(archivo)
    with SessionLocal() as session, session.begin():
        _cargar_articulos(session, datos.get("articulos", []))
        if MODO_DEMO:
            _cargar_historial(session, datos.get("historial_demo", []))
