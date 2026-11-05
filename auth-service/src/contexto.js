import { AsyncLocalStorage } from "node:async_hooks";

// Guarda el ID de correlación del pedido en curso para que aparezca en todos los logs
export const contexto = new AsyncLocalStorage();

export function correlationId() {
  return contexto.getStore()?.correlationId ?? "-";
}