---
description: manage babysitter plugins. use this command to see the list of installed babysitter plugins, their status, and manage them (install, update, uninstall, list from marketplace, add marketplace, configure plugin, etc).
argument-hint: Specific instructions for the run.
---

This command installs and manages plugins for babysitter. A plugin is a version-managed package of contextual instructions (for install, uninstall, configure, and update/migrate between versions), not a conventional software plugin.

Plugins can be installed at two scopes:
- **global** (`--scope global`): stored under `~/.a5c/`, available for all projects
- **project** (`--scope project`): stored under `<projectDir>/.a5c/`, project-specific

## Marketplace Management

Marketplaces are git repositories containing a `marketplace.json` manifest and plugin package directories. The SDK clones them locally with `--depth 1`.

**Storage locations:**
- Global: `~/.a5c/marketplaces/<name>/`
- Project: `<projectDir>/.a5c/marketplaces/<name>/`

The marketplace name is derived from the git URL's last path segment (stripping `.git` suffix and trailing slashes).

### Adding a marketplace

```bash
babysitter plugin:add-marketplace --marketplace-url <url> --scope global|project [--json]
```

Clones the marketplace repository to the local marketplaces directory.

### Updating a marketplace

```bash
babysitter plugin:update-marketplace --marketplace-name <name> --scope global|project [--json]
```

Runs `git pull` on the local marketplace clone to fetch latest changes.

### Listing plugins in a marketplace

```bash
babysitter plugin:list-plugins --marketplace-name <name> --scope global|project [--json]
```

Reads the `marketplace.json` manifest and returns all available plugins sorted alphabetically by name. Each entry includes: name, description, latestVersion, versions array, packagePath, tags, and author.

## Plugin Installation

### Flow

1. Update the marketplace: `babysitter plugin:update-marketplace --marketplace-name <name> --scope global|project`
2. Check current state: `babysitter plugin:list-installed --scope global|project` to see installed plugins and versions
3. Install the plugin:

```bash
babysitter plugin:install --plugin-name <name> --marketplace-name <mp> --scope global|project [--json]
```

This command resolves the plugin package path from the marketplace manifest, reads `install.md` from the plugin package directory, and returns the installation instructions. If an `install-process.js` file exists, the instructions may reference it as an automated install process.

4. The agent performs the installation steps as defined in `install.md`
5. The agent updates the registry:

```bash
babysitter plugin:update-registry --plugin-name <name> --plugin-version <ver> --marketplace-name <mp> --scope global|project [--json]
```

## Plugin Update (with migrations)

```bash
babysitter plugin:update --plugin-name <name> --marketplace-name <mp> --scope global|project [--json]
```

This command:
1. Reads the currently installed version from the registry
2. Resolves the latest version from the marketplace manifest
3. Looks in the plugin package's `migrations/` directory for migration files
4. Uses BFS over the migration graph to find the shortest path from the installed version to the target version
5. Returns the ordered migration instructions (content of each migration file in sequence)

**Migration filename format:** `<fromVersion>_to_<toVersion>.<ext>` where:
- Versions may contain alphanumerics, dots, dashes (e.g. `1.0.0`, `2.0.0-beta`)
- Extensions: `.md` for markdown instructions, `.js` for executable process files
- Examples: `1.0.0_to_1.1.0.md`, `2.0.0-beta_to_2.0.0.js`

After performing the migration steps, update the registry:

```bash
babysitter plugin:update-registry --plugin-name <name> --plugin-version <new-ver> --marketplace-name <mp> --scope global|project [--json]
```

## Plugin Uninstallation

```bash
babysitter plugin:uninstall --plugin-name <name> --marketplace-name <mp> --scope global|project [--json]
```

Reads `uninstall.md` from the plugin package directory and returns the uninstall instructions. After performing the uninstall steps, remove from registry:

```bash
babysitter plugin:remove-from-registry --plugin-name <name> --scope global|project [--json]
```

## Plugin Configuration

```bash
babysitter plugin:configure --plugin-name <name> --marketplace-name <mp> --scope global|project [--json]
```

Reads `configure.md` from the plugin package directory and returns configuration instructions.

## Registry Management

The plugin registry (`plugin-registry.json`) tracks installed plugins with schema version `2026.01.plugin-registry-v1`. Writes use atomic file operations (temp + rename) for crash safety.

**Storage locations:**
- Global: `~/.a5c/plugin-registry.json`
- Project: `<projectDir>/.a5c/plugin-registry.json`

### List installed plugins

```bash
babysitter plugin:list-installed --scope global|project [--json]
```

Returns all installed plugins sorted alphabetically. In `--json` mode, returns an array of registry entries. In human mode, displays a formatted table with name, version, marketplace, and timestamps.

### Remove from registry

```bash
babysitter plugin:remove-from-registry --plugin-name <name> --scope global|project [--json]
```

Removes a plugin entry from the registry. Returns error if the plugin is not present.

## Plugin Package Structure

```
my-plugin/
  package.json         # Optional (name field used as plugin ID, falls back to directory name)
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
```

## All CLI Commands Summary

All commands accept `--json` for machine-readable output and `--scope global|project`.

| Command | Required Flags | Description |
|---------|---------------|-------------|
| `plugin:add-marketplace` | `--marketplace-url`, `--scope` | Clone a marketplace repository |
| `plugin:update-marketplace` | `--marketplace-name`, `--scope` | Pull latest marketplace changes |
| `plugin:list-plugins` | `--marketplace-name`, `--scope` | List available plugins in a marketplace |
| `plugin:install` | `--plugin-name`, `--marketplace-name`, `--scope` | Get install instructions for a plugin |
| `plugin:uninstall` | `--plugin-name`, `--marketplace-name`, `--scope` | Get uninstall instructions for a plugin |
| `plugin:update` | `--plugin-name`, `--marketplace-name`, `--scope` | Resolve migration chain and get update instructions |
| `plugin:configure` | `--plugin-name`, `--marketplace-name`, `--scope` | Get configuration instructions for a plugin |
| `plugin:list-installed` | `--scope` | List all installed plugins |
| `plugin:update-registry` | `--plugin-name`, `--plugin-version`, `--marketplace-name`, `--scope` | Register or update a plugin entry |
| `plugin:remove-from-registry` | `--plugin-name`, `--scope` | Remove a plugin entry from the registry |
