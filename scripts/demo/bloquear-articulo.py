import time

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Articulo

ARTICULO_ID = 2
SEGUNDOS = 8

with SessionLocal() as session, session.begin():
    session.execute(select(Articulo).where(Articulo.id == ARTICULO_ID).with_for_update())
    print(f"Fila del articulo {ARTICULO_ID} bloqueada durante {SEGUNDOS} s. Manda el pedido ahora.", flush=True)
    time.sleep(SEGUNDOS)
print("Bloqueo liberado", flush=True)