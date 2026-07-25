/**
 * @process specializations/observability/incident-lifecycle
 * @deprecated Superseded by the incident-management flagship. This module is now a
 *   header-only pointer and carries NO implementation of its own.
 * @supersededBy incident-management/incident-lifecycle
 * @description DEPRECATED. The full detection-to-postmortem incident lifecycle that once
 *   lived here (single-workflow lifecycle, severity matrix, non-incident early exit,
 *   timeline accumulation, comms phase model with no-blame rules, iterative 3-pass
 *   diagnosis, SLO breach detection, and follow-up issue creation) is now owned by the
 *   incident-management flagship, whose header records this module as an `@absorbs` seed —
 *   every one of those features is implemented there against a superset contract (same
 *   signal shape, additional severity-routed policy gates and an adversarial postmortem
 *   gate). This file re-exports the flagship `process` so existing callers of
 *   `specializations/observability/incident-lifecycle` keep working unchanged. Observability
 *   is now an SLO-driven practice; its flagship is `slo-lifecycle.js` in this directory.
 * @graph
 *   domains: [domain:observability]
 *   specializations: [specialization:observability]
 *   skillAreas: [skill-area:incident-response, skill-area:alerting-oncall, skill-area:observability-instrumentation, skill-area:sli-slo-management]
 *   workflows: [workflow:incident-response, workflow:on-call-rotation, workflow:post-mortem-review]
 *   roles: [role:sre, role:observability-engineer, role:devops-engineer, role:platform-engineer]
 */

export { process } from '../incident-management/incident-lifecycle.js';
