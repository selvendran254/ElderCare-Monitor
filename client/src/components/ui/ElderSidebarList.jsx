export default function ElderSidebarList({ elders, selected, onSelect, filter, onFilterChange, t }) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'alerts', label: '⚠️ Alerts' },
    { id: 'critical', label: '🔴 Critical' },
  ];

  return (
    <div>
      <p className="text-emerald-300/60 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
        {t('assignedElders')}
      </p>
      <div className="flex gap-1 px-2 mb-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              filter === f.id ? 'bg-emerald-600 text-white' : 'text-emerald-300/70 hover:bg-emerald-800/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto px-2">
        {elders.map((elder) => (
          <button
            key={elder.id}
            onClick={() => onSelect(elder)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
              selected?.id === elder.id
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-100/80 hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                selected?.id === elder.id ? 'bg-white/20' : 'bg-emerald-700'
              }`}>
                {elder.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{elder.name}</p>
                <p className={`text-xs truncate ${selected?.id === elder.id ? 'text-emerald-200' : 'text-emerald-400/60'}`}>
                  {elder.age}y · {elder.compliance}%
                  {elder.alertCount > 0 && ` · ${elder.alertCount}⚠️`}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
