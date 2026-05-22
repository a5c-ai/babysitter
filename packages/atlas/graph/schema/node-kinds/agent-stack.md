# NodeKinds: Agent Stack

> Cluster 3 — Agent stack, plus the model-and-provider portion of Cluster 2 that the
> agent stack binds against. See [`README.md`](./README.md) for the full catalog and
> [`../../schema/meta-schema.md`](../../schema/meta-schema.md) for the standard node-kind file shape.

## Purpose

This file specifies the node kinds that describe a productized agent end-to-end: the
umbrella product, its versions, the three concrete stack implementations
(`AgentCoreImpl` / `AgentRuntimeImpl` / `AgentPlatformImpl`), the swappable
`CapabilityProfile`, the named-spawn-recipe `LaunchConfig`, and the persistence /
control-plane / structured-transport triple captured by `SessionModel`. It also
specifies `ModelFamily`, `ModelVersion`, and `Provider` so capability and cost claims
about the model the agent talks to are first-class graph nodes that other clusters can
reference.

The split between **product**, **version**, and the three **impl** layers reifies the
"agent core / runtime / platform" decomposition from the legacy stack as graph data
rather than prose, so capability, evidence, and edge claims can attach at the right
granularity. `CapabilityProfile` and `LaunchConfig` exist to capture two distinct kinds
of swap: `CapabilityProfile` swaps *which capabilities are exposed* on a given version,
`LaunchConfig` swaps *which model / env / proxy / profile* a spawn uses.

---

## NodeKind: `AgentProduct` (origin: `convergent`)

> **catalog pass 22 origin correction:** `AgentProduct` was previously tagged `universal`
> in `schema/ontology-schema.yaml`. Reclassified to `convergent` in catalog pass 22 — the
> atlas framing of a productized "agent product" (Claude Code, Codex, Cursor, …) is
> a cross-vendor convergent shape rather than a universal computer-science
> primitive. See `REMODEL-NOTES.md` (catalog pass 22 hygiene).

The umbrella for a productized agent (Claude Code, Codex, …) — versionless identity.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `agent:<slug>`, e.g. `agent:claude-code`. |
| `displayName` | string | yes | Human-readable product name. |
| `vendor` | string | yes | Publisher (e.g., `Anthropic`, `OpenAI`). |
| `homepageUrl` | url | yes | **Evidence-bound at vendor-doc-or-better.** |
| `primarySurface` | enum<cli,ide-extension,web,sdk,tui> | yes | The dominant surface the product ships. |
| `supportTier` | enum<catalog-backed,adapter-only,none> | yes | How the atlas catalog supports this product. |
| `productKind` | enum<full-cli-agent,ide-extension-agent,web-agent,sdk,app-server,headless-runtime,transport-bridge,multi-surface-suite> | yes | What kind of product this is (distinct from `primarySurface`). `full-cli-agent` = full 4-layer chat-loop CLI/TUI agent. `sdk` = programmatic library (core+runtime only). `app-server` = JSON-RPC service (core+runtime+platform, no UI). `transport-bridge` = headless adapter relaying to a remote agent. `headless-runtime` = process orchestrator without a chat-loop. |
| `stackScope` | enum<full,core-runtime-platform,core-runtime,core-only> | yes | Which agent-stack layers are included. Drives expected `composed_of` arity on AgentVersions: `full` = 4 entries (core/runtime/platform/ui); `core-runtime-platform` = 3 entries (no UI); `core-runtime` = 2 entries (SDK); `core-only` = 1 entry. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `has_version` | `AgentVersion` | 1:N | All versions of the product. |
| `composed_of` | `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` | 1:N | Carries `role` enum. |
| `bundled_with` | `Presentation` | 1:N | E.g., Claude Code bundles a TUI. |
| `accepts_plugin` | `Plugin` | N:N | Inverse of `installs_into`. |

### Evidence

`homepageUrl` is evidence-bound at **vendor-doc-or-better** — the catalog must be able
to point at a vendor-controlled URL for the product. `vendor` is descriptive and not
evidence-bound, but conflicts with vendor-doc evidence are flagged by the validator.

### Invariants

1. `id` MUST start with the `agent:` prefix.
2. Every `AgentProduct` MUST have at least one `AgentVersion` connected via `has_version`.
3. `composed_of` MUST include at least one node of role `core`, one of role `runtime`,
   and one of role `platform` once the product has any `AgentVersion`.

---

## NodeKind: `AgentVersion`

A version of an `AgentProduct`. Capability claims, hook surfaces, install methods, and
launch configs all bind to versions, never to the umbrella product.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `agent-version:<slug>@<range>`, e.g. `agent-version:claude-code@1.x`. |
| `agentProductId` | ref<`AgentProduct`> | yes | The product this versions. |
| `versionRange` | versionRange | yes | **Evidence-bound at vendor-doc-or-better.** |
| `releasedAt` | iso-date | yes | First release date in this range. |
| `deprecatedAt` | iso-date | no | Set when version is officially deprecated. |
| `eolAt` | iso-date | no | End-of-life date. |
| `cliCommand` | string | yes | **Evidence-bound.** The CLI invocation, e.g. `claude`. |
| `installMethods` | list<ref<`InstallMethod`>> | yes | At least one. |
| `minSchemaVersion` | semver | no | Minimum atlas catalog schema version this version targets. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `version_of` | `AgentProduct` | N:1 | Inverse of `has_version`. |
| `supports` | `Capability` | N:N | Carries `versionRange`, `level`, `note`. |
| `emits_hook` | `HookSurface` | N:N | Carries `since`. |
| `realizes` | `Layer` | N:N | Which stack layers this version reifies. |
| `sourced_from` | `SourceRef` | N:1 | Upstream source-of-truth pointer. |

Per-version capability bindings happen via `supports` to `Capability`, with
`CapabilitySupport` (see [`capabilities.md`](./capabilities.md)) used when a richer
n-ary record is needed.

### Evidence

- `versionRange` and `cliCommand` are **evidence-bound at vendor-doc-or-better**: only
  vendor-attributable sources can fix the version range or the CLI entrypoint.
- `releasedAt` / `deprecatedAt` / `eolAt` are evidence-bound at vendor-doc-or-better.

### Invariants

1. `agentProductId` MUST resolve.
2. `deprecatedAt` (when present) MUST be ≥ `releasedAt`; `eolAt` (when present) MUST
   be ≥ `deprecatedAt`.
3. Every `AgentVersion` MUST have at least one `installMethods` entry.
4. The triple of `AgentCoreImpl` / `AgentRuntimeImpl` / `AgentPlatformImpl` referencing
   this version MUST exist if any capability claim cites a stack layer.

---

## NodeKinds: `AgentCoreImpl`, `AgentRuntimeImpl`, `AgentPlatformImpl`

Concrete implementations of the core/runtime/platform parts of an `AgentVersion`. Real agents are
layered: an agent product has an *agent-core* (the loop and transport-client), an
*agent-runtime* (built-in tools, hook sockets, session state, sandbox primitive), and an
*agent-platform* (extensions, marketplaces, channels, profiles, presentations,
identity). Capabilities, nuances, specs, interactions, filesystem conventions, and
format conventions live at *specific* sub-module levels — not on the umbrella
`AgentVersion`. The attribute slots below reify that decomposition.

### NodeKind: `AgentCoreImpl` (origin: `convergent`)

> **catalog pass 22 origin correction:** previously `universal`; reclassified to
> `convergent`. The atlas *Impl naming convention and the chat-loop / process-
> orchestrator split is a atlas-specific framing of a convergent industry pattern
> rather than a universal primitive. See `REMODEL-NOTES.md` (catalog pass 22 hygiene).

Concrete loop + context-management + transport-client implementation.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `agent-core-impl:claude-code.core@1.x`. |
| `displayName` | string | yes | Human-readable. |
| `agentVersionId` | ref<`AgentVersion`> | yes | The version this implementation belongs to. |
| `packageRef` | ref<`SourceRef`\|`ProcessDescriptor`> | yes | Where the implementation lives. |
| `loopIteratorPolicy` | enum<react-style,plan-execute,tool-use-loop,custom,delegated-to-remote,server-managed,process-function-driven> | yes | **Evidence-bound.** How the iterator advances turns. `process-function-driven` = body is a user-authored async `process(inputs, ctx)` function (e.g. babysitter). |
| `loopIteratorNotes` | markdown | no | Concrete prose describing how the loop iterates (which stop reason, when compaction fires, what triggers a turn boundary). Complements the enum. |
| `contextManagementStrategy` | enum<rolling-summary,hierarchical,none,platform-managed,delegated-to-remote,server-managed,user-managed> | yes | **Evidence-bound.** `user-managed` = process body owns context; no global window. |
| `compactionTriggerThresholdTokens` | int | no | Token threshold that triggers compaction (when applicable). |
| `compactionTriggerNotes` | markdown | no | Concrete prose describing how/when compaction fires (e.g. "PreCompact hook at ~70% fill"). |
| `subagentInvokerPolicy` | enum<nested-loop,tool-call-handoff,platform-mediated,delegated-to-remote,not-applicable,process-task-driven> | yes | **Evidence-bound.** How subagents are invoked. `process-task-driven` = subagents are `ctx.task(...)` calls in the process body. |
| `subagentInvokerNotes` | markdown | no | Concrete prose describing the subagent invocation mechanism (e.g. "Task tool", "handoff event", "ADK sub_agents"). |
| `resultSynthesisPolicy` | enum<model-direct,post-processed,delegated-to-remote,server-managed,process-function-defined> | yes | **Evidence-bound.** `process-function-defined` = return value of `process()`. |
| `resultSynthesisNotes` | markdown | no | Concrete prose describing how the final response is emitted (e.g. "stream final text + Stop hook"; "response.completed event"). |
| `stopDetectionStrategy` | enum<model-stop-token,structured-end-event,platform-mediated,delegated-to-remote,process-function-completion> | yes | **Evidence-bound.** `process-function-completion` = process resolves/throws to indicate stop. |
| `transportClientLibrary` | string | yes | E.g. `@anthropic-ai/sdk`, `openai-python`. |
| `supportedTransportProtocols` | list<ref<`ModelTransportProtocol`>> | yes | At least one. |
| `parallelToolCallHandling` | enum<native,sequentialized,unsupported,delegated-to-remote,not-supported> | yes | **Evidence-bound.** |
| `streamingFidelity` | enum<text-only,text-and-tool-args,full,partial> | yes | **Evidence-bound.** |
| `thinkingChannelHandling` | enum<passthrough,summarized,dropped,model-dependent,delegated-to-remote,not-supported> | yes | **Evidence-bound.** |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `composes` | `AgentProduct` | N:1 | Inverse of `composed_of`; carries `role: core`. |
| `realizes` | `Layer` | N:N | Which stack layers this impl reifies. |
| `depends_on` | `TransportClientLibrary` | N:1 | The SDK/client library used. |
| `speaks` | `ModelTransportProtocol` | N:N | Wire protocols the core speaks. |

#### Invariants

1. `agentVersionId` MUST resolve to an `AgentVersion`.
2. `packageRef` MUST resolve to a `SourceRef` (or `ProcessDescriptor`).
3. The `composes` edge MUST carry `role: core`.
4. `supportedTransportProtocols` MUST be non-empty.

---

### NodeKind: `AgentRuntimeImpl` (origin: `convergent`)

> **catalog pass 22 origin correction:** previously `universal`; reclassified to
> `convergent`. Same atlas *Impl rationale as `AgentCoreImpl` above.

Concrete runtime: built-in tools, hook sockets, session-state, sandbox primitive.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `agent-runtime-impl:claude-code.runtime@1.x`. |
| `displayName` | string | yes | Human-readable. |
| `agentVersionId` | ref<`AgentVersion`> | yes | The version this implementation belongs to. |
| `packageRef` | ref<`SourceRef`\|`ProcessDescriptor`> | yes | Where the implementation lives. |
| `builtInTools` | list<ref<`ToolDescriptor`>> | yes | The canonical tools the runtime ships. |
| `toolRegistryDiscovery` | enum<static-bundled,dynamic-config,dynamic-extension-loaded,not-applicable> | yes | **Evidence-bound.** |
| `hookSockets` | list<ref<`HookSurface`>> | yes | Hook events the runtime exposes downward to extensions and upward to the platform. |
| `internalSessionStateLocation` | string | yes | **Evidence-bound.** E.g. `~/.claude/projects/<hash>/`. |
| `sessionFileFormat` | enum<jsonl,sqlite,json,jsonl-tree,delegated-to-remote,jsonl-with-sqlite-index,event-sourced-jsonl> | yes | **Evidence-bound.** `event-sourced-jsonl` = journal of effects; one event per JSONL entry. |
| `sessionFilePathConvention` | string | yes | **Evidence-bound.** Path glob template. |
| `approvalGatingPrimitive` | enum<per-call,per-tool-class,session-default,none,delegated-to-remote,server-managed,policy-engine> | yes | **Evidence-bound.** `policy-engine` = pluggable rule engine evaluating breakpoint events (e.g. babysitter `packages/sdk/src/breakpoints/`). |
| `subprocessSandboxStrategy` | enum<none,wrapped-shell,container,sandboxed-syscall,platform-deferred,invocation-mode,native-sandbox,process-isolation> | yes | **Evidence-bound.** `process-isolation` = each subagent in its own subprocess + working directory. |
| `runtimeIdentity` | enum<per-instance-keypair,platform-attested,none,delegated-to-remote,api-key,github-token,host-process> | yes | `host-process` = runs as a Node.js (or similar) process on the operator's host. |
| `supportedMCPTransports` | list<ref<`MCPTransport`>> | yes | May be empty. |
| `supportsStreaming` | bool | yes | **Evidence-bound.** Distinct from the platform's perception of streaming. |
| `subagentDispatchMechanism` | enum<task-tool,handoff,sub_agents-array,agent-as-tool,none,subprocess-task> | no | How the runtime dispatches subagents. `task-tool` = Anthropic Claude Code Task tool ([docs.anthropic.com][cc-sub]). `handoff` = OpenAI Agents SDK handoff primitive ([openai.github.io/openai-agents-python][oai-sdk]). `sub_agents-array` = Google ADK `sub_agents=[...]` declarative composition ([google.github.io/adk-docs][adk]). `agent-as-tool` = OpenAI `agent.as_tool()` (peer agent invoked as a tool). `subprocess-task` = subagents spawn harness subprocesses (kind:agent subtasks); each runs in its own OS subprocess + workdir + journal (e.g. babysitter `ctx.task`). `none` = runtime has no subagent dispatch primitive. See `capability:supports-subagent-dispatch`. (Optional during introduction; Phase-2 backfill flips to required.) |
| `subagentChildSessionPolicy` | enum<none,ephemeral-child-session,persistent-child-session,inline-no-child-session> | no | catalog pass 45. How subagent dispatch handles child sessions. `none` = runtime has no subagent dispatch. `inline-no-child-session` = subagent runs inline in parent's session (e.g. tool-call style). `ephemeral-child-session` = subagent gets a fresh child session that ends when subagent returns (e.g. claude-code's Task tool). `persistent-child-session` = child session survives across multiple subagent invocations (e.g. babysitter long-lived agent subprocesses). |
| `subagentToolScopePolicy` | enum<inherit-parent,explicit-allowlist,fresh-defaults,none> | no | catalog pass 45. Whether subagents inherit the parent's tool permissions (`inherit-parent`), require an explicit allowlist (`explicit-allowlist`), get fresh defaults independent of parent (`fresh-defaults`), or n/a (`none`). |

[cc-sub]: https://docs.anthropic.com/en/docs/claude-code/sub-agents
[oai-sdk]: https://openai.github.io/openai-agents-python/
[adk]: https://google.github.io/adk-docs/

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `composes` | `AgentProduct` | N:1 | Inverse of `composed_of`; carries `role: runtime`. |
| `realizes` | `Layer` | N:N | |
| `exposes` | `HookSurface` | N:N | Mirrors `hookSockets`. |
| `bundles` | `ToolDescriptor` | N:N | Mirrors `builtInTools`. |
| `connects` | `MCPTransport` | N:N | Mirrors `supportedMCPTransports`. |
| `speaks` | `MCPTransport` | N:N | Legacy alias for `connects`. |

#### Invariants

1. `agentVersionId` MUST resolve to an `AgentVersion`.
2. `packageRef` MUST resolve to a `SourceRef` (or `ProcessDescriptor`).
3. The `composes` edge MUST carry `role: runtime`.
4. `sessionFileFormat` MUST be consistent with `internalSessionStateLocation`.

---

### NodeKind: `AgentPlatformImpl` (origin: `convergent`)

> **catalog pass 22 origin correction:** previously `universal`; reclassified to
> `convergent`. Same atlas *Impl rationale as `AgentCoreImpl` above.

Concrete platform: extensions, marketplace, profiles, channels, launch configs,
identity, presentations, interaction primitives.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `agent-platform-impl:claude-code.platform@1.x`. |
| `displayName` | string | yes | Human-readable. |
| `agentVersionId` | ref<`AgentVersion`> | yes | The version this implementation belongs to. |
| `packageRef` | ref<`SourceRef`\|`ProcessDescriptor`> | yes | Where the implementation lives. |
| `nativeExtensionFormat` | enum<claude-plugin,cursor-extension,codex-extension,gemini-extension,opencode-acp,none,gh-copilot-plugin,omp-plugin,openclaw-plugin,pi-plugin,a5c-plugin,babysitter-plugin> | yes | `babysitter-plugin` = claude-plugin-compatible shape with `commands/`, `hooks/`, `skills/` and SDK harness adapters. |
| `nativeExtensionManifestPath` | string | no | E.g. `.claude-plugin/plugin.json`. |
| `nativeExtensionsDirectoryPath` | list<string> | no | E.g. `~/.claude/plugins/`, `.claude/plugins/`. |
| `skillFormat` | enum<anthropic-skill-md,cursor-rule,continue-prompt,none,agents-md> | yes | **Evidence-bound.** |
| `skillsDirectoryPath` | list<string> | no | |
| `customSlashCommandsPath` | list<string> | no | |
| `subagentsDirectoryPath` | list<string> | no | For products that load subagents from filesystem. E.g. `.claude/agents/`, `~/.claude/agents/`. |
| `subagentDefinitionFormat` | enum<claude-code-md,none,js-module-export> | no | Format the platform loads user-defined (custom) subagent definitions from. `claude-code-md` = Anthropic Claude Code `.claude/agents/<name>.md` Markdown-with-YAML-frontmatter format ([docs.anthropic.com][cc-sub]). `js-module-export` = exported `defineTask(...)` from a JS/TS module (e.g. babysitter). `none` = platform has no on-disk custom-subagent loader (e.g. OpenAI Agents SDK and Google ADK express subagent composition in code rather than via definition files). See `capability:supports-custom-subagents`. (Optional during introduction; Phase-2 backfill flips to required.) |
| `hooksDirectoryOrConfigPath` | list<string> | no | |
| `settingsFiles` | list<string> | yes | E.g. `~/.claude/settings.json`. |
| `marketplaceUrl` | url | no | **Evidence-bound.** |
| `pluginRegistryPath` | string | no | |
| `capabilityProfileRegistry` | bool | yes | Does this platform support profile switching. |
| `launchConfigRegistry` | bool | yes | Does this platform have named launch configs. |
| `platformIdentityStrategy` | enum<oauth-keychain,api-key,service-account,github-token,none,delegated-to-invocation-mode,github-oauth,delegated-to-harness> | yes | **Evidence-bound.** `delegated-to-harness` = auth lives in whichever harness adapter is configured. |
| `updateChannelMechanism` | enum<npm,binary-download,extension-store,none,gh-extension,in-app-updater,pip> | yes | |
| `supportedChannelKinds` | list<ref<`ChannelKind`>> | yes | Channel kinds the platform brokers. |

> **catalog pass 42 clean-break:** `presentationsBundled` and `interactionPrimitivesSupported`
> have been removed from `AgentPlatformImpl` and moved to the new `AgentUIImpl` layer.
> The platform layer no longer owns user-facing UI bundling; `AgentUIImpl` is the 4th
> agent-stack layer and owns presentations bundled with the product plus the
> interaction primitives the user can invoke.

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `composes` | `AgentProduct` | N:1 | Inverse of `composed_of`; carries `role: platform`. |
| `realizes` | `Layer` | N:N | |
| `exposes` | `AgentHostTransport` | N:N | Host transports the platform exposes. |
| `loads` | `NativeExtension` \| `Skill` \| `Subagent` | N:N | |
| `brokers` | `Channel` | N:N | |

#### Invariants

1. `agentVersionId` MUST resolve to an `AgentVersion`.
2. `packageRef` MUST resolve to a `SourceRef` (or `ProcessDescriptor`).
3. The `composes` edge MUST carry `role: platform`.

---

### NodeKind: `AgentUIImpl` (origin: `convergent`)

> Added in catalog pass 42. Refines the agent stack to a 4-layer model
> (core / runtime / platform / ui). Owns the user-facing UI layer (TUI, CLI, web
> shell, IDE extension), the presentations bundled with the product, and the
> interaction primitives the user can invoke (slash commands, command palette,
> model picker, prompt input, etc.).

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `agent-ui-impl:claude-code.ui@current`. |
| `displayName` | string | yes | Human-readable. |
| `agentVersionId` | ref<`AgentVersion`> | yes | The version this UI implementation belongs to. |
| `packageRef` | ref<`SourceRef`\|`ProcessDescriptor`> | yes | Where the UI implementation lives. |
| `uiKind` | enum<tui-only,cli-only,tui-and-cli,web,ide-extension,mobile-app,multi-surface,headless> | yes | High-level shape of the UI layer. `headless` = no UI (e.g. SDK/library or pure process orchestrator like babysitter); the agent is consumed programmatically only. |
| `presentationsBundled` | list<ref<`Presentation`>> | no | TUI / IDE-extension / web etc. Empty for `headless`. |
| `keybindingsConfigPath` | list<string> | no | E.g., `~/.claude/keybindings.json`. |
| `themeSupport` | enum<none,light-dark,full-customizable> | no | Mirrors `Presentation.themeSupport` for the bundled UI. |
| `accessibilitySupport` | enum<none,basic,wcag-aa,wcag-aaa> | no | |
| `notes` | markdown | no | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `bundled_with` | `Presentation` | N:N | Mirrors `presentationsBundled`. |
| `supports_interaction_primitive` | `InteractionPrimitive` | N:N | catalog pass 45: replaces the former flat `interactionPrimitivesSupported` attribute. Carries edge attributes `mechanism` (tool-call / slash-command / keybinding / ui-control / mcp-tool / native-api / deep-link / voice-command), optional `toolCallName`, optional `invocationToken`. |

#### Invariants

1. `id` MUST start with `agent-ui-impl:`.
2. If `uiKind != headless` then `presentationsBundled` MUST be non-empty.

---

## Modeling rule: capabilities at the right sub-module

Capability claims, format/path conventions, hook surfaces, and protocol-level facts
MUST attach to the sub-impl that physically realizes them — not to the umbrella
`AgentVersion`.

- **`AgentVersion`** carries: identity, version range, release / deprecated / EOL
  dates, install methods, CLI command, and *roll-up* capability claims that span all
  three sub-impls (e.g., a coarse "this version exists and ships"). It does NOT carry
  per-feature capability flags directly — those flags live on the sub-impl that
  physically realizes them.
- **`AgentCoreImpl`** carries: tool-use loop semantics, transport-client library,
  streaming fidelity, parallel-tool-call handling, thinking-channel handling,
  context-management strategy, subagent-invoker policy, stop-detection strategy.
- **`AgentRuntimeImpl`** carries: built-in tools, hook surfaces / sockets, session
  storage format and path conventions, approval-gating primitive, subprocess sandbox
  primitive, MCP transport support, runtime identity, runtime-side streaming.
- **`AgentPlatformImpl`** carries: native extension format, filesystem conventions for
  plugins / skills / commands / subagents / hooks / settings, marketplace URL, plugin
  registry, capability-profile registry, launch-config registry, platform identity
  strategy, update channel mechanism, channel brokering. (catalog pass 42: presentation
  bundling and the interaction-primitive set moved to `AgentUIImpl`.)
- **`AgentUIImpl`** carries: the user-facing UI layer (TUI, CLI, web, IDE extension),
  presentations bundled with the product, interaction primitives the user can invoke
  (slash commands, command palette, model picker, prompt input, ...), keybindings
  config path, theme/accessibility support at the UI layer.

When in doubt: ask "which sub-module physically implements this?" and put the attribute
there. `CapabilitySupport` records that previously bound to an `AgentVersion` for a
specific feature SHOULD be re-targeted at the sub-impl that realizes the feature
(examples: `capability:supports-mcp` → `AgentRuntimeImpl`,
`capability:supports-plugins` → `AgentPlatformImpl`,
`capability:parallel-tool-calls` → `AgentCoreImpl`,
`capability:can-resume` → `AgentPlatformImpl` (backed by runtime session-format),
`capability:supports-thinking` → `AgentCoreImpl`).

---

## NodeKind: `CapabilityProfile`

A swappable bundle of capability overrides applied on top of an `AgentVersion`'s default
capability set.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `capability-profile:<slug>`, e.g. `capability-profile:cursor.default`. |
| `agentVersionId` | ref<`AgentVersion`> | yes | The version this profile applies to. |
| `displayName` | string | yes | Human-readable. |
| `default` | bool | yes | `true` for the version's default profile (exactly one per version). |
| `description` | markdown | yes | Why this profile exists. |
| `overrides` | map<ref<`Capability`>, capability-support-override> | yes | Per-capability override (`enabled`/`level`/`note`). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to_version` | `AgentVersion` | N:1 | Mirrors `agentVersionId`. |
| `requires_capability` | `Capability` | N:N | Capabilities that MUST be present on the host for the profile to be usable. |

### Invariants

1. Exactly one `CapabilityProfile` per `AgentVersion` has `default: true`.
2. Every key in `overrides` MUST be a `Capability` `id`.

---

## NodeKind: `LaunchConfig`

A named, preconfigured spawn recipe — the binding of (version, model, env, profile,
proxy, args) used when a host launches the agent.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `launch-config:<slug>`. |
| `agentVersionId` | ref<`AgentVersion`> | yes | Target version. |
| `displayName` | string | yes | Human-readable. |
| `model` | ref<`ModelVersion`> | no | Default model for spawns; absent means caller-chooses. |
| `env` | map<string,string> | yes | Environment variables (may be empty map). |
| `transportProxyId` | ref<`TransportProxy`> | no | Optional interposer. |
| `profileId` | ref<`CapabilityProfile`> | no | Defaults to the version's default profile. |
| `commArgs` | list<string> | yes | Argv-style additions for the spawn. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `runs_via` | `Execution` | N:1 | Optional pinning to an execution mode. |
| `requires_capability` | `Capability` | N:N | Capabilities the launch presumes. |

### Invariants

1. `profileId` (when present) MUST reference a `CapabilityProfile` whose
   `agentVersionId` matches this launch's `agentVersionId`.
2. `model` (when present) MUST reference a `ModelVersion` reachable from a `Provider`
   the version's runtime can talk to.

---

## NodeKind: `SessionModel`

The persistence / control-plane / structured-transport triple — how an `AgentVersion`
stores, controls, and structures conversational state across turns.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `session-model:<slug>`. |
| `agentVersionId` | ref<`AgentVersion`> | yes | The version this model describes. |
| `persistence` | enum<none,file,sqlite,in-memory> | yes | How sessions are persisted. |
| `controlPlane` | enum<self-managed,external-host,mcp-mediated> | yes | Who owns lifecycle. |
| `structuredTransport` | enum<none,restart-per-turn,persistent> | yes | Wire-level structure. |
| `sessionDir` | string | no | **Evidence-bound.** Where session files live (e.g. `~/.claude/projects/<hash>/`). |
| `canResume` | bool | yes | **Evidence-bound.** Whether a prior session can be resumed. |
| `canFork` | bool | yes | **Evidence-bound.** Whether a session can be forked. |
| `format` | enum<jsonl,sqlite,json,jsonl-tree,delegated-to-remote,jsonl-with-sqlite-index> | yes | On-disk format. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `state_machine_for` | `NodeKind` (Session) | N:1 | The state machine that governs this session model. |
| `requires_capability` | `Capability` | N:N | Capabilities the session model relies on. |

### Evidence

`sessionDir`, `canResume`, `canFork` are **evidence-bound at vendor-doc-or-better**.
These are vendor-observable behaviours and must be tied back to a vendor doc, source, or
attestation rather than community guesses.

### Invariants

1. If `persistence = none`, `canResume` MUST be `false` and `canFork` MUST be `false`.
2. If `structuredTransport = restart-per-turn`, the runtime MUST `realize` the relevant stack layer
   that documents per-turn restart.
3. `format` MUST be consistent with `persistence` (`sqlite` requires `format: sqlite`,
   `file` allows `jsonl` / `json` / `jsonl-tree`).

---

## NodeKind: `ModelFamily`

Family identity for a versioned line of models.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `model-family:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `vendor` | string | yes | E.g., `Anthropic`. |
| `homepageUrl` | url | yes | **Evidence-bound at vendor-doc-or-better.** |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `has_version` | `ModelVersion` | 1:N | Members of the family. |

---

## NodeKind: `ModelVersion`

A specific versioned model.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `model:<slug>`, e.g. `model:claude-opus-4-7`. |
| `modelFamilyId` | ref<`ModelFamily`> | yes | Owning family. |
| `versionRange` | versionRange | yes | **Evidence-bound.** |
| `kind` | enum<chat,reasoning,embedding,vision,audio,multimodal,code-completion,classification> | yes | **Evidence-bound.** Coarse functional class of the model. Distinguishes embedding / vision-only / classification variants from chat models. |
| `contextWindowTokens` | tokens | yes | **Evidence-bound at vendor-doc-or-better.** |
| `costPer1kInputTokens` | cost-per-million-tokens | yes | **Evidence-bound.** |
| `costPer1kOutputTokens` | cost-per-million-tokens | yes | **Evidence-bound.** |
| `supportsThinking` | bool | yes | **Evidence-bound.** |
| `thinkingEffortLevels` | list<enum<low,medium,high,max>> | no | **Evidence-bound.** |
| `supportsThinkingBudgetTokens` | bool | yes | **Evidence-bound.** |
| `modalities` | list<ref<`Modality`>> | yes | **Evidence-bound.** |
| `lifecycleStatus` | enum<preview,ga,deprecated,eol> | yes | **Evidence-bound at vendor-doc-or-better.** Current vendor-published lifecycle status. |
| `lifecycleStatusChangedAt` | iso-date | no | Date the most recent `lifecycleStatus` transition was published. |
| `knowledgeCutoffDate` | iso-date | no | **Evidence-bound at vendor-doc-or-better.** Vendor-published training-data knowledge cutoff. |
| `safetyTier` | string | no | **Evidence-bound at vendor-doc-or-better.** Vendor-specific safety / policy tier (e.g. Anthropic ASL-3, OpenAI safety category). Free-form string because vendor taxonomies diverge. |
| `modelCardUrl` | url | no | **Evidence-bound at vendor-doc-or-better.** Vendor-published model card. |
| `supportsFineTuning` | bool | no | **Evidence-bound.** Whether the vendor offers fine-tuning for this version. |
| `fineTuningKind` | enum<full,lora,adapter,none> | no | **Evidence-bound.** Kind of fine-tuning surface offered when `supportsFineTuning = true`. |
| `releaseDate` | iso-date | yes | First public availability. |
| `deprecationDate` | iso-date | no | Set on deprecation. |
| `eolDate` | iso-date | no | End-of-life. |
| `regions` | list<string> | yes | Where the model is available. |

> **Per-model capability bindings.** Capabilities such as `capability:parallel-tool-calls`,
> `capability:supports-thinking`, `capability:supports-prompt-caching`,
> `capability:supports-batch-api`, etc. bind to specific `(ModelVersion, versionRange)`
> tuples via `CapabilitySupport`. The `Capability` node already declares
> `appliesToNodeKinds` including `ModelVersion`; do NOT model these as boolean
> attributes on `ModelVersion`. This is what makes "parallel tool calls supported on
> Claude Sonnet 4.x but not Haiku 3.5" expressible without per-attribute proliferation.

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `version_of` | `ModelFamily` | N:1 | Inverse of `has_version`. |
| `served_by` | `Provider` | N:N | Carries `firstParty`, `regions`. |
| `speaks` | `ModelTransportProtocol` | N:N | Wire protocols the model speaks. |
| `has_modality` | `Modality` | N:N | Carries `direction`. |

### Invariants

1. `supportsThinkingBudgetTokens = true` requires `supportsThinking = true`.
2. `thinkingEffortLevels` (when non-empty) requires `supportsThinking = true`.
3. `eolDate` (when present) MUST be ≥ `deprecationDate` (when present) MUST be ≥
   `releaseDate`.
4. `lifecycleStatus = deprecated` requires `deprecationDate` to be set.
5. `lifecycleStatus = eol` requires `eolDate` to be set.
6. `fineTuningKind` (when set to a value other than `none`) requires
   `supportsFineTuning = true`.
7. `kind = embedding` MUST NOT have `supportsThinking = true` and SHOULD NOT carry
   `costPer1kOutputTokens` (embedding models are billed on input tokens only) — left
   informational; downstream validators MAY warn.

---

## NodeKind: `Provider`

Entity serving inference for one or more `ModelVersion`s.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `provider:<slug>`, e.g. `provider:anthropic`. |
| `displayName` | string | yes | Human-readable. |
| `versionRange` | versionRange | yes | API version range this record describes. |
| `authMethods` | list<enum<api-key,oauth,browser-login,service-account,iam,device-code,workload-identity,gcp-adc>> | yes | **Evidence-bound at vendor-doc-or-better.** |
| `authMethodNotes` | markdown | no | Non-obvious auth requirements (e.g. "Bedrock requires AWS credentials with `bedrock:InvokeModel` IAM permission"; "Vertex requires `gcloud auth application-default login` ADC plus a project with the publisher model enabled"). |
| `endpoints` | map<string,url> | yes | **Evidence-bound.** Named endpoints (e.g. `messages`, `completions`). |
| `pricing` | markdown | no | Free-form pricing notes; structured cost is on `ModelVersion`. |
| `pricingTiers` | list<map> | no | **Evidence-bound at vendor-doc-or-better.** Each entry: `{ name, rateLimit, priceMultiplier, description? }`. Captures free / pro / enterprise / batch / interactive / priority tiers. Multiplier is relative to the base per-model price (e.g. OpenAI Batch is `0.5`, Anthropic Priority Tier is `1.0` with reserved capacity). |
| `rateLimitSignalingProtocol` | markdown | no | **Evidence-bound at vendor-doc-or-better.** How the provider communicates rate-limit state — request/response headers, status codes, `Retry-After` semantics, error envelope shape. |
| `dataResidencyOptions` | list<string> | no | **Evidence-bound at vendor-doc-or-better.** Region or jurisdiction strings the provider exposes for data-residency compliance (e.g. `eu`, `us-only`, `region:us-east-1`). Distinct from `regions` which lists where the API is reachable; this lists where customer data is processed and stored. |
| `vendorFeatures` | list<ref<`Capability`>> | no | Vendor-specific features exposed by this provider beyond the wire-protocol baseline (e.g. `capability:supports-prompt-caching`, `capability:supports-batch-api`, `capability:supports-files-api`, `capability:supports-bedrock-guardrails`, `capability:supports-vertex-reasoning-engine`). Bindings happen via `CapabilitySupport` for richer per-version claims. |
| `slaTier` | string | no | **Evidence-bound at vendor-doc-or-better.** Vendor-published SLA tier (e.g. `aws-bedrock:99.9`, `anthropic:no-sla`, `openai:enterprise-99.9`). Free-form because vendor SLAs are not standardized. |
| `regions` | list<string> | yes | Available regions. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `serves` | `ModelVersion` | N:N | Inverse of `served_by`. |

### Invariants

1. `endpoints` MUST contain at least one entry.
2. Every `Provider` MUST be reachable from at least one `ModelVersion` via `served_by`.
3. Every entry in `pricingTiers` MUST carry a unique `name` within the provider.
4. Every ref in `vendorFeatures` MUST resolve to a `Capability` whose
   `appliesToNodeKinds` includes `Provider` or `ModelVersion`.

---

## NodeKind: `ProviderVersion`

A versioned release of a model provider's API (e.g. anthropic API
`>=2023-06-01`, openai chat-completions API). Lets capability-supports
be pinned to a provider version range rather than just the provider
entity.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `provider-version:<provider-slug>:<range-slug>`, e.g. `provider-version:anthropic:ge-0-0-0`. |
| `displayName` | string | yes | Human-readable label. |
| `providerId` | ref<`Provider`> | yes | Backing `Provider` entity. |
| `versionRange` | string | yes | Semver range. MUST be a valid semver range expression. |
| `releasedAt` | iso-date | no | Release date of the API version. |
| `description` | markdown | no | Free-form notes. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `supports` (incoming) | `Capability` | N:N | Per-version capability claims. |
| `version_of_provider` (outgoing) | `Provider` | N:1 | Identifies the backing provider. |

### Invariants

1. `id` MUST start with `provider-version:`.
2. `versionRange` MUST be a valid semver range.

---

## Examples

```yaml
- id: agent-version:claude-code@1.x
  agentProductId: agent:claude-code
  versionRange: ">=1.0.0 <2.0.0"
  releasedAt: "2025-02-24"
  cliCommand: "claude"
  installMethods:
    - install:npm
    - install:brew
  minSchemaVersion: "6.0.0"
  edges:
    version_of:
      - target: agent:claude-code
    supports:
      - target: capability:supports-thinking
        versionRange: ">=1.2.0 <2.0.0"
        level: full
        evidence: [evidence:anthropic-claude-code-thinking-2026-01]
      - target: capability:mcp-stdio
        versionRange: ">=1.0.0 <2.0.0"
        level: full
        evidence: [evidence:claude-code-docs-mcp]
    emits_hook:
      - target: hook-surface:pre-tool-use
        since: "1.0.0"
    sourced_from:
      - target: source-ref:claude-code-github
```

```yaml
- id: session-model:claude-code-default
  agentVersionId: agent-version:claude-code@1.x
  persistence: file
  controlPlane: self-managed
  structuredTransport: restart-per-turn
  sessionDir: "~/.claude/projects/<hash>/"
  canResume: true
  canFork: true
  format: jsonl
  edges:
    state_machine_for:
      - target: node-kind:session
    requires_capability:
      - target: capability:can-resume
      - target: capability:can-fork
```

## NodeKind: `HumanCheckpoint`

D4 (planner 2026-05-01). Explicit point at which a human is consulted by a Process / Skill / Subagent. Reified as a NodeKind because it carries two *independent* enum axes: `kind` (what is asked of the human) and `blockingPolicy` (how strictly the loop blocks while waiting). Not collapsible to a single enum.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `human-checkpoint:pre-merge-review`. |
| `displayName` | string | yes | Human-readable label. |
| `kind` | enum<approval,review,escalation,edit> | yes | What the human is asked to do. |
| `blockingPolicy` | enum<hard,soft,advisory> | yes | How the loop treats the checkpoint: `hard`=blocks until response; `soft`=blocks with timeout; `advisory`=continues, records the response asynchronously. |
| `description` | markdown | yes | One-paragraph description of when and why the checkpoint fires. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `uses_checkpoint` (incoming) | `Skill` \| `Subagent` \| `Process` \| `ProcessDescriptor` → `HumanCheckpoint` | N:N | Declares the consumer surfaces the checkpoint. |

---

## NodeKind: `ResumeToken`

D4 (planner 2026-05-01). Primitive for async resumption of a paused / interrupted run — typically issued at a `HumanCheckpoint` and redeemed by a later invocation that continues the run. `ttl` and `scope` are real attribute axes; medium confidence per planner.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `resume-token:default-run-scope`. |
| `displayName` | string | yes | Human-readable label. |
| `ttl` | duration | no | Time-to-live before the resume token expires. |
| `scope` | enum<run,session,workspace> | no | Lifetime / scope of the token. |
| `description` | markdown | yes | One-paragraph description of where this resume-token shape is used. |

---

## Enum-extension: `AgentControlVerb` (D2)

Added 2026-05-01 (D2). Values: `interrupt`, `abort`, `cancel`, `pause`, `resume`, `yield`, `checkpoint`. Applied as `supportedAgentControlVerbs: list<AgentControlVerb>` on `AgentRuntimeImpl` and `AgentHostTransport`. Reviewer confirmed enum is correct shape — uniform attribute shape across instances; not a NodeKind.

## Enum-extension: `OutputFormat` (D3, demoted from NodeKind)

Added 2026-05-01 (D3). Values: `json-mode`, `strict-json-schema`, `grammar-constrained`, `regex-constrained`, `structured-call`, `xml`, `free-text`, `code-fence`. Applied as `supportedOutputFormats: list<...>` on `AgentVersion`. Demoted from a proposed NodeKind because all instances share the uniform `kind+description+supportedBy` shape — collapses cleanly per the 2026-04-29 A.3 Modality / A.5 Hook collapse precedent.

## Enum-extension: `IOSurface` (D6, demoted from NodeKind)

Added 2026-05-01 (D6). Values: `filesystem`, `clipboard`, `browser-dom`, `desktop-a11y-tree`, `mobile-a11y-tree`, `terminal-shell`, `voice`, `camera`, `microphone`. Applied as `ioSurfaceKinds: list<...>` on `AgentRuntimeImpl`. Demoted from a proposed NodeKind because instances had only `kind+description` (uniform shape). Distinct from `Presentation` which captures the shell experience; this enum captures the protocol-level I/O surface the runtime can drive.

## Enum-extension: `AgentMemory` (D9, demoted from NodeKind)

Added 2026-05-01 (D9). Values: `conversation-buffer`, `summarized-history`, `vector-recall`, `knowledge-graph`, `prompt-cache`, `tool-state`. Applied as `agentMemoryKinds: list<...>` on `AgentRuntimeImpl`. Demoted from a proposed NodeKind because instances had only `kind+description` (uniform shape) — mirrors the A.3 Modality collapse.

---

## Slash-command provenance (InteractionPrimitive)

D-bonus.slashCommandProvenance (planner 2026-05-01). InteractionPrimitive `id` slugs of `kind=slash-command` SHOULD include provenance namespacing (e.g. `interaction-primitive:babysitter.call`, `interaction-primitive:claude-code.compact`). A V-rule may emit a *warn* when a `kind=slash-command` primitive lacks a `<vendor>.<name>` prefix in its slug. This keeps cross-product slash-command catalogs disambiguable when the same surface name (e.g. `/init`) is shipped by multiple platforms.

## Streaming-pattern (InteractionPattern, low priority)

D-bonus.streamingPattern (planner 2026-05-01, low priority). Streaming behavior of an `InteractionPattern` is described via reference to `streamEventKinds` on the underlying transport(s) rather than a dedicated edge. If a dedicated edge proves necessary in a future pass, it would be `streaming_pattern: InteractionPattern -> streamEventKinds enum-attribute`.

---

## catalog pass 18 additions — Workflow and launch contract

### NodeKind: `WorkflowDefinition` (origin: `convergent`)

#### Purpose

A **`WorkflowDefinition`** is a repo-versioned `WORKFLOW.md` artifact with structured
front-matter (tracker binding, active states, agent executable). Distinct from
generic `ProcessDescriptor` because identity is file-on-disk plus front-matter,
not a catalog entity declared in YAML. Babysitter/Symphony reads these files to
drive agent invocation.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `workflow:<repo-slug>/<file-path-slug>`. |
| `path` | string | yes | Repo-relative path of the `WORKFLOW.md` file. |
| `displayName` | string | yes | Front-matter title. |
| `trackerBinding` | map<trackerId,projectId,boardId> | yes | Issue tracker the workflow targets. |
| `activeStates` | list<string> | yes | Tracker states the workflow watches as "ready to dispatch". |
| `agentExecutable` | string | yes | Agent CLI invoked (e.g., `claude`, `codex`, `opencode`). |
| `description` | markdown | optional | Front-matter description body. |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `targets_tracker` | `IssueTracker` | N:1 | Mirrors `trackerBinding`. |
| `invokes_agent` | `AgentVersion` | N:N | Agent versions the workflow may invoke. |

#### Invariants

1. `id` MUST start with `workflow:`.
2. `path` MUST end in `WORKFLOW.md` or `WORKFLOW.<slug>.md`.

---

### NodeKind: `LaunchContract` (origin: `convergent`)

#### Purpose

A **`LaunchContract`** combines Symphony's `LaunchContract` + `SessionStartupContract`
+ `TurnTimeouts` into a single spawn-shape descriptor: command, cwd, line-size cap,
turn/response timeouts, thread-creation mode. Distinct from `AgentRuntimeImpl`
(which is the *runtime descriptor*) — `LaunchContract` is the *spawn recipe*.
Distinct from `LaunchConfig` (which is a per-agent saved recipe instance);
`LaunchContract` is the schema/shape contract.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `launch-contract:<slug>`. |
| `displayName` | string | yes | |
| `command` | list<string> | yes | argv vector to spawn. |
| `cwd` | string | yes | Working directory token (may include placeholders). |
| `maxLineSizeBytes` | int | optional | Max line size for line-framed I/O. |
| `responseTimeoutMs` | int | optional | Per-response timeout. |
| `turnTimeoutMs` | int | optional | Per-turn timeout. |
| `startupTimeoutMs` | int | optional | Session-startup deadline. |
| `threadCreationMode` | enum<single-thread,thread-per-turn,thread-per-session,pool> | yes | |
| `userInputRequiredPolicy` | enum `UserInputRequiredPolicy` | optional | How `turn_input_required` errors are handled. Values include `breakpoint-mediated` = user input gathered via breakpoint task that pauses the run. |
| `appliesTo` | ref `AgentRuntimeImpl` | yes | Runtime this contract is for. |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to_runtime` | `AgentRuntimeImpl` | N:1 | Mirrors `appliesTo`. |

#### Invariants

1. `id` MUST start with `launch-contract:`.
2. If `turnTimeoutMs` and `responseTimeoutMs` both set, `responseTimeoutMs <= turnTimeoutMs`.

---

## Related

- [`README.md`](./README.md) — full node-kind catalog and cluster index.
- [`capabilities.md`](./capabilities.md) — `Capability`, `CapabilitySupport`,
  `Modality`, `InstallMethod` referenced throughout.
- [`extensions-plugins.md`](./extensions-plugins.md) — `Plugin` / `Subagent` /
  `ToolServer` that target an `AgentVersion`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — edge specs for `has_version`,
  `composed_of`, `supports`, `served_by`, `speaks`, `emits_hook`, `sourced_from`.
- [`../../schema/evidence-model.md`](../../schema/evidence-model.md) — evidence-binding rules cited
  in this file.

