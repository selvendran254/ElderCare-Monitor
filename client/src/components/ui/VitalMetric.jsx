export default function VitalMetric({ icon, label, value, unit, large = false }) {
  return (
    <div className={`${large ? 'p-5' : 'p-4'} bg-white/60 rounded-xl border border-white/80 text-center`}>
      <div className={`${large ? 'text-3xl' : 'text-2xl'} mb-1`}>{icon}</div>
      <div className={`${large ? 'text-2xl' : 'text-xl'} font-bold text-slate-800`}>
        {value ?? '—'}{unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </div>
      <div className={`${large ? 'text-base' : 'text-sm'} text-slate-500 mt-1`}>{label}</div>
    </div>
  );
}
