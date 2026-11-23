import { useEffect, useRef } from "react";

// Diálogos abiertos: solo el de arriba responde al teclado
const pila = [];

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Foco atrapado dentro del diálogo, Esc para cerrar y devolución del foco al cerrar
export function useFocoAtrapado(panel, onCerrar) {
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    const propio = {};
    pila.push(propio);
    const previo = document.activeElement;

    const alTeclear = (e) => {
      if (pila[pila.length - 1] !== propio) return;
      if (e.key === "Escape") cerrar.current();
      if (e.key !== "Tab") return;
      const lista = [...(panel.current?.querySelectorAll(ENFOCABLES) ?? [])];
      if (lista.length === 0) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };

    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      pila.splice(pila.indexOf(propio), 1);
      document.removeEventListener("keydown", alTeclear);
      if (pila.length === 0) document.body.style.overflow = "";
      previo?.focus?.();
    };
  }, [panel]);
}
