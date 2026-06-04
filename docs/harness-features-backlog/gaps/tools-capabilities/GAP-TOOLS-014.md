# GAP-TOOLS-014: Programmatic Task CRUD Beyond CLI

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Expose full task lifecycle management (create, read, update, delete, query) as a programmatic API surface beyond the CLI commands. Process definitions and external integrations need to manipulate tasks without shelling out to `babysitter task:*` commands.

## Current State
Task management is available via CLI commands (`task:post`, `task:list`, `task:show`) and internally via the SDK's task module (`defineTask`, serializer, registry, batching). However, there is no unified programmatic API for external consumers. The MCP server exposes some task operations but not full CRUD. The JSON interaction gaps (GAP-JSON-001, GAP-JSON-002) cover API surface but not task-specific CRUD.

## Target State
A `TaskManager` API class exposing: create task from definition, query tasks by status/kind/labels, update task metadata, cancel pending tasks, bulk operations on task sets. Available as both SDK export and MCP tool surface. Consistent with the JSON effect dispatch protocol.

## Dependencies
- [GAP-JSON-001](../json-interaction/GAP-JSON-001.md) -- JSON API for programmatic access
- [GAP-JSON-002](../json-interaction/GAP-JSON-002.md) -- effect dispatch protocol for task creation

## Key Files
| Component | Path |
|-----------|------|
| Task definitions | `packages/sdk/src/tasks/` |
| Task serializer | `packages/sdk/src/tasks/serializer.ts` |
| Task registry | `packages/sdk/src/tasks/registry.ts` |
| MCP server | `packages/sdk/src/mcp/` |
| CLI task commands | `packages/sdk/src/cli/` |

## Recommendation
Phase 2 implementation. Extract a `TaskManager` class from the existing task module internals. Expose via SDK public API and MCP tool surface. Align with JSON API conventions from GAP-JSON-001.
