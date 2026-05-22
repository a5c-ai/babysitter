export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  jitterFactor?: number;
}

export function nextBackoffDelay(attempt: number, options: BackoffOptions = {}): number {
  const baseMs = options.baseMs ?? 500;
  const maxMs = options.maxMs ?? 30_000;
  const jitterFactor = options.jitterFactor ?? 0.2;
  const raw = Math.min(maxMs, baseMs * (2 ** Math.max(0, attempt - 1)));
  const jitter = raw * jitterFactor * Math.random();
  return Math.round(raw + jitter);
}
