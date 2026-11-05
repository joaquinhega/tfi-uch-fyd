"""Mantiene bloqueada la fila del articulo 2 durante 8 segundos.

Simula otra compra larga en curso, para que un pedido nuevo supere el plazo blando de 2 s
y quede EN ESPERA (TP2 §6, TP3 §7.3). Se ejecuta dentro del contenedor de Stock:
  Get-Content scripts/demo/s3-bloquear-articulo.py -Raw | docker compose exec -T stock-service python -
"""
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