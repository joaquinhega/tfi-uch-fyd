import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { useCatalogo } from "../catalogo.jsx";
import { Boton, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";
import ImagenProducto from "../componentes/ImagenProducto.jsx";

// Auditoría de la IA: qué sugiere la tienda para cada artículo y con qué evidencia
export default function Recomendaciones() {
  const { articulos, tinte } = useCatalogo();
  const [reglas, setReglas] = useState(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const respuestas = await Promise.all(articulos.map((a) => llamar("GET", `/stock/catalogo/${a.id}/recomendaciones`)));
      setReglas(Object.fromEntries(articulos.map((a, i) => [a.id, respuestas[i].datos])));
    } catch (e) {
      if (e.status !== 0) setError(e.message);
    }
  }, [articulos]);

  useEffect(() => { if (articulos.length > 0) cargar(); }, [articulos, cargar]);

  // soporte = pedidos juntos / pedidos analizados
  const todas = Object.values(reglas ?? {}).flat();
  const analizados = todas.length > 0 ? Math.max(...todas.map((r) => Math.round(r.veces / r.soporte))) : 0;
  const sinSugerencias = articulos.filter((a) => reglas && reglas[a.id]?.length === 0);

  return (
    <Seccion titulo="Recomendaciones IA" acciones={<Boton variante="secundario" onClick={cargar}>Actualizar</Boton>}>
      <Mensaje>{error}</Mensaje>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5">
          <p className="text-sm text-tenue">Pedidos analizados</p>
          <p className="mt-1 text-2xl font-bold">{reglas && analizados ? analizados : "—"}</p>
          <p className="mt-1 text-xs text-tenue">Solo pedidos aceptados con su reserva vigente.</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-tenue">Reglas activas</p>
          <p className="mt-1 text-2xl font-bold">{reglas ? todas.length : "—"}</p>
          <p className="mt-1 text-xs text-tenue">Hasta 3 sugerencias por artículo.</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-tenue">Artículos sin sugerencias</p>
          <p className="mt-1 text-2xl font-bold">{reglas ? sinSugerencias.length : "—"}</p>
          <p className="mt-1 text-xs text-tenue">No hay compras conjuntas suficientes.</p>
        </Panel>
      </div>

      <Panel>
        <table className="tabla">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Se sugiere</th>
              <th className="text-right">Confianza</th>
              <th className="text-right">Lift</th>
              <th className="text-right">Pedidos juntos</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const lista = reglas?.[a.id] ?? [];
              const filas = lista.length > 0 ? lista : [null];
              return filas.map((r, i) => (
                <tr key={`${a.id}-${i}`} className="align-middle">
                  {i === 0 && (
                    <td rowSpan={filas.length}>
                      <div className="flex items-center gap-3">
                        <ImagenProducto articulo={a} tinte={tinte(a.categoria)} className="size-10 shrink-0 rounded-md [&_img]:p-1" />
                        <span className="font-medium">{a.nombre}</span>
                      </div>
                    </td>
                  )}
                  {r ? (
                    <>
                      <td>{r.nombre}</td>
                      <td className="text-right">{Math.round(r.confianza * 100)} %</td>
                      <td className="text-right font-mono">{r.lift}</td>
                      <td className="text-right">{r.veces}</td>
                    </>
                  ) : (
                    <td colSpan={4} className="text-tenue">{reglas ? "Sin sugerencias" : "Cargando..."}</td>
                  )}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-3 p-5 text-sm">
          <h3 className="font-semibold">Cómo decide</h3>
          <p>Reglas de asociación sobre los pedidos anteriores: si A y B aparecen juntos más de lo esperado por azar, al ver A se sugiere B.</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Confianza:</strong> de los pedidos con A, qué parte también llevó B. Se exige al menos 10 %.</li>
            <li><strong>Lift:</strong> cuánto más probable es B cuando está A. Mayor que 1 indica relación real, no casualidad.</li>
            <li><strong>Soporte:</strong> qué parte de todos los pedidos tiene a A y B juntos.</li>
            <li>No sugiere nada hasta tener 20 pedidos, para no recomendar con poca evidencia.</li>
          </ul>
          <p className="text-tenue">Se calcula en el servicio de Stock (<span className="font-mono text-xs">stock-service/app/ia.py</span>), sin servicios externos ni costo adicional.</p>
        </Panel>
        <Panel className="space-y-3 p-5 text-sm">
          <h3 className="font-semibold">Cómo mejorarla</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Medir si funciona: cuántas sugerencias terminan en el carrito.</li>
            <li>Usar una ventana de tiempo (por ejemplo, los últimos 6 meses) para que las compras viejas no pesen igual que las nuevas.</li>
            <li>Excluir los pedidos de prueba, que distorsionan las reglas.</li>
            <li>Para los artículos sin sugerencias, recomendar por categoría hasta que haya compras conjuntas.</li>
          </ul>
        </Panel>
      </div>
    </Seccion>
  );
}
