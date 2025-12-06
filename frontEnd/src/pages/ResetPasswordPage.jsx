// Archivo: src/pages/ResetPasswordPage.jsx (VERSIÓN FINAL: VALIDACIÓN ROBUSTA + OJITO 'SHOW/HIDE')

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function ResetPasswordPage() {
  const { uidb64, token } = useParams();
  
  // --- ESTADOS ---
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para el "Ojito"
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Imagen de fondo
  const bgImage = "https://upload.wikimedia.org/wikipedia/commons/f/f7/Emblema_Polic%C3%ADa_Boliviana.jpg";

  // --- HELPER: Validar contraseña fuerte ---
  const isStrongPassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isStrongPassword(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.');
      return;
    }

    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/password-reset-confirm/`, {
        uidb64, 
        token, 
        password, 
        password2
      });
      setMessage('Contraseña actualizada con éxito.');
    } catch (err) {
      console.error("Error del backend:", err.response?.data);
      const mensajeError = 
        err.response?.data?.error || 
        err.response?.data?.detail || 
        'El enlace es inválido o ha expirado.';
      setError(mensajeError);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ESTILOS ---
  // Agregué 'pr-10' (padding-right) para que el texto no se monte encima del ojito
  const inputClasses = "w-full pl-4 pr-12 py-3 mt-1 text-white bg-gray-900/80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-transparent placeholder-gray-500 transition-all";
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
          <img src={bgImage} alt="Escudo" className="w-16 h-auto mx-auto mb-4 drop-shadow-md opacity-80" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Crear Nueva Contraseña
          </h1>
        </div>

        {message ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-900/50 border border-green-700 rounded text-green-200 text-sm font-medium">
              {message}
            </div>
            <Link to="/" className={buttonClasses + " block text-center no-underline"}>
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm text-center animate-pulse">
                {error}
              </div>
            )}
            
            {/* INPUT 1: Con Ojito */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Nueva Contraseña
              </label>
              <div className="relative mt-1">
                <input 
                  type={showPassword ? "text" : "password"} // Cambia dinámicamente
                  id="password" 
                  className={inputClasses}
                  placeholder="Ej: Policia123$"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                {/* Botón del Ojito */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    // Ícono Ojo Abierto (Ver)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    // Ícono Ojo Cerrado (Ocultar)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.242 3 3 0 004.242 4.242z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Mínimo 8 caracteres, mayúscula, número y símbolo.
              </p>
            </div>

            {/* INPUT 2: Confirmación (Normalmente oculto por seguridad) */}
            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-300">
                Confirmar Nueva Contraseña
              </label>
              <input 
                type="password" 
                id="password2" 
                className={inputClasses}
                placeholder="Repita la contraseña"
                value={password2} 
                onChange={(e) => setPassword2(e.target.value)} 
              />
            </div>
            
            <button type="submit" className={buttonClasses} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}

      </div>
      
      <p className="absolute bottom-4 text-xs text-gray-500">
        © 2025 Policía Boliviana - División de Tecnología
      </p>
    </div>
  );
}

export default ResetPasswordPage;