import { estadoStock } from "../formato.js";

const ESTILOS = {
  ok: "text-ok",
  bajo: "text-espera",
  agotado: "text-tenue",
};

export default function Disponibilidad({ stock, className = "" }) {
  const { tono, texto } = estadoStock(stock);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ESTILOS[tono]} ${className}`}>
      <span className="size-2 rounded-full bg-current" aria-hidden="true" />
      {texto}
    </span>
  );
}
