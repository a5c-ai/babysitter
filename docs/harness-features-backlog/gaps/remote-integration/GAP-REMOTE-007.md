# GAP-REMOTE-007: Host Contract Layer

| Field | Value |
|-------|-------|
| Category | remote-integration |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Formal HostContract interface that external systems (IDEs, CI/CD, web UIs) can program against for babysitter integration, replacing ad-hoc CLI command composition.

## Current State
Harness adapters compose CLI commands ad-hoc based on each harness flag mapping (HARNESS_CLI_MAP). No formal contract that a host can program against.

## Target State
HostContract interface with startRun, getStatus, postEffect, subscribe methods. Implementation over existing CLI commands. Exposed via MCP server and HTTP.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| MCP server | `packages/sdk/src/mcp/` |
| Adapter registry | `packages/sdk/src/harness/registry.ts` |

## Recommendation
M1 (Foundation) implementation. Define HostContract interface. Implement over existing CLI. Expose via MCP and HTTP.
