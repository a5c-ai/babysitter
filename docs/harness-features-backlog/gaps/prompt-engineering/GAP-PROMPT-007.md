# GAP-PROMPT-007: Context Compression Families

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | Medium |
| Effort | L |
| Status | Partial |

## Description
Group related context into compression families so that compaction can preserve semantic coherence. Instead of token-density compression, group related effects, file contexts, and iteration summaries for intelligent compression.

## Current State
The compression module uses FNV-1a hash-based dedup and library file caching. Compression is token-density oriented with no semantic grouping. Related context fragments may be compressed independently, losing coherence.

## Target State
Context grouped into families: per-effect context, per-file context, per-iteration summary, cross-cutting concerns. Compression operates on families, preserving internal coherence while compacting across families.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for family placement

## Key Files
| Component | Path |
|-----------|------|
| Compression module | `packages/sdk/src/compression/` |
| Prompts module | `packages/sdk/src/prompts/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 8 (Compaction Protocol) documents CC's semantic compression with mandatory sections and analysis/summary structure |

## Recommendation
Phase 4 implementation. Define compression families as metadata on prompt sections. Modify the density-filter engine to respect family boundaries.
