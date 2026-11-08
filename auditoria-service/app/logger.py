import json
import sys
from datetime import datetime, timezone

from app.contexto import correlation_id


def log(level: str, msg: str, **extra) -> None:
    registro = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "service": "auditoria",
        "correlation_id": correlation_id.get(),
        "msg": msg,
        **extra,
    }
    print(json.dumps(registro, ensure_ascii=False, default=str), file=sys.stdout, flush=True)