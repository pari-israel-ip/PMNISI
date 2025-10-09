import { useNavigate, Link } from 'react-router-dom';

function DashboardPage() {
  // El hook DEBE estar aquí, dentro de la función.
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-4">¡Bienvenido a tu Panel de Control!</h1>
      <p className="text-lg text-gray-400 mb-8">Selecciona una opción para continuar</p>
      
      <div className="flex flex-wrap justify-center gap-4">
        <Link 
          to="/users" 
          className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors"
        >
          Gestionar Usuarios
        </Link>
        
        <Link 
          to="/statistics" 
          className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-md font-semibold transition-colors"
        >
          Ver Estadísticas
        </Link>
        
        <Link 
          to="/upload-data" 
          className="py-2 px-6 bg-teal-600 hover:bg-teal-700 rounded-md font-semibold transition-colors"
        >
          Cargar Datos
        </Link>
        
        <button 
          onClick={handleLogout} 
          className="py-2 px-6 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;