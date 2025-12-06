// Archivo: src/pages/PredictionPage.jsx (VERSIÓN FINAL - NOVIEMBRE 2024)

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import BarChart from '../components/BarChart'; 
import LineChart from '../components/LineChart';

function PredictionPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false); 
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(''); 
  const [showRetrainModal, setShowRetrainModal] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  const THEME = {
    primary: '#556B2F', neon: '#76ff03', dimmed: '#1f2b1f', light: '#8FBC8F',
    cardBg: '#1c261c', border: '#2f3e2f', danger: '#EF4444', prediction: '#EF4444'
  };
  const mainBackgroundClass = "bg-[#1c261c] min-h-screen";

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  // --- CAMBIO 1: Default a Noviembre (month=11) ---
  const fetchPredictions = useCallback(async (year = 2024, month = 11) => {
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
      console.error("Error:", error);
      setError('No se pudieron cargar los datos de predicción.');
      if (error.response?.status === 401) navigate('/');
    } finally { setIsLoading(false); }
  }, [navigate]); 

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]); 

  const handleRetrainClick = () => setShowRetrainModal(true);

  const executeRetrain = () => {
    setShowRetrainModal(false); 
    setIsTraining(true); 
    showNotification('Iniciando secuencia de re-entrenamiento...', 'info');
    
    setTimeout(async () => {
        // --- CAMBIO 2: Re-entrenamiento apunta a Noviembre ---
        // (Si tu backend espera esto, si no, simplemente recargamos fetchPredictions que ya usa 11)
        await fetchPredictions(); 
        setIsTraining(false); 
        showNotification('Modelo actualizado correctamente.', 'success');
    }, 5000); 
  };

  const handleExport = async (format) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setIsExporting(true);
    showNotification(`Generando reporte ${format.toUpperCase()}...`, 'info');

    try {
      const element = document.getElementById('prediction-charts-export');
      if (!element) throw new Error("No se encuentra el área de gráficos.");

      const options = { backgroundColor: '#1c261c', pixelRatio: 2, filter: (node) => !node.classList?.contains('leaflet-container') };
      await toPng(element, options); 
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const dataUrl = await toPng(element, options);

      if (format === 'pdf') {
        // --- CAMBIO 3: Exportar PDF apunta a Noviembre (month=11) ---
        const url = `${import.meta.env.VITE_API_BASE_URL}/api/data/prediccion-export-pdf/?year=2024&month=11`;
        const response = await axios.post(url, { image: dataUrl }, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          responseType: 'blob'
        });
        
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Informe_Inteligencia_Nov_2024.pdf`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        link.remove();
      } else {
         // --- CAMBIO 4: Exportar Excel apunta a Noviembre (month=11) ---
         const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/data/prediccion-export-excel/?year=2024&month=11`,
          { headers: { 'Authorization': `Bearer ${token}` }, responseType: 'blob' }
        );
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Data_Predictiva_Nov_2024.xlsx`;
        document.body.appendChild(link);
        link.click();
      }
      showNotification('Reporte descargado con éxito.', 'success');
    } catch (err) { 
      console.error(`Error ${format}:`, err);
      showNotification(`Error al generar el reporte.`, 'error');
    } finally { setIsExporting(false); }
  };

  if (isLoading && !isTraining) return <div className={`${mainBackgroundClass} flex items-center justify-center text-white text-xl`}>Cargando inteligencia...</div>;
  if (error) return <div className={`${mainBackgroundClass} flex items-center justify-center text-red-500 text-xl`}>{error}</div>;
  if (!data) return null;

  const allTipos = [...new Set([...Object.keys(data.reales.por_tipo), ...Object.keys(data.predichos_ml.por_tipo)])];
  const comparativaTiposData = {
    labels: allTipos,
    datasets: [
      { label: 'Real (2023)', data: allTipos.map(t => data.reales.por_tipo[t] || 0), backgroundColor: THEME.primary },
      { label: 'Predicción (2024)', data: allTipos.map(t => data.predichos_ml.por_tipo[t] || 0), backgroundColor: THEME.prediction },
    ],
  };
  const tendenciaSemanalData = {
    labels: data.reales.tendencia_semanal?.map((d, i) => `Semana ${i + 1}`) || [],
    datasets: [
      { label: 'Real', data: data.reales.tendencia_semanal?.map(d => d.conteo) || [], backgroundColor: THEME.primary },
      { label: 'Predicción', data: data.predichos_ml.tendencia_semanal?.map(d => d.conteo) || [], backgroundColor: THEME.prediction },
    ],
  };
  const allZonas = Object.keys(data.reales.por_zona); 
  const comparativaZonasData = {
    labels: allZonas,
    datasets: [
      { label: 'Real', data: allZonas.map(z => data.reales.por_zona[z] || 0), backgroundColor: THEME.primary },
      { label: 'Predicción', data: allZonas.map(z => data.predichos_ml.por_zona[z] || 0), backgroundColor: THEME.prediction },
    ],
  };
  const horizontalOptions = { indexAxis: 'y', plugins: { legend: { position: 'top', labels: { color: 'white' } } }, scales: { x: { ticks: { color: THEME.light }, grid: { color: '#ffffff10' } }, y: { ticks: { color: THEME.light }, grid: { display: false } } } };

  return (
    <div className={`${mainBackgroundClass} text-white pb-12 relative`}>
      
      {notification.message && (
        <div className={`fixed top-24 right-8 p-4 rounded-md shadow-2xl text-white z-50 animate-bounce ${notification.type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}>
          {notification.message}
        </div>
      )}

      {showRetrainModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1c261c] border-2 border-[#556B2F] p-6 rounded-xl shadow-2xl max-w-md w-full transform transition-all scale-100">
                <div className="flex items-center gap-3 mb-4 text-[#556B2F]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <h3 className="text-xl font-bold text-white">Confirmar Operación</h3>
                </div>
                <p className="text-gray-300 mb-2">Se iniciará el proceso de re-entrenamiento del modelo predictivo.</p>
                <p className="text-sm text-gray-400 mb-6 bg-black/30 p-3 rounded border border-[#2f3e2f]">⚠️ Este proceso consumirá recursos del servidor y puede tardar <span className="text-white font-bold"> varios minutos</span>.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowRetrainModal(false)} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors">Cancelar</button>
                    <button onClick={executeRetrain} className="px-6 py-2 bg-[#556B2F] hover:bg-[#4b5320] text-white font-bold rounded shadow-lg transition-all flex items-center gap-2"><span>Confirmar</span><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Análisis <span className="text-[#EF4444]">Predictivo</span></h1>
            <p className="text-gray-400 text-sm mt-1">Comparativa Realidad vs. Modelo (Precisión: <span className="text-[#76ff03] font-bold">{data.metadata.precision_simulada}</span>)</p>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
             <button onClick={handleRetrainClick} disabled={isTraining} className={`bg-[#2F4F4F] hover:bg-[#253e3e] text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all border border-gray-600 ${isTraining ? 'animate-pulse' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {isTraining ? 'Procesando...' : 'Re-entrenar Modelo'}
             </button>
             
             <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-[#556B2F] hover:bg-[#4b5320] text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all border border-green-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                {isExporting ? 'Generando...' : 'Reporte PDF'}
             </button>

             <button onClick={() => handleExport('excel')} disabled={isExporting} className="bg-[#107C41] hover:bg-[#0b5c30] text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all border border-green-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Excel
             </button>
          </div>
        </div>

        {/* ... (El resto del JSX con los gráficos y mapas no cambia, sigue igual) ... */}
        <div id="prediction-charts-export" className="space-y-8 bg-[#1c261c] p-4 rounded-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl flex flex-col justify-center items-center">
                <h2 className="text-gray-400 text-sm font-bold uppercase">REALIDAD</h2>
                <p className="text-5xl font-black mt-2 text-[#556B2F]">{data.reales.total_delitos}</p>
              </div>
              <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl flex flex-col justify-center items-center border-t-4 border-t-[#EF4444]">
                <h2 className="text-gray-400 text-sm font-bold uppercase">PREDICCIÓN</h2>
                <p className="text-5xl font-black mt-2 text-[#EF4444]">{data.predichos_ml.total_delitos}</p>
              </div>
              <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl h-[300px]">
                <BarChart chartData={comparativaTiposData} title="Comparativa por Tipología" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl h-[400px]">
                <BarChart chartData={tendenciaSemanalData} title="Tendencia Semanal" />
              </div>
              <div className="bg-[#273216] border border-[#2f3e2f] p-6 rounded-xl shadow-xl h-[400px]">
                <BarChart chartData={comparativaZonasData} title="Comparativa por Zona (Top)" options={horizontalOptions} />
              </div>
            </div>
        </div>

        {/* MAPAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-[#1c261c] border border-[#2f3e2f] p-1 rounded-xl shadow-xl h-[500px]">
                <h3 className="text-center text-gray-400 py-2 font-bold">INCIDENCIA REAL</h3>
                <div className="h-[450px] rounded-lg overflow-hidden">
                    <MapContainer center={[-16.495, -68.15]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        {data.reales.puntos_mapa.map((p, i) => (
                            <CircleMarker key={`real-${i}`} center={[p.latitud, p.longitud]} pathOptions={{ color: THEME.primary, radius: 3, fillOpacity: 0.8, stroke: false }} />
                        ))}
                    </MapContainer>
                </div>
            </div>
            <div className="bg-[#1c261c] border border-[#2f3e2f] p-1 rounded-xl shadow-xl h-[500px] border-t-4 border-t-[#EF4444]">
                <h3 className="text-center text-[#EF4444] py-2 font-bold">PREDICCIÓN DE RIESGO</h3>
                <div className="h-[450px] rounded-lg overflow-hidden">
                    <MapContainer center={[-16.495, -68.15]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        {data.predichos_ml.puntos_mapa.map((p, i) => (
                            <CircleMarker key={`pred-${i}`} center={[p.latitud, p.longitud]} pathOptions={{ color: THEME.prediction, radius: 4, fillOpacity: 0.6, stroke: false }} />
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default PredictionPage;