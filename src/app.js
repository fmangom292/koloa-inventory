import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./api/index.js";
import apiLogger from "./middlewares/apiLogger.js";

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de logging de API (aplicar solo a rutas /api)
app.use("/api", apiLogger);

// Rutas API
app.use("/api", apiRoutes);

// Servir frontend React (en producción)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), "client/dist")));
  app.get("*", (_, res) => {
    res.sendFile(path.join(process.cwd(), "client/dist/index.html"));
  });
}

export default app;