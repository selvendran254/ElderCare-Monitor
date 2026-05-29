export function Card({ children, className = '', hover = false, status }) {
  const statusBorder = status
    ? status === 'critical' || status === 'sos'
      ? 'border-red-200 ring-1 ring-red-100'
      : status === 'warning'
        ? 'border-amber-200 ring-1 ring-amber-100'
        : 'border-emerald-200 ring-1 ring-emerald-100'
    : 'border-slate-100';

  return (
    <div className={`${hover ? 'card-hover' : 'card'} ${statusBorder} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-lg">
            {icon}
          </div>
        )}
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
