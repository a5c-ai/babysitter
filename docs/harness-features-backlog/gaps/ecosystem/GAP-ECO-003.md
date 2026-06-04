# GAP-ECO-003: Plugin Trust, Provenance, and Blocklist

| Field | Value |
|-------|-------|
| Category | ecosystem |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Plugin trust chain from marketplace to installation with provenance tracking,
blocklist enforcement, and trust class assignment.

## CC Trust System

CC implements multi-layer trust (`src/utils/plugins/`):
- `pluginPolicy.ts` -- policy enforcement per plugin
- `pluginBlocklist.ts` -- block known-malicious plugins
- `pluginFlagging.ts` -- flag suspicious plugins
- `schemas.ts` -- official marketplace name reservation, anti-impersonation patterns
- `PluginTrustWarning.tsx` -- UI for trust warnings during install
- Trust classes based on source: `@builtin` (shipped with CLI), `@official-marketplace`,
  `@third-party`
- Non-ASCII name detection to prevent homograph attacks

## Current State
Babysitter's plugin system has no trust model. Any plugin can be installed
from any marketplace. No blocklist. No provenance tracking. No impersonation
detection.

## Target State
Trust classification per plugin. Blocklist checked at install and startup.
Official marketplace names reserved. Provenance (author, source org, verification
status) stored in plugin registry. Trust warnings surfaced during installation.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy layer

## Key Files
| Component | Path |
|-----------|------|
| CC plugin policy | `src/utils/plugins/pluginPolicy.ts` |
| CC blocklist | `src/utils/plugins/pluginBlocklist.ts` |
| CC trust UI | `src/commands/plugin/PluginTrustWarning.tsx` |

## Recommendation
Phase 2. Implement blocklist check first (highest security impact). Then add
trust classification based on marketplace source. Finally add provenance tracking.
