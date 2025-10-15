import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

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