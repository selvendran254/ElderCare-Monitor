const colors = {
  green: 'badge-green',
  yellow: 'badge-yellow',
  red: 'badge-red',
  blue: 'badge-blue',
  gray: 'badge-gray',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return <span className={`${colors[color] || colors.gray} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    normal: { color: 'green', label: 'Normal' },
    warning: { color: 'yellow', label: 'Warning' },
    critical: { color: 'red', label: 'Critical' },
    emergency: { color: 'red', label: 'Emergency' },
    sos: { color: 'red', label: 'SOS' },
    taken: { color: 'green', label: 'Taken' },
    approved: { color: 'green', label: 'Approved' },
    completed: { color: 'blue', label: 'Completed' },
    pending: { color: 'yellow', label: 'Pending' },
    rescheduled: { color: 'gray', label: 'Rescheduled' },
  };
  const { color, label } = map[status] || { color: 'gray', label: status };
  return <Badge color={color}>{label}</Badge>;
}
