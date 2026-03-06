# Marketplace Format Specification

A marketplace is a Git repository that indexes babysitter plugins via a `marketplace.json` manifest. The babysitter SDK clones these repositories locally and reads the manifest to discover available plugins.

## marketplace.json Schema

The root manifest file must be named `marketplace.json` and placed at the repository root.

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable marketplace name. This becomes the directory name when cloned locally. |
| `description` | string | Yes | Short description of the marketplace |
| `url` | string | Yes | Git remote URL of the marketplace repository |
| `owner` | string | Yes | Marketplace owner name or organization |
| `plugins` | object | Yes | Map of plugin name to `MarketplacePluginEntry` |

### MarketplacePluginEntry Fields

Each key in the `plugins` object is the plugin name (e.g., `"babysitter@a5c.ai"`), and each value has the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable plugin name (should match the key) |
| `description` | string | Yes | Short description of the plugin |
| `latestVersion` | string | Yes | Latest available semantic version |
| `versions` | string[] | Yes | List of all available versions, newest first |
| `packagePath` | string | Yes | Relative path to the plugin package directory within the marketplace repository |
| `tags` | string[] | Yes | Searchable tags for categorization |
| `author` | string | Yes | Plugin author name or identifier |

### Example marketplace.json

```json
{
  "name": "babysitter-marketplace",
  "description": "Official marketplace for babysitter plugins",
  "url": "https://github.com/a5c-ai/babysitter-marketplace.git",
  "owner": "a5c-ai",
  "plugins": {
    "babysitter@a5c.ai": {
      "name": "babysitter@a5c.ai",
      "description": "Core babysitter plugin for AI-assisted development workflows",
      "latestVersion": "0.0.176",
      "versions": ["0.0.176", "0.0.175", "0.0.174"],
      "packagePath": "plugins/babysitter",
      "tags": ["core", "development", "ai"],
      "author": "a5c-ai"
    },
    "code-review@a5c.ai": {
      "name": "code-review@a5c.ai",
      "description": "Automated code review plugin",
      "latestVersion": "1.2.0",
      "versions": ["1.2.0", "1.1.0", "1.0.0"],
      "packagePath": "plugins/code-review",
      "tags": ["review", "quality"],
      "author": "a5c-ai"
    }
  }
}
```

## Repository Directory Structure

A marketplace repository should follow this layout:

```
babysitter-marketplace/
  marketplace.json            # Manifest (required)
  plugins/
    babysitter/               # Plugin package directory
      install.md
      uninstall.md
      configure.md
      install-process.js
      migrations/
        0.0.174_to_0.0.175.md
        0.0.175_to_0.0.176.md
    code-review/
      install.md
      uninstall.md
      configure.md
      migrations/
        1.0.0_to_1.1.0.md
        1.1.0_to_1.2.0.md
```

The `packagePath` field in each plugin entry points to the relative path within this repository (e.g., `"plugins/babysitter"`).

## Local Clone Structure

When a marketplace is cloned via `plugin:add-marketplace`, it is stored under the babysitter configuration directory:

- **Global scope**: `~/.babysitter/marketplaces/<marketplace-name>/`
- **Project scope**: `<projectDir>/.babysitter/marketplaces/<marketplace-name>/`

The marketplace name is derived from the Git URL (the repository name without the `.git` suffix). For example, cloning `https://github.com/a5c-ai/babysitter-marketplace.git` produces a directory named `babysitter-marketplace`.

## Version Tracking

The `latestVersion` field in each plugin entry determines the default version used during `plugin:install` when no `--plugin-version` flag is provided. The `versions` array provides a complete history for reference, listed newest first.

Version strings follow semantic versioning conventions (e.g., `1.0.0`, `2.0.0-beta.1`). Pre-release identifiers with dashes and dots are supported.

## Creating a Marketplace Repository

1. Create a new Git repository.

2. Create a `marketplace.json` at the root with the schema described above.

3. Create plugin package directories under a conventional path (typically `plugins/`).

4. For each plugin, add an entry to `marketplace.json` with the `packagePath` pointing to the plugin package directory.

5. Push the repository to a Git remote (GitHub, GitLab, Bitbucket, or any Git-accessible URL).

6. Users can then add the marketplace:
   ```bash
   babysitter plugin:add-marketplace --marketplace-url <your-repo-url> --global
   ```

## Updating the Marketplace

When you release a new plugin version:

1. Update the plugin package directory with new instruction files and migration files.
2. Update the `latestVersion` field in `marketplace.json`.
3. Add the new version to the front of the `versions` array.
4. Commit and push the changes.

Users update their local clone with:
```bash
babysitter plugin:update-marketplace --marketplace-name <name> --global
```

## TypeScript Interfaces

The marketplace types are defined in `packages/sdk/src/plugins/types.ts`:

- `MarketplaceManifest` -- The full manifest structure
- `MarketplacePluginEntry` -- A single plugin entry within the manifest
- `MARKETPLACE_MANIFEST_FILENAME` -- The constant `"marketplace.json"`
