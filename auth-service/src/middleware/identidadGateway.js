// El Gateway valida el token y reenvía la identidad en encabezados (TP3 §5).
// Este servicio confía en ellos porque solo es accesible desde la red interna.
export function exigirRol(rol) {
  return (req, res, next) => {
    if (req.header("X-User-Role") !== rol) {
      return res.status(403).json({ codigo: "ROL_INSUFICIENTE", mensaje: `Operación reservada al rol ${rol}` });
    }
    next();
  };
}