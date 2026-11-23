import { STOCK_BAJO } from "../config.js";
import { formatoMoneda } from "../formato.js";
import { Boton } from "./ui.jsx";
import Cantidad from "./Cantidad.jsx";
import Disponibilidad from "./Disponibilidad.jsx";
import ImagenProducto from "./ImagenProducto.jsx";

export default function ProductoCard({ articulo, tinte, cantidad, onAbrir, onFijar }) {
  const agotado = articulo.stock <= 0;
  const ultimas = !agotado && articulo.stock <= STOCK_BAJO;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-linea bg-superficie transition-shadow hover:shadow-md">
      <button onClick={() => onAbrir(articulo.id)} aria-label={`Ver ${articulo.nombre}`} className="relative block text-left">
        <ImagenProducto articulo={articulo} tinte={tinte} className="aspect-[4/3]" />
        {(ultimas || agotado) && (
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${agotado ? "bg-grafito text-white" : "bg-espera-suave text-espera"}`}>
            {agotado ? "Agotado" : "Últimas unidades"}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs text-tenue">{articulo.categoria}</p>
        <h3 className="font-semibold leading-snug">
          <button onClick={() => onAbrir(articulo.id)} className="text-left hover:underline">{articulo.nombre}</button>
        </h3>
        <p className="line-clamp-2 text-sm text-tenue">{articulo.descripcion}</p>

        <div className="mt-auto space-y-3 pt-3">
          <div>
            <p className="precio text-xl font-bold">{formatoMoneda(articulo.precio)}</p>
            <Disponibilidad stock={articulo.stock} />
          </div>
          {cantidad > 0
            ? <Cantidad valor={cantidad} max={articulo.stock} etiqueta={articulo.nombre} onCambiar={(n) => onFijar(articulo.id, n)} />
            : <Boton className="w-full" disabled={agotado} onClick={() => onFijar(articulo.id, 1)}>{agotado ? "Sin stock" : "Agregar al carrito"}</Boton>}
        </div>
      </div>
    </article>
  );
}
