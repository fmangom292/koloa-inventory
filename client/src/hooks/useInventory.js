import { useState, useEffect } from 'react';
import { inventoryAPI } from '../utils/api';

/**
 * Hook personalizado para gestionar el estado del inventario
 * @function useInventory
 * @returns {Object} Objeto con datos y métodos del inventario
 * @returns {Array} returns.items - Lista de productos del inventario
 * @returns {boolean} returns.loading - Estado de carga de las operaciones
 * @returns {string|null} returns.error - Mensaje de error actual o null
 * @returns {Function} returns.fetchItems - Función para cargar todos los productos
 * @returns {Function} returns.createItem - Función para crear un nuevo producto
 * @returns {Function} returns.updateItem - Función para actualizar un producto existente
 * @returns {Function} returns.deleteItem - Función para eliminar un producto
 * @returns {Function} returns.clearError - Función para limpiar errores
 * @description Hook que proporciona operaciones CRUD para el inventario con manejo de estado
 */
export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtiene todos los productos del inventario desde la API
   * @function fetchItems
   * @async
   * @returns {Promise<void>} No retorna valor, actualiza el estado items
   * @description Realiza una petición GET a la API para cargar todos los productos
   * y actualiza el estado del componente con los datos recibidos
   */
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryAPI.getAll();
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando inventario');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crea un nuevo producto en el inventario
   * @function createItem
   * @async
   * @param {Object} itemData - Datos del nuevo producto
   * @param {string} itemData.tipo - Tipo del producto (ej: "Tabaco")
   * @param {string} itemData.marca - Marca del producto
   * @param {string} itemData.nombre - Nombre del producto
   * @param {number} itemData.peso - Peso en gramos
   * @param {number} itemData.stock - Stock actual
   * @param {number} itemData.minStock - Stock mínimo
   * @param {number} itemData.precio - Precio del producto
   * @returns {Promise<Object>} Resultado de la operación con success y data/error
   * @description Envía los datos del nuevo producto a la API y actualiza la lista local
   */
  const createItem = async (itemData) => {
    try {
      const newItem = await inventoryAPI.create(itemData);
      setItems(prev => [newItem, ...prev]);
      return { success: true, data: newItem };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error creando producto';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Actualiza un producto existente del inventario
   * @function updateItem
   * @async
   * @param {number} id - ID del producto a actualizar
   * @param {Object} itemData - Nuevos datos del producto (misma estructura que createItem)
   * @returns {Promise<Object>} Resultado de la operación con success y data/error
   * @description Envía los datos actualizados a la API y modifica el producto en la lista local
   */
  const updateItem = async (id, itemData) => {
    try {
      const updatedItem = await inventoryAPI.update(id, itemData);
      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
      return { success: true, data: updatedItem };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error actualizando producto';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Elimina un producto del inventario
   * @function deleteItem
   * @async
   * @param {number} id - ID del producto a eliminar
   * @returns {Promise<Object>} Resultado de la operación con success y error opcional
   * @description Elimina el producto de la API y lo remueve de la lista local
   */
  const deleteItem = async (id) => {
    try {
      await inventoryAPI.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error eliminando producto';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    clearError: () => setError(null)
  };
};