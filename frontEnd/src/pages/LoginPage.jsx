// Archivo: src/pages/LoginPage.jsx (VERSIÓN 2FA COMPLETA CON DEBUG)

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  // --- ESTADOS PARA MANEJAR EL FLUJO DE DOS PASOS ---
  const [step, setStep] = useState(1); // 1 para login, 2 para 2FA
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');
  
  // --- Estados del formulario original ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- PASO 1: Enviar email y contraseña ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Apuntamos al endpoint que inicia el 2FA
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/token/`, { email, password });
      
      // --- ¡EL MICRÓFONO ESPÍA! (AÑADIDO) ---
      // Esto se ejecutará si el backend responde con éxito (status 200-299)
      console.log('Respuesta del backend (Paso 1 - ÉXITO):', response.data);
      // --- FIN DEL MICRÓFONO ---
      
      // Si el backend dice que se requiere 2FA...
      if (response.data.status === '2FA_required') {
        setTempToken(response.data.temp_token); // Guardamos el token temporal
        setStep(2); // Pasamos al segundo paso (vista de código)
      }
    } catch (err) {
      setError('Correo o contraseña incorrectos.');

      // --- DEBUG MEJORADO (AÑADIDO) ---
      // Esto se ejecutará si el backend responde con error (status 4xx, 5xx) o hay un error de red
      console.error('Error en Paso 1 Login (DETALLE):', err);
      if (err.response) {
          // El servidor respondió con un código de estado fuera de 2xx
          console.error('Datos del error (response.data):', err.response.data);
          console.error('Status del error (response.status):', err.response.status);
      } else if (err.request) {
          // La solicitud se hizo pero no se recibió respuesta (ej. el backend está caído)
          console.error('No se recibió respuesta (err.request):', err.request);
      } else {
          // Algo más pasó al configurar la solicitud
          console.error('Error al configurar la solicitud (err.message):', err.message);
      }
      // --- FIN DEBUG ---
    }
  };

  // --- PASO 2: Enviar el código 2FA ---
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Apuntamos al endpoint de verificación
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/token/verify-2fa/`, {
        temp_token: tempToken,
        code: code,
      });
      // (Añadimos un console.log aquí también por si acaso)
      console.log('Respuesta del backend (Paso 2 - ÉXITO):', response.data);

      // Si el código es correcto, recibimos los tokens finales
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      navigate('/dashboard'); // Enviamos al dashboard
    } catch (err) {
      setError('Código inválido o expirado. Inténtalo de nuevo.');
      
      // --- DEBUG MEJORADO (AÑADIDO) ---
      console.error('Error en Paso 2 2FA (DETALLE):', err);
      if (err.response) {
        console.error('Datos del error (response.data):', err.response.data);
        console.error('Status del error (response.status):', err.response.status);
      } else if (err.request) {
        console.error('No se recibió respuesta (err.request):', err.request);
      } else {
        console.error('Error al configurar la solicitud (err.message):', err.message);
      }
      // --- FIN DEBUG ---
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-md">
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {/* --- RENDERIZADO CONDICIONAL --- */}
        
        {step === 1 ? (
          // --- FORMULARIO PASO 1: Email y Contraseña ---
          <>
            <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
            <form onSubmit={handleLoginSubmit} className="space-y-6">
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
                  required
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
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors"
              >
                Ingresar
              </button>
            </form>
          </>
        ) : (
          // --- FORMULARIO PASO 2: Código 2FA ---
          <>
            <h1 className="text-2xl font-bold text-center">Verificación de Dos Factores</h1>
            <p className="text-sm text-gray-400 text-center">Hemos enviado un código a tu correo ({email}). Por favor, ingrésalo a continuación.</p>
            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300">
                  Código de Verificación
                </label>
                <input 
                  type="text" 
                  id="code" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="12345"
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-white transition-colors"
              >
                Verificar
              </button>
            </form>
          </>
        )}

        {/* --- Enlaces inferiores (se muestran en ambos pasos) --- */}
        <div className="text-sm text-center mt-4">
          <Link to="/forgot-password" className="font-medium text-blue-400 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        
        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tienes una cuenta? <Link to="/register" className="text-blue-400 hover:underline">Solicita tu registro aquí</Link>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;