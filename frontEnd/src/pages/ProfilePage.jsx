// Archivo: src/pages/ProfilePage.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

function ProfilePage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { refreshUser } = useUser();

  // Cargar datos al entrar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
         `${import.meta.env.VITE_API_BASE_URL}/api/profile/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = response.data;
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setEmail(data.email);
        setRol(data.rol?.name || 'Sin Rol');
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información del perfil.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- MANEJADOR DE CAMBIOS INTELIGENTE (Igual que en Registro) ---
  const handleNameChange = (setter) => (e) => {
    let value = e.target.value.toUpperCase();
    if (value.length > 0 && !/^[A-ZÑÁÉÍÓÚ\s]+$/.test(value)) return;
    value = value.replace(/\s\s+/g, ' ');
    if (value.startsWith(' ')) return;
    setter(value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
        setError('Los nombres deben tener al menos 2 letras.');
        return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/profile/`,
        { first_name: cleanFirstName, last_name: cleanLastName },
        { headers: { 'Authorization': `Bearer ${token}` } }
        ); 
      setMessage('Perfil actualizado con éxito.');
      await refreshUser(); // Actualiza el Navbar automáticamente

    } catch (err) {
      setError('Error al guardar los cambios.');
    }
  };

  if (isLoading) return <div className="p-8 text-white">Cargando perfil...</div>;

  return (
    <div className="bg-slate-900 min-h-screen p-8 text-white flex justify-center">
      <div className="w-full max-w-2xl bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-700">
        <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-4">Mi Perfil</h1>

        {message && <div className="p-4 mb-6 bg-green-900/50 border border-green-700 rounded text-green-200">{message}</div>}
        {error && <div className="p-4 mb-6 bg-red-900/50 border border-red-700 rounded text-red-200">{error}</div>}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Correo Institucional</label>
              <input type="text" value={email} disabled className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Rol / Cargo</label>
              <input type="text" value={rol} disabled className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-gray-500 cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Nombres</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={handleNameChange(setFirstName)}
              className="w-full px-4 py-2 bg-slate-900 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-[#556B2F] focus:outline-none uppercase"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">Apellidos</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={handleNameChange(setLastName)}
              className="w-full px-4 py-2 bg-slate-900 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-[#556B2F] focus:outline-none uppercase"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="px-6 py-2 bg-[#556B2F] hover:bg-[#4b5320] text-white font-bold rounded-md shadow transition-colors">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;