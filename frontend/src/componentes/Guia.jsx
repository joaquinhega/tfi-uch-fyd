import { Codigo } from "./ui.jsx";

// Panel guía: qué probar en cada pantalla, qué patrón se ve y qué resultado esperar
const GUIAS = {
  catalogo: {
    titulo: "Qué probar en el catálogo",
    pasos: [
      {
        hacer: "Elegí cantidades y confirmá el pedido.",
        esperado: "El pedido queda Aceptado y el stock baja. Se muestra el ID de correlación para buscarlo en los logs.",
        patron: "API Gateway + reservarStock",
      },
      {
        hacer: "Pedí más unidades de las que hay en stock.",
        esperado: "El pedido se rechaza por falta de stock y el stock no cambia.",
        patron: "Transacción en Stock",
      },
      {
        hacer: "Abrí \"Se compra junto con\" en el teclado.",
        esperado: "Sugiere el mouse y el monitor, con el porcentaje de pedidos en que aparecen juntos.",
        patron: "IA: reglas de asociación",
      },
      {
        hacer: "Apagá Stock y tocá Actualizar tres veces.",
        comando: "docker compose stop stock-service",
        esperado: "Aparece el aviso de servicio no disponible. Desde el tercer intento responde al instante: el circuito se abrió.",
        patron: "Circuit Breaker",
      },
    ],
  },
  pedidos: {
    titulo: "Qué probar en pedidos",
    pasos: [
      {
        hacer: "Entrá como cliente y después como administrador.",
        esperado: "El cliente ve solo sus pedidos; el administrador ve los de todos. Lo decide el rol del token.",
        patron: "Access token (JWT)",
      },
      {
        hacer: "Corré el script de modo degradado y mirá esta pantalla.",
        comando: "pwsh scripts/demo/07-en-espera.ps1",
        esperado: "El pedido aparece En espera y pasa solo a Aceptado cuando Stock libera el bloqueo.",
        patron: "Modo degradado (plazo blando 2 s)",
      },
    ],
  },
  admin: {
    titulo: "Qué probar en administración",
    pasos: [
      {
        hacer: "Registrá una cuenta nueva en una ventana privada e intentá ingresar.",
        esperado: "El ingreso se rechaza hasta que la actives desde la lista de cuentas.",
        patron: "Autenticación (token issuer)",
      },
      {
        hacer: "Cambiá el stock o el precio de un artículo.",
        esperado: "El catálogo muestra el valor nuevo al instante, porque el cambio borra la caché.",
        patron: "Caché con invalidación",
      },
      {
        hacer: "Entrá como cliente.",
        comando: "pwsh scripts/demo/02-acceso-rechazado.ps1",
        esperado: "Esta pestaña no aparece. Si alguien llama a la API directo, el Gateway responde 403 porque el rol del token no alcanza.",
        patron: "API Gateway (políticas por rol)",
      },
    ],
  },
  arquitectura: {
    titulo: "Qué probar en la arquitectura",
    pasos: [
      {
        hacer: "Seguí el recorrido de un pedido en el diagrama.",
        esperado: "Todo entra por el Gateway; cada servicio usa solo su propia base de datos.",
        patron: "SOA + API Gateway",
      },
      {
        hacer: "Apagá Stock y consultá el catálogo tres veces desde esta pantalla.",
        comando: "docker compose stop stock-service",
        esperado: "El circuito de Stock pasa a Abierto; Autenticación y Pedidos siguen en Cerrado.",
        patron: "Circuit Breaker",
      },
      {
        hacer: "Levantá Stock, esperá 15 segundos y volvé a consultar.",
        comando: "docker compose start stock-service",
        esperado: "La consulta de prueba funciona y el circuito vuelve a Cerrado.",
        patron: "Circuit Breaker (semiabierto)",
      },
    ],
  },
  auditoria: {
    titulo: "Qué probar en la auditoría",
    pasos: [
      {
        hacer: "Hacé un pedido y volvé a esta pantalla.",
        esperado: "Aparece un bloque nuevo cuyo hash anterior es el hash del bloque previo.",
        patron: "Blockchain (cadena de hashes)",
      },
      {
        hacer: "Tocá Verificar cadena.",
        esperado: "La cadena es válida: ningún bloque fue modificado.",
        patron: "Blockchain (verificación)",
      },
      {
        hacer: "Corré el script que adultera un bloque en la base y verificá otra vez.",
        comando: "pwsh scripts/demo/08-blockchain.ps1",
        esperado: "La verificación señala el bloque exacto que se modificó.",
        patron: "Blockchain (inmutabilidad)",
      },
    ],
  },
};

export default function Guia({ pestana }) {
  const guia = GUIAS[pestana];
  if (!guia) return null;

  return (
    <aside aria-label="Guía de la demo" className="rounded-lg border border-linea bg-superficie p-5 lg:sticky lg:top-6">
      <h2 className="font-semibold">{guia.titulo}</h2>
      <ol className="mt-4 space-y-5">
        {guia.pasos.map((paso, i) => (
          <li key={paso.hacer} className="grid grid-cols-[1.5rem_1fr] gap-x-2 text-sm">
            <span className="flex size-6 items-center justify-center rounded-full bg-acento-suave text-xs font-semibold text-acento">{i + 1}</span>
            <div className="space-y-1.5">
              <p className="font-medium leading-6">{paso.hacer}</p>
              {paso.comando && <p><Codigo>{paso.comando}</Codigo></p>}
              <p className="text-tenue">{paso.esperado}</p>
              <p className="text-xs text-acento">{paso.patron}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}