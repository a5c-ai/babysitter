# Phase 6: Milestone Summary

Executive summary of the M0-M5 roadmap with effort distribution, risk profile, and success criteria.

---

## Milestone Overview

```
M0  [=====]      Quick Wins + Foundation         16 gaps   ~3M effort    0 blockers
M1  [========]   Critical Path                    7 gaps   ~L-XL effort  M0 required
M2  [==========] Parallel Tracks                 16 gaps   ~XL effort    M0 required
M3  [==========] Integration                     11 gaps   ~XL effort    M1+M2 required
M4  [==========] Polish and UX                   12 gaps   ~XL effort    M0 respec + M1
M5  [===========] Ecosystem + Long-Tail          16 gaps   ~XL-XXL       M2-M4 required
```

---

## M0: Quick Wins and Foundation

| Attribute | Value |
|-----------|-------|
| **Gap count** | 16 actionable + 1 respec |
| **Effort** | ~3 M equivalent (11 S items + 2 M items + 1 respec session) |
| **Risk profile** | 14 Low, 2 Medium, 1 High (the respec) |
| **Parallel capacity** | All 11 quick wins can run in parallel |
| **Dependencies** | None -- everything can start immediately |

**Success criteria:**
- CLI harness streaming outputs in real-time (GAP-SUBOBS-001)
- Prompt caching reduces API costs measurably (GAP-PERF-001)
- Long-term memories appear in new run prompts (GAP-STATE-001)
- Plugin blocklist and trust levels operational (GAP-ECO-003, GAP-SEC-002)
- UX-001 has a written respec targeting tula-ui or observer-dashboard
- All 8 parallel track foundations initiated

**Key risk:** UX-001 respec decision. If deferred, the entire Track 6 (13 gaps in M4) remains blocked.

---

## M1: Critical Path Items

| Attribute | Value |
|-----------|-------|
| **Gap count** | 7 |
| **Effort** | ~L-XL equivalent (2 S + 4 M + 1 L) |
| **Risk profile** | 2 Medium, 4 High, 1 Critical (PERF-002) |
| **Parallel capacity** | M1a and M1b can run in parallel. M1c depends on both. M1d is independent. |
| **Dependencies** | M0: SUBOBS-001, AGENT-001, PROMPT-006 |

**Success criteria:**
- Subagent progress displays percentage and ETA (GAP-SUBOBS-002)
- Effects execute concurrently in orchestration loop (GAP-PAR-001)
- Multi-harness dispatch with team coordination (GAP-PAR-003)
- Session compaction preserves context across strategies (GAP-PERF-002)

**Key risk:** PAR-001 (concurrent execution) requires core loop changes. Feature-flag the concurrent path.

---

## M2: Parallel Track Items

| Attribute | Value |
|-----------|-------|
| **Gap count** | 16 |
| **Effort** | ~XL equivalent (8 S + 5 M + 2 L) |
| **Risk profile** | 10 Low, 4 Medium, 2 High (ECO-002, REMOTE-003) |
| **Parallel capacity** | 5 sub-groups (M2a-M2e) run independently |
| **Dependencies** | M0 track foundations |

**Success criteria:**
- CC marketplace protocol adapter works (GAP-ECO-002)
- Remote sessions connect and deliver events (GAP-REMOTE-003)
- Prompt plan inspection and context introspection commands available (GAP-OBS-003, GAP-OBS-005)
- Process versioning detects mismatches on resume (GAP-PROC-003)
- Built-in templates packaged with harness profiles (GAP-AGENT-004)

**Key risk:** ECO-002 depends on CC marketplace API stability. Abstract behind PluginSource interface.

---

## M3: Integration Milestones

| Attribute | Value |
|-----------|-------|
| **Gap count** | 11 |
| **Effort** | ~XL equivalent (3 S + 4 M + 3 L) |
| **Risk profile** | 2 Low, 5 Medium, 4 High |
| **Parallel capacity** | M3a-M3e have different dependency chains and can partially overlap |
| **Dependencies** | M1 (critical path complete) + M2 (tracks progressed) |

**Success criteria:**
- Process orchestration dynamically routes to harnesses (GAP-AGENT-003)
- Cross-run messaging delivers between active runs (GAP-AGENT-005)
- Git worktree isolation prevents conflicts in parallel code tasks (GAP-TOOLS-017)
- CC plugin compatibility layer loads CC plugins (GAP-ECO-001)
- Context compression uses semantic families (GAP-PROMPT-007)

**Key risk:** AGENT-003 restructures the core orchestration loop. Spike and feature-flag.

---

## M4: Polish and UX

| Attribute | Value |
|-----------|-------|
| **Gap count** | 12 |
| **Effort** | ~XL equivalent (2 S + 4 M + 3 L + 3 additional) |
| **Risk profile** | 4 Low, 4 Medium, 4 High (UX respec chain) |
| **Parallel capacity** | M4a must complete before M4b. M4c is partially independent. |
| **Dependencies** | M0 (UX-001 respec), M1 (streaming data), M3 (summarization for triage) |

**Success criteria:**
- Rendering foundation operational on chosen platform (GAP-UX-001)
- Effect tree and streaming output panels render live data (GAP-UX-001a, GAP-UX-001f)
- Breakpoint approval shows risk context and recommendations (GAP-UX-001c)
- Resume dashboard with run picker works (GAP-UX-008)
- ctx.workflow() intrinsic supports conditional branching (GAP-TOOLS-023)

**Key risk:** If UX-001 respec is not completed in M0, all of M4 shifts right.

---

## M5: Ecosystem and Long-Tail

| Attribute | Value |
|-----------|-------|
| **Gap count** | 16 |
| **Effort** | ~XL-XXL equivalent (2 S + 5 M + 9 L) |
| **Risk profile** | 5 Low, 3 Medium, 8 High |
| **Parallel capacity** | M5a-M5d have limited interdependencies |
| **Dependencies** | Various from M2-M4 |

**Success criteria:**
- OAuth and MCP authentication work end-to-end (GAP-SEC-006, GAP-TOOLS-032)
- Session rewind restores from arbitrary journal point (GAP-STATE-006)
- Fork-join process pattern executes parallel branches (GAP-PAR-010)
- LSP diagnostics feed into task routing (GAP-TOOLS-012)
- All 78 non-CLOSED gaps addressed

**Key risk:** Multiple L-effort high-risk items. Some may be deferred to future cycles if scope exceeds capacity.

---

## Effort Distribution

```
            S     M     L     Total Gaps
M0          14    2     0     16 (+respec)
M1          3     3     1     7
M2          13    1     2     16
M3          0     7     4     11
M4          4     3     5     12
M5          2     6     8     16
---         --    --    --    --
Total       36    22    20    78
```

S = 1-2 days | M = 3-5 days | L = 1-2 weeks

---

## Status Category Distribution

| Status | Count | Milestone Distribution |
|--------|-------|----------------------|
| IN_PROGRESS | 49 | M0: 12, M1: 6, M2: 10, M3: 7, M4: 8, M5: 6 |
| OPEN | 22 | M0: 0, M1: 0, M2: 4, M3: 3, M4: 1, M5: 14 |
| NEEDS_RESPEC | 7 | M0: 1 (respec only), M4: 6 |

---

## Priority Distribution

| Priority | Count | Handling |
|----------|-------|---------|
| Critical | 4 | All in M0-M1 |
| High | 30 | Spread across M0-M3, concentrated in M0 quick wins |
| Medium | 37 | Spread across M2-M5 |
| Low | 7 | Mostly M5 long-tail |

---

## Cross-Milestone Dependencies (Critical Chains)

```
M0: SUBOBS-001 -----> M1: SUBOBS-002 + PAR-001 -----> M3: PAR-003 + AGENT-003
M0: PROMPT-006 -----> M1: PERF-002 -----> M3: PROMPT-007
M0: REMOTE-007 -----> M2: REMOTE-003 -----> M5: SESSION-005
M0: ECO-003 -----> M2: ECO-002 -----> M3: ECO-001
M0: UX-001 respec --> M4: UX-001 impl --> M4: UX-001a/b/d/e/f
M0: PROC-001 -----> M2: PROC-003 -----> M5: STATE-006 + RUN-003
```

---

## Recommended Cadence

- **M0:** 2-3 week sprint (many parallel S items)
- **M1:** 3-4 week sprint (focused critical path work)
- **M2:** 4-6 week sprint (5 parallel streams, longest is ECO-002 at L)
- **M3:** 4-6 week sprint (integration work, depends on M1+M2 completion)
- **M4:** 4-6 week sprint (UX work, can partially overlap with M3)
- **M5:** 6-8 week sprint (long-tail, can overlap with late M4)

**Total estimated duration:** 6-8 months with 2-3 parallel contributors.
