# GAP-OBS-NEW-002: Embedded SDK Dashboard API for External Dashboards

| Field | Value |
|-------|-------|
| Category | observer-integration |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
REST/GraphQL API exposing run state, events, and metrics. Enable custom dashboards and integrations.

## Current State
No embedded SDK dashboard exists yet. No API layer.

## Target State
REST API exposing: run listing and status, journal events, task details, metrics and statistics. API enables custom dashboards, Grafana integration, and external monitoring tools.

## Dependencies
- [GAP-JSON-001](../json-interaction/GAP-JSON-001.md) -- JSON API foundation

## Key Files
| Component | Path |
|-----------|------|
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| MCP server | `packages/sdk/src/mcp/` |

## Recommendation
Phase 3 implementation. Add REST API to embedded SDK dashboard or MCP server. Expose run state, events, and metrics endpoints.
