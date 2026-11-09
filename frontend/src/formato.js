import { LOCALE, MONEDA } from "./config.js";

const moneda = new Intl.NumberFormat(LOCALE, { style: "currency", currency: MONEDA });

export function formatoMoneda(valor) {
  return valor === null || valor === undefined ? "—" : moneda.format(Number(valor));
}

export function formatoHora(fecha = new Date()) {
  return fecha.toLocaleTimeString(LOCALE);
}

export function formatoFecha(iso) {
  return new Date(iso).toLocaleString(LOCALE);
}

const MOTIVOS = {
  SIN_STOCK: "No hay stock suficiente",
  ARTICULO_NO_ENCONTRADO: "Algún artículo no existe",
  STOCK_NO_DISPONIBLE: "El servicio de stock no está disponible",
  ERROR_INTERNO_COMPENSADO: "Error interno; la reserva de stock fue liberada",
  COMPENSACION_PENDIENTE: "Error interno; se está liberando la reserva de stock",
  RESERVA_RECHAZADA: "La reserva fue rechazada",
};

export function textoMotivo(motivo, detalle) {
  return MOTIVOS[motivo] ?? detalle ?? motivo ?? "";
}