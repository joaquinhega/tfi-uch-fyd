import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { useCatalogo } from "../catalogo.jsx";
import { formatoFecha, formatoMoneda, textoMotivo } from "../formato.js";
import { Boton, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";
import EstadoPedido from "../componentes/EstadoPedido.jsx";

const ESPERANDO = ["EN_ESPERA", "PENDIENTE"];

// Pedidos de todos los clientes (administrador)
export default function Pedidos({ sesion }) {
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

  useEffect(() => {
    if (!pedidos.some((p) => ESPERANDO.includes(p.estado))) return undefined;
    const temporizador = setTimeout(cargar, 2000);
    return () => clearTimeout(temporizador);
  }, [pedidos, cargar]);

  const nombreDe = (item) => item.nombre ?? porId[item.articulo_id]?.nombre ?? `Artículo ${item.articulo_id}`;

  if (cargando) return <p className="text-tenue">Cargando pedidos...</p>;

  return (
    <Seccion titulo="Pedidos" acciones={<Boton variante="secundario" onClick={cargar}>Actualizar</Boton>}>
      <Mensaje>{error}</Mensaje>
      {pedidos.length === 0 && !error && <Panel className="p-8 text-center text-sm text-tenue">Todavía no hay pedidos.</Panel>}

      {pedidos.length > 0 && (
        <Panel>
          <table className="tabla">
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Detalle</th>
                <th className="text-right">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="font-medium">{p.numero}</td>
                  <td className="whitespace-nowrap text-tenue">{formatoFecha(p.fecha)}</td>
                  <td>
                    {p.nombre_cliente}
                    <div className="text-xs text-tenue">{p.usuario_email}</div>
                  </td>
                  <td>
                    {p.items.map((i) => (
                      <div key={i.articulo_id}>
                        {i.cantidad} × {nombreDe(i)}
                        {i.precio_unitario && <span className="text-tenue"> a {formatoMoneda(i.precio_unitario)}</span>}
                      </div>
                    ))}
                  </td>
                  <td className="precio whitespace-nowrap text-right">{formatoMoneda(p.total)}</td>
                  <td>
                    <EstadoPedido estado={p.estado} />
                    {p.motivo && <div className="mt-1 max-w-48 text-xs text-tenue">{textoMotivo(p.motivo, p.detalle)}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </Seccion>
  );
}
