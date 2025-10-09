// Archivo: src/pages/UsersListPage.jsx

import { mockUsers } from '../data/mockUsers'; // Importamos nuestros datos falsos

function UsersListPage() {
  return (
    <div className="bg-slate-900 min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>
      <div className="overflow-x-auto bg-slate-800 rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-slate-700">
            <tr>
              <th scope="col" className="px-6 py-3">Correo Electrónico</th>
              <th scope="col" className="px-6 py-3">Nombre Completo</th>
              <th scope="col" className="px-6 py-3">Rol</th>
              <th scope="col" className="px-6 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-600">
                <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                <td className="px-6 py-4">{`${user.first_name} ${user.last_name}`}</td>
                <td className="px-6 py-4">{user.rol ? user.rol.name : 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.is_active ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'
                    }`}
                  >
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersListPage;