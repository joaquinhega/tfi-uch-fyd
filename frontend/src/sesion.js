// El token se guarda en sessionStorage: se borra al cerrar la pestaña.
// Su contenido se lee solo para mostrar nombre y rol; la validación real la hace el Gateway.
const CLAVE = "uchfyd_token";

function leerPayload(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function guardarToken(token) {
  sessionStorage.setItem(CLAVE, token);
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE);
}

export function leerSesion() {
  const token = sessionStorage.getItem(CLAVE);
  if (!token) return null;
  try {
    const p = leerPayload(token);
    if (p.exp * 1000 < Date.now()) {
      cerrarSesion();
      return null;
    }
    return { token, id: p.sub, email: p.email, nombre: p.nombre, rol: p.rol };
  } catch {
    cerrarSesion();
    return null;
  }
}