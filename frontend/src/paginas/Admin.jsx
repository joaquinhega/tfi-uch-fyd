import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoMoneda } from "../formato.js";
import { Boton, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";

const ESTADOS_CUENTA = { ACTIVO: "Activa", INACTIVO: "Sin activar" };
const ROLES = { ADMIN: "Administrador", CLIENTE: "Cliente" };
const entrada = "rounded-md border border-linea bg-superficie px-2 py-1.5 text-right outline-none focus:border-acento focus:ring-2 focus:ring-acento/20";

// RF-02: activación de cuentas
function Cuentas({ sesion }) {
  const [filtro, setFiltro] = useState("INACTIVO");
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const query = filtro ? `?estado=${filtro}` : "";
      const { datos } = await llamar("GET", `/auth/usuarios${query}`, { token: sesion.token });
      setUsuarios(datos);
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }, [filtro, sesion.token]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(usuario, accion) {
    setMensaje(null);
    try {
      await llamar("PATCH", `/auth/usuarios/${usuario.id}/${accion}`, { token: sesion.token });
      setMensaje({ tipo: "ok", texto: `Cuenta de ${usuario.email} ${accion === "activar" ? "activada" : "desactivada"}.` });
      cargar();
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }

  return (
    <Seccion
      titulo="Cuentas"
      descripcion="Las cuentas nuevas no pueden ingresar hasta que las actives."
      acciones={
        <select aria-label="Filtrar cuentas" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-md border border-linea bg-superficie px-3 py-2 text-sm">
          <option value="INACTIVO">Sin activar</option>
          <option value="ACTIVO">Activas</option>
          <option value="">Todas</option>
        </select>
      }
    >
      {mensaje && <Mensaje tipo={mensaje.tipo}>{mensaje.texto}</Mensaje>}
      <Panel>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr><td colSpan={5} className="text-tenue">No hay cuentas con ese estado.</td></tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.nombre}</td>
                <td className="text-tenue">{u.email}</td>
                <td>{ROLES[u.rol] ?? u.rol}</td>
                <td className={u.estado === "ACTIVO" ? "text-ok" : "text-espera"}>{ESTADOS_CUENTA[u.estado] ?? u.estado}</td>
                <td className="text-right">
                  {u.id === sesion.id ? (
                    <span className="text-xs text-tenue">Tu cuenta</span>
                  ) : u.estado === "INACTIVO" ? (
                    <Boton onClick={() => cambiarEstado(u, "activar")}>Activar</Boton>
                  ) : (
                    <Boton variante="secundario" onClick={() => cambiarEstado(u, "desactivar")}>Desactivar</Boton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Seccion>
  );
}

// RF-04: stock y precio
function Articulos({ sesion }) {
  const [articulos, setArticulos] = useState([]);
  const [cambios, setCambios] = useState({});
  const [mensaje, setMensaje] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await llamar("GET", "/stock/catalogo");
      setArticulos(datos);
      setCambios({});
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function editar(id, campo, valor) {
    setCambios({ ...cambios, [id]: { ...cambios[id], [campo]: valor } });
  }

  async function guardar(articulo) {
    const cambio = cambios[articulo.id] ?? {};
    const cuerpo = {};
    if (cambio.stock !== undefined && cambio.stock !== "") cuerpo.stock = Number.parseInt(cambio.stock, 10);
    if (cambio.precio !== undefined && cambio.precio !== "") cuerpo.precio = Number(cambio.precio);
    if (Object.keys(cuerpo).length === 0) return;
    setMensaje(null);
    try {
      await llamar("PUT", `/stock/articulos/${articulo.id}`, { token: sesion.token, cuerpo });
      setMensaje({ tipo: "ok", texto: `${articulo.nombre} guardado. El catálogo ya muestra el valor nuevo.` });
      cargar();
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }

  return (
    <Seccion titulo="Stock y precios" descripcion="Completá solo lo que quieras cambiar. Al guardar se actualiza la caché del catálogo.">
      {mensaje && <Mensaje tipo={mensaje.tipo}>{mensaje.texto}</Mensaje>}
      <Panel>
        <table className="tabla">
          <thead>
            <tr>
              <th>Artículo</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Nuevo precio</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Nuevo stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.nombre}</td>
                <td className="whitespace-nowrap text-right text-tenue">{formatoMoneda(a.precio)}</td>
                <td className="text-right">
                  <input type="number" min="0.01" step="0.01" aria-label={`Nuevo precio de ${a.nombre}`} value={cambios[a.id]?.precio ?? ""} onChange={(e) => editar(a.id, "precio", e.target.value)} className={`w-28 ${entrada}`} />
                </td>
                <td className="text-right text-tenue">{a.stock}</td>
                <td className="text-right">
                  <input type="number" min="0" aria-label={`Nuevo stock de ${a.nombre}`} value={cambios[a.id]?.stock ?? ""} onChange={(e) => editar(a.id, "stock", e.target.value)} className={`w-20 ${entrada}`} />
                </td>
                <td className="text-right">
                  <Boton onClick={() => guardar(a)} disabled={!cambios[a.id]}>Guardar</Boton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Seccion>
  );
}

export default function Admin({ sesion }) {
  return (
    <div className="space-y-10">
      <Cuentas sesion={sesion} />
      <Articulos sesion={sesion} />
    </div>
  );
}