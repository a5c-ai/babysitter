---
title: Mock And Fixture Contracts
description: Contracts for deterministic no-model fixtures and their relationship to model-backed test evidence.
last_updated: 2026-05-07
---

# Mock And Fixture Contracts

No-model tests are only valuable if their mocks describe the same contracts live providers must satisfy. This document defines fixture expectations for Codex, Claude Code, agent-core, agent-mux, transport-mux, hooks muxes, and babysitter-agent.

## Fixture Families

| Fixture family | Producer | Consumers | Required contents |
| --- | --- | --- | --- |
| Harness discovery | Babysitter CLI | Harness setup tests, docs snippets, CI summaries | Harness name, installed flag, capabilities, version when available, redacted paths |
| Codex transcript | Codex adapter or fixture generator | Agent-mux adapters, transport-mux, WebUI, babysitter-agent | Prompt, text deltas, final message, status, usage if safe, error envelope |
| Claude Code transcript | Claude Code adapter or fixture generator | Agent-mux adapters, transport-mux, WebUI, babysitter-agent | Prompt, text deltas, tool-call events, stop reason, final message, error envelope |
| Agent-core event stream | Agent-core tests | Transport-mux, babysitter-agent, agent-mux gateway | Session start, deltas, tool calls, cancellation, completion, usage, transport replay metadata |
| Run journal | Core SDK and babysitter-agent tests | Journal rebuild/repair, observer, docs reporting, babysitter-agent runtime | Run created, effect requested, task posted, run completed, artifact references |
| Babysitter plugin session | Agent-mux plugin/session tests | Agent-mux plugin E2E, hooks-mux, SDK run-loop checks | Plugin command text, originating agent, Babysitter run ID, terminal state, stop-hook evidence |
| Transport-mux route transcript | Transport-mux tests | Transport-mux route/codec tests, agent-mux launch tests, coverage summaries | Exposed transport, route, request class, status, response envelope, streaming flag, auth result, metrics delta, redaction status |
| Transport-mux launch/env artifact | Agent-mux launch tests | Agent-mux CLI, transport-mux runtime, pipeline summaries | Harness, provider, `proxyNeeded`, `proxyReason`, exposed transport, redacted proxy URL/token fields, changed env keys |
| Hook event | Hooks mux adapters | Hooks-mux CLI/core, agent-mux UI, plugin compiler | Normalized hook input, adapter raw input, expected normalized output |

## Contract Rules

- Fixtures must be JSON or JSONL unless a package requires a different canonical format.
- Every fixture must name its lane, provider/harness, schema version, and redaction status.
- Fixtures captured from live runs must be scrubbed before commit.
- Mock tests may assert against fixture shape and ordering, but not provider-specific incidental wording.
- Live model tests must periodically compare their event shape against the committed fixture schema.

## Redaction Requirements

Committed fixtures must not include:

- API keys or token file contents,
- absolute home-directory credential paths,
- full provider request payloads containing user secrets,
- raw environment dumps,
- unbounded model output from arbitrary prompts.

Fixtures may include:

- harness names,
- package versions,
- redacted path placeholders,
- sentinel prompt/output tokens,
- event type names,
- usage totals when provider policy allows it.

## Compatibility Checks

Each fixture family should have a contract test that verifies:

1. the fixture parses,
2. required metadata exists,
3. event ordering is valid,
4. no forbidden secret patterns are present,
5. at least one consumer test imports the fixture.

The first implementation slice should add these checks before adding new live tests, so model-backed output has a deterministic target to compare against.

## Live-To-Fixture Reconciliation

Every promoted model-backed scenario should either update or confirm a no-model fixture family.

| Live scenario | Fixture reconciliation |
| --- | --- |
| Codex sentinel prompt | Compare emitted event types and final message shape with Codex transcript fixture schema |
| Claude Code sentinel prompt | Compare text/tool/final event ordering with Claude Code transcript fixture schema |
| Transport-mux + external harness through agent-mux | Save redacted launch-plan, env diff, route transcript, stream metadata, and metrics snapshot; assert they can be replayed through transport-mux parser tests |
| Transport-mux + agent-core | Compare agent-core event sequence with the committed agent-core event stream fixture and include transport replay metadata |
| Babysitter-agent bounded process | Compare journal lifecycle with run journal fixture: create, effect, post, terminal state; confirm no installer commands were part of the runtime test |
| Babysitter plugin through agent-mux | Compare plugin command, agent-mux session events, Babysitter run ID, and stop-hook evidence with the plugin session fixture |
| Hooks mux live payload | Redact and replay payload through hooks-mux adapter normalizer tests |

A live test that cannot be reconciled to a fixture must explain why the behavior is inherently live-only before it can become release evidence.
