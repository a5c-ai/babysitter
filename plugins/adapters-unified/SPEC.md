# adapters-unified — plugin spec

A unified plugin that exposes the **adapters** fabric (formerly *agent-mux*,
`packages/adapters/*`) to end users from inside any AI coding harness. Same
unified-plugin mechanics as `atlas-unified`: one `plugin.json` compiled to all
targets, native MCP wiring, dedicated generate + external-repo sync.

`adapters` is not one thing — it is an **adapter fabric that translates at many
seams/layers**. The plugin's job is to make those seams usable: dispatch agents,
proxy providers, manage sessions/MCP/hooks/tools, compile cross-harness plugins,
normalize CI triggers, and run a remote gateway — from a single surface.

---

## 0. The adapter seams (the "many adapting types across layers")

| Seam / layer | What it adapts | Implementations (grounded) |
|---|---|---|
| **Harness / codec** (`codecs`) | One unified run → N agent CLIs/SDKs/sockets | ~17–20 adapters: claude (CLI), claude-agent-sdk, claude-remote (WS), codex, codex-sdk, codex-ws, gemini, copilot, cursor, opencode, opencode-http, pi, pi-sdk, oh-my-pi, openclaw, hermes, qwen, droid, amp, babysitter, agentmux-remote. Base classes: `BaseAgentAdapter` (CLI spawn), `BaseRemoteAdapter` (WS/HTTP), `BaseProgrammaticAdapter` (SDK). |
| **Transport / provider proxy** (`transport` + `proxy`) | Agent-native API ⇄ any LLM provider | 5 codecs: `AnthropicCodec`, `OpenAiChatCodec`, `OpenAiResponsesCodec`, `GoogleCodec`, `BedrockConverseCodec`. Exposed transports: anthropic, openai-chat, openai-responses, google, bedrock-converse, azure-foundry, passthrough. Target providers (18+): Anthropic, OpenAI, Google/Vertex, Bedrock, OpenRouter, Groq, Fireworks, Together, DeepSeek, Mistral, Cerebras, SambaNova, NVIDIA NIM, Perplexity, Cohere, Ollama, LM Studio, vLLM. |
| **Tools** (`tools`) | Tool schemas + dispatch across formats | `ToolRegistry`, `ToolDispatcher`, `convertTools`/`toToolDescriptor`, `McpBridge`, `HooksMuxToolHookBridge`, approval/execution policies, cost hints. |
| **Hooks / comm** (`hooks`, `@a5c-ai/comm-adapter`) | Per-harness hook protocol ⇄ canonical events | hooks-adapter-core (canonical schemas, session store, merge engine, discovery) + 12 per-harness hook adapters (claude, codex, cursor, gemini, copilot, pi, oh-my-pi, opencode, openclaw, hermes, antigravity, genty). Bin `a5c-hooks-adapter`. |
| **Tasks = breakpoints + subtasks** (`tasks`) | A run's blocking question/approval ⇄ an async, routed, signable **breakpoint/subtask** that humans *or* agents *or* trackers answer | Full subsystem — see **§1b**. 5 backends, ~20 MCP tools, Ed25519-signed answers, routing strategies, escalation/SLA, responder-loop, `BreakpointMuxInteractionProvider`. |
| **Config / auth / host** (`config`) | Install + auth + host detection per agent | `install/config/auth/detect-host/adapters` commands; OAuth / API-key / keychain detection; host-harness signal mapping; profiles & workspaces. |
| **Launch** (`launch`) | Run request → spawned harness + proxy wiring | `launchCommand`, `resolveLaunchPlan` (LaunchPlan/ProxyPlan), `BridgeHookEmulator`, completion-engine selection. |
| **Extensions** (`extensions`) | One `plugin.json` → all harness plugin formats | the compiler we extended for atlas (compile/validate/diff/init/list-targets + per-target MCP emission). |
| **Triggers** (`triggers`) | CI/webhook events → normalized trigger | backends: github, gitlab, bitbucket, generic-webhook; `enrich`/`evaluate`; GitHub Action. |
| **Gateway** (`gateway`) | Local runtime → remote HTTP/WS/SSE + Kanban UI | Hono server: runs/sessions/workspaces/agents/tokens/pairing REST, WS event stream, SSE, full Kanban backlog/automation API, embedded WebUI. |
| **Observability** (`observability`) | Runtime events → logs/OTel/cost | switchable Pino+OTel vs simple; `createCostSummary`, `filterEvents`. |
| **Invocation / remote** (`cli remote`, `docker`) | Where the agent runs | local / docker / ssh / k8s. |
| **Mock** (`harness-mock`) | Deterministic fake harness for tests | `--scenario`, `--list`, fail/delay injection. |

The core runtime `@a5c-ai/comm-adapter` ties these together: `createClient()` →
`client.run(RunOptions)` streaming ~67 event types, plus managers for sessions,
profiles, adapters, models, config, auth, plugins, hooks, workspaces, kanban.

---

## 1. Full grounded surface (what already exists)

### `adapters` CLI (bin `adapters`, `@a5c-ai/adapters`)
`run` · `adapters` (list/detect/detect-all) · `agent` (list/add/remove/where/agents) ·
`auth` (login/logout/refresh/status) · `config` (get/set/view/edit/validate/paths/init) ·
`detect-host` · `doctor` · `gateway` (serve / status / tokens list|create|revoke) ·
`hooks` (discover/list/add/remove/set/handle) · `install`·`uninstall`·`update` ·
`launch` · `mcp` (list/install/uninstall) · `models` (list/info/refresh/current/set) ·
`plugin` (list/install/enable/disable/marketplace) ·
`profiles` (list/show/set/delete/apply) · `remote` (install/update — ssh|docker|k8s|local) ·
`sessions` (list/show/search/export/cost) · `skill` (list/add/remove/where/agents) ·
`tui` · `workspaces` (list/create/archive/cleanup/recover/delete/sync-sessions).
`run` flags include `--agent --model --stream --thinking-* --max-turns --session/--fork
--mcp-server --skill --profile --yolo --use-mock-harness …`.

### Other bins
- `adapters-extensions` / `extensions-adapter`: `compile · validate · diff · init · list-targets`.
- `adapters-tasks` / `tasks-adapter`: `ask · responders · breakpoints · server · responder-loop · auth · tasks · templates · rules`.
- `adapters-transport-proxy` / `adapters-proxy` (Python): run the provider proxy (`--target-provider --target-model --transport --port --auth-token …`).
- `adapters-triggers` / `triggers-adapter`: `enrich · evaluate`.
- `adapters-harness-mock` / `mock-harness`: scenario replayer.
- `a5c-hooks-adapter`: per-harness hook dispatch.

### Gateway HTTP/WS/SSE (`adapters gateway serve`)
REST `/api/v1/*`: `bootstrap/login`, `tokens` (list/create/revoke), `dispatches`|`runs`
(list/create/get/stop), `sessions` (list/create/get/full/messages), `workspaces`
(create/archive/cleanup/recover/delete), `agents`, `pairing` (register/consume).
WS `/upgrade`: auth, subscribe/unsubscribe (run & session), `session.start`,
`session.message`, `run.stop`, `hook.decision`, `agents.list`, pairing.
Kanban API (`/api/backlog`, `/api/automations`, `/api/workspaces`, `/api/reviews`,
`/api/runs/:id/events`, `/api/runs/:id/tasks/:effect/approve`, `/api/stream` SSE,
`/api/settings/agent-configuration`, `/api/settings/mcp-servers`, task-tags,
dispatch-context-labels). Embedded **Kanban WebUI**.

### Transport proxy routes (`adapters-transport-proxy`)
`/v1/messages` (Anthropic), `/v1/chat/completions` + `/v1/responses` (OpenAI, +WS),
`/v1beta/models/*:generateContent` + Vertex paths (Google), `/converse` (Bedrock),
`/models/chat/completions` (Azure Foundry), `/passthrough/*`, `/v1/count_tokens`,
`/v1/models`, `/health`, `/metrics`, `/cache/stats`. Emits `x-babysitter-*` cost
feedback headers; bearer/`x-api-key` auth.

### Existing skills / processes
`packages/adapters/skills/integrate-harness` (+ ~30 processes under
`packages/adapters/processes/`: model-catalog, interactive-mode, docker-e2e-matrix,
observability-integration, advanced-uis-*, babysitter-parity, provider-adapter-tech-debt…).

---

## 1b. Tasks = breakpoints + subtasks (the `@a5c-ai/tasks-adapter` / "BMUX" subsystem)

The single most under-represented seam. A **breakpoint** here is not an inline,
synchronous `ctx.breakpoint()` halt — it is an **async, decoupled, multiplexed
question/approval/subtask** that is routed to one or more *responders* (human,
agent, tracker, or internal), answered (optionally **cryptographically signed**),
and resolved — possibly across projects/repos and via pluggable backends. A
**subtask/todo** is the same record with task-management fields (priority,
assignee, dependencies, comments, history, audit, SLA, metrics). One model,
two framings: *"answer this question"* and *"do this subtask."*

**Lifecycle:** `open → route → claim → answer → (sign) → resolve`.
Statuses: pending, routed, claimed, answered, completed, in-progress, blocked,
escalated, expired, cancelled. Strategies: `single`, `first-response-wins`
(default), `collect-all`, `quorum`.

### Backends (pluggable, routed by domain/tag rules)
- **git-native** (default, full-featured) — `.breakpoints/*.json`; all
  capabilities (search, bulk, assign, comments, history, metrics, export, forms,
  escalation, **signing**).
- **github-issues** — breakpoints ⇄ issues, answers ⇄ comments.
- **external-tracker** — Jira / Linear / generic-REST, with field+status mapping
  and inbound/outbound/bidirectional sync + conflict strategy.
- **server** — remote HTTP "breakpoints-pro" service (Breakpoint/Responder ⇄
  Question/Expert); `DEFAULT_BMUX_SERVER_URL`, bearer auth.
- **adapters (agentmux-responder)** — routes a breakpoint to an *agent* via
  `adapters.run()` and captures its output as the answer (agent answers the human's question).

Routing: `.a5c/routing.json` `{ defaultBackend, routes:[{domains?,tags?,backend,backendConfig}] }`,
first-match-wins. Responder profiles in `.a5c/responder/*.json` (type, domains,
tags, capabilities, SLA, publicKeyFingerprint, adapter/model hints).

### MCP server (`createBreakpointMcpServer` / `startHttpBreakpointMcpServer`) — ~20 tools
- **Submitter**: `ask_breakpoint`, `check_breakpoint_status`, `list_breakpoints`,
  `create_todo`, `create_task`, `assign_task`, `search_tasks`, `answer_breakpoint`,
  `verify_breakpoint_answer`, `cancel_breakpoint`, `add_comment`,
  `add_comment_to_breakpoint`, `bulk_update_tasks`, `task_stats`, `export_tasks`,
  `escalate`, `escalate_breakpoint`.
- **Responder**: `list_responders`, `claim_breakpoint`, `poll_breakpoints`.
- **Resource**: `breakpoint://{id}` (subscribable, `resourceUpdated` notifications).

### CLI (`adapters-tasks`) — full tree
- `ask` (submit a breakpoint; `--strategy --wait --open-browser …`).
- `breakpoints` list/search/assign/reassign/close/approve/pending/answer/status/poll.
- `tasks` (subtask mgmt) search/assign/close/comment/approve/cancel/transition/**bulk**/stats/export.
- `responders` list/search/show/stats · `responder-loop` (`--responder --interval --once` poller daemon).
- `templates` list/show/create · `rules` (routing) list/add/remove.
- `server start` (stdio MCP) · `auth` login/logout/status + `keygen`/`key-push`/`keys` (Ed25519).

### Signing (proven answers)
Ed25519 keypairs (`auth keygen`); `signAnswer`/`verifyAnswer` over canonical
fields (id, breakpointId, responderId, text, approved, confidence, answeredAt);
trusted-key store + rotation. `verify_breakpoint_answer` proves an answer came
from the claimed responder — high-trust approvals.

### Escalation / SLA / forms / metrics
Escalation chains (`afterMs` steps → email/slack/discord/webhook), SLA
(`responseDueAt`/`completionDueAt`/`breached`), structured answer **forms**, and
metrics (`task_stats`: byStatus/byPriority/avg response+completion times).

### Babysitter integration (key)
`BreakpointMuxInteractionProvider` bridges a babysitter run's `ctx.breakpoint()`
to this subsystem: instead of halting inline, the breakpoint is submitted to a
backend, routed, and awaited — turning a process pause into a routed,
answerable-by-anyone (human *or* agent) **subtask**. Returns the babysitter-shaped
`{ approved, response, feedback, respondedBy }`. This is how a babysitter run can
fan its approvals out to people or other agents.

> **Scope note:** this subsystem is dense enough (20+ CLI subcommands, ~20 MCP
> tools, 5 backends, signing, routing) to stand as its own **`tasks-unified`**
> plugin. Default recommendation: ship it as a first-class **section** of
> adapters-unified (skills/commands/MCP below); split into its own plugin if the
> breakpoint/subtask audience diverges from the dispatch/proxy audience.

---

## 2. What the plugin exposes

### Skills
- **`adapters`** — the fabric map: which seam solves which need (dispatch vs proxy
  vs hooks vs tools vs tasks vs compile vs triggers vs gateway) and the CLI/SDK
  entrypoint for each. The "front door" skill.
- **`adapters-dispatch`** — run/fan-out tasks across harnesses; pick agent/model,
  sessions/profiles, approval mode, mock for dry-runs.
- **`adapters-proxy`** — stand up / target the transport proxy: pick exposed
  transport (anthropic/openai-chat/responses/google/bedrock/azure/passthrough) and
  target provider/model; cost headers; when to proxy (provider swap, cost routing,
  local models via Ollama/vLLM/LM Studio).
- **`adapters-plugin-author`** — author a unified `plugin.json` and
  compile/validate/diff to all targets.
- **`adapters-tasks`** — breakpoints + subtasks: when to open a breakpoint vs a
  subtask, choose a backend (git-native / github-issues / jira-linear / server /
  agent-responder), pick a routing strategy + responders, sign answers, and (for
  agents) run the responder loop to answer assigned breakpoints.
- **`adapters-gateway`** — run the remote gateway + Kanban; tokens/pairing; connect
  a client.
- **`adapters-breakpoints`** — turn a blocking question/approval into a routed,
  signable **breakpoint/subtask** (see §1b): pick a backend (git-native /
  github-issues / Jira-Linear / server / agent-responder), a strategy, and
  responders; answer/claim/verify; wire it into a babysitter run via
  `BreakpointMuxInteractionProvider`.

### Commands (deterministic = CLI passthrough; multi-step = `babysitter:babysit` + an `.a5c` process)
- `/adapters:run` — dispatch a task to a chosen harness.
- `/adapters:fanout` — one prompt across N harnesses → collect → diff/score (process).
- `/adapters:proxy` — launch/target the provider proxy (exposed transport + target provider).
- `/adapters:sessions` — list/show/search/export/cost.
- `/adapters:mcp` — manage MCP servers per agent.
- `/adapters:hooks` — discover/list/add/remove per-harness hooks.
- `/adapters:ask` — open a **breakpoint** (question/approval), route it, await an answer (`adapters-tasks ask`).
- `/adapters:respond` — claim + answer assigned breakpoints, optionally **signed** (responder side; `responder-loop --once`).
- `/adapters:subtasks` — create/search/assign/comment/transition/**bulk**/stats subtasks (`adapters-tasks tasks …`).
- `/adapters:compile-plugin` — validate → compile all targets → `--verify` → (optional) sync (process).
- `/adapters:gateway` — serve the gateway + tokens (CLI passthrough).
- `/adapters:triggers` — enrich/evaluate a CI/webhook event.
- `/adapters:doctor` — host/auth/config diagnostics.

### MCP (mix of existing + new)
- **Existing, wire it now**: the **tasks/breakpoint MCP server**
  (`createBreakpointMcpServer`) — surfaces todo/breakpoint create/search/assign/
  comment/escalate tools (`mcp__adapters_tasks__*`).
- **New (optional, high value)**: a thin **`adapters` stdio MCP** exposing the run
  fabric as tools — `run_agent`, `list_agents`, `list/resume/export_session`,
  `manage_mcp_server`, `compile_plugin`, `proxy_status`. Wired via the compiler's
  `mcpServers` field (local `command`/`args`, e.g. `npx -y @a5c-ai/adapters adapters mcp`).
- The **gateway HTTP API** is the remote/browser equivalent for clients that prefer REST/WS.

### `.a5c` processes (each iterative + TDD)
- `adapters-fanout-run` — fan a prompt across harnesses, collect, compare/score.
- `adapters-compile-plugin` — validate → compile all targets → verify → sync.
- `adapters-proxy-route` — bring up the proxy targeting a provider, smoke-test a run through it, report cost.
- `adapters-onboard-harness` — integrate a new harness (reuses `skills/integrate-harness`).
- `adapters-tasks-route` — open a breakpoint, route to a backend, await/collect answers.

---

## 3. MCP wiring (proxy-aware)
Reuse the `extensions-adapter` `mcpServers` manifest field (supports `type: remote`+`url`
and local `command`/`args`). For adapters the servers are **local stdio**
(tasks MCP today; the optional `adapters` MCP next). Note the proxy interplay: when a
dispatched run is itself proxied, the proxy emits `x-babysitter-*` cost headers — the
plugin's observability/cost surfacing should read those.

## 4. Lifecycle (parity with atlas/babysitter)
- `plugin.json` full `targets` map; npm names **`@a5c-ai/adapters-plugin-<harness>`**
  (deliberately namespaced to avoid colliding with the many existing `@a5c-ai/*-adapter`
  / `@a5c-ai/adapters*` packages).
- Dedicated `scripts/generate-adapters-plugins.mjs` + workflow, and (optional)
  `scripts/sync-adapters-plugin-repos.mjs` → `a5c-ai/adapters-<harness>` repos —
  mirroring the atlas generate + external-sync pipeline.

## 5. Highest-value first cut
1. `adapters` + `adapters-dispatch` skills, `/adapters:run` + `/adapters:fanout` (CLI passthrough + 1 process).
2. `/adapters:proxy` + `adapters-proxy` skill (the multi-provider proxy is the standout capability).
3. `/adapters:compile-plugin` (the cross-harness compiler).
4. Wire the **tasks/breakpoint MCP** (zero new server code).
Defer: the new `adapters` stdio MCP, gateway/Kanban deep integration, triggers Action authoring, transport codec internals.

## 6. Open decisions
- npm namespace to avoid `@a5c-ai/adapters*` / `*-adapter` collisions.
- Build the `adapters` stdio MCP now vs CLI-passthrough first (tasks MCP ships either way).
- Bundle the `adapters` + `adapters-proxy` (Python) CLIs as deps vs assume installed (proxy needs Python ≥3.11).
- How much of the gateway/Kanban to surface in-plugin vs leave to the web UI.
- Provider-proxy credential handling (where target-provider keys come from).
