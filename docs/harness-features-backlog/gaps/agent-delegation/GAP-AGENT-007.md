# GAP-AGENT-007: Delegation Policy Layer

| Field | Value |
|-------|-------|
| Category | agent-delegation |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Policy-based capability restriction for delegated harness invocations. Control what tools, permissions, and capabilities sub-harnesses receive based on their role.

## Current State
No delegation policy. Worker harness invocations get full capabilities. Task execution hints (execution.permissions) are advisory, not enforced.

## Target State
Delegation policies define capability subsets per role. An explorer gets read-only tools. A planner gets analysis tools but no file writes. A verifier gets test execution but limited code modification. Enforced via agentic tool filtering.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for enforcement
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability-based routing

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| Task definitions | `packages/sdk/src/tasks/` |

## Recommendation
Phase 3 implementation. Define CapabilityProfile types (full, read-only, plan-only, verify-only). Enforce via agentic tool filtering in createAgenticToolDefinitions().
