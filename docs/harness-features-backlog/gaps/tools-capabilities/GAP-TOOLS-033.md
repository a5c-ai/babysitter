# GAP-TOOLS-033: Runtime Configuration Tool

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Low |
| Effort | S |
| Status | Missing |

## Description
Modify babysitter configuration at runtime from within orchestrated tasks.
CC's `ConfigTool` allows agents to change settings during a session.

## Current State
Babysitter has a `configure` CLI command but it's not available as an agentic
tool. Pi sessions and orchestrated tasks cannot modify compression settings,
breakpoint rules, or other configuration during execution. All configuration
is set before the run starts.

## Target State
A `config` agentic tool that can read and modify babysitter settings:
- Compression settings (toggle layers, set thresholds)
- Breakpoint auto-approval rules (add/remove rules during run)
- Model selection per-task
- Timeout overrides

Changes are scoped to the current run (not persisted globally unless explicitly
requested).

## Dependencies
- None.

## Key Files
| Component | Path |
|-----------|------|
| Config module | `packages/sdk/src/config/` |
| Compression config | `packages/sdk/src/compression/` |
| Breakpoint rules | `packages/sdk/src/breakpoints/rules.ts` |

## Recommendation
M0 (Quick Wins). Low priority -- configuration is typically set before orchestration.
