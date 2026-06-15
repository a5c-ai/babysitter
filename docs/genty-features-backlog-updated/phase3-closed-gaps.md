# Phase 3: Closed Gaps

69 of 147 gaps (47%) can be closed. Grouped by category below.

---

## Agent Delegation (2 closed / 8 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-AGENT-007 | Delegation Policy Layer | `governance/engine.ts`, `governance/categories.ts`, `governance/sandboxPolicy.ts`, `governance/postureBridge.ts`, `sdk/runtime/policy/engine.ts` |
| GAP-AGENT-008 | Harness Selection Policies | `harness/selectionPolicies.ts` (4 policies), `harness/capabilityRouter.ts` (selectHarness scoring) |

## Breakpoint Workflows (2 closed / 3 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-BRK-001 | Breakpoint Approval Chains and Escalation | `breakpoints/approvalChains.ts` (ApprovalChainStep, QuorumConfig, escalation) |
| GAP-BRK-002 | Breakpoint Delegation to External Systems | `breakpoints/delegation.ts`, `breakpoints/delegationTypes.ts` (webhook routing, async approval) |

## Effect Routing (1 closed / 3 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-ROUTE-001 | Smart Effect Routing Engine | `harness/capabilityRouter.ts`, `harness/selectionPolicies.ts`, `harness/modelSelection.ts` |

## Harness Adaptation (3 closed / 5 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-HADAPT-001 | Capability-Based Task Routing | `harness/capabilityRouter.ts` (buildTaskRequirements, selectHarness), `harness/types.ts` (HarnessCapability) |
| GAP-HADAPT-002 | Model Selection Per Task | `harness/modelSelection.ts` (task model preference to routing bridge) |
| GAP-HADAPT-004 | Harness Fallback Chains | `harness/fallbackChains.ts` (FallbackChain, FallbackResolution, exhaustion detection) |

## JSON Interaction (4 closed / 5 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-JSON-001 | JSON API for Run Creation and Management | `api/runs.ts` (ApiResult envelopes), `mcp/tools/runs.ts` (run_create, run_iterate, run_status) |
| GAP-JSON-002 | JSON Effect Dispatch and Response Protocol | `api/effects.ts`, `api/effectsTypes.ts` (listing, showing, cancelling, batch-committing) |
| GAP-JSON-003 | JSON Breakpoint Interaction API | `api/breakpoints.ts` (list pending, get context, approve/reject with feedback) |
| GAP-JSON-005 | JSON Event Stream (SSE/WebSocket) | `api/eventStream.ts`, `storage/journalWatcher.ts`, `mcp/transport/websocket.ts` |

## MCP Channels (3 closed / 4 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-MCPC-001 | MCP Channel Integration (Inbound) | `mcp/channels/channelManager.ts`, `mcp/channels/inboundQueue.ts` (WakeCallback) |
| GAP-MCPC-002 | MCP Channel Outbound Messaging | `mcp/channels/outbound.ts` (OutboundChannelSender, DEFAULT_CHANNEL_TOOL_MAPPINGS) |
| GAP-MCPC-004 | MCP Server Management UI and Connection Lifecycle | `mcp/client/manager.ts`, `mcp/client/config.ts`, `mcp/client/toolRegistry.ts` |

## Observability (3 closed / 8 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-OBS-001 | Run Health Snapshot | `observability/health.ts` (computeRunHealthFromEvents, RunHealthSnapshot, HealthConfig) |
| GAP-OBS-002 | Phase Timeline Visualization | `observability/timeline.ts` (PhaseTimeline, PhaseEntry, IterationTimeline, milestones) |
| GAP-OBS-004 | Policy Decision Trail | `governance/decisionTrail.ts`, `runtime/policy/logging.ts` (governance-decisions.jsonl) |

## Observer Integration (1 closed / 2 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-OBS-NEW-002 | Dashboard API for External Dashboards | `api/` module (runs, effects, breakpoints, eventStream), `mcp/tools/` JSON tools |

## Parallelization (2 closed / 7 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-PAR-002 | Async Effect Execution | `runtime/asyncEffects.ts`, `harness/backgroundTracker.ts` (BackgroundEffectEntry/Status) |
| GAP-PAR-009 | Parallel Effect Execution Strategies | `runtime/parallelStrategies.ts` (4 strategies), `tasks/concurrentExecution.ts` (waves) |

## Performance (3 closed / 8 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-PERF-005 | Cache-Aware Prompt Assembly | `prompts/strata.ts` (PART_STRATA_MAP, STRATUM_ORDER, composeByStrataWithMeta) |
| GAP-PERF-006 | Incremental Orchestration Streaming | `storage/journalWatcher.ts`, `api/eventStream.ts`, `mcp/transport/websocket.ts` |
| GAP-PERF-008 | Structured Continuity State | `session/continuityState.ts` (ContinuityPhase, decisions, files, findings) |

## Process Composition (2 closed / 4 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-PROC-002 | Process Nesting and Sub-Process Invocation | `runtime/intrinsics/subprocess.ts` (SubprocessInvocation, ctx.subprocess()) |
| GAP-PROC-004 | Process Parameter Schemas and Validation | `runtime/schemaValidator.ts`, SubprocessInvocation.inputSchema/outputSchema |

## Prompt Engineering (7 closed / 12 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-PROMPT-001 | Prompt Strata Model | `prompts/strata.ts` (STRATUM_ORDER, PART_STRATA_MAP, composeByStrataWithMeta) |
| GAP-PROMPT-002 | Deterministic Capability Projection | `prompts/capabilityCollector.ts` (sorted, deterministic CollectedCapabilities.all) |
| GAP-PROMPT-003 | Runtime Personality Overlays | `harness/modeSelector.ts` (4 modes with per-mode config) |
| GAP-PROMPT-005 | Continuity Overlays for Resume | `prompts/continuityOverlay.ts`, `prompts/parts/continuityOverlay.ts` |
| GAP-PROMPT-008 | Coding Philosophy Prompt Section | `prompts/parts/codingPhilosophy.ts`, `prompts/templates/coding-philosophy.md` |
| GAP-PROMPT-009 | Tool Preference and Usage Rules | `prompts/parts/toolPreferences.ts`, `prompts/templates/tool-preferences.md` |
| GAP-PROMPT-011 | Output Efficiency Rules | `prompts/parts/outputEfficiency.ts`, `prompts/templates/output-efficiency.md` |
| GAP-PROMPT-012 | Git Safety Protocol Prompt Section | `prompts/parts/gitSafety.ts`, `prompts/templates/git-safety.md` |

## Remote Integration (5 closed / 9 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-REMOTE-001 | Daemon Mode | `daemon/lifecycle.ts`, `daemon/loop.ts`, `daemon/fileWatcher.ts`, `daemon/timerScheduler.ts`, `daemon/webhookListener.ts` |
| GAP-REMOTE-004 | Cron Triggers and Scheduling | `daemon/timerScheduler.ts` (parseCron, macros, timezone, interval checking) |
| GAP-REMOTE-006 | MCP Client Integration | `mcp/client/manager.ts`, `config.ts`, `toolRegistry.ts`, `executor.ts` |
| GAP-REMOTE-008 | Streaming Orchestration Protocol | `storage/journalWatcher.ts`, `api/eventStream.ts`, WebSocket transport |
| GAP-REMOTE-009 | Host-Mediated Interaction | `api/breakpoints.ts`, `harness/hostContract.ts`, `mcp/channels/permissionRelay.ts` |

## Security (4 closed / 7 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-SEC-001 | Governance Policy Layer | `governance/engine.ts` (createPolicyEngine), `runtime/policy/types.ts`, `governance/categories.ts` |
| GAP-SEC-003 | Permission Request and Denial Hooks | `breakpoints/types.ts` (InteractionKind), `interaction/interactionRouter.ts`, `hooks/types.ts` |
| GAP-SEC-004 | Sandbox Toggle | `governance/sandboxPolicy.ts`, `governance/sandboxBridge.ts`, `harness/piSecureSandbox.ts` |
| GAP-SEC-005 | Approval Posture Model | `breakpoints/postures.ts` (DEFAULT_POSTURES), `governance/postureBridge.ts` |

## Session Management (3 closed / 5 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-SESSION-001 | Session-to-Run One-to-Many | `session/context.ts`, `session/history.ts`, `session/types.ts` (runIds) |
| GAP-SESSION-002 | Session State Persistence and History | `session/history.ts` (decisions, summaries, snapshots), `session/persistence.ts` |
| GAP-SESSION-004 | Session-Level Cost Tracking and Budgets | `session/cost.ts` (SessionBudget, SessionCostSummary, threshold alerts) |

## State Continuity (2 closed / 6 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-STATE-003 | Session State Persistence | `session/persistence.ts` (SessionFinding, modifications, patterns, preferences) |
| GAP-STATE-008 | Run Health Model | `observability/health.ts` (computeRunHealthFromEvents, RunHealthSnapshot, thresholds) |

## Subagent Observability (1 closed / 5 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-SUBOBS-003 | Per-Subagent Token and Cost Tracking | `cost/effectCost.ts` (EffectCostSummary, per-effect breakdown), `sdk/cost/` pricing |

## Tools Capabilities (13 closed / 20 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-TOOLS-008 | Web Search Agentic Tool | `agenticTools/web/tools.ts` (web_search with query, domains, exclude_domains) |
| GAP-TOOLS-014 | Programmatic Task CRUD | `tasks/crud.ts`, `api/effects.ts`, `mcp/tools/tasks.ts` |
| GAP-TOOLS-018 | Structured Planning Phase | `harness/planMode.ts` (PlanStep, status, dependencies, verification) |
| GAP-TOOLS-020 | Scheduled Orchestration Triggers | `daemon/timerScheduler.ts`, `daemon/automationExecutor.ts`, `daemon/loop.ts` |
| GAP-TOOLS-021 | External Event Triggers | `daemon/webhookListener.ts`, `daemon/fileWatcher.ts`, `daemon/automationExecutor.ts` |
| GAP-TOOLS-025 | MCP Tool Discovery and Invocation | `mcp/client/toolRegistry.ts`, `mcp/client/executor.ts`, `agenticTools/discovery/tools.ts` |
| GAP-TOOLS-027 | Skill Discovery and Invocation | `skills/` (SkillRouter, SkillDiscoveryService, SkillChainBuilder) |
| GAP-TOOLS-030 | Effect Cancellation | `runtime/commitEffectResult.ts`, `runtime/exceptions.ts`, `mcp/tools/tasks.ts`, `harness/invoker/processControl.ts` |
| GAP-TOOLS-033 | Runtime Configuration Tool | `agenticTools/config/tool.ts`, `agenticTools/config/state.ts` |
| GAP-TOOLS-034 | Dynamic Tool Discovery and Search | `harness/deferredToolRegistry.ts`, `agenticTools/discovery/tools.ts` |
| GAP-TOOLS-035 | Grep Output Modes and Context Params | `agenticTools/tools/fileSystem.ts` (output_mode, context, head_limit, multiline) |
| GAP-TOOLS-036 | Bash Background Execution | `agenticTools/tools/execution.ts`, `agenticTools/background/tools.ts` |
| GAP-TOOLS-038 | Ask Tool Interaction Model Alignment | `agenticTools/tools/delegation.ts` (mode: simple/structured) |

## User Experience (6 closed / 14 total)

| Gap ID | Title | Evidence |
|---|---|---|
| GAP-USER-001 | Operator Command Layer | `harness/operatorCommands.ts` (categories, commandTemplate, breakpoint integration) |
| GAP-USER-006 | Real-Time Cost Tracking | `cost/effectCost.ts`, `cost/pricing.ts`, `session/cost.ts` (budget auto-pause) |
| GAP-USER-012 | Plan Mode with Verification | `harness/planMode.ts` (full plan mode with approval/modification) |
| GAP-UX-005 | Structured Orchestration Status View | `observability/runStatus.ts` (getOrchestrationStatus, JSON output) |
| GAP-UX-006 | Pending Work Inspector | `observability/runStatus.ts` (getPendingWorkItems), `tasks/batching.ts` |
| GAP-UX-007 | Rich Breakpoint Interaction | `interaction/interactionRouter.ts`, `breakpoints/postures.ts`, `harness/operatorCommands.ts` |
| GAP-UX-014 | Operator Mode Selection | `harness/modeSelector.ts` (4 modes, getModeConfig/switchMode) |

---

## Category Completion Summary

| Category | Closed | Total | % Complete |
|---|---|---|---|
| Agent Delegation | 2 | 8 | 25% |
| Breakpoint Workflows | 2 | 3 | 67% |
| Ecosystem | 0 | 5 | 0% |
| Effect Routing | 1 | 3 | 33% |
| Harness Adaptation | 3 | 5 | 60% |
| JSON Interaction | 4 | 5 | 80% |
| MCP Channels | 3 | 4 | 75% |
| Observability | 3 | 8 | 38% |
| Observer Integration | 1 | 2 | 50% |
| Parallelization | 2 | 7 | 29% |
| Performance | 3 | 8 | 38% |
| Process Composition | 2 | 4 | 50% |
| Profile Orchestration | 0 | 1 | 0% |
| Prompt Engineering | 7 | 12 | 58% |
| Remote Integration | 5 | 9 | 56% |
| Run Lifecycle | 0 | 3 | 0% |
| Security | 4 | 7 | 57% |
| Session Management | 3 | 5 | 60% |
| State Continuity | 2 | 6 | 33% |
| Subagent Observability | 1 | 5 | 20% |
| Tools Capabilities | 13 | 20 | 65% |
| User Experience | 7 | 14 | 50% |
| **TOTAL** | **69** | **147** | **47%** |
