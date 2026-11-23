import { useEffect, useState } from "react";

function leer() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  return hash.startsWith("/") ? hash : `/${hash}`;
}

// Rutas por hash: sirven sin configurar el servidor y sobreviven a recargar
export function useRuta() {
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const alCambiar = () => setRuta(leer());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  return ruta;
}

export function ir(ruta) {
  window.location.hash = ruta;
}
