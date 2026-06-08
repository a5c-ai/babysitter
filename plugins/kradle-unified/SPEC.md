# kradle-unified — plugin spec (concise)

A unified plugin that exposes **Kradle** — the Kubernetes-native Git forge +
agent-dispatch runtime (`packages/kradle/*`) — to end users from inside any AI
coding harness. Same unified-plugin mechanics as `atlas-unified`: one
`plugin.json` compiled to all targets, native MCP wiring, dedicated generate +
external-repo sync.

## What Kradle provides (grounded)
- **`kradle` CLI** (`@a5c-ai/kradle-cli` → bins `kradle`, `kradle-server`):
  `status, list, get, apply, delete, dispatch, …` over org-scoped K8s custom
  resources (repos, PRs, issues, pipelines, agent stacks, memory, policy, models).
- **Kradle MCP server** — `packages/kradle/cli/src/mcp-server.js` (real, today):
  ~14 tools — snapshot, list/get/apply/delete resource, dispatch agent, secrets,
  sync, conflict, audit.
- **HTTP API** — `kradle-server` (REST `/api/orgs/{org}/resources/*`).
- **Core controllers** (`@a5c-ai/kradle`): agent-dispatch, external-sync,
  virtual-model/model-route, memory (company brain), policy, artifact registry.
- **Web console** (`@a5c-ai/kradle-web`) — Next.js, includes the Atlas-driven
  agent-stack builder.

## What the plugin exposes
**Skills**
- `kradle` — what Kradle is and when to use it (host repos, dispatch agents,
  query company-brain memory, manage models/policy) + the MCP/CLI surface map.
- `kradle-dispatch` — dispatch an agent to a repo/PR with permission review +
  context bundling; read back the session.
- `kradle-memory` — query/update the company-brain knowledge before/after a task.

**Commands** (deterministic = CLI/MCP passthrough; multi-step = delegate to
`babysitter:babysit` with an `.a5c` process)
- `/kradle:dispatch` — dispatch an agent to a repo/PR (process: resolve stack →
  permission review → dispatch → stream session → summarize).
- `/kradle:repos` — forge ops: list/create repos, list PRs/issues, CI status.
- `/kradle:memory` — company-brain query/update.
- `/kradle:models` — model routing / virtual models (canary, A/B).
- `/kradle:policy` — governance: policy profiles/templates, permission sets.

**MCP** (existing — wire it natively)
- Wire the **existing** Kradle MCP server via the compiler's `mcpServers` field.
  Local stdio form: `command: npx, args: [-y, @a5c-ai/kradle-cli, kradle, mcp]`
  (or the hosted `kradle-server` URL via `type: remote` when deployed). Tools
  surface as `mcp__kradle__*` to the skills/commands.

**`.a5c` processes** (each iterative + TDD)
- `kradle-dispatch-task` — resolve stack → permission review → dispatch → session
  stream → PR/issue summary.
- `kradle-provision-repo` — create repo + branch protection + initial pipeline.
- `kradle-policy-apply` — author + validate + apply a policy profile.

## MCP wiring
Reuse the `extensions-adapter` `mcpServers` manifest field. Kradle's MCP is the
**existing** server, wired as **local stdio** (`command`/`args`) by default, with
an env-overridable remote URL (`KRADLE_MCP_URL`) for hosted clusters — mirroring
the `ATLAS_MCP_URL` pattern.

## Lifecycle (parity with atlas/babysitter)
- `plugin.json` with the full `targets` map; npm names `@a5c-ai/kradle-plugin-<harness>`
  (avoid colliding with existing `@a5c-ai/kradle*` packages — namespace deliberately).
- Dedicated `scripts/generate-kradle-plugins.mjs` + workflow, and (optional)
  `scripts/sync-kradle-plugin-repos.mjs` → `a5c-ai/kradle-<harness>` repos,
  mirroring the atlas pipeline.

## Highest-value first cut
1. Wire the **existing** Kradle MCP server (zero new server code) + the `kradle`
   skill — instant graph/forge/dispatch access.
2. `/kradle:dispatch` (process — the flagship flow).
3. `/kradle:repos` + `/kradle:memory` (MCP/CLI passthrough + skills).
Defer: models/policy/registry commands; web-console integration.

## Design principles
- Expose **high-level user flows**, not raw K8s CRUD ("dispatch an agent to
  review this PR", not "create an AgentDispatchRun with 14 fields").
- All ops are **org-scoped**; plugin user context = org context.
- Multi-step flows go through Babysitter; single resource ops go straight to the
  Kradle MCP/CLI.

## Open decisions
- Default MCP transport: bundle `@a5c-ai/kradle-cli` for local stdio vs require a
  hosted `kradle-server` + `KRADLE_MCP_URL`.
- Auth/org context injection (how the harness passes org + token to `kradle`).
- npm namespace to avoid `@a5c-ai/kradle*` collision (`kradle-plugin-<x>`?).
