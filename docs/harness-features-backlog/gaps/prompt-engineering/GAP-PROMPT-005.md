# GAP-PROMPT-005: Continuity Overlays for Resume

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Enrich resume prompts with deep context from the run journal: resolved effect summaries, pending effect descriptions, key state transitions, and modified file lists. Enable smooth orchestration continuity across sessions.

## Current State
`harness:resume-run` uses `session:resume` which restores run ID association, iteration count, and timestamps. The resume prompt from `session:iteration-message` does not include deep context like accomplished tasks, pending effect summaries, or key decisions.

## Target State
Resume prompts include:
- Resolved effect summaries (from journal)
- Pending effect descriptions with context
- Key state transitions and decisions
- Modified file list (from task artifacts)
- Health score and progress indicators

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for overlay placement
- [GAP-STATE-008](../state-continuity/GAP-STATE-008.md) -- health score for resume context

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| Prompts module | `packages/sdk/src/prompts/` |
| Journal storage | `packages/sdk/src/storage/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 8 (Compaction Protocol) documents CC's context preservation patterns for resume |

## Recommendation
Phase 2 implementation. Enrich `session:iteration-message` with journal-derived context. Extract resolved effect summaries and pending task descriptions from the state cache.
