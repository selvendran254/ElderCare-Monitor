import { Bar } from 'react-chartjs-2';
import './chartSetup';

export default function ComplianceChart({ daily }) {
  const labels = daily.map((d) =>
    new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })
  );

  return (
    <div className="chart-card">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">💊 Medication Compliance</h4>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Compliance %',
              data: daily.map((d) => d.compliance),
              backgroundColor: daily.map((d) =>
                d.compliance >= 80 ? '#10b981' : d.compliance >= 50 ? '#f59e0b' : '#ef4444'
              ),
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
            y: {
              min: 0, max: 100,
              grid: { color: '#f1f5f9' },
              ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
            },
          },
        }}
      />
    </div>
  );
}
