// Archivo: src/pages/StatisticsPage.jsx (VERSIÓN DE DEPURACIÓN)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/data/statistics/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        // --- ¡EL MICRÓFONO ESPÍA! ---
        // Imprimimos en la consola del navegador los datos EXACTOS que llegaron.
        console.log('Datos recibidos de la API:', response.data);
        // --- FIN DEL MICRÓFONO ---

        setStats(response.data);
      } catch (err) { /* ... (la lógica de error no cambia) ... */ } 
      finally { setIsLoading(false); }
    };
    fetchStatistics();
  }, [navigate]);

  if (isLoading) { /* ... (igual) ... */ }
  if (error) { /* ... (igual) ... */ }

  // --- OPCIONES DE ESTILO CON CÍRCULOS GIGANTES ---
  const fireRedOptions = {
    radius: 4,             // Un tamaño pequeño y nítido
    fillColor: "#ff0000",
    color: "#990000",       // Un borde un poco más oscuro para definir
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

  return (
    <div className="bg-slate-900 min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Análisis de Datos Históricos</h1>
      
      {/* ... (las tarjetas de KPIs no cambian) ... */}

      <div className="mt-8 bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-gray-400 text-sm font-medium mb-4">Mapa de Incidencia Delictiva</h2>
          <div className="h-[600px] rounded-md overflow-hidden z-0">
            <MapContainer center={[42.3601, -71.0589]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              {stats && stats.coordenadas && stats.coordenadas.map((coord, index) => {
                // El guardia de seguridad para ignorar coordenadas inválidas
                if (!coord.latitud || !coord.longitud) {
                  return null;
                }
                return (
                  <CircleMarker
                    key={index}
                    center={[coord.latitud, coord.longitud]}
                    pathOptions={fireRedOptions} // Usamos los círculos gigantes
                  >
                    <Popup>
                      Coordenadas: <br /> {coord.latitud}, {coord.longitud}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
      </div>
    </div>
  );
}

export default StatisticsPage;