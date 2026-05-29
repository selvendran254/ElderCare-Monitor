import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import '../charts/chartSetup';
import api from '../../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import Button from '../ui/Button';
import { useI18n } from '../../context/I18nContext';

export default function AIPredictionChart({ elderId }) {
  const { t } = useI18n();
  const [prediction, setPrediction] = useState(null);

  const load = async (refresh = false) => {
    const { data } = await api.get(`/features/ai-prediction/${elderId}${refresh ? '?refresh=1' : ''}`);
    setPrediction(data);
  };

  useEffect(() => { if (elderId) load(); }, [elderId]);

  if (!prediction) return null;

  const forecast = prediction.daily_forecast || [];
  const level = prediction.risk_level || 'low';

  const chartData = {
    labels: forecast.map(d => d.date?.slice(5)),
    datasets: [{
      label: t('riskScore'),
      data: forecast.map(d => d.risk_score),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.1)',
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <DetailPanel title={t('aiPrediction')} icon="🤖" subtitle={t('aiPredictionDesc')}>
      <div className="space-y-3">
        <div className={`p-4 rounded-xl border ${
          level === 'high' ? 'bg-red-50 border-red-200' : level === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <p className="text-2xl font-bold text-slate-800">{prediction.risk_score}/100</p>
          <p className={`text-sm font-semibold uppercase ${
            level === 'high' ? 'text-red-700' : level === 'medium' ? 'text-amber-700' : 'text-emerald-700'
          }`}>{prediction.risk_level} {t('risk')}</p>
          <p className="text-sm text-slate-600 mt-1">{prediction.summary}</p>
        </div>
        {forecast.length > 0 && (
          <div className="h-48">
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} />
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={() => load(true)}>🔄 {t('refreshPrediction')}</Button>
      </div>
    </DetailPanel>
  );
}
