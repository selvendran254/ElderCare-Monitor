import Badge from './ui/Badge';

export default function HealthScoreCard({ analytics }) {
  const { summary, riskBreakdown } = analytics;
  const score = summary?.healthScore || 0;

  const getScoreColor = (s) => {
    if (s >= 80) return { text: 'text-emerald-600', ring: 'stroke-emerald-500', bg: 'from-emerald-50 to-teal-50' };
    if (s >= 60) return { text: 'text-amber-600', ring: 'stroke-amber-500', bg: 'from-amber-50 to-orange-50' };
    return { text: 'text-red-600', ring: 'stroke-red-500', bg: 'from-red-50 to-rose-50' };
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`card p-6 bg-gradient-to-br ${colors.bg}`}>
      <h3 className="section-title mb-6">🏥 Health Score</h3>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              className={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-extrabold ${colors.text}`}>{score}</span>
            <span className="text-xs text-slate-500 font-medium">/ 100</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          {riskBreakdown && Object.entries(riskBreakdown).map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize font-medium text-slate-600">{k.replace('_', ' ')}</span>
                <span className="font-semibold text-slate-800">{v}%</span>
              </div>
              <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${v > 60 ? 'bg-red-500' : v > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: 'Avg HR', value: summary?.avgHR || '—', icon: '❤️' },
          { label: 'Avg BP', value: summary?.avgBP || '—', icon: '🩺' },
          { label: 'Steps', value: summary?.avgSteps || 0, icon: '🚶' },
          { label: 'Meds', value: `${summary?.compliance || 0}%`, icon: '💊' },
        ].map((item) => (
          <div key={item.label} className="bg-white/70 rounded-xl p-3 text-center border border-white">
            <div className="text-lg mb-1">{item.icon}</div>
            <div className="text-sm font-bold text-slate-800">{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
