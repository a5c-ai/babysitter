# Hardcoded Harness/Target Gaps — Should Be Derived from Atlas Graph

> All data should flow: **Atlas graph → agent-catalog (bridge) → consumer packages**
>
> Generated 2026-05-06. Updated 2026-05-07. Items are ordered by impact.
>
> **Progress: P1 ✅ (3/3), P2 ✅ (2/2), P3–P7 remaining**

## Priority 1: Master Target Registries

These files contain the "source of truth" lists that all other hardcoded references derive from. Fix these first and the downstream items become easier.

### P1.1 — agent-catalog `buildPluginTargetDescriptors()` (data.ts:539–747)
- **What:** 9 fully hardcoded `PluginTargetDescriptor` objects with all fields (adapterName, pluginRootEnvVar, installLayout, packageMetadata, componentSupport, supportedHooks, etc.)
- **Fix:** Done — `buildPluginTargetDescriptors()` now reads PluginTarget records from Atlas via the bridge. 230 lines of hardcoded data removed. `PLUGIN_TARGET_HOOK_FAMILIES` replaced with dynamic `getPluginTargetHookFamilies()`. github-copilot hook special case removed.
- **Status:** 🟢 Complete (d30b5d08)

### P1.2 — SDK harness registry (packages/sdk/src/harness/registry.ts:32–102)
- **What:** 9 hardcoded `*_DISCOVERY_SPEC` constants with `callerEnvVars`, `configPaths`, `processNames` per harness. `HARNESS_REGISTRY` array.
- **Fix:** Read discovery specs from Atlas graph. Add `callerEnvVars`, `configPaths`, `processNames`, `cliCommand`, `capabilities` fields to Atlas PluginTarget records. Then read via agent-catalog at SDK startup. Adapter factory imports must remain hardcoded (they're code, not data).
- **Prerequisite:** Atlas schema enrichment for PluginTarget
- **Status:** 🔴 Hardcoded

### P1.3 — hooks-mux `deriveProcessNames()` (packages/hooks-mux/core/src/session-store/markers.ts:257–279)
- **What:** Switch statement mapping harness slug → process names (e.g. `'claude-code'` → `['claude', 'claude-code']`)
- **Fix:** Source from Atlas `PluginTarget.processNames` or `AgentVersion.processNames` field.
- **Status:** 🔴 Hardcoded

### P1.4 — agent-plugins-mux adapter registry (packages/agent-plugins-mux/src/targets/adapters/index.ts:42–56)
- **What:** `ADAPTER_BY_HOOK_FORMAT` and `ADAPTER_BY_TARGET_ID` maps linking target names to adapter classes.
- **Fix:** Already built dynamically from `listPluginTargetDescriptors()` via the catalog. But the adapter CLASS instantiation still requires knowing which class to use per hookRegistrationFormat. Consider a plugin/factory pattern driven by a graph field.
- **Status:** 🟡 Partially dynamic (registry is catalog-driven, class selection is hardcoded)

## Priority 2: Per-Target Type Definitions

### P2.1 — `HookRegistrationFormat` union type (packages/agent-plugins-mux/src/types.ts:196–203)
- **What:** `type HookRegistrationFormat = 'claude-code' | 'codex' | 'cursor' | ...`
- **Fix:** Generate from Atlas node kinds at build time, or use `string` with runtime validation.
- **Status:** 🔴 Hardcoded

### P2.2 — `HARNESS_ALIASES` map (packages/agent-catalog/src/sdk.ts:64–78)
- **What:** Maps alias strings to canonical target IDs (e.g. `'claude'` → `'claude-code'`, `'gemini'` → `'gemini-cli'`)
- **Fix:** Add `aliases` field to Atlas `PluginTarget` records.
- **Status:** 🔴 Hardcoded

## Priority 3: Per-Target Special Cases

### P3.1 — openclaw Stop hook (packages/agent-plugins-mux/src/transform.ts:287)
- **What:** `if (targetProfile.name === 'openclaw' && ...)` — emits Stop hook script for openclaw even though Stop isn't in its supportedHooks.
- **Fix:** Add a `forceIncludeHooks` field to Atlas PluginTarget records.
- **Status:** 🔴 Hardcoded

### P3.2 — codex marketplace format (packages/agent-plugins-mux/src/marketplaceGenerator.ts:21)
- **What:** `if (targetProfile.name === 'codex')` — special marketplace JSON format.
- **Fix:** Add `marketplaceFormat` field to Atlas PluginTarget.
- **Status:** 🔴 Hardcoded

### P3.3 — github-copilot bin script special cases (packages/agent-plugins-mux/src/binTemplates.ts:124, 236)
- **What:** `if (targetProfile.name === 'github-copilot')` — special install/uninstall behavior.
- **Fix:** Add `installBehavior` field to Atlas PluginTarget.packageMetadata.
- **Status:** 🔴 Hardcoded

### P3.4 — oh-my-pi adapter name (packages/agent-plugins-mux/src/transformHelpers.ts:101–103)
- **What:** `targetProfile.name === 'oh-my-pi'` — special adapter name resolution.
- **Fix:** Already in Atlas as `adapterName: omp`. Ensure all code reads from targetProfile.
- **Status:** 🟡 Mostly fixed

## Priority 4: Env Vars and Install Paths

### P4.1 — Hardcoded env vars in SDK discovery specs
- **Files:** packages/sdk/src/harness/registry.ts
- **What:** `CLAUDE_ENV_FILE`, `PI_SESSION_ID`, `CODEX_THREAD_ID`, `CURSOR_PROJECT_DIR`, `GEMINI_SESSION_ID`, etc.
- **Fix:** Add `discoveryEnvVars` field to Atlas `AgentVersion` or `PluginTarget`.
- **Status:** 🔴 Hardcoded

### P4.2 — Hardcoded config paths in SDK discovery specs
- **What:** `['.claude']`, `['.codex']`, `['.cursor']`, etc.
- **Fix:** Already in Atlas `PluginTarget.installLayout` but SDK doesn't read from catalog.
- **Status:** 🔴 Hardcoded (data exists in Atlas but not consumed)

## Priority 5: agent-mux Dispatch

### P5.1 — translate-for-harness switch (packages/agent-mux/adapters/src/translate-for-harness.ts:17–24)
- **What:** Switch statement dispatching adapter name to translation function.
- **Fix:** Plugin/registry pattern — each adapter registers itself. Or use a map populated from the catalog.
- **Status:** 🔴 Hardcoded

### P5.2 — CLI launch routing (packages/agent-mux/cli/src/commands/launch.ts:188–198)
- **What:** Switch on harness ID for launch commands.
- **Fix:** Registry pattern from catalog.
- **Status:** 🔴 Hardcoded

### P5.3 — interactive-mode target list (packages/agent-mux/processes/interactive-mode-support.js:240)
- **What:** `targetHarnesses` default: `['codex', 'claude', 'claude-code', 'opencode']`
- **Fix:** Query catalog for targets with interactive capability.
- **Status:** 🔴 Hardcoded

## Priority 6: Scripts and CI

### P6.1 — Architecture boundaries (scripts/check-architecture-boundaries.cjs)
- **What:** Hardcoded package family lists.
- **Fix:** Generate from Atlas `PackageSurface` records.
- **Status:** 🔴 Hardcoded

### P6.2 — Bump version targets (scripts/bump-version.mjs)
- **What:** Hardcoded list of plugin package.json paths to version-sync.
- **Fix:** Generate from Atlas `PluginTarget` records with `npmPublishable: true`.
- **Status:** 🔴 Hardcoded

### P6.3 — Sync external plugin repos (scripts/sync-external-plugin-repos.mjs)
- **What:** Hardcoded `targets` array with repo URLs, source dirs, package names.
- **Fix:** Add `externalRepo` field to Atlas PluginTarget.
- **Status:** 🔴 Hardcoded

### P6.4 — Docs freshness known packages (scripts/docs-freshness-report.cjs)
- **What:** Hardcoded allowlist of external plugin package names.
- **Fix:** Query catalog for all known plugin package names.
- **Status:** 🔴 Hardcoded

## Priority 7: Tests

### P7.1 — Transform test assertions (packages/agent-plugins-mux/src/__tests__/transform.test.ts)
- **What:** Tests assert specific env var names, hook structures per target.
- **Fix:** Tests should derive expected values from catalog, not hardcode them.
- **Status:** 🔴 Hardcoded (acceptable for now — tests validate specific behavior)

### P7.2 — Contract tests (packages/agent-plugins-mux/src/__tests__/targets.contract.test.ts)
- **What:** Tests validate catalog-provided target descriptors.
- **Fix:** Already catalog-driven. Low priority.
- **Status:** 🟢 OK

## Summary

| Priority | Items | Status |
|----------|-------|--------|
| P1 — Master registries | 4 | 🟡 2 partial, 🔴 2 hardcoded |
| P2 — Type definitions | 2 | 🔴 Both hardcoded |
| P3 — Special cases | 4 | 🟡 1 partial, 🔴 3 hardcoded |
| P4 — Env vars / paths | 2 | 🔴 Both hardcoded |
| P5 — agent-mux dispatch | 3 | 🔴 All hardcoded |
| P6 — Scripts / CI | 4 | 🔴 All hardcoded |
| P7 — Tests | 2 | 🟢 1 OK, 🔴 1 acceptable |

**Total: 21 items, 16 fully hardcoded, 3 partially addressed, 2 OK**

The fix pattern for most items: add the missing field to Atlas PluginTarget/AgentVersion records, expose via agent-catalog bridge, consume in the target package.
