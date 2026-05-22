/**
 * Tests for GAP-OBS-NEW-001: Dashboard Webhook and Alert System.
 */

import { describe, it, expect } from "vitest";
import {
  registerWebhook,
  unregisterWebhook,
  listWebhooks,
  buildWebhookEvent,
  evaluateAlertLevel,
  filterRegistrations,
  type WebhookRegistration,
  type WebhookRegistry,
  type AlertLevel,
} from "../webhooks";
import type { RunHealthSnapshot, RunHealthStatus } from "../types";

function makeSnapshot(
  status: RunHealthStatus,
  overrides: Partial<RunHealthSnapshot> = {},
): RunHealthSnapshot {
  return {
    status,
    metrics: {
      errorRate: 0,
      pendingCount: 0,
      oldestPendingAgeMs: 0,
      iterationCount: 1,
      lastActivityAt: "2026-01-01T00:00:00Z",
      totalEffects: 5,
      resolvedEffects: 5,
      failedEffects: 0,
      avgEffectLatencyMs: 100,
    },
    issues: [],
    computedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("webhooks (GAP-OBS-NEW-001)", () => {
  describe("registerWebhook", () => {
    it("creates registration with generated id and createdAt", () => {
      const registry: WebhookRegistry = { schemaVersion: "2026.01.webhooks-v1", registrations: [] };
      const reg = registerWebhook(registry, {
        url: "https://example.com/hook",
        events: ["run.completed"],
        enabled: true,
      });
      expect(reg.id).toBeDefined();
      expect(reg.id.length).toBeGreaterThan(0);
      expect(reg.createdAt).toBeDefined();
      expect(reg.url).toBe("https://example.com/hook");
      expect(registry.registrations).toHaveLength(1);
    });
  });

  describe("unregisterWebhook", () => {
    it("removes entry by id", () => {
      const registry: WebhookRegistry = { schemaVersion: "2026.01.webhooks-v1", registrations: [] };
      const reg = registerWebhook(registry, {
        url: "https://example.com/hook",
        events: ["run.completed"],
        enabled: true,
      });
      unregisterWebhook(registry, reg.id);
      expect(registry.registrations).toHaveLength(0);
    });

    it("throws when id not found", () => {
      const registry: WebhookRegistry = { schemaVersion: "2026.01.webhooks-v1", registrations: [] };
      expect(() => unregisterWebhook(registry, "nonexistent")).toThrow();
    });
  });

  describe("listWebhooks", () => {
    it("returns all registrations when no runId filter", () => {
      const registry: WebhookRegistry = { schemaVersion: "2026.01.webhooks-v1", registrations: [] };
      registerWebhook(registry, { url: "https://a.com", events: ["run.completed"], enabled: true });
      registerWebhook(registry, { url: "https://b.com", events: ["run.failed"], enabled: true, runId: "run-1" });
      expect(listWebhooks(registry)).toHaveLength(2);
    });

    it("filters by runId when provided", () => {
      const registry: WebhookRegistry = { schemaVersion: "2026.01.webhooks-v1", registrations: [] };
      registerWebhook(registry, { url: "https://a.com", events: ["run.completed"], enabled: true });
      registerWebhook(registry, { url: "https://b.com", events: ["run.failed"], enabled: true, runId: "run-1" });
      const filtered = listWebhooks(registry, "run-1");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].url).toBe("https://b.com");
    });
  });

  describe("buildWebhookEvent", () => {
    it("creates event with correct type and alertLevel", () => {
      const snapshot = makeSnapshot("failed");
      const event = buildWebhookEvent("run.failed", "run-1", snapshot);
      expect(event.type).toBe("run.failed");
      expect(event.runId).toBe("run-1");
      expect(event.alertLevel).toBe("critical");
      expect(event.id).toBeDefined();
    });

    it("sets info level for run.completed", () => {
      const snapshot = makeSnapshot("healthy");
      const event = buildWebhookEvent("run.completed", "run-1", snapshot);
      expect(event.alertLevel).toBe("info");
    });
  });

  describe("evaluateAlertLevel", () => {
    it("returns null when health unchanged", () => {
      const prev = makeSnapshot("healthy");
      const next = makeSnapshot("healthy");
      expect(evaluateAlertLevel(prev, next)).toBeNull();
    });

    it("returns warn on healthy→degraded", () => {
      const prev = makeSnapshot("healthy");
      const next = makeSnapshot("degraded");
      expect(evaluateAlertLevel(prev, next)).toBe("warn");
    });

    it("returns critical on →stuck", () => {
      const prev = makeSnapshot("healthy");
      const next = makeSnapshot("stuck");
      expect(evaluateAlertLevel(prev, next)).toBe("critical");
    });

    it("returns critical on →failed", () => {
      const prev = makeSnapshot("degraded");
      const next = makeSnapshot("failed");
      expect(evaluateAlertLevel(prev, next)).toBe("critical");
    });

    it("returns info on recovery (degraded→healthy)", () => {
      const prev = makeSnapshot("degraded");
      const next = makeSnapshot("healthy");
      expect(evaluateAlertLevel(prev, next)).toBe("info");
    });

    it("returns critical when prev is null (first snapshot is failed)", () => {
      const next = makeSnapshot("failed");
      expect(evaluateAlertLevel(null, next)).toBe("critical");
    });

    it("returns null when prev is null and next is healthy", () => {
      const next = makeSnapshot("healthy");
      expect(evaluateAlertLevel(null, next)).toBeNull();
    });
  });

  describe("filterRegistrations", () => {
    it("skips disabled registrations", () => {
      const regs: WebhookRegistration[] = [
        { id: "1", url: "https://a.com", events: ["run.completed"], enabled: false, createdAt: "2026-01-01T00:00:00Z" },
      ];
      expect(filterRegistrations(regs, "run.completed")).toHaveLength(0);
    });

    it("filters by event type", () => {
      const regs: WebhookRegistration[] = [
        { id: "1", url: "https://a.com", events: ["run.completed"], enabled: true, createdAt: "2026-01-01T00:00:00Z" },
        { id: "2", url: "https://b.com", events: ["run.failed"], enabled: true, createdAt: "2026-01-01T00:00:00Z" },
      ];
      const filtered = filterRegistrations(regs, "run.failed");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("2");
    });

    it("filters by alertLevel when registration specifies alertLevels", () => {
      const regs: WebhookRegistration[] = [
        { id: "1", url: "https://a.com", events: ["run.health_changed"], alertLevels: ["critical"], enabled: true, createdAt: "2026-01-01T00:00:00Z" },
      ];
      expect(filterRegistrations(regs, "run.health_changed", "warn")).toHaveLength(0);
      expect(filterRegistrations(regs, "run.health_changed", "critical")).toHaveLength(1);
    });
  });
});
