import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { useCatalogo } from "../catalogo.jsx";
import { formatoFechaCorta, formatoMoneda, textoMotivo } from "../formato.js";
import { Boton, Mensaje } from "../componentes/ui.jsx";
import EstadoPedido from "../componentes/EstadoPedido.jsx";

const ESPERANDO = ["EN_ESPERA", "PENDIENTE"];

export default function MisPedidos({ sesion }) {
  const { porId } = useCatalogo();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const { datos } = await llamar("GET", "/pedidos", { token: sesion.token });
      setPedidos(datos);
    } catch (e) {
      setError(e.status === 0 ? "" : e.message);
    } finally {
      setCargando(false);
    }
  }, [sesion.token]);

  useEffect(() => { cargar(); }, [cargar]);

  // Modo degradado: mientras haya pedidos en espera se consulta de nuevo
  useEffect(() => {
    if (!pedidos.some((p) => ESPERANDO.includes(p.estado))) return undefined;
    const temporizador = setTimeout(cargar, 2000);
    return () => clearTimeout(temporizador);
  }, [pedidos, cargar]);

  const nombreDe = (item) => item.nombre ?? porId[item.articulo_id]?.nombre ?? `Artículo ${item.articulo_id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Mis pedidos</h1>
        <Boton variante="secundario" onClick={cargar}>Actualizar</Boton>
      </div>
      <Mensaje>{error}</Mensaje>

      {cargando && <p className="text-tenue">Cargando pedidos...</p>}

      {!cargando && pedidos.length === 0 && !error && (
        <div className="rounded-lg border border-linea bg-superficie px-6 py-12 text-center">
          <p className="font-semibold">Todavía no hiciste pedidos.</p>
          <p className="mt-1 text-sm text-tenue">Cuando confirmes una compra, la vas a ver acá.</p>
          <a href="#/" className="mt-5 inline-flex rounded-md bg-grafito px-4 py-2.5 text-sm font-semibold text-white hover:bg-grafito/90">Ver productos</a>
        </div>
      )}

      <ul className="space-y-4">
        {pedidos.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-lg border border-linea bg-superficie">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-linea bg-fondo/60 px-5 py-3">
              <div>
                <p className="font-semibold">Pedido #{p.numero}</p>
                <p className="text-xs text-tenue">{formatoFechaCorta(p.fecha)}</p>
              </div>
              <EstadoPedido estado={p.estado} />
            </div>
            <ul className="divide-y divide-linea px-5">
              {p.items.map((i) => (
                <li key={i.articulo_id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <span>{i.cantidad} × {nombreDe(i)}</span>
                  {i.subtotal && <span className="precio text-tenue">{formatoMoneda(i.subtotal)}</span>}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-linea px-5 py-3">
              {p.motivo ? <p className="text-sm text-tenue">{textoMotivo(p.motivo, p.detalle)}</p> : <span />}
              {p.total && <p className="precio font-bold">{formatoMoneda(p.total)}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
