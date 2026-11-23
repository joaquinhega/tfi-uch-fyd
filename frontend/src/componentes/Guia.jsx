import { Comando } from "./ui.jsx";

// Guion de la exposición, en el orden de la consigna del TFI y del TP3
const GUION = [
  {
    titulo: "1. Arquitectura",
    donde: "Arquitectura → Vistas",
    pasos: [
      { hacer: "Vista lógica: 3 servicios con contrato y el Gateway como única entrada", patron: "SOA · API Gateway" },
      { hacer: "Vista de comportamiento: una compra de punta a punta", patron: "Token · reserva · compensación" },
      { hacer: "Vista física: nodos, bases separadas y diferencias con lo implementado", patron: "Despliegue · D3" },
    ],
  },
  {
    titulo: "2. Flujo del cliente",
    donde: "Pestaña del cliente",
    pasos: [
      { hacer: "Agregar al carrito sin sesión: pide ingresar", patron: "Access token obligatorio" },
      { hacer: "Ingresar como cliente", patron: "Auth emite el JWT (RS256)" },
      { hacer: "Abrir un producto: «Se compra junto con»", patron: "IA: reglas de asociación" },
      { hacer: "Confirmar el pedido y mostrar el ID de correlación", patron: "Gateway → Pedidos → Stock · Log Aggregation" },
      { hacer: "Pedir más unidades que el stock", patron: "Transacción en Stock: rechazo" },
    ],
  },
  {
    titulo: "3. Flujo del administrador",
    donde: "Pestaña del administrador",
    pasos: [
      { hacer: "Pedidos: el pedido del cliente aparece aceptado", patron: "pedidos-api" },
      { hacer: "Cuentas: activar la cuenta registrada", patron: "auth-api · evento auditado" },
      { hacer: "Artículos: cambiar stock o precio", patron: "stock-api · invalidación de caché" },
      { hacer: "Recomendaciones IA: auditar las reglas que usa la tienda", patron: "IA explicable" },
      { hacer: "Auditoría: verificar la cadena", patron: "Blockchain: integridad" },
    ],
  },
  {
    titulo: "4. Lo que no se ve usando la tienda",
    donde: "Arquitectura → En vivo y Pruebas",
    pasos: [
      { hacer: "Muchos pedidos al mismo producto", patron: "D1: sin sobreventa" },
      { hacer: "Ataques al Gateway: sin token, firma alterada, token falsificado", patron: "401 / 403 / 404" },
      { hacer: "Apagar Stock y consultar 3 veces", comando: "docker compose stop stock-service", patron: "Circuit Breaker" },
      { hacer: "Pedido en espera y compensación", comando: "pwsh scripts/demo/07-en-espera.ps1", patron: "Modo degradado · liberarStock" },
    ],
  },
];

export default function Guia() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-tenue">Conviene tener abiertas dos pestañas: una con la sesión del cliente y otra con la del administrador. Cada pestaña guarda su propia sesión.</p>
      {GUION.map((bloque) => (
        <section key={bloque.titulo} className="space-y-3">
          <div>
            <h3 className="font-semibold">{bloque.titulo}</h3>
            <p className="text-xs text-tenue">{bloque.donde}</p>
          </div>
          <ol className="space-y-3">
            {bloque.pasos.map((paso) => (
              <li key={paso.hacer} className="border-l-2 border-acento-suave pl-3 text-sm">
                <p className="font-medium">{paso.hacer}</p>
                {paso.comando && <div className="mt-1"><Comando texto={paso.comando} /></div>}
                <p className="text-xs text-acento">{paso.patron}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
