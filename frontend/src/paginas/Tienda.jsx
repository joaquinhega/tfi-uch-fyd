import { useMemo, useState } from "react";
import { useCarrito } from "../carrito.jsx";
import { useCatalogo } from "../catalogo.jsx";
import { STOCK_BAJO } from "../config.js";
import { useCuenta } from "../cuenta.jsx";
import { formatoMoneda, sinAcentos } from "../formato.js";
import { Boton, Mensaje } from "../componentes/ui.jsx";
import Disponibilidad from "../componentes/Disponibilidad.jsx";
import ImagenProducto from "../componentes/ImagenProducto.jsx";
import ProductoCard from "../componentes/ProductoCard.jsx";
import ProductoDetalle from "../componentes/ProductoDetalle.jsx";

const ORDENES = {
  nombre: { texto: "Nombre", fn: (a, b) => a.nombre.localeCompare(b.nombre) },
  menor: { texto: "Menor precio", fn: (a, b) => Number(a.precio) - Number(b.precio) },
  mayor: { texto: "Mayor precio", fn: (a, b) => Number(b.precio) - Number(a.precio) },
};

function Esqueleto() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-lg border border-linea bg-superficie" />
      ))}
    </div>
  );
}

// Franja con lo que se está agotando: sale del stock real del catálogo
function UltimasUnidades({ articulos, tinte, onAbrir, onAgregar }) {
  return (
    <section aria-labelledby="ultimas-unidades" className="rounded-xl bg-grafito p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ultimas-unidades" className="text-lg font-semibold">Últimas unidades</h2>
        <p className="text-sm text-white/70">El stock baja con cada compra.</p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {articulos.map((a) => (
          <li key={a.id} className="min-w-0">
            <article className="flex gap-3 overflow-hidden rounded-lg bg-superficie p-3 text-tinta">
              <button onClick={() => onAbrir(a.id)} aria-label={`Ver ${a.nombre}`} className="shrink-0">
                <ImagenProducto articulo={a} tinte={tinte(a.categoria)} className="size-24 rounded-md [&_img]:p-2" />
              </button>
              <div className="flex min-w-0 flex-1 flex-col">
                <button onClick={() => onAbrir(a.id)} className="truncate text-left text-sm font-semibold hover:underline">{a.nombre}</button>
                <Disponibilidad stock={a.stock} className="!text-xs" />
                <p className="precio mt-auto text-lg font-bold">{formatoMoneda(a.precio)}</p>
                <Boton className="mt-1 py-1.5" onClick={() => onAgregar(a.id)}>Agregar</Boton>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Tienda({ busqueda, onBusqueda }) {
  const { articulos, categorias, tinte, cargando, error, recargar } = useCatalogo();
  const { lineas, fijar } = useCarrito();
  const { comprar } = useCuenta();
  const [categoria, setCategoria] = useState("");
  const [orden, setOrden] = useState("");
  const [detalleId, setDetalleId] = useState(null);

  const filtrados = useMemo(() => {
    const termino = sinAcentos(busqueda.trim());
    const lista = articulos.filter((a) =>
      (!categoria || a.categoria === categoria) &&
      (!termino || sinAcentos(`${a.nombre} ${a.descripcion} ${a.categoria} ${a.codigo}`).includes(termino)));
    return orden ? [...lista].sort(ORDENES[orden].fn) : lista;
  }, [articulos, categoria, busqueda, orden]);

  const ultimas = articulos.filter((a) => a.stock > 0 && a.stock <= STOCK_BAJO);
  const sinFiltros = !categoria && !busqueda.trim();
  const cuenta = (c) => articulos.filter((a) => a.categoria === c).length;
  const pildora = (activa) => `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${activa ? "border-grafito bg-grafito text-white" : "border-linea bg-superficie hover:border-tenue"}`;

  // El carrito exige sesión: sin sesión abre el login y agrega al ingresar
  const fijarConSesion = (id, cantidad) => comprar(() => fijar(id, cantidad));

  function limpiar() {
    setCategoria("");
    onBusqueda("");
  }

  return (
    <div className="space-y-6">
      {error && (
        <Mensaje>
          {error} <Boton variante="texto" onClick={recargar}>Reintentar</Boton>
        </Mensaje>
      )}

      {sinFiltros && ultimas.length > 0 && (
        <UltimasUnidades articulos={ultimas} tinte={tinte} onAbrir={setDetalleId} onAgregar={(id) => fijarConSesion(id, (lineas[id] ?? 0) + 1)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
          <button className={pildora(!categoria)} aria-pressed={!categoria} onClick={() => setCategoria("")}>Todo ({articulos.length})</button>
          {categorias.map((c) => (
            <button key={c} className={pildora(categoria === c)} aria-pressed={categoria === c} onClick={() => setCategoria(c)}>
              {c} ({cuenta(c)})
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-tenue">
          Ordenar
          <select value={orden} onChange={(e) => setOrden(e.target.value)} className="rounded-md border border-linea bg-superficie px-3 py-2 text-tinta">
            <option value="">Sin orden</option>
            {Object.entries(ORDENES).map(([id, o]) => <option key={id} value={id}>{o.texto}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-tenue" aria-live="polite">
        {cargando ? "Cargando productos..." : busqueda.trim()
          ? `${filtrados.length} ${filtrados.length === 1 ? "resultado" : "resultados"} para “${busqueda.trim()}”`
          : `${filtrados.length} ${filtrados.length === 1 ? "producto" : "productos"}`}
      </p>

      {cargando ? <Esqueleto /> : filtrados.length === 0 ? (
        <div className="rounded-lg border border-linea bg-superficie px-6 py-12 text-center">
          <p className="font-semibold">No encontramos productos con ese criterio.</p>
          <p className="mt-1 text-sm text-tenue">Probá con otra palabra o mirá todo el catálogo.</p>
          <Boton variante="oscuro" className="mt-5" onClick={limpiar}>Ver todo el catálogo</Boton>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((a) => (
            <li key={a.id} className="flex">
              <div className="flex w-full">
                <ProductoCard articulo={a} tinte={tinte(a.categoria)} cantidad={lineas[a.id] ?? 0} onAbrir={setDetalleId} onFijar={fijarConSesion} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {detalleId !== null && <ProductoDetalle articuloId={detalleId} onCerrar={() => setDetalleId(null)} />}
    </div>
  );
}
