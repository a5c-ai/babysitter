---
title: Implementation Roadmap
description: Iterative rollout plan for the rebuilt no-model and model-backed testing strategy.
last_updated: 2026-05-07
---

# Implementation Roadmap

This roadmap turns the strategy into implementation slices. Each slice must land with docs, package scripts or workflow wiring, and proof artifacts before the next slice depends on it.

## Rollout Slices

| Slice | Primary owner | Lane | Exit criteria | Pipeline target |
| --- | --- | --- | --- | --- |
| 0. Inventory and naming | CI maintainers | No-model | Every current test command is mapped to a package, lane, scope, and artifact name | Documentation only, then CI workflow comments |
| 1. Mock and fixture contracts | Runtime maintainers | No-model | Mock Codex, Claude Code, agent-core, and gateway transcripts are shared by unit, integration, and UI tests | PR/push CI |
| 2. SDK harness/plugin setup smoke | SDK and harness maintainers | No-model | `harness:install --dry-run`, `harness:install-plugin --dry-run`, and plugin discovery produce JSON evidence without claiming babysitter-agent runtime coverage | PR/push CI |
| 3. Mux integration matrix | Agent-mux maintainers | No-model | Transport-mux, agent-mux gateway, adapters, and WebUI run against the same fixture sessions | PR/push CI and staging |
| 4. Minimal live harness smoke | Harness maintainers | Model-backed | Codex and Claude Code each return a deterministic sentinel token with redacted artifacts | Scheduled and manual, then staging |
| 5. Split live E2E smokes | Runtime and mux maintainers | Model-backed | Agent-mux plugin/session smoke uses `amux run` plus plugin preconditions; babysitter-agent runtime smoke uses `babysitter-agent call/create-run` with no installer steps | Staging and release candidate |
| 6. Coverage aggregation | CI maintainers | Both | Package coverage, Playwright traces, and live-run summaries merge into one workflow summary | PR/push for no-model, scheduled for live |

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

1. Add labels and artifact naming to current CI jobs without changing behavior.
2. Add no-model harness dry-run tests for Codex and Claude Code.
3. Add shared fixture transcript format and migrate one agent-mux test to consume it.
4. Add transport-mux local integration scenarios for fixture and agent-core event streams.
5. Add scheduled model-backed workflow behind explicit secret guards.
6. Promote the smallest stable model-backed smoke into staging preflight.

## Stop Conditions

Pause rollout if any of these happen:

- live tests flake for provider reasons more than twice in a week,
- artifacts contain unredacted credential material,
- no-model CI runtime grows beyond the agreed PR budget,
- staging publish is blocked by a non-release-critical live test,
- mocks diverge from live event fixtures without an explicit compatibility issue.
