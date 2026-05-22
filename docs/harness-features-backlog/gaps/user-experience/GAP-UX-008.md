# GAP-UX-008: Resume Dashboard

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Visual run picker for resuming orchestration, with context summaries showing what each run accomplished, its current state, and what remains.

## Current State
harness:resume-run exists but no visual run picker or context summary. Operator must know the run ID to resume.

## Target State
Resume command shows available runs with status, progress percentage, last activity, and key context. Operator selects from list. Selected run restored with rich context overlay.

## Dependencies
- [GAP-PROMPT-005](../prompt-engineering/GAP-PROMPT-005.md) -- continuity overlays for resume context

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| Session management | `packages/sdk/src/session/` |
| Interaction module | `packages/sdk/src/interaction/` |

## Recommendation
Phase 3 implementation. Enhance harness:resume with run picker showing status and context summaries.
