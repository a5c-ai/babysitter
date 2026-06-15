# Agent Layer Gaps — Full Agent Stack

Comprehensive inventory of missing capabilities, stub implementations, and architectural weaknesses across agent-core (L4), agent-runtime (L5), agent-platform (L6), tasks-adapter, tools-adapter, transport-adapter, and babysitter-sdk.

---

## agent-core (L4) — 47 gaps

### Critical (blocks production use)

| Gap | File | Description |
|-----|------|-------------|
| No streaming | `session.ts:200-257` | `prompt()` waits for full response, emits single `text_delta` with everything. No token-by-token streaming. |
| No multi-turn history | `session.ts:217-223` | Messages rebuilt from scratch each call. No persistent conversation context across `prompt()` calls. |
| Structured output follow-up work | `session.ts`, `types.ts` | Agent-core now exposes opt-in `json_object`/`json_schema` prompt output, provider request mapping, local parsing, and focused schema validation. Remaining gaps: full JSON Schema validator coverage and streaming structured-output integration (#575). |
| Token usage discarded | `session.ts:163-177` | Parsed from API response but never returned to caller or tracked cumulatively. |

### High (major feature gaps)

| Gap | File | Description |
|-----|------|-------------|
| Vision/multimodal follow-up work | `session.ts` | Agent-core now accepts direct prompt text/image URL/base64 content parts and maps them for OpenAI/Azure/Anthropic. Remaining gaps: streaming multimodal responses (#575), image-bearing `ToolResult` support (#588), and broader vision tool ergonomics. |
| No tool AbortSignal | `types.ts:86-96` | Custom tools can't be cancelled by framework. Each must own its timeout. |
| Token estimation remains heuristic | `context/token-estimator.ts` | Estimation is now provider/model-aware for OpenAI/Azure, Anthropic/Claude, and conservative unknown-model defaults, but still does not use exact provider tokenizer libraries or cost tracking. |
| `initialize()` is no-op | `session.ts:196-198` | No connection warmup, no schema cache, no health check. |
| No DI for LLM client | `session.ts:40-97` | Endpoint resolution hardcoded. Cannot inject custom fetch for testing/mocking. |
| Browser tool fragile | `agenticTools/browser/tool.ts` | Global singleton, no connection pool, no resource limits, screenshot returns metadata not images. |
| Web search hardcoded | `agenticTools/web/tools.ts:47-54` | DuckDuckGo HTML scraping only. No pluggable backend. Fragile to DOM changes. |
| No error types | `agenticTools/shared/results.ts` | All errors → text strings. No `ToolNotFoundError`, `TimeoutError`, etc. |
| Context summary is concatenation | `context/strategies/summary.ts:18-39` | No actual summarization. Evicted entries just joined with newlines. |

### Medium (architectural weaknesses)

| Gap | Description |
|-----|-------------|
| Concurrent strategy naive | `Promise.allSettled` with no per-agent timeout, no partial results, no graceful degradation |
| Group-chat moderator fragile | String matching for agent selection, no validation against agent list |
| Handoff has no state passing | Second agent doesn't know what first agent did. No context transfer. |
| No loop cancellation token | `run()` generator can't be externally cancelled |
| Oversight is single-pass | `maxRetries = 0` hardcoded. Reviewer can reject but no retry mechanism. |
| Delegation timeout ignored | `timeout` parameter accepted but never enforced |
| No plugin/extension API | DeferredToolRegistry exists but minimally integrated |
| No caching anywhere | Tool results, web fetches, schema fetches — nothing cached |
| Hardcoded limits | 50MB output, 120s bash, 30s search — not configurable |
| 7 test files for 59 sources | Agentic tools, error paths, loop strategies untested |
| Endpoint resolution duplicates adapters | Provider handling reimplemented instead of shared |

---

## agent-runtime (L5) — 48 gaps

### Critical

| Gap | File | Description |
|-----|------|-------------|
| K8s executor is stub | `execution/modes/kubernetes.ts:52-94` | Manifest builder only. No `kubectl apply`, no log streaming, no completion polling. Marks "running" without executing. |
| No crash recovery | `daemon/lifecycle.ts:78-148` | Daemon death loses all pending work. No auto-restart, no watchdog. |
| Crash recovery is partial | `daemon/lifecycle.ts`, `daemon/durableQueue.ts` | Trigger events can persist and replay through `DurableTriggerQueue`, but daemon death still has no auto-restart supervisor/watchdog flow. |
| Resource budgets not enforced | `resources/manager.ts` | Limits checked but not blocking. Agents can exceed budgets. |
| Telemetry has no export | `telemetry/provider.ts` | InMemoryTelemetryProvider only. Traces lost on process exit. No OTLP, no file export. |

### High

| Gap | File | Description |
|-----|------|-------------|
| Process isolation is partial | `execution/modes/local.ts`, `execution/policy.ts` | ExecutionPolicy now removes default parent env inheritance and fails fast for unsupported local network/kernel sandbox guarantees. Local mode is still a host process and does not provide namespaces, chroot, seccomp, or capability isolation. |
| No graceful drain | `daemon/lifecycle.ts:152-226` | SIGTERM + grace period, but no coordinated queue drain. Active runs waited but no cancellation signal. |
| No hot reload | `daemon/lifecycle.ts` | Config changes require full restart. Queue/active runs lost. |
| SSH — partial verification | `execution/modes/ssh.ts` | Strict host-key checking is now the default and `StrictHostKeyChecking=no` requires an explicit insecure policy opt-in. Retry, pooling, and keepalive are still missing. |
| Docker — partial sandbox policy | `execution/modes/docker.ts` | Docker args now include secure defaults plus resource/network/DNS policy support. Live daemon availability and image verification preflight remain missing. |
| External trigger sources are incomplete | `daemon/types.ts`, `daemon/loop.ts` | File/webhook/timer are hardened with durable retry/DLQ, dedupe windows, queue depth admission, and webhook rate limiting. Broker/chat/git trigger adapters are still missing. |
| Background process isolation/backpressure is partial | `backgroundProcessRegistry.ts` | Background execution now uses ExecutionPolicy env/cwd handling, retained/dropped stream byte metadata, optional process-group termination with grace escalation, timeout status, pause/resume capability checks, dependency queueing, and lifecycle hook diagnostics. Remaining gaps are OS-enforced isolation and daemon-level graceful drain/crash recovery. |

### Medium

| Gap | Description |
|-----|-------------|
| No CPU/memory/disk tracking | Only token/cost budgets. No system resource quotas. |
| No admission control | No pre-flight budget check before effect dispatch. |
| Cron advanced syntax is partial | Named days/months, timezone evaluation, standard macros, and `@reboot` are supported. `L` and `#N` calendar syntax remain unsupported. |
| No event-driven triggers | File/webhook/timer only. No message queue (RabbitMQ/Kafka/SQS). |
| Trigger rate limiting is local only | Webhook/loop admission supports local rate limits, dedupe windows, and queue caps. Distributed/adaptive throttling is still missing. |
| No structured logging | Append-only JSON log. No levels, no filtering, no rotation. |
| Health checks — no percentiles | Average latency only. No P50/P95/P99. |
| No metrics export | Snapshots computed but never sent to monitoring (Prometheus, CloudWatch). |
| No systemd/supervisor integration | Manual start/stop. No restart on reboot. |
| No distributed tracing | No W3C trace context, no OTLP spans. |
| No config migration | No version field. Schema changes break existing daemons. |
| Limited test coverage | No daemon loop integration tests, no crash recovery tests. |

---

## agent-platform (L6) — 40+ gaps

### Critical (blocks platform viability)

| Gap | File | Description |
|-----|------|-------------|
| MCP not integrated | `src/mcp/client/*` | Full MCP client, transport, executor implemented but NOT wired into orchestration. Tool routing disconnected. |
| ConcurrentEffects not implemented | `src/harness/types.ts:30` | Capability declared but effects processed sequentially. No Promise.all batching. |
| Breakpoints not integrated | `src/breakpoints/*` | Approval chains, delegation, postures defined but never invoked during orchestration. |
| Cost tracking not integrated | `src/cost/effectCost.ts` | Per-effect cost aggregation exists but not called during effect resolution. |
| Session budget enforcement partial | `src/session/cost.ts`, `src/harness/internal/createRun/orchestration/effects.ts` | Post-effect overlays now update session cost, mark thresholds, and set explicit auto-pause budgets paused; broader pre-dispatch admission control remains missing. |

### High

| Gap | File | Description |
|-----|------|-------------|
| BackgroundEffects not implemented | `src/harness/types.ts:32` | Declared but no non-blocking effect dispatch. Orchestration blocks on every effect. |
| MultiHarnessDispatch not implemented | `src/harness/types.ts:34` | No support for distributing effects across multiple harnesses. |
| Session history partially wired | `src/session/history.ts`, `src/harness/internal/createRun/orchestration/effects.ts` | Post-effect decisions/context snapshots and external run summaries are captured; broader internal-orchestration summary coverage remains to be expanded. |
| Session compaction partially triggered | `src/compression/compaction.ts`, `src/harness/internal/createRun/orchestration/effects.ts` | Post-effect overlays invoke compaction from estimated state size thresholds while preserving source journals/tasks. |
| Capability router partially wired | `src/harness/capabilityRouter.ts`, `src/harness/internal/createRun/utils.ts` | Explicit task execution/policy hints can route through capability scoring; default dispatch remains compatibility-preserving. |
| Model selection partially wired | `src/harness/modelSelection.ts`, `src/harness/internal/createRun/utils.ts` | Explicit `execution.model` hints can use model-aware harness selection; default routing is unchanged. |
| Fallback chains partially wired | `src/harness/fallbackChains.ts`, `src/harness/internal/createRun/utils.ts` | Explicit fallback-chain metadata can select the next installed harness; runtime retry policy still needs broader integration. |
| Sandbox policy not enforced | `src/governance/sandboxPolicy.ts` | Rules defined but not enforced on tool execution. |
| MCP channels disconnected | `src/mcp/channels/*` | Allowlist, inbound queue, outbound sender exist but not connected to interaction routing. |
| Streaming output not implemented | `src/harness/types.ts:93-100` | Type defined but no streaming callbacks in effect resolution. |

### Medium

| Gap | Description |
|-----|-------------|
| Conditional task routing partially integrated | Process JavaScript can branch on `ctx.task` results; remaining work is making declarative task dependencies and route metadata first-class. |
| Checkpointing partially integrated | SDK effect-group checkpoint metadata exists; process-level savepoint/replay contracts still need a durable public API. |
| No rollback/undo | Reversible effects and compensating actions still need an explicit non-rollbackable vs rollbackable contract. |
| Nested orchestration partially integrated | `subprocess` effects create child runs; child pending actions now use the same grouped dispatch path as top-level orchestration. |
| No process versioning | Breaking changes in process definitions unmanaged. |
| No multi-agent orchestration | No agent pools, discovery, or load balancing. |
| No tool discovery/registry population | `deferredToolRegistry.ts` exists but not populated. |
| No rate limiting per harness | No token bucket or sliding window. |
| No process dependency management | Tasks within a process can't declare dependencies. |
| Orchestration dispatch partially concurrent | Agent-platform groups same-iteration actions by `schedulerHints.parallelGroupId`, honors `maxConcurrency`/`executionStrategy`, preserves deterministic commit order, and routes per-action harness hints; broader agent-pool scheduling remains missing. |
| Session context plan-phase coverage partial | Bounded session context is injected into planProcess prompts when a current harness session context is resolvable; sessions without resolvable context keep the old prompt shape. |
| Daemon max concurrent runs defaults to 4 | Configurable via daemon config; the default may still need workload-specific tuning. |
| Selection policies partially wired | `src/harness/selectionPolicies.ts` can be invoked by explicit task metadata/execution policy hints; default dispatch remains unchanged. |

---

## tasks-adapter (Human-in-the-Loop & Task System) — 51 gaps

### Critical (blocks agent stack integration)

| Gap | File | Description |
|-----|------|-------------|
| Not wired into agent stack | `agent-core/tools/delegation.ts:86-98` | `task` tool uses generic `taskHandler` callback, NOT tasks-adapter. Breakpoints, responders, routing all disconnected from agent execution. |
| MCP tools not auto-discovered | `agent-platform/mcp/client/toolRegistry.ts` | Marked "NOT INTEGRATED YET". tasks-adapter MCP server has 8 tools but agent harness doesn't know they exist. |
| Breakpoint delegation disconnected | `agent-platform/breakpoints/delegation.ts:1-8` | Marked "NOT INTEGRATED YET". Webhook routing exists but not connected to tasks-adapter backends. |
| Native agent-core tools wrapping tasks-adapter are partial | — | tasks-adapter now exposes MCP tools such as `create_todo`, `assign_task`, `search_tasks`, `add_comment`, `bulk_update_tasks`, `task_stats`, `export_tasks`, and `escalate`; direct agent-core tool wrapping and auto-discovery remain separate integration work. |
| Approval chains not integrated | `agent-platform/breakpoints/approvalChains.ts` | Sequential/quorum approvals defined but never invoked during orchestration. |

### High (major task management gaps)

| Gap | Description |
|-----|-------------|
| Task priorities are partially implemented | Breakpoint schema now has `priority` (`low`, `medium`, `high`, `critical`) and git-native search can filter/sort by priority. Routing policy integration remains follow-up work. |
| Task dependencies are partially implemented | Breakpoint schema now has `dependsOn[]`; dependency-aware routing/blocking policy remains follow-up work. |
| Search/filter API is partially implemented | Git-native now exposes `searchBreakpoints(query)` with text/status/priority/assignee/responder/tag/domain/date filters, sorting, and pagination. External backend parity remains capability-gated. |
| Bulk operations are partially implemented | Git-native now supports bulk cancel/close/reassign/transition/approve with per-item results. External backend parity remains capability-gated. |
| No subagent spawning via task system | Agent-to-agent delegation doesn't route through responder discovery/matching. |
| No escalation chains | No fallback responders when initial responder times out. |
| MCP tools are partially implemented | tasks-adapter exposes native task tools including `create_todo`, `assign_task`, `search_tasks`, `add_comment`, `bulk_update_tasks`, `task_stats`, `export_tasks`, and `escalate`; cancellation remains covered by breakpoint APIs rather than a dedicated native-task alias. |
| Interactive forms are schema-only | Breakpoint schema includes form definitions/submissions, but no full conditional form UX or file review flow exists yet. |

### Medium

| Gap | Description |
|-----|-------------|
| Task states are partially implemented | Breakpoint status now includes `assigned`, `in-progress`, `blocked`, and `escalated`; broader routing semantics remain follow-up work. |
| Status history/timeline is partially implemented | Git-native appends history entries for create/assign/status/comment/answer operations. Cross-backend parity remains capability-gated. |
| Notifications are schema-only | Notification provider config exists and is disabled by default; real email, Slack, Discord, and webhook dispatch remains follow-up work. |
| Task metrics/SLA are partially implemented | Git-native computes deterministic status/priority counts and response/completion timing where available; responder performance analytics remain follow-up work. |
| Discussion threads are partially implemented | Git-native supports comments on breakpoints and MCP exposes `add_comment`; richer threaded UX remains follow-up work. |
| No offline queue | Server backend has no local fallback if server is down. |
| State machine validation is partially implemented | Shared transition validation rejects invalid terminal-state changes and git-native uses it for lifecycle transitions. |
| Audit log is partially implemented | Git-native appends audit entries for core task-management mutations. Cross-backend audit parity remains follow-up work. |
| CLI commands are partially implemented | `tasks-adapter tasks search|assign|close|comment|stats|export` cover local git-native task-management operations. Dedicated approve/templates/rules commands remain follow-up work. |
| Only 3 backends | git-native, server, github-issues. Missing: database, S3, Slack, Linear/Jira. |
| No schema migration | Can't upgrade breakpoint format across versions. |
| Responder matching not integrated | `responder-matcher.ts` exists but only used in CLI, not in agent routing decisions. |

---

## tools-adapter (Unified Tool Dispatch) — NOT INTEGRATED

tools-adapter provides ToolRegistry, ToolDispatcher (policy-driven routing), McpBridge, and schema translation for all providers (Anthropic, OpenAI, Google, Bedrock). None of it is wired into the agent stack.

### Critical

| Gap | Description |
|-----|-------------|
| Not used by agent-core | agent-core has DeferredToolRegistry (custom two-tier registry). tools-adapter's ToolDispatcher would provide unified dispatch policy across builtin, MCP, and plugin tools. |
| Not used by agent-platform | agent-platform has McpToolRegistry + McpToolExecutor (separate from tools-adapter). No unified tool dispatch mechanism. |
| 3 registries, no unification | DeferredToolRegistry (L4) + McpToolRegistry (L6) + ToolRegistry (tools-adapter). Should be one system. |
| Hook bridge is no-op | `ToolHookBridge` is `NoopToolHookBridge`. PreToolUse/PostToolUse hooks never fire. No hooks-adapter integration. |
| McpBridge is declarative-only | Registers MCP tool definitions but no runtime server lifecycle management. |
| No dynamic routing | Policy rules are static. No context-aware routing (by runId, sessionId, caller, cost). |
| No plugin tool type | DeferredToolRegistry handles plugins but tools-adapter doesn't. |

### Where it should plug in

```
agent-core tool_search/tool_fetch → tools-adapter ToolRegistry (replaces DeferredToolRegistry)
agent-core code_executor → tools-adapter ToolDispatcher.dispatch() (policy routing)
agent-platform MCP tools → tools-adapter McpBridge (unified registration)
hooks-adapter PreToolUse/PostToolUse → tools-adapter ToolHookBridge (permission/audit)
```

---

## transport-adapter (Protocol Translation) — PARTIALLY INTEGRATED

transport-adapter provides protocol translation (Anthropic↔OpenAI↔Google↔Bedrock↔Azure↔Vertex), codec system, completion engines with streaming, and an HTTP proxy runtime. Used by adapters launcher but disconnected from the rest of the agent stack.

### Gaps

| Gap | Description |
|-----|-------------|
| Cost feedback missing | Proxy extracts cost records per-request but never feeds them to SDK journal or L6 cost tracking. |
| Session-unaware | Proxy is stateless. No runId/sessionId tracking. Can't trace requests through distributed orchestration. |
| Codec discovery not pluggable | New providers require hardcoded codec registration. No plugin system. |
| Not integrated with L6 | agent-platform reads some codec metadata but doesn't feed tool definitions back to codecs. |
| "Provisional" cutover | Marked provisional in agent-catalog pending scorecard:migration gate. |

### Where it should plug in

```
adapters launcher → transport-adapter proxy (DONE — this works)
transport-adapter cost records → SDK journal appendEvent (MISSING — cost feedback loop)
transport-adapter request traces → L5 telemetry spans (MISSING — distributed tracing)
transport-adapter tool normalization → tools-adapter schema translation (MISSING — should share)
```

---

## babysitter-sdk (Foundation) — PARTIALLY LEVERAGED

SDK provides the effect journal, replay engine, task system (defineTask/ctx.task), runtime lifecycle, state cache, MCP server, and CLI. It's the foundation that L5/L6 build on, but several SDK features are unused.

### Gaps

| Gap | Description |
|-----|-------------|
| SDK MCP server orphaned | `createBabysitterMcpServer()` exposes task/run/session tools but never registered in tools-adapter McpBridge or L6 MCP client. |
| SDK tasks ≠ tasks-adapter | SDK has `defineTask()` / `ctx.task()`. tasks-adapter has `BreakpointBackend`. Two separate task systems that don't know about each other. |
| No subagent effect type | Journal tracks effects but has no entry type for cross-agent dispatch. adapters launches happen outside the journal. |
| Effect execution scattered | SDK journals effects but actual execution is hardcoded per-type across agent-platform (file, code, web) and adapters (harness launch). No unified effect executor. |
| No tool metadata in tasks | SDK tasks have descriptions but no JSON Schema parameters. agent-core's tool_fetch needs schemas for discovery. |
| Hooks disconnected | SDK has hooks/runtime.ts but no connection to hooks-adapter lifecycle events. |
| Plugin registry parallel | SDK has plugin registry, agent-platform has separate plugin system. |

### Where it should plug in

```
SDK MCP server → tools-adapter McpBridge → agent-core tool discovery (MISSING)
SDK defineTask → tasks-adapter BreakpointBackend (MISSING — for human-in-the-loop tasks)
SDK effect journal → subagent effect type → adapters adapter dispatch (MISSING)
SDK hooks → hooks-adapter lifecycle events (MISSING)
SDK effect execution → unified executor → tools-adapter dispatch (MISSING)
```

---

## genty → Agent-Adapter Cross-Agent Dispatch (NOT IMPLEMENTED)

genty should be able to dispatch subtasks to external agents supported by adapters (claude-code, codex, gemini-cli, copilot, etc.) through the runtime. This enables an genty orchestration to delegate specialist work to the best available agent.

### Missing Architecture

```
Current:
  genty → agent-core session (direct API) → single model, no tool agents

Needed:
  genty → agent-platform effect dispatch
    → SDK "subagent" effect type (journaled)
    → tasks-adapter routes to responder (adapters adapter)
    → adapters adapter launches target agent (claude-code, codex, etc.)
    → result posted back through tasks-adapter → SDK journal
    → orchestration continues with result
```

### Specific Gaps

| Gap | Description |
|-----|-------------|
| No subagent effect type in SDK | Need `kind: "subagent"` with `{ targetAgent, prompt, model, timeout }` |
| No adapters adapter selection in genty | genty doesn't know about adapters's adapter registry |
| No tasks-adapter routing for subagent dispatch | tasks-adapter routes to human responders, not to adapters adapters |
| No result collection from external agents | adapters launch returns stdout/stderr but no structured task result |
| No cross-agent session context | Dispatched agent doesn't see parent's context, files, or journal |

---

## External Issue Tracker Integration (MISSING)

tasks-adapter should support pluggable external issue tracker backends for subtask tracking, syncing breakpoints bidirectionally with the team's project management tools.

### Current State

Only `GitHubIssuesBackend` exists. Basic mapping of breakpoints to GitHub issues.

### Missing Backends

| Backend | Priority | Description |
|---------|----------|-------------|
| Jira | High | REST API integration. Map breakpoints to Jira issues. Bidirectional sync. |
| Linear | High | GraphQL API. Map to Linear issues. Automated status transitions. |
| Generic REST | High | Configurable HTTP adapter for any REST-based tracker. |
| Slack threads | Medium | Map breakpoints to Slack message threads for lightweight tracking. |
| Trello | Low | Board/card mapping. |
| Azure DevOps | Low | Work item integration. |

### Missing Sync Capabilities

| Gap | Description |
|-----|-------------|
| No bidirectional sync | GitHub Issues backend creates issues but doesn't sync status changes back. |
| No conflict resolution | If issue is updated in both places, no merge strategy. |
| No field mapping config | Fixed mapping. Can't customize which breakpoint fields map to which issue fields. |
| No webhook listeners | Can't receive push notifications from external trackers on status change. |
| No bulk sync | Can't sync all existing breakpoints to a tracker on first connect. |
| No backend plugin system | Adding a backend requires code changes, not configuration. |

---

## Cross-Layer Integration Gaps

| Gap | Layers | Description |
|-----|--------|-------------|
| ~~Background process registry duplicated~~ | ~~L4↔L5~~ | ~~Same code in 5 files across agent-core, agent-runtime, agent-platform~~ → runtime now owns the registry/state; core and platform keep shims |
| ~~Shell invocation duplicated~~ | ~~L4↔L5↔L6~~ | ~~5 locations with different flags (now unified but still duplicated)~~ → runtime now owns the shell argv contract |
| Endpoint resolution duplicated | L4↔adapters | agent-core reimplements provider handling that adapters owns |
| Cost tracking disconnected | L4→L5→L6 | Token usage parsed in L4, budgets in L5, enforcement supposed in L6 — none connected |
| Session state fragmented | L5↔L6 | Runtime has session types, platform has session management — not integrated |
| Telemetry isolated | L5 | In-memory only, never exported to L6 or external systems |
| Resource limits advisory | L5→L6 | Budgets exist in L5, capability routing in L6 — neither enforced at spawn time |
| tasks-adapter isolated from agent stack | L4↔tasks-adapter | Agent tools (task, ask) don't route through tasks-adapter. Breakpoints, responder discovery, routing all disconnected. |
| Breakpoint delegation disconnected | L6↔tasks-adapter | agent-platform breakpoint system and tasks-adapter backends are parallel implementations, not integrated |
| MCP tools not registered | L6↔tasks-adapter | tasks-adapter MCP server has 8 tools but agent harness doesn't discover or register them |
| Approval chains orphaned | L6↔tasks-adapter | Sequential/quorum approval logic in L6 is not wired to tasks-adapter routing/answering |
| 3 separate tool registries | L4↔tools-adapter↔L6 | DeferredToolRegistry (L4) + McpToolRegistry (L6) + ToolRegistry (tools-adapter) — should be unified |
| tools-adapter dispatch not used | tools-adapter↔L4 | ToolDispatcher exists with policy-driven routing but agent-core hardcodes tool execution |
| tools-adapter hooks stubbed | tools-adapter↔hooks-adapter | ToolHookBridge is NoopToolHookBridge. PreToolUse/PostToolUse never fire. |
| No subagent effect type | SDK↔adapters | SDK journal has no effect type for cross-agent dispatch. adapters launches happen outside journal. |
| SDK MCP server disconnected | SDK↔tools-adapter↔L6 | SDK's `createBabysitterMcpServer()` never registered in tools-adapter McpBridge or L6 MCP client |
| SDK tasks ≠ tasks-adapter | SDK↔tasks-adapter | SDK has its own task system (defineTask, ctx.task). tasks-adapter has BreakpointBackend. Neither knows about the other. |
| transport-adapter cost feedback missing | transport-adapter↔SDK | Proxy extracts cost records but never feeds them back to SDK journal or L6 cost tracking |
| transport-adapter session-unaware | transport-adapter↔L5 | Proxy is stateless. No runId/sessionId tracking for distributed observability. |
| No cross-agent task dispatch | tasks-adapter↔adapters | genty can't dispatch subtasks to external agents (claude-code, codex, etc.) via adapters adapters |
| No external issue tracker sync | tasks-adapter↔external | Only GitHub Issues backend. No Jira, Linear, or generic REST backend for pluggable subtask tracking. |

---

## Priority Fix Order

**P0 — Unblock production agent use:**
1. Streaming responses in agent-core session
2. Multi-turn conversation history
3. Unify tool registries: tools-adapter ToolDispatcher replaces DeferredToolRegistry + McpToolRegistry
4. Wire tasks-adapter into agent stack (native tools: todo, task, ask, approve, assign)
5. Wire MCP into agent-platform orchestration (connect tools-adapter McpBridge)
6. Complete ConcurrentEffects coverage beyond grouped agent-platform dispatch
7. Token usage tracking end-to-end (L4 → transport-adapter → SDK journal → L6 cost)

**P1 — Unblock platform features:**
1. Subagent effect type in SDK journal + genty → adapters adapter dispatch
2. Structured output / JSON mode hardening in agent-core (full schema validator coverage and streaming coordination)
3. Vision/multimodal input follow-through (#575 streaming responses, #588 image-bearing `ToolResult`)
4. Wire breakpoint delegation → tasks-adapter backends
5. Wire approval chains → tasks-adapter routing
6. Cost budget enforcement in orchestration (transport-adapter cost feedback → SDK)
7. Background effects (non-blocking dispatch)
8. tasks-adapter search/filter API + priorities + dependencies

**P2 — Integration & hardening:**
1. External issue tracker backends (Jira, Linear, generic REST) with bidirectional sync
2. genty cross-agent dispatch: tasks-adapter routes subtasks to adapters adapters
3. K8s executor implementation
4. Crash recovery + persistent queue in daemon
5. Process isolation/sandboxing
6. Distributed tracing (transport-adapter → L5 telemetry → OTLP export)
7. Tool cancellation via AbortSignal
8. tasks-adapter notifications, escalation chains, backend plugin system
9. SDK hooks → hooks-adapter lifecycle wiring
10. tools-adapter hook bridge → hooks-adapter PreToolUse/PostToolUse
