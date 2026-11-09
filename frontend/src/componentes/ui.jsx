export function Boton({ variante = "primario", className = "", ...props }) {
  const estilos = {
    primario: "bg-acento px-4 py-2 text-white hover:bg-acento/90",
    secundario: "border border-linea bg-superficie px-4 py-2 text-tinta hover:bg-fondo",
    texto: "px-1 py-1 text-acento hover:underline",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}

export function Campo({ etiqueta, ...props }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{etiqueta}</span>
      <input
        className="mt-1.5 w-full rounded-md border border-linea bg-superficie px-3 py-2 outline-none focus:border-acento focus:ring-2 focus:ring-acento/20"
        {...props}
      />
    </label>
  );
}

const TONOS = {
  error: "border-error bg-error-suave text-error",
  ok: "border-ok bg-ok-suave text-ok",
  espera: "border-espera bg-espera-suave text-espera",
  info: "border-acento bg-acento-suave text-acento",
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
