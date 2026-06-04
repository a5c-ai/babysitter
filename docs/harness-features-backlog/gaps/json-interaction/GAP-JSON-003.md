# GAP-JSON-003: JSON Breakpoint Interaction API

| Field | Value |
|-------|-------|
| Category | json-interaction |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Programmatic breakpoint response via JSON API. Enable automated approval workflows, web-based approval UIs, and CI/CD gate integration.

## Current State
Breakpoints handled via CLI task:post or interactive CLI prompts. No programmatic approval API.

## Target State
JSON API for breakpoint interaction: list pending breakpoints, get breakpoint context, post approval/rejection with feedback. Enable web UIs and automated approval systems to participate in breakpoint workflows.

## Dependencies
- [GAP-JSON-001](../json-interaction/GAP-JSON-001.md) -- JSON API foundation
- [GAP-SEC-003](../security/GAP-SEC-003.md) -- typed interactions for breakpoint context

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint types | `packages/sdk/src/breakpoints/types.ts` |
| Breakpoint evaluator | `packages/sdk/src/breakpoints/evaluator.ts` |
| MCP server | `packages/sdk/src/mcp/` |

## Recommendation
Phase 2 implementation. Expose breakpoint interaction as JSON API via MCP tools and importable functions.
