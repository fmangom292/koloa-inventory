import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getUsers, createUser, updateUser, deleteUser, getSystemStats } from "./users.js";

const router = express.Router();

// Todas las rutas de usuarios requieren autenticación
router.use(authMiddleware);

// GET /api/users/stats - Obtener estadísticas del sistema (DEBE ir antes de /:id)
router.get("/stats", getSystemStats);

// GET /api/users - Obtener todos los usuarios
router.get("/", getUsers);

// POST /api/users - Crear nuevo usuario
router.post("/", createUser);

// PUT /api/users/:id - Actualizar usuario
router.put("/:id", updateUser);

// DELETE /api/users/:id - Eliminar usuario
router.delete("/:id", deleteUser);

export default router;