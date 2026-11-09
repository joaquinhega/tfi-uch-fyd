import { Fragment, useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoMoneda, textoMotivo } from "../formato.js";
import { Boton, Campo, Codigo, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";
import EstadoPedido from "../componentes/EstadoPedido.jsx";

const ESPERANDO = ["EN_ESPERA", "PENDIENTE"];

// IA (Sprint 7): artículos que suelen comprarse junto con el elegido (reglas de asociación en Stock)
function Recomendaciones({ articuloId, onSumar }) {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    llamar("GET", `/stock/catalogo/${articuloId}/recomendaciones`)
      .then(({ datos }) => setLista(datos))
      .catch((e) => setError(e.status === 0 ? "No se pudo consultar." : e.message));
  }, [articuloId]);

  if (error) return <p className="text-sm text-error">{error}</p>;
  if (!lista) return <p className="text-sm text-tenue">Buscando artículos que se compran juntos...</p>;
  if (lista.length === 0) return <p className="text-sm text-tenue">Todavía no hay pedidos suficientes para sugerir algo.</p>;

  return (
    <ul className="space-y-2">
      {lista.map((r) => (
        <li key={r.articulo_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="min-w-40 font-medium">{r.nombre}</span>
          <span className="flex items-center gap-2 text-tenue">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-linea" aria-hidden="true">
              <span className="block h-full rounded-full bg-acento" style={{ width: `${Math.round(r.confianza * 100)}%` }} />
            </span>
            {Math.round(r.confianza * 100)} % de los pedidos ({r.veces} veces)
          </span>
          <Boton variante="texto" onClick={() => onSumar(r.articulo_id)}>Sumar al pedido</Boton>
        </li>
      ))}
    </ul>
  );
}

// Resultado del pedido con su ID de correlación (Log Aggregation)
function Resultado({ resultado }) {
  const [copiado, setCopiado] = useState(false);
  const comando = resultado.correlacion ? `docker compose logs | Select-String ${resultado.correlacion}` : "";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(comando);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sin portapapeles: el comando queda visible para copiarlo a mano
    }
  }

  const tono = { ACEPTADO: "ok", RECHAZADO: "error", EN_ESPERA: "espera" }[resultado.estado] ?? "error";

  return (
    <Mensaje tipo={tono}>
      <div className="flex flex-wrap items-center gap-2">
        {resultado.estado && <EstadoPedido estado={resultado.estado} />}
        <span className="text-tinta">{resultado.texto}</span>
      </div>
      {resultado.correlacion && (
        <div className="mt-3 space-y-1.5 text-tinta">
          <p className="text-tenue">Para seguir este pedido en los logs de todos los servicios:</p>
          <div className="flex flex-wrap items-center gap-2">
            <Codigo>{comando}</Codigo>
            <Boton variante="texto" onClick={copiar}>{copiado ? "Copiado" : "Copiar"}</Boton>
          </div>
        </div>
      )}
    </Mensaje>
  );
}

export default function Catalogo({ sesion }) {
  const [articulos, setArticulos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [abierto, setAbierto] = useState(null);
  const [nombreCliente, setNombreCliente] = useState(sesion.nombre ?? "");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const cargar = useCallback(async () => {
    setError("");
    try {
      const { datos } = await llamar("GET", "/stock/catalogo");
      setArticulos(datos);
    } catch (e) {
      setError(e.status === 0 ? "" : e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const items = Object.entries(cantidades)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([id, cantidad]) => ({ articulo_id: Number(id), cantidad }));

  const total = items.reduce((suma, i) => {
    const articulo = articulos.find((a) => a.id === i.articulo_id);
    return suma + Number(articulo?.precio ?? 0) * i.cantidad;
  }, 0);

  function describir(pedido, correlacion) {
    const texto = pedido.estado === "ACEPTADO"
      ? `Pedido #${pedido.numero} por ${formatoMoneda(pedido.total)}.`
      : `Pedido #${pedido.numero}: ${textoMotivo(pedido.motivo, pedido.detalle)}.`;
    return { estado: pedido.estado, texto, correlacion };
  }

  // Modo degradado (TP3 §7.3): si el pedido quedó EN ESPERA, se consulta su estado hasta tener el resultado final
  async function esperarResultado(id) {
    for (let intento = 0; intento < 30; intento++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const { datos } = await llamar("GET", `/pedidos/${id}`, { token: sesion.token });
        if (!ESPERANDO.includes(datos.estado)) return datos;
      } catch {
        // se reintenta en la próxima vuelta
      }
    }
    return null;
  }

  async function confirmar() {
    setEnviando(true);
    setResultado(null);
    try {
      const { status, datos, correlacion } = await llamar("POST", "/pedidos", {
        token: sesion.token,
        cuerpo: { nombre_cliente: nombreCliente, items },
      });
      setCantidades({});
      if (status === 202) {
        setResultado({ estado: "EN_ESPERA", texto: `Pedido #${datos.numero} recibido. La reserva de stock sigue en curso...`, correlacion });
        const final = await esperarResultado(datos.id);
        setResultado(final
          ? describir(final, correlacion)
          : { estado: "EN_ESPERA", texto: `El pedido #${datos.numero} sigue en espera. Consultalo en Pedidos.`, correlacion });
      } else {
        setResultado(describir(datos, correlacion));
      }
    } catch (e) {
      if (e.datos?.estado === "RECHAZADO") setResultado(describir(e.datos, e.correlacion));
      else if (e.status !== 0) setResultado({ texto: e.message, correlacion: e.correlacion });
    } finally {
      setEnviando(false);
      cargar();
    }
  }

  function cambiarCantidad(id, valor) {
    setCantidades({ ...cantidades, [id]: Math.max(0, Number.parseInt(valor, 10) || 0) });
  }

  function sumar(id) {
    setCantidades({ ...cantidades, [id]: (cantidades[id] ?? 0) + 1 });
  }

  if (cargando) return <p className="text-tenue">Cargando catálogo...</p>;

  return (
    <Seccion
      titulo="Catálogo"
      descripcion="El stock puede tener hasta 30 segundos de antigüedad (caché). La disponibilidad real se confirma al hacer el pedido."
      acciones={<Boton variante="secundario" onClick={cargar}>Actualizar</Boton>}
    >
      <Mensaje>{error}</Mensaje>

      <Panel>
        <table className="tabla">
          <thead>
            <tr>
              <th>Artículo</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const cantidad = cantidades[a.id] ?? 0;
              const verSugerencias = abierto === a.id;
              return (
                <Fragment key={a.id}>
                  <tr>
                    <td>
                      <div className="font-medium">{a.nombre}</div>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-tenue">
                        <span className="font-mono">{a.codigo}</span>
                        <Boton variante="texto" className="text-xs" aria-expanded={verSugerencias} onClick={() => setAbierto(verSugerencias ? null : a.id)}>
                          {verSugerencias ? "Ocultar sugerencias" : "Se compra junto con"}
                        </Boton>
                      </div>
                    </td>
                    <td className="text-right whitespace-nowrap">{formatoMoneda(a.precio)}</td>
                    <td className={`text-right ${a.stock === 0 ? "text-error" : ""}`}>{a.stock}</td>
                    <td className="text-right">
                      <input
                        type="number"
                        min="0"
                        aria-label={`Cantidad de ${a.nombre}`}
                        value={cantidad}
                        onChange={(e) => cambiarCantidad(a.id, e.target.value)}
                        className={`w-20 rounded-md border px-2 py-1.5 text-right outline-none focus:ring-2 focus:ring-acento/20 ${cantidad > a.stock ? "border-error bg-error-suave" : "border-linea"}`}
                      />
                    </td>
                  </tr>
                  {verSugerencias && (
                    <tr>
                      <td colSpan={4} className="bg-acento-suave/50">
                        <p className="mb-2 text-xs text-tenue">Quienes compraron {a.nombre} también llevaron:</p>
                        <Recomendaciones articuloId={a.id} onSumar={sumar} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel className="grid gap-4 p-5 sm:grid-cols-2 sm:items-end">
        <Campo etiqueta="Nombre del cliente" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} />
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="text-sm text-tenue">Total estimado <strong className="ml-1 text-base text-tinta">{formatoMoneda(total)}</strong></span>
          <Boton onClick={confirmar} disabled={enviando || items.length === 0 || !nombreCliente.trim()}>
            {enviando ? "Procesando..." : "Confirmar pedido"}
          </Boton>
        </div>
      </Panel>

      {resultado && <Resultado resultado={resultado} />}
    </Seccion>
  );
}