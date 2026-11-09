import { useEffect, useState } from "react";
import AvisoServicio from "./componentes/AvisoServicio.jsx";
import Guia from "./componentes/Guia.jsx";
import Acceso from "./paginas/Acceso.jsx";
import Admin from "./paginas/Admin.jsx";
import Arquitectura from "./paginas/Arquitectura.jsx";
import Auditoria from "./paginas/Auditoria.jsx";
import Catalogo from "./paginas/Catalogo.jsx";
import Pedidos from "./paginas/Pedidos.jsx";
import { cerrarSesion, leerSesion } from "./sesion.js";

const PESTANAS = [
  { id: "catalogo", nombre: "Catálogo" },
  { id: "pedidos", nombre: "Pedidos" },
  { id: "arquitectura", nombre: "Arquitectura" },
  { id: "auditoria", nombre: "Auditoría", soloAdmin: true },
  { id: "admin", nombre: "Administración", soloAdmin: true },
];

const ROLES = { ADMIN: "Administrador", CLIENTE: "Cliente" };

function leerPreferencia(clave, porDefecto) {
  try {
    const valor = localStorage.getItem(clave);
    return valor === null ? porDefecto : valor === "true";
  } catch {
    return porDefecto;
  }
}

function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, String(valor));
  } catch {
  }
}

export default function App() {
  const [sesion, setSesion] = useState(() => leerSesion());
  const [pestana, setPestana] = useState("catalogo");
  const [verGuia, setVerGuia] = useState(() => leerPreferencia("uchfyd_guia", true));

  useEffect(() => {
    const salir = () => { cerrarSesion(); setSesion(null); };
    window.addEventListener("sesion-vencida", salir);
    return () => window.removeEventListener("sesion-vencida", salir);
  }, []);

  function alternarGuia() {
    guardarPreferencia("uchfyd_guia", !verGuia);
    setVerGuia(!verGuia);
  }

  if (!sesion) {
    return (
      <>
        <AvisoServicio />
        <Acceso onLogin={() => { setSesion(leerSesion()); setPestana("catalogo"); }} />
      </>
    );
  }

  const visibles = PESTANAS.filter((p) => !p.soloAdmin || sesion.rol === "ADMIN");

  return (
    <div className="min-h-screen">
      <AvisoServicio />
      <header className="border-b border-linea bg-superficie">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight">Tienda</h1>
          <div className="flex items-center gap-3 text-sm">
            <span>{sesion.nombre}</span>
            <span className="rounded-full bg-fondo px-2.5 py-0.5 text-xs text-tenue">{ROLES[sesion.rol] ?? sesion.rol}</span>
            <button className="text-tenue hover:text-tinta hover:underline" onClick={() => { cerrarSesion(); setSesion(null); }}>Salir</button>
          </div>
        </div>
        <nav className="mx-auto mt-2 flex max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="-mb-px flex gap-1 overflow-x-auto">
            {visibles.map((p) => (
              <button
                key={p.id}
                onClick={() => setPestana(p.id)}
                aria-current={pestana === p.id ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${pestana === p.id ? "border-acento font-medium text-tinta" : "border-transparent text-tenue hover:text-tinta"}`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
          <button onClick={alternarGuia} aria-pressed={verGuia} className="whitespace-nowrap py-2.5 text-sm text-acento hover:underline">
            {verGuia ? "Ocultar guía" : "Mostrar guía"}
          </button>
        </nav>
      </header>

      <div className={`mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 ${verGuia ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
        <main className="min-w-0">
          {pestana === "catalogo" && <Catalogo sesion={sesion} />}
          {pestana === "pedidos" && <Pedidos sesion={sesion} />}
          {pestana === "arquitectura" && <Arquitectura />}
          {pestana === "auditoria" && sesion.rol === "ADMIN" && <Auditoria sesion={sesion} />}
          {pestana === "admin" && sesion.rol === "ADMIN" && <Admin sesion={sesion} />}
        </main>
        {verGuia && <Guia pestana={pestana} />}
      </div>
    </div>
  );
}
