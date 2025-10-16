const API_BASE_URL = '/api';

/**
 * Utilidad para realizar peticiones HTTP con manejo de errores
 * @function apiRequest
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de la petición (método, headers, body)
 * @returns {Promise<Object>} Respuesta de la API
 * @description Función helper para hacer peticiones HTTP con manejo centralizado de errores
 */
const apiRequest = async (endpoint, options = {}) => {
	const token = localStorage.getItem('koloaToken');
	
	const config = {
		headers: {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
		...options,
	};

	if (config.body && typeof config.body === 'object') {
		config.body = JSON.stringify(config.body);
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
	
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}

	return response.json();
};

/**
 * API para gestión de usuarios (solo administradores)
 * @namespace usersAPI
 * @description Conjunto de funciones para interactuar con la API de usuarios
 */
export const usersAPI = {
	/**
	 * Obtiene la lista de todos los usuarios
	 * @function getAll
	 * @returns {Promise<Array>} Lista de usuarios
	 * @description Obtiene todos los usuarios del sistema con información básica
	 */
	getAll: async () => {
		return apiRequest('/users');
	},

	/**
	 * Crea un nuevo usuario
	 * @function create
	 * @param {Object} userData - Datos del nuevo usuario
	 * @param {string} userData.name - Nombre del usuario
	 * @param {string} userData.code - Código PIN de 4 dígitos
	 * @param {string} userData.role - Rol del usuario ("admin" o "user")
	 * @returns {Promise<Object>} Usuario creado
	 * @description Crea un nuevo usuario en el sistema
	 */
	create: async (userData) => {
		return apiRequest('/users', {
			method: 'POST',
			body: userData,
		});
	},

	/**
	 * Actualiza un usuario existente
	 * @function update
	 * @param {number} id - ID del usuario a actualizar
	 * @param {Object} userData - Datos a actualizar
	 * @returns {Promise<Object>} Usuario actualizado
	 * @description Actualiza la información de un usuario
	 */
	update: async (id, userData) => {
		return apiRequest(`/users/${id}`, {
			method: 'PUT',
			body: userData,
		});
	},

	/**
	 * Elimina un usuario
	 * @function delete
	 * @param {number} id - ID del usuario a eliminar
	 * @returns {Promise<Object>} Mensaje de confirmación
	 * @description Elimina un usuario del sistema
	 */
	delete: async (id) => {
		return apiRequest(`/users/${id}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Obtiene estadísticas del sistema
	 * @function getStats
	 * @returns {Promise<Object>} Estadísticas del sistema
	 * @description Obtiene métricas generales del sistema
	 */
	getStats: async () => {
		return apiRequest('/users/stats');
	},
};