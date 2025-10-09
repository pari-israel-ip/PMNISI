// Archivo: src/components/Heatmap.jsx (VERSIÓN MEJORADA CON COLORES)

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

function Heatmap({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // --- ¡AQUÍ ESTÁ LA MAGIA! ---
    // Creamos la capa de calor, pero esta vez, le pasamos opciones de configuración.
    const heatLayer = L.heatLayer(points, { 
      radius: 25,
      blur: 15,
      maxZoom: 18,
      // Definimos un gradiente de colores brillantes para mapas oscuros
      gradient: {
        0.4: 'yellow', // Amarillo para baja intensidad
        0.65: 'orange', // Naranja para intensidad media
        1: 'red'      // Rojo para alta intensidad
      }
    });
    // --- FIN DE LA MAGIA ---

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default Heatmap;
