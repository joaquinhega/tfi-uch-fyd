// Genera el par de claves RS256 del token. La privada firma (Autenticación), la pública valida (Gateway).
import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const dir = new URL("../keys/", import.meta.url);
const privada = new URL("jwt_private.pem", dir);
const publica = new URL("jwt_public.pem", dir);

mkdirSync(dir, { recursive: true });

if (existsSync(privada) && !process.argv.includes("--force")) {
  console.log("Las claves ya existen en keys/. Usá --force para regenerarlas.");
  process.exit(0);
}

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

writeFileSync(privada, privateKey);
writeFileSync(publica, publicKey);
console.log("Claves generadas: keys/jwt_private.pem y keys/jwt_public.pem");