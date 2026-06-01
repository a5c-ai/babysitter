---
name: blueprints
description: Manage Babysitter blueprints from marketplaces, including listing, installing, updating, configuring, uninstalling, and creating blueprint packages.
---

# blueprints

Use this skill when the user asks to manage Babysitter blueprints, marketplace installables, or the former Babysitter plugin packages.

Prefer the `babysitter blueprint:*` CLI command family:

```bash
babysitter blueprint:list-installed --global
babysitter blueprint:add-marketplace --marketplace-url <url> --global
babysitter blueprint:list-plugins --marketplace-name <name> --global
babysitter blueprint:install --plugin-name <name> --marketplace-name <name> --global
babysitter blueprint:update --plugin-name <name> --marketplace-name <name> --global
babysitter blueprint:configure --plugin-name <name> --marketplace-name <name> --global
babysitter blueprint:uninstall --plugin-name <name> --marketplace-name <name> --global
```

The old `babysitter plugin:*` commands are deprecated aliases. Use them only when preserving an existing instruction, and prefer rewriting new guidance to `blueprint:*`.

Do not rename agent harness plugins. `CLAUDE_PLUGIN_ROOT`, `PI_PLUGIN_ROOT`, `.claude/plugins/`, hooks-mux, extension-mux, and agent plugin manifests remain plugin concepts.
