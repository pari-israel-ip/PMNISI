import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Esta versión acepta una prop 'options' para fusionarla con las opciones por defecto.
// Es la que necesitas para que el gráfico horizontal de zonas funcione.
function BarChart({ chartData, title, options: customOptions }) {

  // Opciones por defecto para un gráfico de barras VERTICAL
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0', // Texto de leyenda (e.g., "Real", "Predicción ML")
        },
      },
      title: {
        display: true,
        text: title,
        color: '#e2e8f0', // Color del título
        font: {
          size: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
      },
    },
    scales: {
      // Eje Y (vertical por defecto)
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8', // Color de los números del eje Y
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)', // Color de las líneas de la cuadrícula
        },
      },
      // Eje X (vertical por defecto)
      x: {
        ticks: {
          color: '#94a3b8', // Color de las etiquetas del eje X
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
    },
  };

  // ¡LA MAGIA!
  // Fusionamos las opciones por defecto con las 'customOptions' que le pasamos.
  // Para el gráfico de zonas, 'customOptions' contendrá 'indexAxis: "y"' 
  // y sobrescribirá las escalas.
  const chartOptions = { ...defaultOptions, ...customOptions };

  return <Bar options={chartOptions} data={chartData} />;
}

export default BarChart;