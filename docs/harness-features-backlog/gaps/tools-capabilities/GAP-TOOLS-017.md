# GAP-TOOLS-017: Git Worktree Isolation for Parallel Effect Execution

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Enable parallel effect execution with git worktree isolation so that concurrent code-modifying tasks do not conflict. When the orchestrator dispatches multiple code tasks in parallel (via `ctx.parallel.all()`), each task should operate in an isolated worktree to prevent merge conflicts and file contention.

## Current State
Parallel effects (`ctx.parallel.all()`, `ctx.parallel.map()`) execute concurrently but share the same working directory. Code-modifying tasks that run in parallel risk file conflicts, dirty working trees, and non-deterministic results. No worktree management exists in the SDK.

## Target State
A worktree manager that: creates isolated git worktrees for parallel code tasks, tracks worktree lifecycle tied to effect IDs, merges worktree results back to the main working tree on effect resolution, cleans up worktrees on task completion or failure. Integrated with the parallel execution model and harness invocation.

## Dependencies
- [GAP-PAR-001](../parallelization/GAP-PAR-001.md) -- concurrent effect execution
- [GAP-AGENT-001](../agent-delegation/GAP-AGENT-001.md) -- sub-harness isolation for worktree-bound invocations

## Key Files
| Component | Path |
|-----------|------|
| Parallelization | `packages/sdk/src/runtime/` |
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Storage | `packages/sdk/src/storage/` |
| Task batching | `packages/sdk/src/tasks/batching.ts` |

## Recommendation
Phase 3 implementation. Build a `WorktreeManager` module that creates/tracks/merges worktrees. Integrate with `buildParallelBatch` to auto-provision worktrees for code tasks. Add worktree cleanup to effect resolution lifecycle.
