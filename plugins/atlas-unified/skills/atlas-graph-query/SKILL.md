---
name: atlas-graph-query
description: >
  Reference for querying the Atlas knowledge graph through its MCP tools — the
  SECONDARY enrichment/comparison layer that adds best-practice context to systems
  you have ALREADY scanned from your real sources (`az`, repos, dirs). Use when
  you need to look up nodes, edges, kinds, clusters, stats, or wiki pages in Atlas
  to compare against your real inventory. (atlas graph, query atlas, atlas mcp,
  search the graph, graph neighbors, atlas record, atlas kinds, enrichment layer)
allowed-tools: mcp__atlas__atlas_public_search, mcp__atlas__atlas_public_record, mcp__atlas__atlas_public_neighbors, mcp__atlas__atlas_public_kinds, mcp__atlas__atlas_public_kind, mcp__atlas__atlas_public_edge_kinds, mcp__atlas__atlas_public_edge_kind, mcp__atlas__atlas_public_clusters, mcp__atlas__atlas_public_stats, mcp__atlas__atlas_public_wiki_page
version: 0.1.0
---

# atlas-graph-query

A thin reference for the Atlas knowledge-graph MCP tool surface so any agent
(including sub-agents) can query the graph without re-deriving conventions. The
server URL is wired natively by the `atlas` plugin and is overridable via
`ATLAS_MCP_URL`. Never invent node ids — only use ids returned by these tools.

> **Position: this is the SECONDARY / enrichment layer.** The `atlas` plugin is
> scan-first — it inventories your REAL systems by scanning your actual sources
> (Azure via read-only `az`, git repos, local directories) and process/data
> mining them. The graph queries below are used ONLY to add best-practice /
> comparison context to those already-discovered real systems. Do NOT use the
> graph as the primary content, and never pad a real inventory with generic
> catalog nodes. Tie every graph lookup back to a real scanned system.

## Tools

### `mcp__atlas__atlas_public_search`
Full-text/semantic search over the graph. Key params: `q` (query), optional
`kind` filter, `limit`. Prefer it to find seed/anchor nodes from need terms.

### `mcp__atlas__atlas_public_record`
Fetch one node's full record by `id` (fields + edges). Use `expandNeighbors` to
pull immediate relations in one call. Prefer it to read detail once you have ids.

### `mcp__atlas__atlas_public_neighbors`
Traverse the graph from a node. Key params: `id`, `depth`, `edges` (edge-kind
filter), `kinds` (node-kind filter). Prefer it to expand a subsystem from anchors.

### `mcp__atlas__atlas_public_kinds`
List all node kinds in the graph. Use to scope a domain to relevant kinds.

### `mcp__atlas__atlas_public_kind`
Describe a single node kind (schema/fields). Use before relying on a kind's shape.

### `mcp__atlas__atlas_public_edge_kinds`
List all edge kinds. Use to understand how nodes relate.

### `mcp__atlas__atlas_public_edge_kind`
Describe a single edge kind. Use to interpret a specific relation type.

### `mcp__atlas__atlas_public_clusters`
List graph clusters (thematic groupings). Use to scope a domain to cluster(s).

### `mcp__atlas__atlas_public_stats`
Graph-level counts/metrics. Use for sizing and sanity checks.

### `mcp__atlas__atlas_public_wiki_page`
Fetch a narrative wiki page for context. Use to capture human-readable nuance.

## Query recipes

- **Find by need** — `atlas_public_search(q=<need terms>)` → take top ids.
- **Expand a subsystem** — `atlas_public_neighbors(id, depth=2, kinds=[...])`.
- **Inspect a node** — `atlas_public_record(id, expandNeighbors=true)`.
- **Browse a cluster** — `atlas_public_clusters` → pick cluster → `search`/
  `neighbors` scoped to it.
