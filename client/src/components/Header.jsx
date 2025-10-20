import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';

const Header = ({ user, onCartClick }) => {
  const { logout } = useAuth();
  const { getTotalItems } = useCart();

  const handleLogout = async () => {
    if (window.confirm('¿Cerrar sesión?')) {
      await logout();
    }
  };

  return (
    <header className="bg-dark-900 border-b border-dark-700 shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Koloa Inventory</h1>
              <p className="text-gray-400 text-sm">Sistema de gestión</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-gray-100 font-medium">{user?.name}</p>
              <p className="text-gray-400 text-sm">Administrador</p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center space-x-2"
              title="Ver pedido"
            >
              <span className="text-lg">📝</span>
              <span className="hidden sm:inline text-sm font-medium">Pedido</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems() > 99 ? '99+' : getTotalItems()}
                </span>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
              title="Cerrar sesión"
            >
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;