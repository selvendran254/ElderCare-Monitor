import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import VitalsChart from '../components/charts/VitalsChart';
import ComplianceChart from '../components/charts/ComplianceChart';
import ActivityChart from '../components/charts/ActivityChart';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import HealthScoreCard from '../components/HealthScoreCard';
import { getVitalStatus, statusClass, formatDate } from '../utils/helpers';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import { DetailPanel, StatBox, InfoRow } from '../components/ui/DetailPanel';
import EmptyState from '../components/ui/EmptyState';
import AlertBanner from '../components/ui/AlertBanner';
import ElderSidebarList from '../components/ui/ElderSidebarList';

export default function CaretakerDashboard() {
  const { t } = useI18n();
  const [section, setSection] = useState('overview');
  const [elders, setElders] = useState([]);
  const [selectedElder, setSelectedElder] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [compliance, setCompliance] = useState({ compliance: 0, daily: [] });
  const [alerts, setAlerts] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);
  const [bannerAlerts, setBannerAlerts] = useState([]);
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: 'once daily' });
  const [activityForm, setActivityForm] = useState({ steps: '', sleep_hours: '', meal_count: '' });
  const [analytics, setAnalytics] = useState(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const activeAlerts = alerts.filter(a => !a.resolved);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'monitoring', label: t('realTimeFeed'), icon: '📡' },
    { id: 'alerts', label: t('alerts'), icon: '⚠️', badge: activeAlerts.length },
    { id: 'actions', label: 'Actions', icon: '⚡' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  const loadElders = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get('/dashboard/elders');
      setElders(data);
      setSelectedElder((prev) => prev || (data.length ? data[0] : null));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load elders');
    }
  }, []);

  useEffect(() => { loadElders(); }, [loadElders]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    const onVitals = (v) => {
      setLiveFeed((prev) => [{ ...v, at: new Date() }, ...prev].slice(0, 20));
      setVitals((prev) => selectedElder && v.elder_id === selectedElder.id ? [...prev, v] : prev);
    };
    const onAlert = (alert) => {
      setBannerAlerts((prev) => [alert, ...prev].slice(0, 5));
      setAlerts((prev) => [alert, ...prev]);
    };
    const onSos = (alert) => setBannerAlerts((prev) => [{ ...alert, priority: 'sos' }, ...prev]);
    socket.on('vitals', onVitals);
    socket.on('alert', onAlert);
    socket.on('sos', onSos);
    return () => { socket.off('vitals', onVitals); socket.off('alert', onAlert); socket.off('sos', onSos); };
  }, [selectedElder]);

  useEffect(() => {
    if (!elders.length) return;
    const socket = connectSocket();
    if (socket) elders.forEach((e) => socket.emit('join-elder', e.id));
  }, [elders]);

  useEffect(() => {
    if (!selectedElder) return;
    const socket = connectSocket();
    if (socket) socket.emit('join-elder', selectedElder.id);
    Promise.all([
      api.get(`/vitals/${selectedElder.id}?days=30`),
      api.get(`/activities/${selectedElder.id}?days=30`),
      api.get(`/medications/${selectedElder.id}/compliance`),
      api.get(`/alerts/${selectedElder.id}`),
      api.get(`/analytics/${selectedElder.id}?days=30`),
    ]).then(([v, a, c, al, an]) => {
      setVitals(v.data); setActivities(a.data); setCompliance(c.data);
      setAlerts(al.data); setAnalytics(an.data);
    }).catch((err) => setError(err.response?.data?.error || 'Failed to load elder data'));
  }, [selectedElder]);

  const resolveAlert = async (id) => {
    await api.put(`/alerts/${id}/resolve`);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
    setBannerAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const addMedication = async () => {
    if (!selectedElder || !medForm.name) return;
    await api.post(`/medications/${selectedElder.id}`, medForm);
    setMedForm({ name: '', dosage: '', frequency: 'once daily' });
    loadElders();
  };

  const logActivity = async () => {
    if (!selectedElder) return;
    await api.post(`/activities/${selectedElder.id}`, {
      steps: parseInt(activityForm.steps, 10) || 0,
      sleep_hours: parseFloat(activityForm.sleep_hours) || 0,
      meal_count: parseInt(activityForm.meal_count, 10) || 0,
    });
    setActivityForm({ steps: '', sleep_hours: '', meal_count: '' });
    const { data } = await api.get(`/activities/${selectedElder.id}?days=30`);
    setActivities(data);
  };

  const filteredElders =
    filter === 'alerts' ? elders.filter((e) => e.alertCount > 0)
    : filter === 'critical' ? elders.filter((e) => e.latestVitals && getVitalStatus(e.latestVitals.heart_rate, e.latestVitals.blood_pressure_sys) !== 'normal')
    : elders;

  const latest = vitals[vitals.length - 1];
  const v = selectedElder?.latestVitals;
  const status = v ? getVitalStatus(v.heart_rate, v.blood_pressure_sys) : 'normal';

  return (
    <Layout
      title={selectedElder ? selectedElder.name : t('dashboard')}
      subtitle={selectedElder ? `Age ${selectedElder.age} · ${selectedElder.blood_group} · ${t('compliance')} ${selectedElder.compliance}%` : t('assignedElders')}
      sidebarItems={sidebarItems}
      activeSection={section}
      onSectionChange={setSection}
      sidebarExtra={
        <ElderSidebarList
          elders={filteredElders}
          selected={selectedElder}
          onSelect={setSelectedElder}
          filter={filter}
          onFilterChange={setFilter}
          t={t}
        />
      }
    >
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}
      {bannerAlerts.filter((a) => !a.resolved).map((alert) => (
        <AlertBanner key={alert.id} alert={alert} onDismiss={resolveAlert} />
      ))}

      {!selectedElder && <EmptyState icon="👴" message={t('noData')} />}

      {selectedElder && section === 'overview' && (
        <div className="space-y-4">
          <div className="content-grid">
            <StatBox icon="❤️" label="Heart Rate" value={v?.heart_rate || latest?.heart_rate} unit="bpm" color={status === 'normal' ? 'emerald' : status === 'warning' ? 'amber' : 'red'} />
            <StatBox icon="🩺" label="Blood Pressure" value={v ? `${v.blood_pressure_sys}/${v.blood_pressure_dia}` : '—'} color="blue" />
            <StatBox icon="💊" label={t('compliance')} value={`${selectedElder.compliance}%`} color={selectedElder.compliance >= 80 ? 'emerald' : 'amber'} />
            <StatBox icon="⚠️" label="Active Alerts" value={activeAlerts.length} color={activeAlerts.length > 0 ? 'red' : 'emerald'} />
            <StatBox icon="🚶" label={t('steps')} value={activities[activities.length - 1]?.steps || 0} color="violet" />
            <StatBox icon="😴" label={t('sleep')} value={activities[activities.length - 1]?.sleep_hours} unit="hrs" color="blue" />
          </div>

          <div className="content-grid-2">
            <DetailPanel title="Patient Info" icon="👴" subtitle={selectedElder.name}>
              <InfoRow label="Age" value={selectedElder.age} icon="🎂" />
              <InfoRow label="Blood Group" value={selectedElder.blood_group} icon="🩸" />
              <InfoRow label={t('compliance')} value={`${selectedElder.compliance}%`} icon="💊" />
              <InfoRow label="Alerts" value={selectedElder.alertCount || 0} icon="⚠️" />
              {latest && (
                <>
                  <InfoRow label="Last HR" value={`${latest.heart_rate} bpm`} icon="❤️" />
                  <InfoRow label="Last BP" value={`${latest.blood_pressure_sys}/${latest.blood_pressure_dia}`} icon="🩺" />
                </>
              )}
            </DetailPanel>

            <DetailPanel title="Recent Alerts" icon="⚠️" subtitle={`${activeAlerts.length} active`}>
              {activeAlerts.length === 0 ? (
                <EmptyState icon="✅" message="All clear" />
              ) : (
                activeAlerts.slice(0, 8).map((a) => (
                  <div key={a.id} className={`p-2 mb-2 rounded-lg text-sm border ${statusClass(a.type)}`}>
                    {a.message}
                    <div className="text-xs opacity-60 mt-0.5">{formatDate(a.triggered_at)}</div>
                  </div>
                ))
              )}
            </DetailPanel>
          </div>

          {analytics && (
            <div className="col-span-full"><HealthScoreCard analytics={analytics} /></div>
          )}
        </div>
      )}

      {selectedElder && section === 'monitoring' && (
        <div className="content-grid-2">
          <DetailPanel title={t('realTimeFeed')} icon="📡" subtitle="Live vitals stream" colSpan={1}>
            {liveFeed.length === 0 ? (
              <EmptyState icon="📡" message={t('noData')} />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {liveFeed.map((item, i) => {
                  const st = getVitalStatus(item.heart_rate, item.blood_pressure_sys);
                  return (
                    <div key={i} className={`p-3 rounded-xl text-sm border ${statusClass(st)} flex justify-between items-center`}>
                      <span>❤️ {item.heart_rate} · 🩺 {item.blood_pressure_sys}/{item.blood_pressure_dia}</span>
                      <span className="text-xs opacity-60">{item.at?.toLocaleTimeString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </DetailPanel>

          <DetailPanel title="Vitals History" icon="📈" subtitle="Recorded readings">
            {vitals.length === 0 ? (
              <EmptyState message={t('noData')} />
            ) : (
              vitals.slice(-8).reverse().map((item, i) => (
                <InfoRow key={i} icon="❤️" label={formatDate(item.recorded_at)}
                  value={`HR ${item.heart_rate} · BP ${item.blood_pressure_sys}/${item.blood_pressure_dia}`} />
              ))
            )}
          </DetailPanel>
        </div>
      )}

      {selectedElder && section === 'alerts' && (
        <div className="content-grid">
          {alerts.length === 0 ? (
            <div className="col-span-full"><EmptyState icon="✅" message="No alerts" /></div>
          ) : (
            alerts.map((a) => (
              <DetailPanel key={a.id} title={a.type?.toUpperCase() || 'Alert'} icon="⚠️"
                subtitle={formatDate(a.triggered_at)}
                className={a.resolved ? 'opacity-50' : ''}
                headerAction={!a.resolved && (
                  <Button variant="secondary" size="sm" onClick={() => resolveAlert(a.id)}>Dismiss</Button>
                )}>
                <p className="text-sm text-slate-700">{a.message}</p>
                <InfoRow label="Status" value={a.resolved ? 'Resolved' : 'Active'} icon="📋" />
              </DetailPanel>
            ))
          )}
        </div>
      )}

      {selectedElder && section === 'actions' && (
        <div className="content-grid-2">
          <DetailPanel title={t('addMedication')} icon="💊" subtitle="Add new prescription">
            <div className="space-y-3">
              <Input placeholder={t('name')} value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} />
              <Input placeholder={t('dosage')} value={medForm.dosage} onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })} />
              <Select value={medForm.frequency} onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}>
                <option value="once daily">Once daily</option>
                <option value="twice daily">Twice daily</option>
                <option value="three times daily">Three times daily</option>
              </Select>
              <Button fullWidth onClick={addMedication}>{t('save')}</Button>
            </div>
          </DetailPanel>

          <DetailPanel title={t('activity')} icon="🚶" subtitle="Log daily activity">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input placeholder={t('steps')} value={activityForm.steps} onChange={(e) => setActivityForm({ ...activityForm, steps: e.target.value })} className="input-field text-sm" />
              <input placeholder={t('sleep')} value={activityForm.sleep_hours} onChange={(e) => setActivityForm({ ...activityForm, sleep_hours: e.target.value })} className="input-field text-sm" />
              <input placeholder={t('meals')} value={activityForm.meal_count} onChange={(e) => setActivityForm({ ...activityForm, meal_count: e.target.value })} className="input-field text-sm" />
            </div>
            <Button variant="success" fullWidth onClick={logActivity}>{t('saveActivity')}</Button>
          </DetailPanel>

          <DetailPanel title={t('handoverNotes')} icon="📝" subtitle="Shift handover notes" colSpan={2}>
            <Textarea value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} rows={4} placeholder="Shift notes, observations, special instructions..." />
            <Button variant="secondary" fullWidth className="mt-3" onClick={async () => {
              await api.post(`/analytics/${selectedElder.id}/handovers`, { elder_id: selectedElder.id, notes: handoverNote });
              setHandoverNote('');
            }}>{t('save')}</Button>
          </DetailPanel>
        </div>
      )}

      {selectedElder && section === 'analytics' && (
        <div className="space-y-4">
          {analytics && <HealthScoreCard analytics={analytics} />}
          <div className="content-grid-2">
            {vitals.length > 0 && (
              <>
                <VitalsChart vitals={vitals} type="bp" />
                <VitalsChart vitals={vitals} type="hr" />
              </>
            )}
          </div>
          <div className="content-grid-2">
            {compliance.daily?.length > 0 && <ComplianceChart daily={compliance.daily} />}
            {activities.length > 0 && <ActivityChart activities={activities} />}
          </div>
        </div>
      )}
    </Layout>
  );
}
