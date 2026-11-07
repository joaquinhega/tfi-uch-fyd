export function Boton({ variante = "primario", className = "", ...props }) {
  const estilos = {
    primario: "bg-slate-800 text-white hover:bg-slate-700",
    secundario: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100",
  };
  return (
    <button
      className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}

export function Campo({ etiqueta, ...props }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">{etiqueta}</span>
      <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400" {...props} />
    </label>
  );
}

export function Mensaje({ tipo = "error", children }) {
  if (!children) return null;
  const estilos = {
    error: "bg-red-50 text-red-800 border-red-200",
    ok: "bg-green-50 text-green-800 border-green-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };
  return <p className={`rounded border px-3 py-2 text-sm ${estilos[tipo]}`}>{children}</p>;
}