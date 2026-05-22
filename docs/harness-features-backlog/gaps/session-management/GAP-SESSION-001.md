# GAP-SESSION-001: Session-to-Run One-to-Many Relationship

| Field | Value |
|-------|-------|
| Category | session-management |
| Priority | Critical |
| Effort | L |
| Status | Missing |

## Description
Model sessions as containers for multiple runs. A session represents a user intent; runs are individual orchestration attempts. Enable session continuity across runs.

## Current State
Session binds to single runId via YAML frontmatter. No multi-run sessions.

## Target State
Sessions contain multiple runs. Session state persists across runs. Session history browsable. Runs within a session share context and accumulated knowledge.

## Dependencies
- None (foundation gap for session management)

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| Run directory | `.a5c/runs/` |

## Recommendation
Phase 1 implementation. Extend session schema to track multiple runIds. Add session:list-runs command. Preserve session context across run boundaries.
