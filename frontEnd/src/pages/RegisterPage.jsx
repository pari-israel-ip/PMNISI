// Archivo: src/pages/RegisterPage.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [message, setMessage] = useState(''); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bgImage = "https://www.policia.bo/wp-content/uploads/2025/02/CARCANCHO-FINAL.png";

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // --- MANEJADOR DE CAMBIOS INTELIGENTE ---
  const handleNameChange = (setter) => (e) => {
    // 1. Convertimos a mayúsculas inmediatamente
    let value = e.target.value.toUpperCase();

    // 2. Validamos: Solo letras (A-Z, Ñ) y espacios. Nada más.
    // Si el último caracter ingresado no es letra ni espacio, lo ignoramos.
    if (value.length > 0 && !/^[A-ZÑÁÉÍÓÚ\s]+$/.test(value)) {
      return;
    }

    // 3. REGLA DE ORO: No permitir múltiples espacios seguidos.
    // Si hay dos espacios, los reemplazamos por uno solo inmediatamente.
    value = value.replace(/\s\s+/g, ' ');

    // 4. No permitir empezar con espacio
    if (value.startsWith(' ')) {
        return;
    }

    setter(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // --- LIMPIEZA FINAL AL ENVIAR ---
    // .trim() quita espacios sobrantes al inicio y al final (ej: "JUAN " -> "JUAN")
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanFirstName || !cleanLastName) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    
    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
        setError('Los nombres y apellidos deben tener al menos 2 letras.');
        return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('El formato del correo no es válido.');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/register/`, {
        email: cleanEmail,
        first_name: cleanFirstName, // Enviamos "JUAN CARLOS"
        last_name: cleanLastName,   // Enviamos "PEREZ LOPEZ"
      });
      setMessage('Solicitud enviada con éxito. Espere la aprobación del administrador.');
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.email) {
         setError('Este correo ya está registrado en el sistema.');
      } else {
         setError('Hubo un error al enviar la solicitud. Inténtelo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 mt-1 text-white bg-gray-900/80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-transparent placeholder-gray-500 transition-all uppercase";
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
            Solicitud de Acceso
          </h1>
        </div>
        
        {message ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-900/50 border border-green-700 rounded text-green-200 text-sm font-medium">
              {message}
            </div>
            <p className="text-sm text-gray-400">
              Recibirá un correo electrónico cuando su cuenta haya sido aprobada.
            </p>
            <Link to="/" className={buttonClasses + " block text-center no-underline"}>
              Volver al Inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm text-center animate-pulse">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">Nombres</label>
              <input 
                type="text" 
                id="firstName" 
                className={inputClasses}
                placeholder="EJ. JUAN CARLOS"
                value={firstName} 
                onChange={handleNameChange(setFirstName)} 
              />
              <p className="text-xs text-gray-500 mt-1">Si tiene más de un nombre, escríbalos separados por un espacio.</p>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Apellidos</label>
              <input 
                type="text" 
                id="lastName" 
                className={inputClasses}
                placeholder="EJ. PEREZ LOPEZ"
                value={lastName} 
                onChange={handleNameChange(setLastName)} 
              />
              <p className="text-xs text-gray-500 mt-1">Ingrese sus apellidos paterno y materno.</p>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Correo Institucional</label>
              <input 
                type="email" 
                id="email" 
                className={inputClasses.replace('uppercase', '')} 
                placeholder="nombre.apellido@policia.bo"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <button type="submit" className={buttonClasses} disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        )}
        
        {!message && (
            <div className="text-center mt-4">
                <p className="text-sm text-gray-400">
                ¿Ya tiene una cuenta? <Link to="/" className="text-[#8FBC8F] hover:text-[#556B2F] font-medium transition-colors">Inicie sesión aquí</Link>
                </p>
            </div>
        )}
      </div>

      <p className="absolute bottom-4 text-xs text-gray-500">
        © 2025 Policía Boliviana - División de Tecnología
      </p>
    </div>
  );
}

export default RegisterPage;