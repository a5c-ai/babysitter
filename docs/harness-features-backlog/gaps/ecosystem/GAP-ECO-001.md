# GAP-ECO-001: CC Plugin Compatibility Layer

| Field | Value |
|-------|-------|
| Category | ecosystem |
| Priority | Critical |
| Effort | XL |
| Status | Missing |

## Description
Run Claude Code plugins natively within babysitter's orchestration environment.
CC has a 43-file plugin system (`src/utils/plugins/`) with its own manifest format,
marketplace protocol, and component loading. CC plugins provide commands, agents,
skills, hooks, output-styles, MCP servers, and LSP servers. Babysitter needs to
load and execute CC plugins so that the orchestration platform benefits from the
CC plugin ecosystem.

**This is NOT about babysitter's existing plugin system** (`packages/sdk/src/plugins/`).
Babysitter already has harness-integration plugins (`plugins/babysitter/`,
`plugins/babysitter-codex/`, etc.) and a marketplace (`plugins/a5c/marketplace/`).
This gap is about a NEW compatibility layer that bridges CC's plugin format into
babysitter's runtime.

## CC Plugin Architecture (what we need to support)

CC's `LoadedPlugin` type provides:
```typescript
{
  name: string
  manifest: PluginManifest  // plugin.json with components
  path: string
  source: string            // marketplace identifier
  commandsPath?: string     // directory of /command files
  commandsPaths?: string[]  // additional command paths
  agentsPath?: string       // agent definitions
  agentsPaths?: string[]
  skillsPath?: string       // skill definitions  
  skillsPaths?: string[]
  outputStylesPath?: string // custom output renderers
  hooksConfig?: HooksSettings  // hook definitions
  mcpServers?: Record<string, McpServerConfig>  // MCP servers
  lspServers?: Record<string, LspServerConfig>  // LSP servers
}
```

CC plugin loading (`src/utils/plugins/`):
- `pluginLoader.ts` -- loads plugin from directory
- `pluginInstallationHelpers.ts` -- install/uninstall
- `loadPluginCommands.ts` -- load command components
- `loadPluginAgents.ts` -- load agent definitions
- `loadPluginHooks.ts` -- load hook configurations
- `loadPluginOutputStyles.ts` -- load output style renderers
- `mcpPluginIntegration.ts` -- MCP server integration
- `lspPluginIntegration.ts` -- LSP server integration
- `pluginVersioning.ts` -- version management
- `pluginPolicy.ts` -- policy/trust enforcement
- `pluginBlocklist.ts` -- block malicious plugins
- `pluginAutoupdate.ts` -- auto-update from marketplaces
- `validatePlugin.ts` -- manifest validation
- `schemas.ts` -- PluginManifest Zod schema

## Current State
Babysitter has its OWN plugin system (`packages/sdk/src/plugins/`) with:
- `PluginRegistryEntry`, `MarketplaceManifest` types
- `readPluginPackage`, `listMarketplacePlugins` functions
- Migration support (`parseMigrationFilename`, `resolveMigrationChain`)
- CLI: `plugin:install`, `plugin:list-installed`, `plugin:add-marketplace`

But this system manages babysitter-specific harness integrations (how babysitter
talks to each harness CLI). It does NOT load or execute CC plugin components
(commands, agents, skills, hooks, MCP/LSP servers).

## Target State
A CC plugin compatibility adapter that:
1. Reads CC `plugin.json` manifests
2. Loads CC plugin components into babysitter's runtime
3. Maps CC hooks to babysitter hook types where possible
4. Exposes CC plugin skills as available task kinds
5. Connects CC plugin MCP servers to babysitter's MCP infrastructure
6. Validates plugins using CC's schema and trust rules

This enables babysitter to use the CC plugin ecosystem (including marketplace
plugins like `context7`, `playwright`, `plugin-dev`) without requiring
separate plugin implementations.

## Dependencies
- [GAP-ECO-002](GAP-ECO-002.md) -- CC marketplace protocol support
- [GAP-ECO-003](GAP-ECO-003.md) -- plugin trust and provenance

## Key Files
| Component | Path |
|-----------|------|
| Babysitter plugins module | `packages/sdk/src/plugins/` |
| CC plugin loader | `src/utils/plugins/pluginLoader.ts` |
| CC plugin schema | `src/utils/plugins/schemas.ts` |
| CC plugin types | `src/types/plugin.ts` |
| CC plugin commands UI | `src/commands/plugin/` (17 files) |

## Recommendation
Phase 2-3. Start by implementing PluginManifest schema parsing compatible with
CC's format. Then implement component loaders one at a time: skills first (most
useful for orchestration), then hooks, then MCP servers. Commands and output-styles
are lower priority since they're host-harness-specific.
