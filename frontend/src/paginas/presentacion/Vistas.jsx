import { useState } from "react";
import { Boton, Panel } from "../../componentes/ui.jsx";
import Visor from "../../componentes/Visor.jsx";

// Las tres vistas del TP3 corregido (sección 7), con lo que hay que decir y dónde está en el código
const VISTAS = [
  {
    id: "logica",
    nombre: "Lógica",
    titulo: "Vista lógica de servicios",
    fuente: "TP3, 7.1 · Figura 1",
    proposito: "Cómo se organiza el sistema en servicios, qué ofrece cada uno, por qué contrato se usa y cómo entra el tráfico por el API Gateway.",
    claves: [
      "Tres servicios con contrato propio: auth-api, stock-api y pedidos-api.",
      "El Cliente Web es consumidor: solo conoce al API Gateway.",
      "El Gateway valida el token y el rol, filtra por IP y enruta a cada contrato.",
      "Pedidos usa stock-api para reservar y liberar stock.",
      "Todos envían registros al registro de eventos (Log Aggregation).",
    ],
    codigo: ["frontend/src/api.js", "gateway/app/rutas.py", "pedidos-service/app/cliente_stock.py"],
  },
  {
    id: "comportamiento",
    nombre: "Comportamiento",
    titulo: "Vista de comportamiento: compra por contrato",
    fuente: "TP3, 7.3 · Figura 3",
    proposito: "Una compra de punta a punta: login, emisión del token, validación en el Gateway, reserva de stock, compensación ante falla y resolución del pedido.",
    claves: [
      "Auth emite un JWT firmado; el Gateway lo valida sin consultar a Auth.",
      "Token inválido, rol insuficiente o IP bloqueada: rechazo 401 o 403 en el Gateway.",
      "Stock bloquea la fila del artículo dentro de una transacción: no hay sobreventa.",
      "Si la espera supera 2 s, el pedido queda EN ESPERA y se resuelve en orden de llegada.",
      "Si el pedido falla después de reservar, Pedidos compensa con liberarStock.",
    ],
    codigo: ["gateway/app/seguridad.py", "stock-service/app/services/reserva_service.py", "pedidos-service/app/services/pedido_service.py"],
  },
  {
    id: "fisica",
    nombre: "Física",
    titulo: "Vista física de despliegue",
    fuente: "TP3, 7.2 · Figura 2",
    proposito: "La topología de despliegue y los canales entre el navegador, el Gateway y cada servicio, con una única instancia por servicio.",
    claves: [
      "El API Gateway está en un nodo propio y es la única entrada expuesta.",
      "Servidor A: Autenticación con MongoDB.",
      "Servidor B: Stock y Pedidos como procesos separados, cada uno con su PostgreSQL (se asume por costo, D3).",
      "Sin Service Registry ni ESB: el Gateway conoce cada servicio por configuración.",
    ],
    diferencias: [
      "Stock y Pedidos se implementaron en FastAPI (Python) en lugar de NestJS.",
      "Se sumó el servicio de Auditoría (blockchain) con su propia PostgreSQL.",
      "En Docker Compose, los servicios están en una red interna: solo el Gateway y el frontend publican puertos.",
    ],
    codigo: ["docker-compose.yml"],
  },
];

export default function Vistas() {
  const [id, setId] = useState(VISTAS[0].id);
  const [ampliada, setAmpliada] = useState(false);
  const vista = VISTAS.find((v) => v.id === id);
  const imagen = `/vistas/${vista.id}.png`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vistas de la arquitectura">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={v.id === id}
            onClick={() => setId(v.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${v.id === id ? "border-grafito bg-grafito text-white" : "border-linea bg-superficie hover:border-tenue"}`}
          >
            Vista {v.nombre.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="relative p-3">
          <button onClick={() => setAmpliada(true)} className="block w-full cursor-zoom-in" aria-label={`Ampliar ${vista.titulo}`}>
            <img src={imagen} alt={vista.titulo} className="mx-auto max-h-[75vh] w-auto" />
          </button>
          <Boton variante="oscuro" className="absolute right-4 top-4 py-1.5" onClick={() => setAmpliada(true)}>Ampliar</Boton>
        </Panel>

        <aside className="space-y-5 rounded-lg border border-linea bg-superficie p-5 xl:self-start">
          <div>
            <p className="text-xs text-tenue">{vista.fuente}</p>
            <h2 className="mt-1 font-semibold">{vista.titulo}</h2>
            <p className="mt-2 text-sm text-tenue">{vista.proposito}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Qué explicar</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
              {vista.claves.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>

          {vista.diferencias && (
            <div>
              <h3 className="text-sm font-semibold">Diferencias con lo implementado</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
                {vista.diferencias.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold">Dónde está en el código</h3>
            <ul className="mt-2 space-y-1">
              {vista.codigo.map((c) => <li key={c} className="font-mono text-xs text-tenue">{c}</li>)}
            </ul>
          </div>
        </aside>
      </div>

      {ampliada && <Visor src={imagen} titulo={vista.titulo} onCerrar={() => setAmpliada(false)} />}
    </div>
  );
}
