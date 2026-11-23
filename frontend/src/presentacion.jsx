import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CLAVE = "modo-presentacion";
const Contexto = createContext(null);

function leer() {
  try {
    return localStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

// Modo presentación: muestra vistas, pruebas, guía y datos técnicos. Apagado, queda solo la tienda
export function PresentacionProvider({ children }) {
  const [activo, setActivo] = useState(leer);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, activo ? "1" : "0");
    } catch {
    }
  }, [activo]);

  const alternar = useCallback(() => setActivo((v) => !v), []);
  const valor = useMemo(() => ({ activo, alternar }), [activo, alternar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePresentacion() {
  return useContext(Contexto);
}
