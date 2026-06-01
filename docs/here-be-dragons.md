# Here Be Dragons — Babysitter Monorepo

Unmarked coupling, maintenance hazards, missing caveats, and dangerous zones. This is the map of places where a well-intentioned change will bite you.

**Legend:** ~~strikethrough~~ = fixed/mitigated

---

## Hotspot Map

Files/modules that concentrate the most danger across multiple categories.

| File | Categories | Top Risk |
|------|-----------|----------|
| `packages/tula-core/src/session.ts` | coupling, caveat | 8 env vars read with complex fallback chain, 900s timeout unexplained *(model default + anthropic conversion now logged)* |
| `packages/agent-mux/core/src/provider-resolver.ts` | coupling | 6-level region chain, 5-level model chain *(model source + Google→Vertex now logged)* |
| `packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts` | hazard, coupling, caveat | Double-cast type assertions, process.env mutations *(retry loop now logged)* |
| `packages/agent-platform/src/harness/piWrapper/moduleSupport.ts` | coupling, caveat | Azure env mutations *(URL parse + import error now logged)* |
| `packages/agent-mux/core/src/spawn-runner.ts` | hazard | 8+ PTY kill/write failures *(4 now logged in spawn-runner)* |
| `packages/tula-core/src/agenticTools/shared/process.ts` | caveat, hazard | Ripgrep path cached at module load |
| `packages/agent-mux/webui/src/lib/global-registry.ts` | coupling | globalThis shared mutable state, duplicated in observer-dashboard |
| `packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts` | hazard | 3-layer recovery chain invisible without verbose *(code block extraction now rejects non-process blocks)* |
| ~~`packages/sdk/src/storage/journal.ts`~~ | ~~fallback~~ | ~~Atomicity abandoned~~ → now throws on ENOENT. Queue errors logged. |
| ~~`packages/agent-mux/core/src/kanban.ts`~~ | ~~hazard~~ | ~~2518 lines, 6+ sealed switch statements, stringly-typed status values~~ -> status/workflow mappings now use typed tables with coverage tests. |

---

## Critical Dragons

### process.env mutation couples modules through ambient state
**Files:** `packages/agent-mux/observability/src/logger.ts`, `packages/agent-mux/observability/src/logger-simple.ts`, `packages/agent-mux/observability/src/index.ts`

**FIXED for package writers:** Pi Azure defaults now return an overlay instead of writing `AZURE_OPENAI_*`; agent-core and agent-platform config helpers delegate to explicit scoped runtime config state; agent-mux CLI and TUI logging setup reconfigure observability without writing `AMUX_OBSERVABILITY_MODE` into `process.env`.

**Remaining caveat:** observability defaults still read `AMUX_LOG_LEVEL`, `AMUX_LOG_FILE`, `AMUX_LOG_PRETTY`, and `AMUX_OBSERVABILITY_MODE` from ambient env at module/runtime boundaries. Keep future changes on explicit config surfaces rather than adding new in-process env writers.

**Tracked separately:** #584 is the focused implementation issue for replacing these ambient in-process writes with an explicit env/config contract. Keep #601 changes from duplicating that larger refactor.

### ~~globalThis shared mutable state with duplicate definitions~~
**Files:** `packages/agent-mux/webui/src/lib/global-registry.ts`, `packages/observer-dashboard/src/lib/global-registry.ts`

**FIXED:** Extracted `createGlobalRegistry<TMap>` factory. All three copies (webui, gateway, observer-dashboard) now use the same factory with domain-specific type maps. Factory is canonical source, copies marked.

### ~~Double-cast type assertions bypass all safety~~
**Files:** `packages/tula-core/src/loop/agent-loop.ts:209`, `packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts:128-129`, `packages/agent-platform/src/cost/journal.ts`

**FIXED:** agent-loop.ts now validates shape at runtime before cast. effects.ts removed 3 double-casts (TaskDef has index sig, session has public abort). cost/journal.ts replaced blind cast with field-by-field validation.

### ~~Background process registry orphans on options object recreation~~
**File:** `packages/agent-runtime/src/background/state.ts:13-35`

**FIXED:** Added `registryId` string key alongside WeakMap. Same logical owner with `registryId` reuses existing registry instead of creating a new one.

### ~~Silent stdout truncation at 50MB~~
**File:** `packages/tula-core/src/agenticTools/shared/process.ts:55-84`

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
| `agent-platform/config/state.ts` | Any key via `setConfigValue("global")` | Platform tool/config readers | Permanent mutation |
| `agent-mux/cli/index.ts` | `AMUX_LOG_LEVEL`, `AMUX_LOG_FILE` | `observability/logger.ts` | Startup coupling |

### Cross-package internal imports (fragile)

| Importer | Imports From (internal path) | Risk |
|----------|----------------------------|------|
| `tula` tests | `sdk/src/storage` (createRunDir, appendEvent) | SDK refactor breaks tula |
| `hooks-mux/core` tests | `adapter-claude/src/mappings`, `adapter-codex/src/mappings` | Adapter restructure breaks core |
| `hooks-mux/adapter-codex` tests | `cli/src/cli/stdin`, `cli/src/cli/adapter-loader` | CLI module changes break adapter tests |

### Circular dependency (via re-export shim)

`tula-core` → re-exports from `agent-runtime` (BackgroundProcessRegistry) → `agent-runtime` may import from `tula-core`. Documented with backward-compat shim comment but fragile.

### ~~Stringly-typed event contracts (no compile-time safety)~~

**FIXED:** `BABYSITTER_EVENT_KINDS` const array is now the single source of truth. Type union and Set are both derived from it — cannot drift apart.

---

## Maintenance Minefields

### ~~Shell invocation — 5 locations, subtly different~~

**FIXED:** Shell argv construction is centralized in `@a5c-ai/agent-runtime` through `buildShellInvocation()`. Runtime background spawning, tula-core session execution, and core/platform bash tools all use the shared contract.

### ~~Kanban status — 6+ sealed switch statements~~
**File:** `packages/agent-mux/core/src/kanban.ts` (2518 lines)

**FIXED:** #586 replaced the repeated status/workflow switch pattern with typed mapping tables and focused coverage in `packages/agent-mux/core/tests/kanban.test.ts`. Adding a new status or workflow state now has a single mapping contract and tests that enumerate the supported values.

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
**File:** `packages/tula-core/src/agenticTools/tools/fileSystem.ts:42-45`

**FIXED:** Now appends `(capped at 10000 lines — requested N)` when limit is reduced.

### HTTP fetch response truncated at 50,000 chars
**File:** `packages/tula-core/src/agenticTools/tools/execution.ts:136-140`

Unless `raw: true`, response bodies are truncated. The `... (truncated)` suffix is appended but the agent may not notice. Truncated JSON/HTML is unparseable.

### Ripgrep path cached at module load — never invalidated
**File:** `packages/tula-core/src/agenticTools/shared/process.ts:11-26`

`getRgPath()` checks `@vscode/ripgrep` on first call, caches result forever. If ripgrep is installed after first use, the stale `"rg"` fallback is used permanently.

### AbortController timeout is advisory, not enforced
**File:** `packages/tula-core/src/session.ts:96-100`

The timeout sets an abort signal but doesn't guarantee the request stops. Fetch implementations check the signal asynchronously — requests can exceed the timeout window.

### ~~Circuit breaker constants are unexplained~~
**FIXED:** Each constant now has a comment explaining what it guards against.

### ~~DEFAULT_TIMEOUT_MS = 900_000 (15 minutes) — unexplained~~
**FIXED:** Comment added: accommodates long-running model responses and Azure cold-start latency.

### ~~Tool dispose requires exact array reference~~
**File:** `packages/tula-core/src/agenticTools/index.ts:40-50`

**FIXED:** Tool definitions are now tracked by both returned array and individual tool object ownership. Passing a shallow-copied definitions array to `disposeAgentCoreToolDefinitions()` still resolves the owning options and clears retained background task state.

### ~~Lazy init race on piWrapper failure~~
**File:** `packages/agent-platform/src/harness/piWrapper.ts:82-92`

**FIXED:** Initialization failures now record the failure and retry-after timestamp. Immediate retries rethrow the recorded failure instead of hammering session creation, while retries after the backoff window can recover from transient failures.

### ~~Platform-specific shell path assumption~~
**File:** `packages/tula-core/src/agenticTools/tools/execution.ts:53-56`

**FIXED:** Shell invocation now uses the shared runtime helper in `@a5c-ai/agent-runtime`, so agentic shell execution paths share one argv construction contract instead of hardcoding `/bin/bash` in each caller.

---

## Tech Debt Indicators

### Aggregate metrics (2,730 TypeScript files)

| Category | Count | Assessment |
|----------|-------|-----------|
| `@ts-ignore` / `@ts-expect-error` | 41 | Low (35 in generated validator.ts) |
| `eslint-disable` comments | 69 | Low — mostly `no-explicit-any`, `no-var-requires`, `react/no-danger` |
| Explicit `any` type annotations | 207 | Acceptable — concentrated in adapters/serialization, not business logic |
| Commented-out code blocks | 20+ files | Low accumulation — comments often explain why removed |
| Skipped/conditional tests | 20+ suites | Mostly justified; unexplained `SessionDetailScreen` skips fixed |
| E2E/integration tests | 6 files | Gap: no E2E for orchestration, hook-mux lifecycle, or trigger dispatch |
| Pre-release packages (0.1.0) | 5 | atlas, atlas/webui, krate/cli, krate/sdk, compendium |

### ~~Unexplained skipped tests~~

**FIXED:** `packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx` now runs the realtime flow and empty-state tests instead of unconditionally skipping them.

### Duplicated utility patterns (no shared module)

- **Platform detection**: 13+ instances of `process.platform === 'win32'` across runner/adapter code — no shared `isWindows()` utility
- **Path normalization**: 35+ files independently implement path handling — no unified utility
- **Config loading**: Separate implementations in webui, gateway, and observer-dashboard — should be shared

### Structural debt

- **Re-export shims**: `agent-core/src/agenticTools/background/state.ts` re-exports from `agent-runtime` for backward compat (documented, but still fragile circular bridge)
- **Deprecated-but-active**: 7 deprecated exports in `agent-core/src/types.ts` still consumed downstream. `SessionCreateArgs` deprecated in `agent-platform` but re-exported indefinitely
- ~~**Duplicate global registry**~~: extracted `createGlobalRegistry` factory, all three copies now thin wrappers
- ~~**`noImplicitAny: false`** in `packages/agent-mux/gateway/tsconfig.json`~~ — **FIXED:** set to `true` along with `useUnknownInCatchVariables`
- **`skipLibCheck: true`** in root `tsconfig.json` — dependency type incompatibilities invisible
- **E2E gaps**: No end-to-end coverage for babysitter orchestration loop, hook-mux lifecycle, or trigger dispatching. Heavy reliance on unit tests

### #601 disposition

#601 is an umbrella tracker, not a single safe refactor boundary. Its previously listed WeakMap disposal, piWrapper lazy-init retry, shell invocation, skipped UI-test, kanban exhaustiveness, and in-process env writer streams are fixed. Further observability env-reader cleanup, duplicated utilities, root `skipLibCheck`, and E2E coverage gaps remain active debt and need focused follow-up issues with their own acceptance criteria before implementation.
