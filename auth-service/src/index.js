import express from "express";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "./config.js";
import { conectar } from "./db.js";
import { UsuarioDao } from "./dao/usuarioDao.js";
import { AuthService, ErrorNegocio } from "./services/authService.js";
import { crearRutas } from "./routes/authRoutes.js";
import { cargarUsuariosDePrueba } from "./seed.js";
import { contexto, log } from "./logger.js";

const db = await conectar();
const dao = new UsuarioDao(db);
await cargarUsuariosDePrueba(dao, config.usuariosDePrueba);
const service = new AuthService(dao, config.jwt);

const contrato = readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8");

const app = express();
app.use(express.json());

// ID de correlación + log
app.use((req, res, next) => {
  const correlationId = req.header("X-Correlation-ID") ?? randomUUID();
  const inicio = process.hrtime.bigint();
  res.setHeader("X-Correlation-ID", correlationId);
  res.on("finish", () => {
    if (req.path === "/health") return;
    contexto.run({ correlationId }, () => log("info", "solicitud atendida", {
      metodo: req.method,
      ruta: req.path,
      status: res.statusCode,
      ms: Number(process.hrtime.bigint() - inicio) / 1e6,
    }));
  });
  contexto.run({ correlationId }, next);
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth" }));
app.get("/v1/openapi.yaml", (_req, res) => res.type("text/yaml").send(contrato));
app.use("/v1", crearRutas(service));

app.use((req, res) => res.status(404).json({ codigo: "RUTA_NO_ENCONTRADA", mensaje: `${req.method} ${req.path}` }));

app.use((err, req, res, _next) => {
  if (err instanceof ErrorNegocio) {
    return res.status(err.status).json({ codigo: err.codigo, mensaje: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ codigo: "JSON_INVALIDO", mensaje: "El cuerpo no es un JSON válido" });
  }
  log("error", err.message, { ruta: req.path });
  res.status(500).json({ codigo: "ERROR_INTERNO", mensaje: "Error interno del servicio" });
});

app.listen(config.port, () => log("info", `escuchando en ${config.port}`));