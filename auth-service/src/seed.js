import bcrypt from "bcryptjs";
import { log } from "./logger.js";

// Datos de prueba cargados automáticamente; no se duplican si ya existen
export async function cargarUsuariosDePrueba(dao, usuarios) {
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
    log("info", "usuario de prueba creado", { email, rol: u.rol, estado: u.estado });
  }
}