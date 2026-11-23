import { useEffect, useState } from "react";
import { llamar } from "../api.js";
import { useCarrito } from "../carrito.jsx";
import { useCatalogo } from "../catalogo.jsx";
import { useConfirmar } from "../confirmacion.jsx";
import { formatoMoneda, textoMotivo } from "../formato.js";
import { usePresentacion } from "../presentacion.jsx";
import { Boton, Campo, Comando, Mensaje } from "./ui.jsx";
import Cajon from "./Cajon.jsx";
import Cantidad from "./Cantidad.jsx";
import EstadoPedido from "./EstadoPedido.jsx";
import ImagenProducto from "./ImagenProducto.jsx";
import Sugerencias from "./Sugerencias.jsx";

const ESPERANDO = ["EN_ESPERA", "PENDIENTE"];

// Modo degradado: consulta el pedido hasta que deje de estar en espera
async function esperarResultado(id, token) {
  for (let intento = 0; intento < 30; intento++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const { datos } = await llamar("GET", `/pedidos/${id}`, { token });
      if (!ESPERANDO.includes(datos.estado)) return datos;
    } catch {
    }
  }
  return null;
}

function describir(pedido, correlacion) {
  const texto = pedido.estado === "ACEPTADO"
    ? `Pedido #${pedido.numero} confirmado por ${formatoMoneda(pedido.total)}. Lo ves en Mis pedidos.`
    : `Pedido #${pedido.numero} rechazado: ${textoMotivo(pedido.motivo, pedido.detalle)}.`;
  return { estado: pedido.estado, texto, correlacion };
}

function Resultado({ resultado }) {
  const { activo: presentacion } = usePresentacion();
  const tono = { ACEPTADO: "ok", RECHAZADO: "error", EN_ESPERA: "espera" }[resultado.estado] ?? "error";

  return (
    <div className="space-y-3">
      <Mensaje tipo={tono}>
        <div className="flex flex-wrap items-center gap-2">
          {resultado.estado && <EstadoPedido estado={resultado.estado} />}
          <span className="text-tinta">{resultado.texto}</span>
        </div>
      </Mensaje>
      {presentacion && resultado.correlacion && (
        <div className="space-y-1.5 text-sm">
          <p className="text-tenue">ID de correlación (seguimiento en los logs)</p>
          <Comando texto={`docker compose logs | Select-String ${resultado.correlacion}`} />
        </div>
      )}
    </div>
  );
}

export default function Carrito({ sesion, onCerrar, onPedirAcceso, onVerPedidos }) {
  const { porId, tinte, recargar } = useCatalogo();
  const { lineas, fijar, vaciar } = useCarrito();
  const confirmarAccion = useConfirmar();
  const [nombre, setNombre] = useState(sesion?.nombre ?? "");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Al ingresar desde el carrito, el nombre del pedido toma el de la cuenta
  useEffect(() => {
    if (sesion?.nombre) setNombre((actual) => actual || sesion.nombre);
  }, [sesion?.nombre]);

  const items = Object.entries(lineas)
    .map(([id, cantidad]) => ({ articulo: porId[id], cantidad }))
    .filter((i) => i.articulo);
  const total = items.reduce((suma, i) => suma + Number(i.articulo.precio) * i.cantidad, 0);
  const excedido = items.some((i) => i.cantidad > i.articulo.stock);

  async function confirmar() {
    const unidades = items.reduce((suma, i) => suma + i.cantidad, 0);
    const ok = await confirmarAccion({
      titulo: "¿Confirmar el pedido?",
      mensaje: `${unidades} ${unidades === 1 ? "unidad" : "unidades"} por ${formatoMoneda(total)}, a nombre de ${nombre.trim()}. Se reserva el stock en el momento.`,
      accion: "Confirmar pedido",
    });
    if (!ok) return;
    setEnviando(true);
    setResultado(null);
    const cuerpo = { nombre_cliente: nombre, items: items.map((i) => ({ articulo_id: i.articulo.id, cantidad: i.cantidad })) };
    try {
      const { status, datos, correlacion } = await llamar("POST", "/pedidos", { token: sesion.token, cuerpo });
      vaciar();
      if (status === 202) {
        setResultado({ estado: "EN_ESPERA", texto: `Pedido #${datos.numero} en proceso. Estamos reservando el stock, puede tardar unos segundos.`, correlacion });
        const final = await esperarResultado(datos.id, sesion.token);
        setResultado(final ? describir(final, correlacion) : { estado: "EN_ESPERA", texto: `Pedido #${datos.numero} sigue en proceso. Podés ver su estado en Mis pedidos.`, correlacion });
      } else {
        setResultado(describir(datos, correlacion));
      }
    } catch (e) {
      if (e.datos?.estado === "RECHAZADO") setResultado(describir(e.datos, e.correlacion));
      else if (e.status !== 0) setResultado({ texto: e.message, correlacion: e.correlacion });
    } finally {
      setEnviando(false);
      recargar();
    }
  }

  const terminado = resultado && resultado.estado !== "EN_ESPERA";
  const vacio = items.length === 0 && !resultado;

  const pie = vacio ? null : resultado ? (
    <div className="flex gap-3">
      <Boton variante="secundario" className="flex-1" onClick={() => (terminado && resultado.estado === "RECHAZADO" ? setResultado(null) : onCerrar())}>
        {resultado.estado === "RECHAZADO" ? "Volver al carrito" : "Seguir comprando"}
      </Boton>
      {resultado.estado !== "RECHAZADO" && <Boton variante="oscuro" className="flex-1" onClick={onVerPedidos}>Ver mis pedidos</Boton>}
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-tenue">Total</span>
        <span className="precio text-2xl font-bold">{formatoMoneda(total)}</span>
      </div>
      {sesion ? (
        <Boton className="w-full" onClick={confirmar} disabled={enviando || excedido || !nombre.trim()}>
          {enviando ? "Procesando..." : "Confirmar pedido"}
        </Boton>
      ) : (
        <Boton variante="oscuro" className="w-full" onClick={onPedirAcceso}>Ingresar para comprar</Boton>
      )}
    </div>
  );

  return (
    <Cajon titulo="Tu carrito" onCerrar={onCerrar} pie={pie}>
      {resultado && <Resultado resultado={resultado} />}

      {vacio && (
        <div className="py-16 text-center">
          <p className="font-semibold">Tu carrito está vacío.</p>
          <p className="mt-1 text-sm text-tenue">Sumá productos del catálogo para armar tu pedido.</p>
          <Boton variante="oscuro" className="mt-5" onClick={onCerrar}>Ver productos</Boton>
        </div>
      )}

      {!resultado && items.length > 0 && (
        <div className="space-y-6">
          <ul className="divide-y divide-linea">
            {items.map(({ articulo, cantidad }) => (
              <li key={articulo.id} className="flex gap-3 py-4 first:pt-0">
                <ImagenProducto articulo={articulo} tinte={tinte(articulo.categoria)} className="size-20 shrink-0 rounded-md [&_img]:p-2" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-semibold leading-snug">{articulo.nombre}</p>
                    <p className="precio text-sm font-semibold">{formatoMoneda(Number(articulo.precio) * cantidad)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Cantidad valor={cantidad} max={articulo.stock} etiqueta={articulo.nombre} onCambiar={(n) => fijar(articulo.id, n)} />
                    <Boton variante="texto" className="text-xs text-tenue" onClick={() => fijar(articulo.id, 0)}>Quitar</Boton>
                  </div>
                  {cantidad > articulo.stock && <p className="text-xs text-error">Solo quedan {articulo.stock}. Ajustá la cantidad.</p>}
                </div>
              </li>
            ))}
          </ul>

          <Sugerencias
            key={items[0].articulo.id}
            articuloId={items[0].articulo.id}
            excluir={items.map((i) => i.articulo.id)}
            titulo="Completá tu compra"
            onAgregar={(id) => fijar(id, 1)}
          />

          {sesion && <Campo etiqueta="Nombre para el pedido" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />}
        </div>
      )}
    </Cajon>
  );
}
