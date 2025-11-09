import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // El hook DEBE estar aquí, dentro de la función.
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/token/`, {
        email: email,
        password: password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      navigate('/dashboard');

    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      console.error('Error de inicio de sesión:', err);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors"
          >
            Ingresar
          </button>
        </form>
        
        {/* --- CÓDIGO INTEGRADO --- */}
        <div className="text-sm text-center mt-4">
          <Link to="/forgot-password" className="font-medium text-blue-400 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        
        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tienes una cuenta? <Link to="/register" className="text-blue-400 hover:underline">Solicita tu registro aquí</Link>
        </p>
        {/* --- FIN DE LA INTEGRACIÓN --- */}

      </div>
    </div>
  );
}

export default LoginPage;