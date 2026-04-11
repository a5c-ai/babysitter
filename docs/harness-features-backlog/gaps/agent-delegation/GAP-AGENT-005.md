# GAP-AGENT-005: Cross-Run Communication

| Field | Value |
|-------|-------|
| Category | agent-delegation |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Enable communication between related runs (parent/child, coordinator/worker) via a journal-backed message bus. Reframed from CC inter-agent messaging to babysitter cross-run/cross-effect communication.

## Current State
All communication is orchestrator-mediated: process code dispatches effects and receives results. No mechanism for a delegated harness invocation to communicate with another. Effects are request/response only.

## Target State
AGENT_MESSAGE journal event type. Message routing via effect IDs and run relationships. Subscribe/poll mechanism for delegated tasks. Enables coordination patterns like fan-out/fan-in and supervisor/worker.

## Dependencies
- [GAP-AGENT-001](../agent-delegation/GAP-AGENT-001.md) -- sub-harness invocation for related runs

**Merged**: GAP-TOOLS-015 (Inter-Agent Messaging) is covered by this gap. The original tool gap described messaging between agents -- this is the same concept as cross-run communication via journal-backed message bus, reframed for babysitter's effect model.

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| Task definitions | `packages/sdk/src/tasks/` |

## Recommendation
Phase 2 implementation. Add AGENT_MESSAGE journal event type. Implement message routing via effect IDs. Add subscribe/poll mechanism.
