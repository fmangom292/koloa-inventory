import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * Obtiene todos los productos del inventario
 * @function getInventoryItems
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Array>} Lista de todos los productos ordenados por fecha de creación
 * @description Consulta la base de datos y retorna todos los items del inventario
 */
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

/**
 * Crea un nuevo producto en el inventario
 * @function createInventoryItem
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.body - Cuerpo de la petición
 * @param {string} req.body.tipo - Tipo del producto (ej: "Tabaco")
 * @param {string} req.body.marca - Marca del producto
 * @param {string} req.body.nombre - Nombre del producto
 * @param {number} req.body.peso - Peso del producto en gramos
 * @param {number} req.body.stock - Cantidad actual en stock
 * @param {number} req.body.minStock - Stock mínimo requerido
 * @param {number} req.body.precio - Precio del producto
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} El nuevo producto creado con su ID asignado
 * @description Valida los campos obligatorios y crea un nuevo item en la base de datos
 */
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

/**
 * Actualiza un producto existente del inventario
 * @function updateInventoryItem
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del producto a actualizar
 * @param {Object} req.body - Nuevos datos del producto
 * @param {string} req.body.tipo - Tipo del producto
 * @param {string} req.body.marca - Marca del producto
 * @param {string} req.body.nombre - Nombre del producto
 * @param {number} req.body.peso - Peso del producto en gramos
 * @param {number} req.body.stock - Cantidad actual en stock
 * @param {number} req.body.minStock - Stock mínimo requerido
 * @param {number} req.body.precio - Precio del producto
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} El producto actualizado o error si no existe
 * @description Busca el producto por ID y actualiza todos sus campos
 */
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

/**
 * Elimina un producto del inventario
 * @function deleteInventoryItem
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del producto a eliminar
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} Confirmación de eliminación o error si no existe
 * @description Busca el producto por ID y lo elimina permanentemente de la base de datos
 */
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