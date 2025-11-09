// Archivo: src/pages/UploadRealDataPage.jsx (VERSIÓN FINAL Y COMPLETA)

import { useState } from 'react';
import axios from 'axios';

function UploadRealDataPage() {
  // Estados para manejar el archivo, la carga y los mensajes
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('archivo_excel', selectedFile);

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.post(
        // --- ¡AQUÍ ESTÁ EL CAMBIO MÁS IMPORTANTE! ---
        // Apuntamos al nuevo endpoint para los datos reales.
        `${import.meta.env.VITE_API_BASE_URL}/api/data/upload-real/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      setMessage(response.data.status);
    } catch (err) {
      setError('Hubo un error al cargar el archivo. Verifica el formato y los datos.');
      console.error('Error de carga:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Cargar Datos Reales (Formato Oficial)</h1>
      
      <div className="max-w-xl mx-auto p-6 bg-slate-800 rounded-lg shadow space-y-4">
        <p className="text-sm text-gray-400">
          Selecciona un archivo de Excel (.xlsx) con los registros de delitos reales para cargarlos al sistema.
        </p>
        
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
            Seleccionar archivo
          </label>
          <input 
            id="file-upload" 
            type="file"
            onChange={handleFileChange}
            accept=".xlsx, .csv" // Permitimos xlsx y csv por si acaso
            className="block w-full text-sm text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-600 file:text-white
                       hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={isLoading || !selectedFile}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition-colors
                     disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Cargando...' : 'Cargar Archivo'}
        </button>

        {message && <p className="text-green-500 text-center mt-4">{message}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}

export default UploadRealDataPage;