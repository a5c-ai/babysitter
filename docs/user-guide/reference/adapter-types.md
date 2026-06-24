---
title: Adapter Types
description: The full taxonomy of all 20 adapter package types — what each is and where each is used.
category: reference
last_updated: 2026-06-23
---

[Docs](../index.md) › [Reference](./index.md) › Adapter Types

# Adapter Types: the full taxonomy

**"Adapters" is a FAMILY, not one thing.** There are 20 adapter package directories under `packages/adapters/`, each with a distinct responsibility. This page enumerates all of them — what each one is and where it is used — so you can reason about the family precisely instead of treating "adapters" as a single black box.

> The runtime story lives in the [Adapters feature guide](../features/adapters.md); the host-side command surface lives in the [Adapters CLI reference](./adapters-cli.md); the introductory tour lives in the [adapters ecosystem page](../ecosystem/adapters.md). This page is the **enumeration**.

---

## On this page

- [Adapters is a family, not one thing](#adapters-is-a-family-not-one-thing)
- [The 20 adapter types](#the-20-adapter-types)
- [The umbrella package](#the-umbrella-package)
- [Honest notes on thin packages](#honest-notes-on-thin-packages)
- [Next steps](#next-steps)

---

## Adapters is a family, not one thing

Each adapter package isolates one concern. Spawning a session, normalizing hooks across harnesses, bridging model providers, parking a durable breakpoint, and compiling a plugin manifest are all *different jobs* — and each lives in its own package so it can evolve independently. The unifying idea: every integration surface is defined once (in the [Atlas](../ecosystem/atlas.md) catalog) and multiplexed to many targets through generated code. The family keeps its name because it multiplexes for **all** agents, not just genty.

---

## The 20 adapter types

| # | Subdir | Package | What it is | Where used |
|---|--------|---------|------------|------------|
| 1 | `triggers/` | `@a5c-ai/triggers-adapter` | "Trigger glue for running any coding agent from CI." Normalizes GitHub/GitLab/Bitbucket/webhook payloads into one event shape, enriches GitHub events (changed files, diffs), and evaluates compact trigger queries before launching adapters. Bin `triggers` (`evaluate`, `enrich`). | **CI / GitHub Actions entrypoint.** Reusable action at `packages/adapters/triggers/action.yml`; invocation modes `non-interactive` / `bridged-hooks` / `bridged-interactive`. Referenced by many workflows (agent-dispatch, agent-review-dispatch, issue-triage-dispatch, …). |
| 2 | `extensions/` | `@a5c-ai/extensions-adapter` | "Cross-harness plugin compiler — compiles a single `plugin.json` manifest into 9 AI coding agent plugin formats." CLI `compile` / `validate` / `init` / `list-targets`. | Compiles the unified plugin source (`plugins/babysitter-unified`) into per-harness bundles in CI. Targets: claude-code, codex, cursor, gemini, github-copilot, pi, oh-my-pi, opencode, openclaw. |
| 3 | `config/` | `@a5c-ai/config-adapter` | Install, config, auth, and **host-detection** logic (extracted from `adapters-cli`). | Used by the adapters launcher/CLI to install agents and detect the host environment. |
| 4 | `launch/` | `@a5c-ai/launch-adapter` | Spawn/lifecycle orchestration, **PTY bridge**, signal handling, completion engine (extracted from `adapters-cli`). | The runtime that actually spawns a harness session (`adapters launch`, `--with-proxy-if-needed`). |
| 5 | `channels/` | `@a5c-ai/channels-adapter` | An MCP-server mini-framework turning external systems (GitHub/Jira/webhooks) into a Claude Code **channel** via declarative YAML: polling, dedup, filters, opaque HMAC `reply` relay, per-event session spawning. | Connects external event sources to agent sessions; backed by `@a5c-ai/adapters` for session spawning. |
| 6 | `codecs/` | `@a5c-ai/adapters-codecs` | "Built-in agent adapters" — the per-harness codec implementations: claude, claude-agent-sdk, codex, codex-sdk, codex-websocket, gemini, copilot, cursor, opencode, opencode-http, pi, pi-sdk, omp, openclaw, hermes, amp, droid, qwen, plus remote `adapters`. | The concrete harness drivers used by the dispatch layer. |
| 7 | `hooks/` | `@a5c-ai/hooks-adapter-cli` (cli) · `@a5c-ai/hooks-adapter-core` (core) | "Universal hooks proxy system" normalizing lifecycle hooks across 9 harnesses into a single canonical event model. Core defines canonical schemas, the session store, and a merge engine for concurrent state. | The **MANDATORY-STOP / lifecycle enforcement** layer that makes obedience work cross-harness. Plugin hooks shell out to the global `@a5c-ai/hooks-adapter-cli`. |
| 8 | `gateway/` | `@a5c-ai/adapters-gateway` | "Gateway package for remote and browser-facing adapters surfaces." `GatewayConfig` + `createGateway(config)` start/stop handle; per the v6 announcement the gateway server handles auth, cloud bootstrap, and workspace inventory. | Remote/browser access to adapters sessions; consumed by webui/cloud surfaces. |
| 9 | `proxy/` | `adapters-proxy` (Python) | A lightweight Python service bridging LLM **transport protocols** via LiteLLM — accept one wire format (Anthropic / OpenAI-Responses / Google GenerateContent) and forward to any of **140+ providers** (Bedrock, Vertex, Ollama, Groq, …). | Spawned on demand by `adapters launch --with-proxy-if-needed` (or run persistently) to free vendor-locked harnesses from a single backend. |
| 10 | `transport/` | `@a5c-ai/transport-adapter` | "Published transport/proxy runtime seam used by the adapters launcher and related runtime consumers." | The runtime seam the launcher uses to bridge harness ↔ proxy/transport; the tools adapter builds on its codecs. |
| 11 | `observability/` | `@a5c-ai/adapters-observability` | "Structured logging and telemetry primitives for adapters." | Logging / telemetry across the adapters runtime. |
| 12 | `harness-mock/` | `@a5c-ai/adapters-harness-mock` | "Mock harness simulator for testing adapters — simulates claude-code, codex, and other CLI harnesses." Subprocess / SDK / HTTP / WebSocket mocks. | Test fixtures for adapters/codecs (mocks were moved out of codecs into this package). |
| 13 | `core/` | `@a5c-ai/comm-adapter` | "Agent communication adapter — event streaming, hooks, sessions." The public Node core runtime package. | Foundation re-exported by `@a5c-ai/adapters`; event/session/hook plumbing. |
| 14 | `cli/` | `@a5c-ai/adapters-cli` | "CLI runtime for adapters" — the `adapters` command (`adapters install <agent>`, `adapters launch`, …). | The user-facing adapters CLI; canonical agent-install path. See [Adapters CLI reference](./adapters-cli.md). |
| 15 | `sdk/` | `@a5c-ai/adapters` | "Unified dispatch layer for local CLI-based AI coding agents." Meta-package re-exporting comm-adapter + codecs + cli. | The convenient one-install entry for the whole family; the "agent multiplexer" in the stack. |
| 16 | `tasks/` | `@a5c-ai/tasks-adapter` | "Serverless breakpoint multiplexing system with pluggable backends and cryptographic signing"; the README calls it a "breakpoint routing library, MCP server, and CLI for responder-driven review flows." This is the v6 **Breakpoints Adapter** (former `breakpoints-pro`). Backends: GitHub Issues (durable) and server-based. | The durable, serverless-ready **human-in-the-loop breakpoint** mechanism — survives cold starts; how a process pauses for human approval. See [Breakpoints](../features/breakpoints.md). |
| 17 | `tools/` | `@a5c-ai/tools-adapter` | "Tool lifecycle layer: registry, dispatch, schema translation, hook bridging on top of transport-adapter codecs." ToolRegistry, ToolDispatcher (glob/policy mapping), schema translation, ToolHookBridge (PreToolUse / PostToolUse). | Tool resolution + translation between harnesses; bridges tool dispatch to the hooks lifecycle. |
| 18 | `skills/` | _(no package.json)_ | Migrated skills directory; currently holds the single `integrate-harness` skill. | Repo skill assets for the adapters workspace. **(Thin — a single skill present.)** |
| 19 | `processes/` | _(no package.json)_ | Imported `.a5c/processes` workflows & plans (e.g. `advanced-uis-*`, `babysitter-parity.js`). | Babysitter process definitions used to build/extend the adapters/UI surfaces. |
| 20 | `docker/` | _(no package.json)_ | Migrated Docker assets — `Dockerfile.adapters-cli`, `e2e/` compose setup. | Containerized adapters-cli + E2E compose for the family. |

> A `meta/` directory also exists (family-level docs/config/GitHub metadata migrated from the old standalone adapters repo). It is repo plumbing rather than a 21st adapter type, so it is noted here for completeness only.

---

## The umbrella package

`@a5c-ai/adapters` (#15, the `sdk/` directory) re-exports `comm-adapter` (#13), `adapters-codecs` (#6), and `adapters-cli` (#14). It is the one-install front door for the family. The `core/`, `cli/`, `sdk/`, `proxy/`, `tasks/`, and `harness-mock/` packages were consolidated from a formerly standalone adapters repository.

---

## Honest notes on thin packages

A few entries are deliberately marked thin so this page does not overstate the family:

- `skills/` (#18) currently contains a single skill (`integrate-harness`).
- `processes/`, `docker/` (#19, #20) are migrated asset directories, not published npm packages (no `package.json`).
- `gateway/` (#8) wording ("package … for remote and browser-facing surfaces") suggests a partial/scaffold surface relative to the runtime packages.

---

## Next steps

- **The runtime story:** [Adapters feature guide](../features/adapters.md)
- **The command surface:** [Adapters CLI reference](./adapters-cli.md)
- **The introductory tour:** [adapters ecosystem page](../ecosystem/adapters.md)
- **Where it sits in the whole:** [Architecture & How It Fits Together](../architecture.md)
