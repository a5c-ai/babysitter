---
title: Babysitter Blueprints
description: Understand Babysitter blueprints, the marketplace model, and how blueprint installs reshape projects and workflows.
last_updated: 2026-06-01
category: guide
---

# Babysitter Blueprints

Babysitter blueprints are version-managed instruction packages distributed through a marketplace. They were previously called Babysitter plugins; the old `plugin:*` CLI commands remain as deprecated aliases for one release, but new documentation and command surfaces should use `blueprint:*`.

Blueprints are not conventional software plugins. A blueprint is a set of markdown instructions or deterministic Babysitter process files that an AI agent reads and executes to install, configure, update, or remove a modular capability.

## What the SDK Manages

| Concern | How the SDK handles it |
| --- | --- |
| Distribution | Marketplaces are git repositories cloned with `--depth 1`. The SDK reads `marketplace.json` to list available blueprints. |
| Versioning | The registry tracks installed versions. Migration files describe upgrade steps, and the SDK finds the shortest migration path. |
| Registry | A JSON registry records what is installed, where it came from, and when. |
| Instruction delivery | The CLI reads `install.md`, `configure.md`, `uninstall.md`, or migration files from the blueprint package and hands them to the agent. |

Everything else, including project edits, tool installation, CI setup, and follow-up validation, is done by the agent interpreting the blueprint instructions.

## Storage

Blueprint marketplaces are stored under `.a5c/blueprints/marketplaces/` for the selected scope:

- Global scope: `~/.a5c/blueprints/marketplaces/<name>/`
- Project scope: `<projectDir>/.a5c/blueprints/marketplaces/<name>/`

The SDK still reads legacy `.a5c/marketplaces/` clones for compatibility. New clones use the blueprint path.

## Quick Start

```bash
# Add the official marketplace
babysitter blueprint:add-marketplace \
  --marketplace-url https://github.com/a5c-ai/babysitter \
  --marketplace-path blueprints/a5c/marketplace \
  --global

# See what is available
babysitter blueprint:list-plugins --marketplace-name babysitter --global

# Install a blueprint
babysitter blueprint:install testing-suite --global

# Reconfigure later
babysitter blueprint:configure testing-suite --project

# Remove it
babysitter blueprint:uninstall testing-suite --global
```

## Command Reference

All commands accept `--json` for machine-readable output and `--global|--project` for scope selection.

| Command | Description |
| --- | --- |
| `blueprint:add-marketplace` | Clone a marketplace repository. |
| `blueprint:update-marketplace` | Pull the latest marketplace changes. |
| `blueprint:list-plugins` | List available blueprints in a marketplace. |
| `blueprint:install` | Read install instructions for a blueprint. |
| `blueprint:update` | Resolve migration instructions for an installed blueprint. |
| `blueprint:configure` | Read configuration instructions for a blueprint. |
| `blueprint:uninstall` | Read uninstall instructions for a blueprint. |
| `blueprint:list-installed` | List installed blueprints. |
| `blueprint:update-registry` | Register or update an installed blueprint entry. |
| `blueprint:remove-from-registry` | Remove a blueprint registry entry. |

Deprecated `plugin:*` aliases forward to these commands and print a deprecation warning in human-readable mode.

## Package Structure

```text
my-blueprint/
  install.md
  uninstall.md
  configure.md
  plugin.json
  migrations/
    1.0.0_to_1.1.0.md
  process/
    main.js
```

The marketplace manifest still uses the existing `plugins` object field for compatibility with published marketplace data, but documentation should refer to the packages as blueprints.

## Agent Plugins Stay Separate

Agent harness plugins are still called plugins. Do not rename `CLAUDE_PLUGIN_ROOT`, `PI_PLUGIN_ROOT`, `.claude/plugins/`, `packages/agent-mux/hooks/`, or `packages/extension-mux/` when working on blueprints.
