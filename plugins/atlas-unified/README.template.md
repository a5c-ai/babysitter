# {{name}}

{{description}}

## Prerequisites

Atlas commands delegate orchestration to Babysitter. Install the Babysitter CLI once. The `babysitter` command is backed by the SDK and exposes the canonical harness/plugin installer used in tests:

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
- **Commands**: {{commandList}}
- **MCP**: Atlas knowledge-graph server (`atlas`)

## Verification

```bash
{{verifyCommands}}
```

## Atlas MCP

This plugin wires the Atlas knowledge-graph MCP server natively into {{targetDisplayName}}'s own MCP config format — no manual setup. By default it points at:

```
https://atlas-staging.a5c.ai/api/mcp
```

Override the endpoint at runtime with the `ATLAS_MCP_URL` environment variable. The `mcp__atlas__atlas_public_*` tools become available to the `atlas` and `atlas-graph-query` skills once the harness is running.

## Integration Model

The plugin provides:

- An `atlas` skill that turns a stated need into a layered system design by mining the graph.
- An `atlas-graph-query` reference skill documenting the MCP tool surface.
- Commands (`/atlas:discover`, `/atlas:mine-processes`, `/atlas:mine-data`, `/atlas:collect-nuances`) that delegate orchestration to the `babysitter:babysit` skill using atlas-specific `.a5c` processes.

The process library and run lifecycle are fetched and bound through the Babysitter SDK CLI.
