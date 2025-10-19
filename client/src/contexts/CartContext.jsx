import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error('useCart debe usarse dentro de un CartProvider');
	}
	return context;
};

export const CartProvider = ({ children }) => {
	const [cartItems, setCartItems] = useState([]);

	// Cargar carrito desde localStorage al iniciar
	useEffect(() => {
		const savedCart = localStorage.getItem('koloaCart');
		if (savedCart) {
			try {
				setCartItems(JSON.parse(savedCart));
			} catch (error) {
				console.error('Error al cargar el carrito:', error);
				localStorage.removeItem('koloaCart');
			}
		}
	}, []);

	// Guardar carrito en localStorage cuando cambie
	useEffect(() => {
		localStorage.setItem('koloaCart', JSON.stringify(cartItems));
	}, [cartItems]);

	/**
	 * Añade un producto al carrito o incrementa su cantidad si ya existe
	 * @param {Object} product - Producto a añadir
	 * @param {number} quantity - Cantidad a añadir
	 */
	const addToCart = (product, quantity = 1) => {
		setCartItems(prevItems => {
			const existingItem = prevItems.find(item => item.id === product.id);
			
			if (existingItem) {
				// Si ya existe, incrementar cantidad
				return prevItems.map(item =>
					item.id === product.id
						? { ...item, quantity: item.quantity + quantity }
						: item
				);
			} else {
				// Si no existe, añadir nuevo item
				return [...prevItems, { ...product, quantity }];
			}
		});
	};

	/**
	 * Actualiza la cantidad de un producto en el carrito
	 * @param {number} productId - ID del producto
	 * @param {number} newQuantity - Nueva cantidad
	 */
	const updateQuantity = (productId, newQuantity) => {
		if (newQuantity <= 0) {
			removeFromCart(productId);
			return;
		}

		setCartItems(prevItems =>
			prevItems.map(item =>
				item.id === productId
					? { ...item, quantity: newQuantity }
					: item
			)
		);
	};

	/**
	 * Elimina un producto del carrito
	 * @param {number} productId - ID del producto a eliminar
	 */
	const removeFromCart = (productId) => {
		setCartItems(prevItems =>
			prevItems.filter(item => item.id !== productId)
		);
	};

	/**
	 * Vacía completamente el carrito
	 */
	const clearCart = () => {
		setCartItems([]);
	};

	/**
	 * Obtiene el número total de items en el carrito
	 * @returns {number} Total de items
	 */
	const getTotalItems = () => {
		return cartItems.reduce((total, item) => total + item.quantity, 0);
	};

	/**
	 * Obtiene el precio total del carrito
	 * @returns {number} Precio total
	 */
	const getTotalPrice = () => {
		return cartItems.reduce((total, item) => total + (item.precio * item.quantity), 0);
	};

	/**
	 * Verifica si un producto está en el carrito
	 * @param {number} productId - ID del producto
	 * @returns {boolean} True si está en el carrito
	 */
	const isInCart = (productId) => {
		return cartItems.some(item => item.id === productId);
	};

	/**
	 * Obtiene la cantidad de un producto específico en el carrito
	 * @param {number} productId - ID del producto
	 * @returns {number} Cantidad del producto en el carrito
	 */
	const getItemQuantity = (productId) => {
		const item = cartItems.find(item => item.id === productId);
		return item ? item.quantity : 0;
	};

	const value = {
		cartItems,
		addToCart,
		updateQuantity,
		removeFromCart,
		clearCart,
		getTotalItems,
		getTotalPrice,
		isInCart,
		getItemQuantity
	};

	return (
		<CartContext.Provider value={value}>
			{children}
		</CartContext.Provider>
	);
};