import { Line } from 'react-chartjs-2';
import './chartSetup';

export default function ActivityChart({ activities }) {
  const labels = activities.map((a) =>
    new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  );

  return (
    <div className="chart-card">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">🚶 Activity Overview</h4>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Steps',
              data: activities.map((a) => a.steps),
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139,92,246,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              yAxisID: 'y',
            },
            {
              label: 'Sleep (hrs)',
              data: activities.map((a) => a.sleep_hours),
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6,182,212,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              yAxisID: 'y1',
            },
          ],
        }}
        options={{
          responsive: true,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
            y: {
              type: 'linear', position: 'left',
              title: { display: true, text: 'Steps', color: '#94a3b8' },
              grid: { color: '#f1f5f9' },
              ticks: { color: '#94a3b8' },
            },
            y1: {
              type: 'linear', position: 'right',
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Sleep (hrs)', color: '#94a3b8' },
              ticks: { color: '#94a3b8' },
            },
          },
        }}
      />
    </div>
  );
}
