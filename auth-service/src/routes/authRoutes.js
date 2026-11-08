import { Router } from "express";
import { exigirRol } from "../middleware/identidadGateway.js";

const manejar = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    next(error);
  }
};

// Operaciones del contrato auth-api (TP3 §2.2)
export function crearRutas(service) {
  const router = Router();

  router.post("/registro", manejar(async (req, res) => {
    res.status(201).json(await service.registrar(req.body ?? {}));
  }));

  router.post("/login", manejar(async (req, res) => {
    res.json(await service.iniciarSesion(req.body ?? {}));
  }));

  router.get("/usuarios", exigirRol("ADMIN"), manejar(async (req, res) => {
    res.json(await service.listar(req.query.estado));
  }));

  router.patch("/usuarios/:id/activar", exigirRol("ADMIN"), manejar(async (req, res) => {
    res.json(await service.cambiarEstado(req.params.id, "ACTIVO", req.header("X-User-Id")));
  }));

  router.patch("/usuarios/:id/desactivar", exigirRol("ADMIN"), manejar(async (req, res) => {
    res.json(await service.cambiarEstado(req.params.id, "INACTIVO", req.header("X-User-Id")));
  }));

  return router;
}