from decimal import Decimal

from app.dao.articulo_dao import ArticuloDao
from app.db import SessionLocal
from app.logger import log
from app.models import Articulo

# Datos de prueba. ART-005 tiene stock 1 para la demo de concurrencia (D1).
ARTICULOS = [
    ("ART-001", "Auriculares inalámbricos", 50, "45000.00"),
    ("ART-002", "Teclado mecánico", 30, "85000.00"),
    ("ART-003", "Mouse óptico", 100, "15000.00"),
    ("ART-004", "Monitor 24 pulgadas", 15, "210000.00"),
    ("ART-005", "Parlante edición limitada", 1, "120000.00"),
]


def cargar_datos_de_prueba() -> None:
    with SessionLocal() as session, session.begin():
        dao = ArticuloDao(session)
        if dao.contar() > 0:
            return
        for codigo, nombre, stock, precio in ARTICULOS:
            dao.agregar(Articulo(codigo=codigo, nombre=nombre, stock=stock, precio=Decimal(precio)))
    log("info", "artículos de prueba cargados", cantidad=len(ARTICULOS))