import axios from 'axios';

// Configuración base de Axios
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de peticiones que agrega automáticamente el token JWT
 * @function requestInterceptor
 * @param {Object} config - Configuración de la petición axios
 * @returns {Object} Configuración modificada con el header Authorization
 * @description Extrae el token del localStorage y lo agrega a todas las peticiones HTTP
 */
// Interceptor para agregar el token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('koloaToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas que maneja errores de autenticación
 * @function responseInterceptor
 * @param {Object} response - Respuesta HTTP exitosa
 * @param {Object} error - Error HTTP recibido
 * @returns {Object|Promise} Respuesta exitosa o rechazo del error
 * @description Detecta errores 401 (no autorizado) y redirige al login limpiando la sesión
 */
// Interceptor para manejar respuestas de error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('koloaToken');
      localStorage.removeItem('koloaUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * API de autenticación con métodos para login y logout
 * @namespace authAPI
 */
// Funciones de autenticación
export const authAPI = {
  /**
   * Inicia sesión con código PIN
   * @function login
   * @async
   * @param {string} code - Código PIN de 4 dígitos
   * @returns {Promise<Object>} Respuesta con token y datos del usuario
   */
  login: async (code) => {
    const response = await api.post('/auth/login', { code });
    return response.data;
  },
  
  /**
   * Cierra la sesión del usuario
   * @function logout
   * @async
   * @returns {Promise<Object>} Confirmación del logout
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('koloaToken');
    localStorage.removeItem('koloaUser');
    return response.data;
  }
};

/**
 * API de inventario con operaciones CRUD para productos
 * @namespace inventoryAPI
 */
// Funciones de inventario
export const inventoryAPI = {
  /**
   * Obtiene todos los productos del inventario
   * @function getAll
   * @async
   * @returns {Promise<Array>} Lista de todos los productos
   */
  getAll: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  
  /**
   * Crea un nuevo producto en el inventario
   * @function create
   * @async
   * @param {Object} item - Datos del producto a crear
   * @returns {Promise<Object>} Producto creado con su ID asignado
   */
  create: async (item) => {
    const response = await api.post('/inventory', item);
    return response.data;
  },
  
  /**
   * Actualiza un producto existente
   * @function update
   * @async
   * @param {number} id - ID del producto a actualizar
   * @param {Object} item - Nuevos datos del producto
   * @returns {Promise<Object>} Producto actualizado
   */
  update: async (id, item) => {
    const response = await api.put(`/inventory/${id}`, item);
    return response.data;
  },
  
  /**
   * Elimina un producto del inventario
   * @function delete
   * @async
   * @param {number} id - ID del producto a eliminar
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  }
};

export default api;