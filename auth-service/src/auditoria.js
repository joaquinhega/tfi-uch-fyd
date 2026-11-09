import { correlationId, log } from "./logger.js";

const URL_AUDITORIA = process.env.AUDITORIA_URL ?? "http://auditoria-service:8000";

// Blockchain: si Auditoría falla, la operación sigue
export async function registrarEvento(tipo, datos) {
  try {
    const respuesta = await fetch(`${URL_AUDITORIA}/v1/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Correlation-ID": correlationId() },
      body: JSON.stringify({ tipo, servicio: "auth", datos }),
      signal: AbortSignal.timeout(3000),
    });
    if (!respuesta.ok) throw new Error(`Auditoría respondió ${respuesta.status}`);
  } catch (error) {
    log("warning", "no se pudo registrar el evento en auditoría", { tipo, error: error.message });
  }
}