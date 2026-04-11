# GAP-ECO-002: CC Marketplace Protocol Support

| Field | Value |
|-------|-------|
| Category | ecosystem |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Support CC's marketplace protocol for discovering, installing, and updating
plugins from CC marketplaces (including `claude-plugins-official`,
`claude-code-marketplace`, etc.).

## CC Marketplace Architecture

CC's marketplace system (`src/utils/plugins/marketplaceManager.ts`, `marketplaceHelpers.ts`):
- Git-based marketplace repositories (clone, pull, browse)
- Official marketplace names reserved for Anthropic (`ALLOWED_OFFICIAL_MARKETPLACE_NAMES`)
- Anti-impersonation rules (`BLOCKED_OFFICIAL_NAME_PATTERN`)
- Non-ASCII detection for homograph attack prevention
- Auto-update support per marketplace
- Plugin install counts tracking (`installCounts.ts`)
- Zip cache for faster installs (`zipCache.ts`, `zipCacheAdapters.ts`)
- Headless install support (`headlessPluginInstall.ts`)
- Plugin reconciliation (`reconciler.ts`) -- ensures installed plugins match desired state
- Plugin startup check (`pluginStartupCheck.ts`) -- validates on boot

## Current State
Babysitter has its own marketplace system (`plugins/a5c/marketplace/`) with
`marketplace.json` and plugin entries. The protocol is similar (git-based) but
NOT compatible with CC's marketplace format. Cannot install CC marketplace plugins.

## Target State
Babysitter can add CC marketplaces as sources and install CC plugins from them.
The `plugin:add-marketplace` command accepts CC marketplace URLs. Plugin resolution
follows CC's directory structure and manifest format.

## Dependencies
None. ECO-002 is foundational -- ECO-001 depends on it, not the reverse.

## Key Files
| Component | Path |
|-----------|------|
| Babysitter marketplace | `packages/sdk/src/plugins/marketplace.ts` |
| CC marketplace manager | `src/utils/plugins/marketplaceManager.ts` |
| CC marketplace helpers | `src/utils/plugins/marketplaceHelpers.ts` |
| CC schemas | `src/utils/plugins/schemas.ts` |

## Recommendation
Phase 2. Map CC marketplace directory structure to babysitter's resolver.
Add a `format: 'cc'` flag to marketplace entries so babysitter knows to use
CC-compatible loading.
