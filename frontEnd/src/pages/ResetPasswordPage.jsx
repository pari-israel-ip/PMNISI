// Archivo: src/pages/ResetPasswordPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function ResetPasswordPage() {
  const { uidb64, token } = useParams();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage(''); // Limpiamos ambos al enviar

    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      // Usamos el endpoint de 'password-reset-confirm'
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/password-reset-confirm/`, {
        uidb64, 
        token, 
        password, 
        password2
      });
      // El backend debería devolver un mensaje de éxito
      setMessage(response.data.status || 'Contraseña actualizada con éxito.');
    } catch (err) {
      // Tomamos el error del backend o ponemos uno genérico
      setError(err.response?.data?.detail || 'El enlace es inválido o ha expirado.');
      console.error('Error en reseteo:', err);
    }
  };

  // Usamos los estilos y clases base del ActivationPage para consistencia
  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Crear Nueva Contraseña</h1>

        {message ? (
          // Vista de Éxito
          <div>
            <p className="text-green-400 text-center">{message}</p>
            <Link to="/" className="block text-center mt-4 text-blue-400 hover:underline">
              Ir a Inicio de Sesión
            </Link>
          </div>
        ) : (
          // Vista de Formulario
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Nueva Contraseña
              </label>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-300">
                Confirmar Nueva Contraseña
              </label>
              <input 
                type="password" 
                id="password2" 
                value={password2} 
                onChange={(e) => setPassword2(e.target.value)} 
                className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors"
            >
              Restablecer Contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;