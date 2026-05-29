import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const routes = { elder: '/elder', caretaker: '/caretaker', doctor: '/doctor', admin: '/admin', family: '/family' };
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-auth-pattern relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl mb-8">
            💚
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">{t('appName')}</h1>
          <p className="text-lg text-emerald-100 leading-relaxed max-w-md">
            {t('loginSubtitle')}
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm">
            {[
              { icon: '❤️', text: 'Real-time Vitals' },
              { icon: '💊', text: 'Med Tracking' },
              { icon: '🆘', text: 'SOS Alerts' },
              { icon: '📊', text: 'Health Analytics' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <span>{f.icon}</span>
                <span className="text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-mesh">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-glow">
              💚
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{t('appName')}</h1>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('login')}</h2>
            <p className="text-slate-500 mb-6">{t('loginSubtitle')}</p>

            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Input
                label={t('password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button type="submit" fullWidth disabled={loading} className="mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  t('login')
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t('register')}?{' '}
              <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">
                {t('register')}
              </Link>
            </p>
          </div>

          <p className="mt-6 text-xs text-slate-400 text-center leading-relaxed">{t('demoAccounts')}</p>
        </div>
      </div>
    </div>
  );
}
