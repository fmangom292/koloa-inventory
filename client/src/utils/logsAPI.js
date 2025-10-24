import axios from 'axios';

const API_BASE_URL = '/api/logs';

/**
 * Servicio para gestionar las llamadas a la API de logs
 * @description Proporciona métodos para interactuar con los endpoints de logging
 */
export const logsAPI = {
	/**
	 * Obtiene logs con paginación y filtros
	 * @function getLogs
	 * @param {Object} params - Parámetros de consulta
	 * @param {number} params.page - Página a obtener (default: 1)
	 * @param {number} params.limit - Elementos por página (default: 50)
	 * @param {string} params.method - Filtrar por método HTTP
	 * @param {string} params.endpoint - Filtrar por endpoint (búsqueda parcial)
	 * @param {string} params.userName - Filtrar por nombre de usuario (búsqueda parcial)
	 * @param {number} params.statusCode - Filtrar por código de estado
	 * @param {string} params.startDate - Fecha inicio (ISO string)
	 * @param {string} params.endDate - Fecha fin (ISO string)
	 * @returns {Promise<Object>} Lista de logs con información de paginación
	 * @description Obtiene logs del sistema con filtros y paginación
	 */
	async getLogs(params = {}) {
		try {
			const token = localStorage.getItem('koloaToken');
			
			if (!token) {
				throw new Error('No hay token de autenticación disponible');
			}
			
			// Filtrar parámetros vacíos
			const cleanParams = Object.entries(params)
				.filter(([key, value]) => value !== undefined && value !== '' && value !== null)
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

			const response = await axios.get(API_BASE_URL, {
				headers: {
					'Authorization': `Bearer ${token}`
				},
				params: cleanParams
			});
			
			return response.data;
		} catch (error) {
			console.error('Error obteniendo logs:', error);
			console.error('Error response:', error.response?.data);
			throw new Error(
				error.response?.data?.message || 
				'Error al obtener logs del sistema'
			);
		}
	},

	/**
	 * Obtiene estadísticas de logs
	 * @function getStats
	 * @param {Object} params - Parámetros de filtrado por fecha
	 * @param {string} params.startDate - Fecha inicio (ISO string)
	 * @param {string} params.endDate - Fecha fin (ISO string)
	 * @returns {Promise<Object>} Estadísticas resumidas de logs
	 * @description Obtiene métricas y estadísticas de los logs del sistema
	 */
	async getStats(params = {}) {
		try {
			const token = localStorage.getItem('koloaToken');
			
			// Filtrar parámetros vacíos
			const cleanParams = Object.entries(params)
				.filter(([key, value]) => value !== undefined && value !== '' && value !== null)
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

			const response = await axios.get(`${API_BASE_URL}/stats`, {
				headers: {
					'Authorization': `Bearer ${token}`
				},
				params: cleanParams
			});
			
			return response.data;
		} catch (error) {
			console.error('Error obteniendo estadísticas de logs:', error);
			throw new Error(
				error.response?.data?.message || 
				'Error al obtener estadísticas de logs'
			);
		}
	},

	/**
	 * Limpia logs antiguos
	 * @function cleanupOldLogs
	 * @param {number} daysOld - Número de días para considerar logs como antiguos (default: 30)
	 * @returns {Promise<Object>} Resultado de la limpieza con número de logs eliminados
	 * @description Elimina logs más antiguos que el número de días especificado
	 */
	async cleanupOldLogs(daysOld = 30) {
		try {
			const token = localStorage.getItem('koloaToken');
			
			const response = await axios.delete(`${API_BASE_URL}/cleanup`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				data: { daysOld }
			});
			
			return response.data;
		} catch (error) {
			console.error('Error limpiando logs:', error);
			throw new Error(
				error.response?.data?.message || 
				'Error al limpiar logs antiguos'
			);
		}
	},

	/**
	 * Formatea la fecha para mostrar en la interfaz
	 * @function formatDate
	 * @param {string} dateString - Fecha en formato ISO string
	 * @returns {string} Fecha formateada para mostrar
	 * @description Convierte una fecha ISO a formato legible
	 */
	formatDate(dateString) {
		if (!dateString) return 'N/A';
		
		try {
			const date = new Date(dateString);
			return date.toLocaleString('es-ES', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		} catch (error) {
			return 'Fecha inválida';
		}
	},

	/**
	 * Obtiene el color para mostrar el código de estado HTTP
	 * @function getStatusColor
	 * @param {number} statusCode - Código de estado HTTP
	 * @returns {string} Clases CSS para colorear el estado
	 * @description Retorna clases de color según el rango del código de estado
	 */
	getStatusColor(statusCode) {
		if (statusCode >= 200 && statusCode < 300) {
			return 'text-green-400 bg-green-900/50'; // Éxito
		} else if (statusCode >= 300 && statusCode < 400) {
			return 'text-blue-400 bg-blue-900/50'; // Redirección
		} else if (statusCode >= 400 && statusCode < 500) {
			return 'text-amber-400 bg-amber-900/50'; // Error del cliente
		} else if (statusCode >= 500) {
			return 'text-red-400 bg-red-900/50'; // Error del servidor
		} else {
			return 'text-gray-400 bg-gray-900/50'; // Desconocido
		}
	},

	/**
	 * Obtiene el color para mostrar el método HTTP
	 * @function getMethodColor
	 * @param {string} method - Método HTTP
	 * @returns {string} Clases CSS para colorear el método
	 * @description Retorna clases de color según el tipo de método HTTP
	 */
	getMethodColor(method) {
		switch (method.toUpperCase()) {
			case 'GET':
				return 'text-blue-400 bg-blue-900/50';
			case 'POST':
				return 'text-green-400 bg-green-900/50';
			case 'PUT':
				return 'text-amber-400 bg-amber-900/50';
			case 'DELETE':
				return 'text-red-400 bg-red-900/50';
			case 'PATCH':
				return 'text-purple-400 bg-purple-900/50';
			default:
				return 'text-gray-400 bg-gray-900/50';
		}
	},

	/**
	 * Formatea el tiempo de respuesta para mostrar
	 * @function formatResponseTime
	 * @param {number} responseTime - Tiempo de respuesta en milisegundos
	 * @returns {string} Tiempo formateado con unidades
	 * @description Convierte milisegundos a formato legible
	 */
	formatResponseTime(responseTime) {
		if (responseTime === null || responseTime === undefined) return 'N/A';
		
		if (responseTime < 1000) {
			return `${responseTime}ms`;
		} else {
			return `${(responseTime / 1000).toFixed(2)}s`;
		}
	}
};