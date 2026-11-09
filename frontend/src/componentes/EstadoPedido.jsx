const ESTADOS = {
  ACEPTADO: { texto: "Aceptado", estilo: "bg-ok-suave text-ok" },
  RECHAZADO: { texto: "Rechazado", estilo: "bg-error-suave text-error" },
  EN_ESPERA: { texto: "En espera", estilo: "bg-espera-suave text-espera" },
  PENDIENTE: { texto: "Pendiente", estilo: "bg-fondo text-tenue" },
};

export default function EstadoPedido({ estado }) {
  const { texto, estilo } = ESTADOS[estado] ?? ESTADOS.PENDIENTE;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${estilo}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {texto}
    </span>
  );
}