import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

/**
 * Genera un token JWT firmado con la información del usuario
 * @function generateToken
 * @param {Object} payload - Datos del usuario a incluir en el token
 * @param {number} payload.userId - ID único del usuario
 * @param {string} payload.name - Nombre del usuario
 * @returns {string} Token JWT firmado con expiración de 24 horas
 * @description Crea un token JWT válido por 24 horas usando la clave secreta del entorno
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

/**
 * Verifica y decodifica un token JWT
 * @function verifyToken
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Datos decodificados del token (userId, name, iat, exp)
 * @throws {Error} Error si el token es inválido, expirado o malformado
 * @description Valida la firma del token y retorna los datos del usuario si es válido
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Token inválido");
  }
};