# GAP-SUBOBS-004: Subagent Health and Timeout Monitoring

| Field | Value |
|-------|-------|
| Category | subagent-observability |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Monitor health of running subagents: detect hangs, timeouts, excessive token usage. Alert and auto-recover.

## Current State
Basic timeout on invokeHarness(). No health monitoring or auto-recovery.

## Target State
Continuous health monitoring for running subagents. Hang detection (no output for configurable period). Token budget enforcement per subagent. Auto-recovery: retry, fallback to different harness, or abort with partial results.

## Dependencies
- [GAP-SUBOBS-001](../subagent-observability/GAP-SUBOBS-001.md) -- streaming output for health signals
- [GAP-SUBOBS-003](../subagent-observability/GAP-SUBOBS-003.md) -- token tracking for budget enforcement

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Config module | `packages/sdk/src/config/` |

## Recommendation
Phase 3 implementation. Add health monitor to invokeHarness(). Detect hangs via output silence. Enforce token budgets. Implement auto-recovery strategies.
