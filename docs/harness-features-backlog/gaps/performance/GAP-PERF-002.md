# GAP-PERF-002: Session Compaction

| Field | Value |
|-------|-------|
| Category | performance |
| Priority | Critical |
| Effort | XL |
| Status | Partial |

## Description
Implement session-level compaction that summarizes and condenses orchestration history, preventing context window overflow during long runs.

## Current State
The compression module provides FNV-1a hash-based dedup and library file caching. This is token-level compression, not session-level compaction. The harness never summarizes or condenses conversation history.

## Target State
Multiple compaction strategies: tool-output summarization, resolved effect pruning, iteration digest. Auto-compact trigger based on token budget thresholds. PreCompact/PostCompact hooks for custom behavior.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- prompt strata model for identifying compactable sections

## Key Files
| Component | Path |
|-----------|------|
| Compression module | `packages/sdk/src/compression/` |
| Hook dispatcher | `packages/sdk/src/hooks/dispatcher.ts` |
| State cache | `packages/sdk/src/runtime/replay/stateCache.ts` |

## Recommendation
Phase 3 implementation. Auto-compact trigger at token budget threshold. At least 2 strategies: tool-output summarization and iteration digest. Integrate via on-iteration-end hook.
