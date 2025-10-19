import HighlightText from './HighlightText';

const InventoryList = ({ items, loading, onEdit, onDelete, onAddToCart, searchTerm = '' }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="h-4 bg-dark-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-dark-700 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-dark-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-500 text-2xl">{searchTerm ? '�' : '�📦'}</span>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">
          {searchTerm ? 'No se encontraron productos' : 'No hay productos'}
        </h3>
        <p className="text-gray-500">
          {searchTerm 
            ? `No hay productos que coincidan con "${searchTerm}"` 
            : 'Agrega tu primer producto al inventario'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <InventoryCard
          key={item.id}
          item={item}
          searchTerm={searchTerm}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

const InventoryCard = ({ item, searchTerm, onEdit, onDelete, onAddToCart }) => {
  const isLowStock = item.stock < item.minStock;
  const stockPercentage = item.minStock > 0 ? (item.stock / item.minStock) * 100 : 100;

  const getStockColor = () => {
    if (isLowStock) return 'text-red-400';
    if (stockPercentage < 200) return 'text-amber-400';
    return 'text-green-400';
  };

  const getTypeIcon = () => {
    return item.tipo === 'Tabaco' ? '🍃' : '📦';
  };

  return (
    <div className="card hover:border-dark-600 transition-all duration-200">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{getTypeIcon()}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-100 truncate">
                <HighlightText text={item.nombre} highlight={searchTerm} />
              </h3>
              <p className="text-sm text-gray-400 truncate">
                <HighlightText text={item.marca} highlight={searchTerm} />
              </p>
            </div>
          </div>
          
          {isLowStock && (
            <span className="bg-red-900/50 text-red-300 text-xs px-2 py-1 rounded-full">
              Stock bajo
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Tipo:</span>
            <span className="text-gray-200">{item.tipo}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Peso:</span>
            <span className="text-gray-200">{item.peso}g</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Stock:</span>
            <span className={`font-medium ${getStockColor()}`}>
              {item.stock} / {item.minStock} min
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Precio:</span>
            <span className="text-gray-200 font-medium">{item.precio.toFixed(2)}€</span>
          </div>
        </div>

        {/* Stock Bar */}
        <div className="mb-4">
          <div className="w-full bg-dark-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isLowStock ? 'bg-red-500' : 
                stockPercentage < 200 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onAddToCart(item)}
            className="bg-green-900/50 hover:bg-green-900/70 text-green-300 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center"
            title="Añadir a pedido"
          >
            +
          </button>
          <button
            onClick={() => onEdit(item)}
            className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-200 py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="bg-red-900/50 hover:bg-red-900/70 text-red-300 py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryList;