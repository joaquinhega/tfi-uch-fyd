import { createContext, useCallback, useContext, useState } from "react";
import Modal from "./componentes/Modal.jsx";
import { Boton } from "./componentes/ui.jsx";

const Contexto = createContext(null);

// Confirmación antes de una acción importante: await confirmar({ titulo, mensaje, accion }) devuelve true o false
export function ConfirmacionProvider({ children }) {
  const [pedido, setPedido] = useState(null);

  const confirmar = useCallback((opciones) => new Promise((resolver) => setPedido({ ...opciones, resolver })), []);

  function responder(valor) {
    pedido.resolver(valor);
    setPedido(null);
  }

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      {pedido && (
        <Modal titulo={pedido.titulo} onCerrar={() => responder(false)} ancho="max-w-sm">
          <div className="space-y-6">
            <div className="text-sm text-tenue">{pedido.mensaje}</div>
            <div className="flex justify-end gap-3">
              <Boton variante="secundario" onClick={() => responder(false)}>Cancelar</Boton>
              <Boton variante={pedido.peligro ? "peligro" : "primario"} onClick={() => responder(true)} autoFocus>
                {pedido.accion ?? "Confirmar"}
              </Boton>
            </div>
          </div>
        </Modal>
      )}
    </Contexto.Provider>
  );
}

export function useConfirmar() {
  return useContext(Contexto);
}
