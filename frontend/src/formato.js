import { LOCALE, MONEDA, STOCK_BAJO } from "./config.js";

const moneda = new Intl.NumberFormat(LOCALE, { style: "currency", currency: MONEDA, minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatoMoneda(valor) {
  return valor === null || valor === undefined ? "—" : moneda.format(Number(valor));
}

export function formatoHora(fecha = new Date()) {
  return fecha.toLocaleTimeString(LOCALE);
}

export function formatoFecha(iso) {
  return new Date(iso).toLocaleString(LOCALE);
}

export function formatoFechaCorta(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" });
}

const MOTIVOS = {
  SIN_STOCK: "No hay stock suficiente",
  ARTICULO_NO_ENCONTRADO: "Algún artículo ya no está disponible",
  STOCK_NO_DISPONIBLE: "El stock no está disponible en este momento",
  ERROR_INTERNO_COMPENSADO: "Hubo un error y la reserva de stock fue liberada",
  COMPENSACION_PENDIENTE: "Hubo un error y se está liberando la reserva de stock",
  RESERVA_RECHAZADA: "La reserva fue rechazada",
};

export function textoMotivo(motivo, detalle) {
  return MOTIVOS[motivo] ?? detalle ?? motivo ?? "";
}

// Disponibilidad que se le muestra al cliente
export function estadoStock(stock) {
  if (stock <= 0) return { tono: "agotado", texto: "Sin stock" };
  if (stock <= STOCK_BAJO) return { tono: "bajo", texto: stock === 1 ? "Queda 1 unidad" : `Quedan ${stock} unidades` };
  return { tono: "ok", texto: "Disponible" };
}

export function sinAcentos(texto = "") {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
