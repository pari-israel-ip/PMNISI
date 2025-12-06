import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BarChart({ chartData, title, direction = "vertical", onClickBar }) {
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: direction === "horizontal" ? 'y' : 'x',
    
    // --- ESTO ES LO QUE FALTABA ---
    animation: false, 
    // ------------------------------

    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const labelSeleccionado = chartData.labels[index];
        if (onClickBar) onClickBar(labelSeleccionado);
      }
    },

    plugins: {
      legend: { display: false },
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
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default BarChart;