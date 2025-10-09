// Archivo: src/pages/UploadPage.jsx

import { useState } from 'react';
import axios from 'axios';

function UploadPage() {
  // Estados para manejar el archivo seleccionado, el estado de carga y los mensajes
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Esta función se ejecuta cuando el usuario selecciona un archivo
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  // Esta función se ejecuta cuando el usuario hace clic en "Cargar Archivo"
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    // FormData es un objeto especial para enviar archivos en peticiones web
    const formData = new FormData();
    // La clave 'archivo_excel' DEBE coincidir con la que espera el backend en request.FILES.get()
    formData.append('archivo_excel', selectedFile);

    try {
      // Obtenemos el token de acceso del admin para autorizar la petición
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/data/upload/`,
        formData,
        {
          headers: {
            // El header 'Authorization' es crucial para que el backend nos reconozca
            'Authorization': `Bearer ${token}`,
            // Para archivos, el 'Content-Type' es 'multipart/form-data'
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      setMessage(response.data.status); // Mostramos el mensaje de éxito del backend
    } catch (err) {
      setError('Hubo un error al cargar el archivo. Verifica el formato y los datos.');
      console.error('Error de carga:', err);
    } finally {
      setIsLoading(false); // Detenemos el indicador de carga, tanto si hay éxito como si hay error
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Cargar Datos Históricos</h1>
      
      <div className="max-w-xl p-6 bg-slate-800 rounded-lg shadow space-y-4">
        <p className="text-sm text-gray-400">
          Selecciona un archivo de Excel (.xlsx) con los registros de delitos para cargarlos al sistema.
          Asegúrate de que las columnas coincidan con el formato esperado.
        </p>
        
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
            Seleccionar archivo
          </label>
          <input 
            id="file-upload" 
            type="file"
            onChange={handleFileChange}
            accept=".xlsx" // Solo permite seleccionar archivos de Excel
            className="block w-full text-sm text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-600 file:text-white
                       hover:file:bg-blue-700"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={isLoading || !selectedFile} // Deshabilitamos el botón si está cargando o no hay archivo
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition-colors
                     disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Cargando...' : 'Cargar Archivo'}
        </button>

        {/* Mostramos los mensajes de estado */}
        {message && <p className="text-green-500 text-center mt-4">{message}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}

export default UploadPage;