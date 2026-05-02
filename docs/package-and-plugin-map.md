---
title: Package and Plugin Docs Map
description: Canonical docs coverage map for public packages, internal workspaces, and harness plugin surfaces in the Babysitter repo.
last_updated: 2026-04-27
---

# Package and Plugin Docs Map

This page is the canonical discovery index for package and plugin documentation in the Babysitter monorepo.

Use it to answer three questions quickly:

1. Is this surface public, public-but-advanced, or internal-only?
2. Where is the canonical documentation home for that surface right now?
3. Which surfaces still rely on a package README or this map instead of a dedicated docs-site page?

`docs/workspace-validation.md` remains the validation-contract ledger. It is **not** the primary docs discovery entrypoint anymore.

## Status labels

- **Public package**: supported public npm or app surface.
- **Public advanced/runtime package**: public and supported, but primarily for operator/runtime workflows rather than first-time users.
- **Public family package**: a published package that belongs to a larger package family whose overview docs also matter.
- **Public harness plugin**: a supported harness/plugin surface for a specific host.
- **Internal-only workspace**: active inside this monorepo, but not documented as a productized public offering.
- **Internal-only companion app**: repo-active support app surface with no separate public docs contract.

## Family entrypoints

| Surface | Status | Canonical docs home | Supporting entrypoints | Coverage note |
| --- | --- | --- | --- | --- |
| `packages/agent-mux` | Public family overview | [packages/agent-mux/README.md](../packages/agent-mux/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | Use this family README to enter the agent-mux workspace tree before dropping into package-specific READMEs. |
| `packages/hooks-mux` | Public family overview | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | [packages/hooks-mux/core/README.md](../packages/hooks-mux/core/README.md)<br />[packages/hooks-mux/cli/README.md](../packages/hooks-mux/cli/README.md) | Use this family README for the hooks-mux package set and adapter lineup. |
| `plugins` | Public plugin overview | [docs/plugins.md](./plugins.md) | [plugins/babysitter/README.md](../plugins/babysitter/README.md)<br />[plugins/babysitter-codex/README.md](../plugins/babysitter-codex/README.md) | The docs-site plugin landing page is the canonical discovery entrypoint for harness plugin packages and plugin-system concepts. |

## Public core and runtime packages

| Surface | Status | Canonical docs home | Supporting entrypoints | Coverage note |
| --- | --- | --- | --- | --- |
| `packages/agent-plugins-mux` | Public package | [packages/agent-plugins-mux/README.md](../packages/agent-plugins-mux/README.md) | — | README is the canonical package-level contract. |
| `packages/agent-core` | Public advanced/runtime package | [packages/agent-core/README.md](../packages/agent-core/README.md) | [docs/release-pipeline.md](./release-pipeline.md) | Public runtime dependency package for advanced orchestration surfaces; README is the canonical package contract. |
| `packages/babysitter` | Public package | [packages/babysitter/README.md](../packages/babysitter/README.md) | — | README is the canonical package-level contract. |
| `packages/babysitter-agent` | Public advanced/runtime package | [packages/babysitter-agent/README.md](../packages/babysitter-agent/README.md) | [README.md](../README.md) | Public npm package, but it is an advanced/operator-facing runtime CLI rather than the default entrypoint for new users. |
| `packages/agent-catalog` | Public advanced/runtime package | [packages/agent-catalog/README.md](../packages/agent-catalog/README.md) | [docs/release-pipeline.md](./release-pipeline.md) | Public npm package for shared ontology/discovery/evidence assets used by other published runtimes; README is the canonical package contract. |
| `packages/breakpoints-mux` | Public package | [packages/breakpoints-mux/README.md](../packages/breakpoints-mux/README.md) | — | README is the canonical package-level contract. |
| `packages/cloud` | Public package | [packages/cloud/README.md](../packages/cloud/README.md) | — | README is the canonical public docs home today; the validation matrix does not currently expose a separate central docs entrypoint for this package. |
| `packages/sdk` | Public package | [packages/sdk/README.md](../packages/sdk/README.md) | — | README is the canonical package-level contract. |

## Public product and operator apps

| Surface | Status | Canonical docs home | Supporting entrypoints | Coverage note |
| --- | --- | --- | --- | --- |
| `packages/observer-dashboard` | Public package | [packages/observer-dashboard/README.md](../packages/observer-dashboard/README.md) | — | README is the canonical package-level contract. |

## Public package families

| Surface | Status | Canonical docs home | Supporting entrypoints | Coverage note |
| --- | --- | --- | --- | --- |
| `packages/agent-mux/adapters` | Public family package | [packages/agent-mux/adapters/README.md](../packages/agent-mux/adapters/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/cli` | Public family package | [packages/agent-mux/cli/README.md](../packages/agent-mux/cli/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/core` | Public family package | [packages/agent-mux/core/README.md](../packages/agent-mux/core/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/gateway` | Public family package | [packages/agent-mux/gateway/README.md](../packages/agent-mux/gateway/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/harness-mock` | Public family package | [packages/agent-mux/harness-mock/README.md](../packages/agent-mux/harness-mock/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/observability` | Public family package | [packages/agent-mux/observability/README.md](../packages/agent-mux/observability/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/sdk` | Public family package | [packages/agent-mux/sdk/README.md](../packages/agent-mux/sdk/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/tui` | Public family package | [packages/agent-mux/tui/README.md](../packages/agent-mux/tui/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/ui` | Public family package | [packages/agent-mux/ui/README.md](../packages/agent-mux/ui/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/agent-mux/webui` | Public family package | [packages/agent-mux/webui/README.md](../packages/agent-mux/webui/README.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-claude` | Public family package | [packages/hooks-mux/adapter-claude/README.md](../packages/hooks-mux/adapter-claude/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-codex` | Public family package | [packages/hooks-mux/adapter-codex/README.md](../packages/hooks-mux/adapter-codex/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-copilot` | Public family package | [packages/hooks-mux/adapter-copilot/README.md](../packages/hooks-mux/adapter-copilot/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-cursor` | Public family package | [packages/hooks-mux/adapter-cursor/README.md](../packages/hooks-mux/adapter-cursor/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-gemini` | Public family package | [packages/hooks-mux/adapter-gemini/README.md](../packages/hooks-mux/adapter-gemini/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-oh-my-pi` | Public family package | [packages/hooks-mux/adapter-oh-my-pi/README.md](../packages/hooks-mux/adapter-oh-my-pi/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-openclaw` | Public family package | [packages/hooks-mux/adapter-openclaw/README.md](../packages/hooks-mux/adapter-openclaw/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-opencode` | Public family package | [packages/hooks-mux/adapter-opencode/README.md](../packages/hooks-mux/adapter-opencode/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/adapter-pi` | Public family package | [packages/hooks-mux/adapter-pi/README.md](../packages/hooks-mux/adapter-pi/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/cli` | Public family package | [packages/hooks-mux/cli/README.md](../packages/hooks-mux/cli/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |
| `packages/hooks-mux/core` | Public family package | [packages/hooks-mux/core/README.md](../packages/hooks-mux/core/README.md) | [packages/hooks-mux/README.md](../packages/hooks-mux/README.md) | README is the canonical package-level contract. |

## Public harness plugins

| Surface | Status | Canonical docs home | Supporting entrypoints | Coverage note |
| --- | --- | --- | --- | --- |
| `plugins/babysitter` | Public harness plugin | [plugins/babysitter/README.md](../plugins/babysitter/README.md) | [docs/plugins.md](./plugins.md) | Canonical Claude Code plugin surface. This repo plugin is discoverable from the docs-site plugin landing page and the root README install guide. |
| `plugins/babysitter-codex` | Public harness plugin | [plugins/babysitter-codex/README.md](../plugins/babysitter-codex/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-cursor` | Public harness plugin | [plugins/babysitter-cursor/README.md](../plugins/babysitter-cursor/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-gemini` | Public harness plugin | [plugins/babysitter-gemini/README.md](../plugins/babysitter-gemini/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-github` | Public harness plugin | [plugins/babysitter-github/README.md](../plugins/babysitter-github/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-omp` | Public harness plugin | [plugins/babysitter-omp/README.md](../plugins/babysitter-omp/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-openclaw` | Public harness plugin | [plugins/babysitter-openclaw/README.md](../plugins/babysitter-openclaw/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-opencode` | Public harness plugin | [plugins/babysitter-opencode/README.md](../plugins/babysitter-opencode/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-paperclip` | Public harness plugin | [plugins/babysitter-paperclip/README.md](../plugins/babysitter-paperclip/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |
| `plugins/babysitter-pi` | Public harness plugin | [plugins/babysitter-pi/README.md](../plugins/babysitter-pi/README.md) | [docs/plugins.md](./plugins.md) | README is the canonical package-level contract. |

## Internal-only workspaces and companion apps

| Surface | Status | Canonical docs home | Supporting entrypoints | Coverage note |
| --- | --- | --- | --- | --- |
| `packages/agent-mux/mobile-android-app` | Internal-only companion app | [docs/package-and-plugin-map.md](./package-and-plugin-map.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | No package README today. This map is the explicit internal-only note until the surface is promoted. |
| `packages/agent-mux/mobile-ios-app` | Internal-only companion app | [docs/package-and-plugin-map.md](./package-and-plugin-map.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | No package README today. This map is the explicit internal-only note until the surface is promoted. |
| `packages/agent-mux/tv-androidtv-app` | Internal-only companion app | [docs/package-and-plugin-map.md](./package-and-plugin-map.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | No package README today. This map is the explicit internal-only note until the surface is promoted. |
| `packages/agent-mux/tv-appletv-app` | Internal-only companion app | [docs/package-and-plugin-map.md](./package-and-plugin-map.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | No package README today. This map is the explicit internal-only note until the surface is promoted. |
| `packages/agent-mux/watch-watchos-app` | Internal-only companion app | [docs/package-and-plugin-map.md](./package-and-plugin-map.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | No package README today. This map is the explicit internal-only note until the surface is promoted. |
| `packages/agent-mux/watch-wearos-app` | Internal-only companion app | [docs/package-and-plugin-map.md](./package-and-plugin-map.md) | [docs/agent-mux/README.md](./agent-mux/README.md) | No package README today. This map is the explicit internal-only note until the surface is promoted. |
| `packages/babysitter-tui-plugins` | Internal-only workspace | [docs/package-and-plugin-map.md](./package-and-plugin-map.md) | — | Internal-only support package for the TUI surface. This map is the explicit documentation home until the workspace gets a README. |
| `packages/catalog` | Internal-only workspace | [packages/catalog/README.md](../packages/catalog/README.md) | — | Internal-only metadata/catalog surface. Keep discovery honest and routed through internal notes rather than productized public docs. |
| `packages/transport-mux` | Internal-only workspace | [packages/transport-mux/README.md](../packages/transport-mux/README.md) | [docs/workspace-validation.md](./workspace-validation.md) | Treat as an internal placeholder seam even though release/staging automation still validates its migration and packaging edges. |

## Coverage rules for future changes

- If a new active workspace or plugin is added, update this map in the same change.
- If a public surface still relies only on a package README, note that explicitly here until a docs-site page exists.
- If a surface is internal-only, say so plainly here or in the package README instead of implying external product support.
- If a package or plugin is promoted from internal-only to public, update the package metadata, README status block, and this map together.
