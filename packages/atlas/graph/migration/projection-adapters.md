# Projection adapters — required for legacy `agent-catalog` SDK on atlas graph

This is the codegen team's checklist. Each adapter projects a atlas graph subset
into the shape the legacy SDK accessor returns, so downstream mux generators
can swap the underlying graph without rewriting templates.

## 1. `PluginTargetDescriptor` (driver: `extension-mux`)

**Legacy shape (per `packages/agent-catalog/src/models.ts:467`):** flat record
with `targetId`, `displayName`, `adapterName`, `pluginRootEnvVar`,
`pluginRootEnvVarForExtension`, `manifestFormat` (string token),
`commandFormat`, `skillHandling`, `hookRegistrationFormat`, `scriptVariants`,
`adapterFamily`, `distribution` (string), `distributionModel`,
`marketplacePath`, `npmPublishable`, `installLayout.{harnessHomeRelative,
pluginsDirRelative, marketplacePathRelative}`,
`packageMetadata.{moduleType, binScriptExt, installLifecycle,
activationMessage, extraPackageFiles, extraScripts, peerDependencyPackage,
emitCjsWrappers}`, `componentSupport.{agents, context}`, `supportedHooks`
(map: canonicalHookName → nativeHookName), `evidenceIds`.

**atlas source:** `nodeKind: PluginTarget` instances under
`graph/extensions/plugin-artifacts/plugin-target-*.yaml`. atlas carries
`displayName`, `hostAgent`, `manifestPath`, `adapterFamily`, `distribution`
(array), `installLayout` (semantic-keyed: manifest/commands/agents/skills/
hooks/mcp), `description`.

**Adapter required — fields atlas lacks today:**

- `manifestFormat` (token, e.g. `"plugin.json + openclaw.plugin.json"`) —
  derive from `manifestPath` + co-located atlas artifact files OR backfill on
  atlas PluginTarget.
- `commandFormat`, `skillHandling`, `hookRegistrationFormat`,
  `distributionModel`, `marketplacePath`, `npmPublishable`,
  `pluginRootEnvVar`, `pluginRootEnvVarForExtension`, `scriptVariants` —
  backfill on atlas PluginTarget.
- `installLayout.harnessHomeRelative`, `installLayout.pluginsDirRelative`,
  `installLayout.marketplacePathRelative` — backfill (map from atlas semantic
  layout if recoverable).
- `packageMetadata` (8 sub-fields) — backfill.
- `componentSupport.{agents, context}` — backfill.
- `supportedHooks` map — derive from `nodeKind: HookMapping` where
  `targetId === thisPluginTarget.id`, mapping `hookId → canonicalName` via
  `HookSurface` lookup.

**Recommendation:** populate the 10+ flat fields directly on the atlas
PluginTarget nodes (preserves atlas's normalized shape for everything else,
but treats codegen-template tokens as first-class node attributes).
Without this, the mux generator cannot emit working adapter scripts.

## 2. `HarnessImageEntry` (driver: `agent-mux/core/invocation.ts`)

**Legacy shape:** `{ harness, image, tag?, preinstalled }`.

**Legacy derivation:** filter PluginArtifact by `artifactKind ===
"container-image"`, then map: `harness ← targetId`, `image ← pathPattern`,
`tag ← installerSurface`, `preinstalled ← scriptVariants.includes("preinstalled")`.

**atlas source:** `graph/extensions/plugin-artifacts/babysitter-*-package-json.yaml`
contains PluginArtifact rows but none have `artifactKind: container-image`.

**Action required:** author one PluginArtifact per harness with
`artifactKind: container-image` (a5c.ai/babysitter-{harness}:latest etc.) OR
add a new NodeKind `HarnessImage`. Since legacy already overloads
PluginArtifact for this, simplest is to mirror the legacy convention.

## 3. `HooksMuxDetectionRule` (driver: `hooks-mux/core/discovery/detector.ts`) — CLOSED (catalog pass 92)

**Legacy shape:** `{ adapter, confidence, signals[], absentSignals?[] }`.

**atlas source:** 10 DiscoverySignal rows with `scope: hooks-mux` under
`graph/extensions/discovery-signals/*-hooks-mux*.yaml` (catalog pass 92, verbatim from
legacy `discovery-signals-hooks.yaml`). Schema additions in catalog pass 92:
`scope` enum gained `hooks-mux`; `matchMode` enum gained
`all-present-with-absences`; new `absentSignals` field on
`DiscoverySignal`.

**Adapter (consumer-side, trivial):**
`buildHooksMuxDetectionRules` in `packages/agent-catalog/src/data.ts` reads
`listNodesByKind("DiscoverySignal").filter(n => n.scope === "hooks-mux")`
and maps `{ adapter ← key, confidence, signals, absentSignals }` — already
implemented and now resolves data on the atlas graph.

## 4. `HostSignalMap` + `HostMetadataField[]` (driver: `agent-mux/core/host-detection.ts`)

**Legacy shape:** two separate accessors —
`getHostSignalMap(): Record<agent, string[]>` and
`getHostMetadataFields(): Record<agent, HostMetadataField[]>`.

**atlas source:** DiscoverySignal nodes carry `signals` (env var names) +
`metadataFields[]` together.

**Adapter:** trivial — split each atlas DiscoverySignal scoped `host-detection`
into two outputs keyed by `applies_to` agent target. No data backfill
needed.

## 5. `HarnessFallbackMetadata` (driver: `sdk/src/harness/amuxFallbackMetadata.ts`) — SPEC FIXED (catalog pass 92, path-b)

**Decision (catalog pass 92):** keep atlas normalized; adapter lives in
`packages/agent-catalog/src/data.ts :: buildFallbackMetadata`. The legacy
function is *already* a projection (it joins SessionNuance + AgentVersion +
capability claims at read-time — it does not load a bundled record), so
authoring a duplicate atlas bundle would create a drift surface without
removing any work. Adapter is the right home; this section is the spec.

**Legacy shape (`HarnessFallbackMetadata`, models.ts:424):**
```
{
  harnessId: string,
  adapterName: string,
  hostEnvSignals: string[],
  sessionDir: string,
  capabilities: HarnessCapabilitySnapshot,   // 11 booleans
  evidenceIds: string[]
}
```

**atlas source map (per harness, keyed by `agent-version:<slug>@<range>`):**

| Field | atlas source |
| --- | --- |
| `harnessId` | derived from `agent-version` id (slug; legacy `fallbackHarnessId(agentId, aliases)`) |
| `adapterName` | `agent-version.aliases[0]` or `key` of the `discovery-signal:*-host-env` linked via `applies_to → AgentProduct` |
| `hostEnvSignals` | `discovery-signal:*-host-env`.`signals` (`scope: host-detection`) for the matching agent |
| `sessionDir` | `SessionModel.sessionDirStrategy` linked to `agent-version` (catalog pass 88 `graph/agent-stack/session-models/*`); fallback `resolveRunsDir()` |
| `capabilities.supports{Skills,Thinking,MCP,InteractiveMode,StdinInjection,SubagentDispatch,ParallelExecution,ImageInput}` | `Capability` records via `supports` edge from `agent-version`; capability ids: `skills`, `thinking`, `mcp`, `interactive-mode`, `stdin-injection`, `subagent-dispatch`, `parallel-execution`, `image-input` |
| `capabilities.requiresToolApproval` | `Capability:tool-approval` `supports` |
| `capabilities.{hasRuntimeHooks,hasStopHook}` | `Capability:runtime-hooks`, `Capability:stop-hook` `supports` |
| `evidenceIds` | `EvidenceSource` ids referenced by the agent-version (already loaded by legacy SDK) |

**Adapter ownership:** `packages/agent-catalog/src/data.ts ::
buildFallbackMetadata`. Migration: replace the existing legacy-graph reads
with atlas-graph reads using the table above. Tests:
`sdk/src/harness/amuxFallbackMetadata.contract.test.ts` already pins the
shape — no test changes required.

**Why not author bundled atlas records (path-a):** legacy itself does not
store a bundle (the bundle is computed at SDK boot). Authoring a duplicate
in atlas would (1) duplicate data the catalog pass 88 normalized layer already holds,
(2) create a drift surface between the bundle and the source-of-truth
records, (3) violate the atlas design principle of normalization. Adapter is
~30 LOC and resolves entirely at the consumer.

## 6. id alias-map (cross-cutting)

Every accessor takes a string id. Legacy uses camelCase prefixes
(`pluginTarget:`, `agentVersion:`); atlas uses kebab-case + semver
(`plugin-target:`, `agent-version:claude-code@1.x`). See
`legacy-id-aliases.yaml` for the seed mapping. The agent-catalog package
should accept both forms during cutover by normalizing on read.

## Adapter ownership

- Backfill 1, 2, 3 → atlas graph team (this repo).
- Adapters 4, 5, 6 → babysitter-monorepo agent-catalog package — they live in
  the SDK shim, not in atlas.

