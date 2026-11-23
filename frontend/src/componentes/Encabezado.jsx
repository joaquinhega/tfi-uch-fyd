import { useEffect, useRef, useState } from "react";
import { LEMA, NEGOCIO } from "../config.js";
import { useCuenta } from "../cuenta.jsx";
import { usePresentacion } from "../presentacion.jsx";
import { ir } from "../ruta.js";
import Cajon from "./Cajon.jsx";
import Guia from "./Guia.jsx";
import { Interruptor } from "./ui.jsx";

function IconoBolsa() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuCuenta({ sesion, admin, onSalir }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    const esc = (e) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [abierto]);

  const item = "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-fondo";

  return (
    <div ref={caja} className="relative">
      <button onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-haspopup="menu" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-fondo">
        <span className="flex size-7 items-center justify-center rounded-full bg-grafito text-xs font-semibold text-white" aria-hidden="true">{sesion.nombre?.[0]?.toUpperCase()}</span>
        <span className="hidden max-w-32 truncate sm:inline">{sesion.nombre}</span>
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-linea bg-superficie p-1.5 shadow-lg">
          <div className="border-b border-linea px-3 pb-2 pt-1">
            <p className="truncate text-sm font-medium">{sesion.email}</p>
            <p className="text-xs text-tenue">{admin ? "Administrador" : "Cliente"}</p>
          </div>
          {!admin && <button role="menuitem" className={`${item} mt-1`} onClick={() => { setAbierto(false); ir("/pedidos"); }}>Mis pedidos</button>}
          <button role="menuitem" className={`${item} mt-1 text-tenue`} onClick={() => { setAbierto(false); onSalir(); }}>Salir</button>
        </div>
      )}
    </div>
  );
}

// Encabezado único para la tienda y el panel: misma marca, mismas herramientas de presentación
export default function Encabezado({ variante = "tienda", ruta, secciones = [], busqueda, onBusqueda, unidades, onAbrirCarrito, onSalir }) {
  const { sesion, pedirAcceso } = useCuenta();
  const { activo: presentacion, alternar } = usePresentacion();
  const [guia, setGuia] = useState(false);
  const admin = variante === "admin";
  const enPresentacion = ruta.startsWith("/presentacion");
  const herramienta = (activa) => `rounded-md px-3 py-2 text-sm font-medium ${activa ? "bg-acento-suave text-acento" : "hover:bg-fondo"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-linea bg-superficie">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <a href={admin ? "#/admin/pedidos" : "#/"} className="flex shrink-0 items-baseline gap-3" aria-label={`${NEGOCIO}, ir al inicio`}>
          <span className="text-2xl font-bold lowercase tracking-tight">{NEGOCIO}<span className="text-acento">.</span></span>
          {admin
            ? <span className="rounded-full bg-grafito px-2.5 py-0.5 text-xs font-semibold text-white">Administración</span>
            : LEMA && <span className="hidden text-sm text-tenue xl:inline">{LEMA}</span>}
        </a>

        {admin ? <div className="flex-1" /> : (
          <form role="search" className="mx-auto min-w-0 max-w-xl flex-1" onSubmit={(e) => { e.preventDefault(); ir("/"); }}>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => { onBusqueda(e.target.value); if (window.location.hash !== "#/" && window.location.hash !== "") ir("/"); }}
              placeholder="Buscar"
              aria-label="Buscar productos"
              className="w-full rounded-md border border-linea bg-fondo px-4 py-2.5 text-sm outline-none focus:border-acento focus:bg-superficie focus:ring-2 focus:ring-acento/20"
            />
          </form>
        )}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {presentacion && (
            <>
              <a href="#/presentacion" aria-current={enPresentacion ? "page" : undefined} className={herramienta(enPresentacion)}>Arquitectura</a>
              <button onClick={() => setGuia(true)} className={herramienta(false)}>Guía</button>
            </>
          )}
          <Interruptor activo={presentacion} onCambiar={alternar} aria-label="Modo presentación" etiqueta={<span className="hidden lg:inline">Presentación</span>} />
          {sesion
            ? <MenuCuenta sesion={sesion} admin={admin} onSalir={onSalir} />
            : <button onClick={() => pedirAcceso()} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-fondo">Ingresar</button>}
          {!admin && (
            <button onClick={onAbrirCarrito} aria-label={`Carrito, ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`} className="relative flex items-center gap-2 rounded-md bg-grafito px-3 py-2 text-sm font-semibold text-white hover:bg-grafito/90">
              <IconoBolsa />
              <span className="hidden sm:inline">Carrito</span>
              {unidades > 0 && (
                <span className="precio flex min-w-5 items-center justify-center rounded-full bg-acento px-1.5 text-xs font-bold leading-5">{unidades}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {admin && (
        <nav aria-label="Secciones de administración" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {secciones.map((s) => {
            const activa = !enPresentacion && s.activa;
            return (
              <a
                key={s.id}
                href={`#/admin/${s.id}`}
                aria-current={activa ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${activa ? "border-acento text-acento" : "border-transparent text-tenue hover:text-tinta"}`}
              >
                {s.nombre}
              </a>
            );
          })}
        </nav>
      )}

      {guia && presentacion && (
        <Cajon titulo="Guía de la demo" ancho="max-w-lg" onCerrar={() => setGuia(false)}>
          <Guia />
        </Cajon>
      )}
    </header>
  );
}
