import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import Button from '../ui/Button';
import { useI18n } from '../../context/I18nContext';

export default function FallDetector({ elderId }) {
  const { t } = useI18n();
  const [active, setActive] = useState(false);
  const [falls, setFalls] = useState([]);
  const [lastImpact, setLastImpact] = useState(0);
  const lastAccRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    api.get(`/features/fall/${elderId}`).then(r => setFalls(r.data)).catch(() => {});
  }, [elderId]);

  useEffect(() => {
    if (!active || !window.DeviceMotionEvent) return;

    const handler = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const dx = Math.abs((acc.x || 0) - lastAccRef.current.x);
      const dy = Math.abs((acc.y || 0) - lastAccRef.current.y);
      const dz = Math.abs((acc.z || 0) - lastAccRef.current.z);
      const impact = dx + dy + dz;
      lastAccRef.current = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };
      setLastImpact(Math.round(impact * 10) / 10);

      if (impact > 25) {
        api.post(`/features/fall/${elderId}`, {
          impact_force: impact,
          acceleration: { x: acc.x, y: acc.y, z: acc.z },
          source: 'device_motion',
        }).then(r => setFalls(prev => [r.data, ...prev]));
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [active, elderId]);

  const simulateFall = async () => {
    const { data } = await api.post(`/features/fall/${elderId}`, {
      impact_force: 35,
      source: 'simulation',
    });
    setFalls(prev => [data, ...prev]);
  };

  return (
    <DetailPanel title={t('fallDetection')} icon="🚨" subtitle={t('fallDetectionDesc')}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button variant={active ? 'danger' : 'elder'} onClick={() => setActive(!active)}>
            {active ? '⏹ ' + t('stopMonitoring') : '▶ ' + t('startMonitoring')}
          </Button>
          <Button variant="secondary" size="sm" onClick={simulateFall}>🧪 {t('simulateFall')}</Button>
        </div>
        {active && (
          <p className="text-sm text-slate-600">
            {t('impactLevel')}: <span className="font-bold">{lastImpact}</span>
          </p>
        )}
        {falls.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-semibold text-red-700 mb-1">{t('recentFalls')}</p>
            {falls.slice(0, 3).map(f => (
              <div key={f.id} className="text-xs py-1 text-red-600">
                🚨 {new Date(f.detected_at).toLocaleString()} — impact {f.impact_force}
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailPanel>
  );
}
