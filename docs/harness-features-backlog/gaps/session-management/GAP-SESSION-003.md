# GAP-SESSION-003: Session Templates and Presets

| Field | Value |
|-------|-------|
| Category | session-management |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Define reusable session templates with pre-configured harness, model, breakpoint rules, and process bindings.

## Current State
No session templates. Each session configured from scratch.

## Target State
Session templates stored in .a5c/session-templates/. Templates specify: default harness, model preferences, breakpoint rules, process bindings, cost budgets. Templates selectable at session creation.

## Dependencies
- [GAP-SESSION-001](../session-management/GAP-SESSION-001.md) -- session model for template application

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| Config module | `packages/sdk/src/config/` |

## Recommendation
Phase 3 implementation. Define session template schema. Store templates in project or user config. Apply at session creation.
