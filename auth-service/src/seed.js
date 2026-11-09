import bcrypt from "bcryptjs";
import { log } from "./logger.js";

export async function cargarUsuariosIniciales(dao, usuarios) {
  for (const u of usuarios) {
    const email = u.email.trim().toLowerCase();
    if (await dao.buscarPorEmail(email)) continue;
    await dao.crear({
      nombre: u.nombre,
      email,
      passwordHash: await bcrypt.hash(u.password, 10),
      rol: u.rol,
      estado: u.estado,
      creadoEn: new Date(),
    });
    log("info", "usuario inicial creado", { email, rol: u.rol, estado: u.estado });
  }
}