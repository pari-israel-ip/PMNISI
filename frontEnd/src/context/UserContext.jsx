// Archivo: src/context/UserContext.jsx

import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initials, setInitials] = useState('');

  // Función para calcular iniciales (Ej: Carlos Medina -> CM)
  const calculateInitials = (first, last) => {
    const f = first ? first.charAt(0).toUpperCase() : '';
    const l = last ? last.charAt(0).toUpperCase() : '';
    return `${f}${l}`;
  };

  // Función para cargar/recargar los datos del usuario
  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setUser(null);
        return;
    }

    try {
      // 1. Obtenemos el rol del token (esto no cambia)
      const decoded = jwtDecode(token);
      
     // Archivo: src/context/UserContext.jsx

// CAMBIA ESTA LÍNEA:
// const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile/`, ...

// POR ESTA (SIN 'users/'):
        const response = await axios.get(
         `${import.meta.env.VITE_API_BASE_URL}/api/profile/`, 
             { headers: { 'Authorization': `Bearer ${token}` } }
        );
      
      const userData = response.data;
      
      // Guardamos todo en el estado global
      setUser({
        ...userData,
        rol: decoded.rol || 'Usuario' // El rol viene del token
      });

      setInitials(calculateInitials(userData.first_name, userData.last_name));

    } catch (error) {
      console.error("Error cargando usuario", error);
      setUser(null);
    }
  };

  // Cargar usuario al iniciar la app
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, initials, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Un pequeño gancho para usar esto fácil en cualquier lado
export const useUser = () => useContext(UserContext);