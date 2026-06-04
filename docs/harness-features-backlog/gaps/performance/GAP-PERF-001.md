# GAP-PERF-001: Prompt Caching (Ephemeral)

| Field | Value |
|-------|-------|
| Category | performance |
| Priority | Critical |
| Effort | L |
| Status | Missing |

## Description
Implement prompt caching so that stable prompt segments are reused across orchestration iterations, avoiding redundant token processing on every harness invocation.

## Current State
Each harness invocation via `invokeHarness()` spawns a fresh CLI process with no mechanism to carry prompt cache state between invocations. Every iteration pays full prompt processing cost.

## Target State
Stable prompt strata are cached between iterations. Cache hit rate is measurable via `tokens:stats`. For a 20-iteration run with a 50K-token system prompt, redundant processing is eliminated.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata separation identifies cacheable segments

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Prompts module | `packages/sdk/src/prompts/` |
| Token stats CLI | `packages/sdk/src/cli/` |

## Recommendation
Phase 2 implementation. Options: direct API integration bypassing harness CLI (highest savings), session-persistent prompt prefix with harness session binding, or harness-side prompt prefix caching with TTL.
