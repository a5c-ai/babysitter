# GAP-UX-001e: Progress and Status Line

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | S |
| Status | Missing |

## Description
A persistent status line at the bottom of the terminal showing real-time
orchestration state: current run, iteration count, pending effects, token
usage, cost, elapsed time. Updates in-place without scrolling output.

## CC Reference
CC has:
- `src/components/StatusLine.tsx` -- persistent bottom status bar showing model,
  token count, cost, session info
- `src/components/StatusNotices.tsx` -- notification banner for important state
  changes
- `src/components/AgentProgressLine.tsx` -- per-agent progress indicator
- `src/components/BashModeProgress.tsx` -- progress during bash execution
- `src/components/Spinner/SpinnerAnimationRow.tsx` -- animated spinner row
- `src/components/Spinner/SpinnerGlyph.tsx` -- spinner character animation

## Current State
No status line. CLI commands exit after output. No embedded SDK dashboard exists yet. No persistent indicators during orchestration. The babysit
skill runs commands sequentially with no progress indication between iterations.

## Target State
An Ink `StatusLine` component rendered at terminal bottom showing:
```
babysitter | run:01KNKDVE | iter 5/256 | 3 effects (1 pending) | 45k tokens | $0.12 | 3m 22s
```

Updates in real-time during `harness:call`, `harness:resume`, and embedded SDK
dashboard sessions. Shows: run ID (abbreviated), iteration count, effect
summary, token usage, estimated cost, elapsed time. Color-coded: green=healthy,
yellow=slow, red=error.

## Dependencies
- [GAP-UX-001](GAP-UX-001.md) -- Ink rendering foundation
- [GAP-SUBOBS-003](../subagent-observability/GAP-SUBOBS-003.md) -- per-effect token tracking for cost display

## Key Files
| Component | Path |
|-----------|------|
| Tokens stats CLI | `packages/sdk/src/cli/` (tokens:stats) |
| Session module | `packages/sdk/src/session/` |
| CC reference: status | `src/components/StatusLine.tsx` |
| CC reference: spinner | `src/components/Spinner/` |

## Recommendation
Phase 1-2. Smallest TUI win with highest visibility. A single Ink component
at terminal bottom. Data from `run:status --json` and `tokens:stats --json`.
Can be implemented standalone even before full Ink adoption.
