# Atlas Agents (GitHub Copilot)

Atlas turns a stated need into a full system design by mining the Atlas
knowledge graph.

- Use the `atlas` skill to drive the need → design pipeline.
- Use the `atlas-graph-query` skill as a reference for the Atlas MCP tool surface.
- Query the graph via the `mcp__atlas__atlas_public_*` MCP tools only; never
  invent node ids.
- Delegate non-trivial runs to the `babysitter:babysit` skill using an atlas
  `.a5c` process (`atlas-systems-discovery`, `atlas-process-mining`,
  `atlas-data-mining`, `atlas-collect-nuances`).

The Atlas MCP server is wired natively and defaults to
`https://atlas-staging.a5c.ai/api/mcp`, overridable via `ATLAS_MCP_URL`.
