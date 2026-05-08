---
title: Agent Mux And Runtime E2E
description: Agent-mux, transport-mux, agent-core, and babysitter-agent model and no-model E2E strategy.
last_updated: 2026-05-07
---

# Agent Mux And Runtime E2E

This strategy covers runtime paths after setup is already satisfied. It separates agent-mux sessions, transport carriers, agent-core programmatic sessions, and `@a5c-ai/babysitter-agent` orchestration. Harness/plugin install coverage lives in [Harness And Plugin E2E](./harness-e2e.md), not in babysitter-agent runtime E2E.

## Stack Scopes

| Scope | Packages | No-model coverage | Model-backed coverage |
| --- | --- | --- | --- |
| Protocol and event contracts | `packages/agent-mux/core`, `packages/agent-mux/gateway`, `packages/transport-mux` | Schema, event ordering, session lifecycle, error envelopes, reconnect behavior | Real event streams from Codex and Claude Code sessions match protocol contracts |
| Adapter translation | `packages/agent-mux/adapters` | Prompt normalization, tool-call mapping, stop reasons, model selection, fallback behavior with mock adapters | Live Codex and Claude Code adapters translate real provider output into mux events |
| Transport runtime | `packages/transport-mux` | Route matrix, proxy auth, protocol codecs, runtime env injection, passthrough forwarding, subprocess lifecycle, stream cancellation, timeout/error paths, metrics/cache snapshots | Transport-mux carries traffic for a real external harness through agent-mux launch and for an agent-core-backed stream |
| Agent-core bridge | `packages/agent-core` | Programmatic session creation, mock provider responses, cancellation, usage accounting | Agent-core invokes a real provider and returns events compatible with agent-mux and babysitter-agent |
| Hooks muxes | `packages/hooks-mux/*` | Adapter normalization, hook payload fixtures, CLI execution, approval/deny/error events | Real harness hook payloads from Codex and Claude Code normalize to the same hook contract |
| Babysitter-agent runtime | `packages/babysitter-agent` | Seam contract, phase orchestration, planner/executor mocks, run journal state, task posting, selected backend | `babysitter-agent call/create-run/invoke` uses preinstalled or mocked backends; no harness install or plugin install steps are part of this E2E |
| User surfaces | `packages/agent-mux/webui`, `packages/agent-mux/ui`, `packages/agent-mux/tui` | Playwright/Vitest against mock gateway and fixture sessions | Optional manual/live smoke against a model-backed gateway session |

## No-Model Runtime Suite

The no-model runtime suite should be built first. It should include:

- `transport-mux` unit and E2E tests using local HTTP/subprocess fixtures for every supported exposed transport route.
- `transport-mux` runtime tests for `startTransportMuxRuntime`, `applyTransportMuxToHarnessEnv`, proxy auth, redacted env diffs, metrics, cache stats, passthrough path/query preservation, invalid JSON, and upstream failure mapping.
- `agent-mux` launch-plan tests for proxy forced, proxy if-needed, native/no-proxy, and proxy-forbidden cases so launch coverage proves the transport-mux decision seam.
- `agent-mux` gateway/session tests using existing mock harness scenarios.
- Adapter translation tests for Codex, Claude Code, and agent-core-style event streams.
- `babysitter-agent` seam and orchestration tests with mocked planner/executor calls.
- WebUI and TUI session tests using fixture transcripts and mock gateway responses.
- Agent-mux plugin/session fixtures live in [Harness And Plugin E2E](./harness-e2e.md); this file consumes their event fixtures only as runtime compatibility inputs.

Candidate command grouping:

```bash
npm run test --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/agent-mux-core
npm run test --workspace=@a5c-ai/agent-mux-adapters
npm run test --workspace=@a5c-ai/agent-mux-gateway
npm run test --workspace=@a5c-ai/agent-core
npm run test --workspace=@a5c-ai/babysitter-agent
npm run test:e2e --workspace=@a5c-ai/agent-mux-webui
```

## Transport-Mux Coverage Matrix

Transport-mux coverage has to prove the proxy/runtime seam directly before it is used as evidence for agent-mux or babysitter-agent paths.

### No-Model Transport Coverage

| Surface | Tests to add or keep | Required artifacts |
| --- | --- | --- |
| Supported transport routes | Exercise `anthropic`, `openai-chat`, `openai-responses`, `google`, `bedrock-converse`, `azure-foundry`, `vertex-native`, and `passthrough` against fixture engines | Route transcript, response shape snapshot, invalid JSON/auth failure transcript |
| Streaming and non-streaming codecs | Verify text deltas, final events, finish reasons, usage totals, and provider-specific envelopes | Streaming event transcript and non-streaming body snapshot |
| Token and observability routes | Cover `count_tokens` success/unsupported behavior plus `/metrics` and `/cache/stats` | Token count transcript, metrics snapshot, cache stats snapshot |
| Runtime env injection | Call `applyTransportMuxToHarnessEnv` for every exposed transport | Redacted env diff proving only expected vars changed |
| Agent-mux launch seam | Cover `resolveLaunchPlan` for proxy forced, proxy if-needed, native/no-proxy, and forbidden proxy cases | Launch-plan JSON with `proxyNeeded`, `proxyReason`, and exposed transport |
| Passthrough forwarding | Preserve path/query/body, inject upstream auth safely, and map upstream failures | Redacted upstream transcript and failure envelope |

### Model-Backed Transport Coverage

| Path | Valid stack | Assertion focus |
| --- | --- | --- |
| Agent-core stream bridge | `agent-core` provider backend -> transport-mux -> fixture consumer | Real or credential-gated stream deltas, final event, cancellation/timeout, and usage metadata survive the proxy layer |
| External harness bridge | `amux launch <harness> <provider> --with-proxy*` -> transport-mux -> target provider | Harness receives proxy env, provider endpoint is not called directly by the harness, sentinel prompt completes, metrics show traffic |
| Babysitter-agent precondition bridge | `babysitter-agent` external-harness path only when it delegates through agent-mux and the selected harness requires proxy translation | Transport-mux artifacts are supporting evidence for the bridge, while Babysitter run creation/task posting remains asserted by babysitter-agent tests |

### Invalid Transport Claims

- Do not use transport-mux tests to prove `babysitter harness:install` or `harness:install-plugin`.
- Do not use transport-mux tests to prove agent-native plugin manager support.
- Do not use transport-mux tests to prove hooks-mux normalization.
- Do not use transport-mux tests to prove Babysitter journal terminal state unless a higher-level runtime test also asserts that state.


### Live Install Modes

The `Publish` workflow runs external-harness live E2E through a workflow-owned install-mode axis:

- `babysitter-plugin` generates plugin artifacts, installs the target with `amux install`, installs the local Babysitter SDK, installs the Babysitter plugin for the harness, then launches through `amux launch` with a `/babysitter:call` prompt.
- `vanilla` installs the target with `amux install`, launches through `amux launch`, and uses a non-plugin prompt so it proves agent-mux/transport/provider behavior; the vanilla `babysitter-agent` rows use the `babysitter` adapter with `BABYSITTER_HARNESS=agent-core`.
- Both modes use the same target mapping: `claude-code -> claude`, `codex -> codex`, `gemini-cli -> gemini`, `pi -> pi`, and vanilla-only `babysitter-agent -> babysitter`.

## Model-Backed Runtime Suite

The model-backed suite should prove that real providers and real harnesses behave like the no-model contracts expect.

| Test | Required real dependency | Assertion focus |
| --- | --- | --- |
| Transport-mux + external harness through agent-mux | Claude Code or Codex-compatible harness, provider credential, and `amux launch --with-proxy` or `--with-proxy-if-needed` | Launch starts transport-mux, harness receives proxy env, sentinel traffic uses proxy routes, stream completes, metrics snapshot increments |
| Transport-mux + agent-core | Provider credential for agent-core backend | Agent-core deltas/final events travel through transport-mux without adapter-only assumptions, including cancellation or timeout evidence |
| Agent-mux + Codex adapter | Codex CLI or configured Codex runtime and OpenAI credential | Codex output maps to mux protocol events, including final message and usage metadata when available |
| Agent-mux + Claude Code adapter | Claude Code CLI plus Foundry/OpenAI credential through transport-mux | Claude Code output maps to mux protocol events while model traffic is proxied to GPT-5.5, including tool-call and stop metadata when available |
| Babysitter-agent full run | Provider credentials or mocked backend already available | `babysitter-agent call/create-run` creates a bounded process, plans, emits a task, posts a result, completes, and records selected backend evidence without running installer commands |

Model-backed runtime tests must upload redacted event logs, provider/harness version metadata, run IDs, and command durations.

## Runtime Path Assertions

Runtime tests must declare which entry path they exercise:

| Path | Entry point | Valid backend combinations | Assertions |
| --- | --- | --- | --- |
| Agent-mux session | `amux run <agent>` or `createClient().run` | Mock adapter, Claude, Codex, Gemini, Cursor, OpenCode, agent-mux `babysitter` adapter where registered | Session start/end, event ordering, provider/model config, runtime hooks, capability-gated plugin events |
| Babysitter-agent internal runtime | `babysitter-agent call/create-run --harness agent-core` | Agent-core backend with mocked or live model provider | Run creation, planning, task posting, terminal state, redacted model trace |
| Babysitter-agent external-harness bridge | `babysitter-agent call/invoke --harness <external>` | Harness names mapped in `amuxHarnessMap`; excludes `pi` and `agent-core` | Agent-mux mapped events, session ID, result, selected harness, no install commands |
| Transport runtime | transport-mux around agent-core or agent-mux-launched external harness traffic | Local route fixture, agent-core stream, external harness stream | Route/codec contract, proxy auth, env injection, launch proxy decision, framing, reconnect, cancellation, timeout, backpressure, metrics/cache artifact |

Do not fold plugin setup into the babysitter-agent runtime assertions. If a runtime job needs an installed external harness or plugin, that is a precondition supplied by a setup job and recorded separately.

## Mux-Specific Assertions

Mux tests should assert behavior that package-local unit tests cannot prove alone:

- A session can be started, observed, cancelled, and resumed through the mux boundary.
- Tool-call, text-delta, final-message, usage, and error events preserve ordering and session IDs.
- Adapter-specific errors are normalized before they cross gateway or transport boundaries.
- Model selection is explicit and recorded in the session state.
- Credential absence is detected before provider calls are attempted.
- Mock and live event streams conform to the same protocol fixtures.

## Babysitter-Agent Whole-System Assertions

Whole-system tests for `@a5c-ai/babysitter-agent` should cover:

- process loading and validation,
- run creation,
- session binding,
- planning phase output shape,
- task effect emission,
- task result posting,
- journal rebuild/repair compatibility,
- terminal run state,
- artifact and log redaction.

The no-model version should use mocks for planner and executor behavior. The model-backed version should use the smallest possible bounded process and real model credentials or a preconfigured external harness. It must not execute `harness:install` or `harness:install-plugin` as part of the babysitter-agent runtime test.

## Hooks-Mux Assertions

Hooks-mux tests should cover both adapter-local behavior and end-to-end event compatibility:

- each adapter normalizes raw harness hook payloads into the shared hook contract,
- CLI execution preserves stdin/stdout/stderr boundaries and exit codes,
- approval, denial, timeout, and malformed-payload cases are fixture-backed,
- Codex and Claude Code live hook payloads can be redacted and replayed as no-model fixtures,
- agent-mux UI and TUI approval surfaces consume the same normalized hook events.

Hooks-mux live coverage should not be promoted until the no-model fixture suite covers the same event types.
