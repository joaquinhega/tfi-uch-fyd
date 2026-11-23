import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { llamar } from "./api.js";
import { useCarrito } from "./carrito.jsx";

const Contexto = createContext(null);
const TINTES = 6;

// Catálogo compartido por la tienda, el carrito y los pedidos
export function CatalogoProvider({ children }) {
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const { quitarInexistentes } = useCarrito();

  const recargar = useCallback(async () => {
    try {
      const { datos } = await llamar("GET", "/stock/catalogo");
      setArticulos(datos);
      setError("");
    } catch (e) {
      if (e.status !== 0) setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  useEffect(() => {
    if (articulos.length > 0) quitarInexistentes(new Set(articulos.map((a) => a.id)));
  }, [articulos, quitarInexistentes]);

  const valor = useMemo(() => {
    const porId = Object.fromEntries(articulos.map((a) => [a.id, a]));
    // Un tinte distinto por categoría, según el orden alfabético
    const categorias = [...new Set(articulos.map((a) => a.categoria))].sort((a, b) => a.localeCompare(b));
    const tinte = (categoria) => `var(--color-tinte-${(categorias.indexOf(categoria) % TINTES) + 1})`;
    return { articulos, porId, categorias, tinte, cargando, error, recargar };
  }, [articulos, cargando, error, recargar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCatalogo() {
  return useContext(Contexto);
}
