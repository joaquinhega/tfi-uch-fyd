import { useEffect, useState } from "react";

export default function AvisoServicio() {
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    let temporizador;
    const mostrar = (evento) => {
      setMensaje(evento.detail || "");
      clearTimeout(temporizador);
      temporizador = setTimeout(() => setMensaje(null), 8000);
    };
    window.addEventListener("servicio-no-disponible", mostrar);
    return () => {
      window.removeEventListener("servicio-no-disponible", mostrar);
      clearTimeout(temporizador);
    };
  }, []);

  if (mensaje === null) return null;
  return (
    <div role="alert" className="sticky top-0 z-20 border-b border-espera/30 bg-espera-suave px-4 py-2.5 text-center text-sm text-espera">
      <strong className="font-semibold">Servicio no disponible en este momento.</strong> {mensaje}
    </div>
  );
}
