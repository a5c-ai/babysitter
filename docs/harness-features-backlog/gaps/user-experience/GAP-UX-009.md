# GAP-UX-009: Failure Triage View

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Diagnostic failure triage showing what went wrong, where in the orchestration it failed, and actionable fix suggestions.

## Current State
harness:doctor exists but repair requires manual log/state inspection. No synthesized failure triage with fix suggestions.

## Target State
Failure triage view shows: failure point in orchestration timeline, root cause analysis from journal, actionable fix suggestions (retry, repair-journal, rebuild-state), similar past failures and their resolutions.

## Dependencies
- [GAP-OBS-001](../observability/GAP-OBS-001.md) -- health snapshot for diagnostic context

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| Journal storage | `packages/sdk/src/storage/` |

## Recommendation
Phase 3 implementation. Enhance harness:doctor with failure-specific triage showing root cause and fix suggestions.
