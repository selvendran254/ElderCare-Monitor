import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'elder',
    phone: '', age: '', blood_group: '', emergency_contact: '', address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register({
        ...form,
        age: form.age ? parseInt(form.age, 10) : undefined,
      });
      const routes = { elder: '/elder', caretaker: '/caretaker', doctor: '/doctor', family: '/family' };
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-auth-pattern relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl mb-6">
            ✨
          </div>
          <h1 className="text-3xl font-extrabold mb-3">{t('register')}</h1>
          <p className="text-emerald-100 leading-relaxed">
            Join ElderCare Monitor and stay connected with your loved ones' health journey.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-mesh overflow-y-auto">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('register')}</h2>
            <p className="text-slate-500 mb-6">Create your account to get started</p>

            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label={t('name')} value={form.name} onChange={update('name')} placeholder="John Doe" required />
              <Input label={t('email')} type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required />
              <Input label={t('password')} type="password" value={form.password} onChange={update('password')} placeholder="••••••••" required />

              <Select label={t('role')} value={form.role} onChange={update('role')}>
                <option value="elder">{t('elder')}</option>
                <option value="caretaker">{t('caretaker')}</option>
                <option value="doctor">{t('doctor')}</option>
                <option value="family">{t('family')}</option>
              </Select>

              <Input label={t('phone')} value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" />

              {form.role === 'elder' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-600">Elder Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label={t('age')} type="number" value={form.age} onChange={update('age')} placeholder="75" />
                    <Input label={t('bloodGroup')} value={form.blood_group} onChange={update('blood_group')} placeholder="O+" />
                  </div>
                  <Input label={t('emergencyContact')} value={form.emergency_contact} onChange={update('emergency_contact')} placeholder="+91 98765 43210" />
                  <Input label={t('address')} value={form.address} onChange={update('address')} placeholder="City, State" />
                </div>
              )}

              <Button type="submit" fullWidth disabled={loading} className="mt-2">
                {loading ? 'Creating account...' : t('register')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
