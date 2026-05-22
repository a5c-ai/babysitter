# GAP-PERF-008: Structured Continuity State

| Field | Value |
|-------|-------|
| Category | performance |
| Priority | High |
| Effort | L |
| Status | Partial |

## Description
Preserve rich structured state across session compactions and run resumes, maintaining orchestration continuity without requiring full context replay.

## Current State
State cache is a derived replay cache. Session resume preserves shallow state (run ID, iteration count, timestamps). Deep context (decisions made, files modified, key findings) is lost on compaction.

## Target State
Structured continuity state persists across compactions: key decisions, modified files, progress milestones, accumulated findings. State survives compaction and is injected into resume prompts.

## Dependencies
- [GAP-PROMPT-005](../prompt-engineering/GAP-PROMPT-005.md) -- continuity overlays for resume
- [GAP-STATE-003](../state-continuity/GAP-STATE-003.md) -- session memory persistence

## Key Files
| Component | Path |
|-----------|------|
| State cache | `packages/sdk/src/runtime/replay/stateCache.ts` |
| Session management | `packages/sdk/src/session/` |
| Run directory | `.a5c/runs/<runId>/state/` |

## Recommendation
Phase 2 implementation. Define structured continuity fields in the state cache. Populate from journal analysis during compaction. Inject into resume prompts.
