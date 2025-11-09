//Archivo: src/components/ProtectedRoute.jsx (VERSIÓN FINAL Y CORRECTA)

import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/" replace />; // 'replace' es una buena práctica
  }

  return children;
}

export default ProtectedRoute;

//Archivo: src/components/ProtectedRoute.jsx (Versión Simplificada)

