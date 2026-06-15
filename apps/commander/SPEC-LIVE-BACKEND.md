# SPEC-LIVE-BACKEND — RealBackend over Gateway Protocol v1

Status: authoritative implementation spec. Implement verbatim.
Scope: `apps/commander` only. Additive. The deterministic mock remains the default.

This spec adds a **live** `CommanderBackend` implementation (`RealBackend`) that speaks
`@a5c-ai/adapters-gateway` **gateway protocol v1** (WebSocket) + the gateway **REST**
surface, behind the existing `CommanderBackend` interface. The UI is not touched. The
mock (`src/backend/mock/mockBackend.ts`) stays byte-identical and remains the default
boot path; the real path is selected only by explicit config.

It is the companion to README §"Swapping the mock for the real backend" and inherits its
documented **v1-protocol gaps** verbatim (board verbs, release/editor verbs,
`hook.decision.optionId`).

---

## 0. Source-of-truth files (read before implementing)

| File | What it pins |
|---|---|
| `src/backend/types.ts` | The `CommanderBackend` interface being implemented (8 methods). |
| `src/contracts/gateway-protocol.ts` | `ClientFrame` / `ServerFrame` discriminated unions (protocol v1, exact mirror), `RunEntry` / `SessionEntry` / `AgentSummary` REST entry types. |
| `src/backend/mock/mockBackend.ts` | Reference implementation of the interface (`connect`/`disconnect`/`send`/`onFrame` + REST mirrors) and the sim-local board-verb channel. RealBackend mirrors its **public** shape. |
| `src/App.tsx` | The boot seam (lines 91/93/170/184). Where mock-vs-real is selected. |
| `src/game/store.ts` | `bindBackendToStore(store, backend: MockBackend)` (line 1649) — currently typed to `MockBackend`; see §7 boot-seam note. |
| `README.md` | §"Swapping the mock for the real backend" + the v1-protocol gap list this spec mirrors. |

All wire types are **already mirrored** in `src/contracts/`. RealBackend imports them by
name; it MUST NOT redefine or paraphrase any frame/entry shape.

---

## 1. The `CommanderBackend` interface (the only UI seam)

The UI depends on **exactly** this interface and nothing else about the backend. Verbatim
from `src/backend/types.ts`:

```ts
export interface CommanderBackend {
  connect(): Promise<void>;
  disconnect(): void;
  /** Commands go in as protocol frames. */
  send(frame: ClientFrame): void;
  /** Events come out as protocol frames. Returns an unsubscribe function. */
  onFrame(cb: (frame: ServerFrame) => void): () => void;
  /** GET /api/v1/agents */
  listAgents(): Promise<AgentSummary[]>;
  /** GET /api/v1/sessions (gateway entries for ACTIVE agents; the §V5-1 persistent-session
   *  views live on the sim/backend as `listSessions(taskId?)`/`getSession`). */
  listSessionEntries(): Promise<SessionEntry[]>;
  /** GET /api/v1/runs */
  listRuns(): Promise<RunEntry[]>;
  /** kradle AgentDispatchRun list (mock-local for v1) */
  listTasks(): Promise<CommanderTask[]>;
}
```

Imports (mirror exactly): `AgentSummary`, `ClientFrame`, `RunEntry`, `ServerFrame`,
`SessionEntry` from `../contracts/gateway-protocol`; `CommanderTask` from
`../contracts/kradle-resources`.

`RealBackend implements CommanderBackend`. It MAY expose **additional** public methods for
the board verbs / list views that the mock exposes (so the boot seam's `views=` plumbing
keeps compiling — see §6 and §7), but those are **not** part of `CommanderBackend` and the
UI must never grow a dependency on them beyond what the mock already established.

---

## 2. RealBackend over gateway protocol v1 (WebSocket transport)

File: `src/backend/real/realBackend.ts`. Class `RealBackend implements CommanderBackend`.
Constructed with a resolved `BackendConfig` (§5).

### 2.1 Frame unions (from the protocol mirror — do not redefine)

- **`ClientFrame`** (sent by us): `AuthFrame` | `SubscribeFrame` | `UnsubscribeFrame` |
  `SessionSubscribeFrame` | `SessionUnsubscribeFrame` | `SessionStartFrame` |
  `SessionMessageFrame` | `PingFrame` | `HookDecisionFrame` | `PairingRegisterFrame` |
  `PairingConsumeFrame`.
- **`ServerFrame`** (received): `HelloFrame` | `ErrorFrame` | `PongFrame` |
  `RunEventFrame` | `HookRequestFrame` | `HookResolvedFrame` | `PairingConsumedFrame`.

Note: `PongFrame` is a **ServerFrame**, and `PingFrame` is a **ClientFrame**. Keepalive
direction = client sends `{type:'ping'}`, server replies `{type:'pong'}` (§2.6).

### 2.2 Connection lifecycle (`connect(): Promise<void>`)

`connect()` resolves once the socket is **authenticated and ready** (post-`hello`). It is
idempotent: a second `connect()` while connected/connecting resolves without opening a new
socket (mirror the mock's `if (this.connected) return`).

Ordered handshake:

1. Open `new WebSocket(config.gatewayUrl)` (ws/wss URL). Browser-ambient `WebSocket`; no dep.
2. On socket `open`: immediately `send({ type: 'auth', token: config.token })` over the raw
   socket (JSON, §2.4). Enter `authenticating` state.
3. Await the first `{ type: 'hello' }` `ServerFrame`. On receipt:
   - Record `serverVersion` / `serverTime`; assert `protocolVersions` includes `'1'`. If it
     does not, reject `connect()` (and surface an `ErrorFrame`-shaped failure — but DO NOT
     fabricate a frame into `onFrame`; reject the promise).
   - Transition to `ready`; resolve the `connect()` promise.
   - Start the keepalive timer (§2.6) and the reconnect arming (§2.7).
   - Re-subscribe all active run subscriptions and session subscriptions (§2.7) — on the
     **first** connect this set is empty; it matters on reconnect.
4. If the socket emits `error`/`close` **before** `hello`, reject the `connect()` promise
   (initial connect is allowed to fail loudly; the boot seam logs it, mirroring
   `App.tsx:170`).

The `hello` frame, like every other `ServerFrame`, is ALSO forwarded to `onFrame`
subscribers (the handshake is observable; subscribers may ignore it). The handshake gating
(awaiting hello before `ready`) is internal and independent of fan-out.

### 2.3 `send(frame: ClientFrame): void`

- If `ready`: serialize (§2.4) and write to the socket.
- If not ready (connecting / reconnecting / disconnected): see §2.5 outbound buffering.
- `send` never throws to the caller and never returns a value (matches the interface and the
  mock's fire-and-forget `send`). Board-mutation verbs do NOT arrive here — they are not
  `ClientFrame`s (§6, v1-protocol gap).

### 2.4 Serialization

- Outbound: `socket.send(JSON.stringify(frame))`. Frames are plain JSON-serializable objects
  (the unions contain only JSON-safe fields).
- Inbound: parse `JSON.parse(event.data)` → treat as `ServerFrame`. Narrow by `.type`.
  - Unparseable payloads (non-JSON, or JSON without a string `type`): drop, do not fan out,
    do not throw. Optionally `console.warn` once. The socket stays open.
  - A parsed object whose `type` is not a known `ServerFrame` discriminant: drop (forward-
    compat). Do not fan out. This keeps the UI's exhaustive `switch` over `ServerFrame`
    total and safe.

### 2.5 Outbound buffering (pre-ready sends)

`send()` calls that arrive before `ready` (e.g. UI dispatched a frame during a reconnect) are
queued in an in-memory FIFO and flushed, in order, immediately after the post-`hello`
re-subscribe step on the next `ready`. The buffer is bounded (drop-oldest past a fixed cap,
e.g. 256 frames) so a long outage cannot grow memory without bound. `disconnect()` clears it.

### 2.6 `onFrame` fan-out + unsubscribe

Mirror the mock's `onFrame(cb): () => void` contract exactly:

- Maintain a `Set<(frame: ServerFrame) => void>` of subscribers.
- `onFrame(cb)` adds `cb` and returns an **unsubscribe** function that removes exactly that
  `cb`. Unsubscribe is idempotent (calling twice is a no-op).
- On each valid inbound `ServerFrame`, iterate a **snapshot** of the subscriber set and call
  each `cb`. A throwing subscriber MUST NOT abort delivery to the others and MUST NOT kill the
  socket (wrap each `cb` call; swallow/log). This matches `bindBackendToStore`, which is the
  sole real subscriber and buffers frames per tick.
- Subscriber identity survives reconnects (subscribers are transport-independent; the socket
  is replaced under them).

### 2.7 Keepalive (ping/pong)

- While `ready`, send `{ type: 'ping' }` every `config.pingIntervalMs` (default 15 000 ms).
- Expect a `{ type: 'pong' }` `ServerFrame` within `config.pongTimeoutMs` (default 10 000 ms)
  of each ping. `pong` frames are consumed by the keepalive watchdog AND fanned out (harmless).
- If a `pong` does not arrive within the timeout, treat the connection as dead: tear down the
  socket and enter the reconnect path (§2.8). Do not wait for the OS TCP timeout.

### 2.8 Reconnect with bounded exponential backoff

When a `ready` socket closes unexpectedly (`close`/`error`/pong-timeout) and the backend has
not been `disconnect()`-ed:

- Enter `reconnecting`. Schedule a reconnect after a backoff delay:
  `delay = min(baseDelayMs * 2 ** attempt, maxDelayMs)` with full jitter
  (`random()`-free is impossible here, but jitter is allowed in the **real** path — the
  determinism guarantee applies to the **mock** only; see AC2/AC6). Defaults:
  `baseDelayMs = 500`, `maxDelayMs = 30 000`, unbounded attempt count (keep retrying) unless
  `config.maxReconnectAttempts` is set.
- Each reconnect attempt repeats the full §2.2 handshake (open → auth → await hello).
- On a successful reconnect (`ready` reached):
  1. Reset `attempt` to 0.
  2. **Re-auth** is implicit (the handshake re-auths every time).
  3. **Re-subscribe** every active run subscription: for each tracked `runId`, send
     `{ type: 'subscribe', runId, sinceSeq }` where `sinceSeq` is the highest `seq` already
     observed for that run (from `RunEventFrame.seq`) so the gateway replays only the gap.
     Re-subscribe every active session subscription
     (`{ type: 'session.subscribe', sessionId }`).
  4. Flush the outbound buffer (§2.5).
- The backend tracks subscriptions by intercepting outbound `subscribe`/`unsubscribe` and
  `session.subscribe`/`session.unsubscribe` frames in `send()` (and by tracking per-run
  `sinceSeq` from inbound `RunEventFrame`s). This bookkeeping is the ONLY frame-type-specific
  logic in `send()`; the frame is still forwarded to the socket unchanged.

### 2.9 `disconnect(): void`

- Set state to `disconnected` (suppresses the reconnect path — a deliberate disconnect must
  not trigger backoff).
- Clear keepalive + pending-reconnect timers.
- Clear the outbound buffer and the tracked subscription set.
- Close the socket (`socket.close()`), guarding against double-close.
- Do NOT clear the `onFrame` subscriber set on a plain `disconnect()` is acceptable EITHER
  way, but the chosen behavior MUST match the mock's: the mock's `disconnect()` only stops the
  sim and leaves `onFrame` subscriptions intact. Mirror that — leave subscribers registered so
  a later `connect()` resumes delivery. (Synchronous, returns `void`, matches the interface.)

---

## 3. REST list surface

All four list methods return Promises and use **Bearer** auth. Base URL derives from the
gateway origin (§5): the REST origin is the gateway URL with the ws/wss scheme swapped to
http/https and the path replaced by `/api/v1/...`.

Common request shape:

```
fetch(`${restBaseUrl}/api/v1/<resource>`, {
  headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' },
})
```

- `fetch` is browser-ambient; no dep.
- Non-2xx → reject the returned Promise with a typed error (status + body excerpt). The UI's
  list callers already tolerate a rejected Promise the way they tolerate the mock's resolved
  one; a failed list MUST NOT crash the transport or the socket.
- Parse the JSON body and return it **typed as the mirrored entry array**. Do not transform
  shapes — the mirror types ARE the gateway shapes.

| Interface method | HTTP | Returns | Notes |
|---|---|---|---|
| `listAgents()` | `GET /api/v1/agents` | `AgentSummary[]` | Runnable agent descriptors (mirror: `builtin-adapters.ts RunnableGatewayAgent`). |
| `listSessionEntries()` | `GET /api/v1/sessions` | `SessionEntry[]` | **Active agents only** (gateway entries). The persistent-session forensics views (`listSessions(taskId?)`/`getSession`) are sim/backend-local and are NOT this method. |
| `listRuns()` | `GET /api/v1/runs` | `RunEntry[]` | Run registry entries. |
| `listTasks()` | (none in v1) | `CommanderTask[]` | kradle `AgentDispatchRun` list. **The gateway does not expose this in v1.** Return `[]` (resolved). See §3.1. |

### 3.1 `listTasks()` is a v1 gap

`CommanderTask` is the kradle `AgentDispatchRun` shape; the v1 gateway REST surface has no
endpoint for it. `RealBackend.listTasks()` MUST resolve to `[]` until the gateway exposes an
AgentDispatchRun list endpoint. This mirrors the interface comment ("mock-local for v1") and
the README. When the endpoint lands it becomes `GET /api/v1/tasks` (or the upstream-named
route) returning `CommanderTask[]`; until then, `[]` is the contract. The UI degrades to an
empty Tasks/Registry-Tasks view, which is acceptable for the live path's first cut.

---

## 4. (reserved)

(No content — REST surface is §3; config is §5. Section number reserved to keep §5/§6/§7
numbering aligned with the deliverable's enumerated requirements.)

---

## 5. Config + selection

File: `src/backend/config.ts`.

### 5.1 `BackendMode` and `BackendConfig`

```ts
export type BackendMode = 'mock' | 'real';

export interface BackendConfig {
  mode: BackendMode;
  /** Mock-only: PRNG seed (default 42). Ignored when mode === 'real'. */
  seed: number;
  /** Real-only: ws/wss gateway URL. Required when mode === 'real'. */
  gatewayUrl?: string;
  /** Real-only: bearer/auth token. Required when mode === 'real'. */
  token?: string;
  /** Real-only keepalive/backoff knobs (all optional; defaults in §2). */
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxReconnectAttempts?: number;
}
```

### 5.2 `resolveBackendConfig(env, search): BackendConfig`

Pure function. Resolves from Vite env + URL params, **URL params win** over env (so a deploy
can default to real while a `?backend=mock` URL forces the mock for debugging, and vice-versa).

- `env` is `import.meta.env` (typed via a new `src/vite-env.d.ts`, see §5.4). Read:
  - `VITE_BACKEND` → `'mock' | 'real'`
  - `VITE_GATEWAY_URL` → gateway ws/wss URL
  - `VITE_GATEWAY_TOKEN` → token
- `search` is `window.location.search`. Read params:
  - `?backend=mock|real`
  - `?gateway=<url>` (ws/wss)
  - `?token=<token>`
  - `?seed=<n>` (mock seed — reuse the existing `seedFromSearch` from
    `src/backend/mock/prng.ts`; do NOT re-implement seed parsing).
- **DEFAULT mode is `'mock'`.** If neither `VITE_BACKEND` nor `?backend=` is present, or the
  value is unrecognized, `mode = 'mock'`.
- When the resolved `mode === 'real'` but `gatewayUrl` or `token` is missing/empty:
  `resolveBackendConfig` MUST fall back to `mode: 'mock'` (fail-safe — a misconfigured real
  deploy degrades to the deterministic mock rather than booting a dead socket). This keeps
  AC1 (mock is the safe default) true even under partial real config.
- `seed` is always resolved (via `seedFromSearch(search, DEFAULT_SEED)`) so the mock branch
  has it regardless of mode.

### 5.3 `createBackend(config): CommanderBackend`

File: `src/backend/factory.ts`.

```ts
export function createBackend(config: BackendConfig): CommanderBackend {
  if (config.mode === 'real') {
    return new RealBackend(config); // gatewayUrl & token are guaranteed by resolveBackendConfig
  }
  return new MockBackend({ seed: config.seed });
}
```

- Return type is the **interface** `CommanderBackend`, not a concrete class — the factory is
  the only place that knows which implementation exists.
- The mock branch MUST produce a backend **behaviorally identical** to today's
  `createMockBackendFromSearch(...)` for the same seed (AC1). Prefer routing the mock branch
  through the existing `createMockBackendFromSearch` / `MockBackend` constructor with the
  resolved seed so the byte-identical-default guarantee is structural, not re-derived.

### 5.4 `import.meta.env` typing (`src/vite-env.d.ts`)

There is currently **no** `vite-env.d.ts` in the app. Create one so TS-strict can read the
typed env without `any`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND?: 'mock' | 'real';
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_GATEWAY_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

This adds no runtime dependency (`vite/client` is already a transitive dev type via `vite`).

---

## 6. Board-mutation verbs in real mode (documented v1-protocol gap)

The README's v1-protocol gaps are inherited verbatim. Board / release-rail / editor verbs are
NOT part of `CommanderBackend` and NOT `ClientFrame`s in protocol v1:

`moveCard`, `setYolo`, `createTask`, `revertCard`, `release`, `rollbackCard`, `updateTask`,
`upsertStack`, `updateProcessTemplate`, `writeFile`, `setSpeed`, plus the roster verbs
(`createRosterAgent`, `deleteRosterAgent`, `assignTaskAgent`, `assignTaskHuman`).

On the mock these ride a **sim-local client command channel** (`backend.sim.moveCard(...)`
and the typed pass-throughs on `MockBackend`). They have no gateway frame to ride in real mode.

Real-mode contract for these verbs:

- `RealBackend` MAY expose the **same public method names** as `MockBackend` (so the boot
  seam's `views=`/orders plumbing keeps type-checking — see §7) but each one is a **safe
  no-op** that:
  - performs no network I/O,
  - returns the type-appropriate "did nothing" value: `boolean`-returning verbs → `false`;
    `string | null`-returning verbs (e.g. `createTask`, `release`, `upsertStack`,
    `createRosterAgent`) → `null`; `number | null` (`updateProcessTemplate`) → `null`;
    `void` verbs → return.
  - optionally `console.warn` once per verb name that the verb is a v1-protocol gap (no-op in
    real mode).
- The list-view methods the mock exposes off `.sim` (`listStacks`, `listProcessTemplates`,
  `listRunLedger`, `listSessions`, `getSession`, `listWorkspaces`, `getWorkspaceTree`,
  `getFileContent`, `getMemoryIO`, `getGitLog`, `listRosterAgents`, `listCardViews`,
  `listUnitViews`, etc.) likewise have no v1 gateway source. In real mode they return empty/
  null equivalents (`[]` / `null`) until the corresponding kradle/gateway surfaces exist. This
  is the same class of gap as `listTasks()` (§3.1) and is acceptable for the first live cut.

This degradation is **documented and intentional**, not a bug (AC7). When protocol v1 grows
board frames, these become `send(ClientFrame)` cases and NO UI changes (the README's promise).

---

## 7. Boot seam (exact edit point)

The seam is `src/App.tsx`. Current (verbatim, lines 91–93 and 170):

```ts
const backend = createMockBackendFromSearch(window.location.search);   // line 91
const store = createCommanderStore();                                  // line 92
const binding = bindBackendToStore(store, backend);                    // line 93
// ...
backend.connect().catch((error: unknown) => { /* ... */ });           // line 170
```

And the render (line 184): `<WarRoom store={store} orders={binding.orders} views={backend.sim} />`.

### 7.1 The seam edit

Replace **line 91 only**:

```ts
// before
const backend = createMockBackendFromSearch(window.location.search);
// after
const backend = createBackend(resolveBackendConfig(import.meta.env, window.location.search));
```

Everything else on the boot path (store creation, binding, `window.__commander` exposure,
`connect()` + catch, HMR dispose, render) is unchanged in **mock** mode and continues to work
because the mock branch returns a real `MockBackend`.

### 7.2 Two mock-coupling hazards the implementer MUST resolve (additively)

The seam is not a pure one-liner because two call sites are typed to the **concrete**
`MockBackend`, not the interface. Resolve both **without** changing UI behavior in mock mode:

1. **`bindBackendToStore(store, backend: MockBackend)`** (`src/game/store.ts:1649`) reads
   `backend.sim` (tick views, `commitTick` payload). The real backend has no `.sim`.
   - Required resolution: the binding's frame plumbing (`onFrame` fan-out → buffered
     `commitTick`) is interface-only and works for both. The **sim-view** half
     (`sim.listCardViews()`, `sim.listUnitViews()`, …) is mock-only. Keep `bindBackendToStore`
     bound to the mock for v1; in real mode bind only the `onFrame` half (the gateway streams
     `run.event`/`hook.request` frames; the sim-derived view snapshots simply do not exist
     yet). Concretely: gate the boot so the full `bindBackendToStore` + `views={backend.sim}`
     path runs only when `backend instanceof MockBackend`; in real mode wire a minimal binding
     that subscribes `onFrame` and commits frame batches without sim views. This is additive —
     mock mode is unchanged.

2. **`<WarRoom ... views={backend.sim} />`** (`src/App.tsx:184`) passes the concrete sim view
   API. In real mode there is no `backend.sim`.
   - Required resolution: provide a real-mode `views` object exposing the **same method
     surface** as `backend.sim` with empty/null returns (the §6 view-method no-ops), so
     `WarRoom`'s prop type is satisfied with no UI changes. Alternatively, narrow with
     `backend instanceof MockBackend ? backend.sim : realViewsStub`.

The implementer chooses the narrowest expression of (1)+(2) that keeps **mock mode
byte-identical** and compiles under TS strict. The real-mode UI in this first cut renders the
live frame stream (cards/agents appear as `run.event` frames arrive) while board-verb and
view-list surfaces degrade per §6. Fully populating the real-mode board from gateway frames is
out of scope for this spec (it is the next deliverable) — this spec delivers the **transport**.

> Implementer's note: the cleanest additive shape is a tiny real-mode boot module
> (e.g. an internal `bootReal(store, backend)` helper colocated in `App.tsx` or a new
> `src/backend/realBoot.ts`) that mirrors `bindBackendToStore`'s frame half. Do not widen or
> rewrite `bindBackendToStore` itself in a way that risks the mock's single-commit-per-tick
> behavior — that function is load-bearing for every unit test in `src/game/__tests__/`.

---

## 8. Planned file paths (exact)

| Path | Purpose |
|---|---|
| `src/backend/config.ts` | `BackendMode`, `BackendConfig`, `DEFAULT_SEED` re-use, `resolveBackendConfig(env, search)`. |
| `src/backend/real/realBackend.ts` | `RealBackend implements CommanderBackend` — WS lifecycle, send/onFrame, keepalive, reconnect, REST list methods, no-op board verbs + view stubs (§6). |
| `src/backend/factory.ts` | `createBackend(config): CommanderBackend`. |
| `src/vite-env.d.ts` | `ImportMetaEnv` typing for `VITE_*` (§5.4). New file — none exists today. |
| `src/backend/__tests__/config.test.ts` | Vitest: `resolveBackendConfig` matrix (default mock, env real, URL overrides env, partial-real → mock fallback, seed passthrough). |
| `src/backend/__tests__/factory.test.ts` | Vitest: `createBackend` returns `MockBackend` for mock config (byte-identical to `createMockBackendFromSearch` for same seed) and a `RealBackend` for valid real config. |
| `src/backend/__tests__/realBackend.test.ts` | Vitest: WS lifecycle against a fake `WebSocket` (auth→hello→ready, send serialization, onFrame fan-out + unsubscribe, ping/pong, reconnect re-auth + re-subscribe with `sinceSeq`, disconnect suppresses reconnect, REST via injected `fetch`, board-verb no-ops, `listTasks` → `[]`). |
| `src/App.tsx` | **Edit line 91 only** + the §7.2 real-mode boot gating. No other UI files change. |

Testing seams (so `realBackend.test.ts` needs no live gateway and no new deps):
- `RealBackend` MUST accept an **injectable** WebSocket factory and `fetch` (constructor
  option or module-level default = browser globals) so tests pass a fake. Production default
  is the ambient `WebSocket` / `fetch`. Vitest is already a devDependency; no new packages.

---

## 9. Acceptance criteria (numbered — tests cite these)

- **AC1 — Mock is the byte-identical default.** With no `VITE_BACKEND` and no `?backend=`,
  `resolveBackendConfig` yields `mode: 'mock'` and `createBackend` returns a `MockBackend`
  behaviorally identical to today's `createMockBackendFromSearch(window.location.search)` for
  the same seed (same scenario, same frame stream, same `window.__commander` surface). A
  misconfigured real config (real mode, missing `gatewayUrl`/`token`) also resolves to mock.

- **AC2 — Determinism guarantee is unchanged.** The seeded-deterministic contract (same seed
  ⇒ identical board/frames/icons) is a property of the **mock** only and is untouched. The
  real path MAY use wall-clock time, jitter, and live randomness; no determinism is claimed
  for it. No mock file changes.

- **AC3 — Existing tests untouched & green.** All current `src/game/__tests__/*` unit tests
  and all non-retired `e2e/*.spec.ts` suites pass **without modification**. The boot-seam edit
  preserves `bindBackendToStore`'s single-commit-per-tick behavior in mock mode.

- **AC4 — Real path is strictly additive.** New files only (§8) plus the line-91 edit and the
  §7.2 real-mode gating in `App.tsx`. No `CommanderBackend` interface change. No
  `gateway-protocol.ts` change. No UI component change.

- **AC5 — WS handshake.** `RealBackend.connect()` opens the socket, sends
  `{type:'auth',token}`, awaits `{type:'hello'}` (asserting `protocolVersions` includes `'1'`),
  and only then resolves and reaches `ready`. A pre-hello close/error rejects `connect()`.

- **AC6 — send/onFrame/keepalive/reconnect.** `send(ClientFrame)` JSON-serializes to the
  socket when ready and buffers (bounded) otherwise; `onFrame` fans out every valid inbound
  `ServerFrame` to all subscribers and its returned unsubscribe removes exactly one (idempotent),
  with a throwing subscriber not aborting delivery; client `ping` every `pingIntervalMs` with a
  `pongTimeoutMs` watchdog that triggers reconnect; reconnect uses bounded exponential backoff
  and on success re-auths and re-subscribes every active run (`subscribe` with the highest seen
  `sinceSeq`) and session, then flushes the outbound buffer.

- **AC7 — Board verbs degrade safely (documented v1 gap).** Board / release-rail / editor /
  roster verbs are NOT on `CommanderBackend` and NOT `ClientFrame`s; in real mode they are
  safe no-ops returning the type-appropriate empty value (`false` / `null` / `void`) with no
  network I/O. The gap is documented here and in the README, not a defect.

- **AC8 — REST list surface.** `listAgents` → `GET /api/v1/agents`, `listSessionEntries` →
  `GET /api/v1/sessions` (active agents only), `listRuns` → `GET /api/v1/runs`, each with an
  `Authorization: Bearer <token>` header, returning the mirrored entry arrays untransformed;
  non-2xx rejects the Promise without killing the transport.

- **AC9 — `listTasks()` v1 gap.** `RealBackend.listTasks()` resolves to `[]` (the gateway
  exposes no AgentDispatchRun list in v1), mirroring the interface comment and §3.1.

- **AC10 — Config resolution & precedence.** `resolveBackendConfig(import.meta.env, search)`
  reads `VITE_BACKEND`/`VITE_GATEWAY_URL`/`VITE_GATEWAY_TOKEN` and `?backend=`/`?gateway=`/
  `?token=`/`?seed=`, with URL params overriding env, default mode `'mock'`, seed via the
  existing `seedFromSearch`.

- **AC11 — Factory & boot seam.** `createBackend(config): CommanderBackend` returns the
  interface type; the only `App.tsx` runtime-construction edit is line 91 replacing
  `createMockBackendFromSearch(...)` with
  `createBackend(resolveBackendConfig(import.meta.env, window.location.search))`, plus §7.2
  real-mode gating; mock mode boots identically.

- **AC12 — TS strict, no `any`, no new deps.** All new code compiles under the app's strict
  TS config with zero `any` (use `unknown` + narrowing for inbound parse; mirrored types
  elsewhere). No additions to `apps/commander/package.json` dependencies or devDependencies —
  `WebSocket`/`fetch` are browser-ambient, `vite/client` types are transitive, Vitest exists.

- **AC13 — Graceful disconnect.** `disconnect()` is synchronous, suppresses the reconnect path
  (no backoff after a deliberate disconnect), clears keepalive/reconnect timers and the
  outbound buffer, closes the socket once, and leaves `onFrame` subscribers registered
  (mirroring the mock's `disconnect()` which stops the sim but keeps `onFrame` subscriptions).

---

## 10. Out of scope (this deliverable)

- Any **implementation code** (this is the spec phase only).
- Populating the real-mode board/registry/sessions UI from live gateway frames (next
  deliverable; this spec ships the transport + the additive seam).
- A real `Microagent` (commands/icons/ghost completions) — the README's separate wiring target.
- Promoting `apps/commander` into `packages/*` (the README's eventual graduation path).
- Any change to mock files, the `CommanderBackend` interface, or the protocol mirror.
