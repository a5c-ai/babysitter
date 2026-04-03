# Pi Harness Source File References

All paths are relative to the babysitter monorepo root. Last verified: 2026-04-02.

---

## SDK Harness Layer (`packages/sdk/src/harness/`)

| File | Description |
|------|-------------|
| `piWrapper.ts` | `PiSessionHandle` class, `createPiSession()` factory, `discoverRepoInstructionPrompts()`, Azure OpenAI configuration helpers, model resolution logic |
| `pi.ts` | Pi harness adapter (`createPiAdapter()`), plugin root/state dir/session ID resolution, plugin installation (`installPiFamilyPlugin()`), hook handlers delegating to Claude Code adapter |
| `ohMyPi.ts` | Oh-My-Pi adapter (`createOhMyPiAdapter()`), wraps Pi adapter with different name and env var detection |
| `piSecureSandbox.ts` | Docker-based secure bash execution backend, `DockerSandboxAdapter`, `DockerSecureBashBackend`, `createSecureBashBackend()` factory |
| `types.ts` | `PiSessionOptions`, `PiSessionEvent`, `PiPromptResult`, `HarnessAdapter` interface, `HarnessCapability` enum, `SessionBindOptions`/`Result`, `HookHandlerArgs` |
| `discovery.ts` | `KNOWN_HARNESSES` specs for pi and oh-my-pi, `discoverHarnesses()`, `detectCallerHarness()`, config path detection |
| `registry.ts` | `detectAdapter()`, `getAdapterByName()`, `listSupportedHarnesses()` |
| `invoker.ts` | `invokeHarness()` -- spawn harness CLI as child process, `buildHarnessArgs()`, `HARNESS_CLI_MAP` |
| `installSupport.ts` | `installCliViaNpm()`, `runPackageBinaryViaNpx()` -- shared installation helpers |
| `agenticTools.ts` | Agentic tool integration module |
| `index.ts` | Public API re-exports for the harness module |

### SDK Harness Tests (`packages/sdk/src/harness/__tests__/`)

| File | Description |
|------|-------------|
| `piWrapper.test.ts` | Unit tests for PiSessionHandle, model resolution, Azure config, instruction discovery |
| `discovery.test.ts` | Tests for harness discovery and caller detection |
| `invoker.test.ts` | Tests for harness CLI invocation |
| `harness.test.ts` | Integration tests for harness adapter system |

---

## Pi Plugin Package (`plugins/babysitter-pi/`)

### Root Files

| File | Description |
|------|-------------|
| `package.json` | Plugin manifest with `omp` field declaring extensions/skills dirs, peer dep on `@mariozechner/pi-coding-agent` |
| `AGENTS.md` | Agent behavioral instructions for the babysitter-pi plugin (auto-init, commands, orchestration protocol, effect types, completion proof) |
| `.gitignore` | Ignore patterns for the plugin package |

### Extension Modules (`plugins/babysitter-pi/extensions/babysitter/`)

| File | Description |
|------|-------------|
| `types.ts` | TypeScript definitions: `ExtensionAPI` (10 lifecycle events, registerTool, registerCommand, registerMessageRenderer, setWidget, setStatus, appendEntry, sendMessage, sendUserMessage), `RunState`, `EffectDef`, `EffectKind`, `GuardConfig`, `WidgetState`, `MessageRenderer` |
| `constants.ts` | Configuration constants: CLI command, timeouts (120s CLI, 900s effect, 30s post-result, 5s sleep), env var names, widget keys, extension metadata |
| `sdk-bridge.ts` | Direct SDK bridge: `createNewRun()`, `iterate()`, `postResult()`, `getRunStatus()`, `getPendingEffects()` -- imports `createRun`, `orchestrateIteration`, `commitEffectResult`, `loadJournal`, `readRunMetadata` from `@a5c-ai/babysitter-sdk` |
| `loop-driver.ts` | Core orchestration loop: `onAgentEnd()` handler, `extractPromiseTag()`, `buildContinuationPrompt()` -- checks guards, iterates, injects follow-up prompts |
| `effect-executor.ts` | Effect dispatch: `executeEffect()` maps kinds to execution strategies (agent->sendUserMessage, node->execSync, shell->execSync, breakpoint->ask, sleep->setTimeout, skill->command system, orchestrator_task->sub-agent), `postEffectResult()` |
| `result-poster.ts` | Result posting: `postResult()`, `postOkResult()`, `postErrorResult()` -- wraps `commitEffectResult` with extension-friendly options |
| `task-interceptor.ts` | Tool interception: `interceptToolCall()`, `shouldIntercept()` -- blocks `task`, `todo_write`, `TodoWrite`, `TaskCreate`, `sub_agent`, `quick_task` during active runs |
| `guards.ts` | Iteration guards: `checkGuards()`, `isDoomLoop()`, `recordIterationOutcome()`, `recordPendingCount()`, `recordIterationDigest()`, `resetGuardState()` -- max iterations (256), max duration (2h), consecutive errors (3), doom-loop detection |
| `custom-tools.ts` | Tool registrations: `registerCustomTools()` -- `babysitter_run_status`, `babysitter_post_result`, `babysitter_iterate` |
| `status-line.ts` | Status bar: `updateStatusLine()`, `clearStatusLine()` -- compact one-line babysitter state display |
| `tool-renderer.ts` | Message renderers: `registerBabysitterRenderers()`, `formatRunStatus()`, `formatEffectResult()`, `formatIterationSummary()`, `createToolRenderer()` -- box-drawing formatted output |
| `tui-widgets.ts` | TUI widgets: `renderRunWidget()`, `renderEffectsWidget()`, `renderQualityWidget()`, `clearWidgets()`, `formatElapsed()` |
| `todo-replacement.ts` | Todo integration: `buildTodoItems()`, `formatTodoWidget()`, `syncTodoState()` -- replaces native todo with journal-derived task list |
| `cli-wrapper.ts` | **[DEPRECATED]** CLI subprocess invocation: `runCli()` -- replaced by `sdk-bridge.ts` |

### Skills (`plugins/babysitter-pi/skills/`)

| File | Description |
|------|-------------|
| `babysitter/SKILL.md` | Babysitter orchestration skill: instructions for SDK installation, CLI usage, and orchestration loop execution via `babysitter instructions:babysit-skill --harness oh-my-pi` |

### Commands (`plugins/babysitter-pi/commands/`)

| File | Description |
|------|-------------|
| `babysitter-call.md` | `/babysitter:call` -- start a new orchestration run with a prompt |
| `babysitter-status.md` | `/babysitter:status` -- show current run status and pending effects |
| `babysitter-resume.md` | `/babysitter:resume` -- resume an existing run from where it left off |
| `babysitter-doctor.md` | `/babysitter:doctor` -- diagnose run health |

### Tests (`plugins/babysitter-pi/test/`)

| File | Description |
|------|-------------|
| `tui.test.js` | Tests for TUI widget rendering, todo replacement, status line formatting |

---

## SDK Prompts Layer (`packages/sdk/src/prompts/`)

| File | Description |
|------|-------------|
| `context.ts` | `createPiContext()` -- factory for Pi-specific `PromptContext` used by `getPromptContext()` |
| `index.ts` | Re-exports prompt context factories including Pi |

---

## Related SDK Modules

| File | Description |
|------|-------------|
| `packages/sdk/src/runtime/exceptions.ts` | `BabysitterRuntimeError`, `ErrorCategory` -- error types used by Pi wrapper |
| `packages/sdk/src/compression/config-loader.ts` | `loadCompressionConfig()` -- used by PiSessionHandle for compaction settings |
| `packages/sdk/src/session/` | Session state management used by Pi adapter's `bindSession()` |
| `packages/sdk/src/cli/main.ts` | CLI entry point -- `harness:install`, `harness:install-plugin` commands for Pi |
