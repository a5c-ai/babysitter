# GAP-ECO-004: Plugin Auto-Update and Versioning

| Field | Value |
|-------|-------|
| Category | ecosystem |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Automatic plugin updates from marketplaces with version pinning, rollback, and
compatibility checking.

## CC Implementation
- `pluginAutoupdate.ts` -- auto-update logic per marketplace
- `pluginVersioning.ts` -- version comparison and pinning
- `pluginStartupCheck.ts` -- validate on boot, update if needed
- `reconciler.ts` -- reconcile installed state with desired state
- `cacheUtils.ts` -- cache management for update checks
- Official marketplaces auto-update by default; third-party opt-in

## Current State
Babysitter has `plugin:update` command but no automatic updates. No version
pinning beyond what's in the registry. No startup reconciliation.

## Target State
Configurable auto-update per marketplace. Version pinning via SHA or semver range.
Startup reconciliation to detect drift. Rollback on failed updates. Update
notifications in embedded SDK dashboard.

## Dependencies
- [GAP-ECO-002](GAP-ECO-002.md) -- marketplace protocol

## Key Files
| Component | Path |
|-----------|------|
| CC auto-update | `src/utils/plugins/pluginAutoupdate.ts` |
| CC versioning | `src/utils/plugins/pluginVersioning.ts` |
| CC reconciler | `src/utils/plugins/reconciler.ts` |

## Recommendation
Phase 4 (M6). Lower priority -- manual updates work for now.
