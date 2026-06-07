---
description: deprecated alias for the Babysitter blueprints command. Use /babysitter:blueprints for marketplace installables.
argument-hint: Blueprint action and options.
---

This command is a deprecated alias for `/babysitter:blueprints`.

For Babysitter marketplace installables, use blueprints terminology and the `babysitter blueprints:*` CLI command family:

```bash
babysitter blueprints:list-installed --global|--project [--json]
babysitter blueprints:add-marketplace --marketplace-url <url> [--marketplace-path <relative-path>] --global|--project [--json]
babysitter blueprints:list-blueprints --marketplace-name <name> --global|--project [--json]
babysitter blueprints:install --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
babysitter blueprints:update --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
babysitter blueprints:configure --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
babysitter blueprints:uninstall --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
```

The `--plugin-name` flag remains for CLI compatibility with existing marketplace manifests. Describe the installable as a blueprint in user-facing text.

Agent harness plugins are not renamed. `CLAUDE_PLUGIN_ROOT`, `PI_PLUGIN_ROOT`, `.claude/plugins/`, hooks-adapter, extensions-adapter, and agent plugin manifests remain plugin concepts.
