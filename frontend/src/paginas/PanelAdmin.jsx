import AvisoServicio from "../componentes/AvisoServicio.jsx";
import Encabezado from "../componentes/Encabezado.jsx";
import Articulos from "./Articulos.jsx";
import Auditoria from "./Auditoria.jsx";
import Cuentas from "./Cuentas.jsx";
import Pedidos from "./Pedidos.jsx";
import Presentacion from "./Presentacion.jsx";
import Recomendaciones from "./Recomendaciones.jsx";

const SECCIONES = [
  { id: "pedidos", nombre: "Pedidos", Pagina: Pedidos },
  { id: "articulos", nombre: "Artículos", Pagina: Articulos },
  { id: "cuentas", nombre: "Cuentas", Pagina: Cuentas },
  { id: "ia", nombre: "Recomendaciones IA", Pagina: Recomendaciones },
  { id: "auditoria", nombre: "Auditoría", Pagina: Auditoria },
];

// Panel del administrador: mismo encabezado que la tienda, con su propia barra de secciones
export default function PanelAdmin({ sesion, ruta, onSalir }) {
  const [, base, seccion] = ruta.split("/");
  const enPresentacion = base === "presentacion";
  const actual = SECCIONES.find((s) => s.id === seccion) ?? SECCIONES[0];
  const { Pagina } = actual;

  return (
    <div className="min-h-screen">
      <AvisoServicio />
      <Encabezado
        variante="admin"
        ruta={ruta}
        secciones={SECCIONES.map((s) => ({ id: s.id, nombre: s.nombre, activa: s.id === actual.id }))}
        onSalir={onSalir}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {enPresentacion ? <Presentacion seccion={seccion} /> : <Pagina sesion={sesion} />}
      </main>
    </div>
  );
}
