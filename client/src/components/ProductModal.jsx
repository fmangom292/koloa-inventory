import { useState, useEffect } from 'react';

const ProductModal = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    tipo: 'Tabaco',
    marca: '',
    nombre: '',
    peso: '',
    stock: '',
    minStock: '',
    precio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        tipo: item.tipo,
        marca: item.marca,
        nombre: item.nombre,
        peso: item.peso.toString(),
        stock: item.stock.toString(),
        minStock: item.minStock.toString(),
        precio: item.precio.toString()
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.marca.trim() || !formData.nombre.trim()) {
      setError('Marca y nombre son obligatorios');
      return;
    }

    if (parseInt(formData.peso) <= 0) {
      setError('El peso debe ser mayor a 0');
      return;
    }

    if (parseInt(formData.stock) < 0) {
      setError('El stock no puede ser negativo');
      return;
    }

    setLoading(true);
    setError('');

    const productData = {
      tipo: formData.tipo,
      marca: formData.marca.trim(),
      nombre: formData.nombre.trim(),
      peso: parseInt(formData.peso),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock) || 0,
      precio: parseFloat(formData.precio) || 0
    };

    const result = await onSave(productData);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-900 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-gray-100">
            {item ? 'Editar Producto' : 'Agregar Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Tipo de producto
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Tabaco">Tabaco</option>
              <option value="Producto">Producto</option>
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Marca *
            </label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              placeholder="Ej: Al Fakher, Adalya..."
              className="input-field"
              required
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Nombre del producto *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Menta, Love 66..."
              className="input-field"
              required
            />
          </div>

          {/* Peso */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Peso (gramos) *
            </label>
            <input
              type="number"
              name="peso"
              value={formData.peso}
              onChange={handleChange}
              placeholder="50"
              min="1"
              className="input-field"
              required
            />
          </div>

          {/* Stock actual */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Stock actual *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="input-field"
              required
            />
          </div>

          {/* Stock mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Stock mínimo
            </label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              placeholder="5"
              min="0"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alerta cuando el stock sea igual o menor a este valor
            </p>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Precio (€)
            </label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              placeholder="4.50"
              min="0"
              step="0.01"
              className="input-field"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                item ? 'Actualizar' : 'Agregar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;