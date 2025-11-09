// Archivo: src/pages/DashboardPage.jsx (VERSIÓN HIPER-LOCALIZADA FUSIONADA)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import LineChart from '../components/LineChart';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNominated, setIsNominated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.is_nominated) {
          setIsNominated(true);
        }
      } catch (e) {
        console.error("Token inválido:", e);
        navigate('/');
      }
    } else {
      navigate('/');
      return;
    }

    const fetchStatistics = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/data/statistics-real/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setStats(response.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          navigate('/');
        } else {
          setError('No se pudieron cargar las estadísticas.');
        }
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [navigate]);

  const handleAcceptHandover = async () => {
    if (!confirm('¿Estás seguro de que quieres aceptar el rol de Comandante? Esta acción cerrará la sesión del Comandante actual.')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/accept-handover/`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert('¡Relevo completado! Serás redirigido para iniciar sesión con tus nuevas credenciales de Comandante.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/');
    } catch (err) {
      alert('Error al aceptar el relevo.');
      console.error(err);
    }
  };

  const handleRejectHandover = async () => {
    if (!confirm('¿Estás seguro de que quieres rechazar esta nominación?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/reject-handover/`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert('Nominación rechazada. Tu sesión se actualizará.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/');
    } catch (err) {
      alert('Error al rechazar la nominación.');
      console.error(err);
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/data/export-pdf/`,
        { headers: { 'Authorization': `Bearer ${token}` }, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_estadistico_delitos.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar el PDF:', err);
      alert('No se pudo generar el reporte en PDF.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-white">Cargando Dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  // --- PREPARAMOS LOS DATOS PARA CADA GRÁFICO ---
  const topDelitosData = {
    labels: stats?.top_delitos.map(d => d.naturaleza_delito) || [],
    datasets: [{
      label: 'Nº de Casos',
      data: stats?.top_delitos.map(d => d.total) || [],
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1,
    }],
  };
  const delitosPorAñoData = {
    labels: stats?.delitos_por_año.map(d => d.año) || [],
    datasets: [{
      label: 'Nº de Delitos',
      data: stats?.delitos_por_año.map(d => d.total) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }],
  };
  const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const delitosPorMesData = {
    labels: mesesLabels,
    datasets: [{
      label: 'Nº de Delitos',
      data: mesesLabels.map((_, index) => {
        const mesData = stats?.delitos_por_mes.find(d => d.mes === index + 1);
        return mesData ? mesData.total : 0;
      }),
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.5)',
      tension: 0.3,
      fill: true,
    }],
  };
  const topZonasData = {
    labels: stats?.top_zonas.map(d => d.zona_del_hecho) || [],
    datasets: [{
      label: 'Nº de Delitos',
      data: stats?.top_zonas.map(d => d.total) || [],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderColor: '#1f2937',
      borderWidth: 2,
    }],
  };

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      {isNominated && (
        <div className="bg-cyan-600 text-center p-4 shadow-lg">
          <h2 className="text-xl font-bold">¡Has sido nominado para el Relevo de Mando!</h2>
          <p className="mt-2">¿Aceptas asumir la responsabilidad del rol de Comandante?</p>
          <div className="mt-4 flex justify-center gap-4">
            <button onClick={handleAcceptHandover} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold">Aceptar Mando</button>
            <button onClick={handleRejectHandover} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold">Rechazar Nominación</button>
          </div>
        </div>
      )}
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Análisis de Datos Históricos</h1>
          <button onClick={handleExportPDF} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
            Exportar a PDF
          </button>
        </div>
        {/* --- FILA 1: KPI, Top Delitos y Evolución Anual --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Columna Izquierda: KPI y Top Delitos */}
          <div className="space-y-8">
            <div className="bg-slate-800 p-6 rounded-lg shadow flex flex-col justify-center items-center">
              <h2 className="text-gray-400 text-sm">Total de Delitos en el Distrito</h2>
              <p className="text-6xl font-bold mt-2">{stats?.total_delitos}</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg shadow h-[300px]">
              <BarChart chartData={topDelitosData} title="Tipos de Delitos" direction="horizontal" />
            </div>
          </div>
          {/* Columna Derecha: Gráfico de Barras por Año */}
          <div className="bg-slate-800 p-6 rounded-lg shadow h-[450px]">
            <BarChart chartData={delitosPorAñoData} title="Evolución Anual de Delitos" />
          </div>
        </div>
        {/* --- FILA 2: Top Zonas y Tendencia Mensual --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg shadow h-[350px]">
            <PieChart chartData={topZonasData} title="Distribución por Zona (Top 5)" />
          </div>
          <div className="bg-slate-800 p-6 rounded-lg shadow h-[350px]">
            <LineChart chartData={delitosPorMesData} title="Tendencia Mensual (Agregada)" />
          </div>
        </div>
        {/* --- FILA 3: Mapa de Incidencia (¡Ocupando todo el ancho!) --- */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-slate-800 p-6 rounded-lg shadow h-[600px]">
            <h2 className="text-gray-400 text-lg font-medium mb-4">Mapa de Incidencia Delictiva</h2>
            <MapContainer center={[-16.495, -68.15]} zoom={13} style={{ height: 'calc(100% - 40px)', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
              {stats?.coordenadas.map((coord, index) => {
                if (!coord.latitud || !coord.longitud) return null;
                return (
                  <CircleMarker key={index} center={[coord.latitud, coord.longitud]} pathOptions={{ radius: 4, fillColor: "#ff0000", color: "#990000", weight: 1, opacity: 1, fillOpacity: 0.8 }}>
                    <Popup>Coordenadas: <br /> {coord.latitud}, {coord.longitud}</Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;