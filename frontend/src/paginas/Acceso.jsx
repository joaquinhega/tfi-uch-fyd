import { useState } from "react";
import { llamar } from "../api.js";
import { guardarToken } from "../sesion.js";
import { Boton, Campo, Mensaje } from "../componentes/ui.jsx";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
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
    <form onSubmit={enviar} className="space-y-3">
      <Campo etiqueta="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Campo etiqueta="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
    <form onSubmit={enviar} className="space-y-3">
      <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      <Campo etiqueta="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Campo etiqueta="Contraseña (mínimo 8 caracteres)" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Mensaje>{error}</Mensaje>
      <Boton type="submit" disabled={cargando} className="w-full">{cargando ? "Registrando..." : "Crear cuenta"}</Boton>
    </form>
  );
}

export default function Acceso({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [aviso, setAviso] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-800">UCH-FyD</h1>
        <p className="mb-4 text-sm text-slate-500">{modo === "login" ? "Iniciá sesión para hacer pedidos" : "Creá tu cuenta"}</p>

        {aviso && <div className="mb-3"><Mensaje tipo="ok">{aviso}</Mensaje></div>}

        {modo === "login"
          ? <Login onLogin={onLogin} />
          : <Registro onRegistrado={() => { setModo("login"); setAviso("Cuenta creada. Un administrador debe activarla antes de que puedas ingresar."); }} />}

        <button
          className="mt-4 w-full text-center text-sm text-slate-600 underline"
          onClick={() => { setModo(modo === "login" ? "registro" : "login"); setAviso(""); }}
        >
          {modo === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
        </button>
      </div>
    </div>
  );
}