import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Añadimos una nueva 'prop' llamada 'direction' para controlar la orientación
const BarChart = ({ chartData, title, direction = 'vertical' }) => {
  const options = {
    // La magia está aquí: 'indexAxis' define si el eje principal es 'x' (vertical) o 'y' (horizontal)
    indexAxis: direction === 'vertical' ? 'x' : 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Ocultamos la leyenda para un look más limpio
      title: { display: true, text: title, color: 'white', font: { size: 16 } },
    },
    scales: {
      x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
  };
  return <Bar options={options} data={chartData} />;
};
export default BarChart;