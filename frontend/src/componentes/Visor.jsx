import { useRef, useState } from "react";
import { useFocoAtrapado } from "./foco.js";

const MINIMO = 1;
const MAXIMO = 6;
const limitar = (valor) => Math.min(MAXIMO, Math.max(MINIMO, valor));

// Imagen a pantalla completa con zoom (rueda, botones, doble clic) y desplazamiento arrastrando
export default function Visor({ src, titulo, onCerrar }) {
  const panel = useRef(null);
  const arrastre = useRef(null);
  const [escala, setEscala] = useState(1);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  useFocoAtrapado(panel, onCerrar);

  function zoom(factor) {
    setEscala((actual) => {
      const nueva = limitar(actual * factor);
      if (nueva === MINIMO) setPosicion({ x: 0, y: 0 });
      return nueva;
    });
  }

  function reiniciar() {
    setEscala(1);
    setPosicion({ x: 0, y: 0 });
  }

  function alTeclear(e) {
    if (e.key === "+" || e.key === "=") zoom(1.25);
    if (e.key === "-") zoom(0.8);
    if (e.key === "0") reiniciar();
  }

  function empezar(e) {
    if (escala === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX - posicion.x, y: e.clientY - posicion.y };
  }

  function mover(e) {
    if (!arrastre.current) return;
    setPosicion({ x: e.clientX - arrastre.current.x, y: e.clientY - arrastre.current.y });
  }

  const boton = "rounded-md px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40";

  return (
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} onKeyDown={alTeclear} className="modal-panel fixed inset-0 z-50 flex flex-col bg-grafito/95 outline-none">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white">
        <h2 className="font-semibold">{titulo}</h2>
        <div className="flex items-center gap-1">
          <button className={boton} onClick={() => zoom(0.8)} disabled={escala === MINIMO} aria-label="Alejar">−</button>
          <span className="w-14 text-center text-sm tabular-nums" aria-live="polite">{Math.round(escala * 100)} %</span>
          <button className={boton} onClick={() => zoom(1.25)} disabled={escala === MAXIMO} aria-label="Acercar">+</button>
          <button className={boton} onClick={reiniciar}>Ajustar</button>
          <button className={`${boton} ml-2 border border-white/30`} onClick={onCerrar}>Cerrar</button>
        </div>
      </header>

      <div
        className={`relative flex-1 touch-none overflow-hidden ${escala > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onWheel={(e) => zoom(e.deltaY < 0 ? 1.15 : 0.87)}
        onDoubleClick={() => (escala > 1 ? reiniciar() : zoom(2.5))}
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={() => { arrastre.current = null; }}
        onPointerCancel={() => { arrastre.current = null; }}
      >
        <img
          src={src}
          alt={titulo}
          draggable={false}
          className="absolute inset-0 m-auto max-h-full max-w-full select-none bg-white p-2"
          style={{ transform: `translate(${posicion.x}px, ${posicion.y}px) scale(${escala})`, transition: arrastre.current ? "none" : "transform 120ms ease-out" }}
        />
      </div>

      <p className="px-4 py-2 text-center text-xs text-white/60">Rueda o + / − para el zoom · doble clic para acercar · arrastrar para moverse · Esc para cerrar</p>
    </div>
  );
}
