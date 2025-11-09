// Archivo: src/components/LineChart.jsx
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineChart = ({ chartData, title }) => {
  const options = { /* ... (las mismas opciones que BarChart) ... */ };
  return <Line options={options} data={chartData} />;
};
export default LineChart;
