import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import VitalsChart from '../components/charts/VitalsChart';
import ActivityChart from '../components/charts/ActivityChart';
import ComplianceChart from '../components/charts/ComplianceChart';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';
import { formatDate, statusClass } from '../utils/helpers';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Badge, { StatusBadge } from '../components/ui/Badge';
import { DetailPanel, StatBox, InfoRow } from '../components/ui/DetailPanel';
import EmptyState from '../components/ui/EmptyState';

export default function DoctorDashboard() {
  const { t } = useI18n();
  const [section, setSection] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [compliance, setCompliance] = useState({ daily: [] });
  const [notesForm, setNotesForm] = useState({ id: null, clinical_notes: '', status: 'approved' });
  const [scheduleForm, setScheduleForm] = useState({ scheduled_at: '', notes: '' });
  const [labResults, setLabResults] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState('');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'timeline', label: t('timeline'), icon: '📋' },
    { id: 'appointments', label: t('appointments'), icon: '📅', badge: appointments.length },
    { id: 'labs', label: t('labResults'), icon: '🔬' },
    { id: 'charts', label: 'Analytics', icon: '📊' },
  ];

  useEffect(() => {
    api.get('/dashboard/elders')
      .then(({ data }) => { setPatients(data); if (data.length) setSelectedPatient(data[0]); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load patients'));
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    Promise.all([
      api.get(`/dashboard/timeline/${selectedPatient.id}`),
      api.get(`/appointments/${selectedPatient.id}`),
      api.get(`/vitals/${selectedPatient.id}?days=30`),
      api.get(`/activities/${selectedPatient.id}?days=30`),
      api.get(`/medications/${selectedPatient.id}/compliance`),
      api.get(`/analytics/${selectedPatient.id}/lab-results`),
      api.get(`/analytics/${selectedPatient.id}/prescriptions`),
    ]).then(([tl, ap, v, act, comp, lab, rx]) => {
      setTimeline(tl.data); setAppointments(ap.data); setVitals(v.data);
      setActivities(act.data); setCompliance(comp.data); setLabResults(lab.data); setPrescriptions(rx.data);
    }).catch((err) => setError(err.response?.data?.error || 'Failed to load patient data'));
  }, [selectedPatient]);

  const updateAppointment = async (id, updates) => {
    await api.put(`/appointments/${id}`, updates);
    const { data } = await api.get(`/appointments/${selectedPatient.id}`);
    setAppointments(data);
  };

  const saveClinicalNotes = async () => {
    if (!notesForm.id) return;
    await updateAppointment(notesForm.id, { clinical_notes: notesForm.clinical_notes, status: notesForm.status });
    setNotesForm({ id: null, clinical_notes: '', status: 'approved' });
    const { data } = await api.get(`/dashboard/timeline/${selectedPatient.id}`);
    setTimeline(data);
  };

  const createAppointment = async () => {
    if (!selectedPatient || !scheduleForm.scheduled_at) return;
    await api.post('/appointments', { elder_id: selectedPatient.id, scheduled_at: scheduleForm.scheduled_at, notes: scheduleForm.notes });
    setScheduleForm({ scheduled_at: '', notes: '' });
    const { data } = await api.get(`/appointments/${selectedPatient.id}`);
    setAppointments(data);
  };

  const exportPdf = async () => {
    const { data } = await api.get(`/dashboard/report/${selectedPatient.id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-report-${selectedPatient.name.replace(/\s/g, '-')}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const timelineIcon = (type) => ({ vitals: '❤️', activity: '🚶', appointment: '📅', alert: '⚠️' }[type] || '•');

  const patientSidebar = patients.length > 0 ? (
    <div>
      <p className="text-emerald-300/60 text-xs font-semibold uppercase tracking-wider px-3 mb-2">{t('patients')}</p>
      <div className="space-y-1 px-2 max-h-52 overflow-y-auto">
        {patients.map((p) => (
          <button key={p.id} onClick={() => setSelectedPatient(p)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
              selectedPatient?.id === p.id ? 'bg-emerald-600 text-white' : 'text-emerald-100/80 hover:bg-emerald-800/60'
            }`}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedPatient?.id === p.id ? 'bg-white/20' : 'bg-emerald-700'}`}>
                {p.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className={`text-xs truncate ${selectedPatient?.id === p.id ? 'text-emerald-200' : 'text-emerald-400/60'}`}>
                  {p.age}y · {p.compliance}%
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const latest = vitals[vitals.length - 1];

  return (
    <Layout
      title={selectedPatient ? selectedPatient.name : t('patients')}
      subtitle={selectedPatient ? `Age ${selectedPatient.age} · ${selectedPatient.blood_group} · ${t('compliance')} ${selectedPatient.compliance}%` : ''}
      sidebarItems={sidebarItems}
      activeSection={section}
      onSectionChange={setSection}
      sidebarExtra={patientSidebar}
    >
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}
      {!selectedPatient && <EmptyState icon="👨‍⚕️" message={t('noData')} />}

      {selectedPatient && section === 'overview' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={exportPdf}>📄 {t('exportPdf')}</Button>
          </div>
          <div className="content-grid">
            <StatBox icon="❤️" label="Heart Rate" value={latest?.heart_rate || selectedPatient.latestVitals?.heart_rate} unit="bpm" />
            <StatBox icon="🩺" label="Blood Pressure" value={latest ? `${latest.blood_pressure_sys}/${latest.blood_pressure_dia}` : '—'} color="blue" />
            <StatBox icon="💊" label={t('compliance')} value={`${selectedPatient.compliance}%`} color={selectedPatient.compliance >= 80 ? 'emerald' : 'amber'} />
            <StatBox icon="📅" label="Appointments" value={appointments.length} color="violet" />
            <StatBox icon="🔬" label="Lab Tests" value={labResults.length} color="blue" />
            <StatBox icon="💊" label="Prescriptions" value={prescriptions.length} color="emerald" />
          </div>

          <div className="content-grid-2">
            <DetailPanel title="Patient Details" icon="👴" subtitle={selectedPatient.name}>
              <InfoRow label="Age" value={selectedPatient.age} icon="🎂" />
              <InfoRow label="Blood Group" value={selectedPatient.blood_group} icon="🩸" />
              <InfoRow label={t('compliance')} value={`${selectedPatient.compliance}%`} icon="💊" />
              {latest && (
                <>
                  <InfoRow label="Latest HR" value={`${latest.heart_rate} bpm`} icon="❤️" />
                  <InfoRow label="Latest BP" value={`${latest.blood_pressure_sys}/${latest.blood_pressure_dia}`} icon="🩺" />
                </>
              )}
            </DetailPanel>

            <DetailPanel title={t('prescriptions')} icon="💊" subtitle={`${prescriptions.length} active`}>
              {prescriptions.length === 0 ? <EmptyState message={t('noData')} /> : (
                prescriptions.map((p) => (
                  <InfoRow key={p.id} label={p.medicine_name} value={`${p.dosage} (${p.frequency})`} icon="💊" />
                ))
              )}
            </DetailPanel>
          </div>
        </div>
      )}

      {selectedPatient && section === 'timeline' && (
        <DetailPanel title={t('timeline')} icon="📋" subtitle={`${timeline.length} events`} colSpan="full">
          {timeline.length === 0 ? <EmptyState message={t('noData')} /> : (
            <div className="relative max-h-[32rem] overflow-y-auto">
              <div className="timeline-line" />
              {timeline.map((item, i) => (
                <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-lg z-10 flex-shrink-0">
                    {timelineIcon(item.type)}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase text-slate-400">{item.type}</span>
                      <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                    </div>
                    <div className="text-sm text-slate-700">
                      {item.type === 'vitals' && <>HR: {item.data.heart_rate} | BP: {item.data.blood_pressure_sys}/{item.data.blood_pressure_dia}</>}
                      {item.type === 'activity' && <>Steps: {item.data.steps} | Sleep: {item.data.sleep_hours}h</>}
                      {item.type === 'appointment' && <>{item.data.notes || 'Appointment'} — <StatusBadge status={item.data.status} /></>}
                      {item.type === 'alert' && <span className={statusClass(item.data.type)}>{item.data.message}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailPanel>
      )}

      {selectedPatient && section === 'appointments' && (
        <div className="content-grid-2">
          <div className="space-y-4">
            {appointments.length === 0 ? <EmptyState icon="📅" message={t('noData')} /> : (
              appointments.map((ap) => (
                <DetailPanel key={ap.id} title={formatDate(ap.scheduled_at)} icon="📅"
                  headerAction={<StatusBadge status={ap.status} />}>
                  <InfoRow label="Notes" value={ap.notes || '—'} icon="📝" />
                  {ap.clinical_notes && <InfoRow label="Clinical Notes" value={ap.clinical_notes} icon="📋" />}
                  <div className="flex gap-2 mt-3">
                    <Button variant="success" size="sm" onClick={() => updateAppointment(ap.id, { status: 'approved' })}>{t('approve')}</Button>
                    <Button size="sm" onClick={() => setNotesForm({ id: ap.id, clinical_notes: ap.clinical_notes || '', status: 'completed' })}>{t('clinicalNotes')}</Button>
                  </div>
                </DetailPanel>
              ))
            )}
          </div>

          <div className="space-y-4">
            <DetailPanel title="Schedule New" icon="➕" subtitle="Book appointment">
              <Input type="datetime-local" value={scheduleForm.scheduled_at} onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })} className="mb-3" />
              <Textarea placeholder="Notes" value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} rows={3} className="mb-3" />
              <Button fullWidth onClick={createAppointment}>{t('save')}</Button>
            </DetailPanel>

            {notesForm.id && (
              <DetailPanel title={t('clinicalNotes')} icon="📝">
                <Textarea value={notesForm.clinical_notes} onChange={(e) => setNotesForm({ ...notesForm, clinical_notes: e.target.value })} rows={4} className="mb-3" />
                <Select value={notesForm.status} onChange={(e) => setNotesForm({ ...notesForm, status: e.target.value })} className="mb-3">
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rescheduled">Rescheduled</option>
                </Select>
                <Button fullWidth onClick={saveClinicalNotes}>{t('save')}</Button>
              </DetailPanel>
            )}
          </div>
        </div>
      )}

      {selectedPatient && section === 'labs' && (
        <div className="content-grid">
          {labResults.length === 0 ? (
            <div className="col-span-full"><EmptyState icon="🔬" message={t('noData')} /></div>
          ) : (
            labResults.map((l) => (
              <DetailPanel key={l.id} title={l.test_name} icon="🔬"
                headerAction={<Badge color={l.status === 'normal' ? 'green' : 'yellow'}>{l.status}</Badge>}>
                <InfoRow label="Result" value={`${l.result_value} ${l.unit}`} icon="📊" />
                <InfoRow label="Status" value={l.status} icon="📋" />
              </DetailPanel>
            ))
          )}
        </div>
      )}

      {selectedPatient && section === 'charts' && (
        <div className="space-y-4">
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
