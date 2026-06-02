---
description: manage Babysitter blueprints. Use this command to list installed blueprints, browse marketplaces, install, update, uninstall, configure, or create a new blueprint.
argument-hint: Blueprint action and options.
---

This command installs and manages Babysitter blueprints. A blueprint is a version-managed package of contextual instructions or deterministic Babysitter processes, not a conventional software plugin.

If the command is run without arguments, list installed blueprints with their name, version, marketplace, installation date, and last update date. Also list configured marketplaces and show how to add the default marketplace when none exist.

Blueprints can be installed at two scopes:

- **global** (`--global`): stored under `~/.a5c/`, available for all projects
- **project** (`--project`): stored under `<projectDir>/.a5c/`, project-specific

## Marketplace Management

Marketplaces are git repositories containing a `marketplace.json` manifest and blueprint package directories. The SDK clones new marketplaces to `.a5c/blueprints/marketplaces/` for the selected scope and reads legacy `.a5c/marketplaces/` clones for compatibility.

### Add a marketplace

```bash
babysitter blueprints:add-marketplace --marketplace-url <url> [--marketplace-path <relative-path>] [--marketplace-branch <ref>] [--force] --global|--project [--json]
```

### Update a marketplace

```bash
babysitter blueprints:update-marketplace --marketplace-name <name> [--marketplace-branch <ref>] --global|--project [--json]
```

### List blueprints in a marketplace

```bash
babysitter blueprints:list-plugins --marketplace-name <name> --global|--project [--json]
```

## Blueprint Lifecycle

For `blueprint:install`, `blueprint:update`, `blueprint:configure`, and `blueprint:list-plugins`, the `--marketplace-name` flag is auto-detected when only one marketplace is cloned for the selected scope.

```bash
babysitter blueprints:install --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
babysitter blueprints:update --plugin-name <name> --marketplace-name <mp> --global|--project [--json]
babysitter blueprints:configure --plugin-name <name> --marketplace-name <mp> --global|--project [--json]
babysitter blueprints:uninstall --plugin-name <name> --marketplace-name <mp> --global|--project [--json]
```

The `--plugin-name` flag is preserved for CLI compatibility with existing marketplace manifests. User-facing docs should call the installable a blueprint.

## Registry Management

```bash
babysitter blueprints:list-installed --global|--project [--json]
babysitter blueprints:update-registry --plugin-name <name> --plugin-version <ver> --marketplace-name <mp> --global|--project [--json]
babysitter blueprints:remove-from-registry --plugin-name <name> --global|--project [--json]
```

## Deprecated Aliases

The old `plugin:*` commands remain available as deprecated aliases for one release. Prefer `blueprint:*` in new docs, skills, and process instructions.

## Agent Plugins Are Separate

Do not rename or reinterpret agent harness plugins while handling blueprints. `CLAUDE_PLUGIN_ROOT`, `PI_PLUGIN_ROOT`, `.claude/plugins/`, hooks-mux, extension-mux, and agent plugin manifests stay plugin-specific.
