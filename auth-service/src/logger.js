import { correlationId } from "./contexto.js";

// Logs en JSON a stdout con ID de correlación: base del Log Aggregation (TP2 §4.1, TP3 §4.1)
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