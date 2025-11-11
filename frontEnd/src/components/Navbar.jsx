// Archivo: src/components/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';

// Por ahora, mostramos todos los botones. Luego lo haremos dinámico.
const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  return (
    <nav className="bg-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/dashboard" className="text-white font-bold text-xl">
              Sistema Predictivo
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Estos son los botones que mostraremos condicionalmente */}
            <Link to="/gestion-usuarios" className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Gestionar Solicitudes
            </Link>
            {/* --- ¡EL NUEVO ENLACE! --- */}
            <Link to="/predictions" className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Análisis Predictivo
            </Link>
            <Link to="/upload-real-data" className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Cargar Datos
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;