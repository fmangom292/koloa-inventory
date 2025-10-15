import { useAuth } from '../hooks/useAuth';

const Header = ({ user }) => {
  const { logout } = useAuth();

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