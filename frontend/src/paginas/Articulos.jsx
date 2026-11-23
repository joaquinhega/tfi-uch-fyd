import { useCallback, useEffect, useState } from "react";
import { llamar } from "../api.js";
import { useCatalogo } from "../catalogo.jsx";
import { useConfirmar } from "../confirmacion.jsx";
import { formatoMoneda } from "../formato.js";
import { Boton, Campo, Mensaje, Panel, Seccion } from "../componentes/ui.jsx";
import Cajon from "../componentes/Cajon.jsx";
import ImagenProducto from "../componentes/ImagenProducto.jsx";

const VACIO = { codigo: "", nombre: "", categoria: "", descripcion: "", imagen: "", stock: "", precio: "" };

// Alta y edición de un artículo
function FormularioArticulo({ sesion, articulo, categorias, onGuardado, onCerrar }) {
  const editando = Boolean(articulo);
  const [datos, setDatos] = useState(editando ? { ...VACIO, ...articulo, imagen: articulo.imagen ?? "" } : VACIO);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const confirmar = useConfirmar();

  const campo = (nombre) => ({ value: datos[nombre], onChange: (e) => setDatos({ ...datos, [nombre]: e.target.value }) });

  async function guardar(e) {
    e.preventDefault();
    const ok = await confirmar({
      titulo: editando ? "¿Guardar los cambios?" : "¿Crear el artículo?",
      mensaje: `${datos.nombre}: ${formatoMoneda(datos.precio)}, stock ${datos.stock}. Se publica en la tienda al instante.`,
      accion: editando ? "Guardar" : "Crear",
    });
    if (!ok) return;
    setError("");
    setEnviando(true);
    const cuerpo = {
      nombre: datos.nombre,
      categoria: datos.categoria,
      descripcion: datos.descripcion,
      imagen: datos.imagen,
      stock: Number.parseInt(datos.stock, 10),
      precio: Number(datos.precio),
    };
    try {
      if (editando) await llamar("PUT", `/stock/articulos/${articulo.id}`, { token: sesion.token, cuerpo });
      else await llamar("POST", "/stock/articulos", { token: sesion.token, cuerpo: { ...cuerpo, codigo: datos.codigo } });
      onGuardado(`${datos.nombre} ${editando ? "guardado" : "creado"}.`);
    } catch (err) {
      if (err.status !== 0) setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cajon titulo={editando ? "Editar artículo" : "Nuevo artículo"} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="space-y-4">
        <Campo etiqueta="Código" maxLength={20} disabled={editando} required {...campo("codigo")} />
        <Campo etiqueta="Nombre" maxLength={120} required {...campo("nombre")} />
        <Campo etiqueta="Categoría" maxLength={40} list="categorias-existentes" required {...campo("categoria")} />
        <datalist id="categorias-existentes">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
        <label className="block text-sm">
          <span className="font-medium">Descripción</span>
          <textarea rows={3} maxLength={400} className="mt-1.5 w-full rounded-md border border-linea bg-superficie px-3 py-2.5 outline-none focus:border-acento focus:ring-2 focus:ring-acento/20" {...campo("descripcion")} />
        </label>
        <Campo etiqueta="Imagen" maxLength={200} ayuda="Nombre del archivo en la carpeta de imágenes, o una URL completa." {...campo("imagen")} />
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Precio" type="number" min="0.01" step="0.01" required {...campo("precio")} />
          <Campo etiqueta="Stock" type="number" min="0" required {...campo("stock")} />
        </div>
        <Mensaje>{error}</Mensaje>
        <div className="flex gap-3 pt-2">
          <Boton variante="secundario" type="button" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" className="flex-1" disabled={enviando}>{enviando ? "Guardando..." : "Guardar"}</Boton>
        </div>
      </form>
    </Cajon>
  );
}

// ABM de artículos (RF-04)
export default function Articulos({ sesion }) {
  const { tinte, categorias, recargar } = useCatalogo();
  const [articulos, setArticulos] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const confirmar = useConfirmar();

  const cargar = useCallback(async () => {
    try {
      const { datos } = await llamar("GET", "/stock/articulos", { token: sesion.token });
      setArticulos(datos);
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }, [sesion.token]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarActivo(articulo, activo) {
    const ok = await confirmar({
      titulo: activo ? "¿Reactivar el artículo?" : "¿Dar de baja el artículo?",
      mensaje: activo
        ? `${articulo.nombre} vuelve a mostrarse en la tienda.`
        : `${articulo.nombre} deja de mostrarse en la tienda. Los pedidos anteriores no cambian.`,
      accion: activo ? "Reactivar" : "Dar de baja",
      peligro: !activo,
    });
    if (!ok) return;
    setMensaje(null);
    try {
      await llamar("PUT", `/stock/articulos/${articulo.id}`, { token: sesion.token, cuerpo: { activo } });
      setMensaje({ tipo: "ok", texto: `${articulo.nombre} ${activo ? "reactivado" : "dado de baja"}.` });
      cargar();
      recargar();
    } catch (e) {
      if (e.status !== 0) setMensaje({ tipo: "error", texto: e.message });
    }
  }

  function guardado(texto) {
    setFormulario(null);
    setMensaje({ tipo: "ok", texto });
    cargar();
    recargar();
  }

  return (
    <Seccion titulo="Artículos" acciones={<Boton onClick={() => setFormulario({})}>Nuevo artículo</Boton>}>
      {mensaje && <Mensaje tipo={mensaje.tipo}>{mensaje.texto}</Mensaje>}
      <Panel>
        <table className="tabla">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Categoría</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => (
              <tr key={a.id} className={a.activo ? "" : "text-tenue"}>
                <td>
                  <div className="flex items-center gap-3">
                    <ImagenProducto articulo={a} tinte={tinte(a.categoria)} className="size-12 shrink-0 rounded-md [&_img]:p-1" />
                    <div>
                      <div className="font-medium">{a.nombre}</div>
                      <div className="text-xs text-tenue">{a.codigo}{!a.activo && " · dado de baja"}</div>
                    </div>
                  </div>
                </td>
                <td>{a.categoria}</td>
                <td className="precio whitespace-nowrap text-right">{formatoMoneda(a.precio)}</td>
                <td className="precio text-right">{a.stock}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <Boton variante="secundario" onClick={() => setFormulario(a)}>Editar</Boton>
                    {a.activo
                      ? <Boton variante="secundario" onClick={() => cambiarActivo(a, false)}>Dar de baja</Boton>
                      : <Boton variante="secundario" onClick={() => cambiarActivo(a, true)}>Reactivar</Boton>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {formulario && (
        <FormularioArticulo
          sesion={sesion}
          articulo={formulario.id ? formulario : null}
          categorias={categorias}
          onGuardado={guardado}
          onCerrar={() => setFormulario(null)}
        />
      )}
    </Seccion>
  );
}
