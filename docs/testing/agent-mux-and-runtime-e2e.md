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
| Transport runtime | `packages/transport-mux` | HTTP roundtrip, subprocess lifecycle, stream cancellation, timeout/error paths | Transport-mux carries traffic for a real Claude Code session and an agent-core-backed session |
| Agent-core bridge | `packages/agent-core` | Programmatic session creation, mock provider responses, cancellation, usage accounting | Agent-core invokes a real provider and returns events compatible with agent-mux and babysitter-agent |
| Hooks muxes | `packages/hooks-mux/*` | Adapter normalization, hook payload fixtures, CLI execution, approval/deny/error events | Real harness hook payloads from Codex and Claude Code normalize to the same hook contract |
| Babysitter-agent runtime | `packages/babysitter-agent` | Seam contract, phase orchestration, planner/executor mocks, run journal state, task posting, selected backend | `babysitter-agent call/create-run/invoke` uses preinstalled or mocked backends; no harness install or plugin install steps are part of this E2E |
| User surfaces | `packages/agent-mux/webui`, `packages/agent-mux/ui`, `packages/agent-mux/tui` | Playwright/Vitest against mock gateway and fixture sessions | Optional manual/live smoke against a model-backed gateway session |

## No-Model Runtime Suite

The no-model runtime suite should be built first. It should include:

- `transport-mux` unit and E2E tests using local HTTP/subprocess fixtures.
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

## Model-Backed Runtime Suite

The model-backed suite should prove that real providers and real harnesses behave like the no-model contracts expect.

| Test | Required real dependency | Assertion focus |
| --- | --- | --- |
| Transport-mux + Claude Code | Claude Code CLI and Anthropic credential | Real session output streams through transport-mux with correct lifecycle events |
| Transport-mux + agent-core | Provider credential for agent-core backend | Agent-core events travel through transport-mux without adapter-only assumptions |
| Agent-mux + Codex adapter | Codex CLI or configured Codex runtime and OpenAI credential | Codex output maps to mux protocol events, including final message and usage metadata when available |
| Agent-mux + Claude Code adapter | Claude Code CLI and Anthropic credential | Claude Code output maps to mux protocol events, including tool-call and stop metadata when available |
| Babysitter-agent full run | Provider credentials or mocked backend already available | `babysitter-agent call/create-run` creates a bounded process, plans, emits a task, posts a result, completes, and records selected backend evidence without running installer commands |

Model-backed runtime tests must upload redacted event logs, provider/harness version metadata, run IDs, and command durations.

## Runtime Path Assertions

Runtime tests must declare which entry path they exercise:

| Path | Entry point | Valid backend combinations | Assertions |
| --- | --- | --- | --- |
| Agent-mux session | `amux run <agent>` or `createClient().run` | Mock adapter, Claude, Codex, Gemini, Cursor, OpenCode, agent-mux `babysitter` adapter where registered | Session start/end, event ordering, provider/model config, runtime hooks, capability-gated plugin events |
| Babysitter-agent internal runtime | `babysitter-agent call/create-run --harness agent-core` | Agent-core backend with mocked or live model provider | Run creation, planning, task posting, terminal state, redacted model trace |
| Babysitter-agent external-harness bridge | `babysitter-agent call/invoke --harness <external>` | Harness names mapped in `amuxHarnessMap`; excludes `pi` and `agent-core` | Agent-mux mapped events, session ID, result, selected harness, no install commands |
| Transport runtime | transport-mux around agent-core or agent-mux event stream | Local fixture, agent-core stream, external harness stream | Framing, reconnect, cancellation, timeout, backpressure |

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
