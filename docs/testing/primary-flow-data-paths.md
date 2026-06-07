---
title: Primary Flow Data Paths
description: Data-path map for the primary adapters, agent-platform, SDK run, hooks-adapter, and transport-adapter flows covered by the rebuilt E2E strategy.
last_updated: 2026-05-07
---

# Primary Flow Data Paths

This document maps the main flows that the rebuilt E2E strategy should prove. It is intentionally data-path oriented: every flow names the caller, command/API boundary, state that must be created, hook/session artifacts that should exist, and the identifiers that let a test join evidence across packages.

## Primary Configuration

The primary configuration has two valid runtime paths and one shared hook/trace layer:

| Path | Primary target | What it proves | What it must not claim |
| --- | --- | --- | --- |
| Adapters plugin path | Claude Code first; Codex only when capability-gated plugin support is available | A real external harness session can be launched through `adapters`, the Babysitter plugin can run a `/babysitter:call`-style session command, and the resulting Babysitter run reaches a terminal state | It does not prove `agent-platform` runtime orchestration and does not use `agent-platform create-run` |
| Babysitter-agent runtime path | `agent-platform call` / `agent-platform create-run` with `agent-core` internal backend, plus external-harness bridge where selected | The runtime can understand intent, create or reuse a process, create and bind a Babysitter SDK run, iterate effects, resolve tasks, and complete | It does not install external harness plugins; `babysitter harness:install` belongs to SDK setup, not this path |
| Hooks and transport layer | `hooks-adapter` and `transport-adapter` alongside either runtime path | Native hook payloads normalize into `UnifiedHookEvent`, handlers receive traceable env/stdin, and provider traffic can be proxied/recorded where configured | Hooks-adapter does not own adapters sessions; transport-adapter does not own Babysitter run state |

## Flow A: Agent-Adapter Plugin Session To Babysitter Run

This is the primary plugin E2E for Claude Code. Codex uses the same shape only after an explicit capability gate proves plugin install/support for the Codex adapter.

```text
operator / CI
  -> babysitter harness:install claude
  -> babysitter harness:install-plugin claude
  -> adapters CLI (`adapters run` or launch path)
  -> adapters adapter/runtime session
  -> external harness process (Claude Code primary)
  -> Babysitter plugin command inside the harness session
  -> Babysitter SDK run creation / iteration
  -> hooks-adapter native hook normalization and stop-hook evidence
  -> terminal Babysitter run state and adapters event log evidence
```

### Data Path

| Step | Boundary | Data passed | Required evidence |
| --- | --- | --- | --- |
| 1 | SDK setup CLI | Harness name and plugin target via `babysitter harness:install` and `babysitter harness:install-plugin` | Install JSON or log, installed plugin path, marketplace/registry entry, idempotency result |
| 2 | Adapters invocation | Agent name, prompt, `--session`, `--run-id`, cwd/env/model flags from `packages/adapters/cli/src/commands/run.ts` | `adapters` run ID, selected adapter, cwd, model, prompt digest, session mode |
| 3 | Adapters gateway/runtime | Session runtime and event log under `packages/adapters/gateway/src/runs/session-runtime.ts` and `packages/adapters/gateway/src/runs/event-log.ts` | Event-log file or API events with monotonic `seq`, `source`, `ts`, event type, `runId` |
| 4 | External harness | Native harness session ID, native hook payloads, tool calls, stop/session events | Harness transcript/session ID, native hook payload fixture or redacted live artifact |
| 5 | Babysitter plugin command | `/babysitter:call` or equivalent Babysitter-enabled session command posted in the harness | Assistant/tool transcript showing command, plugin dispatch evidence, created Babysitter `runId` |
| 6 | SDK run loop | `run:create`, `run:iterate`, pending effects, `task:post`, terminal completion | `.a5c/runs/<runId>/`, journal/events, `tasks/<effectId>/result.json`, terminal status |
| 7 | Hook bridge | `hooks-adapter` normalizes session/tool/stop hooks and injects `AGENT_*` env | `UnifiedHookEvent`, handler stdin/stdout, `AGENT_SESSION_ID`, stop-hook result |

### Assertions

- The adapters `runId` and session ID are recorded before the Babysitter plugin command runs.
- The Babysitter plugin command creates or resumes exactly one Babysitter `runId` for the scenario.
- The Babysitter `runId` appears in final output and maps to an existing `.a5c/runs/<runId>/` directory.
- At least one hook artifact proves stop/session handling, not just assistant text.
- The final state is terminal: `RUN_COMPLETED` or equivalent completed status from the SDK run, not merely a successful model reply.

## Flow B: Babysitter-Agent Runtime Create-Run

This path tests `@a5c-ai/genty-platform` as the runtime owner. It is separate from adapters plugin setup.

```text
operator / CI
  -> agent-platform call/create-run
  -> PhaseUnderstandIntent / PhasePlanProcess
  -> process definition in workspace `.a5c/processes` or provided `--process`
  -> Babysitter SDK `createRun`
  -> session binding for selected harness/backend
  -> PhaseOrchestration loop
  -> effect resolution through internal `agent-core` or external harness bridge
  -> SDK `commitEffectResult` / task result files
  -> terminal run completion
```

### Data Path

| Step | Boundary | Data passed | Required evidence |
| --- | --- | --- | --- |
| 1 | `agent-platform` CLI | `call`, `create-run`, `yolo`, `plan`, `resume-run`; args parsed in `packages/genty/platform/src/cli/dispatch.ts` | Invocation command, selected harness, workspace, model, max iterations, output mode |
| 2 | Create-run coordinator | `handleHarnessCreateRun` in `packages/genty/platform/src/harness/internal/createRun/index.ts` | Progress events for planning, process path, run creation, session binding |
| 3 | Planning phase | Prompt, workspace context, selected harness, compression config | Process file path, process fingerprint or generated process report, optional planning conversation summary |
| 4 | SDK run creation | `createRun` through `packages/babysitter-sdk/src/cli/main/runCreate.ts` or SDK API | `runId`, `runDir`, process ID, entrypoint, inputs path, non-interactive metadata |
| 5 | Session binding | Selected harness session ID from `resolveHarnessSessionIdForBinding` and SDK session state | Babysitter session ID, state file, run/session association, harness name |
| 6 | Orchestration loop | `orchestrateIteration`, pending `EffectAction`s, `resolveEffect`, `commitEffectResult` | Iteration count, pending effect IDs, task IDs, task result refs, stdout/stderr refs |
| 7 | Effect execution | Internal `agent-core` for internal harnesses; external bridge for external harnesses | Model/provider trace redacted, backend name, task result JSON, errors/retries if any |
| 8 | Terminal state | SDK journal and completion proof | `RUN_COMPLETED`, final summary, completion proof only after terminal state |

### Assertions

- Runtime tests invoke `agent-platform`, not `babysitter harness:install`.
- The selected harness/backend is recorded (`agent-core` for the internal primary path; external harness bridge only for explicit external-harness tests).
- The created or resumed `runId` is bound to a session and appears in SDK state and final output.
- Every pending effect has a posted result or a declared failure, keyed by `effectId`.
- A terminal Babysitter state is the pass condition.

## Flow C: SDK Run/Session Loop

This is the deterministic contract shared by both runtime paths.

```text
babysitter run:create
  -> .a5c/runs/<runId>/ metadata + journal
  -> optional session binding through harness adapter
  -> babysitter run:iterate
  -> pending effects under tasks/<effectId>/task.json
  -> babysitter task:post
  -> result refs under tasks/<effectId>/
  -> repeated run:iterate
  -> RUN_COMPLETED / RUN_FAILED
```

### Command Boundaries

| Command | Owner | State created or read | Evidence key |
| --- | --- | --- | --- |
| `babysitter run:create --process-id ... --entry ... --inputs ...` | SDK CLI | Run directory, run metadata, initial journal, optional session binding | `runId`, `runDir`, `entry`, `processId`, `session.sessionId` |
| `babysitter session:init --session-id ...` | SDK CLI | Session state file | `stateFile`, iteration, max iterations |
| `babysitter session:associate --session-id ... --run-id ...` | SDK CLI | Session file updated with run ID | `stateFile`, `runId` |
| `babysitter run:iterate <runDir>` | SDK CLI/runtime | Replayed state, emitted effects, terminal events | `iteration`, `status`, `nextActions[].effectId` |
| `babysitter task:list <runDir> --pending` | SDK CLI/runtime | Pending task index | `effectId`, `taskId`, `stepId`, `kind`, `taskDefRef` |
| `babysitter task:post <runDir> <effectId> --status ok --value <file>` | SDK CLI/runtime | Task result, stdout/stderr refs, effect resolution journal event | `effectId`, `resultRef`, status |

## Flow D: Hooks-Adapter Native Hook Path

Hooks-adapter is the canonical hook-normalization and handler fan-out layer.

```text
native harness hook payload on stdin
  -> `a5c-hooks-adapter bootstrap` or `a5c-hooks-adapter invoke`
  -> adapter loader (the matching hooks-adapter adapter package for the selected harness)
  -> adapter normalizer
  -> `UnifiedHookEvent`
  -> handler plan + child-process handlers
  -> merged hook result
  -> session env/context persistence
  -> native renderer output back to harness
```

### Data Path

| Step | Boundary | Data passed | Required evidence |
| --- | --- | --- | --- |
| 1 | Native hook | Claude/Codex/Gemini/etc. JSON stdin and native event name | Raw hook payload fixture or redacted live payload |
| 2 | CLI entry | `bootstrap`, `invoke`, or `exec` in `packages/adapters/hooks/cli/src/cli/commands` | CLI args, adapter name, native event, explicit session override if any |
| 3 | Adapter load | `loadAdapter` resolves package and capabilities | Adapter name, capability JSON, phase mappings |
| 4 | Normalize | Adapter builds `UnifiedHookEvent` from `packages/adapters/hooks/core/src/types/event.ts` | `version`, `adapter`, `phase`, `rawEventName`, `supportLevel`, `execution.*` |
| 5 | Handler execution | `runPlan` injects event on stdin and context env into child handlers | Handler command, `HOOKS_PROXY_EVENT`, `AGENT_SESSION_ID`, `AGENT_ADAPTER`, timeout/result |
| 6 | Merge and persist | Merge result updates session persisted env/context vars | `persistEnv`, `contextVars`, `unsetEnv`, session file diff |
| 7 | Render | Adapter renderer writes native hook output | Native decision/output JSON and dropped/degraded fields |

### Assertions

- Tests assert both raw native event and canonical `phase`.
- `UnifiedHookEvent.execution.sessionId` matches the session used by adapters or Babysitter where the flow crosses that boundary.
- Stop-hook tests assert recursion guard/stop behavior explicitly.
- Handler env contains `AGENT_SESSION_ID` and `AGENT_ADAPTER`; sensitive provider keys are redacted from artifacts.

## Flow E: Transport-Adapter Assisted Agent-Adapter Launch

Transport-adapter belongs to provider/proxy transport, not Babysitter run state. The primary E2E use is to prove that an adapters launch can route provider traffic through a configured transport proxy and still complete a model-backed session.

```text
adapters launch/run
  -> launch decision: native provider vs transport-adapter proxy
  -> transport-adapter HTTP/SSE route
  -> upstream provider or mock transport
  -> streamed/non-streamed response
  -> adapters session event log
  -> optional hooks-adapter events from harness runtime
```

### Assertions

- Adapters launch evidence includes `proxyNeeded`/`proxyReason` or equivalent launch decision metadata.
- Transport evidence includes route, upstream target, status code, stream completion/cancellation, timeout behavior, and redacted auth metadata.
- The transport trace is correlated to an adapters `runId` or session ID.
- The transport test does not claim Babysitter completion unless a Babysitter run ID and terminal SDK state are also present.

## Valid Primary Test Set

| ID | Flow | Lane | Minimum proof |
| --- | --- | --- | --- |
| PF-1 | SDK run/session loop | No-model | Create run, list pending task, post result, complete run, inspect journal |
| PF-2 | Hooks-adapter Claude fixture | No-model | Session/tool/stop hook fixtures normalize and render; handler env contains trace IDs |
| PF-3 | Hooks-adapter Codex fixture | No-model | Session/tool aliases normalize, lossy/native support levels match mapping, handler env is present |
| PF-4 | Adapters mock session | No-model | `runId`, session event log, ordered events, terminal session output |
| PF-5 | Transport-adapter mock route | No-model | Proxy route roundtrip, stream and non-stream artifacts, timeout/cancel fixture |
| PF-6 | Babysitter-agent internal | Model-backed or controlled fake model | `agent-platform call/create-run`, `agent-core` backend, SDK run terminal state |
| PF-7 | Adapters + Claude + Babysitter plugin | Model-backed | Harness/plugin installed, `/babysitter:call`, adapters session log, SDK run terminal state, stop hook evidence |
| PF-8 | Adapters + Codex + Babysitter plugin | Capability-gated model-backed | Same as PF-7 only after plugin support is proven; otherwise skip evidence must cite capability gate |
| PF-9 | Adapters + transport-adapter live stream | Model-backed | Launch decision, proxy trace, streamed response, adapters session completion |

## Source Map

| Area | Source files to inspect first |
| --- | --- |
| Adapters CLI and sessions | `packages/adapters/cli/src/commands/run.ts`, `packages/adapters/cli/src/commands/launch.ts`, `packages/adapters/gateway/src/runs/session-runtime.ts`, `packages/adapters/gateway/src/runs/event-log.ts` |
| Babysitter-agent runtime | `packages/genty/platform/src/cli/dispatch.ts`, `packages/genty/platform/src/cli/commands/harness/createRun.ts`, `packages/genty/platform/src/harness/internal/createRun/index.ts`, `packages/genty/platform/src/harness/internal/createRun/orchestration/effects.ts` |
| SDK run/session loop | `packages/babysitter-sdk/src/cli/main/runCreate.ts`, `packages/babysitter-sdk/src/cli/main/taskCommands.ts`, `packages/babysitter-sdk/src/cli/commands/session/init.ts`, `packages/babysitter-sdk/src/cli/commands/session/associate.ts` |
| Hooks-adapter | `packages/adapters/hooks/cli/src/cli/commands/invoke.ts`, `packages/adapters/hooks/cli/src/cli/bootstrap-runtime.ts`, `packages/adapters/hooks/core/src/types/event.ts`, `packages/adapters/hooks/core/src/normalizer/runner.ts` |
| Transport-adapter | `packages/transport-adapter/src/index.ts`, `packages/transport-adapter/tests/e2e/http-roundtrip.test.ts`, `packages/transport-adapter/tests/runtime.test.ts` |