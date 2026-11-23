import { API_URL } from "../../config.js";

// Llamada directa al Gateway para las pruebas: no cierra la sesión ante un 401 ni muestra avisos
export async function probar(metodo, ruta, { token, cuerpo } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const inicio = performance.now();
  try {
    const r = await fetch(API_URL + ruta, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
    const datos = await r.json().catch(() => null);
    return { status: r.status, datos, correlacion: r.headers.get("X-Correlation-ID"), ms: Math.round(performance.now() - inicio) };
  } catch {
    return { status: 0, datos: null, correlacion: null, ms: Math.round(performance.now() - inicio) };
  }
}

function base64url(texto) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(texto))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodificar(parte) {
  const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))));
}

// Token sin firma que se atribuye el rol ADMIN (el Gateway debe rechazarlo)
export function tokenFalsificado(token) {
  const datos = token ? decodificar(token.split(".")[1]) : { sub: "intruso", email: "intruso@ejemplo.com", iss: "uch-fyd-auth" };
  const payload = { ...datos, rol: "ADMIN", exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${base64url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${base64url(JSON.stringify(payload))}.`;
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
