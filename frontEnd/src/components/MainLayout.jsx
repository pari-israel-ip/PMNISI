// Archivo: src/components/MainLayout.jsx (VERSIÓN FINAL Y CORRECTA)

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main>
        {/* Aquí es donde React Router dibujará la página hija (Dashboard, Upload, etc.) */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;