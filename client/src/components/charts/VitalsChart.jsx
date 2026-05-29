import { Line } from 'react-chartjs-2';
import './chartSetup';

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: {
      position: 'top',
      labels: { usePointStyle: true, padding: 16, font: { family: 'Inter', size: 12 } },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#94a3b8' },
    },
    y: {
      beginAtZero: false,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 11 }, color: '#94a3b8' },
    },
  },
};

export default function VitalsChart({ vitals, type = 'bp' }) {
  const labels = vitals.map((v) =>
    new Date(v.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  );

  const title = type === 'bp' ? '🩺 Blood Pressure Trend' : '❤️ Heart Rate Trend';

  const datasets =
    type === 'bp'
      ? [
          {
            label: 'Systolic',
            data: vitals.map((v) => v.blood_pressure_sys),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: 'Diastolic',
            data: vitals.map((v) => v.blood_pressure_dia),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ]
      : [
          {
            label: 'Heart Rate (bpm)',
            data: vitals.map((v) => v.heart_rate),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ];

  return (
    <div className="chart-card">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">{title}</h4>
      <Line data={{ labels, datasets }} options={chartOptions} />
    </div>
  );
}
