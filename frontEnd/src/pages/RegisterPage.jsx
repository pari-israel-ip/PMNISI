// Archivo: src/pages/RegisterPage.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [message, setMessage] = useState(''); // Para mensajes de éxito
  const [error, setError] = useState('');   // Para mensajes de error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/register/`, {
        email,
        first_name: firstName,
        last_name: lastName,
      });
      setMessage('¡Solicitud enviada con éxito! Por favor, espera la aprobación del administrador.');
    } catch (err) {
      setError('Hubo un error al enviar la solicitud. El correo puede que ya esté en uso.');
      console.error('Error de registro:', err);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Solicitar Registro</h1>
        
        {message && <p className="text-green-500 text-center">{message}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!message && ( // Ocultamos el formulario si el registro fue exitoso
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md" required />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">Nombre</label>
              <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md" required />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Apellido</label>
              <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md" required />
            </div>
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">
              Enviar Solicitud
            </button>
          </form>
        )}
        
        <p className="text-center text-sm text-gray-400">
          ¿Ya tienes una cuenta? <Link to="/" className="text-blue-400 hover:underline">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;