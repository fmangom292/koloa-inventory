import { useState } from 'react';

const useCartOrders = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	/**
	 * Crea un pedido a partir del contenido del carrito
	 * @param {Array} cartItems - Items del carrito
	 * @param {string} notes - Notas adicionales del pedido
	 * @returns {Promise<Object>} Resultado de la operación
	 */
	const createOrderFromCart = async (cartItems, notes = '') => {
		setLoading(true);
		setError('');

		try {
			const token = localStorage.getItem('koloaToken');
			if (!token) {
				throw new Error('No hay token de autenticación');
			}

			// Convertir items del carrito al formato requerido por la API
			const orderItems = cartItems.map(item => ({
				inventoryItemId: item.id,
				quantityOrdered: item.quantity
			}));

			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					type: 'general', // Tipo de pedido general del carrito
					items: orderItems,
					notes: notes
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Error al crear el pedido');
			}

			return {
				success: true,
				order: data
			};

		} catch (error) {
			const errorMessage = error.message || 'Error al crear el pedido';
			setError(errorMessage);
			return {
				success: false,
				error: errorMessage
			};
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Obtiene todos los pedidos
	 * @returns {Promise<Array>} Lista de pedidos
	 */
	const getOrders = async () => {
		setLoading(true);
		setError('');

		try {
			const token = localStorage.getItem('koloaToken');
			if (!token) {
				throw new Error('No hay token de autenticación');
			}

			const response = await fetch('/api/orders', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Error al obtener los pedidos');
			}

			return {
				success: true,
				orders: data
			};

		} catch (error) {
			const errorMessage = error.message || 'Error al obtener los pedidos';
			setError(errorMessage);
			return {
				success: false,
				error: errorMessage
			};
		} finally {
			setLoading(false);
		}
	};

	return {
		loading,
		error,
		createOrderFromCart,
		getOrders
	};
};

export default useCartOrders;