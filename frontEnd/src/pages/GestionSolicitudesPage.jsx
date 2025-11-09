// Archivo: src/pages/GestionSolicitudesPage.jsx (PARTE 1: LÓGICA)

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function GestionSolicitudesPage() {
  // --- ESTADOS DEL COMPONENTE ---
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  // --- FUNCIÓN PARA MOSTRAR NOTIFICACIONES TEMPORALES ---
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 4000); // La notificación desaparece después de 4 segundos
  };

  // --- FUNCIÓN PRINCIPAL PARA CARGAR LOS DATOS ---
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/all-users/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setUsers(response.data);
    } catch (err) {
      setError('No se pudieron cargar los usuarios.');
      if (err.response && err.response.status === 401) navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFECTO PARA CARGAR LOS DATOS AL INICIAR ---
  useEffect(() => {
    fetchUsers();
  }, []);

  // --- MANEJADORES DE ACCIONES DEL COMANDANTE ---

  const handleApprove = async (userId) => {
    const rolId = prompt("Ingresa el ID del rol a asignar (2=Subordinado, 3=Secretaria):", "2");
    if (!rolId) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/approve-user/${userId}/`,
        { rol_id: parseInt(rolId) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      showNotification('Usuario aprobado y correo de activación enviado.', 'success');
      fetchUsers(); 
    } catch (err) {
      showNotification('Error al aprobar el usuario.', 'error');
      console.error('Error approving user:', err);
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('¿Seguro que quieres rechazar y eliminar esta solicitud?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/reject-user/${userId}/`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      showNotification('Usuario rechazado y eliminado.', 'success');
      fetchUsers(); 
    } catch (err) {
      showNotification('Error al rechazar el usuario.', 'error');
      console.error('Error rejecting user:', err);
    }
  };

  const handleInitiateHandover = async (userId) => {
    if (!confirm('¿Seguro que quieres nominar a este usuario como tu sucesor?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/iniciar-relevo/${userId}/`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      showNotification('Nominación para relevo de mando iniciada.', 'success');
      fetchUsers(); 
    } catch (err) {
      showNotification('Error al iniciar el relevo.', 'error');
      console.error('Error initiating handover:', err);
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    const action = isActive ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que quieres ${action} a este usuario?`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/toggle-active/${userId}/`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      showNotification(`Usuario ${action}do con éxito.`, 'success');
      fetchUsers();
    } catch (err) {
      showNotification(`Error al ${action} el usuario.`, 'error');
      console.error(err);
    }
  };

  const handleReassignRole = async (userId) => {
    const rolId = prompt("Ingresa el NUEVO ID del rol (2=Subordinado, 3=Secretaria):", "2");
    if (!rolId) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/reassign-role/${userId}/`,
        { rol_id: parseInt(rolId) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      showNotification('Rol reasignado con éxito.', 'success');
      fetchUsers();
    } catch (err) {
      showNotification('Error al reasignar el rol.', 'error');
    }
  };

  // --- RENDERIZADO CONDICIONAL INICIAL ---
  if (isLoading) return <div className="p-8 text-white">Cargando usuarios...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
// Archivo: src/pages/GestionSolicitudesPage.jsx (PARTE 2: JSX)

  return (
    <div className="p-8 text-white">
      {/* BARRA DE NOTIFICACIÓN */}
      {notification.message && (
        <div 
          className={`fixed top-20 right-8 p-4 rounded-md shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {notification.message}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios y Solicitudes</h1>
      
      {users.length === 0 ? (
        <p className="text-gray-400">No hay usuarios en el sistema.</p>
      ) : (
        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-slate-700">
              <tr>
                <th className="px-6 py-3">Correo</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Estado de Aprobación</th>
                <th className="px-6 py-3">Estado de Cuenta</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{`${user.first_name} ${user.last_name}`}</td>
                  <td className="px-6 py-4">{user.rol?.name || 'No asignado'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.estado_aprobacion === 'APROBADO' ? 'bg-green-500/20 text-green-400' :
                        user.estado_aprobacion === 'PENDIENTE' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-cyan-500/20 text-cyan-400' // NOMINADO
                      }`}
                    >
                      {user.estado_aprobacion}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex flex-wrap gap-x-4 gap-y-2 items-center">
                    {user.estado_aprobacion === 'PENDIENTE' && (
                      <>
                        <button onClick={() => handleApprove(user.id)} className="font-medium text-green-500 hover:underline">Aprobar</button>
                        <button onClick={() => handleReject(user.id)} className="font-medium text-red-500 hover:underline">Rechazar</button>
                      </>
                    )}
                    {user.rol?.name === 'Subordinado' && user.estado_aprobacion === 'APROBADO' && (
                      <button onClick={() => handleInitiateHandover(user.id)} className="font-medium text-cyan-500 hover:underline">
                        Iniciar Relevo
                      </button>
                    )}
                    {user.rol?.name !== 'Comandante' && user.estado_aprobacion !== 'PENDIENTE' && (
                      <>
                        <button onClick={() => handleToggleActive(user.id, user.is_active)} className={`font-medium ${user.is_active ? 'text-yellow-500' : 'text-blue-500'} hover:underline`}>
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => handleReassignRole(user.id)} className="font-medium text-purple-500 hover:underline">
                          Reasignar Rol
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GestionSolicitudesPage;