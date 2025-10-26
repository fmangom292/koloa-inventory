import React, { useState } from 'react';

/**
 * Modal para la exportación de datos a Excel
 * @function ExportModal
 * @param {Object} props - Props del componente
 * @param {Function} props.onClose - Función para cerrar el modal
 * @returns {JSX.Element} Modal de exportación
 * @description Modal que permite al usuario seleccionar qué tipo de datos exportar (Inventario o Pedidos)
 */
const ExportModal = ({ onClose }) => {
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState('');
	const [progressPercent, setProgressPercent] = useState(0);
	const [hasError, setHasError] = useState(false);

	/**
	 * Descarga un archivo Excel desde el servidor
	 * @function downloadFile
	 * @async
	 * @param {string} endpoint - Endpoint del servidor
	 * @param {string} filename - Nombre del archivo a descargar
	 * @returns {void} No retorna valor
	 * @description Realiza la descarga del archivo Excel desde el servidor
	 */
	const downloadFile = async (endpoint, filename) => {
		try {
			setIsExporting(true);
			setHasError(false);
			setProgressPercent(0);
			setExportProgress('Preparando datos...');

			const token = localStorage.getItem('koloaToken');
			if (!token) {
				throw new Error('No hay token de autenticación');
			}

			setProgressPercent(25);
			setExportProgress('Conectando con el servidor...');

			const response = await fetch(`/api/export/${endpoint}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Error al exportar datos');
			}

			setProgressPercent(50);
			setExportProgress('Generando archivo Excel...');

			// Convertir la respuesta a blob
			const blob = await response.blob();
			
			setProgressPercent(75);
			setExportProgress('Preparando descarga...');

			// Crear URL del blob y iniciar descarga
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			
			// Limpiar
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			setProgressPercent(100);
			setExportProgress('¡Descarga completada!');
			
			// Cerrar modal después de 1.5 segundos
			setTimeout(() => {
				onClose();
			}, 1500);

		} catch (error) {
			console.error('Error exportando:', error);
			setHasError(true);
			setProgressPercent(0);
			setExportProgress(`Error: ${error.message}`);
			
			// Limpiar el error después de 4 segundos
			setTimeout(() => {
				setIsExporting(false);
				setExportProgress('');
				setHasError(false);
			}, 4000);
		}
	};

	/**
	 * Maneja la exportación del inventario
	 * @function handleExportInventory
	 * @async
	 * @returns {void} No retorna valor
	 * @description Inicia la exportación de datos del inventario
	 */
	const handleExportInventory = async () => {
		const filename = `inventario-koloa-${new Date().toISOString().split('T')[0]}.xlsx`;
		await downloadFile('inventory', filename);
	};

	/**
	 * Maneja la exportación de pedidos
	 * @function handleExportOrders
	 * @async
	 * @returns {void} No retorna valor
	 * @description Inicia la exportación de datos de pedidos
	 */
	const handleExportOrders = async () => {
		const filename = `pedidos-koloa-${new Date().toISOString().split('T')[0]}.xlsx`;
		await downloadFile('orders', filename);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-gray-700">
					<h2 className="text-xl font-semibold text-white">Volcar Datos</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
						disabled={isExporting}
					>
						✕
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{!isExporting ? (
						<div className="space-y-4">
							<p className="text-gray-300 text-sm mb-6">
								Selecciona el tipo de datos que deseas exportar a Excel:
							</p>

							{/* Inventario Option */}
							<button
								onClick={handleExportInventory}
								className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-start text-left"
							>
								<div className="flex items-start w-full">
									<span className="mr-3 text-lg mt-1">📦</span>
									<div className="flex-1">
										<div className="font-medium mb-1">Inventario</div>
										<div className="text-sm text-blue-200">
											Marca - Nombre - Peso - Stock - Stock Mínimo - Estado - Precio - Tipo - Valor Total
										</div>
										<div className="text-xs text-blue-300 mt-1">
											Incluye resumen con totales y estadísticas del inventario
										</div>
									</div>
								</div>
							</button>

							{/* Pedidos Option */}
							<button
								onClick={handleExportOrders}
								className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-start text-left"
							>
								<div className="flex items-start w-full">
									<span className="mr-3 text-lg mt-1">📋</span>
									<div className="flex-1">
										<div className="font-medium mb-1">Pedidos</div>
										<div className="text-sm text-green-200">
											Número - Usuario - Fecha - Artículos - Importe Total
										</div>
										<div className="text-xs text-green-300 mt-1">
											Cada pedido con sus productos detallados debajo. Separadores entre pedidos.
										</div>
									</div>
								</div>
							</button>
						</div>
					) : (
						/* Loading State */
						<div className="text-center py-8">
							<div className="inline-flex items-center mb-4">
								{/* Spinner o checkmark */}
								{hasError ? (
									<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
										<span className="text-white text-sm">✕</span>
									</div>
								) : progressPercent === 100 ? (
									<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
										<span className="text-white text-sm">✓</span>
									</div>
								) : (
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
								)}
								<span className={`text-white ${hasError ? 'text-red-300' : progressPercent === 100 ? 'text-green-300' : ''}`}>
									{exportProgress}
								</span>
							</div>
							
							{/* Progress bar */}
							{!hasError && (
								<div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
									<div 
										className={`h-3 rounded-full transition-all duration-500 ${
											progressPercent === 100 ? 'bg-green-500' : 'bg-blue-600'
										}`}
										style={{ width: `${progressPercent}%` }}
									></div>
								</div>
							)}

							{hasError && (
								<div className="mt-4 text-sm text-red-300">
									La operación se cancelará automáticamente en unos segundos...
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				{!isExporting && (
					<div className="flex justify-end p-6 border-t border-gray-700">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
						>
							Cancelar
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ExportModal;