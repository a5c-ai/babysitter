# GAP-JSON-004: JSON Session Management API

| Field | Value |
|-------|-------|
| Category | json-interaction |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Create, resume, list, and manage sessions via JSON API. Enable web dashboards and programmatic session lifecycle control.

## Current State
Sessions managed via CLI session:init, session:resume. No JSON API.

## Target State
JSON API for session lifecycle: create, resume, list, update, delete. Session state readable and writable via API. Enable web dashboards and external tools to manage sessions programmatically.

## Dependencies
- [GAP-JSON-001](../json-interaction/GAP-JSON-001.md) -- JSON API foundation

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| MCP server | `packages/sdk/src/mcp/` |

## Recommendation
Phase 2 implementation. Expose session management as JSON API via MCP tools.
