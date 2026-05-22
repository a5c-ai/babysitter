# GAP-REMOTE-009: Host-Mediated Interaction

| Field | Value |
|-------|-------|
| Category | remote-integration |
| Priority | Medium |
| Effort | L |
| Status | Partial |

## Description
Enable host applications (IDEs, web UIs) to mediate human interaction with babysitter, providing richer breakpoint approval, clarification, and feedback flows than CLI alone.

## Current State
Breakpoint approval exists. Host integration is narrow -- limited to CLI prompts and auto-approval rules.

## Target State
Host applications can render custom breakpoint UIs. Breakpoint context and options sent to host via HostContract. Host responses posted back as effect results. Enables rich approval workflows in IDEs and web dashboards.

## Dependencies
- [GAP-REMOTE-007](../remote-integration/GAP-REMOTE-007.md) -- host contract for interaction protocol
- [GAP-SEC-003](../security/GAP-SEC-003.md) -- typed interactions for semantic context

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint types | `packages/sdk/src/breakpoints/types.ts` |
| MCP server | `packages/sdk/src/mcp/` |

## Recommendation
Phase 4 implementation. Extend HostContract with breakpoint interaction protocol. Define breakpoint rendering contract for host UIs.
