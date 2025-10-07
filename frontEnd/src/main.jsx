import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // <-- 1. Importamos el BrowserRouter


createRoot(document.getElementById('root')).render(
 <StrictMode>
    <BrowserRouter> {/* <-- 2. Envolvemos nuestra App con él */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)
