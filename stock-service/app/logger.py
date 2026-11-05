import json
import sys
from datetime import datetime, timezone


# Logs en JSON a stdout: base del Log Aggregation (TP2 §4.1, TP3 §4.1)
def log(level: str, msg: str, **extra) -> None:
    registro = {"ts": datetime.now(timezone.utc).isoformat(), "level": level, "service": "stock", "msg": msg, **extra}
    print(json.dumps(registro, ensure_ascii=False, default=str), file=sys.stdout, flush=True)