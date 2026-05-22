# GAP-PROMPT-006: Instructions Loaded Hook

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Fire a hook after prompt instructions are assembled but before they are sent to the harness, allowing plugins and processes to dynamically modify instructions at load time.

## Current State
Instructions are static per run. No hook fires during prompt assembly. Plugins cannot modify or extend the assembled prompt.

## Target State
An `on-instructions-loaded` hook fires after prompt composition with the assembled prompt as payload. Hook handlers can modify, extend, or annotate the prompt. This enables plugin-driven prompt customization.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for structured modification

## Key Files
| Component | Path |
|-----------|------|
| Hook dispatcher | `packages/sdk/src/hooks/dispatcher.ts` |
| Prompts module | `packages/sdk/src/prompts/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 1 (System Prompt Architecture) documents CC's layered prompt assembly with override/coordinator/agent/custom/default hierarchy |

## Recommendation
Phase 3 implementation. Add `on-instructions-loaded` to the hook types enum. Fire after prompt composition in the instructions generation pipeline.
