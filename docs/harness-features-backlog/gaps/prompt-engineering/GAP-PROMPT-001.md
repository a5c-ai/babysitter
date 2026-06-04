# GAP-PROMPT-001: Prompt Strata Model

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | Critical |
| Effort | L |
| Status | Partial |

## Description
Separate prompt assembly into formal strata (stable rules, runtime facts, turn-local instructions) to enable cache optimization and deterministic prompt composition across all harness adapters.

## Current State
The prompts module (`packages/sdk/src/prompts/`) has `PromptContext` with per-harness context factories and section render functions. However, there is no formal separation between stable, runtime, and volatile content. The `session:iteration-message` command generates full prompts that mix all strata.

## Target State
Prompt assembly follows a strata model:
1. **Stable stratum**: System identity, core rules, tool definitions (rarely changes, highly cacheable)
2. **Runtime stratum**: Available capabilities, feature flags, workspace context (changes per session)
3. **Turn-local stratum**: Recent messages, current task, turn-specific instructions (changes every turn)

Each prompt section tagged with its stratum. Composition preserves stratum ordering. Strata boundaries exposed for cache optimization.

## Dependencies
- None (foundation gap)

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Instructions CLI | `packages/sdk/src/cli/` |
| Session management | `packages/sdk/src/session/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 1 (System Prompt Architecture) documents CC's priority hierarchy model |

## Recommendation
Phase 1 implementation. Define `PromptStratum` type in `packages/sdk/src/prompts/`. Tag each prompt section with `stable`, `runtime`, or `turnLocal`. Compose prompts stratum-by-stratum with clear boundaries. Add `--show-strata` flag to `instructions:*` commands for debugging.
