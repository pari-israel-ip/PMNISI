// 
// Archivo: src/components/ProtectedRoute.jsx (Versión Simplificada)

import { Outlet, Navigate } from 'react-router-dom';

function ProtectedRoute() {
  const token = localStorage.getItem('accessToken');

  // Si hay token, Outlet renderizará el componente hijo de la ruta.
  // Si no hay token, lo redirigimos a la página de login.
  return token ? <Outlet /> : <Navigate to="/" />;
}

export default ProtectedRoute;