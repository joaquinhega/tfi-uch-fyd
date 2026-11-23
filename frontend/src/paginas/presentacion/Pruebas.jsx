import { useState } from "react";
import { useCatalogo } from "../../catalogo.jsx";
import { useConfirmar } from "../../confirmacion.jsx";
import { useCuenta } from "../../cuenta.jsx";
import { Boton, Comando, Panel } from "../../componentes/ui.jsx";
import { esperar, probar, tokenFalsificado } from "./probar.js";

function Resultado({ lineas }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {lineas.map((l, i) => (
        <li key={i} className="grid grid-cols-[1.25rem_1fr] gap-2">
          <span aria-hidden="true" className={l.ok === true ? "text-ok" : l.ok === false ? "text-error" : "text-tenue"}>
            {l.ok === true ? "✓" : l.ok === false ? "✗" : "·"}
          </span>
          <span className={l.ok === false ? "text-error" : ""}>
            <span className="sr-only">{l.ok === true ? "Correcto: " : l.ok === false ? "Falla: " : ""}</span>
            {l.texto}
          </span>
        </li>
      ))}
    </ul>
  );
}

function usePrueba(ejecutar) {
  const [estado, setEstado] = useState(null);
  async function correr(...args) {
    setEstado({ corriendo: true, lineas: [] });
    try {
      const lineas = await ejecutar(...args);
      setEstado({ corriendo: false, lineas, ok: lineas.every((l) => l.ok !== false) });
    } catch (e) {
      setEstado({ corriendo: false, lineas: [{ ok: false, texto: e.message }], ok: false });
    }
  }
  return [estado, correr];
}

function Insignia({ estado }) {
  if (!estado || estado.corriendo) return null;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.ok ? "bg-ok-suave text-ok" : "bg-error-suave text-error"}`}>
      {estado.ok ? "OK" : "Falla"}
    </span>
  );
}

// --- Muchos pedidos al mismo producto (D1) ---

async function resolverPedido(id, token) {
  for (let intento = 0; intento < 30; intento++) {
    await esperar(1000);
    const r = await probar("GET", `/pedidos/${id}`, { token });
    if (r.status === 200 && !["EN_ESPERA", "PENDIENTE"].includes(r.datos.estado)) return r.datos;
  }
  return null;
}

async function stockReal(id, token) {
  const r = await probar("GET", "/stock/articulos", { token });
  return r.datos?.find((a) => a.id === id)?.stock;
}

async function pruebaConcurrencia(token, articuloId, cantidad) {
  const original = await stockReal(articuloId, token);
  const preparar = await probar("PUT", `/stock/articulos/${articuloId}`, { token, cuerpo: { stock: 1 } });
  const lineas = [{ ok: preparar.status === 200, texto: `Preparación: el artículo queda con 1 unidad (tenía ${original})` }];

  const respuestas = await Promise.all(Array.from({ length: cantidad }, (_, i) => probar("POST", "/pedidos", {
    token,
    cuerpo: { nombre_cliente: `Prueba concurrencia ${i + 1}`, items: [{ articulo_id: articuloId, cantidad: 1 }] },
  })));

  const finales = await Promise.all(respuestas.map((r) => (r.status === 202 ? resolverPedido(r.datos.id, token) : r.datos)));
  const aceptados = finales.filter((p) => p?.estado === "ACEPTADO").length;
  const rechazados = finales.filter((p) => p?.estado === "RECHAZADO").length;
  const codigos = Object.entries(respuestas.reduce((t, r) => ({ ...t, [r.status]: (t[r.status] ?? 0) + 1 }), {}))
    .map(([codigo, n]) => `${codigo} × ${n}`).join(", ");
  const final = await stockReal(articuloId, token);

  lineas.push({ ok: null, texto: `${cantidad} pedidos al mismo tiempo → códigos ${codigos}` });
  lineas.push({ ok: aceptados === 1, texto: `Aceptados: ${aceptados} · rechazados: ${rechazados}` });
  lineas.push({ ok: final === 0, texto: `Stock final en la base: ${final}, sin sobreventa` });

  const restaurar = await probar("PUT", `/stock/articulos/${articuloId}`, { token, cuerpo: { stock: original } });
  lineas.push({ ok: restaurar.status === 200, texto: `Stock restablecido a ${original}` });
  return lineas;
}

function Concurrencia() {
  const { articulos, recargar } = useCatalogo();
  const { sesion, pedirAcceso } = useCuenta();
  const confirmar = useConfirmar();
  const [elegido, setElegido] = useState(null);
  const [cantidad, setCantidad] = useState(20);
  const [estado, correr] = usePrueba(async (token, id, n) => { const l = await pruebaConcurrencia(token, id, n); recargar(); return l; });
  const articuloId = elegido ?? articulos.find((a) => a.codigo === "AUD-002")?.id ?? [...articulos].sort((a, b) => a.stock - b.stock)[0]?.id;
  const articulo = articulos.find((a) => a.id === articuloId);
  const esAdmin = sesion?.rol === "ADMIN";

  async function ejecutar() {
    const ok = await confirmar({
      titulo: "¿Ejecutar la prueba?",
      mensaje: `Deja ${articulo?.nombre} con 1 unidad, envía ${cantidad} pedidos reales al mismo tiempo y al final restablece el stock.`,
      accion: "Ejecutar",
    });
    if (ok) correr(sesion.token, articuloId, cantidad);
  }

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">Muchos pedidos al mismo producto</h3>
          <Insignia estado={estado} />
        </div>
        <p className="text-xs font-medium text-acento">D1 Consistencia · bloqueo pesimista en Stock</p>
        <p className="mt-2 text-sm text-tenue">Con una sola unidad disponible, solo un pedido puede ganar. Desde una PC no se pueden enviar tantos pedidos a la vez a mano.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-tenue">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          Artículo
          <select value={articuloId ?? ""} onChange={(e) => setElegido(Number(e.target.value))} className="min-w-0 flex-1 rounded-md border border-linea bg-superficie px-3 py-2 text-tinta">
            {articulos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Pedidos
          <input type="number" min={2} max={50} value={cantidad} onChange={(e) => setCantidad(Math.min(50, Math.max(2, Number(e.target.value) || 2)))} className="w-20 rounded-md border border-linea bg-superficie px-3 py-2 text-tinta" />
        </label>
      </div>

      {esAdmin ? (
        <Boton className="self-start" onClick={ejecutar} disabled={estado?.corriendo || !articulo}>{estado?.corriendo ? "Ejecutando..." : "Ejecutar"}</Boton>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-tenue">Se ejecuta desde la pestaña del administrador.</p>
          {!sesion && <Boton variante="oscuro" onClick={() => pedirAcceso("Ingresá como administrador para ejecutar la prueba.")}>Ingresar</Boton>}
        </div>
      )}

      {estado?.lineas.length > 0 && <Resultado lineas={estado.lineas} />}
    </Panel>
  );
}

// --- Ataques al Gateway ---

async function pruebaAtaques(sesion) {
  const lineas = [];
  const sinToken = await probar("GET", "/pedidos");
  lineas.push({ ok: sinToken.status === 401, texto: `Sin token → ${sinToken.status}` });

  if (sesion) {
    const alterado = await probar("GET", "/pedidos", { token: `${sesion.token}x` });
    lineas.push({ ok: alterado.status === 401, texto: `Token real con la firma alterada → ${alterado.status}` });
  }

  const falso = await probar("GET", "/auth/usuarios", { token: tokenFalsificado(sesion?.token) });
  lineas.push({ ok: falso.status === 401, texto: `Token armado a mano, sin firma y con rol ADMIN → ${falso.status}` });

  if (sesion && sesion.rol !== "ADMIN") {
    const rol = await probar("GET", "/auth/usuarios", { token: sesion.token });
    lineas.push({ ok: rol.status === 403, texto: `Cliente llamando a una operación de admin → ${rol.status}` });
  }

  const interna = await probar("POST", "/stock/reservas", { cuerpo: { id_pedido: "x", items: [{ articulo_id: 1, cantidad: 1 }] } });
  lineas.push({ ok: interna.status === 404, texto: `Llamar a reservarStock desde afuera → ${interna.status}: no está publicada` });
  return lineas;
}

function Ataques() {
  const { sesion } = useCuenta();
  const [estado, correr] = usePrueba(pruebaAtaques);

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">Ataques al Gateway</h3>
          <Insignia estado={estado} />
        </div>
        <p className="text-xs font-medium text-acento">API Gateway · access token · validación centralizada</p>
        <p className="mt-2 text-sm text-tenue">Solicitudes que la interfaz nunca haría. {sesion?.rol === "ADMIN" ? "En la pestaña del cliente se suma el rechazo por rol (403)." : "Con la sesión del cliente se suma el rechazo por rol (403)."}</p>
      </div>
      <Boton className="self-start" onClick={() => correr(sesion)} disabled={estado?.corriendo}>{estado?.corriendo ? "Ejecutando..." : "Ejecutar"}</Boton>
      {estado?.lineas.length > 0 && <Resultado lineas={estado.lineas} />}
    </Panel>
  );
}

// --- En el servidor ---

const EN_SERVIDOR = [
  { prueba: "Circuit Breaker", patron: "Gateway y Pedidos → Stock", comando: "docker compose stop stock-service", ver: "#/presentacion/en-vivo" },
  { prueba: "Pedido en espera", patron: "Modo degradado: plazo blando de 2 s", comando: "pwsh scripts/demo/07-en-espera.ps1" },
  { prueba: "Compensación", patron: "liberarStock ante una falla", comando: "pwsh scripts/demo/05-compensacion.ps1" },
  { prueba: "Bloque adulterado", patron: "Blockchain: la cadena detecta el cambio", comando: "pwsh scripts/demo/08-blockchain.ps1" },
];

export default function Pruebas() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-tenue">Solo lo que no se puede mostrar usando la tienda desde una PC. El resto se ve en el flujo normal del cliente y del administrador (ver la Guía).</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Concurrencia />
        <Ataques />
      </div>

      <Panel>
        <div className="px-5 pt-5">
          <h3 className="font-semibold">En la terminal del servidor</h3>
          <p className="text-sm text-tenue">Apagan, bloquean o modifican contenedores. Se corren en la carpeta del proyecto.</p>
        </div>
        <table className="tabla mt-3">
          <thead>
            <tr>
              <th>Prueba</th>
              <th>Qué demuestra</th>
              <th>Comando</th>
            </tr>
          </thead>
          <tbody>
            {EN_SERVIDOR.map((p) => (
              <tr key={p.prueba}>
                <td className="font-medium">
                  {p.prueba}
                  {p.ver && <a href={p.ver} className="ml-2 text-xs font-semibold text-acento hover:underline">Ver en vivo</a>}
                </td>
                <td className="text-tenue">{p.patron}</td>
                <td><Comando texto={p.comando} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
