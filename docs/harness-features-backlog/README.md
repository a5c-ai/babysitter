# Harness Features Backlog: Gap Analysis (Restructured)

## Executive Summary

This gap analysis identifies feature gaps in the **Babysitter orchestration platform** from the babysitter-native perspective. All gaps are framed around what the orchestration platform needs -- not what any specific host harness (like Claude Code) provides.

This restructured version replaces the original numbered category files with a one-file-per-gap directory structure under `gaps/`.

### Restructuring Summary

| Action | Count | Description |
|--------|-------|-------------|
| **Kept** | 40 | Original gaps retained with babysitter framing |
| **Reframed** | 37 | Good concepts reframed for babysitter orchestration model (incl. tools-capabilities) |
| **New** | 50 | Babysitter-native gaps not in original analysis |
| **Removed** | 52 | CC-centric gaps (host harness concerns, not orchestrator) |
| **Merged** | 18 | Duplicates consolidated (incl. GAP-TOOLS-013 into GAP-AGENT-001, GAP-TOOLS-015 into GAP-AGENT-005) |

### Key Statistics

| Metric | Value |
|--------|-------|
| **Total Gaps** | 147 |
| **Critical** | 10 |
| **High** | 67 |
| **Medium** | 62 |
| **Low** | 8 |
| **Missing** | 95 |
| **Partial** | 52 |

### Effort Distribution

| Effort | Count |
|--------|-------|
| S (Small) | 15 |
| M (Medium) | 68 |
| L (Large) | 56 |
| XL (Extra Large) | 8 |

## Category Index

| Category | Dir | Gaps | Focus |
|----------|-----|------|-------|
| [Prompt Engineering](./gaps/prompt-engineering/) | `prompt-engineering/` | 12 | Prompt strata, caching, personality, inspection, coding philosophy, tool preferences, safety, output efficiency, git safety |
| [Performance](./gaps/performance/) | `performance/` | 7 | Caching, compaction, streaming, continuity |
| [Parallelization](./gaps/parallelization/) | `parallelization/` | 7 | Concurrent effects, async execution, strategies |
| [Observability](./gaps/observability/) | `observability/` | 8 | Health, timeline, audit, analytics |
| [Security](./gaps/security/) | `security/` | 7 | Governance, trust, permissions, privacy |
| [Ecosystem](./gaps/ecosystem/) | `ecosystem/` | 5 | CC plugin compatibility, marketplace protocol, trust/blocklist, auto-update, validation |
| [Agent Delegation](./gaps/agent-delegation/) | `agent-delegation/` | 7 | Sub-harness, communication, state sharing |
| [State Continuity](./gaps/state-continuity/) | `state-continuity/` | 5 | Memory, session state, health model |
| [Remote Integration](./gaps/remote-integration/) | `remote-integration/` | 7 | Daemon, remote, scheduling, contracts |
| [JSON Interaction](./gaps/json-interaction/) | `json-interaction/` | 5 | **NEW**: Programmatic API, effect protocol, streaming |
| [Subagent Observability](./gaps/subagent-observability/) | `subagent-observability/` | 5 | **NEW**: Streaming capture, progress, cost tracking |
| [Harness Adaptation](./gaps/harness-adaptation/) | `harness-adaptation/` | 5 | **NEW**: Capability routing, model selection, fallback |
| [Session Management](./gaps/session-management/) | `session-management/` | 5 | **NEW**: Multi-run sessions, templates, budgets |
| [MCP Channels](./gaps/mcp-channels/) | `mcp-channels/` | 4 | **NEW**: Channel messaging, permissions relay, MCP server management |
| [User Experience](./gaps/user-experience/) | `user-experience/` | 19 | Orchestrator UX: rich rendering (Ink/React foundation + 6 sub-gaps), interaction patterns, status, breakpoints |
| [Tools & Capabilities](./gaps/tools-capabilities/) | `tools-capabilities/` | 23 | Orchestrator-delegated capabilities: tool parity (grep/bash/fetch enhancements), MCP, worktrees, planning, scheduling, skills |
| [Process Composition](./gaps/process-composition/) | `process-composition/` | 4 | **NEW**: Chaining, nesting, versioning, schemas |
| [Effect Routing](./gaps/effect-routing/) | `effect-routing/` | 3 | **NEW**: Smart routing, priority, caching |
| [Breakpoint Workflows](./gaps/breakpoint-workflows/) | `breakpoint-workflows/` | 3 | **NEW**: Approval chains, delegation, analytics |
| [Run Lifecycle](./gaps/run-lifecycle/) | `run-lifecycle/` | 3 | **NEW**: Comparison, archival, forking |
| [Observer Integration](./gaps/observer-integration/) | `observer-integration/` | 2 | **NEW**: Webhooks, external dashboard API |
| [Profile Orchestration](./gaps/profile-orchestration/) | `profile-orchestration/` | 1 | **NEW**: Auto-configure from user profile |

## Critical Gaps (10)

1. **[GAP-PROMPT-001](./gaps/prompt-engineering/GAP-PROMPT-001.md)** -- Prompt Strata Model
2. **[GAP-SEC-001](./gaps/security/GAP-SEC-001.md)** -- Governance Policy Layer
3. **[GAP-PERF-001](./gaps/performance/GAP-PERF-001.md)** -- Prompt Caching (Ephemeral)
4. **[GAP-PERF-002](./gaps/performance/GAP-PERF-002.md)** -- Session Compaction
5. **[GAP-JSON-001](./gaps/json-interaction/GAP-JSON-001.md)** -- JSON API for Run Creation
6. **[GAP-JSON-002](./gaps/json-interaction/GAP-JSON-002.md)** -- JSON Effect Dispatch Protocol
7. **[GAP-SUBOBS-001](./gaps/subagent-observability/GAP-SUBOBS-001.md)** -- Streaming Output Capture
8. **[GAP-HADAPT-001](./gaps/harness-adaptation/GAP-HADAPT-001.md)** -- Capability-Based Task Routing
9. **[GAP-SESSION-001](./gaps/session-management/GAP-SESSION-001.md)** -- Session-to-Run One-to-Many
10. **[GAP-ECO-001](./gaps/ecosystem/GAP-ECO-001.md)** -- CC Plugin Compatibility Layer

## What Was Removed (and Why)

The following categories of gaps were removed because they are host harness concerns, not orchestration platform concerns:

- ~~**Rich TUI/Ink/React rendering**~~ -- **RESTORED** as [GAP-UX-001](./gaps/user-experience/GAP-UX-001.md): babysitter's own observer dashboard, process visualization, and CLI output need rich rendering (not a host harness feature)
- **Voice mode / speech input** -- host harness feature
- **Vim mode / custom keybindings** -- host harness feature
- **Companion/buddy mode** -- host harness delight feature
- **Theme/output styling** -- host harness feature
- **Session teleport** -- CC-specific implementation
- **CC-specific tool implementations** (PowerShell, REPL, Notebook, Todo, Brief, Monitor)
- **CC-specific team/agent tools** (TeamCreate, TeamDelete, SendMessage as tool)
- **Desktop/mobile handoff, Chrome extension, IDE bridge** -- host harness features
- **Parity items** -- tools at or near parity (file R/W, edit, glob, notebook); partial-parity tools now have explicit enhancement gaps (GAP-TOOLS-035 through 038)

## Related Documents

| Document | Description |
|----------|-------------|
| [Roadmap](./roadmap.md) | **START HERE** -- 7 milestones with dependency ordering and critical path |
| [Priority Matrix](./priority-matrix.md) | All gaps ranked by impact-to-effort ratio |
| [Implementation Recommendations](./implementation-recommendations.md) | Phased implementation plan |
| [Prompt Phrasing Analysis](./11-prompt-phrasing-analysis.md) | CC prompt text to adopt |
| [Prompt Phrasing Implementation](./gaps/prompt-engineering/PROMPT-PHRASING-IMPLEMENTATION.md) | Copy-paste-ready prompt sections |
| [Tools Coverage Map](./gaps/tools-capabilities/TOOLS-COVERAGE-MAP.md) | CC (42 tools) vs babysitter (16 tools) |
| [Harness Strengths](./harness-strengths.md) | Where babysitter excels |
| [Glossary & References](./glossary-references.md) | Terms and file paths |

## How to Use This Backlog

1. Start with the [Roadmap](./roadmap.md) for milestone-based execution order
2. Check the [Priority Matrix](./priority-matrix.md) for impact-to-effort ranking
3. Browse category directories under `gaps/` for detailed analysis
4. Each gap file is self-contained with description, current/target state, dependencies, and recommendations
