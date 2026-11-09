import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoFecha, formatoMoneda, textoMotivo } from "../formato.js";
import { Boton, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";
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

  if (cargando) return <p className="text-tenue">Cargando pedidos...</p>;

  return (
    <Seccion
      titulo={esAdmin ? "Todos los pedidos" : "Mis pedidos"}
      descripcion={esAdmin ? "Como administrador ves los pedidos de todos los clientes." : "Solo ves los pedidos hechos con tu cuenta."}
      acciones={<Boton variante="secundario" onClick={cargar}>Actualizar</Boton>}
    >
      <Mensaje>{error}</Mensaje>
      {pedidos.length === 0 && !error && (
        <Panel className="p-8 text-center text-sm text-tenue">Todavía no hay pedidos. Hacé el primero desde el catálogo.</Panel>
      )}

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
                    {esAdmin && <div className="text-xs text-tenue">{p.usuario_email}</div>}
                  </td>
                  <td>
                    {p.items.map((i) => (
                      <div key={i.articulo_id}>
                        {i.cantidad} × {nombres[i.articulo_id] ?? `Artículo ${i.articulo_id}`}
                        {i.precio_unitario && <span className="text-tenue"> a {formatoMoneda(i.precio_unitario)}</span>}
                      </div>
                    ))}
                  </td>
                  <td className="whitespace-nowrap text-right">{formatoMoneda(p.total)}</td>
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