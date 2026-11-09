import { useEffect, useState } from "react";
import { llamar } from "../api.js";
import { Boton, Panel, Seccion } from "../componentes/ui.jsx";

// /health del Gateway (público): devuelve el estado del Circuit Breaker de cada servicio
const URL_HEALTH = (import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1").replace(/\/api\/v1\/?$/, "") + "/health";

const CIRCUITO = {
  CERRADO: { texto: "Cerrado", color: "var(--color-ok)", fondo: "var(--color-ok-suave)" },
  SEMIABIERTO: { texto: "Semiabierto", color: "var(--color-espera)", fondo: "var(--color-espera-suave)" },
  ABIERTO: { texto: "Abierto", color: "var(--color-error)", fondo: "var(--color-error-suave)" },
  DESCONOCIDO: { texto: "Sin datos", color: "var(--color-tenue)", fondo: "var(--color-fondo)" },
};

// Vista lógica del TP3: un nodo por servicio, cada uno con su base propia
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

function Diagrama({ circuitos, gatewayVivo }) {
  return (
    <svg viewBox="0 0 920 475" role="img" aria-label="Diagrama de la arquitectura con el estado de cada circuito" className="w-full min-w-[720px]">
      <defs>
        <marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-tenue)" />
        </marker>
      </defs>

      {/* Red interna: los servicios y sus bases no se publican fuera de Docker */}
      <rect x="480" y="10" width="430" height="455" rx="12" fill="var(--color-fondo)" stroke="var(--color-linea)" strokeDasharray="6 5" />
      <text x="496" y="452" fontSize="12" fill="var(--color-tenue)">Red interna: solo el Gateway llega a los servicios</text>

      {/* Navegador -> Gateway */}
      <Nodo x={10} y={185} ancho={150} alto={70} titulo="Navegador" detalle="React (esta página)" />
      <line x1="160" y1="220" x2="208" y2="220" stroke="var(--color-tenue)" strokeWidth="1.5" markerEnd="url(#flecha)" />

      {/* Gateway */}
      <g>
        <rect x="210" y="105" width="220" height="230" rx="8" fill="var(--color-superficie)" stroke={gatewayVivo ? "var(--color-acento)" : "var(--color-error)"} strokeWidth="2" />
        <text x="226" y="133" fontSize="15" fontWeight="600" fill="var(--color-tinta)">API Gateway</text>
        <text x="226" y="152" fontSize="12" fill={gatewayVivo ? "var(--color-acento)" : "var(--color-error)"}>
          {gatewayVivo ? "Único punto de entrada" : "No responde"}
        </text>
        {GATEWAY.map((linea, i) => (
          <text key={linea} x="226" y={184 + i * 26} fontSize="12" fill="var(--color-tenue)">{linea}</text>
        ))}
      </g>

      {/* Gateway -> servicios, con el estado del circuito sobre cada enlace */}
      {SERVICIOS.map((s) => {
        const estado = CIRCUITO[circuitos?.[s.id]] ?? CIRCUITO.DESCONOCIDO;
        const yMedio = s.y + 35;
        return (
          <g key={s.id}>
            <path d={`M430,220 C470,220 470,${yMedio} 508,${yMedio}`} fill="none" stroke={estado.color} strokeWidth="1.5" markerEnd="url(#flecha)" />
            <Nodo x={510} y={s.y} ancho={210} alto={70} titulo={s.nombre} detalle={s.detalle} borde={estado.color} />
            <g>
              <rect x={622} y={s.y - 9} width="90" height="20" rx="10" fill={estado.fondo} stroke={estado.color} />
              <text x={667} y={s.y + 5} fontSize="11" textAnchor="middle" fontWeight="600" fill={estado.color}>{estado.texto}</text>
            </g>
            <line x1="720" y1={yMedio} x2="768" y2={yMedio} stroke="var(--color-tenue)" strokeWidth="1.5" markerEnd="url(#flecha)" />
            <rect x="770" y={s.y + 12} width="125" height="46" rx="8" fill="var(--color-superficie)" stroke="var(--color-linea)" />
            <text x="832" y={s.y + 40} fontSize="12" textAnchor="middle" fill="var(--color-tinta)">{s.base}</text>
          </g>
        );
      })}

      {/* Comunicación entre servicios */}
      <line x1="560" y1="250" x2="560" y2="212" stroke="var(--color-acento)" strokeWidth="1.5" markerEnd="url(#flecha)" />
      <text x="566" y="229" fontSize="11" fill="var(--color-acento)">reservar y liberar stock</text>
      <line x1="560" y1="320" x2="560" y2="358" stroke="var(--color-tenue)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#flecha)" />
      <text x="566" y="339" fontSize="11" fill="var(--color-tenue)">eventos (también de Autenticación)</text>
    </svg>
  );
}

export default function Arquitectura() {
  const [salud, setSalud] = useState(null);
  const [gatewayVivo, setGatewayVivo] = useState(true);
  const [intentos, setIntentos] = useState([]);
  const [consultando, setConsultando] = useState(false);

  // Se consulta el estado de los circuitos cada 2 segundos
  useEffect(() => {
    let activo = true;
    async function consultar() {
      try {
        const r = await fetch(URL_HEALTH);
        const datos = await r.json();
        if (activo) { setSalud(datos); setGatewayVivo(true); }
      } catch {
        if (activo) setGatewayVivo(false);
      }
    }
    consultar();
    const temporizador = setInterval(consultar, 2000);
    return () => { activo = false; clearInterval(temporizador); };
  }, []);

  // Llamada de prueba a Stock a través del Gateway, para ver cómo reacciona el circuito
  async function probarStock() {
    setConsultando(true);
    const inicio = performance.now();
    let resultado;
    try {
      const { status } = await llamar("GET", "/stock/catalogo");
      resultado = { status, texto: "Catálogo recibido" };
    } catch (e) {
      resultado = { status: e.status, texto: e.message };
    }
    const ms = Math.round(performance.now() - inicio);
    setIntentos((previos) => [{ ...resultado, ms, hora: new Date().toLocaleTimeString("es-AR") }, ...previos].slice(0, 6));
    setConsultando(false);
  }

  return (
    <Seccion
      titulo="Arquitectura"
      descripcion="Cada pedido entra por el Gateway, que decide si pasa y a qué servicio va. El color de cada enlace es el estado de su Circuit Breaker, consultado en vivo."
    >
      <Panel className="p-4">
        <Diagrama circuitos={salud?.circuitos} gatewayVivo={gatewayVivo} />
      </Panel>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-tenue">
        <span><strong className="font-medium text-ok">Cerrado:</strong> las llamadas pasan.</span>
        <span><strong className="font-medium text-error">Abierto:</strong> tras 3 fallos, rechaza al instante sin llamar al servicio.</span>
        <span><strong className="font-medium text-espera">Semiabierto:</strong> pasados 15 s, deja pasar una llamada de prueba.</span>
      </div>

      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Probar el Circuit Breaker de Stock</h3>
            <p className="mt-1 text-sm text-tenue">Con Stock apagado, consultá varias veces y mirá cuánto tarda cada respuesta.</p>
          </div>
          <Boton onClick={probarStock} disabled={consultando}>{consultando ? "Consultando..." : "Consultar catálogo"}</Boton>
        </div>
        {intentos.length > 0 && (
          <table className="tabla mt-4">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Código</th>
                <th className="text-right">Tiempo</th>
                <th>Respuesta</th>
              </tr>
            </thead>
            <tbody>
              {intentos.map((i, n) => (
                <tr key={`${i.hora}-${n}`}>
                  <td className="text-tenue">{i.hora}</td>
                  <td className={i.status === 200 ? "text-ok" : "text-error"}>{i.status || "sin conexión"}</td>
                  <td className="text-right font-mono">{i.ms} ms</td>
                  <td>{i.texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </Seccion>
  );
}