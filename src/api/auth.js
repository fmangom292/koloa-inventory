import express from "express";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../utils/jwt.js";
import rateLimiter from "../middlewares/rateLimiter.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Maneja el login de usuario mediante código PIN de 4 dígitos
 * @function loginHandler
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.body - Cuerpo de la petición
 * @param {string} req.body.code - Código PIN de 4 dígitos del usuario
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Object>} Respuesta JSON con token JWT y datos del usuario o error
 * @description Valida el código PIN, verifica si el usuario no está bloqueado,
 * genera un token JWT y resetea los intentos fallidos en caso de éxito
 */
// POST /api/auth/login - Login mediante código PIN
router.post("/login", rateLimiter, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.length !== 4) {
      return res.status(400).json({ 
        error: "El código debe tener 4 dígitos" 
      });
    }

    // Buscar usuario por código
    const user = await prisma.user.findFirst({
      where: { code }
    });

    if (!user) {
      return res.status(401).json({ 
        error: "Código incorrecto" 
      });
    }

    // Verificar si el usuario está bloqueado
    if (user.blocked) {
      return res.status(423).json({ 
        error: "Usuario bloqueado por múltiples intentos fallidos" 
      });
    }

    // Login exitoso - resetear intentos fallidos
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0 }
    });

    // Generar token JWT
    const token = generateToken({ userId: user.id, name: user.name });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Maneja el logout del usuario
 * @function logoutHandler
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @returns {Object} Respuesta JSON confirmando el cierre de sesión
 * @description Confirma el logout del usuario. El token se elimina del lado del cliente
 */
// POST /api/auth/logout - Logout (cliente maneja la eliminación del token)
router.post("/logout", (req, res) => {
  res.json({ 
    success: true, 
    message: "Sesión cerrada correctamente" 
  });
});

export default router;