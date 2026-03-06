# Babysitter SDK Plugins Developer Guide

## Plugin Package Directory Layout

A plugin package is a directory containing instruction files and optional process definitions:

```
my-plugin/
  plugin.json          # Plugin manifest (name, version, description)
  package.json         # Optional npm metadata (name field used as plugin ID)
  install.md           # Markdown instructions for installation
  uninstall.md         # Markdown instructions for removal
  configure.md         # Markdown instructions for configuration
  install-process.js   # Optional automated install process
  uninstall-process.js # Optional automated uninstall process
  configure-process.js # Optional automated configure process
  migrations/          # Version migration files
    1.0.0_to_1.1.0.md
    1.1.0_to_2.0.0.js
  process/             # Process definition files (collected recursively)
    main.js
    helpers/
      utils.js
```

## Migration Filename Format

Migration files live in the `migrations/` subdirectory and must follow this pattern:

```
<fromVersion>_to_<toVersion>.<ext>
```

- **Versions** may contain alphanumerics, dots, dashes, and underscores (e.g. `1.0.0`, `2.0.0-beta`)
- **Extensions**: `.md` for markdown instructions, `.js` for executable process files
- Examples: `1.0.0_to_1.1.0.md`, `2.0.0-beta_to_2.0.0.js`

The SDK uses BFS over the migration graph to find the shortest upgrade path between any two versions.

## Registry Structure

The plugin registry (`plugin-registry.json`) tracks installed plugins. Two scopes are supported:

| Scope | Location | Use Case |
|-------|----------|----------|
| `global` | `~/.a5c/plugin-registry.json` | User-wide plugins |
| `project` | `<projectDir>/.a5c/plugin-registry.json` | Project-specific plugins |

Registry schema (`2026.01.plugin-registry-v1`):

```json
{
  "schemaVersion": "2026.01.plugin-registry-v1",
  "updatedAt": "2026-01-15T10:00:00.000Z",
  "plugins": {
    "my-plugin@org": {
      "name": "my-plugin@org",
      "version": "1.2.0",
      "marketplace": "main-marketplace",
      "scope": "global",
      "installedAt": "2026-01-10T08:00:00.000Z",
      "updatedAt": "2026-01-15T10:00:00.000Z",
      "packagePath": "/path/to/package",
      "metadata": {}
    }
  }
}
```

Writes use atomic file operations (temp + rename) for crash safety.

## Marketplace Format

A marketplace is a git repository containing a `marketplace.json` manifest and plugin packages:

```
marketplace-repo/
  marketplace.json      # Manifest listing all plugins
  plugins/
    plugin-a/           # Plugin package directory
    plugin-b/
```

The `marketplace.json` manifest:

```json
{
  "name": "My Marketplace",
  "description": "Collection of babysitter plugins",
  "url": "https://github.com/org/marketplace",
  "owner": "org",
  "plugins": {
    "plugin-a": {
      "name": "plugin-a",
      "description": "Does something useful",
      "latestVersion": "1.2.0",
      "versions": ["1.2.0", "1.1.0", "1.0.0"],
      "packagePath": "plugins/plugin-a",
      "tags": ["utility"],
      "author": "author-name"
    }
  }
}
```

Marketplaces are cloned with `--depth 1` and stored under:
- **Global**: `~/.a5c/marketplaces/<name>/`
- **Project**: `<projectDir>/.a5c/marketplaces/<name>/`

The marketplace name is derived from the git URL's last path segment (stripping `.git`).

## CLI Commands Quick Reference

All commands accept `--json` for machine-readable output and `--scope global|project`.

### Marketplace Commands

```bash
# Clone a marketplace repository
babysitter plugin:add-marketplace --marketplace-url <url> --scope global

# Pull latest changes for a marketplace
babysitter plugin:update-marketplace --marketplace-name <name> --scope global

# List plugins available in a marketplace
babysitter plugin:list-plugins --marketplace-name <name> --scope global
```

### Plugin Lifecycle Commands

```bash
# Install a plugin (fetches instructions and optional process file)
babysitter plugin:install --plugin-name <name> --marketplace-name <mp> --scope global

# Uninstall a plugin (fetches uninstall instructions)
babysitter plugin:uninstall --plugin-name <name> --scope global

# Update a plugin (resolves migration chain between versions)
babysitter plugin:update --plugin-name <name> --marketplace-name <mp> --scope global

# Show configure instructions for an installed plugin
babysitter plugin:configure --plugin-name <name> --marketplace-name <mp> --scope global
```

### Registry Commands

```bash
# List all installed plugins
babysitter plugin:list-installed --scope global

# Register or update a plugin entry in the registry
babysitter plugin:update-registry --plugin-name <name> --plugin-version <ver> \
  --marketplace-name <mp> --scope global

# Remove a plugin entry from the registry
babysitter plugin:remove-from-registry --plugin-name <name> --scope global
```

## Module Overview

| Module | Responsibility |
|--------|---------------|
| `types.ts` | Interfaces and constants (registry, manifest, migrations) |
| `paths.ts` | Scope-aware filesystem path resolution |
| `registry.ts` | Registry CRUD with atomic writes |
| `marketplace.ts` | Git clone/pull, manifest reading, plugin listing |
| `packageReader.ts` | Read instruction files, collect process files |
| `migrations.ts` | Parse migration filenames, BFS path resolution |
| `index.ts` | Public API re-exports |
