# GAP-BRK-002: Breakpoint Delegation to External Systems

| Field | Value |
|-------|-------|
| Category | breakpoint-workflows |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Route breakpoint approvals to external systems (Slack, email, webhooks, JIRA). Enable async approval workflows.

## Current State
Breakpoints handled by CLI operator or auto-approval rules. No external routing.

## Target State
Breakpoint routing to external systems via webhook. Slack integration for approval messages. Email notifications for pending approvals. JIRA ticket creation for audit-required approvals. Async approval with configurable timeout.

## Dependencies
- [GAP-JSON-003](../json-interaction/GAP-JSON-003.md) -- JSON breakpoint API for external interaction
- [GAP-OBS-NEW-001](../observer-integration/GAP-OBS-NEW-001.md) -- webhook infrastructure

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint types | `packages/sdk/src/breakpoints/types.ts` |
| Hook dispatcher | `packages/sdk/src/hooks/dispatcher.ts` |

## Recommendation
Phase 2 implementation. Add webhook routing for breakpoints. Implement Slack and email notification channels. Support async approval with timeout.
