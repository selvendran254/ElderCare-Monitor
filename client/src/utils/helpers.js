export function getVitalStatus(heartRate, bpSys) {
  if (heartRate != null && (heartRate < 50 || heartRate > 120)) return 'critical';
  if (bpSys != null && (bpSys > 180 || bpSys < 90)) return 'warning';
  return 'normal';
}

export function statusClass(status) {
  if (status === 'critical' || status === 'emergency' || status === 'sos') return 'status-critical';
  if (status === 'warning') return 'status-warning';
  return 'status-normal';
}

export function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
