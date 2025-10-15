import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/inventory - Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(items);
  } catch (error) {
    console.error("Error obteniendo inventario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/inventory - Crear nuevo producto
router.post("/", async (req, res) => {
  try {
    const { tipo, marca, nombre, peso, stock, minStock, precio } = req.body;

    // Validaciones básicas
    if (!tipo || !marca || !nombre || peso === undefined || stock === undefined) {
      return res.status(400).json({ 
        error: "Faltan campos obligatorios" 
      });
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        tipo,
        marca,
        nombre,
        peso: parseInt(peso),
        stock: parseInt(stock),
        minStock: parseInt(minStock) || 0,
        precio: parseFloat(precio) || 0
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/inventory/:id - Actualizar producto
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, marca, nombre, peso, stock, minStock, precio } = req.body;

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        marca,
        nombre,
        peso: parseInt(peso),
        stock: parseInt(stock),
        minStock: parseInt(minStock),
        precio: parseFloat(precio)
      }
    });

    res.json(updatedItem);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    console.error("Error actualizando producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE /api/inventory/:id - Eliminar producto
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.inventoryItem.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    console.error("Error eliminando producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;