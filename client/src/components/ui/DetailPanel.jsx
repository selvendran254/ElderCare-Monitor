export function DetailPanel({ title, icon, subtitle, children, className = '', colSpan = 1, headerAction }) {
  const spanClass = colSpan === 2 ? 'lg:col-span-2' : colSpan === 3 ? 'lg:col-span-3' : colSpan === 'full' ? 'col-span-full' : '';

  return (
    <div className={`detail-panel ${spanClass} ${className}`}>
      <div className="detail-panel-header">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-base flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {headerAction}
      </div>
      <div className="detail-panel-body">{children}</div>
    </div>
  );
}

export function StatBox({ label, value, unit, icon, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
  };

  return (
    <div className={`stat-box ${colors[color] || colors.emerald}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-2xl font-extrabold">
        {value ?? '—'}
        {unit && <span className="text-sm font-normal opacity-60 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500 flex items-center gap-2">
        {icon && <span>{icon}</span>}{label}
      </span>
      <span className="text-sm font-semibold text-slate-800">{value ?? '—'}</span>
    </div>
  );
}
