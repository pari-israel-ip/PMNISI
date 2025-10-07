// Archivo: src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // 1. Buscamos el "pase de acceso" en el almacenamiento del navegador.
  const token = localStorage.getItem('accessToken');

  // 2. Si NO hay pase, lo redirigimos a la puerta principal (login).
  if (!token) {
    return <Navigate to="/" />;
  }

  // 3. Si SÍ hay pase, le permitimos ver el contenido protegido (los children).
  return children;
}

export default ProtectedRoute;