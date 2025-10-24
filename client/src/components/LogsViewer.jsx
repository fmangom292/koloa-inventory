import { useState, useEffect } from 'react';
import { logsAPI } from '../utils/logsAPI';
import LoadingSpinner from './LoadingSpinner';

/**
 * Componente para visualizar logs del sistema con filtros y paginación
 * @function LogsViewer
 * @returns {JSX.Element} Vista de logs con tabla, filtros y paginación
 * @description Permite a los administradores ver y filtrar logs de API del sistema
 */
const LogsViewer = () => {
	const [logs, setLogs] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(25);
	
	// Filtros
	const [filters, setFilters] = useState({
		method: '',
		endpoint: '',
		userName: '',
		statusCode: '',
		startDate: '',
		endDate: ''
	});

	// Estado para limpieza de logs
	const [showCleanupModal, setShowCleanupModal] = useState(false);
	const [cleanupDays, setCleanupDays] = useState(30);
	const [cleanupLoading, setCleanupLoading] = useState(false);

	/**
	 * Carga los logs según los filtros y paginación actuales
	 * @function loadLogs
	 * @async
	 * @returns {void} No retorna valor
	 * @description Obtiene logs del servidor aplicando filtros y paginación
	 */
	const loadLogs = async () => {
		try {
			setLoading(true);
			setError('');

			const params = {
				page: currentPage,
				limit,
				...filters
			};

			const response = await logsAPI.getLogs(params);
			
			if (response.success) {
				setLogs(response.data);
				setCurrentPage(response.pagination.page);
				setTotalPages(response.pagination.totalPages);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Carga las estadísticas de logs
	 * @function loadStats
	 * @async
	 * @returns {void} No retorna valor
	 * @description Obtiene estadísticas resumidas de logs
	 */
	const loadStats = async () => {
		try {
			const response = await logsAPI.getStats(filters);
			
			if (response.success) {
				setStats(response.data);
			}
		} catch (err) {
			console.error('Error cargando estadísticas:', err);
		}
	};

	/**
	 * Maneja el cambio en los filtros
	 * @function handleFilterChange
	 * @param {string} field - Campo del filtro a cambiar
	 * @param {string} value - Nuevo valor del filtro
	 * @returns {void} No retorna valor
	 * @description Actualiza un filtro específico y resetea a la página 1
	 */
	const handleFilterChange = (field, value) => {
		setFilters(prev => ({ ...prev, [field]: value }));
		setCurrentPage(1);
	};

	/**
	 * Limpia todos los filtros
	 * @function clearFilters
	 * @returns {void} No retorna valor
	 * @description Resetea todos los filtros a valores vacíos
	 */
	const clearFilters = () => {
		setFilters({
			method: '',
			endpoint: '',
			userName: '',
			statusCode: '',
			startDate: '',
			endDate: ''
		});
		setCurrentPage(1);
	};

	/**
	 * Maneja la limpieza de logs antiguos
	 * @function handleCleanup
	 * @async
	 * @returns {void} No retorna valor
	 * @description Elimina logs más antiguos que el número de días especificado
	 */
	const handleCleanup = async () => {
		try {
			setCleanupLoading(true);
			const response = await logsAPI.cleanupOldLogs(cleanupDays);
			
			if (response.success) {
				alert(`Se eliminaron ${response.deletedCount} logs antiguos`);
				setShowCleanupModal(false);
				loadLogs(); // Recargar logs
				loadStats(); // Recargar estadísticas
			}
		} catch (err) {
			alert('Error al limpiar logs: ' + err.message);
		} finally {
			setCleanupLoading(false);
		}
	};

	// Efectos
	useEffect(() => {
		loadLogs();
	}, [currentPage, limit, filters]);

	useEffect(() => {
		loadStats();
	}, [filters]);

	if (loading && logs.length === 0) {
		return <LoadingSpinner />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-white">Logs del Sistema</h2>
				<button
					onClick={() => setShowCleanupModal(true)}
					className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
				>
					🗑️ Limpiar Logs Antiguos
				</button>
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between">
					<span>{error}</span>
					<button
						onClick={() => setError('')}
						className="text-red-400 hover:text-red-300 ml-4"
					>
						✕
					</button>
				</div>
			)}

			{/* Estadísticas */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="card">
						<div className="card-body">
							<div className="text-center">
								<p className="text-gray-400 text-sm">Total Requests</p>
								<p className="text-2xl font-bold text-gray-100">{stats.totalRequests}</p>
							</div>
						</div>
					</div>
					<div className="card">
						<div className="card-body">
							<div className="text-center">
								<p className="text-gray-400 text-sm">Errores</p>
								<p className="text-2xl font-bold text-red-400">{stats.errorRequests}</p>
							</div>
						</div>
					</div>
					<div className="card">
						<div className="card-body">
							<div className="text-center">
								<p className="text-gray-400 text-sm">Tasa de Éxito</p>
								<p className="text-2xl font-bold text-green-400">{stats.successRate}%</p>
							</div>
						</div>
					</div>
					<div className="card">
						<div className="card-body">
							<div className="text-center">
								<p className="text-gray-400 text-sm">Métodos</p>
								<p className="text-lg text-gray-100">
									{stats.methodDistribution?.length || 0} tipos
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Filtros */}
			<div className="card">
				<div className="card-body">
					<h3 className="text-lg font-medium text-white mb-4">Filtros</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Método
							</label>
							<select
								value={filters.method}
								onChange={(e) => handleFilterChange('method', e.target.value)}
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Todos</option>
								<option value="GET">GET</option>
								<option value="POST">POST</option>
								<option value="PUT">PUT</option>
								<option value="DELETE">DELETE</option>
								<option value="PATCH">PATCH</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Endpoint
							</label>
							<input
								type="text"
								value={filters.endpoint}
								onChange={(e) => handleFilterChange('endpoint', e.target.value)}
								placeholder="/api/..."
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Nombre Usuario
							</label>
							<input
								type="text"
								value={filters.userName}
								onChange={(e) => handleFilterChange('userName', e.target.value)}
								placeholder="Nombre del usuario"
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Estado
							</label>
							<select
								value={filters.statusCode}
								onChange={(e) => handleFilterChange('statusCode', e.target.value)}
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Todos</option>
								<option value="200">200 - OK</option>
								<option value="201">201 - Created</option>
								<option value="400">400 - Bad Request</option>
								<option value="401">401 - Unauthorized</option>
								<option value="403">403 - Forbidden</option>
								<option value="404">404 - Not Found</option>
								<option value="500">500 - Server Error</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Fecha Inicio
							</label>
							<input
								type="datetime-local"
								value={filters.startDate}
								onChange={(e) => handleFilterChange('startDate', e.target.value)}
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Fecha Fin
							</label>
							<input
								type="datetime-local"
								value={filters.endDate}
								onChange={(e) => handleFilterChange('endDate', e.target.value)}
								className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div className="flex items-center justify-between mt-4">
						<div className="flex items-center space-x-2">
							<label className="text-sm text-gray-300">Elementos por página:</label>
							<select
								value={limit}
								onChange={(e) => setLimit(parseInt(e.target.value))}
								className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
							>
								<option value={10}>10</option>
								<option value={25}>25</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</div>

						<button
							onClick={clearFilters}
							className="text-gray-400 hover:text-white transition-colors text-sm"
						>
							🗑️ Limpiar Filtros
						</button>
					</div>
				</div>
			</div>

			{/* Tabla de Logs */}
			<div className="card">
				<div className="card-body p-0">
					{loading && (
						<div className="flex items-center justify-center py-8">
							<LoadingSpinner />
						</div>
					)}

					{!loading && logs.length === 0 && (
						<div className="text-center py-8 text-gray-400">
							No se encontraron logs con los filtros aplicados
						</div>
					)}

					{!loading && logs.length > 0 && (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="border-b border-gray-700">
									<tr>
										<th className="text-left py-3 px-4 text-gray-300 font-medium">Fecha</th>
										<th className="text-center py-3 px-4 text-gray-300 font-medium">Usuario</th>
										<th className="text-center py-3 px-4 text-gray-300 font-medium">Método</th>
										<th className="text-left py-3 px-4 text-gray-300 font-medium">Endpoint</th>
										<th className="text-center py-3 px-4 text-gray-300 font-medium">Estado</th>
										<th className="text-center py-3 px-4 text-gray-300 font-medium">Tiempo</th>
										<th className="text-left py-3 px-4 text-gray-300 font-medium">IP</th>
										<th className="text-left py-3 px-4 text-gray-300 font-medium">Error</th>
									</tr>
								</thead>
								<tbody>
									{logs.map((log) => (
										<tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
											<td className="py-3 px-4 text-gray-300 text-sm">
												{logsAPI.formatDate(log.timestamp)}
											</td>
											<td className="text-center py-3 px-4">
												{log.userName ? (
													<div>
														<div className="text-gray-200 text-sm font-medium">{log.userName}</div>
														<div className="text-gray-400 text-xs">{log.userCode || 'N/A'}</div>
														{log.userRole && (
															<div className={`text-xs px-1 rounded ${
																log.userRole === 'admin' 
																	? 'text-purple-400' 
																	: 'text-blue-400'
															}`}>
																{log.userRole}
															</div>
														)}
													</div>
												) : (
													<span className="text-gray-500 text-sm">Anónimo</span>
												)}
											</td>
											<td className="text-center py-3 px-4">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													logsAPI.getMethodColor(log.method)
												}`}>
													{log.method}
												</span>
											</td>
											<td className="py-3 px-4 text-gray-300 text-sm font-mono">
												{log.endpoint}
											</td>
											<td className="text-center py-3 px-4">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													logsAPI.getStatusColor(log.statusCode)
												}`}>
													{log.statusCode}
												</span>
											</td>
											<td className="text-center py-3 px-4 text-gray-300 text-sm">
												{logsAPI.formatResponseTime(log.responseTime)}
											</td>
											<td className="py-3 px-4 text-gray-400 text-sm font-mono">
												{log.ipAddress || 'N/A'}
											</td>
											<td className="py-3 px-4 text-red-400 text-sm">
												{log.errorMessage ? (
													<span title={log.errorMessage} className="cursor-help">
														{log.errorMessage.length > 30 
															? log.errorMessage.substring(0, 30) + '...'
															: log.errorMessage
														}
													</span>
												) : (
													<span className="text-gray-500">-</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Paginación */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-gray-400">
						Página {currentPage} de {totalPages}
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
							disabled={currentPage === 1}
							className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
						>
							← Anterior
						</button>
						<span className="text-gray-400 text-sm">
							{currentPage} / {totalPages}
						</span>
						<button
							onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
							disabled={currentPage === totalPages}
							className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
						>
							Siguiente →
						</button>
					</div>
				</div>
			)}

			{/* Modal de Limpieza */}
			{showCleanupModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
						<div className="flex justify-between items-center p-6 border-b border-gray-700">
							<h2 className="text-xl font-semibold text-white">Limpiar Logs Antiguos</h2>
							<button
								onClick={() => setShowCleanupModal(false)}
								className="text-gray-400 hover:text-white transition-colors"
							>
								✕
							</button>
						</div>

						<div className="p-6 space-y-4">
							<p className="text-gray-300">
								Esta acción eliminará permanentemente todos los logs más antiguos que el número de días especificado.
							</p>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Días de antigüedad
								</label>
								<input
									type="number"
									value={cleanupDays}
									onChange={(e) => setCleanupDays(parseInt(e.target.value))}
									min="1"
									max="365"
									className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<p className="text-gray-400 text-xs mt-1">
									Se eliminarán logs anteriores a {new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
								</p>
							</div>

							<div className="flex justify-end space-x-3 pt-4">
								<button
									onClick={() => setShowCleanupModal(false)}
									className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
								>
									Cancelar
								</button>
								<button
									onClick={handleCleanup}
									disabled={cleanupLoading}
									className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
								>
									{cleanupLoading ? 'Eliminando...' : 'Eliminar Logs'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default LogsViewer;