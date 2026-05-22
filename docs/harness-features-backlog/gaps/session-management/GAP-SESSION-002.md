# GAP-SESSION-002: Session State Persistence and History

| Field | Value |
|-------|-------|
| Category | session-management |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Persist session-level state (decisions, context, preferences) across runs. Enable session history browsing and comparison.

## Current State
Session state is thin YAML frontmatter. Lost between runs.

## Target State
Rich session state persisted in dedicated session storage. Includes: accumulated decisions, user preferences, context snapshots, run summaries. Session history browsable via CLI.

## Dependencies
- [GAP-SESSION-001](../session-management/GAP-SESSION-001.md) -- session-to-run relationship

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |

## Recommendation
Phase 2 implementation. Define rich session state schema. Persist to dedicated session directory. Add session:history command.
