import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoFecha, formatoMoneda, textoMotivo } from "../formato.js";
import { Boton, Mensaje } from "../componentes/ui.jsx";
import EstadoPedido from "../componentes/EstadoPedido.jsx";

const ESPERANDO = ["EN_ESPERA", "PENDIENTE"];

export default function Pedidos({ sesion }) {
  const [pedidos, setPedidos] = useState([]);
  const [nombres, setNombres] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const esAdmin = sesion.rol === "ADMIN";

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

  useEffect(() => {
    cargar();
    // Nombres de los artículos (el pedido solo guarda el id; el nombre vive en Stock)
    llamar("GET", "/stock/catalogo")
      .then(({ datos }) => setNombres(Object.fromEntries(datos.map((a) => [a.id, a.nombre]))))
      .catch(() => {});
  }, [cargar]);

  // Si hay pedidos EN ESPERA, se vuelve a consultar cada 2 s hasta que se resuelvan
  useEffect(() => {
    if (!pedidos.some((p) => ESPERANDO.includes(p.estado))) return undefined;
    const temporizador = setTimeout(cargar, 2000);
    return () => clearTimeout(temporizador);
  }, [pedidos, cargar]);

  if (cargando) return <p className="text-slate-500">Cargando pedidos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{esAdmin ? "Todos los pedidos" : "Mis pedidos"}</h2>
        <Boton variante="secundario" onClick={cargar}>Actualizar</Boton>
      </div>

      <Mensaje>{error}</Mensaje>
      {pedidos.length === 0 && !error && <p className="text-slate-500">Todavía no hay pedidos.</p>}

      {pedidos.length > 0 && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">N°</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Cliente</th>
                {esAdmin && <th className="px-3 py-2">Usuario</th>}
                <th className="px-3 py-2">Detalle</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2">{p.numero}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatoFecha(p.fecha)}</td>
                  <td className="px-3 py-2">{p.nombre_cliente}</td>
                  {esAdmin && <td className="px-3 py-2 text-slate-500">{p.usuario_email}</td>}
                  <td className="px-3 py-2">
                    {p.items.map((i) => (
                      <div key={i.articulo_id}>
                        {i.cantidad} × {nombres[i.articulo_id] ?? `Artículo ${i.articulo_id}`}
                        {i.precio_unitario && <span className="text-slate-500"> ({formatoMoneda(i.precio_unitario)})</span>}
                      </div>
                    ))}
                  </td>
                  <td className="px-3 py-2 text-right">{formatoMoneda(p.total)}</td>
                  <td className="px-3 py-2">
                    <EstadoPedido estado={p.estado} />
                    {p.motivo && <div className="mt-1 text-xs text-slate-500">{textoMotivo(p.motivo, p.detalle)}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}