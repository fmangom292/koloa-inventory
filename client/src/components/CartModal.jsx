import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import useCartOrders from '../hooks/useCartOrders';

const CartModal = ({ isOpen, onClose }) => {
	const { 
		cartItems, 
		updateQuantity, 
		removeFromCart, 
		clearCart, 
		getTotalItems, 
		getTotalPrice 
	} = useCart();
	const { createOrderFromCart, loading: orderLoading } = useCartOrders();
	const [loading, setLoading] = useState(false);
	const [notes, setNotes] = useState('');

	if (!isOpen) return null;

	/**
	 * Maneja la generación del pedido
	 */
	const handleGenerateOrder = async () => {
		if (cartItems.length === 0) return;

		setLoading(true);
		try {
			const result = await createOrderFromCart(cartItems, notes);
			
			if (result.success) {
				// Limpiar carrito después de generar el pedido exitosamente
				clearCart();
				onClose();
				alert(`¡Pedido ${result.order.orderNumber} creado exitosamente!\nTotal: €${result.order.totalPrice.toFixed(2)}`);
			} else {
				alert(`Error al generar el pedido: ${result.error}`);
			}
			
		} catch (error) {
			console.error('Error al generar pedido:', error);
			alert('Error inesperado al generar el pedido. Inténtalo de nuevo.');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Maneja el cambio de cantidad de un item
	 */
	const handleQuantityChange = (productId, newQuantity) => {
		const quantity = parseInt(newQuantity);
		if (quantity >= 0) {
			updateQuantity(productId, quantity);
		}
	};

	/**
	 * Incrementa la cantidad de un item
	 */
	const incrementQuantity = (productId, currentQuantity) => {
		updateQuantity(productId, currentQuantity + 1);
	};

	/**
	 * Decrementa la cantidad de un item
	 */
	const decrementQuantity = (productId, currentQuantity) => {
		if (currentQuantity > 1) {
			updateQuantity(productId, currentQuantity - 1);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700">
					<div className="flex items-center space-x-3">
						<span className="text-2xl">�</span>
						<h2 className="text-xl font-semibold text-gray-100">
							Pedido de Reposición
						</h2>
						{getTotalItems() > 0 && (
							<span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
								{getTotalItems()} artículos
							</span>
						)}
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors"
					>
						<span className="text-2xl">&times;</span>
					</button>
				</div>

				{/* Contenido */}
				<div className="flex-1 overflow-y-auto">
					{cartItems.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-64 text-gray-400">
							<span className="text-6xl mb-4">�</span>
							<h3 className="text-lg font-medium mb-2">No hay productos en el pedido</h3>
							<p className="text-sm">Añade algunos tabacos para hacer un pedido de reposición</p>
						</div>
					) : (
						<div className="p-6">
							{/* Tabla de productos */}
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-700">
											<th className="text-left py-3 px-2 text-gray-300 font-medium">Producto</th>
											<th className="text-center py-3 px-2 text-gray-300 font-medium">Peso</th>
											<th className="text-center py-3 px-2 text-gray-300 font-medium">Precio</th>
											<th className="text-center py-3 px-2 text-gray-300 font-medium">Cantidad</th>
											<th className="text-right py-3 px-2 text-gray-300 font-medium">Subtotal</th>
											<th className="text-center py-3 px-2 text-gray-300 font-medium">Acciones</th>
										</tr>
									</thead>
									<tbody>
										{cartItems.map((item) => (
											<tr key={item.id} className="border-b border-gray-700/50">
												<td className="py-4 px-2">
													<div className="flex items-center space-x-3">
														<div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
															<span className="text-green-400">🍃</span>
														</div>
														<div>
															<p className="text-gray-100 font-medium">{item.marca}</p>
															<p className="text-gray-400 text-sm">{item.nombre}</p>
														</div>
													</div>
												</td>
												<td className="py-4 px-2 text-center text-gray-300">
													{item.peso}g
												</td>
												<td className="py-4 px-2 text-center text-gray-300">
													€{item.precio.toFixed(2)}
												</td>
												<td className="py-4 px-2">
													<div className="flex items-center justify-center space-x-2">
														<button
															onClick={() => decrementQuantity(item.id, item.quantity)}
															className="w-8 h-8 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center text-sm"
															disabled={item.quantity <= 1}
														>
															-
														</button>
														<input
															type="number"
															min="1"
															value={item.quantity}
															onChange={(e) => handleQuantityChange(item.id, e.target.value)}
															className="w-16 h-8 text-center bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
														/>
														<button
															onClick={() => incrementQuantity(item.id, item.quantity)}
															className="w-8 h-8 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center text-sm"
														>
															+
														</button>
													</div>
												</td>
												<td className="py-4 px-2 text-right text-gray-100 font-medium">
													€{(item.precio * item.quantity).toFixed(2)}
												</td>
												<td className="py-4 px-2 text-center">
													<button
														onClick={() => removeFromCart(item.id)}
														className="text-red-400 hover:text-red-300 transition-colors p-1"
														title="Eliminar del pedido"
													>
														🗑️
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Resumen del total */}
							<div className="mt-6 pt-6 border-t border-gray-700">
								<div className="flex justify-between items-center text-lg mb-4">
									<span className="text-gray-300">Total:</span>
									<span className="text-gray-100 font-bold">
										€{getTotalPrice().toFixed(2)}
									</span>
								</div>
								
								{/* Campo de notas */}
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Notas del pedido (opcional)
									</label>
									<textarea
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Añade notas adicionales para este pedido..."
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
										rows={3}
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				{cartItems.length > 0 && (
					<div className="p-6 border-t border-gray-700 bg-gray-900/50">
						<div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
							<button
								onClick={clearCart}
								className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
							>
								Vaciar Pedido
							</button>
							<button
								onClick={onClose}
								className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
							>
								Seguir Añadiendo
							</button>
							<button
								onClick={handleGenerateOrder}
								disabled={loading || orderLoading}
								className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
							>
								{(loading || orderLoading) ? (
									<>
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Generando Pedido...
									</>
								) : (
									'Generar Pedido'
								)}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CartModal;