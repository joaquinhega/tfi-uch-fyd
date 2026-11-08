from decimal import Decimal

from sqlalchemy import func, select

from app.dao.articulo_dao import ArticuloDao
from app.db import SessionLocal
from app.logger import log
from app.models import Articulo, Reserva, ReservaItem

# Datos de prueba. ART-005 tiene stock 1 para la demo de concurrencia (D1).
ARTICULOS = [
    ("ART-001", "Auriculares inalámbricos", 50, "45000.00"),
    ("ART-002", "Teclado mecánico", 30, "85000.00"),
    ("ART-003", "Mouse óptico", 100, "15000.00"),
    ("ART-004", "Monitor 24 pulgadas", 15, "210000.00"),
    ("ART-005", "Parlante edición limitada", 1, "120000.00"),
]

# Pedidos históricos para la IA: (artículos del pedido, cantidad de pedidos)
HISTORIAL = [
    ((2, 3), 12),     # teclado + mouse
    ((2, 3, 4), 5),   # teclado + mouse + monitor
    ((1, 5), 4),      # auriculares + parlante
    ((1, 3), 2),      # auriculares + mouse
    ((1,), 6),
    ((3,), 8),
    ((4,), 3),
]


def _cargar_articulos(session) -> None:
    dao = ArticuloDao(session)
    if dao.contar() > 0:
        return
    for codigo, nombre, stock, precio in ARTICULOS:
        dao.agregar(Articulo(codigo=codigo, nombre=nombre, stock=stock, precio=Decimal(precio)))
    session.flush()
    log("info", "artículos de prueba cargados", cantidad=len(ARTICULOS))


def _cargar_historial(session) -> None:
    ya_cargado = session.scalar(select(func.count()).select_from(Reserva).where(Reserva.id_pedido.like("hist-%")))
    if ya_cargado:
        return
    precios = {a.id: a.precio for a in ArticuloDao(session).listar()}
    numero = 0
    for articulos, veces in HISTORIAL:
        for _ in range(veces):
            numero += 1
            session.add(Reserva(
                id_pedido=f"hist-{numero:04d}",
                estado="RESERVADA",
                items=[ReservaItem(articulo_id=a, cantidad=1, precio_unitario=precios[a]) for a in articulos],
            ))
    log("info", "historial de pedidos de prueba cargado (IA)", pedidos=numero)


def cargar_datos_de_prueba() -> None:
    with SessionLocal() as session, session.begin():
        _cargar_articulos(session)
        _cargar_historial(session)