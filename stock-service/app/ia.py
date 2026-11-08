from collections import Counter


def reglas_de_asociacion(canastas: list[set[int]], articulo_id: int, minimo_confianza: float = 0.1, maximo: int = 3) -> list[dict]:
    """IA local (ADR-17): reglas "quien lleva A también lleva B" sobre los pedidos históricos.

    soporte   = pedidos con A y B / total de pedidos
    confianza = pedidos con A y B / pedidos con A
    lift      = confianza / probabilidad de B   (> 1: B aparece con A más de lo esperable por azar)
    """
    total = len(canastas)
    con_a = [c for c in canastas if articulo_id in c]
    if total == 0 or not con_a:
        return []

    frecuencia = Counter(art for canasta in canastas for art in canasta)
    juntos = Counter(art for canasta in con_a for art in canasta if art != articulo_id)

    reglas = []
    for otro, veces in juntos.items():
        confianza = veces / len(con_a)
        lift = confianza / (frecuencia[otro] / total)
        if confianza >= minimo_confianza and lift > 1:
            reglas.append({
                "articulo_id": otro,
                "veces": veces,
                "soporte": round(veces / total, 3),
                "confianza": round(confianza, 3),
                "lift": round(lift, 2),
            })
    return sorted(reglas, key=lambda r: (r["confianza"], r["lift"]), reverse=True)[:maximo]