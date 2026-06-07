---
title: Stack Permutations
description: Valid E2E stack combinations for Babysitter SDK, agent-platform, adapters, transport-adapter, hooks-adapter, and genty-core.
last_updated: 2026-05-07
---

# Stack Permutations

The test strategy must treat the stack as modular. A valid E2E does not need every layer, and some layer combinations are invalid even if the names sound related.

## Layer Map

| Layer | Package or surface | Owns | Does not own |
| --- | --- | --- | --- |
| Core Babysitter SDK | `packages/babysitter-sdk`, `babysitter run:*`, `task:*`, `hook:*`, `plugin:*` | Event-sourced runs, task effects, process state, generic plugin registry, SDK harness install commands | Model session UI, adapters adapter registry, provider transport implementation |
| SDK harness setup | `babysitter harness:install`, `babysitter harness:install-plugin` | Installing external harness CLIs where supported and installing Babysitter harness plugins | `agent-platform` runtime behavior |
| Babysitter-agent runtime | `packages/genty/platform` runtime CLI | Runtime orchestration UX, model-backed planning/execution, genty-core path, adapters bridge for external harness invocation | Harness plugin installation and setup commands |
| Adapters core | `packages/adapters/core`, `@a5c-ai/adapters` | Adapter registry, `createClient().run`, sessions, workspaces, plugin manager, runtime hooks, provider/model config | Babysitter run journal ownership |
| Adapters adapters | `packages/adapters/adapters` | Per-agent spawn/programmatic adapters, capabilities, session parsing, adapter plugin APIs when supported | Generic Babysitter process orchestration |
| Transport-adapter | `packages/transport-adapter` | Harness-facing provider protocol routes, local proxy runtime lifecycle, proxy auth, runtime env injection, passthrough forwarding, streaming/non-streaming response shape, cancellation, timeout, and metrics/cache visibility | Installing harnesses/plugins, normalizing hooks, owning Babysitter journals, or proving adapters adapter/session semantics without a consumer |
| Hooks-adapter | `packages/adapters/hooks/*` | Normalizing raw hook payloads and merge/policy behavior across harnesses | Adapters runtime hook dispatch and SDK stop-hook iteration policy |
| Agent-core | `packages/genty/core` | Programmatic model session backend and tool-call loop used by internal/runtime paths | External harness plugin installation |
| Agent-plugins-adapter | `packages/extensions-adapter` | Plugin target discovery and plugin target contracts | Runtime session execution |

## Primary E2E Paths

| Path | Entry point | Required setup | What it proves | What it must not claim |
| --- | --- | --- | --- | --- |
| SDK run-loop E2E | `babysitter run:create`, `run:iterate`, `task:post` | Fixture process and optional mocked hooks | Process state, effects, journal replay, stop-hook continuation | Provider or external harness behavior |
| SDK harness/plugin setup E2E | `babysitter harness:install`, `babysitter harness:install-plugin` | Temporary workspace and installer fixtures or real installer runner | Harness install delegation, plugin installer package behavior, idempotent manifests | `agent-platform` runtime correctness |
| Adapters adapter/session E2E | `adapters run <agent>` or `createClient().run({ agent })` | Adapter fixtures or real agent CLI and credentials | Adapter events, session lifecycle, model/provider config, runtime hooks | Babysitter process journal correctness unless a plugin invokes Babysitter |
| Adapters plugin E2E | `adapters plugin ...` or `client.plugins.*` where adapter supports plugins | Adapter with `supportsPlugins`, plugin manifest/marketplace fixture or real plugin target | Agent-native plugin install/list/uninstall and plugin event behavior | Universal plugin support across all agents |
| Babysitter plugin through adapters E2E | Adapters starts an external harness session after the Babysitter harness plugin is installed | Harness-specific Babysitter plugin installed by SDK installer or native plugin path, then `adapters run <agent>` | The plugin command such as `/babysitter:call` creates a Babysitter run, completes it, and hook/stop behavior is visible from the harness session | `agent-platform` install/setup behavior |
| Babysitter-agent runtime E2E | `agent-platform` runtime commands | Preinstalled or mocked model backend; no setup command inside the test | Runtime planning/orchestration, selected backend, run lifecycle, task posting, genty-core or adapters bridge behavior | Harness plugin installation |
| Transport-adapter E2E | `adapters-proxy`, `startTransportMuxRuntime`, `applyTransportMuxToHarnessEnv`, or `adapters launch --with-proxy*` | Local route fixture, genty-core stream, or adapters external-harness launch that needs a proxy bridge | Route/codec contract, proxy auth, env injection, launch proxy decision, streaming/non-streaming response shape, cancellation, timeout, passthrough, metrics/cache artifacts | Plugin install, harness install, hook normalization, or Babysitter run lifecycle by itself |
| Hooks-adapter E2E | Hook adapter CLI/core normalizer | Raw hook payload fixtures or redacted live payloads | Hook normalization, merge policy, fail-open/fail-closed behavior | Adapters session lifecycle by itself |

## Transport-Adapter Valid Permutations

Transport-adapter is the carrier/proxy seam between a harness-facing protocol and a target provider/runtime. It can be tested alone with local fixtures, or as a bridge started by adapters launch, but it is not a plugin manager, harness installer, hook adapter, or Babysitter run owner.

| Permutation | Lane | Entry point | Required assertions |
| --- | --- | --- | --- |
| Package route/codec fixture | No-model | `createTransportMuxApp` or `adapters-proxy` with fixture engine | `/health`, `/v1/models`, `/metrics`, `/cache/stats`, `/v1/count_tokens`, `/v1/messages`, `/v1/chat/completions`, `/v1/responses`, `/v1beta/models/*`, `/v1/projects/*`, `/converse`, `/models/chat/completions`, and `/passthrough/*` return the expected protocol shapes and errors |
| Runtime env bridge | No-model | `startTransportMuxRuntime` and `applyTransportMuxToHarnessEnv` | `ADAPTERS_PROXY_BASE_URL`, `ADAPTERS_PROXY_AUTH_TOKEN`, and provider-specific base URL/API key variables are injected only for the exposed transport, with token values redacted in artifacts |
| Adapters launch decision | No-model | `resolveLaunchPlan` and launch dry-run fixtures | Native provider, proxy forced, proxy if-needed, and proxy forbidden cases produce the expected `proxyNeeded`, `proxyReason`, and exposed transport |
| genty-core stream through transport | No-model and model-backed | Agent-core event stream consumed through transport-adapter | Fixture or live deltas, final event, cancellation, timeout, and usage metadata survive transport framing |
| External harness through adapters proxy | Model-backed | `adapters launch <harness> <provider> --with-proxy` or `--with-proxy-if-needed` | Real Codex/Claude-compatible harness traffic uses the local proxy URL, emits a redacted launch plan, and completes a sentinel stream |
| Passthrough provider bridge | No-model first, model-backed only when justified | `/passthrough/*` with configured `apiBase` | Path/query/body forwarding, auth propagation, upstream failure mapping, and timeout behavior are visible without leaking provider secrets |

## Capability-Gated Adapter Matrix

| Agent or harness | Adapters adapter mapping | Current plugin-manager expectation | Runtime-hook expectation | Valid live permutations |
| --- | --- | --- | --- | --- |
| `claude-code` / `claude` | `claude-code` maps to `claude` | Valid where the Claude adapter exposes plugin APIs | Native/runtime hook coverage including stop hook is valid | Adapters session, adapters plugin manager, Babysitter plugin through adapters, agent-platform external-harness bridge |
| `codex` | `codex` maps to `codex` | Capability-gated; current Codex adapter reports `supportsPlugins: false`, so do not require adapters `client.plugins.*` for Codex | Runtime hook fixtures are valid; live plugin manager install is not assumed | Adapters session, SDK harness plugin installer, Babysitter plugin through Codex only after installer/native plugin support is proven, agent-platform external-harness bridge |
| `gemini-cli` / `gemini` | `gemini-cli` maps to `gemini` | Capability-gated by adapter | Runtime hook fixture first, live after adapter support is proven | Adapters session and SDK installer smoke; plugin E2E only after capability proof |
| `genty-core` | Not an adapters external harness mapping | No harness plugin install | Programmatic event hooks through owning layer only | Babysitter-agent internal/programmatic runtime, transport-adapter with genty-core stream |
| `pi` | Intentionally not adapters in agent-platform mapping | SDK plugin installer may exist, but runtime path is dire../core-like | Do not route through adapters bridge | Direct S../platform path only |
| `babysitter` adapter in adapters | Adapters can target Babysitter as an adapter | Babysitter plugin manager is generic SDK plugin registry, not external harness plugin install | Adapter parses Babysitter event output | Adapters consuming Babysitter output; separate from agent-platform runtime setup |

## Invalid Combinations

| Invalid combination | Why it is invalid |
| --- | --- |
| Babysitter-agent E2E that starts with `babysitter harness:install` or `harness:install-plugin` | That tests SDK harness setup, not agent-platform runtime behavior |
| Adapters plugin-manager test that requires Codex plugin install without checking `supportsPlugins` | Current Codex adapter reports plugin manager support as false |
| Transport-adapter test that asserts plugin installation | Transport-adapter carries harness-facing provider traffic; SDK harness setup or adapters plugin APIs own plugin installation |
| Transport-adapter test that runs `babysitter harness:install` | Harness install belongs to SDK harness setup, not the proxy runtime |
| Transport-adapter test that asserts hook normalization | Hooks-adapter owns hook payload normalization; transport-adapter may only carry traffic adjacent to a hook-emitting harness |
| Transport-adapter test that claims Babysitter run completion by itself | Babysitter SDK or agent-platform owns run creation, task posting, and terminal journal state |
| Hooks-adapter fixture that claims full adapters session coverage | Hooks-adapter normalizes hook payloads; adapters owns session lifecycle |
| genty-core path routed through adapters external-harness mapping | The agent-platform map explicitly excludes `genty-core` and `pi` from adapters external harness mapping |
| `/babysitter:call` plugin smoke that only checks final assistant text | It must assert Babysitter run ID, run events, terminal state, and hook evidence |

## Minimum Permutation Set

The rebuilt strategy should implement these before claiming broad E2E coverage:

| ID | Lane | Stack | Required evidence |
| --- | --- | --- | --- |
| P1 | No-model | SDK run loop + mocked stop hook | `run:create`, pending task, `task:post`, `run:iterate`, completed proof, hook log |
| P2 | No-model | SDK harness installer + plugin installer dry-runs | JSON install plan, plugin target, idempotency fixture |
| P3 | No-model | Adapters core + mock adapter + runtime hooks | `session_start`, prompt/input, `session_end`, stop-hook decision fixture |
| P4 | No-model | Adapters PluginManager + plugin-capable adapter fixture | list/install/uninstall/update behavior and capability errors for non-plugin agents |
| P5 | No-model | Transport-adapter route/codec fixture | supported route matrix, auth failure, invalid JSON, count_tokens supported/unsupported, streaming and non-streaming response artifacts |
| P5a | No-model | Transport-adapter runtime env bridge + adapters launch decision | redacted env diff, proxy config, `proxyNeeded`/`proxyReason`, forced/if-needed/native/forbidden cases |
| P6 | No-model | Hooks-adapter raw payload fixtures | normalized stop/session/tool events and merge-policy artifact |
| P7 | Model-backed | Babysitter-agent + genty-core backend | created run, planned task, posted result, terminal state, redacted model trace |
| P8 | Model-backed | Babysitter-agent + external harness bridge | `agent-platform call/invoke`, adapters mapped session events, terminal result, no install steps |
| P9 | Model-backed | Adapters + Claude + Babysitter plugin | harness/plugin precondition evidence, `adapters run claude`, `/babysitter:call`, Babysitter run completion, stop-hook evidence |
| P10 | Model-backed/capability-gated | Adapters + Codex + Babysitter plugin | Only enabled after plugin install support is proven; otherwise assert skip reason from capability gate |
| P11 | Model-backed | Transport-adapter + genty-core stream | live or credential-gated genty-core deltas carried over transport-adapter, cancellation/timeout behavior, redacted provider metadata |
| P12 | Model-backed | Adapters external harness + transport-adapter proxy | `adapters launch` starts transport-adapter, harness uses proxy env, sentinel stream completes, metrics snapshot and redacted launch plan are uploaded |
| P13 | No-model | Adapters hooks + hooks-adapter bridge for `claude-code`, `codex`, `pi` | `adapters hooks add/handle`, `a5c-hooks-adapter invoke`, normalized phase evidence, no Babysitter SDK calls, no provider credentials |
| P14 | No-model | Pipeline-owned stack matrix across `adapters-mocks` and real-agent CLI shims for `claude`, `codex`, `pi`, and `gemini` | `adapters install --dry-run`, profile-backed launch/run, transport-adapter mock-model request evidence, and optional hooks-adapter normalized phase artifact from `no_model_mock_matrix` |

Each implementation slice should name which permutation IDs it covers. If a job covers only setup, it should not be labeled as runtime E2E.

## Agent-Adapter Live Install Modes

The live external-harness matrix has two valid adapters paths:

| Mode | Valid targets | Installer responsibility | Prompt responsibility | Lifecycle responsibility |
| --- | --- | --- | --- | --- |
| `babysitter-plugin` | `claude-code` via `claude`, `codex`, `gemini-cli` via `gemini`, `pi` | `adapters install <target>` installs or verifies the harness CLI; the local Babysitter SDK and generated Babysitter plugin package are installed before launch | The launch prompt is a Babysitter command, for example `/babysitter:call ...` | Must prove Babysitter run creation, effects, journals/task artifacts, native stop hook execution, hooks-adapter normalization, adapters session, transport trace, and provider trace |
| `vanilla` | `claude`, `codex`, `gemini`, `pi`, `babysitter` | `adapters install <target>` only | The launch prompt is a normal non-Babysitter sentinel prompt | Must prove adapters session/launch, transport trace, and provider trace; it must not claim plugin-driven external-harness hook coverage; agent-platform rows may additionally assert genty-core-backed Babysitter runtime evidence when required |

These are different integration paths. `babysitter-plugin` validates plugin-mediated Babysitter lifecycle behavior through an external harness; `vanilla` validates the same adapters install/launch/provider path without Babysitter plugin setup.
