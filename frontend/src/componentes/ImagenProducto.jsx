import { useState } from "react";
import { IMAGENES_BASE } from "../config.js";

function urlDe(imagen) {
  if (!imagen) return null;
  return /^https?:\/\//.test(imagen) ? imagen : IMAGENES_BASE + imagen;
}

// Foto del producto sobre fondo blanco; si falta o no carga, iniciales sobre el tinte de la categoría
export default function ImagenProducto({ articulo, tinte, className = "" }) {
  const [fallo, setFallo] = useState(false);
  const url = urlDe(articulo.imagen);
  const conFoto = url && !fallo;
  const iniciales = articulo.nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: conFoto ? "#fff" : tinte }}
    >
      {conFoto
        ? <img src={url} alt="" loading="lazy" onError={() => setFallo(true)} className="h-full w-full object-contain p-4" />
        : <span aria-hidden="true" className="text-3xl font-semibold text-tinta/40">{iniciales}</span>}
    </div>
  );
}