import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { DetailPanel, InfoRow } from '../components/ui/DetailPanel';
import EmptyState from '../components/ui/EmptyState';
import LiveMap from '../components/features/LiveMap';
import HospitalIntegration from '../components/features/HospitalIntegration';

export default function AdminDashboard() {
  const { t } = useI18n();
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [elders, setElders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [assignForm, setAssignForm] = useState({ caretaker_id: '', doctor_id: '', elder_id: '', family_user_id: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const sidebarItems = [
    { id: 'overview', label: t('overview'), icon: '📊' },
    { id: 'users', label: t('users'), icon: '👥', badge: users.length },
    { id: 'assignments', label: t('assignments'), icon: '🔗' },
    { id: 'alertRules', label: t('alertRules'), icon: '⚙️' },
    { id: 'auditLogs', label: t('auditLogs'), icon: '📋' },
    { id: 'integrations', label: t('hospitalIntegration'), icon: '🏥' },
    { id: 'map', label: t('elderMap'), icon: '📍' },
  ];

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setError('');
      const [s, u, e, a, r] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/elders'),
        api.get('/admin/audit-logs'), api.get('/admin/alert-rules'),
      ]);
      setStats(s.data); setUsers(u.data); setElders(e.data); setAuditLogs(a.data); setAlertRules(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin data');
    }
  };

  const assign = async (type) => {
    const routes = { caretaker: '/admin/assign/caretaker', doctor: '/admin/assign/doctor', family: '/admin/assign/family' };
    await api.post(routes[type], assignForm);
    setMsg(t('save') + ' ✓');
    loadAll();
  };

  const roleBadgeColor = (role) => ({
    elder: 'green', caretaker: 'blue', doctor: 'yellow', admin: 'gray', family: 'red',
  }[role] || 'gray');

  return (
    <Layout
      title={t('adminPanel')}
      subtitle={sidebarItems.find(s => s.id === section)?.label}
      sidebarItems={sidebarItems}
      activeSection={section}
      onSectionChange={setSection}
    >
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}
      {msg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl animate-slide-up">✅ {msg}</div>
      )}

      {section === 'overview' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label={t('totalUsers')} value={stats.totalUsers} icon="👥" gradient="blue" />
          <StatCard label={t('totalElders')} value={stats.totalElders} icon="👴" gradient="green" />
          <StatCard label={t('activeAlerts')} value={stats.activeAlerts} icon="⚠️" gradient="red" />
          <StatCard label={t('upcomingAppointments')} value={stats.upcomingAppointments} icon="📅" gradient="purple" />
        </div>
      )}

      {section === 'users' && (
        <div className="content-grid">
          {users.map((u) => (
            <DetailPanel key={u.id} title={u.name} icon="👤"
              headerAction={<Badge color={roleBadgeColor(u.role)}>{u.role}</Badge>}>
              <InfoRow label={t('email')} value={u.email} icon="📧" />
              <InfoRow label={t('phone')} value={u.phone || '—'} icon="📱" />
              <InfoRow label={t('role')} value={u.role} icon="🏷️" />
            </DetailPanel>
          ))}
        </div>
      )}

      {section === 'assignments' && (
        <div className="content-grid-2">
          <DetailPanel title={t('assignCaretaker')} icon="🧑‍⚕️" subtitle="Link caretaker to elder">
            <div className="space-y-3">
              <Select value={assignForm.caretaker_id} onChange={(e) => setAssignForm({ ...assignForm, caretaker_id: e.target.value })}>
                <option value="">{t('caretaker')}</option>
                {users.filter((u) => u.role === 'caretaker').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
              <Select value={assignForm.elder_id} onChange={(e) => setAssignForm({ ...assignForm, elder_id: e.target.value })}>
                <option value="">{t('elder')}</option>
                {elders.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
              <Button fullWidth onClick={() => assign('caretaker')}>{t('save')}</Button>
            </div>
          </DetailPanel>

          <DetailPanel title={t('assignDoctor')} icon="👨‍⚕️" subtitle="Link doctor to elder">
            <div className="space-y-3">
              <Select value={assignForm.doctor_id} onChange={(e) => setAssignForm({ ...assignForm, doctor_id: e.target.value })}>
                <option value="">{t('doctor')}</option>
                {users.filter((u) => u.role === 'doctor').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
              <Select value={assignForm.elder_id} onChange={(e) => setAssignForm({ ...assignForm, elder_id: e.target.value })}>
                <option value="">{t('elder')}</option>
                {elders.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
              <Button variant="success" fullWidth onClick={() => assign('doctor')}>{t('save')}</Button>
            </div>
          </DetailPanel>
        </div>
      )}

      {section === 'alertRules' && (
        <div className="content-grid">
          {alertRules.length === 0 ? (
            <div className="col-span-full"><EmptyState message={t('noData')} /></div>
          ) : (
            alertRules.map((r, i) => (
              <DetailPanel key={r.id || i} title={r.name} icon="⚙️"
                headerAction={<Badge color={r.enabled !== false ? 'green' : 'gray'}>{r.enabled !== false ? 'ON' : 'OFF'}</Badge>}>
                <InfoRow label="Metric" value={r.metric} icon="📊" />
                <InfoRow label="Condition" value={`${r.operator} ${r.threshold}`} icon="⚡" />
                <InfoRow label="Alert Type" value={r.alert_type} icon="⚠️" />
              </DetailPanel>
            ))
          )}
        </div>
      )}

      {section === 'auditLogs' && (
        <div className="content-grid">
          {auditLogs.length === 0 ? (
            <div className="col-span-full"><EmptyState message={t('noData')} /></div>
          ) : (
            auditLogs.map((l) => (
              <DetailPanel key={l.id} title={l.user_name || 'System'} icon="📋"
                subtitle={new Date(l.created_at).toLocaleString()}>
                <InfoRow label="Action" value={l.action} icon="⚡" />
                <InfoRow label="Entity" value={l.entity_type} icon="🏷️" />
              </DetailPanel>
            ))
          )}
        </div>
      )}

      {section === 'integrations' && elders.length > 0 && (
        <HospitalIntegration elderId={elders[0].id} />
      )}

      {section === 'map' && <LiveMap multiElder />}
    </Layout>
  );
}
