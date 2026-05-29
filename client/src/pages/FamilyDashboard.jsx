import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import VitalsChart from '../components/charts/VitalsChart';
import ActivityChart from '../components/charts/ActivityChart';
import HealthScoreCard from '../components/HealthScoreCard';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';
import { getVitalStatus, statusClass, formatDate } from '../utils/helpers';
import { DetailPanel, StatBox, InfoRow } from '../components/ui/DetailPanel';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

export default function FamilyDashboard() {
  const { t } = useI18n();
  const [section, setSection] = useState('overview');
  const [elders, setElders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  const activeAlerts = alerts.filter((a) => !a.resolved);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'health', label: 'Health Score', icon: '🏥' },
    { id: 'alerts', label: t('alerts'), icon: '⚠️', badge: activeAlerts.length },
    { id: 'charts', label: 'Trends', icon: '📊' },
  ];

  useEffect(() => {
    api.get('/dashboard/elders')
      .then(({ data }) => { setElders(data); if (data.length) setSelected(data[0]); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load elders'));
  }, []);

  useEffect(() => {
    if (!selected) return;
    Promise.all([
      api.get(`/vitals/${selected.id}?days=30`),
      api.get(`/activities/${selected.id}?days=30`),
      api.get(`/analytics/${selected.id}?days=30`),
      api.get(`/alerts/${selected.id}`),
    ]).then(([v, a, an, al]) => {
      setVitals(v.data); setActivities(a.data); setAnalytics(an.data); setAlerts(al.data);
    }).catch((err) => setError(err.response?.data?.error || 'Failed to load health data'));
  }, [selected]);

  const latest = vitals[vitals.length - 1];
  const status = latest ? getVitalStatus(latest.heart_rate, latest.blood_pressure_sys) : 'normal';
  const latestActivity = activities[activities.length - 1];

  const elderSidebarExtra = elders.length > 0 ? (
    <div>
      <p className="text-emerald-300/60 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Your Loved Ones</p>
      <div className="space-y-1 px-2">
        {elders.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelected(e)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
              selected?.id === e.id ? 'bg-emerald-600 text-white' : 'text-emerald-100/80 hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selected?.id === e.id ? 'bg-white/20' : 'bg-emerald-700'}`}>
                {e.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{e.name}</p>
                <p className={`text-xs ${selected?.id === e.id ? 'text-emerald-200' : 'text-emerald-400/60'}`}>{e.age} yrs · {e.compliance}% meds</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <Layout
      title={selected ? selected.name : t('familyPortal')}
      subtitle={selected ? `${selected.age} yrs · ${selected.blood_group}` : t('familyPortalDesc')}
      sidebarItems={sidebarItems}
      activeSection={section}
      onSectionChange={setSection}
      sidebarExtra={elderSidebarExtra}
    >
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}
      {elders.length === 0 && !error && <EmptyState icon="👨‍👩‍👧" message={t('noData')} />}

      {selected && section === 'overview' && (
        <div className="space-y-4">
          <div className="content-grid">
            <StatBox icon="❤️" label="Heart Rate" value={latest?.heart_rate} unit="bpm" color={status === 'normal' ? 'emerald' : status === 'warning' ? 'amber' : 'red'} />
            <StatBox icon="🩺" label="Blood Pressure" value={latest ? `${latest.blood_pressure_sys}/${latest.blood_pressure_dia}` : '—'} color="blue" />
            <StatBox icon="💨" label="SpO2" value={latest?.spo2} unit="%" color="violet" />
            <StatBox icon="🌡️" label="Temperature" value={latest?.temperature} unit="°C" color="amber" />
            <StatBox icon="💊" label={t('compliance')} value={`${selected.compliance}%`} color={selected.compliance >= 80 ? 'emerald' : 'amber'} />
            <StatBox icon="⚠️" label="Alerts" value={activeAlerts.length} color={activeAlerts.length > 0 ? 'red' : 'emerald'} />
          </div>

          <div className="content-grid-2">
            <DetailPanel title={`${selected.name} — Profile`} icon="👴" subtitle="Personal details">
              <InfoRow label="Name" value={selected.name} icon="👤" />
              <InfoRow label="Age" value={selected.age} icon="🎂" />
              <InfoRow label="Blood Group" value={selected.blood_group} icon="🩸" />
              <InfoRow label={t('compliance')} value={`${selected.compliance}%`} icon="💊" />
              <InfoRow label="Health Status" value={status} icon="❤️" />
            </DetailPanel>

            <DetailPanel title="Latest Activity" icon="🚶" subtitle="Most recent log">
              {latestActivity ? (
                <>
                  <InfoRow label={t('steps')} value={latestActivity.steps} icon="🚶" />
                  <InfoRow label={t('sleep')} value={`${latestActivity.sleep_hours} hrs`} icon="😴" />
                  <InfoRow label={t('meals')} value={latestActivity.meal_count} icon="🍽️" />
                  <InfoRow label={t('water')} value={`${latestActivity.water_intake_ml} ml`} icon="💧" />
                </>
              ) : <EmptyState message={t('noData')} />}
            </DetailPanel>
          </div>

          {activeAlerts.length > 0 && (
            <DetailPanel title="Active Alerts" icon="⚠️" subtitle={`${activeAlerts.length} need attention`} colSpan="full" className="border-red-100">
              <div className="grid md:grid-cols-2 gap-3">
                {activeAlerts.slice(0, 8).map((a) => (
                  <div key={a.id} className="p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
                    {a.message}
                    <span className="text-xs text-red-400 ml-2">— {formatDate(a.triggered_at)}</span>
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}
        </div>
      )}

      {selected && section === 'health' && analytics && (
        <HealthScoreCard analytics={analytics} />
      )}

      {selected && section === 'health' && !analytics && (
        <EmptyState icon="🏥" message={t('noData')} />
      )}

      {selected && section === 'alerts' && (
        <div className="content-grid">
          {alerts.length === 0 ? (
            <div className="col-span-full"><EmptyState icon="✅" message="No alerts" /></div>
          ) : (
            alerts.map((a) => (
              <DetailPanel key={a.id} title={a.type?.toUpperCase() || 'Alert'} icon="⚠️"
                subtitle={formatDate(a.triggered_at)}
                className={a.resolved ? 'opacity-50' : ''}
                headerAction={<Badge color={a.resolved ? 'green' : 'red'}>{a.resolved ? 'Resolved' : 'Active'}</Badge>}>
                <p className="text-sm text-slate-700">{a.message}</p>
              </DetailPanel>
            ))
          )}
        </div>
      )}

      {selected && section === 'charts' && (
        <div className="content-grid-2">
          {vitals.length > 0 ? (
            <>
              <VitalsChart vitals={vitals} type="bp" />
              <VitalsChart vitals={vitals} type="hr" />
            </>
          ) : (
            <div className="col-span-full"><EmptyState icon="📊" message={t('noData')} /></div>
          )}
          {activities.length > 0 && (
            <div className="col-span-full"><ActivityChart activities={activities} /></div>
          )}
        </div>
      )}
    </Layout>
  );
}
