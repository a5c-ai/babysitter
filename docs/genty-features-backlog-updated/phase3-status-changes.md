# Phase 3: Status Reclassification -- All Changes

## Summary

| Final Status | Count |
|---|---|
| CLOSED | 69 |
| IN_PROGRESS | 49 |
| OPEN | 22 |
| NEEDS_RESPEC | 7 |
| OBSOLETE | 0 |
| BLOCKED | 0 |

**Total: 147 gaps**

Note: All 49 PARTIALLY_IMPLEMENTED gaps from the audit map to IN_PROGRESS. All 29 NOT_STARTED gaps from the audit become either OPEN (22) or NEEDS_RESPEC (7, where the spec's architectural assumptions are outdated).

---

## Status Changes from Original Inventory

The table below lists every gap where the final status differs from the original Phase 1 inventory status. Gaps that remained unchanged (original Partial -> IN_PROGRESS, original Missing -> OPEN) are included only when the assessment has materially changed.

### Gaps Upgraded to CLOSED (69 total)

These gaps are fully implemented and meet their target state.

| Gap ID | Title | Original Status | Final Status | Reason |
|---|---|---|---|---|
| GAP-AGENT-007 | Delegation Policy Layer | Missing | CLOSED | Full governance engine with policy engine, categories (A/B/C/D), sandbox policy, posture bridge. SDK PolicyRule types cover all required rule types. |
| GAP-AGENT-008 | Harness Selection Policies | Missing | CLOSED | selectionPolicies.ts provides 4 named policies. capabilityRouter.ts provides selectHarness with scoring against task requirements. |
| GAP-BRK-001 | Breakpoint Approval Chains and Escalation | Missing | CLOSED | approvalChains.ts provides multi-stage chains with ApprovalChainStep, QuorumConfig, and timeout-based escalation. |
| GAP-BRK-002 | Breakpoint Delegation to External Systems | Missing | CLOSED | delegation.ts provides webhook-based routing with DelegationRule, full async approval workflow with timeouts and retries. |
| GAP-HADAPT-001 | Capability-Based Task Routing | Partial | CLOSED | capabilityRouter.ts with buildTaskRequirements()/selectHarness(), HarnessCapability enum on all adapters, TaskRequirements fully defined. |
| GAP-HADAPT-002 | Model Selection Per Task | Missing | CLOSED | modelSelection.ts bridges task-level model preferences with harness capability routing. |
| GAP-HADAPT-004 | Harness Fallback Chains | Missing | CLOSED | fallbackChains.ts provides FallbackChain, FallbackResolution, chain creation, and exhaustion detection. |
| GAP-JSON-001 | JSON API for Run Creation and Management | Partial | CLOSED | Full API in api/runs.ts with ApiResult envelopes. MCP tools expose run_create, run_iterate, run_status. |
| GAP-JSON-002 | JSON Effect Dispatch and Response Protocol | Missing | CLOSED | Full typed API in api/effects.ts with listing, showing, cancelling, and batch-committing. |
| GAP-JSON-003 | JSON Breakpoint Interaction API | Missing | CLOSED | Full JSON API in api/breakpoints.ts for listing, context, approval/rejection with feedback. |
| GAP-JSON-005 | JSON Event Stream (SSE/WebSocket) | Missing | CLOSED | eventStream.ts subscription management, journalWatcher.ts real-time streaming, WebSocket transport. |
| GAP-MCPC-001 | MCP Channel Integration (Inbound Messaging) | Missing | CLOSED | Full channel manager, InboundMessageQueue with WakeCallback, channel allowlist, capability detection. |
| GAP-MCPC-002 | MCP Channel Outbound Messaging | Missing | CLOSED | OutboundChannelSender with template messaging, DEFAULT_CHANNEL_TOOL_MAPPINGS for Slack/Discord/email. |
| GAP-MCPC-004 | MCP Server Management UI and Connection Lifecycle | Missing | CLOSED | McpClientManager with full connect/disconnect lifecycle, status tracking, reconnection, tool registry. |
| GAP-OBS-001 | Run Health Snapshot | Partial | CLOSED | computeRunHealthFromEvents with RunHealthSnapshot, configurable thresholds, stuck/error/pending detection. |
| GAP-OBS-002 | Phase Timeline Visualization | Partial | CLOSED | timeline.ts synthesizes PhaseTimeline with phase entries, durations, iteration timeline, and milestones. |
| GAP-OBS-004 | Policy Decision Trail | Missing | CLOSED | DecisionTrailEntry/PolicyEvalRecord for audit trail. governance-decisions.jsonl for persistent logging. |
| GAP-OBS-NEW-002 | Dashboard API for External Dashboards | Missing | CLOSED | Full API layer in api/ (runs, effects, breakpoints, event streams). MCP tools expose as JSON. |
| GAP-PAR-002 | Async Effect Execution | Missing | CLOSED | asyncEffects.ts classifies blocking/background. BackgroundEffectEntry/BackgroundProcessRegistry. |
| GAP-PAR-009 | Parallel Effect Execution Strategies | Partial | CLOSED | 4 named strategies (all-or-nothing, best-effort, first-success, quorum). Execution wave building. |
| GAP-PERF-005 | Cache-Aware Prompt Assembly | Missing | CLOSED | PART_STRATA_MAP with volatility scores, STRATUM_ORDER stable-first, composeByStrataWithMeta with checksums. |
| GAP-PERF-006 | Incremental Orchestration Streaming | Missing | CLOSED | JournalWatcher real-time streaming, eventStream.ts subscriptions, WebSocket transport. |
| GAP-PERF-008 | Structured Continuity State | Partial | CLOSED | continuityState.ts with ContinuityPhase, key decisions, working files, findings. Persists across compaction. |
| GAP-PROC-002 | Process Nesting and Sub-Process Invocation | Missing | CLOSED | Full ctx.subprocess() in subprocess.ts with SubprocessInvocation type including all required fields. |
| GAP-PROC-004 | Process Parameter Schemas and Validation | Missing | CLOSED | schemaValidator.ts validates JSON Schema (draft-07 subset). SubprocessInvocation has inputSchema/outputSchema. |
| GAP-PROMPT-001 | Prompt Strata Model | Partial | CLOSED | Complete strata model in strata.ts: STRATUM_ORDER, PART_STRATA_MAP (30+ parts), composeByStrataWithMeta. |
| GAP-PROMPT-002 | Deterministic Capability Projection | Partial | CLOSED | capabilityCollector.ts queries all surfaces, produces sorted deterministic capability arrays. |
| GAP-PROMPT-003 | Runtime Personality Overlays | Partial | CLOSED | modeSelector.ts provides 4 modes (interactive, autonomous, plan, fast) with per-mode configuration. |
| GAP-PROMPT-005 | Continuity Overlays for Resume | Partial | CLOSED | continuityOverlay.ts builds from journal/artifacts/history. Renders into prompts with effects, decisions, files. |
| GAP-PROMPT-008 | Coding Philosophy Prompt Section | Missing | CLOSED | codingPhilosophy.ts with render function, coding-philosophy.md template, mapped in PART_STRATA_MAP. |
| GAP-PROMPT-009 | Tool Preference and Usage Rules | Missing | CLOSED | toolPreferences.ts with render function, tool-preferences.md template, mapped in PART_STRATA_MAP. |
| GAP-PROMPT-011 | Output Efficiency Rules | Missing | CLOSED | outputEfficiency.ts with render function, output-efficiency.md template, mapped in PART_STRATA_MAP. |
| GAP-PROMPT-012 | Git Safety Protocol Prompt Section | Missing | CLOSED | gitSafety.ts with render function, git-safety.md template, mapped in PART_STRATA_MAP. |
| GAP-REMOTE-001 | Daemon Mode | Partial | CLOSED | Full daemon with lifecycle, event loop, file watcher, cron scheduler, webhook listener, durable queue. |
| GAP-REMOTE-004 | Cron Triggers and Scheduling | Missing | CLOSED | timerScheduler.ts with parseCron, macros, timezone support. Integrated into daemon loop. |
| GAP-REMOTE-006 | MCP Client Integration | Partial | CLOSED | Full MCP client with manager, config, toolRegistry, executor. Pluggable transport. |
| GAP-REMOTE-008 | Streaming Orchestration Protocol | Missing | CLOSED | JournalWatcher + eventStream.ts + WebSocket transport for real-time event delivery. |
| GAP-REMOTE-009 | Host-Mediated Interaction | Partial | CLOSED | breakpoints.ts API with context/options, permissionRelay.ts, HostContract interface. |
| GAP-ROUTE-001 | Smart Effect Routing Engine | Missing | CLOSED | capabilityRouter.ts full routing, selectionPolicies.ts policy evaluation, modelSelection.ts bridge. |
| GAP-SEC-001 | Governance Policy Layer | Missing | CLOSED | Full engine with createPolicyEngine(), deny>warn>allow precedence, PolicyRule types, JSONL logging, tiers. |
| GAP-SEC-003 | Permission Request and Denial Hooks | Partial | CLOSED | InteractionKind with 5 types, interactionRouter.ts UX mapping, on-permission-denied hook. |
| GAP-SEC-004 | Sandbox Toggle | Partial | CLOSED | SandboxPolicy with rules/defaultAction, sandboxBridge.ts governance integration, piSecureSandbox.ts Docker. |
| GAP-SEC-005 | Approval Posture Model | Partial | CLOSED | DEFAULT_POSTURES per ActionCategory, postureBridge.ts converts to PolicyRule[]. |
| GAP-SESSION-001 | Session-to-Run One-to-Many | Missing | CLOSED | SessionContext with cross-run knowledge, SessionRunSummary array, SessionState.runIds. |
| GAP-SESSION-002 | Session State Persistence and History | Missing | CLOSED | SessionHistory with decisions/summaries/snapshots. persistence.ts with findings/modifications/patterns. |
| GAP-SESSION-004 | Session-Level Cost Tracking | Missing | CLOSED | SessionBudget, SessionCostSummary, budget threshold alerts, atomic persistence. |
| GAP-STATE-003 | Session State Persistence | Partial | CLOSED | persistence.ts stores SessionFinding, file modifications, breakpoint patterns, preferences. |
| GAP-STATE-008 | Run Health Model | Missing | CLOSED | computeRunHealthFromEvents with thresholds, RunHealthSnapshot, stuck/error/noop detection. |
| GAP-SUBOBS-003 | Per-Subagent Token and Cost Tracking | Missing | CLOSED | EffectCostSummary per-effect breakdown. Full pricing tables and journal cost collection. |
| GAP-TOOLS-008 | Web Search Agentic Tool | Missing | CLOSED | web_search tool with query, max_results, domains, exclude_domains. HTML extraction. |
| GAP-TOOLS-014 | Programmatic Task CRUD | Partial | CLOSED | tasks/crud.ts full CRUD. api/effects.ts effect API. MCP task_list/show/cancel/post. |
| GAP-TOOLS-018 | Structured Planning Phase | Partial | CLOSED | planMode.ts with PlanStep, status, dependencies, verification, approval, modification. |
| GAP-TOOLS-020 | Scheduled Orchestration Triggers | Missing | CLOSED | Full daemon scheduling: timerScheduler.ts, automationExecutor.ts, daemon loop integration. |
| GAP-TOOLS-021 | External Event Triggers | Missing | CLOSED | webhookListener.ts HTTP, fileWatcher.ts filesystem, automationExecutor.ts event-to-process mapping. |
| GAP-TOOLS-025 | MCP Tool Discovery and Invocation | Partial | CLOSED | Full MCP client with toolRegistry, executor, manager. tool_search and tool_fetch agentic tools. |
| GAP-TOOLS-027 | Skill Discovery and Invocation | Partial | CLOSED | SkillRouter, SkillDiscoveryService, SkillChainBuilder, skill_discover MCP tool. |
| GAP-TOOLS-030 | Effect Cancellation | Missing | CLOSED | commitEffectCancellation(), EffectCancelledError, task_cancel CLI/MCP, processControl SIGTERM/SIGKILL. |
| GAP-TOOLS-033 | Runtime Configuration Tool | Missing | CLOSED | config agentic tool with get/set/list/reset. Run-scoped entries. Model/compression/breakpoint support. |
| GAP-TOOLS-034 | Dynamic Tool Discovery and Search | Missing | CLOSED | deferredToolRegistry.ts two-tier index, tool_search/tool_fetch agentic tools, ToolSource categories. |
| GAP-TOOLS-035 | Grep Output Modes and Context Params | Missing | CLOSED | grep tool with output_mode, before_context, after_context, line_numbers, head_limit, offset, multiline. |
| GAP-TOOLS-036 | Bash Background Execution | Missing | CLOSED | bash tool with run_in_background, description, BackgroundProcessRegistry, background_status tool. |
| GAP-TOOLS-038 | Ask Tool Interaction Model Alignment | Missing | CLOSED | AskUserQuestion with mode param: simple (CC-compatible) and structured (babysitter). |
| GAP-USER-001 | Operator Command Layer | Partial | CLOSED | operatorCommands.ts with categories, commandTemplate, breakpoint integration. |
| GAP-USER-006 | Real-Time Cost Tracking | Partial | CLOSED | effectCost.ts per-effect, pricing.ts tables, session/cost.ts budgets with auto-pause. |
| GAP-USER-012 | Plan Mode with Verification | Partial | CLOSED | planMode.ts full plan mode with steps, status, dependencies, verification, approval. |
| GAP-UX-005 | Structured Orchestration Status View | Partial | CLOSED | getOrchestrationStatus combining metadata, health, pending effects. JSON support. |
| GAP-UX-006 | Pending Work Inspector | Partial | CLOSED | getPendingWorkItems, batching groups, getEffectiveConcurrency. JSON output. |
| GAP-UX-007 | Rich Breakpoint Interaction | Partial | CLOSED | interactionRouter.ts UX hints, postures.ts risk resolution, operatorCommands.ts, API context. |
| GAP-UX-014 | Operator Mode Selection | Partial | CLOSED | modeSelector.ts with 4 modes, getModeConfig/switchMode, per-mode config. |

### Gaps Upgraded to IN_PROGRESS (from Missing) (25 total)

These were originally marked as Missing but have partial implementations discovered during the codebase audit.

| Gap ID | Title | Original Status | Final Status | Reason |
|---|---|---|---|---|
| GAP-AGENT-006 | Cross-Run State Sharing | Missing | IN_PROGRESS | SessionContext and SessionHistory provide cross-run shared knowledge. |
| GAP-ECO-001 | CC Plugin Compatibility Layer | Missing | IN_PROGRESS | Plugin loader, sandbox, version-check exist; CC manifest adapter missing. |
| GAP-ECO-003 | Plugin Trust, Provenance, and Blocklist | Missing | IN_PROGRESS | Sandbox permissions and governance trust-level rules exist; blocklist/provenance missing. |
| GAP-ECO-004 | Plugin Auto-Update and Versioning | Missing | IN_PROGRESS | Semver checks and registry exist; auto-update and rollback missing. |
| GAP-ECO-005 | Plugin Validation and Diagnostics | Missing | IN_PROGRESS | Loader and version-check exist; validate command and structured errors missing. |
| GAP-HADAPT-003 | Cost-Based Routing Policies | Missing | IN_PROGRESS | Cost-optimized policy, pricing tables, budget thresholds exist; auto-downgrade missing. |
| GAP-HADAPT-005 | Harness Health Monitoring and Circuit Breaker | Missing | IN_PROGRESS | Run health scoring exists; per-harness monitoring and circuit breaker missing. |
| GAP-JSON-004 | JSON Session Management API | Missing | IN_PROGRESS | MCP tools expose session ops; unified REST API missing. |
| GAP-MCPC-003 | Channel Permission Relay | Missing | IN_PROGRESS | ChannelPermissionRelay with racing pattern exists; not wired into breakpoint flow. |
| GAP-OBS-NEW-001 | Webhook and Alert System | Missing | IN_PROGRESS | Registration types and registry exist; HTTP delivery and integrations missing. |
| GAP-PERF-001 | Prompt Caching (Ephemeral) | Missing | IN_PROGRESS | Strata-aware assembly with cache-break detection exists; API cache_control not wired. |
| GAP-PERF-004 | Streaming Message Rendering | Missing | IN_PROGRESS | Pi streaming and JournalWatcher exist; CLI harness streaming and dashboard missing. |
| GAP-PROC-001 | Process Chaining and Pipelines | Missing | IN_PROGRESS | SkillChainBuilder provides topological sorting and dependency tracking. Full process pipeline missing. |
| GAP-PROF-001 | Auto-Configure from User Profile | Missing | IN_PROGRESS | Profile system renders to prompts; not used for orchestration auto-configuration. |
| GAP-PROMPT-006 | Instructions Loaded Hook | Missing | IN_PROGRESS | Adapter-specific hook exists; not generalized to SDK-level. |
| GAP-PROMPT-010 | Safety/Reversibility Prompt Framework | Missing | IN_PROGRESS | criticalRules.ts and nonNegotiables.ts exist; dedicated reversibility framework missing. |
| GAP-REMOTE-003 | Remote Sessions (WebSocket) | Missing | IN_PROGRESS | WebSocket transport with multiplexing and auth exists; run directory sync missing. |
| GAP-REMOTE-007 | Host Contract Layer | Missing | IN_PROGRESS | Types and validation in hostContract.ts; methods not implemented, zero consumers. |
| GAP-ROUTE-002 | Effect Priority and Scheduling | Missing | IN_PROGRESS | Parallel strategies and scheduler hints exist; priority queue missing. |
| GAP-SEC-002 | Trust Classes for Plugins | Missing | IN_PROGRESS | Sandbox permissions and governance rules exist; TrustLevel field missing. |
| GAP-STATE-001 | Long-Term Memory Extraction | Missing | IN_PROGRESS | memoryExtraction.ts exists; memories not injected into prompts. |
| GAP-SUBOBS-001 | Streaming Output Capture | Missing | IN_PROGRESS | Pi subscribe() works; CLI harness streaming missing. |
| GAP-SUBOBS-002 | Subagent Progress Tracking | Missing | IN_PROGRESS | Background status tracking exists; percentage/ETA missing. |
| GAP-SUBOBS-004 | Subagent Health and Timeout | Missing | IN_PROGRESS | Timeout tracking exists; health monitoring and auto-recovery missing. |
| GAP-TOOLS-031 | MCP Resource Browsing and Reading | Missing | IN_PROGRESS | MCP client exists; agentic tools for resource browsing missing. |

### Gaps Reclassified to NEEDS_RESPEC (7 total)

These gaps reference architectural assumptions that are no longer valid.

| Gap ID | Title | Original Status | Final Status | Reason |
|---|---|---|---|---|
| GAP-SUBOBS-005 | Dashboard Subagent Drill-Down | Missing | NEEDS_RESPEC | Assumes 'embedded SDK dashboard' (packages/babysitter-sdk/src/dashboard/) which does not exist. Architecture has evolved to observer-dashboard and tula-ui. |
| GAP-UX-001 | Ink/React Terminal Rendering Foundation | Missing | NEEDS_RESPEC | Assumes Ink-based components inside SDK. Architecture evolved to tula-ui extraction and observer-dashboard. |
| GAP-UX-001a | Effect Tree Visualization | Missing | NEEDS_RESPEC | Depends on GAP-UX-001's Ink assumption, which is outdated. |
| GAP-UX-001b | Structured Diff Rendering | Missing | NEEDS_RESPEC | Depends on GAP-UX-001's Ink assumption, which is outdated. |
| GAP-UX-001d | Message Type Rendering | Missing | NEEDS_RESPEC | Depends on GAP-UX-001's Ink assumption, which is outdated. |
| GAP-UX-001e | Progress and Status Line | Missing | NEEDS_RESPEC | Depends on GAP-UX-001's Ink assumption, which is outdated. |
| GAP-UX-001f | Streaming Output Panels | Missing | NEEDS_RESPEC | Depends on GAP-UX-001's Ink assumption, which is outdated. |

### Unchanged Status Gaps

The remaining gaps maintained their expected status mapping:
- **24 IN_PROGRESS** gaps: Originally Partial that remained as partial implementations (mapped to IN_PROGRESS)
- **22 OPEN** gaps: Originally Missing that remained NOT_STARTED (mapped to OPEN), with 7 additional NOT_STARTED gaps reclassified to NEEDS_RESPEC due to outdated architectural assumptions

---

## Priority Reclassification for Non-CLOSED Gaps

### Critical Priority (2 gaps)
| Gap ID | Title | Status | Original Priority | Remaining Effort |
|---|---|---|---|---|
| GAP-ECO-001 | CC Plugin Compatibility Layer | IN_PROGRESS | Critical | L |
| GAP-PERF-002 | Session Compaction | IN_PROGRESS | Critical | L |

Note: GAP-PERF-001 (Prompt Caching) and GAP-SUBOBS-001 (Streaming Output Capture) were originally Critical and remain so.

### Effort Reductions
Several IN_PROGRESS gaps have reduced remaining effort due to partial implementations:
- GAP-HADAPT-003 (Cost-Based Routing): M -> S (only auto-downgrade wiring needed)
- GAP-HADAPT-005 (Health Monitoring): M -> S (run health exists, need per-harness)
- GAP-ECO-003 (Plugin Trust): M -> S (sandbox exists, need blocklist)
- GAP-ECO-004 (Plugin Auto-Update): M -> S (versioning exists, need auto-update)
- GAP-ECO-005 (Plugin Validation): S -> S (loader exists, need validate command)
- GAP-ROUTE-002 (Effect Priority): M -> S (strategies exist, need priority queue)
- GAP-PROMPT-006 (Instructions Hook): M -> S (adapter hook exists, need SDK generalization)
- GAP-PROMPT-010 (Safety Framework): S -> S (critical rules exist, need reversibility)
- GAP-MCPC-003 (Permission Relay): L -> S (relay exists, need wiring)
- GAP-OBS-NEW-001 (Webhooks): M -> S (types exist, need HTTP delivery)
- GAP-SEC-002 (Trust Classes): L -> S (sandbox exists, need TrustLevel field)
- GAP-STATE-001 (Memory Extraction): L -> S (extraction exists, need prompt injection)
- GAP-TOOLS-031 (MCP Resources): M -> S (client exists, need 2 agentic tools)
- GAP-JSON-004 (Session API): M -> S (MCP tools exist, need unified REST)
- GAP-OBS-003 (Prompt Observability): M -> S (strata metadata exists, need CLI command)
- GAP-PROMPT-004 (Prompt Inspection): M -> S (strata data exists, need inspect command)

### Blocked Gaps
| Gap ID | Title | Blockers |
|---|---|---|
| GAP-STATE-002 | Memory Consolidation | GAP-STATE-001 (memory extraction needs prompt injection first) |
| GAP-SESSION-005 | Session Sharing | GAP-SESSION-002, GAP-REMOTE-003 |
| GAP-PAR-010 | Fork-Join Process Pattern | GAP-PAR-003, GAP-PROC-002 |
| GAP-TOOLS-017 | Git Worktree Isolation | GAP-PAR-001 |
