import { Codigo } from "./ui.jsx";

const GUIAS = {
  catalogo: [
    { hacer: "Confirmar un pedido", patron: "API Gateway, reservarStock, ID de correlación" },
    { hacer: "Pedir más unidades que el stock", patron: "Transacción ACID" },
    { hacer: "Se compra junto con (teclado)", patron: "IA: reglas de asociación" },
    { hacer: "Apagar Stock y actualizar 3 veces", comando: "docker compose stop stock-service", patron: "Circuit Breaker" },
  ],
  pedidos: [
    { hacer: "Entrar como cliente y como admin", patron: "JWT, roles" },
    { hacer: "Pedido en espera", comando: "pwsh scripts/demo/07-en-espera.ps1", patron: "Modo degradado" },
  ],
  arquitectura: [
    { hacer: "Apagar Stock y consultar 3 veces", comando: "docker compose stop stock-service", patron: "Circuit Breaker: abierto" },
    { hacer: "Levantar Stock, esperar 15 s y consultar", comando: "docker compose start stock-service", patron: "Circuit Breaker: semiabierto, cerrado" },
  ],
  auditoria: [
    { hacer: "Hacer un pedido y actualizar", patron: "Blockchain: hash anterior" },
    { hacer: "Verificar cadena", patron: "Blockchain: integridad" },
    { hacer: "Adulterar un bloque", comando: "pwsh scripts/demo/08-blockchain.ps1", patron: "Blockchain: inmutabilidad" },
  ],
  admin: [
    { hacer: "Registrar una cuenta y activarla", patron: "Token issuer" },
    { hacer: "Cambiar stock o precio", patron: "Invalidación de caché" },
    { hacer: "Llamar como cliente", comando: "pwsh scripts/demo/02-acceso-rechazado.ps1", patron: "Gateway: 401 / 403" },
  ],
};

export default function Guia({ pestana }) {
  const pasos = GUIAS[pestana];
  if (!pasos) return null;

  return (
    <aside aria-label="Guía" className="rounded-lg border border-linea bg-superficie p-5 lg:sticky lg:top-6">
      <h2 className="font-semibold">Qué probar</h2>
      <ol className="mt-4 space-y-4">
        {pasos.map((paso, i) => (
          <li key={paso.hacer} className="grid grid-cols-[1.5rem_1fr] gap-x-2 text-sm">
            <span className="flex size-6 items-center justify-center rounded-full bg-acento-suave text-xs font-semibold text-acento">{i + 1}</span>
            <div className="space-y-1">
              <p className="font-medium leading-6">{paso.hacer}</p>
              {paso.comando && <p><Codigo>{paso.comando}</Codigo></p>}
              <p className="text-xs text-acento">{paso.patron}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
