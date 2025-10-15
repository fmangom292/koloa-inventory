import express from "express";
import authRoutes from "./auth.js";
import inventoryRoutes from "./inventory.js";

const router = express.Router();

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de inventario
router.use("/inventory", inventoryRoutes);

export default router;