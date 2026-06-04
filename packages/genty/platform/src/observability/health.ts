/**
 * Run Health Model (GAP-STATE-008).
 *
 * Computes a point-in-time health snapshot from journal events.
 * Pure function — no file I/O, takes events as input.
 */

import type { JournalEvent } from "@a5c-ai/babysitter-sdk";
import type {
  RunHealthSnapshot,
  RunHealthStatus,
  RunHealthMetrics,
  HealthConfig,
} from "./types";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: HealthConfig = {
  stuckThresholdMs: 300_000, // 5 minutes
  degradedErrorRate: 0.3,
  failedErrorRate: 0.7,
  maxPendingAge: 600_000, // 10 minutes
};

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

interface HealthOptions {
  config?: Partial<HealthConfig>;
  /** Override "now" for testing. */
  now?: number;
}

/**
 * Compute a health snapshot from an array of journal events.
 */
export function computeRunHealthFromEvents(
  events: JournalEvent[],
  options?: HealthOptions,
): RunHealthSnapshot {
  const config: HealthConfig = { ...DEFAULT_CONFIG, ...options?.config };
  const now = options?.now ?? Date.now();

  // Track effects
  const requestedAt = new Map<string, number>(); // effectId → timestamp ms
  const resolvedEffects = new Set<string>();
  let failedEffects = 0;
  let totalLatency = 0;
  let latencyCount = 0;
  let lastActivityAt: string | null = null;
  let hasRunFailed = false;
  const iterations = new Set<number>();

  for (const event of events) {
    lastActivityAt = event.recordedAt;
    const ts = new Date(event.recordedAt).getTime();

    if (event.type === "RUN_FAILED") {
      hasRunFailed = true;
    }

    if (event.type === "EFFECT_REQUESTED") {
      const effectId = typeof event.data.effectId === "string" ? event.data.effectId : undefined;
      if (effectId) {
        requestedAt.set(effectId, ts);
      }
      const iteration = typeof event.data.iteration === "number" ? event.data.iteration : undefined;
      if (iteration != null) {
        iterations.add(iteration);
      }
    }

    if (event.type === "EFFECT_RESOLVED") {
      const effectId = typeof event.data.effectId === "string" ? event.data.effectId : undefined;
      if (effectId) {
        resolvedEffects.add(effectId);
        const reqTs = requestedAt.get(effectId);
        if (reqTs != null) {
          totalLatency += ts - reqTs;
          latencyCount++;
        }
        const status = typeof event.data.status === "string" ? event.data.status : undefined;
        if (status === "error") {
          failedEffects++;
        }
      }
    }
  }

  // Compute metrics
  const totalEffects = requestedAt.size;
  const resolvedCount = resolvedEffects.size;
  const pendingCount = totalEffects - resolvedCount;
  const errorRate = resolvedCount > 0 ? failedEffects / resolvedCount : 0;
  const avgEffectLatencyMs =
    latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

  // Oldest pending effect age
  let oldestPendingAgeMs = 0;
  for (const [effectId, reqTs] of requestedAt) {
    if (!resolvedEffects.has(effectId)) {
      const age = now - reqTs;
      if (age > oldestPendingAgeMs) {
        oldestPendingAgeMs = age;
      }
    }
  }

  const metrics: RunHealthMetrics = {
    errorRate,
    avgEffectLatencyMs,
    pendingCount,
    oldestPendingAgeMs,
    iterationCount: iterations.size,
    lastActivityAt,
    totalEffects,
    resolvedEffects: resolvedCount,
    failedEffects,
  };

  // Determine status and issues
  const issues: string[] = [];
  let status: RunHealthStatus = "healthy";

  if (hasRunFailed) {
    status = "failed";
    issues.push("Run failed: RUN_FAILED event detected");
  } else if (errorRate >= config.failedErrorRate && resolvedCount > 0) {
    status = "failed";
    issues.push(
      `High error rate: ${(errorRate * 100).toFixed(1)}% exceeds failed threshold (${(config.failedErrorRate * 100).toFixed(1)}%)`,
    );
  } else if (
    lastActivityAt != null &&
    now - new Date(lastActivityAt).getTime() > config.stuckThresholdMs &&
    pendingCount > 0
  ) {
    status = "stuck";
    const idleMs = now - new Date(lastActivityAt).getTime();
    issues.push(
      `Run stuck: no activity for ${Math.round(idleMs / 1000)}s (threshold: ${Math.round(config.stuckThresholdMs / 1000)}s)`,
    );
  } else if (errorRate >= config.degradedErrorRate && resolvedCount > 0) {
    status = "degraded";
    issues.push(
      `Elevated error rate: ${(errorRate * 100).toFixed(1)}% exceeds degraded threshold (${(config.degradedErrorRate * 100).toFixed(1)}%)`,
    );
  }

  // Additional issues (additive, don't change status)
  if (
    oldestPendingAgeMs > config.maxPendingAge &&
    status !== "failed"
  ) {
    issues.push(
      `Oldest pending effect age: ${Math.round(oldestPendingAgeMs / 1000)}s exceeds max pending age (${Math.round(config.maxPendingAge / 1000)}s)`,
    );
    if (status === "healthy") {
      status = "degraded";
    }
  }

  return {
    status,
    metrics,
    issues,
    computedAt: new Date(now).toISOString(),
  };
}
