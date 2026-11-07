const ESTILOS = {
  ACEPTADO: "bg-green-100 text-green-800",
  RECHAZADO: "bg-red-100 text-red-800",
  EN_ESPERA: "bg-amber-100 text-amber-800",
  PENDIENTE: "bg-slate-100 text-slate-700",
};

export default function EstadoPedido({ estado }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${ESTILOS[estado] ?? ESTILOS.PENDIENTE}`}>
      {estado.replace("_", " ")}
    </span>
  );
}