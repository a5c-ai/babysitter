# GAP-JSON-002: JSON Effect Dispatch and Response Protocol

| Field | Value |
|-------|-------|
| Category | json-interaction |
| Priority | Critical |
| Effort | L |
| Status | Missing |

## Description
Structured JSON protocol for dispatching effects and receiving results without CLI task:post. Direct programmatic effect lifecycle management.

## Current State
Effects posted via babysitter task:post CLI with --value-inline or file path. No streaming or programmatic API.

## Target State
JSON protocol for effect dispatch: request effect, receive pending notification, post result. Streaming support for long-running effects. Programmatic lifecycle management from any language.

## Dependencies
- [GAP-JSON-001](../json-interaction/GAP-JSON-001.md) -- JSON API foundation

## Key Files
| Component | Path |
|-----------|------|
| Task definitions | `packages/sdk/src/tasks/` |
| Task serializer | `packages/sdk/src/tasks/serializer.ts` |
| CLI commands | `packages/sdk/src/cli/` |

## Recommendation
Phase 1 implementation. Define JSON effect protocol. Implement as importable API and MCP tool.
