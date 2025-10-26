/**
 * Middleware para asegurar que las rutas de API siempre devuelvan JSON
 * @function ensureApiJson
 * @param {Object} req - Request object de Express
 * @param {Object} res - Response object de Express
 * @param {Function} next - Next function de Express
 * @description Intercepta respuestas de API para asegurar que sean JSON válido
 */
const ensureApiJson = (req, res, next) => {
	// Solo aplicar a rutas de API
	if (!req.path.startsWith('/api')) {
		return next();
	}

	// Interceptar el método send de Express
	const originalSend = res.send;
	
	res.send = function(data) {
		// Logging para debugging en producción
		if (process.env.NODE_ENV === 'production' && req.path.startsWith('/api')) {
			console.log(`🔍 API Response Debug - ${req.method} ${req.path}:`, {
				contentType: res.get('Content-Type'),
				dataType: typeof data,
				isHtml: typeof data === 'string' && (data.includes('<html>') || data.includes('<!DOCTYPE')),
				statusCode: res.statusCode
			});
		}

		// Asegurar que Content-Type sea JSON para rutas de API
		if (!res.get('Content-Type') || !res.get('Content-Type').includes('application/json')) {
			res.set('Content-Type', 'application/json');
		}

		// Si los datos no son un objeto JSON válido, convertirlos
		if (typeof data === 'string' && !isJsonString(data)) {
			console.error(`❌ API devolvió respuesta no-JSON para ${req.path}:`, data.substring(0, 200));
			
			// Si es HTML, convertir a error JSON
			if (data.includes('<html>') || data.includes('<!DOCTYPE')) {
				const errorResponse = {
					success: false,
					error: 'Error interno del servidor - respuesta HTML inesperada',
					message: 'La API devolvió HTML en lugar de JSON. Esto indica un problema de configuración.',
					path: req.path,
					method: req.method,
					timestamp: new Date().toISOString()
				};
				return originalSend.call(this, JSON.stringify(errorResponse));
			}
			
			// Para otros strings, intentar convertir a JSON
			const jsonResponse = {
				success: false,
				error: 'Respuesta de API no válida',
				data: data,
				path: req.path,
				timestamp: new Date().toISOString()
			};
			return originalSend.call(this, JSON.stringify(jsonResponse));
		}

		// Llamar al método original
		return originalSend.call(this, data);
	};

	next();
};

/**
 * Verifica si una cadena es JSON válido
 * @function isJsonString
 * @param {string} str - Cadena a verificar
 * @returns {boolean} True si es JSON válido
 * @description Intenta parsear la cadena como JSON
 */
function isJsonString(str) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}

export default ensureApiJson;