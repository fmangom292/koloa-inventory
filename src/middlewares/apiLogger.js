import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

/**
 * Array de rutas que no queremos registrar en el log porque se repiten mucho
 * @type {string[]}
 * @description Rutas base que serán excluidas del sistema de logging automático.
 * Se excluye cualquier ruta que COMIENCE con estos patrones.
 */
const EXCLUDED_ROUTES = [
	'/inventory',           // GET - Listar inventario (se llama frecuentemente)
	'/auth/verify',         // POST - Verificar token (se llama en cada ruta protegida)
	'/health',              // GET - Health check
	'/ping',                // GET - Ping endpoint
	'/logs'                 // Todas las rutas de logs (evitar recursión)
];

/**
 * Array de métodos HTTP que no queremos registrar para ciertas rutas
 * @type {Object}
 * @description Configuración específica de métodos por ruta
 */
const EXCLUDED_METHODS = {
	'/api/inventory': ['GET'],  // Solo excluir GET, pero registrar POST, PUT, DELETE
	'/api/orders': ['GET']      // Solo excluir GET de órdenes
};

/**
 * Middleware para registrar llamadas a la API en la base de datos
 * @function apiLogger
 * @param {Object} req - Request object de Express
 * @param {Object} res - Response object de Express
 * @param {Function} next - Next function de Express
 * @description Registra automáticamente las llamadas a la API con información relevante
 */
const apiLogger = async (req, res, next) => {
	const startTime = Date.now();
	const { method, path: endpoint, ip, body } = req;
	const userAgent = req.get('User-Agent');

	// Verificar si la ruta debe ser excluida
	const shouldExclude = EXCLUDED_ROUTES.some(route => endpoint.startsWith(route)) || 
		(EXCLUDED_METHODS[endpoint] && EXCLUDED_METHODS[endpoint].includes(method));

	if (shouldExclude) {
		return next();
	}

	// Interceptar la respuesta para obtener el status code
	const originalSend = res.send;
	let statusCode = 200;
	let errorMessage = null;

	res.send = function(data) {
		statusCode = res.statusCode;
		
		// Si hay error, intentar extraer el mensaje
		if (statusCode >= 400 && data) {
			try {
				const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
				errorMessage = parsedData.message || parsedData.error || 'Error desconocido';
			} catch (e) {
				errorMessage = 'Error al parsear respuesta';
			}
		}

		return originalSend.call(this, data);
	};

	// Continuar con la ejecución
	next();

	// Registrar después de que termine la respuesta
	res.on('finish', async () => {
		const responseTime = Date.now() - startTime;

		// Obtener información del usuario del token JWT o del req.user si está disponible
		let userId = null;
		let userName = null;
		let userCode = null;
		let userRole = null;

		// Intentar obtener del req.user primero (si authMiddleware ya se ejecutó)
		if (req.user) {
			userId = req.user.id;
			userName = req.user.name;
			userCode = req.user.code;
			userRole = req.user.role;
		} else {
			// Si no hay req.user, intentar extraer directamente del token
			try {
				const authHeader = req.headers.authorization;
				if (authHeader && authHeader.startsWith('Bearer ')) {
					const token = authHeader.substring(7);
					const decoded = verifyToken(token);
					userId = decoded.id;
					userName = decoded.name;
					userCode = decoded.code;
					userRole = decoded.role || 'user';
				}
			} catch (error) {
				// Token inválido o no existe, se mantienen los valores null
			}
		}

		try {
			// Sanitizar el request body - no guardar información sensible
			let sanitizedBody = null;
			if (body && Object.keys(body).length > 0) {
				const bodyClone = { ...body };
				
				// Eliminar campos sensibles
				if (bodyClone.code) delete bodyClone.code;
				if (bodyClone.password) delete bodyClone.password;
				if (bodyClone.token) delete bodyClone.token;
				
				sanitizedBody = JSON.stringify(bodyClone);
			}

			// Guardar log en la base de datos
			await prisma.apiLog.create({
				data: {
					userId,
					userName,
					userCode,
					userRole,
					method,
					endpoint,
					statusCode,
					ipAddress: ip,
					userAgent,
					requestBody: sanitizedBody,
					responseTime,
					errorMessage
				}
			});
		} catch (error) {
			// No bloquear la aplicación si falla el logging
			console.error('Error al guardar log de API:', error);
		}
	});
};

/**
 * Función para agregar rutas adicionales al array de exclusión
 * @function addExcludedRoute
 * @param {string} route - Ruta a excluir del logging
 * @description Permite agregar dinámicamente rutas que no queremos registrar
 */
export const addExcludedRoute = (route) => {
	if (!EXCLUDED_ROUTES.includes(route)) {
		EXCLUDED_ROUTES.push(route);
	}
};

/**
 * Función para obtener la lista de rutas excluidas
 * @function getExcludedRoutes
 * @returns {string[]} Array de rutas excluidas
 * @description Retorna la lista actual de rutas excluidas del logging
 */
export const getExcludedRoutes = () => [...EXCLUDED_ROUTES];

/**
 * Función para limpiar logs antiguos (útil para maintenance)
 * @function cleanOldLogs
 * @param {number} daysOld - Número de días para considerar logs como antiguos
 * @returns {Promise<number>} Número de logs eliminados
 * @description Elimina logs más antiguos que el número de días especificado
 */
export const cleanOldLogs = async (daysOld = 30) => {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysOld);

	try {
		const result = await prisma.apiLog.deleteMany({
			where: {
				timestamp: {
					lt: cutoffDate
				}
			}
		});

		return result.count;
	} catch (error) {
		console.error('Error al limpiar logs antiguos:', error);
		throw error;
	}
};

export default apiLogger;