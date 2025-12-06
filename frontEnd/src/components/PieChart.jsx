import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ chartData, title, onZoneClick }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,

    // --- ESTO ES LO QUE FALTABA ---
    animation: false, 
    // ------------------------------
    
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const zonaSeleccionada = chartData.labels[index];
        if (onZoneClick) onZoneClick(zonaSeleccionada);
      }
    },

    plugins: {
      legend: { 
        position: 'right', 
        labels: { 
          color: 'white',
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 10 }
        } 
      },
      title: { 
        display: true, 
        text: title, 
        color: 'white',
        align: 'start',
        font: { size: 14, weight: 'bold' },
        padding: { bottom: 10 }
      },
    },
    layout: { padding: 0 }
  };

  return (
    <div className="h-full w-full relative">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChart;