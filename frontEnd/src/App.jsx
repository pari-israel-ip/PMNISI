import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import ActivationPage from './pages/ActivationPage';
import UsersListPage from './pages/UsersListPage';
import UploadPage from './pages/UploadPage';
import StatisticsPage from './pages/StatisticsPage';
import ProtectedRoute from './components/ProtectedRoute'; // Nuestro guardia

function App() {
  return (
    <Routes>
      {/* --- Rutas Públicas --- */}
      {/* Estas rutas no necesitan protección. */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate/:uidb64/:token" element={<ActivationPage />} />

      {/* --- Rutas Protegidas --- */}
      {/* Usamos el ProtectedRoute como una ruta "padre".
          Cualquier ruta anidada dentro de ella estará automáticamente protegida. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/upload-data" element={<UploadPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
      </Route>
      
      {/* Opcional: Una ruta "catch-all" para páginas no encontradas */}
      <Route path="*" element={<div>Página no encontrada</div>} />
    </Routes>
  );
}

export default App;