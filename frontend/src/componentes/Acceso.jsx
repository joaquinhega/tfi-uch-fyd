import { useState } from "react";
import { llamar } from "../api.js";
import { NEGOCIO, USUARIOS_DEMO } from "../config.js";
import { usePresentacion } from "../presentacion.jsx";
import { guardarToken } from "../sesion.js";
import { Boton, Campo, Mensaje } from "./ui.jsx";
import Modal from "./Modal.jsx";

function Login({ emailInicial, onLogin }) {
  const [email, setEmail] = useState(emailInicial);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const { datos } = await llamar("POST", "/auth/login", { cuerpo: { email, password } });
      guardarToken(datos.access_token);
      onLogin();
    } catch (err) {
      setError(err.status === 0 ? "" : err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={!emailInicial} required />
      <Campo etiqueta="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus={Boolean(emailInicial)} required />
      <Mensaje>{error}</Mensaje>
      <Boton type="submit" disabled={cargando} className="w-full">{cargando ? "Ingresando..." : "Ingresar"}</Boton>
    </form>
  );
}

function Registro({ onRegistrado }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await llamar("POST", "/auth/registro", { cuerpo: { nombre, email, password } });
      onRegistrado();
    } catch (err) {
      setError(err.status === 0 ? "" : err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus required />
      <Campo etiqueta="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Campo etiqueta="Contraseña" type="password" autoComplete="new-password" minLength={8} ayuda="Mínimo 8 caracteres." value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Mensaje>{error}</Mensaje>
      <Boton type="submit" disabled={cargando} className="w-full">{cargando ? "Creando cuenta..." : "Crear cuenta"}</Boton>
    </form>
  );
}

// Login y registro en un modal centrado
export default function Acceso({ motivo = "", onCerrar, onLogin }) {
  const { activo: presentacion } = usePresentacion();
  const [modo, setModo] = useState("login");
  const [aviso, setAviso] = useState("");
  const [emailElegido, setEmailElegido] = useState("");

  return (
    <Modal titulo={modo === "login" ? `Ingresá a ${NEGOCIO}` : "Creá tu cuenta"} onCerrar={onCerrar} ancho={presentacion ? "max-w-lg" : "max-w-md"}>
      <div className="space-y-5">
        {aviso ? <Mensaje tipo="ok">{aviso}</Mensaje> : motivo && modo === "login" && <Mensaje tipo="info">{motivo}</Mensaje>}
        {modo === "login"
          ? <Login key={emailElegido} emailInicial={emailElegido} onLogin={onLogin} />
          : <Registro onRegistrado={() => { setModo("login"); setAviso("Cuenta creada. Un administrador tiene que activarla antes de que puedas ingresar."); }} />}

        <p className="text-center text-sm text-tenue">
          {modo === "login" ? "¿Todavía no tenés cuenta? " : "¿Ya tenés cuenta? "}
          <Boton variante="texto" onClick={() => { setModo(modo === "login" ? "registro" : "login"); setAviso(""); }}>
            {modo === "login" ? "Registrate" : "Ingresá"}
          </Boton>
        </p>

        {presentacion && USUARIOS_DEMO.length > 0 && (
          <section className="space-y-2 border-t border-linea pt-5">
            <h3 className="text-sm font-semibold">Usuarios de prueba</h3>
            <ul className="grid gap-2 sm:grid-cols-3">
              {USUARIOS_DEMO.map((u) => (
                <li key={u.email}>
                  <button
                    onClick={() => { setModo("login"); setAviso(""); setEmailElegido(u.email); }}
                    className={`h-full w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${emailElegido === u.email ? "border-acento" : "border-linea hover:border-tenue"}`}
                  >
                    <span className="block font-medium">{u.rol}</span>
                    <span className="block truncate text-xs text-tenue">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}
