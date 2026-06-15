/**
 * Analytics and feature flags (GAP-OBS-006).
 *
 * Provides a FeatureFlagStore for conditional feature enablement and an
 * AnalyticsCollector for lightweight event tracking within agent sessions.
 */

import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Feature Flags
// ---------------------------------------------------------------------------

export interface FeatureFlag {
  id: string;
  enabled: boolean;
  /** Rollout percentage (0–100). When set, `enabled` must be true and the flag
   *  is only active for a fraction of evaluations based on context hashing. */
  rolloutPercent?: number;
  description?: string;
}

export interface FeatureFlagContext {
  /** A stable identifier (e.g. user id, session id) for deterministic rollout. */
  stableId?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Simple deterministic hash for rollout bucketing
// ---------------------------------------------------------------------------

function hashToBucket(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100;
}

// ---------------------------------------------------------------------------
// FeatureFlagStore
// ---------------------------------------------------------------------------

export class FeatureFlagStore {
  private flags = new Map<string, FeatureFlag>();

  /**
   * Check if a flag is enabled, optionally accounting for rollout percentage.
   */
  isEnabled(flagId: string, context?: FeatureFlagContext): boolean {
    const flag = this.flags.get(flagId);
    if (!flag || !flag.enabled) return false;

    if (flag.rolloutPercent != null && flag.rolloutPercent < 100) {
      const stableId = context?.stableId ?? flagId;
      const bucket = hashToBucket(`${flagId}:${stableId}`);
      return bucket < flag.rolloutPercent;
    }

    return true;
  }

  /**
   * Set a flag's enabled state.
   */
  setFlag(id: string, enabled: boolean): void {
    const existing = this.flags.get(id);
    if (existing) {
      existing.enabled = enabled;
    } else {
      this.flags.set(id, { id, enabled });
    }
  }

  /**
   * Register or update a full flag definition.
   */
  registerFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
  }

  /**
   * List all registered flags.
   */
  listFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Load flags from a JSON config file. The file should contain an array of
   * FeatureFlag objects or an object `{ flags: FeatureFlag[] }`.
   */
  loadFromConfig(configPath: string): void {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const flagArray: FeatureFlag[] = Array.isArray(parsed) ? parsed : (parsed.flags ?? []);
    for (const flag of flagArray) {
      if (flag.id) {
        this.flags.set(flag.id, flag);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AnalyticsEvent {
  type: string;
  properties: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
}

export class AnalyticsCollector {
  private events: AnalyticsEvent[] = [];

  /**
   * Track a single analytics event.
   */
  track(event: AnalyticsEvent): void {
    this.events.push(event);
  }

  /**
   * Flush all collected events and reset the internal buffer.
   * Returns the flushed events for upstream processing.
   */
  flush(): AnalyticsEvent[] {
    const flushed = this.events;
    this.events = [];
    return flushed;
  }

  /**
   * Get all currently buffered events (without flushing).
   */
  getEvents(): readonly AnalyticsEvent[] {
    return this.events;
  }
}
