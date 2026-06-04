# GAP-STATE-002: Memory Consolidation

| Field | Value |
|-------|-------|
| Category | state-continuity |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Automatically consolidate memories across sessions, merging related learnings, pruning stale information, and maintaining a coherent knowledge base.

## Current State
No consolidation. harness:retrospect analyzes individual runs but does not merge findings across runs into consolidated knowledge.

## Target State
Periodic memory consolidation merges related learnings across runs. Stale memories pruned based on recency and relevance. Consolidated memories weighted by frequency and recency for prompt injection.

## Dependencies
- [GAP-STATE-001](../state-continuity/GAP-STATE-001.md) -- memory extraction as input

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| Logging module | `packages/sdk/src/logging/` |

## Recommendation
Phase 4 implementation. Schedule consolidation via harness:retrospect. Merge related memories. Prune by recency.
