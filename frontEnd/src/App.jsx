// Archivo: src/App.jsx (VERSIÓN FINAL CON TODAS LAS RUTAS)

import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ActivationPage from './pages/ActivationPage';
import DashboardPage from './pages/DashboardPage';
import GestionSolicitudesPage from './pages/GestionSolicitudesPage';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import UploadRealDataPage from './pages/UploadRealDataPage'; // <-- 1. Importar

function App() {
  return (
    <Routes>
      {/* --- GRUPO DE RUTAS PÚBLICAS --- */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate/:uidb64/:token" element={<ActivationPage />} />

      {/* --- GRUPO DE RUTAS PROTEGIDAS --- */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* 2. Añadir la nueva ruta protegida */}
        <Route path="/upload-real-data" element={<UploadRealDataPage />} />
        {/* --- ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA! --- */}
        <Route path="/gestion-usuarios" element={<GestionSolicitudesPage />} />
      </Route>

      {/* --- LA RUTA PARA EL 404 BONITO --- */}
      <Route path="*" element={
        <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-xl mt-4">Página no encontrada</p>
        </div>
      } />
    </Routes>
  );
}

export default App;