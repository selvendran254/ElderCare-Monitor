export default function EmptyState({ icon = '📭', message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="text-4xl mb-3 opacity-60">{icon}</span>
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
