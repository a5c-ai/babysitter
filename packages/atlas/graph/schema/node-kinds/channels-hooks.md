# NodeKinds: Channels & Hooks Cluster

> Cluster 5 — Communication primitives. See [`README.md`](./README.md) for the full
> catalog.

This file specifies the five NodeKinds that describe how agents communicate with the
outside world and how the runtime is informed of (and can intercept) lifecycle
events: **`Channel`**, **`ChannelKind`**, **`Hook`**, **`HookSurface`**, and
**`HookFamily`**.

A `Channel` is a brokered communication surface (MCP endpoint, A2A peer, chat room,
mailbox) — the *medium* over which a message can be delivered. A `ChannelKind`
classifies channels by transport family. `Hook` is the umbrella concept (a lifecycle
callback). A `HookSurface` is one concrete hook event name, either *native* (vendor-
defined, e.g. Claude's `PreToolUse`) or *canonical* (the atlas normalization, e.g.
`canonical:pre-tool-use`). A `HookFamily` groups hooks by execution shape:
`shell-hook`, `in-process`, `observer`.

The cluster's purpose is to make every brokered surface and every lifecycle hook
observable as graph data: which agent emits which hook, which hooks are blocking,
which native names canonicalize to which canonical names, and which channels speak
which protocol.

---

## NodeKind: `Channel`

### Purpose

A **`Channel`** is one brokered communication surface over which messages flow between
agents and external peers (humans, other agents, services). Channels carry a
`kind` (the protocol family, an enum), a brokering primitive describing how delivery
works, and a `persistent` flag indicating whether the channel survives session
boundaries.

> **Remodel 2026-04-29:** the former `ChannelKind` NodeKind was collapsed into the
> `Channel.kind` enum attribute. The 4-value enum (mcp-channel / a2a-channel /
> chat-channel / mailbox-channel) was widened to include `http-sse-channel`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `channel:claude-ai-web`. |
| `displayName` | string | yes | Human-readable label. |
| `kind` | enum | yes | One of `mcp-channel`, `a2a-channel`, `chat-channel`, `mailbox-channel`, `http-sse-channel`, `webhook`, `email`, `sms`, `push`, `slack`, `desktop-notification`, `system-tray`. Collapsed from former ChannelKind NodeKind (2026-04-29). Widened 2026-05-01 (D-bonus.notifications, planner) with notification-channel kinds (webhook / email / sms / push / slack / desktop-notification / system-tray) — collapses NotificationChannel proposal into existing Channel.kind. |
| `endpoint` | string | yes | URL or transport-specific endpoint string. |
| `brokeringPrimitive` | markdown | yes | One paragraph describing how brokering works (who routes, who buffers, delivery semantics). |
| `persistent` | bool | yes | Whether the channel survives across sessions/invocations. |
| `description` | markdown | yes | What the channel is and what it's used for. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `realizes` | `Layer` | N:N | Stack-layer realization (typically Layer 5/8). |

### Evidence

`Channel.endpoint` and `brokeringPrimitive` are evidence-bound at
**vendor-doc-or-better**: only the channel operator's documentation (or a first-party
SDK/source) is sufficient.

### Invariants

1. `kind` MUST be one of the declared enum values (V-7.1).
2. If `persistent = false`, the channel MUST NOT be referenced by `Session.path` as
   long-lived storage.

---

## NodeKind: `HookSurface`

### Purpose

A **`HookSurface`** is one concrete hook *event name*. Hook surfaces split into:

- **native** — vendor-defined names (`PreToolUse` from Claude, `OnToolCall` from
  Codex, `pre_prompt` from Gemini, …); the agent emits them and a host harness
  receives them.
- **canonical** — atlas's normalization across vendors (`canonical:pre-tool-use`,
  `canonical:phase-change`, …); native surfaces are mapped to canonical surfaces via
  the `canonicalized_to` edge.

A surface declares its `direction` (pre / post / event), whether it is `blocking`
(can abort the operation), its `payloadSchema`, and its `family` (execution shape).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `hook-surface:pre-tool-use`, `hook-surface:claude.pre-tool-use`. |
| `displayName` | string | yes | Human-readable label. |
| `kind` | enum | yes | One of `native`, `canonical`. |
| `originVendor` | string | conditional | Required when `kind = native`. |
| `direction` | enum | yes | One of `pre`, `post`, `event`. |
| `blocking` | bool | yes | Whether the hook can block / abort the operation. |
| `payloadSchema` | json | yes | JSON Schema for the payload delivered to the hook. |
| `description` | markdown | yes | What event the surface represents. |
| `family` | enum | yes | Execution shape: `shell-hook`, `in-process`, or `observer`. Collapsed from former HookFamily NodeKind (remodel 2026-04-29). |
| `replacedBy` | ref `HookSurface` | optional | For deprecated surfaces (e.g., `BreakpointLegacy` → `DecisionPoint`). |

### Canonical hook list

Claude-led, normalized canonical:

- `PreToolUse`, `PostToolUse`
- `Stop`, `SubagentStop`
- `SessionStart`, `SessionEnd`
- `UserPromptSubmit`, `Notification`

Additional canonical (research-found in repo's HookSurface nodes):

- `AfterAgent`, `SessionIdle`, `ShellEnv`, `BeforePromptBuild`, `PreCompact`,
  `BeforeProviderRequest`

a5c-emitted canonical:

- `Start`, `Done`, `PhaseChange`, `PhaseChangeCheck`, `DecisionPoint`, `Wake`

Deprecated:

- `BreakpointLegacy` — replaced by `DecisionPoint`.

### Per-product native HookSurfaces

| Vendor | Native surfaces |
|---|---|
| Claude | `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Notification`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd` |
| Codex | `OnToolCall`, `OnStop` |
| Gemini | `pre_prompt`, `post_response` |
| Copilot | `preTool`, `postTool` |
| Cursor | `pre_tool`, `post_tool` |
| OpenCode | `on_step` |
| Pi / OMP / OpenClaw / Hermes | `onEvent` (generic) |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `emits_hook` | `AgentVersion` | N:N | Inverse: agent emits this surface. Carries `since` (semver). |
| `replaces` | `HookSurface` | N:1 | Deprecation chain. |
| `canonicalized_to` | `HookSurface` | N:1 | Native → canonical mapping. |

### Evidence

- `originVendor`, `direction`, `blocking`, and `payloadSchema` are evidence-bound at
  **vendor-doc-or-better** for native surfaces (only the vendor's documentation can
  authoritatively define their own hook).
- `canonicalized_to` mappings are catalog-internal but require a `claimedBy` reviewer
  on the canonicalization claim.

### Invariants

1. If `kind = native`, `originVendor` MUST be present.
2. Every native `HookSurface` MUST have either a `canonicalized_to` edge to a
   canonical `HookSurface` OR an `unsupported: true` flag (covered by an
   `OutOfScopeReason`).
3. If `blocking = true`, `family` MUST be `shell-hook` or `in-process` (the
   `observer` family is non-blocking by definition).
4. Deprecated surfaces (those with `replacedBy` set) MUST also carry a `replaces`
   edge from their successor to themselves (deprecation symmetry).
5. `direction = pre` implies `blocking` MAY be true; `direction = post` and
   `direction = event` MAY still be blocking when the family supports it (e.g.,
   `Stop` is `event`-direction but blocking).

---

## NodeKind: `HookMapping`

### Purpose

A **`HookMapping`** records how one canonical `HookSurface` (e.g.
`canonical:pre-tool-use`) is realized on one specific `AgentVersion` /
`PluginTarget`: the native event name the agent emits, the version range over
which the mapping holds, the delivery shape, and any vendor-specific quirks.

`HookMapping` is the n-ary record sitting between *canonical* `HookSurface` and
the agent that emits it. The legacy ontology already encodes this mapping per
`(canonical-hook, target)` pair; atlas reifies it so cross-product policies can query
"which native name does Claude emit for canonical pre-tool-use?" without
walking arbitrary edges.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `hook-mapping:<canonical-slug>:<target-slug>`, e.g. `hook-mapping:pre-tool-use:claude-code`. |
| `mappingId` | string | yes | Stable mapping identifier (typically equals `id`). |
| `hookId` | ref<`HookSurface`> | yes | The canonical `HookSurface` this mapping realizes. |
| `targetId` | ref<`AgentVersion`> \| ref<`PluginTarget`> | yes | The agent version or plugin target. |
| `nativeName` | string | yes | **Evidence-bound.** The vendor-defined event name on the target (e.g. `PreToolUse`, `pre_prompt`, `session.created`). |
| `versionRange` | versionRange | yes | **Evidence-bound.** Version range over which this mapping applies. |
| `requiresRuntimeHooks` | bool | yes | Whether the mapping requires the target's runtime-hook mode to be active. |
| `adapterFamily` | string | no | Adapter family on the host side (e.g. `claude`, `codex`, `cursor`, `gemini`, `copilot`, `opencode`, `openclaw`). |
| `payloadShape` | json | no | JSON Schema for the native payload as delivered by the target. |
| `delivery` | enum<shell,in-process,observer> | no | How the host delivers the hook. Defaults to the native surface's `family`. |
| `family` | enum<shell-hook,in-process,observer> | no | Optional override of the inherited HookSurface family. Collapsed from former HookFamily NodeKind (remodel 2026-04-29). |
| `blocking` | bool | no | Whether this specific mapping is blocking (may differ from canonical). |
| `supportLevel` | enum<supported,degraded,unsupported> | no | Per-mapping support level. |
| `notes` | markdown | no | Vendor-specific quirks (e.g. Codex Windows hook threshold, OpenCode `session.created` aliasing). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `maps_hook` | `HookSurface` | N:1 | The canonical surface the mapping realizes. |
| `emits_hook` | `AgentVersion` \| `PluginTarget` | N:1 | The target that emits the mapped native event. |

### Evidence

`nativeName`, `versionRange`, and `payloadShape` are evidence-bound at
**vendor-doc-or-better**: only the vendor's documentation (or a first-party SDK)
can authoritatively pin the native event name and payload.

### Invariants

1. `hookId` MUST resolve to a `HookSurface` with `kind = canonical`.
2. `targetId` MUST resolve.
3. If `supportLevel = unsupported`, the canonical surface MUST be marked with an
   `OutOfScopeReason` for this target.
4. `requiresRuntimeHooks = true` requires the target's `LifecycleSemantics.runtimeHookMode`
   to be one of `native-shell-hooks`, `native-shell-hooks-with-windows-support`,
   `native-hooks-with-extension-manifest`.

---

## Cross-cluster edges

| Edge | Description |
|---|---|
| `HookSurface emits_hook AgentVersion` | An agent version emits this hook (carries `since` semver). |
| `HookSurface replaces HookSurface` | Deprecation chain. |
| `HookSurface canonicalized_to HookSurface` | Native → canonical mapping. |
| `Phase transitions_to Phase via PhaseTransition` | (cross-cluster — see `lifecycle.md`). HookSurfaces such as `PhaseChange` fire on these transitions. |

---

## Examples

```yaml
# A ChannelKind: MCP channel.
- id: channel-kind:mcp-channel
  displayName: MCP channel
  kind: mcp-channel
  description: |
    Backed by the Model Context Protocol. Brokering is request/response with
    optional streaming notifications. Sessions are typically short-lived
    (per-invocation), but persistent MCP connectors (e.g. Claude.ai web
    channel) keep the channel alive across user turns.

# A Channel of that kind.
- id: channel:claude-ai-web
  displayName: Claude.ai web channel
  kind: channel-kind:mcp-channel
  endpoint: "https://claude.ai/mcp"
  brokeringPrimitive: |
    The Claude.ai web client opens an MCP connection to the user's selected
    connectors. The browser brokers tool calls between the model and the
    connectors; the connection persists for the duration of the chat.
  persistent: true
  description: |
    The Claude.ai web app's MCP surface, used to expose user-installed
    connectors to the model during a chat.
```

```yaml
# A canonical HookSurface (a5c-emitted, non-blocking, in-process).
- id: hook-surface:phase-change
  displayName: PhaseChange
  kind: canonical
  direction: event
  blocking: false
  family: hook-family:in-process
  payloadSchema:
    type: object
    required: [fromPhase, toPhase, runId]
    properties:
      fromPhase: { type: string }
      toPhase: { type: string }
      runId: { type: string }
      reason: { type: string }
  description: |
    Fires on every successful PhaseTransition within a Run. Observer-style
    notification; downstream handlers can record telemetry but cannot
    abort the transition. For gating use `PhaseChangeCheck` (blocking).
  edges:
    belongs_to_family:
      - target: hook-family:in-process
```

```yaml
# A native HookSurface (Claude PreToolUse) and its canonicalization.
- id: hook-surface:claude.pre-tool-use
  displayName: PreToolUse (Claude)
  kind: native
  originVendor: anthropic
  direction: pre
  blocking: true
  family: hook-family:shell-hook
  payloadSchema:
    type: object
    required: [tool_name, tool_input, session_id, transcript_path]
    properties:
      tool_name: { type: string }
      tool_input: { type: object }
      session_id: { type: string }
      transcript_path: { type: string }
  description: |
    Claude Code's pre-tool-use hook. Fired before every tool invocation.
    A non-zero exit code from the configured handler aborts the tool call.
  edges:
    canonicalized_to:
      - target: hook-surface:pre-tool-use
    emits_hook:
      - target: agent-version:claude-code@1.x
        attrs: { since: "1.0.0" }
    belongs_to_family:
      - target: hook-family:shell-hook

- id: hook-surface:pre-tool-use
  displayName: PreToolUse (canonical)
  kind: canonical
  direction: pre
  blocking: true
  family: hook-family:shell-hook
  payloadSchema:
    type: object
    required: [toolName, toolInput, sessionId]
    properties:
      toolName: { type: string }
      toolInput: { type: object }
      sessionId: { type: string }
      transcriptPath: { type: string }
  description: |
    The atlas canonical pre-tool-use hook. Native surfaces from each vendor
    are normalized to this surface so cross-product policies and
    plugins can target a single name.
```

```yaml
# Canonicalization mapping in summary form.
canonicalizations:
  - native: hook-surface:claude.pre-tool-use
    canonical: hook-surface:pre-tool-use
  - native: hook-surface:codex.on-tool-call
    canonical: hook-surface:pre-tool-use
  - native: hook-surface:gemini.pre-prompt
    canonical: hook-surface:before-prompt-build
  - native: hook-surface:cursor.pre-tool
    canonical: hook-surface:pre-tool-use
  - native: hook-surface:opencode.on-step
    canonical: hook-surface:post-tool-use
```

---

## Invariants (cluster-wide)

1. **Native canonicalization.** Every native `HookSurface` MUST have a
   `canonicalized_to` edge to a canonical `HookSurface`, OR carry an
   `unsupported: true` flag with an `OutOfScopeReason`.
2. **Blocking family constraint.** A `HookSurface` with `blocking = true` MUST belong
   to family `shell-hook` or `in-process`. The `observer` family is non-blocking by
   definition.
3. **Channel kind validity.** `Channel.kind` MUST reference a valid `ChannelKind`
   node.
4. **Deprecation chain.** A deprecated `HookSurface` MUST have `replacedBy` set, and
   a corresponding `replaces` edge MUST exist from the successor to the deprecated
   surface.
5. **Native origin.** `originVendor` MUST be present iff `kind = native`.
6. **Family enum totality.** Every `HookSurface` MUST belong to exactly one
   `HookFamily`, drawn from the three declared enum kinds.
7. **Persistent mailbox sanity.** Channels with `kind = mailbox-channel` SHOULD have
   `persistent = true` (a non-persistent mailbox is a smell — flagged as a warning,
   not an error).

---

## NodeKind: `MergePolicy`

### Purpose

A **`MergePolicy`** is a named conflict-resolution policy applied by hooks-mux when
fanning out a single hook event across multiple registered handlers (plugins, settings
layers, capability profiles). It reifies the rules that produce a `HookMergeDiagnostic`:
which decision verb wins, how `persistEnv` / `unsetEnv` / `contextVars` /
`additionalContext` / `systemMessage` collapse across handlers, and what to do on
protected-prefix or namespace conflicts.

Sourced from `packages/agent-mux/hooks/core/src/merge-engine/merge.ts` (the `MergeOptions`
and `MergedExecutionResult` types).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `merge-policy:most-restrictive`. |
| `displayName` | string | yes | Human-readable label. |
| `decisionRule` | enum | yes | `most-restrictive-wins` \| `last-writer-wins`. hooks-mux default is `most-restrictive-wins` (deny<ask<allow<continue<noop). |
| `envMergeRule` | enum | yes | `deep-merge` \| `last-writer-wins` \| `fail-on-conflict` \| `protected-prefixes` \| `namespace-required`. |
| `protectedPrefixes` | list<string> | conditional | Required when `envMergeRule = protected-prefixes`. |
| `namespaceRequired` | bool | conditional | Required when `envMergeRule = namespace-required`. |
| `systemMessageStrategy` | enum | yes | `concatenate` \| `keep-first`. |
| `arraysMergeRule` | enum | yes | `replace` \| `concatenate`. hooks-mux's `deepMerge` replaces arrays. |
| `stopReasonRule` | enum | optional | How Stop hook stopReason strings collapse. |
| `description` | markdown | yes | What the policy does. |

### Invariants

1. `envMergeRule = protected-prefixes` requires a non-empty `protectedPrefixes`.
2. `envMergeRule = namespace-required` requires `namespaceRequired = true`.

### Examples

- `graph/channels-hooks/merge-policies/most-restrictive.yaml`
- `graph/channels-hooks/merge-policies/protected-prefixes.yaml`

---

## catalog pass 18 additions — Dashboard, HTTP extension, runtime snapshot, operational trigger

### NodeKind: `Dashboard` (origin: `universal`)

> **catalog pass 22 origin correction:** previously `standardized`; reclassified to
> `universal`. Dashboard is a universal observability/UI primitive — the atlas
> Symphony §13.7.1 framing happens to bind it to a specific format-enum, but
> the underlying concept (operator-facing data-bound surface) is universal.
> See `REMODEL-NOTES.md` (catalog pass 22 hygiene).

#### Purpose

A **`Dashboard`** is a human-readable status surface that renders runtime data —
TUI panel, ANSI text page, JSON-only endpoint. The 2026-04-29 collapse precedent
folds `HumanReadableStatusSurface` into this NodeKind via the `format` enum
(`tui-panel`, `ansi-text`, `json-only`).

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `dashboard:<slug>`. |
| `displayName` | string | yes | |
| `format` | enum `DashboardFormat` (`tui-panel`,`ansi-text`,`json-only`,`html`) | yes | Render format. |
| `dataSource` | enum<api-endpoint,runtime-snapshot,polled-file,event-stream> | yes | Where the dashboard reads from. |
| `refreshMode` | enum<poll,on-event,manual> | yes | |
| `loadBearing` | bool | yes | If `false`, the dashboard is advisory; the runtime MUST NOT depend on its presence (preserves `neverLoadBearing` semantics). |
| `description` | markdown | yes | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `reads_endpoint` | `APIEndpoint` | N:N | Runtime data binding (when `dataSource = api-endpoint`). |
| `derives_from` | `RuntimeSnapshot` | N:1 | Catalog provenance — which RuntimeSnapshot shape this dashboard renders (when `dataSource = runtime-snapshot`). |

`reads_endpoint` and `derives_from` are intentionally distinct: `reads_endpoint`
is a runtime data-flow edge; `derives_from` is a catalog-shape provenance edge.
Exactly one of the two SHOULD be primary for a given dashboard, matching the
`dataSource` value.

#### Invariants

1. `id` MUST start with `dashboard:`.
2. If `loadBearing = false`, dashboard absence MUST NOT block dispatch (V-rule).

---

### NodeKind: `HTTPServerExtension` (origin: `standardized`)

#### Purpose

An **`HTTPServerExtension`** is a host-side HTTP server surface that exposes one
or more `APIEndpoint`s for dashboards, operator interventions, and external
trigger ingestion.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `http-server:<slug>`. |
| `displayName` | string | yes | |
| `port` | int | yes | TCP port; `0` = ephemeral. |
| `bindAddress` | string | yes | `127.0.0.1`, `0.0.0.0`, or unix-socket path. |
| `authMode` | enum<none,bearer,oauth-mcp,mtls> | yes | |
| `description` | markdown | yes | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `exposes_endpoint` | `APIEndpoint` | 1:N | Inverse of `APIEndpoint.exposed_by`. |

#### Invariants

1. `id` MUST start with `http-server:`.

---

### NodeKind: `APIEndpoint` (origin: `standardized`)

#### Purpose

An **`APIEndpoint`** is a single HTTP route exposed by an `HTTPServerExtension`.
Endpoints may serve dashboard data, trigger operator interventions, or fire
operational triggers.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `api-endpoint:<server>/<route>`. |
| `path` | string | yes | URL path (e.g., `/runs/:id/status`). |
| `method` | enum<GET,POST,PUT,DELETE,PATCH> | yes | |
| `responseShape` | markdown | optional | Body shape description. |
| `description` | markdown | yes | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `exposed_by` | `HTTPServerExtension` | N:1 | The server that hosts this endpoint. |
| `fires_operational_trigger` | `OperationalTrigger` | N:N | When invoking the endpoint fires an operational trigger (renamed from `triggers` to avoid collision with hook/event triggers). |

#### Invariants

1. `id` MUST start with `api-endpoint:`.
2. `path` MUST start with `/`.

---

### NodeKind: `OperationalTrigger` (origin: `standardized`)

#### Purpose

An **`OperationalTrigger`** is a declared operational event the runtime can fire
(e.g., `refresh-tracker`, `drain-orchestrator`, `re-emit-snapshot`). Distinct
from `HookSurface` (which is in-flow agent-lifecycle hooks); `OperationalTrigger`
is operator-tier.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `operational-trigger:<slug>`. |
| `displayName` | string | yes | |
| `kind` | enum<refresh,drain,restart,resnapshot,reload-config> | yes | |
| `description` | markdown | yes | |

#### Invariants

1. `id` MUST start with `operational-trigger:`.

---

### NodeKind: `RuntimeSnapshot` (origin: `convergent`)

#### Purpose

A **`RuntimeSnapshot`** is a catalog-level descriptor of the snapshot shape the
runtime emits — declares which counters and which `OrchestratorState` fields are
captured, the snapshot interval, and inline runtime observation blocks
(including `lastRateLimitObservation`, the attribute block that subsumes the
rejected `RateLimitPayload` NodeKind).

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `runtime-snapshot:<slug>`. |
| `displayName` | string | yes | |
| `interval` | enum<on-event,periodic,on-demand> | yes | |
| `intervalMs` | int | optional | Required iff `interval = periodic`. |
| `capturedFields` | list<string> | yes | Field paths captured into the snapshot. |
| `lastRateLimitObservation` | map<capturedAt,vendor,primaryLimit,secondaryLimit,rawPayloadRef> | optional | Inline rate-limit observation block (replaces former `RateLimitPayload` NodeKind). |
| `description` | markdown | yes | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `snapshots_state` | `OrchestratorState` | N:1 | Which orchestrator-state shape this snapshot captures. |

#### Invariants

1. `id` MUST start with `runtime-snapshot:`.
2. `interval = periodic` requires `intervalMs > 0`.

---

## Related

- [`README.md`](./README.md) — node-kind catalog and cluster index.
- [`lifecycle.md`](./lifecycle.md) — `HookSurface`s fire during `PhaseTransition`s
  and inside `Invocation`s.
- `AgentVersion` (Cluster 3) — target of `emits_hook`.
- `Plugin`, `NativeExtension` (Cluster 7) — extensions that register hook handlers.
- `Capability` (Cluster 8) — hook surfaces gated by capability requirements.
- `HookMergeDiagnostic` (Cluster 7) — the *output* a `MergePolicy` produces when
  applied to a multi-handler fan-out.
- Legacy reference: `wiki/legacy/universal/05-hooks.md`,
  `wiki/legacy/a5c/canonical-hooks.md`.

