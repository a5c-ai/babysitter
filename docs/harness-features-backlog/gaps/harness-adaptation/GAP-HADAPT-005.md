# GAP-HADAPT-005: Harness Health Monitoring and Circuit Breaker

| Field | Value |
|-------|-------|
| Category | harness-adaptation |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Monitor harness availability and error rates. Circuit-breaker pattern to avoid routing to unhealthy harnesses.

## Current State
discoverHarnesses() checks CLI availability at startup. No runtime health monitoring.

## Target State
Continuous harness health monitoring during runs. Error rate tracking per harness. Circuit-breaker pattern: mark harness unhealthy after N consecutive failures, retry after cooldown period.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- routing foundation

## Key Files
| Component | Path |
|-----------|------|
| Harness discovery | `packages/sdk/src/harness/discovery.ts` |
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |

## Recommendation
Phase 3 implementation. Add health tracking to harness adapters. Implement circuit-breaker pattern. Integrate with routing engine.
