# Here Be Dragons — Babysitter Monorepo

Unmarked coupling, maintenance hazards, missing caveats, and dangerous zones. This is the map of places where a well-intentioned change will bite you.

**Legend:** ~~strikethrough~~ = fixed/mitigated

---

## Hotspot Map

Files/modules that concentrate the most danger across multiple categories.

| File | Categories | Top Risk |
|------|-----------|----------|
| `packages/agent-core/src/session.ts` | coupling, caveat | 8 env vars read with complex fallback chain, 900s timeout unexplained *(model default + anthropic conversion now logged)* |
| `packages/agent-mux/core/src/provider-resolver.ts` | coupling | 6-level region chain, 5-level model chain *(model source + Google→Vertex now logged)* |
| `packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts` | hazard, coupling, caveat | Double-cast type assertions, process.env mutations *(retry loop now logged)* |
| `packages/agent-platform/src/harness/piWrapper/moduleSupport.ts` | coupling, caveat | Azure env mutations *(URL parse + import error now logged)* |
| `packages/agent-mux/core/src/spawn-runner.ts` | hazard | 8+ PTY kill/write failures *(4 now logged in spawn-runner)* |
| `packages/agent-core/src/agenticTools/shared/process.ts` | caveat, hazard | Silent 50MB stdout truncation, ripgrep path cached at module load |
| `packages/agent-mux/webui/src/lib/global-registry.ts` | coupling | globalThis shared mutable state, duplicated in observer-dashboard |
| `packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts` | hazard | 3-layer recovery chain invisible without verbose *(code block extraction now rejects non-process blocks)* |
| ~~`packages/sdk/src/storage/journal.ts`~~ | ~~fallback~~ | ~~Atomicity abandoned~~ → now throws on ENOENT. Queue errors logged. |
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

### ~~Silent stdout truncation at 50MB~~
**File:** `packages/agent-core/src/agenticTools/shared/process.ts:55-84`

**FIXED:** Now emits a visible `[babysitter] WARNING: stdout truncated at ... bytes` message in the output when truncation triggers. Caller can see that data was lost.

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

### ~~Stringly-typed event contracts (no compile-time safety)~~

**FIXED:** `BABYSITTER_EVENT_KINDS` const array is now the single source of truth. Type union and Set are both derived from it — cannot drift apart.

---

## Maintenance Minefields

### ~~Shell invocation — 5 locations, subtly different~~

**FIXED:** `session.ts` changed from `-lc` to `-c` for consistency. All 5 locations now cross-reference each other with HERE BE DRAGONS comments.

### Kanban status — 6+ sealed switch statements
**File:** `packages/agent-mux/core/src/kanban.ts` (2518 lines)

`getColumnName`, `getColumnWipLimit`, `getAllowedMoveStates`, `resolveKanbanWorkflowState`, `resolveKanbanStatusForWorkflowState`, `evaluateKanbanIssueMove` all switch on the same status values. Adding a new status requires updating 6+ functions with no exhaustiveness check.

### ~~Process definition extraction — any code block as fallback~~
**File:** `packages/agent-platform/src/harness/internal/createRun/planProcess/recovery.ts:33-106`

**FIXED:** Non-process code blocks are now rejected (`return null`) instead of being extracted and executed.

### Validation uses triple-quote-style matching
**File:** `packages/agent-platform/src/harness/internal/createRun/planProcess/validationSource.ts:294-300`

```typescript
if (properties.has("agent") && kindValue !== "\"agent\"" && kindValue !== "'agent'" && kindValue !== "`agent`")
```

Three quote styles checked separately with hardcoded strings. Adding a new kind requires adding 3 branches. Easy copy-paste bug.

### ~~Magic numbers without constants~~

**FIXED:** Extracted to named constants: `MAX_SHELL_OUTPUT_TAIL_CHARS`, `MAX_NON_SHELL_OUTPUT_HEAD_CHARS`, `DEFAULT_GLOB_LIMIT`, `MAX_GLOB_LIMIT`. ULID slices and `DEFAULT_MAX_TOOL_CALLS` documented inline.

---

## Missing Caveats

### ~~File read silently capped at 10,000 lines~~
**File:** `packages/agent-core/src/agenticTools/tools/fileSystem.ts:42-45`

**FIXED:** Now appends `(capped at 10000 lines — requested N)` when limit is reduced.

### HTTP fetch response truncated at 50,000 chars
**File:** `packages/agent-core/src/agenticTools/tools/execution.ts:136-140`

Unless `raw: true`, response bodies are truncated. The `... (truncated)` suffix is appended but the agent may not notice. Truncated JSON/HTML is unparseable.

### Ripgrep path cached at module load — never invalidated
**File:** `packages/agent-core/src/agenticTools/shared/process.ts:11-26`

`getRgPath()` checks `@vscode/ripgrep` on first call, caches result forever. If ripgrep is installed after first use, the stale `"rg"` fallback is used permanently.

### AbortController timeout is advisory, not enforced
**File:** `packages/agent-core/src/session.ts:96-100`

The timeout sets an abort signal but doesn't guarantee the request stops. Fetch implementations check the signal asynchronously — requests can exceed the timeout window.

### ~~Circuit breaker constants are unexplained~~
**FIXED:** Each constant now has a comment explaining what it guards against.

### ~~DEFAULT_TIMEOUT_MS = 900_000 (15 minutes) — unexplained~~
**FIXED:** Comment added: accommodates long-running model responses and Azure cold-start latency.

### Tool dispose requires exact array reference — *annotated*
**File:** `packages/agent-core/src/agenticTools/index.ts:40-50`

HERE BE DRAGONS comment added. WeakMap keyed by exact tool array reference — pass a copy and dispose silently fails. Risk remains but is now visible.

### Lazy init race on piWrapper failure — *annotated*
**File:** `packages/agent-platform/src/harness/piWrapper.ts:82-92`

HERE BE DRAGONS comment added. N concurrent callers can trigger N parallel init attempts with no backoff. Risk remains but is now visible.

### Platform-specific shell path assumption — *annotated*
**File:** `packages/agent-core/src/agenticTools/tools/execution.ts:53-56`

HERE BE DRAGONS comment added. `/bin/bash` hardcoded for non-Windows. Risk remains but is now visible.

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
- ~~**`noImplicitAny: false`** in `packages/agent-mux/gateway/tsconfig.json`~~ — **FIXED:** set to `true` along with `useUnknownInCatchVariables`
- **`skipLibCheck: true`** in root `tsconfig.json` — dependency type incompatibilities invisible
- **E2E gaps**: No end-to-end coverage for babysitter orchestration loop, hook-mux lifecycle, or trigger dispatching. Heavy reliance on unit tests
