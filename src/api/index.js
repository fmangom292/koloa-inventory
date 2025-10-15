import express from "express";
import authRoutes from "./auth.js";
import inventoryRoutes from "./inventory.js";
import ordersRoutes from "./orders.js";

const router = express.Router();

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de inventario
router.use("/inventory", inventoryRoutes);

// Rutas de pedidos
router.use("/orders", ordersRoutes);

export default router;