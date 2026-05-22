# {{name}}

{{description}}

## Prerequisites

Install the Babysitter CLI once. The `babysitter` command is backed by the SDK and exposes the canonical harness/plugin installer used in tests:

```bash
npm install -g @a5c-ai/babysitter
```

## Installation — {{targetDisplayName}}

{{installInstructions}}

For scriptable installs, prefer the SDK helper shape:

```bash
babysitter harness:install-plugin <harness>
babysitter harness:install-plugin <harness> --workspace /path/to/repo
```

## What's Included

- **Skills**: {{skillNames}}
- **Hooks**: {{hookNames}}
- **Commands**: {{commandList}}
{{#if hasBinScripts}}
- **CLI**: Install/uninstall scripts for global and workspace setup
{{/if}}
{{#if hasExtension}}
- **Extension**: Programmatic {{targetDisplayName}} extension with hook bridge
{{/if}}

## Verification

```bash
{{verifyCommands}}
```

## Integration Model

The plugin provides:

- Core orchestration skill for multi-step workflow management
- Lifecycle hooks for session state, orchestration loops, and token compression
- Command wrappers for plan, resume, doctor, and other operations

The process library is fetched and bound through the SDK CLI.
