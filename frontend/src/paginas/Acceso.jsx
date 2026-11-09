import { useState } from "react";
import { llamar } from "../api.js";
import { guardarToken } from "../sesion.js";
import { Boton, Campo, Mensaje } from "../componentes/ui.jsx";

const USUARIOS_PRUEBA = [
  { email: "admin@uchfyd.com", rol: "Administrador" },
  { email: "cliente@uchfyd.com", rol: "Cliente" },
  { email: "inactivo@uchfyd.com", rol: "Cuenta inactiva" },
];

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
      <Campo etiqueta="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Campo etiqueta="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus={Boolean(emailInicial)} required />
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
      <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      <Campo etiqueta="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Campo etiqueta="Contraseña (mín. 8)" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Mensaje>{error}</Mensaje>
      <Boton type="submit" disabled={cargando} className="w-full">{cargando ? "Creando cuenta..." : "Crear cuenta"}</Boton>
    </form>
  );
}

export default function Acceso({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [aviso, setAviso] = useState("");
  const [emailElegido, setEmailElegido] = useState("");

  function elegir(email) {
    setModo("login");
    setAviso("");
    setEmailElegido(email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-lg border border-linea bg-superficie md:grid-cols-2">
        <div className="p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Tienda</h1>

          <div className="mt-6 space-y-4">
            {aviso && <Mensaje tipo="ok">{aviso}</Mensaje>}
            {modo === "login"
              ? <Login key={emailElegido} emailInicial={emailElegido} onLogin={onLogin} />
              : <Registro onRegistrado={() => { setModo("login"); setAviso("Cuenta creada (inactiva)."); }} />}
          </div>

          <p className="mt-6 text-center text-sm text-tenue">
            {modo === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <Boton variante="texto" onClick={() => { setModo(modo === "login" ? "registro" : "login"); setAviso(""); }}>
              {modo === "login" ? "Registrate" : "Ingresá"}
            </Boton>
          </p>
        </div>

        <div className="border-t border-linea bg-fondo/60 p-8 md:border-l md:border-t-0">
          <h2 className="font-semibold">Usuarios de prueba</h2>
          <ul className="mt-5 space-y-2">
            {USUARIOS_PRUEBA.map((u) => (
              <li key={u.email}>
                <button
                  onClick={() => elegir(u.email)}
                  className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${emailElegido === u.email ? "border-acento bg-superficie" : "border-linea bg-superficie hover:border-tenue/40"}`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{u.rol}</span>
                    <span className="font-mono text-xs text-tenue">{u.email}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}