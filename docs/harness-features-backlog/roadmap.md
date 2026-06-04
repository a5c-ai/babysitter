# Harness Features Roadmap

147 gaps organized into 7 milestones. Each milestone has a goal, unlocks specific
capabilities, and respects dependency ordering. Gaps within a milestone can be
worked in parallel unless noted.

---

## M0: Quick Wins and Foundations
**Goal**: Ship small, no-prerequisite improvements that immediately improve tool
parity and process validation. No architectural changes -- just better defaults.

**Unlocks**: Tool feature parity for existing agentic tools, process parameter
validation.

| Gap | Title | Effort | Priority |
|-----|-------|--------|----------|
| GAP-TOOLS-035 | Grep Output Modes and Context Params | S | Medium |
| GAP-TOOLS-033 | Runtime Configuration Tool | S | Low |
| GAP-TOOLS-038 | Ask Tool Interaction Model Alignment | S | Low |
| GAP-TOOLS-007 | JS/TS REPL Tool | S | Low |
| GAP-PROC-004 | Process Parameter Schemas and Validation | S | Medium |

**Estimated scope**: 5 gaps, all S effort. ~1 week.

---

## M1: Core Infrastructure
**Goal**: Build the foundational systems that almost everything else depends on.
Prompt strata, governance, session model, JSON API, capability routing, and
streaming capture. These are the load-bearing walls.

**Unlocks**: Structured prompt composition, policy-based governance, programmatic
run management, session-run relationships, harness capability awareness, live
output from dispatched tasks.

| Gap | Title | Effort | Priority | Depends On |
|-----|-------|--------|----------|------------|
| GAP-PROMPT-001 | Prompt Strata Model | L | Critical | -- |
| GAP-SEC-001 | Governance Policy Layer | L | Critical | -- |
| GAP-SESSION-001 | Session-to-Run One-to-Many | L | Critical | -- |
| GAP-HADAPT-001 | Capability-Based Task Routing | L | Critical | -- |
| GAP-SUBOBS-001 | Streaming Output Capture | L | Critical | -- |
| GAP-JSON-001 | JSON API for Run Creation | L | Critical | -- |
| GAP-JSON-002 | JSON Effect Dispatch Protocol | L | Critical | GAP-JSON-001 |
| GAP-STATE-008 | Run Health Model | M | High | -- |
| GAP-REMOTE-007 | Host Contract Layer | L | High | -- |
| GAP-PAR-009 | Parallel Effect Execution Strategies | M | High | -- |
| GAP-ROUTE-003 | Effect Result Caching and Dedup | M | Medium | -- |

**Estimated scope**: 11 gaps (7 Critical, 3 High, 1 Medium). ~6-8 weeks.

---

## M2: Observability and Control
**Goal**: See what's happening during orchestration and control it. Health
monitoring, cost tracking, effect cancellation, progress tracking, structured
status views, and the embedded SDK dashboard foundation.

**Unlocks**: Operators can monitor run health in real-time, track costs per
effect, cancel runaway tasks, see structured status, and get progress updates
from subagents. Breakpoint approval chains work.

| Gap | Title | Effort | Priority | Depends On |
|-----|-------|--------|----------|------------|
| GAP-SUBOBS-002 | Subagent Progress Tracking | M | High | M1: SUBOBS-001 |
| GAP-SUBOBS-003 | Per-Subagent Token and Cost Tracking | M | High | M1: SUBOBS-001 |
| GAP-TOOLS-030 | Effect Cancellation | M | High | -- |
| GAP-TOOLS-036 | Bash Background Execution | S | Medium | GAP-TOOLS-030 |
| GAP-OBS-001 | Run Health Snapshot | M | High | M1: STATE-008 |
| GAP-OBS-004 | Policy Decision Trail | M | High | M1: SEC-001 |
| GAP-OBS-NEW-001 | Dashboard Webhook and Alert System | M | High | M1: STATE-008 |
| GAP-UX-005 | Structured Orchestration Status View | M | High | M1: STATE-008 |
| GAP-UX-006 | Pending Work Inspector | M | High | -- |
| GAP-USER-006 | Real-Time Cost Tracking | M | High | GAP-SUBOBS-003, GAP-SESSION-004 |
| GAP-SESSION-002 | Session State Persistence and History | M | High | M1: SESSION-001 |
| GAP-SESSION-004 | Session-Level Cost and Budgets | M | High | M1: SESSION-001, GAP-SUBOBS-003 |
| GAP-JSON-003 | JSON Breakpoint Interaction API | M | High | M1: JSON-001 |
| GAP-JSON-004 | JSON Session Management API | M | High | M1: JSON-001 |
| GAP-BRK-001 | Breakpoint Approval Chains | M | High | M1: SEC-001 |
| GAP-SEC-003 | Permission Request and Denial Hooks | L | High | M1: SEC-001 |
| GAP-SEC-005 | Approval Posture Model | M | High | M1: SEC-001, GAP-SEC-003 |
| GAP-PROMPT-002 | Deterministic Capability Projection | M | High | M1: PROMPT-001 |
| GAP-PROMPT-005 | Continuity Overlays for Resume | M | High | M1: PROMPT-001, M1: STATE-008 |
| GAP-TOOLS-014 | Programmatic Task CRUD Beyond CLI | M | High | M1: JSON-001 |
| GAP-TOOLS-018 | Structured Planning Phase | M | High | M0: PROC-004 |
| GAP-PROMPT-008 | Coding Philosophy Prompt Section | S | High | M1: PROMPT-001 |
| GAP-PROMPT-009 | Tool Preference and Usage Rules | S | High | M1: PROMPT-001 |
| GAP-PROMPT-010 | Safety and Reversibility Prompt Framework | S | High | M1: PROMPT-001 |
| GAP-PROMPT-011 | Output Efficiency Rules | S | Medium | M1: PROMPT-001 |
| GAP-PROMPT-012 | Git Safety Protocol Prompt Section | S | Medium | M1: PROMPT-001 |

**Estimated scope**: 26 gaps (mostly M effort). ~10-12 weeks.

---

## M3: Multi-Harness Orchestration
**Goal**: Route effects to the right harness, run tasks in parallel across
harnesses, isolate work in worktrees, compose processes, and support delegation
policies. This is where babysitter becomes a true multi-harness orchestrator.

**Unlocks**: Tasks automatically routed to the best harness for the job. Parallel
execution across multiple harnesses. Git worktree isolation. Process chaining.
Model selection per task. Fallback chains when a harness is unavailable.

| Gap | Title | Effort | Priority | Depends On |
|-----|-------|--------|----------|------------|
| GAP-AGENT-001 | Sub-Harness Invocation with Isolation | XL | High | M1: HADAPT-001, M1: SUBOBS-001 |
| GAP-PAR-001 | Concurrent Effect Execution | L | High | M1: PAR-009 |
| GAP-PAR-002 | Async Effect Execution | L | High | GAP-PAR-001, M2: SUBOBS-002 |
| GAP-PAR-003 | Multi-Harness Parallel Dispatch | XL | High | GAP-PAR-001, GAP-PAR-002, M1: HADAPT-001 |
| GAP-TOOLS-017 | Git Worktree Isolation | L | High | GAP-PAR-001, GAP-AGENT-001 |
| GAP-HADAPT-002 | Model Selection Per Task | M | High | M1: HADAPT-001 |
| GAP-HADAPT-004 | Harness Fallback Chains | M | High | M1: HADAPT-001 |
| GAP-AGENT-005 | Cross-Run Communication | L | High | GAP-AGENT-001 |
| GAP-AGENT-006 | Cross-Run State Sharing | L | High | M1: SESSION-001 |
| GAP-AGENT-008 | Harness Selection Policies | M | High | M1: HADAPT-001 |
| GAP-ROUTE-001 | Smart Effect Routing Engine | XL | High | M1: HADAPT-001 |
| GAP-PROC-001 | Process Chaining and Pipelines | M | High | M0: PROC-004 |
| GAP-PROC-002 | Process Nesting and Sub-Process | L | High | GAP-AGENT-001 |
| GAP-TOOLS-023 | Multi-Step Workflow Composition | L | High | GAP-PROC-001, GAP-PROC-002 |
| GAP-PERF-001 | Prompt Caching (Ephemeral) | L | Critical | M1: PROMPT-001 |
| GAP-PERF-002 | Session Compaction | XL | Critical | M1: PROMPT-001 |
| GAP-PERF-005 | Cache-Aware Prompt Assembly | L | High | M1: PROMPT-001, GAP-PERF-001 |
| GAP-PERF-008 | Structured Continuity State | L | High | M2: PROMPT-005 |
| GAP-STATE-003 | Session State Persistence | L | High | M1: SESSION-001 |
| GAP-STATE-001 | Long-Term Memory Extraction | L | High | M2: SESSION-002 |
| GAP-USER-001 | Operator Command Layer | L | High | M2: UX-005 |
| GAP-USER-012 | Plan Mode with Verification | M | High | M2: TOOLS-018 |
| GAP-TOOLS-008 | Web Search Agentic Tool | M | Medium | M1: HADAPT-001 |

**Estimated scope**: 23 gaps (2 Critical, 19 High, 2 Medium; includes 4 XL). ~12-16 weeks.

---

## M4: MCP and External Integration
**Goal**: Connect babysitter to the outside world. MCP tool discovery and
invocation, channel messaging (Slack/Gmail/Calendar), remote sessions, event
triggers, and streaming protocols. Babysitter becomes a platform, not just a
local orchestrator.

**Unlocks**: MCP server tools callable from processes. Slack/Gmail/Calendar
integration via MCP channels. Breakpoint approval from Slack. Remote WebSocket
sessions. Webhook-triggered runs. Daemon mode for always-on orchestration.

| Gap | Title | Effort | Priority | Depends On |
|-----|-------|--------|----------|------------|
| GAP-TOOLS-025 | MCP Tool Discovery and Invocation | M | High | M1: HADAPT-001, GAP-REMOTE-006 |
| GAP-REMOTE-006 | MCP Client Integration | L | Medium | M1: SEC-001 |
| GAP-MCPC-001 | MCP Channel Inbound Messaging | L | High | GAP-TOOLS-025 |
| GAP-MCPC-002 | MCP Channel Outbound Messaging | M | High | GAP-MCPC-001 |
| GAP-MCPC-003 | Channel Permission Relay | L | High | GAP-MCPC-001, M2: BRK-002 |
| GAP-MCPC-004 | MCP Server Management UI | M | Medium | GAP-TOOLS-025 |
| GAP-TOOLS-031 | MCP Resource Browsing and Reading | M | Medium | GAP-TOOLS-025 |
| GAP-TOOLS-032 | MCP Authentication (OAuth) | L | Medium | GAP-TOOLS-025 |
| GAP-TOOLS-034 | Dynamic Tool Discovery and Search | M | Medium | GAP-TOOLS-025 |
| GAP-JSON-005 | JSON Event Stream (SSE/WebSocket) | L | High | M1: JSON-001, GAP-REMOTE-008 |
| GAP-REMOTE-001 | Daemon Mode | XL | High | -- |
| GAP-REMOTE-003 | Remote Sessions (WebSocket) | XL | High | M1: REMOTE-007, GAP-JSON-005 |
| GAP-REMOTE-008 | Streaming Orchestration Protocol | L | Medium | M1: REMOTE-007 |
| GAP-REMOTE-009 | Host-Mediated Interaction | L | Medium | M1: REMOTE-007 |
| GAP-REMOTE-004 | Cron Triggers and Scheduling | L | Medium | -- |
| GAP-TOOLS-020 | Scheduled Orchestration Triggers | L | Medium | GAP-REMOTE-001, GAP-REMOTE-004 |
| GAP-TOOLS-021 | External Event Triggers | L | Medium | GAP-REMOTE-001, GAP-TOOLS-020 |
| GAP-BRK-002 | Breakpoint Delegation to External Systems | L | High | M2: JSON-003, M2: OBS-NEW-001 |
| GAP-SEC-002 | Trust Classes for Plugins | L | High | M1: SEC-001 |
| GAP-SEC-006 | OAuth Integration | L | Medium | M1: SEC-001 |
| GAP-TOOLS-028 | Sleep/Delay Effect Enhancement | S | Low | GAP-TOOLS-020 |

**Estimated scope**: 21 gaps (includes 2 XL). ~10-14 weeks.

---

## M5: Rich UI and Experience
**Goal**: Build the Ink/React rendering foundation and all the UI components
that make orchestration a first-class visual experience. Structured diffs,
effect trees, streaming panels, message rendering, embedded SDK dashboard
with drill-down.

**Unlocks**: Rich terminal UI for orchestration. Visual effect trees.
Structured diff rendering. Streaming output panels. Subagent drill-down
in the embedded SDK dashboard. Operator mode selection.

| Gap | Title | Effort | Priority | Depends On |
|-----|-------|--------|----------|------------|
| GAP-UX-001e | Progress and Status Line | S | High | GAP-UX-001 |
| GAP-UX-001 | Ink/React Terminal Rendering Foundation | L | High | -- |
| GAP-UX-001a | Effect Tree Visualization | M | High | GAP-UX-001 |
| GAP-UX-001b | Structured Diff Rendering | M | Medium | GAP-UX-001 |
| GAP-UX-001c | Permission and Breakpoint Approval UI | M | High | GAP-UX-001, M2: BRK-001 |
| GAP-UX-001d | Message Type Rendering | L | Medium | GAP-UX-001 |
| GAP-UX-001f | Streaming Output Panels | L | High | GAP-UX-001, M1: SUBOBS-001 |
| GAP-SUBOBS-005 | Dashboard Subagent Drill-Down | L | Medium | M2: SUBOBS-002, M2: SUBOBS-003 |
| GAP-OBS-002 | Phase Timeline Visualization | M | Medium | M2: OBS-001 |
| GAP-OBS-003 | Prompt Plan Observability | M | Medium | M1: PROMPT-001 |
| GAP-OBS-005 | Context Introspection | M | Medium | M2: SESSION-004 |
| GAP-OBS-008 | Agent Progress Summarization | M | Medium | M2: OBS-001 |
| GAP-OBS-NEW-002 | Dashboard API for External Dashboards | L | Medium | M1: JSON-001 |
| GAP-UX-007 | Rich Breakpoint Interaction | M | Medium | M2: SEC-005 |
| GAP-UX-008 | Resume Dashboard | M | Medium | M2: PROMPT-005 |
| GAP-UX-009 | Failure Triage View | M | Medium | M2: OBS-001 |
| GAP-UX-010 | Typed Effect Interaction Patterns | M | Medium | M2: JSON-003 |
| GAP-UX-011 | Command Discoverability | M | Medium | -- |
| GAP-UX-014 | Operator Mode Selection | M | Medium | M1: PROMPT-001 |
| GAP-PERF-004 | Streaming Message Rendering | L | High | M1: SUBOBS-001 |
| GAP-PERF-006 | Incremental Orchestration Streaming | L | Medium | M4: JSON-005 |
| GAP-TOOLS-029 | Structured Output Tool | M | Medium | GAP-UX-001b, GAP-UX-001d |
| GAP-TOOLS-037 | Fetch Content Processing | M | Low | -- |

**Estimated scope**: 23 gaps. ~10-14 weeks.

---

## M6: Platform and Ecosystem
**Goal**: CC plugin compatibility, marketplace protocol, auto-update, trust
model, process versioning, memory systems, and remaining polish. Babysitter
becomes a full platform with an ecosystem.

**Unlocks**: CC plugins run on babysitter. Marketplace browsing and install.
Plugin trust and blocklist. Process versioning and migration. Long-term memory
consolidation. Session sharing. Run forking. Full audit export.

| Gap | Title | Effort | Priority | Depends On |
|-----|-------|--------|----------|------------|
| GAP-ECO-001 | CC Plugin Compatibility Layer | XL | Critical | GAP-ECO-002, GAP-ECO-003 |
| GAP-ECO-002 | CC Marketplace Protocol Support | L | High | -- |
| GAP-ECO-003 | Plugin Trust and Blocklist | M | High | M1: SEC-001 |
| GAP-ECO-004 | Plugin Auto-Update and Versioning | M | Medium | GAP-ECO-002 |
| GAP-ECO-005 | Plugin Validation and Diagnostics | S | Medium | GAP-ECO-001 |
| GAP-AGENT-003 | Process Orchestration with Effect Routing | XL | High | M3: AGENT-001, M3: ROUTE-001 |
| GAP-AGENT-004 | Built-in Process Templates | L | Medium | M3: HADAPT-002 |
| GAP-AGENT-007 | Delegation Policy Layer | L | Medium | M1: SEC-001, M1: HADAPT-001 |
| GAP-HADAPT-003 | Cost-Based Routing Policies | L | High | M1: HADAPT-001, M2: SESSION-004 |
| GAP-HADAPT-005 | Harness Health and Circuit Breaker | M | Medium | M1: HADAPT-001 |
| GAP-SUBOBS-004 | Subagent Health and Timeout Monitoring | M | Medium | M1: SUBOBS-001, M2: SUBOBS-003 |
| GAP-PROC-003 | Process Versioning and Migration | L | Medium | -- |
| GAP-STATE-002 | Memory Consolidation | L | Medium | M3: STATE-001 |
| GAP-STATE-006 | Session Rewind and History | L | Medium | M3: STATE-003 |
| GAP-ROUTE-002 | Effect Priority and Scheduling | M | Medium | M1: PAR-009 |
| GAP-PAR-005 | Parallel File Operations | M | Medium | M3: PAR-001 |
| GAP-PAR-006 | Streaming Parallelism | M | Medium | M3: PAR-001 |
| GAP-PAR-010 | Fork-Join Process Pattern | L | Medium | M3: PAR-003, M3: PROC-002 |
| GAP-PERF-007 | Aggressive Parallelism | L | Medium | M3: PAR-001 |
| GAP-RUN-001 | Run Comparison and Diffing | M | Medium | -- |
| GAP-RUN-002 | Run Archival and Restore | M | Low | -- |
| GAP-RUN-003 | Run Forking and Branching | L | Medium | GAP-STATE-006 |
| GAP-SESSION-003 | Session Templates and Presets | M | Medium | M1: SESSION-001 |
| GAP-SESSION-005 | Session Sharing and Collaboration | L | Low | M2: SESSION-002, M4: REMOTE-003 |
| GAP-OBS-006 | Analytics and Feature Flags | L | Medium | GAP-ECO-004 |
| GAP-OBS-007 | Audit Export | M | Medium | M2: OBS-004 |
| GAP-USER-017 | Plugin Management Integration | M | High | GAP-ECO-001 |
| GAP-SEC-004 | Sandbox Toggle | M | Medium | M1: SEC-001 |
| GAP-SEC-007 | Privacy Settings | M | Medium | M1: SEC-001 |
| GAP-PROMPT-003 | Runtime Personality Overlays | M | Medium | M1: PROMPT-001 |
| GAP-PROMPT-004 | Prompt Inspection Tooling | M | Medium | M1: PROMPT-001 |
| GAP-PROMPT-006 | Instructions Loaded Hook | M | Medium | M1: PROMPT-001 |
| GAP-PROMPT-007 | Context Compression Families | L | Medium | M1: PROMPT-001 |
| GAP-TOOLS-012 | LSP Integration | L | High | M3: ROUTE-001, M0: PROC-004 |
| GAP-TOOLS-026 | Structured User Interaction from Effects | M | Medium | M2: JSON-003 |
| GAP-TOOLS-027 | Skill Discovery from Process Definitions | M | Medium | M1: HADAPT-001 |
| GAP-PROF-001 | Auto-Configure from User Profile | M | Medium | GAP-ECO-004 |
| GAP-BRK-003 | Breakpoint Analytics and SLA Tracking | S | Low | M2: OBS-004 |

**Estimated scope**: 38 gaps (includes 2 XL). ~16-20 weeks.

---

## Milestone Summary

| Milestone | Gaps | Goal | Cumulative |
|-----------|------|------|------------|
| **M0** Quick Wins | 5 | Tool parity polish + process validation | 5 |
| **M1** Core Infrastructure | 11 | Foundational systems everything depends on | 16 |
| **M2** Observability & Control | 26 | See what's happening, control it | 42 |
| **M3** Multi-Harness Orchestration | 23 | Route, parallelize, compose across harnesses | 65 |
| **M4** MCP & External Integration | 21 | Connect to outside world: MCP, channels, remote | 86 |
| **M5** Rich UI & Experience | 23 | Visual orchestration experience | 109 |
| **M6** Platform & Ecosystem | 38 | Full platform with plugin ecosystem | 147 |

## Dependency Graph (Milestones)

```
M0 (Quick Wins) ──────────────────────────────────────────┐
  │                                                        │
  v                                                        │
M1 (Core Infrastructure) ─────────────────────────────┐    │
  │                                                    │    │
  ├──> M2 (Observability & Control) ──────────┐        │    │
  │                                            │        │    │
  ├──> M3 (Multi-Harness Orchestration) <──────┤        │    │
  │         │                                  │        │    │
  │         ├──> M4 (MCP & External) <─────────┘        │    │
  │         │                                           │    │
  │         └──> M5 (Rich UI) <─────────────────────────┘    │
  │                   │                                      │
  └──> M6 (Platform & Ecosystem) <───────────────────────────┘
```

M3 and M4 can partially overlap (MCP client work can start while multi-harness
is in progress). M5 can start its foundation (GAP-UX-001) any time after M1.
M6 is the long tail -- work items can be pulled forward if priorities shift.

## Critical Path

The fastest path to production-grade multi-harness orchestration:

```
M0 → M1 (PROMPT-001 + HADAPT-001 + SESSION-001 + JSON-001/002)
   → M2 (SUBOBS-002/003 + TOOLS-030 + OBS-001)
   → M3 (AGENT-001 + PAR-001/002/003 + PERF-001/002)
```

Everything else enhances this core. The critical blockers are:
1. **GAP-PROMPT-001** (Prompt Strata) -- 19 gaps depend on it
2. **GAP-HADAPT-001** (Capability Routing) -- 15 gaps depend on it
3. **GAP-SESSION-001** (Session Model) -- 8 gaps depend on it
4. **GAP-SEC-001** (Governance) -- 12 gaps depend on it
5. **GAP-SUBOBS-001** (Streaming Capture) -- 7 gaps depend on it
6. **GAP-JSON-001** (JSON API) -- 7 gaps depend on it
