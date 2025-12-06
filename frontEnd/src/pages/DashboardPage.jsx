// Archivo: src/pages/DashboardPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { toPng } from 'html-to-image';

import BarChart from '../components/BarChart'; 
import PieChart from '../components/PieChart';
import LineChart from '../components/LineChart';


function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNominated, setIsNominated] = useState(false);
  
  // Estado para exportación
  const [isExporting, setIsExporting] = useState(false);
  
  // Filtros seleccionados
  const [selectedZone, setSelectedZone] = useState(null); 
  const [selectedCrime, setSelectedCrime] = useState(null); 
  
  const navigate = useNavigate();

  // --- 1. NUEVA PALETA DE COLORES "NEÓN" ---
  const THEME = {
    primary: '#556B2F',   // Verde Original
    neon: '#76ff03',      // Verde Neón (Seleccionado)
    dimmed: '#1f2b1f',    // Verde Oscuro Apagado (No seleccionado)
    light: '#8FBC8F',
    cardBg: '#1c261c',
    border: '#2f3e2f',
    danger: '#EF4444'
  };
  
  const mainBackgroundClass = "bg-[#1c261c] min-h-screen";

  // --- FETCH DE DATOS ---
  const fetchStatistics = async (zonaOverride, delitoOverride) => {
      const token = localStorage.getItem('accessToken');
      if (!token) { navigate('/'); return; }
      try {
        // Lógica para determinar qué filtro enviar
        // Si el argumento es 'null' explícito, es que estamos borrando filtro.
        const zonaQuery = zonaOverride !== undefined ? zonaOverride : selectedZone;
        const delitoQuery = delitoOverride !== undefined ? delitoOverride : selectedCrime;
        
        let url = `${import.meta.env.VITE_API_BASE_URL}/api/data/statistics-real/?`;
        const params = new URLSearchParams();
        
        if (zonaQuery) params.append('zona', zonaQuery);
        if (delitoQuery) params.append('delito', delitoQuery);
        
        const response = await axios.get(url + params.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
        setStats(response.data);
      } catch (err) { 
          if (err.response?.status === 401) navigate('/'); 
          setIsLoading(false); 
      } finally { 
          setIsLoading(false); 
      }
  };

  useEffect(() => {
      const token = localStorage.getItem('accessToken');
      if (token) { 
          try { 
              const decodedToken = jwtDecode(token); 
              if (decodedToken.is_nominated) setIsNominated(true); 
          } catch (e) { navigate('/'); } 
      } else { navigate('/'); }
      fetchStatistics(null, null);
  }, [navigate]);

  // --- 2. MANEJADORES DE CLIC CON TOGGLE ---
  
  const handleZoneClick = (zona) => { 
    if (selectedZone === zona) {
      // Si ya estaba seleccionado, lo quitamos (Toggle OFF)
      setSelectedZone(null); 
      fetchStatistics(null, undefined); // Recargamos sin filtro de zona
    } else {
      // Si es nuevo, lo ponemos (Toggle ON)
      setSelectedZone(zona); 
      fetchStatistics(zona, undefined); 
    }
  };

  const handleCrimeClick = (delito) => { 
    if (selectedCrime === delito) {
      // Toggle OFF
      setSelectedCrime(null); 
      fetchStatistics(undefined, null); 
    } else {
      // Toggle ON
      setSelectedCrime(delito); 
      fetchStatistics(undefined, delito); 
    }
  };

  const handleResetFilter = () => { 
      setSelectedZone(null); 
      setSelectedCrime(null); 
      fetchStatistics(null, null); 
  };
  
  // --- 3. LÓGICA DE COLORES DINÁMICOS ---

  const getBarColors = (dataArray) => {
    if (!selectedCrime) return dataArray.map(() => THEME.primary);
    return dataArray.map(item => item.naturaleza_delito === selectedCrime ? THEME.neon : THEME.dimmed);
  };
  
  const getBarBorders = (dataArray) => {
    if (!selectedCrime) return dataArray.map(() => THEME.light);
    return dataArray.map(item => item.naturaleza_delito === selectedCrime ? '#ffffff' : 'transparent');
  };

  const getPieColors = (dataArray) => {
    const baseColors = ['#1A2515', '#2F3E2F', '#3B4D1E', '#556B2F', '#8FBC8F'];
    if (!selectedZone) return baseColors;
    return dataArray.map((item) => item.zona_del_hecho === selectedZone ? THEME.neon : THEME.dimmed);
  };

  // --- 4. FUNCIONES DE EXPORTACIÓN (DOBLE CAPTURA) ---

  const handleExportPDF = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setIsExporting(true);

    try {
      const element = document.getElementById('charts-only-export');
      if (!element) throw new Error("No se encuentra el área de gráficos.");

      const options = { 
          backgroundColor: '#273216', 
          pixelRatio: 2, 
          cacheBust: true,
          filter: (node) => {
              if (node.classList && node.classList.contains('leaflet-container')) return false;
              return true;
          }
      };

      console.log("🔥 Calentando motor PDF...");
      await toPng(element, options); // 1. Calentamiento
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("📸 Tomando foto PDF...");
      const dataUrl = await toPng(element, options); // 2. Real

      if (dataUrl.length < 1000) throw new Error("La imagen salió vacía.");

      const url = `${import.meta.env.VITE_API_BASE_URL}/api/data/export-pdf/`;
      const payload = { zona: selectedZone, delito: selectedCrime, images: { full_dashboard: dataUrl } };

      const response = await axios.post(url, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        responseType: 'blob'
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Reporte_${selectedZone || 'Global'}.pdf`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);

    } catch (err) { 
      console.error("Error PDF:", err);
      alert(`Error PDF: ${err.message}`); 
    } finally { setIsExporting(false); }
  };
  
  const handleExportExcel = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setIsExporting(true);

    try {
      const element = document.getElementById('charts-only-export');
      if (!element) throw new Error("No se encuentra el área de gráficos.");

      const options = { 
          backgroundColor: '#273216', 
          pixelRatio: 2, 
          cacheBust: true,
          filter: (node) => {
              if (node.classList && node.classList.contains('leaflet-container')) return false;
              return true;
          }
      };

      console.log("📊 Preparando Excel...");
      await toPng(element, options); // 1. Calentamiento
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(element, options); // 2. Real
      
      if (dataUrl.length < 1000) throw new Error("La imagen salió vacía.");

      const url = `${import.meta.env.VITE_API_BASE_URL}/api/data/export-excel/`;
      const payload = { zona: selectedZone, delito: selectedCrime, image: dataUrl };

      const response = await axios.post(url, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        responseType: 'blob'
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      const nombreArchivo = `Data_${selectedZone || 'Global'}_${selectedCrime || 'Todos'}.xlsx`;
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);

    } catch (err) { 
      console.error("Error Excel:", err);
      alert(`Error Excel: ${err.message}`); 
    } finally { setIsExporting(false); }
  };
  
  if (isLoading) return <div className={`${mainBackgroundClass} flex items-center justify-center text-white text-xl`}>Procesando...</div>;
  if (error) return <div className={`${mainBackgroundClass} flex items-center justify-center text-red-500 text-xl`}>{error}</div>;

  // --- 5. PREPARACIÓN DE DATOS (CON COLORES DINÁMICOS) ---
  
  const topDelitosData = { 
    labels: stats?.top_delitos.map(d => d.naturaleza_delito) || [], 
    datasets: [{ 
        label: 'Nº de Casos', 
        data: stats?.top_delitos.map(d => d.total) || [], 
        backgroundColor: getBarColors(stats?.top_delitos || []), 
        borderColor: getBarBorders(stats?.top_delitos || []), 
        borderWidth: selectedCrime ? 2 : 1 
    }] 
  };

  const topZonasData = { 
    labels: stats?.top_zonas.map(d => d.zona_del_hecho) || [], 
    datasets: [{ 
        label: 'Nº de Delitos', 
        data: stats?.top_zonas.map(d => d.total) || [], 
        backgroundColor: getPieColors(stats?.top_zonas || []), 
        borderColor: THEME.cardBg, 
        borderWidth: 2 
    }] 
  };

  const delitosPorAñoData = { labels: stats?.delitos_por_año.map(d => d.año) || [], datasets: [{ label: 'Nº de Delitos', data: stats?.delitos_por_año.map(d => d.total) || [], backgroundColor: '#3B4D1E', borderColor: THEME.light, borderWidth: 1 }] };
  const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const delitosPorMesData = { labels: mesesLabels, datasets: [{ label: 'Tendencia Mensual', data: mesesLabels.map((_, index) => { const mesData = stats?.delitos_por_mes.find(d => d.mes === index + 1); return mesData ? mesData.total : 0; }), borderColor: THEME.light, backgroundColor: 'rgba(143, 188, 143, 0.2)', pointBackgroundColor: THEME.primary, tension: 0.4, fill: true }] };
  const fireRedOptions = { radius: 4, fillColor: THEME.danger, color: "#7f1d1d", weight: 1, opacity: 1, fillOpacity: 0.9 };

  return (
    <div className={`${mainBackgroundClass} text-white pb-12`}>
      {isNominated && <div className="bg-[#2F4F4F] p-4 text-center border-b border-green-500">⚠️ TIENES UNA NOMINACIÓN PENDIENTE</div>}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Panel de Inteligencia <span className="text-[#556B2F]">Operativa</span></h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Chips de Filtros Activos */}
              {selectedZone && <span className="text-xs font-bold bg-[#76ff03] text-black px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition" onClick={() => handleZoneClick(selectedZone)}>ZONA: {selectedZone} <span className="ml-2 font-black">✕</span></span>}
              {selectedCrime && <span className="text-xs font-bold bg-[#76ff03] text-black px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition" onClick={() => handleCrimeClick(selectedCrime)}>DELITO: {selectedCrime} <span className="ml-2 font-black">✕</span></span>}
              
              {(selectedZone || selectedCrime) && <button onClick={handleResetFilter} className="ml-4 text-xs text-red-400 underline hover:text-red-300">Borrar Todo</button>}
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={handleExportExcel} disabled={isExporting} className="bg-[#2F4F4F] hover:bg-[#253e3e] text-white font-bold py-2 px-6 rounded-lg shadow-lg disabled:opacity-50">
                {isExporting ? '...' : 'Excel'}
             </button>
             <button onClick={handleExportPDF} disabled={isExporting} className="bg-[#556B2F] hover:bg-[#4b5320] text-white font-bold py-2 px-6 rounded-lg shadow-lg disabled:opacity-50">
                {isExporting ? 'Generando...' : 'PDF'}
             </button>
          </div>
        </div>
        
        {/* --- CONTENEDOR EXCLUSIVO PARA EXPORTACIÓN (Sin Mapa) --- */}
        <div className="space-y-8">
            <div id="charts-only-export" className="space-y-8 bg-[#1c261c] p-4 rounded-xl"> 
                
                {/* Fila 1: KPI, Barras (Delitos), Torta (Zonas) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl flex flex-col justify-center items-center">
                    <h2 className="text-gray-400 text-sm font-bold uppercase">TOTAL</h2>
                    <p className="text-6xl font-black mt-2 text-white">{stats?.total_delitos}</p>
                  </div>
                  <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl h-[320px] relative">
                    <BarChart chartData={topDelitosData} title="Tipología" direction="horizontal" onClickBar={handleCrimeClick} />
                  </div>
                  <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl h-[320px] relative">
                    <PieChart chartData={topZonasData} title="Zonas" onZoneClick={handleZoneClick} />
                  </div>
                </div>

                {/* Fila 2: Evolución Anual y Mensual */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl h-[400px]">
                    <BarChart chartData={delitosPorAñoData} title="Evolución Anual" />
                  </div>
                  <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl h-[400px]">
                    <LineChart chartData={delitosPorMesData} title="Tendencia Mensual" />
                  </div>
                </div>
                
            </div> {/* Fin de charts-only-export */}

            {/* --- MAPA (FUERA DE LA EXPORTACIÓN) --- */}
            <div className="grid grid-cols-1 gap-8 bg-[#273216] p-4 rounded-xl">
              <div className="bg-[#1c261c] border border-[#2f3e2f] p-1 rounded-xl shadow-xl h-[650px]">
                <div className="h-full w-full rounded-lg overflow-hidden relative z-0">
                  <MapContainer center={[-16.495, -68.15]} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                    {stats?.coordenadas.map((coord, index) => (
                        <CircleMarker key={index} center={[coord.latitud, coord.longitud]} pathOptions={fireRedOptions} />
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}

export default DashboardPage;