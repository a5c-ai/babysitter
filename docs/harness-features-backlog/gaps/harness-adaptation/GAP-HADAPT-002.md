# GAP-HADAPT-002: Model Selection Per Task

| Field | Value |
|-------|-------|
| Category | harness-adaptation |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Allow process definitions to specify preferred model per task. Route to harness that supports the model, or override default.

## Current State
execution.model hint exists in TaskDef but not used for routing. Single model per run.

## Target State
Per-task model selection. Process definitions specify model preferences (e.g., fast model for exploration, powerful model for code generation). Routing engine selects harness supporting the requested model.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability routing for model-aware selection

## Key Files
| Component | Path |
|-----------|------|
| Task definitions | `packages/sdk/src/tasks/` |
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |

## Recommendation
Phase 2 implementation. Wire execution.model hint into routing decisions. Select harness that supports requested model.
