# GAP-HADAPT-001: Capability-Based Task Routing

| Field | Value |
|-------|-------|
| Category | harness-adaptation |
| Priority | Critical |
| Effort | L |
| Status | Partial |

## Description
Route tasks to harnesses based on declared capabilities (code generation, web search, file editing, etc.). Match task requirements to harness strengths.

## Current State
Harnesses declare capabilities via `HarnessCapability` enum (Programmatic, SessionBinding, StopHook, Mcp, HeadlessPrompt) and `getCapabilities()` on all adapters. Discovery reports capabilities per harness. However, task definitions do not declare required capabilities, and there is no routing engine that matches task requirements to harness capabilities. Tasks are routed to a single harness specified at run creation.

## Target State
Harnesses declare capabilities. Tasks declare required capabilities. Routing engine matches task requirements to available harnesses. Fallback to default harness when no match found.

## Dependencies
- None (foundation gap for harness adaptation)

## Key Files
| Component | Path |
|-----------|------|
| Harness adapters | `packages/sdk/src/harness/` |
| Harness discovery | `packages/sdk/src/harness/discovery.ts` |
| Task definitions | `packages/sdk/src/tasks/` |

## Recommendation
Phase 1 implementation. Define HarnessCapability declarations per adapter. Add required capabilities to task definitions. Implement matching in routing engine.
