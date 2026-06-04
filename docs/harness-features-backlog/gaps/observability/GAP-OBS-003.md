# GAP-OBS-003: Prompt Plan Observability

| Field | Value |
|-------|-------|
| Category | observability |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Expose the full prompt assembly state and orchestration plan for inspection, enabling debugging of prompt construction and plan execution.

## Current State
instructions:* commands are partial and phase-centric. No way to see the complete assembled prompt with all sections or the current orchestration plan state.

## Target State
Full prompt assembly visible via instructions:inspect. Orchestration plan (from harness:plan) visible in embedded SDK dashboard with step-by-step progress.

## Dependencies
- [GAP-PROMPT-004](../prompt-engineering/GAP-PROMPT-004.md) -- prompt inspection tooling

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 3 implementation. Integrate prompt inspection output into embedded SDK dashboard. Show plan state with progress indicators.
