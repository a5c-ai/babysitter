export function statusTone(phase) {
  if (!phase) return 'neutral';
  const p = String(phase).toLowerCase();
  if (['active', 'ready', 'running', 'open', 'merged', 'succeeded', 'completed', 'healthy', 'bound'].includes(p)) return 'good';
  if (['pending', 'queued', 'starting', 'in-progress', 'review', 'warning', 'degraded'].includes(p)) return 'warn';
  if (['failed', 'error', 'closed', 'denied', 'rejected', 'unhealthy', 'dead'].includes(p)) return 'danger';
  return 'neutral';
}

export function phaseBadgeColor(phase) {
  const tone = statusTone(phase);
  return { good: '#22c55e', warn: '#eab308', danger: '#ef4444', neutral: '#9ca3af' }[tone];
}
