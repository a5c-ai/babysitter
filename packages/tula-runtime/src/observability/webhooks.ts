/**
 * GAP-OBS-NEW-001: Dashboard Webhook and Alert System.
 *
 * Webhook registration, event filtering, and alert evaluation
 * for run health changes. Pure functions for registry management
 * and alert level computation.
 */

import type { RunHealthSnapshot, RunHealthStatus } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertLevel = "info" | "warn" | "critical";

export type WebhookEventType =
  | "run.health_changed"
  | "run.completed"
  | "run.failed"
  | "run.stuck"
  | "effect.pending_timeout";

export interface WebhookRegistration {
  id: string;
  url: string;
  events: WebhookEventType[];
  runId?: string;
  alertLevels?: AlertLevel[];
  secret?: string;
  createdAt: string;
  enabled: boolean;
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  runId: string;
  alertLevel: AlertLevel;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface WebhookDeliveryResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  deliveredAt: string;
}

export interface WebhookRegistry {
  schemaVersion: string;
  registrations: WebhookRegistration[];
}

export type WebhookRegistrationInput = Omit<WebhookRegistration, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WEBHOOK_SCHEMA_VERSION = "2026.01.webhooks-v1";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(): string {
  // Use crypto.randomUUID for test isolation (no shared mutable counter)
  return `wh-${crypto.randomUUID()}`;
}

// ---------------------------------------------------------------------------
// Alert level mapping
// ---------------------------------------------------------------------------

const STATUS_ALERT_MAP: Record<RunHealthStatus, AlertLevel> = {
  healthy: "info",
  degraded: "warn",
  stuck: "critical",
  failed: "critical",
};

// ---------------------------------------------------------------------------
// Registry management (pure, operates on mutable registry)
// ---------------------------------------------------------------------------

/**
 * Register a new webhook in the registry.
 * Mutates the registry and returns the created registration.
 */
export function registerWebhook(
  registry: WebhookRegistry,
  input: WebhookRegistrationInput,
): WebhookRegistration {
  const registration: WebhookRegistration = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  registry.registrations.push(registration);
  return registration;
}

/**
 * Remove a webhook by id. Throws if not found.
 */
export function unregisterWebhook(
  registry: WebhookRegistry,
  id: string,
): void {
  const index = registry.registrations.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error(`Webhook not found: ${id}`);
  }
  registry.registrations.splice(index, 1);
}

/**
 * List webhooks, optionally filtered by runId.
 */
export function listWebhooks(
  registry: WebhookRegistry,
  runId?: string,
): WebhookRegistration[] {
  if (!runId) return [...registry.registrations];
  return registry.registrations.filter((r) => r.runId === runId);
}

// ---------------------------------------------------------------------------
// Event building
// ---------------------------------------------------------------------------

/**
 * Build a webhook event from a health snapshot.
 */
export function buildWebhookEvent(
  type: WebhookEventType,
  runId: string,
  snapshot: RunHealthSnapshot,
): WebhookEvent {
  return {
    id: generateId(),
    type,
    runId,
    alertLevel: STATUS_ALERT_MAP[snapshot.status],
    payload: {
      status: snapshot.status,
      metrics: snapshot.metrics,
      issues: snapshot.issues,
    },
    occurredAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Alert level evaluation (pure)
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a health transition warrants an alert.
 * Returns the alert level, or null if no alert is needed.
 */
export function evaluateAlertLevel(
  prev: RunHealthSnapshot | null,
  next: RunHealthSnapshot,
): AlertLevel | null {
  const prevStatus = prev?.status ?? "healthy";
  const nextStatus = next.status;

  if (prevStatus === nextStatus) return null;

  // Recovery: anything → healthy
  if (nextStatus === "healthy") return "info";

  // Degradation
  if (nextStatus === "degraded") return "warn";

  // Critical states
  if (nextStatus === "stuck" || nextStatus === "failed") return "critical";

  return null;
}

// ---------------------------------------------------------------------------
// Registration filtering
// ---------------------------------------------------------------------------

/**
 * Filter registrations for a given event type and optional alert level.
 */
export function filterRegistrations(
  registrations: WebhookRegistration[],
  eventType: WebhookEventType,
  alertLevel?: AlertLevel,
): WebhookRegistration[] {
  return registrations.filter((r) => {
    if (!r.enabled) return false;
    if (!r.events.includes(eventType)) return false;
    if (alertLevel && r.alertLevels && r.alertLevels.length > 0) {
      if (!r.alertLevels.includes(alertLevel)) return false;
    }
    return true;
  });
}
