# Gap Inventory: Category Summary

Source: `docs/harness-features-backlog/gaps/` (147 gap files across 22 category directories)

## Gaps Per Category

| # | Category | Directory | Total | Critical | High | Medium | Low | Missing | Partial |
|---|----------|-----------|-------|----------|------|--------|-----|---------|---------|
| 1 | Agent Delegation | `agent-delegation/` | 7 | 0 | 5 | 2 | 0 | 3 | 4 |
| 2 | Breakpoint Workflows | `breakpoint-workflows/` | 3 | 0 | 2 | 0 | 1 | 3 | 0 |
| 3 | Ecosystem | `ecosystem/` | 5 | 1 | 2 | 2 | 0 | 5 | 0 |
| 4 | Effect Routing | `effect-routing/` | 3 | 0 | 1 | 2 | 0 | 2 | 1 |
| 5 | Harness Adaptation | `harness-adaptation/` | 5 | 1 | 3 | 1 | 0 | 4 | 1 |
| 6 | JSON Interaction | `json-interaction/` | 5 | 2 | 3 | 0 | 0 | 4 | 1 |
| 7 | MCP Channels | `mcp-channels/` | 4 | 0 | 3 | 1 | 0 | 4 | 0 |
| 8 | Observability | `observability/` | 8 | 0 | 2 | 6 | 0 | 3 | 5 |
| 9 | Observer Integration | `observer-integration/` | 2 | 0 | 1 | 1 | 0 | 2 | 0 |
| 10 | Parallelization | `parallelization/` | 7 | 0 | 4 | 3 | 0 | 2 | 5 |
| 11 | Performance | `performance/` | 7 | 2 | 3 | 2 | 0 | 4 | 3 |
| 12 | Process Composition | `process-composition/` | 4 | 0 | 2 | 2 | 0 | 4 | 0 |
| 13 | Profile Orchestration | `profile-orchestration/` | 1 | 0 | 0 | 1 | 0 | 1 | 0 |
| 14 | Prompt Engineering | `prompt-engineering/` | 12 | 1 | 4 | 7 | 0 | 5 | 7 |
| 15 | Remote Integration | `remote-integration/` | 7 | 0 | 3 | 4 | 0 | 5 | 2 |
| 16 | Run Lifecycle | `run-lifecycle/` | 3 | 0 | 0 | 2 | 1 | 3 | 0 |
| 17 | Security | `security/` | 7 | 1 | 3 | 3 | 0 | 5 | 2 |
| 18 | Session Management | `session-management/` | 5 | 1 | 2 | 1 | 1 | 5 | 0 |
| 19 | State Continuity | `state-continuity/` | 5 | 0 | 3 | 2 | 0 | 4 | 1 |
| 20 | Subagent Observability | `subagent-observability/` | 5 | 1 | 2 | 2 | 0 | 5 | 0 |
| 21 | Tools & Capabilities | `tools-capabilities/` | 23 | 0 | 8 | 10 | 5 | 16 | 7 |
| 22 | User Experience | `user-experience/` | 19 | 0 | 11 | 8 | 0 | 8 | 11 |
| | **TOTAL** | | **147** | **10** | **67** | **62** | **8** | **95** | **52** |

## Priority Distribution

| Priority | Count | Percentage |
|----------|-------|------------|
| Critical | 10 | 6.8% |
| High | 67 | 45.6% |
| Medium | 62 | 42.2% |
| Low | 8 | 5.4% |
| **Total** | **147** | **100%** |

## Status Distribution

| Status | Count | Percentage |
|--------|-------|------------|
| Missing | 95 | 64.6% |
| Partial | 52 | 35.4% |
| **Total** | **147** | **100%** |

## Effort Distribution

| Effort | Count | Percentage |
|--------|-------|------------|
| S (Small) | 15 | 10.2% |
| M (Medium) | 68 | 46.3% |
| L (Large) | 56 | 38.1% |
| XL (Extra Large) | 8 | 5.4% |
| **Total** | **147** | **100%** |

## Critical Gaps (10)

| Gap ID | Title | Category | Effort | Status |
|--------|-------|----------|--------|--------|
| GAP-PROMPT-001 | Prompt Strata Model | prompt-engineering | L | Partial |
| GAP-SEC-001 | Governance Policy Layer | security | L | Missing |
| GAP-PERF-001 | Prompt Caching (Ephemeral) | performance | L | Missing |
| GAP-PERF-002 | Session Compaction | performance | XL | Partial |
| GAP-JSON-001 | JSON API for Run Creation | json-interaction | L | Partial |
| GAP-JSON-002 | JSON Effect Dispatch Protocol | json-interaction | L | Missing |
| GAP-SUBOBS-001 | Streaming Output Capture | subagent-observability | L | Missing |
| GAP-HADAPT-001 | Capability-Based Task Routing | harness-adaptation | L | Partial |
| GAP-SESSION-001 | Session-to-Run One-to-Many | session-management | L | Missing |
| GAP-ECO-001 | CC Plugin Compatibility Layer | ecosystem | XL | Missing |

## XL Effort Gaps (8)

| Gap ID | Title | Category | Priority |
|--------|-------|----------|----------|
| GAP-AGENT-001 | Sub-Harness Invocation with Isolation | agent-delegation | High |
| GAP-AGENT-003 | Process Orchestration with Effect Routing | agent-delegation | High |
| GAP-ECO-001 | CC Plugin Compatibility Layer | ecosystem | Critical |
| GAP-ROUTE-001 | Smart Effect Routing Engine | effect-routing | High |
| GAP-PAR-003 | Multi-Harness Parallel Dispatch | parallelization | High |
| GAP-PERF-002 | Session Compaction | performance | Critical |
| GAP-REMOTE-001 | Daemon Mode | remote-integration | High |
| GAP-REMOTE-003 | Remote Sessions (WebSocket) | remote-integration | High |

## Roadmap Milestones (from roadmap.md)

| Milestone | Gaps | Cumulative | Timeframe |
|-----------|------|------------|-----------|
| M0: Quick Wins | 5 | 5 | ~1 week |
| M1: Core Infrastructure | 11 | 16 | ~6-8 weeks |
| M2: Observability & Control | 26 | 42 | ~10-12 weeks |
| M3: Multi-Harness Orchestration | 23 | 65 | ~12-16 weeks |
| M4: MCP & External Integration | 21 | 86 | ~10-14 weeks |
| M5: Rich UI & Experience | 23 | 109 | ~10-14 weeks |
| M6: Platform & Ecosystem | 38 | 147 | ~16-20 weeks |

## Top Dependency Hubs

These gaps are depended upon by the most other gaps (from priority-matrix.md):

1. **GAP-PROMPT-001** (Prompt Strata) -- 19 downstream gaps
2. **GAP-HADAPT-001** (Capability Routing) -- 15 downstream gaps
3. **GAP-SEC-001** (Governance) -- 12 downstream gaps
4. **GAP-SESSION-001** (Session Model) -- 8 downstream gaps
5. **GAP-SUBOBS-001** (Streaming Capture) -- 7 downstream gaps
6. **GAP-JSON-001** (JSON API) -- 7 downstream gaps

## Notes

- The source directory is `docs/harness-features-backlog/gaps/` (22 subdirectories)
- Two non-gap files exist in the gaps/ tree: `TOOLS-COVERAGE-MAP.md` and `PROMPT-PHRASING-IMPLEMENTATION.md` (excluded from inventory)
- All 147 gap .md files were read and inventoried
- The README claims 24 categories in its index; however, the actual directory structure has 22 subdirectories because some categories share a directory (e.g., GAP-USER-* and GAP-UX-* both live in `user-experience/`)
