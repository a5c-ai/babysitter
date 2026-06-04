# GAP-SEC-004: Sandbox Toggle

| Field | Value |
|-------|-------|
| Category | security |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Runtime sandbox control for general harness execution, extending beyond the current Pi-specific secure sandbox to all harness adapters.

## Current State
piSecureSandbox provides Docker-based isolation for Pi bash execution. No general sandbox toggle for other harness adapters. No runtime control to enable/disable sandboxing.

## Target State
General sandbox capability across harness adapters. Runtime toggle to enable/disable sandboxing per run or per effect. Sandbox enforcement in governance policy.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for sandbox enforcement

## Key Files
| Component | Path |
|-----------|------|
| Pi secure sandbox | `packages/sdk/src/harness/piSecureSandbox.ts` |
| Harness adapters | `packages/sdk/src/harness/` |

## Recommendation
Phase 3 implementation. Generalize piSecureSandbox pattern. Add sandbox config to run metadata. Enforce via governance policy.
