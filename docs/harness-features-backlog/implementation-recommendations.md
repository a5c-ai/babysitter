# Implementation Recommendations

Phased implementation plan for the 147 babysitter-native gaps. All recommendations are framed from the orchestration platform perspective.

> **Note**: This document groups gaps by implementation affinity (what makes sense to build together). The [Roadmap](./roadmap.md) groups by dependency ordering (what must be built first). The two use different sequencing -- consult the roadmap for prerequisite chains.

## Phase 1: Foundation (Weeks 1-4)

### 1.1 Prompt Strata Model (GAP-PROMPT-001)

**Objective**: Separate prompt assembly into cache-friendly strata.

**Implementation**:
1. Define `PromptStratum` type in `packages/sdk/src/prompts/`
2. Tag each prompt section with `stable`, `runtime`, or `turnLocal`
3. Compose prompts stratum-by-stratum with clear boundaries
4. Add `--show-strata` flag to `instructions:*` commands

**Acceptance Criteria**:
- [ ] All prompt sections tagged with stratum
- [ ] Prompt assembly preserves stratum ordering
- [ ] `instructions:babysit-skill --show-strata` shows stratum boundaries

### 1.2 Governance Policy Layer (GAP-SEC-001)

**Objective**: Centralized policy evaluation for security governance.

**Implementation**:
1. Create `packages/sdk/src/governance/` module
2. Define `PolicyRule` type with evaluation logic
3. Evaluate policies at effect dispatch in `processContext.ts`
4. Log policy decisions to structured JSONL

**Acceptance Criteria**:
- [ ] `PolicyEngine` evaluates rules at effect dispatch
- [ ] Policy decisions logged to `~/.a5c/logs/`
- [ ] Existing breakpoint rules integrated as policy source

### 1.3 JSON API Foundation (GAP-JSON-001 + GAP-JSON-002)

**Objective**: Programmatic JSON API for run and effect lifecycle.

**Implementation**:
1. Extract CLI command logic into importable API functions
2. Define JSON request/response protocol for runs and effects
3. Expose via MCP tools and direct import
4. Support both sync and async patterns

**Acceptance Criteria**:
- [ ] Run creation, iteration, and status via JSON API
- [ ] Effect dispatch and result posting via JSON API
- [ ] API usable from Node.js without shell invocation

### 1.4 Streaming Output Capture (GAP-SUBOBS-001)

**Objective**: Real-time output from harness invocations.

**Implementation**:
1. Pipe stdout/stderr from child processes in `invokeHarness()`
2. Stream events to observer dashboard
3. Store streaming output in task artifacts

**Acceptance Criteria**:
- [ ] Real-time output visible during harness invocation
- [ ] Observer dashboard shows live output per task

### 1.5 Capability-Based Routing (GAP-HADAPT-001)

**Objective**: Route tasks to harnesses by capability.

**Implementation**:
1. Define capability declarations per harness adapter
2. Add required capabilities to task definitions
3. Implement matching in routing logic

**Acceptance Criteria**:
- [ ] Harnesses declare capabilities (code-gen, search, edit, etc.)
- [ ] Tasks matched to capable harnesses
- [ ] Fallback to default when no match

### 1.6 Session-to-Run Model (GAP-SESSION-001)

**Objective**: Sessions contain multiple runs.

**Implementation**:
1. Extend session schema to track multiple runIds
2. Add `session:list-runs` command
3. Preserve session context across run boundaries

**Acceptance Criteria**:
- [ ] Sessions track multiple run IDs
- [ ] Session state persists across runs

### 1.7 Run Health + Status (GAP-STATE-008 + GAP-UX-005 + GAP-UX-006 + GAP-OBS-001)

**Objective**: Health scoring and unified status view.

**Implementation**:
1. Define `RunHealthScore` from journal analysis
2. Enhance `run:status` with `--rich` flag
3. Add `task:list --grouped` for organized pending work
4. Integrate health into `harness:doctor`

**Acceptance Criteria**:
- [ ] Health score computed from journal
- [ ] `run:status --rich` shows unified view
- [ ] `task:list --grouped` organizes by kind

### 1.8 Parallel Execution (GAP-PAR-001 + GAP-PAR-009)

**Objective**: Concurrent effect execution using scheduler hints.

**Implementation**:
1. Read scheduler hints in babysit skill
2. Execute same-group effects concurrently
3. Implement sleep strategy for sleepUntilEpochMs

**Acceptance Criteria**:
- [ ] Parallel-grouped effects execute concurrently
- [ ] Sleep effects deferred until epoch passes

### 1.9 Tool Quick Wins (GAP-TOOLS-035 + GAP-TOOLS-033 + GAP-TOOLS-038 + GAP-TOOLS-007)

Zero-dependency tool improvements: grep output modes, runtime config tool, ask tool alignment, JS/TS REPL.

---

## Phase 2: Core Infrastructure (Weeks 5-12)

### 2.1 Prompt Caching + Cache-Aware Assembly (GAP-PERF-001 + GAP-PERF-005)

Build on strata model for cache optimization. Stable strata cached between iterations.

### 2.2 Trust, Manifests, and Provenance (GAP-SEC-002 + GAP-SEC-003 + GAP-ECO-001 + GAP-ECO-002)

Unified plugin manifest with trust classification and provenance tracking.

### 2.3 Feature Registry + Compatibility (GAP-ECO-003 + GAP-ECO-004)

Central feature management with plugin compatibility checking.

### 2.4 Harness Selection + Routing (GAP-AGENT-008 + GAP-HADAPT-002 + GAP-HADAPT-003 + GAP-HADAPT-004)

Model selection per task, cost-based routing, and fallback chains.

### 2.5 Session Infrastructure (GAP-SESSION-002 + GAP-SESSION-004 + GAP-STATE-001 + GAP-STATE-003)

Rich session state, cost budgets, memory extraction, and session persistence.

### 2.6 JSON APIs (GAP-JSON-003 + GAP-JSON-004 + GAP-JSON-005)

Breakpoint API, session API, and event streaming.

### 2.7 Subagent Visibility (GAP-SUBOBS-002 + GAP-SUBOBS-003)

Progress tracking and per-subagent cost tracking.

### 2.8 Host Contract + Streaming (GAP-REMOTE-007 + GAP-PERF-004 + GAP-PERF-008)

Formal host contract, streaming rendering, and structured continuity.

### 2.9 Process Composition (GAP-PROC-001 + GAP-PROC-002 + GAP-PROC-004)

Process chaining, nesting, and parameter schemas.

### 2.10 Breakpoint Workflows (GAP-BRK-001 + GAP-BRK-002 + GAP-OBS-NEW-001)

Approval chains, external delegation, and webhook alerts.

### 2.11 User Experience (GAP-USER-001 + GAP-USER-006 + GAP-USER-012 + GAP-USER-017)

Operator command layer, cost tracking, plan mode, and plugin management.

### 2.12 Security + Observability (GAP-SEC-005 + GAP-OBS-004 + GAP-PROMPT-002 + GAP-PROMPT-005)

Approval postures, policy trail, capability projection, and continuity overlays.

### 2.13 Async + Cross-Run (GAP-PAR-002 + GAP-AGENT-005 + GAP-AGENT-006)

Async effect execution, cross-run communication, and state sharing.

### 2.14 Smart Routing Engine (GAP-ROUTE-001)

Centralized routing considering capabilities, cost, model, and health. Large effort -- start framework in Phase 2, complete in Phase 3.

### 2.15 MCP Integration (GAP-TOOLS-025 + GAP-MCPC-001 + GAP-MCPC-002 + GAP-MCPC-003 + GAP-MCPC-004)

MCP tool discovery/invocation, channel inbound/outbound messaging, channel permission relay, MCP server management UI.

### 2.16 Tool Infrastructure (GAP-TOOLS-014 + GAP-TOOLS-018 + GAP-TOOLS-030 + GAP-TOOLS-036)

Programmatic task CRUD, structured planning phase, effect cancellation, bash background execution.

### 2.17 Rich Rendering Foundation (GAP-UX-001 + GAP-UX-001a + GAP-UX-001c + GAP-UX-001e + GAP-UX-001f)

Rich rendering engine, effect tree visualization, permission/breakpoint approval UI, progress/status line, streaming output panels.

### 2.18 Prompt Enrichment (GAP-PROMPT-008 + GAP-PROMPT-009 + GAP-PROMPT-010)

Coding philosophy prompt section, tool preference rules, safety/reversibility prompt framework. Build on PROMPT-001 strata model.

---

## Phase 3: Advanced Capabilities (Weeks 13-24)

### 3.1 Session Compaction (GAP-PERF-002)
Multi-strategy session compaction with auto-compact triggers.

### 3.2 Sub-Harness Isolation (GAP-AGENT-001 + GAP-AGENT-003)
Isolated child runs, coordinator process pattern, fan-out/fan-in.

### 3.3 Multi-Harness Parallelism (GAP-PAR-003 + GAP-PAR-010)
Named effect groups, fork-join patterns, multi-harness concurrent dispatch.

### 3.4 Daemon Mode (GAP-REMOTE-001)
Background service with file watcher and trigger activation.

### 3.5 Observability Suite (GAP-OBS-002 through GAP-OBS-008)
Phase timeline, prompt observability, context introspection, audit export, progress summarization.

### 3.6 UX Improvements (GAP-UX-007 through GAP-UX-014)
Rich breakpoints, resume dashboard, failure triage, command discoverability, mode selection.

### 3.7 Security + Privacy (GAP-SEC-004 + GAP-SEC-007)
General sandbox toggle and privacy settings.

### 3.8 Process + Effect Advanced (GAP-PROC-003 + GAP-ROUTE-002 + GAP-ROUTE-003)
Process versioning, effect priority, and cross-run caching.

### 3.9 Subagent Advanced (GAP-SUBOBS-004 + GAP-SUBOBS-005 + GAP-HADAPT-005)
Health monitoring, dashboard drill-down, circuit breaker.

### 3.10 Session + Run (GAP-SESSION-003 + GAP-RUN-001 + GAP-RUN-003)
Session templates, run comparison, run forking.

### 3.11 Observer + Profile (GAP-OBS-NEW-002 + GAP-PROF-001)
Observer API and profile-driven auto-configuration.

### 3.12 Delegation + Templates (GAP-AGENT-004 + GAP-AGENT-007)
Built-in process templates and delegation policy layer.

### 3.13 Parallelization Polish (GAP-PAR-005 + GAP-PAR-006)
Parallel file operations and streaming parallelism.

### 3.14 Prompt Advanced (GAP-PROMPT-003 + GAP-PROMPT-004 + GAP-PROMPT-006 + GAP-PROMPT-011 + GAP-PROMPT-012)
Personality overlays, prompt inspection, instructions hook, output efficiency rules, git safety protocol prompt.

### 3.15 Tool Advanced (GAP-TOOLS-008 + GAP-TOOLS-012 + GAP-TOOLS-017 + GAP-TOOLS-023 + GAP-TOOLS-026 + GAP-TOOLS-027 + GAP-TOOLS-029 + GAP-TOOLS-031 + GAP-TOOLS-032 + GAP-TOOLS-034)
Web search, LSP integration, git worktree isolation, workflow composition, structured user interaction, skill discovery, structured output, MCP resource browsing, MCP authentication, dynamic tool discovery.

### 3.16 Rich Rendering Polish (GAP-UX-001b + GAP-UX-001d)
Structured diff rendering and message type rendering.

---

## Phase 4: Extended Platform (Weeks 25-40)

### 4.1 Remote Infrastructure (GAP-REMOTE-004 + GAP-REMOTE-006 + GAP-REMOTE-008 + GAP-REMOTE-009)
Cron triggers, MCP client, streaming protocol, host-mediated interaction.

### 4.2 State + Memory (GAP-STATE-002 + GAP-STATE-006)
Memory consolidation and session rewind.

### 4.3 Analytics + Config (GAP-OBS-006 + GAP-ECO-005 + GAP-SEC-006)
Analytics pipeline, config layering, OAuth integration.

### 4.4 Performance Polish (GAP-PERF-006 + GAP-PERF-007 + GAP-PROMPT-007)
Incremental streaming, aggressive parallelism, compression families.

### 4.5 Lifecycle Polish (GAP-BRK-003 + GAP-RUN-002)
Breakpoint analytics and run archival.

### 4.6 Tool Polish (GAP-TOOLS-020 + GAP-TOOLS-021 + GAP-TOOLS-028 + GAP-TOOLS-037)
Scheduled orchestration triggers, external event triggers, sleep/delay enhancement, fetch content processing.

---

## Phase 5: Aspirational (Weeks 41+)

### 5.1 Remote Sessions (GAP-REMOTE-003)
WebSocket-based remote session transport.

### 5.2 Session Collaboration (GAP-SESSION-005)
Session sharing and collaborative orchestration.

---

## Dependencies Graph (Critical Path)

```
Phase 1 Foundation:
  GAP-PROMPT-001 --> Phase 2: GAP-PERF-001, GAP-PERF-005
  GAP-SEC-001 --> Phase 2: GAP-SEC-002, GAP-OBS-004
  GAP-HADAPT-001 --> Phase 2: GAP-HADAPT-002, GAP-ROUTE-001
  GAP-SESSION-001 --> Phase 2: GAP-SESSION-002, GAP-STATE-003
  GAP-JSON-001 --> Phase 2: GAP-JSON-003, GAP-JSON-005
  GAP-SUBOBS-001 --> Phase 2: GAP-SUBOBS-002, GAP-SUBOBS-003

Phase 2 --> Phase 3:
  GAP-PERF-001 --> GAP-PERF-002 (compaction)
  GAP-AGENT-008 --> GAP-AGENT-001 (sub-harness)
  GAP-ROUTE-001 --> GAP-AGENT-003 (coordinator)
  GAP-PAR-002 --> GAP-PAR-003 (multi-harness)

Phase 3 --> Phase 4:
  GAP-REMOTE-007 --> GAP-REMOTE-008 --> GAP-REMOTE-003
```

## Effort Estimates

| Phase | Gaps | Weeks | Team Size |
|-------|------|-------|-----------|
| Phase 1 | 17 | 4 | 2-3 developers |
| Phase 2 | 59 | 10 | 3-4 developers |
| Phase 3 | 51 | 14 | 3-4 developers |
| Phase 4 | 18 | 16 | 2 developers |
| Phase 5 | 2 | Open-ended | As needed |
| **Total** | **147** | | |
