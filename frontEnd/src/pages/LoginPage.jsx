// Archivo: src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const bgImage = "https://www.policia.bo/wp-content/uploads/2025/02/CARCANCHO-FINAL.png";

  // --- VALIDACIONES AUXILIARES ---
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // --- MANEJADOR PARA EL CÓDIGO (SOLO NÚMEROS) ---
  const handleCodeChange = (e) => {
    const value = e.target.value;
    // Regex: Solo permite dígitos (0-9). Si intentas meter una letra, la ignora.
    if (/^\d*$/.test(value)) {
      setCode(value);
    }
  };

  // --- PASO 1: LOGIN ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación Manual Paso 1
    if (!email.trim()) { setError('Ingrese su correo institucional.'); return; }
    if (!isValidEmail(email)) { setError('Formato de correo inválido.'); return; }
    if (!password) { setError('Ingrese su contraseña.'); return; }

    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/token/`, { email, password });
      
      if (response.data.status === '2FA_required') {
        setTempToken(response.data.temp_token);
        setStep(2);
      } else {
        const { access, refresh } = response.data;
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Credenciales incorrectas. Verifique su correo y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- PASO 2: VERIFICACIÓN 2FA ---
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación Manual Paso 2 (Aquí eliminamos el mensaje en inglés)
    if (!code) {
      setError('Por favor, ingrese el código de verificación.');
      return;
    }
    if (code.length !== 5) {
      setError('El código debe tener exactamente 5 dígitos.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/token/verify-2fa/`, {
        temp_token: tempToken,
        code: code,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      navigate('/dashboard');
    } catch (err) {
      setError('Código de verificación incorrecto o expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ESTILOS ---
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
          <img src={bgImage} alt="Escudo Policía" className="w-20 h-auto mx-auto mb-4 drop-shadow-lg" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Sistema de Análisis Predictivo
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {step === 1 ? 'Ingrese sus credenciales institucionales' : 'Verificación de seguridad requerida'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        {step === 1 ? (
          // AÑADIDO noValidate para evitar mensajes en inglés
          <form onSubmit={handleLoginSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Correo Institucional</label>
              <input
                type="email"
                id="email"
                className={inputClasses}
                placeholder="nombre.apellido@policia.bo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Contraseña</label>
              <input
                type="password"
                id="password"
                className={inputClasses}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className={buttonClasses} disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>
        ) : (
          // AÑADIDO noValidate y lógica de solo números
          <form onSubmit={handle2FASubmit} className="space-y-6" noValidate>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-4">
                Hemos enviado un código de 5 dígitos a: <span className="font-bold text-white">{email}</span>
              </p>
              <input 
                type="text" // Usamos text pero controlamos la entrada
                inputMode="numeric" // Teclado numérico en móviles
                pattern="[0-9]*"
                id="code" 
                value={code} 
                onChange={handleCodeChange} // <-- AQUÍ ESTÁ EL FILTRO DE SOLO NÚMEROS
                className={`${inputClasses} text-center text-2xl tracking-widest font-mono`}
                placeholder="00000"
                maxLength={5}
                autoFocus
                autoComplete="one-time-code" // Ayuda a autocompletar SMS
              />
            </div>
            <button type="submit" className={buttonClasses} disabled={isLoading}>
              {isLoading ? 'Validando...' : 'Verificar Código'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-400 hover:text-white transition-colors mt-2">
              ← Volver al inicio
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-gray-700 pt-4">
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="font-medium text-[#8FBC8F] hover:text-[#556B2F] transition-colors">
              ¿Olvidó su contraseña?
            </Link>
            <Link to="/register" className="font-medium text-[#8FBC8F] hover:text-[#556B2F] transition-colors">
              Solicitar Acceso
            </Link>
          </div>
        </div>
        
      </div>
      <p className="absolute bottom-4 text-xs text-gray-500">
        © 2025 Policía Boliviana - División de Tecnología
      </p>
    </div>
  );
}

export default LoginPage;