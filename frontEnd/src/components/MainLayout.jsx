// Archivo: src/components/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main>
        {/* 'Outlet' es donde React Router renderizará el componente de la página actual */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default MainLayout;