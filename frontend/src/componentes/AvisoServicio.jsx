import { useEffect, useState } from "react";

// Aviso de "servicio no disponible" (TP3 §3 y vista lógica): aparece ante un 503 o si el Gateway no responde
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
    <div role="alert" className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      Servicio no disponible en este momento. {mensaje}
    </div>
  );
}