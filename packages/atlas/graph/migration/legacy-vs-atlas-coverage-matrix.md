# Legacy `agent-catalog` graph vs atlas `graph` — coverage matrix

catalog pass 90 audit. Source of truth for the migration team: which fields of the
legacy graph at `packages/agent-catalog/graph/` (consumed by the babysitter
monorepo's adapter generators) are carried by the atlas graph at
`C:/work/v6/graph/` and which need adapter logic / backfill.

The legacy SDK (`packages/agent-catalog/src/sdk.ts`) exposes the canonical
projection accessors. Each row below corresponds to one accessor and the
adapter/sdk consumer that calls it.

## Inventory snapshot

| Metric | Legacy `agent-catalog/graph/` | atlas `graph/` |
| --- | --- | --- |
| YAML/JSON files | 86 | 1698 |
| Top-level subdirs | nodes/, edges/, schema/ (3) | 18 cluster dirs |
| NodeKinds | 26 (single ontology-schema.yaml) | ~110 (per `schema/node-kinds/*.yaml`) |
| AgentVersion records | 11 | 28 |
| ModelVersion records | 8 (in `models.yaml`) | 49 |
| PluginTarget records | 9 (one multi-doc file) | 17 |
| HookSurface records | 14 | 28 (file count) |
| HookMapping records | 37 | 38 |

## Per-consumer projection table

| Consumer (file) | Legacy SDK accessor | NodeKinds touched | atlas coverage | Bucket |
| --- | --- | --- | --- | --- |
| `adapters/core/src/host-detection.ts` | `getHostSignalMap`, `getHostMetadataFields`, `getHostDetectionRules` | `DiscoverySignal` (scope=host-detection) | covered — atlas has 10 host-env DiscoverySignals under `extensions/discovery-signals/` with `metadataFields` + `consumer: agent-comm-adapter` | (e) shape |
| `adapters/core/src/invocation.ts` | `getHarnessImages`, `lookupHarnessImage` | `PluginArtifact` filtered to `artifactKind=container-image` | partial — atlas has `PluginArtifact` instances but no `artifactKind=container-image` rows; legacy projection synthesizes `HarnessImageEntry` from artifact path + installerSurface | (a) missing data |
| `hooks-adapter/core/src/discovery/detector.ts` | `getHooksMuxDetectionRules` | `DiscoverySignal` (scope=hooks-adapter) | **closed (catalog pass 92)** — 10 atlas DiscoverySignal rows scoped `hooks-adapter` under `extensions/discovery-signals/*-hooks-adapter*.yaml` (verbatim from legacy `discovery-signals-hooks.yaml`); schema gained `hooks-adapter` scope, `all-present-with-absences` matchMode, and `absentSignals` field | covered |
| `extensions-adapter/src/targets/index.ts` | `listPluginTargetDescriptors`, `getPluginTargetDescriptor`, `getHookNameMap` | `PluginTarget`, `HookMapping` | shape-divergent — atlas PluginTargets have `manifestPath`, `installLayout` (object with concrete keys: manifest/commands/agents/skills/hooks/mcp), `distribution` array, `adapterFamily`, `description`. Legacy descriptor needs: `targetId`, `adapterName`, `pluginRootEnvVar`, `pluginRootEnvVarForExtension`, `manifestFormat` (string token like "plugin.json + openclaw.plugin.json"), `commandFormat`, `skillHandling`, `hookRegistrationFormat`, `scriptVariants`, `distribution` (string), `distributionModel`, `marketplacePath`, `npmPublishable`, `installLayout.{harnessHomeRelative, pluginsDirRelative, marketplacePathRelative}`, `packageMetadata.{moduleType, binScriptExt, installLifecycle, activationMessage, extraPackageFiles, extraScripts, peerDependencyPackage, emitCjsWrappers}`, `componentSupport.{agents, context}` | (b) missing fields (8+ field-level) + (e) shape divergence |
| `sdk/src/harness/discovery.ts` + `adapterFallbackMetadata.ts` | `getFallbackHarnessMetadata`, `listFallbackHarnessMetadata`, `listAgentVersions`, `getAgentVersion` | `AgentVersion`, HarnessFallbackMetadata projection | **consumer-adapter-required (catalog pass 92, path-b)** — atlas keeps the data normalized across AgentVersion + DiscoverySignal[host-detection] + SessionModel + Capability; the bundle is rebuilt by `agent-catalog/src/data.ts :: buildFallbackMetadata` (already a projection in legacy too — it never loaded a bundled record). Adapter spec frozen in `migration/projection-adapters.md` § 5. | covered (via consumer adapter) |
| `adapters/core/tests/invocation.contract.test.ts` | (consumes harnessImages above) | — | — | — |
| `catalog/src/app/api/...` | `listCatalogAgents`, `searchCatalogDiscovery` (process catalog) | `ProcessDescriptor`, `PackageSurface`, `PathDescriptor`, agent listings | covered for ProcessDescriptor (atlas has 24 records under `extensions/process-descriptors/`); agents covered as AgentVersion | (e) shape minor |

## Bucket totals (per consumer)

| Bucket | Count | Detail |
| --- | --- | --- |
| (a) missing data | 0 (catalog pass 92: closed hooks-adapter DiscoverySignal rows; catalog pass 91 closed container-image) |
| (b) missing fields | 0 (catalog pass 92: closed `absentSignals` on DiscoverySignal + scope `hooks-adapter` enum; catalog pass 91 closed PluginTarget 10-field set) |
| (c) missing edge kind/instance | 0 | every legacy edge kind has a atlas analogue (legacy `targets_plugin_surface` → atlas `hosted_by`/`composes`) |
| (d) id-pattern divergence | high (~26 NodeKinds) | legacy uses `pluginTarget:codex`, `path:.a5c-runs`, `agentVersion:claude-code-1` etc.; atlas uses `plugin-target:codex`, `agent:claude-code`, `agent-version:claude-code@1.x`. Every NodeKind ID prefix differs (camelCase + `:` legacy vs kebab-case + `:` atlas, plus `@semver` suffix on versions). |
| (e) shape divergence | 4 | PluginTarget projection (flat-vs-nested), HarnessFallbackMetadata bundle vs AgentRuntimeImpl/CoreImpl/PlatformImpl normalization, host-metadata-field embedding (legacy `Record<agent, HostMetadataField[]>` vs atlas per-DiscoverySignal `metadataFields`), HooksMuxDetectionRule bundle |

## Migration-readiness verdict: **COMPLETE** (after catalog pass 92)

catalog pass 92 closed the two catalog pass 91 residuals: (1) hooks-adapter-scope DiscoverySignal
rows + `absentSignals` field/scope-enum extension; (2) HarnessFallbackMetadata
adapter spec frozen (path-b: keep atlas normalized, adapter lives in
`agent-catalog/src/data.ts`). All five projection consumers
(`adapters`, `hooks-adapter`, `extensions-adapter`, `sdk/harness/*`, catalog API)
now resolve against the atlas graph either directly (consumers 1–4) or via a
trivial spec'd adapter (consumer 5). No data/schema gap remains.

### before catalog pass 92 verdict (preserved for history): **GREEN** (after catalog pass 91)

catalog pass 91 closed the three top blockers below. The verdict moved from
catalog pass 90 YELLOW → catalog pass 91 GREEN. Residual amber items (HooksMuxDetectionRule
data, HarnessFallbackMetadata adapter) were closed in catalog pass 92.
See `REMODEL-NOTES.md` § catalog pass 91, § catalog pass 92.

### before catalog pass 91 verdict (preserved for history): **YELLOW**

atlas has structural coverage for every legacy NodeKind that codegen consumes
(PluginTarget, HookSurface, HookMapping, DiscoverySignal, AgentVersion,
ModelVersion, ProcessDescriptor, PackageSurface, PathDescriptor exist in atlas
graph). Codegen will not break for *missing* concepts. It will break for:

1. **id-pattern divergence** — every accessor that takes an id (e.g.
   `getPluginTargetDescriptor('codex')`) will not match because atlas stores
   `plugin-target:codex` while legacy expects `pluginTarget:codex`. Aliases
   needed.
2. **PluginTarget shape divergence** — extensions-adapter relies on 8+ flat
   string-token fields (`manifestFormat: "plugin.json + openclaw.plugin.json"`,
   `commandFormat: "markdown-commands"`, `packageMetadata.binScriptExt: ".js"`,
   etc.) that are not on the atlas PluginTarget node. These drive code-generation
   templates per harness — without them, the adapter generator can't emit the
   correct adapter scripts.
3. **container-image PluginArtifact rows missing** — `getHarnessImages()`
   returns empty for atlas, so `--mode docker` invocations lose their default
   image lookup.
4. **HooksMuxDetectionRule scope='hooks-adapter' missing** — `detectHarness()`
   in hooks-adapter/core would have nothing to scan.
5. **HostMetadataField embedding** — atlas puts these on DiscoverySignal as
   `metadataFields`, legacy expects a separate
   `getHostMetadataFields(): Record<agent, HostMetadataField[]>` accessor —
   adapter trivial but required.

## Top 5 blockers (catalog pass 90 → catalog pass 91 status)

1. `PluginTarget` field-set: 8 fields + 2 nested objects (`packageMetadata`,
   `componentSupport`) that drive every per-harness adapter template. — **CLOSED catalog pass 91**
   (17/17 atlas PluginTarget records carry the 10 codegen fields; 9 verbatim
   from legacy, 8 by-analogy with source comments).
2. `PluginArtifact[artifactKind=container-image]` rows for harness images
   (default container per harness). — **CLOSED catalog pass 91** (9/9 rows; 4 new:
   pi, omp, opencode, openclaw; image refs verbatim from legacy).
3. `DiscoverySignal[scope=hooks-adapter]` rows + `absentSignals` field. —
   **OPEN** (out of catalog pass 91 scope; catalog pass 92 candidate).
4. id-alias map for ~26 NodeKinds (kebab-case migration + `@semver` suffix). —
   **CLOSED catalog pass 91** (177 alias rows across 18 NodeKinds in
   `migration/legacy-id-aliases.yaml`; flat shim, path (a)).
5. `AgentRuntimeImpl/CoreImpl/PlatformImpl` → `HarnessFallbackMetadata`
   re-bundle adapter (one record per harness as legacy SDK expects). —
   **OPEN** (projection adapter, lives in legacy SDK; catalog pass 92 candidate).

See `projection-adapters.md` for the per-projection adapter checklist and
`legacy-id-aliases.yaml` for the canonical id-alias mapping seed.


## Internal-concept coverage (catalog pass 96, 2026-05-04)

Beyond the user-facing migration above, catalog pass 96 deep-audited the babysitter
monorepo's adapter ecosystem to verify per-package internal concepts are
catalog-faithful (codegen-ready).

| Package | Internal concepts | atlas NodeKind(s) used | Status |
| --- | --- | --- | --- |
| `agent-catalog` | exports, projection types | PackageSurface + all NodeKinds it projects | GREEN |
| `adapters/core` | adapter-registry, capabilities, host-detection, hook-catalog, hook-dispatcher, builtin-hooks | AgentRuntimeImpl, AgentCapabilities (Capability), HostDetectionRule, HookSurface, HookMapping; builtin-hooks runtime-only (out of scope) | GREEN |
| `adapters/cli` | adapters bin entrypoint | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/gateway` | HTTP gateway, fanout server, kanban control plane | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/tui` | Ink TUI + plugins | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/ui` | shared React/RN components, session-flow | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/webui` | browser app | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/harness-mock` | mock harness emulator | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/observability` | logger + telemetry library | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/sdk` (umbrella @a5c-ai/adapters) | re-export + adapters bin | PackageSurface + PathDescriptor (catalog pass 96-new) | GREEN |
| `adapters/adapters` | per-harness adapters bundle | PackageSurface + PathDescriptor (catalog pass 96-new); adapter behavior on AgentRuntimeImpl | GREEN |
| `extensions-adapter` | PluginTarget×17, schema/transform/emit | PluginTargetDescriptor + PackageSurface | GREEN |
| `hooks-adapter/core` | HookMapping records, MergePolicy, DecisionVerb | HookMapping, HookSurface, MergePolicy, DecisionVerb | GREEN |
| `tasks-adapter` | Zod-defined breakpoint types | BreakpointStrategy, ResponderProfile, BreakpointAnswer, DecisionMemory, HumanCheckpoint | GREEN |
| `transport-adapter` | 8 SUPPORTED_TRANSPORTS | ModelTransportProtocol×8 (existing) | GREEN |

Out-of-scope dirs (no `package.json`): `adapters/adapters-proxy`,
`adapters/meta`, `adapters/processes` — non-published source directories
under the umbrella package, not catalog-modelable.

Internal codegen-only modules (transform pipelines, runtime hook
dispatchers, payload shapes): out of scope for graph representation; they
project from existing NodeKinds.

## catalog pass 98 deep-decomposition update (2026-05-04)

catalog pass 98 promoted the catalog pass 97c group-level tasks-adapter records to leaf-level,
authored outbound-client APIEndpoints, promoted harness-mock error +
runtime-hook fixtures to InteractionPrimitive[mock-scenario], and added
PackageSurface command-group enrichment for babysitter-sdk and
agent-platform.

| Package | catalog pass 98 delta |
| --- | --- |
| `tasks-adapter` | 17 leaf CLI subcommand records authored (auth login/logout/status/keygen/key-push/keys/server set/server clear/token set/token clear; breakpoints pending/answer/status/poll; responders list/show; server start) + 8 outbound-client APIEndpoint records (POST/GET/DELETE under /api/v1/{questions,experts,...}). |
| `adapters/harness-mock` | 5 `error:*` + 3 `runtimeHook*` scenarios promoted from data fixtures to InteractionPrimitive[mock-scenario]. |
| `babysitter-sdk` | PackageSurface enriched with bins (babysitter, babysitter-sdk, babysitter-mcp-server) + 12 top-level CLI command-group records spanning run:/task:/session:/plugin:/skill:/process-library:/profile:/instructions:/compression:/breakpoint:/hook:/mcp-server. |
| `agent-platform` | PackageSurface enriched with bin (babysitter-harness) + harness-runtime command-set primitive (HARNESS_RUNTIME_COMMANDS literal). |
| `babysitter` (metapackage) | Confirmed wrapper-over-graph (bin/babysitter.js aliases babysitter-sdk CLI); existing PackageSurface remains accurate. |
| `cloud`, `observer-dashboard` | Existing PackageSurface (Next.js apps) confirmed accurate; per-route HTTP endpoints intentionally not enumerated (would couple atlas to deploy-time UI surface). |

Structured deferred work items filed for items investigated and intentionally
left as graph-visible placeholders rather than silent gaps:

| Item | deferred work item | Status |
| --- | --- | --- |
| LangGraph JournalEvent taxonomy | deferred-work:journal-event-langgraph | open (needs vendor evidence row) |
| OpenAI Agents SDK Runner events | deferred-work:journal-event-openai-agents-sdk | open |
| Cohere / Mistral / Gemini / Ollama ProtocolMessage | deferred-work:protocol-message-{cohere,mistral,gemini,ollama} | open |
| Cursor `.mdc` FrontmatterField | deferred-work:frontmatter-cursor-mdc | open (appliesTo enum design) |
| Codex `AGENTS.md` FrontmatterField | deferred-work:frontmatter-codex-agents-md | abandoned (not-applicable; no frontmatter) |
| babysitter `defineTask` task-schema fields | deferred-work:task-schema-field-define-task | open (NodeKind decision) |
| adapters/adapters per-harness dispatch | deferred-work:adapters-adapters-per-harness-dispatch | abandoned (wrapper-over-graph per catalog pass 96) |
| agent-catalog public library functions | deferred-work:agent-catalog-library-functions | abandoned (projection-over-graph) |
| adapters/ui + webui React components | deferred-work:adapters-ui-webui-react-components | abandoned (presentation-only per catalog pass 97c) |
| transport-adapter runtime.ts programmatic API | deferred-work:transport-adapter-runtime-programmatic-api | abandoned (wrapper-over-graph) |
| hooks-adapter internal helpers | deferred-work:hooks-adapter-internals-helpers | abandoned (private code) |

## Wave-99 update — closing W98 status:open DeferredNodes

| W98 DeferredNode | Wave-99 outcome |
| --- | --- |
| journal-event:langgraph | resolved (7 records) |
| journal-event:openai-agents-sdk | open (no AgentRuntimeImpl record) |
| protocol-message:gemini | resolved (7 records, wired from gemini-cli.core@current) |
| protocol-message:cohere / mistral / ollama | open (no AgentCoreImpl records) |
| frontmatter-cursor-mdc | resolved (enum widened to `cursor-rule`; 3 records) |
| task-schema-field-define-task | resolved (enum widened to `task-schema`; 16 records, no new NodeKind) |

Net: 3 of 5 status:open DeferredNodes closed via Wave-99; the 3 still
open share a structural blocker (vendor impl record absent in
graph/agent-stack/), not a doc-availability issue.
