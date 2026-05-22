# GAP-OBS-008: Agent Progress Summarization

| Field | Value |
|-------|-------|
| Category | observability |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Generate automated progress summaries per iteration and per run, synthesizing what was accomplished, what is pending, and what needs attention.

## Current State
No progress summarization. harness:retrospect analyzes runs post-hoc but does not generate live progress summaries during orchestration.

## Target State
Per-iteration progress summary generated automatically. Run-level progress summary available at any point. Summaries include: tasks completed, effects resolved, files modified, key decisions, outstanding issues.

## Dependencies
- [GAP-OBS-001](../observability/GAP-OBS-001.md) -- health snapshot for progress context

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| State cache | `packages/sdk/src/runtime/replay/stateCache.ts` |

## Recommendation
Phase 3 implementation. Generate summaries from journal analysis at each iteration end. Store as run artifacts. Surface in embedded SDK dashboard.
