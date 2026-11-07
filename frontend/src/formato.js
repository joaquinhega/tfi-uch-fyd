const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function formatoMoneda(valor) {
  return valor === null || valor === undefined ? "—" : moneda.format(Number(valor));
}

export function formatoFecha(iso) {
  return new Date(iso).toLocaleString("es-AR");
}

const MOTIVOS = {
  SIN_STOCK: "No hay stock suficiente",
  ARTICULO_NO_ENCONTRADO: "Algún artículo no existe",
  STOCK_NO_DISPONIBLE: "El servicio de stock no está disponible",
  ERROR_INTERNO_COMPENSADO: "Error interno; la reserva de stock fue liberada",
  RESERVA_RECHAZADA: "La reserva fue rechazada",
};

export function textoMotivo(motivo, detalle) {
  return MOTIVOS[motivo] ?? detalle ?? motivo ?? "";
}