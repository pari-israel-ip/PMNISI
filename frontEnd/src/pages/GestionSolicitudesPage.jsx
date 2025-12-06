// Archivo: src/pages/GestionSolicitudesPage.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function GestionSolicitudesPage() {
  // --- ESTADOS ---
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  // Estado para el MODAL PERSONALIZADO
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: '',       // 'approve', 'reject', 'handover', 'toggle', 'reassign'
    userId: null,
    userName: '',
    isActive: false // Solo para toggle
  });
  const [selectedRole, setSelectedRole] = useState('2'); // Por defecto Subordinado (ID 2)

  const navigate = useNavigate();

  // --- NOTIFICACIONES ---
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  // --- CARGA DE DATOS ---
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/all-users/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setUsers(response.data);
    } catch (err) {
      setError('No se pudo cargar la lista de personal.');
      if (err.response?.status === 401) navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- MANEJADORES PARA ABRIR EL MODAL ---
  // En lugar de ejecutar la acción, abren la ventana de confirmación
  
  const openModal = (type, user) => {
    setModalConfig({
      isOpen: true,
      type,
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      isActive: user.is_active
    });
    setSelectedRole('2'); // Resetear rol por defecto
  };

  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  // --- EJECUCIÓN DE LA ACCIÓN (Al confirmar en el Modal) ---
  const executeAction = async () => {
    const { type, userId, isActive } = modalConfig;
    const token = localStorage.getItem('accessToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    try {
      if (type === 'approve') {
        await axios.post(`${baseUrl}/api/admin/approve-user/${userId}/`, { rol_id: parseInt(selectedRole) }, { headers });
        showNotification('Personal aprobado y rol asignado.', 'success');
      } 
      else if (type === 'reject') {
        await axios.post(`${baseUrl}/api/admin/reject-user/${userId}/`, {}, { headers });
        showNotification('Solicitud rechazada y eliminada.', 'success');
      }
      else if (type === 'handover') {
        await axios.post(`${baseUrl}/api/admin/iniciar-relevo/${userId}/`, {}, { headers });
        showNotification('Proceso de relevo iniciado.', 'success');
      }
      else if (type === 'toggle') {
        await axios.post(`${baseUrl}/api/admin/toggle-active/${userId}/`, {}, { headers });
        showNotification(`Usuario ${isActive ? 'desactivado' : 'activado'} correctamente.`, 'success');
      }
      else if (type === 'reassign') {
        await axios.post(`${baseUrl}/api/admin/reassign-role/${userId}/`, { rol_id: parseInt(selectedRole) }, { headers });
        showNotification('Rol reasignado correctamente.', 'success');
      }

      fetchUsers(); // Refrescar lista
      closeModal(); // Cerrar modal

    } catch (err) {
      showNotification('Error al procesar la solicitud.', 'error');
      console.error(err);
      closeModal();
    }
  };

  // --- RENDERIZADO ---
  if (isLoading) return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Cargando personal...</div>;
  if (error) return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="bg-[#1c261c] min-h-screen p-8 text-white relative">
      
      {/* Notificación Flotante */}
      {notification.message && (
        <div className={`fixed top-24 right-8 p-4 rounded-lg shadow-xl border-l-4 z-50 animate-fade-in-down ${
          notification.type === 'success' ? 'bg-gray-800 border-green-500 text-green-400' : 'bg-gray-800 border-red-500 text-red-400'
        }`}>
          <p className="font-semibold">{notification.type === 'success' ? 'Éxito' : 'Error'}</p>
          <p className="text-sm">{notification.message}</p>
        </div>
      )}

      {/* Encabezado */}
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Gestión de <span className="text-[#556B2F]">Personal</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Administración de solicitudes, roles y estados operativos.</p>
      </div>
      
      {/* Tabla */}
      <div className="overflow-hidden bg-[#1c261c] rounded-xl shadow-2xl border border-[#2f3e2f]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase bg-[#2f3e2f]">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider">Oficial / Usuario</th>
              <th className="px-6 py-4 font-bold tracking-wider">Correo Institucional</th>
              <th className="px-6 py-4 font-bold tracking-wider">Rol Actual</th>
              <th className="px-6 py-4 font-bold tracking-wider text-center">Estado Solicitud</th>
              <th className="px-6 py-4 font-bold tracking-wider text-center">Estado Cuenta</th>
              <th className="px-6 py-4 font-bold tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2f3e2f]">
            {users.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay registros en el sistema.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-[#253325] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{`${user.first_name} ${user.last_name}`}</td>
                  <td className="px-6 py-4 text-gray-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs font-mono text-gray-300">
                      {user.rol?.name || 'S/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        user.estado_aprobacion === 'APROBADO' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                        user.estado_aprobacion === 'PENDIENTE' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' :
                        'bg-cyan-900/50 text-cyan-400 border border-cyan-800'
                      }`}
                    >
                      {user.estado_aprobacion}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        user.is_active ? 'text-green-400' : 'text-gray-500'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
                      {user.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {user.estado_aprobacion === 'PENDIENTE' && (
                        <>
                          <button onClick={() => openModal('approve', user)} className="px-3 py-1.5 bg-[#556B2F] hover:bg-[#4b5320] text-white text-xs rounded font-bold transition-colors shadow">Aprobar</button>
                          <button onClick={() => openModal('reject', user)} className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-800 text-xs rounded font-bold transition-colors">Rechazar</button>
                        </>
                      )}
                      
                      {user.rol?.name === 'Subordinado' && user.estado_aprobacion === 'APROBADO' && (
                        <button onClick={() => openModal('handover', user)} className="px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-800 text-xs rounded font-bold transition-colors">Relevo</button>
                      )}

                      {user.rol?.name !== 'Comandante' && user.estado_aprobacion !== 'PENDIENTE' && (
                        <>
                           <button onClick={() => openModal('toggle', user)} className="text-gray-400 hover:text-white transition-colors" title={user.is_active ? "Desactivar" : "Activar"}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                           </button>
                           <button onClick={() => openModal('reassign', user)} className="text-gray-400 hover:text-purple-400 transition-colors" title="Reasignar Rol">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- EL MODAL PERSONALIZADO (Cero Prompts del Navegador) --- */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c261c] border border-[#556B2F] rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            
            {/* Título del Modal */}
            <h3 className="text-xl font-bold text-white mb-2">
              {modalConfig.type === 'approve' && 'Aprobar Solicitud'}
              {modalConfig.type === 'reject' && 'Rechazar Solicitud'}
              {modalConfig.type === 'handover' && 'Iniciar Relevo de Mando'}
              {modalConfig.type === 'toggle' && (modalConfig.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta')}
              {modalConfig.type === 'reassign' && 'Reasignar Rol'}
            </h3>

            {/* Cuerpo del Modal */}
            <div className="text-gray-300 text-sm mb-6">
              <p className="mb-4">Acción para el usuario: <span className="font-bold text-white">{modalConfig.userName}</span></p>
              
              {/* Si es Aprobar o Reasignar, mostramos el SELECTOR DE ROL */}
              {(modalConfig.type === 'approve' || modalConfig.type === 'reassign') && (
                <div>
                  <label className="block text-xs font-bold text-[#8FBC8F] uppercase mb-2">Asignar Rol / Cargo</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:border-[#556B2F] focus:ring-1 focus:ring-[#556B2F]"
                  >
                    <option value="2">Subordinado</option>
                    <option value="3">Secretaria</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">* El rol define los permisos de acceso al sistema.</p>
                </div>
              )}

              {modalConfig.type === 'reject' && <p>¿Está seguro? Esta acción eliminará el registro permanentemente.</p>}
              {modalConfig.type === 'handover' && <p>Está a punto de nominar a este usuario como su sucesor. Si acepta, usted perderá sus privilegios de Comandante.</p>}
              {modalConfig.type === 'toggle' && <p>{modalConfig.isActive ? 'El usuario perderá el acceso al sistema inmediatamente.' : 'El usuario podrá volver a acceder al sistema.'}</p>}
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-300 text-sm font-medium rounded transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeAction}
                className={`px-4 py-2 text-white text-sm font-bold rounded shadow transition-transform active:scale-95 ${
                  modalConfig.type === 'reject' || (modalConfig.type === 'toggle' && modalConfig.isActive) 
                    ? 'bg-red-700 hover:bg-red-800' 
                    : 'bg-[#556B2F] hover:bg-[#4b5320]'
                }`}
              >
                Confirmar Acción
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default GestionSolicitudesPage;