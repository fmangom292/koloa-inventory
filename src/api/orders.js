import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * Genera un número de pedido único y consecutivo
 * @function generateOrderNumber
 * @async
 * @returns {Promise<string>} Número de pedido en formato ORD-YYYY-XXX
 * @description Crea un número de pedido único basado en el año actual y un contador
 */
const generateOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `ORD-${currentYear}-`;
  
  // Buscar el último pedido del año actual
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: yearPrefix
      }
    },
    orderBy: {
      orderNumber: 'desc'
    }
  });
  
  let nextNumber = 1;
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
};

/**
 * Obtiene todos los pedidos con información del usuario y conteo de items
 * @function getAllOrders
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Array>} Lista de pedidos con datos relacionados
 * @description Consulta todos los pedidos con información del usuario que los creó
 */
// GET /api/orders - Obtener todos los pedidos
router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                nombre: true,
                marca: true,
                peso: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(orders);
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Obtiene un pedido específico por su ID con todos los detalles
 * @function getOrderById
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del pedido a obtener
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} Pedido completo con items y datos relacionados
 * @description Obtiene un pedido específico con toda su información detallada
 */
// GET /api/orders/:id - Obtener un pedido específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error obteniendo pedido:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Crea un nuevo pedido en el sistema
 * @function createOrder
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.body - Datos del pedido
 * @param {string} req.body.type - Tipo de pedido ("general" o "brand")
 * @param {string} [req.body.brand] - Marca específica si type es "brand"
 * @param {Array} req.body.items - Array de items del pedido
 * @param {string} [req.body.notes] - Notas adicionales del pedido
 * @param {Object} req.user - Usuario autenticado del middleware
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} Pedido creado con número de pedido asignado
 * @description Crea un pedido completo con todos sus items y calcula totales
 */
// POST /api/orders - Crear nuevo pedido
router.post("/", async (req, res) => {
  try {
    const { type, brand, items, notes } = req.body;
    const userId = req.user.userId;

    // Validaciones básicas
    if (!type || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: "Tipo de pedido e items son obligatorios" 
      });
    }

    // Generar número de pedido único
    const orderNumber = await generateOrderNumber();

    // Calcular totales
    let totalItems = 0;
    let totalPrice = 0;

    // Validar que todos los items existen y calcular totales
    const validatedItems = [];
    for (const item of items) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: item.inventoryItemId }
      });

      if (!inventoryItem) {
        return res.status(400).json({ 
          error: `Producto con ID ${item.inventoryItemId} no encontrado` 
        });
      }

      const quantity = parseInt(item.quantityOrdered);
      if (quantity <= 0) {
        continue; // Saltar items con cantidad 0
      }

      totalItems += quantity;
      totalPrice += inventoryItem.precio * quantity;

      validatedItems.push({
        inventoryItemId: inventoryItem.id,
        quantityOrdered: quantity,
        priceAtTime: inventoryItem.precio
      });
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({ 
        error: "El pedido debe tener al menos un item con cantidad mayor a 0" 
      });
    }

    // Crear el pedido con sus items
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        type,
        brand: brand || null,
        totalItems,
        totalPrice,
        notes: notes || null,
        userId,
        items: {
          create: validatedItems
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creando pedido:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Confirma la recepción de un pedido y actualiza el stock
 * @function confirmOrder
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del pedido a confirmar
 * @param {Object} req.body - Datos de confirmación
 * @param {string} [req.body.notes] - Notas adicionales sobre la recepción
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} Pedido actualizado y cambios en el stock
 * @description Marca el pedido como completado y suma las cantidades al stock actual
 */
// PUT /api/orders/:id/confirm - Confirmar recepción de pedido
router.put("/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Verificar que el pedido existe y está pendiente
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: "Solo se pueden confirmar pedidos pendientes" 
      });
    }

    // Actualizar stock de todos los items del pedido
    const stockUpdates = [];
    for (const orderItem of order.items) {
      const newStock = orderItem.inventoryItem.stock + orderItem.quantityOrdered;
      
      await prisma.inventoryItem.update({
        where: { id: orderItem.inventoryItemId },
        data: { stock: newStock }
      });

      stockUpdates.push({
        itemId: orderItem.inventoryItemId,
        itemName: orderItem.inventoryItem.nombre,
        previousStock: orderItem.inventoryItem.stock,
        addedQuantity: orderItem.quantityOrdered,
        newStock: newStock
      });
    }

    // Marcar pedido como completado
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notes: notes ? `${order.notes || ''}\nRecepción: ${notes}`.trim() : order.notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    res.json({
      order: updatedOrder,
      stockUpdates
    });
  } catch (error) {
    console.error("Error confirmando pedido:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Cancela un pedido pendiente
 * @function cancelOrder
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del pedido a cancelar
 * @param {Object} req.body - Datos de cancelación
 * @param {string} [req.body.reason] - Razón de la cancelación
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} Pedido actualizado con status cancelado
 * @description Marca un pedido como cancelado sin afectar el stock
 */
// PUT /api/orders/:id/cancel - Cancelar pedido
router.put("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: "Solo se pueden cancelar pedidos pendientes" 
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'cancelled',
        notes: reason ? `${order.notes || ''}\nCancelado: ${reason}`.trim() : order.notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error cancelando pedido:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;