import hashlib
import json

HASH_GENESIS = "0" * 64


# Blockchain: SHA-256 del bloque + hash anterior
def calcular_hash(indice: int, ts: str, tipo: str, servicio: str, datos: dict, hash_anterior: str) -> str:
    contenido = {"indice": indice, "ts": ts, "tipo": tipo, "servicio": servicio, "datos": datos, "hash_anterior": hash_anterior}
    texto = json.dumps(contenido, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def _invalida(indice: int, motivo: str) -> dict:
    return {"valida": False, "bloques_verificados": indice, "primer_bloque_invalido": indice, "motivo": motivo}


def verificar_cadena(bloques: list) -> dict:
    anterior = None
    for b in bloques:
        if anterior is None:
            if b.indice != 0 or b.hash_anterior != HASH_GENESIS:
                return _invalida(b.indice, "El bloque génesis no es válido")
        else:
            if b.indice != anterior.indice + 1:
                return _invalida(anterior.indice + 1, f"Falta el bloque {anterior.indice + 1}")
            if b.hash_anterior != anterior.hash:
                return _invalida(b.indice, "El enlace con el bloque anterior no coincide")
        if calcular_hash(b.indice, b.ts, b.tipo, b.servicio, b.datos, b.hash_anterior) != b.hash:
            return _invalida(b.indice, "El contenido del bloque fue modificado: su hash ya no coincide")
        anterior = b
    return {"valida": True, "bloques_verificados": len(bloques), "primer_bloque_invalido": None, "motivo": None}