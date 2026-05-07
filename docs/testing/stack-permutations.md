---
title: Stack Permutations
description: Valid E2E stack combinations for Babysitter SDK, babysitter-agent, agent-mux, transport-mux, hooks-mux, and agent-core.
last_updated: 2026-05-07
---

# Stack Permutations

The test strategy must treat the stack as modular. A valid E2E does not need every layer, and some layer combinations are invalid even if the names sound related.

## Layer Map

| Layer | Package or surface | Owns | Does not own |
| --- | --- | --- | --- |
| Core Babysitter SDK | `packages/sdk`, `babysitter run:*`, `task:*`, `hook:*`, `plugin:*` | Event-sourced runs, task effects, process state, generic plugin registry, SDK harness install commands | Model session UI, agent-mux adapter registry, provider transport implementation |
| SDK harness setup | `babysitter harness:install`, `babysitter harness:install-plugin` | Installing external harness CLIs where supported and installing Babysitter harness plugins | `babysitter-agent` runtime behavior |
| Babysitter-agent runtime | `packages/babysitter-agent` runtime CLI | Runtime orchestration UX, model-backed planning/execution, agent-core path, agent-mux bridge for external harness invocation | Harness plugin installation and setup commands |
| Agent-mux core | `packages/agent-mux/core`, `@a5c-ai/agent-mux` | Adapter registry, `createClient().run`, sessions, workspaces, plugin manager, runtime hooks, provider/model config | Babysitter run journal ownership |
| Agent-mux adapters | `packages/agent-mux/adapters` | Per-agent spawn/programmatic adapters, capabilities, session parsing, adapter plugin APIs when supported | Generic Babysitter process orchestration |
| Transport-mux | `packages/transport-mux` | Carrying local/remote/programmatic event streams and cancellation across transport boundaries | Installing harnesses or plugins |
| Hooks-mux | `packages/hooks-mux/*` | Normalizing raw hook payloads and merge/policy behavior across harnesses | Agent-mux runtime hook dispatch and SDK stop-hook iteration policy |
| Agent-core | `packages/agent-core` | Programmatic model session backend and tool-call loop used by internal/runtime paths | External harness plugin installation |
| Agent-plugins-mux | `packages/agent-plugins-mux` | Plugin target discovery and plugin target contracts | Runtime session execution |

## Primary E2E Paths

| Path | Entry point | Required setup | What it proves | What it must not claim |
| --- | --- | --- | --- | --- |
| SDK run-loop E2E | `babysitter run:create`, `run:iterate`, `task:post` | Fixture process and optional mocked hooks | Process state, effects, journal replay, stop-hook continuation | Provider or external harness behavior |
| SDK harness/plugin setup E2E | `babysitter harness:install`, `babysitter harness:install-plugin` | Temporary workspace and installer fixtures or real installer runner | Harness install delegation, plugin installer package behavior, idempotent manifests | `babysitter-agent` runtime correctness |
| Agent-mux adapter/session E2E | `amux run <agent>` or `createClient().run({ agent })` | Adapter fixtures or real agent CLI and credentials | Adapter events, session lifecycle, model/provider config, runtime hooks | Babysitter process journal correctness unless a plugin invokes Babysitter |
| Agent-mux plugin E2E | `amux plugin ...` or `client.plugins.*` where adapter supports plugins | Adapter with `supportsPlugins`, plugin manifest/marketplace fixture or real plugin target | Agent-native plugin install/list/uninstall and plugin event behavior | Universal plugin support across all agents |
| Babysitter plugin through agent-mux E2E | Agent-mux starts an external harness session after the Babysitter harness plugin is installed | Harness-specific Babysitter plugin installed by SDK installer or native plugin path, then `amux run <agent>` | The plugin command such as `/babysitter:call` creates a Babysitter run, completes it, and hook/stop behavior is visible from the harness session | `babysitter-agent` install/setup behavior |
| Babysitter-agent runtime E2E | `babysitter-agent` runtime commands | Preinstalled or mocked model backend; no setup command inside the test | Runtime planning/orchestration, selected backend, run lifecycle, task posting, agent-core or agent-mux bridge behavior | Harness plugin installation |
| Transport-mux E2E | Transport harness around agent-mux or agent-core streams | Local transport fixture or real session stream | Stream framing, reconnect, cancellation, timeout, backpressure | Plugin install behavior |
| Hooks-mux E2E | Hook adapter CLI/core normalizer | Raw hook payload fixtures or redacted live payloads | Hook normalization, merge policy, fail-open/fail-closed behavior | Agent-mux session lifecycle by itself |

## Capability-Gated Adapter Matrix

| Agent or harness | Agent-mux adapter mapping | Current plugin-manager expectation | Runtime-hook expectation | Valid live permutations |
| --- | --- | --- | --- | --- |
| `claude-code` / `claude` | `claude-code` maps to `claude` | Valid where the Claude adapter exposes plugin APIs | Native/runtime hook coverage including stop hook is valid | Agent-mux session, agent-mux plugin manager, Babysitter plugin through agent-mux, babysitter-agent external-harness bridge |
| `codex` | `codex` maps to `codex` | Capability-gated; current Codex adapter reports `supportsPlugins: false`, so do not require agent-mux `client.plugins.*` for Codex | Runtime hook fixtures are valid; live plugin manager install is not assumed | Agent-mux session, SDK harness plugin installer, Babysitter plugin through Codex only after installer/native plugin support is proven, babysitter-agent external-harness bridge |
| `gemini-cli` / `gemini` | `gemini-cli` maps to `gemini` | Capability-gated by adapter | Runtime hook fixture first, live after adapter support is proven | Agent-mux session and SDK installer smoke; plugin E2E only after capability proof |
| `agent-core` | Not an agent-mux external harness mapping | No harness plugin install | Programmatic event hooks through owning layer only | Babysitter-agent internal/programmatic runtime, transport-mux with agent-core stream |
| `pi` | Intentionally not agent-mux in babysitter-agent mapping | SDK plugin installer may exist, but runtime path is direct/agent-core-like | Do not route through agent-mux bridge | Direct SDK/babysitter-agent path only |
| `babysitter` adapter in agent-mux | Agent-mux can target Babysitter as an adapter | Babysitter plugin manager is generic SDK plugin registry, not external harness plugin install | Adapter parses Babysitter event output | Agent-mux consuming Babysitter output; separate from babysitter-agent runtime setup |

## Invalid Combinations

| Invalid combination | Why it is invalid |
| --- | --- |
| Babysitter-agent E2E that starts with `babysitter harness:install` or `harness:install-plugin` | That tests SDK harness setup, not babysitter-agent runtime behavior |
| Agent-mux plugin-manager test that requires Codex plugin install without checking `supportsPlugins` | Current Codex adapter reports plugin manager support as false |
| Transport-mux test that asserts plugin installation | Transport-mux carries streams; it does not install plugins |
| Hooks-mux fixture that claims full agent-mux session coverage | Hooks-mux normalizes hook payloads; agent-mux owns session lifecycle |
| Agent-core path routed through agent-mux external-harness mapping | The babysitter-agent map explicitly excludes `agent-core` and `pi` from agent-mux external harness mapping |
| `/babysitter:call` plugin smoke that only checks final assistant text | It must assert Babysitter run ID, run events, terminal state, and hook evidence |

## Minimum Permutation Set

The rebuilt strategy should implement these before claiming broad E2E coverage:

| ID | Lane | Stack | Required evidence |
| --- | --- | --- | --- |
| P1 | No-model | SDK run loop + mocked stop hook | `run:create`, pending task, `task:post`, `run:iterate`, completed proof, hook log |
| P2 | No-model | SDK harness installer + plugin installer dry-runs | JSON install plan, plugin target, idempotency fixture |
| P3 | No-model | Agent-mux core + mock adapter + runtime hooks | `session_start`, prompt/input, `session_end`, stop-hook decision fixture |
| P4 | No-model | Agent-mux PluginManager + plugin-capable adapter fixture | list/install/uninstall/update behavior and capability errors for non-plugin agents |
| P5 | No-model | Transport-mux + fixture event stream | stream framing, cancellation, timeout, reconnect artifact |
| P6 | No-model | Hooks-mux raw payload fixtures | normalized stop/session/tool events and merge-policy artifact |
| P7 | Model-backed | Babysitter-agent + agent-core backend | created run, planned task, posted result, terminal state, redacted model trace |
| P8 | Model-backed | Babysitter-agent + external harness bridge | `babysitter-agent call/invoke`, agent-mux mapped session events, terminal result, no install steps |
| P9 | Model-backed | Agent-mux + Claude + Babysitter plugin | harness/plugin precondition evidence, `amux run claude`, `/babysitter:call`, Babysitter run completion, stop-hook evidence |
| P10 | Model-backed/capability-gated | Agent-mux + Codex + Babysitter plugin | Only enabled after plugin install support is proven; otherwise assert skip reason from capability gate |
| P11 | Model-backed | Transport-mux + agent-core or external-harness stream | live stream carried over transport, cancellation/timeout behavior, redacted provider metadata |

Each implementation slice should name which permutation IDs it covers. If a job covers only setup, it should not be labeled as runtime E2E.
