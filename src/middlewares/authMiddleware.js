import { verifyToken } from "../utils/jwt.js";

/**
 * Middleware de autenticación que verifica el token JWT en las peticiones
 * @function authMiddleware
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.headers - Headers de la petición
 * @param {string} req.headers.authorization - Header de autorización con formato "Bearer <token>"
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void|Object} Continúa al siguiente middleware o retorna error 401
 * @description Extrae y verifica el token JWT del header Authorization,
 * agrega los datos del usuario decodificado a req.user y permite continuar
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Token de autenticación requerido" 
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    const decoded = verifyToken(token);
    
    // Asegurar que el token tenga un rol por defecto si no lo tiene (compatibilidad con tokens antiguos)
    if (!decoded.role) {
      decoded.role = 'user';
    }
    
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ 
      error: "Token inválido o expirado" 
    });
  }
};

export default authMiddleware;