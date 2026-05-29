import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import Button from '../ui/Button';
import { useI18n } from '../../context/I18nContext';

export default function VideoCall({ elderId, appointmentId, doctorId }) {
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!elderId) return;
    api.get(`/features/video/${elderId}`).then(r => setSessions(r.data)).catch(() => {});
  }, [elderId]);

  const startCall = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/features/video/${elderId}`, { appointmentId, doctorId });
      setSession(data);
      if (data.id) await api.patch(`/features/video/session/${data.id}`, { action: 'start' });
    } finally {
      setLoading(false);
    }
  };

  const endCall = async () => {
    if (!session?.id) return;
    await api.patch(`/features/video/session/${session.id}`, { action: 'end' });
    setSession(null);
  };

  return (
    <DetailPanel title={t('telemedicine')} icon="📹" subtitle={t('videoCallDesc')}>
      <div className="space-y-3">
        <Button variant="elder" onClick={startCall} disabled={loading}>
          {loading ? '...' : '📹 ' + t('startVideoCall')}
        </Button>

        {session && (
          <div className="space-y-2">
            <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
              <iframe
                title="Telemedicine"
                src={`${session.room_url}#userInfo.displayName=ElderCare`}
                allow="camera; microphone; fullscreen"
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-slate-500">Room: {session.room_id}</p>
            <Button variant="danger" size="sm" onClick={endCall}>{t('endCall')}</Button>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">{t('pastSessions')}</p>
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="text-xs py-1 border-b border-slate-50 flex justify-between">
                <span>{s.doctor_name || 'Doctor'}</span>
                <span className="text-slate-400">{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailPanel>
  );
}
