# Priority Matrix

All 147 gaps ranked by impact-to-effort ratio, organized into implementation phases.

> **Note**: Phases here are ranked by impact-to-effort ratio and do not correspond to roadmap milestones (M0-M6), which are organized by dependency chains. Some Phase 1 items (e.g., PAR-001, PAR-009) have dependencies in later roadmap milestones and cannot be started until those prerequisites are met. Use the [roadmap](./roadmap.md) for sequencing; use this matrix for prioritization within each milestone.

## Phase 1: Foundation (Weeks 1-4)

Highest impact-to-effort ratio gaps that provide foundations for later work.

| Rank | Gap ID | Feature | Priority | Effort | Category |
|------|--------|---------|----------|--------|----------|
| 1 | [GAP-PROMPT-001](./gaps/prompt-engineering/GAP-PROMPT-001.md) | Prompt Strata Model | Critical | L | prompt-engineering |
| 2 | [GAP-SEC-001](./gaps/security/GAP-SEC-001.md) | Governance Policy Layer | Critical | L | security |
| 3 | [GAP-JSON-001](./gaps/json-interaction/GAP-JSON-001.md) | JSON API for Run Creation | Critical | L | json-interaction |
| 4 | [GAP-JSON-002](./gaps/json-interaction/GAP-JSON-002.md) | JSON Effect Dispatch Protocol | Critical | L | json-interaction |
| 5 | [GAP-SUBOBS-001](./gaps/subagent-observability/GAP-SUBOBS-001.md) | Streaming Output Capture | Critical | L | subagent-observability |
| 6 | [GAP-HADAPT-001](./gaps/harness-adaptation/GAP-HADAPT-001.md) | Capability-Based Task Routing | Critical | L | harness-adaptation |
| 7 | [GAP-SESSION-001](./gaps/session-management/GAP-SESSION-001.md) | Session-to-Run One-to-Many | Critical | L | session-management |
| 8 | [GAP-STATE-008](./gaps/state-continuity/GAP-STATE-008.md) | Run Health Model | High | M | state-continuity |
| 9 | [GAP-UX-005](./gaps/user-experience/GAP-UX-005.md) | Structured Status View | High | M | user-experience |
| 10 | [GAP-UX-006](./gaps/user-experience/GAP-UX-006.md) | Pending Work Inspector | High | M | user-experience |
| 11 | [GAP-OBS-001](./gaps/observability/GAP-OBS-001.md) | Run Health Snapshot | High | M | observability |
| 12 | [GAP-PAR-001](./gaps/parallelization/GAP-PAR-001.md) | Concurrent Effect Execution | High | L | parallelization |
| 13 | [GAP-PAR-009](./gaps/parallelization/GAP-PAR-009.md) | Parallel Execution Strategies | High | M | parallelization |

**Phase 1 totals**: 13 gaps (7 critical + 6 high)

## Phase 2: Core Infrastructure (Weeks 5-12)

Building on Phase 1 foundations with medium-effort, high-impact improvements.

| Rank | Gap ID | Feature | Priority | Effort | Category |
|------|--------|---------|----------|--------|----------|
| 14 | [GAP-PERF-001](./gaps/performance/GAP-PERF-001.md) | Prompt Caching | Critical | L | performance |
| 15 | [GAP-AGENT-008](./gaps/agent-delegation/GAP-AGENT-008.md) | Harness Selection Policies | High | M | agent-delegation |
| 16 | [GAP-ECO-003](./gaps/ecosystem/GAP-ECO-003.md) | Plugin Trust, Provenance, and Blocklist | High | M | ecosystem |
| 17 | [GAP-OBS-004](./gaps/observability/GAP-OBS-004.md) | Policy Decision Trail | High | M | observability |
| 19 | [GAP-SEC-005](./gaps/security/GAP-SEC-005.md) | Approval Posture Model | High | M | security |
| 20 | [GAP-PROMPT-002](./gaps/prompt-engineering/GAP-PROMPT-002.md) | Capability Projection | High | M | prompt-engineering |
| 21 | [GAP-PROMPT-005](./gaps/prompt-engineering/GAP-PROMPT-005.md) | Continuity Overlays | High | M | prompt-engineering |
| 22 | [GAP-PERF-005](./gaps/performance/GAP-PERF-005.md) | Cache-Aware Assembly | High | L | performance |
| 23 | [GAP-PERF-008](./gaps/performance/GAP-PERF-008.md) | Structured Continuity | High | L | performance |
| 24 | [GAP-PERF-004](./gaps/performance/GAP-PERF-004.md) | Streaming Rendering | High | L | performance |
| 25 | [GAP-SEC-003](./gaps/security/GAP-SEC-003.md) | Permission Hooks | High | L | security |
| 26 | [GAP-SEC-002](./gaps/security/GAP-SEC-002.md) | Trust Classes | High | L | security |
| 27 | [GAP-ECO-001](./gaps/ecosystem/GAP-ECO-001.md) | CC Plugin Compatibility Layer | Critical | XL | ecosystem |
| 28 | [GAP-ECO-002](./gaps/ecosystem/GAP-ECO-002.md) | CC Marketplace Protocol Support | High | L | ecosystem |
| 29 | [GAP-REMOTE-007](./gaps/remote-integration/GAP-REMOTE-007.md) | Host Contract Layer | High | L | remote-integration |
| 30 | [GAP-STATE-001](./gaps/state-continuity/GAP-STATE-001.md) | Memory Extraction | High | L | state-continuity |
| 31 | [GAP-STATE-003](./gaps/state-continuity/GAP-STATE-003.md) | Session State Persistence | High | L | state-continuity |
| 32 | [GAP-AGENT-005](./gaps/agent-delegation/GAP-AGENT-005.md) | Cross-Run Communication | High | L | agent-delegation |
| 33 | [GAP-AGENT-006](./gaps/agent-delegation/GAP-AGENT-006.md) | Cross-Run State Sharing | High | L | agent-delegation |
| 34 | [GAP-PAR-002](./gaps/parallelization/GAP-PAR-002.md) | Async Effect Execution | High | L | parallelization |
| 35 | [GAP-USER-006](./gaps/user-experience/GAP-USER-006.md) | Real-Time Cost Tracking | High | M | user-experience |
| 36 | [GAP-USER-001](./gaps/user-experience/GAP-USER-001.md) | Operator Command Layer | High | L | user-experience |
| 37 | [GAP-USER-012](./gaps/user-experience/GAP-USER-012.md) | Plan Mode + Verification | High | M | user-experience |
| 38 | [GAP-USER-017](./gaps/user-experience/GAP-USER-017.md) | Plugin Management | High | M | user-experience |
| 39 | [GAP-JSON-003](./gaps/json-interaction/GAP-JSON-003.md) | JSON Breakpoint API | High | M | json-interaction |
| 40 | [GAP-JSON-004](./gaps/json-interaction/GAP-JSON-004.md) | JSON Session API | High | M | json-interaction |
| 41 | [GAP-JSON-005](./gaps/json-interaction/GAP-JSON-005.md) | JSON Event Stream | High | L | json-interaction |
| 42 | [GAP-SUBOBS-002](./gaps/subagent-observability/GAP-SUBOBS-002.md) | Progress Tracking | High | M | subagent-observability |
| 43 | [GAP-SUBOBS-003](./gaps/subagent-observability/GAP-SUBOBS-003.md) | Per-Subagent Cost | High | M | subagent-observability |
| 44 | [GAP-HADAPT-002](./gaps/harness-adaptation/GAP-HADAPT-002.md) | Model Selection Per Task | High | M | harness-adaptation |
| 45 | [GAP-HADAPT-003](./gaps/harness-adaptation/GAP-HADAPT-003.md) | Cost-Based Routing | High | L | harness-adaptation |
| 46 | [GAP-HADAPT-004](./gaps/harness-adaptation/GAP-HADAPT-004.md) | Fallback Chains | High | M | harness-adaptation |
| 47 | [GAP-SESSION-002](./gaps/session-management/GAP-SESSION-002.md) | Session State History | High | M | session-management |
| 48 | [GAP-SESSION-004](./gaps/session-management/GAP-SESSION-004.md) | Session Cost Budgets | High | M | session-management |
| 49 | [GAP-PROC-001](./gaps/process-composition/GAP-PROC-001.md) | Process Chaining | High | M | process-composition |
| 50 | [GAP-PROC-002](./gaps/process-composition/GAP-PROC-002.md) | Process Nesting | High | L | process-composition |
| 51 | [GAP-ROUTE-001](./gaps/effect-routing/GAP-ROUTE-001.md) | Smart Routing Engine | High | XL | effect-routing |
| 52 | [GAP-BRK-001](./gaps/breakpoint-workflows/GAP-BRK-001.md) | Approval Chains | High | M | breakpoint-workflows |
| 53 | [GAP-BRK-002](./gaps/breakpoint-workflows/GAP-BRK-002.md) | External Delegation | High | L | breakpoint-workflows |
| 54 | [GAP-OBS-NEW-001](./gaps/observer-integration/GAP-OBS-NEW-001.md) | Webhooks and Alerts | High | M | observer-integration |
| 55 | [GAP-PROMPT-008](./gaps/prompt-engineering/GAP-PROMPT-008.md) | Coding Philosophy Prompt Section | High | S | prompt-engineering |
| 56 | [GAP-PROMPT-009](./gaps/prompt-engineering/GAP-PROMPT-009.md) | Tool Preference Rules | High | S | prompt-engineering |
| 57 | [GAP-PROMPT-010](./gaps/prompt-engineering/GAP-PROMPT-010.md) | Safety/Reversibility Prompt Framework | High | S | prompt-engineering |
| 58 | [GAP-TOOLS-014](./gaps/tools-capabilities/GAP-TOOLS-014.md) | Programmatic Task CRUD | High | M | tools-capabilities |
| 59 | [GAP-TOOLS-018](./gaps/tools-capabilities/GAP-TOOLS-018.md) | Structured Planning Phase | High | M | tools-capabilities |
| 60 | [GAP-TOOLS-025](./gaps/tools-capabilities/GAP-TOOLS-025.md) | MCP Tool Discovery/Invocation | High | M | tools-capabilities |
| 61 | [GAP-UX-001](./gaps/user-experience/GAP-UX-001.md) | Rich Rendering Engine | High | L | user-experience |
| 62 | [GAP-MCPC-001](./gaps/mcp-channels/GAP-MCPC-001.md) | MCP Channel Inbound Messaging | High | L | mcp-channels |
| 63 | [GAP-MCPC-002](./gaps/mcp-channels/GAP-MCPC-002.md) | MCP Channel Outbound Messaging | High | M | mcp-channels |
| 64 | [GAP-MCPC-003](./gaps/mcp-channels/GAP-MCPC-003.md) | Channel Permission Relay | High | L | mcp-channels |
| 65 | [GAP-TOOLS-030](./gaps/tools-capabilities/GAP-TOOLS-030.md) | Effect Cancellation | High | M | tools-capabilities |
| 66 | [GAP-UX-001a](./gaps/user-experience/GAP-UX-001a.md) | Effect Tree Visualization | High | M | user-experience |
| 67 | [GAP-UX-001c](./gaps/user-experience/GAP-UX-001c.md) | Permission and Breakpoint Approval UI | High | M | user-experience |
| 68 | [GAP-UX-001e](./gaps/user-experience/GAP-UX-001e.md) | Progress and Status Line | High | S | user-experience |
| 69 | [GAP-UX-001f](./gaps/user-experience/GAP-UX-001f.md) | Streaming Output Panels | High | L | user-experience |

**Phase 2 totals**: 55 gaps (2 critical + 53 high)

## Phase 3: Advanced Capabilities (Weeks 13-24)

| Rank | Gap ID | Feature | Priority | Effort | Category |
|------|--------|---------|----------|--------|----------|
| 70 | [GAP-PERF-002](./gaps/performance/GAP-PERF-002.md) | Session Compaction | Critical | XL | performance |
| 71 | [GAP-AGENT-001](./gaps/agent-delegation/GAP-AGENT-001.md) | Sub-Harness Isolation | High | XL | agent-delegation |
| 72 | [GAP-AGENT-003](./gaps/agent-delegation/GAP-AGENT-003.md) | Process Orchestration | High | XL | agent-delegation |
| 73 | [GAP-REMOTE-001](./gaps/remote-integration/GAP-REMOTE-001.md) | Daemon Mode | High | XL | remote-integration |
| 74 | [GAP-PAR-003](./gaps/parallelization/GAP-PAR-003.md) | Multi-Harness Parallel | High | XL | parallelization |
| 75 | [GAP-TOOLS-012](./gaps/tools-capabilities/GAP-TOOLS-012.md) | LSP Integration for Code-Aware Routing | High | L | tools-capabilities |
| 76 | [GAP-TOOLS-017](./gaps/tools-capabilities/GAP-TOOLS-017.md) | Git Worktree Isolation | High | L | tools-capabilities |
| 77 | [GAP-TOOLS-023](./gaps/tools-capabilities/GAP-TOOLS-023.md) | Workflow Composition Within Effects | High | L | tools-capabilities |
| 78 | [GAP-UX-007](./gaps/user-experience/GAP-UX-007.md) | Rich Breakpoints | Medium | M | user-experience |
| 79 | [GAP-UX-008](./gaps/user-experience/GAP-UX-008.md) | Resume Dashboard | Medium | M | user-experience |
| 80 | [GAP-UX-009](./gaps/user-experience/GAP-UX-009.md) | Failure Triage | Medium | M | user-experience |
| 81 | [GAP-UX-011](./gaps/user-experience/GAP-UX-011.md) | Command Discoverability | Medium | M | user-experience |
| 82 | [GAP-UX-014](./gaps/user-experience/GAP-UX-014.md) | Mode Selection | Medium | M | user-experience |
| 83 | [GAP-UX-010](./gaps/user-experience/GAP-UX-010.md) | Typed Effect Interaction Patterns | Medium | M | user-experience |
| 84 | [GAP-OBS-002](./gaps/observability/GAP-OBS-002.md) | Phase Timeline | Medium | M | observability |
| 85 | [GAP-OBS-003](./gaps/observability/GAP-OBS-003.md) | Prompt Observability | Medium | M | observability |
| 86 | [GAP-OBS-005](./gaps/observability/GAP-OBS-005.md) | Context Introspection | Medium | M | observability |
| 87 | [GAP-OBS-007](./gaps/observability/GAP-OBS-007.md) | Audit Export | Medium | M | observability |
| 88 | [GAP-OBS-008](./gaps/observability/GAP-OBS-008.md) | Progress Summarization | Medium | M | observability |
| 89 | [GAP-SEC-004](./gaps/security/GAP-SEC-004.md) | Sandbox Toggle | Medium | M | security |
| 90 | [GAP-SEC-007](./gaps/security/GAP-SEC-007.md) | Privacy Settings | Medium | M | security |
| 91 | [GAP-PROMPT-003](./gaps/prompt-engineering/GAP-PROMPT-003.md) | Personality Overlays | Medium | M | prompt-engineering |
| 92 | [GAP-PROMPT-004](./gaps/prompt-engineering/GAP-PROMPT-004.md) | Prompt Inspection | Medium | M | prompt-engineering |
| 93 | [GAP-PROMPT-006](./gaps/prompt-engineering/GAP-PROMPT-006.md) | Instructions Hook | Medium | M | prompt-engineering |
| 94 | [GAP-PROMPT-011](./gaps/prompt-engineering/GAP-PROMPT-011.md) | Output Efficiency Rules | Medium | S | prompt-engineering |
| 95 | [GAP-PROMPT-012](./gaps/prompt-engineering/GAP-PROMPT-012.md) | Git Safety Protocol Prompt | Medium | S | prompt-engineering |
| 96 | [GAP-AGENT-004](./gaps/agent-delegation/GAP-AGENT-004.md) | Process Templates | Medium | L | agent-delegation |
| 97 | [GAP-AGENT-007](./gaps/agent-delegation/GAP-AGENT-007.md) | Delegation Policy | Medium | L | agent-delegation |
| 98 | [GAP-PAR-005](./gaps/parallelization/GAP-PAR-005.md) | Parallel File Ops | Medium | M | parallelization |
| 99 | [GAP-PAR-006](./gaps/parallelization/GAP-PAR-006.md) | Streaming Parallelism | Medium | M | parallelization |
| 100 | [GAP-PAR-010](./gaps/parallelization/GAP-PAR-010.md) | Fork-Join Pattern | Medium | L | parallelization |
| 101 | [GAP-SUBOBS-004](./gaps/subagent-observability/GAP-SUBOBS-004.md) | Health Monitoring | Medium | M | subagent-observability |
| 102 | [GAP-SUBOBS-005](./gaps/subagent-observability/GAP-SUBOBS-005.md) | Dashboard Drill-Down | Medium | L | subagent-observability |
| 103 | [GAP-HADAPT-005](./gaps/harness-adaptation/GAP-HADAPT-005.md) | Circuit Breaker | Medium | M | harness-adaptation |
| 104 | [GAP-SESSION-003](./gaps/session-management/GAP-SESSION-003.md) | Session Templates | Medium | M | session-management |
| 105 | [GAP-PROC-003](./gaps/process-composition/GAP-PROC-003.md) | Process Versioning | Medium | L | process-composition |
| 106 | [GAP-PROC-004](./gaps/process-composition/GAP-PROC-004.md) | Parameter Schemas | Medium | S | process-composition |
| 107 | [GAP-ROUTE-002](./gaps/effect-routing/GAP-ROUTE-002.md) | Effect Priority | Medium | M | effect-routing |
| 108 | [GAP-ROUTE-003](./gaps/effect-routing/GAP-ROUTE-003.md) | Effect Caching | Medium | M | effect-routing |
| 109 | [GAP-TOOLS-008](./gaps/tools-capabilities/GAP-TOOLS-008.md) | Orchestrator-Delegated Web Search | Medium | M | tools-capabilities |
| 110 | [GAP-TOOLS-026](./gaps/tools-capabilities/GAP-TOOLS-026.md) | Structured User Interaction from Effects | Medium | M | tools-capabilities |
| 111 | [GAP-TOOLS-027](./gaps/tools-capabilities/GAP-TOOLS-027.md) | Skill Discovery/Invocation from Processes | Medium | M | tools-capabilities |
| 112 | [GAP-RUN-001](./gaps/run-lifecycle/GAP-RUN-001.md) | Run Comparison | Medium | M | run-lifecycle |
| 113 | [GAP-RUN-003](./gaps/run-lifecycle/GAP-RUN-003.md) | Run Forking | Medium | L | run-lifecycle |
| 114 | [GAP-OBS-NEW-002](./gaps/observer-integration/GAP-OBS-NEW-002.md) | Observer API | Medium | L | observer-integration |
| 115 | [GAP-PROF-001](./gaps/profile-orchestration/GAP-PROF-001.md) | Profile Auto-Config | Medium | M | profile-orchestration |
| 116 | [GAP-MCPC-004](./gaps/mcp-channels/GAP-MCPC-004.md) | MCP Server Management UI | Medium | M | mcp-channels |
| 117 | [GAP-TOOLS-029](./gaps/tools-capabilities/GAP-TOOLS-029.md) | Structured Output Tool | Medium | M | tools-capabilities |
| 118 | [GAP-TOOLS-031](./gaps/tools-capabilities/GAP-TOOLS-031.md) | MCP Resource Browsing/Reading | Medium | M | tools-capabilities |
| 119 | [GAP-TOOLS-032](./gaps/tools-capabilities/GAP-TOOLS-032.md) | MCP Authentication | Medium | L | tools-capabilities |
| 120 | [GAP-TOOLS-034](./gaps/tools-capabilities/GAP-TOOLS-034.md) | Dynamic Tool Discovery/Search | Medium | M | tools-capabilities |
| 121 | [GAP-TOOLS-035](./gaps/tools-capabilities/GAP-TOOLS-035.md) | Grep Output Modes and Context Params | Medium | S | tools-capabilities |
| 122 | [GAP-TOOLS-036](./gaps/tools-capabilities/GAP-TOOLS-036.md) | Bash Background Execution | Medium | S | tools-capabilities |
| 123 | [GAP-UX-001b](./gaps/user-experience/GAP-UX-001b.md) | Structured Diff Rendering | Medium | M | user-experience |
| 124 | [GAP-UX-001d](./gaps/user-experience/GAP-UX-001d.md) | Message Type Rendering | Medium | L | user-experience |

**Phase 3 totals**: 55 gaps (1 critical + 7 high + 47 medium)

## Phase 4: Extended Platform (Weeks 25-40)

| Rank | Gap ID | Feature | Priority | Effort | Category |
|------|--------|---------|----------|--------|----------|
| 125 | [GAP-PERF-006](./gaps/performance/GAP-PERF-006.md) | Incremental Streaming | Medium | L | performance |
| 126 | [GAP-PERF-007](./gaps/performance/GAP-PERF-007.md) | Aggressive Parallelism | Medium | L | performance |
| 127 | [GAP-PROMPT-007](./gaps/prompt-engineering/GAP-PROMPT-007.md) | Compression Families | Medium | L | prompt-engineering |
| 128 | [GAP-REMOTE-004](./gaps/remote-integration/GAP-REMOTE-004.md) | Cron Triggers | Medium | L | remote-integration |
| 129 | [GAP-REMOTE-006](./gaps/remote-integration/GAP-REMOTE-006.md) | MCP Client | Medium | L | remote-integration |
| 130 | [GAP-REMOTE-008](./gaps/remote-integration/GAP-REMOTE-008.md) | Streaming Protocol | Medium | L | remote-integration |
| 131 | [GAP-REMOTE-009](./gaps/remote-integration/GAP-REMOTE-009.md) | Host-Mediated Interaction | Medium | L | remote-integration |
| 132 | [GAP-STATE-002](./gaps/state-continuity/GAP-STATE-002.md) | Memory Consolidation | Medium | L | state-continuity |
| 133 | [GAP-STATE-006](./gaps/state-continuity/GAP-STATE-006.md) | Session Rewind | Medium | L | state-continuity |
| 134 | [GAP-OBS-006](./gaps/observability/GAP-OBS-006.md) | Analytics + Flags | Medium | L | observability |
| 135 | [GAP-SEC-006](./gaps/security/GAP-SEC-006.md) | OAuth Integration | Medium | L | security |
| 136 | [GAP-ECO-005](./gaps/ecosystem/GAP-ECO-005.md) | Plugin Validation and Diagnostics | Medium | S | ecosystem |
| 137 | [GAP-TOOLS-020](./gaps/tools-capabilities/GAP-TOOLS-020.md) | Scheduled Orchestration Triggers | Medium | L | tools-capabilities |
| 138 | [GAP-TOOLS-021](./gaps/tools-capabilities/GAP-TOOLS-021.md) | External Event Triggers | Medium | L | tools-capabilities |
| 139 | [GAP-BRK-003](./gaps/breakpoint-workflows/GAP-BRK-003.md) | Breakpoint Analytics | Low | S | breakpoint-workflows |
| 140 | [GAP-RUN-002](./gaps/run-lifecycle/GAP-RUN-002.md) | Run Archival | Low | M | run-lifecycle |
| 141 | [GAP-TOOLS-028](./gaps/tools-capabilities/GAP-TOOLS-028.md) | Sleep/Delay Effect Enhancement | Low | S | tools-capabilities |
| 142 | [GAP-TOOLS-007](./gaps/tools-capabilities/GAP-TOOLS-007.md) | JS/TS REPL Tool | Low | S | tools-capabilities |
| 143 | [GAP-TOOLS-033](./gaps/tools-capabilities/GAP-TOOLS-033.md) | Runtime Configuration Tool | Low | S | tools-capabilities |
| 144 | [GAP-TOOLS-037](./gaps/tools-capabilities/GAP-TOOLS-037.md) | Fetch Content Processing | Low | M | tools-capabilities |
| 145 | [GAP-TOOLS-038](./gaps/tools-capabilities/GAP-TOOLS-038.md) | Ask Tool Interaction Model Alignment | Low | S | tools-capabilities |
| 146 | [GAP-ECO-004](./gaps/ecosystem/GAP-ECO-004.md) | Plugin Auto-Update and Versioning | Medium | M | ecosystem |

**Phase 4 totals**: 22 gaps (0 critical + 0 high + 15 medium + 7 low)

## Phase 5: Aspirational (Weeks 41+)

| Rank | Gap ID | Feature | Priority | Effort | Category |
|------|--------|---------|----------|--------|----------|
| 147 | [GAP-REMOTE-003](./gaps/remote-integration/GAP-REMOTE-003.md) | Remote Sessions | High | XL | remote-integration |
| 148 | [GAP-SESSION-005](./gaps/session-management/GAP-SESSION-005.md) | Session Sharing | Low | L | session-management |

**Phase 5 totals**: 2 gaps

## Summary by Phase

| Phase | Gaps | Critical | High | Medium | Low | Timeframe |
|-------|------|----------|------|--------|-----|-----------|
| 1 - Foundation | 13 | 7 | 6 | 0 | 0 | Weeks 1-4 |
| 2 - Core Infrastructure | 55 | 2 | 53 | 0 | 0 | Weeks 5-12 |
| 3 - Advanced Capabilities | 55 | 1 | 7 | 47 | 0 | Weeks 13-24 |
| 4 - Extended Platform | 22 | 0 | 0 | 15 | 7 | Weeks 25-40 |
| 5 - Aspirational | 2 | 0 | 1 | 0 | 1 | Weeks 41+ |
| **Total** | **147** | **10** | **67** | **62** | **8** | |

## Dependencies Graph (Critical Path)

```
GAP-PROMPT-001 (Strata) --> GAP-PERF-001 (Caching) --> GAP-PERF-005 (Cache-Aware)
GAP-SEC-001 (Policy) --> GAP-SEC-002 (Trust)
GAP-ECO-002 (Marketplace) --> GAP-SEC-002 (Trust)
GAP-SEC-001 (Policy) --> GAP-OBS-004 (Decision Trail)
GAP-HADAPT-001 (Routing) --> GAP-HADAPT-002 (Model) --> GAP-ROUTE-001 (Smart Engine)
GAP-SESSION-001 (Multi-Run) --> GAP-SESSION-002 (State) --> GAP-STATE-001 (Memory)
GAP-JSON-001 (API) --> GAP-JSON-003 (Breakpoint) --> GAP-BRK-002 (External)
GAP-SUBOBS-001 (Streaming) --> GAP-SUBOBS-002 (Progress) --> GAP-SUBOBS-005 (Dashboard)
GAP-PAR-009 (Strategies) --> GAP-PAR-001 (Concurrent) --> GAP-PAR-002 (Async)
GAP-REMOTE-007 (Contract) --> GAP-REMOTE-008 (Streaming) --> GAP-REMOTE-003 (WebSocket)
GAP-PROC-004 (Schemas) --> GAP-PROC-001 (Chaining) --> GAP-PROC-002 (Nesting)
GAP-HADAPT-001 (Routing) --> GAP-TOOLS-025 (MCP Tools)
GAP-TOOLS-025 (MCP Tools) --> GAP-TOOLS-031 (MCP Resources)
GAP-PAR-001 (Concurrent) --> GAP-TOOLS-017 (Worktree Isolation)
GAP-REMOTE-001 (Daemon) --> GAP-TOOLS-020 (Scheduled Triggers) --> GAP-TOOLS-021 (Event Triggers)
GAP-PROMPT-001 (Strata) --> GAP-PROMPT-008 (Coding Philosophy)
GAP-PROMPT-001 (Strata) --> GAP-PROMPT-009 (Tool Preferences)
GAP-PROMPT-001 (Strata) --> GAP-PROMPT-010 (Safety) --> GAP-PROMPT-012 (Git Safety)
```
