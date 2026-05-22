# Hardcoded Harness/Target Gaps — Should Be Derived from Atlas Graph

> All data should flow: **Atlas graph → agent-catalog (bridge) → consumer packages**
>
> Updated 2026-05-07. No backward compatibility — fix forward only.

## Audit Summary

**Total hardcoded harness-specific literals in production code: ~201**
(excludes test infrastructure in harness-mock: 55 refs)

| Category | Count | Package | Severity |
|----------|-------|---------|----------|
| Adapter self-identity defaults | 38 | agent-mux/adapters | High |
| Adapter self-registration calls | 10 | agent-mux/adapters | High |
| hooks-mux adapter defaults + fallbacks | 40 | hooks-mux/adapter-* | High |
| Dispatch switches (translate/launch/tui) | 11 | agent-mux/adapters + cli | Medium |
| Adapter class→format maps | 9 | extension-mux | Medium |
| SDK prompt context factory names | 9 | sdk/harness | Medium |
| CLI paths/capabilities | 5 | agent-mux/cli | Medium |
| Model/host-detection registries | 6 | agent-mux/core | Medium |
| agent-mux CJS process scripts | 18 | agent-mux/processes | Low |
| Test mock scenarios | 55 | agent-mux/harness-mock | Low |

---

## HIGH: Adapter Identity & Registration (88 refs)

### H1 — agent-mux adapter self-identity (38 refs)

Each adapter class hardcodes its own `agent` and `cliCommand`:
```typescript
readonly agent: string = 'claude';
readonly cliCommand: string = 'claude';
```

**Files:** claude-adapter.ts, codex-adapter.ts, cursor-adapter.ts, gemini-adapter.ts, copilot-adapter.ts, pi-adapter.ts, pi-sdk-adapter.ts, omp-adapter.ts, opencode-adapter.ts, opencode-http-adapter.ts, openclaw-adapter.ts, droid-adapter.ts, amp-adapter.ts, hermes-adapter.ts, qwen-adapter.ts, codex-sdk-adapter.ts, codex-websocket-adapter.ts, claude-agent-sdk-adapter.ts, claude-remote-control-adapter.ts, babysitter-adapter.ts, agent-mux-remote-adapter.ts

**Fix:** Constructor injection. Each adapter accepts `agent` and `cliCommand` as constructor params. The self-registration call provides these from the catalog:
```typescript
const target = getPluginTargetDescriptor('claude-code');
registerAdapterFactory(target.adapterName, () => new ClaudeAdapter(target.adapterName, target.cliCommand));
```

**Atlas data needed:** Already available — `adapterName` and `cliCommand` on PluginTarget.

### H2 — agent-mux self-registration calls (10 refs)

```typescript
registerAdapterFactory('claude', () => new ClaudeAdapter());
```

**Fix:** Read the adapter name from the catalog or from the `adapterModule` field that already exists in Atlas. The barrel import in index.ts triggers registrations.

### H3 — hooks-mux adapter defaults + fallbacks (40 refs)

Each hooks-mux adapter has:
- `createAdapter(name = 'claude')` — default name literal
- `ADAPTER_NAME = 'codex'` — const in normalizers
- `_adapterName = 'claude'` — mutable default
- `adapter: 'claude'` — in fallback mapping arrays

**Files:** All 9 adapter-*/src/ packages (adapter.ts, normalizer.ts, mappings.ts, integration.ts)

**Fix:** Remove ALL defaults. The adapter-loader in hooks-mux-cli MUST pass the name from the catalog. If catalog is unavailable, fail explicitly rather than silently using a wrong default.

**Atlas data needed:** Already available — `adapterName` on PluginTarget.

---

## MEDIUM: Dispatch & Registry Maps (40 refs)

### M1 — translateForHarness switch (8 refs)

```typescript
switch (agent) {
  case 'claude': return translateForClaude(config);
  case 'codex': return translateForCodex(config);
  ...
}
```

**File:** packages/agent-mux/adapters/src/translate-for-harness.ts

**Fix:** Each translation function self-registers in a `TRANSLATION_REGISTRY` map at import time (same pattern as adapter self-registration). The switch becomes a map lookup. Add `translationStrategy` field to Atlas PluginTarget if needed for grouping (e.g., codex-sdk uses the same translation as codex).

### M2 — CLI launch/tui routing (5 refs)

```typescript
case 'codex': ...
case 'gemini': ...
```

**Files:** packages/agent-mux/cli/src/commands/launch.ts, tui.ts, remote.ts

**Fix:** Launch config comes from catalog. Each agent's launch behavior is an Atlas attribute (`launchMode: 'cli-spawn' | 'sdk-connect' | 'websocket'`).

### M3 — extension-mux adapter class→format maps (9 refs)

```typescript
const ADAPTER_CLASS_BY_FORMAT = {
  'claude-code': ClaudeCodeAdapter,
  'codex': CodexAdapter,
  ...
};
```

**File:** packages/extension-mux/src/targets/adapters/index.ts

**Fix:** Self-registration pattern. Each adapter class registers itself by hookRegistrationFormat at import time. The index.ts barrel import triggers all registrations.

### M4 — SDK prompt context factory names (9 refs)

```typescript
export function createCodexContext(overrides?) { ... }
export function createCursorContext(overrides?) { ... }
```

**File:** packages/sdk/src/harness/hooks/promptContexts.ts

**Fix:** Already partially addressed — `createPromptContextFromCatalog()` exists. Remove the named factory functions entirely. Callers should use `createPromptContextFromCatalog(targetId)`.

### M5 — agent-mux core registries (6 refs)

- `model-registry.ts` — per-agent default model mappings
- `host-detection.ts` — host detection signals
- `builtin-hooks.ts` — built-in hook handlers
- `spawn-runner-utils.ts` — spawn configuration

**Fix:** Model registries and host detection should come from Atlas AgentVersion/PluginTarget records. Add `defaultModelId`, `spawnConfig` fields to Atlas.

### M6 — agent-mux CLI paths/capabilities (5 refs)

- `agent-subagent-paths.ts` — per-agent subagent path resolution
- `agent-skill-paths.ts` — per-agent skill path resolution
- `agent-capabilities.ts` — per-agent capability declarations

**Fix:** Path resolution and capabilities from catalog. These are PluginTarget `installLayout` and `capabilities` fields.

---

## LOW: Scripts & Test Infrastructure (73 refs)

### L1 — agent-mux CJS process scripts (18 refs)

```
fix-enums.cjs, fix-enums2.cjs, fix-capabilities.cjs, fix-adapters.cjs,
fix-adapters-mcp.cjs, execute-advanced-uis-playbook.mjs, etc.
```

**Fix:** These are one-shot migration/fix scripts. They can hardcode names because they're ephemeral tooling, not runtime code. However, they should be cleaned up or deleted if no longer needed.

### L2 — harness-mock test scenarios (55 refs)

```
per-agent.ts, probe.ts, types.ts, scenarios.ts, hooks.ts, errors.ts, interactive.ts
```

**Fix:** Test infrastructure that creates mock scenarios per agent. Could be generated from catalog but low priority — tests validating specific agent behavior reasonably hardcode the agent name.

---

## Atlas Schema Gaps (fields needed but not yet added)

| Field | Node Kind | Purpose | Used By |
|-------|-----------|---------|---------|
| `translationStrategy` | PluginTarget | Groups agents sharing translation logic | translate-for-harness.ts |
| `launchMode` | PluginTarget | CLI launch behavior (cli-spawn/sdk/ws) | launch.ts |
| `defaultModelId` | AgentVersion | Default AI model per agent | model-registry.ts |
| `spawnConfig` | PluginTarget | CLI spawn arguments and env | spawn-runner-utils.ts |
| `subagentPaths` | PluginTarget | Subagent discovery paths | agent-subagent-paths.ts |
| `skillPaths` | PluginTarget | Skill discovery paths | agent-skill-paths.ts |

---

## Completed Items (from previous work)

| What | Status |
|------|--------|
| P1: Master target registries (buildPluginTargetDescriptors, SDK discovery specs, deriveProcessNames, adapter registry) | ✅ |
| P2: Type definitions (HookRegistrationFormat, HARNESS_ALIASES) | ✅ |
| P3: Special cases (openclaw Stop, codex marketplace, copilot bin scripts, oh-my-pi adapter) | ✅ |
| P4: Env vars / install paths | ✅ |
| P5.4: BuiltInAgentName | ✅ |
| P6: Scripts/CI (sync-external, docs freshness, architecture) | ✅ |
| Prompt contexts (capabilityCollector, compose, criticalRules, runCreation, taskKinds) | ✅ |
| Provider support matrix | ✅ |
| hooks-mux adapter capabilities → Atlas (11 fields) | ✅ |
| hooks-mux phase mappings → Atlas (4 fields on HookMapping) | ✅ |
| Pattern C: self-registering agent-mux adapters | ✅ |
| 329 harness name literals → parameterized | ✅ |
| agent-catalog: pure Atlas wrapper (no graph/, evidence/, assets.ts) | ✅ |
| packages/catalog removed | ✅ |
