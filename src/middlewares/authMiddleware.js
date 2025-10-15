import { verifyToken } from "../utils/jwt.js";

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
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: "Token inválido o expirado" 
    });
  }
};

export default authMiddleware;