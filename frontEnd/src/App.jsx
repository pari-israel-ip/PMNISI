import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RegisterPage from './pages/RegisterPage' // <-- 1. Importar
import ActivationPage from './pages/ActivationPage' // <-- 2. Importar
import ProtectedRoute from './components/ProtectedRoute'; // <-- 1. Importamos al guardia

function App() {
  return (
     <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate/:uidb64/:token" element={<ActivationPage />} />

      {/* Rutas Protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>  {/* <-- 2. Envolvemos la página con el guardia */}
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )

}

export default App