# GAP-OBS-004: Policy Decision Trail

| Field | Value |
|-------|-------|
| Category | observability |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Log every policy and approval evaluation persistently, creating an audit trail of security decisions including which rules were checked, what matched, and what was decided.

## Current State
Breakpoint approval rules evaluate auto-approval with a reason field, but evaluation is not logged persistently. Capability restrictions in task definitions are advisory. No log of which policy rules were checked.

## Target State
Every auto-approval evaluation logged to JSONL. Includes breakpointId, rules checked, matched rule, decision, timestamp. breakpoint:history enriched with decision reasoning. Policy logs accessible via embedded SDK dashboard.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy layer for centralized evaluation

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint evaluator | `packages/sdk/src/breakpoints/evaluator.ts` |
| Breakpoint rules | `packages/sdk/src/breakpoints/rules.ts` |
| Logging module | `packages/sdk/src/logging/` |

## Recommendation
Phase 2 implementation. Log every policy evaluation to structured JSONL. Enrich breakpoint:history with decision details. Surface in embedded SDK dashboard.
