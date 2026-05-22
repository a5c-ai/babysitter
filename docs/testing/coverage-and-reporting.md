---
title: Coverage And Reporting
description: Repository-wide coverage, artifact, and reporting expectations for the rebuilt test strategy.
last_updated: 2026-05-07
---

# Coverage And Reporting

Coverage reporting should make the repository-wide test story visible without turning every test into one slow monolithic gate.

## Coverage Targets

| Layer | Coverage mechanism | Reporting expectation |
| --- | --- | --- |
| Unit and contract tests | Vitest coverage per package | Package coverage reports uploaded as artifacts and merged into a repo summary |
| Browser E2E | Playwright traces and screenshots on failure | Trace artifact plus scenario summary, not line coverage as the primary signal |
| CLI and harness tests | Command transcript and JSON result assertions | Command matrix with pass/fail, duration, and installed version metadata |
| Model-backed tests | Redacted run logs and event assertions | Provider/harness matrix with credential gate status, model name, duration, and token/usage metadata when safe |
| Docs and generated assets | Existing docs QA and generator checks | Docs QA artifact plus generated-output diff/compare result |

## Whole-Repo Coverage Report

The long-term target is one repository coverage artifact with package-level sections:

- `@a5c-ai/babysitter-sdk`,
- `@a5c-ai/babysitter-agent`,
- `@a5c-ai/agent-core`,
- `@a5c-ai/transport-mux`,
- the `@a5c-ai/agent-mux` package family,
- the hooks-mux package family,
- `@a5c-ai/extension-mux`,
- `@a5c-ai/cloud`,
- docs/generator checks.

Vitest coverage should remain package-local during execution, then a dedicated reporting job can merge summaries. Playwright traces and model-backed artifacts should be linked from the same summary but should not be converted into misleading line coverage.

## Minimum Evidence Per Lane

| Lane | Minimum evidence |
| --- | --- |
| No-model | Command, package/workspace, test file count, assertion count when available, coverage summary when enabled |
| Model-backed | Command, harness/provider, installed versions, credential gate result, model name or backend, redacted final output, event assertions |
| Pipeline gate | Workflow run ID, job name, commit SHA, branch, artifact names, pass/fail or skip reason |
| Release gate | All pipeline evidence plus package versions and publish/deploy dependency that consumed the evidence |

## Reporting Rules

- A green model-backed lane must prove that at least one real provider call or real harness call happened.
- A skipped model-backed lane must be visibly skipped before setup, with a single missing dependency named.
- A no-model lane must not depend on external provider availability.
- A coverage summary must distinguish line coverage from E2E scenario coverage.
- A release gate must link to the exact artifacts that support the publish decision.

## Implementation Sequence

1. Normalize package-local Vitest coverage output.
2. Add a `coverage/no-model` artifact for deterministic tests.
3. Add Playwright trace artifacts for UI E2E failures.
4. Add model-backed matrix artifacts with redacted logs.
5. Add a merged markdown summary that CI attaches to workflow summaries and release candidates.

## Threshold Policy

Initial thresholds should be conservative and package-local. Raising a threshold requires a passing baseline report from the package owner.

| Metric | Initial policy | Blocks merge? |
| --- | --- | --- |
| Package line coverage | Do not decrease by more than 2 percentage points from baseline | Yes for no-model PR checks |
| Contract fixture coverage | Every committed fixture family has at least one parser/secret-scan test | Yes |
| Playwright scenario count | Scenario count may not drop unless a test is renamed or removed with docs | Yes for UI-owned PRs |
| Model-backed success rate | Three consecutive scheduled successes before staging promotion | No for PRs; yes after staging promotion |
| Runtime duration | Warn at 80 percent of budget, fail at hard timeout | Yes for required lanes |
| Flake rate | More than two infra-classified failures in seven days triggers quarantine | No during quarantine; yes after promotion |

Trend-only metrics include token usage, provider latency, UI trace size, and artifact size. They should be shown in summaries but should not block merges until a maintainer intentionally promotes a threshold.

Scenario coverage is separate from line coverage. It tracks whether critical user-visible flows have at least one no-model proof and, where needed, one live proof.

| Scenario | No-model proof | Live proof |
| --- | --- | --- |
| Codex SDK setup | Dry-run harness/plugin installer JSON | Capability-gated live setup or documented skip; do not claim agent-mux plugin-manager support unless adapter capability allows it |
| Claude Code SDK setup | Dry-run harness/plugin installer JSON | Live setup artifact plus installed plugin manifest where selected |
| Agent-mux adapter/session protocol | Fixture transcript through adapter tests | Live Codex/Claude session event comparison via `amux run` or SDK `createClient().run` |
| Transport-mux route/runtime bridge | Local route matrix, env injection, launch-plan proxy decisions, fixture stream, passthrough, metrics/cache, and cancellation tests | Live agent-core stream through transport plus agent-mux-launched external harness proxy stream with redacted launch/env/metrics artifacts |
| Babysitter-agent runtime orchestration | Mock planner/executor run journal | Bounded model-backed process run with no installer commands |
| Babysitter plugin through agent-mux | Mock plugin command and hook events | Capability-gated `amux run` session where `/babysitter:call` creates and completes a Babysitter run |
| Hooks mux normalization | Raw hook fixture normalizer tests | Redacted live hook payload replay |

Transport-mux scenario coverage should be reported as separate checklist rows, not collapsed into generic mux coverage:

- supported route/codec matrix for every exposed transport,
- runtime env injection and proxy auth,
- agent-mux launch proxy decision matrix,
- fixture stream cancellation/timeout/reconnect behavior,
- passthrough path/query/upstream failure behavior,
- live agent-core stream bridge,
- live external harness bridge through `amux launch --with-proxy*`.

A coverage summary should show scenario coverage as a checklist, not as a percentage that hides missing live evidence.
