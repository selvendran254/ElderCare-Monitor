import { statusClass } from '../../utils/helpers';
import Button from './Button';

export default function AlertBanner({ alert, onDismiss }) {
  return (
    <div className={`mb-4 p-4 rounded-xl border flex justify-between items-center gap-4 animate-slide-up ${statusClass(alert.type || alert.priority)}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{alert.priority === 'sos' ? '🆘' : '⚠️'}</span>
        <div>
          <strong className="uppercase text-sm tracking-wide">{alert.type || 'Alert'}</strong>
          <p className="text-sm mt-0.5">{alert.message}</p>
          {alert.elder_name && <span className="text-xs opacity-75">({alert.elder_name})</span>}
        </div>
      </div>
      {onDismiss && (
        <Button variant="secondary" size="sm" onClick={() => onDismiss(alert.id)}>
          Dismiss
        </Button>
      )}
    </div>
  );
}
