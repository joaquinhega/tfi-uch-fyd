// Único punto de contacto con el backend: todo pasa por el API Gateway (TP3 §3)
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";

export class ErrorApi extends Error {
  constructor(status, codigo, mensaje, datos) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.datos = datos;
  }
}

function avisar(evento, detalle) {
  window.dispatchEvent(new CustomEvent(evento, { detail: detalle }));
}

export async function llamar(metodo, ruta, { cuerpo, token } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    // El Gateway no responde (TP3 §3: "servicio no disponible en este momento")
    avisar("servicio-no-disponible", "No se pudo conectar con el sistema.");
    throw new ErrorApi(0, "SIN_CONEXION", "No se pudo conectar con el sistema");
  }

  const datos = await respuesta.json().catch(() => null);

  if (respuesta.status === 503) {
    avisar("servicio-no-disponible", datos?.mensaje ?? datos?.detalle ?? "");
  }
  if (respuesta.status === 401 && token) {
    avisar("sesion-vencida");
  }
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, datos?.codigo ?? datos?.motivo ?? "ERROR", datos?.mensaje ?? datos?.detalle ?? `Error ${respuesta.status}`, datos);
  }
  return { status: respuesta.status, datos };
}