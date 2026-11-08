import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registrarEvento } from "../auditoria.js";

export class ErrorNegocio extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESTADOS = ["ACTIVO", "INACTIVO"];

export function aPublico(u) {
  return { id: u._id.toString(), nombre: u.nombre, email: u.email, rol: u.rol, estado: u.estado, creadoEn: u.creadoEn };
}

export class AuthService {
  constructor(dao, jwtConfig) {
    this.dao = dao;
    this.jwt = jwtConfig;
  }

  // RF-01: toda cuenta nueva nace INACTIVA y con rol CLIENTE
  async registrar({ nombre, email, password }) {
    if (!nombre?.trim() || !EMAIL_VALIDO.test(email ?? "") || (password ?? "").length < 8) {
      throw new ErrorNegocio(400, "DATOS_INVALIDOS", "Nombre, email válido y contraseña de al menos 8 caracteres son obligatorios");
    }
    const emailNormalizado = email.trim().toLowerCase();
    if (await this.dao.buscarPorEmail(emailNormalizado)) {
      throw new ErrorNegocio(409, "EMAIL_EXISTENTE", "Ya existe una cuenta con ese email");
    }
    let usuario;
    try {
      usuario = await this.dao.crear({
        nombre: nombre.trim(),
        email: emailNormalizado,
        passwordHash: await bcrypt.hash(password, 10),
        rol: "CLIENTE",
        estado: "INACTIVO",
        creadoEn: new Date(),
      });
    } catch (error) {
      if (error.code === 11000) throw new ErrorNegocio(409, "EMAIL_EXISTENTE", "Ya existe una cuenta con ese email");
      throw error;
    }
    const publico = aPublico(usuario);
    await registrarEvento("CUENTA_REGISTRADA", { usuario_id: publico.id, email: publico.email });
    return publico;
  }

  // RF-03: emite el access token firmado con la clave privada (token issuer)
  async iniciarSesion({ email, password }) {
    if (!email || !password) {
      throw new ErrorNegocio(400, "DATOS_INVALIDOS", "Email y contraseña son obligatorios");
    }
    const usuario = await this.dao.buscarPorEmail(email.trim().toLowerCase());
    if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
      throw new ErrorNegocio(401, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos");
    }
    if (usuario.estado !== "ACTIVO") {
      throw new ErrorNegocio(403, "CUENTA_INACTIVA", "La cuenta todavía no fue activada por un administrador");
    }
    const token = jwt.sign(
      { email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
      this.jwt.privateKey,
      { algorithm: "RS256", subject: usuario._id.toString(), issuer: this.jwt.issuer, expiresIn: this.jwt.expiresIn },
    );
    const { exp } = jwt.decode(token);
    return { access_token: token, token_type: "Bearer", expires_in: exp - Math.floor(Date.now() / 1000) };
  }

  // RF-02: activar / desactivar (solo admin). Queda registrado en la cadena de auditoría.
  async cambiarEstado(id, estado, adminId) {
    const usuario = await this.dao.actualizarEstado(id, estado);
    if (!usuario) throw new ErrorNegocio(404, "USUARIO_NO_ENCONTRADO", "No existe un usuario con ese id");
    const publico = aPublico(usuario);
    const tipo = estado === "ACTIVO" ? "CUENTA_ACTIVADA" : "CUENTA_DESACTIVADA";
    await registrarEvento(tipo, { usuario_id: publico.id, email: publico.email, por: adminId ?? "-" });
    return publico;
  }

  async listar(estado) {
    if (estado && !ESTADOS.includes(estado)) {
      throw new ErrorNegocio(400, "ESTADO_INVALIDO", "El estado debe ser ACTIVO o INACTIVO");
    }
    const usuarios = await this.dao.listar(estado ? { estado } : {});
    return usuarios.map(aPublico);
  }
}