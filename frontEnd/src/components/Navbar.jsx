// Archivo: src/components/Navbar.jsx (VERSIÓN FINAL: COLOR TÁCTICO #1c261c)

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { jwtDecode } from 'jwt-decode';

const Navbar = () => {
  const { user, initials, setUser, refreshUser } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); 

  // --- LOGO INSTITUCIONAL ---
  const logoUrl = "https://www.policia.bo/wp-content/uploads/2025/02/CARCANCHO-FINAL.png";

  // --- LÓGICA DE ROLES ---
  const getRole = () => {
    if (user?.rol) return user.rol;
    const token = localStorage.getItem('accessToken');
    if (token) {
      try { return jwtDecode(token).rol; } catch (e) { return null; }
    }
    return null;
  };
  const currentRole = getRole();
  const isComandante = currentRole === 'Comandante';

  // --- EFECTOS ---
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) refreshUser();
  }, [user]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('#mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null); 
    navigate('/');
  };

  const displayInitials = initials || (user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '?');

  // --- ESTILOS DINÁMICOS ---
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return isActive
      ? "bg-[#556B2F] text-white px-3 py-2 rounded-md text-sm font-bold shadow-md transform transition-all duration-200"
      : "text-gray-300 hover:bg-[#556B2F]/30 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  };

  const mobileLinkClass = "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-[#556B2F]";

  return (
    // CAMBIO AQUÍ: Fondo #1c261c y borde #2f3e2f para coincidir con el tema
    <nav className="bg-[#1c261c] border-b border-[#2f3e2f] shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* --- IZQUIERDA: LOGO Y MENÚ DE ESCRITORIO --- */}
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-3 group">
              <img className="h-10 w-auto drop-shadow-md group-hover:scale-105 transition-transform" src={logoUrl} alt="Escudo" />
              <div className="hidden md:block">
                <h1 className="text-white font-bold text-lg tracking-wide leading-tight">S.A.P.</h1>
                <p className="text-[#8FBC8F] text-xs font-medium tracking-widest">POLICÍA BOLIVIANA</p>
              </div>
            </Link>

            {/* Menú Escritorio */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-4">
              <Link to="/predictions" className={getLinkClass('/predictions')}>Análisis Predictivo</Link>
              
              {(['Comandante', 'Subordinado', 'Secretaria'].includes(currentRole)) && (
                <Link to="/upload-real-data" className={getLinkClass('/upload-real-data')}>Cargar Datos</Link>
              )}

              {isComandante && (
                <Link to="/gestion-usuarios" className={getLinkClass('/gestion-usuarios')}>
                  Gestión Personal
                </Link>
              )}
            </div>
          </div>

          {/* --- DERECHA: PERFIL Y HAMBURGUESA --- */}
          <div className="flex items-center gap-4">
            
            {/* Perfil (Dropdown) */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="flex items-center gap-3 focus:outline-none group p-1 rounded-full hover:bg-[#2f3e2f] transition-colors"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-white group-hover:text-[#8FBC8F] transition-colors leading-none">
                    {user ? `${user.first_name} ${user.last_name}` : 'Cargando...'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">{currentRole || 'Usuario'}</p>
                </div>
                
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#556B2F] to-[#2F4F4F] flex items-center justify-center text-white font-bold shadow-lg border-2 border-gray-600 group-hover:border-[#8FBC8F] transition-all">
                  {user ? displayInitials : <div className="animate-pulse">...</div>}
                </div>
              </button>

              {isProfileOpen && (
                // CAMBIO AQUÍ: Fondo del dropdown también verde oscuro
                <div className="absolute right-0 mt-2 w-56 bg-[#1c261c] rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 origin-top-right transform transition-all duration-200 ease-out border border-[#2f3e2f]">
                  <div className="px-4 py-3 border-b border-[#2f3e2f] bg-[#273216]">
                    <p className="text-xs text-[#8FBC8F] font-bold uppercase tracking-wider">Cuenta Activa</p>
                    <p className="text-sm text-white font-medium truncate mt-1">{user ? user.email : '...'}</p>
                  </div>
                  <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#556B2F] hover:text-white transition-colors">
                    Editar Perfil
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors">
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

            {/* Botón Hamburguesa (Solo móvil) */}
            <div className="flex md:hidden" id="mobile-menu-btn">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#2f3e2f] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Abrir menú</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* --- MENÚ MÓVIL DESPLEGABLE --- */}
      {isMobileMenuOpen && (
        // CAMBIO AQUÍ: Fondo del menú móvil también verde oscuro
        <div className="md:hidden bg-[#1c261c] border-t border-[#2f3e2f] absolute w-full shadow-xl" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/dashboard" className={mobileLinkClass}>Inicio</Link>
            <Link to="/predictions" className={mobileLinkClass}>Análisis Predictivo</Link>
            
            {(['Comandante', 'Subordinado', 'Secretaria'].includes(currentRole)) && (
              <Link to="/upload-real-data" className={mobileLinkClass}>Cargar Datos</Link>
            )}
            
            {isComandante && (
              <Link to="/gestion-usuarios" className={`${mobileLinkClass} text-[#8FBC8F]`}>
                Gestión de Personal
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;