// Archivo: src/pages/DashboardPage.jsx
import { useNavigate } from 'react-router-dom'; // <-- 1. Importar

function DashboardPage() {
  const navigate = useNavigate(); // <-- 2. Obtener la función de navegación

  const handleLogout = () => {
    // 3. Borramos los pases de acceso
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // 4. Lo enviamos de vuelta a la puerta principal
    navigate('/');
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold">¡Bienvenido a tu Panel de Control!</h1>
      <p className="mt-4 text-lg">Has iniciado sesión exitosamente.</p>
      
      {/* 5. El botón de salida */}
      <button
        onClick={handleLogout}
        className="mt-8 py-2 px-6 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

export default DashboardPage;