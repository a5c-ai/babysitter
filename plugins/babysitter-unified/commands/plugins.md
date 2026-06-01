---
description: deprecated alias for the Babysitter blueprints command. Use /babysitter:blueprints for marketplace installables.
argument-hint: Blueprint action and options.
---

This command is a deprecated alias for `/babysitter:blueprints`.

For Babysitter marketplace installables, use blueprints terminology and the `babysitter blueprint:*` CLI command family:

```bash
babysitter blueprint:list-installed --global|--project [--json]
babysitter blueprint:add-marketplace --marketplace-url <url> [--marketplace-path <relative-path>] --global|--project [--json]
babysitter blueprint:list-plugins --marketplace-name <name> --global|--project [--json]
babysitter blueprint:install --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
babysitter blueprint:update --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
babysitter blueprint:configure --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
babysitter blueprint:uninstall --plugin-name <name> [--marketplace-name <mp>] --global|--project [--json]
```

The `--plugin-name` flag remains for CLI compatibility with existing marketplace manifests. Describe the installable as a blueprint in user-facing text.

Agent harness plugins are not renamed. `CLAUDE_PLUGIN_ROOT`, `PI_PLUGIN_ROOT`, `.claude/plugins/`, hooks-mux, extension-mux, and agent plugin manifests remain plugin concepts.
