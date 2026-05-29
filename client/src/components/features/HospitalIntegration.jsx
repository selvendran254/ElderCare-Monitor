import { useEffect, useState } from 'react';
import api from '../../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import Button from '../ui/Button';
import { useI18n } from '../../context/I18nContext';

export default function HospitalIntegration({ elderId }) {
  const { t } = useI18n();
  const [hospitals, setHospitals] = useState([]);
  const [syncs, setSyncs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/features/hospitals').then(r => setHospitals(r.data)).catch(() => {});
    if (elderId) api.get(`/features/hospitals/${elderId}/sync-history`).then(r => setSyncs(r.data)).catch(() => {});
  }, [elderId]);

  const sync = async (hospitalId) => {
    setSyncing(true);
    try {
      const { data } = await api.post(`/features/hospitals/${elderId}/sync`, { hospital_id: hospitalId });
      setMessage(`✅ ${t('syncedTo')} ${data.hospital.hospital_name}`);
      const { data: history } = await api.get(`/features/hospitals/${elderId}/sync-history`);
      setSyncs(history);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DetailPanel title={t('hospitalIntegration')} icon="🏥" subtitle={t('hospitalIntegrationDesc')}>
      <div className="space-y-3">
        {hospitals.map(h => (
          <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-sm text-slate-800">{h.hospital_name}</p>
              <p className="text-xs text-slate-500">{h.hospital_code} · ABDM: {h.abdm_id}</p>
            </div>
            <Button variant="elder" size="sm" disabled={syncing} onClick={() => sync(h.id)}>
              🔄 {t('syncRecords')}
            </Button>
          </div>
        ))}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {syncs.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">{t('syncHistory')}</p>
            {syncs.slice(0, 5).map(s => (
              <div key={s.id} className="text-xs py-1 border-b border-slate-50 flex justify-between">
                <span>{s.hospital_name}</span>
                <span className="text-emerald-600">{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailPanel>
  );
}
