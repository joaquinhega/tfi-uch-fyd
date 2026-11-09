import { AsyncLocalStorage } from "node:async_hooks";

export const contexto = new AsyncLocalStorage();

export function correlationId() {
  return contexto.getStore()?.correlationId ?? "-";
}

// Log Aggregation: JSON + ID de correlación
export function log(level, msg, extra = {}) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: "auth",
    correlation_id: correlationId(),
    msg,
    ...extra,
  }));
}
