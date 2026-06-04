# GAP-PERF-005: Cache-Aware Prompt Assembly

| Field | Value |
|-------|-------|
| Category | performance |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Structure prompt assembly so stable segments come first and volatile segments come last, maximizing cache prefix reuse across iterations.

## Current State
The prompts module has PromptContext and per-harness context factories, but prompt sections are assembled without considering cache hit optimization. Phase-specific prompts change between iterations.

## Target State
Prompt sections tagged with volatility levels and sorted by stability. Stable segments (system identity, tool definitions) precede runtime segments (workspace context) which precede turn-local segments (current task). Cache-break detection identifies which stratum changed.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for volatility tagging
- [GAP-PERF-001](../performance/GAP-PERF-001.md) -- caching infrastructure to benefit from

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Instructions CLI | `packages/sdk/src/cli/` |

## Recommendation
Phase 2 implementation. Tag prompt sections with volatility levels and sort by stability during composition.
