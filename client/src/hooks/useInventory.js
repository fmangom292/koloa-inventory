import { useState, useEffect } from 'react';
import { inventoryAPI } from '../utils/api';

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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