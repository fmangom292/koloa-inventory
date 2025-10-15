import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (code.length !== 4) {
      setError('El código debe tener 4 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(code);
    
    if (!result.success) {
      setError(result.error);
      setCode('');
    }
    
    setLoading(false);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">K</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Koloa Inventory</h1>
          <p className="text-gray-400">Ingresa tu código de acceso</p>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PIN Input */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Código PIN
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••"
                  value={code}
                  onChange={handleCodeChange}
                  className="input-field text-center text-2xl font-mono tracking-widest"
                  maxLength="4"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-400">
                  Introduce tu código de 4 dígitos
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || code.length !== 4}
                className="w-full btn-primary text-lg py-3"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </div>
                ) : (
                  'Acceder'
                )}
              </button>
            </form>

            {/* Development Helper */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-dark-700">
                <p className="text-xs text-gray-500 text-center">
                  Desarrollo: Código admin = 1234
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 Koloa Pub - Sistema de Inventario
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;