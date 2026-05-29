# Here Be Dragons — Babysitter Monorepo

Unmarked coupling, maintenance hazards, missing caveats, and dangerous zones. This is the map of places where a well-intentioned change will bite you.

---

## Hotspot Map

Files/modules that concentrate the most danger across multiple categories.

| File | Categories | Top Risk |
|------|-----------|----------|
| `packages/agent-core/src/session.ts` | coupling, caveat, fallback | 8 env vars read with complex fallback chain, silent provider switching, 900s timeout unexplained |
| `packages/agent-mux/core/src/provider-resolver.ts` | coupling, fallback | 6-level region chain, 5-level model chain, silent Google→Vertex upgrade |
| `packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts` | hazard, coupling, caveat | Double-cast type assertions, process.env mutations, silent retry loop |
| `packages/agent-platform/src/harness/piWrapper/moduleSupport.ts` | coupling, caveat, fallback | Azure env mutations, URL parse fallback, silent model synthesis |
| `packages/agent-mux/core/src/spawn-runner.ts` | hazard, fallback | 8+ PTY kill failures swallowed, stdin write failures, zombie processes |
| `packages/agent-core/src/agenticTools/shared/process.ts` | caveat, hazard | Silent 50MB stdout truncation, ripgrep path cached at module load |
| `packages/agent-mux/webui/src/lib/global-registry.ts` | coupling | globalThis shared mutable state, duplicated in observer-dashboard |
| `packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts` | hazard, fallback | 3-layer recovery chain, process code extraction from any code block |
| `packages/sdk/src/storage/journal.ts` | fallback, coupling | Append queue swallows previous errors, atomicity guarantee abandoned |
| `packages/agent-mux/core/src/kanban.ts` | hazard | 2518 lines, 6+ sealed switch statements, stringly-typed status values |

---

## Critical Dragons

### process.env mutation couples modules through ambient state
**Files:** `packages/agent-platform/src/harness/piWrapper/moduleSupport.ts:126-144`, `packages/agent-core/src/agenticTools/config/state.ts:112-122`, `packages/agent-mux/cli/src/index.ts:132-147`

`configureAzureOpenAiEnvDefaults()` writes `AZURE_OPENAI_RESOURCE_NAME`, `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` to `process.env`. `setConfigValue()` with `scope: "global"` permanently mutates `process.env`. The CLI writes `AMUX_LOG_LEVEL`, `AMUX_OBSERVABILITY_MODE`. Any code reading these env vars is coupled to the initialization order of the writers. No central registry of these contracts.

### globalThis shared mutable state with duplicate definitions
**Files:** `packages/agent-mux/webui/src/lib/global-registry.ts`, `packages/observer-dashboard/src/lib/global-registry.ts`

Both files define the same `globalThis.__kanban_registry__` keys with separate type definitions. If both run in the same Node process, whoever initializes first "wins" the singleton. If one file is updated, the other silently drifts. Race conditions on HMR reload. No ownership documentation.

### Double-cast type assertions bypass all safety
**Files:** `packages/agent-core/src/loop/agent-loop.ts:209`, `packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts:128-129`, `packages/agent-platform/src/cost/journal.ts`

`result as unknown as AgentLoopIterationResult<TOutput>` — comment acknowledges the danger but doesn't fix it. If `ConcurrentLoopRunner` changes output shape, all concurrent loop callers receive wrong data at runtime with no type error.

### Background process registry orphans on options object recreation
**File:** `packages/agent-runtime/src/background/state.ts:13-35`

Registry is keyed by exact options object reference (WeakMap). Create new options object → get new registry → old processes orphaned. Dispose on wrong reference silently does nothing (returns undefined from WeakMap).

### Silent stdout truncation at 50MB
**File:** `packages/agent-core/src/agenticTools/shared/process.ts:55-84`

After `MAX_SPAWN_OUTPUT_BYTES` (50MB), subsequent chunks are silently discarded. No error, no warning to caller. Long-running commands lose output mid-stream. A footnote message is appended but the damage is done — any JSON or structured output after the limit is corrupted.

---

## Coupling Map

### Env var coupling (writer → reader, no contract)

| Writer | Env Var | Reader | Risk |
|--------|---------|--------|------|
| `piWrapper/moduleSupport.ts` | `AZURE_OPENAI_RESOURCE_NAME` | `session.ts`, Pi module | Init-order dependent |
| `piWrapper/moduleSupport.ts` | `AZURE_OPENAI_BASE_URL` | `session.ts`, Pi module | Mutated in-place |
| `piWrapper/moduleSupport.ts` | `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` | Pi module | Conditional write |
| `agent-core/config/state.ts` | Any key via `setConfigValue("global")` | All process.env readers | Permanent mutation |
| `agent-mux/cli/index.ts` | `AMUX_LOG_LEVEL`, `AMUX_LOG_FILE` | `observability/logger.ts` | Startup coupling |

### Cross-package internal imports (fragile)

| Importer | Imports From (internal path) | Risk |
|----------|----------------------------|------|
| `omni` tests | `sdk/src/storage` (createRunDir, appendEvent) | SDK refactor breaks omni |
| `hooks-mux/core` tests | `adapter-claude/src/mappings`, `adapter-codex/src/mappings` | Adapter restructure breaks core |
| `hooks-mux/adapter-codex` tests | `cli/src/cli/stdin`, `cli/src/cli/adapter-loader` | CLI module changes break adapter tests |

### Circular dependency (via re-export shim)

`agent-core` → re-exports from `agent-runtime` (BackgroundProcessRegistry) → `agent-runtime` may import from `agent-core`. Documented with backward-compat shim comment but fragile.

### Stringly-typed event contracts (no compile-time safety)

`packages/agent-platform/src/harness/amux/amuxEventMapper.ts:42-56` defines 14 event type strings in BOTH a TypeScript union AND a `Set<string>`. If one is updated without the other, valid events silently become "unknown."

---

## Maintenance Minefields

### Shell invocation — 5 locations, subtly different
- `agent-core/src/agenticTools/tools/execution.ts:54-56` — uses `-c` flag
- `agent-core/src/session.ts:277` — uses `-lc` flag (loads login profile — **DIFFERENT**)
- `agent-platform/src/harness/backgroundProcessRegistry.ts:103-106` — uses `-c`
- `agent-runtime/src/backgroundProcessRegistry.ts:104-108` — uses `-c`
- `agent-platform/src/harness/agenticTools/tools/execution.ts:54-56` — uses `-c`

The `-lc` vs `-c` difference means session.ts loads `.bashrc`/`.bash_profile` while others don't. Changing one without checking all 5 causes inconsistent environment behavior.

### Kanban status — 6+ sealed switch statements
**File:** `packages/agent-mux/core/src/kanban.ts` (2518 lines)

`getColumnName`, `getColumnWipLimit`, `getAllowedMoveStates`, `resolveKanbanWorkflowState`, `resolveKanbanStatusForWorkflowState`, `evaluateKanbanIssueMove` all switch on the same status values. Adding a new status requires updating 6+ functions with no exhaustiveness check.

### Process definition extraction — any code block as fallback
**File:** `packages/agent-platform/src/harness/internal/createRun/planProcess/recovery.ts:33-106`

If no valid process code block is found, `extractProcessDefinitionCodeBlock()` returns ANY code block in the text as fallback. Shell scripts, config snippets, or unrelated code could be extracted and executed as a process definition.

### Validation uses triple-quote-style matching
**File:** `packages/agent-platform/src/harness/internal/createRun/planProcess/validationSource.ts:294-300`

```typescript
if (properties.has("agent") && kindValue !== "\"agent\"" && kindValue !== "'agent'" && kindValue !== "`agent`")
```

Three quote styles checked separately with hardcoded strings. Adding a new kind requires adding 3 branches. Easy copy-paste bug.

### Magic numbers without constants
- `externalPhase.ts:405` — `.slice(-1500)` output truncation
- `externalPhase.ts:407` — `.slice(0, 300)` for non-shell (inconsistent)
- `externalPhase.ts:316,327,342` — `effectId.slice(-8)` as label (why 8?)
- `fileSystem.ts:183` — `Math.min(limit ?? 500, 5000)` (undocumented caps)
- `programmaticToolCalling.ts:7` — `DEFAULT_MAX_TOOL_CALLS = 25` (why 25?)

---

## Missing Caveats

### File read silently capped at 10,000 lines
**File:** `packages/agent-core/src/agenticTools/tools/fileSystem.ts:42-45`

User requests 50,000 lines, gets 10,000. No indication in the response. Suggested: `// HERE BE DRAGONS: Read is capped at MAX_READ_LINES (10000). Requests for more are silently reduced.`

### HTTP fetch response truncated at 50,000 chars
**File:** `packages/agent-core/src/agenticTools/tools/execution.ts:136-140`

Unless `raw: true`, response bodies are truncated. The `... (truncated)` suffix is appended but the agent may not notice. Truncated JSON/HTML is unparseable.

### Ripgrep path cached at module load — never invalidated
**File:** `packages/agent-core/src/agenticTools/shared/process.ts:11-26`

`getRgPath()` checks `@vscode/ripgrep` on first call, caches result forever. If ripgrep is installed after first use, the stale `"rg"` fallback is used permanently.

### AbortController timeout is advisory, not enforced
**File:** `packages/agent-core/src/session.ts:96-100`

The timeout sets an abort signal but doesn't guarantee the request stops. Fetch implementations check the signal asynchronously — requests can exceed the timeout window.

### Circuit breaker constants are unexplained
**File:** `packages/agent-platform/src/harness/internal/createRun/orchestration/constants.ts:5-8`

`MAX_CONSECUTIVE_TIMEOUTS=3`, `MAX_CONSECUTIVE_STALLS=2`, `MAX_PROCESS_ERROR_STALLS=5`. No explanation of what a "stall" is vs. a "timeout," or why these specific values.

### DEFAULT_TIMEOUT_MS = 900_000 (15 minutes) — unexplained
**File:** `packages/agent-core/src/session.ts:8`

Why 15 minutes? Is it based on API provider limits? Token generation time? No comment.

### Tool dispose requires exact array reference
**File:** `packages/agent-core/src/agenticTools/index.ts:40-50`

`disposeAgentCoreToolDefinitions()` uses a WeakMap keyed by the exact tool array. Pass a copy or recreated array → dispose silently does nothing → background processes leak.

### Lazy init race on piWrapper failure
**File:** `packages/agent-platform/src/harness/piWrapper.ts:82-92`

If `doInitialize()` fails, `initPromise` is cleared. Rapid concurrent callers will all retry independently without backoff, potentially spamming the module loader.

### Platform-specific shell path assumption
**File:** `packages/agent-core/src/agenticTools/tools/execution.ts:53-56`

Hardcoded `/bin/bash` for non-Windows. macOS Catalina+ defaults to zsh. If bash isn't at `/bin/bash`, execution fails silently.

---

## Tech Debt Indicators

### Aggregate metrics (2,730 TypeScript files)

| Category | Count | Assessment |
|----------|-------|-----------|
| `@ts-ignore` / `@ts-expect-error` | 41 | Low (35 in generated validator.ts) |
| `eslint-disable` comments | 69 | Low — mostly `no-explicit-any`, `no-var-requires`, `react/no-danger` |
| Explicit `any` type annotations | 207 | Acceptable — concentrated in adapters/serialization, not business logic |
| Commented-out code blocks | 20+ files | Low accumulation — comments often explain why removed |
| Skipped/conditional tests | 22+ suites | Mostly justified; 2 unexplained UI test skips |
| E2E/integration tests | 6 files | Gap: no E2E for orchestration, hook-mux lifecycle, or trigger dispatch |
| Pre-release packages (0.1.0) | 5 | atlas, atlas/webui, krate/cli, krate/sdk, compendium |

### Unexplained skipped tests

**`packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx:82,135`** — "renders realtime flow data" and "shows empty states" skipped with no explanation. Should be fixed or converted to `test.todo()`.

### Duplicated utility patterns (no shared module)

- **Platform detection**: 13+ instances of `process.platform === 'win32'` across runner/adapter code — no shared `isWindows()` utility
- **Path normalization**: 35+ files independently implement path handling — no unified utility
- **Config loading**: Separate implementations in webui, gateway, and observer-dashboard — should be shared

### Structural debt

- **Re-export shims**: `agent-core/src/agenticTools/background/state.ts` re-exports from `agent-runtime` for backward compat (documented, but still fragile circular bridge)
- **Deprecated-but-active**: 7 deprecated exports in `agent-core/src/types.ts` still consumed downstream. `SessionCreateArgs` deprecated in `agent-platform` but re-exported indefinitely
- **Duplicate global registry**: `global-registry.ts` duplicated across webui and observer-dashboard with no shared module
- **`noImplicitAny: false`** in `packages/agent-mux/gateway/tsconfig.json` — catch handlers receive `any`, no compile-time error validation
- **`skipLibCheck: true`** in root `tsconfig.json` — dependency type incompatibilities invisible
- **E2E gaps**: No end-to-end coverage for babysitter orchestration loop, hook-mux lifecycle, or trigger dispatching. Heavy reliance on unit tests
