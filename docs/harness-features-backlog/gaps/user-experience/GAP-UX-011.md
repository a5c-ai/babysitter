# GAP-UX-011: Command Discoverability

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Improved command discoverability with contextual suggestions, search, and in-session guidance for operators navigating the 50+ babysitter CLI commands.

## Current State
CLI commands via --help. No in-session suggestions, no contextual command recommendations, no search across commands.

## Target State
babysitter help --search for command search. Contextual suggestions based on current run state (e.g., suggest task:post when effects are pending). Command aliases and shortcuts for common workflows.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |

## Recommendation
Phase 3 implementation. Add help --search for command search. Implement contextual suggestions based on run state.
