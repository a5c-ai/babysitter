// ProgressStatusLine.ts — Progress bar and status line formatting (GAP-UX-001e)
// Pure TypeScript: renders progress bars and status lines as strings.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressData {
  current: number;
  total: number;
  label: string;
  startedAt: number;          // epoch ms
  estimatedCompletion?: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Progress bar rendering
// ---------------------------------------------------------------------------

const FILL_CHAR = '█';   // █
const EMPTY_CHAR = '░';  // ░

export function formatProgressBar(data: ProgressData, width: number = 20): string {
  const safeTotal = Math.max(data.total, 1);
  const ratio = Math.min(Math.max(data.current / safeTotal, 0), 1);
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const percent = Math.round(ratio * 100);

  return `[${FILL_CHAR.repeat(filled)}${EMPTY_CHAR.repeat(empty)}] ${percent}%`;
}

// ---------------------------------------------------------------------------
// Time remaining
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  if (ms < 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function estimateRemaining(data: ProgressData, now: number): string | null {
  if (data.estimatedCompletion != null) {
    const remaining = data.estimatedCompletion - now;
    return remaining > 0 ? formatDuration(remaining) : 'any moment';
  }

  // Derive from elapsed time and progress
  const elapsed = now - data.startedAt;
  if (elapsed <= 0 || data.current <= 0) return null;

  const totalEstimate = (elapsed / data.current) * data.total;
  const remaining = totalEstimate - elapsed;
  return remaining > 0 ? formatDuration(remaining) : 'any moment';
}

// ---------------------------------------------------------------------------
// Status line rendering
// ---------------------------------------------------------------------------

export function formatStatusLine(data: ProgressData, now?: number): string {
  const currentTime = now ?? Date.now();
  const bar = formatProgressBar(data);
  const stepLabel = `Step ${data.current}/${data.total}`;
  const remaining = estimateRemaining(data, currentTime);
  const remainingText = remaining ? ` (${remaining} remaining)` : '';

  return `${stepLabel} — ${data.label} ${bar}${remainingText}`;
}
