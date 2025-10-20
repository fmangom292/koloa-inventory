import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../utils/usersAPI';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Panel de administración para gestión de usuarios y sistema
 * @function AdminPanel
 * @returns {JSX.Element} Panel de administración completo
 * @description Componente principal para administradores que permite gestionar usuarios,
 * ver estadísticas del sistema y realizar tareas administrativas
 */
const AdminPanel = () => {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState('users');
	const [users, setUsers] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showUserModal, setShowUserModal] = useState(false);
	const [editingUser, setEditingUser] = useState(null);

	// Verificar que el usuario sea administrador
	if (user?.role !== 'admin') {
		return (
			<div className="min-h-screen bg-dark-950 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-400 mb-4">Acceso Denegado</h1>
					<p className="text-gray-300">No tienes permisos para acceder a esta sección.</p>
				</div>
			</div>
		);
	}

	/**
	 * Carga los datos iniciales del panel
	 * @function loadData
	 * @async
	 * @returns {void} No retorna valor
	 * @description Carga usuarios y estadísticas del sistema
	 */
	const loadData = async () => {
		try {
			setLoading(true);
			setError('');
			
			const [usersData, statsData] = await Promise.all([
				usersAPI.getAll(),
				usersAPI.getStats()
			]);
			
			setUsers(usersData);
			setStats(statsData);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	/**
	 * Maneja la creación de un nuevo usuario
	 * @function handleCreateUser
	 * @returns {void} No retorna valor
	 * @description Abre el modal para crear un nuevo usuario
	 */
	const handleCreateUser = () => {
		setEditingUser(null);
		setShowUserModal(true);
	};

	/**
	 * Maneja la edición de un usuario existente
	 * @function handleEditUser
	 * @param {Object} user - Usuario a editar
	 * @returns {void} No retorna valor
	 * @description Abre el modal para editar un usuario existente
	 */
	const handleEditUser = (user) => {
		setEditingUser(user);
		setShowUserModal(true);
	};

	/**
	 * Maneja la eliminación de un usuario
	 * @function handleDeleteUser
	 * @async
	 * @param {Object} userToDelete - Usuario a eliminar
	 * @returns {void} No retorna valor
	 * @description Elimina un usuario después de confirmación
	 */
	const handleDeleteUser = async (userToDelete) => {
		if (!window.confirm(`¿Estás seguro de eliminar al usuario "${userToDelete.name}"?`)) {
			return;
		}

		try {
			await usersAPI.delete(userToDelete.id);
			await loadData(); // Recargar datos
		} catch (err) {
			setError(err.message);
		}
	};

	/**
	 * Maneja el bloqueo/desbloqueo de un usuario
	 * @function handleToggleBlock
	 * @async
	 * @param {Object} userToToggle - Usuario a bloquear/desbloquear
	 * @returns {void} No retorna valor
	 * @description Alterna el estado de bloqueo de un usuario
	 */
	const handleToggleBlock = async (userToToggle) => {
		const action = userToToggle.blocked ? 'desbloquear' : 'bloquear';
		if (!window.confirm(`¿Estás seguro de ${action} al usuario "${userToToggle.name}"?`)) {
			return;
		}

		try {
			await usersAPI.update(userToToggle.id, { blocked: !userToToggle.blocked });
			await loadData(); // Recargar datos
		} catch (err) {
			setError(err.message);
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen bg-dark-950">
			{/* Header */}
			<div className="bg-gray-800 border-b border-gray-700">
				<div className="container mx-auto px-4 py-4 max-w-7xl">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
						<div className="text-sm text-gray-300">
							Conectado como: <span className="text-blue-400 font-medium">{user.name}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div className="bg-gray-800 border-b border-gray-700">
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="flex space-x-1 py-2">
						<button
							onClick={() => setActiveTab('stats')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								activeTab === 'stats'
									? 'bg-blue-600 text-white'
									: 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							📊 Estadísticas
						</button>
						<button
							onClick={() => setActiveTab('users')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								activeTab === 'users'
									? 'bg-blue-600 text-white'
									: 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							👥 Usuarios
						</button>
						<button
							onClick={() => setActiveTab('system')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								activeTab === 'system'
									? 'bg-blue-600 text-white'
									: 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							⚙️ Sistema
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-6 max-w-7xl">
				{/* Error Message */}
				{error && (
					<div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between">
						<span>{error}</span>
						<button
							onClick={() => setError('')}
							className="text-red-400 hover:text-red-300 ml-4"
						>
							✕
						</button>
					</div>
				)}

				{/* Statistics Tab */}
				{activeTab === 'stats' && stats && (
					<div className="space-y-6">
						<h2 className="text-xl font-semibold text-white mb-4">Estadísticas del Sistema</h2>
						
						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="card">
								<div className="card-body">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-400 text-sm">Total Usuarios</p>
											<p className="text-2xl font-bold text-gray-100">{stats.users.total}</p>
											<p className="text-xs text-gray-500">
												{stats.users.admins} administradores
											</p>
										</div>
										<div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
											<span className="text-blue-400 text-xl">👥</span>
										</div>
									</div>
								</div>
							</div>

							<div className="card">
								<div className="card-body">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-400 text-sm">Usuarios Bloqueados</p>
											<p className="text-2xl font-bold text-red-400">{stats.users.blocked}</p>
										</div>
										<div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
											<span className="text-red-400 text-xl">🚫</span>
										</div>
									</div>
								</div>
							</div>

							<div className="card">
								<div className="card-body">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-400 text-sm">Total Productos</p>
											<p className="text-2xl font-bold text-gray-100">{stats.products.total}</p>
											<p className="text-xs text-red-400">
												{stats.products.outOfStock} sin stock
											</p>
										</div>
										<div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
											<span className="text-green-400 text-xl">📦</span>
										</div>
									</div>
								</div>
							</div>

							<div className="card">
								<div className="card-body">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-400 text-sm">Total Pedidos</p>
											<p className="text-2xl font-bold text-gray-100">{stats.orders.total}</p>
										</div>
										<div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
											<span className="text-purple-400 text-xl">�</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Users Tab */}
				{activeTab === 'users' && (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold text-white">Gestión de Usuarios</h2>
							<button
								onClick={handleCreateUser}
								className="btn-primary flex items-center"
							>
								<span className="mr-2">+</span>
								Crear Usuario
							</button>
						</div>

						{/* Users Table */}
						<div className="card">
							<div className="card-body p-0">
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="border-b border-gray-700">
											<tr>
												<th className="text-left py-3 px-4 text-gray-300 font-medium">Usuario</th>
												<th className="text-center py-3 px-4 text-gray-300 font-medium">Código</th>
												<th className="text-center py-3 px-4 text-gray-300 font-medium">Rol</th>
												<th className="text-center py-3 px-4 text-gray-300 font-medium">Estado</th>
												<th className="text-center py-3 px-4 text-gray-300 font-medium">Pedidos</th>
												<th className="text-center py-3 px-4 text-gray-300 font-medium">Creado</th>
												<th className="text-center py-3 px-4 text-gray-300 font-medium">Acciones</th>
											</tr>
										</thead>
										<tbody>
											{users.map((userItem) => (
												<tr key={userItem.id} className="border-b border-gray-800">
													<td className="py-3 px-4">
														<div className="flex items-center">
															<div className={`w-3 h-3 rounded-full mr-3 ${
																userItem.blocked ? 'bg-red-500' : 'bg-green-500'
															}`}></div>
															<div>
																<div className="text-gray-100 font-medium">{userItem.name}</div>
																{userItem.failedAttempts > 0 && (
																	<div className="text-xs text-amber-400">
																		{userItem.failedAttempts} intentos fallidos
																	</div>
																)}
															</div>
														</div>
													</td>
													<td className="text-center py-3 px-4 text-gray-300 font-mono">
														{userItem.code}
													</td>
													<td className="text-center py-3 px-4">
														<span className={`px-2 py-1 rounded-full text-xs font-medium ${
															userItem.role === 'admin' 
																? 'bg-purple-900/50 text-purple-300' 
																: 'bg-blue-900/50 text-blue-300'
														}`}>
															{userItem.role === 'admin' ? 'Administrador' : 'Usuario'}
														</span>
													</td>
													<td className="text-center py-3 px-4">
														<span className={`px-2 py-1 rounded-full text-xs font-medium ${
															userItem.blocked 
																? 'bg-red-900/50 text-red-300' 
																: 'bg-green-900/50 text-green-300'
														}`}>
															{userItem.blocked ? 'Bloqueado' : 'Activo'}
														</span>
													</td>
													<td className="text-center py-3 px-4 text-gray-300">
														{userItem._count?.orders || 0}
													</td>
													<td className="text-center py-3 px-4 text-gray-400 text-sm">
														{new Date(userItem.createdAt).toLocaleDateString('es-ES')}
													</td>
													<td className="text-center py-3 px-4">
														<div className="flex items-center justify-center space-x-2">
															<button
																onClick={() => handleEditUser(userItem)}
																className="text-blue-400 hover:text-blue-300 transition-colors"
																title="Editar usuario"
															>
																✏️
															</button>
															<button
																onClick={() => handleToggleBlock(userItem)}
																className={`transition-colors ${
																	userItem.blocked 
																		? 'text-green-400 hover:text-green-300' 
																		: 'text-amber-400 hover:text-amber-300'
																}`}
																title={userItem.blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
															>
																{userItem.blocked ? '🔓' : '🔒'}
															</button>
															{userItem.id !== user.id && (
																<button
																	onClick={() => handleDeleteUser(userItem)}
																	className="text-red-400 hover:text-red-300 transition-colors"
																	title="Eliminar usuario"
																>
																	🗑️
																</button>
															)}
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* System Tab */}
				{activeTab === 'system' && (
					<div className="space-y-6">
						<h2 className="text-xl font-semibold text-white mb-4">Configuración del Sistema</h2>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Database Actions */}
							<div className="card">
								<div className="card-body">
									<h3 className="text-lg font-medium text-white mb-4">Base de Datos</h3>
									<div className="space-y-3">
										<button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
											📊 Exportar Datos
										</button>
										<button className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors">
											🔄 Hacer Respaldo
										</button>
									</div>
								</div>
							</div>

							{/* System Info */}
							<div className="card">
								<div className="card-body">
									<h3 className="text-lg font-medium text-white mb-4">Información del Sistema</h3>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-400">Versión:</span>
											<span className="text-gray-200">1.0.0</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-400">Base de datos:</span>
											<span className="text-gray-200">SQLite</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-400">Última actualización:</span>
											<span className="text-gray-200">{new Date().toLocaleDateString('es-ES')}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</main>

			{/* User Modal */}
			{showUserModal && (
				<UserModal
					user={editingUser}
					onSave={async () => {
						setShowUserModal(false);
						await loadData();
					}}
					onClose={() => setShowUserModal(false)}
				/>
			)}
		</div>
	);
};

/**
 * Modal para crear/editar usuarios
 * @function UserModal
 * @param {Object} props - Props del componente
 * @param {Object|null} props.user - Usuario a editar (null para crear nuevo)
 * @param {Function} props.onSave - Callback cuando se guarda el usuario
 * @param {Function} props.onClose - Callback para cerrar el modal
 * @returns {JSX.Element} Modal de usuario
 * @description Modal para la gestión de usuarios (crear/editar)
 */
const UserModal = ({ user, onSave, onClose }) => {
	const [formData, setFormData] = useState({
		name: user?.name || '',
		code: user?.code || '',
		role: user?.role || 'user',
		blocked: user?.blocked || false
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	/**
	 * Maneja el envío del formulario
	 * @function handleSubmit
	 * @async
	 * @param {Event} e - Evento del formulario
	 * @returns {void} No retorna valor
	 * @description Procesa la creación o actualización del usuario
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			if (user) {
				// Actualizar usuario existente
				await usersAPI.update(user.id, formData);
			} else {
				// Crear nuevo usuario
				await usersAPI.create(formData);
			}
			onSave();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
				<div className="flex justify-between items-center p-6 border-b border-gray-700">
					<h2 className="text-xl font-semibold text-white">
						{user ? 'Editar Usuario' : 'Crear Usuario'}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Nombre
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Código PIN (4 dígitos)
						</label>
						<input
							type="text"
							value={formData.code}
							onChange={(e) => setFormData({ ...formData, code: e.target.value })}
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
							pattern="[0-9]{4}"
							maxLength={4}
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Rol
						</label>
						<select
							value={formData.role}
							onChange={(e) => setFormData({ ...formData, role: e.target.value })}
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="user">Usuario</option>
							<option value="admin">Administrador</option>
						</select>
					</div>

					{user && (
						<div className="flex items-center">
							<input
								type="checkbox"
								id="blocked"
								checked={formData.blocked}
								onChange={(e) => setFormData({ ...formData, blocked: e.target.checked })}
								className="mr-2"
							/>
							<label htmlFor="blocked" className="text-sm text-gray-300">
								Usuario bloqueado
							</label>
						</div>
					)}

					<div className="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
						>
							{loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AdminPanel;