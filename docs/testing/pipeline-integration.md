---
title: Pipeline Integration
description: Where the no-model and model-backed test lanes should run in CI, staging, release, scheduled, and manual workflows.
last_updated: 2026-05-08
---

# Pipeline Integration

The pipeline should add new testing lanes in stages. No-model tests protect every pull request. Model-backed tests protect promotion and release confidence without making ordinary PRs depend on provider availability.

## Workflow Placement

## Current Implementation

The current implementation is consolidated in `.github/workflows/publish.yml`. That workflow owns the live-stack scenario and OS matrix directly under `live_stack_e2e`, exports each selected scenario through `LIVE_STACK_*` environment variables, runs `npm run test:e2e:live-stack:pipeline`, and writes the per-scenario coverage artifact with `npm run coverage:e2e:live-stack`. Test code executes exactly one pipeline-selected scenario when `LIVE_STACK_REQUIRE_EVIDENCE=1`; it must not enumerate the scenario matrix or run a code-side matrix runner.

`Publish` now also owns two deterministic matrices before live-stack publish preflight. `agent_mux_hooks_mux_e2e` covers the no-Babysitter-SDK path `agent-mux hooks -> hooks-mux invoke` for `claude-code`, `codex`, and `pi`; the matrix supplies agent, adapter, hook event, payload, and expected canonical phase. `no_model_mock_matrix` is a stack E2E matrix: GitHub chooses the runtime (`agent-mux-mocks` or local real-agent CLI shim), agent (`claude`, `codex`, `pi`, `gemini`), and hook mode (`none` or `hooks-mux`); the test installs/verifies the agent path, launches it with an agent-mux profile, routes the model call through a local transport-mux mock model, and optionally proves hooks-mux normalization. Both jobs are dependencies of `Prepare Publish`, so package publish/deploy cannot start until these matrices pass.

`Publish` now also owns the branch-aware publish/deploy topology for `develop`, `staging`, and `main`: validation and live-stack jobs precede `Prepare Publish`; package publishes, docs deploy, Atlas WebUI deploy, cloud deploy, release tagging, and external plugin sync depend on that prepared publish ref/version.


| Workflow phase | Lanes | Trigger | Required behavior |
| --- | --- | --- | --- |
| Pull request / push CI | No-model unit, contract, mock integration, docs QA | Every PR and branch push | Fast, deterministic, no secrets, no live providers |
| Publish preflight | Full no-model suite plus selected model-backed smoke | Push to `develop`, `staging`, or `main` before publish/deploy jobs | Blocks publish/deploy if runtime or harness smoke fails |
| Release preflight | Full no-model suite plus model-backed release smoke | Push to `main` before publish/release jobs | Blocks production publish if live Codex/Claude/runtime smoke fails |
| Scheduled nightly | Full model-backed suite | Nightly or twice daily | Detects provider, harness, CLI, and auth drift outside code changes |
| Manual diagnostics | Any single lane or provider | `workflow_dispatch` | Lets maintainers rerun one harness/provider without re-running the full matrix |

## Recommended New Workflows

Do not resurrect the retired Docker workflow names. Use new workflow names that describe the new strategy:

- `publish.yml` currently runs deterministic validation and model-backed live-stack coverage inline.
- Optional future `testing-no-model.yml` can extract deterministic PR/push coverage if another workflow needs the same contract.
- Optional future `testing-model-backed.yml` can extract scheduled/manual model-backed coverage if it should run independently from publish.
- Optional future `testing-coverage-report.yml` can extract repository-wide coverage aggregation if coverage becomes too expensive for the default CI workflow.

Reusable workflows are optional extraction targets, not the current source of truth. Existing `.github/workflows/ci.yml` can keep fast PR checks, while `.github/workflows/publish.yml` owns publish-time validation, live-stack preflight, deploy, tagging, and plugin sync.

## Secret Gating

Model-backed jobs must use explicit `if:` guards before setup:

| Provider or harness | Required signals |
| --- | --- |
| Codex | OpenAI credential configured for CI and Codex runtime install available |
| Claude Code | Foundry/OpenAI credential configured for CI, Claude Code runtime install available, and transport-mux proxy path enabled |
| Agent-core provider | Backend-specific credential and selected backend metadata |
| Cloud/provider variants | Environment-specific credentials, region/project metadata, and rate-limit budget |

A skipped model-backed job should say which credential or capability was missing. A required staging/release model-backed job should fail if the job was selected but setup cannot satisfy the declared dependency.

## Suggested Dependency Shape

Staging and release should be ordered like this:

1. Build and no-model tests.
2. Package and generated artifact checks.
3. Model-backed runtime smoke, transport-mux bridge smoke, and capability-gated plugin/session smoke.
4. Publish or deploy jobs.
5. Post-publish verification or external sync jobs.

This keeps publish jobs behind live runtime proof without forcing every PR to spend model budget.

## Artifact Policy

Every E2E job should upload:

- command transcript,
- redacted harness discovery JSON,
- redacted event logs,
- transport-mux launch-plan JSON when proxy launch is under test,
- redacted proxy config and env injection diff,
- route transcripts, streaming event transcripts, metrics snapshots, and cache stats for transport-mux lanes,
- run IDs and session IDs,
- coverage output when collected,
- provider/harness version metadata,
- skip reason if the job did not run.

Artifacts must never include raw API keys, token files, home-directory credentials, or full provider request payloads when those payloads may contain secrets.

## Reusable Workflow Contracts

| Workflow | Inputs | Outputs | Required artifacts | Downstream consumers |
| --- | --- | --- | --- | --- |
| Optional `testing-no-model.yml` | `scope`, `changed_packages`, `coverage_mode` | `no_model_status`, `coverage_artifact`, `junit_artifact` | Vitest logs, Playwright traces on failure, package coverage summaries | Future extraction for `ci.yml` and `publish.yml` |
| Optional `testing-model-backed.yml` | `provider`, `agent`, `backend`, `path`, `prompt_fixture`, `required` | `model_backed_status`, `skip_reason`, `run_artifact` | Separate artifacts per path: setup JSON, agent-mux session events, transport-mux launch/env/metrics evidence, babysitter-agent run proof, stop-hook evidence | Future extraction from `publish.yml` live-stack jobs or scheduled workflow |
| Optional `testing-coverage-report.yml` | `coverage_artifacts`, `playwright_artifacts`, `model_backed_artifacts` | `coverage_summary`, `scenario_summary` | Merged markdown summary, raw coverage JSON, trace index | Future PR summaries and release candidate notes |

Required workflows should expose explicit failure/skip outputs. A publish workflow must depend on `*_status == success`; a scheduled workflow may record `skip_reason` without failing when credentials are intentionally absent.

## Required Check Names

Stable required-check names prevent branch protection churn:

- `testing / no-model contracts`
- `testing / no-model runtime`
- `testing / no-model transport-mux`
- `testing / no-model ui`
- `testing / model-backed codex`
- `testing / model-backed claude-code`
- `testing / model-backed babysitter-agent`
- `testing / model-backed transport-mux bridge`
- `testing / coverage summary`

Only no-model checks should be required for ordinary PRs at first. Model-backed checks should become required only on `staging` and release branches after their quarantine period ends.

## Current Inventory Naming

Roadmap slice 0 keeps current workflow behavior intact and uses [Current Test Command Inventory](./current-test-command-inventory.md) as the source of truth for existing package scripts. Workflow comments and future reusable jobs should use the inventory artifact names before they introduce new command bundles.

## Proposed Command Bundles

Status: Mixed. `test:e2e:live-stack:*` and `coverage:e2e:live-stack` are current scripts; the broader no-model/model-backed bundle names remain proposed until a follow-up slice adds them.

Package owners may initially wire these bundles as workflow steps that call existing package-local scripts, then promote them into root `package.json` scripts when at least two packages share the lane.

| Proposed command | Lane | Contents |
| --- | --- | --- |
| `npm run test:no-model` | No-model | Package unit, contract, mock harness, CLI smoke, docs/generator checks |
| `npm run test:no-model:mux` | No-model | Agent-mux, transport-mux route/runtime/env/launch-plan, hooks-mux, gateway, and fixture compatibility checks |
| `npm run test:no-model:harness-setup` | No-model | `harness:list`, install dry-runs, plugin install dry-runs, discovery fixtures |
| `npm run test:model-backed` | Model-backed | All selected live provider/harness tests with credential gates |
| `npm run test:model-backed:agent-mux-plugin` | Model-backed | Capability-gated `amux run` plugin/session tests with Babysitter plugin preconditions |
| `npm run test:model-backed:runtime` | Model-backed | Agent-core, transport-mux bridge, agent-mux session smoke, and babysitter-agent runtime smoke; babysitter-agent jobs do not run installers |
| `npm run test:model-backed:transport-mux` | Model-backed | Agent-core stream through transport-mux plus agent-mux-launched external harness proxy smoke with credential gates |
| `npm run coverage:repo` | No-model plus reports | Merge package coverage and scenario summaries into one artifact |

Initial workflow implementation can call package-local commands directly. These bundle names become useful once at least two packages share a lane.
