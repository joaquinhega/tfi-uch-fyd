import EnVivo from "./presentacion/EnVivo.jsx";
import Pruebas from "./presentacion/Pruebas.jsx";
import Vistas from "./presentacion/Vistas.jsx";

const SECCIONES = [
  { id: "vistas", nombre: "Vistas", descripcion: "Lógica, comportamiento y física del TP3", Pagina: Vistas },
  { id: "en-vivo", nombre: "En vivo", descripcion: "Estado real de cada servicio y circuito", Pagina: EnVivo },
  { id: "pruebas", nombre: "Pruebas", descripcion: "Lo que no se ve usando la tienda", Pagina: Pruebas },
];

// Apartado de la exposición: solo existe con el modo presentación encendido
export default function Presentacion({ seccion }) {
  const actual = SECCIONES.find((s) => s.id === seccion) ?? SECCIONES[0];
  const { Pagina } = actual;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-acento">Modo presentación</p>
        <h1 className="text-2xl font-semibold tracking-tight">Arquitectura del sistema</h1>
      </div>

      <nav aria-label="Secciones de la presentación" className="grid gap-2 sm:grid-cols-3">
        {SECCIONES.map((s, i) => {
          const activa = s.id === actual.id;
          return (
            <a
              key={s.id}
              href={`#/presentacion/${s.id}`}
              aria-current={activa ? "page" : undefined}
              className={`rounded-lg border px-4 py-3 transition-colors ${activa ? "border-acento bg-acento-suave" : "border-linea bg-superficie hover:border-tenue"}`}
            >
              <span className={`block font-semibold ${activa ? "text-acento" : ""}`}>{i + 1}. {s.nombre}</span>
              <span className="block text-sm text-tenue">{s.descripcion}</span>
            </a>
          );
        })}
      </nav>

      <Pagina />
    </div>
  );
}
