import { readFileSync } from "node:fs";

function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

const mongoUser = encodeURIComponent(requerida("MONGO_USER"));
const mongoPassword = encodeURIComponent(requerida("MONGO_PASSWORD"));
const mongoDb = requerida("MONGO_DB");

export const config = {
  port: 3000,
  mongoUri: `mongodb://${mongoUser}:${mongoPassword}@mongo:27017/${mongoDb}?authSource=admin`,
  mongoDb,
  jwt: {
    privateKey: readFileSync(requerida("JWT_PRIVATE_KEY_FILE"), "utf8"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
    issuer: process.env.JWT_ISSUER ?? "uch-fyd-auth",
  },
  usuariosDePrueba: [
    { nombre: "Administrador", email: requerida("SEED_ADMIN_EMAIL"), password: requerida("SEED_ADMIN_PASSWORD"), rol: "ADMIN", estado: "ACTIVO" },
    { nombre: "Cliente Activo", email: requerida("SEED_CLIENTE_EMAIL"), password: requerida("SEED_CLIENTE_PASSWORD"), rol: "CLIENTE", estado: "ACTIVO" },
    { nombre: "Cliente Inactivo", email: requerida("SEED_INACTIVO_EMAIL"), password: requerida("SEED_INACTIVO_PASSWORD"), rol: "CLIENTE", estado: "INACTIVO" },
  ],
};