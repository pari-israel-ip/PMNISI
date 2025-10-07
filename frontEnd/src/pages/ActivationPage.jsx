// Archivo: src/pages/ActivationPage.jsx

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function ActivationPage() {
  // ¡LA MAGIA! useParams captura los parámetros de la URL (:uidb64 y :token)
  const { uidb64, token } = useParams();

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/password-set-complete/`, {
        uidb64, // Enviamos el uidb64 capturado de la URL
        token,  // Enviamos el token capturado de la URL
        password,
        password2,
      });
      setMessage('¡Cuenta activada con éxito! Ahora puedes iniciar sesión.');
    } catch (err) {
      setError('El enlace de activación es inválido o ha expirado. Por favor, contacta al administrador.');
      console.error('Error de activación:', err);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Configura tu Contraseña</h1>
        
        {message && <p className="text-green-500 text-center">{message}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password">Nueva Contraseña</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md" required />
            </div>
            <div>
              <label htmlFor="password2">Confirmar Nueva Contraseña</label>
              <input type="password" id="password2" value={password2} onChange={(e) => setPassword2(e.target.value)} className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md" required />
            </div>
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">
              Activar Cuenta
            </button>
          </form>
        )}

        {message && (
          <div className="text-center mt-4">
            <Link to="/" className="text-blue-400 hover:underline">Ir a la página de inicio de sesión</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivationPage;