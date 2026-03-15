import { RunStatus, TaskKind } from '../types';

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/**
 * Format milliseconds to human-readable duration: "2m 30s", "1h 5m", "< 1s"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) {
    return '0s';
  }
  if (ms < 1000) {
    return '< 1s';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/**
 * Format ISO timestamp to relative: "2m ago", "1h ago", "just now"
 */
export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs)) {
    return isoDate;
  }
  if (diffMs < 0) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Format ISO timestamp to readable: "Mar 10, 2:30 PM"
 */
export function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${month} ${day}, ${displayHours}:${displayMinutes} ${period}`;
}

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

/**
 * Get codicon name for run status.
 */
export function getStatusIcon(status: RunStatus, waitingKind?: 'breakpoint' | 'task'): string {
  switch (status) {
    case 'pending':
      return 'sync~spin';
    case 'waiting':
      return waitingKind === 'breakpoint' ? 'hand' : 'loading~spin';
    case 'completed':
      return 'check';
    case 'failed':
      return 'error';
    default:
      return 'circle-outline';
  }
}

/**
 * Get codicon name for task kind.
 */
export function getKindIcon(kind: TaskKind): string {
  switch (kind) {
    case 'node':
      return 'code';
    case 'agent':
      return 'hubot';
    case 'skill':
      return 'wand';
    case 'breakpoint':
      return 'hand';
    case 'shell':
      return 'terminal';
    case 'sleep':
      return 'clock';
    default:
      return 'circle-outline';
  }
}

// ---------------------------------------------------------------------------
// Staleness check
// ---------------------------------------------------------------------------

const DEFAULT_STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if a run is stale (last update > threshold).
 */
export function isStale(updatedAt: string, thresholdMs: number = DEFAULT_STALE_THRESHOLD_MS): boolean {
  const updatedMs = new Date(updatedAt).getTime();
  if (Number.isNaN(updatedMs)) {
    return false;
  }
  return (Date.now() - updatedMs) > thresholdMs;
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Truncate string with ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  if (maxLen < 1) {
    return '';
  }
  if (str.length <= maxLen) {
    return str;
  }
  if (maxLen <= 3) {
    return str.slice(0, maxLen);
  }
  return str.slice(0, maxLen - 3) + '...';
}
