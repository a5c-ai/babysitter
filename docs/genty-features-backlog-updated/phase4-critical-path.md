# Phase 4: Critical Path Analysis

## Critical Path (Longest Chain of Unsatisfied Dependencies)

The critical path is 6 nodes deep, running through the parallelization and agent-delegation domains. This is the chain that, if any node is delayed, delays the maximum number of downstream gaps.

```
GAP-SUBOBS-001 (Critical, IN_PROGRESS, M)
  Streaming Output Capture from Invoked Harnesses
    |
    v
GAP-SUBOBS-002 (High, IN_PROGRESS, M)
  Subagent Progress Tracking
    |
    v
GAP-PAR-003 (High, IN_PROGRESS, L)              [also needs GAP-PAR-001]
  Multi-Harness Parallel Dispatch
    |
    v
GAP-AGENT-003 (High, IN_PROGRESS, L)            [also needs GAP-AGENT-001]
  Process Orchestration with Effect Routing
    |
    v
GAP-AGENT-004 (Medium, IN_PROGRESS, M)          [also needs GAP-PROC-001]
  Built-in Process Templates
    |
    v
GAP-SESSION-003 (Medium, OPEN, M)
  Session Templates and Presets
```

### Why this is the critical path

**Node 1 -- GAP-SUBOBS-001: Streaming Output Capture** (Critical priority, M effort)
- The foundation of all subagent observability. Without streaming output from harness processes, progress tracking, health monitoring, and the entire dashboard drill-down chain are blocked.
- Currently IN_PROGRESS: Pi adapter streams via subscribe(), but CLI harnesses capture output only after process exit.
- Remaining work: Pipe stdout/stderr from child processes in real-time across all harness types.
- Unblocks: GAP-SUBOBS-002, GAP-SUBOBS-004, GAP-SUBOBS-005, GAP-PERF-004, GAP-UX-001f

**Node 2 -- GAP-SUBOBS-002: Subagent Progress Tracking** (High priority, M effort)
- Extracts progress signals (percentage, step, ETA) from streaming output. Required by the coordinator pattern to know worker status.
- Currently IN_PROGRESS: BackgroundEffectStatus tracks lifecycle but not granular progress.
- Remaining work: Progress percentage extraction, ETA estimation, progress bar support.
- Unblocks: GAP-PAR-003, GAP-SUBOBS-005, GAP-UX-001e (via implicit dependency)

**Node 3 -- GAP-PAR-003: Multi-Harness Parallel Dispatch** (High priority, L effort)
- Named effect groups with persistent identity across iterations. Multiple harnesses working concurrently on related tasks.
- Currently IN_PROGRESS: Execution waves and named groups exist, but cross-iteration team coordination is absent.
- Remaining work: Coordinator process pattern, team management across iterations, inter-effect communication during execution.
- Unblocks: GAP-PAR-010, GAP-AGENT-003

**Node 4 -- GAP-AGENT-003: Process Orchestration with Effect Routing** (High priority, L effort)
- The coordinator process template: dynamically routes work to different harnesses, aggregates progress from workers.
- Currently IN_PROGRESS: capabilityRouter.ts exists but is not consumed in orchestrateIteration.
- Remaining work: Wire capability routing into orchestration loop, build coordinator process template.
- Unblocks: GAP-AGENT-004

**Node 5 -- GAP-AGENT-004: Built-in Process Templates** (Medium priority, M effort)
- Pre-configured templates (explorer, planner, verifier, reviewer) with harness/model/capability profiles.
- Currently IN_PROGRESS: Methodology definitions are rich but not packaged as ready-to-use templates.
- Remaining work: Package methodologies with specific harness+capability configurations.
- Unblocks: GAP-SESSION-003

**Node 6 -- GAP-SESSION-003: Session Templates and Presets** (Medium priority, M effort)
- Session templates stored in `.a5c/session-templates/` specifying default harness, model, breakpoints, process bindings, budgets.
- Currently OPEN: No session template system exists.

### Total effort on critical path: M + M + L + L + M + M = approximately XL-XXL

---

## Alternative Near-Critical Paths

### Path B: Streaming to UI (5 deep)

```
GAP-SUBOBS-001 -> GAP-PERF-004 -> GAP-PAR-006 (terminal)
GAP-SUBOBS-001 -> GAP-UX-001f -> (needs GAP-UX-001 respec first)
```

This path is blocked on GAP-UX-001 (NEEDS_RESPEC), making it stalled rather than critical.

### Path C: Memory Pipeline (5 deep)

```
GAP-AGENT-001 -> GAP-AGENT-006 -> GAP-STATE-001 -> GAP-STATE-002 (terminal)
```

Shorter but feeds into important long-term memory capabilities.

### Path D: Run Lifecycle (4 deep)

```
GAP-PROC-003 -> GAP-STATE-006 -> GAP-RUN-003 (terminal)
```

Blocked by process versioning which has no upstream dependencies -- can start immediately.

---

## Foundation Gaps (Most Downstream Dependents)

These gaps unblock the most downstream work and should be prioritized:

| Gap | Status | Priority | Direct Dependents | Total Downstream |
|-----|--------|----------|-------------------|------------------|
| GAP-SUBOBS-001 | IN_PROGRESS | Critical | 7 | 22 |
| GAP-PAR-001 | IN_PROGRESS | High | 6 | 16 |
| GAP-ECO-002 | OPEN | High | 5 | 12 |
| GAP-REMOTE-007 | IN_PROGRESS | High | 3 | 5 |
| GAP-UX-001 | NEEDS_RESPEC | High | 5 | 9 |
| GAP-AGENT-001 | IN_PROGRESS | High | 5 | 15 |
| GAP-SUBOBS-002 | IN_PROGRESS | High | 3 | 10 |
| GAP-PROC-001 | IN_PROGRESS | High | 4 | 8 |

### What "Total Downstream" means
Direct dependents are gaps that directly list this gap as a dependency. Total downstream is the transitive closure -- all gaps that are blocked (directly or indirectly) when this gap is incomplete.

### Key insight
**GAP-SUBOBS-001** (Streaming Output Capture) is the single most impactful foundation gap, with 22 total downstream dependents spanning subagent-observability, parallelization, performance, and user-experience domains. It should be the top priority for unblocking maximum downstream work.

**GAP-ECO-002** (CC Marketplace Protocol Support) is the highest-impact OPEN gap (not yet started), unblocking the entire ecosystem track including plugin trust, auto-update, validation, analytics, and plugin management integration.
