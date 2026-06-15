# GAP-UX-014: Operator Mode Selection

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
In-session mode selection allowing operators to switch between orchestration modes (plan, fast, interactive, autonomous) without restarting the run.

## Current State
Modes implied by wrapper choice (`agent-platform plan`, `agent-platform yolo`, `agent-platform forever`). Not selectable in-session. Changing mode requires starting a new run.

## Target State
Operator can switch modes mid-run via breakpoint interaction or session command. Mode changes affect prompt personality, breakpoint frequency, and parallelism aggressiveness.

## Dependencies
- [GAP-PROMPT-003](../prompt-engineering/GAP-PROMPT-003.md) -- runtime personality overlays for mode-specific behavior

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/babysitter-sdk/src/session/` |
| Prompts module | `packages/babysitter-sdk/src/prompts/` |

## Recommendation
Phase 3 implementation. Allow mode changes via session state update. Mode affects prompt, breakpoint, and parallelism configuration.
