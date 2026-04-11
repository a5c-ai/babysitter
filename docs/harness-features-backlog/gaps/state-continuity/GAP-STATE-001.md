# GAP-STATE-001: Long-Term Memory Extraction

| Field | Value |
|-------|-------|
| Category | state-continuity |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Extract and persist key learnings, decisions, and patterns from completed runs into a long-term memory store that informs future orchestration sessions.

## Current State
No memory extraction. State is per-run journal only. harness:retrospect analyzes but does not persist extracted memories.

## Target State
Memory extraction from completed runs into ~/.a5c/memory/. Memories indexed by project, topic, and recency. Extracted memories injected into new run prompts as context.

## Dependencies
- [GAP-SESSION-002](../session-management/GAP-SESSION-002.md) -- session state persistence for memory scope

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| Session management | `packages/sdk/src/session/` |
| Prompts module | `packages/sdk/src/prompts/` |

## Recommendation
Phase 2 implementation. Extend harness:retrospect to extract and persist key learnings. Index by project and topic. Inject into new run prompts.
