import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/logs - Obtener logs de API con paginación y filtros
 * @function getLogs
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @description Retorna los logs de API con opciones de filtrado y paginación
 */
router.get('/', authMiddleware, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 50,
			method,
			endpoint,
			userName,
			statusCode,
			startDate,
			endDate
		} = req.query;

		// Construir filtros
		const where = {};
		
		if (method) where.method = method;
		if (endpoint) where.endpoint = { contains: endpoint };
		if (userName) where.userName = { contains: userName };
		if (statusCode) where.statusCode = parseInt(statusCode);
		
		if (startDate || endDate) {
			where.timestamp = {};
			if (startDate) where.timestamp.gte = new Date(startDate);
			if (endDate) where.timestamp.lte = new Date(endDate);
		}

		// Calcular offset para paginación
		const offset = (parseInt(page) - 1) * parseInt(limit);

		// Obtener logs con paginación
		const [logs, totalCount] = await Promise.all([
			prisma.apiLog.findMany({
				where,
				orderBy: {
					timestamp: 'desc'
				},
				skip: offset,
				take: parseInt(limit)
			}),
			prisma.apiLog.count({ where })
		]);

		res.json({
			success: true,
			data: logs,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: totalCount,
				totalPages: Math.ceil(totalCount / parseInt(limit))
			}
		});
	} catch (error) {
		console.error('Error al obtener logs:', error);
		res.status(500).json({
			success: false,
			message: 'Error al obtener logs de API',
			error: error.message
		});
	}
});

/**
 * GET /api/logs/stats - Obtener estadísticas de logs
 * @function getLogStats
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @description Retorna estadísticas resumidas de los logs de API
 */
router.get('/stats', authMiddleware, async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		
		// Construir filtro de fecha
		const where = {};
		if (startDate || endDate) {
			where.timestamp = {};
			if (startDate) where.timestamp.gte = new Date(startDate);
			if (endDate) where.timestamp.lte = new Date(endDate);
		}

		// Obtener estadísticas
		const [
			totalRequests,
			errorRequests,
			methodStats,
			endpointStats,
			userStats
		] = await Promise.all([
			prisma.apiLog.count({ where }),
			prisma.apiLog.count({ 
				where: { 
					...where, 
					statusCode: { gte: 400 } 
				} 
			}),
			prisma.apiLog.groupBy({
				by: ['method'],
				where,
				_count: { method: true }
			}),
			prisma.apiLog.groupBy({
				by: ['endpoint'],
				where,
				_count: { endpoint: true },
				orderBy: { _count: { endpoint: 'desc' } },
				take: 10
			}),
			prisma.apiLog.groupBy({
				by: ['userName'],
				where: { ...where, userName: { not: null } },
				_count: { userName: true },
				orderBy: { _count: { userName: 'desc' } },
				take: 10
			})
		]);

		res.json({
			success: true,
			data: {
				totalRequests,
				errorRequests,
				successRate: totalRequests > 0 ? ((totalRequests - errorRequests) / totalRequests * 100).toFixed(2) : 0,
				methodDistribution: methodStats,
				topEndpoints: endpointStats,
				topUsers: userStats
			}
		});
	} catch (error) {
		console.error('Error al obtener estadísticas:', error);
		res.status(500).json({
			success: false,
			message: 'Error al obtener estadísticas de logs',
			error: error.message
		});
	}
});

/**
 * DELETE /api/logs/cleanup - Limpiar logs antiguos
 * @function cleanupLogs
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @description Elimina logs más antiguos que el número de días especificado
 */
router.delete('/cleanup', authMiddleware, async (req, res) => {
	try {
		// Solo permitir a administradores
		if (req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Solo los administradores pueden limpiar logs'
			});
		}

		const { daysOld = 30 } = req.body;
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

		const result = await prisma.apiLog.deleteMany({
			where: {
				timestamp: {
					lt: cutoffDate
				}
			}
		});

		res.json({
			success: true,
			message: `Se eliminaron ${result.count} logs antiguos`,
			deletedCount: result.count
		});
	} catch (error) {
		console.error('Error al limpiar logs:', error);
		res.status(500).json({
			success: false,
			message: 'Error al limpiar logs antiguos',
			error: error.message
		});
	}
});

export default router;