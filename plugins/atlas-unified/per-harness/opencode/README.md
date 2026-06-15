# Atlas Plugin for OpenCode

Atlas turns a stated need into a full system design by mining the Atlas
knowledge graph. This is the OpenCode harness surface for the `atlas` plugin.

## What's Included

- **Skills**: `atlas` (the need → design brain) and `atlas-graph-query`
  (a reference for the Atlas MCP tool surface).
- **Commands**: `/atlas:discover`, `/atlas:mine-processes`,
  `/atlas:mine-data`, `/atlas:collect-nuances` — each delegates orchestration
  to the `babysitter:babysit` skill using an atlas-specific `.a5c` process.
- **MCP**: the Atlas knowledge-graph server (`atlas`), wired natively into
  OpenCode's own MCP config format.

## Atlas MCP

The Atlas MCP server is wired natively for OpenCode — no manual setup. It
defaults to `https://atlas-staging.a5c.ai/api/mcp` and is overridable at
runtime via the `ATLAS_MCP_URL` environment variable. The
`mcp__atlas__atlas_public_*` tools are then available to the atlas skills.

## Installation

Atlas commands delegate orchestration to Babysitter, so install the Babysitter
CLI once, then install this plugin for OpenCode:

```bash
npm install -g @a5c-ai/babysitter
babysitter harness:install-plugin opencode
```

## License

See the repository license.
