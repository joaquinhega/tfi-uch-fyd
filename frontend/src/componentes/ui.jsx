import { useState } from "react";

export function Boton({ variante = "primario", className = "", ...props }) {
  const estilos = {
    primario: "bg-acento px-4 py-2.5 text-white hover:bg-acento/90",
    oscuro: "bg-grafito px-4 py-2.5 text-white hover:bg-grafito/90",
    secundario: "border border-linea bg-superficie px-4 py-2.5 text-tinta hover:bg-fondo",
    peligro: "bg-error px-4 py-2.5 text-white hover:bg-error/90",
    texto: "px-1 py-1 text-acento hover:underline",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}

export function Campo({ etiqueta, ayuda, ...props }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{etiqueta}</span>
      <input
        className="mt-1.5 w-full rounded-md border border-linea bg-superficie px-3 py-2.5 outline-none focus:border-acento focus:ring-2 focus:ring-acento/20"
        {...props}
      />
      {ayuda && <span className="mt-1 block text-xs text-tenue">{ayuda}</span>}
    </label>
  );
}

const TONOS = {
  error: "border-error bg-error-suave text-error",
  ok: "border-ok bg-ok-suave text-ok",
  espera: "border-espera bg-espera-suave text-espera",
  info: "border-grafito bg-fondo text-tinta",
};

export function Mensaje({ tipo = "error", children }) {
  if (!children) return null;
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`rounded-md border-l-4 px-4 py-3 text-sm ${TONOS[tipo]}`}>
      {children}
    </div>
  );
}

export function Seccion({ titulo, acciones, children }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
        {acciones && <div className="flex gap-2">{acciones}</div>}
      </div>
      {children}
    </section>
  );
}

export function Panel({ className = "", children }) {
  return <div className={`overflow-x-auto rounded-lg border border-linea bg-superficie ${className}`}>{children}</div>;
}

export function Codigo({ children }) {
  return <code className="rounded bg-fondo px-1.5 py-0.5 font-mono text-[0.8em] text-tinta">{children}</code>;
}

// Comando de terminal con botón para copiarlo
export function Comando({ texto }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Codigo>{texto}</Codigo>
      <Boton variante="texto" className="shrink-0 text-xs" onClick={copiar}>{copiado ? "Copiado" : "Copiar"}</Boton>
    </div>
  );
}

// Interruptor de encendido y apagado (modo presentación)
export function Interruptor({ activo, onCambiar, etiqueta, className = "", ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={onCambiar}
      {...props}
      className={`inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-fondo ${className}`}
    >
      <span aria-hidden="true" className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${activo ? "bg-acento" : "bg-linea"}`}>
        <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${activo ? "translate-x-4" : ""}`} />
      </span>
      <span>{etiqueta}</span>
    </button>
  );
}
