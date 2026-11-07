import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoMoneda, textoMotivo } from "../formato.js";
import { Boton, Campo, Mensaje } from "../componentes/ui.jsx";

const ESPERANDO = ["EN_ESPERA", "PENDIENTE"];

export default function Catalogo({ sesion }) {
  const [articulos, setArticulos] = useState([]);
  const [cantidades, setCantidades] = useState({});
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

  function mostrar(pedido) {
    if (pedido.estado === "ACEPTADO") {
      setResultado({ tipo: "ok", texto: `Pedido #${pedido.numero} ACEPTADO. Total: ${formatoMoneda(pedido.total)}` });
    } else {
      setResultado({ tipo: "error", texto: `Pedido #${pedido.numero} RECHAZADO: ${textoMotivo(pedido.motivo, pedido.detalle)}` });
    }
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
      const { status, datos } = await llamar("POST", "/pedidos", {
        token: sesion.token,
        cuerpo: { nombre_cliente: nombreCliente, items },
      });
      setCantidades({});
      if (status === 202) {
        setResultado({ tipo: "info", texto: `Pedido #${datos.numero} EN ESPERA: la solicitud fue recibida y está en curso...` });
        const final = await esperarResultado(datos.id);
        if (final) mostrar(final);
        else setResultado({ tipo: "info", texto: `El pedido #${datos.numero} sigue en espera. Consultalo en "Mis pedidos".` });
      } else {
        mostrar(datos);
      }
    } catch (e) {
      if (e.datos?.estado === "RECHAZADO") mostrar(e.datos);
      else if (e.status !== 0) setResultado({ tipo: "error", texto: e.message });
    } finally {
      setEnviando(false);
      cargar();
    }
  }

  function cambiarCantidad(id, valor) {
    setCantidades({ ...cantidades, [id]: Math.max(0, Number.parseInt(valor, 10) || 0) });
  }

  if (cargando) return <p className="text-slate-500">Cargando catálogo...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Catálogo</h2>
        <Boton variante="secundario" onClick={cargar}>Actualizar</Boton>
      </div>

      <Mensaje>{error}</Mensaje>
      <p className="text-xs text-slate-500">El stock mostrado puede tener hasta 30 segundos de antigüedad (caché). La disponibilidad real se confirma al hacer el pedido.</p>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Artículo</th>
              <th className="px-3 py-2 text-right">Precio</th>
              <th className="px-3 py-2 text-right">Stock</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const cantidad = cantidades[a.id] ?? 0;
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-500">{a.codigo}</td>
                  <td className="px-3 py-2">{a.nombre}</td>
                  <td className="px-3 py-2 text-right">{formatoMoneda(a.precio)}</td>
                  <td className="px-3 py-2 text-right">{a.stock}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min="0"
                      value={cantidad}
                      onChange={(e) => cambiarCantidad(a.id, e.target.value)}
                      className={`w-20 rounded border px-2 py-1 text-right ${cantidad > a.stock ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:items-end">
        <Campo etiqueta="Nombre del cliente" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} />
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm">Total estimado: <strong>{formatoMoneda(total)}</strong></span>
          <Boton onClick={confirmar} disabled={enviando || items.length === 0 || !nombreCliente.trim()}>
            {enviando ? "Procesando..." : "Confirmar pedido"}
          </Boton>
        </div>
      </div>

      {resultado && <Mensaje tipo={resultado.tipo}>{resultado.texto}</Mensaje>}
    </div>
  );
}