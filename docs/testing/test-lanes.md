---
title: Test Lanes
description: Current and proposed no-model and model-backed test lanes for the Babysitter monorepo.
last_updated: 2026-05-08
---

# Test Lanes

The replacement strategy has two top-level lanes. Every new test must declare which lane it belongs to before it is added to CI.

## Lane 1: No-Model Tests

No-model tests must run without provider secrets, paid model calls, or installed external agent CLIs beyond normal package dependencies.

| Scope | Primary tools | What it covers | CI timing |
| --- | --- | --- | --- |
| Package unit tests | Vitest | Pure functions, schema parsing, protocol serialization, command helpers, state machines | Every PR and push |
| Contract tests | Vitest + fixtures | Stable boundaries between SDK, hooks-mux, agent-mux, transport-mux, agent-core, and babysitter-agent, including transport-mux route matrix and runtime env injection contracts | Every PR and push |
| Mock harness tests | Vitest + existing mock adapters | Session lifecycle, adapter dispatch, tool-call translation, stop-hook semantics, plugin discovery, fallback metadata | Every PR and push |
| Browser/UI E2E | Playwright + mock gateway | Agent-mux WebUI session flows, transcript rendering, model picker behavior, approvals, reconnect behavior | PRs touching WebUI/gateway/session code; staging before publish |
| CLI smoke tests | Node subprocess tests | `babysitter`, `amux`, hooks-mux CLI, package entrypoints, help output, dry-run paths | Every PR for touched packages; staging before publish |
| Docs and generated assets | Existing docs QA and generator checks | Documentation links, snippets, generated plugin bundles, command templates | Every PR and push |

No-model tests should prefer deterministic fixture transcripts and mock harness implementations. They should never skip because an API key is missing; if a test cannot run without a provider key, it belongs in the model-backed lane.

### Implemented No-Model Matrices

`Publish` owns the `no_model_mock_matrix` job as a stack E2E matrix, not as a package-suite aggregator. The matrix dimensions are declared in `.github/workflows/publish.yml` and the test consumes exactly one selected lane:

| Dimension | Values | Required proof |
| --- | --- | --- |
| Agent runtime | `agent-mux-mocks`, `real-agent` | The lane installs/verifies the target through `amux install --dry-run`, then launches the agent path selected by the runtime dimension |
| Agent | `claude`, `codex`, `pi`, `gemini` | The target CLI path is selected by agent-mux and produces per-agent evidence |
| Hook mode | `none`, `hooks-mux` | `hooks-mux` lanes register an `amux hooks` command bridge and assert the normalized hooks-mux phase evidence |

Every no-model stack lane starts a local transport-mux runtime with a fixture completion engine. The launched agent, including the local CI shim for real-agent lanes and the mock-harness path for `agent-mux-mocks`, must send a request through that transport-mux runtime and attach the request count plus redacted evidence under `publish-no-model-stack-*`.

`Publish` also has an `agent_mux_hooks_mux_e2e` no-model/no-SDK job. It is intentionally separate from the live Babysitter plugin matrix: the GitHub matrix chooses `claude-code`, `codex`, and `pi`; the test only consumes that one selected lane, registers an `amux hooks` command hook, bridges the native payload into `a5c-hooks-mux invoke`, and asserts the hooks-mux normalized phase evidence.

## Lane 2: Model-Backed Tests

Model-backed tests exercise real provider integrations, real installed harnesses, and real credentials.

| Scope | Required setup | What it covers | CI timing |
| --- | --- | --- | --- |
| SDK harness/plugin setup smoke | `babysitter harness:install <name>` and `babysitter harness:install-plugin <name>` | Installer delegation, plugin target resolution, idempotent manifests; not babysitter-agent runtime | Scheduled, manual, staging gate |
| Agent-mux plugin/session E2E | Provider secrets, installed external CLI, and plugin precondition where supported | `amux run` or `createClient().run` starts a session, plugin command creates a Babysitter run, and hooks/process lifecycle are asserted | Scheduled, manual, staging gate |
| Babysitter-agent live orchestration | Preinstalled/mocked backend plus `OPENAI_API_KEY`, configured Foundry/OpenAI credentials, or configured cloud equivalents where needed | `@a5c-ai/babysitter-agent` can plan, execute, post task results, and close a run without executing harness installer commands | `publish.yml` staging/main preflight, manual |
| Agent-mux live adapters | Provider-specific credentials | Claude Code and Codex adapters produce protocol events that match the mux contracts | Scheduled/manual first, then `publish.yml` release preflight after quarantine |
| Transport-mux live transport | Local process ports plus provider/harness credentials | Transport-mux carries real agent-core streams and agent-mux-launched external harness traffic through proxy routes with redacted launch/env/metrics artifacts | Scheduled/manual first, then `publish.yml` after quarantine |

Model-backed tests must be opt-in by environment detection. A missing credential should mark the lane skipped or not scheduled, not silently pass a test that claims provider coverage.

## Transport-Mux Lane Split

Transport-mux scenarios must be split across both lanes instead of hidden inside broad mux smoke tests.

| Scenario | Lane | Why it belongs there |
| --- | --- | --- |
| Route/codec matrix for supported transports | No-model | A fixture completion engine can prove request parsing, response envelopes, streaming shape, auth errors, invalid JSON, and token-count behavior deterministically |
| Runtime lifecycle and env injection | No-model | Local ports and redacted env diffs do not require provider credentials |
| Agent-mux launch proxy decision | No-model | `resolveLaunchPlan` can prove proxy forced/if-needed/native/forbidden behavior with fixture provider configs |
| Agent-core through transport-mux | Both | Fixture stream belongs in no-model; live provider stream belongs in model-backed when credentials exist |
| External harness through agent-mux proxy | Model-backed | Only a real harness plus provider credential can prove the harness actually consumes the proxy env and completes a sentinel stream |
| Passthrough upstream bridge | No-model first, model-backed optional | Path/query/auth/error mapping is deterministic with a fixture upstream; live passthrough only adds value for provider-specific drift |

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
