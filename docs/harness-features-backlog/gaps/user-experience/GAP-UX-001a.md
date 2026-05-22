# GAP-UX-001a: Effect Tree Visualization

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Render the effect dependency tree as an interactive, hierarchical terminal UI.
Show parent/child effects, parallel groups, status indicators (pending, running,
completed, failed), and timing information. Collapsible nodes for large trees.

## CC Reference
CC has `CoordinatorAgentStatus.tsx` for coordinator tree rendering,
`Spinner/TeammateSpinnerTree.tsx` for multi-agent progress trees, and
`AgentProgressLine.tsx` for per-agent status. These render nested agent
hierarchies with live-updating status.

## Current State
`task:list` outputs a flat JSON array of effects. `run:status` shows a summary
with `pendingByKind` counts. No tree visualization. No parent/child rendering.
No live updating.

## Target State
An Ink component `EffectTree` that renders:
```
Run 01KNKDVE... [running] 3m elapsed
├── S000001 audit-existing-gaps [completed] 2m
├── S000002 breakpoint:review-audit [approved] 15s
├── S000003 identify-missing-gaps [completed] 1m
├── S000004 breakpoint:review-new-gaps [approved] 10s
├── S000005 generate-gap-files [running] 45s
│   ├── creating prompt-engineering/ [done]
│   ├── creating tools-capabilities/ [in progress]
│   └── creating session-management/ [pending]
└── S000006 verify-structure [pending]
```

Used by embedded SDK dashboard and `run:status --tree` flag.

## Dependencies
- [GAP-UX-001](GAP-UX-001.md) -- Ink rendering foundation

## Key Files
| Component | Path |
|-----------|------|
| Task list CLI | `packages/sdk/src/cli/` (task:list command) |
| Run status CLI | `packages/sdk/src/cli/` (run:status command) |
| CC reference: tree | `src/components/Spinner/TeammateSpinnerTree.tsx` |
| CC reference: agent status | `src/components/CoordinatorAgentStatus.tsx` |

## Recommendation
Build on the state cache's `effectsByInvocation` data. Parse parallel groups from
scheduler hints. Render with Ink `Box`/`Text` with ANSI color for status. Add
`--tree` flag to `run:status` and `task:list`.
