# agent-mux-gui — Implementation Playbook

Status: draft · Last updated: 2026-04-12

This is the developer-facing guide for implementing **agent-mux-gui**: the full graphical control surface for `agent-mux`. For the architectural context behind each package, read the numbered specs `docs/20`–`docs/30`. This playbook tells you what to build, where, in what order.

agent-mux-gui is the umbrella for every non-CLI, non-TUI way to drive agent-mux:

- **gateway** — protocol server that exposes `AgentMuxClient` to remote clients
- **ui** — shared React/React-Native client library
- **webui** — browser app served by the gateway
- **mobile-ios-app / mobile-android-app** — phones
- **watch-watchos-app / watch-wearos-app** — smartwatches
- **tv-appletv-app / tv-androidtv-app** — TVs

Plus one core extension (runtime hooks) that makes per-run, in-process hook callbacks possible without touching the user's global harness config.

---

## 1. How to use this document

Work is organized into five milestones. Each milestone contains **functional tasks** with IDs `T{milestone}.{n}`. Each task has:

- **Spec**: the numbered spec that is the source of truth.
- **Depends on**: prerequisite task IDs.
- **Files**: absolute paths (from the repo root) the task creates or modifies.
- **Notes**: minimal pointers beyond the spec.
- **Done when**: functional completion criteria — what the code does, not how it was verified.

Only functional work is listed here. Lint rules, test suites, CI pipelines, coverage targets, and security reviews exist — they're in the repo's general contribution process, not in this task list. A task is functionally complete when the behavior described in "Done when" is real.

Tasks are sized to fit a single PR (~0.5–3 days of focused work). Split during sprint planning if larger.

---

## 2. Milestone roadmap

| M | Theme | Tasks | Unblocks |
|---|---|---|---|
| **M1** | Runtime hooks + gateway | 13 | everything |
| **M2** | webui (feature-parity with TUI) | 13 | M3, M4, M5 |
| **M3** | Phone apps (iOS + Android) | 14 | M4 |
| **M4** | Watches (watchOS + Wear OS) | 20 | — |
| **M5** | TVs (tvOS + Android TV) | 13 | — |

Tasks total: 73 functional deliverables.

Dependency chain is tightest through M1: `T1.1 → T1.2 → T1.4 → T1.10 → T1.13`. After M1, M2/M3 can run in parallel, and M4/M5 can run in parallel once M3's bridge tasks and M2's codegen land.

---

## 3. M1 — Runtime hooks + gateway

Goal: `amux gateway serve` runs a protocol server, a WebSocket client can connect, start a run against `claude-code`, stream events, and have an in-process `preToolUse` callback gate a tool call — without any mutation of `~/.claude/settings.json`.

### T1.1 — Add `RuntimeHooks` types to core

**Spec:** 21 · **Depends on:** —

**Files:**
- `packages/core/src/hooks/runtime.ts` (new)
- `packages/core/src/hooks/index.ts` (modify — add export)
- `packages/core/src/client/types.ts` (modify — add `hooks?: RuntimeHooks` to `RunOptions`)
- `packages/core/src/capabilities/types.ts` (modify — add `runtimeHooks: RuntimeHookCapabilities`)
- `packages/core/src/index.ts` (modify — re-export)

**Notes:** Types copy verbatim from spec 21. `HookContext.signal` is a standard `AbortSignal`. `HookContext.emit` is declared here but implemented in T1.2. Existing adapter fixtures need updating to declare `runtimeHooks: 'unsupported'` for every hook kind.

**Done when:** `RunOptions.hooks` is an optional field, `HookDecision` is a discriminated union usable from adapter code, and `AgentCapabilities.runtimeHooks` exists and is declared by every adapter.

---

### T1.2 — Wire runtime hooks into core's run pipeline

**Spec:** 21 · **Depends on:** T1.1

**Files:**
- `packages/core/src/hooks/dispatcher.ts` (new)
- `packages/core/src/hooks/context.ts` (new)
- `packages/core/src/client/run-pipeline.ts` (modify)

**Notes:** `HookDispatcher` holds a `RuntimeHooks` record and exposes `dispatch(kind, payload, signal)`. Blocking kinds return `Promise<HookDecision>`; non-blocking return `Promise<void>`. Throwing handlers become synthesized `deny`. `ctx.emit(event)` injects into the run's outbound event stream tagged `source: 'hook'`.

**Done when:** Non-blocking dispatch runs concurrently with event pumping. Blocking dispatch gates downstream delivery. Run abort propagates to in-flight handlers via `ctx.signal`. Synthetic hook-emitted events appear in the run's event stream with the correct source tag.

---

### T1.3 — Extend `harness-mock` with runtime-hook scenarios

**Spec:** 21 · **Depends on:** T1.2

**Files:**
- `packages/harness-mock/src/scenarios/runtime-hooks.ts` (new)
- `packages/harness-mock/src/scenarios/index.ts` (modify)
- `packages/harness-mock/src/mock-process.ts` (modify — pause/resume on hook dispatch)

**Notes:** Three scenarios: `runtimeHookAllowBash`, `runtimeHookDenyWrite`, `runtimeHookTimeout`. The mock adapter supports `preToolUse: 'blocking'` so gateway e2e tasks can drive the full pipeline without a real harness.

**Done when:** Scenarios are exported, documented in `docs/14-harness-mock.md`, and drivable via `amux run --use-mock-harness --scenario runtimeHookAllowBash` once the CLI glue lands in T1.12.

---

### T1.4 — Strategy A: claude-code adapter runtime hooks

**Spec:** 21 (Strategy A) · **Depends on:** T1.2

**Files:**
- `packages/adapters/src/claude-code/runtime-hooks/ephemeral-config.ts` (new)
- `packages/adapters/src/claude-code/runtime-hooks/hook-socket-server.ts` (new)
- `packages/adapters/src/claude-code/runtime-hooks/hook-shim.mjs.template` (new)
- `packages/adapters/src/claude-code/runtime-hooks/lifecycle.ts` (new)
- `packages/adapters/src/claude-code/adapter.ts` (modify)
- `packages/adapters/src/claude-code/capabilities.ts` (modify — `preToolUse: 'blocking'`)

**Notes:** Per-run temp dir at `${os.tmpdir()}/amux-run-${runId}/` contains: `hooks.sock` (unix domain socket, mode 0600; named pipe on Windows), `secret` (per-run shared secret, mode 0600), `hook-shim.mjs` (~40 LOC Node script), and `settings.json` pointing hook entries at `node ${tmpdir}/hook-shim.mjs <EventName>`. Claude Code spawned with `CLAUDE_CONFIG_DIR=${tmpdir}`.

Verify first whether `CLAUDE_CONFIG_DIR` fully replaces or merges with `~/.claude/settings.json`. Document the finding in the PR. If merge-only, use a minimal overlay and rely on Claude Code's defaults for everything else.

The shim reads hook JSON from stdin, connects to the socket, sends `{secret, event, payload}` framed, reads the decision frame, writes Claude Code's expected stdout format, exits with the expected code.

Cleanup: `process.on('exit')` handler plus a startup sweep of `amux-run-*` dirs older than 24h.

**Done when:** A run with runtime hooks attached creates an isolated temp dir, routes every claude-code hook event through the dispatcher, cleans up on exit (including after crash), and leaves `~/.claude/settings.json` unchanged (byte-for-byte, mtime unchanged). Ten concurrent runs with distinct hooks do not cross-talk.

---

### T1.5 — Strategy C: non-hookable adapters

**Spec:** 21 (Strategy C) · **Depends on:** T1.2

**Files:**
- `packages/adapters/src/shared/runtime-hooks-virtual.ts` (new)
- `packages/adapters/src/codex/adapter.ts` (modify)
- `packages/adapters/src/gemini/adapter.ts` (modify)
- `packages/adapters/src/cursor/adapter.ts` (modify)
- `packages/adapters/src/copilot/adapter.ts` (modify)
- `packages/adapters/src/hermes/adapter.ts` (modify)
- `packages/adapters/src/**/capabilities.ts` (modify each)

**Notes:** The virtual helper subscribes to the adapter's normalized event output and fires `postToolUse`, `stop`, `sessionStart`, `sessionEnd` as events flow past. `preToolUse` and `userPromptSubmit` fire fire-and-forget; decisions are ignored. Single shared helper, not per-adapter copies.

**Done when:** Every non-Strategy-A adapter wires the virtual helper and declares its honest `runtimeHooks` capability (expected: `preToolUse: 'nonblocking'` for all of them in v1).

---

### T1.6 — Gateway package skeleton

**Spec:** 22 · **Depends on:** T1.1

**Files:**
- `packages/gateway/package.json` (new) — `@a5c-ai/agent-mux-gateway`
- `packages/gateway/README.md` (new)
- `packages/gateway/tsconfig.json` (new)
- `packages/gateway/src/index.ts` (new — exports `createGateway`)
- `packages/gateway/src/config.ts` (new — `GatewayConfig` + defaults)
- `packages/gateway/src/logging.ts` (new)
- Root `package.json` (modify — workspaces)
- Root `tsconfig.json` (modify — references)

**Notes:** Unblocks parallel work on T1.7–T1.12. `createGateway(config): Gateway` returns an object with `start()` and `stop()`. Wiring happens in later tasks.

**Done when:** Package builds, is importable from other workspace packages, exposes `GatewayConfig` and `createGateway`.

---

### T1.7 — Token store

**Spec:** 22 (auth section) · **Depends on:** T1.6

**Files:**
- `packages/gateway/src/auth/tokens.ts` (new — `TokenStore` interface, `SqliteTokenStore`, `MemoryTokenStore`)
- `packages/gateway/src/auth/hashing.ts` (new — argon2id wrapper)

**Notes:** `TokenStore` exposes `create({name, ttl?}) → {id, plaintext, record}`, `verify(plaintext) → record | null`, `revoke(id)`, `list()`, `touch(id)`. Plaintext is 32 random bytes base64url-encoded, stored only as an argon2id hash. Default sqlite file: `${HOME}/.amux/gateway/tokens.db`. Constant-time verify.

**Done when:** `create` returns plaintext exactly once and subsequent calls cannot recover it. `verify` handles valid, revoked, expired, and unknown tokens correctly. `list` never returns hashes or plaintext.

---

### T1.8 — Protocol v1 frames

**Spec:** 22 (protocol section) · **Depends on:** T1.6

**Files:**
- `packages/gateway/src/protocol/v1.ts` (new — canonical type definitions)
- `packages/gateway/src/protocol/frames.ts` (new — zod schemas + encode/decode)
- `packages/gateway/src/protocol/errors.ts` (new — close codes, error types)
- `packages/gateway/src/protocol/schema.json` (new — generated)

**Notes:** `v1.ts` is the canonical source; `ui` copies it with CI drift detection (T2.1). Every frame from spec 22 as a discriminated union. `frames.ts` exposes `encode(frame) → string` / `decode(string) → Frame` with zod validation. Close codes: 4400 (invalid frame), 4401 (unauthorized), 4008 (backpressure), 4029 (rate limit).

**Done when:** Every frame type roundtrips through encode/decode. Malformed input throws typed errors with correct close codes. JSON schema is emitted for clients that want runtime validation without zod.

---

### T1.9 — WS server with auth

**Spec:** 22 · **Depends on:** T1.7, T1.8

**Files:**
- `packages/gateway/src/server.ts` (new — HTTP + WS host)
- `packages/gateway/src/auth/middleware.ts` (new)
- `packages/gateway/src/fanout/client-conn.ts` (new — per-connection state)

**Notes:** `hono` for HTTP, `ws` for WebSocket upgrade. On upgrade: check `Authorization: Bearer`; if absent, wait for `auth` frame; if first frame isn't `auth`, close 4401. `ClientConn` holds socket, token id, subscriptions, send buffer. Send buffer > 1024 pending frames → close 4008.

**Done when:** Default bind is 127.0.0.1:7878. Unauthenticated connections close within 5s. Authenticated connections receive a `hello` push with `{protocolVersions: ["1"], serverVersion, serverTime}`. `/healthz` responds without auth; `/api/v1/*` requires bearer.

---

### T1.10 — Run manager + event log + fanout + hook broker

**Spec:** 22 (run manager, event log, fanout, hook broker sections) · **Depends on:** T1.2, T1.9

**Files:**
- `packages/gateway/src/runs/manager.ts` (new)
- `packages/gateway/src/runs/types.ts` (new — `RunEntry`, `RunStatus`, `RunOwner`)
- `packages/gateway/src/runs/event-log.ts` (new)
- `packages/gateway/src/runs/event-log-index.ts` (new — sqlite index)
- `packages/gateway/src/runs/hook-broker.ts` (new)
- `packages/gateway/src/fanout/subscriber.ts` (new)

**Notes:** Manager owns a single `AgentMuxClient`, starts runs with translated `RunOptions`, wires runtime hooks that delegate to `HookBroker`, pumps events into `event-log` and `fanout`. Enforces `maxConcurrentRuns` (default 16). On shutdown, gracefully closes runs with 5s grace.

Event log: per-run `${eventLogDir}/${runId}.ndjson` with lines `{seq, ts, source, event}`, plus sqlite index for list queries. In-memory ring buffer of last N events per active run. On `subscribe sinceSeq`, replay from file then switch to live. Truncation at `maxEventsPerRun` (default 100_000) drops oldest 10% and emits a synthetic notification; stale subscribers get `error {code: 'seq_gone', tailSeq}`.

Fanout: `Map<runId, Set<ClientConn>>`. Each run's event pump iterates subscribers and enqueues. Slow subscriber backpressure handled by T1.9's send buffer.

Hook broker: `requestDecision(req)` generates `hookRequestId`, pushes `hook.request` to subscribers, races first valid response against timeout. Losing clients get `hook.resolved`. Zero subscribers → immediate fallback + synthetic notification in the run's event log. Hook decisions persisted as `hook_decision` events in the log.

**Done when:** `start`, `stop`, `get`, `list` all work. Backfill via `sinceSeq` delivers exactly `seq > sinceSeq` in order, transitions to live without gaps. Truncation emits synthetic events and returns `seq_gone` for stale subscribers. Hook broker: first valid response wins; timeout fires exactly once; zero-subscriber path works; `hook.resolved` delivered to losing clients.

---

### T1.11 — `amux gateway` CLI subcommands

**Spec:** 22 (CLI section) · **Depends on:** T1.7, T1.9

**Files:**
- `packages/cli/src/commands/gateway/serve.ts` (new)
- `packages/cli/src/commands/gateway/tokens.ts` (new — `list | create | revoke`)
- `packages/cli/src/commands/gateway/status.ts` (new)
- `packages/cli/src/commands/gateway/index.ts` (new — router)
- `packages/cli/src/index.ts` (modify — register subcommand)
- `packages/gateway/examples/systemd/amux-gateway.service` (new)
- `packages/gateway/examples/launchd/ai.a5c.amux.gateway.plist` (new)

**Notes:** `serve` reads `--config` or `~/.amux/gateway/config.yml`, runs until SIGTERM. `tokens create --qr` prints the token plaintext and a QR code via `qrcode-terminal` encoding `{url, token}` for phone pairing. `status` hits `/healthz`.

**Done when:** All four subcommands run end-to-end. Token create shows plaintext exactly once. Tokens list never prints plaintext. systemd and launchd templates documented in the gateway README.

---

### T1.12 — Core tool classifier

**Spec:** 23 (open question resolved here) · **Depends on:** T1.1

**Files:**
- `packages/core/src/tools/classify.ts` (new)
- `packages/core/src/tools/index.ts` (modify — export)

**Notes:** Pure function `classifyTool(agent, toolName, input?) → ToolClassification` with fields `{destructive, readOnly, network, longRunning, handlesSecrets}`. Table-driven by tool-name patterns per agent. Defaults: conservative (destructive: true, readOnly: false) for unknowns.

Unblocks: approvalPreview variants in T2.6, destructive-only gating in spec 25, TV redaction in specs 29/30.

**Done when:** Table covers every built-in tool across supported agents. `bash` + `rm` classifies as destructive. `read`, `grep`, `glob` classify as read-only. Unknown tool returns conservative classification.

---

### T1.13 — Serve webui from gateway (static host)

**Spec:** 22 (static section) · **Depends on:** T1.9

**Files:**
- `packages/gateway/src/static/webui-server.ts` (new)
- `packages/gateway/src/server.ts` (modify — wire static)

**Notes:** Static file server for `webuiRoot`. Defaults to `require.resolve('@a5c-ai/agent-mux-webui/dist')`. If webui package not installed, `/` returns 404 with a helpful message pointing at install instructions. Flags: `--webui /path`, `--no-webui`.

**Done when:** `amux gateway serve` serves the webui at `/` when the package is present. Override and disable flags work.

---

## 4. M2 — webui (TUI parity)

Goal: `http://localhost:7878/` in a browser is a full-featured agent-mux client matching `@a5c-ai/agent-mux-tui` feature-for-feature. This milestone also lands the `ui` package, which every React/RN surface downstream depends on.

### T2.1 — `ui` package skeleton + protocol sync

**Spec:** 23 · **Depends on:** T1.8

**Files:**
- `packages/ui/package.json` (new) — `@a5c-ai/agent-mux-ui`
- `packages/ui/tsconfig.json` (new)
- `packages/ui/src/index.ts` (new)
- `packages/ui/src/protocol/v1.ts` (new — copy from gateway)
- `packages/ui/src/protocol/schema.json` (new — committed codegen target)
- `scripts/sync-protocol.ts` (new — AST-compares gateway's and ui's v1.ts)
- Root `package.json` + `tsconfig.json` — register workspace

**Notes:** Protocol sharing strategy: **copy with drift detection**, not runtime dependency. Rationale: the ui package is consumed from React Native contexts where depending on a Node-side gateway package is awkward. `sync-protocol.ts` AST-compares and fails on drift.

**Done when:** Package builds. `@a5c-ai/agent-mux-ui/protocol` imports resolve. `npm run sync-protocol` exits 0 on match, nonzero on drift.

---

### T2.2 — `GatewayClient` with reconnect and transports

**Spec:** 23 (client section) · **Depends on:** T2.1

**Files:**
- `packages/ui/src/client/GatewayClient.ts` (new)
- `packages/ui/src/client/transports/ws-browser.ts` (new)
- `packages/ui/src/client/transports/ws-react-native.ts` (new)
- `packages/ui/src/client/transports/ws-node.ts` (new)
- `packages/ui/src/client/backoff.ts` (new)
- `packages/ui/src/client/errors.ts` (new)

**Notes:** Methods: `connect`, `close`, `request<T,R>`, `subscribeRun`, `subscribeSession`, `on`. Request correlation via frame `id` with a `Map<id, {resolve, reject, timer}>`, 10s default request timeout. Reconnect: exponential backoff 500ms → 30s with jitter. Queued idempotent frames replayed after reconnect (subscribes yes, starts no).

Transports are thin — each exports `createWebSocket(url, token)` returning a uniform interface. Browser uses native `WebSocket` (token in first `auth` frame since headers can't be set). RN uses RN's `WebSocket`. Node uses `ws`.

**Done when:** Request/response correlation works under concurrency. Reconnect replays subscriptions with latest `sinceSeq`. Transport swap is a one-line change. Zero `window`/`global` references outside of transport modules.

---

### T2.3 — Zustand store + slices

**Spec:** 23 (store section) · **Depends on:** T2.2

**Files:**
- `packages/ui/src/store/index.ts` (new — factory)
- `packages/ui/src/store/slices/connection.ts`
- `packages/ui/src/store/slices/agents.ts`
- `packages/ui/src/store/slices/sessions.ts`
- `packages/ui/src/store/slices/runs.ts`
- `packages/ui/src/store/slices/events.ts`
- `packages/ui/src/store/slices/hooks.ts`
- `packages/ui/src/store/selectors.ts`

**Notes:** One store per `GatewayClient`. The `events` slice holds `Record<runId, EventBuffer>` where `EventBuffer` is SoA for efficient rendering with O(log n) merge by `seq`. Memoized selectors:

- `selectVisibleEventNodes(runId)` — coalesces text deltas into blocks and groups `tool_call_ready` + `tool_result` into cards.
- `selectPendingHookRequests(runId?)`
- `selectCostTotals(runId)` — folds cost events.

**Done when:** Idempotent merge (replaying events leaves state unchanged). Out-of-order events ordered by seq on insert. Selectors memoized (reference-equal across unchanged calls). No cross-slice writes.

---

### T2.4 — React hooks

**Spec:** 23 (hooks section) · **Depends on:** T2.3

**Files:**
- `packages/ui/src/hooks/GatewayProvider.tsx`
- `packages/ui/src/hooks/useGateway.ts`
- `packages/ui/src/hooks/useConnection.ts`
- `packages/ui/src/hooks/useAgents.ts`
- `packages/ui/src/hooks/useSessions.ts`
- `packages/ui/src/hooks/useSession.ts`
- `packages/ui/src/hooks/useRun.ts`
- `packages/ui/src/hooks/useRunEvents.ts`
- `packages/ui/src/hooks/useStartRun.ts`
- `packages/ui/src/hooks/useSendInput.ts`
- `packages/ui/src/hooks/useStopRun.ts`
- `packages/ui/src/hooks/useHookRequests.ts`
- `packages/ui/src/hooks/useCostTotals.ts`

**Notes:** Each hook is a thin wrapper over store selectors + client methods. No local state beyond transient UI concerns. Provider injects store + client via React context. Hooks throw clear errors when used outside a provider.

**Done when:** Every hook from spec 23 exists and is React 18 strict-mode safe.

---

### T2.5 — Primitive components + theme

**Spec:** 23 (primitives section) · **Depends on:** T2.1

**Files:**
- `packages/ui/src/components/primitives/Text.tsx`
- `packages/ui/src/components/primitives/Button.tsx`
- `packages/ui/src/components/primitives/ScrollContainer.tsx`
- `packages/ui/src/components/primitives/Card.tsx`
- `packages/ui/src/components/primitives/theme.ts`
- `packages/ui/src/theme/light.ts`
- `packages/ui/src/theme/dark.ts`
- `packages/ui/src/theme/tokens.ts`

**Notes:** React Native `StyleSheet` + token theme via context. Components render in the browser via `react-native-web` without change. Light and dark themes switchable at runtime.

**Done when:** Primitives render in both RN and react-native-web targets. Theme switch at runtime updates all primitives.

---

### T2.6 — Tool-call card renderers

**Spec:** 23 (event-cards section) · **Depends on:** T2.5, T1.12

**Files:**
- `packages/ui/src/components/event-cards/TextDeltaBubble.tsx`
- `packages/ui/src/components/event-cards/ThinkingBubble.tsx`
- `packages/ui/src/components/event-cards/ToolCallCard.tsx`
- `packages/ui/src/components/event-cards/ToolResultCard.tsx`
- `packages/ui/src/components/event-cards/renderers/bash.tsx`
- `packages/ui/src/components/event-cards/renderers/edit.tsx`
- `packages/ui/src/components/event-cards/renderers/write.tsx`
- `packages/ui/src/components/event-cards/renderers/read.tsx`
- `packages/ui/src/components/event-cards/renderers/grep.tsx`
- `packages/ui/src/components/event-cards/renderers/glob.tsx`
- `packages/ui/src/components/event-cards/renderers/web-fetch.tsx`
- `packages/ui/src/components/event-cards/renderers/web-search.tsx`
- `packages/ui/src/components/event-cards/renderers/generic.tsx`
- `packages/ui/src/components/event-cards/registry.ts`

**Notes:** `ToolCallRenderer` interface with `match`, `compact`, `expanded`, `approvalPreview`. Registry supports priority order + `generic` fallback. Built-ins register via `registerToolCallRenderer`. Renderers consume `ToolClassification` from T1.12 to style destructive vs read-only differently.

**Done when:** Registry matches by priority, falls back to generic, supports runtime additions. Every built-in renderer has compact + expanded + approvalPreview variants. Rendering is pure (no store reads, no side effects).

---

### T2.7 — Composed components

**Spec:** 23 · **Depends on:** T2.6

**Files:**
- `packages/ui/src/components/HookApprovalPrompt.tsx`
- `packages/ui/src/components/InputBar.tsx`
- `packages/ui/src/components/CostMeter.tsx`
- `packages/ui/src/components/EventList.tsx`
- `packages/ui/src/components/SessionListItem.tsx`
- `packages/ui/src/components/AgentPicker.tsx`
- `packages/ui/src/components/ModelPicker.tsx`
- `packages/ui/src/components/RunStatusBadge.tsx`
- `packages/ui/src/components/ConnectionBanner.tsx`

**Notes:** `EventList` uses `@shopify/flash-list` on native, `react-window` on web, picked via conditional import. Exposes controlled scroll position so parent can follow-tail or pin. `InputBar` takes `onSubmit` only; voice button is a platform-injected slot. `HookApprovalPrompt` renders the matching renderer's `approvalPreview`, shows a countdown ring, and exposes `onAllow`, `onDeny`, `onModify`.

**Done when:** `EventList` renders 1000+ events smoothly. `HookApprovalPrompt` correctly dispatches to the matching renderer. `InputBar` hides voice button slot when unset.

---

### T2.8 — Composed screens

**Spec:** 23 (screens section) · **Depends on:** T2.4, T2.7

**Files:**
- `packages/ui/src/screens/AgentsScreen.tsx`
- `packages/ui/src/screens/SessionListScreen.tsx`
- `packages/ui/src/screens/SessionDetailScreen.tsx`
- `packages/ui/src/screens/RunScreen.tsx`
- `packages/ui/src/screens/NewRunScreen.tsx`
- `packages/ui/src/screens/HookInboxScreen.tsx`
- `packages/ui/src/screens/SettingsScreen.tsx`

**Notes:** Screens are composition-only: hooks + components, no new logic. Each screen exports both the composed default and its building blocks so TV apps can rebuild layouts without duplicating logic. Navigation is parent-injected (no hard-coded router).

**Done when:** Every screen from spec 23 exists and renders against a mock gateway in both RN and DOM.

---

### T2.9 — Swift + Kotlin codegen

**Spec:** 23 (codegen section) · **Depends on:** T2.1

**Files:**
- `packages/ui/src/codegen/swift-types.ts` (new — `ts-morph`-driven generator)
- `packages/ui/src/codegen/kotlin-types.ts` (new)
- `packages/ui/build/schema/swift/AmuxProtocol.swift` (new — generated, committed)
- `packages/ui/build/schema/kotlin/AmuxProtocol.kt` (new — generated, committed)
- `packages/ui/package.json` (modify — add `codegen` script)

**Notes:** Parse `protocol/v1.ts` with `ts-morph`. Emit `Codable` Swift structs and `@Serializable` Kotlin data classes. Discriminated unions → Swift enums with associated values / Kotlin sealed classes. Preserve names. Output committed to the repo with drift detection; native watch/TV builds consume the committed files without needing a TS toolchain.

**Done when:** Every type in `protocol/v1.ts` has a Swift and Kotlin equivalent. Generated files compile in a reference Xcode/Android Studio build.

---

### T2.10 — `webui` package skeleton

**Spec:** 24 · **Depends on:** T2.8

**Files:**
- `packages/webui/package.json` (new) — `@a5c-ai/agent-mux-webui`
- `packages/webui/vite.config.ts`
- `packages/webui/tsconfig.json`
- `packages/webui/index.html`
- `packages/webui/src/main.tsx`
- `packages/webui/src/App.tsx`
- `packages/webui/src/providers/GatewayProvider.tsx`
- `packages/webui/src/providers/ThemeProvider.tsx`
- `packages/webui/src/providers/NotificationProvider.tsx`
- `packages/webui/src/router.tsx`
- `packages/webui/src/styles/global.css`
- `packages/webui/public/favicon.svg`

**Notes:** Vite + `react-native-web` alias so ui package RN components render in the browser. `react-router-dom` for routing. No third-party analytics, fonts, or trackers. Content-Security-Policy meta tag restricts to `self` + wss to the gateway host.

**Done when:** `vite build` produces `dist/` under 2 MB gzipped. `vite dev` hot-reloads against a locally-running gateway. RN components render correctly through react-native-web.

---

### T2.11 — webui pages

**Spec:** 24 · **Depends on:** T2.10

**Files:**
- `packages/webui/src/pages/LoginPage.tsx`
- `packages/webui/src/pages/HomePage.tsx`
- `packages/webui/src/pages/AgentsPage.tsx`
- `packages/webui/src/pages/SessionsPage.tsx`
- `packages/webui/src/pages/SessionDetailPage.tsx`
- `packages/webui/src/pages/RunPage.tsx`
- `packages/webui/src/pages/NewRunPage.tsx`
- `packages/webui/src/pages/HookInboxPage.tsx`
- `packages/webui/src/pages/SettingsPage.tsx`

**Notes:** Each page imports the ui screen and wraps it in web-specific chrome. `LoginPage` validates the token by connecting and calling `agents.list`; on success, stores in `localStorage.amuxToken` with an in-UI warning about the tradeoff. HomePage is a dashboard with three panels: active runs, recent sessions, agents.

**Done when:** Full login flow works against a real gateway. Deep links (`/runs/:runId`, `/sessions/:agent/:sessionId`) open the right page preselected. Unauthenticated access redirects to `/login`.

---

### T2.12 — webui shell (sidebar, topbar, command palette, hotkeys)

**Spec:** 24 · **Depends on:** T2.11

**Files:**
- `packages/webui/src/shell/Sidebar.tsx`
- `packages/webui/src/shell/TopBar.tsx`
- `packages/webui/src/shell/CommandPalette.tsx`
- `packages/webui/src/web-only/keyboard.ts`
- `packages/webui/src/web-only/clipboard.ts`
- `packages/webui/src/web-only/desktop-notifications.ts`

**Notes:** Command palette via `cmdk` or hand-rolled: jump to session, start run, toggle theme, revoke token. Hotkeys match the TUI where possible — full mapping in `packages/webui/PARITY.md`. Desktop notifications use `Notification.requestPermission()`; clicking a notification focuses the tab and opens the hook inbox. Multi-tab cooperation: two tabs share state via the gateway, approving a hook in one dismisses it in the other via `hook.resolved`.

**Done when:** All TUI hotkeys work. Command palette opens with `cmd+k`. Browser notifications fire for hook requests when the tab is backgrounded. Multi-tab: hook approval in one tab dismisses prompt in the other.

---

### T2.13 — webui pairing QR endpoint

**Spec:** 22, 24 · **Depends on:** T1.11

**Files:**
- `packages/webui/src/pages/PairDevicePage.tsx` (new)
- `packages/gateway/src/pairing/short-code.ts` (new)
- `packages/gateway/src/protocol/v1.ts` (modify — add `pairing.register` and `pairing.consume` frames)
- `packages/ui/src/protocol/v1.ts` (mirror)

**Notes:** One-stop page in the webui that generates a short-lived (5-min) pairing code + QR encoding `{url, token}` for phones to scan. Also supports the Android TV 8-digit short-code flow used in spec 30. Gateway holds a short-lived in-memory `Map<code, {url, token, expiresAt}>`, single-use consume.

**Done when:** A user generates a pairing code or QR from the webui, a phone scans it or a TV enters the code, the pairing consumes atomically, and the device is authenticated. Codes expire in 5 minutes.

---

## 5. M3 — Phone apps

Goal: a user pairs iPhone or Android with the gateway via QR or short-code, sees live runs, approves hook requests from the lock screen when the phone is backgrounded.

### iOS branch

#### T3.1 — iOS app scaffold (Expo prebuild)

**Spec:** 25 · **Depends on:** T2.9

**Files:**
- `packages/mobile-ios-app/package.json`
- `packages/mobile-ios-app/app.json`
- `packages/mobile-ios-app/src/index.tsx`
- `packages/mobile-ios-app/src/App.tsx`
- `packages/mobile-ios-app/assets/icon.png`
- `packages/mobile-ios-app/assets/splash.png`
- `packages/mobile-ios-app/ios/**` (generated by `expo prebuild`, committed)

**Done when:** `npx expo run:ios` boots to a blank App on simulator. `xcodebuild` succeeds with no native warnings. Bundle ID and signing configured for local dev.

---

#### T3.2 — Keychain token store + provider

**Spec:** 25 · **Depends on:** T3.1

**Files:**
- `packages/mobile-ios-app/src/native/keychain.ts`
- `packages/mobile-ios-app/src/providers/TokenStoreProvider.tsx`

**Notes:** `react-native-keychain` with `accessible: whenUnlockedThisDeviceOnly` + biometric gate on read. Item key `amux.gateway.<host>`. Access group `group.ai.a5c.amux` shared with watchOS and tvOS targets.

**Done when:** Token persists across restarts. Biometric prompt on read. Access group writable for later targets.

---

#### T3.3 — GatewayProvider + connection lifecycle

**Spec:** 25 · **Depends on:** T2.4, T3.2

**Files:**
- `packages/mobile-ios-app/src/providers/GatewayProvider.tsx`

**Notes:** Reads token from keychain, creates `GatewayClient` with `ws-react-native` transport, manages foreground/background lifecycle. Surfaces connection state via `ConnectionBanner`.

**Done when:** Connection survives foreground/background transitions with automatic reconnect. `ConnectionBanner` reflects state.

---

#### T3.4 — Onboarding + QR scan

**Spec:** 25 · **Depends on:** T3.3, T2.13

**Files:**
- `packages/mobile-ios-app/src/screens/OnboardingScreen.tsx`
- `packages/mobile-ios-app/src/screens/ScanQRScreen.tsx`
- `packages/mobile-ios-app/src/navigation/RootNavigator.tsx`

**Notes:** First-launch lands on OnboardingScreen. Scan reads `{url, token}` from the pairing QR (either direct-token QR or T2.13 pairing-code QR that first resolves via `pairing.consume`). Validates via probe `agents.list` call.

**Done when:** QR scan completes end-to-end: scan → validate → store token → route to HomeScreen.

---

#### T3.5 — Home + Hook inbox screens

**Spec:** 25 · **Depends on:** T3.4

**Files:**
- `packages/mobile-ios-app/src/screens/HomeScreen.tsx`
- `packages/mobile-ios-app/src/screens/HookInboxScreen.tsx`
- `packages/mobile-ios-app/src/navigation/tabs.tsx`

**Notes:** HomeScreen wraps the ui screens in iOS tab chrome (Runs / Sessions / Agents / Inbox / Settings). HookInboxScreen adds swipe-to-approve / swipe-to-deny with haptics, and taps open RunScreen scrolled to the relevant tool call.

**Done when:** Live run streaming visible on HomeScreen. Swipe-to-approve dispatches `runs.respondToHook`. Haptics fire on approve/deny.

---

#### T3.6 — WatchConnectivity bridge + projection

**Spec:** 25 (watch bridge section) · **Depends on:** T3.5

**Files:**
- `packages/mobile-ios-app/ios/AgentMux/WatchConnectivityBridge.swift`
- `packages/mobile-ios-app/ios/AgentMux/WatchConnectivityBridge.m`
- `packages/mobile-ios-app/src/native/watchBridge.ts`
- `packages/mobile-ios-app/src/providers/WatchBridgeProvider.tsx`
- `packages/mobile-ios-app/src/projection/watchState.ts`

**Notes:** Swift bridge exposes `sendToWatch` and forwards inbound via `RCTEventEmitter`. TS side is a typed facade. `projection/watchState.ts` computes slim state + diffs, budgeted to ~4 KB per update. Gracefully drops when no watch is paired.

**Done when:** Bridge is callable from JS. Projection diffs are bounded in size. No-watch-paired case is a silent drop, not a crash.

---

#### T3.7 — APNs push + gateway webhook-out

**Spec:** 25 · **Depends on:** T3.3

**Files:**
- `packages/mobile-ios-app/ios/AgentMux/PushHandler.swift`
- `packages/mobile-ios-app/src/native/push.ts`
- `packages/mobile-ios-app/src/providers/NotificationProvider.tsx`
- `packages/gateway/src/notifications/webhook-out.ts` (new)
- `packages/gateway/src/notifications/types.ts` (new)
- `packages/gateway/examples/push-relay/` (new — reference Node+apn relay)

**Notes:** Push delivery resolution for v1: gateway emits outbound webhooks to a user-configurable URL; users run their own APNs relay (or a provided example relay) that holds the APNs key. Gateway never holds push credentials. Webhook payload: `{type: 'hook.request', runId, hookRequestId, kind, compact, pushTargets}`. Reference relay in `packages/gateway/examples/push-relay/` runs in Docker.

iOS app registers for silent push (`content-available: 1`). On delivery, `PushHandler.swift` wakes the JS layer, which opens a short WS, responds to the hook, closes.

**Done when:** Silent push reaches the app when backgrounded. Short-lived WS responds to hook within 30s window. Example relay runs in a container with documented setup.

---

#### T3.8 — Background hook response flow

**Spec:** 25 · **Depends on:** T3.6, T3.7

**Files:**
- `packages/mobile-ios-app/src/providers/BackgroundHookHandler.tsx`
- `packages/mobile-ios-app/ios/AgentMux/AppDelegate.mm` (modify — background modes, content-available)

**Notes:** Full flow: silent push → `AppDelegate` → JS handler in ~30s window → `GatewayClient` short-connect → `runs.respondToHook` → close. Fallback: gateway timeout fires with its configured default if the JS layer can't respond. Notification action buttons (Allow/Deny) wired so the user can approve without opening the app.

**Done when:** Background wake-to-response latency is ~p95 < 10s on a real device. Notification actions respond without app launch. Foreground path uses existing connection.

---

### Android branch

#### T3.9 — Android app scaffold

**Spec:** 26 · **Depends on:** T2.9

**Files:**
- `packages/mobile-android-app/package.json`
- `packages/mobile-android-app/app.json`
- `packages/mobile-android-app/src/index.tsx`
- `packages/mobile-android-app/src/App.tsx`
- `packages/mobile-android-app/android/**` (generated)

**Done when:** `npx expo run:android` boots on emulator. `./gradlew assembleDebug` succeeds.

---

#### T3.10 — Keystore token store + provider

**Spec:** 26 · **Depends on:** T3.9

**Files:**
- `packages/mobile-android-app/src/native/keystore.ts`
- `packages/mobile-android-app/src/providers/TokenStoreProvider.tsx`
- `packages/mobile-android-app/android/app/src/main/java/ai/a5c/amux/SecureTokenStore.kt`

**Notes:** `EncryptedSharedPreferences` with `MasterKey` requiring device authentication. `android:allowBackup="false"` so token doesn't enter cloud backups.

**Done when:** Token persists across restarts, protected by device auth.

---

#### T3.11 — GatewayProvider + connection lifecycle

**Spec:** 26 · **Depends on:** T3.10, T2.4

**Files:**
- `packages/mobile-android-app/src/providers/GatewayProvider.tsx`

**Notes:** Same structure as T3.3. Android network security config restricts cleartext to localhost only.

**Done when:** Connection lifecycle matches iOS behavior on Android.

---

#### T3.12 — Onboarding + QR scan

**Spec:** 26 · **Depends on:** T3.11, T2.13

**Files:**
- `packages/mobile-android-app/src/screens/OnboardingScreen.tsx`
- `packages/mobile-android-app/src/screens/ScanQRScreen.tsx`
- `packages/mobile-android-app/src/navigation/RootNavigator.tsx`

**Done when:** Same onboarding flow as iOS reaches HomeScreen after a valid scan.

---

#### T3.13 — Home + Hook inbox screens

**Spec:** 26 · **Depends on:** T3.12

**Files:**
- `packages/mobile-android-app/src/screens/HomeScreen.tsx`
- `packages/mobile-android-app/src/screens/HookInboxScreen.tsx`
- `packages/mobile-android-app/src/navigation/tabs.tsx`

**Notes:** Material-flavored variants of the ui screens' list items and sheets.

**Done when:** Live run streaming visible. Hook inbox supports swipe interactions with haptics.

---

#### T3.14 — Wearable Data Layer bridge + projection

**Spec:** 26 · **Depends on:** T3.13

**Files:**
- `packages/mobile-android-app/android/app/src/main/java/ai/a5c/amux/WearableDataLayerBridge.kt`
- `packages/mobile-android-app/src/native/wearBridge.ts`
- `packages/mobile-android-app/src/providers/WearBridgeProvider.tsx`
- `packages/mobile-android-app/src/projection/wearState.ts`

**Notes:** `MessageClient` for latency-sensitive messages (hook requests/decisions/short inputs) + `DataClient` for state projection at `/amux/state`. Projection shape mirrors iOS; Kotlin types from T2.9.

**Done when:** Bridge callable from JS. Projection diffs bounded ~4 KB.

---

#### T3.15 — FCM push handler

**Spec:** 26 · **Depends on:** T3.11

**Files:**
- `packages/mobile-android-app/android/app/src/main/java/ai/a5c/amux/AmuxFirebaseMessagingService.kt`
- `packages/mobile-android-app/src/native/push.ts`
- `packages/mobile-android-app/src/providers/NotificationProvider.tsx`

**Notes:** Data-only FCM messages. Either dispatches to running RN host via headless task, or starts a short-lived foreground service with `Notification.Action` buttons (Allow/Deny) whose `PendingIntent` handlers open a WS, respond, exit. Uses the same gateway webhook-out plumbing from T3.7.

**Done when:** FCM payload reaches the app in all states (foreground, background, killed). Notification actions respond without opening the app when feasible.

---

#### T3.16 — Background hook response flow

**Spec:** 26 · **Depends on:** T3.14, T3.15

**Files:**
- `packages/mobile-android-app/src/providers/BackgroundHookHandler.tsx`
- `packages/mobile-android-app/android/app/src/main/AndroidManifest.xml` (modify — battery optimization, service flags)

**Notes:** Request `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` on first launch with clear explanation. Graceful fallback when denied (informational pushes still work, hook timeouts may fire). Foreground service path for long-lived hook timeouts.

**Done when:** Background hook response works with doze mode engaged. Battery optimization exemption requested and respected. Foreground service path engages for long timeouts.

---

## 6. M4 — Watches

Goal: receive a hook request on the wrist, see tool name and one-line preview, tap Allow or Deny, the run continues — without taking the phone out of a pocket.

### watchOS branch

#### T4.1 — watchOS app scaffold

**Spec:** 27 · **Depends on:** T2.9, T3.6

**Files:**
- `packages/watch-watchos-app/AgentMuxWatch.xcodeproj/**`
- `packages/watch-watchos-app/AgentMuxWatch/AppDelegate.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/AgentMuxWatchApp.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/ContentView.swift`
- `packages/watch-watchos-app/package.json` (marker)

**Notes:** Minimum target watchOS 10 to stay on WidgetKit for complications. Xcode project in monorepo. Real iOS app lives in spec 25 / T3.*; this target is a minimal container.

**Done when:** Builds in Xcode 15+. Boots on watchOS simulator.

---

#### T4.2 — `WatchPhoneChannel` + `TransportRouter`

**Spec:** 27 · **Depends on:** T4.1, T3.6

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Transport/WatchPhoneChannel.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Transport/TransportRouter.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Transport/DirectGatewayClient.swift` (stub)
- `packages/watch-watchos-app/AgentMuxWatchApp/Generated/AmuxProtocol.swift` (copy of T2.9 output)

**Notes:** `WatchPhoneChannel` conforms to `WCSessionDelegate`. Decodes incoming `WatchInboundMessage` via `JSONDecoder` against the generated protocol types. Outgoing: `sendMessage` when reachable, `transferUserInfo` when not. `TransportRouter` picks phone vs direct-WS based on `WCSession.isReachable` + user setting.

**Done when:** Phone channel sends/receives test messages in the simulator against a stub iOS app side. Router defaults to phone.

---

#### T4.3 — Store + reducers + event buffer

**Spec:** 27 · **Depends on:** T4.2

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/State/Store.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/State/Projections.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/State/EventBuffer.swift`

**Notes:** Combine-based store. Pure reducers; side effects via middleware calling `TransportRouter`. Event buffer caps at 100 nodes per run. Slice structure mirrors the ui package.

**Done when:** Reducers are pure. State diff apply is idempotent. Event buffer cap enforced.

---

#### T4.4 — `RunsListView` + `RunDetailView`

**Spec:** 27 · **Depends on:** T4.3

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/RunsListView.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/RunDetailView.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/CostChip.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/ConnectionBadge.swift`

**Notes:** RunsListView: complication-friendly list with agent glyph, one-line summary, cost chip, pending-hook badge. RunDetailView: vertical ScrollView (Digital Crown) of `EventRow`s. Bottom toolbar: dictation, quick replies, stop.

**Done when:** Both views render against a seeded store with snapshot coverage at 40/44/49mm. Crown scrolls correctly.

---

#### T4.5 — Event row views + per-tool compact renderers

**Spec:** 27 · **Depends on:** T4.4

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/EventRowViews/TextDeltaRow.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/EventRowViews/ThinkingRow.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/EventRowViews/ToolCallRow.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/EventRowViews/ToolResultRow.swift`

**Notes:** TextDelta: coalesced block, 8-line cap, tap expands. Thinking: collapsed default. ToolCall: tool name + one-line arg summary, tap opens modal. ToolResult: brief summary, tap for modal.

**Done when:** All four row types render; tap-to-expand opens full-screen modal.

---

#### T4.6 — `HookApprovalView`

**Spec:** 27 · **Depends on:** T4.4

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/HookApprovalView.swift`

**Notes:** Full-screen modal triggered by incoming hook request. Shows tool name, compact preview (1–3 lines, renderer-specific), Allow/Deny/See-more buttons, countdown ring. Haptics: `.notification(.warning)` on display, `.success`/`.error` on decision.

**Done when:** Hook approval round-trip: phone forwards `hookRequest` → view displays → user taps Allow/Deny → `respondHook` sent → view dismisses.

---

#### T4.7 — `HookInboxView`

**Spec:** 27 · **Depends on:** T4.6

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Views/HookInboxView.swift`

**Notes:** Cross-run list of pending hook requests, newest on top, tap opens approval view.

**Done when:** Inbox reflects all pending hooks across runs. Tap routes correctly.

---

#### T4.8 — Rich notifications with action handlers

**Spec:** 27 · **Depends on:** T4.6

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Notifications/RichNotification.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Notifications/NotificationCategories.swift`

**Notes:** Register category `HOOK_REQUEST` with Allow / Deny / Open actions. Action handlers fire `respondHook` without launching the app. Short-look shows tool name; long-look shows compact renderer output.

**Done when:** Allow action from notification dispatches decision without app launch. Long-look preview renders compact view.

---

#### T4.9 — Dictation + quick replies

**Spec:** 27 · **Depends on:** T4.4

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Input/DictationInput.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Input/QuickReplies.swift`
- `packages/watch-watchos-app/AgentMuxWatchApp/Input/Scribble.swift`

**Notes:** Dictation via `SFSpeechRecognizer`. Quick replies synced from phone via `UserDefaults(suiteName: "group.ai.a5c.amux")`. Scribble as fallback.

**Done when:** Dictation result appends to focused run input. Quick reply taps dispatch `sendInput`.

---

#### T4.10 — Direct-WS fallback

**Spec:** 27 · **Depends on:** T4.2

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Transport/DirectGatewayClient.swift` (complete)

**Notes:** `URLSessionWebSocketTask`. Loads credentials from shared keychain group. Used when phone unreachable > 10s and user opted in. Aggressive idle timeout (90s no-traffic → close). Returns to phone proxy within 2s of phone reachable.

**Done when:** Fallback engages on airplane-mode phone, reverts when phone is reachable again. Opt-in setting respected.

---

#### T4.11 — Complications

**Spec:** 27 · **Depends on:** T4.3

**Files:**
- `packages/watch-watchos-app/AgentMuxWatchApp/Notifications/ComplicationProvider.swift`

**Notes:** Corner/Inline complication: pending-hook count. Circular: active run count. Rectangular: last event from most recent run. Refresh on store updates that change relevant projection fields.

**Done when:** All three complication families populate correctly and refresh on state change.

---

### Wear OS branch

#### T4.12 — Wear OS app scaffold

**Spec:** 28 · **Depends on:** T2.9, T3.14

**Files:**
- `packages/watch-wearos-app/settings.gradle.kts`
- `packages/watch-wearos-app/build.gradle.kts`
- `packages/watch-wearos-app/app/build.gradle.kts`
- `packages/watch-wearos-app/app/src/main/AndroidManifest.xml`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/MainActivity.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/AmuxWearApp.kt`
- `packages/watch-wearos-app/package.json` (marker)

**Notes:** Kotlin 2.x, AGP latest, Jetpack Compose for Wear, target Wear OS 4+.

**Done when:** `./gradlew assembleDebug` succeeds. App boots on Wear OS emulator.

---

#### T4.13 — `PhoneChannel` + `TransportRouter`

**Spec:** 28 · **Depends on:** T4.12, T3.14

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/transport/PhoneChannel.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/transport/TransportRouter.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/transport/DirectGatewayClient.kt` (stub)
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/generated/AmuxProtocol.kt` (copy of T2.9 output)

**Notes:** `MessageClient` for low-latency messages, `DataClient` for state snapshots at `/amux/state`. Router defaults to phone; falls back after 10s unreachable.

**Done when:** Phone channel sends/receives via emulator. Router picks correctly.

---

#### T4.14 — Store + reducers

**Spec:** 28 · **Depends on:** T4.13

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/state/Store.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/state/Projections.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/state/EventBuffer.kt`

**Notes:** `StateFlow` + reducer pattern. Pure reducers. Event buffer capped at 100 nodes per run.

**Done when:** Reducers pure, diffs idempotent, cap enforced.

---

#### T4.15 — `RunsListScreen` + `RunDetailScreen`

**Spec:** 28 · **Depends on:** T4.14

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/RunsListScreen.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/RunDetailScreen.kt`

**Notes:** `ScalingLazyColumn` for both. Rotary input for scroll. Swipe-to-dismiss for back. Long-press for contextual menu (stop run, copy last text).

**Done when:** Both screens render. Rotary input scrolls. Swipe-to-dismiss works.

---

#### T4.16 — Row composables

**Spec:** 28 · **Depends on:** T4.15

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/rows/TextDeltaRow.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/rows/ThinkingRow.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/rows/ToolCallRow.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/rows/ToolResultRow.kt`

**Done when:** Four row composables render; tap-to-expand opens full-screen dialog.

---

#### T4.17 — `HookApprovalScreen`

**Spec:** 28 · **Depends on:** T4.15

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/HookApprovalScreen.kt`

**Notes:** Full-screen, radial countdown indicator around the edge. Distinct haptic patterns for display vs allow vs deny (`VibrationEffect.EFFECT_HEAVY_CLICK` / `EFFECT_CLICK`).

**Done when:** Full hook-approval round-trip works from phone through to `respondHook`.

---

#### T4.18 — `HookInboxScreen`

**Spec:** 28 · **Depends on:** T4.17

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/HookInboxScreen.kt`

**Done when:** Pending-hook list across runs; tap opens approval screen.

---

#### T4.19 — Notification action handling

**Spec:** 28 · **Depends on:** T4.17

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/ui/NotificationReceiver.kt`
- `packages/watch-wearos-app/app/src/main/AndroidManifest.xml` (modify — channel + receiver)

**Notes:** Notification channel `hook_requests` with `IMPORTANCE_HIGH`. `NotificationCompat.Action` buttons (Allow/Deny) wired via `PendingIntent` to a `BroadcastReceiver` that dispatches through `TransportRouter` without activity launch.

**Done when:** Approve/deny from notification action dispatches decision without opening the app.

---

#### T4.20 — Dictation, quick replies, tiles, complications, direct-WS fallback

**Spec:** 28 · **Depends on:** T4.14, T4.19

**Files:**
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/input/Dictation.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/input/QuickReplies.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/tiles/RunsTile.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/tiles/HookInboxTile.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/complications/PendingHooksComplication.kt`
- `packages/watch-wearos-app/app/src/main/kotlin/ai/a5c/amux/wear/transport/DirectGatewayClient.kt` (complete)

**Notes:** Dictation via `RemoteInput`. Quick replies synced from phone via `DataClient` at `/amux/quick-replies`. RunsTile shows active-run count + top-1 summary; HookInboxTile shows pending-hook count + top tool name. Complications via `ComplicationDataSourceService`. Direct-WS via OkHttp WebSocket, with foreground service notification while active.

**Done when:** Dictation returns text. Quick replies sync from phone. Both tiles populate and refresh. Both complications populate. Direct-WS engages as fallback and shows foreground-service notification while active.

---

## 7. M5 — TVs

Goal: open the amux dashboard on a TV, see live runs stream with 24pt+ typography from across the room. Pair-debugging and demos get a first-class surface.

### tvOS branch

#### T5.1 — Apple TV app scaffold

**Spec:** 29 · **Depends on:** T2.9, T3.1

**Files:**
- `packages/tv-appletv-app/package.json`
- `packages/tv-appletv-app/app.json`
- `packages/tv-appletv-app/src/index.tsx`
- `packages/tv-appletv-app/src/App.tsx`
- `packages/tv-appletv-app/ios/**` (generated, committed, tvOS target)

**Notes:** Spike `react-native-tvos` vs upstream RN tvOS first — pick whichever builds cleanly with Expo, document the decision in the PR.

**Done when:** Builds and boots on tvOS simulator.

---

#### T5.2 — Keychain access-group sharing

**Spec:** 29 · **Depends on:** T5.1, T3.2

**Files:**
- `packages/tv-appletv-app/src/providers/TokenStoreProvider.tsx`
- `packages/tv-appletv-app/ios/AmuxTV/AmuxTV.entitlements`

**Notes:** Same `group.ai.a5c.amux` access group as iOS and watchOS. Token written by iOS phone app is readable by tvOS app with no extra pairing step.

**Done when:** TV app reads the phone-written token with no setup. QR fallback flow exists for the no-phone case.

---

#### T5.3 — Focus manager + Siri Remote handling

**Spec:** 29 · **Depends on:** T5.1

**Files:**
- `packages/tv-appletv-app/src/focus/FocusManager.ts`
- `packages/tv-appletv-app/src/focus/useTVRemote.ts`
- `packages/tv-appletv-app/src/components/FocusableCard.tsx`

**Notes:** `useFocusable` wraps `TouchableOpacity` with `hasTVPreferredFocus` + `onFocus`/`onBlur`. `useTVRemote` exposes `TVEventHandler` events as a typed hook.

**Done when:** Siri Remote navigation traverses focusable cards. Focus state observable via hook.

---

#### T5.4 — Pairing screen

**Spec:** 29 · **Depends on:** T5.2, T2.13

**Files:**
- `packages/tv-appletv-app/src/screens/PairingScreen.tsx`

**Notes:** If keychain has a token, auto-skip to dashboard. Else show QR (resolved via `pairing.consume` from T2.13) or a fallback short-code for the no-phone case.

**Done when:** Both keychain auto-pair and QR fallback complete the auth flow.

---

#### T5.5 — Dashboard + Run + Session list screens

**Spec:** 29 · **Depends on:** T5.3, T2.8

**Files:**
- `packages/tv-appletv-app/src/screens/DashboardScreen.tsx`
- `packages/tv-appletv-app/src/screens/RunScreen.tsx`
- `packages/tv-appletv-app/src/screens/SessionListScreen.tsx`
- `packages/tv-appletv-app/src/screens/SettingsScreen.tsx`
- `packages/tv-appletv-app/src/components/BigCostChip.tsx`
- `packages/tv-appletv-app/src/components/RemoteShortcutBar.tsx`
- `packages/tv-appletv-app/src/theme/tv.ts`

**Notes:** Dashboard: focusable grid of up to 4 run cards (agent glyph, last 3 events, cost chip, pending-hook pulse). RunScreen: 60% event list + 40% sidebar (cost history, tool-call index, status). TV theme bumps body to 24pt, spacing scale 2x. Tool cards default to expanded renderer because screen has the space.

**Done when:** Dashboard renders 4+ active runs smoothly. RunScreen typography readable from 3m. Siri Remote navigation works on all screens.

---

#### T5.6 — Quick replies + dictation

**Spec:** 29 · **Depends on:** T5.5

**Files:**
- `packages/tv-appletv-app/src/components/DictationButton.tsx`

**Notes:** Siri Remote mic button triggers tvOS system dictation into focused field. Quick replies synced from phone via keychain group.

**Done when:** Dictation result appears in focused field. Quick replies list visible.

---

#### T5.7 — Opt-in hook approval

**Spec:** 29 · **Depends on:** T5.5

**Files:**
- `packages/tv-appletv-app/src/screens/HookInboxScreen.tsx`

**Notes:** Off by default with clear warning in settings. When enabled, remote can approve/deny from focused hook card.

**Done when:** Setting toggles behavior. When off, TV is read-only for hooks. When on, approval round-trip works.

---

### Android TV branch

#### T5.8 — Android TV app scaffold

**Spec:** 30 · **Depends on:** T2.9, T3.9

**Files:**
- `packages/tv-androidtv-app/package.json`
- `packages/tv-androidtv-app/app.json`
- `packages/tv-androidtv-app/src/index.tsx`
- `packages/tv-androidtv-app/src/App.tsx`
- `packages/tv-androidtv-app/android/app/src/main/AndroidManifest.xml` (Leanback launcher, `uses-feature touchscreen=false`)
- `packages/tv-androidtv-app/android/app/src/main/res/drawable-xhdpi/app_banner.png`

**Done when:** Builds and boots on Android TV emulator with Leanback launcher entry.

---

#### T5.9 — Token store

**Spec:** 30 · **Depends on:** T5.8

**Files:**
- `packages/tv-androidtv-app/src/providers/TokenStoreProvider.tsx`

**Notes:** `expo-secure-store` / `EncryptedSharedPreferences` with master key requiring device unlock where available. No shared group with phone — pairing goes through the gateway's short-code flow from T2.13.

**Done when:** Token persists; pairing flow stores it.

---

#### T5.10 — Focus + D-pad handling

**Spec:** 30 · **Depends on:** T5.8

**Files:**
- `packages/tv-androidtv-app/src/focus/FocusManager.ts`
- `packages/tv-androidtv-app/src/focus/useDpadRemote.ts`
- `packages/tv-androidtv-app/src/components/FocusableCard.tsx`

**Notes:** RN `nextFocusUp/Down/Left/Right` props set explicitly on focusable elements. Explicit wiring more reliable than heuristic traversal for static layouts.

**Done when:** D-pad traversal follows expected focus graph. OK/back/play-pause events reach the hook.

---

#### T5.11 — Pairing screen (short-code flow)

**Spec:** 30 · **Depends on:** T5.10, T2.13

**Files:**
- `packages/tv-androidtv-app/src/screens/PairingScreen.tsx`

**Notes:** Display 8-digit code. User enters it in the phone's "Pair TV" flow. Phone uploads `{code, gatewayUrl, token}` to gateway via `pairing.register`. TV polls `pairing.consume`. Codes expire 5 minutes.

**Done when:** Full flow: TV shows code → user enters in phone → TV auto-completes → routes to dashboard.

---

#### T5.12 — Dashboard + Run + Session list screens

**Spec:** 30 · **Depends on:** T5.10, T2.8

**Files:**
- `packages/tv-androidtv-app/src/screens/DashboardScreen.tsx`
- `packages/tv-androidtv-app/src/screens/RunScreen.tsx`
- `packages/tv-androidtv-app/src/screens/SessionListScreen.tsx`
- `packages/tv-androidtv-app/src/screens/SettingsScreen.tsx`
- `packages/tv-androidtv-app/src/components/LeanbackRow.tsx`
- `packages/tv-androidtv-app/src/components/BigCostChip.tsx`
- `packages/tv-androidtv-app/src/components/RemoteShortcutBar.tsx`
- `packages/tv-androidtv-app/src/theme/tv.ts`

**Notes:** Dashboard uses leanback-style horizontal rows (active runs / recent sessions / pending hooks). RunScreen same 60/40 split as tvOS. 24sp+ body typography. Rows: Up/Down between rows, Left/Right within row.

**Done when:** Dashboard renders leanback rows with D-pad navigation. RunScreen typography readable from 3m. Back returns to dashboard.

---

#### T5.13 — Quick replies + Gboard voice

**Spec:** 30 · **Depends on:** T5.12, T2.13

**Files:**
- `packages/tv-androidtv-app/src/components/VoiceInputButton.tsx`
- `packages/tv-androidtv-app/src/providers/UserPrefsSync.tsx`

**Notes:** Gboard voice triggered by focused `TextInput` on the voice button. Quick replies + templates synced via gateway's user-prefs endpoint (added in T2.13's v1.ts modifications for cross-cutting support).

**Done when:** Voice input returns text. Quick replies sync from phone via gateway. Templates sync via gateway.

---

#### T5.14 — Opt-in hook approval

**Spec:** 30 · **Depends on:** T5.12

**Files:**
- `packages/tv-androidtv-app/src/screens/HookInboxScreen.tsx`

**Notes:** Off by default, same reasoning as tvOS. When enabled, dashboard hook toast supports approval via D-pad.

**Done when:** Setting toggles behavior; approval round-trip works when enabled.

---

## 8. Task index

Full flat list for tracker import:

```
M1 — Runtime hooks + gateway
  T1.1   Add RuntimeHooks types to core
  T1.2   Wire runtime hooks into core run pipeline
  T1.3   Extend harness-mock with runtime-hook scenarios
  T1.4   Strategy A: claude-code adapter runtime hooks
  T1.5   Strategy C: non-hookable adapters
  T1.6   Gateway package skeleton
  T1.7   Token store
  T1.8   Protocol v1 frames
  T1.9   WS server with auth
  T1.10  Run manager + event log + fanout + hook broker
  T1.11  amux gateway CLI subcommands
  T1.12  Core tool classifier
  T1.13  Serve webui from gateway (static host)

M2 — webui
  T2.1   ui package skeleton + protocol sync
  T2.2   GatewayClient with reconnect and transports
  T2.3   Zustand store + slices
  T2.4   React hooks
  T2.5   Primitive components + theme
  T2.6   Tool-call card renderers
  T2.7   Composed components
  T2.8   Composed screens
  T2.9   Swift + Kotlin codegen
  T2.10  webui package skeleton
  T2.11  webui pages
  T2.12  webui shell (sidebar, topbar, command palette, hotkeys)
  T2.13  webui pairing QR endpoint

M3 — Phone apps
  T3.1   iOS app scaffold
  T3.2   iOS keychain token store + provider
  T3.3   iOS GatewayProvider + connection lifecycle
  T3.4   iOS onboarding + QR scan
  T3.5   iOS Home + Hook inbox screens
  T3.6   iOS WatchConnectivity bridge + projection
  T3.7   iOS APNs push + gateway webhook-out
  T3.8   iOS background hook response flow
  T3.9   Android app scaffold
  T3.10  Android keystore token store + provider
  T3.11  Android GatewayProvider + connection lifecycle
  T3.12  Android onboarding + QR scan
  T3.13  Android Home + Hook inbox screens
  T3.14  Android Wearable Data Layer bridge + projection
  T3.15  Android FCM push handler
  T3.16  Android background hook response flow

M4 — Watches
  T4.1   watchOS app scaffold
  T4.2   WatchPhoneChannel + TransportRouter
  T4.3   watchOS store + reducers + event buffer
  T4.4   RunsListView + RunDetailView
  T4.5   Event row views + per-tool compact renderers (watchOS)
  T4.6   HookApprovalView (watchOS)
  T4.7   HookInboxView (watchOS)
  T4.8   Rich notifications with action handlers (watchOS)
  T4.9   Dictation + quick replies (watchOS)
  T4.10  Direct-WS fallback (watchOS)
  T4.11  Complications (watchOS)
  T4.12  Wear OS app scaffold
  T4.13  Wear PhoneChannel + TransportRouter
  T4.14  Wear store + reducers
  T4.15  RunsListScreen + RunDetailScreen (Wear)
  T4.16  Row composables (Wear)
  T4.17  HookApprovalScreen (Wear)
  T4.18  HookInboxScreen (Wear)
  T4.19  Notification action handling (Wear)
  T4.20  Dictation, quick replies, tiles, complications, direct-WS fallback (Wear)

M5 — TVs
  T5.1   Apple TV app scaffold
  T5.2   Keychain access-group sharing (tvOS)
  T5.3   Focus manager + Siri Remote handling
  T5.4   Pairing screen (tvOS)
  T5.5   Dashboard + Run + Session list screens (tvOS)
  T5.6   Quick replies + dictation (tvOS)
  T5.7   Opt-in hook approval (tvOS)
  T5.8   Android TV app scaffold
  T5.9   Android TV token store
  T5.10  Focus + D-pad handling (Android TV)
  T5.11  Pairing screen short-code flow (Android TV)
  T5.12  Dashboard + Run + Session list screens (Android TV)
  T5.13  Quick replies + Gboard voice (Android TV)
  T5.14  Opt-in hook approval (Android TV)
```

Total: **73 functional tasks**.