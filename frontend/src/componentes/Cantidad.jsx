// Selector de cantidad con tope en el stock disponible
export default function Cantidad({ valor, max, onCambiar, etiqueta }) {
  const boton = "flex size-9 items-center justify-center text-lg text-tinta hover:bg-fondo disabled:cursor-not-allowed disabled:text-tenue/50 disabled:hover:bg-transparent";
  return (
    <div role="group" aria-label={`Cantidad de ${etiqueta}`} className="inline-flex items-center overflow-hidden rounded-md border border-linea bg-superficie">
      <button className={boton} aria-label="Quitar una unidad" onClick={() => onCambiar(valor - 1)}>−</button>
      <span aria-live="polite" className="precio w-9 text-center text-sm font-semibold">{valor}</span>
      <button className={boton} aria-label="Sumar una unidad" disabled={valor >= max} onClick={() => onCambiar(Math.min(valor + 1, max))}>+</button>
    </div>
  );
}
