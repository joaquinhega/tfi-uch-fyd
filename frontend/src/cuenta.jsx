import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Acceso from "./componentes/Acceso.jsx";
import { cerrarSesion, leerSesion } from "./sesion.js";

const Contexto = createContext(null);

// Sesión del usuario. Lo que exige estar logueado abre el login y se completa al ingresar
export function CuentaProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);
  const [acceso, setAcceso] = useState(null);
  const pendiente = useRef(null);

  useEffect(() => {
    const vencida = () => { cerrarSesion(); setSesion(null); };
    window.addEventListener("sesion-vencida", vencida);
    return () => window.removeEventListener("sesion-vencida", vencida);
  }, []);

  const pedirAcceso = useCallback((motivo = "", accion = null) => {
    pendiente.current = accion;
    setAcceso({ motivo });
  }, []);

  // Ejecuta la acción con la sesión; sin sesión, primero pide ingresar
  const conSesion = useCallback((accion, motivo = "") => {
    if (sesion) accion(sesion);
    else pedirAcceso(motivo, accion);
  }, [sesion, pedirAcceso]);

  // Comprar es solo para clientes: el administrador trabaja en su panel
  const comprar = useCallback((accion) => {
    conSesion((s) => { if (s.rol !== "ADMIN") accion(); }, "Ingresá para agregar productos a tu carrito.");
  }, [conSesion]);

  const salir = useCallback(() => { cerrarSesion(); setSesion(null); }, []);

  function alIngresar() {
    const nueva = leerSesion();
    setSesion(nueva);
    setAcceso(null);
    const accion = pendiente.current;
    pendiente.current = null;
    if (nueva) accion?.(nueva);
  }

  function alCerrar() {
    pendiente.current = null;
    setAcceso(null);
  }

  const valor = useMemo(() => ({ sesion, pedirAcceso, conSesion, comprar, salir }), [sesion, pedirAcceso, conSesion, comprar, salir]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      {acceso && <Acceso motivo={acceso.motivo} onCerrar={alCerrar} onLogin={alIngresar} />}
    </Contexto.Provider>
  );
}

export function useCuenta() {
  return useContext(Contexto);
}
