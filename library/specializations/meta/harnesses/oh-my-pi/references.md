# Oh My Pi Harness -- Source File References

> Reference date: 2026-04-02

## SDK Harness Layer (`packages/sdk/src/harness/`)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `ohMyPi.ts` | Oh-my-pi adapter factory | `createOhMyPiAdapter()` |
| `pi.ts` | Pi adapter factory (base for oh-my-pi) | `createPiAdapter()`, `installPiFamilyPlugin()` |
| `piWrapper.ts` | Programmatic Pi session wrapper | `PiSessionHandle`, `createPiSession()`, `discoverRepoInstructionPrompts()` |
| `piSecureSandbox.ts` | Docker-based secure bash sandbox | `createSecureBashBackend()`, `SecureBashBackend`, `PiBashOperations` |
| `types.ts` | Harness adapter interfaces and types | `HarnessAdapter`, `HarnessCapability`, `PiSessionOptions`, `PiSessionEvent`, `PiPromptResult`, `SessionBindOptions`, `SessionBindResult`, `HookHandlerArgs`, `HarnessInstallOptions`, `HarnessInstallResult` |
| `discovery.ts` | Harness CLI discovery and caller detection | `discoverHarnesses()`, `detectCallerHarness()`, `checkCliAvailable()`, `KNOWN_HARNESSES` |
| `registry.ts` | Adapter registry | `detectAdapter()`, `getAdapterByName()`, `listSupportedHarnesses()` |
| `invoker.ts` | CLI invocation | `invokeHarness()`, `buildHarnessArgs()`, `HARNESS_CLI_MAP` |
| `installSupport.ts` | CLI and plugin installation helpers | `installCliViaNpm()`, `runPackageBinaryViaNpx()` |
| `index.ts` | Public API barrel | Re-exports all harness modules |

## Plugin Package (`plugins/babysitter-pi/`)

### Root Files

| File | Purpose |
|------|---------|
| `package.json` | Package manifest: `@a5c-ai/babysitter-pi` v0.1.0, `omp` field declares extensions and skills |
| `README.md` | User-facing plugin documentation: integration model, commands, installation, usage, troubleshooting |
| `AGENTS.md` | Full behavioral contract for agents during active babysitter runs (9 sections) |

### Extensions (`plugins/babysitter-pi/extensions/babysitter/`)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `index.ts` | Main entry point; wires all modules into ExtensionAPI | `activate(pi: ExtensionAPI)` (default export) |
| `types.ts` | TypeScript interfaces for the extension | `ExtensionAPI`, `RunState`, `EffectKind`, `EffectDef`, `GuardConfig`, `GuardResult`, `WidgetState`, `MessageRenderer` |
| `constants.ts` | Configuration constants and env var names | `CLI_COMMAND`, `DEFAULT_MAX_ITERATIONS` (256), `DEFAULT_MAX_DURATION_MS` (30min), `EFFECT_TIMEOUT_MS` (15min), `EXTENSION_NAME`, `EXTENSION_VERSION` |
| `sdk-bridge.ts` | In-process SDK integration | `createNewRun()`, `iterate()`, `postResult()`, `getRunStatus()`, `getPendingEffects()`, `SdkBridgeError` |
| `cli-wrapper.ts` | **Deprecated** subprocess-based CLI invocation | `runCli()`, `CliResult` |
| `loop-driver.ts` | Orchestration loop driven by `agent_end` event | `onAgentEnd()`, `buildContinuationPrompt()`, `extractPromiseTag()` |
| `guards.ts` | Safety limits and doom-loop detection | `checkGuards()`, `recordIterationOutcome()`, `recordIterationDigest()`, `recordPendingCount()`, `isDoomLoop()`, `resetGuardState()`, `resetDigests()` |
| `task-interceptor.ts` | Blocks built-in task/todo tools during active runs | `interceptToolCall()`, `shouldIntercept()`, `INTERCEPTED_TOOLS` |
| `effect-executor.ts` | Maps effect kinds to oh-my-pi execution | `executeEffect()`, `postEffectResult()`, `EffectResult` |
| `result-poster.ts` | Posts effect results to journal via SDK | `postResult()`, `postOkResult()`, `postErrorResult()`, `PostResultOptions` |
| `tui-widgets.ts` | TUI widget rendering (run, effects, quality) | `renderRunWidget()`, `renderEffectsWidget()`, `renderQualityWidget()`, `clearWidgets()`, `formatElapsed()` |
| `status-line.ts` | Status bar integration | `updateStatusLine()`, `clearStatusLine()` |
| `tool-renderer.ts` | Custom message renderers for TUI | `createToolRenderer()`, `registerBabysitterRenderers()`, `formatRunStatus()`, `formatEffectResult()`, `formatIterationSummary()` |
| `custom-tools.ts` | Registered tools for run inspection/control | `registerCustomTools()` (registers `babysitter_run_status`, `babysitter_post_result`, `babysitter_iterate`) |
| `todo-replacement.ts` | Journal-driven todo widget | `buildTodoItems()`, `formatTodoWidget()`, `syncTodoState()`, `TodoItem` |
| `session-binder.ts` | Session-to-run binding (imported by other modules) | `initSession()`, `getActiveRun()`, `setActiveRun()`, `clearActiveRun()`, `bindRun()`, `isRunActive()`, `RunState` |

### Skills (`plugins/babysitter-pi/skills/babysitter/`)

| File | Purpose |
|------|---------|
| `SKILL.md` | Babysitter orchestration skill definition; reads SDK version, installs CLI, delegates to `babysitter instructions:babysit-skill --harness oh-my-pi` |

### Commands (`plugins/babysitter-pi/commands/`)

| File | Command | Description |
|------|---------|-------------|
| `babysitter-call.md` | `/babysitter:call` | Start a babysitter orchestration run with a prompt |
| `babysitter-status.md` | `/babysitter:status` | Check active run status; optional run ID argument |
| `babysitter-resume.md` | `/babysitter:resume` | Resume a stopped/interrupted run by ID |
| `babysitter-doctor.md` | `/babysitter:doctor` | Diagnose run health (structure, journal, state, locks, effects, guards) |

### Other Files

| File | Purpose |
|------|---------|
| `scripts/setup.sh` | Plugin setup script |
| `test/tui.test.js` | TUI widget tests |
| `.gitignore` | Git ignore rules for the plugin |

## Guard Constants Cross-Reference

Values from `guards.ts` (runtime) vs `constants.ts` (configuration defaults):

| Parameter | `guards.ts` (runtime) | `constants.ts` (config default) |
|-----------|----------------------|-------------------------------|
| Max iterations | 256 (`MAX_ITERATIONS_DEFAULT`) | 256 (`DEFAULT_MAX_ITERATIONS`) |
| Max duration | 7,200,000 ms / 2h (`MAX_RUN_DURATION_MS`) | 1,800,000 ms / 30min (`DEFAULT_MAX_DURATION_MS`) |
| Error threshold | 3 (`MAX_CONSECUTIVE_ERRORS`) | 5 (`DEFAULT_ERROR_THRESHOLD`) |
| Doom-loop window | 3 (`DOOM_LOOP_THRESHOLD`) | 4 (`DEFAULT_DOOM_LOOP_WINDOW`) |
| Doom-loop min duration | 2,000 ms (`DOOM_LOOP_MIN_DURATION_MS`) | -- |

## Adapter Inheritance Chain

```
createOhMyPiAdapter()                     (ohMyPi.ts)
  -> createPiAdapter()                    (pi.ts)
       -> createClaudeCodeAdapter()       (claudeCode.ts)  [for hook handling]
```

## Discovery Configuration

From `KNOWN_HARNESSES` in `discovery.ts`:

```
oh-my-pi:
  cli: "omp"
  callerEnvVars: ["OMP_SESSION_ID", "OMP_PLUGIN_ROOT"]
  capabilities: [Programmatic, SessionBinding, StopHook, HeadlessPrompt]
  configPaths: [".omp"]
```

## Package Dependencies

```
@a5c-ai/babysitter-pi
  -> @a5c-ai/babysitter-sdk (^0.0.180)
  -> @mariozechner/pi-coding-agent (peer, any version)
```

## SDK Integration Points

The plugin imports directly from `@a5c-ai/babysitter-sdk`:

| Import | Used By |
|--------|---------|
| `createRun` | `sdk-bridge.ts` |
| `orchestrateIteration` | `sdk-bridge.ts` |
| `commitEffectResult` | `sdk-bridge.ts`, `effect-executor.ts`, `result-poster.ts` |
| `readRunMetadata` | `sdk-bridge.ts` |
| `loadJournal` | `sdk-bridge.ts`, `todo-replacement.ts` |
| `EffectAction` | `sdk-bridge.ts`, `loop-driver.ts` |
| `IterationResult` | `loop-driver.ts` |
| `CreateRunOptions`, `CreateRunResult` | `sdk-bridge.ts` |
| `OrchestrateOptions` | `sdk-bridge.ts` |
| `CommitEffectResultOptions`, `CommitEffectResultArtifacts` | `sdk-bridge.ts`, `effect-executor.ts`, `result-poster.ts` |
