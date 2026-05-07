---
title: Test Lanes
description: Proposed no-model and model-backed test lanes for the Babysitter monorepo.
last_updated: 2026-05-07
---

# Test Lanes

The replacement strategy has two top-level lanes. Every new test must declare which lane it belongs to before it is added to CI.

## Lane 1: No-Model Tests

No-model tests must run without provider secrets, paid model calls, or installed external agent CLIs beyond normal package dependencies.

| Scope | Primary tools | What it covers | CI timing |
| --- | --- | --- | --- |
| Package unit tests | Vitest | Pure functions, schema parsing, protocol serialization, command helpers, state machines | Every PR and push |
| Contract tests | Vitest + fixtures | Stable boundaries between SDK, hooks-mux, agent-mux, transport-mux, agent-core, and babysitter-agent | Every PR and push |
| Mock harness tests | Vitest + existing mock adapters | Session lifecycle, adapter dispatch, tool-call translation, stop-hook semantics, plugin discovery, fallback metadata | Every PR and push |
| Browser/UI E2E | Playwright + mock gateway | Agent-mux WebUI session flows, transcript rendering, model picker behavior, approvals, reconnect behavior | PRs touching WebUI/gateway/session code; staging before publish |
| CLI smoke tests | Node subprocess tests | `babysitter`, `amux`, hooks-mux CLI, package entrypoints, help output, dry-run paths | Every PR for touched packages; staging before publish |
| Docs and generated assets | Existing docs QA and generator checks | Documentation links, snippets, generated plugin bundles, command templates | Every PR and push |

No-model tests should prefer deterministic fixture transcripts and mock harness implementations. They should never skip because an API key is missing; if a test cannot run without a provider key, it belongs in the model-backed lane.

## Lane 2: Model-Backed Tests

Model-backed tests exercise real provider integrations, real installed harnesses, and real credentials.

| Scope | Required setup | What it covers | CI timing |
| --- | --- | --- | --- |
| SDK harness/plugin setup smoke | `babysitter harness:install <name>` and `babysitter harness:install-plugin <name>` | Installer delegation, plugin target resolution, idempotent manifests; not babysitter-agent runtime | Scheduled, manual, staging gate |
| Agent-mux plugin/session E2E | Provider secrets, installed external CLI, and plugin precondition where supported | `amux run` or `createClient().run` starts a session, plugin command creates a Babysitter run, and hooks/process lifecycle are asserted | Scheduled, manual, staging gate |
| Babysitter-agent live orchestration | Preinstalled/mocked backend plus `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or configured cloud equivalents where needed | `@a5c-ai/babysitter-agent` can plan, execute, post task results, and close a run without executing harness installer commands | Staging, release candidate, manual |
| Agent-mux live adapters | Provider-specific credentials | Claude Code and Codex adapters produce protocol events that match the mux contracts | Scheduled, manual, release candidate |
| Transport-mux live transport | Local process ports plus provider/harness credentials | Transport-mux can carry real session traffic between CLI/runtime/gateway boundaries | Scheduled, manual, release candidate |

Model-backed tests must be opt-in by environment detection. A missing credential should mark the lane skipped or not scheduled, not silently pass a test that claims provider coverage.

## Required Labels

Every test file or workflow job should map to one of these labels:

- `lane:no-model`
- `lane:model-backed`
- `scope:unit`
- `scope:contract`
- `scope:integration`
- `scope:e2e`
- `scope:release-gate`

These labels can start as workflow/job names and test descriptions. They only need to become machine-readable once the first implementation slice adds the new runners.

## Lane Ownership

| Lane | Primary owner | Required reviewer | Failure triage clock |
| --- | --- | --- | --- |
| No-model package and contract tests | Owning package maintainer | Adjacent package maintainer when a boundary contract changes | Same business day for PR failures |
| No-model UI and CLI smoke | Surface owner | Runtime maintainer when session behavior changes | Same business day for PR failures |
| Model-backed harness smoke | Harness maintainer | CI maintainer for secret and runner changes | Next business day for scheduled failures; immediate for staging/release failures |
| Model-backed runtime smoke | Runtime maintainer | Harness and mux maintainers | Immediate for staging/release failures |
| Coverage/reporting | CI maintainer | Package owner when thresholds change | Same business day for blocking report failures |

## Admission Criteria

A test may enter the no-model lane when it has deterministic fixtures, no provider credentials, bounded runtime, and a package owner.

A test may enter the model-backed lane when it has explicit credential gates, redacted artifacts, a live behavior that mocks cannot prove, a retry policy, and an owner for provider-specific failures.

## Promotion Path

1. Local/package command.
2. PR/push no-model lane.
3. Scheduled model-backed lane, if provider behavior matters.
4. Staging preflight only if it protects publish correctness.
5. Release preflight only if missing the test can publish a broken production artifact.
