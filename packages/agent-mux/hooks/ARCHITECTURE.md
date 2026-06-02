# hooks-mux Architecture

## 1. System Overview

`hooks-mux` is a hooks normalization and context-propagation runtime. It sits between native harness hook invocations (Claude Code, Codex, Gemini, Copilot, Cursor, Pi, oh-my-pi, OpenCode, OpenClaw) and the handlers that act on them.

Its responsibilities:

- **Normalize** harness-native hook events into a single canonical `UnifiedHookEvent` (version `a5c.hooks.v1`).
- **Resolve** an ordered handler execution plan from CLI flags or module paths.
- **Execute** the plan with per-phase error policies (fail-open / fail-closed / fail-open-bootstrap-only).
- **Merge** results from all handlers into one `MergedExecutionResult` with deterministic conflict resolution.
- **Propagate** persisted environment variables downstream via the backend appropriate for the adapter.
- **Adapt** the merged result into a harness-native output shape, stripping fields the adapter cannot consume and tracking degradation.
- **Persist** session state (env, context vars, fragments) across hook invocations.

---

## 2. Package Layering

```
packages/agent-mux/hooks/
├── core/          @a5c-ai/agent-mux-hooks-core     — types, session, merge, normalizer, propagation, diagnostics, API
├── adapter-claude/                          — shell-hook family
├── adapter-codex/                           — shell-hook family
├── adapter-copilot/                         — shell-hook family
├── adapter-cursor/                          — shell-hook family (experimental; capability profiles)
├── adapter-gemini/                          — shell-hook family
├── adapter-oh-my-pi/                        — in-process family
├── adapter-openclaw/                        — in-process family (dual-layer: gateway + plugin hooks)
├── adapter-opencode/                        — in-process family
├── adapter-pi/                              — in-process family
└── cli/                                     — entry points; wires adapters + core
```

**Core sub-modules** (`core/src/`):

| Module | Role |
|---|---|
| `types/` | `UnifiedHookEvent`, `UnifiedHookResult`, `AdapterCapabilities`, `HookPlanEntry`, `SessionState`, `CanonicalPhase`, `PhaseMapping` |
| `normalizer/` | `normalizeEvent`, `resolvePhaseMapping`, `resolveHookPlan`, `runPlan`, `runHandler`, `ErrorPolicy` |
| `merge-engine/` | `mergeResults`, `MergedExecutionResult`, `MergeOptions`, `MergeConflictError` |
| `propagation/` | `propagateEnv`, `adaptOutput`, `materialize`, env-file generation |
| `session-store/` | `loadSession`, `saveSession`, `updateSession`, `addContextFragment`, `acquireLock`, `releaseLock`, XDG path resolution |
| `diagnostics/` | `DiagnosticEntry`, `TraceRecord`, structured JSONL logger, trace writer |
| `api.ts` | Programmatic integration surface: `createAdapter`, `registerHandler`, `runNormalized`, `getAdapter`, `clearRegistries` |
| `programmatic/` | In-process engine for programmatic harnesses: `createHooksEngine`, `HooksEngine`, `HookMiddleware`, `RegisteredHandler`, `EngineResult` |

**Adapter sub-modules** (each adapter package):

| File | Role |
|---|---|
| `adapter.ts` | Exports `createAdapter()` returning `AdapterCapabilities` |
| `mappings.ts` | `PhaseMapping[]` — native event names → canonical phases |
| `normalizer.ts` | Adapter-specific normalization (stdin parsing, env extraction) |
| `renderer.ts` | Serialize `MergedExecutionResult` to harness-native output |
| `session-resolver.ts` | Derive or extract `sessionId` from native invocation context |

`adapter-cursor` additionally exports `capability-profile.ts` with a swappable profile system (`DEFAULT_PROFILE`, `CLI_PERMISSIVE_PROFILE`, `setActiveProfile`) for adapting to Cursor's rapidly-evolving hook surface.

---

## 3. Data Flow

```
native hook invocation
        │
        ▼
[adapter normalizer]
  parse stdin payload
  extract env vars
  resolve sessionId (native | derived | synthetic)
        │
        ▼
normalizeEvent()
  resolvePhaseMapping(rawEventName, adapterMappings)
    → canonicalPhase, supportLevel
  buildExecutionContext(env)
    → sessionId, turnId, cwd, model, persistedEnv, contextVars, ...
  splitEnv(env)
    → { input: HOOKS_PROXY_* vars, persisted: HOOKS_PROXY_PERSIST_* vars }
  → UnifiedHookEvent { version, adapter, phase, rawEventName, supportLevel,
                       execution, payload, env, raw }
        │
        ▼
resolveHookPlan({ phase, handlers })
  merge: explicit --handler refs
  sort: priority asc, then pluginId asc, then id asc (deterministic)
  → HookPlanEntry[]
        │
        ▼
runPlan(event, plan, options)
  for each HookPlanEntry (ordered):
    runHandler(event, handler)
      shell command → exec(), event JSON on stdin + env vars (AGENT_SESSION_ID, AGENT_ADAPTER, AGENT_CAPABILITIES_JSON, etc.)
      stdout parsed as JSON result
    on error → apply ErrorPolicy for this phase
  → UnifiedHookResult[]
        │
        ▼
mergeResults(results, options)
  decision:        most-restrictive-wins (deny < ask < allow < continue < noop)
  persistEnv:      key-wise merge per conflictPolicy
  contextVars:     key-wise merge per conflictPolicy
  unsetEnv:        union
  additionalContext / reason / followUpMessage: concatenate
  systemMessage:   concatenate or keep-first
  toolMutation:    single-writer-only (throws MergeConflictError on second writer)
  continueSession: false dominates
  metadata:        deep merge (arrays replaced)
  → MergedExecutionResult { decision, persistEnv, contextVars, ... diagnostics }
        │
        ▼
propagateEnv(backend, persistEnv, options)
  → (see Section 7)
        │
        ▼
adaptOutput({ mergedResult, capabilities })
  strip fields unsupported by this adapter (tracks degradedFields)
  downgrade decision to 'noop' if !supportsBlock
  → AdaptedOutput { output, degradedFields }
        │
        ▼
[adapter renderer]
  serialize AdaptedOutput to harness-native format (stdout JSON / return value)
        │
        ▼
native response consumed by harness
```

---

## 4. Extension Points — Adding a New Adapter

Create a package `adapter-<name>/src/` with these five files:

**`adapter.ts`** — implement `createAdapter(): AdapterCapabilities`:
```typescript
export function createAdapter(): AdapterCapabilities {
  return {
    name: 'myadapter',
    family: 'shell-hook',           // 'shell-hook' | 'in-process' | 'observer'
    sessionIdQuality: 'native',     // 'native' | 'derived' | 'synthetic' | 'none'
    supportsBlock: true,
    supportsAsk: false,
    supportsToolInputMutation: false,
    supportsToolResultMutation: false,
    supportsNativeAdditionalContext: false,
    supportsOrderedFanout: true,
    supportsPersistedEnv: true,
    envPersistenceMode: 'native_env_file', // see Section 7
    toolInterceptionScope: 'all',   // 'all' | 'shell_only' | 'partial_shell_only' | 'none'
  };
}
```

**`mappings.ts`** — declare `PhaseMapping[]` mapping each native hook event to a `CanonicalPhase` with `supportLevel` (`native` | `emulated` | `lossy` | `unsupported`), `blockCapability`, `mutationCapability`, and `scope`.

**`normalizer.ts`** — call `normalizeEvent()` from core with the adapter's `adapterMappings`. Handle stdin parsing, env extraction, and any adapter-specific payload shaping before producing a `UnifiedHookEvent`.

**`renderer.ts`** — serialize a `MergedExecutionResult` to the harness-native output format expected on stdout or as a return value.

**`session-resolver.ts`** — extract or derive the `sessionId` from the native invocation context. Prefer native identifiers; fall back to derived (hash) or synthetic (UUID) per the adapter's `sessionIdQuality` declaration.

Register the adapter in `api.ts` via `createAdapter(name, capabilities, impl)` and add it to the CLI adapter map.

---

## 4b. Programmatic Execution Path (In-Process Harnesses)

For in-process harnesses (Pi, Oh-My-Pi, OpenCode, OpenClaw), the `programmatic/` module provides an alternative to the CLI-based execution path. Instead of spawning shell subprocesses, handlers run as in-process functions.

```
harness runtime (Pi / OpenCode / OpenClaw)
        |
        v
createConfiguredEngine()           -- from adapter-pi, adapter-opencode, etc.
  -> createHooksEngine(config)     -- from core/programmatic/engine.ts
        |
        v
engine.processEvent(input)
        |
        v
normalizeEvent()                   -- same core normalizer as CLI path
  rawEventName -> canonicalPhase via phaseMappings
  -> UnifiedHookEvent
        |
        v
[middleware chain]                 -- optional Express/Koa-style wrappers
        |
        v
resolve matching handlers          -- filter by phase, sort by priority/pluginId/id
        |
        v
for each handler (sequential):
  evaluateWhen(handler.when, event) -- skip if condition fails
  handler.handler(event)            -- in-process function call (not shell exec)
  on error -> fail-open (noop result with error metadata)
  -> UnifiedHookResult[]
        |
        v
mergeResults(results)              -- same merge engine as CLI path
  -> MergedExecutionResult
        |
        v
updateSessionFromResult()         -- persist env/contextVars to session store
        |
        v
EngineResult { mergedResult, handlersExecuted, diagnostics }
  -> consumed by harness runtime
```

Key differences from the CLI path:
- Handlers are `PortableHookHandler` functions, not shell commands
- No stdin/stdout serialization
- Middleware support for cross-cutting concerns
- Always fail-open (no per-phase error policy configuration)
- Session persistence is automatic and best-effort

---

## 5. Session Store

**Storage layout:**

```
POSIX:    ${XDG_STATE_HOME:-~/.local/state}/a5c-hooks/sessions/<sessionId>.json
Windows:  ~/.a5c/state/hooks/sessions/<sessionId>.json
```

Overridable via `sessionDir` parameter on all store functions.

**Envelope schema** (version `a5c.hooks.session.v1`):

```jsonc
{
  "schemaVersion": "a5c.hooks.session.v1",
  "session": {
    "version": "a5c.hooks.session.v1",
    "sessionId": "...",
    "adapter": "claude",
    "createdAt": "...",
    "updatedAt": "...",
    "cwd": "...",
    "persistedEnv": {},
    "contextVars": {},
    "contextFragments": []   // ordered; support optional TTL
  }
}
```

**Atomic writes:** write to `<path>.tmp-<pid>-<timestamp>` → `fd.sync()` → `fs.rename()`. No partial writes visible to readers.

**File locking** (`lock.ts`): exclusive lockfile at `<path>.lock` using `open('wx')`. Spins with 50 ms retry up to a 5 s deadline. Detects stale locks via `process.kill(pid, 0)` and removes them. `updateSession()` wraps load → mutate → save under this lock.

**Corruption recovery:** `loadSession()` catches JSON parse failures, renames the corrupt file to `<path>.corrupt.<timestamp>`, logs a warning to stderr, and returns `null` — callers treat a missing session as a cold start.

---

## 6. Merge Engine

`mergeResults(results: UnifiedHookResult[], options?: MergeOptions): MergedExecutionResult`

Results are processed in handler execution order (index 0 = first handler, i.e., lowest priority number).

**Decision precedence** (most to least restrictive):

```
deny (0) < ask (1) < allow (2) < continue (3) < noop (4)
```

Most restrictive wins across all handler results.

**Conflict policies** for `persistEnv` and `contextVars` key collisions:

| Policy | Behavior |
|---|---|
| `last-writer-wins` (default) | Later handler overwrites; conflict recorded in diagnostics |
| `fail-on-conflict` | Throws `MergeConflictError` on first key collision |
| `protected-prefixes` | Keys matching `protectedPrefixes` (default: `['AGENT_']`) cannot be overwritten; others use last-writer-wins |
| `namespace-required` | Every key must have a namespace prefix (`SOMETHING_`); throws if not present |

**Other field rules:**

- `additionalContext`, `reason`, `followUpMessage`: concatenated with `\n---\n` separator.
- `systemMessage`: concatenated (default) or `keep-first`.
- `toolMutation`: only one handler may produce a mutation; a second throws `MergeConflictError`.
- `continueSession`: `false` from any handler dominates.
- `suppressOutput`: `true` from any handler dominates.
- `unsetEnv`: union across all handlers.
- `metadata`: naive deep merge; arrays replaced (not concatenated).

**Diagnostics tracking:** `MergeDiagnostics` is included on every `MergedExecutionResult`. Records each conflict (`field`, `existingValue`, `incomingValue`, `resolution`, handler indices) and optional per-handler timing.

---

## 7. Propagation Backends

`propagateEnv(backend: PropagationBackend, env: Record<string, string>, options)` implements four modes declared per-adapter in `AdapterCapabilities.envPersistenceMode`:

| Mode | Constant | Mechanism |
|---|---|---|
| A | `native_env_file` | Append `export KEY="value"` lines to `options.nativeEnvFilePath` (harness-provided path, e.g. `CLAUDE_ENV_FILE`). Shell-safe escaping applied. |
| B | `runtime_hook` | No file I/O. Env vars are returned in the hook result and the runtime injects them. Caller responsibility. |
| C | `wrapper_only` | Write a temp env file (via `generateTempEnvFile`) for subprocess wrapping. No native harness file path required. |
| D | `none` | Persist to session store only (`saveSession`). No downstream injection into the harness process. |

Adapter `envPersistenceMode` values map to adapters as follows:

| Mode | Adapters |
|---|---|
| `native_env_file` | claude, gemini, copilot |
| `wrapper_only` | codex, cursor |
| `runtime_hook` | pi, oh-my-pi, opencode, openclaw |
| `none` | (observer-only or custom) |

---

## 7b. Injected Environment Variables

The proxy injects these `AGENT_*` environment variables into handler subprocess environments and materialized exec contexts:

| Variable | Source | Description |
|---|---|---|
| `AGENT_SESSION_ID` | Session | Current session identifier |
| `AGENT_TURN_ID` | Session metadata | Current turn identifier |
| `AGENT_ADAPTER` | Session | Adapter name (e.g. `claude`, `codex`) |
| `AGENT_WORKSPACE_ROOT` | Session metadata / cwd | Working directory root |
| `AGENT_TRANSCRIPT_PATH` | Session | Path to transcript file |
| `AGENT_CONTEXT_FILE` | Materialization | Path to temp JSON context file |
| `AGENT_CAPABILITIES_JSON` | Adapter | JSON-serialized `AdapterCapabilities` of the originating harness |

`AGENT_CAPABILITIES_JSON` contains the full `AdapterCapabilities` object for the active adapter, serialized as JSON. Downstream consumers (SDK adapters, hook handlers, exec wrappers) can parse this to determine what the originating harness supports -- blocking, mutation, env persistence mode, tool interception scope, etc. Parsed via `readExecutionContext()` from `sdk-interface/context-reader.ts`.

---

## 8. Error Handling

**Per-handler error policy** (`ErrorPolicy` in `runner.ts`):

| Policy | Behavior |
|---|---|
| `fail-open` | Handler error is caught; empty `{ decision: 'noop' }` result substituted. Execution continues. |
| `fail-closed` | Handler error propagates; `runPlan` throws. |
| `fail-open-bootstrap-only` | Fail-open only for the `session.start` phase; fail-closed for all others. |

**Default phase policies** (applied when no override is configured):

| Phase | Policy |
|---|---|
| `session.start` | `fail-open` |
| `tool.before` | `fail-open` |
| `tool.after` | `fail-open` |
| `turn.stop` | `fail-open` |
| all others | `fail-open` (global default) |

Override via `RunPlanOptions.errorPolicies` (per-phase map) or `RunPlanOptions.defaultPolicy`. The programmatic API (`api.ts` `runNormalized`) also fails open by default.

**Merge errors** (`MergeConflictError`): thrown synchronously when `fail-on-conflict` policy detects a key collision, or when more than one handler produces a `toolMutation`. These propagate through `runNormalized` unless caught by the caller.

**Output degradation**: fields unsupported by the adapter capability profile are stripped in `adaptOutput()` and recorded in `AdaptedOutput.degradedFields`. Degradation is non-fatal — the pipeline completes; callers can inspect or log the degraded field list.

**Normalization errors** (`NormalizationError`): thrown by `normalizeEvent` when required fields (`adapter`, `rawEventName`) are absent. Callers should treat these as configuration errors, not transient failures.
