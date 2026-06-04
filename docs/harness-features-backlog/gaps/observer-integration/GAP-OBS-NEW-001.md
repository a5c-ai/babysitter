# GAP-OBS-NEW-001: Embedded SDK Dashboard Webhook and Alert System

| Field | Value |
|-------|-------|
| Category | observer-integration |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Configure webhooks for run events (completion, failure, breakpoint). Integrate with PagerDuty, Slack, email.

## Current State
No embedded SDK dashboard exists yet. No alerting or webhooks.

## Target State
Webhook configuration per event type (run-complete, run-failed, breakpoint-pending, health-degraded). Built-in integrations: Slack, PagerDuty, email. Custom webhook support. Alert throttling and deduplication.

## Dependencies
- [GAP-STATE-008](../state-continuity/GAP-STATE-008.md) -- health model for health-degraded alerts

## Key Files
| Component | Path |
|-----------|------|
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Hook dispatcher | `packages/sdk/src/hooks/dispatcher.ts` |
| Config module | `packages/sdk/src/config/` |

## Recommendation
Phase 2 implementation. Add webhook configuration to embedded SDK dashboard settings. Implement Slack and email notification channels. Fire webhooks from hook dispatcher.
