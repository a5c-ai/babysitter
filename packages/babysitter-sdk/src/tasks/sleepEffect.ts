/**
 * Sleep effect — parse human-friendly durations, create sleep effects,
 * and check expiry (TOOLS-028).
 *
 * Supports duration strings: "30s", "5m", "2h", "1d"
 * and ISO 8601 timestamps: "2026-06-03T15:30:00Z"
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SleepTarget {
  /** When the sleep expires (epoch ms). */
  wakeAt: number;
  /** Original input string. */
  raw: string;
  /** Whether the input was an ISO timestamp (vs. relative duration). */
  isAbsolute: boolean;
}

export interface SleepEffect {
  kind: 'sleep';
  wakeAt: number;
  raw: string;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Duration parsing
// ---------------------------------------------------------------------------

const DURATION_RE = /^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?|d|days?)$/i;

const UNIT_MS: Record<string, number> = {
  s: 1_000,
  sec: 1_000,
  secs: 1_000,
  second: 1_000,
  seconds: 1_000,
  m: 60_000,
  min: 60_000,
  mins: 60_000,
  minute: 60_000,
  minutes: 60_000,
  h: 3_600_000,
  hr: 3_600_000,
  hrs: 3_600_000,
  hour: 3_600_000,
  hours: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  days: 86_400_000,
};

/**
 * Parse a sleep target from a human-friendly string.
 *
 * Accepted formats:
 *  - Relative: "30s", "5m", "2h", "1d" (with optional verbose units)
 *  - Absolute: any ISO 8601 date string parseable by `Date.parse`
 *
 * Returns `undefined` if the string cannot be parsed.
 */
export function parseSleepTarget(input: string, now?: number): SleepTarget | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // Try relative duration
  const match = DURATION_RE.exec(trimmed);
  if (match) {
    const amount = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = UNIT_MS[unit];
    if (multiplier == null) return undefined;

    const baseMs = now ?? Date.now();
    return {
      wakeAt: baseMs + Math.round(amount * multiplier),
      raw: trimmed,
      isAbsolute: false,
    };
  }

  // Try ISO timestamp
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return {
      wakeAt: parsed,
      raw: trimmed,
      isAbsolute: true,
    };
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Effect construction
// ---------------------------------------------------------------------------

/**
 * Create a sleep effect from a parsed target.
 */
export function createSleepEffect(target: SleepTarget, now?: number): SleepEffect {
  return {
    kind: 'sleep',
    wakeAt: target.wakeAt,
    raw: target.raw,
    createdAt: now ?? Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Expiry check
// ---------------------------------------------------------------------------

/**
 * Return true if the sleep effect has expired (the wake time has passed).
 */
export function isExpired(effect: SleepEffect, now?: number): boolean {
  const ts = now ?? Date.now();
  return ts >= effect.wakeAt;
}
