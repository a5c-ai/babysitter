# Atlas Plugin for oh-my-pi

Atlas turns a stated need into a full system design by mining the Atlas
knowledge graph. This is the oh-my-pi harness surface for the `atlas` plugin.

## What's Included

- **Skills**: `atlas` (the need → design brain) and `atlas-graph-query`
  (a reference for the Atlas MCP tool surface).
- **Commands**: `/atlas:discover`, `/atlas:mine-processes`,
  `/atlas:mine-data`, `/atlas:collect-nuances` — each delegates orchestration
  to the `babysitter:babysit` skill using an atlas-specific `.a5c` process.
- **MCP**: the Atlas knowledge-graph server (`atlas`), wired natively into
  oh-my-pi's own MCP config format.

## Atlas MCP

The Atlas MCP server is wired natively for oh-my-pi — no manual setup. It
defaults to `https://atlas-staging.a5c.ai/api/mcp` and is overridable at
runtime via the `ATLAS_MCP_URL` environment variable. The
`mcp__atlas__atlas_public_*` tools are then available to the atlas skills.

## Installation

Atlas commands delegate orchestration to Babysitter, so install the Babysitter
CLI once, then install this plugin for oh-my-pi:

```bash
omp plugin install @a5c-ai/atlas-omp
```

## License

See the repository license.
