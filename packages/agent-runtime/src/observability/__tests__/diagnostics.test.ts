import { describe, expect, it } from "vitest";
import {
  buildDiagnosticsSnapshot,
  handleDiagnosticsRequest,
  redactDiagnosticsConfig,
  renderPrometheusMetrics,
} from "../diagnostics";

const health = {
  status: "healthy" as const,
  computedAt: "2026-01-01T00:00:00.000Z",
  issues: [],
  metrics: {
    errorRate: 0,
    avgEffectLatencyMs: 250,
    p50EffectLatencyMs: 200,
    p95EffectLatencyMs: 400,
    p99EffectLatencyMs: 400,
    pendingCount: 1,
    oldestPendingAgeMs: 1000,
    iterationCount: 2,
    lastActivityAt: "2026-01-01T00:00:00.000Z",
    totalEffects: 4,
    resolvedEffects: 3,
    failedEffects: 0,
  },
};

const queue = {
  activeRuns: 2,
  pendingRuns: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("agent-runtime diagnostics surfaces", () => {
  it("redacts secret-bearing daemon config fields recursively", () => {
    const redacted = redactDiagnosticsConfig({
      workspace: "/repo",
      apiToken: "plain-token",
      nested: {
        webhookSecret: "secret-value",
        safe: "visible",
      },
      triggers: [
        {
          type: "webhook",
          auth: { type: "bearer", token: "bearer-token" },
        },
      ],
    });

    expect(redacted).toMatchObject({
      workspace: "/repo",
      apiToken: "[REDACTED]",
      nested: {
        webhookSecret: "[REDACTED]",
        safe: "visible",
      },
      triggers: [
        {
          type: "webhook",
          auth: { type: "bearer", token: "[REDACTED]" },
        },
      ],
    });
  });

  it("builds safe health, config, queue, and metrics diagnostics without opening a listener", () => {
    const snapshot = buildDiagnosticsSnapshot({
      health,
      queue,
      config: {
        workspace: "/repo",
        secret: "hide-me",
        triggers: [],
      },
    });

    expect(snapshot.health.metrics.p95EffectLatencyMs).toBe(400);
    expect(snapshot.queue).toEqual(queue);
    expect(snapshot.config).toMatchObject({ workspace: "/repo", secret: "[REDACTED]" });
    expect(snapshot.metrics).toContain("babysitter_run_effect_latency_ms");
  });

  it("renders deterministic Prometheus text with bounded labels", () => {
    const text = renderPrometheusMetrics({ health, queue });

    expect(text).toContain("babysitter_run_effect_latency_ms{quantile=\"0.5\"} 200");
    expect(text).toContain("babysitter_run_effect_latency_ms{quantile=\"0.95\"} 400");
    expect(text).toContain("babysitter_run_effect_latency_ms{quantile=\"0.99\"} 400");
    expect(text).toContain("babysitter_daemon_queue_pending_runs 1");
    expect(text).not.toContain("/repo");
  });

  it("handles /health, /metrics, /config, and /queue as local pure request results", () => {
    const context = {
      health,
      queue,
      config: { workspace: "/repo", apiKey: "secret-key", triggers: [] },
    };

    expect(handleDiagnosticsRequest("/health", context)).toMatchObject({
      status: 200,
      contentType: "application/json",
      body: health,
    });
    expect(handleDiagnosticsRequest("/metrics", context)).toMatchObject({
      status: 200,
      contentType: "text/plain; version=0.0.4",
    });
    expect(handleDiagnosticsRequest("/config", context).body).toMatchObject({
      workspace: "/repo",
      apiKey: "[REDACTED]",
    });
    expect(handleDiagnosticsRequest("/queue", context)).toMatchObject({
      status: 200,
      body: queue,
    });
  });
});
