# GAP-STATE-003: Session State Persistence

| Field | Value |
|-------|-------|
| Category | state-continuity |
| Priority | High |
| Effort | L |
| Status | Partial |

## Description
Rich session state persistence across runs and resumes, preserving decisions, context, preferences, and accumulated knowledge. Reframed from CC SessionMemory to babysitter session-level state management.

## Current State
Session YAML-frontmatter state preserves run ID, iteration count, and timestamps. Shallow preservation -- deep context like decisions, preferences, and accumulated findings is lost.

## Target State
Session state includes: key decisions made, user preferences for this session, accumulated findings and context, file modification history, breakpoint approval patterns. State persists across runs within a session.

## Dependencies
- [GAP-SESSION-001](../session-management/GAP-SESSION-001.md) -- session-to-run relationship

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| State cache | `packages/sdk/src/runtime/replay/stateCache.ts` |

## Recommendation
Phase 2 implementation. Extend session state schema with rich fields. Populate from journal analysis during run completion. Inject into resume prompts.
