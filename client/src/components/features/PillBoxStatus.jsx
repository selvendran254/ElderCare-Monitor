import { useEffect, useState } from 'react';
import api from '../../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import Button from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { useI18n } from '../../context/I18nContext';

export default function PillBoxStatus({ elderId }) {
  const { t } = useI18n();
  const [status, setStatus] = useState(null);

  const load = () => api.get(`/features/pillbox/${elderId}`).then(r => setStatus(r.data)).catch(() => {});

  useEffect(() => { if (elderId) load(); }, [elderId]);

  const markCompartment = async (compartment, eventStatus) => {
    await api.post(`/features/pillbox/${elderId}/event`, { compartment, status: eventStatus });
    load();
  };

  if (!status) return null;
  const { box, compartments } = status;

  return (
    <DetailPanel title={t('smartPillBox')} icon="💊" subtitle={`${box.name} · 🔋 ${box.battery_level}%`}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {compartments.map(c => (
          <div key={c.compartment} className="p-3 rounded-xl border border-slate-100 text-center bg-slate-50">
            <p className="text-xs text-slate-500">{t('compartment')} {c.compartment}</p>
            <StatusBadge status={c.status === 'taken' ? 'taken' : c.status === 'missed' ? 'missed' : 'pending'} />
            {c.status === 'pending' && (
              <Button variant="success" size="sm" className="mt-2 w-full" onClick={() => markCompartment(c.compartment, 'taken')}>
                ✓
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">{t('deviceStatus')}: {box.status} · {t('lastSync')}: {box.last_sync ? new Date(box.last_sync).toLocaleString() : '—'}</p>
    </DetailPanel>
  );
}
