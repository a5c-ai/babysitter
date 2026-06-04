# GAP-PROMPT-008: Coding Philosophy Prompt Section

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | High |
| Effort | S |
| Status | Missing |

## Description
Inject coding philosophy guardrails into task prompts for code-writing effects. When the orchestrator delegates code tasks to non-CC harnesses (Pi, Gemini, Codex), the delegated agent lacks CC's built-in coding philosophy rules that prevent over-engineering, speculative abstractions, and unnecessary refactoring.

## Current State
CC includes detailed coding philosophy in its system prompt ("Don't add features beyond what was asked", "Don't create helpers for one-time operations", "Three similar lines is better than a premature abstraction"). When babysitter delegates to CC, these rules apply. When delegating to Pi, Gemini, or Codex, no equivalent rules exist. Process prompts and `instructions:*` output do not include coding philosophy.

## Target State
A `codingPhilosophy` prompt section in `packages/sdk/src/prompts/` injected into task prompts for code-writing effects. Content adapted from CC's "Doing Tasks" section. Injected via the runtime stratum when task kind indicates code modification. Configurable per process definition (can override or extend).

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for section placement

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 2 (Coding Philosophy) has exact CC phrasing to adopt |

## Recommendation
Phase 2 implementation. Small effort -- extract CC's coding philosophy phrasing, adapt for babysitter context, add as a prompt section. High impact for non-CC harness quality.
