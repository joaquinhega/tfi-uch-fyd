import { useRef } from "react";
import { useFocoAtrapado } from "./foco.js";

// Panel lateral (carrito, detalle de producto, guía)
export default function Cajon({ titulo, onCerrar, ancho = "max-w-md", pie, children }) {
  const panel = useRef(null);
  useFocoAtrapado(panel, onCerrar);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Cerrar" tabIndex={-1} onClick={onCerrar} className="cajon-fondo absolute inset-0 cursor-default bg-grafito/50" />
      <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} className={`cajon-panel relative flex h-full w-full ${ancho} flex-col bg-superficie shadow-xl outline-none`}>
        <header className="flex items-center justify-between gap-4 border-b border-linea px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-md px-2 py-1 text-sm text-tenue hover:bg-fondo hover:text-tinta">Cerrar</button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {pie && <footer className="border-t border-linea bg-superficie px-5 py-4">{pie}</footer>}
      </aside>
    </div>
  );
}
