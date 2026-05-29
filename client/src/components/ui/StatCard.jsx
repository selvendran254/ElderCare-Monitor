const gradients = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-teal-600',
  red: 'from-red-500 to-rose-600',
  purple: 'from-violet-500 to-purple-600',
  amber: 'from-amber-500 to-orange-500',
  slate: 'from-slate-600 to-slate-800',
};

export default function StatCard({ label, value, icon, gradient = 'green' }) {
  return (
    <div className="stat-card group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradients[gradient]} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500">{label}</span>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
        <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{value ?? 0}</div>
      </div>
    </div>
  );
}
