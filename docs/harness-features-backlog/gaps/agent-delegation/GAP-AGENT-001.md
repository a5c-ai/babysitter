# GAP-AGENT-001: Sub-Harness Invocation with Isolation

| Field | Value |
|-------|-------|
| Category | agent-delegation |
| Priority | High |
| Effort | XL |
| Status | Partial |

## Description
Invoke sub-harnesses with isolated context, model override, and independent run directories. Reframed from CC subagent concept to babysitter sub-harness invocation model where the orchestrator delegates work to isolated harness instances.

## Current State
invokeHarness() spawns harness CLIs. Pi adapter supports programmatic sessions via PiSessionHandle. However: no context isolation between delegated tasks, no model override (harness CLI decides model), no worktree management, no background execution with progress tracking.

## Target State
Sub-harness invocations create child runs with isolated context. Parent run tracks child runs. Model override per invocation. Child results aggregated into parent journal. Progress tracking for long-running sub-invocations.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability-based routing for sub-harness selection
- [GAP-SUBOBS-001](../subagent-observability/GAP-SUBOBS-001.md) -- streaming output from sub-harnesses

**Merged**: GAP-TOOLS-013 (Agent/Subagent Tool) is covered by this gap. The original tool gap described invoking sub-agents from within tasks -- this is the same concept as sub-harness invocation with isolation, reframed for babysitter's orchestration model.

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Pi session wrapper | `packages/sdk/src/harness/piWrapper.ts` |
| Harness adapters | `packages/sdk/src/harness/` |

## Recommendation
Phase 3-4 implementation. Phase 3: isolated child runs with context separation. Phase 4: background execution, progress tracking, and worktree integration.
