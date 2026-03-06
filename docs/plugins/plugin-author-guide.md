# Plugin Author Guide

This guide explains how to create plugin packages for the babysitter SDK. A babysitter plugin is not a conventional software plugin. Instead, it is a version-managed package of contextual instructions that an AI agent reads and executes to install, uninstall, configure, or migrate between versions of a tool or integration.

## Concepts

- **Plugin package** -- A directory within a marketplace repository containing instruction files and optional babysitter process files.
- **Marketplace** -- A Git repository with a `marketplace.json` manifest that indexes available plugins.
- **Registry** -- A local JSON file (`plugin-registry.json`) that tracks which plugins are installed and at what version.
- **Scope** -- Plugins can be installed at `global` scope (`~/.babysitter/`) or `project` scope (`<projectDir>/.babysitter/`).

## Plugin Package Directory Structure

A plugin package is a directory with the following layout:

```
my-plugin/
  install.md              # Agent-readable installation instructions
  uninstall.md            # Agent-readable uninstallation instructions
  configure.md            # Agent-readable configuration instructions
  install-process.js      # Optional babysitter process for automated install
  uninstall-process.js    # Optional babysitter process for automated uninstall
  configure-process.js    # Optional babysitter process for automated configuration
  migrations/             # Version migration files
    1.0.0_to_1.1.0.md
    1.1.0_to_1.2.0.md
    1.2.0_to_2.0.0.js
```

All files are optional. The SDK reads whichever files are present and returns their content to the agent.

## Writing install.md

The `install.md` file contains markdown instructions that an AI agent reads and follows to install the plugin into a project or user environment. Write the instructions as if speaking to a capable developer agent.

Guidelines:

- Use numbered steps for sequential operations.
- Be explicit about file paths, configuration keys, and expected values.
- Reference environment-specific locations using placeholders like `<project-root>` or `<home-dir>`.
- If the install requires running a babysitter process, note that the process file is `install-process.js` in the same directory.
- Include any prerequisites (required tools, environment variables, permissions).

### Example install.md

```markdown
# Install my-plugin

## Prerequisites
- Node.js 18 or later
- Access to the project's `.claude/settings.json`

## Steps

1. Add the plugin entry to `.claude/settings.json` under the `permissions.allow` array:
   ```json
   {
     "permissions": {
       "allow": ["my-plugin@my-org"]
     }
   }
   ```

2. Create the configuration directory:
   ```
   mkdir -p .a5c/plugins/my-plugin
   ```

3. Copy the default configuration:
   ```
   cp <plugin-package-dir>/defaults/config.json .a5c/plugins/my-plugin/config.json
   ```

4. Run the install process for automated setup:
   - The babysitter process file `install-process.js` in this directory handles
     remaining setup steps including API key validation.
```

## Writing uninstall.md

The `uninstall.md` file contains instructions for removing the plugin. It should reverse the steps performed during installation.

### Example uninstall.md

```markdown
# Uninstall my-plugin

1. Remove the plugin entry from `.claude/settings.json` under `permissions.allow`.
2. Delete the plugin configuration directory:
   ```
   rm -rf .a5c/plugins/my-plugin
   ```
3. Remove any environment variables set during installation.
```

## Writing configure.md

The `configure.md` file contains instructions for configuring or reconfiguring the plugin after installation. This is useful for changing settings, updating API keys, or adjusting plugin behavior.

### Example configure.md

```markdown
# Configure my-plugin

## Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `apiKey` | (none) | API key for the external service |
| `timeout` | `30000` | Request timeout in milliseconds |
| `logLevel` | `info` | Logging verbosity (debug, info, warn, error) |

## Steps

1. Open `.a5c/plugins/my-plugin/config.json`
2. Update the desired settings
3. Validate the configuration by running:
   ```
   babysitter health --json
   ```
```

## Babysitter Process Files

Process files (`install-process.js`, `uninstall-process.js`, `configure-process.js`) are standard babysitter process definitions. They export an `async function process(inputs, ctx)` and use `defineTask` to define steps that the orchestrator executes.

These process files enable automated, multi-step operations that go beyond what static markdown instructions can describe. Common uses:

- Validating external service connectivity
- Running database migrations
- Generating configuration files from templates
- Performing health checks after installation

The SDK detects process files by checking for their existence at conventional paths within the plugin package directory. When present, the `processFile` field in the command output contains the absolute path to the file.

## Creating Migration Files

Migration files live in the `migrations/` subdirectory of the plugin package. They describe how to move from one version to another.

### Naming Convention

```
<fromVersion>_to_<toVersion>.<ext>
```

Where:

- `<fromVersion>` -- The source version (semver with dots, dashes, and pre-release identifiers allowed)
- `<toVersion>` -- The target version
- `<ext>` -- Either `md` (markdown instructions) or `js` (babysitter process file)

Examples:

```
1.0.0_to_1.1.0.md
1.1.0_to_1.2.0.md
1.2.0_to_2.0.0.js
2.0.0-beta_to_2.0.0.md
```

### Markdown Migration Files (.md)

Contain agent-readable instructions for performing the migration:

```markdown
# Migration from 1.0.0 to 1.1.0

## Breaking Changes
- The `timeout` config key has moved from top-level to `settings.timeout`

## Steps

1. Open `.a5c/plugins/my-plugin/config.json`
2. Move the `timeout` value:
   - Remove `"timeout": <value>` from the top level
   - Add `"settings": { "timeout": <value> }` if the `settings` key does not exist
3. Verify the configuration is valid by running `babysitter health`
```

### JavaScript Migration Files (.js)

Standard babysitter process files that automate the migration. The SDK returns the absolute path to the file in the `processFile` field so the agent can execute it.

## Example Complete Plugin Package

```
example-plugin/
  install.md
  uninstall.md
  configure.md
  install-process.js
  migrations/
    1.0.0_to_1.1.0.md
    1.1.0_to_2.0.0.md
    2.0.0_to_2.1.0.js
```

With a corresponding marketplace.json entry:

```json
{
  "name": "example-plugin",
  "description": "An example babysitter plugin",
  "latestVersion": "2.1.0",
  "versions": ["2.1.0", "2.0.0", "1.1.0", "1.0.0"],
  "packagePath": "plugins/example-plugin",
  "tags": ["example", "tutorial"],
  "author": "my-org"
}
```

## Plugin Lifecycle

The complete lifecycle for a plugin from the agent's perspective:

1. **Discovery** -- `plugin:list-plugins` to browse available plugins in a marketplace.
2. **Install** -- `plugin:install` returns instructions from `install.md`. Agent executes them. Then `plugin:update-registry` records the version.
3. **Configure** -- `plugin:configure` returns instructions from `configure.md`. Agent executes them.
4. **Update** -- `plugin:update` resolves the migration chain and returns ordered migration instructions. Agent executes each migration step. Then `plugin:update-registry` records the new version.
5. **Uninstall** -- `plugin:uninstall` returns instructions from `uninstall.md`. Agent executes them. Then `plugin:remove-from-registry` cleans up the registry.
