import { useEffect, useState } from "react";
import { CarritoProvider, useCarrito } from "./carrito.jsx";
import { CatalogoProvider } from "./catalogo.jsx";
import { ConfirmacionProvider, useConfirmar } from "./confirmacion.jsx";
import { CuentaProvider, useCuenta } from "./cuenta.jsx";
import { PresentacionProvider, usePresentacion } from "./presentacion.jsx";
import AvisoServicio from "./componentes/AvisoServicio.jsx";
import Carrito from "./componentes/Carrito.jsx";
import Encabezado from "./componentes/Encabezado.jsx";
import { Boton } from "./componentes/ui.jsx";
import MisPedidos from "./paginas/MisPedidos.jsx";
import PanelAdmin from "./paginas/PanelAdmin.jsx";
import Presentacion from "./paginas/Presentacion.jsx";
import Tienda from "./paginas/Tienda.jsx";
import { LEMA, NEGOCIO } from "./config.js";
import { ir, useRuta } from "./ruta.js";

function RequiereSesion({ texto, onIngresar }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-linea bg-superficie px-6 py-12 text-center">
      <p className="font-semibold">{texto}</p>
      <Boton variante="oscuro" className="mt-5" onClick={onIngresar}>Ingresar</Boton>
    </div>
  );
}

function Aplicacion() {
  const ruta = useRuta();
  const { unidades, vaciar } = useCarrito();
  const { sesion, pedirAcceso, salir: cerrarSesion } = useCuenta();
  const { activo: presentacion } = usePresentacion();
  const confirmar = useConfirmar();
  const [carrito, setCarrito] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const esAdmin = sesion?.rol === "ADMIN";
  const enPanel = ruta.startsWith("/admin");
  const enPresentacion = ruta.startsWith("/presentacion");

  async function salir() {
    const ok = await confirmar({
      titulo: "¿Cerrar sesión?",
      mensaje: !esAdmin && unidades > 0 ? "Se va a vaciar tu carrito. Para volver a comprar vas a tener que ingresar de nuevo." : "Para volver a operar vas a tener que ingresar de nuevo.",
      accion: "Cerrar sesión",
    });
    if (!ok) return;
    cerrarSesion();
    vaciar();
    setCarrito(false);
    ir("/");
  }

  // El administrador trabaja en su panel; el cliente no entra al panel
  useEffect(() => {
    if (esAdmin && !enPanel && !enPresentacion) ir("/admin/pedidos");
    if (enPanel && sesion && !esAdmin) ir("/");
  }, [esAdmin, enPanel, enPresentacion, sesion]);

  // Con el modo presentación apagado, el apartado no existe
  useEffect(() => {
    if (enPresentacion && !presentacion) ir(esAdmin ? "/admin/pedidos" : "/");
  }, [enPresentacion, presentacion, esAdmin]);

  if (esAdmin) return <PanelAdmin sesion={sesion} ruta={ruta} onSalir={salir} />;

  let pagina;
  if (ruta === "/pedidos") {
    pagina = sesion ? <MisPedidos sesion={sesion} /> : <RequiereSesion texto="Ingresá para ver tus pedidos." onIngresar={() => pedirAcceso()} />;
  } else if (enPanel) {
    pagina = <RequiereSesion texto="El panel es solo para administradores." onIngresar={() => pedirAcceso()} />;
  } else if (enPresentacion && presentacion) {
    pagina = <Presentacion seccion={ruta.split("/")[2]} />;
  } else {
    pagina = <Tienda busqueda={busqueda} onBusqueda={setBusqueda} />;
  }

  return (
    <div className="min-h-screen">
      <AvisoServicio />
      <Encabezado
        ruta={ruta}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        unidades={unidades}
        onAbrirCarrito={() => setCarrito(true)}
        onSalir={salir}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{pagina}</main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 text-sm text-tenue sm:px-6">
        {NEGOCIO}{LEMA && ` · ${LEMA}`}
      </footer>

      {carrito && (
        <Carrito
          sesion={sesion}
          onCerrar={() => setCarrito(false)}
          onPedirAcceso={() => pedirAcceso("Ingresá para confirmar tu pedido.")}
          onVerPedidos={() => { setCarrito(false); ir("/pedidos"); }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <PresentacionProvider>
      <ConfirmacionProvider>
        <CarritoProvider>
          <CatalogoProvider>
            <CuentaProvider>
              <Aplicacion />
            </CuentaProvider>
          </CatalogoProvider>
        </CarritoProvider>
      </ConfirmacionProvider>
    </PresentacionProvider>
  );
}
