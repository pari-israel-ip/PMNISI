// Archivo: src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';

function LoginPage() {
  // 1. ESTADO: Creamos "cajas" para guardar lo que el usuario escribe.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Un estado para guardar mensajes de error

  // 2. NAVEGACIÓN: Obtenemos una función para redirigir al usuario.
  const navigate = useNavigate();

  // 3. MANEJADOR DEL ENVÍO: Esta función se ejecuta cuando el usuario hace clic en "Ingresar".
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue (comportamiento por defecto de los formularios)
    setError(''); // Limpiamos cualquier error anterior

    try {
      // 4. LLAMADA A LA API: Usamos axios para enviar los datos a nuestro backend.
  // ... dentro de la función handleSubmit ...
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/token/`, {
    email: email,
    password: password,
});

      // 5. MANEJO DEL ÉXITO: Si el login es correcto...
      const { access, refresh } = response.data;
      
      // Guardamos los tokens en el localStorage del navegador para usarlos después.
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      // Redirigimos al usuario al dashboard.
      navigate('/dashboard');

    } catch (err) {
      // 6. MANEJO DEL ERROR: Si el backend devuelve un error...
      setError('Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.');
      console.error('Error de inicio de sesión:', err);
    }
  };

  return (

    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
        {/* Mostramos el mensaje de error si existe */}
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
              value={email} // Conectamos el input al estado 'email'
              onChange={(e) => setEmail(e.target.value)} // Cada vez que se escribe, actualizamos el estado
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
              value={password} // Conectamos el input al estado 'password'
              onChange={(e) => setPassword(e.target.value)} // Actualizamos el estado
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors"
          >
            Ingresar
          </button>
        </form>
        <p className="text-center text-sm text-gray-400">
          ¿No tienes una cuenta? <Link to="/register" className="text-blue-400 hover:underline">Solicita tu registro aquí</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;