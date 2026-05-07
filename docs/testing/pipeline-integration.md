---
title: Pipeline Integration
description: Where the no-model and model-backed test lanes should run in CI, staging, release, scheduled, and manual workflows.
last_updated: 2026-05-07
---

# Pipeline Integration

The pipeline should add new testing lanes in stages. No-model tests protect every pull request. Model-backed tests protect promotion and release confidence without making ordinary PRs depend on provider availability.

## Workflow Placement

| Workflow phase | Lanes | Trigger | Required behavior |
| --- | --- | --- | --- |
| Pull request / push CI | No-model unit, contract, mock integration, docs QA | Every PR and branch push | Fast, deterministic, no secrets, no live providers |
| Staging publish preflight | Full no-model suite plus selected model-backed smoke | Push to `staging` before publish jobs | Blocks staging publish if runtime or harness smoke fails |
| Release preflight | Full no-model suite plus model-backed release smoke | Push to `main` before publish/release jobs | Blocks production publish if live Codex/Claude/runtime smoke fails |
| Scheduled nightly | Full model-backed suite | Nightly or twice daily | Detects provider, harness, CLI, and auth drift outside code changes |
| Manual diagnostics | Any single lane or provider | `workflow_dispatch` | Lets maintainers rerun one harness/provider without re-running the full matrix |

## Recommended New Workflows

Do not resurrect the retired Docker workflow names. Use new workflow names that describe the new strategy:

- `testing-no-model.yml` for deterministic PR/push coverage.
- `testing-model-backed.yml` for scheduled/manual/staging model-backed coverage.
- `testing-coverage-report.yml` for repository-wide coverage aggregation if coverage becomes too expensive for the default CI workflow.

These can be introduced incrementally. Existing `.github/workflows/ci.yml`, `.github/workflows/staging-publish.yml`, and `.github/workflows/release.yml` should call or depend on the new lanes once they exist.

## Secret Gating

Model-backed jobs must use explicit `if:` guards before setup:

| Provider or harness | Required signals |
| --- | --- |
| Codex | OpenAI credential configured for CI and Codex runtime install available |
| Claude Code | Anthropic credential configured for CI and Claude Code runtime install available |
| Agent-core provider | Backend-specific credential and selected backend metadata |
| Cloud/provider variants | Environment-specific credentials, region/project metadata, and rate-limit budget |

A skipped model-backed job should say which credential or capability was missing. A required staging/release model-backed job should fail if the job was selected but setup cannot satisfy the declared dependency.

## Suggested Dependency Shape

Staging and release should be ordered like this:

1. Build and no-model tests.
2. Package and generated artifact checks.
3. Model-backed runtime smoke and capability-gated plugin/session smoke.
4. Publish or deploy jobs.
5. Post-publish verification or external sync jobs.

This keeps publish jobs behind live runtime proof without forcing every PR to spend model budget.

## Artifact Policy

Every E2E job should upload:

- command transcript,
- redacted harness discovery JSON,
- redacted event logs,
- run IDs and session IDs,
- coverage output when collected,
- provider/harness version metadata,
- skip reason if the job did not run.

Artifacts must never include raw API keys, token files, home-directory credentials, or full provider request payloads when those payloads may contain secrets.

## Reusable Workflow Contracts

| Workflow | Inputs | Outputs | Required artifacts | Downstream consumers |
| --- | --- | --- | --- | --- |
| `testing-no-model.yml` | `scope`, `changed_packages`, `coverage_mode` | `no_model_status`, `coverage_artifact`, `junit_artifact` | Vitest logs, Playwright traces on failure, package coverage summaries | `ci.yml`, `staging-publish.yml`, `release.yml` |
| `testing-model-backed.yml` | `provider`, `agent`, `backend`, `path`, `prompt_fixture`, `required` | `model_backed_status`, `skip_reason`, `run_artifact` | Separate artifacts per path: setup JSON, agent-mux session events, babysitter-agent run proof, stop-hook evidence | Scheduled workflow, staging preflight, release preflight |
| `testing-coverage-report.yml` | `coverage_artifacts`, `playwright_artifacts`, `model_backed_artifacts` | `coverage_summary`, `scenario_summary` | Merged markdown summary, raw coverage JSON, trace index | PR summaries, release candidate notes |

Required workflows should expose explicit failure/skip outputs. A publish workflow must depend on `*_status == success`; a scheduled workflow may record `skip_reason` without failing when credentials are intentionally absent.

## Required Check Names

Stable required-check names prevent branch protection churn:

- `testing / no-model contracts`
- `testing / no-model runtime`
- `testing / no-model ui`
- `testing / model-backed codex`
- `testing / model-backed claude-code`
- `testing / model-backed babysitter-agent`
- `testing / coverage summary`

Only no-model checks should be required for ordinary PRs at first. Model-backed checks should become required only on `staging` and release branches after their quarantine period ends.
## Proposed Command Bundles

Status: Proposed. These command names are not current `package.json` scripts unless and until a follow-up implementation slice adds them.

Package owners may initially wire these bundles as workflow steps that call existing package-local scripts, then promote them into root `package.json` scripts when at least two packages share the lane.

| Proposed command | Lane | Contents |
| --- | --- | --- |
| `npm run test:no-model` | No-model | Package unit, contract, mock harness, CLI smoke, docs/generator checks |
| `npm run test:no-model:mux` | No-model | Agent-mux, transport-mux, hooks-mux, gateway, and fixture compatibility checks |
| `npm run test:no-model:harness-setup` | No-model | `harness:list`, install dry-runs, plugin install dry-runs, discovery fixtures |
| `npm run test:model-backed` | Model-backed | All selected live provider/harness tests with credential gates |
| `npm run test:model-backed:agent-mux-plugin` | Model-backed | Capability-gated `amux run` plugin/session tests with Babysitter plugin preconditions |
| `npm run test:model-backed:runtime` | Model-backed | Agent-core, transport-mux, agent-mux session smoke, and babysitter-agent runtime smoke; babysitter-agent jobs do not run installers |
| `npm run coverage:repo` | No-model plus reports | Merge package coverage and scenario summaries into one artifact |

Initial workflow implementation can call package-local commands directly. These bundle names become useful once at least two packages share a lane.
