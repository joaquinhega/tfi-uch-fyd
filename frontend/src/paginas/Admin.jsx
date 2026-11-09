import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoMoneda } from "../formato.js";
import { Boton, Campo, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";

const ESTADOS_CUENTA = { ACTIVO: "Activa", INACTIVO: "Sin activar" };
const ROLES = { ADMIN: "Administrador", CLIENTE: "Cliente" };
const entrada = "rounded-md border border-linea bg-superficie px-2 py-1.5 text-right outline-none focus:border-acento focus:ring-2 focus:ring-acento/20";

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

const ARTICULO_VACIO = { codigo: "", nombre: "", stock: "", precio: "" };

function NuevoArticulo({ sesion, onCreado }) {
  const [datos, setDatos] = useState(ARTICULO_VACIO);
  const [error, setError] = useState("");

  async function crear(e) {
    e.preventDefault();
    setError("");
    try {
      const cuerpo = { ...datos, stock: Number.parseInt(datos.stock, 10), precio: Number(datos.precio) };
      await llamar("POST", "/stock/articulos", { token: sesion.token, cuerpo });
      setDatos(ARTICULO_VACIO);
      onCreado(`${cuerpo.nombre} creado.`);
    } catch (e) {
      if (e.status !== 0) setError(e.message);
    }
  }

  const campo = (nombre) => ({ value: datos[nombre], onChange: (e) => setDatos({ ...datos, [nombre]: e.target.value }), required: true });

  return (
    <form onSubmit={crear} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_7rem_8rem_auto] sm:items-end">
        <Campo etiqueta="Código" maxLength={20} {...campo("codigo")} />
        <Campo etiqueta="Nombre" maxLength={120} {...campo("nombre")} />
        <Campo etiqueta="Stock" type="number" min="0" {...campo("stock")} />
        <Campo etiqueta="Precio" type="number" min="0.01" step="0.01" {...campo("precio")} />
        <Boton type="submit">Agregar</Boton>
      </div>
      <Mensaje>{error}</Mensaje>
    </form>
  );
}

// ABM de artículos (RF-04)
function Articulos({ sesion }) {
  const [articulos, setArticulos] = useState([]);
  const [cambios, setCambios] = useState({});
  const [mensaje, setMensaje] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await llamar("GET", "/stock/articulos", { token: sesion.token });
      setArticulos(datos);
      setCambios({});
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }, [sesion.token]);

  useEffect(() => { cargar(); }, [cargar]);

  function editar(id, campo, valor) {
    setCambios({ ...cambios, [id]: { ...cambios[id], [campo]: valor } });
  }

  async function actualizar(articulo, cuerpo, texto) {
    setMensaje(null);
    try {
      await llamar("PUT", `/stock/articulos/${articulo.id}`, { token: sesion.token, cuerpo });
      setMensaje({ tipo: "ok", texto });
      cargar();
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }

  function guardar(articulo) {
    const cambio = cambios[articulo.id] ?? {};
    const cuerpo = {};
    if (cambio.stock !== undefined && cambio.stock !== "") cuerpo.stock = Number.parseInt(cambio.stock, 10);
    if (cambio.precio !== undefined && cambio.precio !== "") cuerpo.precio = Number(cambio.precio);
    if (Object.keys(cuerpo).length > 0) actualizar(articulo, cuerpo, `${articulo.nombre} guardado.`);
  }

  return (
    <Seccion titulo="Artículos">
      <Panel className="p-5">
        <NuevoArticulo sesion={sesion} onCreado={(texto) => { setMensaje({ tipo: "ok", texto }); cargar(); }} />
      </Panel>
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
              <tr key={a.id} className={a.activo ? "" : "text-tenue"}>
                <td>
                  <div className="font-medium">{a.nombre}</div>
                  <div className="font-mono text-xs text-tenue">{a.codigo}{!a.activo && " (dado de baja)"}</div>
                </td>
                <td className="whitespace-nowrap text-right text-tenue">{formatoMoneda(a.precio)}</td>
                <td className="text-right">
                  <input type="number" min="0.01" step="0.01" aria-label={`Nuevo precio de ${a.nombre}`} value={cambios[a.id]?.precio ?? ""} onChange={(e) => editar(a.id, "precio", e.target.value)} className={`w-24 ${entrada}`} />
                </td>
                <td className="text-right text-tenue">{a.stock}</td>
                <td className="text-right">
                  <input type="number" min="0" aria-label={`Nuevo stock de ${a.nombre}`} value={cambios[a.id]?.stock ?? ""} onChange={(e) => editar(a.id, "stock", e.target.value)} className={`w-20 ${entrada}`} />
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <Boton onClick={() => guardar(a)} disabled={!cambios[a.id]}>Guardar</Boton>
                    {a.activo
                      ? <Boton variante="secundario" onClick={() => actualizar(a, { activo: false }, `${a.nombre} dado de baja.`)}>Dar de baja</Boton>
                      : <Boton variante="secundario" onClick={() => actualizar(a, { activo: true }, `${a.nombre} reactivado.`)}>Reactivar</Boton>}
                  </div>
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
