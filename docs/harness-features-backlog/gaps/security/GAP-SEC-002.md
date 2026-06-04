# GAP-SEC-002: Trust Classes for Plugins

| Field | Value |
|-------|-------|
| Category | security |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Classify plugins by trust level (verified, community, local, untrusted) and enforce trust-based capability restrictions. Plugins running at different trust levels get different permissions.

## Current State
Plugins have installation, versioning, and migration support but no trust classification. No sandbox isolation for plugin execution. Plugin hooks run with full harness permissions.

## Target State
TrustLevel field in plugin registry. Trust levels enforced in hook dispatch and skill execution. Security review command for auditing plugin capabilities.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for trust enforcement
- [GAP-ECO-002](../ecosystem/GAP-ECO-002.md) -- extension provenance for trust basis (optional enhancement, M6)

## Key Files
| Component | Path |
|-----------|------|
| Plugin types | `packages/sdk/src/plugins/types.ts` |
| Plugin registry | `packages/sdk/src/plugins/registry.ts` |
| Hook dispatcher | `packages/sdk/src/hooks/dispatcher.ts` |

## Recommendation
Phase 2 implementation. Add TrustLevel to PluginRegistryEntry. Enforce trust levels in hook dispatch. Add plugin:security-review command.
