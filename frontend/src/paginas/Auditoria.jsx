import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { formatoFecha, formatoMoneda } from "../formato.js";
import { Boton, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";

const EVENTOS = {
  GENESIS: "Inicio de la cadena",
  CUENTA_REGISTRADA: "Cuenta registrada",
  CUENTA_ACTIVADA: "Cuenta activada",
  CUENTA_DESACTIVADA: "Cuenta desactivada",
  PEDIDO_ACEPTADO: "Pedido aceptado",
  PEDIDO_RECHAZADO: "Pedido rechazado",
};

function resumen(bloque) {
  const d = bloque.datos ?? {};
  if (bloque.tipo === "PEDIDO_ACEPTADO") return `${d.usuario ?? ""}, ${formatoMoneda(d.total)}`;
  if (bloque.tipo === "PEDIDO_RECHAZADO") return d.motivo ?? "";
  return d.email ?? Object.values(d).filter((v) => typeof v === "string").slice(0, 2).join(", ");
}

function Hash({ valor, resaltar }) {
  return <span className={`font-mono text-xs ${resaltar ? "text-error" : "text-tenue"}`} title={valor}>{valor?.slice(0, 12)}</span>;
}

export default function Auditoria({ sesion }) {
  const [bloques, setBloques] = useState([]);
  const [verificacion, setVerificacion] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const { datos } = await llamar("GET", "/auditoria/bloques?limite=50", { token: sesion.token });
      setBloques([...datos].sort((a, b) => b.indice - a.indice));
    } catch (e) {
      setError(e.status === 0 ? "" : e.message);
    }
  }, [sesion.token]);

  async function verificar() {
    setVerificando(true);
    setVerificacion(null);
    try {
      const { datos } = await llamar("GET", "/auditoria/verificacion", { token: sesion.token });
      setVerificacion(datos);
      cargar();
    } catch (e) {
      if (e.status !== 0) setError(e.message);
    } finally {
      setVerificando(false);
    }
  }

  // Al abrir la sección se verifica la cadena completa
  useEffect(() => { verificar(); }, [cargar]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalido = verificacion?.primer_bloque_invalido;

  return (
    <Seccion
      titulo="Auditoría"
      acciones={
        <>
          <Boton variante="secundario" onClick={cargar}>Actualizar</Boton>
          <Boton onClick={verificar} disabled={verificando}>{verificando ? "Verificando..." : "Verificar cadena"}</Boton>
        </>
      }
    >
      <Mensaje>{error}</Mensaje>
      {verificacion && (
        verificacion.valida
          ? <Mensaje tipo="ok">Cadena válida ({verificacion.bloques_verificados} bloques).</Mensaje>
          : <Mensaje tipo="error">Cadena alterada en el bloque #{invalido}. {verificacion.motivo}</Mensaje>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="space-y-2 p-5 text-sm">
          <h3 className="font-semibold">Qué registra</h3>
          <p>Cada evento importante del negocio queda como un bloque: cuentas registradas, activadas y desactivadas, y pedidos aceptados y rechazados. Lo envían Autenticación y Pedidos.</p>
        </Panel>
        <Panel className="space-y-2 p-5 text-sm">
          <h3 className="font-semibold">Cómo se protege</h3>
          <p>Cada bloque guarda el hash SHA-256 de su contenido y el hash del bloque anterior. Si alguien modifica un bloque en la base, su hash deja de coincidir y la cadena se rompe desde ahí.</p>
        </Panel>
        <Panel className="space-y-2 p-5 text-sm">
          <h3 className="font-semibold">Cómo mejorarla</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Publicar el último hash fuera del sistema cada día, para detectar si se reescribe la cadena entera.</li>
            <li>Que cada servicio firme sus eventos, para saber quién los emitió.</li>
            <li>Verificar la cadena en forma automática y alertar si falla.</li>
          </ul>
        </Panel>
      </div>

      <Panel>
        <table className="tabla">
          <thead>
            <tr>
              <th>Bloque</th>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Detalle</th>
              <th>Hash</th>
              <th>Hash anterior</th>
            </tr>
          </thead>
          <tbody>
            {bloques.length === 0 && !error && (
              <tr><td colSpan={6} className="text-tenue">Sin bloques.</td></tr>
            )}
            {bloques.map((b) => {
              const alterado = b.indice === invalido;
              return (
                <tr key={b.indice} className={alterado ? "bg-error-suave" : ""}>
                  <td className="font-medium">#{b.indice}</td>
                  <td className="whitespace-nowrap text-tenue">{formatoFecha(b.ts)}</td>
                  <td>
                    {EVENTOS[b.tipo] ?? b.tipo}
                    <div className="text-xs text-tenue">desde {b.servicio}</div>
                  </td>
                  <td className="max-w-56 truncate text-tenue" title={JSON.stringify(b.datos)}>{resumen(b)}</td>
                  <td><Hash valor={b.hash} resaltar={alterado} /></td>
                  <td><Hash valor={b.hash_anterior} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </Seccion>
  );
}
