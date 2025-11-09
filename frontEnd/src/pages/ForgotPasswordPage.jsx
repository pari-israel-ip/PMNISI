// Archivo: src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/password-reset/`, { email });
      setMessage(response.data.status);
    } catch (err) {
      // Mostramos el mismo mensaje de éxito aunque falle, por seguridad
      setMessage('Si existe una cuenta con ese correo, se ha enviado un enlace de reseteo.');
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg">
        <h1 className="text-2xl font-bold text-center">Recuperar Contraseña</h1>
        {message ? (
          <p className="text-green-400 text-center">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-400">Ingresa tu correo y te enviaremos un enlace para resetear tu contraseña.</p>
            <div>
              <label htmlFor="email">Correo Electrónico</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 bg-slate-700 rounded-md" required />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md">Enviar Enlace</button>
          </form>
        )}
        <p className="text-center"><Link to="/" className="text-sm text-blue-400 hover:underline">Volver a Inicio de Sesión</Link></p>
      </div>
    </div>
  );
}
export default ForgotPasswordPage;