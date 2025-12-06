// Archivo: src/pages/ForgotPasswordPage.jsx

import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Imagen de fondo (Escudo Policial) - Misma que en el Login
  const bgImage = "https://upload.wikimedia.org/wikipedia/commons/f/f7/Emblema_Polic%C3%ADa_Boliviana.jpg";

  // Función auxiliar para validar correo
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // --- VALIDACIÓN MANUAL ---
    if (!email.trim()) {
      setError('Por favor, ingrese su correo institucional.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('El formato del correo no es válido (ej: usuario@policia.bo).');
      return;
    }

    setIsLoading(true);

    try {
      // Llamada al endpoint (asegúrate de tener este endpoint creado en el backend, lo haremos después si no)
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/password-reset/`, { email });
      
      setMessage('Si existe una cuenta con ese correo, se ha enviado un enlace de restablecimiento.');
    } catch (err) {
      // Por seguridad, mostramos el mismo mensaje de éxito o un error genérico si el servidor falla
      console.error(err);
      setMessage('Si existe una cuenta con ese correo, se ha enviado un enlace de restablecimiento.');
    } finally {
      setIsLoading(false);
    }
  };

  // Estilos comunes (Consistentes con el Login)
  const inputClasses = "w-full px-4 py-3 mt-1 text-white bg-gray-900/80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-transparent placeholder-gray-500 transition-all";
  const buttonClasses = "w-full py-3 px-4 bg-[#556B2F] hover:bg-[#4b5320] text-white font-bold rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative bg-black"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 20, 10, 0.9), rgba(5, 15, 5, 0.95)), url('${bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700">
        
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Recuperar Contraseña
          </h1>
          {!message && (
            <p className="mt-2 text-sm text-gray-400">
              Ingrese su correo institucional para recibir un enlace de restablecimiento.
            </p>
          )}
        </div>

        {/* Mensaje de Error (Validación) */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        {/* Mensaje de Éxito (Envío) */}
        {message ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-900/50 border border-green-700 rounded text-green-200 text-sm">
              {message}
            </div>
            <p className="text-sm text-gray-400">
              Revise su bandeja de entrada y la carpeta de spam.
            </p>
            <Link to="/" className={buttonClasses + " block text-center no-underline"}>
              Volver al Inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Correo Institucional
              </label>
              <input
                type="email"
                id="email"
                className={inputClasses}
                placeholder="nombre.apellido@policia.bo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className={buttonClasses} disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar Enlace'}
            </button>
          </form>
        )}

        {!message && (
          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-[#8FBC8F] hover:text-[#556B2F] transition-colors font-medium">
              ← Volver al Inicio de Sesión
            </Link>
          </div>
        )}
        
      </div>
      
      {/* Footer Institucional */}
      <p className="absolute bottom-4 text-xs text-gray-500">
        © 2025 Policía Boliviana - División de Tecnología
      </p>
    </div>
  );
}

export default ForgotPasswordPage;