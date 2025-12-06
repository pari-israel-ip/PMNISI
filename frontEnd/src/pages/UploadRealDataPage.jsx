// Archivo: src/pages/UploadRealDataPage.jsx (DISEÑO FINAL + SEGURIDAD DE TOKEN)

import { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Importante para redirigir si no hay sesión

function UploadRealDataPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setMessage('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }

    // 1. VERIFICAMOS EL TOKEN
    const token = localStorage.getItem('accessToken');
    if (!token) {
        // Si no hay token, mandamos al login para evitar el error 401
        navigate('/'); 
        return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('archivo_excel', selectedFile);

    try {
      // 2. ENVIAMOS CON EL HEADER DE AUTORIZACIÓN (ESTO ARREGLA EL 401)
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/data/upload-real/`,
        formData,
        { 
            headers: { 
                'Authorization': `Bearer ${token}`, // <--- LA CLAVE MAESTRA
                'Content-Type': 'multipart/form-data' 
            } 
        }
      );
      setMessage(response.data.status);
      setSelectedFile(null); 
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      // Manejo inteligente de errores
      if (err.response && err.response.status === 401) {
          setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
          setTimeout(() => navigate('/'), 3000); // Redirige en 3 seg
      } else if (err.response && err.response.data && err.response.data.error) {
          // Muestra el error exacto que manda el Backend (ej: "Falta columna COD...")
          setError(`Error del servidor: ${err.response.data.error}`);
      } else {
          setError('Error al procesar el archivo. Verifique el formato (.xlsx) y los datos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1c261c] min-h-screen p-8 text-white flex justify-center items-start pt-20">
      
      <div className="w-full max-w-2xl">
        {/* Encabezado */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Carga de Datos <span className="text-[#556B2F]">Oficiales</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Importación masiva de registros delictivos al sistema de inteligencia.
          </p>
        </div>

        {/* Tarjeta Principal */}
        <div className="bg-[#1c261c] border border-[#2f3e2f] rounded-xl shadow-2xl p-8 relative overflow-hidden">
          
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>

          {/* Zona de Carga (Dropzone visual) */}
          <div 
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-300 cursor-pointer group ${
              selectedFile ? 'border-[#556B2F] bg-[#556B2F]/10' : 'border-gray-600 hover:border-[#8FBC8F] hover:bg-gray-800'
            }`}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />
            
            {selectedFile ? (
              // Estado: Archivo Seleccionado
              <div className="animate-fade-in-up">
                <div className="mx-auto h-12 w-12 text-[#556B2F] mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-lg font-bold text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                <p className="text-xs text-[#8FBC8F] mt-3 font-medium uppercase tracking-wide">Click para cambiar archivo</p>
              </div>
            ) : (
              // Estado: Esperando Archivo
              <div>
                <div className="mx-auto h-12 w-12 text-gray-500 group-hover:text-[#8FBC8F] transition-colors mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="text-lg font-medium text-gray-300">
                  Haga clic para seleccionar el archivo
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos soportados: .xlsx (Formato Oficial)
                </p>
              </div>
            )}
          </div>

          {/* Botón de Acción */}
          <div className="mt-8">
            <button
              onClick={handleUpload}
              disabled={isLoading || !selectedFile}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white shadow-lg transition-all transform ${
                isLoading || !selectedFile
                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                  : 'bg-[#556B2F] hover:bg-[#4b5320] hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Procesando Datos...
                </span>
              ) : (
                'Importar Datos al Sistema'
              )}
            </button>
          </div>

          {/* Mensajes de Estado */}
          {message && (
            <div className="mt-6 p-4 bg-green-900/30 border border-green-800 rounded-lg flex items-center gap-3 animate-fade-in">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <p className="text-green-400 text-sm font-medium">{message}</p>
            </div>
          )}
          
          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-3 animate-pulse">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

        </div>

        {/* Instrucciones Rápidas */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            * Asegúrese de que el archivo no contenga fórmulas ni macros.<br/>
            * Verifique que la columna "COD. FORM. 01" esté presente.
          </p>
        </div>

      </div>
    </div>
  );
}

export default UploadRealDataPage;