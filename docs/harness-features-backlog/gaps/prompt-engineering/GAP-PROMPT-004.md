# GAP-PROMPT-004: Prompt Inspection Tooling

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Provide tooling to inspect the fully assembled prompt sent to harnesses, including strata boundaries, token counts per section, and capability projections.

## Current State
The `instructions:*` commands are partial and phase-centric. No way to see the full assembled prompt with all sections, token breakdown, or strata boundaries.

## Target State
An `instructions:inspect` command shows the complete prompt assembly with strata labels, token counts per section, and cache-stability annotations. Useful for debugging prompt regressions and optimizing token usage.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for meaningful inspection

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Instructions CLI | `packages/sdk/src/cli/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Full document catalogs the exact prompt sections that inspection tooling should surface |

## Recommendation
Phase 3 implementation. Add `instructions:inspect` CLI command that renders the full prompt with metadata annotations.
