# Plugin CLI Reference

Complete reference for all `babysitter plugin:*` commands. Every command supports the `--json` flag for machine-readable output and `--verbose` for additional diagnostic information.

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output structured JSON instead of human-readable text |
| `--verbose` | Enable verbose diagnostic output |
| `--runs-dir <path>` | Override the default runs directory |

## Scope

Most plugin commands require a scope flag indicating where configuration is stored:

- `--global` — User-wide configuration stored in `~/.babysitter/`
- `--project` — Project-specific configuration stored in `<projectDir>/.babysitter/`

When `--project` is used, the current working directory is treated as the project root.

---

## plugin:add-marketplace

Clones a marketplace repository into the local marketplaces directory.

### Usage

```
babysitter plugin:add-marketplace --marketplace-url <url> --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `--marketplace-url <url>` | Git remote URL of the marketplace repository to clone |
| `--global` or `--project` | Scope for the marketplace clone |

### Example

```bash
babysitter plugin:add-marketplace --marketplace-url https://github.com/a5c-ai/babysitter-marketplace.git --global --json
```

### JSON Output

```json
{
  "success": true,
  "url": "https://github.com/a5c-ai/babysitter-marketplace.git",
  "scope": "global",
  "directory": "/home/user/.babysitter/marketplaces/babysitter-marketplace"
}
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | `--marketplace-url` or `--scope` not provided |
| `clone_failed` | Git clone failed (bad URL, network error, directory already exists) |

---

## plugin:update-marketplace

Pulls the latest changes for a previously cloned marketplace.

### Usage

```
babysitter plugin:update-marketplace --marketplace-name <name> --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `--marketplace-name <name>` | Name of the previously cloned marketplace (directory name) |
| `--global` or `--project` | Scope where the marketplace was cloned |

### Example

```bash
babysitter plugin:update-marketplace --marketplace-name babysitter-marketplace --global --json
```

### JSON Output

```json
{
  "success": true,
  "marketplace": "babysitter-marketplace",
  "scope": "global"
}
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | `--marketplace-name` or `--scope` not provided |
| `update_failed` | Marketplace directory not found, or git pull failed |

---

## plugin:list-plugins

Lists all plugins available in a marketplace manifest.

### Usage

```
babysitter plugin:list-plugins --marketplace-name <name> --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `--marketplace-name <name>` | Name of the marketplace to list plugins from |
| `--global` or `--project` | Scope where the marketplace is cloned |

### Example

```bash
babysitter plugin:list-plugins --marketplace-name babysitter-marketplace --global --json
```

### JSON Output

```json
{
  "marketplace": "babysitter-marketplace",
  "scope": "global",
  "count": 2,
  "plugins": [
    {
      "name": "babysitter@a5c.ai",
      "description": "Core babysitter plugin for AI-assisted development",
      "latestVersion": "0.0.176",
      "versions": ["0.0.176", "0.0.175", "0.0.174"],
      "packagePath": "plugins/babysitter",
      "tags": ["core", "development"],
      "author": "a5c-ai"
    }
  ]
}
```

### Human-Readable Output

```
Plugins in marketplace "babysitter-marketplace" (scope: global):

  NAME               VERSION  DESCRIPTION
  ────               ───────  ────────────────────────────────────────
  babysitter@a5c.ai  0.0.176  Core babysitter plugin for AI-assisted development

  1 plugin(s) available.
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | `--marketplace-name` or `--scope` not provided |
| `list_failed` | Marketplace directory not found, or manifest unreadable |

---

## plugin:install

Installs a plugin from a marketplace. Updates the marketplace first, resolves the plugin version, reads install instructions from the plugin package, and returns them for the agent to execute.

### Usage

```
babysitter plugin:install <plugin-name> --marketplace-name <name> --global|--project [--plugin-version <ver>] [--json] [--verbose]
```

The plugin name can be provided as a positional argument or via `--plugin-name`.

### Required Flags

| Flag | Description |
|------|-------------|
| `<plugin-name>` or `--plugin-name <name>` | Name of the plugin to install |
| `--marketplace-name <name>` | Marketplace containing the plugin |
| `--global` or `--project` | Scope for the installation |

### Optional Flags

| Flag | Description |
|------|-------------|
| `--plugin-version <ver>` | Specific version to install. If omitted, the latest version from the marketplace manifest is used. |

### Example

```bash
babysitter plugin:install babysitter@a5c.ai --marketplace-name babysitter-marketplace --global --json
```

### JSON Output

```json
{
  "plugin": "babysitter@a5c.ai",
  "version": "0.0.176",
  "marketplace": "babysitter-marketplace",
  "scope": "global",
  "instructions": "# Install babysitter@a5c.ai\n\n1. Copy the plugin configuration...\n",
  "processFile": "/home/user/.babysitter/marketplaces/babysitter-marketplace/plugins/babysitter/install-process.js"
}
```

The `instructions` field contains the markdown content from `install.md` in the plugin package. The `processFile` field is non-null when an `install-process.js` babysitter process file exists in the plugin package directory.

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | Required flag not provided |
| `install_failed` | Plugin not found in marketplace, marketplace update failed, or package directory not found |

---

## plugin:uninstall

Reads uninstall instructions for a previously installed plugin. Looks up the plugin in the registry to find its marketplace and version, then reads the uninstall instructions from the plugin package.

### Usage

```
babysitter plugin:uninstall <plugin-name> --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `<plugin-name>` or `--plugin-name <name>` | Name of the plugin to uninstall |
| `--global` or `--project` | Scope where the plugin is installed |

### Example

```bash
babysitter plugin:uninstall babysitter@a5c.ai --global --json
```

### JSON Output

```json
{
  "plugin": "babysitter@a5c.ai",
  "version": "0.0.176",
  "marketplace": "babysitter-marketplace",
  "scope": "global",
  "instructions": "# Uninstall babysitter@a5c.ai\n\n1. Remove the plugin configuration...\n",
  "processFile": null
}
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | Required flag not provided |
| `uninstall_failed` | Plugin not found in registry, or plugin package directory not found |

---

## plugin:update

Updates an installed plugin to a newer version. Resolves the migration chain from the currently installed version to the target version using BFS shortest-path on available migration files, and returns all migration instructions in order.

### Usage

```
babysitter plugin:update <plugin-name> --marketplace-name <name> --global|--project [--plugin-version <ver>] [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `<plugin-name>` or `--plugin-name <name>` | Name of the plugin to update |
| `--marketplace-name <name>` | Marketplace containing the plugin |
| `--global` or `--project` | Scope where the plugin is installed |

### Optional Flags

| Flag | Description |
|------|-------------|
| `--plugin-version <ver>` | Specific target version. If omitted, the latest version from the marketplace manifest is used. |

### Example

```bash
babysitter plugin:update babysitter@a5c.ai --marketplace-name babysitter-marketplace --global --json
```

### JSON Output

```json
{
  "plugin": "babysitter@a5c.ai",
  "fromVersion": "0.0.174",
  "toVersion": "0.0.176",
  "marketplace": "babysitter-marketplace",
  "scope": "global",
  "migrations": [
    {
      "from": "0.0.174",
      "to": "0.0.175",
      "file": "0.0.174_to_0.0.175.md",
      "type": "md",
      "instructions": "# Migration 0.0.174 to 0.0.175\n\n1. Update configuration...\n",
      "processFile": null
    },
    {
      "from": "0.0.175",
      "to": "0.0.176",
      "file": "0.0.175_to_0.0.176.js",
      "type": "js",
      "instructions": "// Migration process code...",
      "processFile": "/path/to/migrations/0.0.175_to_0.0.176.js"
    }
  ]
}
```

When the installed version already matches the target version, migrations is an empty array with a `message` field:

```json
{
  "plugin": "babysitter@a5c.ai",
  "fromVersion": "0.0.176",
  "toVersion": "0.0.176",
  "migrations": [],
  "message": "Already at target version"
}
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | Required flag not provided |
| `update_failed` | Plugin not installed, not found in marketplace, no migration path exists, or marketplace update failed |

---

## plugin:configure

Reads configuration instructions for an installed plugin from its plugin package.

### Usage

```
babysitter plugin:configure <plugin-name> --marketplace-name <name> --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `<plugin-name>` or `--plugin-name <name>` | Name of the plugin to configure |
| `--marketplace-name <name>` | Marketplace containing the plugin |
| `--global` or `--project` | Scope for the configuration |

### Example

```bash
babysitter plugin:configure babysitter@a5c.ai --marketplace-name babysitter-marketplace --project --json
```

### JSON Output

```json
{
  "plugin": "babysitter@a5c.ai",
  "marketplace": "babysitter-marketplace",
  "scope": "project",
  "instructions": "# Configure babysitter@a5c.ai\n\n1. Set the API key...\n",
  "processFile": "/path/to/configure-process.js"
}
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | Required flag not provided |
| `configure_failed` | Plugin package directory not found |

---

## plugin:list-installed

Lists all plugins recorded in the plugin registry for the given scope.

### Usage

```
babysitter plugin:list-installed --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `--global` or `--project` | Scope to list installed plugins for |

### Example

```bash
babysitter plugin:list-installed --global --json
```

### JSON Output

```json
[
  {
    "name": "babysitter@a5c.ai",
    "version": "0.0.176",
    "marketplace": "babysitter-marketplace",
    "installedAt": "2026-03-01T10:30:00.000Z",
    "updatedAt": "2026-03-05T14:20:00.000Z"
  }
]
```

### Human-Readable Output

```
Installed plugins (scope: global):

  NAME               VERSION  MARKETPLACE              INSTALLED
  ────               ───────  ───────────              ────────────────────
  babysitter@a5c.ai  0.0.176  babysitter-marketplace   2026-03-01T10:30:00.000Z

  1 plugin(s) installed.
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | `--scope` not provided |
| `list_failed` | Registry file unreadable |

---

## plugin:update-registry

Creates or updates a plugin entry in the registry. Used after the agent has completed the install or update steps to record the installed version.

### Usage

```
babysitter plugin:update-registry <plugin-name> --plugin-version <ver> --marketplace-name <name> --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `<plugin-name>` or `--plugin-name <name>` | Name of the plugin |
| `--plugin-version <ver>` | Version to record |
| `--marketplace-name <name>` | Marketplace the plugin was sourced from |
| `--global` or `--project` | Scope for the registry entry |

### Example

```bash
babysitter plugin:update-registry babysitter@a5c.ai --plugin-version 0.0.176 --marketplace-name babysitter-marketplace --global --json
```

### JSON Output

```json
{
  "name": "babysitter@a5c.ai",
  "version": "0.0.176",
  "marketplace": "babysitter-marketplace",
  "scope": "global",
  "installedAt": "2026-03-01T10:30:00.000Z",
  "updatedAt": "2026-03-06T09:00:00.000Z",
  "packagePath": "/home/user/.babysitter/marketplaces/babysitter-marketplace/plugins/babysitter",
  "metadata": {}
}
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | Any required flag not provided |
| `update_registry_failed` | Plugin package path resolution failed, or registry write failed |

---

## plugin:remove-from-registry

Removes a plugin entry from the registry. Used after the agent has completed the uninstall steps.

### Usage

```
babysitter plugin:remove-from-registry <plugin-name> --global|--project [--json] [--verbose]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `<plugin-name>` or `--plugin-name <name>` | Name of the plugin to remove |
| `--global` or `--project` | Scope for the registry |

### Example

```bash
babysitter plugin:remove-from-registry babysitter@a5c.ai --global --json
```

### JSON Output

```json
{
  "removed": true,
  "plugin": "babysitter@a5c.ai"
}
```

### Error Cases

| Error | Cause |
|-------|-------|
| `missing_argument` | Required flag not provided |
| `remove_failed` | Registry read/write failed |
