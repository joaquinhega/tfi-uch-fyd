// Logs en JSON a stdout: base del Log Aggregation (TP2 §4.1, TP3 §4.1)
export function log(level, msg, extra = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, service: "auth", msg, ...extra }));
}