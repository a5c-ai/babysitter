---
title: Testing Strategy
description: Index for the rebuilt Babysitter end-to-end, model-backed, no-model, mux, and coverage testing strategy.
last_updated: 2026-05-08
---

# Testing Strategy

This directory defines the replacement testing strategy after the legacy Docker and Docker-E2E workflows were removed. The current CI implementation lives primarily in `.github/workflows/publish.yml`, with GitHub Actions owning the live-stack scenario and OS matrix. The new plan starts from repository-native package boundaries, Babysitter harness setup commands, the `babysitter-agent` runtime surface, and explicit model/no-model lanes instead of reusing the retired Docker image and `e2e-tests/docker` suite.

## Documents

- [Test Lanes](./test-lanes.md) defines the two top-level lanes: no-model deterministic tests and model-backed tests that require real provider credentials.
- [Harness And Plugin E2E](./harness-e2e.md) separates SDK harness/plugin setup from agent-mux plugin/session E2E.
- [Agent Mux And Runtime E2E](./agent-mux-and-runtime-e2e.md) defines runtime coverage for `agent-mux`, `transport-mux`, `agent-core`, and `@a5c-ai/babysitter-agent` flows after setup preconditions are satisfied.
- [Pipeline Integration](./pipeline-integration.md) defines where each lane belongs in CI, staging, release, scheduled, and manual workflows.
- [Coverage And Reporting](./coverage-and-reporting.md) defines repo-wide coverage reporting, artifacts, logs, and pass/fail evidence.
- [Implementation Roadmap](./implementation-roadmap.md) defines rollout slices, exit criteria, and stop conditions.
- [Current Test Command Inventory](./current-test-command-inventory.md) maps existing package test-like commands to lane, scope, owner, artifact name, and pipeline placement for roadmap slice 0.
- [Mock And Fixture Contracts](./mock-and-fixture-contracts.md) defines deterministic fixture families and live/mock compatibility rules.
- [Quality Gates](./quality-gates.md) defines release-evidence gates and adversarial review criteria.
- [Stack Permutations](./stack-permutations.md) defines valid and invalid layer combinations across the modular stack.
- [Primary Flow Data Paths](./primary-flow-data-paths.md) maps the full data path for the main agent-mux, babysitter-agent, SDK run, hooks-mux, and transport-mux flows.
- [Trace Identifiers And Evidence](./trace-identifiers-and-evidence.md) defines the IDs, logs, files, and artifact bundles required to correlate those flows.

## Principles

- Separate tests that need model credentials from tests that can run with mocks, fixtures, or local fakes.
- Make setup explicit and repeatable, but do not conflate setup with runtime: SDK harness/plugin setup, agent-mux plugin/session E2E, and babysitter-agent runtime E2E are separate paths.
- Test mux boundaries at multiple scopes: protocol contracts, adapter translation, transport behavior, gateway/session behavior, UI behavior, and full runtime orchestration.
- Prefer package-local tests for fast feedback, then compose them into broader lanes only when the integration surface matters.
- Treat live model runs as release evidence, not as the first line of feedback for every pull request.
- Promote tests through explicit gates: manual, scheduled, staging preflight, then release preflight.
- Require each model-backed claim to have a no-model fixture or contract counterpart unless the behavior is inherently provider-only.

## Status Legend

| Status | Meaning |
| --- | --- |
| Current | Command, workflow, or package test exists today and can be validated now. |
| Proposed | Contract name or workflow shape this strategy recommends for a future implementation slice; not the current source of truth unless a current workflow or package script is named. |
| Promotion target | A test exists or is planned in a lower lane and should move only after meeting quality gates. |

Unless a document explicitly says Current, command bundles and workflow names are proposed implementation targets.

## Current State

The repository already has Vitest, Playwright, package-local test scripts, release verification scripts, docs QA, metadata checks, architecture gates, and staging/release workflows. This strategy names how to organize the next E2E generation around those surfaces rather than around the removed Docker workflows.

## Requested Scope Traceability

| Requested scope | Primary docs | Lane | First implementation surface |
| --- | --- | --- | --- |
| Codex E2E | [Harness And Plugin E2E](./harness-e2e.md), [Stack Permutations](./stack-permutations.md) | No-model setup/session first, then capability-gated model-backed | Harness setup smoke, Codex adapter protocol fixture, plugin E2E only after capability proof; babysitter-agent runtime is separate |
| Claude Code E2E | [Harness And Plugin E2E](./harness-e2e.md), [Stack Permutations](./stack-permutations.md) | No-model setup/session first, then model-backed | Harness setup smoke, agent-mux session, plugin-manager where supported, `/babysitter:call` plugin smoke, Claude hook/tool-call fixture |
| `harness:install` and plugin setup | [Harness And Plugin E2E](./harness-e2e.md), [Stack Permutations](./stack-permutations.md) | Setup only | Dry-run install JSON, plugin discovery JSON, idempotency checks; no babysitter-agent runtime claim |
| Agent-mux functionality requiring credentials | [Agent Mux And Runtime E2E](./agent-mux-and-runtime-e2e.md), [Pipeline Integration](./pipeline-integration.md) | Model-backed | Live adapter matrix for Codex and Claude Code |
| Babysitter-agent whole-system flow | [Agent Mux And Runtime E2E](./agent-mux-and-runtime-e2e.md), [Stack Permutations](./stack-permutations.md) | Both | Mock planner/executor first, bounded live process after staging promotion, no installer commands inside runtime E2E |
| Muxes and transport-mux | [Agent Mux And Runtime E2E](./agent-mux-and-runtime-e2e.md), [Mock And Fixture Contracts](./mock-and-fixture-contracts.md), [Primary Flow Data Paths](./primary-flow-data-paths.md) | Both | Shared event fixtures, transport roundtrip, live transport smoke with trace identifiers |
| Hooks muxes | [Agent Mux And Runtime E2E](./agent-mux-and-runtime-e2e.md), [Mock And Fixture Contracts](./mock-and-fixture-contracts.md), [Trace Identifiers And Evidence](./trace-identifiers-and-evidence.md) | Both | Normalized hook fixtures, live hook replay after redaction with session/run correlation |
| Pipeline integration | [Pipeline Integration](./pipeline-integration.md), [Implementation Roadmap](./implementation-roadmap.md) | Both | New workflow contracts and staged required checks |
| Coverage reporting | [Coverage And Reporting](./coverage-and-reporting.md) | Both | Package coverage baselines plus scenario coverage summaries |
