import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

/**
 * Obtiene la lista de todos los usuarios (solo para administradores)
 * @function getUsers
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Lista de usuarios con información básica
 * @description Endpoint para que administradores vean todos los usuarios del sistema
 */
const getUsers = async (req, res) => {
	try {
		// Verificar que el usuario sea administrador
		if (req.user.role !== 'admin') {
			return res.status(403).json({ 
				error: 'No tienes permisos para realizar esta acción' 
			});
		}

		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				code: true,
				role: true,
				blocked: true,
				failedAttempts: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						orders: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		res.json(users);
	} catch (error) {
		console.error('Error obteniendo usuarios:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

/**
 * Crea un nuevo usuario (solo para administradores)
 * @function createUser
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.body - Datos del nuevo usuario
 * @param {string} req.body.name - Nombre del usuario
 * @param {string} req.body.code - Código PIN de 4 dígitos
 * @param {string} req.body.role - Rol del usuario ("admin" o "user")
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Usuario creado o mensaje de error
 * @description Endpoint para crear nuevos usuarios del sistema
 */
const createUser = async (req, res) => {
	try {
		// Verificar que el usuario sea administrador
		if (req.user.role !== 'admin') {
			return res.status(403).json({ 
				error: 'No tienes permisos para realizar esta acción' 
			});
		}

		const { name, code, role = 'user' } = req.body;

		// Validaciones
		if (!name || !code) {
			return res.status(400).json({ 
				error: 'Nombre y código son requeridos' 
			});
		}

		if (code.length !== 4 || !/^\d{4}$/.test(code)) {
			return res.status(400).json({ 
				error: 'El código debe ser de 4 dígitos numéricos' 
			});
		}

		if (!['admin', 'user'].includes(role)) {
			return res.status(400).json({ 
				error: 'El rol debe ser "admin" o "user"' 
			});
		}

		// Verificar que el código no exista
		const existingUser = await prisma.user.findUnique({
			where: { code }
		});

		if (existingUser) {
			return res.status(400).json({ 
				error: 'Ya existe un usuario con ese código' 
			});
		}

		const newUser = await prisma.user.create({
			data: {
				name,
				code,
				role
			},
			select: {
				id: true,
				name: true,
				code: true,
				role: true,
				blocked: true,
				createdAt: true
			}
		});

		res.status(201).json(newUser);
	} catch (error) {
		console.error('Error creando usuario:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

/**
 * Actualiza un usuario existente (solo para administradores)
 * @function updateUser
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del usuario a actualizar
 * @param {Object} req.body - Datos actualizados del usuario
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Usuario actualizado o mensaje de error
 * @description Endpoint para actualizar información de usuarios
 */
const updateUser = async (req, res) => {
	try {
		// Verificar que el usuario sea administrador
		if (req.user.role !== 'admin') {
			return res.status(403).json({ 
				error: 'No tienes permisos para realizar esta acción' 
			});
		}

		const { id } = req.params;
		const { name, code, role, blocked } = req.body;

		// Verificar que el usuario existe
		const existingUser = await prisma.user.findUnique({
			where: { id: parseInt(id) }
		});

		if (!existingUser) {
			return res.status(404).json({ error: 'Usuario no encontrado' });
		}

		// Preparar datos para actualizar
		const updateData = {};

		if (name !== undefined) {
			if (!name.trim()) {
				return res.status(400).json({ error: 'El nombre no puede estar vacío' });
			}
			updateData.name = name.trim();
		}

		if (code !== undefined) {
			if (code.length !== 4 || !/^\d{4}$/.test(code)) {
				return res.status(400).json({ 
					error: 'El código debe ser de 4 dígitos numéricos' 
				});
			}

			// Verificar que el código no esté en uso por otro usuario
			if (code !== existingUser.code) {
				const codeInUse = await prisma.user.findUnique({
					where: { code }
				});

				if (codeInUse) {
					return res.status(400).json({ 
						error: 'Ya existe un usuario con ese código' 
					});
				}
			}

			updateData.code = code;
		}

		if (role !== undefined) {
			if (!['admin', 'user'].includes(role)) {
				return res.status(400).json({ 
					error: 'El rol debe ser "admin" o "user"' 
				});
			}
			updateData.role = role;
		}

		if (blocked !== undefined) {
			updateData.blocked = blocked;
			// Si se desbloquea, resetear intentos fallidos
			if (!blocked) {
				updateData.failedAttempts = 0;
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id: parseInt(id) },
			data: updateData,
			select: {
				id: true,
				name: true,
				code: true,
				role: true,
				blocked: true,
				failedAttempts: true,
				createdAt: true,
				updatedAt: true
			}
		});

		res.json(updatedUser);
	} catch (error) {
		console.error('Error actualizando usuario:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

/**
 * Elimina un usuario (solo para administradores)
 * @function deleteUser
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del usuario a eliminar
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Mensaje de confirmación o error
 * @description Endpoint para eliminar usuarios del sistema
 */
const deleteUser = async (req, res) => {
	try {
		// Verificar que el usuario sea administrador
		if (req.user.role !== 'admin') {
			return res.status(403).json({ 
				error: 'No tienes permisos para realizar esta acción' 
			});
		}

		const { id } = req.params;

		// Verificar que el usuario existe
		const existingUser = await prisma.user.findUnique({
			where: { id: parseInt(id) }
		});

		if (!existingUser) {
			return res.status(404).json({ error: 'Usuario no encontrado' });
		}

		// No permitir que el admin se elimine a sí mismo
		if (parseInt(id) === req.user.userId) {
			return res.status(400).json({ 
				error: 'No puedes eliminarte a ti mismo' 
			});
		}

		await prisma.user.delete({
			where: { id: parseInt(id) }
		});

		res.json({ message: 'Usuario eliminado correctamente' });
	} catch (error) {
		console.error('Error eliminando usuario:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

/**
 * Obtiene estadísticas del sistema (solo para administradores)
 * @function getSystemStats
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Estadísticas del sistema
 * @description Endpoint para obtener métricas generales del sistema
 */
const getSystemStats = async (req, res) => {
	try {
		// Verificar que el usuario sea administrador
		if (req.user.role !== 'admin') {
			return res.status(403).json({ 
				error: 'No tienes permisos para realizar esta acción' 
			});
		}

		// Obtener estadísticas básicas
		const totalUsers = await prisma.user.count();
		const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });
		const blockedUsers = await prisma.user.count({ where: { blocked: true } });
		const totalProducts = await prisma.inventoryItem.count();
		const totalOrders = await prisma.order.count();
		const outOfStockProducts = await prisma.inventoryItem.count({ where: { stock: 0 } });

		// Para productos con stock bajo, necesitamos usar una consulta raw o buscar todos y filtrar
		const allProducts = await prisma.inventoryItem.findMany({
			select: { stock: true, minStock: true }
		});
		const lowStockProducts = allProducts.filter(item => item.stock < item.minStock && item.stock > 0).length;

		const stats = {
			users: {
				total: totalUsers,
				admins: totalAdmins,
				blocked: blockedUsers
			},
			products: {
				total: totalProducts,
				lowStock: lowStockProducts,
				outOfStock: outOfStockProducts
			},
			orders: {
				total: totalOrders
			}
		};

		res.json(stats);
	} catch (error) {
		console.error('Error obteniendo estadísticas:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

export { getUsers, createUser, updateUser, deleteUser, getSystemStats };