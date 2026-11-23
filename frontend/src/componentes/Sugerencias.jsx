import { useEffect, useState } from "react";
import { llamar } from "../api.js";
import { useCatalogo } from "../catalogo.jsx";
import { formatoMoneda } from "../formato.js";
import { Boton } from "./ui.jsx";
import ImagenProducto from "./ImagenProducto.jsx";

// IA: reglas de asociación calculadas por Stock con los pedidos anteriores
export default function Sugerencias({ articuloId, excluir = [], titulo, onAgregar }) {
  const { porId, tinte } = useCatalogo();
  const [lista, setLista] = useState(null);

  useEffect(() => {
    let vigente = true;
    setLista(null);
    llamar("GET", `/stock/catalogo/${articuloId}/recomendaciones`)
      .then(({ datos }) => vigente && setLista(datos))
      .catch(() => vigente && setLista([]));
    return () => { vigente = false; };
  }, [articuloId]);

  const visibles = (lista ?? []).filter((r) => porId[r.articulo_id]?.stock > 0 && !excluir.includes(r.articulo_id));
  if (visibles.length === 0) return null;

  return (
    <section aria-label={titulo} className="space-y-3">
      <div>
        <h3 className="font-semibold">{titulo}</h3>
        <p className="text-xs text-tenue">Sugerencias automáticas según lo que compraron otros clientes.</p>
      </div>
      <ul className="space-y-2">
        {visibles.map((r) => {
          const articulo = porId[r.articulo_id];
          return (
            <li key={r.articulo_id} className="flex items-center gap-3 rounded-lg border border-linea p-2.5">
              <ImagenProducto articulo={articulo} tinte={tinte(articulo.categoria)} className="size-14 shrink-0 rounded-md [&_img]:p-1.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{articulo.nombre}</p>
                <p className="text-xs text-tenue">{Math.round(r.confianza * 100)} % de los pedidos con este producto también lo llevan</p>
                <p className="precio text-sm font-semibold">{formatoMoneda(articulo.precio)}</p>
              </div>
              <Boton variante="secundario" className="px-3 py-1.5" onClick={() => onAgregar(articulo.id)}>Agregar</Boton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
