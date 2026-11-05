"""Prueba de concurrencia (escenario de calidad del TP1 §5.2).

50 clientes piden al mismo tiempo el ultimo parlante (stock = 1).
Resultado esperado: 1 aceptado, 49 rechazados, stock final 0 (sin sobreventa).
Despues prueba la compensacion: liberar devuelve el stock y liberar dos veces no lo duplica.

Se ejecuta DENTRO del contenedor de Stock (las reservas son internas):
  Get-Content scripts/demo/s2-concurrencia.py -Raw | docker compose exec -T stock-service python -
"""
import json
import threading
import urllib.error
import urllib.request
import uuid
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import select, update

from app.db import SessionLocal
from app.models import Articulo

BASE = "http://localhost:8000/v1"
CODIGO = "ART-005"
CLIENTES = 50


def post(ruta, cuerpo=None):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else b""
    pedido = urllib.request.Request(
        BASE + ruta, data=datos, method="POST", headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(pedido, timeout=60) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def stock_en_base():
    with SessionLocal() as s:
        return s.scalar(select(Articulo.stock).where(Articulo.codigo == CODIGO))


# Preparacion: el articulo queda con stock 1
with SessionLocal() as s, s.begin():
    s.execute(update(Articulo).where(Articulo.codigo == CODIGO).values(stock=1))
with SessionLocal() as s:
    articulo_id = s.scalar(select(Articulo.id).where(Articulo.codigo == CODIGO))

print(f"Escenario: {CLIENTES} pedidos simultaneos por {CODIGO} con stock inicial {stock_en_base()}")

barrera = threading.Barrier(CLIENTES)


def comprar(_):
    barrera.wait()  # todos salen al mismo tiempo
    return post("/reservas", {"id_pedido": str(uuid.uuid4()), "items": [{"articulo_id": articulo_id, "cantidad": 1}]})


with ThreadPoolExecutor(max_workers=CLIENTES) as ejecutor:
    resultados = list(ejecutor.map(comprar, range(CLIENTES)))

conteo = Counter(status for status, _ in resultados)
aceptados = [cuerpo for status, cuerpo in resultados if status == 201]
final = stock_en_base()

print(f"Aceptados (201):            {conteo.get(201, 0)}")
print(f"Rechazados sin stock (409): {conteo.get(409, 0)}")
otros = {k: v for k, v in conteo.items() if k not in (201, 409)}
if otros:
    print(f"Otras respuestas:           {otros}")
print(f"Stock final en la base:     {final}")
print("CONCURRENCIA:", "OK - sin sobreventa" if conteo.get(201, 0) == 1 and final == 0 else "FALLA")

if aceptados:
    id_pedido = aceptados[0]["id_pedido"]
    status1, _ = post(f"/reservas/{id_pedido}/liberar")
    stock1 = stock_en_base()
    status2, _ = post(f"/reservas/{id_pedido}/liberar")
    stock2 = stock_en_base()
    print(f"Liberar 1ra vez -> {status1}, stock {stock1}")
    print(f"Liberar 2da vez -> {status2}, stock {stock2}")
    print("COMPENSACION:", "OK - stock restituido una sola vez" if stock1 == 1 and stock2 == 1 else "FALLA")