import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInventory } from '../hooks/useInventory';
import Header from '../components/Header';
import InventoryList from '../components/InventoryList';
import ProductModal from '../components/ProductModal';
import ReportsModal from '../components/ReportsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEffect, useRef } from 'react';

const Dashboard = () => {
  const { user } = useAuth();
  const { items, loading, error, createItem, updateItem, deleteItem, clearError } = useInventory();
  const [showModal, setShowModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all'); // all, tabaco, producto, low-stock, out-of-stock
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  const filteredItems = items.filter(item => {
    // Filtro por tipo
    let typeMatch = false;
    if (filter === 'all') {
      typeMatch = true;
    } else if (filter === 'low-stock') {
      typeMatch = item.stock < item.minStock;
    } else if (filter === 'out-of-stock') {
      typeMatch = item.stock === 0;
    } else {
      typeMatch = item.tipo.toLowerCase() === filter;
    }
    
    // Filtro por búsqueda (nombre y marca)
    const searchMatch = searchTerm === '' || 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca.toLowerCase().includes(searchTerm.toLowerCase());
    
    return typeMatch && searchMatch;
  });

  const lowStockItems = items.filter(item => item.stock < item.minStock);
  const outOfStockItems = items.filter(item => item.stock === 0);
  const restockItems = items.filter(item => item.stock < item.minStock);

  const handleAddProduct = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditProduct = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSaveProduct = async (productData) => {
    let result;
    
    if (editingItem) {
      result = await updateItem(editingItem.id, productData);
    } else {
      result = await createItem(productData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingItem(null);
    }

    return result;
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteItem(id);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleLowStockFilter = () => {
    setFilter('low-stock');
    setSearchTerm(''); // Limpiar búsqueda para mostrar todos los de stock bajo
  };

  const handleOutOfStockFilter = () => {
    setFilter('out-of-stock');
    setSearchTerm(''); // Limpiar búsqueda para mostrar todos los sin stock
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilter('all');
  };

  // Atajo de teclado para enfocar el buscador (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape para limpiar búsqueda y filtros
      if (e.key === 'Escape') {
        if (searchTerm || filter !== 'all') {
          clearAllFilters();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, filter]);

  if (loading && items.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Alerts for low stock */}
        {lowStockItems.length > 0 && filter !== 'low-stock' && (
          <div className="mb-6 bg-amber-900/50 border border-amber-700 text-amber-200 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-amber-400 mr-2">⚠️</span>
                <span className="font-medium">
                  {lowStockItems.length} producto{lowStockItems.length !== 1 ? 's' : ''} con stock bajo
                </span>
              </div>
              <button
                onClick={handleLowStockFilter}
                className="text-amber-300 hover:text-amber-100 underline text-sm"
              >
                Ver todos
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-100">{items.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-xl">📦</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Tabacos</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {items.filter(item => item.tipo === 'Tabaco').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-xl">🍃</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLowStockFilter}
            className="card hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
            title="Ver productos con stock bajo"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Stock Bajo</p>
                  <p className="text-2xl font-bold text-amber-400">{lowStockItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-amber-400 text-xl">⚠️</span>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleOutOfStockFilter}
            className="card hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
            title="Ver productos sin stock"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-400">{outOfStockItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-red-400 text-xl">🚫</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Search and Controls */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nombre o marca... (Ctrl+K)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                title="Limpiar búsqueda"
              >
                <span className="text-lg">✕</span>
              </button>
            )}
          </div>

          {/* Filter Buttons and Action Buttons */}
          <div className="flex flex-col gap-4">
            {/* Type Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Filtrar por tipo:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Todos ({items.length})
                  </button>
                  <button
                    onClick={() => setFilter('tabaco')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'tabaco' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Tabacos ({items.filter(item => item.tipo === 'Tabaco').length})
                  </button>
                  <button
                    onClick={() => setFilter('producto')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'producto' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Productos ({items.filter(item => item.tipo === 'Producto').length})
                  </button>
                  <button
                    onClick={handleLowStockFilter}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      filter === 'low-stock' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
                    }`}
                  >
                    <span className="mr-1">⚠️</span>
                    Stock Bajo ({lowStockItems.length})
                  </button>
                  <button
                    onClick={handleOutOfStockFilter}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      filter === 'out-of-stock' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                    }`}
                  >
                    <span className="mr-1">🚫</span>
                    Sin Stock ({outOfStockItems.length})
                  </button>
                  {(filter !== 'all' || searchTerm) && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-700 text-red-200 hover:bg-red-600 transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 self-start">
                <button
                  onClick={() => setShowReportsModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  title="Generar informes de reposición"
                >
                  <span className="mr-2">📊</span>
                  Informes
                  {restockItems.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {restockItems.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleAddProduct}
                  className="btn-primary flex items-center justify-center"
                >
                  <span className="mr-2">+</span>
                  Agregar Producto
                </button>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {(searchTerm || filter !== 'all') && (
            <div className="flex items-center justify-between bg-blue-900/20 border border-blue-700 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">
                  {filter === 'low-stock' ? '⚠️' : filter === 'out-of-stock' ? '🚫' : '🔍'}
                </span>
                <span className="text-sm text-gray-300">
                  {!searchTerm && filter !== 'all' ? (
                    <span>
                      Mostrando <strong>{filteredItems.length}</strong> productos {
                        filter === 'low-stock' ? 'con stock bajo' :
                        filter === 'out-of-stock' ? 'sin stock' :
                        filter === 'tabaco' ? 'de tipo Tabaco' :
                        filter === 'producto' ? 'de tipo Producto' : ''
                      }
                    </span>
                  ) : searchTerm && filteredItems.length === 0 ? (
                    <span>No se encontraron productos que coincidan con <strong>"{searchTerm}"</strong></span>
                  ) : searchTerm ? (
                    <span>
                      Mostrando <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> productos para <strong>"{searchTerm}"</strong>
                      {filter !== 'all' && (
                        <span> en {
                          filter === 'tabaco' ? 'Tabacos' : 
                          filter === 'producto' ? 'Productos' : 
                          filter === 'low-stock' ? 'Stock Bajo' :
                          filter === 'out-of-stock' ? 'Sin Stock' : filter
                        }</span>
                      )}
                    </span>
                  ) : (
                    <span>
                      Mostrando <strong>{filteredItems.length}</strong> productos filtrados
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                title="Limpiar todos los filtros (Esc)"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Inventory List */}
        <InventoryList
          items={filteredItems}
          loading={loading}
          searchTerm={searchTerm}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />

        {/* Product Modal */}
        {showModal && (
          <ProductModal
            item={editingItem}
            onSave={handleSaveProduct}
            onClose={() => {
              setShowModal(false);
              setEditingItem(null);
            }}
          />
        )}

        {/* Reports Modal */}
        <ReportsModal
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
          items={items}
        />
      </main>
    </div>
  );
};

export default Dashboard;