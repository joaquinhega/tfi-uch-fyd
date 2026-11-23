import { useRef } from "react";
import { useFocoAtrapado } from "./foco.js";

// Diálogo centrado (login y registro)
export default function Modal({ titulo, onCerrar, ancho = "max-w-md", children }) {
  const panel = useRef(null);
  useFocoAtrapado(panel, onCerrar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Cerrar" tabIndex={-1} onClick={onCerrar} className="cajon-fondo absolute inset-0 cursor-default bg-grafito/50" />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} className={`modal-panel relative flex max-h-[90vh] w-full ${ancho} flex-col overflow-hidden rounded-xl bg-superficie shadow-xl outline-none`}>
        <header className="flex items-center justify-between gap-4 px-6 pt-5">
          <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-md px-2 py-1 text-sm text-tenue hover:bg-fondo hover:text-tinta">Cerrar</button>
        </header>
        <div className="overflow-y-auto px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}
