import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

/**
 * Hook para acceder al contexto de autenticación
 * @function useAuth
 * @returns {Object} Objeto con datos y métodos de autenticación
 * @returns {Object|null} returns.user - Datos del usuario autenticado o null
 * @returns {Function} returns.login - Función para iniciar sesión
 * @returns {Function} returns.logout - Función para cerrar sesión
 * @returns {boolean} returns.loading - Estado de carga inicial
 * @returns {boolean} returns.isAuthenticated - True si el usuario está autenticado
 * @throws {Error} Error si se usa fuera del AuthProvider
 * @description Hook que proporciona acceso al estado y métodos de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

/**
 * Proveedor del contexto de autenticación para la aplicación
 * @function AuthProvider
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto
 * @returns {JSX.Element} Proveedor del contexto de autenticación
 * @description Componente que maneja el estado global de autenticación,
 * persiste la sesión en localStorage y proporciona métodos de login/logout
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario logueado al iniciar
    const token = localStorage.getItem('koloaToken');
    const userData = localStorage.getItem('koloaUser');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('koloaToken');
        localStorage.removeItem('koloaUser');
      }
    }
    
    setLoading(false);
  }, []);

  /**
   * Inicia sesión con un código PIN de 4 dígitos
   * @function login
   * @async
   * @param {string} code - Código PIN de 4 dígitos del usuario
   * @returns {Promise<Object>} Resultado del login
   * @returns {boolean} returns.success - True si el login fue exitoso
   * @returns {string} [returns.error] - Mensaje de error si el login falló
   * @description Envía el código PIN al servidor, guarda el token y datos del usuario
   * en localStorage si es exitoso, y actualiza el estado de autenticación
   */
  const login = async (code) => {
    try {
      const response = await authAPI.login(code);
      
      if (response.success) {
        // Guardar token y datos del usuario
        localStorage.setItem('koloaToken', response.token);
        localStorage.setItem('koloaUser', JSON.stringify(response.user));
        setUser(response.user);
        return { success: true };
      }
      
      return { success: false, error: 'Error en login' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  /**
   * Cierra la sesión del usuario actual
   * @function logout
   * @async
   * @returns {Promise<void>} No retorna valor
   * @description Notifica al servidor del logout, limpia el estado de usuario
   * y elimina token y datos del usuario del localStorage
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('koloaToken');
      localStorage.removeItem('koloaUser');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};