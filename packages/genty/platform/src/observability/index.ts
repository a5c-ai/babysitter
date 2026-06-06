/**
 * Re-export shim — canonical implementation lives in @a5c-ai/genty-runtime.
 * Internal agent-platform consumers continue to import via relative paths
 * through this barrel file.
 */
export {
  buildPhaseTimeline,
  buildPhaseTimelineFromEvents,
  computeRunHealthFromEvents,
  getRunHealthSnapshot,
  getOrchestrationStatus,
  getPendingWorkItems,
  type OrchestrationStatus,
  type OrchestrationPhase,
  type PendingWorkItem,
  type PhaseTimeline,
  type PhaseEntry,
  type PhaseName,
  type Milestone,
  type IterationTimeline,
  type RunHealthSnapshot,
  type RunHealthStatus,
  type RunHealthMetrics,
  type HealthConfig,
  registerWebhook,
  unregisterWebhook,
  listWebhooks,
  buildWebhookEvent,
  evaluateAlertLevel,
  filterRegistrations,
  type AlertLevel,
  type WebhookEventType,
  type WebhookRegistration,
  type WebhookEvent,
  type WebhookDeliveryResult,
  type WebhookRegistry,
  type WebhookRegistrationInput,
  WEBHOOK_SCHEMA_VERSION,
} from "@a5c-ai/genty-runtime/observability";

// Prompt plan (OBS-003)
export {
  capturePromptPlan,
  updatePlanProgress,
  formatPlanSummary,
  type PlanStep,
  type PlanStepStatus,
  type PromptPlan,
  type PlanSummary,
} from './promptPlan';

// Context introspection (OBS-005)
export {
  captureContext,
  diffContexts,
  formatContextReport,
  type ContextEntry,
  type ContextSnapshot,
  type ContextDiff,
} from './contextIntrospection';

// Resume dashboard (GAP-UX-008)
export {
  buildResumeDashboard,
  formatDashboardText,
  type ResumeDashboardData,
  type StepSummary,
} from './resumeDashboard';

// Failure triage (GAP-UX-009)
export {
  triageFailures,
  formatTriageReport,
  type FailureEntry,
  type FailureSeverity,
  type TriageReport,
} from './failureTriage';
