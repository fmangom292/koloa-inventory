import app from './app.js';

const PORT = process.env.PORT || 4000;

/**
 * Inicia el servidor HTTP de la aplicación Koloa Inventory
 * @function startServer
 * @description Arranca el servidor Express en el puerto especificado por la variable
 * de entorno PORT o en el puerto 4000 por defecto, sirviendo tanto la API como el frontend
 */
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});