import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // <-- 1. Importamos el BrowserRouter
import 'leaflet/dist/leaflet.css'; // <-- ¡AÑADE ESTA LÍNEA!
import { UserProvider } from './context/UserContext'; // <-- 1. Importar

createRoot(document.getElementById('root')).render(
 <StrictMode>
    <BrowserRouter> {/* <-- 2. Envolvemos nuestra App con él */}
      <UserProvider> {/* <-- 2. Envolver la App */}
        <App />
      </UserProvider>   
   </BrowserRouter>
  </StrictMode>,
)
