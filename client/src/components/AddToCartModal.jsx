import { useState } from 'react';
import { useCart } from '../contexts/CartContext';

const AddToCartModal = ({ isOpen, onClose, product }) => {
	const [quantity, setQuantity] = useState(1);
	const [loading, setLoading] = useState(false);
	const { addToCart, getItemQuantity } = useCart();

	if (!isOpen || !product) return null;

	/**
	 * Maneja el envío del formulario para añadir al carrito
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (quantity <= 0) {
			return;
		}

		setLoading(true);
		
		try {
			addToCart(product, parseInt(quantity));
			setQuantity(1); // Resetear cantidad
			onClose();
		} catch (error) {
			console.error('Error al añadir al carrito:', error);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Maneja el cierre del modal
	 */
	const handleClose = () => {
		setQuantity(1);
		onClose();
	};

	/**
	 * Incrementa la cantidad
	 */
	const incrementQuantity = () => {
		setQuantity(prev => prev + 1);
	};

	/**
	 * Decrementa la cantidad
	 */
	const decrementQuantity = () => {
		setQuantity(prev => Math.max(1, prev - 1));
	};

	const currentInCart = getItemQuantity(product.id);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700">
					<h2 className="text-xl font-semibold text-gray-100">
						Añadir a Pedido
					</h2>
					<button
						onClick={handleClose}
						className="text-gray-400 hover:text-gray-200 transition-colors"
					>
						<span className="text-2xl">&times;</span>
					</button>
				</div>

				{/* Información del producto */}
				<div className="p-6 border-b border-gray-700">
					<div className="flex items-center space-x-4">
						<div className="w-16 h-16 bg-green-600/20 rounded-lg flex items-center justify-center">
							<span className="text-green-400 text-2xl">🍃</span>
						</div>
						<div className="flex-1">
							<h3 className="text-lg font-medium text-gray-100">
								{product.marca} - {product.nombre}
							</h3>
							<p className="text-gray-400">
								{product.peso}g • €{product.precio}
							</p>
							<div className="flex items-center mt-2">
								<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
									product.stock > product.minStock
										? 'bg-green-900/30 text-green-300'
										: product.stock > 0
										? 'bg-amber-900/30 text-amber-300'
										: 'bg-red-900/30 text-red-300'
								}`}>
									Stock: {product.stock}
								</span>
							</div>
						</div>
					</div>
					
					{currentInCart > 0 && (
						<div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
							<p className="text-blue-300 text-sm">
								Ya tienes <strong>{currentInCart}</strong> unidades de este producto en el pedido
							</p>
						</div>
					)}
				</div>

				{/* Formulario */}
				<form onSubmit={handleSubmit} className="p-6">
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-200 mb-3">
							Cantidad a pedir
						</label>
						
						<div className="flex items-center justify-center space-x-4">
							<button
								type="button"
								onClick={decrementQuantity}
								className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
							>
								-
							</button>
							
							<input
								type="number"
								min="1"
								value={quantity}
								onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
								className="w-20 h-10 text-center bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							
							<button
								type="button"
								onClick={incrementQuantity}
								className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
							>
								+
							</button>
						</div>
						
						<p className="text-gray-400 text-sm text-center mt-2">
							Stock actual: {product.stock} unidades
						</p>
					</div>

					{/* Resumen */}
					<div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
						<div className="flex justify-between items-center text-sm">
							<span className="text-gray-400">Subtotal:</span>
							<span className="text-gray-100 font-medium">
								€{(product.precio * quantity).toFixed(2)}
							</span>
						</div>
					</div>

					{/* Botones */}
					<div className="flex space-x-3">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
						>
							{loading ? (
								<>
									<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Añadiendo...
								</>
							) : (
								'Añadir a Pedido'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddToCartModal;