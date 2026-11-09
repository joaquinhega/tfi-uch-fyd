import json
import sys
from contextvars import ContextVar
from datetime import datetime, timezone

correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")


# Log Aggregation: JSON + ID de correlación
def log(level: str, msg: str, **extra) -> None:
    registro = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "service": "gateway",
        "correlation_id": correlation_id.get(),
        "msg": msg,
        **extra,
    }
    print(json.dumps(registro, ensure_ascii=False, default=str), file=sys.stdout, flush=True)