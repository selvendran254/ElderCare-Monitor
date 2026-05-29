import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import VitalsChart from '../components/charts/VitalsChart';
import ActivityChart from '../components/charts/ActivityChart';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';
import { getVitalStatus, statusClass, formatDate } from '../utils/helpers';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Button from '../components/ui/Button';
import { DetailPanel, StatBox, InfoRow } from '../components/ui/DetailPanel';
import EmptyState from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/Badge';

export default function ElderDashboard() {
  const { elder, user } = useAuth();
  const { t } = useI18n();
  const elderId = elder?.id;
  const [section, setSection] = useState('overview');

  usePushNotifications(!!elderId);

  const [vitals, setVitals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [vitalForm, setVitalForm] = useState({
    heart_rate: '', blood_pressure_sys: '', blood_pressure_dia: '',
    spo2: '', temperature: '', blood_glucose: '', mood: 'neutral', hydration_glasses: '',
  });
  const [activityForm, setActivityForm] = useState({
    steps: '', sleep_hours: '', meal_count: '', water_intake_ml: '', exercise_minutes: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sidebarItems = [
    { id: 'overview', label: t('dashboard'), icon: '🏠' },
    { id: 'vitals', label: t('vitals'), icon: '❤️' },
    { id: 'medications', label: t('medications'), icon: '💊', badge: medications.filter(m => m.todayLog?.status !== 'taken').length },
    { id: 'activity', label: t('activity'), icon: '🚶' },
    { id: 'appointments', label: t('appointments'), icon: '📅', badge: appointments.length },
    { id: 'charts', label: 'Trends', icon: '📊' },
  ];

  useEffect(() => {
    if (!elderId) return;
    loadData();
  }, [elderId]);

  const loadData = async () => {
    try {
      setError('');
      const [v, m, a, act] = await Promise.all([
        api.get(`/vitals/${elderId}?days=30`),
        api.get(`/medications/${elderId}`),
        api.get(`/appointments/${elderId}`),
        api.get(`/activities/${elderId}?days=30`),
      ]);
      setVitals(v.data);
      setMedications(m.data);
      setAppointments(a.data.filter((ap) => new Date(ap.scheduled_at) >= new Date()));
      setActivities(act.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    }
  };

  const saveVitals = async () => {
    await api.post(`/vitals/${elderId}`, {
      heart_rate: parseInt(vitalForm.heart_rate, 10) || null,
      blood_pressure_sys: parseInt(vitalForm.blood_pressure_sys, 10) || null,
      blood_pressure_dia: parseInt(vitalForm.blood_pressure_dia, 10) || null,
      spo2: parseFloat(vitalForm.spo2) || null,
      temperature: parseFloat(vitalForm.temperature) || null,
      blood_glucose: parseFloat(vitalForm.blood_glucose) || null,
      mood: vitalForm.mood,
      hydration_glasses: parseInt(vitalForm.hydration_glasses, 10) || null,
    });
    setVitalForm({ heart_rate: '', blood_pressure_sys: '', blood_pressure_dia: '', spo2: '', temperature: '', blood_glucose: '', mood: 'neutral', hydration_glasses: '' });
    setMessage(t('saveVitals') + ' ✓');
    loadData();
  };

  const saveActivity = async () => {
    await api.post(`/activities/${elderId}`, {
      steps: parseInt(activityForm.steps, 10) || 0,
      sleep_hours: parseFloat(activityForm.sleep_hours) || 0,
      meal_count: parseInt(activityForm.meal_count, 10) || 0,
      water_intake_ml: parseInt(activityForm.water_intake_ml, 10) || 0,
      exercise_minutes: parseInt(activityForm.exercise_minutes, 10) || 0,
    });
    setActivityForm({ steps: '', sleep_hours: '', meal_count: '', water_intake_ml: '', exercise_minutes: '' });
    setMessage(t('saveActivity') + ' ✓');
    loadData();
  };

  const markTaken = async (medId) => {
    await api.post(`/medications/log/${medId}`, { status: 'taken' });
    loadData();
  };

  const triggerSOS = async () => {
    if (!window.confirm(t('sosConfirm'))) return;
    await api.post(`/alerts/${elderId}/sos`);
    setMessage('SOS sent!');
  };

  if (!elderId) {
    return (
      <Layout title={t('dashboard')}>
        <EmptyState icon="👋" message={t('noData')} />
      </Layout>
    );
  }

  const latest = vitals[vitals.length - 1];
  const status = latest ? getVitalStatus(latest.heart_rate, latest.blood_pressure_sys) : 'normal';
  const latestActivity = activities[activities.length - 1];
  const pendingMeds = medications.filter(m => m.todayLog?.status !== 'taken');

  return (
    <Layout
      title={sidebarItems.find(s => s.id === section)?.label || t('dashboard')}
      subtitle={`${t('welcome')} — ${user?.name || ''}`}
      sidebarItems={sidebarItems}
      activeSection={section}
      onSectionChange={setSection}
    >
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}
      {message && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium animate-slide-up">
          ✅ {message}
        </div>
      )}

      {/* OVERVIEW */}
      {section === 'overview' && (
        <div className="space-y-4">
          <div className="content-grid">
            <StatBox icon="❤️" label={t('heartRate')} value={latest?.heart_rate} unit="bpm" color={status === 'normal' ? 'emerald' : status === 'warning' ? 'amber' : 'red'} />
            <StatBox icon="🩺" label={t('bloodPressure')} value={latest ? `${latest.blood_pressure_sys}/${latest.blood_pressure_dia}` : '—'} color="blue" />
            <StatBox icon="💨" label={t('spo2')} value={latest?.spo2} unit="%" color="violet" />
            <StatBox icon="🌡️" label={t('temperature')} value={latest?.temperature} unit="°C" color="amber" />
            <StatBox icon="💊" label="Pending Meds" value={pendingMeds.length} color={pendingMeds.length > 0 ? 'red' : 'emerald'} />
            <StatBox icon="🚶" label={t('steps')} value={latestActivity?.steps || 0} color="blue" />
          </div>

          <div className="content-grid-2">
            <DetailPanel title={t('medications')} icon="💊" subtitle={`${pendingMeds.length} pending today`}>
              {medications.length === 0 ? (
                <EmptyState icon="💊" message={t('noData')} />
              ) : (
                medications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-800">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage}</p>
                    </div>
                    {med.todayLog?.status === 'taken'
                      ? <StatusBadge status="taken" />
                      : <Button variant="success" size="sm" onClick={() => markTaken(med.id)}>✓ {t('markTaken')}</Button>
                    }
                  </div>
                ))
              )}
            </DetailPanel>

            <DetailPanel title={t('appointments')} icon="📅" subtitle={`${appointments.length} upcoming`}>
              {appointments.length === 0 ? (
                <EmptyState icon="📅" message={t('noData')} />
              ) : (
                appointments.map((ap) => (
                  <InfoRow key={ap.id} icon="📅" label={formatDate(ap.scheduled_at)} value={`Dr. ${ap.doctor_name}`} />
                ))
              )}
            </DetailPanel>
          </div>

          <DetailPanel title="Emergency" icon="🆘" colSpan="full" className="border-red-100">
            <p className="text-sm text-slate-600 mb-4">Press the button below to send an emergency alert to your caretaker and family.</p>
            <Button variant="elder-danger" onClick={triggerSOS}>🆘 {t('sos')}</Button>
          </DetailPanel>
        </div>
      )}

      {/* VITALS */}
      {section === 'vitals' && (
        <div className="content-grid-2">
          <DetailPanel title="Current Readings" icon="❤️" subtitle="Latest recorded vitals" className={statusClass(status)}>
            {latest ? (
              <div className="grid grid-cols-2 gap-3">
                <StatBox label={t('heartRate')} value={latest.heart_rate} unit="bpm" icon="❤️" />
                <StatBox label={t('bloodPressure')} value={`${latest.blood_pressure_sys}/${latest.blood_pressure_dia}`} icon="🩺" color="blue" />
                <StatBox label={t('spo2')} value={latest.spo2} unit="%" icon="💨" color="violet" />
                <StatBox label={t('temperature')} value={latest.temperature} unit="°C" icon="🌡️" color="amber" />
                <StatBox label={t('glucose')} value={latest.blood_glucose} unit="mg/dL" icon="🩸" color="red" />
                <StatBox label="Hydration" value={latest.hydration_glasses} unit="glasses" icon="💧" color="blue" />
              </div>
            ) : <EmptyState message={t('noData')} />}
          </DetailPanel>

          <DetailPanel title="Record New Vitals" icon="✏️" subtitle="Enter today's readings">
            <div className="space-y-3">
              <input type="number" placeholder={t('heartRate')} value={vitalForm.heart_rate} onChange={(e) => setVitalForm({ ...vitalForm, heart_rate: e.target.value })} className="input-field-lg w-full" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder={t('systolic')} value={vitalForm.blood_pressure_sys} onChange={(e) => setVitalForm({ ...vitalForm, blood_pressure_sys: e.target.value })} className="input-field-lg" />
                <input type="number" placeholder={t('diastolic')} value={vitalForm.blood_pressure_dia} onChange={(e) => setVitalForm({ ...vitalForm, blood_pressure_dia: e.target.value })} className="input-field-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder={t('spo2')} value={vitalForm.spo2} onChange={(e) => setVitalForm({ ...vitalForm, spo2: e.target.value })} className="input-field-lg" />
                <input type="number" step="0.1" placeholder={t('temperature')} value={vitalForm.temperature} onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })} className="input-field-lg" />
              </div>
              <input type="number" placeholder={t('glucose')} value={vitalForm.blood_glucose} onChange={(e) => setVitalForm({ ...vitalForm, blood_glucose: e.target.value })} className="input-field-lg w-full" />
              <Button variant="elder" onClick={saveVitals}>{t('saveVitals')}</Button>
            </div>
          </DetailPanel>
        </div>
      )}

      {/* MEDICATIONS */}
      {section === 'medications' && (
        <div className="content-grid">
          {medications.length === 0 ? (
            <div className="col-span-full"><EmptyState icon="💊" message={t('noData')} /></div>
          ) : (
            medications.map((med) => (
              <DetailPanel key={med.id} title={med.name} icon="💊" subtitle={med.dosage}
                headerAction={med.todayLog?.status === 'taken' ? <StatusBadge status="taken" /> : null}>
                <InfoRow label="Dosage" value={med.dosage} icon="💊" />
                <InfoRow label="Frequency" value={med.frequency || 'Daily'} icon="🕐" />
                <InfoRow label="Today's Status" value={med.todayLog?.status || 'Pending'} icon="📋" />
                {med.todayLog?.status !== 'taken' && (
                  <Button variant="success" fullWidth className="mt-4" size="lg" onClick={() => markTaken(med.id)}>
                    ✓ {t('markTaken')}
                  </Button>
                )}
              </DetailPanel>
            ))
          )}
        </div>
      )}

      {/* ACTIVITY */}
      {section === 'activity' && (
        <div className="content-grid-2">
          <DetailPanel title="Today's Activity" icon="🚶" subtitle="Latest recorded">
            {latestActivity ? (
              <div className="grid grid-cols-2 gap-3">
                <StatBox label={t('steps')} value={latestActivity.steps} icon="🚶" />
                <StatBox label={t('sleep')} value={latestActivity.sleep_hours} unit="hrs" icon="😴" color="violet" />
                <StatBox label={t('meals')} value={latestActivity.meal_count} icon="🍽️" color="amber" />
                <StatBox label={t('water')} value={latestActivity.water_intake_ml} unit="ml" icon="💧" color="blue" />
                <StatBox label={t('exercise')} value={latestActivity.exercise_minutes} unit="min" icon="🏃" color="emerald" />
              </div>
            ) : <EmptyState message={t('noData')} />}
          </DetailPanel>

          <DetailPanel title="Log Activity" icon="✏️" subtitle="Record today's activity">
            <div className="space-y-3">
              <input type="number" placeholder={t('steps')} value={activityForm.steps} onChange={(e) => setActivityForm({ ...activityForm, steps: e.target.value })} className="input-field-lg w-full" />
              <input type="number" step="0.5" placeholder={t('sleep')} value={activityForm.sleep_hours} onChange={(e) => setActivityForm({ ...activityForm, sleep_hours: e.target.value })} className="input-field-lg w-full" />
              <input type="number" placeholder={t('meals')} value={activityForm.meal_count} onChange={(e) => setActivityForm({ ...activityForm, meal_count: e.target.value })} className="input-field-lg w-full" />
              <input type="number" placeholder={t('water')} value={activityForm.water_intake_ml} onChange={(e) => setActivityForm({ ...activityForm, water_intake_ml: e.target.value })} className="input-field-lg w-full" />
              <input type="number" placeholder={t('exercise')} value={activityForm.exercise_minutes} onChange={(e) => setActivityForm({ ...activityForm, exercise_minutes: e.target.value })} className="input-field-lg w-full" />
              <Button variant="elder" className="bg-teal-600 hover:bg-teal-700" onClick={saveActivity}>{t('saveActivity')}</Button>
            </div>
          </DetailPanel>
        </div>
      )}

      {/* APPOINTMENTS */}
      {section === 'appointments' && (
        <div className="content-grid">
          {appointments.length === 0 ? (
            <div className="col-span-full"><EmptyState icon="📅" message={t('noData')} /></div>
          ) : (
            appointments.map((ap) => (
              <DetailPanel key={ap.id} title={formatDate(ap.scheduled_at)} icon="📅"
                headerAction={<StatusBadge status={ap.status} />}>
                <InfoRow label="Doctor" value={`Dr. ${ap.doctor_name}`} icon="👨‍⚕️" />
                <InfoRow label="Status" value={ap.status} icon="📋" />
                {ap.notes && <InfoRow label="Notes" value={ap.notes} icon="📝" />}
              </DetailPanel>
            ))
          )}
        </div>
      )}

      {/* CHARTS */}
      {section === 'charts' && (
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
