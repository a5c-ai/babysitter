# GAP-JSON-001: JSON API for Run Creation and Management

| Field | Value |
|-------|-------|
| Category | json-interaction |
| Priority | Critical |
| Effort | L |
| Status | Partial |

## Description
Programmatic JSON API to create, iterate, and manage runs without CLI shell invocation. Enables headless orchestration, CI/CD integration, and web UI backends.

## Current State
MCP server (`mcp:serve`) exposes `createRun` and other tools as JSON-in/JSON-out. SDK exports `createRun`, `orchestrateIteration` as importable functions. However, no standalone HTTP/REST API exists, MCP coverage is incomplete (no iterate/status/events tools), and the programmatic API is undocumented.

## Target State
Programmatic API for run lifecycle: create, iterate, status, events. JSON request/response protocol. Usable from Node.js, Python, or any HTTP client. No shell invocation required.

## Dependencies
- [GAP-REMOTE-007](../remote-integration/GAP-REMOTE-007.md) -- host contract layer as API surface (note: co-located in M1 per roadmap, not a hard blocker; roadmap lists no blocking dependency for JSON-001)

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| MCP server | `packages/sdk/src/mcp/` |
| Runtime | `packages/sdk/src/runtime/` |

## Recommendation
Phase 1 implementation. Extract CLI command logic into importable API functions. Expose via both direct import and HTTP/MCP endpoints.
