import express from "express";
import authRoutes from "./auth.js";
import inventoryRoutes from "./inventory.js";
import ordersRoutes from "./orders.js";
import usersRoutes from "./usersRoutes.js";
import logsRoutes from "./logs.js";
import exportRoutes from "./export.js";

const router = express.Router();

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de inventario
router.use("/inventory", inventoryRoutes);

// Rutas de pedidos
router.use("/orders", ordersRoutes);

// Rutas de usuarios (solo para administradores)
router.use("/users", usersRoutes);

// Rutas de logs (solo para administradores)
router.use("/logs", logsRoutes);

// Rutas de exportación (solo para administradores)
router.use("/export", exportRoutes);

export default router;