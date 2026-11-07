import { useEffect, useState } from "react";
import AvisoServicio from "./componentes/AvisoServicio.jsx";
import Acceso from "./paginas/Acceso.jsx";
import { cerrarSesion, leerSesion } from "./sesion.js";

const PESTANAS = [
  { id: "catalogo", nombre: "Catálogo" },
  { id: "pedidos", nombre: "Mis pedidos" },
  { id: "admin", nombre: "Administración", soloAdmin: true },
];

function Pendiente({ nombre }) {
  return <p className="text-slate-500">{nombre}: se completa en el paso 5.2.</p>;
}

export default function App() {
  const [sesion, setSesion] = useState(() => leerSesion());
  const [pestana, setPestana] = useState("catalogo");

  // Si el Gateway responde 401 con un token (vencido o inválido), se cierra la sesión
  useEffect(() => {
    const salir = () => { cerrarSesion(); setSesion(null); };
    window.addEventListener("sesion-vencida", salir);
    return () => window.removeEventListener("sesion-vencida", salir);
  }, []);

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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <AvisoServicio />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold">UCH-FyD</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">{sesion.nombre} · {sesion.rol}</span>
            <button className="text-slate-600 underline" onClick={() => { cerrarSesion(); setSesion(null); }}>Salir</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4">
          {visibles.map((p) => (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={`border-b-2 px-3 py-2 text-sm ${pestana === p.id ? "border-slate-800 font-medium" : "border-transparent text-slate-500"}`}
            >
              {p.nombre}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {pestana === "catalogo" && <Pendiente nombre="Catálogo" />}
        {pestana === "pedidos" && <Pendiente nombre="Mis pedidos" />}
        {pestana === "admin" && sesion.rol === "ADMIN" && <Pendiente nombre="Administración" />}
      </main>
    </div>
  );
}