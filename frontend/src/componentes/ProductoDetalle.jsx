import { useCarrito } from "../carrito.jsx";
import { useCatalogo } from "../catalogo.jsx";
import { useCuenta } from "../cuenta.jsx";
import { formatoMoneda } from "../formato.js";
import { Boton } from "./ui.jsx";
import Cajon from "./Cajon.jsx";
import Cantidad from "./Cantidad.jsx";
import Disponibilidad from "./Disponibilidad.jsx";
import ImagenProducto from "./ImagenProducto.jsx";
import Sugerencias from "./Sugerencias.jsx";

export default function ProductoDetalle({ articuloId, onCerrar }) {
  const { porId, tinte } = useCatalogo();
  const { lineas, fijar: fijarCarrito } = useCarrito();
  const { comprar } = useCuenta();
  const articulo = porId[articuloId];
  if (!articulo) return null;

  const fijar = (id, n) => comprar(() => fijarCarrito(id, n));

  const cantidad = lineas[articulo.id] ?? 0;
  const agotado = articulo.stock <= 0;

  const pie = (
    <div className="flex items-center justify-between gap-4">
      <p className="precio text-2xl font-bold">{formatoMoneda(articulo.precio)}</p>
      {cantidad > 0
        ? <Cantidad valor={cantidad} max={articulo.stock} etiqueta={articulo.nombre} onCambiar={(n) => fijar(articulo.id, n)} />
        : <Boton disabled={agotado} onClick={() => fijar(articulo.id, 1)}>{agotado ? "Sin stock" : "Agregar al carrito"}</Boton>}
    </div>
  );

  return (
    <Cajon titulo={articulo.nombre} onCerrar={onCerrar} ancho="max-w-xl" pie={pie}>
      <div className="space-y-5">
        <ImagenProducto articulo={articulo} tinte={tinte(articulo.categoria)} className="aspect-[4/3] rounded-lg" />
        <div className="space-y-2">
          <p className="text-sm text-tenue">{articulo.categoria}</p>
          <p className="leading-relaxed">{articulo.descripcion}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Disponibilidad stock={articulo.stock} />
            <span className="text-sm text-tenue">Código {articulo.codigo}</span>
          </div>
        </div>
        <Sugerencias
          key={articulo.id}
          articuloId={articulo.id}
          excluir={Object.keys(lineas).map(Number)}
          titulo="Se compra junto con"
          onAgregar={(id) => fijar(id, 1)}
        />
      </div>
    </Cajon>
  );
}
