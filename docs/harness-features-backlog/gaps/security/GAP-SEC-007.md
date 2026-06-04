# GAP-SEC-007: Privacy Settings

| Field | Value |
|-------|-------|
| Category | security |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Configurable privacy and data handling settings controlling what information is logged, exported, and shared during orchestration.

## Current State
BABYSITTER_ALLOW_SECRET_LOGS is the only privacy control. No configurable data handling policies for logging sensitivity, export filtering, or PII detection.

## Target State
Privacy configuration with controls for: log sensitivity levels, PII filtering in exports, data retention policies, sensitive field redaction in embedded SDK dashboard.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for privacy enforcement

## Key Files
| Component | Path |
|-----------|------|
| Logging module | `packages/sdk/src/logging/` |
| Config module | `packages/sdk/src/config/` |

## Recommendation
Phase 3 implementation. Define privacy configuration schema. Implement log filtering based on sensitivity levels. Add PII detection for export filtering.
