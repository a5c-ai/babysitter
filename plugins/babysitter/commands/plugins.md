---
description: manage babysitter plugins. use this command to see the list of installed babysitter plugins, their status, and manage them (install, update, uninstall, list from marketplace, add marketplace, configure plugin, create new plugin, etc).
argument-hint: Specific instructions.
---

This command installs and manages plugins for babysitter. A plugin is a version-managed package of contextual instructions (for install, uninstall, configure, and update/migrate between versions), not a conventional software plugin.

if the command is run without arguments, it lists all installed plugins with their name, version, marketplace, installation date, and last update date. as well as marketplaces added to the system. and instructions on how to install new plugins from marketplaces.
if there are no marketplaces added, add the default marketplace:
```bash
babysitter plugin:add-marketplace --marketplace-url https://github.com/a5c-ai/babysitter --marketplace-path plugins/a5c/marketplace/marketplace.json --global --json
```

Plugins can be installed at two scopes:
- **global** (`--global`): stored under `~/.a5c/`, available for all projects
- **project** (`--project`): stored under `<projectDir>/.a5c/`, project-specific

## Marketplace Management

Marketplaces are git repositories containing a `marketplace.json` manifest and plugin package directories. The SDK clones them locally with `--depth 1`.

**Storage locations:**
- Global: `~/.a5c/marketplaces/<name>/`
- Project: `<projectDir>/.a5c/marketplaces/<name>/`

The marketplace name is derived from the git URL's last path segment (stripping `.git` suffix and trailing slashes).

### Adding a marketplace

```bash
babysitter plugin:add-marketplace --marketplace-url <url> [--marketplace-path <relative-path>] [--marketplace-branch <ref>] [--force] --global|--project [--json]
```

Clones the marketplace repository to the local marketplaces directory. Use `--marketplace-path` to specify the relative path to `marketplace.json` within the repo (for monorepos or repos where the manifest is not at the root). Use `--marketplace-branch` to clone a specific branch, tag, or ref (defaults to the repo's default branch). Use `--force` to replace an existing marketplace clone (deletes and re-clones).

### Updating a marketplace

```bash
babysitter plugin:update-marketplace --marketplace-name <name> [--marketplace-branch <ref>] --global|--project [--json]
```

Runs `git pull` on the local marketplace clone to fetch latest changes. Use `--marketplace-branch` to switch to a different branch before pulling (works even with shallow clones).

### Listing plugins in a marketplace

```bash
babysitter plugin:list-plugins --marketplace-name <name> --global|--project [--json]
```

Reads the `marketplace.json` manifest and returns all available plugins sorted alphabetically by name. Each entry includes: name, description, latestVersion, versions array, packagePath, tags, and author.

## Plugin Installation

**Note:** For `plugin:install`, `plugin:update`, `plugin:configure`, and `plugin:list-plugins`, the `--marketplace-name` flag is auto-detected when only one marketplace is cloned for the given scope. You can omit it if there's only one marketplace.

### Flow

1. Update the marketplace: `babysitter plugin:update-marketplace --marketplace-name <name> --global|--project`
2. Check current state: `babysitter plugin:list-installed --global|--project` to see installed plugins and versions
3. Install the plugin:

```bash
babysitter plugin:install --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
```

This command resolves the plugin package path from the marketplace manifest, reads `install.md` from the plugin package directory, and returns the installation instructions. If an `install-process.js` file exists, the instructions may reference it as an automated install process.

4. The agent performs the installation steps as defined in `install.md`
5. The agent updates the registry:

```bash
babysitter plugin:update-registry --plugin-name <name> --plugin-version <ver> --marketplace-name <mp> --global|--project [--json]
```

## Plugin Update (with migrations)

```bash
babysitter plugin:update --plugin-name <name> --marketplace-name <mp> --global|--project [--json]
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
babysitter plugin:update-registry --plugin-name <name> --plugin-version <new-ver> --marketplace-name <mp> --global|--project [--json]
```

## Plugin Uninstallation

```bash
babysitter plugin:uninstall --plugin-name <name> --marketplace-name <mp> --global|--project [--json]
```

Reads `uninstall.md` from the plugin package directory and returns the uninstall instructions. After performing the uninstall steps, remove from registry:

```bash
babysitter plugin:remove-from-registry --plugin-name <name> --global|--project [--json]
```

## Plugin Configuration

```bash
babysitter plugin:configure --plugin-name <name> --marketplace-name <mp> --global|--project [--json]
```

Reads `configure.md` from the plugin package directory and returns configuration instructions.

## Registry Management

The plugin registry (`plugin-registry.json`) tracks installed plugins with schema version `2026.01.plugin-registry-v1`. Writes use atomic file operations (temp + rename) for crash safety.

**Storage locations:**
- Global: `~/.a5c/plugin-registry.json`
- Project: `<projectDir>/.a5c/plugin-registry.json`

### List installed plugins

```bash
babysitter plugin:list-installed --global|--project [--json]
```

Returns all installed plugins sorted alphabetically. In `--json` mode, returns an array of registry entries. In human mode, displays a formatted table with name, version, marketplace, and timestamps.

### Remove from registry

```bash
babysitter plugin:remove-from-registry --plugin-name <name> --global|--project [--json]
```

Removes a plugin entry from the registry. Returns error if the plugin is not present.

## Plugin Creation

To create a new plugin package from scratch, use the `meta/plugin-creation` babysitter process. This process guides you through requirements analysis, structure design, instruction authoring, optional process file generation, validation, and marketplace integration.

### Using the plugin creation process

Orchestrate a babysitter run with the plugin creation process:

```bash
# Create inputs file
cat > /tmp/plugin-inputs.json << 'EOF'
{
  "pluginName": "my-plugin",
  "description": "What the plugin does — be specific about install/configure/uninstall behavior",
  "scope": "project",
  "outputDir": "./plugins",
  "components": {
    "installProcess": false,
    "configureProcess": false,
    "uninstallProcess": false,
    "migrations": false,
    "processFiles": false
  },
  "marketplace": {
    "name": "my-marketplace",
    "author": "my-org",
    "tags": ["category1", "category2"]
  }
}
EOF

# Create and run
babysitter run:create \
  --process-id meta/plugin-creation \
  --entry library/specializations/meta/plugin-creation.js#process \
  --inputs /tmp/plugin-inputs.json \
  --prompt "Create a new babysitter plugin package" \
  --json
```

### What the process generates

The process creates a complete plugin package directory:

| File | Description |
|------|-------------|
| `install.md` | Agent-readable installation instructions with numbered steps |
| `uninstall.md` | Reversal instructions for clean removal |
| `configure.md` | Configuration options table and adjustment instructions |
| `install-process.js` | *(optional)* Automated babysitter process for complex install steps |
| `configure-process.js` | *(optional)* Automated configuration process |
| `process/main.js` | *(optional)* Main process the plugin contributes |
| `marketplace-entry.json` | Ready-to-use marketplace.json entry for publishing |

### Process phases

1. **Requirements Analysis** — Analyzes plugin purpose, prerequisites, config options, file structure
2. **Structure Design** — Plans directory layout and file inventory (with review breakpoint)
3. **Instruction Authoring** — Writes install.md, uninstall.md, configure.md
4. **Process Files** — Creates optional babysitter process files (install-process.js, configure-process.js, process/main.js)
5. **Validation** — Verifies package completeness, instruction quality, path correctness
6. **Marketplace Integration** — Generates marketplace.json entry for publishing

### Quick creation (without orchestration)

For simple plugins that only need instruction files, you can create the package manually following the structure below and the [Plugin Author Guide](docs/plugins/plugin-author-guide.md).

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

All commands accept `--json` for machine-readable output and `--global|--project`.

| Command | Required Flags | Description |
|---------|---------------|-------------|
| `plugin:add-marketplace` | `--marketplace-url`, `--global\|--project` [`--marketplace-path`, `--marketplace-branch`, `--force`] | Clone a marketplace repository |
| `plugin:update-marketplace` | `--marketplace-name`, `--global\|--project` [`--marketplace-branch`] | Pull latest marketplace changes (optionally switch branch) |
| `plugin:list-plugins` | `--marketplace-name`, `--global\|--project` | List available plugins in a marketplace |
| `plugin:install` | `--plugin-name`, `--marketplace-name`, `--global\|--project` | Get install instructions for a plugin |
| `plugin:uninstall` | `--plugin-name`, `--marketplace-name`, `--global\|--project` | Get uninstall instructions for a plugin |
| `plugin:update` | `--plugin-name`, `--marketplace-name`, `--global\|--project` | Resolve migration chain and get update instructions |
| `plugin:configure` | `--plugin-name`, `--marketplace-name`, `--global\|--project` | Get configuration instructions for a plugin |
| `plugin:list-installed` | `--global\|--project` | List all installed plugins |
| `plugin:update-registry` | `--plugin-name`, `--plugin-version`, `--marketplace-name`, `--global\|--project` | Register or update a plugin entry |
| `plugin:remove-from-registry` | `--plugin-name`, `--global\|--project` | Remove a plugin entry from the registry |

## After Plugin Work: Contribute Back

After working with plugins, prompt the user to share improvements or report issues:

- **Improved a plugin's install/configure/uninstall instructions**: `/babysitter:contrib library contribution: improved [plugin-name] [install|configure|uninstall] instructions`
- **Created a new plugin**: `/babysitter:contrib library contribution: new plugin [plugin-name] -- [description]`
- **Found a bug in a plugin or the plugin system**: `/babysitter:contrib bug report: [description, e.g. "plugin:update-registry fails when marketplace hasn't been cloned"]`
- **Plugin install/configure instructions were confusing or wrong**: `/babysitter:contrib bug report: [plugin-name] install instructions [description of what was wrong]`
- **Have an idea for a new plugin**: `/babysitter:contrib feature request: plugin idea -- [description]`

Even reporting that a plugin's instructions were unclear helps improve it for the next user.
