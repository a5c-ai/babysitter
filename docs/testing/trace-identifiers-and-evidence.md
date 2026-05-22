---
title: Trace Identifiers And Evidence
description: Identifiers, logs, files, and artifacts required to correlate primary E2E flows across agent-mux, babysitter-agent, Babysitter SDK, hooks-mux, and transport-mux.
last_updated: 2026-05-07
---

# Trace Identifiers And Evidence

Use this document as the evidence checklist for tests described in [Primary Flow Data Paths](./primary-flow-data-paths.md). A scenario should not be marked E2E unless it records the identifiers needed to join the agent session, hook events, Babysitter run state, and transport trace.

## Identifier Spine

| Identifier | Owner | Where it appears | Why it matters |
| --- | --- | --- | --- |
| `agentMuxRunId` / `runId` | Agent-mux | CLI result, gateway runtime state, event log filename or event body | Joins agent-mux session events to launch/transport evidence |
| `agentMuxSessionId` / `sessionId` | Agent-mux/external harness | CLI args, session runtime, harness transcript | Proves continuity across prompts, plugin command, and hook events |
| `babysitterRunId` / SDK `runId` | Babysitter SDK and babysitter-agent | `run:create` output, `.a5c/runs/<runId>/`, `babysitter-agent` progress events | Primary key for SDK journal, tasks, and terminal state |
| `runDir` | Babysitter SDK | `run:create` output, `babysitter-agent` progress events | Filesystem root for journal, tasks, outputs, and replay state |
| `babysitterSessionId` | SDK session binding or harness adapter | `session:init`, `session:associate`, run-create session block, hooks env | Joins harness session to SDK run loop |
| `effectId` | Babysitter SDK | `run:iterate` next actions, `task:list`, `task:post`, `tasks/<effectId>/` | Joins requested work to posted results |
| `taskId` / `stepId` | Babysitter process runtime | `task:list`, task definition refs | Names process step semantics independently of generated effect ID |
| `UnifiedHookEvent.execution.sessionId` | Hooks-mux | Normalized hook event JSON | Joins native hook event to agent or Babysitter session |
| `UnifiedHookEvent.execution.toolCallId` | Hooks-mux/native harness | Tool hook payloads and normalized event | Joins tool call ready/result pairs and handler decisions |
| `event.seq` | Agent-mux gateway event log | `packages/agent-mux/gateway/src/runs/event-log.ts` event entries | Orders session events and detects gaps/truncation |
| Transport request/trace ID | Transport-mux | Proxy request logs, trace query/headers, upstream metadata | Joins provider request/stream to agent-mux launch/session |

## Environment And Hook Context

| Variable or payload field | Produced by | Consumed by | Required assertion |
| --- | --- | --- | --- |
| `AGENT_SESSION_ID` | Hooks-mux bootstrap/session persistence or SDK harness adapter | Hook handlers, child commands, SDK session binding | Equals the scenario session ID and is stable across hook invocations |
| `AGENT_ADAPTER` | Hooks-mux normalized execution context | Hook handlers and trace artifacts | Equals selected adapter such as `claude`, `codex`, or `gemini` |
| `AGENT_WORKSPACE_ROOT` | Hooks-mux execution context | Hook handlers and subprocesses | Equals expected workspace/cwd |
| `AGENT_TRANSCRIPT_PATH` | Harness-native payload where available | Hook handlers and evidence collector | Points to redacted transcript artifact when available |
| `AGENT_CAPABILITIES_JSON` | Hooks-mux handler runner | Hook handlers | Captures adapter capability gate decisions |
| `HOOKS_PROXY_EVENT` | Hooks-mux handler runner | Hook handlers | JSON equals the normalized event given on stdin |
| `CLAUDE_ENV_FILE` | Claude native hook environment | Hooks-mux propagation backend | Contains exported persisted env after bootstrap or handler result |
| `HOOKS_PROXY_ENV_FILE` | Generic hooks-mux env propagation | Hooks-mux propagation backend | Contains persisted env when native env file is not provider-specific |
| `HOOKS_PROXY_SESSION_ID` | Adapter enrichment/fallback | Normalizer | Matches native session ID when adapter enriches env from stdin |
| `HOOKS_PROXY_TOOL_NAME` / `HOOKS_PROXY_TOOL_CALL_ID` | Adapter enrichment | Normalizer/handler env | Matches native tool payload values |

## Evidence Bundles By Flow

### Agent-Mux Plugin Path

A passing artifact bundle should include:

- `agent-mux` invocation: command, selected adapter, model, cwd, prompt digest, `runId`, session mode.
- Agent-mux event log: ordered `seq`, `ts`, `source`, event type, session/run IDs, terminal event.
- Harness/plugin setup: `babysitter harness:install <harness>` and `babysitter harness:install-plugin <harness>` output or a cached precondition artifact.
- Plugin command transcript: user command such as `/babysitter:call`, plugin dispatch evidence, assistant/tool result.
- Babysitter SDK run evidence: `runId`, `runDir`, `run:iterate` output, `task:list`, `task:post`, terminal journal state.
- Hook evidence: normalized session/tool/stop event, stop-hook decision, handler env snapshot with secrets redacted.

### Babysitter-Agent Runtime Path

A passing artifact bundle should include:

- `babysitter-agent call` or `babysitter-agent create-run` command and parsed options.
- Progress events for planning/process path, run creation, session binding, iteration start, effect resolution, and completion.
- Selected harness/backend: `agent-core` for internal primary tests, external harness name for bridge tests.
- Generated/provided process path and process fingerprint or file digest.
- SDK `runId`, `runDir`, session binding result, pending effects, posted task results, terminal state.
- Redacted model/provider trace for model-backed runs, or mock transcript for no-model runs.

### SDK Run/Session Loop

A passing artifact bundle should include:

- `babysitter run:create --json` output with `runId`, `runDir`, `entry`, `processId`, and session block if bound.
- `.a5c/runs/<runId>/` file listing or archived subset: metadata, journal/events, tasks.
- `babysitter run:iterate --json` outputs for each iteration.
- `babysitter task:list --pending --json` before each post.
- `babysitter task:post --json` output for every `effectId` resolved by the test.
- Final `run:status` or terminal journal event proving completion/failure.

### Hooks-Mux Path

A passing artifact bundle should include:

- Raw native hook fixture or redacted live stdin payload.
- CLI command: `a5c-hooks-mux bootstrap` or `a5c-hooks-mux invoke --adapter <name> --native-event <event>`.
- Adapter capabilities and mapping support level (`native`, `lossy`, `unsupported`).
- Normalized `UnifiedHookEvent` with `adapter`, `phase`, `rawEventName`, `supportLevel`, and `execution` fields.
- Handler plan and child-process result; include stdout/stderr and timeout status.
- Merged hook result, persisted env/context diff, and native renderer output.

### Transport-Mux Path

A passing artifact bundle should include:

- Agent-mux launch decision: native provider vs transport proxy, `proxyNeeded`, reason, route, and redacted env diff.
- Transport-mux route request: method, path, query/trace flag, upstream target, status code.
- Stream evidence: first byte/event, at least one delta, final event, cancellation/timeout case where applicable.
- Correlation to agent-mux `runId` or session ID.
- Explicit statement that Babysitter completion is out of scope unless a `babysitterRunId` and SDK terminal state are also present.

## Redaction Rules

- Never store provider API keys, OAuth tokens, cookies, or raw auth headers.
- Store model/provider names, endpoint family, status code, request shape, token counts, and timing metadata only after redaction.
- Prompt/transcript artifacts may store prompt digests and bounded excerpts; full live transcripts require a fixture-safe redaction pass.
- Hook env snapshots must include `AGENT_*` and `HOOKS_PROXY_*` correlation variables but remove credential variables.

## Failure Classification

| Failure class | Example | How to report |
| --- | --- | --- |
| Setup failure | Harness/plugin install fails | Mark setup lane failed; do not claim runtime E2E attempted |
| Capability skip | Codex plugin manager unsupported | Mark skipped with adapter capability artifact |
| Session correlation failure | Hook event session ID differs from agent-mux session ID | Fail E2E and attach both IDs plus raw/normalized hook evidence |
| SDK run failure | `run:iterate` emits `RUN_FAILED` | Fail Babysitter run path; attach journal and last effect result |
| Hook normalization failure | Native event maps to wrong phase/support level | Fail hooks-mux lane; attach raw payload and `UnifiedHookEvent` |
| Transport failure | Proxy stream times out or loses final event | Fail transport lane; attach route trace and agent-mux session state |
| Provider failure | Live model returns auth/quota error | Mark model-backed infra failure; keep no-model lane separate |

## Minimal Artifact Naming

Use deterministic artifact names so CI and local runs can be compared:

| Artifact | Suggested name |
| --- | --- |
| Agent-mux event log | `agent-mux-events-<agentMuxRunId>.ndjson` |
| Babysitter run summary | `babysitter-run-<babysitterRunId>.json` |
| Babysitter task bundle | `babysitter-tasks-<babysitterRunId>.json` |
| Hook normalized event | `hooks-mux-<adapter>-<nativeEvent>-<sessionId>.json` |
| Hook handler result | `hooks-mux-handler-<effect-or-tool-id>.json` |
| Transport trace | `transport-mux-trace-<agentMuxRunId>.json` |
| Redaction report | `redaction-report-<scenario-id>.json` |

## Scenario Completion Checklist

Before a scenario is labeled complete, verify:

- [ ] The primary path is declared: agent-mux plugin, babysitter-agent runtime, SDK run loop, hooks-mux fixture, or transport-mux route.
- [ ] All required identifiers for that path are present and joinable.
- [ ] The terminal condition is owned by the correct layer.
- [ ] Any capability gate or model credential requirement is explicit.
- [ ] Redaction completed before artifacts are uploaded.
- [ ] The scenario names which permutation IDs from [Stack Permutations](./stack-permutations.md) and which primary flow IDs from [Primary Flow Data Paths](./primary-flow-data-paths.md) it covers.