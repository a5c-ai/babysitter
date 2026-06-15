# SPEC-KRADLE-CONTROLPLANE — Commander board over the kradle CRD control plane

Status: authoritative implementation spec. Implement verbatim.
Scope: `apps/commander` only. Additive. Env-gated. The deterministic mock remains the default.

This spec adds a **browser REST client** for the **kradle CRD control plane** so Commander's
real mode can create and observe AgentStacks, agents (AgentSessions), tasks (AgentDispatchRuns),
workspaces, and memory — and drive dispatch / approvals — entirely over HTTP. No SDK dependency:
Commander stays a static SPA. The client targets the kradle **web BFF routes** (Next.js route
handlers under `web/app/api/...`), which themselves delegate to `@a5c-ai/kradle-sdk`.

It is the control-plane companion to `SPEC-LIVE-BACKEND.md`:

- **Gateway** (`RealBackend`, `SPEC-LIVE-BACKEND.md`) = runtime **session/run streaming** — live
  `run.event` / `hook.request` frames over WebSocket, plus a thin REST list surface
  (`/api/v1/agents|sessions|runs`). It owns the *moment-to-moment* transcript.
- **Kradle control plane** (this spec) = **resource lifecycle** — the durable CRD records
  (AgentStack, AgentSession, AgentDispatchRun, KradleWorkspace, AgentApproval, AgentMemory*).
  It owns *what exists* and *how the board is populated*.

The two are independent. Real mode may run **gateway-only**, **kradle-only**, or **both**. The
kradle client is constructed **only when `VITE_KRADLE_API_URL` is set** (§4, AC18).

This spec does **not** plan to import `@a5c-ai/kradle-sdk`. It **mirrors** the wire shapes the
SDK produces, exactly as the existing `src/contracts/kradle-*.ts` files already mirror the CRDs.

---

## 0. Source-of-truth files (read before implementing)

### Commander (this repo, this worktree)

| File | What it pins |
|---|---|
| `src/backend/types.ts` | `CommanderBackend` (the gateway seam — untouched by this spec). |
| `src/game/views.ts` | `SimViews` — the **read surface** this spec must satisfy in real mode (replaces `realViewsStub`). |
| `src/game/store.ts` | `Orders` (line 1575, the **verb surface**), `BackendBinding`, `commitTick` (line 996), `TickCommitInput`. |
| `src/backend/mock/simulation.ts` | All `Sim*View` shapes + `ColumnId` (`COLUMNS`, line 106), `RosterRole`, `PHASES_BY_KIND`. The mapping targets. |
| `src/backend/mock/scenario.ts` | `TASK_KINDS` (line 44), `AdapterName` (`ADAPTERS`), `MODELS_BY_ADAPTER`, `WORKER_ADAPTER_BY_KIND`. |
| `src/contracts/kradle-resources.ts` | Mirrored `KradleResource`, `AgentStackSpec`, `AgentDispatchRunSpec`, `CommanderTask`. |
| `src/contracts/kradle-stack.ts` | `KradleAgentStack`, `KradleAgentStackInput` (the foundry's `upsertStack` input). |
| `src/contracts/kradle-memory.ts` | `GraphRecord`, `MEMORY_NODE_KINDS`, `MEMORY_EDGE_KINDS`, `GraphQueryResult`, `AgentMemoryQuerySpec`. |
| `src/contracts/kradle-workspace.ts` | `AgentWorkspaceStatus`, `WorkspaceGitStatus`, `AgentApprovalSpec`. |
| `src/backend/config.ts` | `resolveBackendConfig(env, search)` — extended here with kradle fields (§4.1, AC16). |
| `src/vite-env.d.ts` | `ImportMetaEnv` — extended with the `VITE_KRADLE_*` keys (§4.1, AC16). |
| `src/backend/real/realBoot.ts` | Current stub: `realViewsStub` + `bootReal`. Rewired in §6 to drive a kradle snapshot. |
| `src/backend/real/realBackend.ts` | The gateway `RealBackend`. **Not modified** by this spec. |
| `SPEC-LIVE-BACKEND.md` | The gateway-side contract this composes with. |

### Kradle (the **main** checkout — `packages/kradle`, NOT this branch)

Authoritative for the wire contract. Cited per-endpoint in §1.

| File | What it pins |
|---|---|
| `web/app/api/controller/route.js` | The snapshot endpoint (`GET /api/controller?org=`) and its UI-model shape. |
| `core/src/controller-ui.js` | `createControllerUiModel(snapshot)` — the exact JSON shape `/api/controller` returns. |
| `core/src/controller-client.js` | `fetchControllerUiModel()` — how the BFF builds/falls-back the model (degraded states). |
| `web/app/api/orgs/[org]/agents/definitions/route.js` (+ `[name]`) | AgentDefinition list/create/get/patch/delete (the persona-identity stack). |
| `web/app/api/orgs/[org]/agents/dispatch/route.js` | DISPATCH — create an agent run (POST). |
| `web/app/api/orgs/[org]/agents/runs/[name]/cancel/route.js` | Cancel a run (POST → `status.phase='Cancelled'`). |
| `web/app/api/orgs/[org]/agents/runs/[name]/callback/route.js` | Agent-pod result callback (POST; **unauthenticated**, not a browser endpoint). |
| `web/app/api/orgs/[org]/agents/events/stream/route.js` | SSE live event stream (`GET`, `text/event-stream`). |
| `web/app/api/orgs/[org]/agents/memory/query/route.js` | Memory query (POST). |
| `web/app/api/orgs/[org]/agents/approvals/[name]/decide/route.js` | Approval decide (POST `{decision:'approve'|'deny'}`). |
| `web/app/lib/api-auth.js` | `withAuth` — Bearer/session auth + CSRF + org-claim checks. |
| `web/app/api/orgs/[org]/agents/identity-route-helpers.js` | `scopedIdentityResource` — how identity-kind POST bodies are wrapped. |
| `core/docs/agents/crd-schema-spec.md` | CRD spec matrix (`AgentStack.spec`, `AgentDispatchRun.spec`, memory kinds). |
| `core/docs/crd-behaviors-and-relationships.md` | Per-kind lifecycle phases + relationships (AgentDispatchRun §1.5, AgentSession, KradleWorkspace §1.6, AgentApproval, memory §1.7). |
| `web/app/components/kanban/kanban-enhanced.jsx` (+ `-helpers`, `kanban-card`) | The existing kradle kanban resource→column/card mapping (reference). |
| `sdk/README.md` | `createKradleApiController` / controller / memory shapes (**reference only — do NOT import**). |

> **Path note (kradle).** There is **no** `runs/[name]/route.js` in kradle. Run *records* are
> read from the `/api/controller` snapshot (`model.agents.runs.items`); runs are *mutated* only
> via `runs/[name]/cancel` and (server-to-server) `runs/[name]/callback`. The client MUST NOT
> assume a per-run GET/PATCH route exists (AC2, AC8).

---

## 1. The kradle BFF REST client contract (AC1–AC9)

### 1.1 Base URL, auth, org scoping (AC1)

The client (`src/backend/kradle/controllerClient.ts`) is configured from three env vars
(resolved in §4.1) and exposes typed methods, one per endpoint below.

| Knob | Env var | URL-param override | Default | Use |
|---|---|---|---|---|
| Base URL | `VITE_KRADLE_API_URL` | `?kradle=<url>` | *(none → kradle disabled)* | Origin of the kradle web app, e.g. `https://kradle.example.com`. All paths below are appended to it. |
| Bearer token | `VITE_KRADLE_TOKEN` | `?ktoken=<tok>` | *(none)* | Sent as `Authorization: Bearer <token>` on every request. |
| Org slug | `VITE_KRADLE_ORG` | `?korg=<slug>` | `'default'` | Substituted into `/api/orgs/<org>/...` paths and `?org=` on the snapshot. |

Request rules, derived from `web/app/lib/api-auth.js`:

1. **Auth header (AC1).** Every request carries `Authorization: Bearer <VITE_KRADLE_TOKEN>` and
   `Accept: application/json`. (`withAuth` resolves identity from a session **cookie**, but the
   gateway-style Bearer is the browser-client convention this spec adopts — mirror
   `RealBackend.getJson`, `realBackend.ts:552`, which sends `Authorization: Bearer`.)
   `credentials: 'include'` MUST also be set so a same-site kradle session cookie is sent when
   present (covers the cookie-auth deployment without a second code path).
2. **CSRF (AC1).** `withAuth` (`api-auth.js:25`) requires every **mutating** method
   (`POST`/`PATCH`/`DELETE`) to send EITHER an `X-Kradle-Request` header OR
   `Content-Type: application/json`. The client MUST send **both** on every mutating request:
   `Content-Type: application/json` and `X-Kradle-Request: commander`.
3. **Org claim (AC1).** `withAuth` (`api-auth.js:37`) returns `403` when the session's `orgs[]`
   claim excludes the path `<org>`. The client treats `403` as a typed, non-retryable
   `KradleControlPlaneError` (§1.9) — never a transport retry.
4. **No-store (AC1).** All GETs send `cache: 'no-store'` (the snapshot route already returns
   `Cache-Control: no-store`).

### 1.2 `GET /api/controller?org=<org>` — controller snapshot (AC2)

**The primary read.** Source: `web/app/api/controller/route.js:8`; shape built by
`createControllerUiModel`, `core/src/controller-ui.js:56`.

- **Method/headers:** `GET`, no body, Bearer + no-store.
- **Query:** `?org=<org>` (the route reads `searchParams.get('org')`, route.js:9).
- **Response (the UI model — fields this spec consumes; `controller-ui.js:162`):**

```jsonc
{
  "product": "Kradle",
  "status": "ready" | "degraded" | "unavailable",   // workspaceConnected && apiInstalled (ui:164)
  "org": { "slug": string, "namespace": string, "displayName": string },
  "orgs": [ { "slug": string, "namespace": string, "displayName": string } ],
  "controller": {
    "connection": { "available": boolean, "context": string|null, "errors": string[] }  // ui:176
  },
  "metrics": {                                       // ui:180
    "agentStacks": number, "agentRuns": number, "agentSessions": number, ...
  },
  "agents": {                                        // ui:121 — the agent projection this spec maps
    "org": string,
    "stacks":     { "count": number, "items": AgentStack[] },
    "runs":       { "count": number, "items": AgentDispatchRun[],
                    "active": AgentDispatchRun[] },  // phase ∉ {Completed,Failed} (ui:124)
    "rules":      { "count": number, "items": AgentTriggerRule[] },
    "sessions":   { "count": number, "items": AgentSession[] },
    "workspaces": { "count": number, "items": KradleWorkspace[] },
    "approvals":  { "count": number, "items": AgentApproval[],
                    "pending": AgentApproval[] },     // phase==='Pending'||unset (ui:128)
    "adapters":   { "count": number, "items": AgentAdapter[] },
    "providers":  { "count": number, "items": AgentProviderConfig[] },
    "projects":   { "count": number, "items": KradleProject[] },
    "gateway":    AgentGatewayConfig | null,
    "transcripts":{ "count": number, "items": AgentSessionTranscript[] },
    "memoryRepositories": { "count": number, "items": AgentMemoryRepository[] },
    "memorySnapshots":    { "count": number, "items": AgentMemorySnapshot[] },
    "memoryImports":      { "count": number, "items": AgentRunMemoryImport[], "pending": [...] }
  },
  "resources": [                                     // ui:61 — array of per-kind summaries (fallback source)
    { "kind": string, "plural": string, "count": number, "names": string[],
      "items": KradleResource[], "phases": Record<string,number>, "storage": string }
  ],
  "views": { "dashboard": { "repositories": [...], "projects": [...], "issues": [...] } }  // ui:223
}
```

- **The client reads `model.agents.*` as the canonical projection.** `model.resources[]` (keyed by
  `.kind`) is the **fallback** for any kind not surfaced under `agents` (e.g. `KradleProject`,
  `Repository`). The mapper (§2) MUST tolerate a kind appearing in either place (AC2).
- **Each CRD item** is `{ apiVersion, kind, metadata:{name,namespace,labels}, spec, status }` —
  exactly the mirrored `KradleResource<TKind,TSpec>` (`kradle-resources.ts:62`). `status.phase`
  is the lifecycle string the column mapping keys on (§2.3).
- **Degraded handling (AC2).** When `status !== 'ready'` OR
  `controller.connection.available === false`, the snapshot may carry empty `agents.*.items`
  with `connection.errors[]` populated (`controller-client.js:84` builds these). The client
  surfaces `status` + `connection.errors` to the boot layer (§6.4) and the board renders empty —
  it MUST NOT throw (AC2, AC15).

### 1.3 Agent definitions — AgentStack identity (AC3)

The dispatchable agent persona is an **`AgentDefinition`** resource served by the definitions
routes. (`AgentStack` is the legacy fallback the dispatch route still accepts; this spec treats
the **AgentDefinition** route as canonical for create/update, and reads BOTH
`agents.stacks.items` (AgentStack) and any `AgentDefinition` summary for the roster — §2.1.)

| Op | Method + path | Request body | Response |
|---|---|---|---|
| List | `GET /api/orgs/<org>/agents/definitions` | — | `{ items: AgentDefinition[] }` (`definitions/route.js:8` → `listIdentityResources`) |
| Create | `POST /api/orgs/<org>/agents/definitions` | `{ metadata?:{name,labels?}, spec:{...} }` OR a full resource (see §1.3.1) | `201 { resource: AgentDefinition }` (`route.js:10`) |
| Get | `GET /api/orgs/<org>/agents/definitions/<name>` | — | `{ resource: AgentDefinition }` (`definitions/[name]/route.js:8`) |
| Patch | `PATCH /api/orgs/<org>/agents/definitions/<name>` | partial `{ spec?, metadata? }` (merged, `identity-route-helpers.js:89`) | `{ resource: AgentDefinition }` |
| Delete | `DELETE /api/orgs/<org>/agents/definitions/<name>` | — | `{ ... }` |

#### 1.3.1 Create/patch body shape (AC3)

Per `scopedIdentityResource` (`identity-route-helpers.js:21`), the route accepts **either**:

- a **bare spec** body `{ ...specFields }` (wrapped: `spec = body`), or
- an explicit `{ spec: {...}, metadata: { name, labels? } }`, or
- a full resource `{ apiVersion, kind:'AgentDefinition', metadata, spec }`.

The route **forces** `metadata.namespace = orgNamespaceName(org)`, injects
`labels['kradle.a5c.ai/org'] = org`, and sets `spec.organizationRef = org` — the client MUST NOT
send these (they are overwritten). The client SHALL send the explicit `{ metadata:{name,labels?}, spec }`
form (AC3). `validateResource` runs server-side; a validation failure returns `422`
(`identity-route-helpers.js:74`).

### 1.4 `POST /api/orgs/<org>/agents/dispatch` — DISPATCH (create a run) (AC4)

The **create-task** verb. Source: `web/app/api/orgs/[org]/agents/dispatch/route.js:7`.

- **Method:** `POST`, Bearer + CSRF + `Content-Type: application/json`.
- **Request body** (route.js:13–24 — accepts persona OR legacy stack ref):

```jsonc
{
  "agentDefinition": string,          // persona identity ref (preferred). OR:
  "agentStack":      string,          // legacy AgentStack ref (fallback)
  "repository":      string,          // default 'default'
  "ref":             string,          // default 'main'
  "taskKind":        string,          // default 'diagnostic'
  "actor":           string,          // default 'owner'
  "meetingRef":      string|undefined
}
```

- The client sends `agentDefinition` (the stack/persona name) when the bound stack is an
  AgentDefinition, else `agentStack`. It MUST send at least one (route.js:16 → `400` otherwise).
- **Response:** `201 { run: AgentDispatchRun, ... }` (route.js:37). On a domain failure the route
  returns `400 { error: true, message }` (route.js:31). The dispatch also emits an
  `agent-dispatched` event onto the SSE stream (route.js:36) — the snapshot poller AND/OR the SSE
  listener (§6.3) will pick the new run up on the next refresh.
- **Field origin (AC4):** `repository`, `taskKind`, `agentStack`/`agentDefinition` come from the
  Commander `createTask` input mapped through §3.1.

### 1.5 `POST /api/orgs/<org>/agents/runs/<name>/cancel` — cancel a run (AC5)

Source: `runs/[name]/cancel/route.js:7`.

- **Method:** `POST`, no body required (route reads none), Bearer + CSRF.
- **Effect:** patches `status.phase='Cancelled'`, `status.cancelledAt`, `status.cancelledBy='owner'`
  (route.js:18–26).
- **Response:** `200 { error:false, run }`; `404` if the run name is unknown (route.js:15).
- **Maps to:** the Commander `abort` verb when the selected entity is a **card/run** (§3.3).

### 1.6 `GET /api/orgs/<org>/agents/events/stream` — SSE live events (AC6)

Source: `events/stream/route.js:41`. **Server-Sent Events**, `Content-Type: text/event-stream`.

- **Method:** `GET`, opened via the **browser `EventSource`** (NOT `fetch`) so reconnection +
  `Last-Event-ID` are handled by the platform. **Caveat:** `EventSource` cannot set an
  `Authorization` header. The client therefore opens
  `new EventSource(`${base}/api/orgs/<org>/agents/events/stream?korg=<org>`, { withCredentials: true })`
  and relies on the **same-site session cookie** for auth (`requireAuth`, route.js:42, reads the
  cookie — Bearer is not consulted on this route). If `VITE_KRADLE_TOKEN` is set but no cookie is
  available, the SSE channel is treated as unavailable and the client falls back to
  **interval polling only** (§6.3, AC6/AC17). This is a documented degradation, not an error.
- **Frames** (route.js:60–81; each `data:` line is one JSON object):
  - `{ type: 'connected', org }` — handshake.
  - `{ type: 'heartbeat', org }` — every 30s; ignored.
  - `{ type: 'agent-dispatched', run, timestamp }` — a new run was created (dispatch route emits it).
  - `{ type: '<kind>-applied', resource, timestamp }` / `{ type: '<kind>-deleted', name, timestamp }`
    — a CRD changed (`identity-route-helpers.js:71/113/127` emit these).
  - any other `{ type, ... }` — forward-compatible; ignored.
- **The client treats every non-heartbeat frame as a "snapshot is stale" signal** and schedules a
  snapshot refresh (debounced, §6.3). It does **not** attempt to apply frame deltas to individual
  resources (the snapshot is the single source of truth — AC6). `id:`-tagged frames feed
  `Last-Event-ID` automatically via `EventSource`.

### 1.7 `POST /api/orgs/<org>/agents/memory/query` — memory query (AC7)

Source: `memory/query/route.js:7`.

- **Method:** `POST`, body = an `AgentMemoryQuerySpec`-shaped object (`kradle-memory.ts:151`):
  `{ snapshotRef?, requester:{kind,name}, query:{ text, modes, graph?, grep? } }` (the route passes
  the body straight to `controller.queryAgentMemory(body)`; exact required fields are SDK-defined,
  so the client sends the mirrored `AgentMemoryQuerySpec` and tolerates extra fields).
- **Response:** the SDK `queryMemory` result, mirrored as `GraphQueryResult`
  (`{ matches: [{ record, score, edges }], totalMatches }`, `kradle-memory.ts:187`). On error the
  route returns `500 { error: message }`.
- **Maps to:** the §2.6 Memory I/O view and the Archive overlay's record set. This is an
  **on-demand** call (not part of the snapshot poll); the mapper requests it lazily for
  `getMemoryIO(ref)` (§2.6, AC7).

### 1.8 `POST /api/orgs/<org>/agents/approvals/<name>/decide` — approve/deny (AC8)

Source: `approvals/[name]/decide/route.js:7`.

- **Method:** `POST`, body `{ decision: 'approve' | 'deny', decidedBy?: string }`.
- **Validation:** `decision` MUST be exactly `'approve'` or `'deny'` (route.js:13 → `400` otherwise).
  The route patches `status.phase` to `'Approved'`/`'Denied'`, sets `decidedBy` (default `'owner'`)
  and `decidedAt` (route.js:22–28).
- **Response:** `200 { resource }`; `404` when `name` is unknown (route.js:36).
- **`<name>` is the `AgentApproval.metadata.name`** — resolved from
  `model.agents.approvals.pending[].metadata.name` (§2.3, the inquiry/decision mapping).
- **Maps to:** the Commander `decide(hookRequestId, 'allow'|'deny')` verb **when the pending hook
  corresponds to an AgentApproval** (§3.3, AC8). `'allow'→'approve'`, `'deny'→'deny'`.

### 1.9 Errors & typed failures (AC9)

`controllerClient` exposes a `KradleControlPlaneError extends Error` carrying
`{ status: number; endpoint: string; bodyExcerpt: string }` — mirroring
`RealBackendRestError` (`realBackend.ts:93`).

- Non-2xx → throw `KradleControlPlaneError` with the parsed `{ message }` body when present
  (kradle errors are `{ error: true, message }` via `errorResponse`).
- `401`/`403`/`422` are **non-retryable** (auth/CSRF/validation). The boot layer surfaces them
  (§6.4) and degrades to read-only/empty; it never spins a retry loop (AC9, AC15).
- Network/`5xx` failures from the **snapshot poll** are swallowed: the last good snapshot is kept
  and a refresh is retried on the next interval (AC9). A failed **verb** (dispatch/cancel/decide)
  rejects so the Orders layer can log it (mirror the gateway no-op warn style).
- Every method has an `AbortSignal` timeout (default 5000ms, matching
  `KRADLE_CONTROLLER_REQUEST_TIMEOUT_MS`, `controller-client.js:7`).

---

## 2. Resource ↔ view mapping (AC10–AC13)

`src/backend/kradle/mappers.ts` is **pure**: `(snapshot, memoryResult?) → { views, tickInput }`.
It consumes the §1.2 controller model + on-demand §1.7 results and produces the `SimViews`
surface (`views.ts:27`) and the `commitTick` payload (§6.2). No I/O, no `Date.now()` inside the
pure core (the caller injects `nowMs`). UI-only fields that have no kradle source are filled with
**stable deterministic defaults** (documented per-row), never random.

### 2.1 AgentStack / AgentDefinition ↔ `SimStackView` + roster (AC10)

`SimStackView` (`simulation.ts:459`): `{ stackRef, name, custom, stack: KradleAgentStack }`.

| `SimStackView` field | kradle source | Rule |
|---|---|---|
| `stackRef` | `item.metadata.name` | The stable resource name is the ref. |
| `name` | `item.metadata.name` (or `item.spec.displayName` if present) | Display label. |
| `custom` | `item.metadata.labels['kradle.a5c.ai/origin'] === 'foundry'` else `false` | Foundry-forged vs seeded; default `false` when unlabeled. |
| `stack.spec.baseAgent` | `item.spec.baseAgent` | Required CRD field. |
| `stack.spec.adapter` | `item.spec.adapter` | Required CRD field. |
| `stack.spec.provider` | `item.spec.provider` | Optional. |
| `stack.spec.model` | `item.spec.model` ?? `MODELS_BY_ADAPTER[adapter][0]` | Default to the adapter's first model (`scenario.ts:36`) when absent. |
| `stack.spec.prompt` | `item.spec.prompt ?? item.spec.promptTemplates` | `{system,developer}`; default `{ system: '' }`. |
| `stack.spec.approvalMode` | `item.spec.approvalMode` ?? `'prompt'` | Free-form string per `kradle-stack.ts:34`. |
| `stack.spec.{toolProfileRef,skillRefs,subagentRefs,runnerPool}` | same-named `item.spec.*` | Optional passthrough. |
| `stack.status.phase` | `item.status.phase` ?? `'Ready'` | Display string. |

**Source set:** `listStacks()` ← `model.agents.stacks.items` **plus** any `AgentDefinition`
summary from `model.resources[].kind==='AgentDefinition'` (deduplicated by `metadata.name`,
AgentStack winning on conflict). Sorted by `name`, stable.

**Roster agents** (`SimRosterAgentView`, `simulation.ts:361`) have **no first-class CRD**. A roster
agent is a *named, stack-bound assignable worker/reviewer*. It is represented as an
**AgentDefinition labeled as a roster entry**:

| `SimRosterAgentView` field | kradle source | Rule |
|---|---|---|
| `agentId` | `def.metadata.name` | |
| `name` | `def.metadata.labels['commander.a5c.ai/roster-name']` ?? `def.metadata.name` | |
| `stackRef` | `def.metadata.labels['commander.a5c.ai/stack-ref']` ?? `def.metadata.name` | The stack the agent draws from. |
| `stackName` | resolved from the stack with `stackRef` | |
| `adapter` | the stack's `spec.adapter`, narrowed to `AdapterName` | |
| `model` | the stack's `spec.model` | |
| `role` | `def.metadata.labels['commander.a5c.ai/role']` as `RosterRole` | `'worker'`/`'reviewer'`. |
| `status` | `'assigned'` if any card references it (§2.3 worker/reviewerAgentId), else `'available'` | Derived. |
| `assignedTaskId` / `assignedRole` | from the referencing card, else `null` | Derived. |

`listRosterAgents()` ← AgentDefinitions carrying `commander.a5c.ai/roster-name`. (Definitions
without that label are stacks-only and excluded from the roster.) This labeling convention is the
sanctioned representation in lieu of a dedicated CRD (AC10).

### 2.2 AgentSession ↔ `SimSessionView` / `SimSessionDetailView` (AC11)

`SimSessionView` (`simulation.ts:320`). Source: `model.agents.sessions.items` (an `AgentSession`,
behaviors doc §1.5). Transcripts come from `model.agents.transcripts.items`
(`AgentSessionTranscript`, behaviors §1.5) or the §1.7-adjacent transcript route, matched by
`sessionRef`.

| `SimSessionView` field | kradle source | Rule |
|---|---|---|
| `sessionId` | `session.metadata.name` | |
| `title` | `session.spec.title` ?? `"${creatureName} — ${role}"` | Default composed from creature+role. |
| `creatureName` | `session.metadata.labels['commander.a5c.ai/creature']` ?? `sessionId` | Cosmetic. |
| `agent` | `session.spec.adapter` narrowed to `AdapterName` ?? `'claude-code'` | |
| `model` | `session.spec.model` ?? `MODELS_BY_ADAPTER[agent][0]` | |
| `stackRef` / `stackName` | from the parent run's `spec.agentStack` (resolve run via `spec.dispatchRun`) | |
| `role` | `session.metadata.labels['kradle.a5c.ai/agent-role']` ?? `'worker'` | `AgentRole`. |
| `coordination` | `labels['commander.a5c.ai/coordination'] === 'true'` | Default `false`. |
| `taskId` | `session.spec.dispatchRun` | The run **is** the card (§2.3). |
| `attempt` | `session.spec.attempt` ?? `1` | |
| `runId` | `session.spec.dispatchRun` ?? `null` | |
| `parentSessionId` / `reviewOfSessionId` | same-named labels/spec ?? `null` | |
| `status` | map `session.status.phase`: `Active→'active'`, `Completed→'completed'`, `Failed\|Cancelled→'aborted'` | (behaviors §1.5 lifecycle). |
| `startedTick` / `endedTick` | `0` / `null` (kradle has no tick clock) | Deterministic stand-in; `endedTick` non-null when status terminal. |
| `turnCount` / `messageCount` | from transcript `cost`/length, else `0` | |
| `tokenUsage` / `cost` | from `transcript.spec.cost` (`callback/route.js:81` shape) mapped to `{inputTokens,outputTokens,thinkingTokens,cachedTokens}` + `CostRecord` | `thinking`/`cached` default `0`. |
| `transcriptLength` | `transcript.spec.messages.length` ?? `0` | |

`getSession(sessionId)` → `{ record, transcript[] }`: `transcript` maps each
`AgentSessionTranscript.spec.messages[]` `{role,content,timestamp}` (`callback/route.js:76`) to
`SimSessionTranscriptEntry { seq, tick, timestamp, kind, text, toolName? }` — `kind` from `role`
(`user|assistant|system|tool`→`user|message|event|tool_call`), `seq` = index, `tick` = `0`.

`listSessions(taskId?)` filters by `taskId === spec.dispatchRun` when provided; newest-first by
`creationTimestamp` (fallback insertion order).

### 2.3 AgentDispatchRun ↔ `SimCardView` (+ column mapping) and `SimRunView` (AC12)

The **central mapping**. An `AgentDispatchRun` (the mirrored `CommanderTask`,
`kradle-resources.ts:152`; behaviors §1.5) is **both** a board card and a run-ledger row. Source:
`model.agents.runs.items`.

#### 2.3.1 Run phase/status → board column (AC12)

`ColumnId` = `'backlog' | 'do' | 'ai-review' | 'human-review' | 'approved' | 'merged' |
'in-production'` (`simulation.ts:106`). Map `AgentDispatchRun.status.phase` (behaviors §1.5
phases: `Pending | AwaitingApproval | Queued | Running | Succeeded | Failed | Cancelled`) to a
column, refined by labels/approval state:

| kradle `status.phase` (+ refinement) | `ColumnId` | Rationale |
|---|---|---|
| `Pending`, `Queued` (no workspace claimed yet) | `backlog` | Created, not executing. |
| `Running` | `do` | The agent is actively working. |
| `Running` **and** a pending **review-kind** `AgentApproval` for the run, OR `taskKind==='review'` mid-flight | `ai-review` | Automated review stage. |
| `AwaitingApproval` (pending `AgentApproval` of action `write-back`/`release`/`tool-use`) | `human-review` | Blocked on a human gate (§2.3.3). |
| `Succeeded` **and** an approved write-back approval, not yet merged (`labels['commander.a5c.ai/merged'] !== 'true'`) | `approved` | Passed review, awaiting integration. |
| `Succeeded` **and** `labels['commander.a5c.ai/merged'] === 'true'` (or `status.mergedAt` set) | `merged` | Integrated to base/staging. |
| `Succeeded` **and** `labels['commander.a5c.ai/release-id']` present (or `status.releasedAt`) | `in-production` | Shipped on a release train. |
| `Failed`, `Cancelled` | `backlog` | Returned for rework (a failed/cancelled run lands back in the backlog, matching the sim's `aborted`/`review-rejected` semantics). |

> **Refinement labels are a Commander convention** (`commander.a5c.ai/merged`,
> `/release-id`) written by the §3.4 move/release verbs (AgentDispatchRun has no native
> merged/in-production phase). Absent the labels, the base phase mapping above applies. This keeps
> the mapping total and deterministic (AC12).

#### 2.3.2 `SimCardView` field map

`SimCardView` (`simulation.ts:228`):

| `SimCardView` field | kradle source | Rule |
|---|---|---|
| `taskId` | `run.metadata.name` | |
| `taskKind` | `run.spec.taskKind` narrowed to `TaskKind` | When the kradle `taskKind` (e.g. `'diagnostic'`, `'ci-repair'`) is not in `TASK_KINDS`, map via a documented table (`ci-repair→fix`, `diagnostic→fix`, else `'implement'`). |
| `title` | `run.spec.sourceRefs.pullRequest` ?? `run.spec.repository + ':' + taskKind` ?? `taskId` | Human label. |
| `repository` | `run.spec.repository` | |
| `workspaceId` | `run.spec.workspaceRef` ?? `''` | Links to §2.5. |
| `column` | §2.3.1 | |
| `order` | index within the column (stable sort by `creationTimestamp`) | Backlog ordering. |
| `yolo` | `labels['commander.a5c.ai/yolo'] === 'true'` | Default `false`. |
| `merged` | `column === 'merged' || column === 'in-production'` | Derived from column. |
| `progress` | from `status.conditions`/phase: `Running→0.5`, `Succeeded→1`, `Pending→0` | Deterministic step function (no rng). |
| `parentId` | `labels['commander.a5c.ai/parent'] ?? null` | Sub-task parent. |
| `childIds` | runs whose `parent` label == this name | Derived. |
| `agentIds` | session names with `spec.dispatchRun === taskId` and `status.phase==='Active'` | Active attached agents. |
| `attempt` | count of `AgentDispatchAttempt` for the run, or `status.attempt`, else `1` | |
| `feedback` | latest denied/feedback approval's `status.feedback` ?? `null` | |
| `dirtyFileCount` | the run's workspace `gitStatus.uncommittedCount` (§2.5) ?? `0` | |
| `hasPendingInquiry` | a pending `AgentApproval` exists for the run | |
| `stackRef` | `run.spec.agentStack` | |
| `description` | `run.spec.sourceEvent`/annotations ?? `''` | |
| `releaseId` | `labels['commander.a5c.ai/release-id'] ?? null` | |
| `compacted` | `false` (UI-local timing; the board recomputes) | |
| `workerAgentId` | `labels['commander.a5c.ai/worker'] ?? null` | Roster assignment (§2.1). |
| `reviewerAgentId` | `labels['commander.a5c.ai/reviewer'] ?? null` | |
| `humanAssigneeId` | `labels['commander.a5c.ai/human'] ?? null` | `'user'` or null. |

`listCardViews()` ← all `model.agents.runs.items` mapped as above.

#### 2.3.3 `SimRunView` field map

`SimRunView` (`simulation.ts:480`) — the runs registry row:

| `SimRunView` field | kradle source | Rule |
|---|---|---|
| `runId` | `run.metadata.name` | |
| `taskId` | `run.metadata.name` | (run ≡ card). |
| `taskKind` | as §2.3.2 | |
| `processId` | `"commander/${taskKind}@v1"` | Synthesized; kradle has no process-template id (§2.7). |
| `processRevision` | `1` | |
| `observedState` | map `status.phase` → `ObservedRunState` (`Running→'running'`, `Succeeded→'completed'`, `Failed→'failed'`, `Pending\|Queued→'pending'`, `Cancelled→'failed'`) | |
| `phases` | `PHASES_BY_KIND[taskKind]` (`simulation.ts:628`) zipped with progress: phases before current=`'done'`, current=`'current'`, rest=`'pending'` | Derived from `taskKind` + phase. |
| `pendingEffectsByKind` | from `model.agents.approvals.pending` for the run → `{ breakpoint: n }` | Best-effort; `{}` when none. |
| `tokens` | from the run's transcript `cost`, else zeros | |
| `costUsd` | `status.tokenUsage`-derived or `status.cost` ?? `0` | |
| `startedAt` | `status.queuedAt`/`creationTimestamp` epoch ms ?? `0` | |
| `endedAt` | `status.completedAt`/`failedAt` epoch ms ?? `null` | |

`listRuns()` ← `model.agents.runs.items`, newest-first by `startedAt`.

`getRunObservation(taskId)` (`SimRunObservationView`, `simulation.ts:403`) reuses the same
`observedState`/`phases`/`pendingEffectsByKind`; `journal` ← `[]` (kradle exposes no per-run
journal to the browser — documented empty, AC12).

### 2.4 (reserved — sessions covered in §2.2)

### 2.5 KradleWorkspace ↔ `SimWorkspaceView` / `SimWorkspaceSummaryView` (AC13)

Source: `model.agents.workspaces.items` (`KradleWorkspace`, behaviors §1.6). Phases
`Pending|Provisioning|Ready|InUse|Released|Archived|Terminating` map to the mirrored
`AgentWorkspacePhase` (`kradle-workspace.ts:23`: `created|ready|missing|conflicted|archived`):
`Pending|Provisioning→'created'`, `Ready|InUse|Released→'ready'`, `Archived→'archived'`,
`Terminating→'missing'`.

`getWorkspaceView(taskId)` (`SimWorkspaceView`, `simulation.ts:394`):

| field | kradle source | Rule |
|---|---|---|
| `taskId` | the requesting card's id | |
| `phase` | the run's `spec.workspaceRef` → workspace `status.phase` mapped above | `'missing'` when no workspace. |
| `gitStatus` | workspace `status.gitStatus` → `WorkspaceGitStatus` (`{branch,headSha,ahead?,behind?,dirty,uncommittedCount?}`) | Defaults `{branch:'main',headSha:'',dirty:false}`. |
| `files` | `[]` | kradle's browser snapshot carries no per-file diff; documented empty (AC13). |
| `testEvidence` | `{ status:'unknown' }` | No browser source. |
| `reviewerNotes` | denied approvals' `status.feedback[]` for the run | |

`listWorkspaces()` (`SimWorkspaceSummaryView`, `simulation.ts:431`): one row per
`KradleWorkspace`. `workspaceId`=`metadata.name`; `name`=`metadata.name`;
`repository`=`spec.repository`; `phase`/`gitStatus` as above; `dirty`=`gitStatus.dirty`;
`cardIds` = runs whose `spec.workspaceRef === name`; `cards` = per-card git lines
(`SimWorkspaceCardGitView`) reusing each card's workspace `gitStatus`; `activeSessionIds` = active
sessions across those cards. `getWorkspaceTree`/`getFileContent`/`getGitLog` return `null`/`null`/`[]`
(no browser source — documented gap, AC13).

### 2.6 Memory rows ↔ `SimMemoryIOView` + silos (AC13)

`getMemoryIO(ref)` (`SimMemoryIOView`, `simulation.ts:535`: `{ read[], written[] }`) is sourced
from the §1.7 memory-query endpoint (lazy, cached per `ref` within a snapshot generation):

- `read[]` (`SimMemoryReadEntry`): one per `GraphQueryResult.matches[]` →
  `{ recordId: match.record.id, kind: match.record.nodeKind, silo: <repo>, tick: 0, unitId: ref }`.
- `written[]` (`SimMemoryWriteEntry`): from `model.agents.memoryImports.items` /
  `AgentMemoryUpdate` records whose `spec.sourceRun === ref` →
  `{ updateId, silo, changes:[{path,action,reason}], phase, tick:0, unitId: ref }`.

Memory **silos** for the Archive (`BoardMemory` in `store.ts`: `{ silos: SimMemorySiloView[],
records: GraphRecord[] }`) come from `model.agents.memoryRepositories.items`
(`AgentMemoryRepository`, behaviors §1.7) → `SimMemorySiloView` (`simulation.ts:447`):
`{ name: metadata.name, phase: status.phase, currentCommit: status.currentCommit ?? '',
recordCount: 0, owner: spec.repositoryRef, recordIds: [] }`. `records` are populated by a broad
memory query (`query.text:''`, `modes:['graph-only']`) mapped to `GraphRecord` (`kradle-memory.ts:88`).
When the memory endpoint is unavailable, all memory views return empty (`{read:[],written:[]}` /
`{silos:[],records:[]}`) — never throw (AC13/AC15).

### 2.7 Process templates — decision (AC13)

Kradle has **no** browser-visible "process template" resource (the closest server concept is
`AgentTriggerRule` + the SDK's internal run process). **Decision:** `listProcessTemplates()`
returns a **synthesized** template per `TaskKind`, derived from `PHASES_BY_KIND`
(`simulation.ts:628`): `{ kind, processId: "commander/${kind}@v1", revision: 1, phases:
[...PHASES_BY_KIND[kind]] }`. This is static (no kradle source) and matches the `processId`
synthesized in §2.3.3. `updateProcessTemplate` is a documented no-op in real mode (§3.4). This is
recorded as an explicit gap, not a TODO (AC13).

---

## 3. Verb ↔ operation mapping (AC14)

`src/backend/kradle/mappers.ts` (or a sibling `kradleOrders.ts`) builds the real-mode `Orders`
(`store.ts:1575`). Verbs WITH a kradle operation call the §1 client; verbs WITHOUT one stay
**documented no-ops** exactly as `realBoot.ts`'s `makeRealOrders` already declares them — but the
ones below are now **wired**.

| `Orders` verb | kradle operation | Mapping |
|---|---|---|
| `upsertStack(stack)` | §1.3 `POST`/`PATCH /agents/definitions[/<name>]` | New stack (no `stackRef`) → `POST`; existing → `PATCH /<stackRef>`. Body = §1.3.1 from `KradleAgentStackInput` (`metadata.name`, `spec` mapped inverse of §2.1). Returns the created/updated `metadata.name`. **(AC14)** |
| `createTask(input)` | §1.4 `POST /agents/dispatch` | §3.1 below. Returns the new run's `metadata.name` (the card id), else `null`. **(AC14)** |
| `createRosterAgent(input)` | §1.3 `POST /agents/definitions` | Create an AgentDefinition labeled `commander.a5c.ai/roster-name`, `/stack-ref=<input.stackRef>`, `/role=<input.role>` (§2.1). Returns its `metadata.name`. **(AC14)** |
| `assignTaskAgent(taskId,role,agentId)` | §1.3 `PATCH /agents/definitions/<taskRunIsNotPatched>` → **run label patch** | There is no run PATCH route (§0). Assignment is recorded by patching the **roster AgentDefinition** `status`/labels to `assigned` AND is reflected on the card via the `commander.a5c.ai/worker|reviewer` label, which the client writes by **re-dispatch metadata is immutable** — therefore assignment is **client-side projected** onto the next snapshot read and persisted only on the roster definition. **Documented partial:** card-level assignment labels cannot be pushed without a run-mutation route; the client patches the roster agent (durable) and the board shows the assignment from roster `assignedTaskId`. **(AC14)** |
| `decide(hookRequestId,'allow'\|'deny')` | §1.8 `POST /agents/approvals/<name>/decide` | When `hookRequestId` resolves to a pending `AgentApproval.metadata.name` (§3.3), `'allow'→{decision:'approve'}`, `'deny'→{decision:'deny'}`. When it resolves to a **gateway** hook instead, fall through to the gateway `hook.decision` frame (§3.3). **(AC14)** |
| `answerInquiry(hookRequestId,optionId)` | §1.8 decide **and/or** gateway frame | An AgentApproval is binary approve/deny — `optionId` is not representable on the kradle approval. **Decision:** `answerInquiry` routes to the **gateway** `hook.decision` frame (carrying `optionId`, exactly as `realBoot.ts:111`) when a gateway is present; when kradle-only, it maps the option to approve/deny heuristically (`option indicates proceed → approve`, else `deny`) via §1.8 and documents the lossy mapping. **(AC14)** |
| `abort(unitIds)` | §1.5 `POST /agents/runs/<name>/cancel` **(card)** OR gateway `/abort` **(agent)** | When a selected id is a **run/card** (`taskId`), cancel the run (§1.5). When it is an **active agent** (`unitId`) and a gateway is present, send `/abort` via the gateway (`realBoot.ts:95`). **(AC14)** |
| `moveCard(taskId,column)` | **label patch — documented partial** | A user board move has no kradle phase transition and no run PATCH route (§0). **Decision:** real-mode `moveCard` is a **documented no-op against kradle** (the board still animates locally); the durable column derives from §2.3.1 on the next snapshot. Recorded as an explicit gap. **(AC14)** |
| `setYolo(taskId,on)` | **no-op (documented gap)** | No run-mutation route to persist the `yolo` label. Local-only; no kradle call. **(AC14)** |
| `release()` / `revertCard(taskId)` / `rollbackCard(taskId)` | **no-op (documented gap)** | The `merged`/`in-production` lifecycle is a Commander overlay on top of `Succeeded` (§2.3.1) with no kradle write path (no run PATCH). Documented gaps; local board animation only. **(AC14)** |
| `prioritize` / `pauseUnits` / `resumeUnits` / `toggleSim` / `setSpeed` / `updateTask` / `updateProcessTemplate` / `writeFile` / `deleteRosterAgent` (→ `DELETE /agents/definitions/<name>`, the one exception) / `assignTaskHuman` / `focusInquiryCard` | mostly **no-op (documented gaps)** | Carried over verbatim from `realBoot.ts`'s gap list. **Exception:** `deleteRosterAgent(agentId)` IS wired to §1.3 `DELETE /agents/definitions/<agentId>`. **(AC14)** |

> Every "documented gap" verb keeps the SAME public signature and returns the type-appropriate
> empty value (`void` / `null` / `false`), emitting a one-time `console.warn` like
> `RealBackend.noopVerb` (`realBackend.ts:594`). No verb throws (AC14, AC15).

### 3.1 `createTask` → dispatch body (AC14)

`createTask({ taskKind, title?, parentId?, workspaceId? })` →
`POST /agents/dispatch` body:

```jsonc
{
  "agentDefinition": <resolved stack ref for taskKind>,   // default-stack-by-kind, see below
  "repository":      <default repo>,                       // VITE_KRADLE_REPO ?? 'default'
  "ref":             "main",
  "taskKind":        <taskKind>,                            // passed through verbatim
  "actor":           "owner"
}
```

- The stack is resolved from the bound stacks: prefer a stack labeled
  `commander.a5c.ai/default-for=<taskKind>`, else the first stack whose `spec.adapter`'s family
  matches `WORKER_ADAPTER_BY_KIND[taskKind]` (`scenario.ts:59`), else the first stack. If no stack
  exists, `createTask` returns `null` (cannot dispatch without an agent).
- `title`, `parentId`, `workspaceId` have no dispatch-body slot; they are recorded as labels on a
  **follow-up** read only if a run-mutation route later exists — for now `parentId`/`workspaceId`
  are best-effort passed as `meetingRef`-adjacent metadata is NOT valid, so they are **dropped
  with a documented note** (the dispatch contract, route.js:13–24, accepts none of them). The new
  run's `metadata.name` is returned as the card id.

### 3.3 Decision routing: AgentApproval vs gateway hook (AC14)

A pending decision can originate from **either** plane. The Orders layer resolves the target:

1. If `hookRequestId` matches a `model.agents.approvals.pending[].metadata.name` → it is a kradle
   `AgentApproval`; route to §1.8 decide.
2. Else, if a gateway backend is present and the id matches a gateway `hook.request` →
   route to the gateway `hook.decision` frame (`realBoot.ts:107`).
3. Else → one-time warn + no-op (stale/unknown id).

The alerts slice (`store.ts` `AlertEntry`) is populated from gateway `hook.request` frames in
gateway mode; in kradle mode the §2.3.3 pending approvals are surfaced as inquiries on the card
(`hasPendingInquiry`), and `AlertEntry.hookRequestId` carries the `AgentApproval.metadata.name` so
`decide` resolves via path (1).

---

## 4. Real-mode boot (AC15–AC18)

### 4.1 Config + env (AC16)

Extend `src/vite-env.d.ts` `ImportMetaEnv` and `src/backend/config.ts` `BackendEnv`/`BackendConfig`:

```ts
// vite-env.d.ts (added keys)
readonly VITE_KRADLE_API_URL?: string;
readonly VITE_KRADLE_TOKEN?: string;
readonly VITE_KRADLE_ORG?: string;
readonly VITE_KRADLE_REPO?: string;
```

```ts
// config.ts BackendConfig (added optional fields)
kradleApiUrl?: string;   // ← VITE_KRADLE_API_URL / ?kradle=
kradleToken?: string;    // ← VITE_KRADLE_TOKEN / ?ktoken=
kradleOrg?: string;      // ← VITE_KRADLE_ORG / ?korg=  (default 'default')
kradleRepo?: string;     // ← VITE_KRADLE_REPO / ?krepo= (default 'default')
```

`resolveBackendConfig(env, search)` (`config.ts:61`) adds, **without changing** the existing
mock/real resolution:

- URL params win over env (matching the existing precedence, `config.ts:69`).
- The kradle fields are populated **independently of `mode`** — kradle can attach to the existing
  `mode:'real'` gateway path OR stand alone. Specifically: `kradleApiUrl` is set iff
  `?kradle=`/`VITE_KRADLE_API_URL` is a non-empty string.
- **`mode` stays `'mock'` by default (AC15).** Kradle does not flip the default. The board only
  consults kradle when `kradleApiUrl !== undefined`. A `mode:'mock'` config with a kradle URL is
  permitted (mock board + kradle is NOT composed — mock is self-contained; kradle attaches only on
  the real boot path, §4.2). Documented: kradle requires `mode:'real'` OR an explicit
  `?backend=real` to take effect; with `mode:'mock'` the kradle fields are inert.
- The existing fail-safe (real-without-gateway → mock, `config.ts:76`) is **relaxed**: a real mode
  with a kradle URL **but no gateway** is now valid (kradle-only real mode). The resolver returns
  `mode:'real'` when EITHER `(gatewayUrl && token)` OR `kradleApiUrl` is present (AC16):

```text
real iff  requestedMode==='real' && ( (gatewayUrl && token) || kradleApiUrl )
else mock
```

### 4.2 Boot composition (AC15, AC17, AC18)

`src/backend/real/realBoot.ts` `bootReal(store, backend, config)` is rewired:

1. **Construct the kradle client only when `config.kradleApiUrl` is set** (AC18). Otherwise
   `bootReal` behaves exactly as today (frame-only gateway binding + `realViewsStub`) — a pure
   gateway-only real mode is unchanged (AC15).
2. A `KradleControllerCache` holds the **latest snapshot** (`model.agents.*`) and exposes the
   mapped `SimViews` (§2) computed lazily/memoized per snapshot generation. This replaces
   `realViewsStub` when kradle is active; `realViewsStub` remains the fallback when kradle is
   inactive OR the first snapshot has not yet arrived.
3. **Snapshot refresh** (§6.3 / AC17):
   - On boot: one immediate `GET /api/controller` (§1.2).
   - **Interval poll:** every `POLL_INTERVAL_MS` (default 5000) re-fetch the snapshot. On success,
     swap the cache and call `store.commitTick(mapToTickInput(snapshot, nowMs))` (§6.2). On failure,
     keep the last snapshot (AC9) and retry next interval.
   - **SSE-driven refresh:** open the §1.6 `EventSource`. Every non-heartbeat frame schedules a
     **debounced** (≤500ms) immediate refresh, so dispatch/apply/delete reflect faster than the
     poll. SSE is **additive**: if it is unavailable (no cookie / closed), polling alone keeps the
     board live (AC17).
4. **Compose with the gateway (AC15).** When BOTH a gateway backend and a kradle client are
   present, `bootReal` merges two `Orders` and two `SimViews` sources:
   - **Orders:** verb-by-verb, the kradle operation takes the resource-lifecycle verbs
     (`upsertStack`, `createTask`, `createRosterAgent`, `deleteRosterAgent`, approvals via
     `decide`); the gateway takes the runtime verbs (`steer`, `abort`-on-agent, `answerInquiry`
     with `optionId`). `decide`/`abort` use the §3.3/§3 routing to pick a plane per call.
   - **SimViews:** kradle supplies the board/stack/run/session/workspace/memory reads (§2); the
     gateway supplies nothing on the `SimViews` surface (it never did). The kradle cache's
     `SimViews` is passed to `<WarRoom views=... />`.
   - **commitTick:** the gateway binding keeps feeding **frames** (live transcript) via its
     microtask flush (`realBoot.ts:202`); the kradle layer feeds **cards/agents/inquiries/runStages
     + roster** from the snapshot (§6.2). Both target the same `commitTick`; §6.1 defines the merge.
5. `bootReal` returns the existing `RealBootBinding` (`{ flush, orders, views, dispose }`,
   `realBoot.ts:184`); `dispose()` also clears the poll interval and closes the `EventSource`.

### 4.3 `App.tsx` seam (AC15)

`App.tsx` selects mock vs real exactly as today. The only change: when `config.mode==='real'`,
`bootReal` is passed the resolved `config` (so it can see `kradleApiUrl`). The mock path
(`bindBackendToStore`) is **untouched** (AC15). No UI component changes — `SimViews`/`Orders` are
the same shapes (`realBoot.ts`'s contract is preserved).

---

## 5. commitTick composition (AC12, AC15)

### 6.1 Two producers, one tick

`commitTick(input: TickCommitInput)` (`store.ts:996`) already takes the full board payload
(`frames, units, tasks, hooks, cards, agents, inquiries, runStages, rosterAgents, nowMs,
tickIndex, paused`). In composed real mode:

- The **gateway** producer emits ticks carrying `{ frames, units:[], tasks:[], hooks:[], cards:[],
  agents:[], inquiries:[], runStages:{}, rosterAgents:[], ... }` (exactly today's `realBoot.ts:208`)
  — i.e. it owns `frames` and leaves the board arrays empty.
- The **kradle** producer emits ticks carrying `{ frames:[], units:<from sessions>, tasks:<v1
  compat>, hooks:<from pending approvals>, cards:<§2.3.2>, agents:<from active sessions>,
  inquiries:<§2.3.3>, runStages:<§6.2>, rosterAgents:<§2.1>, ... }` — it owns the board halves and
  leaves `frames` empty.

Because `commitTick` is **additive per-slice** (it reconciles each array against prior state and
preserves refs when unchanged, `store.ts:1013–1245`), interleaving the two producers' ticks is
safe: gateway ticks update the transcript/ticker without clobbering the board; kradle ticks update
the board without clobbering the transcript. **Invariant:** neither producer emits a non-empty
value for a slice the other owns (AC12). `tickIndex` is a single shared monotonic counter in
`bootReal`.

### 6.2 Kradle → `TickCommitInput`

`mapToTickInput(snapshot, nowMs, tickIndex)`:

- `cards` ← §2.3.2 over `model.agents.runs.items`.
- `agents` (`SimAgentView`) ← active sessions (`status.phase==='Active'`) mapped (subset of §2.2 +
  `heldPieces:[]`, `tokenUsage`/`cost` from transcript).
- `units` (`SimUnitView`, v1 compat) ← active sessions mapped to the lifecycle surface.
- `tasks` (`SimTaskView`, v1 compat) ← runs mapped (`state` from phase: `Running→'in_progress'`,
  `Succeeded→'done'`, `Pending→'queued'`, …).
- `hooks` (`SimHookView`) ← `model.agents.approvals.pending` → `{ hookRequestId: approval.metadata.name,
  runId: approval.spec.dispatchRun, unitId: <active session for run>, hookKind: approval.spec.action.type,
  payload: { taskId, question, options:[approve,deny] }, deadlineTs: nowMs + DEFAULT_INQUIRY_MS }`.
- `inquiries` (`SimInquiryView`) ← same pending approvals → binary approve/deny option palette.
- `runStages` ← `taskId → <current phase label>` from §2.3.3 `phases` (the `'current'` entry's label),
  else `null`.
- `rosterAgents` ← §2.1.
- `nowMs` = injected wall clock (real path may use `Date.now()`, AC2 — determinism is the mock's
  contract only).

### 6.3 Refresh scheduling (AC17)

```text
boot → fetch snapshot → commitTick
every POLL_INTERVAL_MS (5000) → fetch snapshot → (success) swap cache + commitTick / (fail) keep
SSE frame (non-heartbeat) → debounce 500ms → fetch snapshot → swap cache + commitTick
verb success (dispatch/cancel/decide/upsert/delete) → optimistic? no → schedule an immediate
   debounced refresh so the board reflects the write within ≤500ms
```

The poll is the **floor** of liveness; SSE only tightens latency. Disposing `bootReal` clears both.

### 6.4 Connection surface

The snapshot's `status` + `controller.connection.{available,errors}` (§1.2) drive
`meta.connection` (`store.ts` `'connecting'|'connected'|'disconnected'`): a successful `ready`
snapshot → `'connected'`; a `degraded`/`unavailable` or a fetch failure with a prior snapshot →
keep `'connected'` (stale-OK); repeated failure with no snapshot → `'disconnected'`. Errors are
pushed to the ticker once per transition (not per poll).

---

## 6. Invariants (AC15, AC19, AC20)

1. **Mock byte-identical default (AC15).** `mode` defaults to `'mock'`; the mock boot path
   (`bindBackendToStore`, `MockBackend`) is not touched. Kradle is inert unless `mode:'real'` and
   `kradleApiUrl` is set. `resolveBackendConfig`'s mock branch output is unchanged for all inputs
   that do not set kradle fields.
2. **Existing tests + e2e untouched (AC15/AC19).** No change to mock determinism, the gateway
   `RealBackend`, or any UI component. New behavior lives behind the kradle-active boot branch.
   The frozen v3/v4/v5 e2e probes and the mock unit suites pass unchanged.
3. **Additive + env-gated (AC18).** The kradle client is constructed only when
   `VITE_KRADLE_API_URL`/`?kradle=` is present. Absent it, `bootReal` is the current gateway-only
   stub.
4. **Documented no-ops stay no-ops (AC14/AC20).** Every verb without a kradle operation keeps its
   signature, returns the type-appropriate empty, warns once, never throws.
5. **TS strict, no `any`, no new deps (AC20).** All wire shapes reuse the existing
   `src/contracts/kradle-*.ts` mirrors (extended with narrow local interfaces for the snapshot
   model where needed — typed, never `any`; narrow `unknown` like `realBackend.ts:141`
   `asServerFrame`). No `@a5c-ai/kradle-sdk` import. No runtime dependency added — `fetch` +
   `EventSource` are ambient browser globals (injectable for tests, mirroring `RealBackendDeps`).
6. **Single source of truth = the snapshot.** SSE frames never mutate individual resources; they
   only trigger a snapshot refresh (AC6). The board is always a pure function of the latest
   snapshot (+ lazy memory queries).

---

## 7. Exact planned file paths (AC20)

| Path | Contents |
|---|---|
| `src/backend/kradle/controllerClient.ts` | The REST client: `createKradleControllerClient(opts)` → methods `snapshot()`, `listDefinitions()`, `createDefinition()`, `getDefinition()`, `patchDefinition()`, `deleteDefinition()`, `dispatch()`, `cancelRun()`, `queryMemory()`, `decideApproval()`, `openEventStream()`. `KradleControlPlaneError`. Injectable `fetch`/`EventSource` factories (test seam, §1, §6). |
| `src/backend/kradle/mappers.ts` | Pure mappers (§2/§6.2): `mapStacks`, `mapRosterAgents`, `mapSessions`, `mapCards` (+ `runPhaseToColumn`), `mapRuns`, `mapWorkspaces`, `mapMemoryIO`, `mapSilos`, `buildSimViews(snapshot, memoryCache)`, `mapToTickInput(snapshot, nowMs, tickIndex)`. The kradle→`taskKind` and phase→column tables. |
| `src/backend/kradle/kradleOrders.ts` *(or fold into `mappers.ts`)* | `makeKradleOrders(client, config, gatewayOrders?)` building the real-mode `Orders` (§3) with plane routing. |
| `src/backend/kradle/__tests__/controllerClient.test.ts` | Endpoint shape/headers/CSRF/auth/error tests against an injected fake `fetch` + fake `EventSource` (no live kradle). |
| `src/backend/kradle/__tests__/mappers.test.ts` | Pure-mapping tests: phase→column table (every phase + refinement), each `Sim*View` field, empty/degraded snapshot → empty views, kradle→`taskKind` fallback. |
| `src/backend/kradle/__tests__/kradleOrders.test.ts` | Verb→endpoint + plane-routing tests (dispatch body §3.1, decide routing §3.3, no-op verbs warn-once). |
| `src/backend/config.ts` *(edit)* | Add `kradle{ApiUrl,Token,Org,Repo}` to `BackendConfig`/`BackendEnv`; extend `resolveBackendConfig` per §4.1 (kradle-only real validity). |
| `src/vite-env.d.ts` *(edit)* | Add `VITE_KRADLE_{API_URL,TOKEN,ORG,REPO}` to `ImportMetaEnv`. |
| `src/backend/real/realBoot.ts` *(rewire)* | `bootReal(store, backend, config)`: construct the kradle client + cache when `config.kradleApiUrl` set; poll + SSE refresh; merge `Orders`/`SimViews`; keep `realViewsStub` as the inactive/initial fallback; `dispose()` tears down poll + `EventSource`. The gateway frame-flush half is preserved verbatim. |
| `src/App.tsx` *(minimal edit)* | Pass the resolved `config` into `bootReal` on the real path. No other change. |

---

## 8. Acceptance criteria (cite by id in tests)

- **AC1** — The client sends `Authorization: Bearer <VITE_KRADLE_TOKEN>` + `Accept: application/json`
  + `credentials:'include'` on every request, and on mutating requests additionally sends
  `Content-Type: application/json` + `X-Kradle-Request: commander`; org `<org>` comes from
  `VITE_KRADLE_ORG`/`?korg=` (default `'default'`); GETs use `cache:'no-store'`. (§1.1)
- **AC2** — `snapshot()` calls `GET /api/controller?org=<org>`, parses the `model.agents.*`
  projection (falling back to `model.resources[]` by `kind`), and renders an empty board (never
  throws) when `status!=='ready'` / `connection.available===false`. No per-run GET/PATCH route is
  assumed. (§1.2)
- **AC3** — AgentDefinition create/patch/get/delete hit `/agents/definitions[/<name>]` with the
  explicit `{ metadata:{name,labels?}, spec }` body; the client never sends
  `namespace`/`organizationRef`/org-label (server-forced); `422` is surfaced as a typed validation
  error. (§1.3)
- **AC4** — `createTask` → `POST /agents/dispatch` with `{ agentDefinition|agentStack, repository,
  ref:'main', taskKind, actor:'owner' }`; returns the new run `metadata.name`; `400`/missing-stack
  → `null`. (§1.4, §3.1)
- **AC5** — `abort` on a card → `POST /agents/runs/<name>/cancel` (no body); `404`→typed error;
  result reflected on the next refresh as a `Cancelled`→`backlog` card. (§1.5)
- **AC6** — The SSE stream is consumed via `EventSource` (`withCredentials:true`); heartbeats are
  ignored; every other frame schedules a debounced snapshot refresh; no frame mutates a resource
  directly; absent a cookie the client degrades to polling-only without error. (§1.6, §6.3)
- **AC7** — `getMemoryIO`/Archive use `POST /agents/memory/query` (lazy, cached per snapshot gen),
  map `GraphQueryResult.matches[]`→read entries and `AgentMemoryUpdate`/imports→write entries,
  and return empty (never throw) when the endpoint is unavailable. (§1.7, §2.6)
- **AC8** — `decide` on a kradle approval → `POST /agents/approvals/<name>/decide` with
  `'allow'→approve` / `'deny'→deny`; `<name>` resolved from `model.agents.approvals.pending`;
  invalid decision → `400` typed error. (§1.8, §3.3)
- **AC9** — Non-2xx responses throw `KradleControlPlaneError{status,endpoint,bodyExcerpt}`;
  `401/403/422` are non-retryable; snapshot-poll network/5xx failures keep the last snapshot and
  retry next interval; verbs reject; every request has a 5000ms abort timeout. (§1.9)
- **AC10** — `listStacks()` maps AgentStack + AgentDefinition → `SimStackView` (every field per the
  §2.1 table, deterministic defaults for missing model/prompt/approvalMode); `listRosterAgents()`
  maps `commander.a5c.ai/roster-name`-labeled AgentDefinitions → `SimRosterAgentView`. (§2.1)
- **AC11** — `listSessions`/`getSession` map AgentSession (+ AgentSessionTranscript) →
  `SimSessionView`/`SimSessionDetailView`, including the `status.phase`→session-status mapping and
  transcript message→`SimSessionTranscriptEntry` mapping. (§2.2)
- **AC12** — `mapCards` maps every `AgentDispatchRun.status.phase` (+ refinement labels) to a
  `ColumnId` per the §2.3.1 total table; `SimCardView`/`SimRunView`/`getRunObservation` fields per
  §2.3.2/§2.3.3; the kradle and gateway producers never write the same `commitTick` slice. (§2.3, §6.1)
- **AC13** — `getWorkspaceView`/`listWorkspaces` map KradleWorkspace (phase + gitStatus) per §2.5
  with documented-empty `files`/`tree`/`fileContent`/`gitLog`; memory silos/records per §2.6;
  `listProcessTemplates()` returns the synthesized `PHASES_BY_KIND` templates per §2.7. (§2.5–2.7)
- **AC14** — Each `Orders` verb maps to its §3 operation or stays a documented no-op (warn-once,
  type-appropriate empty, never throws); `decide`/`abort`/`answerInquiry` route to the correct
  plane per §3.3/§3; `deleteRosterAgent` is the one extra wired verb (`DELETE /agents/definitions/<name>`).
  (§3)
- **AC15** — `mode` defaults to `'mock'`; the mock boot path and all UI components are unchanged;
  composed real mode interleaves gateway frames + kradle board ticks through one `commitTick`
  without either clobbering the other; gateway-only real mode is identical to today when no kradle
  URL is set. (§4, §5, §6)
- **AC16** — `vite-env.d.ts` + `config.ts` add the `VITE_KRADLE_*` env/url-param fields; URL params
  win over env; a `mode:'real'` config is valid with `(gatewayUrl && token)` **OR** `kradleApiUrl`
  (kradle-only real mode); kradle fields are inert under `mode:'mock'`. (§4.1)
- **AC17** — The snapshot is refreshed on boot, on a 5000ms interval (floor of liveness), and on a
  ≤500ms debounce after each non-heartbeat SSE frame and after each successful write verb; SSE is
  additive and optional. (§6.3)
- **AC18** — The kradle client/cache/poll/SSE are constructed **only** when `kradleApiUrl` is set;
  otherwise `bootReal` is the current gateway-only frame binding with `realViewsStub`. (§4.2)
- **AC19** — No existing test or e2e is modified; new tests live under
  `src/backend/kradle/__tests__/`. (§7)
- **AC20** — TS strict, no `any` (narrow `unknown`), no new runtime dependency, no
  `@a5c-ai/kradle-sdk` import; the planned files exist at the exact §7 paths. (§6, §7)
