import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CLAVE = "carrito";
const Contexto = createContext(null);

function leer() {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE));
    return guardado && typeof guardado === "object" ? guardado : {};
  } catch {
    return {};
  }
}

// Carrito del cliente: { idArticulo: cantidad }. Por pestaña, como la sesión
export function CarritoProvider({ children }) {
  const [lineas, setLineas] = useState(leer);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(lineas));
    } catch {
    }
  }, [lineas]);

  const fijar = useCallback((id, cantidad) => {
    setLineas((previo) => {
      const siguiente = { ...previo };
      if (cantidad > 0) siguiente[id] = cantidad;
      else delete siguiente[id];
      return siguiente;
    });
  }, []);

  const quitarInexistentes = useCallback((idsValidos) => {
    setLineas((previo) => {
      const siguiente = Object.fromEntries(Object.entries(previo).filter(([id]) => idsValidos.has(Number(id))));
      return Object.keys(siguiente).length === Object.keys(previo).length ? previo : siguiente;
    });
  }, []);

  const vaciar = useCallback(() => setLineas({}), []);

  const valor = useMemo(() => ({
    lineas,
    fijar,
    vaciar,
    quitarInexistentes,
    unidades: Object.values(lineas).reduce((suma, cantidad) => suma + cantidad, 0),
  }), [lineas, fijar, vaciar, quitarInexistentes]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito() {
  return useContext(Contexto);
}
