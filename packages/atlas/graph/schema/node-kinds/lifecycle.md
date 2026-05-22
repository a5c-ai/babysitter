# NodeKinds: Lifecycle Cluster

> Cluster 6 — Lifecycle (state machines). See [`README.md`](./README.md) for the full
> catalog.

This file specifies the eight NodeKinds that together describe the lifecycle of work
in the atlas stack: **`Run`**, **`Invocation`**, **`Session`**, **`Phase`**,
**`PhaseTransition`**, **`Effect`**, **`LifecycleState`**, and **`StateMachine`**.

A `Run` is the bounded orchestration unit (a5c-flavored, event-sourced via a journal).
An `Invocation` is one bounded agent execution — a single process spawn or its moral
equivalent. A `Session` is the persisted conversational state that may outlive a single
`Invocation` (and may fork). `Phase` and `PhaseTransition` describe sub-state-machines
attached to reliability-interface implementations. `Effect` is the unit of external
work a `Run` produces; `LifecycleState` and `StateMachine` are the meta-primitives that
let every other lifecycle node declare its state graph as graph data rather than as
hard-coded enums.

The cluster's purpose is to make every state-bearing thing in the runtime —
orchestration, agent process, conversation, phase machine, effect — describable as a
state machine in the catalog, with strict transitions, terminal states, and gates that
can be queried, validated, and rendered.

---

## NodeKind: `StateMachine`

### Purpose

A **`StateMachine`** is a named state machine over one target NodeKind. It is the
container for a set of `LifecycleState` nodes connected by `transitions_to` edges.
State machines are first-class graph entities so the runtime, validators, and docs all
read the *same* canonical machine definition.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `state-machine:run`, `state-machine:invocation`. |
| `displayName` | string | yes | Human-readable label. |
| `targetNodeKind` | string | yes | The NodeKind name this machine governs (`Run`, `Invocation`, `Session`, `Effect`, `Phase`). |
| `description` | markdown | yes | One paragraph on what the machine models. |
| `states` | list<map<id,displayName,terminal,description,entryActions,exitActions>> | optional | Inline state declarations (remodel 2026-04-29 — change J). Preferred for trivial machines; for machines whose states warrant separate files (rich metadata, many edges), use the separate `LifecycleState` NodeKind instead. Mutually exclusive in practice with declaring the same states as separate `LifecycleState` entries. |
| `transitions` | list<map<from,to,event,gate>> | optional | Inline transitions between inline states (remodel 2026-04-29 — change J). `from`/`to` are state ids. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `state_machine_for` | `NodeKind` | N:1 | The kind this machine governs. |
| `has_state` | `LifecycleState` | 1:N | Inverse of `belongs_to_machine`. |
| `has_phase` | `Phase` | 1:N | When the machine is a phase machine. |

### Evidence

`StateMachine` definitions are catalog-internal; they do not require external evidence,
but the validator enforces that every `targetNodeKind` resolves to a real NodeKind.

### Invariants

1. Every `StateMachine` MUST have at least two states (inline via `states[]` or
   separate `LifecycleState` entries), one of which is non-terminal (entry).
2. Every `StateMachine` MUST have at least one terminal state. The terminal-state
   check reads from `StateMachine.states[].terminal` when states are inline;
   otherwise it reads from each separate `LifecycleState.terminal` (remodel
   2026-04-29 — change J).
3. The set of states reachable via `transitions_to` (or via `transitions[]` when
   inline) from the entry state MUST cover every non-orphan state in this machine.

---

## NodeKind: `PhaseMachine`

### Purpose

A **`PhaseMachine`** is a finite-state machine specifically over `Phase` nodes,
declared by a reliability-interface impl. It is distinct from `StateMachine` —
which is general over any NodeKind. `PhaseMachine` is the concrete model
referenced from `ProcessDescriptor` runtime bindings (e.g. babysitter's
`phase-machine:default-process` covering intake → plan → execute → review →
done).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `phase-machine:<slug>`, e.g. `phase-machine:default-process`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | One paragraph on what the machine models. |
| `phases` | list<ref<`Phase`>> | yes | ≥2 entries; mirrors `has_phase` / `composed_of` edges. |
| `transitions` | list<ref<`PhaseTransition`>> | no | Ordered list of legal moves. Optional when transitions are inferred from each `PhaseTransition` node's `fromPhaseId`/`toPhaseId`. |
| `initialPhase` | ref<`Phase`> | yes | Entry phase. |
| `terminalPhases` | list<ref<`Phase`>> | yes | ≥1 entry; every entry MUST appear in `phases`. |
| `declaredBy` | ref<`Plugin`> \| ref<`ExtensionInterface`> | no | Which reliability-interface impl declared this machine. Optional for catalog-default machines. |
| `arbitrationPolicy` | enum<most-restrictive-wins,first-impl-wins,declared-precedence> | no | How to combine multiple phase machines when several reliability impls overlap. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `composed_of` / `has_phase` | `Phase` | 1:N | The phases governed by this machine. |
| `transitions_via` | `PhaseTransition` | 1:N | Legal moves between phases. |
| `declared_by` | `Plugin` \| `ExtensionInterface` | N:1 | Reliability-interface impl that declared the machine. |
| `state_machine_for` | `Run` | N:N | When a `Run` uses this PhaseMachine. |

### Invariants

1. `phases` MUST contain ≥2 entries.
2. `terminalPhases` MUST contain ≥1 entry, and every entry MUST appear in `phases`.
3. `initialPhase` MUST appear in `phases`.
4. `id` MUST start with `phase-machine:`.

---

## NodeKind: `LifecycleState`

### Purpose

A **`LifecycleState`** is a single state within a `StateMachine`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `lifecycle-state:invocation.running`. |
| `displayName` | string | yes | Human-readable label. |
| `stateMachineId` | ref `StateMachine` | yes | The machine this state belongs to. |
| `terminal` | bool | yes | Whether the state is terminal (no outgoing transitions). |
| `description` | markdown | yes | What the state means. |
| `entryActions` | list<string> | optional | Side-effect tags fired on entry. |
| `exitActions` | list<string> | optional | Side-effect tags fired on exit. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `belongs_to_machine` | `StateMachine` | N:1 | Mirrors `stateMachineId`. |
| `transitions_to` | `LifecycleState` | N:N | Carries `event` and `gate` attributes on the edge. |

### Invariants

1. If `terminal = true`, the state MUST NOT be the source of any `transitions_to` edge.
2. Every non-terminal state MUST be the source of at least one `transitions_to` edge
   (or be the entry state of an open-ended observer machine — declared on the
   `StateMachine`).
3. `stateMachineId` MUST agree with the `belongs_to_machine` edge target.

---

## NodeKind: `Run`

### Purpose

A **`Run`** is a bounded orchestration unit (event-sourced; journaled). A Run is
the top-level container. ONE Run may have MULTIPLE RunAttempts — each retry is a
new RunAttempt. The Run's status reflects the latest attempt's status. Distinct
from `RunAttempt` (per-attempt persisted record with retry/backoff metadata) and
`LiveSession` (the in-flight observable while an attempt is executing). Runs are
a5c-flavored: their state is derived from a journal of events and they own a
`runDir` on disk. A `Run` may spawn child runs (sub-orchestration) and is
parented to the `Effect` that requested it.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `run:01KQC...`. |
| `processId` | ref `Process` | yes | The process definition being orchestrated. |
| `processRevision` | string | yes | Revision/hash of the process at the time the run started. |
| `entrypoint` | string | yes | Named entrypoint within the process. |
| `request` | markdown | yes | The user's original request that triggered the run. |
| `prompt` | markdown | optional | Resolved prompt for the run, if distinct. |
| `inputSchema` | json | optional | Input schema declared by the process. |
| `outputSchema` | json | optional | Output schema declared by the process. |
| `runDir` | string | yes | On-disk directory holding journal, state cache, artifacts. |
| `parentRunId` | ref `Run` | optional | Parent run, when this is a sub-orchestration. |
| `parentEffectId` | ref `Effect` | optional | Effect in the parent run that spawned this one. |
| `layoutVersion` | string | yes | Version of the runDir layout. |
| `createdAt` | iso-timestamp | yes | When the run was created. |
| `completionProof` | string | optional | Proof token written when the run reaches `completed`. |

### State machine

Run state is declared via `StateMachine` `state-machine:run` with **4 states**:
`created`, `waiting`, `completed`, `failed`. State is derived from journal events:

| Event | Effect on state |
|---|---|
| `RUN_CREATED` | `→ created` |
| `EFFECT_REQUESTED` | `created → waiting` (or stays in `waiting`) |
| `EFFECT_RESOLVED` | resumes `waiting` (transient — re-enters `waiting` until next request) |
| `EFFECT_CANCELLED` | resumes `waiting` |
| `RUN_COMPLETED` | `waiting → completed` |
| `RUN_FAILED` | any non-terminal `→ failed` |

Terminal states: `completed`, `failed`.

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `produces_effect` | `Effect` | 1:N | All effects emitted by the run. |
| `child_of_run` | `Run` | N:1 | Mirrors `parentRunId`. |
| `child_of_effect` | `Effect` | N:1 | Mirrors `parentEffectId`. |
| `runs_via` | `Execution` | N:1 | Where the run executes. |
| `has_attempt` | `RunAttempt` | 1:N | catalog pass 49 — Run enumerates its RunAttempts (replaces `RunAttempt.runId` FK). |

### Evidence

`Run` records are runtime artifacts; their evidence is the journal itself
(`kindLabel: file`, pointing at `runDir/journal.jsonl`).

### Invariants

1. `completionProof` MUST be present iff state is `completed`.
2. State MUST be derivable from the journal alone — no out-of-band state writes.
3. `parentEffectId` and `parentRunId` MUST agree: the effect's owning run MUST equal
   the parent run.
4. `createdAt` MUST equal the timestamp of the first `RUN_CREATED` journal event.

---

## NodeKind: `Invocation`

### Purpose

An **`Invocation`** is one bounded agent execution: a single process spawn (Claude
Code, Codex, etc.) or its equivalent (a long-running container, a subagent thread).
Invocations are how `Run`s actually do agentic work; one run dispatches many
invocations through `Effect`s.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `invocation:01KQD...`. |
| `agentVersionId` | ref `AgentVersion` | yes | Which agent version this is. |
| `launchConfigId` | ref `LaunchConfig` | optional | Launch recipe used. |
| `executionId` | ref `Execution` | yes | Where the process runs. |
| `sandboxId` | ref `Sandbox` | optional | Sandbox profile applied. |
| `workspaceId` | ref `Workspace` | optional | Workspace context. |
| `worktreeId` | ref `Worktree` | optional | Specific worktree. |
| `runId` | ref `Run` | optional | Parent run, when the invocation is part of a run. |
| `sessionId` | ref `Session` | optional | Session this invocation reads/writes. |
| `spawnedAt` | iso-timestamp | yes | When the process was spawned. |
| `terminatedAt` | iso-timestamp | optional | When the process terminated; required iff state is terminal. |

### State machine

Declared as `state-machine:invocation` with **9 states**:

`spawned`, `running`, `paused`, `interrupted`, `aborted`, `timed-out`, `completed`,
`crashed`, `killed`.

Terminal: `aborted`, `timed-out`, `completed`, `crashed`, `killed`.

Strict transitions (a few highlights — full transition list lives in the YAML schema):

- `spawned → running` on `start`
- `running → paused` on `pause`; `paused → running` on `resume`
- `running → interrupted` on `interrupt`; `interrupted → running` on `resume`
- `running → completed` on `done`
- `running → aborted` on `abort`
- `running → timed-out` on `timeout` (gate: `now > spawnedAt + timeoutMs`)
- `running → crashed` on `crash`
- any non-terminal `→ killed` on `sigkill`

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `runs_via` | `Execution` | N:1 | Mirrors `executionId`. |
| `executes_in` | `Sandbox` | N:1 | Mirrors `sandboxId` when present. |
| `dispatched_by` | `Effect` | N:1 | The effect that spawned this invocation. |
| `belongs_to_run` | `Run` | N:1 | Mirrors `runId`. |
| `attached_to_session` | `Session` | N:1 | Mirrors `sessionId`. |

### Invariants

1. `terminatedAt` MUST be set iff state is terminal.
2. An invocation MUST reach a terminal state within its `LaunchConfig.timeoutMs` —
   if not, it MUST be transitioned to `timed-out`.
3. If `runId` is set, the run MUST have an `Effect` whose `dispatches_to` edge points
   to this invocation.

---

## NodeKind: `Session`

### Purpose

A **`Session`** is durable persisted conversational state — the transcript and
supporting artifacts that an agent can resume from. Distinct from `LiveSession`
(the ephemeral in-flight observable that shadows a Session while a RunAttempt is
executing). A session may outlive an invocation, and sessions can fork to create
branched conversational histories.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `session:01KQE...`. |
| `agentVersionId` | ref `AgentVersion` | yes | Which agent owns the session. |
| `format` | ref `SessionModel.format` | yes | Session file format (e.g., `claude-jsonl`, `codex-resp-log`). |
| `path` | string | optional | On-disk path, when the session is file-backed. |
| `createdAt` | iso-timestamp | yes | When the session was created. |
| `lastActiveAt` | iso-timestamp | yes | Most recent activity. |
| `parentSessionId` | ref `Session` | optional | Parent session if this is a fork. |
| `forkPoint` | string | optional | Anchor in the parent session at which this session forked. |

### State machine

Declared as `state-machine:session` with states: `created`, `active`, `suspended`,
`terminated`. Terminal: `terminated`.

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `forked_from` | `Session` | N:1 | Mirrors `parentSessionId`. |
| `attached_invocations` | `Invocation` | 1:N | Inverse of `attached_to_session`. |
| `uses_format` | `SessionModel` | N:1 | Mirrors `format`. |
| `has_live_session_shadow` | `LiveSession` | 1:N | catalog pass 49 — durable Session enumerates LiveSessions that shadow it. |

### Invariants

1. `forkPoint` MUST be set iff `parentSessionId` is set.
2. `lastActiveAt >= createdAt`.
3. If state is `terminated`, no further `attached_invocations` may be added.

---

## NodeKind: `Phase`

### Purpose

A **`Phase`** is a named state in a *phase machine* — a sub-state-machine attached to
a reliability-interface implementation (e.g., the `plan → research → implement → review`
sub-machine inside a babysitter run). Phases are not the same as `LifecycleState`s on
the top-level `Run` machine; they're reified separately so phase entry/exit can carry
markdown stop messages and gate checks.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `phase:plan`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | What the phase represents. |
| `phaseMachineId` | ref `StateMachine` | yes | The sub-state-machine this phase belongs to. |
| `entryStopMessage` | markdown | optional | Stop-message rendered when entering the phase. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `phase_in` | `StateMachine` | N:1 | The phase machine this phase belongs to. |
| `transitions_to_phase` | `Phase` | N:N | Via `PhaseTransition`. |

### Invariants

1. A phase machine MUST contain at least one initial phase and at least one terminal
   phase.
2. `phaseMachineId` MUST resolve to a `StateMachine` with `targetNodeKind = Phase`.

---

## NodeKind: `PhaseTransition`

### Purpose

A **`PhaseTransition`** is a transition between two phases, gateable by a named handler
(`phaseChangeCheck`). Transitions are first-class so docs and validators can reason
about every gated phase boundary in the system.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `phase-transition:plan-to-implement`. |
| `fromPhaseId` | ref `Phase` | yes | Source phase. |
| `toPhaseId` | ref `Phase` | yes | Target phase. |
| `gate` | string | yes | Name of the `phaseChangeCheck` handler that gates the transition. |
| `event` | string | yes | Event name that triggers the check. |
| `stopMessage` | markdown | optional | Rendered to the agent when the transition fires. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `transition_from` | `Phase` | N:1 | Mirrors `fromPhaseId`. |
| `transition_to` | `Phase` | N:1 | Mirrors `toPhaseId`. |

### Invariants

1. `fromPhaseId` and `toPhaseId` MUST share the same `phaseMachineId`.
2. `gate` MUST resolve to a registered `phaseChangeCheck` handler in the implementing
   reliability interface.

---

## NodeKind: `Effect`

### Purpose

An **`Effect`** is a unit of external work in a `Run` (a5c-flavored). Every side
effect a process emits — spawning a node task, opening a breakpoint, dispatching an
orchestrator task, sleeping, running a subprocess — is recorded as an `Effect` with a
deterministic `invocationKey` so re-runs can replay deterministically.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `effect:01KQF...`. |
| `runId` | ref `Run` | yes | Owning run. |
| `kind` | enum | yes | One of `node`, `breakpoint`, `orchestrator_task`, `sleep`, `subprocess`. |
| `taskId` | string | yes | Stable task identifier within the process. |
| `stepId` | string | yes | Step identifier within the process. |
| `invocationKey` | string | yes | Deterministic hash of `(processId, stepId, taskId)`. |
| `status` | enum | yes | One of `requested`, `pending`, `ok`, `error`, `cancelled`. |
| `requestedAt` | iso-timestamp | yes | When the effect was requested. |
| `resolvedAt` | iso-timestamp | optional | When the effect resolved; set iff status is terminal. |
| `taskDefRef` | string | yes | Reference to the task definition. |
| `inputsRef` | string | optional | Reference to inputs blob. |
| `resultRef` | string | optional | Reference to result blob (set on `ok`). |
| `stdoutRef` | string | optional | Reference to captured stdout. |
| `stderrRef` | string | optional | Reference to captured stderr. |
| `metadata` | map<string,any> | optional | Free-form metadata. |

### State machine

Effect-status state machine `state-machine:effect-status`:
`requested → pending → (ok | error | cancelled)`.

Terminal: `ok`, `error`, `cancelled`.

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `produced_by` | `Run` | N:1 | Mirrors `runId`. |
| `followed_by` | `Effect` | N:N | Sequence within the owning run. |
| `dispatches_to` | `Invocation` | N:1 | When the effect spawns an agent. |

### Invariants

1. `invocationKey` MUST be a deterministic function of `(processId, stepId, taskId)`.
2. `resolvedAt` MUST be set iff `status` is terminal.
3. `resultRef` MUST be present iff `status = ok`.
4. `dispatches_to` MUST be set iff `kind = node` and the effect has resolved.
5. `followed_by` MUST form a DAG within the owning run (no cycles).

---

## NodeKind: `SessionSemantics`

### Purpose

A **`SessionSemantics`** is the per-`AgentVersion` *behavioral* spec for how
sessions are detected, named, persisted, resumed, forked, and pruned. It is
distinct from `SessionModel` (Cluster 3): `SessionModel` captures the
persistence / control-plane / structured-transport triple (the *what*);
`SessionSemantics` captures the *how* — the env vars, path strategies, and
metadata fields the host harness uses to bind a process back to a session.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `session-semantics:<agent>@<range>`, e.g. `session-semantics:claude@>=0.0.0`. |
| `sessionSemanticsId` | string | yes | Stable id (typically equals `id`). |
| `agentId` | ref<`AgentProduct`> \| ref<`AgentVersion`> | yes | The agent this spec describes. |
| `versionRange` | versionRange | yes | **Evidence-bound.** Range over which the spec holds. |
| `sessionDirStrategy` | string | yes | **Evidence-bound.** The directory strategy (e.g. `.a5c/runs`, `~/.claude/projects/<hash>/`). |
| `sessionIdSources` | list<string> | yes | **Evidence-bound.** Ordered list of env vars / path tokens consulted to derive a session id (e.g. `[CLAUDE_ENV_FILE, CLAUDE_CODE_SESSION_ID]`). |
| `resumeSemantics` | markdown | yes | One-paragraph description of how a process is bound back to a prior session. |
| `forkSemantics` | markdown | no | Behavior when a session is forked. |
| `pruneSemantics` | markdown | no | Retention / pruning rules. |
| `concurrencyModel` | enum<single-writer,multi-reader,multi-writer,unspecified> | no | Concurrency expectations. |
| `multiTenantPolicy` | enum<isolated,shared,unspecified> | no | Multi-tenant safety policy. |
| `stateFilePatterns` | list<string> | no | Glob patterns for on-disk state files. |
| `pidMarkerPolicy` | enum<env-or-run-dir,run-dir-only,none> | no | Where the runtime drops a pid marker. |
| `metadataFields` | list<map<string,any>> | no | Structured map of metadata keys to env-var sources. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to_version` | `AgentVersion` | N:1 | The version this spec applies to. |
| `references_path` | `PathDescriptor` | N:N | Path descriptors referenced by `sessionDirStrategy` / `stateFilePatterns`. |
| `supersedes` | `SessionSemantics` | N:1 | Newer spec replacing an older range. |

### Evidence

`sessionDirStrategy`, `sessionIdSources`, and `versionRange` are evidence-bound at
**vendor-doc-or-better** when the agent is vendor-published.

### Invariants

1. `agentId` MUST resolve.
2. `sessionIdSources` MUST be non-empty.
3. Two `SessionSemantics` records for the same `agentId` MUST NOT have overlapping
   `versionRange`s unless one `supersedes` the other.

---

## NodeKind: `LifecycleSemantics`

### Purpose

A **`LifecycleSemantics`** is the per-`AgentVersion` runtime-lifecycle behavioral
spec: how runtime hooks are delivered, whether the stop hook is blocking, whether
background tasks are supported, whether checkpoints are documented, and how
plugin context is loaded. Distinct from the Run/Invocation/Session state machines
(which are catalog-internal); `LifecycleSemantics` is the *agent's* lifecycle
contract as observed from outside.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `lifecycle-semantics:<agent>@<range>`, e.g. `lifecycle-semantics:claude@>=0.0.0`. |
| `lifecycleSemanticsId` | string | yes | Stable id (typically equals `id`). |
| `agentId` | ref<`AgentProduct`> \| ref<`AgentVersion`> | yes | The agent this spec describes. |
| `versionRange` | versionRange | yes | **Evidence-bound.** |
| `runtimeHookMode` | enum<native-shell-hooks,native-shell-hooks-with-windows-support,native-hooks-with-extension-manifest,opt-in,unsupported-in-fallback,none> | yes | **Evidence-bound.** How runtime hooks are delivered. |
| `stopHookMode` | enum<blocking-stop-hook,advisory-stop-hook,after-agent-hook,session-end-hook,unsupported-in-fallback,none> | yes | **Evidence-bound.** Stop-hook semantics. |
| `backgroundTaskMode` | enum<supported,unsupported-documented,unknown,native,polled,none> | yes | **Evidence-bound.** Whether background tasks are supported. |
| `checkpointMode` | enum<auto,manual,documented,unspecified,none> | yes | **Evidence-bound.** Checkpointing behavior. |
| `pluginContextMode` | string | no | How plugin context is loaded (e.g. `plugin.json + marketplace hooks`, `package.json + hooks.json`). |
| `streamingResume` | enum<supported,degraded,none> | no | Whether streaming resume is supported. |
| `platformNuances` | list<string> | no | Per-platform nuances (e.g. `windows-hook-threshold:0.119.0`). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to_version` | `AgentVersion` | N:1 | The version this spec applies to. |
| `references_path` | `PathDescriptor` | N:N | Path descriptors referenced (hook scripts, plugin context dirs). |
| `supersedes` | `LifecycleSemantics` | N:1 | Newer spec replacing an older range. |

### Evidence

`runtimeHookMode`, `stopHookMode`, `backgroundTaskMode`, `checkpointMode` are all
evidence-bound at **vendor-doc-or-better**.

### Invariants

1. `agentId` MUST resolve.
2. Two `LifecycleSemantics` records for the same `agentId` MUST NOT have
   overlapping `versionRange`s unless one `supersedes` the other.
3. If `runtimeHookMode = unsupported-in-fallback`, every `HookMapping` for this
   agent MUST carry `requiresRuntimeHooks = false` or `supportLevel = unsupported`.

---

## Cross-cluster edges

| Edge | Description |
|---|---|
| `Run produces_effect Effect` | 1:N — a run owns its effects. |
| `Effect followed_by Effect` | N:N — sequence within a run. |
| `Effect dispatches_to Invocation` | N:1 — when an effect spawns an agent. |
| `Phase transitions_to Phase` | N:N — via `PhaseTransition`. |

---

## Examples

```yaml
# A Run with three Effects (orchestrator_task, breakpoint, sleep).
- id: run:01KQC9X8VYRT9PXXAMPLE
  processId: process:fix-failing-pipelines
  processRevision: "2026-04-21:abc123"
  entrypoint: main
  request: |
    Fix the failing CI pipelines on staging.
  runDir: ".a5c/runs/01KQC9X8VYRT9PXXAMPLE"
  layoutVersion: "v3"
  createdAt: "2026-04-28T09:14:02Z"
  completionProof: null
  state: waiting
  edges:
    produces_effect:
      - target: effect:01KQC9X9-orchestrator-task
      - target: effect:01KQC9XA-breakpoint
      - target: effect:01KQC9XB-sleep

- id: effect:01KQC9X9-orchestrator-task
  runId: run:01KQC9X8VYRT9PXXAMPLE
  kind: orchestrator_task
  taskId: triage-failing-jobs
  stepId: step-1
  invocationKey: "sha256:9f4b...e1"
  status: ok
  requestedAt: "2026-04-28T09:14:03Z"
  resolvedAt: "2026-04-28T09:14:48Z"
  taskDefRef: "tasks/triage.task.yaml"
  resultRef: "runDir://artifacts/triage-result.json"

- id: effect:01KQC9XA-breakpoint
  runId: run:01KQC9X8VYRT9PXXAMPLE
  kind: breakpoint
  taskId: confirm-rollback
  stepId: step-2
  invocationKey: "sha256:b2c7...44"
  status: pending
  requestedAt: "2026-04-28T09:14:49Z"

- id: effect:01KQC9XB-sleep
  runId: run:01KQC9X8VYRT9PXXAMPLE
  kind: sleep
  taskId: wait-for-deploy
  stepId: step-3
  invocationKey: "sha256:8a11...92"
  status: requested
  requestedAt: "2026-04-28T09:14:50Z"
  metadata:
    durationMs: 30000
```

```yaml
# An Invocation in `running` state.
- id: invocation:01KQD3HXP7-claude-code
  agentVersionId: agent-version:claude-code@1.x
  launchConfigId: launch-config:claude-code-sonnet-default
  executionId: execution:local-host
  sandboxId: sandbox:claude-code-default
  workspaceId: workspace:babysitter
  worktreeId: worktree:awesome-payne-d4cc8e
  runId: run:01KQC9X8VYRT9PXXAMPLE
  sessionId: session:01KQD3HXP7-main
  spawnedAt: "2026-04-28T09:15:01Z"
  state: running
  edges:
    dispatched_by:
      - target: effect:01KQC9X9-orchestrator-task
    runs_via:
      - target: execution:local-host
    executes_in:
      - target: sandbox:claude-code-default
```

```yaml
# A Session with a fork.
- id: session:01KQE7-main
  agentVersionId: agent-version:claude-code@1.x
  format: claude-jsonl
  path: "~/.claude/projects/babysitter/sessions/01KQE7-main.jsonl"
  createdAt: "2026-04-28T08:00:00Z"
  lastActiveAt: "2026-04-28T09:30:00Z"
  state: active

- id: session:01KQE7-fork-experiment
  agentVersionId: agent-version:claude-code@1.x
  format: claude-jsonl
  path: "~/.claude/projects/babysitter/sessions/01KQE7-fork-experiment.jsonl"
  createdAt: "2026-04-28T09:10:00Z"
  lastActiveAt: "2026-04-28T09:25:00Z"
  parentSessionId: session:01KQE7-main
  forkPoint: "msg:42"
  state: active
  edges:
    forked_from:
      - target: session:01KQE7-main
```

```yaml
# Run state machine declaration (4 states).
- id: state-machine:run
  displayName: Run lifecycle
  targetNodeKind: Run
  description: |
    Derived-from-journal state machine for orchestration runs.

- id: lifecycle-state:run.created
  stateMachineId: state-machine:run
  displayName: created
  terminal: false
  description: Run has been created; no effects yet requested.
- id: lifecycle-state:run.waiting
  stateMachineId: state-machine:run
  displayName: waiting
  terminal: false
  description: Run is waiting on one or more pending effects.
- id: lifecycle-state:run.completed
  stateMachineId: state-machine:run
  displayName: completed
  terminal: true
  description: Run finished successfully; completionProof is set.
- id: lifecycle-state:run.failed
  stateMachineId: state-machine:run
  displayName: failed
  terminal: true
  description: Run failed before reaching `completed`.

# transitions
- source: lifecycle-state:run.created
  edge: transitions_to
  target: lifecycle-state:run.waiting
  attrs: { event: EFFECT_REQUESTED }
- source: lifecycle-state:run.waiting
  edge: transitions_to
  target: lifecycle-state:run.completed
  attrs: { event: RUN_COMPLETED }
- source: lifecycle-state:run.waiting
  edge: transitions_to
  target: lifecycle-state:run.failed
  attrs: { event: RUN_FAILED }
- source: lifecycle-state:run.created
  edge: transitions_to
  target: lifecycle-state:run.failed
  attrs: { event: RUN_FAILED }
```

```yaml
# Invocation state machine declaration (9 states).
- id: state-machine:invocation
  displayName: Invocation lifecycle
  targetNodeKind: Invocation
  description: Strict process-spawn lifecycle with five terminal states.

- id: lifecycle-state:invocation.spawned
  stateMachineId: state-machine:invocation
  terminal: false
- id: lifecycle-state:invocation.running
  stateMachineId: state-machine:invocation
  terminal: false
- id: lifecycle-state:invocation.paused
  stateMachineId: state-machine:invocation
  terminal: false
- id: lifecycle-state:invocation.interrupted
  stateMachineId: state-machine:invocation
  terminal: false
- id: lifecycle-state:invocation.aborted
  stateMachineId: state-machine:invocation
  terminal: true
- id: lifecycle-state:invocation.timed-out
  stateMachineId: state-machine:invocation
  terminal: true
- id: lifecycle-state:invocation.completed
  stateMachineId: state-machine:invocation
  terminal: true
- id: lifecycle-state:invocation.crashed
  stateMachineId: state-machine:invocation
  terminal: true
- id: lifecycle-state:invocation.killed
  stateMachineId: state-machine:invocation
  terminal: true
```

---

## Invariants (cluster-wide)

1. **Run completion proof.** `Run.completionProof` is present iff `Run` state is
   `completed`.
2. **Invocation timeout.** Every `Invocation` MUST reach a terminal state within its
   declared `timeoutMs` budget, or be transitioned to `timed-out`.
3. **Phase machine well-formedness.** Every phase machine MUST have at least one
   initial phase and at least one terminal phase.
4. **Effect determinism.** `Effect.invocationKey` MUST be a deterministic function of
   `(processId, stepId, taskId)`; replays MUST produce identical keys.
5. **Effect resolution.** `Effect.resolvedAt` MUST be set iff `status` is terminal
   (`ok`, `error`, `cancelled`).
6. **Run/effect parentage.** If `Run.parentEffectId` is set, the effect's owning run
   MUST equal `Run.parentRunId`.
7. **Session fork integrity.** `Session.forkPoint` is set iff `parentSessionId` is set.
8. **State machine totality.** Every `LifecycleState` declared `belongs_to_machine`
   MUST be reachable from the machine's entry state via `transitions_to` (orphans are
   rejected).

---

## NodeKind: `AutomationRule`

### Purpose

An **`AutomationRule`** is a reactor rule that, on a trigger (timer cron expression
or webhook delivery), creates a canonical kanban issue from a fixed task template
and routes it onto a target board. AutomationRule sits between an external signal
(clock or HTTP delivery) and a `Run` / kanban issue: it does NOT mutate the board
directly — it always emits a canonical issue which is then projected onto a derived
board.

Sourced from `packages/agent-mux/core/src/automation.ts` (`AutomationRule`,
`TimerAutomationTrigger`, `WebhookAutomationTrigger`,
`AutomationTaskTemplate`, `AutomationRouting`) and the kanban service in
`packages/kanban/src/lib/services/automation-rule-service.ts`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g. `automation-rule:nightly-triage`. |
| `displayName` | string | yes | `AutomationRule.name` in the source. |
| `triggerType` | enum | yes | `timer` \| `webhook`. |
| `cron` | string | conditional | Required when `triggerType = timer`. |
| `timezone` | string | optional | IANA timezone for cron evaluation. |
| `webhookPort` | int | conditional | Required when `triggerType = webhook`. |
| `webhookPath` | string | optional | |
| `webhookMethod` | enum | optional | `POST` (currently the only supported method). |
| `webhookAuthType` | enum | optional | `none` \| `bearer`. |
| `sourceEvent` | string | optional | External event identifier (e.g. `github:issues.opened`). |
| `lifecycleState` | enum | yes | `draft` \| `active` \| `paused` \| `disabled` \| `archived`. |
| `targetProjectId` | string | yes | Canonical project the rule files issues into. |
| `targetBoardProjectId` | string | yes | Derived kanban board the issue projects onto. |
| `taskTemplateTitle` | string | yes | Drives created issue title. |
| `taskTemplatePriority` | enum | optional | `critical` \| `high` \| `medium` \| `low`. |
| `taskTemplateStatus` | enum | optional | `backlog` \| `ready`. |
| `routingAction` | enum | yes | Always combines `canonical-issue-create` + `shared-board-derive`. |
| `sourceKind` | enum | yes | `manual` \| `config-file` \| `api` \| `external-system`. |
| `createdAt` | iso-date | yes | |
| `lastTriggeredAt` | iso-date | optional | |
| `description` | markdown | optional | |

### Invariants

1. `triggerType = timer` ⇒ `cron` is present.
2. `triggerType = webhook` ⇒ `webhookPort` is present.
3. `routingAction` MUST always include `canonical-issue-create` + `shared-board-derive`
   (rule never mutates the board directly — see `AutomationRouting.mutateBoardDirectly: false`).

### Examples

- `graph/lifecycle/automation-rules/nightly-triage-timer.yaml`
- `graph/lifecycle/automation-rules/github-issue-webhook.yaml`

---

## catalog pass 18 additions — Symphony lifecycle, errors, recovery

The following NodeKinds were added in catalog pass 18 to model babysitter/Symphony
orchestration lifecycle, error taxonomy, and operator intervention. Origin tags
in parentheses follow the meta-schema rule (V-1.9).

### NodeKind: `RunAttempt` (origin: `convergent`)

#### Purpose

A **`RunAttempt`** is a single attempt within a `Run`. It carries retry-backoff
metadata and per-attempt status. Distinct from `Run` (which spans all attempts)
and `LiveSession` (which is the in-flight observable while THIS attempt is
executing). The owning Run is reached via the `attempt_of` edge (catalog pass 49 —
replaces the prior FK-by-attribute `runId`). A failed attempt does not invalidate
its parent `Run`; the run remains `waiting` until either an attempt succeeds or
the retry budget is exhausted.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `run-attempt:<runId>#<n>`, e.g. `run-attempt:01KQC...#3`. |
| `attemptNumber` | int | yes | 1-based attempt index within the run. |
| `dueAtMs` | int | optional | Unix-ms when the attempt is scheduled to start (for delayed retries). |
| `status` | enum<scheduled,running,succeeded,failed,cancelled> | yes | Attempt status. |
| `startedAt` | iso-timestamp | optional | Required iff status ∉ `scheduled`. |
| `finishedAt` | iso-timestamp | optional | Required iff status ∈ terminal. |
| `failureClassId` | ref `FailureClass` | optional | Required iff status = `failed`. |
| `errorCategoryId` | ref `ErrorCategory` | optional | Specific error within the failure class. |
| `recoveryStrategyId` | ref `RecoveryStrategy` | optional | Strategy applied for this attempt's failure. |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `uses_workspace` | `Workspace` | N:1 | Workspace bound for this attempt. |
| `for_issue` | `Issue` | N:1 | Issue this attempt is working on, when tracker-driven. |
| `has_live_session` | `LiveSession` | N:1 | The in-flight session backing this attempt. |
| `attempt_of` | `Run` | N:1 | catalog pass 49 — owning Run (replaces `runId` FK-by-attribute). |

#### Invariants

1. `id` MUST start with `run-attempt:`.
2. Attempt numbers within a `Run` MUST be contiguous starting at 1.
3. `finishedAt` set iff `status` ∈ {`succeeded`,`failed`,`cancelled`}.
4. `failureClassId` set iff `status = failed`.

---

### NodeKind: `LiveSession` (origin: `convergent`)

#### Purpose

A **`LiveSession`** is the ephemeral in-flight observable while a `RunAttempt` is
currently executing. It holds running token totals, the last stream event, the
agent-subprocess PID, and shadows the durable `Session` via the
`shadows_session` edge (catalog pass 49 — replaces the prior FK-by-attribute
`sessionId`). It disappears when the `RunAttempt` ends. Distinct from `Session`
(durable persisted state) and `RunAttempt` (the persisted record).

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `live-session:<slug>`, typically `live-session:<sessionId>#<spawn>`. |
| `agentSubprocessPid` | int | optional | OS pid; absent when the subprocess has exited. |
| `lastEvent` | enum (extends `streamEventKinds`) | optional | Last stream event observed. |
| `turnCount` | int | yes | Number of turns observed so far. |
| `lastTurnLifecycle` | enum `TurnLifecycle` | optional | Lifecycle stage of the most recent turn. |
| `inFlightTokensInput` | tokens | optional | Token total accumulated this live session. |
| `inFlightTokensOutput` | tokens | optional | Output token total accumulated this live session. |
| `tokenAccountingSemantics` | enum `TokenAccountingSemantics` | yes | How tokens are counted (per-turn vs. cumulative). |
| `state` | enum<spawning,active,draining,exited> | yes | LiveSession state. |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `shadows_session` | `Session` | N:1 | catalog pass 49 — durable Session this LiveSession shadows (replaces `sessionId` FK-by-attribute). |
| `driven_by_run_attempt` | `RunAttempt` | N:1 | Inverse of `RunAttempt.has_live_session`. |

#### Invariants

1. `id` MUST start with `live-session:`.
2. `agentSubprocessPid` MUST be set iff `state` ∈ {`spawning`,`active`,`draining`}.
3. `inFlightTokensInput` / `inFlightTokensOutput` are non-decreasing within a single
   live session.

---

### NodeKind: `OrchestratorState` (origin: `convergent`)

#### Purpose

An **`OrchestratorState`** is the per-orchestrator snapshot of cumulative
counters and concurrency state: codex totals, claimed-issue ids, current
concurrency level. Used by the Symphony orchestrator to drive backpressure and
reconciliation.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `orchestrator-state:<orchestratorId>`. |
| `codexTotals` | map<string,int> | yes | Per-codex aggregate counters (e.g., `{turnsTotal, tokensTotal, errorsTotal}`). |
| `claimedIssueIds` | list<ref `Issue`> | yes | Issues currently claimed for execution. |
| `concurrency` | int | yes | Current concurrency level. |
| `concurrencyMax` | int | yes | Configured maximum. |
| `lastReconciledAt` | iso-timestamp | yes | Most recent reconciliation pass. |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `snapshotted_by` | `RuntimeSnapshot` | 1:N | Inverse of `RuntimeSnapshot.snapshots_state`. |

#### Invariants

1. `id` MUST start with `orchestrator-state:`.
2. `concurrency <= concurrencyMax`.
3. `len(claimedIssueIds) <= concurrencyMax`.

---

### NodeKind: `DispatchPreflight` (origin: `convergent`)

#### Purpose

A **`DispatchPreflight`** records the validations performed before dispatching a
`RunAttempt`: workspace ready, agent binary present, tracker reachable, no
blocking errors. Distinct from `Reconciliation` because preflight runs *per
dispatch*, not on a periodic cadence, and the validations list is dispatch-shaped.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `dispatch-preflight:<runAttemptId>`. |
| `runAttemptId` | ref `RunAttempt` | yes | The attempt being dispatched. |
| `validations` | list<map<name,passed,detail>> | yes | Each declared check with pass/fail and detail. |
| `blockingErrors` | list<ref `ErrorCategory`> | yes | Errors that prevent dispatch (empty when preflight passes). |
| `outcome` | enum<pass,blocked> | yes | Aggregate outcome. |
| `evaluatedAt` | iso-timestamp | yes | When preflight ran. |

#### Invariants

1. `id` MUST start with `dispatch-preflight:`.
2. `outcome = pass` iff `blockingErrors` is empty.

---

### NodeKind: `Reconciliation` (origin: `convergent`)

#### Purpose

A **`Reconciliation`** is one reconciliation pass over orchestrator state: trigger,
outcome, and counts of items processed/healed/skipped. Periodic, not per-dispatch.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `reconciliation:<orchestratorId>#<n>`. |
| `orchestratorStateId` | ref `OrchestratorState` | yes | Orchestrator being reconciled. |
| `trigger` | enum<periodic-tick,event-driven,operator-requested,startup> | yes | What kicked off the pass. |
| `outcome` | enum<noop,healed,partial,blocked> | yes | Aggregate result. |
| `counts` | map<string,int> | yes | E.g. `{itemsScanned, itemsHealed, itemsSkipped}`. |
| `startedAt` | iso-timestamp | yes | |
| `finishedAt` | iso-timestamp | yes | |

#### Invariants

1. `id` MUST start with `reconciliation:`.
2. `finishedAt >= startedAt`.

---

### NodeKind: `OperatorInterventionPoint` (origin: `convergent`)

#### Purpose

An **`OperatorInterventionPoint`** is a declared point in the orchestration flow
where a human operator may step in: edit a workflow, change tracker state,
restart a service, drain an orchestrator, trigger a refresh. Distinct from
`HumanCheckpoint` (which is in-flow narrative) — operator interventions are
out-of-band operational hooks. (USER OVERRIDE 2026-05-01: kept as separate
NodeKind despite reviewer collapse recommendation.)

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `operator-intervention:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | What the intervention does. |
| `interventionKind` | enum<edit-workflow,change-tracker-state,restart-service,drain-orchestrator,trigger-refresh> | yes | Category. |
| `triggerSurface` | enum<filesystem,tracker-ui,api-endpoint,signal> | yes | How an operator triggers it. |
| `sideEffects` | list<string> | optional | Tags describing observable side effects. |

#### Invariants

1. `id` MUST start with `operator-intervention:`.

---

### NodeKind: `ErrorCategory` (origin: `standardized`)

#### Purpose

An **`ErrorCategory`** is a normalized error within a `FailureClass`. Symphony §10.6
declares the canonical 9 categories (`codex_not_found`, `invalid_workspace_cwd`,
`response_timeout`, `turn_timeout`, `port_exit`, `response_error`, `turn_failed`,
`turn_cancelled`, `turn_input_required`); tracker errors from §11.4 extend the set.
Per-category retryable, severity, and exitCode warrant instancing.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `error-category:<slug>`. |
| `displayName` | string | yes | |
| `description` | markdown | yes | |
| `failureClassId` | ref `FailureClass` | yes | Layer this category lives in. |
| `retryable` | bool | yes | Whether retry is sensible. |
| `severity` | enum<info,warn,error,fatal> | yes | |
| `exitCode` | int | optional | Process exit code mapped to this category, if any. |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `categorized_as` | `FailureClass` | N:1 | Mirrors `failureClassId`. |

#### Invariants

1. `id` MUST start with `error-category:`.
2. If `retryable = false`, no `RecoveryStrategy` may declare `handles_failure` to
   this category's failure class with `mode = retry`.

---

### NodeKind: `FailureClass` (origin: `standardized`)

#### Purpose

A **`FailureClass`** is a layer-level grouping of errors: `workspace`,
`agent-session`, `tracker`, `transport`, `orchestrator`. Two-level taxonomy with
`ErrorCategory` (specific) below.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `failure-class:<slug>`. |
| `displayName` | string | yes | |
| `layer` | enum<workspace,agent-session,tracker,transport,orchestrator,filesystem> | yes | Which subsystem layer. |
| `description` | markdown | yes | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `categorizes_errors` | `ErrorCategory` | 1:N | Inverse of `categorized_as`. |
| `handled_by_strategy` | `RecoveryStrategy` | N:N | Inverse of `handles_failure`. |

#### Invariants

1. `id` MUST start with `failure-class:`.

---

### NodeKind: `RecoveryStrategy` (origin: `standardized`)

#### Purpose

A **`RecoveryStrategy`** is a declared response to a `FailureClass`: retry with
backoff, escalate to operator, drain and restart, abandon, fall back to alternate
agent.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `recovery-strategy:<slug>`. |
| `displayName` | string | yes | |
| `mode` | enum<retry,escalate,drain-restart,abandon,fallback-agent,partial-state-recovery> | yes | |
| `backoffStrategy` | enum `RetryBackoffStrategy` | optional | Required iff `mode = retry`. |
| `maxAttempts` | int | optional | Required iff `mode = retry`. |
| `description` | markdown | yes | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `handles_failure` | `FailureClass` | N:N | The classes this strategy is registered for. |

#### Invariants

1. `id` MUST start with `recovery-strategy:`.
2. `mode = retry` requires `backoffStrategy` and `maxAttempts`.

---

### NodeKind: `PartialStateRecovery` (origin: `standardized`)

#### Purpose

A **`PartialStateRecovery`** describes how an orchestrator/agent recovers when only
a subset of state is available (lost session file but intact run dir, lost run dir
but tracker remembers state, etc.). Catalog-level descriptor of recoverability
matrices, not a per-incident record.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `partial-state-recovery:<slug>`. |
| `displayName` | string | yes | |
| `lostSurface` | enum<session-file,run-dir,journal,tracker-state,workspace> | yes | Which surface is missing. |
| `recoveryMode` | enum<resume-from-tracker,replay-journal,reseed-workspace,abandon-and-restart,manual> | yes | |
| `description` | markdown | yes | |

#### Invariants

1. `id` MUST start with `partial-state-recovery:`.

---

## Related

- [`README.md`](./README.md) — node-kind catalog and cluster index.
- [`channels-hooks.md`](./channels-hooks.md) — `HookSurface`s fire during
  `PhaseTransition`s and inside `Invocation`s.
- [`agent-stack.md`](./agent-stack.md) — `WorkflowDefinition`, `LaunchContract`
  (catalog pass 18 additions sourced there).
- `Workspace`, `Worktree`, `Execution`, `Sandbox` (Cluster 4) — surfaces invocations
  attach to.
- `Process` (Cluster 7-adjacent) — the process definition a `Run` orchestrates.
- `AgentVersion`, `LaunchConfig`, `SessionModel` (Cluster 3) — types referenced from
  `Invocation` and `Session`.
- Legacy reference: `wiki/legacy/a5c/journal-and-effects.md`.

---

## catalog pass 47 addition: ChildSession

### NodeKind: `ChildSession` (origin: `universal`)

#### Purpose

A **`ChildSession`** is a session spawned as a child of another session for
subagent or tool dispatch. Distinct from `Session` (which is a parent
runtime context). It records parent linkage, the dispatched Subagent (if
any), the ToolDescriptor that triggered the spawn, return-to address for
the result, and lifecycle timestamps.

A claude-code Task-tool spawn, a babysitter subprocess `kind:'agent'`
subtask, and a slash-command-invoked persona session all materialize as
ChildSession nodes — distinct from the durable `Session` they descend
from.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `child-session:<slug>`. |
| `displayName` | string | no | |
| `parentSessionId` | ref&lt;Session&gt; | yes | Parent runtime session this child descends from. |
| `spawnTrigger` | enum&lt;subagent-dispatch, tool-call, manual, scheduled-task&gt; | yes | What caused the spawn. |
| `subagentId` | ref&lt;Subagent&gt; | no | Required when `spawnTrigger=subagent-dispatch`. |
| `invokingToolId` | ref&lt;ToolDescriptor&gt; | no | The ToolDescriptor that triggered the spawn (e.g. claude-code's Task tool). |
| `lifecyclePolicy` | enum&lt;ephemeral, persistent, cached&gt; | yes | `ephemeral` ends when subagent returns; `persistent` survives parent run; `cached` is reused for similar tasks. |
| `startedAt` | iso-timestamp | no | |
| `endedAt` | iso-timestamp | no | |
| `status` | enum&lt;running, completed, failed, cancelled&gt; | no | |
| `returnedTo` | string | no | Where the result flows back (e.g. parent session's ToolResult). |

#### Invariants

1. `id` MUST start with `child-session:`.
2. `spawnTrigger=subagent-dispatch` implies `subagentId` is set.

#### Relationships

- `parent_session` → `Session` (inverse `has_child_session`)
- `runs_subagent` → `Subagent` (inverse `dispatched_to_child_session`)
- `runs_skill` → `Skill` (inverse `executed_in_child_session`)
- `invoking_tool` → `ToolDescriptor` (inverse `triggers_child_session`)

## catalog pass 52 — ActivityEntry and IssueDispatchState NodeKinds

catalog pass 52 promotes two kanban-level lifecycle entities extracted from
`packages/agent-mux/core/src/kanban.ts` (real production source) into
first-class NodeKinds.

### ActivityEntry

#### Purpose

An **`ActivityEntry`** is an entry in the kanban-level activity feed —
issue moved to In-Progress, decomposition added, dependency blocked,
PR linked, run dispatched. It is distinct from `RunJournalEvent`
(which records run-level effect events) and from `Span` (which records
observability traces). `ActivityEntry` is the user-visible audit trail
that surfaces in board / dashboard UI.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `activity-entry:<slug>`. |
| `displayName` | string | no | |
| `actorKind` | enum&lt;human, agent, system&gt; | yes | `KanbanActivityActorKind`. |
| `actorId` | string | no | id of the actor (Role, AgentVersion, system process). |
| `actorDisplayName` | string | no | |
| `entityKind` | enum&lt;project, issue, board, workspace&gt; | yes | `KanbanActivityEntityType`. |
| `entityId` | string | yes | |
| `action` | string | yes | e.g. `moved-to-in-progress`, `decomposition-added`, `run-dispatched`. |
| `summary` | markdown | no | |
| `createdAt` | iso-timestamp | yes | |

#### Invariants

1. `id` MUST start with `activity-entry:`.

#### Relationships

- `activity_for_issue` → `Issue` (inverse `has_activity_entry`)
- `activity_for_project` → `Project` (inverse `has_activity_entry`)
- `activity_for_workspace` → `Workspace` (inverse `has_activity_entry`)
- `activity_for_board_snapshot` → `BoardSnapshot` (inverse `has_activity_entry`)

### IssueDispatchState

#### Purpose

An **`IssueDispatchState`** records whether an `Issue` is currently
dispatchable to an agent (acceptance criteria + dependencies satisfied;
workspace ready) and the currently dispatched RunAttempt(s) if any.
It bridges `Issue` (catalog pass 19), `RunAttempt` (catalog pass 18), and
`AcceptanceCriterion` (catalog pass 32).

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `issue-dispatch-state:<slug>`. |
| `displayName` | string | no | |
| `readiness` | enum&lt;needs-decomposition, ready, blocked, dispatched, completed&gt; | yes | `KanbanDispatchReadiness`. |
| `blockedReasons` | list&lt;string&gt; | no | |
| `runIds` | list&lt;ref&lt;Run&gt;&gt; | no | |
| `sessionIds` | list&lt;ref&lt;Session&gt;&gt; | no | |
| `lastDispatchedAt` | iso-timestamp | no | |
| `renderedContext` | markdown | no | Rendered dispatch-context block. |

#### Invariants

1. `id` MUST start with `issue-dispatch-state:`.

#### Relationships

- `dispatch_state_of_issue` → `Issue` (inverse `has_dispatch_state`, 1:1)
- `dispatched_as_run_attempt` → `RunAttempt` (inverse `dispatch_origin`)

## catalog pass 53 — Agent-core robustness: RetryPolicy, TokenBudget

Two declarative policy NodeKinds extracted from the claude-code
`services/api/withRetry.ts` retry generator and pi-mono coding-agent retry /
budget patterns. Both are *policies* (declarative bindings consumed by an
AgentRuntimeImpl / AgentCoreImpl / ToolDescriptor / ModelTransportProtocol),
distinct from the per-instance `RecoveryStrategy` (which binds an action to a
single `FailureClass`) and from `BudgetPolicy` (cost ceiling, not token cap).

### NodeKind: `RetryPolicy`

#### Attributes

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | |
| `displayName` | string | yes | |
| `maxRetries` | int | no | claude-code `DEFAULT_MAX_RETRIES=10`. |
| `maxRetriesOnOverload` | int | no | claude-code `MAX_529_RETRIES=3`. |
| `baseDelayMs` | int | no | claude-code `BASE_DELAY_MS=500`. |
| `maxDelayMs` | int | no | Cap on per-attempt computed delay. |
| `backoffStrategy` | enum&lt;none,linear,constant,exponential,exponential-jitter&gt; | no | |
| `jitterFactor` | float | no | claude-code `0.25`. |
| `honorRetryAfterHeader` | bool | no | |
| `floorOutputTokens` | int | no | claude-code `FLOOR_OUTPUT_TOKENS=3000`. |
| `retryableStatusCodes` | list&lt;int&gt; | no | |
| `retryableErrorCategoryIds` | list&lt;ref&lt;ErrorCategory&gt;&gt; | no | |
| `foregroundOnlyOnOverload` | bool | no | claude-code `FOREGROUND_529_RETRY_SOURCES` gate. |
| `foregroundSources` | list&lt;string&gt; | no | |
| `variant` | enum&lt;default,persistent,fast-mode,background-bail,custom&gt; | no | |
| `heartbeatIntervalMs` | int | no | claude-code `HEARTBEAT_INTERVAL_MS=30000`. |
| `persistentMaxBackoffMs` | int | no | claude-code 5min. |
| `persistentResetCapMs` | int | no | claude-code 6h. |
| `fastModeCooldownMs` | int | no | |
| `fastModeShortRetryThresholdMs` | int | no | claude-code `SHORT_RETRY_THRESHOLD_MS=20000`. |
| `triggersFallbackModelOn` | enum&lt;none,repeated-overload,auth-fail,server-error&gt; | no | |
| `clearsAuthCacheOn` | list&lt;int&gt; | no | |
| `disablesKeepAliveOn` | list&lt;string&gt; | no | claude-code `ECONNRESET`, `EPIPE`. |
| `description` | markdown | no | |

#### Invariants

1. `id` MUST start with `retry-policy:`.

#### Relationships

- `governs_retries_for` → `AgentRuntimeImpl | ToolDescriptor | ModelTransportProtocol | AgentCoreImpl` (inverse `retries_governed_by`, N:N)
- `retries_error_category` → `ErrorCategory` (inverse `error_category_retried_by`, N:N)

### NodeKind: `TokenBudget`

#### Attributes

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | |
| `displayName` | string | yes | |
| `scope` | enum&lt;call,turn,run-attempt,run,session&gt; | yes | |
| `maxInputTokens` | int | no | |
| `maxOutputTokens` | int | no | |
| `maxTotalTokens` | int | no | |
| `contextWindowTokens` | int | no | |
| `floorOutputTokens` | int | no | claude-code `FLOOR_OUTPUT_TOKENS=3000`. |
| `safetyBufferTokens` | int | no | claude-code inline 1000. |
| `thinkingBudgetTokens` | int | no | |
| `enforcement` | enum&lt;advisory,reject,truncate,compact-on-overflow,downscale-output&gt; | no | |
| `onExceededAction` | enum&lt;error,trigger-compaction,trigger-fallback-model,reduce-max-tokens&gt; | no | |
| `description` | markdown | no | |

#### Invariants

1. `id` MUST start with `token-budget:`.

#### Relationships

- `enforces_token_budget` → `Run | RunAttempt | AgentVersion | AgentRuntimeImpl | AgentCoreImpl` (inverse `token_budget_enforced_by`, N:N)

