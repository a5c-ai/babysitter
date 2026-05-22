---
title: Implementation Roadmap
description: Iterative rollout plan for the rebuilt no-model and model-backed testing strategy.
last_updated: 2026-05-08
---

# Implementation Roadmap

This roadmap turns the strategy into implementation slices. Each slice must land with docs, package scripts or workflow wiring, and proof artifacts before the next slice depends on it. Status reflects the current unified `Publish` workflow, where live-stack scenario selection is owned by GitHub Actions rather than test code.

## Rollout Slices

| Slice | Status | Primary owner | Lane | Exit criteria | Pipeline target |
| --- | --- | --- | --- | --- | --- |
| 0. Inventory and naming | Partly current, needs reference cleanup as workflows evolve | CI maintainers | No-model | [Current command inventory](./current-test-command-inventory.md) maps every current test-like command to package, lane, scope, owner, artifact name, and pipeline placement | Documentation and `publish.yml` comments/artifact names |
| 1. Mock and fixture contracts | Next no-model implementation slice | Runtime maintainers | No-model | Mock Codex, Claude Code, agent-core, transport-mux, and gateway transcripts are shared by unit, integration, and UI tests | PR/push CI |
| 2. SDK harness/plugin setup smoke | Planned | SDK and harness maintainers | No-model | `harness:install --dry-run`, `harness:install-plugin --dry-run`, and plugin discovery produce JSON evidence without claiming babysitter-agent runtime coverage | PR/push CI |
| 3. Mux integration coverage | Partly covered by current mux validation; transport-mux fixtures remain the largest gap | Agent-mux maintainers | No-model | Transport-mux route/runtime/env/launch-plan coverage, agent-mux gateway, adapters, and WebUI run against compatible fixture sessions | PR/push CI and `publish.yml` validation |
| 4. Minimal live harness smoke | Implemented as a `publish.yml` scenario/OS/install-mode matrix smoke, still needs quarantine history and richer assertions | Harness maintainers | Model-backed | The currently valid Claude Code, Pi, and babysitter-agent-through-agent-mux live-stack scenarios run from GitHub Actions matrix entries in `babysitter-plugin` and `vanilla` modes, with Codex/Gemini and Windows lanes added only after their live install/launch prerequisites are green and upload redacted artifacts | `publish.yml` live_stack_e2e |
| 5. Split live E2E smokes | Partly implemented; deeper path-specific jobs remain | Runtime and mux maintainers | Model-backed | Agent-mux plugin/session smoke uses pipeline-selected plugin preconditions; transport-mux bridge smoke proves agent-core and external-harness proxy paths; babysitter-agent runtime smoke uses runtime path with no installer steps | `publish.yml` staging/release preflight |
| 6. Coverage aggregation | Partly implemented for live-stack scenario JSON only | CI maintainers | Both | Package coverage, Playwright traces, and live-run summaries merge into one workflow summary | PR/push for no-model, `publish.yml` for live |



## Live Install-Mode Axis

`publish.yml` owns the live-stack `install_mode` matrix dimension:

| Install mode | Setup path | Launch path | Required proof |
| --- | --- | --- | --- |
| `babysitter-plugin` | Generate plugin packages, install the target agent with `amux install`, install the local Babysitter SDK, then install the Babysitter plugin for the target harness | `amux launch <agent> <provider>` with a `/babysitter:call ...` prompt | Agent-mux IDs, Babysitter run/effect IDs, native hook evidence, hooks-mux event evidence, transport trace, redacted provider trace |
| `vanilla` | Install the target agent with `amux install` only | `amux launch <agent> <provider>` with a normal non-Babysitter prompt | Agent-mux IDs, session ID, transport trace, redacted provider trace |

Both modes use agent-mux for external agent installation and launch. The test code reads the selected mode from workflow env and must not enumerate scenario matrices internally.

## Definition Of Done Per Slice

A slice is complete only when it includes:

- package-local or workflow-level command entrypoint,
- lane label (`lane:no-model` or `lane:model-backed`),
- owner and trigger in pipeline docs,
- artifact contract,
- skip/failure semantics,
- docs update in `docs/testing/`,
- validation proof from local command or CI run.

## Initial PR Sequence

1. Keep `publish.yml` as the owner of live-stack scenario, OS, and install-mode matrices; do not reintroduce code-side matrix runners.
2. Add no-model transport-mux local route/codec, env-injection, passthrough, metrics/cache, and launch-plan proxy-decision scenarios.
3. Add shared fixture transcript format and migrate one agent-mux or transport-mux test to consume it.
4. Add no-model harness dry-run tests for Codex and Claude Code.
5. Add transport-mux fixture and agent-core event stream replay scenarios.
6. Add credential-gated transport-mux bridge smoke for agent-core and one external harness through `amux launch --with-proxy*`.
7. Expand live-stack artifacts into a merged scenario checklist in the workflow summary.
8. Extract reusable testing workflows only if `publish.yml` grows too large or another workflow needs the same lane contract.

## Stop Conditions

Pause rollout if any of these happen:

- live tests flake for provider reasons more than twice in a week,
- artifacts contain unredacted credential material,
- no-model CI runtime grows beyond the agreed PR budget,
- publish is blocked by a non-release-critical live test,
- mocks diverge from live event fixtures without an explicit compatibility issue.
