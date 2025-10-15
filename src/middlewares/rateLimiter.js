import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Almacenar intentos por IP (en producción usar Redis o base de datos)
const attemptsByIP = new Map();

/**
 * Middleware que limita los intentos de login para prevenir ataques de fuerza bruta
 * @function rateLimiter
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.body - Cuerpo de la petición
 * @param {string} req.body.code - Código PIN que se está intentando
 * @param {string} req.ip - Dirección IP del cliente
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {Promise<void|Object>} Continúa al siguiente middleware o retorna error 429/423
 * @description Controla los intentos fallidos por IP y por usuario,
 * bloqueando después de múltiples intentos incorrectos para prevenir ataques
 */
const rateLimiter = async (req, res, next) => {
  try {
    const { code } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!code) {
      return next();
    }

    // Buscar usuario por código
    const user = await prisma.user.findFirst({
      where: { code }
    });

    if (!user) {
      // Incrementar intentos por IP para códigos incorrectos
      const currentAttempts = attemptsByIP.get(clientIP) || 0;
      attemptsByIP.set(clientIP, currentAttempts + 1);

      if (currentAttempts >= 3) {
        return res.status(429).json({ 
          error: "Demasiados intentos fallidos. Intenta más tarde." 
        });
      }

      return next();
    }

    // Si el usuario existe, verificar sus intentos fallidos
    if (user.failedAttempts >= 4) {
      // Bloquear usuario tras 4 intentos
      await prisma.user.update({
        where: { id: user.id },
        data: { blocked: true }
      });

      return res.status(423).json({ 
        error: "Usuario bloqueado por múltiples intentos fallidos" 
      });
    }

    // Si todo está bien, limpiar intentos por IP
    attemptsByIP.delete(clientIP);
    
    next();
  } catch (error) {
    console.error("Error en rateLimiter:", error);
    next();
  }
};

export default rateLimiter;