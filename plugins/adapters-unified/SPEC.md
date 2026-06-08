# adapters-unified — plugin spec (concise)

A unified plugin that exposes the **adapters** layer (formerly *agent-mux*,
`packages/adapters/*`) — the multi-harness dispatch/launch/transport/plugin
runtime — to end users from inside any AI coding harness. Same unified-plugin
mechanics as `atlas-unified`: one `plugin.json` compiled to all targets, native
MCP wiring, dedicated generate + external-repo sync.

## What adapters provides (grounded)
- **`adapters` CLI** (`@a5c-ai/adapters` → bin `adapters`), commands:
  `run, sessions, agent, mcp, plugin, skill, hooks, config, auth, models,
  profiles, remote, gateway, launch, workspaces, install, detect-host, doctor,
  tui`.
- **Cross-harness plugin compiler** — `@a5c-ai/extensions-adapter` (bin
  `adapters-extensions`): compile one manifest → all harness plugin formats.
- **HTTP/WS gateway** — `@a5c-ai/adapters-gateway` (Hono) for remote/browser run
  execution + session streaming.
- **Supporting CLIs**: `adapters-tasks` (breakpoint mux + signing),
  `adapters-transport-proxy`/`adapters-proxy`, `adapters-triggers`,
  `adapters-harness-mock`.
- **Codecs** — built-in adapters for claude, codex, cursor, gemini, copilot, pi,
  omp, opencode, openclaw, hermes (+ sdk variants).
- Note: adapters has **no MCP server of its own today** — its `mcp` command
  *manages* MCP servers on agents; the only network surface is the gateway.

## What the plugin exposes
**Skills**
- `adapters` — how/when to dispatch work across harnesses: pick an agent, fan a
  task across several, manage sessions/MCP/plugins/auth. Decision guidance + the
  CLI surface map.
- `adapters-plugin-author` — author a unified `plugin.json` and compile/verify it
  to all targets via `adapters-extensions`.

**Commands** (deterministic ops = CLI passthrough; multi-step = delegate to
`babysitter:babysit` with an `.a5c` process)
- `/adapters:run` — dispatch a task to a chosen harness (`adapters run`).
- `/adapters:fanout` — run one prompt across several harnesses and compare
  (process: dispatch N → collect → diff/score).
- `/adapters:sessions` — list/resume/export sessions (`adapters sessions`).
- `/adapters:mcp` — install/enable/disable MCP servers per agent (`adapters mcp`).
- `/adapters:compile-plugin` — orchestrated validate → compile all targets →
  `--verify` → (optional) external sync (process; reuses the atlas pipeline pattern).
- `/adapters:doctor` — `detect-host` + `auth` + `config` diagnostics.

**MCP** (optional, new work)
- Default cut ships **no** new MCP server (adapters has none). Optional follow-up:
  a thin stdio `adapters` MCP exposing `run_agent`, `list_agents`,
  `list/resume/export_session`, `manage_mcp_server`, `compile_plugin` — wired via
  the compiler's `mcpServers` field (`command`/`args` form, e.g.
  `npx -y @a5c-ai/adapters adapters mcp`). Until built, MCP-equivalent access is
  the gateway HTTP API.

**`.a5c` processes** (each iterative + TDD)
- `adapters-fanout-run` — fan a prompt across harnesses, collect, compare.
- `adapters-compile-plugin` — validate → compile all targets → verify → sync.
- `adapters-onboard-harness` — integrate a new harness (reuses the existing
  `packages/adapters/skills/integrate-harness` skill).

## MCP wiring
Reuse the `extensions-adapter` `mcpServers` manifest field (now supports both
`type: remote` + `url` and local `command`/`args`). adapters' MCP, if built, is a
**local stdio** server (`command`/`args`), not a remote URL.

## Lifecycle (parity with atlas/babysitter)
- `plugin.json` with the full `targets` map; npm names `@a5c-ai/adapters-plugin-<harness>`
  (avoid colliding with the existing `@a5c-ai/adapters*` packages — note the
  collision risk and namespace deliberately).
- Dedicated `scripts/generate-adapters-plugins.mjs` + workflow, and (optional)
  `scripts/sync-adapters-plugin-repos.mjs` → `a5c-ai/adapters-<harness>` repos,
  mirroring the atlas pipeline.

## Highest-value first cut
1. `/adapters:run` + `/adapters:fanout` (skill + CLI passthrough + 1 process).
2. `/adapters:compile-plugin` (process — the compiler is the crown jewel).
3. `/adapters:mcp` + `/adapters:doctor` (CLI passthrough).
Defer: the new stdio MCP server, transport-proxy/tasks/triggers (infra, not
user-facing).

## Open decisions
- npm namespace to avoid `@a5c-ai/adapters*` collision (`adapters-plugin-<x>`?).
- Build the stdio MCP server now or ship CLI-passthrough first.
- Does the plugin bundle the `adapters` CLI as a dep, or assume it installed?
