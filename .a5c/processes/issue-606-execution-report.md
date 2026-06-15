# Issue 606 Execution Report

Date: 2026-05-30
Branch: `plan/issue-606`
Process: `.a5c/processes/issue-606-tasks-mux-integration-tests.mjs`

## Request

Implement the plan in PR #677 for issue #606.

## Readiness Result

The process plan requires a dependency-readiness gate before test authoring. That gate is not satisfied on this branch.

| Issue | State | Readiness impact |
| --- | --- | --- |
| #602 | OPEN | SDK external agent discovery is not ready. |
| #603 | CLOSED | Superseded task-shape work is complete, but #635 replaces the public routing contract. |
| #604 | CLOSED | Direct external agent effect routing work is closed, but the current issue now targets tasks-mux routing. |
| #605 | OPEN | Process creation prompt support for external agents is not ready. |
| #614 | CLOSED | Plugin-mode external dispatch work is closed, but the issue now targets tasks-mux routing. |
| #616 | OPEN | Host tool discovery is not ready. |
| #617 | OPEN | Effect cancellation support is not ready. |
| #618 | OPEN | Plugin subprocess support is not ready. |
| #619 | OPEN | Host identity prompt support is not ready. |
| #630 | OPEN | `ResponderType` and tasks-mux routing are not ready on this branch. |
| #631 | OPEN | `AgentMuxResponderBackend` is not ready. |
| #632 | OPEN | `ExternalTrackerBackend` is not ready on this branch. |
| #633 | OPEN | SDK and agent-platform routing through tasks-mux is not ready. |
| #635 | OPEN | SDK `responderType`, `adapter`, and `fallbackType` task-definition API is not ready. |

## Code Inventory

Searches on this branch found no implementation surface for:

- `ResponderType`
- `responderType`
- `fallbackType`
- `AgentMuxResponderBackend`
- `ExternalTrackerBackend`
- `discoverExternalAgents`
- `externalDispatch`

The current `tasks-mux` package still exposes human breakpoint-oriented responders and backends. The SDK `TaskDef` remains permissive enough to carry arbitrary fields, but it does not yet define or validate the issue #606 routing contract. Agent-platform `resolveEffect` still resolves `agent` effects through the selected harness path instead of tasks-mux routing.

## Test Matrix Status

| Planned coverage | Target file | Status |
| --- | --- | --- |
| ResponderType routing: internal, human, agent, tracker, auto | `packages/tasks-mux/src/__tests__/responder-routing.test.ts` | Blocked by #630. |
| Agent-mux responder backend | `packages/tasks-mux/src/__tests__/adapters-responder-backend.test.ts` | Blocked by #631. |
| External tracker backend | `packages/tasks-mux/src/__tests__/external-tracker-backend.test.ts` | Blocked by #632. |
| tasks-mux harness integration | `packages/tasks-mux/src/__tests__/harness-integration.test.ts` | Blocked by #630 and #633. |
| SDK external agent discovery | `packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts` | Blocked by #602. |
| SDK responder task shape | `packages/sdk/src/tasks/__tests__/externalAgent.test.ts` | Blocked by #635. |
| Runtime task metadata | `packages/sdk/src/runtime/intrinsics/__tests__/task.test.ts` | Blocked by #635. |
| Plugin external routing | `packages/sdk/src/harness/hooks/__tests__/pluginExternalRouting.test.ts` | Blocked by #633 and follow-up plugin routing surface. |
| Agent-platform tasks-mux routing | `packages/genty/platform/src/harness/internal/createRun/orchestration/__tests__/tasksMuxRouting.test.ts` | Blocked by #633. |
| External task validation | `packages/genty/platform/src/harness/internal/createRun/planProcess/__tests__/externalTaskValidation.test.ts` | Blocked by #605 and #635. |
| Mocked e2e external agent dispatch | `packages/genty/platform/src/harness/__tests__/e2e-tasks-mux-external-agent.test.ts` | Blocked by #630, #631, #633, and #635. |
| Live-stack external agent scenario contract | `packages/adapters/cli/tests/live-stack/tasks-mux-external-agent-scenario.test.ts` and `.github/workflows/live-stack.yml` | Blocked by #633 and live-stack availability gates. |

## Decision

No tests were authored in this execution because doing so would either:

1. create failing tests against missing production APIs from open dependency issues, or
2. add passing placeholder tests that do not validate issue #606 behavior, or
3. implement foundational production behavior explicitly reserved for the dependency issues.

The correct next action is to resume this process after #630, #631, #632, #633, #635, #602, and #605 land on the branch or are merged into its base.

## Verification

No package-level gates were run because the process stopped at dependency readiness before file edits to test suites.
