# Babysitter Plugins → Blueprints Rename

"Babysitter plugins" (managed by babysitter-sdk CLI, stored in marketplace) should be renamed to "blueprints" to distinguish them from agent plugins (the unified/generated hooks-adapter plugins installed into agents).

## Distinction

| Concept | Current Name | New Name | Examples |
|---------|-------------|----------|---------|
| Babysitter marketplace installables | "plugins" | **blueprints** | `plugins/a5c/marketplace/*.json`, `babysitter blueprints:install`, process libraries, skills |
| Agent harness plugins | "plugins" (keep) | **plugins** (keep) | hooks-adapter generated plugins, Claude Code extensions, `.claude/plugins/` |

## What Changes

### Marketplace Directory
```
plugins/a5c/marketplace/ → blueprints/a5c/marketplace/
plugins/a5c/babysitter/ → blueprints/a5c/babysitter/
```

### CLI Commands
| Current | Target |
|---------|--------|
| `babysitter blueprints:list` | `babysitter blueprints:list` |
| `babysitter blueprints:install` | `babysitter blueprints:install` |
| `babysitter blueprints:update` | `babysitter blueprints:update` |
| `babysitter blueprints:uninstall` | `babysitter blueprints:uninstall` |
| `babysitter blueprints:marketplace` | `babysitter blueprints:marketplace` |

### SDK Source
| Current Path | Target Path |
|-------------|------------|
| `packages/babysitter-sdk/src/plugins/` | `packages/babysitter-sdk/src/blueprints/` |
| `packages/babysitter-sdk/src/plugins/marketplace.ts` | `packages/babysitter-sdk/src/blueprints/marketplace.ts` |
| `packages/babysitter-sdk/src/plugins/install.ts` | `packages/babysitter-sdk/src/blueprints/install.ts` |
| `packages/babysitter-sdk/src/plugins/registry.ts` | `packages/babysitter-sdk/src/blueprints/registry.ts` |

### Configuration
| Current | Target |
|---------|--------|
| `~/.a5c/plugins/` | `~/.a5c/blueprints/` |
| `.a5c/plugins/` (project) | `.a5c/blueprints/` (project) |
| `BABYSITTER_PLUGIN_*` env vars | `BABYSITTER_BLUEPRINT_*` env vars |

### Documentation
- `docs/plugins.md` → split into `docs/blueprints.md` (babysitter blueprints) and keep `docs/plugins.md` (agent plugins)
- All references to "babysitter plugin" in docs → "blueprint"
- Process library references to "plugin" → "blueprint"

### Skills
- `/babysitter:plugins` skill → `/babysitter:blueprints`
- Skill descriptions mentioning "plugin marketplace" → "blueprint marketplace"

## What Does NOT Change

- Agent plugins (hooks-adapter/extensions-adapter generated) stay as "plugins"
- `CLAUDE_PLUGIN_ROOT`, `PI_PLUGIN_ROOT` env vars stay
- `.claude/plugins/` directory stays
- `packages/extensions-adapter/` (generates agent plugins) stays as "plugins"
- `install.md` in agent plugin packages stays
- `plugin.json` manifest for agent plugins stays

## Scope Estimate

| Area | Files | Effort |
|------|-------|--------|
| SDK source (plugins/ dir) | 15+ | Medium |
| CLI commands | 10+ | Medium |
| Marketplace directory | 50+ JSON files | Small (git mv) |
| Configuration paths | 5+ | Small |
| Documentation | 20+ md files | Medium |
| Skills/agents | 5+ | Small |
| Process library references | 30+ | Medium |
| **Total** | **~135** | |

## Backward Compatibility

- Keep old CLI commands as deprecated aliases for one version
- Read from both old and new config paths
- `babysitter blueprints:*` → prints deprecation warning, forwards to `babysitter blueprints:*`
