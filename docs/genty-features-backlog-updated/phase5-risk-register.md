# Phase 5: Risk Register

Gaps rated by risk factor (Low/Medium/High) based on: implementation uncertainty, cross-cutting impact, dependency depth, external dependencies, and architectural complexity.

---

## High Risk Gaps (15 total)

These gaps have significant uncertainty, multiple dependencies, architectural complexity, or exposure to external changes.

### Architectural Risk (Core Loop Changes)

| Gap ID | Title | Effort | Priority | Risk Drivers |
|--------|-------|--------|----------|-------------|
| GAP-AGENT-003 | Process Orchestration with Effect Routing | L | High | Requires restructuring orchestrateIteration.ts core execution path. capabilityRouter has zero consumers. Coordinator template is new architecture. |
| GAP-PAR-001 | Concurrent Effect Execution | M | High | Wiring concurrent execution into the sequential orchestration loop. Fundamental architectural change to the core engine. 6 direct dependents. |
| GAP-PAR-003 | Multi-Harness Parallel Dispatch | L | High | Cross-iteration team coordination is absent. Depends on PAR-001 + SUBOBS-002. Complex distributed coordination. |
| GAP-PERF-002 | Session Compaction | M | Critical | Multiple compaction strategies and auto-compact triggers require careful design. Incorrect compaction loses critical context. |

### External Dependency Risk

| Gap ID | Title | Effort | Priority | Risk Drivers |
|--------|-------|--------|----------|-------------|
| GAP-ECO-001 | CC Plugin Compatibility Layer | M | Critical | CC plugin format is external and may evolve. Adapter maintenance burden. Depends on understanding CC marketplace internals. |
| GAP-ECO-002 | CC Marketplace Protocol Support | L | High | CC marketplace API is external. Protocol may change without notice. No existing implementation to build on. 12 downstream gaps blocked. |
| GAP-TOOLS-032 | MCP Authentication | L | Medium | OAuth flows are security-sensitive. Token storage requires secure credential management. MCP auth spec may evolve. |
| GAP-SEC-006 | OAuth Integration | L | Medium | Full OAuth flow with refresh lifecycle. Security-sensitive. Shares infrastructure concerns with TOOLS-032. |

### Architectural Complexity Risk

| Gap ID | Title | Effort | Priority | Risk Drivers |
|--------|-------|--------|----------|-------------|
| GAP-AGENT-005 | Cross-Run Communication | L | High | Greenfield. AGENT_MESSAGE event type, routing between runs, delivery guarantees. No prior art in codebase. |
| GAP-TOOLS-012 | LSP Integration for Code-Aware Routing | L | High | LSP client is architecturally significant. Language server lifecycle, diagnostic consumption, and routing integration. |
| GAP-TOOLS-017 | Git Worktree Isolation | L | High | Worktree lifecycle management is tricky (especially on Windows). Blocked by PAR-001. |
| GAP-TOOLS-023 | Multi-Step Workflow Composition | L | High | ctx.workflow() intrinsic with conditional branching and retry policies. Declarative workflow engine design. |
| GAP-PAR-010 | Fork-Join Process Pattern | L | Medium | State inheritance at fork points and synchronization at join points. Blocked by PAR-003. |
| GAP-RUN-003 | Run Forking and Branching | L | Medium | Journal fork-from-point requires new replay architecture. Blocked by STATE-006. |
| GAP-STATE-006 | Session Rewind and History | L | Medium | ReplayEngine replays from start only. Fork-from-arbitrary-point requires new architecture. Blocked by PROC-003. |

### NEEDS_RESPEC Risk (Blocked on Decision)

| Gap ID | Title | Effort | Priority | Risk Drivers |
|--------|-------|--------|----------|-------------|
| GAP-UX-001 | Rendering Foundation | L | High | Architecture evolved to tula-ui/observer-dashboard. Blocks 5 downstream NEEDS_RESPEC gaps. Decision needed before any Track 6 work. |
| GAP-UX-001a | Effect Tree Visualization | M | High | Blocked on UX-001 respec. |
| GAP-UX-001f | Streaming Output Panels | L | High | Blocked on UX-001 respec + SUBOBS-001. Double dependency. |
| GAP-UX-001d | Message Type Rendering | L | Medium | Blocked on UX-001 respec. |
| GAP-SUBOBS-005 | Dashboard Subagent Drill-Down | L | Medium | Original spec assumes nonexistent embedded SDK dashboard. |
| GAP-SESSION-005 | Session Sharing and Collaboration | L | Low | Blocked by REMOTE-003. Distributed systems complexity. |

---

## Medium Risk Gaps (17 total)

Moderate uncertainty, limited cross-cutting impact, or one significant but manageable concern.

| Gap ID | Title | Remaining | Priority | Risk Driver |
|--------|-------|-----------|----------|-------------|
| GAP-SUBOBS-001 | Streaming Output Capture | S | Critical | Node.js child process streaming is well-understood, but harness diversity (Pi vs CLI vs remote) adds complexity. |
| GAP-SUBOBS-002 | Subagent Progress Tracking | S | High | Progress percentage extraction from heterogeneous output formats requires heuristics. |
| GAP-SUBOBS-004 | Subagent Health and Timeout | S | Medium | Hang detection based on output silence requires threshold calibration. |
| GAP-REMOTE-003 | Remote Sessions (WebSocket) | M | High | Run directory sync for remote execution is distributed systems work. |
| GAP-REMOTE-007 | Host Contract Layer | M | High | Types exist but zero consumers. Implementation + adoption risk. |
| GAP-PROC-001 | Process Chaining and Pipelines | M | High | Upgrading from skill-level to process-level pipelines with typed I/O. |
| GAP-PROC-003 | Process Versioning and Migration | L | Medium | Schema design for process version metadata and migration strategies. |
| GAP-PERF-004 | Streaming Message Rendering | M | High | Multi-harness streaming requires different approaches per harness type. |
| GAP-PERF-007 | Aggressive Parallelism | M | Medium | Auto-detecting independent effects requires analysis of effect inputs/outputs. |
| GAP-PAR-005 | Parallel File Operations | M | Medium | Constrained by single-session harness architecture. |
| GAP-PAR-006 | Streaming Parallelism | M | Medium | Pipeline parallelism between orchestration phases is new territory. |
| GAP-OBS-006 | Analytics and Feature Flags | M | Medium | Sink pipeline architecture decisions. |
| GAP-OBS-008 | Agent Progress Summarization | M | Medium | LLM-based or heuristic summarization strategy needs design. |
| GAP-PROMPT-007 | Context Compression Families | L | Medium | Semantic family grouping is fundamentally different from strata grouping. |
| GAP-SEC-007 | Privacy Settings | M | Medium | PII filtering is cross-cutting. |
| GAP-STATE-002 | Memory Consolidation | L | Medium | Merge/prune/weight algorithms for memories. Blocked by STATE-001. |
| GAP-UX-001c | Permission/Breakpoint Approval UI | S | High | Risk visualization quality depends on design decisions. |
| GAP-UX-010 | Typed Effect Interaction Patterns | M | Medium | Multi-harness rendering of typed interaction schemas. |
| GAP-UX-001b | Structured Diff Rendering | M | Medium | Platform choice uncertainty from UX-001 respec. |
| GAP-UX-001e | Progress and Status Line | S | High | Small once rendering target decided; blocked on UX-001. |

---

## Low Risk Gaps (18 total)

Well-scoped, self-contained, no architectural surprises, clear implementation path.

| Gap ID | Title | Remaining | Priority |
|--------|-------|-----------|----------|
| GAP-PERF-001 | Prompt Caching (Ephemeral) | S | Critical |
| GAP-HADAPT-003 | Cost-Based Routing Policies | S | High |
| GAP-ECO-003 | Plugin Trust, Provenance, Blocklist | S | High |
| GAP-SEC-002 | Trust Classes for Plugins | S | High |
| GAP-STATE-001 | Long-Term Memory Extraction | S | High |
| GAP-MCPC-003 | Channel Permission Relay | S | High |
| GAP-OBS-NEW-001 | Webhook and Alert System | S | High |
| GAP-PROMPT-010 | Safety/Reversibility Framework | S | High |
| GAP-JSON-004 | JSON Session Management API | S | High |
| GAP-AGENT-001 | Sub-Harness Invocation with Isolation | S | High |
| GAP-AGENT-006 | Cross-Run State Sharing | S | High |
| GAP-AGENT-004 | Built-in Process Templates | S | Medium |
| GAP-USER-017 | Plugin Management Integration | S | High |
| GAP-PROF-001 | Auto-Configure from User Profile | S | Medium |
| GAP-ECO-004 | Plugin Auto-Update and Versioning | S | Medium |
| GAP-ECO-005 | Plugin Validation and Diagnostics | S | Medium |
| GAP-ROUTE-002 | Effect Priority and Scheduling | S | Medium |
| GAP-ROUTE-003 | Effect Result Caching | S | Medium |
| GAP-HADAPT-005 | Harness Health Monitoring | S | Medium |
| GAP-PROMPT-004 | Prompt Inspection Tooling | S | Medium |
| GAP-PROMPT-006 | Instructions Loaded Hook | S | Medium |
| GAP-OBS-003 | Prompt Plan Observability | S | Medium |
| GAP-OBS-005 | Context Introspection | S | Medium |
| GAP-TOOLS-026 | Structured User Interaction | S | Medium |
| GAP-TOOLS-031 | MCP Resource Browsing | S | Medium |
| GAP-TOOLS-028 | Sleep/Delay Enhancement | S | Low |
| GAP-BRK-003 | Breakpoint Analytics | S | Low |
| GAP-TOOLS-007 | JS/TS REPL Tool | S | Low |
| GAP-UX-011 | Command Discoverability | S | Medium |
| GAP-UX-008 | Resume Dashboard | S | Medium |
| GAP-UX-009 | Failure Triage View | S | Medium |
| GAP-RUN-001 | Run Comparison and Diffing | M | Medium |
| GAP-RUN-002 | Run Archival and Restore | M | Low |
| GAP-OBS-007 | Audit Export | M | Medium |
| GAP-TOOLS-037 | Fetch Content Processing | M | Low |
| GAP-SESSION-003 | Session Templates | M | Medium |
| GAP-TOOLS-029 | Structured Output Tool | M | Medium |

---

## Risk Mitigation Strategies

### 1. Core Loop Changes (PAR-001, AGENT-003)
- **Strategy:** Feature-flag the concurrent execution path. Keep sequential path as default. Gradual rollout.
- **Spike first:** Build a proof-of-concept of concurrent effect execution on a branch before committing to the architecture.

### 2. External Dependencies (ECO-001, ECO-002)
- **Strategy:** Abstract the CC marketplace protocol behind a PluginSource interface. Support babysitter-native as primary, CC-compatible as secondary.
- **Pin versions:** Track CC plugin spec version and alert on breaking changes.

### 3. NEEDS_RESPEC Gaps (UX-001 and dependents)
- **Strategy:** Schedule a focused respec session for UX-001 before starting Track 6. Decision: adopt tula-ui as the rendering foundation. Then update all 5 dependent NEEDS_RESPEC gaps.
- **Decouple data from rendering:** All data APIs are complete. Rendering can be swapped independently.

### 4. Security-Sensitive Gaps (SEC-006, TOOLS-032)
- **Strategy:** Consolidate OAuth and MCP auth into a shared credential manager module. Design review before implementation. Follow established patterns (e.g., keytar or OS keychain).

### 5. Distributed Systems (REMOTE-003, SESSION-005)
- **Strategy:** Start with read-only remote observation (status, events). Add remote mutation (run creation, effect dispatch) incrementally. Avoid attempting full remote execution in one milestone.
