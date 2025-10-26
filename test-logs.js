/**
 * Script de prueba para verificar que las rutas de logs funcionen correctamente
 * @description Hace peticiones a las rutas de logs para verificar su funcionamiento
 */

// Simular una petición con fetch
const testLogsEndpoint = async () => {
	try {
		console.log('🧪 Iniciando prueba de endpoint de logs...');
		
		// Esta es solo una simulación - en el navegador tendrías que usar un token real
		const token = 'test-token';
		
		const response = await fetch('/api/logs', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});
		
		console.log('📊 Status de respuesta:', response.status);
		console.log('📋 Headers de respuesta:', response.headers.get('content-type'));
		
		const data = await response.text();
		console.log('📄 Tipo de respuesta:', typeof data);
		console.log('📝 Primeros 100 caracteres:', data.substring(0, 100));
		
		// Intentar parsear como JSON
		try {
			const jsonData = JSON.parse(data);
			console.log('✅ Respuesta es JSON válido');
			console.log('📦 Estructura:', Object.keys(jsonData));
		} catch (e) {
			console.log('❌ Respuesta NO es JSON válido');
			console.log('🔍 Parece ser HTML:', data.includes('<html>'));
		}
		
	} catch (error) {
		console.error('💥 Error en la prueba:', error);
	}
};

// Exportar para uso en el navegador
if (typeof window !== 'undefined') {
	window.testLogsEndpoint = testLogsEndpoint;
}

console.log('🔧 Script de prueba de logs cargado. Usa testLogsEndpoint() para probar.');