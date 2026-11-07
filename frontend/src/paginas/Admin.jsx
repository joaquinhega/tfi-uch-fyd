import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoMoneda } from "../formato.js";
import { Boton, Mensaje } from "../componentes/ui.jsx";

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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cuentas</h2>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm">
          <option value="INACTIVO">Inactivas</option>
          <option value="ACTIVO">Activas</option>
          <option value="">Todas</option>
        </select>
      </div>
      {mensaje && <Mensaje tipo={mensaje.tipo}>{mensaje.texto}</Mensaje>}
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-3 text-slate-500">No hay cuentas con ese estado.</td></tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{u.nombre}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.rol}</td>
                <td className="px-3 py-2">{u.estado}</td>
                <td className="px-3 py-2 text-right">
                  {u.id === sesion.id ? (
                    <span className="text-xs text-slate-400">(vos)</span>
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
      </div>
    </section>
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
      setMensaje({ tipo: "ok", texto: `${articulo.nombre} actualizado.` });
      cargar();
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Artículos</h2>
      {mensaje && <Mensaje tipo={mensaje.tipo}>{mensaje.texto}</Mensaje>}
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Artículo</th>
              <th className="px-3 py-2 text-right">Precio actual</th>
              <th className="px-3 py-2 text-right">Nuevo precio</th>
              <th className="px-3 py-2 text-right">Stock actual</th>
              <th className="px-3 py-2 text-right">Nuevo stock</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{a.nombre}</td>
                <td className="px-3 py-2 text-right">{formatoMoneda(a.precio)}</td>
                <td className="px-3 py-2 text-right">
                  <input type="number" min="0.01" step="0.01" value={cambios[a.id]?.precio ?? ""} onChange={(e) => editar(a.id, "precio", e.target.value)} className="w-28 rounded border border-slate-300 px-2 py-1 text-right" />
                </td>
                <td className="px-3 py-2 text-right">{a.stock}</td>
                <td className="px-3 py-2 text-right">
                  <input type="number" min="0" value={cambios[a.id]?.stock ?? ""} onChange={(e) => editar(a.id, "stock", e.target.value)} className="w-20 rounded border border-slate-300 px-2 py-1 text-right" />
                </td>
                <td className="px-3 py-2 text-right">
                  <Boton onClick={() => guardar(a)} disabled={!cambios[a.id]}>Guardar</Boton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Admin({ sesion }) {
  return (
    <div className="space-y-8">
      <Cuentas sesion={sesion} />
      <Articulos sesion={sesion} />
    </div>
  );
}