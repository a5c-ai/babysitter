# GAP-SEC-001: Governance Policy Layer

| Field | Value |
|-------|-------|
| Category | security |
| Priority | Critical |
| Effort | L |
| Status | Missing |

## Description
Centralized policy engine for evaluating security rules at effect dispatch and task execution. Unified policy model replacing fragmented policy across breakpoint rules, env vars, and advisory hints.

## Current State
Security policy fragmented: breakpoint rules in ~/.a5c/breakpoint-approvals/rules.json, advisory execution.permissions in task definitions, env var limits (BABYSITTER_MAX_ITERATIONS, BABYSITTER_HOOK_TIMEOUT). No unified evaluation point.

## Target State
PolicyEngine evaluates declarative rules at effect dispatch and task execution. Policy types: rate-limit, permission, resource-limit, trust-level. Policy decisions persisted for audit trail. Existing breakpoint rules integrated as policy source.

## Dependencies
- None (foundation gap)

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint types | `packages/sdk/src/breakpoints/types.ts` |
| Breakpoint evaluator | `packages/sdk/src/breakpoints/evaluator.ts` |
| Config module | `packages/sdk/src/config/` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |

## Recommendation
Phase 1 implementation. Create packages/sdk/src/governance/ module. Define PolicyRule type with evaluation logic. Evaluate at effect dispatch in processContext.ts. Log decisions to structured JSONL.
