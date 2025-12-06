import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineChart = ({ chartData, title }) => {
  
  // Definimos las opciones explícitamente para poder apagar la animación
  const options = {
    responsive: true,
    maintainAspectRatio: false,

    // --- ESTO ES LO QUE FALTABA ---
    animation: false, 
    // ------------------------------

    plugins: {
      legend: { display: false }, // O true si quieres leyenda
      title: {
        display: true, text: title, color: 'white',
        font: { size: 14, weight: 'bold' },
        align: 'start', padding: { bottom: 20 }
      },
    },
    scales: {
      x: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: '#374151' } },
      y: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: '#374151' } }
    }
  };

  return (
      <div className="h-full w-full">
         <Line options={options} data={chartData} />
      </div>
  );
};

export default LineChart;