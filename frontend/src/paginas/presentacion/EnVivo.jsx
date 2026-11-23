import { useEffect, useState } from "react";
import { useCatalogo } from "../../catalogo.jsx";
import { API_URL } from "../../config.js";
import { useCuenta } from "../../cuenta.jsx";
import { formatoHora, textoMotivo } from "../../formato.js";
import { Boton, Comando, Panel } from "../../componentes/ui.jsx";
import { probar } from "./probar.js";

const URL_HEALTH = API_URL.replace(/\/api\/v1\/?$/, "") + "/health";

const CIRCUITO = {
  CERRADO: { texto: "Cerrado", color: "var(--color-ok)", fondo: "var(--color-ok-suave)" },
  SEMIABIERTO: { texto: "Semiabierto", color: "var(--color-espera)", fondo: "var(--color-espera-suave)" },
  ABIERTO: { texto: "Abierto", color: "var(--color-error)", fondo: "var(--color-error-suave)" },
  DESCONOCIDO: { texto: "Sin datos", color: "var(--color-tenue)", fondo: "var(--color-fondo)" },
};

const SERVICIOS = [
  { id: "auth", nombre: "Autenticación", detalle: "Node.js, emite el token", base: "MongoDB", y: 30 },
  { id: "stock", nombre: "Stock y catálogo", detalle: "FastAPI, caché e IA", base: "PostgreSQL", y: 140 },
  { id: "pedidos", nombre: "Pedidos", detalle: "FastAPI, compensación", base: "PostgreSQL", y: 250 },
  { id: "auditoria", nombre: "Auditoría", detalle: "FastAPI, cadena de hashes", base: "PostgreSQL", y: 360 },
];

const GATEWAY = ["Valida el token (RS256)", "Aplica permisos por rol", "Filtra por IP", "Circuit Breaker por servicio", "Genera el ID de correlación"];

function Nodo({ x, y, ancho, alto, titulo, detalle, borde = "var(--color-linea)" }) {
  return (
    <g>
      <rect x={x} y={y} width={ancho} height={alto} rx="8" fill="var(--color-superficie)" stroke={borde} strokeWidth="1.5" />
      <text x={x + 14} y={y + 26} fontSize="14" fontWeight="600" fill="var(--color-tinta)">{titulo}</text>
      {detalle && <text x={x + 14} y={y + 46} fontSize="12" fill="var(--color-tenue)">{detalle}</text>}
    </g>
  );
}

function Insignia({ x, y, estado, ancho = 90 }) {
  return (
    <g>
      <rect x={x} y={y} width={ancho} height="20" rx="10" fill={estado.fondo} stroke={estado.color} />
      <text x={x + ancho / 2} y={y + 14} fontSize="11" textAnchor="middle" fontWeight="600" fill={estado.color}>{estado.texto}</text>
    </g>
  );
}

function Diagrama({ circuitos, circuitoPedidos, gatewayVivo }) {
  const pedidosStock = CIRCUITO[circuitoPedidos] ?? CIRCUITO.DESCONOCIDO;
  return (
    <svg viewBox="0 0 920 475" role="img" aria-label="Diagrama de la arquitectura con el estado de cada circuito" className="w-full min-w-[720px]">
      <defs>
        <marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-tenue)" />
        </marker>
      </defs>

      <rect x="480" y="10" width="430" height="455" rx="12" fill="var(--color-fondo)" stroke="var(--color-linea)" strokeDasharray="6 5" />
      <text x="496" y="452" fontSize="12" fill="var(--color-tenue)">Red interna</text>

      <Nodo x={10} y={185} ancho={150} alto={70} titulo="Navegador" detalle="React (esta página)" />
      <line x1="160" y1="220" x2="208" y2="220" stroke="var(--color-tenue)" strokeWidth="1.5" markerEnd="url(#flecha)" />

      <g>
        <rect x="210" y="105" width="220" height="230" rx="8" fill="var(--color-superficie)" stroke={gatewayVivo ? "var(--color-acento)" : "var(--color-error)"} strokeWidth="2" />
        <text x="226" y="133" fontSize="15" fontWeight="600" fill="var(--color-tinta)">API Gateway</text>
        <text x="226" y="152" fontSize="12" fill={gatewayVivo ? "var(--color-acento)" : "var(--color-error)"}>
          {gatewayVivo ? "Punto único de entrada" : "No responde"}
        </text>
        {GATEWAY.map((linea, i) => (
          <text key={linea} x="226" y={184 + i * 26} fontSize="12" fill="var(--color-tenue)">{linea}</text>
        ))}
      </g>

      {SERVICIOS.map((s) => {
        const estado = CIRCUITO[circuitos?.[s.id]] ?? CIRCUITO.DESCONOCIDO;
        const yMedio = s.y + 35;
        return (
          <g key={s.id}>
            <path d={`M430,220 C470,220 470,${yMedio} 508,${yMedio}`} fill="none" stroke={estado.color} strokeWidth="1.5" markerEnd="url(#flecha)" />
            <Nodo x={510} y={s.y} ancho={210} alto={70} titulo={s.nombre} detalle={s.detalle} borde={estado.color} />
            <Insignia x={622} y={s.y - 9} estado={estado} />
            <line x1="720" y1={yMedio} x2="768" y2={yMedio} stroke="var(--color-tenue)" strokeWidth="1.5" markerEnd="url(#flecha)" />
            <rect x="770" y={s.y + 12} width="125" height="46" rx="8" fill="var(--color-superficie)" stroke="var(--color-linea)" />
            <text x="832" y={s.y + 40} fontSize="12" textAnchor="middle" fill="var(--color-tinta)">{s.base}</text>
          </g>
        );
      })}

      <line x1="560" y1="250" x2="560" y2="212" stroke={pedidosStock.color} strokeWidth="2" markerEnd="url(#flecha)" />
      <text x="572" y="226" fontSize="11" fill="var(--color-tinta)">reservar y liberar stock</text>
      <Insignia x={572} y={231} estado={pedidosStock} ancho={84} />
      <line x1="560" y1="320" x2="560" y2="358" stroke="var(--color-tenue)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#flecha)" />
      <text x="566" y="339" fontSize="11" fill="var(--color-tenue)">eventos</text>
    </svg>
  );
}

// Estado real de los circuitos: Gateway (/health) y Pedidos -> Stock (/pedidos/health), cada 2 s
function useSalud() {
  const [salud, setSalud] = useState({ circuitos: null, circuitoPedidos: null, gatewayVivo: true });

  useEffect(() => {
    let activo = true;
    async function consultar() {
      let circuitos = null;
      let gatewayVivo = true;
      try {
        circuitos = (await (await fetch(URL_HEALTH)).json()).circuitos;
      } catch {
        gatewayVivo = false;
      }
      const pedidos = gatewayVivo ? await probar("GET", "/pedidos/health") : null;
      if (activo) setSalud({ circuitos, gatewayVivo, circuitoPedidos: pedidos?.status === 200 ? pedidos.datos.circuito_stock : null });
    }
    consultar();
    const temporizador = setInterval(consultar, 2000);
    return () => { activo = false; clearInterval(temporizador); };
  }, []);

  return salud;
}

export default function EnVivo() {
  const salud = useSalud();
  const { articulos } = useCatalogo();
  const { conSesion } = useCuenta();
  const [intentos, setIntentos] = useState([]);
  const [ocupado, setOcupado] = useState(false);

  function anotar(intento) {
    setIntentos((previos) => [{ ...intento, hora: formatoHora() }, ...previos].slice(0, 8));
  }

  async function consultarCatalogo() {
    setOcupado(true);
    const r = await probar("GET", "/stock/catalogo");
    anotar({ tipo: "Catálogo (Gateway → Stock)", status: r.status, ms: r.ms, texto: r.status === 200 ? "OK" : r.datos?.mensaje ?? "Sin conexión" });
    setOcupado(false);
  }

  async function enviarPedido(token) {
    // El artículo con más stock, para no agotar nada durante la demo
    const articulo = [...articulos].sort((a, b) => b.stock - a.stock)[0];
    if (!articulo) return;
    setOcupado(true);
    const r = await probar("POST", "/pedidos", { token, cuerpo: { nombre_cliente: "Prueba Circuit Breaker", items: [{ articulo_id: articulo.id, cantidad: 1 }] } });
    const texto = r.datos?.estado
      ? `${r.datos.estado}${r.datos.motivo ? `: ${textoMotivo(r.datos.motivo, r.datos.detalle)}` : ""}`
      : r.datos?.mensaje ?? "Sin conexión";
    anotar({ tipo: "Pedido (Pedidos → Stock)", status: r.status, ms: r.ms, texto });
    setOcupado(false);
  }

  return (
    <div className="space-y-6">
      <Panel className="p-4">
        <Diagrama circuitos={salud.circuitos} circuitoPedidos={salud.circuitoPedidos} gatewayVivo={salud.gatewayVivo} />
      </Panel>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-tenue">
        <span className="text-ok">Cerrado: pasa el tráfico</span>
        <span className="text-error">Abierto: 3 fallos seguidos, corta y responde 503 al instante</span>
        <span className="text-espera">Semiabierto: a los 15 s deja pasar una prueba</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Panel className="space-y-4 p-5">
          <h2 className="font-semibold">Circuit Breaker paso a paso</h2>
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            <li>
              Apagar Stock en el servidor:
              <div className="mt-1"><Comando texto="docker compose stop stock-service" /></div>
            </li>
            <li>Consultar el catálogo 3 veces: el circuito del Gateway hacia Stock pasa a <span className="text-error">Abierto</span>.</li>
            <li>Enviar 3 pedidos: Pedidos no logra reservar y su circuito hacia Stock también se abre.</li>
            <li>
              Levantar Stock y esperar 15 s:
              <div className="mt-1"><Comando texto="docker compose start stock-service" /></div>
            </li>
            <li>Consultar de nuevo: la prueba pasa y el circuito vuelve a <span className="text-ok">Cerrado</span>.</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <Boton onClick={consultarCatalogo} disabled={ocupado}>Consultar catálogo</Boton>
            <Boton
              variante="oscuro"
              disabled={ocupado}
              onClick={() => conSesion((s) => enviarPedido(s.token), "Ingresá para enviar pedidos de prueba.")}
            >
              Enviar pedido de prueba
            </Boton>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-semibold">Respuestas</h2>
          {intentos.length === 0 ? (
            <p className="mt-3 text-sm text-tenue">Todavía no se hizo ninguna consulta.</p>
          ) : (
            <table className="tabla mt-3">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Llamada</th>
                  <th>Código</th>
                  <th className="text-right">Tiempo</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {intentos.map((i, n) => (
                  <tr key={`${i.hora}-${n}`}>
                    <td className="text-tenue">{i.hora}</td>
                    <td>{i.tipo}</td>
                    <td className={i.status >= 200 && i.status < 300 ? "text-ok" : "text-error"}>{i.status || "sin conexión"}</td>
                    <td className="text-right font-mono">{i.ms} ms</td>
                    <td>{i.texto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
