import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./api/index.js";
import apiLogger from "./middlewares/apiLogger.js";
import ensureApiJson from "./middlewares/ensureApiJson.js";

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware para asegurar respuestas JSON en API
app.use(ensureApiJson);

// Middleware de logging de API (aplicar solo a rutas /api)
app.use("/api", apiLogger);

// Health check endpoint (antes de las rutas principales)
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  });
});

// Rutas API
app.use("/api", apiRoutes);

// Middleware de manejo de errores para API (debe ir después de las rutas API)
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint de API no encontrado",
    path: req.path
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  
  // Si la ruta es de API, siempre devolver JSON
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // Para rutas del frontend, pasar al siguiente middleware
  next(err);
});

// Servir frontend React (en producción)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), "client/dist")));
  
  // Catch-all para el frontend (solo para rutas que NO sean /api)
  app.get("*", (req, res) => {
    // Si la ruta comienza con /api, devolver error JSON
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        error: "Endpoint de API no encontrado",
        path: req.path
      });
    }
    
    // Para todas las demás rutas, servir el frontend React
    res.sendFile(path.join(process.cwd(), "client/dist/index.html"));
  });
}

export default app;