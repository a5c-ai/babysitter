# Phase 4: Parallel Work Tracks

8 independent work streams that can proceed concurrently without cross-dependencies (at the non-CLOSED layer).

---

## Track 1: Subagent Observability + Parallelization Core

**Theme:** Make harness invocations observable and concurrent.
**Foundation:** GAP-SUBOBS-001 (Critical)
**Total gaps:** 16

This is the largest and most critical track. It chains streaming output capture through subagent progress tracking into parallel execution and ultimately feeds the coordinator process pattern.

| Order | Gap | Priority | Status | Effort | Depends On (in-track) |
|-------|-----|----------|--------|--------|-----------------------|
| 1 | GAP-SUBOBS-001 - Streaming Output Capture | Critical | IN_PROGRESS | M | -- |
| 2a | GAP-SUBOBS-002 - Subagent Progress Tracking | High | IN_PROGRESS | M | SUBOBS-001 |
| 2b | GAP-SUBOBS-004 - Subagent Health and Timeout | Medium | IN_PROGRESS | M | SUBOBS-001 |
| 2c | GAP-PERF-004 - Streaming Message Rendering | High | IN_PROGRESS | M | SUBOBS-001 |
| 3 | GAP-PAR-001 - Concurrent Effect Execution | High | IN_PROGRESS | M | (foundation: PAR-009 CLOSED) |
| 4a | GAP-PAR-003 - Multi-Harness Parallel Dispatch | High | IN_PROGRESS | L | PAR-001, SUBOBS-002 |
| 4b | GAP-PAR-005 - Parallel File Operations | Medium | IN_PROGRESS | M | PAR-001 |
| 4c | GAP-PERF-007 - Aggressive Parallelism | Medium | IN_PROGRESS | M | PAR-001 |
| 4d | GAP-PAR-006 - Streaming Parallelism | Medium | IN_PROGRESS | M | PERF-004, PAR-001 |
| 5a | GAP-PAR-010 - Fork-Join Process Pattern | Medium | OPEN | L | PAR-003 |
| 5b | GAP-TOOLS-017 - Git Worktree Isolation | High | OPEN | L | PAR-001 |
| 5c | GAP-SUBOBS-005 - Dashboard Subagent Drill-Down | Medium | NEEDS_RESPEC | L | SUBOBS-001, SUBOBS-002 |
| 6 | GAP-AGENT-001 - Sub-Harness Invocation with Isolation | High | IN_PROGRESS | M | SUBOBS-001 |
| 7a | GAP-AGENT-005 - Cross-Run Communication | High | OPEN | L | AGENT-001 |
| 7b | GAP-AGENT-006 - Cross-Run State Sharing | High | IN_PROGRESS | M | AGENT-001 |
| 8 | GAP-AGENT-003 - Process Orchestration with Effect Routing | High | IN_PROGRESS | L | AGENT-001, PAR-003, SUBOBS-002 |

**Parallelism within track:** Steps 2a/2b/2c can run in parallel. Steps 4a/4b/4c/4d can run in parallel. Steps 5a/5b/5c can run in parallel. Steps 7a/7b can run in parallel.

---

## Track 2: Ecosystem and Plugin Platform

**Theme:** CC plugin compatibility, marketplace, trust, and plugin lifecycle.
**Foundation:** GAP-ECO-002 (High, OPEN)
**Total gaps:** 9

| Order | Gap | Priority | Status | Effort | Depends On (in-track) |
|-------|-----|----------|--------|--------|-----------------------|
| 1 | GAP-ECO-002 - CC Marketplace Protocol Support | High | OPEN | L | -- |
| 2a | GAP-ECO-003 - Plugin Trust, Provenance, Blocklist | High | IN_PROGRESS | S | (foundation: SEC-001 CLOSED) |
| 2b | GAP-ECO-004 - Plugin Auto-Update and Versioning | Medium | IN_PROGRESS | S | ECO-002 |
| 2c | GAP-SEC-002 - Trust Classes for Plugins | High | IN_PROGRESS | S | ECO-002 |
| 2d | GAP-USER-017 - Plugin Management Integration | High | IN_PROGRESS | M | ECO-002 |
| 3 | GAP-ECO-001 - CC Plugin Compatibility Layer | Critical | IN_PROGRESS | L | ECO-002, ECO-003 |
| 4a | GAP-ECO-005 - Plugin Validation and Diagnostics | Medium | IN_PROGRESS | S | ECO-001 |
| 4b | GAP-OBS-006 - Analytics and Feature Flags | Medium | IN_PROGRESS | M | ECO-004 |
| 4c | GAP-PROF-001 - Auto-Configure from User Profile | Medium | IN_PROGRESS | M | ECO-004 |

**Parallelism within track:** GAP-ECO-003 can start immediately (its declared dep GAP-SEC-001 is CLOSED). Steps 2a-2d can run in parallel once ECO-002 is done (or ECO-003 can start now).

---

## Track 3: Remote and Host Integration

**Theme:** Host contract, remote sessions, and session collaboration.
**Foundation:** GAP-REMOTE-007 (High, IN_PROGRESS)
**Total gaps:** 4

| Order | Gap | Priority | Status | Effort | Depends On (in-track) |
|-------|-----|----------|--------|--------|-----------------------|
| 1 | GAP-REMOTE-007 - Host Contract Layer | High | IN_PROGRESS | M | -- |
| 2a | GAP-REMOTE-003 - Remote Sessions (WebSocket) | High | IN_PROGRESS | L | REMOTE-007 |
| 2b | GAP-JSON-004 - JSON Session Management API | High | IN_PROGRESS | S | REMOTE-007 |
| 3 | GAP-SESSION-005 - Session Sharing and Collaboration | Low | OPEN | L | REMOTE-003 |

**Parallelism within track:** REMOTE-003 and JSON-004 can proceed in parallel once REMOTE-007 completes.

---

## Track 4: Prompt Engineering and Caching

**Theme:** Prompt inspection, caching, compaction, and compression.
**Foundation:** GAP-PROMPT-004, GAP-PERF-001, GAP-PROMPT-006 (all IN_PROGRESS, no upstream deps in non-CLOSED gaps)
**Total gaps:** 6

| Order | Gap | Priority | Status | Effort | Depends On (in-track) |
|-------|-----|----------|--------|--------|-----------------------|
| 1a | GAP-PROMPT-004 - Prompt Inspection Tooling | Medium | IN_PROGRESS | S | -- |
| 1b | GAP-PERF-001 - Prompt Caching (Ephemeral) | Critical | IN_PROGRESS | S | -- |
| 1c | GAP-PROMPT-006 - Instructions Loaded Hook | Medium | IN_PROGRESS | S | -- |
| 2a | GAP-OBS-003 - Prompt Plan Observability | Medium | IN_PROGRESS | S | PROMPT-004 |
| 2b | GAP-OBS-005 - Context Introspection | Medium | IN_PROGRESS | S | PERF-001 |
| 2c | GAP-PERF-002 - Session Compaction | Critical | IN_PROGRESS | L | PROMPT-006 |
| 3 | GAP-PROMPT-007 - Context Compression Families | Medium | IN_PROGRESS | L | PERF-002 |

**Parallelism within track:** All 3 foundation items (1a/1b/1c) can start immediately and in parallel. Steps 2a/2b/2c can proceed in parallel once their respective foundations complete.

---

## Track 5: Process Composition and State Lifecycle

**Theme:** Process chaining, versioning, memory, and run lifecycle.
**Foundation:** GAP-PROC-001, GAP-PROC-003 (both have no non-CLOSED upstream deps)
**Total gaps:** 10

| Order | Gap | Priority | Status | Effort | Depends On (in-track) |
|-------|-----|----------|--------|--------|-----------------------|
| 1a | GAP-PROC-001 - Process Chaining and Pipelines | High | IN_PROGRESS | M | -- |
| 1b | GAP-PROC-003 - Process Versioning and Migration | Medium | OPEN | L | -- |
| 2a | GAP-TOOLS-023 - Multi-Step Workflow Composition | High | IN_PROGRESS | L | PROC-001 |
| 2b | GAP-TOOLS-012 - LSP Integration | High | OPEN | L | PROC-001 |
| 2c | GAP-AGENT-004 - Built-in Process Templates | Medium | IN_PROGRESS | M | PROC-001 |
| 2d | GAP-STATE-006 - Session Rewind and History | Medium | OPEN | L | PROC-003 |
| 3a | GAP-RUN-003 - Run Forking and Branching | Medium | OPEN | L | STATE-006 |
| 3b | GAP-SESSION-003 - Session Templates and Presets | Medium | OPEN | M | AGENT-004 (cross-track implicit) |
| 4a | GAP-STATE-001 - Long-Term Memory Extraction | High | IN_PROGRESS | S | (cross-track: AGENT-006) |
| 4b | GAP-STATE-002 - Memory Consolidation | Medium | OPEN | L | STATE-001 |

**Note:** GAP-STATE-001 has a cross-track implicit dependency on GAP-AGENT-006 (Track 1). GAP-AGENT-004 also has a cross-track dependency on GAP-AGENT-003 (Track 1). These are second-order dependencies that do not block starting work on this track's foundations.

**Parallelism within track:** PROC-001 and PROC-003 can start immediately and in parallel. Steps 2a/2b/2c can proceed in parallel. STATE-006 can proceed once PROC-003 is done.

---

## Track 6: UI/UX Rendering (Blocked on Respec)

**Theme:** Terminal rendering foundation and derived visualization components.
**Foundation:** GAP-UX-001 (NEEDS_RESPEC)
**Total gaps:** 10

**WARNING: This entire track is blocked until GAP-UX-001 is respecified** to target tula-ui or observer-dashboard instead of the original "Ink in SDK" assumption.

| Order | Gap | Priority | Status | Effort | Depends On (in-track) |
|-------|-----|----------|--------|--------|-----------------------|
| 0 | GAP-UX-001 - Rendering Foundation | High | NEEDS_RESPEC | L | **NEEDS RESPEC FIRST** |
| 1a | GAP-UX-001a - Effect Tree Visualization | High | NEEDS_RESPEC | M | UX-001 |
| 1b | GAP-UX-001b - Structured Diff Rendering | Medium | NEEDS_RESPEC | M | UX-001 |
| 1c | GAP-UX-001d - Message Type Rendering | Medium | NEEDS_RESPEC | L | UX-001 |
| 1d | GAP-UX-001e - Progress and Status Line | High | NEEDS_RESPEC | S | UX-001 |
| 1e | GAP-UX-001f - Streaming Output Panels | High | NEEDS_RESPEC | L | UX-001 |
| 2a | GAP-TOOLS-029 - Structured Output Tool | Medium | OPEN | M | UX-001b, UX-001d |
| 2b | GAP-UX-001c - Permission/Breakpoint Approval UI | High | IN_PROGRESS | M | UX-001 (implicit) |
| -- | GAP-UX-008 - Resume Dashboard | Medium | IN_PROGRESS | M | (independent of UX-001) |
| -- | GAP-UX-009 - Failure Triage View | Medium | IN_PROGRESS | M | (independent of UX-001) |

**Parallelism within track:** Once GAP-UX-001 is respecified and completed, all 1a-1e can proceed in parallel. GAP-UX-008 and GAP-UX-009 are independent and can start now.

---

## Track 7: Security, Privacy, and Auth

**Theme:** OAuth, privacy settings, MCP auth.
**Foundation:** No non-CLOSED upstream deps.
**Total gaps:** 4

| Order | Gap | Priority | Status | Effort | Depends On (in-track) |
|-------|-----|----------|--------|--------|-----------------------|
| 1a | GAP-TOOLS-032 - MCP Authentication | Medium | OPEN | L | -- |
| 1b | GAP-SEC-007 - Privacy Settings | Medium | OPEN | M | -- |
| 2a | GAP-SEC-006 - OAuth Integration | Medium | OPEN | L | TOOLS-032 (shared infra) |
| 2b | GAP-TOOLS-031 - MCP Resource Browsing | Medium | IN_PROGRESS | S | TOOLS-032 |

**Parallelism within track:** TOOLS-032 and SEC-007 can start immediately and in parallel. SEC-006 and TOOLS-031 proceed once TOOLS-032 is done.

---

## Track 8: Independent Leaf Gaps

**Theme:** Standalone gaps with no non-CLOSED dependencies and no dependents.
**Total gaps:** 19

These gaps can be worked on at any time without blocking or being blocked by other tracks. They are ordered by priority.

| Gap | Priority | Status | Effort | Category |
|-----|----------|--------|--------|----------|
| GAP-PROMPT-010 - Safety and Reversibility Framework | High | IN_PROGRESS | S | prompt-engineering |
| GAP-HADAPT-003 - Cost-Based Routing Policies | High | IN_PROGRESS | S | harness-adaptation |
| GAP-HADAPT-005 - Harness Health Monitoring | Medium | IN_PROGRESS | S | harness-adaptation |
| GAP-MCPC-003 - Channel Permission Relay | High | IN_PROGRESS | S | mcp-channels |
| GAP-OBS-NEW-001 - Webhook and Alert System | High | IN_PROGRESS | S | observer-integration |
| GAP-ROUTE-002 - Effect Priority and Scheduling | Medium | IN_PROGRESS | S | effect-routing |
| GAP-ROUTE-003 - Effect Result Caching | Medium | IN_PROGRESS | M | effect-routing |
| GAP-OBS-007 - Audit Export | Medium | OPEN | M | observability |
| GAP-OBS-008 - Agent Progress Summarization | Medium | OPEN | M | observability |
| GAP-TOOLS-026 - Structured User Interaction | Medium | IN_PROGRESS | M | tools-capabilities |
| GAP-UX-010 - Typed Effect Interaction Patterns | Medium | IN_PROGRESS | M | user-experience |
| GAP-UX-011 - Command Discoverability | Medium | IN_PROGRESS | S | user-experience |
| GAP-BRK-003 - Breakpoint Analytics and SLA | Low | OPEN | S | breakpoint-workflows |
| GAP-RUN-001 - Run Comparison and Diffing | Medium | OPEN | M | run-lifecycle |
| GAP-RUN-002 - Run Archival and Restore | Low | OPEN | M | run-lifecycle |
| GAP-TOOLS-007 - JS/TS REPL Tool | Low | OPEN | S | tools-capabilities |
| GAP-TOOLS-028 - Sleep/Delay Effect Enhancement | Low | IN_PROGRESS | S | tools-capabilities |
| GAP-TOOLS-037 - Fetch Content Processing | Low | OPEN | M | tools-capabilities |

**Note:** Some of these have implicit dependencies noted in the graph (e.g., GAP-HADAPT-003 implicitly benefits from GAP-HADAPT-005, GAP-MCPC-003 from GAP-OBS-NEW-001) but these are soft dependencies -- work can proceed independently and be wired together later.

---

## Summary: Recommended Execution Order

1. **Immediate starts (no blockers, high impact):**
   - Track 1 foundation: GAP-SUBOBS-001 (unblocks 22 downstream)
   - Track 2 foundation: GAP-ECO-002 (unblocks 12 downstream)
   - Track 4 foundations: GAP-PERF-001, GAP-PROMPT-004, GAP-PROMPT-006 (all S effort, parallel)
   - Track 5 foundations: GAP-PROC-001, GAP-PROC-003 (both ready, parallel)
   - Track 3 foundation: GAP-REMOTE-007 (already IN_PROGRESS)
   - Track 8 high-priority leaves: GAP-PROMPT-010, GAP-HADAPT-003, GAP-MCPC-003, GAP-OBS-NEW-001

2. **Respec blocker to resolve first:**
   - GAP-UX-001 must be respecified before Track 6 can begin (5 NEEDS_RESPEC gaps blocked)

3. **Biggest bang-for-buck:**
   - GAP-SUBOBS-001 (M effort, 22 downstream) -- best ROI in the entire backlog
   - GAP-ECO-002 (L effort, 12 downstream) -- largest OPEN gap by downstream impact
   - GAP-PERF-001 (S effort, Critical priority) -- small effort, high value
