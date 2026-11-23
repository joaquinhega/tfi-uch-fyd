import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { useConfirmar } from "../confirmacion.jsx";
import { Boton, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";

const ESTADOS_CUENTA = { ACTIVO: "Activa", INACTIVO: "Sin activar" };
const ROLES = { ADMIN: "Administrador", CLIENTE: "Cliente" };

export default function Cuentas({ sesion }) {
  const [filtro, setFiltro] = useState("INACTIVO");
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const confirmar = useConfirmar();

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
    const activar = accion === "activar";
    const ok = await confirmar({
      titulo: activar ? "¿Activar la cuenta?" : "¿Desactivar la cuenta?",
      mensaje: activar
        ? `${usuario.email} va a poder ingresar y comprar.`
        : `${usuario.email} no va a poder volver a ingresar. Si tiene un token vigente, sigue valiendo hasta que venza.`,
      accion: activar ? "Activar" : "Desactivar",
      peligro: !activar,
    });
    if (!ok) return;
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
