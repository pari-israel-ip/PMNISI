import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BarChart from '../components/BarChart'; 
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';

function PredictionPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false); 
  const [error, setError] = useState(''); 
  const navigate = useNavigate();

  // --- FUNCIÓN DE CARGA DE DATOS ---
  const fetchPredictions = useCallback(async (year = 2024, month = 12) => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/data/prediccion-futura/?year=${year}&month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(response.data);
    } catch (error) {
      console.error("Error al cargar predicciones:", error);
      setError('No se pudieron cargar los datos de predicción.');
      if (error.response && error.response.status === 401) navigate('/');
    }
    setIsLoading(false);
  }, [navigate]); 

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]); 

  // --- FUNCIÓN DE RE-ENTRENAMIENTO ---
  const handleRetrain = () => {
    if (!window.confirm('Esto realizara un re-entrenamiento y puede tardar varios minutos. ¿Continuar?')) return;
    
    setIsTraining(true); 
    setError('');
    
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/data/retrain-simulation/`,
          { year: 2024, month: 12 }, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        await fetchPredictions();
      } catch (err) {
        console.error("Error durante el re-entrenamiento:", err);
        setError("Error durante el re-entrenamiento.");
      } finally {
        setIsTraining(false); 
      }
    }, 180000); // 3 minutos
  };

  // --- ESTADOS DE CARGA Y ERROR ---
  if (isLoading) { return <div className="p-8 text-white">Generando análisis predictivo...</div>; }
  
  // ¡AQUÍ ESTÁ LA CORRECCIÓN!
  if (error) { return <div className="p-8 text-red-500">{error}</div>; } // <-- Faltaba el '}'
  
  if (!data) { return <div className="p-8 text-red-500">No se pudieron cargar los datos de predicción.</div>; }

  // --- PREPARAMOS DATOS ---
  
  // 1. Gráfico de Tipos
  const allTipos = [...new Set([...Object.keys(data.reales.por_tipo), ...Object.keys(data.predichos_ml.por_tipo)])];
  const comparativaTiposData = {
    labels: allTipos,
    datasets: [
      { label: 'Real', data: allTipos.map(tipo => data.reales.por_tipo[tipo] || 0), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
      { label: 'Predicción ML', data: allTipos.map(tipo => data.predichos_ml.por_tipo[tipo] || 0), backgroundColor: 'rgba(239, 68, 68, 0.7)' },
    ],
  };
  
  // 2. Gráfico Semanal
  const tendenciaSemanalData = {
    labels: data.reales.tendencia_semanal.map((d, i) => `Semana ${i + 1}`),
    datasets: [
      { label: 'Real', data: data.reales.tendencia_semanal.map(d => d.conteo), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
      { label: 'Predicción ML', data: data.predichos_ml.tendencia_semanal.map(d => d.conteo), backgroundColor: 'rgba(239, 68, 68, 0.7)' },
    ],
  };

  // 3. Gráfico de Zonas
  const allZonas = Object.keys(data.reales.por_zona); 
  const comparativaZonasData = {
    labels: allZonas,
    datasets: [
      { label: 'Real', data: allZonas.map(zona => data.reales.por_zona[zona] || 0), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
      { label: 'Predicción ML', data: allZonas.map(zona => data.predichos_ml.por_zona[zona] || 0), backgroundColor: 'rgba(239, 68, 68, 0.7)' },
    ],
  };

  // Opciones para el gráfico HORIZONTAL de Zonas
  const horizontalBarOptions = {
    indexAxis: 'y', 
    scales: {
      x: { 
        beginAtZero: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
      },
      y: { 
        ticks: { color: '#94a3b8', font: { size: 10 } }, 
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        display: false 
      }
    }
  };


  return (
    <div className="p-8 text-white">
      {/* --- ENCABEZADO CON BOTÓN --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold">Análisis Predictivo vs. Realidad</h1>
          <p className="text-lg text-gray-400">Comparativa para Diciembre 2024 (Precisión de la predicción: {data.metadata.precision_simulada})</p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={isTraining}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-500 w-full sm:w-auto"
        >
          {isTraining ? 'Re-entrenando...' : 'Re-entrenamiento'}
        </button>
      </div>
      
      {/* --- MENSAJE DE CARGA --- */}
      {isTraining && (
        <div className="text-center p-8 bg-slate-800 rounded-lg my-4">
          <p className="text-yellow-400 text-lg">
            Simulando re-entrenamiento del modelo...
          </p>
          <p className="text-gray-300">
            Este proceso puede tardar entre 3 y 4 minutos. La página se actualizará sola.
          </p>
        </div>
      )}

      {/* --- FILA 1: KPIs y Gráfico de Tipos --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg shadow text-center">
          <h2 className="text-gray-400 text-sm">Total Delitos Reales</h2>
          <p className="text-5xl font-bold mt-2">{data.reales.total_delitos}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow text-center">
          <h2 className="text-gray-400 text-sm">Total Delitos Predichos (ML)</h2>
          <p className="text-5xl font-bold mt-2">{data.predichos_ml.total_delitos}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow h-[300px]">
          <BarChart chartData={comparativaTiposData} title="Comparativa por Tipo de Delito" />
        </div>
      </div>

      {/* --- FILA 2: Gráficos de Semana y Zona --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg shadow h-[350px]">
          <BarChart chartData={tendenciaSemanalData} title="Tendencia Semanal" />
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow h-[350px]">
          <BarChart 
            chartData={comparativaZonasData} 
            title="Comparativa por Zona (Top 5 Zonas)" 
            options={horizontalBarOptions} 
          />
        </div>
      </div>
      
      {/* --- FILA 3: Mapas Comparativos --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-lg shadow h-[450px]">
          <h2 className="text-lg font-medium mb-4 text-center">Mapa de Incidencia Real</h2>
          <MapContainer center={[-16.495, -68.15]} zoom={13} style={{ height: 'calc(100% - 40px)' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {data.reales.puntos_mapa.map((p, i) => <CircleMarker key={`real-${i}`} center={[p.latitud, p.longitud]} pathOptions={{ color: 'blue', radius: 5 }} />)}
          </MapContainer>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow h-[450px]">
          <h2 className="text-lg font-medium mb-4 text-center">Mapa de Incidencia Predicha (ML)</h2>
          <MapContainer center={[-16.495, -68.15]} zoom={13} style={{ height: 'calc(100% - 40px)' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {data.predichos_ml.puntos_mapa.map((p, i) => <CircleMarker key={`pred-${i}`} center={[p.latitud, p.longitud]} pathOptions={{ color: 'red', radius: 5 }} />)}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default PredictionPage;