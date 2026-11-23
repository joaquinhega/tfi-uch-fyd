export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
export const NEGOCIO = import.meta.env.VITE_NEGOCIO || "Nodo";
export const LEMA = import.meta.env.VITE_LEMA || "";
export const MONEDA = import.meta.env.VITE_MONEDA || "ARS";
export const LOCALE = import.meta.env.VITE_LOCALE || "es-AR";
// Desde cuántas unidades se avisa que el stock es bajo
export const STOCK_BAJO = Number(import.meta.env.VITE_STOCK_BAJO) || 5;
// Las imágenes de producto se sirven desde esta carpeta (o son una URL completa)
export const IMAGENES_BASE = import.meta.env.VITE_IMAGENES_BASE || "/productos/";

// Usuarios de prueba: solo en modo demo, tomados del .env
export const USUARIOS_DEMO = [
  { email: import.meta.env.VITE_DEMO_ADMIN, rol: "Administrador" },
  { email: import.meta.env.VITE_DEMO_CLIENTE, rol: "Cliente" },
  { email: import.meta.env.VITE_DEMO_INACTIVO, rol: "Cuenta sin activar" },
].filter((u) => u.email);
