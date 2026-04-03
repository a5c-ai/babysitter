/**
 * Shared task definitions for harness assimilation processes.
 *
 * These tasks represent what a real harness integration actually produces:
 *   - SDK adapter implementation
 *   - Discovery/invoker/registry entries
 *   - Plugin structure (hooks, configs, manifest)
 *   - Skill porting from reference plugins
 *   - Installation and distribution method
 *   - Harness wrapper for harness:create-run
 *   - README and documentation
 *   - Adapter unit tests (Vitest, following SDK harness test patterns)
 *   - Plugin integration tests (syntax, packaged install, hooks, skills, config)
 *   - CI/CD workflow integration (PR validation, E2E Docker, release pipeline)
 *   - Command sync script (keeps plugin commands/skills in sync with canonical babysitter commands)
 *   - Quality verification and refinement
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Reference paths the agent should consult
// ---------------------------------------------------------------------------

const referencePlugins = [
  'plugins/babysitter/',            // Claude Code reference plugin (hooks, skills, commands)
  'plugins/babysitter-codex/',      // Codex reference plugin (skills, hooks, .codex-plugin/, sync-command-skills.js)
  'plugins/babysitter-cursor/',     // Cursor reference plugin (commands, skills, hooks, sync-command-surfaces.js)
  'plugins/babysitter-github/',     // GitHub reference plugin (commands, skills, hooks, sync-command-surfaces.js)
  'plugins/babysitter-pi/',         // PI reference plugin (npm package, extensions, bin/, sync-command-docs.cjs)
];

/**
 * The canonical babysitter repo must be cloned/available for research.
 * The research task must study the existing plugin and adapter implementations
 * before starting any assimilation work.
 */
const babysitterRepo = 'https://github.com/a5c-ai/babysitter';

const sdkHarnessCore = [
  // ── Adapter interface and types ──
  'packages/sdk/src/harness/types.ts',         // HarnessAdapter interface, HarnessCapability enum, all binding/hook/install types, PiSessionOptions/PiPromptResult
  'packages/sdk/src/harness/index.ts',         // Public exports: all adapters, discovery, invoker, registry, piWrapper

  // ── Discovery subsystem (two mechanisms) ──
  'packages/sdk/src/harness/discovery.ts',     // KNOWN_HARNESSES array, CONFIG_PATHS map, discoverHarnesses() (installed-discovery via parallel CLI probing), detectCallerHarness() (in-session detection via env vars), checkCliAvailable() (which/where + --version)

  // ── Invocation/wrapping subsystem ──
  'packages/sdk/src/harness/invoker.ts',       // HARNESS_CLI_MAP (per-harness flag mapping), buildHarnessArgs() (pure arg builder), invokeHarness() (spawn CLI as child process with timeout/model/workspace)

  // ── Adapter registry (auto-detection + lookup) ──
  'packages/sdk/src/harness/registry.ts',      // detectAdapter() (priority-ordered env check), getAdapterByName(), listSupportedHarnesses(), get/set/resetAdapter()

  // ── Reference adapter implementations (MUST READ before assimilation) ──
  'packages/sdk/src/harness/claudeCode.ts',    // Claude Code adapter (1200+ lines): session-start with compression + skill discovery, stop hook with journal replay + completion proof, installPlugin, getPromptContext
  'packages/sdk/src/harness/codex.ts',         // Codex adapter: multi-format hooks.json, Windows hookDriven auto-detection, supportsHookType whitelist, CODEX_* env chain
  'packages/sdk/src/harness/pi.ts',            // PI adapter: in-process model, loop-driver, PI_*/OMP_* dual env, piWrapper delegation
  'packages/sdk/src/harness/ohMyPi.ts',        // Oh-my-pi adapter: separate from pi.ts, OMP_* env vars, omp CLI
  'packages/sdk/src/harness/geminiCli.ts',     // Gemini CLI adapter (960+ lines): AfterAgent continuation, GEMINI_* env chain, session-start context

  // ── Programmatic session API ──
  'packages/sdk/src/harness/piWrapper.ts',     // createPiSession → PiSessionHandle (.prompt(), .steer(), .followUp(), .subscribe(), .executeBash(), .abort(), .dispose()), PiEventListener, lazy init, compression integration

  // ── Fallback/null adapters ──
  'packages/sdk/src/harness/customAdapter.ts', // Custom/fallback adapter for unknown harnesses (autoResolvesSessionId=false, supportsHookType=false)
  'packages/sdk/src/harness/nullAdapter.ts',   // Null adapter (no-op, used when no harness detected)

  // ── Install support ──
  'packages/sdk/src/harness/installSupport.ts', // installCliViaNpm, execFilePromise, isClaudePluginInstalled, getClaudeInstalledPluginsPath, renderCommand

  // ── Cross-cutting SDK systems adapters integrate with ──
  'packages/sdk/src/session.ts',               // Session state: readSessionFile, writeSessionFile, updateSessionState, deleteSessionFile, sessionFileExists, getSessionFilePath, getCurrentTimestamp, updateIterationTimes, isIterationTooFast
  'packages/sdk/src/cli/completionProof.ts',   // resolveCompletionProof (SHA256 of runId + salt) — stop hook must validate
  'packages/sdk/src/prompts/context.ts',       // PromptContext factories: createClaudeCodeContext, createCodexContext, createPiContext
  'packages/sdk/src/prompts/types.ts',         // PromptContext interface: hookDriven, interactive tri-state, capabilities, loopControlTerm, etc.
  'packages/sdk/src/compression/',             // loadCompressionConfig, densityFilterText, estimateTokens, getOrCompressFile, findLibraryFiles
  'packages/sdk/src/cli/commands/skill.ts',    // discoverSkillsInternal — used by session-start hooks for context injection

  // ── Command sync infrastructure (must be integrated per-plugin) ──
  'scripts/sync-plugin-commands.cjs',          // Central orchestrator: spawns all plugin sync scripts, supports --check mode
  'scripts/plugin-command-sync-lib.cjs',       // Shared sync library: syncCommandMirrors, syncSkillsFromCommands, buildSkillFromCommand, reportCheckResult
  'plugins/babysitter-codex/scripts/sync-command-skills.js',     // Reference: skills-only sync variant
  'plugins/babysitter-cursor/scripts/sync-command-surfaces.js',  // Reference: commands + skills sync variant
  'plugins/babysitter-github/scripts/sync-command-surfaces.js',  // Reference: commands + skills sync variant
  'plugins/babysitter-pi/scripts/sync-command-docs.cjs',         // Reference: custom docs sync variant
];

/**
 * Complete HarnessAdapter interface methods (from types.ts) that the research
 * and adapter implementation tasks must be aware of:
 *
 * REQUIRED:
 *   name: string (readonly)
 *   isActive(): boolean                    — env var detection
 *   resolveSessionId(parsed): string|undefined  — explicit arg → env vars → env file → undefined
 *   resolveStateDir(args): string|undefined     — explicit arg → BABYSITTER_STATE_DIR → ~/.a5c/state/ (global)
 *   resolvePluginRoot(args): string|undefined   — args or harness-specific env vars
 *   bindSession(opts: SessionBindOptions): Promise<SessionBindResult>  — run:create → state file
 *   handleStopHook(args: HookHandlerArgs): Promise<number>            — approve/block decision
 *   handleSessionStartHook(args: HookHandlerArgs): Promise<number>    — env file + state setup
 *   findHookDispatcherPath(startCwd: string): string|null             — locate hook dispatcher
 *
 * OPTIONAL:
 *   autoResolvesSessionId?(): boolean          — true = reject explicit --session-id
 *   getMissingSessionIdHint?(): string         — guidance when session ID missing
 *   supportsHookType?(hookType: string): boolean  — whitelist supported hook types
 *   getUnsupportedHookMessage?(hookType: string): string
 *   isCliInstalled?(): Promise<boolean>        — check if harness CLI binary exists
 *   getCliInfo?(): Promise<{command, version?, path?}>
 *   getCapabilities?(): HarnessCapability[]    — Programmatic, SessionBinding, StopHook, Mcp, HeadlessPrompt
 *   installHarness?(options): Promise<HarnessInstallResult>   — install the CLI itself
 *   installPlugin?(options): Promise<HarnessInstallResult>    — install the babysitter plugin
 *   getPromptContext?(opts?: {interactive?}): PromptContext   — harness-specific prompt config
 *
 * ENV PERSISTENCE MECHANISMS (session-start → stop hook):
 *   All adapters use BABYSITTER_SESSION_ID as the cross-harness standard env var.
 *   Session-start hooks persist it via TWO independent mechanisms:
 *   1. Env file injection (harness-specific) — writes BABYSITTER_SESSION_ID to env file
 *      so subsequent hooks (stop, pre-tool-use) receive it as an env var.
 *      - Claude Code: CLAUDE_ENV_FILE → writes "export BABYSITTER_SESSION_ID=..."
 *      - Codex: NO env file — CODEX_THREAD_ID auto-injected by Codex CLI natively
 *      - Gemini CLI: NO env file — GEMINI_SESSION_ID auto-injected by Gemini CLI natively
 *      - Cursor: NO env file — conversation_id comes only via hook stdin JSON
 *      - GitHub Copilot: COPILOT_ENV_FILE (or CLAUDE_ENV_FILE fallback) → writes "export BABYSITTER_SESSION_ID=..."
 *   2. State file (universal) — writes ~/.a5c/state/<sessionId>.md with YAML frontmatter
 *      for iteration tracking, run binding, and lifecycle management.
 *
 * CROSS-CUTTING CONCERNS the adapter may integrate with:
 *   - Session state (session.ts): readSessionFile, writeSessionFile, updateSessionState,
 *     deleteSessionFile, getCurrentTimestamp, updateIterationTimes, isIterationTooFast
 *   - Completion proof (completionProof.ts): resolveCompletionProof (SHA256 of runId + salt)
 *   - Compression (compression/): loadCompressionConfig, densityFilterText, estimateTokens,
 *     getOrCompressFile, findLibraryFiles — for compressing session-start hook output
 *   - Skill discovery (cli/commands/skill.ts): discoverSkillsInternal — for session-start context
 *   - Prompt context (prompts/context.ts): factory functions for harness-specific PromptContext
 *   - PiWrapper (piWrapper.ts): createPiSession for programmatic harnesses (PiSessionHandle
 *     with .prompt(), .steer(), .followUp(), .subscribe(), .executeBash(), .abort(), .dispose())
 *   - Install support (installSupport.ts): installCliViaNpm, execFilePromise, isClaudePluginInstalled
 */

// ---------------------------------------------------------------------------
// PHASE 0: Research
// ---------------------------------------------------------------------------

export const researchHarnessTask = defineTask('research-harness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research ${args.harnessName} integration surfaces and distribution`,
  description: 'Deep research into the harness extension model, hook lifecycle, session management, CLI invocation, environment variables, programmatic API, compression support, and distribution method',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration researcher and harness architect',
      task: `Conduct thorough research on ${args.harnessName} to produce actionable findings for every HarnessAdapter interface method, plugin structure, and SDK integration point`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        sdkHarnessCore,
        referencePlugins,
      },
      instructions: [
        // ── PREREQUISITE: Clone babysitter repo and study existing implementations ──
        `Clone the babysitter repo (${babysitterRepo}) if not already available locally. The repo contains the complete SDK, all existing adapter implementations, and all reference plugins. This is the source of truth.`,
        'BEFORE researching the target harness, study the existing Claude Code and Codex plugin implementations thoroughly:',
        '  - Read plugins/babysitter/ end-to-end: plugin.json (hooks, skills, commands), hooks/ directory (session-start, stop, pre-tool-use, user-prompt-submit shell scripts), hooks/hooks.json, skills/babysit/SKILL.md, versions.json.',
        '  - Read plugins/babysitter-codex/ end-to-end: .codex-plugin/plugin.json, hooks.json, .app.json, skills/ directory (all 16 skills), versions.json.',
        '  - Read plugins/babysitter-pi/ end-to-end: package.json (omp field, bin scripts), extensions/, skills/babysitter/SKILL.md, versions.json, bin/ (cli.cjs, install.cjs, uninstall.cjs), scripts/setup.sh.',
        'Understand how each reference plugin: registers hooks, defines skills, handles installation/uninstallation, manages versions, and delegates to the SDK CLI.',

        // ── Understand the full adapter interface ──
        'Read packages/sdk/src/harness/types.ts thoroughly. Understand every method on HarnessAdapter (required and optional) and every type: HarnessCapability enum (Programmatic, SessionBinding, StopHook, Mcp, HeadlessPrompt), HarnessDiscoveryResult, CallerHarnessResult, HarnessInvokeOptions/Result, SessionBindOptions/Result, HookHandlerArgs, HarnessInstallOptions/Result, PiSessionOptions, PiPromptResult.',

        // ── Study ALL reference adapter implementations ──
        'Read claudeCode.ts (1200+ lines) as the canonical reference — understand how it implements: session-start hook (env file creation, state file baseline, skill discovery context injection, compression of session-start output via density filter), stop hook (journal replay, completion proof validation, pending effect inspection, approve/block decision), bindSession (state file creation with run association), installPlugin (filesystem operations to register with Claude), getPromptContext (createClaudeCodeContext factory).',
        'Read codex.ts — understand multi-format hooks.json support, Windows auto-detection for hookDriven flag, BABYSITTER_SESSION_ID/CODEX_THREAD_ID resolution chain (CODEX_THREAD_ID auto-injected by Codex, no env file), supportsHookType whitelist, getMissingSessionIdHint.',
        'Read pi.ts — understand the PI-specific adapter: PI_SESSION_ID/PI_PLUGIN_ROOT env vars, in-process model, loop-driver, programmatic delegation to piWrapper.ts.',
        'Read ohMyPi.ts — understand how it differs from pi.ts: OMP_SESSION_ID/OMP_PLUGIN_ROOT env vars, omp CLI, its own discovery entry.',
        'Read geminiCli.ts (960+ lines) — understand AfterAgent as primary continuation hook (not Stop), GEMINI_SESSION_ID/GEMINI_PROJECT_DIR/GEMINI_CWD env vars, session-start context generation with compression.',
        'Read nullAdapter.ts and customAdapter.ts — understand the fallback patterns, how customAdapter returns autoResolvesSessionId=false and supportsHookType=false.',

        // ── Study env persistence between hooks ──
        'Understand the TWO independent persistence mechanisms in session-start hooks:',
        '  1. ENV FILE INJECTION (BABYSITTER_SESSION_ID, cross-harness standard): session-start hook writes BABYSITTER_SESSION_ID to the harness env file. Claude Code uses CLAUDE_ENV_FILE, GitHub Copilot uses COPILOT_ENV_FILE or CLAUDE_ENV_FILE fallback. Codex auto-injects CODEX_THREAD_ID natively (no env file needed). Gemini CLI auto-injects GEMINI_SESSION_ID natively. Cursor has NO env file (conversation_id via stdin JSON only).',
        '  2. STATE FILE (universal, ~/.a5c/state/): writes <sessionId>.md with YAML frontmatter for iteration tracking, run binding, and lifecycle management. Uses getGlobalStateDir() from config/defaults.ts. State dir is NEVER derived from plugin root.',
        'When researching the target harness, determine: does it provide an env file mechanism? Does it auto-inject session ID into hook subprocesses? Or does it only pass session ID via stdin JSON? This determines which persistence pattern the adapter should use.',

        // ── Study the discovery subsystem (two mechanisms) ──
        'Read discovery.ts thoroughly — understand BOTH discovery mechanisms:',
        '  1. INSTALLED DISCOVERY (discoverHarnesses): probes each KNOWN_HARNESSES entry via Promise.allSettled + checkCliAvailable (which/where + --version). Returns HarnessDiscoveryResult[] with: name, installed, version, cliPath, cliCommand, configFound, capabilities, platform.',
        '  2. IN-SESSION DETECTION (detectCallerHarness): checks callerEnvVars from KNOWN_HARNESSES against process.env. Returns CallerHarnessResult with: name, matchedEnvVars, capabilities. First match in KNOWN_HARNESSES order wins (important for priority).',
        'Understand KNOWN_HARNESSES array: each entry has { name, cli, callerEnvVars, capabilities }. The callerEnvVars list determines in-session detection.',
        'Understand CONFIG_PATHS map: maps harness names to config directory names checked for configFound in discovery results.',
        'Understand checkCliAvailable: runs which/where to find binary, then <command> --version to extract version string.',

        // ── Study the invocation/wrapping subsystem ──
        'Read invoker.ts thoroughly — understand harness wrapping for use as an orchestration tool:',
        '  - HARNESS_CLI_MAP: per-harness { cli, workspaceFlag?, supportsModel, promptStyle ("flag"|"positional"), baseArgs? }. This determines how buildHarnessArgs() constructs CLI arguments.',
        '  - buildHarnessArgs(name, options): pure function that maps HarnessInvokeOptions to CLI argument array using HARNESS_CLI_MAP. Must produce valid CLI invocations for each harness.',
        '  - invokeHarness(name, options): spawns the CLI as a child process with timeout, workspace, model, env override. Returns HarnessInvokeResult with success, output, exitCode, duration.',
        'This wrapping is what enables harness:invoke and harness:create-run to use any harness as a tool for delegating work.',

        // ── Study the adapter registry ──
        'Read registry.ts — understand the auto-detection and lookup system:',
        '  - detectAdapter(): iterates knownAdapters in priority order, calls isActive() on each. First active adapter wins. Falls back to customAdapter.',
        '  - getAdapterByName(name): explicit lookup by harness name string.',
        '  - listSupportedHarnesses(): returns names of all registered adapters.',
        '  - get/set/resetAdapter(): singleton pattern for current active adapter.',
        'The priority order in knownAdapters matters — more specific harnesses (Codex, oh-my-pi, pi) before generic ones (Claude Code, Gemini CLI).',

        // ── Study programmatic session API ──
        'Read piWrapper.ts — understand createPiSession and PiSessionHandle for programmatic harnesses:',
        '  - createPiSession(options: PiSessionOptions) → PiSessionHandle with lazy initialization.',
        '  - PiSessionHandle methods: .prompt(text), .steer(text), .followUp(text), .subscribe(listener), .executeBash(command), .abort(), .dispose().',
        '  - PiEventListener type for subscribing to session events.',
        '  - Compression integration in session context generation.',
        'If the target harness has a programmatic API (not just CLI), a similar wrapper pattern should be created.',

        // ── Study cross-cutting SDK systems the adapter touches ──
        'Read session.ts — understand session state management: readSessionFile, writeSessionFile, updateSessionState, deleteSessionFile, sessionFileExists, getSessionFilePath, getCurrentTimestamp, updateIterationTimes, isIterationTooFast. These are used in both session-start and stop hooks.',
        'Read cli/completionProof.ts — understand resolveCompletionProof (SHA256 of runId + salt). Stop hooks must validate this before approving completion.',
        'Read compression/ — understand loadCompressionConfig, densityFilterText, estimateTokens, getOrCompressFile, findLibraryFiles. Claude Code and Gemini CLI adapters compress session-start output and cache process library files.',
        'Read prompts/context.ts — understand the PromptContext factory functions (createClaudeCodeContext, createCodexContext, createPiContext) and how getPromptContext() uses them. Note the hookDriven, interactive tri-state, capabilities, loopControlTerm fields.',
        'Read harness/installSupport.ts — understand installCliViaNpm, execFilePromise, isClaudePluginInstalled, getClaudeInstalledPluginsPath, renderCommand.',
        'Read cli/commands/skill.ts — understand discoverSkillsInternal, used by session-start hooks to inject available skills into context.',

        // ── CRITICAL PRINCIPLE: Official Documentation First ──
        'IMPORTANT: Do NOT assume hook types, hook output behavior, plugin format, or distribution model from other harnesses. Each harness has its own official documentation that MUST be consulted. The research must verify from official sources whether a stop-hook or equivalent exists that can block agent completion — this determines the entire orchestration model.',

        // ── NOW research the target harness from OFFICIAL DOCUMENTATION ──
        `Find and read the official documentation for ${args.harnessName}. This includes: the harness GitHub repo README, any docs/ directory, official website documentation, plugin/extension developer guides, and hook/event reference pages. Do not infer the extension model from code patterns alone — find the authoritative documentation.`,
        `Research how ${args.harnessName} actually works: its CLI command, flags, plugin/extension model, hook/event system, configuration files, and environment variables.`,

        // ── A. Verify EXACT hook event type names from official docs ──
        `Verify the EXACT hook/event type names used by ${args.harnessName} from official documentation. Different harnesses use different naming conventions and casing (e.g. Claude Code uses "PreToolUse"/"PostToolUse"/"Stop", Codex uses "SessionStart"/"Stop"/"UserPromptSubmit", GitHub Copilot uses camelCase "sessionStart"/"preToolUse"/"postToolUse"/"errorOccurred"). Do NOT assume the naming convention from one harness applies to another.`,

        // ── B. Verify which hooks can control flow ──
        `Verify WHICH hooks can return flow-control decisions (block/approve/deny) vs which hooks' outputs are IGNORED by the harness. For example, in some harnesses only one hook type (e.g. preToolUse or Stop) can actually influence execution flow — all other hook types fire-and-forget with their output discarded. This is the CRITICAL determination: if no hook can block agent completion and trigger re-entry, the orchestration model MUST use in-turn loop driving instead of hook-driven orchestration.`,

        // ── C. Verify hooks configuration format ──
        `Verify the hooks configuration file format for ${args.harnessName}: file name (hooks.json, settings.json, config.toml, etc.), schema version field (e.g. "version": 1), entry schema (what fields each hook entry requires — type, command paths, platform-specific scripts for bash/powershell/cmd, cwd, timeoutSec, matchers, etc.), and how hooks are registered (config file editing, CLI commands, or programmatic registration).`,

        // ── D. Verify plugin manifest format and location ──
        `Verify the plugin/extension manifest format and allowed locations for ${args.harnessName}: where the manifest file goes (e.g. .plugin/, .github/plugin/, .claude-plugin/, repo root, .codex-plugin/, etc.), what the manifest file is named (plugin.json, package.json, manifest.json, etc.), what fields the manifest supports, and what validation rules exist. Different harnesses have very different plugin discovery mechanisms.`,

        // ── E. Verify plugin installation/distribution model ──
        `Verify the plugin installation and distribution model for ${args.harnessName}: CLI commands for install/uninstall/update (e.g. "copilot plugin install OWNER/REPO", "claude plugin install", "codex marketplace install"), marketplace system and commands (marketplace.json, browse/list commands), plugin storage paths (e.g. ~/.copilot/installed-plugins/, ~/.claude/plugins/, etc.), and whether plugins are distributed via npm, git repos, binary downloads, or a custom marketplace.`,
        `CRITICAL: Verify the EXACT local plugin install path from official docs. Different harnesses use different conventions (e.g. Cursor uses ~/.cursor/plugins/local/<name>/, Codex uses ~/.codex/plugins/<name>/). Getting this wrong means the harness won't discover the plugin. Do NOT assume the path from other harnesses.`,

        // ── F. Read official documentation URLs ──
        `The research agent MUST find and read the harness's official plugin/extension/hook documentation URLs. Do not infer behavior from code patterns or from other harnesses. If official documentation is sparse or missing, document that as a risk — the integration may need to be based on reverse engineering, which carries higher risk of breaking on updates.`,

        // ── H. Plugin manifest format verification ──
        `Verify the exact schema for plugin.json (or equivalent manifest) for ${args.harnessName} — specifically: which fields use directory paths vs arrays vs inline objects. In particular: how are skills referenced (path string like "skills/" vs array of {name, file} objects)? How are hooks referenced (path string like "hooks.json" vs inline object mapping event names to script paths)? How are commands referenced (path string like "commands/" vs array)? This determines the correct manifest format the createPluginTask must produce.`,

        // ── G. Verify stop-hook or equivalent mechanism ──
        `Verify whether ${args.harnessName} has a stop-hook-like mechanism that can BLOCK agent completion and trigger re-entry. This is the single most important determination for the orchestration model. Specifically determine: (1) Can any hook/event prevent the agent from completing its turn? (2) If a hook blocks, does the agent re-enter with the hook's output as context? (3) Or does the harness use a different continuation model (loop-driver events, programmatic session API, or none at all)? Document the EXACT mechanism with references to official docs.`,

        `Determine what environment variables ${args.harnessName} sets when running agents (session ID, thread ID, plugin/extension root, workspace, CWD, env file path, etc.). These become the callerEnvVars in KNOWN_HARNESSES and the isActive() checks in the adapter.`,
        `Determine the loop continuation mechanism: stop-hook (harness calls agent back after hook returns), loop-driver (harness event like agent_end triggers next iteration), or in-turn (agent drives the loop itself). This determines hookDriven and loopControlTerm in PromptContext.`,
        `Determine if ${args.harnessName} supports programmatic (non-interactive) invocation, and if so, what the API looks like (similar to PiSessionHandle?). This determines the Programmatic capability.`,

        // ── Discovery requirements (both mechanisms) ──
        `Determine the CLI command name for ${args.harnessName} (e.g. "claude", "codex", "pi", "omp", "gemini"). This becomes the cli field in KNOWN_HARNESSES and HARNESS_CLI_MAP.`,
        `Determine how to probe whether ${args.harnessName} CLI is installed: does it support --version? What does its version output look like? This determines how checkCliAvailable() will detect it during discoverHarnesses() (installed-discovery).`,
        `Determine which environment variables uniquely identify that we are running INSIDE ${args.harnessName}. This determines callerEnvVars for detectCallerHarness() (in-session detection). The env vars must be specific enough to avoid false positives with other harnesses.`,
        `Determine if ${args.harnessName} has a config directory (e.g. .claude/, .codex/, .pi/, .gemini/). This becomes the CONFIG_PATHS entry for configFound in discovery results.`,

        // ── Wrapping/invocation requirements ──
        'Determine CLI invocation flags for the HARNESS_CLI_MAP entry. This is how the babysitter SDK wraps and invokes this harness as a tool for delegating work:',
        '  - cli: shell command name (must match KNOWN_HARNESSES cli)',
        '  - workspaceFlag: how to pass workspace directory (e.g. "--workspace", "-C", or undefined if not supported)',
        '  - supportsModel: does it accept a --model flag?',
        '  - promptStyle: "flag" (--prompt "text") or "positional" ("text" as last arg)',
        '  - baseArgs: any required args for headless/non-interactive mode (e.g. codex uses ["exec", "--dangerously-bypass-approvals-and-sandbox", "--skip-git-repo-check"])',
        'These determine how buildHarnessArgs() constructs CLI arguments and how invokeHarness() spawns the process. Both are used by harness:invoke and harness:create-run.',

        // ── Plugin structure (verified from official docs per steps D and E above) ──
        `Determine the plugin/extension directory layout expected by ${args.harnessName}: where manifests go, where hooks go, where skills/agents go, where config goes. This MUST be verified from official documentation (step D above), not assumed from other harnesses.`,
        `Determine the distribution method: npm package, plugin marketplace, extension store, git clone, manual install, CLI-driven install commands, etc. This MUST be verified from official documentation (step E above).`,

        // ── Map findings to EVERY adapter interface method ──
        'For each HarnessAdapter method (both required and optional), document how it should be implemented for this harness:',
        '  - isActive(): which env vars to check (these are also the callerEnvVars for detectCallerHarness)',
        '  - resolveSessionId(): full resolution chain specific to this harness (explicit arg → env vars → env file → undefined)',
        '  - resolveStateDir(): where state files should live (defaults to ~/.a5c/state/ via getGlobalStateDir())',
        '  - resolvePluginRoot(): how the plugin root is determined (env var name, or arg)',
        '  - bindSession(): how to create state file and associate run with session',
        '  - handleStopHook(): what the stop hook receives/returns, how it validates completion proof via resolveCompletionProof, or equivalent mechanism if no stop-hook exists',
        '  - handleSessionStartHook(): what context to inject at session start (env file, state file, skill discovery, process library info), whether to use compression (densityFilterText, getOrCompressFile)',
        '  - findHookDispatcherPath(): where the hook dispatcher lives in the plugin directory tree',
        '  - autoResolvesSessionId(): whether explicit --session-id should be rejected (true for most harnesses that set env vars)',
        '  - getMissingSessionIdHint(): what guidance to show when session ID is missing (e.g. "should be available from the Harness hook callback")',
        '  - supportsHookType(): which hook types are supported by this harness (e.g. stop, session-start)',
        '  - getUnsupportedHookMessage(): error message for unsupported hook types',
        '  - isCliInstalled(): how to detect the CLI binary (uses checkCliAvailable pattern)',
        '  - getCliInfo(): command name, version parsing, path resolution',
        '  - getCapabilities(): which HarnessCapability values to declare (Programmatic, SessionBinding, StopHook, Mcp, HeadlessPrompt)',
        '  - installHarness(): how to install the CLI itself (npm, brew, binary download, etc.)',
        '  - installPlugin(): how to install/register the babysitter plugin into the harness (copy files, register hooks, npm link, etc.)',
        '  - getPromptContext(): which PromptContext factory to use or create, with correct hookDriven, loopControlTerm, interactive, capabilities, sessionBindingFlags, sessionEnvVars',
        'Document whether compression integration is appropriate for this harness (session-start output size, process library caching).',
        'Document whether a PiWrapper-style programmatic session wrapper should be created (createHarnessSession → SessionHandle with .prompt(), .followUp(), .dispose()).',
        'Document the priority order this adapter should have in registry.ts knownAdapters relative to existing adapters.',
        'Return structured findings that implementation tasks can act on without guessing.',
      ],
      outputFormat: 'JSON with distribution, envVars, hookModel (including exact hook type names, which hooks control flow, hooks config format with schema version and entry fields), loopMechanism, discoverySpec, invokerSpec, pluginLayout (including manifest location and format), adapterMethodMap, envPersistence, sessionManagement, compressionSupport, programmaticApi, capabilities, promptContextFactory, registryPriority, installMethod (including CLI commands and storage paths), officialDocsUrls, risks',
    },
    outputSchema: {
      type: 'object',
      required: ['distribution', 'envVars', 'hookModel', 'loopMechanism', 'discoverySpec', 'invokerSpec', 'pluginLayout', 'adapterMethodMap', 'capabilities', 'risks'],
      properties: {
        distribution: { type: 'object', description: 'How the plugin is distributed and installed' },
        envVars: { type: 'array', items: { type: 'string' }, description: 'All environment variables the harness sets when running' },
        hookModel: { type: 'object', description: 'Hook/event model: exact type names (verified from official docs), which hooks can control flow (block/approve/deny) vs fire-and-forget, hooks config file format (schema version, entry fields, platform-specific script paths), registration method' },
        loopMechanism: { type: 'string', description: 'stop-hook, loop-driver, or in-turn' },
        discoverySpec: {
          type: 'object',
          description: 'KNOWN_HARNESSES entry spec',
          properties: {
            name: { type: 'string' },
            cli: { type: 'string' },
            callerEnvVars: { type: 'array', items: { type: 'string' } },
            capabilities: { type: 'array', items: { type: 'string' } },
            configPaths: { type: 'array', items: { type: 'string' } },
          },
        },
        invokerSpec: {
          type: 'object',
          description: 'HARNESS_CLI_MAP entry spec for wrapping/invocation',
          properties: {
            cli: { type: 'string' },
            workspaceFlag: { type: 'string' },
            supportsModel: { type: 'boolean' },
            promptStyle: { type: 'string' },
            baseArgs: { type: 'array', items: { type: 'string' } },
          },
        },
        pluginLayout: { type: 'object', description: 'Expected plugin directory structure: manifest file location and format (verified from official docs), allowed manifest directories, manifest fields and validation rules' },
        adapterMethodMap: { type: 'object', description: 'How each HarnessAdapter method (required + optional) maps to this harness' },
        envPersistence: { type: 'object', description: 'How the harness persists session ID between hooks: env file mechanism (like CLAUDE_ENV_FILE), native env var injection (like GEMINI_SESSION_ID), or stdin-only (like Cursor conversation_id). Determines session-start hook implementation.' },
        sessionManagement: { type: 'object', description: 'Session state lifecycle: creation, persistence, iteration timing, isIterationTooFast' },
        compressionSupport: { type: 'object', description: 'Whether/how to integrate compression for session-start context and process library caching' },
        programmaticApi: { type: 'object', description: 'PiWrapper-style programmatic session API: whether it exists, API shape, or null' },
        capabilities: { type: 'array', items: { type: 'string' }, description: 'HarnessCapability values: Programmatic, SessionBinding, StopHook, Mcp, HeadlessPrompt' },
        promptContextFactory: { type: 'string', description: 'Which factory to use or create for getPromptContext()' },
        registryPriority: { type: 'string', description: 'Where this adapter goes in registry.ts knownAdapters priority order' },
        installMethod: { type: 'object', description: 'How installHarness() and installPlugin() should work: CLI commands for install/uninstall/update, marketplace commands, plugin storage paths' },
        officialDocsUrls: { type: 'array', items: { type: 'string' }, description: 'URLs of official documentation pages consulted during research (plugin dev guide, hook reference, CLI reference, etc.)' },
        risks: { type: 'array', items: { type: 'string' } },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'research'],
}));

// ---------------------------------------------------------------------------
// PHASE 1: SDK Adapter
// ---------------------------------------------------------------------------

export const implementAdapterTask = defineTask('implement-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.harnessName} SDK harness adapter`,
  description: 'Create the full HarnessAdapter implementation (all required + applicable optional methods), register in discovery/invoker/registry, and integrate with session state, compression, and prompt context',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior SDK engineer',
      task: `Implement the complete ${args.harnessName} harness adapter in the SDK and register it across all harness subsystems`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        adapterName: args.adapterName,
        adapterFile: args.adapterFile,
        research: args.research,
        sdkHarnessCore,
      },
      instructions: [
        // ── Study the reference implementations thoroughly ──
        'Read claudeCode.ts end-to-end as the canonical reference. Pay special attention to:',
        '  - How handleSessionStartHook builds context: env file parsing, skill discovery injection, process library resolution, compression via densityFilterText and getOrCompressFile/findLibraryFiles.',
        '  - How handleStopHook replays the journal, validates completion proof, inspects pending effects, and returns approve/block JSON.',
        '  - How bindSession creates the state file with run association metadata.',
        '  - How installPlugin registers the plugin with the harness filesystem.',
        '  - How getPromptContext() uses createClaudeCodeContext from prompts/context.ts.',
        'Read codex.ts — note multi-format hooks.json, Windows hookDriven detection, supportsHookType whitelist, CODEX_* env chain.',
        'Read pi.ts — note in-process model, loop-driver, dual env vars, delegation to piWrapper.ts.',
        'Read geminiCli.ts — note AfterAgent continuation, GEMINI_* env chain, session-start context generation.',

        // ── Create the adapter file ──
        `Create packages/sdk/src/harness/${args.adapterFile || args.adapterName + '.ts'} implementing the HarnessAdapter interface.`,

        // ── Required methods ──
        'Implement isActive(): check the harness-specific environment variables identified in research.',
        'Implement resolveSessionId(parsed): follow the standard chain: explicit arg → BABYSITTER_SESSION_ID (cross-harness standard) → harness-native env vars (e.g. CODEX_THREAD_ID, GEMINI_SESSION_ID) → env file parsing for BABYSITTER_SESSION_ID → undefined.',
        'Implement resolveStateDir(args): explicit arg → getGlobalStateDir() (resolves BABYSITTER_STATE_DIR → BABYSITTER_GLOBAL_STATE_DIR → ~/.a5c/state/). Do NOT derive state dir from plugin root.',
        'Implement resolvePluginRoot(args): explicit arg → harness-specific env var (e.g. HARNESS_PLUGIN_ROOT) → undefined.',
        'Implement bindSession(opts: SessionBindOptions): create or update the session state file with run association. Use writeSessionFile from session.ts. Return SessionBindResult with harness name, sessionId, stateFile path.',
        'Implement handleStopHook(args: HookHandlerArgs): read JSON from stdin, load session state, replay journal to check for completion proof and pending effects, return approve/block JSON to stdout. Integrate with resolveCompletionProof from cli/completionProof.ts.',
        'Implement handleSessionStartHook(args: HookHandlerArgs): read JSON from stdin (if applicable), create env file (if harness uses env files for session ID), write baseline state file, inject context (skill discovery, process library info). Consider compression integration: use loadCompressionConfig, densityFilterText for large context, getOrCompressFile/findLibraryFiles for process library caching.',
        'Implement findHookDispatcherPath(startCwd): locate the hook dispatcher script/binary in the plugin directory tree. Walk up from startCwd looking for the plugin structure.',

        // ── Optional methods (implement all that apply) ──
        'Implement autoResolvesSessionId(): return true if the adapter auto-resolves session IDs from env vars (most adapters do). When true, explicitly passing --session-id is rejected as a conflict.',
        'Implement getMissingSessionIdHint(): return a guidance string explaining how the session ID should be available (e.g. "Session ID should be available from the Harness hook callback").',
        'Implement supportsHookType(hookType): whitelist the hook types this harness supports (e.g. "stop", "session-start"). Return false for unsupported types.',
        'Implement getUnsupportedHookMessage(hookType): return an error message for unsupported hook types.',
        'Implement isCliInstalled(): use checkCliAvailable pattern — spawn "which"/"where" + the CLI command, then try "--version".',
        'Implement getCliInfo(): return { command, version, path } by probing the CLI.',
        'Implement getCapabilities(): return the HarnessCapability array from the research findings.',
        'Implement installHarness(options): install the CLI itself (npm install -g, brew, etc.).',
        'Implement installPlugin(options): install/register the babysitter plugin into the harness (copy files, register hooks, update config).',
        'Implement getPromptContext(opts?): create or use the appropriate PromptContext factory from prompts/context.ts. If a new factory is needed, create it in context.ts following the pattern of createClaudeCodeContext/createCodexContext/createPiContext. Respect the interactive tri-state (true/false/undefined).',

        // ── If programmatic API exists ──
        'If the harness supports programmatic (non-CLI) sessions, create a wrapper similar to piWrapper.ts (createPiSession → SessionHandle with .prompt(), .followUp(), .dispose()). This enables harness:create-run to use the harness programmatically.',

        // ── Register in discovery subsystem (BOTH mechanisms) ──
        `Add a KNOWN_HARNESSES entry in discovery.ts: { name: "${args.adapterName}", cli: "<command>", callerEnvVars: [...env vars that uniquely identify running inside this harness...], capabilities: [...HarnessCapability values...] }.`,
        'The callerEnvVars determine in-session detection via detectCallerHarness(). They must be specific enough to avoid false positives.',
        'The cli field determines installed-discovery via discoverHarnesses() — checkCliAvailable() will probe this command with which/where + --version.',
        'Add CONFIG_PATHS entry in discovery.ts if the harness has a config directory (e.g. ".harness") — used for configFound in discovery results.',

        // ── Register in invocation/wrapping subsystem ──
        `Add a HARNESS_CLI_MAP entry in invoker.ts: { cli: "<command>", workspaceFlag: "<flag>"|undefined, supportsModel: <bool>, promptStyle: "flag"|"positional", baseArgs: [...] }.`,
        'This entry enables buildHarnessArgs() to construct valid CLI invocations for this harness.',
        'This enables invokeHarness() to spawn the harness as a child process — used by harness:invoke and harness:create-run.',
        'Verify buildHarnessArgs produces correct arguments for common invocation patterns (with/without workspace, model, prompt).',

        // ── Register in adapter registry ──
        'Add the adapter factory to registry.ts knownAdapters array in the correct priority order. More specific harnesses (e.g. oh-my-pi) before generic ones (e.g. pi). The order determines which adapter wins when multiple isActive() checks match.',
        'Export the factory function from harness/index.ts following the existing export pattern.',

        // ── Validation ──
        'Create a factory function create<Name>Adapter() exported from the adapter file.',
        'Run lint to verify no type errors: npm run lint --workspace=@a5c-ai/babysitter-sdk',
        'Verify the adapter compiles and all interface methods are implemented.',
      ],
      outputFormat: 'JSON with adapterFile, discoveryEntry, invokerEntry, registryPosition, promptContextFactory, programmaticWrapper, filesCreated, filesModified, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        adapterFile: { type: 'string' },
        discoveryEntry: { type: 'object' },
        invokerEntry: { type: 'object' },
        registryPosition: { type: 'string' },
        promptContextFactory: { type: 'string' },
        programmaticWrapper: { type: 'string' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'adapter', 'sdk'],
}));

// ---------------------------------------------------------------------------
// PHASE 2: Plugin structure
// ---------------------------------------------------------------------------

export const createPluginTask = defineTask('create-plugin', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create ${args.harnessName} plugin structure`,
  description: 'Create the plugin manifest, hook scripts, and configuration files following the reference plugin patterns',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior plugin engineer',
      task: `Create the babysitter plugin for ${args.harnessName} following the reference plugin patterns`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        pluginDir: args.pluginDir,
        research: args.research,
        referencePlugins,
      },
      instructions: [
        'Read the reference plugins to understand the complete plugin structure.',
        `Create the plugin directory at ${args.pluginDir} with the correct manifest format for ${args.harnessName}.`,
        'Create the plugin manifest (plugin.json, .codex-plugin/plugin.json, or package.json) with correct metadata, hooks, skills, and commands references. The manifest format and location MUST match what the research phase verified from official documentation (manifest location, required fields, validation rules).',
        'Create hook scripts following the standard pattern: resolve plugin root, ensure CLI available, capture stdin, invoke babysitter hook:run, output JSON.',
        'Hook scripts must follow the reference pattern in plugins/babysitter/hooks/ - they delegate to the SDK CLI, not implement logic directly.',
        'IMPORTANT: The hooks configuration file (hooks.json, settings.json, etc.) MUST use the exact format verified from research — including schema version field (e.g. "version": 1), correct hook type names (which may be camelCase, PascalCase, or kebab-case depending on harness), platform-specific script paths (bash, powershell, cmd), and any required fields (cwd, timeoutSec, matchers, etc.). Do NOT copy the hooks config format from another harness — use what the research phase discovered from official docs.',
        'Create a versions.json file with {"sdkVersion": "<current-version>"} for dependency management. This file MUST be maintained by CI — add it to scripts/bump-version.mjs (the versionsPath loop), .github/workflows/staging-publish.yml (the versions.json writer AND the git add step), and .github/workflows/release.yml (the git add step). Without CI integration, the file goes stale and the plugin falls back to "latest".',
        'Create any harness-specific config files (hooks.json, .app.json, config.toml, etc.).',
        'Do NOT create orchestration scripts, loop drivers, effect adapters, or result adapters - the SDK handles all of that.',
        'Do NOT create custom tools for run:create, run:iterate, task:post - the babysitter CLI is the tool.',

        // ── PLUGIN MANIFEST FORMAT RULES (CRITICAL) ──
        'The `skills` field in plugin.json must be a directory path string like `"skills/"` (NOT an array of {name, file} objects). The harness auto-discovers SKILL.md files in subdirectories.',
        'The `hooks` field in plugin.json must be a path string like `"hooks.json"` (NOT an inline object mapping event names to script paths).',
        'Do NOT include a `contextFileName` field — context files (.cursorrules, AGENTS.md, GEMINI.md) are discovered by convention, not configured in the manifest.',

        // ── PLUGIN NAME CONVENTION (CRITICAL) ──
        'The plugin MUST register as "babysitter" in the harness plugin manifest — NOT "babysitter-<harness>". This applies to: the `name` field in .cursor-plugin/plugin.json, .codex-plugin/plugin.json, .github/plugin.json, or equivalent manifest; the PLUGIN_NAME constant in install-shared.js or install.js; marketplace entry names; and install target directory names. The npm package name (@a5c-ai/babysitter-<harness>) and CLI bin name (babysitter-<harness>) remain harness-specific, but the plugin identity within the harness ecosystem is always just "babysitter".',
        'Log prefixes in install/uninstall scripts should use "[babysitter]", not "[babysitter-<harness>]".',
        'The install target directory should be "<harness-plugins-dir>/babysitter/", not "<harness-plugins-dir>/babysitter-<harness>/".',
      ],
      outputFormat: 'JSON with pluginDir, filesCreated, manifest, hookScripts, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['pluginDir', 'filesCreated', 'summary'],
      properties: {
        pluginDir: { type: 'string' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'plugin'],
}));

// ---------------------------------------------------------------------------
// PHASE 3: Skill porting
// ---------------------------------------------------------------------------

export const portSkillsTask = defineTask('port-skills', (args, taskCtx) => ({
  kind: 'agent',
  title: `Port skills to ${args.harnessName} format`,
  description: 'Adapt skills from the reference plugins into the target harness skill format',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior skill migration engineer',
      task: `Port the babysitter skills into ${args.harnessName} plugin format`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        pluginDir: args.pluginDir,
        research: args.research,
        referencePlugins,
      },
      instructions: [
        'Read the skills from the reference plugins (babysitter/skills/, babysitter-codex/skills/).',
        `Determine the skill format for ${args.harnessName} from the research findings. Skill formats vary significantly across harnesses: SKILL.md with YAML frontmatter (Claude Code), AGENTS.md (Codex), GEMINI.md (Gemini CLI), .toml config files, or entirely different formats. The research phase should have verified the exact skill definition format from official docs — use that, not assumptions.`,
        'At minimum, port the core babysit skill - this is the primary orchestration entry point.',
        'The babysit SKILL.md should be thin: SDK/CLI dependency setup from versions.json (read ${PLUGIN_ROOT}/versions.json — NOT plugin.json or package.json), then a single CLI command: babysitter instructions:babysit-skill --harness <name> --json',
        'Port additional skills as appropriate for the harness (call, doctor, help, resume, observe, plan, etc.).',
        'Each skill should use the SDK CLI instructions command to generate its content dynamically, not embed static instructions.',
        'Ensure the skill frontmatter has correct allowed-tools for the target harness.',
        'If the harness uses AGENTS.md or GEMINI.md instead of individual SKILL.md files, create the appropriate format.',

        // ── COMMANDS DIRECTORY PORTING (CRITICAL) ──
        'IMPORTANT: In addition to skills, you MUST also create a commands/ directory in the plugin with ALL 15 command files from the reference plugin. Read plugins/babysitter/commands/ and copy ALL files identically.',
        'The 15 commands to port are: assimilate, call, cleanup, contrib, doctor, forever, help, observe, plan, plugins, project-install, resume, retrospect, user-install, yolo.',
        'Commands are harness-agnostic — they invoke skills via the Skill tool and do NOT contain harness-specific logic. Copy them identically from the reference plugin.',
        'The commands/ directory structure must mirror plugins/babysitter/commands/ exactly. Each command file defines a slash command that users invoke (e.g. /babysit, /call, /doctor).',
        'Verify that the plugin manifest references the commands/ directory so the harness can discover and register all commands.',
      ],
      outputFormat: 'JSON with skillsPorted, filesCreated, format, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['skillsPorted', 'filesCreated', 'summary'],
      properties: {
        skillsPorted: { type: 'array', items: { type: 'string' } },
        filesCreated: { type: 'array', items: { type: 'string' } },
        format: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'skills'],
}));

// ---------------------------------------------------------------------------
// PHASE 4: Install / distribution
// ---------------------------------------------------------------------------

export const createInstallDistTask = defineTask('create-install-dist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create ${args.harnessName} installation and distribution method`,
  description: 'Create install/uninstall scripts, distribution packaging, and the babysitter plugin:install integration',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior distribution engineer',
      task: `Create the installation and distribution method for the ${args.harnessName} babysitter plugin`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        pluginDir: args.pluginDir,
        research: args.research,
        referencePlugins,
      },
      instructions: [
        'Read the reference plugin installation methods: babysitter uses plugin marketplace, babysitter-codex uses npm + marketplace, babysitter-pi uses npm package with bin scripts.',
        `Determine the right distribution method for ${args.harnessName} based on research findings.`,
        'Create install scripts (bin/install.cjs, scripts/setup.sh, or equivalent) that handle: SDK dependency installation, hook registration, config file placement.',
        'Create uninstall scripts that cleanly remove hooks, configs, and state files.',
        'If the harness has a plugin marketplace, create the marketplace manifest entry.',
        'If the harness uses npm distribution, set up package.json with correct bin, files, and omp/pi fields.',
        'Ensure the install flow uses babysitter plugin:install or equivalent for registration.',
        'The install script should be idempotent - safe to run multiple times.',

        // ── MARKETPLACE-FIRST INSTALLATION (CRITICAL) ──
        'The PRIMARY installation method must be marketplace-based (e.g. `copilot plugin install OWNER/REPO:path`, Cursor Marketplace, `babysitter plugin:install`). Document this as the recommended approach.',
        'npm/bin-based installation (npm install -g, npx) is a SECONDARY or development method, not the primary recommendation.',
        'The install scripts (bin/install.js) are for development/testing convenience, not the primary distribution mechanism.',

        // ── PLUGIN NAME AND INSTALL PATH CONVENTIONS (CRITICAL) ──
        'The plugin MUST install to a directory named "babysitter" (NOT "babysitter-<harness>"). For example, Cursor plugins go to ~/.cursor/plugins/local/babysitter/, Codex plugins to ~/.codex/plugins/babysitter/, etc. The PLUGIN_NAME constant in install-shared.js must be "babysitter".',
        'The install script must verify the correct local plugin install path from the harness official docs. For example, Cursor requires ~/.cursor/plugins/local/ (not ~/.cursor/plugins/ directly). Each harness has its own convention — do NOT assume the path from other harnesses.',
        'Marketplace entries must use name: "babysitter" (not "babysitter-<harness>").',
        'Log prefixes in install/uninstall output should use "[babysitter]".',
      ],
      outputFormat: 'JSON with method, filesCreated, installCommand, uninstallCommand, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'filesCreated', 'summary'],
      properties: {
        method: { type: 'string' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        installCommand: { type: 'string' },
        uninstallCommand: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'install', 'distribution'],
}));

// ---------------------------------------------------------------------------
// PHASE 5: Harness wrapper (for harness:create-run)
// ---------------------------------------------------------------------------

export const implementHarnessWrapperTask = defineTask('implement-harness-wrapper', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.harnessName} discovery, wrapping, and harness:create-run integration`,
  description: 'Verify both discovery mechanisms (installed + in-session), CLI wrapping via invoker, programmatic session API, and prompt context for harness:create-run',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior SDK engineer',
      task: `Ensure ${args.harnessName} works correctly with harness:discover, harness:invoke, and harness:create-run`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        adapterName: args.adapterName,
        research: args.research,
        sdkHarnessCore,
      },
      instructions: [
        // ── Understand the harness subsystems ──
        'Read the harness:discover command (cli/commands/harness.ts) — understand how it calls discoverHarnesses() for installed-discovery and detectCallerHarness() for in-session detection.',
        'Read discovery.ts — understand both discovery mechanisms:',
        '  1. discoverHarnesses(): probes each KNOWN_HARNESSES entry via checkCliAvailable (which/where + --version). Returns HarnessDiscoveryResult[] with installed, version, cliPath, configFound.',
        '  2. detectCallerHarness(): checks callerEnvVars against process.env. Returns CallerHarnessResult with name, matchedEnvVars, capabilities. First match wins.',
        'Read invoker.ts — understand how invokeHarness() spawns the CLI using buildHarnessArgs() with HARNESS_CLI_MAP flag mapping. This is the wrapping layer.',
        'Read harness:create-run (harnessPrompts.ts) — understand how buildProcessDefinitionSystemPrompt and buildOrchestrationSystemPrompt use the adapter getPromptContext() to build prompts for invoking harnesses as orchestration tools.',
        'Read piWrapper.ts — understand createPiSession and PiSessionHandle for programmatic harness invocation (used when the harness has Programmatic capability).',
        'Read registry.ts — understand detectAdapter() priority order and getAdapterByName() lookup.',

        // ── Verify INSTALLED DISCOVERY ──
        `Verify the KNOWN_HARNESSES entry for ${args.harnessName} has correct cli command so checkCliAvailable() can probe it.`,
        `Verify the KNOWN_HARNESSES entry has correct capabilities array matching what the harness actually supports.`,
        'Verify CONFIG_PATHS maps this harness to its config directory if applicable (for configFound in discovery results).',
        `Test: run babysitter harness:discover --json and verify ${args.harnessName} appears with correct installed/version/configFound status.`,

        // ── Verify IN-SESSION DETECTION ──
        `Verify the KNOWN_HARNESSES entry for ${args.harnessName} has correct callerEnvVars — these must uniquely identify running inside this harness.`,
        `Verify callerEnvVars don't overlap with other harnesses in a way that causes false positives (check KNOWN_HARNESSES order — first match wins).`,
        `Verify the adapter isActive() method checks the same env vars as callerEnvVars.`,
        'Verify the adapter priority in registry.ts knownAdapters is correct relative to other adapters.',

        // ── Verify CLI WRAPPING (invoker) ──
        `Verify the HARNESS_CLI_MAP entry for ${args.harnessName} has correct: cli, workspaceFlag, supportsModel, promptStyle, baseArgs.`,
        'Verify buildHarnessArgs() produces valid CLI arguments for this harness with various option combinations (workspace, model, prompt).',
        `Test: run babysitter harness:invoke ${args.adapterName} --prompt "test" --json and verify it produces a valid CLI invocation.`,

        // ── Verify PROMPT CONTEXT ──
        `If the adapter implements getPromptContext(), verify it returns a PromptContext with correct: harness, harnessLabel, platform, hookDriven, loopControlTerm, interactive tri-state, capabilities array, sessionBindingFlags, sessionEnvVars, pluginRootVar, and all required template variables.`,
        'Verify the prompt context produces correct output when passed through the compose pipeline (compose.ts → parts → templates).',
        `Test: run babysitter instructions:babysit-skill --harness ${args.adapterName} --json and verify it produces valid instructions.`,

        // ── Verify PROGRAMMATIC API (if applicable) ──
        'If the harness has Programmatic capability, verify a PiWrapper-style session wrapper exists or is created:',
        '  - createHarnessSession(options) → SessionHandle with .prompt(), .followUp(), .dispose()',
        '  - The wrapper must be importable from harness/index.ts and usable by harness:create-run.',
        'If the harness does NOT have Programmatic capability, verify invokeHarness() is the correct invocation path.',

        // ── Fix issues ──
        'Fix any issues found during verification. Return detailed results for each check.',
      ],
      outputFormat: 'JSON with discoveryWorks, invokerWorks, promptContextWorks, filesModified, issues, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        discoveryWorks: { type: 'boolean' },
        invokerWorks: { type: 'boolean' },
        promptContextWorks: { type: 'boolean' },
        filesModified: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'harness-wrapper'],
}));

// ---------------------------------------------------------------------------
// PHASE 6: README
// ---------------------------------------------------------------------------

export const writeReadmeTask = defineTask('write-readme', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write ${args.harnessName} plugin README`,
  description: 'Write user-facing README with installation, activation, usage, and troubleshooting',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior technical writer',
      task: `Write the README for the ${args.harnessName} babysitter plugin`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        pluginDir: args.pluginDir,
        research: args.research,
        pluginFiles: args.pluginFiles,
      },
      instructions: [
        'Write a README focused on the user experience: install, activate, use harness commands, troubleshoot.',
        'Do NOT expose raw babysitter CLI primitives (run:create, run:iterate, task:post) in the README.',
        'Keep SDK/CLI internals in skill docs, hook docs, or maintainer docs - not the user-facing README.',
        'Document installation prerequisites, the install command, and verification steps.',
        'Document how to start a new run, resume an existing run, and check run status using harness-native commands or skills.',
        'Document common issues: missing CLI, hook registration failures, stale state, permission errors.',
        'Include a section on upgrading and uninstalling.',
        'Reference the canonical babysit contract without weakening it.',

        // ── MARKETPLACE-FIRST README (CRITICAL) ──
        'Installation section must list marketplace/plugin-system installation as the PRIMARY method. npm/bin-based installation should be under "Alternative Installation" or "Development" section.',
        'Include a plugin structure section (directory tree showing skills/, commands/, hooks/, plugin.json, etc.).',
        'Include a marketplace distribution section explaining how to publish and discover the plugin through the harness marketplace.',
      ],
      outputFormat: 'JSON with readmePath, filesCreated, sections, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'filesCreated', 'summary'],
      properties: {
        readmePath: { type: 'string' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        sections: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'docs'],
}));

// ---------------------------------------------------------------------------
// PHASE 7: Adapter Tests
// ---------------------------------------------------------------------------

/**
 * Reference test files the agent should study:
 *   packages/sdk/src/harness/__tests__/harness.test.ts     — adapter method tests, session binding, stop hook, registry
 *   packages/sdk/src/harness/__tests__/discovery.test.ts   — KNOWN_HARNESSES, checkCliAvailable, discoverHarnesses, detectCallerHarness
 *   packages/sdk/src/harness/__tests__/invoker.test.ts     — HARNESS_CLI_MAP, buildHarnessArgs, invokeHarness
 *   packages/sdk/src/harness/__tests__/types.test.ts       — HarnessCapability enum, type compilation
 *   packages/sdk/src/harness/__tests__/customAdapter.test.ts — fallback adapter
 *   packages/sdk/src/harness/__tests__/piWrapper.test.ts   — programmatic session wrapper
 *   packages/sdk/src/harness/__tests__/geminiCli.test.ts   — adapter + hook tests with stdin injection
 */

export const writeAdapterTestsTask = defineTask('write-adapter-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write ${args.harnessName} SDK adapter unit tests`,
  description: 'Create comprehensive Vitest unit tests for the adapter, discovery entries, invoker entries, and registry integration following the existing test patterns',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior test engineer',
      task: `Write comprehensive unit tests for the ${args.harnessName} harness adapter in the SDK`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        adapterName: args.adapterName,
        adapterFile: args.adapterFile,
        research: args.research,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        // ── Study reference test patterns ──
        'Read packages/sdk/src/harness/__tests__/harness.test.ts thoroughly — this is the canonical reference for adapter tests. Understand:',
        '  - How each adapter suite is structured (ClaudeCodeAdapter, CodexAdapter, NullAdapter sections)',
        '  - How environment variables are saved/restored in beforeEach/afterEach with comprehensive env key lists',
        '  - How isActive(), resolveSessionId(), resolveStateDir(), resolvePluginRoot(), findHookDispatcherPath() are tested',
        '  - How bindSession is tested with stale session handling (RUN_COMPLETED, RUN_FAILED detection)',
        '  - How stop hook stale session fallback is tested (env fallback chain)',
        '  - How registry singleton pattern is tested (detectAdapter, getAdapterByName, setAdapter, resetAdapter)',
        'Read discovery.test.ts — understand how tests verify:',
        '  - KNOWN_HARNESSES has the expected count and entries',
        '  - checkCliAvailable() handles found/not-found/version-failure/timeout cases',
        '  - discoverHarnesses() returns all harnesses with correct installed/version/capabilities',
        '  - detectCallerHarness() detects each harness via env vars with first-match-wins behavior',
        'Read invoker.test.ts — understand how tests verify:',
        '  - HARNESS_CLI_MAP has entries for all supported harnesses',
        '  - buildHarnessArgs() produces correct flags per-harness (workspace, model, prompt, baseArgs)',
        '  - invokeHarness() handles success/failure/timeout/unknown-harness/env-passing',
        'Read geminiCli.test.ts — understand hook testing patterns:',
        '  - callWithStdin helper for simulating hook JSON input',
        '  - Synthetic stdin with Readable streams and proper unref()',
        '  - stdout/stderr interception with spies',
        '  - AfterAgent hook with session file, journal replay, iteration tracking',
        '  - SessionStart hook with state file creation and idempotency',
        '  - bindSession conflict detection',

        // ── Create the test file ──
        `Create packages/sdk/src/harness/__tests__/${args.adapterName}.test.ts using Vitest (import { describe, it, expect, vi, beforeEach, afterEach } from "vitest").`,

        // ── Adapter method tests ──
        `Test suite: "${args.harnessName} Adapter"`,
        '  - Test name property returns correct adapter name',
        '  - Test isActive() returns true when harness-specific env vars are set, false otherwise',
        '  - Test resolveSessionId() with: explicit arg (highest priority), harness-specific env vars, env file fallback, undefined when nothing set',
        '  - Test resolveStateDir() with: explicit arg, BABYSITTER_STATE_DIR env override, default ~/.a5c/state/',
        '  - Test resolvePluginRoot() with: explicit arg, harness-specific plugin root env var',
        '  - Test findHookDispatcherPath() locates the hook dispatcher from startCwd',
        '  - Test autoResolvesSessionId() returns expected value',
        '  - Test getMissingSessionIdHint() returns helpful message',
        '  - Test supportsHookType() returns correct whitelist for supported/unsupported hook types',
        '  - Test getCapabilities() returns correct HarnessCapability array',

        // ── Hook tests (if applicable) ──
        'If the adapter has handleStopHook:',
        '  - Test with completion proof validation (resolveCompletionProof integration)',
        '  - Test with pending effects → should block exit',
        '  - Test with RUN_COMPLETED → should approve exit',
        '  - Test with max iterations reached → should allow exit',
        '  - Test with no active run → should allow exit',
        '  - Test stale session fallback (env var chain)',
        'If the adapter has handleSessionStartHook:',
        '  - Test baseline state file creation',
        '  - Test idempotency (no overwrite of existing state)',
        '  - Test context injection (skills, process library)',
        '  - Test env file creation if applicable',

        // ── Session binding tests ──
        '  - Test bindSession creates state file with run association',
        '  - Test bindSession updates existing session with new run ID',
        '  - Test bindSession detects conflict (already bound to different run)',
        '  - Test stale session release (RUN_COMPLETED/RUN_FAILED)',
        '  - Test idempotent re-binding to same runId',

        // ── Discovery entry tests ──
        `Test suite: "Discovery - ${args.harnessName}"`,
        `  - Test KNOWN_HARNESSES includes an entry with name "${args.adapterName}"`,
        '  - Test the entry has correct cli, callerEnvVars, and capabilities',
        `  - Test detectCallerHarness() detects ${args.harnessName} when its env vars are set`,
        `  - Test detectCallerHarness() does NOT detect ${args.harnessName} when env vars are absent`,

        // ── Invoker entry tests ──
        `Test suite: "Invoker - ${args.harnessName}"`,
        `  - Test HARNESS_CLI_MAP includes an entry for "${args.adapterName}"`,
        `  - Test buildHarnessArgs("${args.adapterName}", { prompt: "test" }) produces valid CLI args`,
        '  - Test with workspace option (if workspaceFlag is defined)',
        '  - Test with model option (if supportsModel is true)',

        // ── Registry integration tests ──
        `Test suite: "Registry - ${args.harnessName}"`,
        `  - Test getAdapterByName("${args.adapterName}") returns the correct adapter`,
        `  - Test detectAdapter() returns this adapter when its env vars are set`,
        '  - Test priority order — verify this adapter wins/loses correctly against other adapters',

        // ── Test infrastructure ──
        'Use beforeEach/afterEach for comprehensive env var cleanup (save and restore all harness-related env vars)',
        'Use vi.mock for child_process execFile where needed',
        'Use mkdtemp for any file system operations, cleanup in afterEach',
        'Use synthetic Readable streams for stdin simulation in hook tests',
        'Use vi.spyOn(process.stdout, "write") for capturing hook output',
        'Verify the test file passes: cd packages/sdk && npx vitest run src/harness/__tests__/' + args.adapterName + '.test.ts',
      ],
      outputFormat: 'JSON with testFile, testSuites, testCount, filesCreated, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['testFile', 'filesCreated', 'summary'],
      properties: {
        testFile: { type: 'string' },
        testSuites: { type: 'array', items: { type: 'string' } },
        testCount: { type: 'number' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'testing', 'adapter'],
}));

// ---------------------------------------------------------------------------
// PHASE 8: Plugin Tests
// ---------------------------------------------------------------------------

/**
 * Reference plugin test files the agent should study:
 *   plugins/babysitter-codex/test/integration.test.js  — syntax validation (node --check, sh -n)
 *   plugins/babysitter-codex/test/packaged-install.test.js — npm pack, install, verify files/hooks/skills/config/marketplace
 *   e2e-tests/docker/Dockerfile.codex — harness-specific Dockerfile pattern (node:20-bookworm, non-root user, SDK+plugin install)
 *   e2e-tests/docker/helpers-codex.ts — Docker helpers pattern (buildImage, startContainer, stopContainer, dockerExec, image/container/skill-dir constants)
 *   e2e-tests/docker/structural.test.ts — Docker image validation (CLI, plugins, hooks, settings)
 *   e2e-tests/docker/stop-hook.test.ts — stop hook behavior tests (lifecycle, session state, iteration counter, completion proof)
 *   e2e-tests/docker/codex-full-run.test.ts — full Codex E2E with real LLM
 */

export const writePluginTestsTask = defineTask('write-plugin-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write ${args.harnessName} plugin integration, installation, and Docker E2E tests`,
  description: 'Create integration tests for syntax validation, packaged installation, and comprehensive Docker E2E tests (Dockerfile, helpers, structural tests, stop hook tests) following the Codex E2E patterns',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior test engineer',
      task: `Write comprehensive integration tests and Docker E2E tests for the ${args.harnessName} babysitter plugin`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        pluginDir: args.pluginDir,
        adapterName: args.adapterName,
        research: args.research,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        // ── Study reference plugin test patterns ──
        'Read plugins/babysitter-codex/test/integration.test.js thoroughly — understand:',
        '  - How it collects all JS files recursively and validates via node --check',
        '  - How it validates shell hook scripts via sh -n',
        '  - The test function pattern (testSyntax, testShellSyntax) with assertion counting',
        'Read plugins/babysitter-codex/test/packaged-install.test.js thoroughly — understand:',
        '  - How it uses npm pack --json to create a tarball, then extracts to a temp directory',
        '  - How it runs the install command (babysitter-codex install --global) against the extracted package',
        '  - How it verifies all installed files exist: plugin manifest, assets, hooks, skills, config files',
        '  - How it validates hooks.json structure: SessionStart, UserPromptSubmit, Stop hook entries',
        '  - How it validates configuration values (config.toml entries, profile.json settings)',
        '  - How it verifies marketplace registration (marketplace.json entry)',
        '  - How it tests workspace/team installation separately from global installation',
        '  - How it checks for exclusions (no installer binaries, no UTF-8 BOM, no deprecated files)',
        '  - Helper patterns: run(), readJson(), listModeSkillNames(), assertExists()',

        // ── Study Docker E2E reference files (CRITICAL — these are the templates) ──
        'Read e2e-tests/docker/Dockerfile.codex thoroughly — this is the template for the new Dockerfile. Understand:',
        '  - Base image: node:20-bookworm with apt-get install bash, git, jq, ca-certificates',
        '  - Non-root user creation: groupadd + useradd with -r -g -m -d flags, HOME env, PATH extension',
        '  - Harness home/config dir setup: mkdir for .local and harness-specific config dir (e.g. .codex), .npmrc prefix',
        '  - Monorepo COPY pattern: package.json + package-lock.json first, then per-package package.json for cache-friendly layers',
        '  - SDK build: npm install --include=dev, COPY entire repo, npm run build:sdk',
        '  - Permissions: chown -R on /app, /home/<user>, /workspace before switching to non-root USER',
        '  - Harness CLI install: npm install -g <harness-cli> (e.g. @openai/codex@latest)',
        '  - SDK global install: npm install -g /app/packages/sdk',
        '  - Process library seed: copy library/ to /tmp, git init, commit (for process library commands)',
        '  - Plugin install: npm install -g /app/plugins/<plugin-dir> with BABYSITTER_PROCESS_LIBRARY_REPO env, then run install command',
        '  - WORKDIR /workspace with empty env vars for API keys and harness-specific config',
        '  - CMD ["bash"]',

        'Read e2e-tests/docker/helpers-codex.ts thoroughly — this is the template for the new helpers file. Understand:',
        '  - Constants: IMAGE name (babysitter-<harness>-e2e:test), CONTAINER name (babysitter-<harness>-e2e-container), SKILL_DIR (harness-specific plugin/skill install path)',
        '  - DEFAULT_OPTS: encoding utf-8, timeout 30_000, stdio pipe, env with MSYS_NO_PATHCONV=1 (for Windows Docker compatibility)',
        '  - exec(cmd, opts): thin wrapper around execSync with DEFAULT_OPTS spread',
        '  - dockerExec(cmd, opts): exec("docker exec -i CONTAINER bash", { input: cmd + "\\n" }) — sends commands via stdin, NOT command-line args',
        '  - buildImage(contextDir): docker build -f contextDir/e2e-tests/docker/Dockerfile.<harness> -t IMAGE --load contextDir, timeout 900_000 (15 min)',
        '  - startContainer(): docker rm -f (ignore errors), then docker run -d with env forwarding (-e flags for API keys), --entrypoint tail IMAGE -f /dev/null',
        '  - stopContainer(): docker rm -f (ignore errors)',
        '  - Forwarded env vars: harness-specific API key and config env vars (e.g. AZURE_OPENAI_API_KEY, OPENAI_API_KEY, A5C_PROVIDER_NAME)',

        'Read e2e-tests/docker/structural.test.ts thoroughly — this is the template for structural tests. Understand:',
        '  - beforeAll: buildImage(ROOT) + startContainer() with 300_000 timeout (5 min)',
        '  - afterAll: stopContainer()',
        '  - "Docker structural tests" suite: babysitter CLI version, harness CLI available, Node.js v20+, jq installed, non-root user, correct HOME, entrypoint exists and executable, /workspace exists',
        '  - "Plugin installation" suite: plugin directory exists, plugin.json has correct skills, hooks.json registers Stop hook (jq extraction of command path), hooks.json registers SessionStart hook, stop hook script is executable (+x), session start hook script is executable, installed_plugins.json has correct install path',
        '  - "SKILL.md files" suite: babysit skill SKILL.md exists and has expected content',
        '  - "Settings configuration" suite: settings.json exists and is valid JSON',
        '  - Import pattern: import { buildImage, dockerExec, PLUGIN_DIR, startContainer, stopContainer } from helpers module',

        'Read e2e-tests/docker/stop-hook.test.ts thoroughly — this is the template for stop hook tests. Understand:',
        '  - Constants: HOOK path (PLUGIN_DIR/hooks/<stop-hook-script>.sh), STATE_DIR (~/.a5c/state/ via getGlobalStateDir()), LOG_DIR, HOOK_ENV (CLAUDE_PLUGIN_ROOT, BABYSITTER_LOG_DIR, CLI vars)',
        '  - beforeAll: buildImage + startContainer + mkdir STATE_DIR and LOG_DIR, 300_000 timeout',
        '  - afterAll: stopContainer()',
        '  - afterEach: rm -rf STATE_DIR/*, LOG_DIR/*, and temp files for test isolation',
        '  - runHook(sessionId, transcriptPath) helper: writes JSON input to temp file, pipes it to hook via bash redirection, captures exit code via "EXIT_CODE=$?" echo trick, parses exit code from output',
        '  - runHookRaw(jsonInput) helper: same pattern but accepts arbitrary JSON (for testing malformed/non-standard input)',
        '  - parseJsonBlock(output) helper: tries JSON.parse on full output first, then regex extracts { ... } block (for mixed stdout/stderr output)',
        '  - createTranscript(filePath, text) helper: writes JSONL with { role: "assistant", message: { content: [{ type: "text", text }] } } to simulate harness transcript format',
        '  - createMockRun(runId, events) helper: creates full run directory (/tmp/hook-test-run-<id>/) with journal/, state/, tasks/, run.json, and numbered journal event files with seq/ulid/type/recordedAt/data',
        '  - assertAllowsExit(result) helper: expects exitCode 0, parsed decision not "block"',
        '  - assertSessionDeleted(sid) helper: babysitter session:state --session-id <sid> returns found=false',
        '  - "Stop hook core lifecycle" suite:',
        '    - exits 0 (allows exit) when no session state exists — runHook with nonexistent session',
        '    - blocks exit when active session with pending effects — babysitter session:init + session:associate with mock run, runHook expects exitCode 2 or decision "block"',
        '    - allows exit after run completes — createMockRun with RUN_COMPLETED event, session:init + associate, runHook expects exit 0',
        '  - "Stop hook edge cases" suite:',
        '    - handles empty stdin gracefully — runHookRaw("") expects no crash',
        '    - handles malformed JSON input — runHookRaw("not json") expects no crash',
        '    - handles missing transcript_path — runHookRaw with only session_id',
        '  - "Stop hook iteration tracking" suite:',
        '    - increments iteration counter across invocations — multiple runHook calls on same session, verify counter increases',
        '    - respects max iteration limit — set low max iterations, verify hook allows exit when exceeded',
        '  - "Stop hook completion proof" suite:',
        '    - detects completion proof in transcript — createTranscript with completion proof hash, createMockRun with RUN_COMPLETED, verify hook allows exit and cleans up session',
        '    - blocks when no completion proof despite active run — session with associated run but no proof in transcript',

        // ── Create the test directory and files ──
        `Create ${args.pluginDir}/test/ directory with the following test files:`,

        // ── integration.test.js (syntax validation) ──
        'Create integration.test.js following the babysitter-codex pattern:',
        '  - testSyntax(): collect all JS files from skills/, bin/, scripts/ and run node --check on each',
        '  - testShellSyntax(): validate all shell scripts in hooks/ via sh -n',
        '  - Clear pass/fail output with file paths on error',
        '  - Exit with code 1 on any failure',

        // ── packaged-install.test.js (installation verification) ──
        'Create packaged-install.test.js following the babysitter-codex pattern:',
        '  1. Setup: npm pack --json, extract tarball to temp dir',
        '  2. Test global installation:',
        `     - Run the plugin install command appropriate for ${args.harnessName}`,
        '     - Verify all expected files are installed:',
        '       - Plugin manifest (plugin.json, .codex-plugin/plugin.json, package.json, or harness equivalent)',
        '       - Hook scripts (all hooks referenced in hooks.json exist and are valid)',
        '       - Skills directory (all skill definitions present with SKILL.md or equivalent)',
        '       - Configuration files (hooks.json, config files for the harness)',
        '       - Version/lock files (versions.json, babysitter.lock.json)',
        '  3. Verify hooks.json structure:',
        '     - Each hook type (SessionStart, Stop, UserPromptSubmit, etc.) has correct command paths',
        '     - Hook commands reference valid script files',
        '     - Matchers are correctly configured',
        '  4. Verify skill distribution:',
        '     - All skill names from source appear in installed location',
        '     - Each skill has required definition file (SKILL.md, AGENTS.md, etc.)',
        '     - No UTF-8 BOM in skill files',
        '  5. Verify configuration:',
        '     - Harness-specific config values are correct',
        '     - Marketplace registration entry exists if applicable',
        '  6. Test workspace/team installation (if the harness supports it):',
        '     - Separate workspace-level installation',
        '     - Workspace config files created correctly',
        '  7. Verify exclusions:',
        '     - No installer binaries in final install (bin/ excluded)',
        '     - No test files in final install',
        '     - No deprecated or unnecessary files',

        // ═══════════════════════════════════════════════════════════════════════
        // Docker E2E Test Artifacts (4 files in e2e-tests/docker/)
        // ═══════════════════════════════════════════════════════════════════════

        // ── 1. Dockerfile.<harness> ──
        `Create e2e-tests/docker/Dockerfile.${args.adapterName} following the Dockerfile.codex template exactly. The Dockerfile MUST:`,
        '  - Use FROM node:20-bookworm as base',
        '  - LABEL with maintainer="a5c.ai" and description mentioning the harness name',
        '  - Install system deps: apt-get update && apt-get install -y bash git jq ca-certificates',
        `  - Create non-root user/group for the harness (e.g. groupadd -r <harness> && useradd -r -g <harness> -m -d /home/<harness> <harness>)`,
        `  - Set ENV HOME=/home/<harness>, ENV <HARNESS>_HOME=/home/<harness>/.<harness> (harness config dir), ENV PATH with /home/<harness>/.local/bin`,
        `  - Create .local and harness config directories, write .npmrc with prefix=/home/<harness>/.local`,
        '  - WORKDIR /app',
        '  - COPY package.json and package-lock.json first (layer cache)',
        '  - COPY packages/sdk/package.json to ./packages/sdk/',
        `  - COPY ${args.pluginDir}/package.json to ./${args.pluginDir}/`,
        '  - RUN npm install --include=dev',
        '  - COPY . . (full monorepo)',
        '  - RUN npm run build:sdk',
        `  - RUN mkdir -p /workspace && chown -R <user>:<group> /app /home/<user> /workspace`,
        '  - USER <harness-user> (switch to non-root)',
        `  - RUN npm install -g <harness-cli-package> (install the harness CLI globally, e.g. @openai/codex@latest)`,
        '  - RUN npm install -g /app/packages/sdk (install babysitter SDK globally)',
        '  - RUN process library seed block: mkdir -p /tmp/babysitter-process-library-source/library, cp library content, git init + add + commit',
        `  - RUN BABYSITTER_PROCESS_LIBRARY_REPO=/tmp/babysitter-process-library-source npm install -g /app/${args.pluginDir} && run plugin install command (e.g. babysitter-<harness> install --global)`,
        '  - WORKDIR /workspace',
        '  - Set empty ENV vars for API keys and harness-specific config (A5C_PROVIDER_NAME, A5C_SELECTED_CLI_COMMAND, harness API keys, etc.)',
        '  - CMD ["bash"]',
        `  - The Dockerfile name MUST be Dockerfile.${args.adapterName} (not Dockerfile.<harnessName>) to match the helpers file`,

        // ── 2. helpers-<harness>.ts ──
        `Create e2e-tests/docker/helpers-${args.adapterName}.ts following the helpers-codex.ts template exactly. The file MUST export:`,
        `  - const ${args.adapterName.toUpperCase().replace(/-/g, '_')}_IMAGE = "babysitter-${args.adapterName}-e2e:test"`,
        `  - const ${args.adapterName.toUpperCase().replace(/-/g, '_')}_CONTAINER = "babysitter-${args.adapterName}-e2e-container"`,
        `  - const ${args.adapterName.toUpperCase().replace(/-/g, '_')}_SKILL_DIR = "<harness-specific-plugin-install-path>/skills/babysit" (e.g. /home/<user>/.<harness>/skills/babysit or equivalent from research findings)`,
        '  - DEFAULT_OPTS with encoding "utf-8", timeout 30_000, stdio ["pipe","pipe","pipe"], env with MSYS_NO_PATHCONV: "1"',
        '  - exec(cmd, opts): execSync wrapper with DEFAULT_OPTS merge',
        '  - dockerExec(cmd, opts): exec("docker exec -i CONTAINER bash", { input: cmd + "\\n" }) — MUST send via stdin, NOT command args',
        `  - build${args.adapterName.charAt(0).toUpperCase() + args.adapterName.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Image(contextDir): docker build -f contextDir/e2e-tests/docker/Dockerfile.${args.adapterName} -t IMAGE --load contextDir, timeout 900_000`,
        `  - start${args.adapterName.charAt(0).toUpperCase() + args.adapterName.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Container(): docker rm -f (ignore), docker run -d with forwarded env vars, --entrypoint tail IMAGE -f /dev/null, timeout 120_000`,
        `  - stop${args.adapterName.charAt(0).toUpperCase() + args.adapterName.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Container(): docker rm -f (ignore errors)`,
        '  - Forwarded env vars: A5C_PROVIDER_NAME, A5C_SELECTED_CLI_COMMAND, A5C_CLI_TOOL, A5C_SELECTED_MODEL, plus any harness-specific API key env vars from research',
        '  - Import { execSync, ExecSyncOptions } from "child_process"',

        // ── 3. <harness>-structural.test.ts ──
        `Create e2e-tests/docker/${args.adapterName}-structural.test.ts following the structural.test.ts template. The file MUST:`,
        `  - Import build, start, stop, dockerExec, and SKILL_DIR from ./helpers-${args.adapterName}`,
        '  - Import path and use path.resolve(__dirname, "../..") for ROOT',
        '  - beforeAll: buildImage(ROOT) + startContainer() with 300_000 timeout',
        '  - afterAll: stopContainer()',
        '  - "Docker structural tests" describe block:',
        '    - "babysitter CLI is available and returns a version": dockerExec("babysitter --version"), expect match /^\\d+\\.\\d+\\.\\d+$/',
        `    - "${args.harnessName} CLI is available": dockerExec("<harness-cli> --version"), expect truthy`,
        '    - "Node.js v20+ is installed": dockerExec("node --version"), parse major, expect >= 20',
        '    - "jq is installed": dockerExec("jq --version"), expect match /^jq-/',
        `    - "runs as non-root user <harness>": dockerExec("whoami"), expect <harness-user>`,
        `    - "HOME is /home/<harness>": dockerExec("echo $HOME"), expect /home/<harness>`,
        '    - "/workspace directory exists": dockerExec("test -d /workspace")',
        '  - "Plugin installation" describe block:',
        '    - "plugin directory exists": dockerExec("test -d PLUGIN_DIR")',
        '    - "plugin.json exists with correct skills": jq extract .skills[].name from plugin.json, expect "babysitter"',
        '    - "hooks.json registers Stop hook": jq extract Stop hook command path, expect contains stop hook script name',
        '    - "hooks.json registers SessionStart hook": jq extract SessionStart hook command path, expect contains session start script name',
        '    - "stop hook script is executable": dockerExec("test -x PLUGIN_DIR/hooks/<stop-hook>.sh")',
        '    - "session start hook script is executable": dockerExec("test -x PLUGIN_DIR/hooks/<session-start-hook>.sh")',
        '    - "installed_plugins.json has correct install path" (if harness uses installed_plugins tracking): jq extract installPath',
        '  - "SKILL.md files" describe block:',
        '    - "babysit skill SKILL.md exists": dockerExec("test -f SKILL_DIR/SKILL.md")',
        '    - "SKILL.md contains expected content": dockerExec("cat SKILL_DIR/SKILL.md"), expect contains "babysitter" or harness-specific keywords',
        '  - "Settings configuration" describe block (if harness has settings file):',
        '    - "settings file exists and is valid": dockerExec("cat <settings-path>"), JSON.parse succeeds',

        // ── 4. <harness>-stop-hook.test.ts ──
        `Create e2e-tests/docker/${args.adapterName}-stop-hook.test.ts following the stop-hook.test.ts template. The file MUST:`,
        `  - Import build, start, stop, dockerExec (and dockerExecSafe if needed) from ./helpers-${args.adapterName}`,
        '  - Import PLUGIN_DIR/SKILL_DIR from the helpers module',
        '  - Define constants: HOOK path (PLUGIN_DIR/hooks/<stop-hook-script>.sh), STATE_DIR (~/.a5c/state/ via getGlobalStateDir()), LOG_DIR (/tmp/hook-test-logs), HOOK_ENV (plugin root, log dir, CLI vars)',
        '  - beforeAll: buildImage(ROOT) + startContainer() + mkdir STATE_DIR LOG_DIR, timeout 300_000',
        '  - afterAll: stopContainer()',
        '  - afterEach: rm -rf STATE_DIR/*, LOG_DIR/*, and all /tmp/hook-test-* temp files for test isolation',
        '  - Helper functions (copy patterns from stop-hook.test.ts):',
        '    - runHook(sessionId, transcriptPath): write JSON input to temp file, pipe to hook via bash, capture EXIT_CODE from output',
        '    - runHookRaw(jsonInput): same pattern for arbitrary JSON input testing',
        '    - parseJsonBlock(output): JSON.parse full output, fallback to regex { ... } extraction',
        '    - createTranscript(filePath, text): write JSONL with assistant role and text content',
        '    - createMockRun(runId, events): create /tmp/hook-test-run-<id>/ with journal/, state/, tasks/, run.json, numbered journal events with seq/ulid/type/recordedAt/data',
        '    - assertAllowsExit(result): expect exitCode 0, parsed decision not "block"',
        '    - assertSessionDeleted(sid): babysitter session:state returns found=false',
        '  - "Stop hook core lifecycle" describe block:',
        '    - "exits 0 (allows exit) when no session state exists": runHook with nonexistent session ID, assertAllowsExit',
        '    - "blocks exit when active session with pending effects": babysitter session:init + session:associate with mock run containing EFFECT_REQUESTED (no EFFECT_RESOLVED), runHook, expect exitCode 2 or decision "block"',
        '    - "allows exit after run completes": createMockRun with RUN_COMPLETED event, session:init + associate, runHook, assertAllowsExit',
        '  - "Stop hook edge cases" describe block:',
        '    - "handles empty stdin gracefully": runHookRaw(""), expect no crash (exit 0 or graceful error)',
        '    - "handles malformed JSON input": runHookRaw("not json"), expect no crash',
        '    - "handles missing transcript_path": runHookRaw with only session_id field',
        '  - "Stop hook iteration tracking" describe block:',
        '    - "increments iteration counter across invocations": babysitter session:init, multiple runHook calls, read session state, verify iterationCount increases',
        '    - "respects max iteration limit": set low BABYSITTER_MAX_ITERATIONS env var, create session with many iterations, verify hook allows exit when exceeded',
        '  - "Stop hook completion proof" describe block:',
        '    - "detects completion proof in transcript": create run with RUN_COMPLETED, resolve completion proof hash, createTranscript with proof, runHook, assertAllowsExit, assertSessionDeleted',
        '    - "blocks when no completion proof despite active run": session with associated run but no proof in transcript, expect hook blocks',

        // ── Package.json test script ──
        `Add or update ${args.pluginDir}/package.json with test scripts:`,
        '  "test": "node test/integration.test.js && node test/packaged-install.test.js"',
        '  "test:integration": "node test/integration.test.js"',

        // ── Run tests ──
        'Run the integration test to verify it passes: node test/integration.test.js',
        'If the packaged-install test requires npm pack, verify the package.json has correct files/bin fields.',
        `Docker E2E tests (${args.adapterName}-structural.test.ts, ${args.adapterName}-stop-hook.test.ts) will be validated in CI via the e2e-docker workflow.`,
      ],
      outputFormat: 'JSON with testFiles, testCategories, dockerArtifacts, filesCreated, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'filesCreated', 'summary'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testCategories: { type: 'array', items: { type: 'string' } },
        dockerArtifacts: {
          type: 'object',
          description: 'Docker E2E test artifacts created',
          properties: {
            dockerfile: { type: 'string', description: 'Path to e2e-tests/docker/Dockerfile.<harness>' },
            helpers: { type: 'string', description: 'Path to e2e-tests/docker/helpers-<harness>.ts' },
            structuralTest: { type: 'string', description: 'Path to e2e-tests/docker/<harness>-structural.test.ts' },
            stopHookTest: { type: 'string', description: 'Path to e2e-tests/docker/<harness>-stop-hook.test.ts' },
          },
        },
        filesCreated: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'testing', 'plugin', 'docker', 'e2e'],
}));

// ---------------------------------------------------------------------------
// PHASE 9: CI/CD Integration
// ---------------------------------------------------------------------------

/**
 * Reference CI/CD files the agent should study:
 *   .github/workflows/ci.yml              — PR validation: lint, build, test matrix (3 OS × 2 Node)
 *   .github/workflows/e2e-docker.yml      — Docker E2E: structural, hook, workflow, full-run tests
 *   .github/workflows/release.yml         — Release: validate → version bump → npm publish
 *   .github/workflows/staging-publish.yml — Staging: prerelease versions, --tag staging
 *   .github/workflows/docker-publish.yml  — Docker image: multi-platform build, ghcr.io publish
 */

export const setupCiCdTask = defineTask('setup-ci-cd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure CI/CD for ${args.harnessName} plugin`,
  description: 'Update CI/CD workflows to include the new plugin in PR validation, E2E Docker tests, release pipeline, and staging publish',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior DevOps engineer',
      task: `Integrate the ${args.harnessName} babysitter plugin into the existing CI/CD pipelines`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        pluginDir: args.pluginDir,
        adapterName: args.adapterName,
        research: args.research,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        // ── Study existing CI/CD patterns ──
        'Read .github/workflows/ci.yml thoroughly — understand:',
        '  - The test job: lint → verify:metadata → build:sdk → test:sdk with artifact upload',
        '  - The packages-sdk matrix job: 3 OS (ubuntu, macos, windows) × 2 Node (20, 22) with lint, build, test, smoke per combination',
        '  - How artifacts are structured: artifacts/test-logs/, _ci_artifacts/logs/{OS}/node{version}/',
        'Read .github/workflows/e2e-docker.yml thoroughly — understand:',
        '  - Path triggers: which plugin directories trigger the workflow (plugins/babysitter/**, plugins/babysitter-codex/**)',
        '  - The docker-e2e-tests job: structural tests (no API key), Azure OpenAI tests (gated on secrets)',
        '  - The codex-docker-e2e job: separate job for full Codex E2E with 90min timeout',
        '  - How test files are selected: vitest run with specific test file paths',
        '  - Artifact upload: e2e-artifacts/ with 14-day retention',
        'Read .github/workflows/release.yml thoroughly — understand:',
        '  - The validate job: lint, build, test, then babysitter-codex package tests (npm test --prefix plugins/babysitter-codex)',
        '  - The version_and_release job: version bump, changelog, npm publish for SDK + codex + metapackage',
        '  - How new plugins get added to the publish step',
        'Read .github/workflows/staging-publish.yml — understand staging prerelease flow',
        'Read .github/workflows/docker-publish.yml — understand multi-platform Docker build triggers',

        // ── Update CI workflow (ci.yml) ──
        'If the plugin has its own test suite (package.json with test script):',
        `  - Add a "${args.harnessName} plugin tests" step to the test job: npm test --prefix ${args.pluginDir}`,
        '  - Add artifact capture for the test logs',

        // ── Update E2E Docker workflow (e2e-docker.yml) ──
        `Add '${args.pluginDir}/**' to the paths trigger list in e2e-docker.yml (both pull_request and push sections).`,
        `Add 'e2e-tests/docker/Dockerfile.${args.adapterName}' and 'e2e-tests/docker/helpers-${args.adapterName}.ts' to the paths trigger list.`,
        `Add 'e2e-tests/docker/${args.adapterName}-structural.test.ts' and 'e2e-tests/docker/${args.adapterName}-stop-hook.test.ts' to the paths trigger list.`,

        '  ── Wire structural tests into the no-API-key test run ──',
        '  The docker-e2e-tests job runs structural tests that require no API key. Add the new harness structural test:',
        `  - Add "e2e-tests/docker/${args.adapterName}-structural.test.ts" to the vitest run command in the structural test step`,
        '  - This runs alongside existing structural.test.ts and codex-structural.test.ts (no API key needed)',
        `  - The structural test file imports from helpers-${args.adapterName}.ts which builds Dockerfile.${args.adapterName} — the workflow just needs to run the test file`,

        '  ── Wire stop hook tests into the no-API-key test run ──',
        `  - Add "e2e-tests/docker/${args.adapterName}-stop-hook.test.ts" to the vitest run command in the same structural/no-API-key step`,
        '  - Stop hook tests exercise the hook scripts inside Docker but do NOT require API keys (they use mock runs and mock transcripts)',
        '  - This follows the pattern of stop-hook.test.ts which runs in the same no-API-key job',

        '  ── Optionally add gated full-run job ──',
        `  - If ${args.harnessName} supports full orchestration E2E (real LLM invocation), add a separate job similar to codex-docker-e2e:`,
        `    - Job name: ${args.adapterName}-docker-e2e`,
        `    - Condition: gated on API key secrets (if: secrets.<HARNESS_API_KEY> != '')`,
        '    - Timeout: 90 minutes (timeout-minutes: 90)',
        `    - Runs: npx vitest run e2e-tests/docker/${args.adapterName}-full-run.test.ts (only create this test if the harness supports it)`,
        '    - Upload e2e-artifacts/ with 14-day retention',
        '  - If the harness does NOT support full E2E (no API key, no headless mode), skip this gated job',

        // ── Update release workflow (release.yml) ──
        'If the plugin is published to npm:',
        `  - Add "${args.harnessName} plugin tests" step to the validate job: npm test --prefix ${args.pluginDir}`,
        '  - Add npm publish step to version_and_release job with correct package name and access level',
        '  - Follow the existing pattern: npm publish --access public (or --tag staging for staging-publish.yml)',
        'If the plugin is NOT published to npm (e.g., marketplace-only distribution):',
        '  - Still add the test step to validate job',
        '  - Skip the npm publish step',

        // ── Update staging workflow (staging-publish.yml) ──
        'If the plugin is npm-published, add staging publish step with --tag staging flag.',
        `CRITICAL: Wire the plugin's versions.json into CI. This requires updates to THREE files:`,
        `  1. scripts/bump-version.mjs — add the plugin's versions.json path to the versionsPath loop so version bumps propagate`,
        `  2. .github/workflows/staging-publish.yml — add versions.json to BOTH the writer step (that sets sdkVersion) AND the git add step (that commits it)`,
        `  3. .github/workflows/release.yml — add versions.json to the git add step`,
        `Without ALL THREE integrations, versions.json goes stale after the first commit and the plugin falls back to installing "latest" SDK instead of the pinned version.`,

        // ── Update Docker build (docker-publish.yml) ──
        `Add '${args.pluginDir}/**' to the paths trigger list so Docker image rebuilds when the plugin changes.`,
        `Add 'e2e-tests/docker/Dockerfile.${args.adapterName}' to the paths trigger list.`,
        'If the plugin should be included in the main Docker image (Dockerfile), update it to COPY the plugin.',

        // ── Dockerfile updates (the harness-specific Dockerfile was created in Phase 8) ──
        `The harness-specific Dockerfile (e2e-tests/docker/Dockerfile.${args.adapterName}) was created in Phase 8 (writePluginTestsTask). Verify it:`,
        '  - Builds successfully: docker build -f e2e-tests/docker/Dockerfile.<harness> -t babysitter-<harness>-e2e:test .',
        '  - Uses the same monorepo COPY pattern as Dockerfile.codex (package.json first, then full copy)',
        '  - Installs the harness CLI, SDK, and plugin correctly as non-root user',
        '  - Seeds the process library for process-library commands',
        '  - Has correct empty env vars for API keys',
        'If the main production Dockerfile also needs this plugin:',
        '  - Add COPY instruction for the plugin directory',
        '  - Add install step if the plugin has a setup script',

        // ── Verify CI/CD changes ──
        'Verify all workflow YAML files are valid (correct indentation, valid syntax).',
        'Verify path triggers are comprehensive (include plugin dir, adapter file, test files).',
        'Verify test steps use the correct working directory and commands.',
        'Do NOT break existing workflows — only add new steps/paths.',
      ],
      outputFormat: 'JSON with workflowsModified, stepsAdded, dockerUpdated, filesModified, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['workflowsModified', 'filesModified', 'summary'],
      properties: {
        workflowsModified: { type: 'array', items: { type: 'string' } },
        stepsAdded: { type: 'array', items: { type: 'string' } },
        dockerUpdated: { type: 'boolean' },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'ci-cd', 'devops'],
}));

// ---------------------------------------------------------------------------
// PHASE 9b: Command Sync Script
// ---------------------------------------------------------------------------

export const createSyncScriptTask = defineTask('create-sync-script', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create command sync script for ${args.harnessName} plugin`,
  description: 'Create a sync script that keeps plugin commands/skills in sync with the canonical babysitter commands, and register it in the central sync-plugin-commands.cjs orchestrator',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior build tooling engineer',
      task: `Create a command sync script for the ${args.harnessName} plugin at ${args.pluginDir}/scripts/ and register it in scripts/sync-plugin-commands.cjs`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        pluginDir: args.pluginDir,
        adapterName: args.adapterName,
        research: args.research,
        syncVariant: args.syncVariant,
      },
      instructions: [
        // ── Study existing sync patterns ──
        'Read scripts/sync-plugin-commands.cjs — the central orchestrator that spawns all plugin sync scripts. Understand the task array structure: { label, cmd, args } entries.',
        'Read scripts/plugin-command-sync-lib.cjs — the shared library with: listDirectories, listMarkdownBasenames, syncCommandMirrors, syncSkillsFromCommands, reportCheckResult, buildSkillFromCommand, writeFileIfChanged.',
        'Study the THREE existing sync script variants to understand which pattern to follow:',
        '',
        '  VARIANT A — "commands + skills" (used by babysitter-cursor and babysitter-github):',
        '    plugins/babysitter-cursor/scripts/sync-command-surfaces.js',
        '    plugins/babysitter-github/scripts/sync-command-surfaces.js',
        '    These scripts do TWO things:',
        '      1. Mirror command .md files from plugins/babysitter/commands/ to the plugin\'s commands/ directory',
        '      2. Derive skills from those mirrored commands (generate SKILL.md in skills/<name>/ from command .md)',
        '    Use this variant when the plugin has BOTH a commands/ directory AND a skills/ directory.',
        '',
        '  VARIANT B — "skills only" (used by babysitter-codex):',
        '    plugins/babysitter-codex/scripts/sync-command-skills.js',
        '    This script does ONE thing:',
        '      1. Derive skills from canonical commands (generate SKILL.md in skills/<name>/ from plugins/babysitter/commands/<name>.md)',
        '    Use this variant when the plugin has a skills/ directory but commands are NOT mirrored (they live only in the canonical plugin).',
        '',
        '  VARIANT C — "docs sync" (used by babysitter-pi):',
        '    plugins/babysitter-pi/scripts/sync-command-docs.cjs',
        '    This is a custom variant for Pi\'s specific needs. Only use if the harness has a unique documentation format.',
        '',

        // ── Determine the correct variant ──
        `Examine the plugin directory structure at ${args.pluginDir}/ to determine which variant is appropriate:`,
        `  - If ${args.pluginDir}/commands/ exists AND ${args.pluginDir}/skills/ exists → use VARIANT A (sync-command-surfaces.js)`,
        `  - If ${args.pluginDir}/skills/ exists but NO commands/ directory → use VARIANT B (sync-command-skills.js)`,
        `  - If neither exists yet, use research findings to decide: does ${args.harnessName} support mirrored commands? If yes → VARIANT A. If commands are handled differently → VARIANT B.`,
        `  - The syncVariant hint (if provided) suggests: "${args.syncVariant || 'auto-detect'}"`,

        // ── Create the sync script ──
        `Create the sync script at ${args.pluginDir}/scripts/<script-name>.js following the chosen variant pattern EXACTLY:`,
        '  - Use \'use strict\'; at the top',
        '  - Require path and functions from ../../../scripts/plugin-command-sync-lib.cjs',
        '  - Define PACKAGE_ROOT, REPO_ROOT, source/target paths',
        `  - Set LABEL to 'babysitter-${args.adapterName} sync'`,
        '  - Implement the discovery functions (getMirroredCommandNames and/or getDerivedSkillNames or getCommandBackedSkillNames)',
        '  - Implement main() with --check support',
        '  - Call main()',
        'The script MUST follow the exact same require/path/label/check patterns as the reference implementations.',

        // ── Register in central orchestrator ──
        'Add an entry to the tasks array in scripts/sync-plugin-commands.cjs:',
        '  {',
        `    label: 'babysitter-${args.adapterName}',`,
        '    cmd: process.execPath,',
        `    args: [path.join(REPO_ROOT, '${args.pluginDir}', 'scripts', '<script-name>.js')],`,
        '  },',
        'Insert it in alphabetical order among the existing plugin entries (after sdk-command-templates, before or after existing plugin entries as alphabetical order dictates).',
        'Do NOT remove or modify any existing entries in the tasks array.',

        // ── Verify ──
        'After creating the script and updating sync-plugin-commands.cjs:',
        '  - Verify the script can be parsed: node --check <script-path>',
        '  - Verify the require path to plugin-command-sync-lib.cjs resolves correctly (three levels up from plugins/<name>/scripts/)',
        '  - Verify the central orchestrator still parses: node --check scripts/sync-plugin-commands.cjs',
      ],
      outputFormat: 'JSON with syncScriptPath, syncScriptVariant, centralOrchestratorUpdated, filesCreated, filesModified, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['syncScriptPath', 'syncScriptVariant', 'filesCreated', 'filesModified'],
      properties: {
        syncScriptPath: { type: 'string', description: 'Path to the created sync script' },
        syncScriptVariant: { type: 'string', enum: ['commands-and-skills', 'skills-only', 'custom'], description: 'Which variant pattern was used' },
        centralOrchestratorUpdated: { type: 'boolean', description: 'Whether sync-plugin-commands.cjs was updated' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'sync', 'build-tooling'],
}));

// ---------------------------------------------------------------------------
// PHASE 10: Verification
// ---------------------------------------------------------------------------

export const verifyAssimilationTask = defineTask('verify-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.harnessName} assimilation quality`,
  description: 'Score the integration against adapter correctness, plugin completeness, skill fidelity, and install reliability',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'principal integration reviewer',
      task: `Score the ${args.harnessName} harness assimilation against the target quality threshold`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        targetQuality: args.targetQuality,
        integrationFiles: args.integrationFiles,
        research: args.research,
      },
      instructions: [
        'Score each dimension 0-100: adapter completeness, plugin structure, skill fidelity, hook correctness, install/dist method, harness wrapper, README quality, adapter test coverage, plugin test coverage, CI/CD integration.',

        // ── Adapter interface completeness ──
        'Verify the adapter implements ALL required HarnessAdapter methods: isActive, resolveSessionId, resolveStateDir, resolvePluginRoot, bindSession, handleStopHook, handleSessionStartHook, findHookDispatcherPath.',
        'Verify the adapter implements applicable optional methods: autoResolvesSessionId, getMissingSessionIdHint, supportsHookType, getUnsupportedHookMessage, isCliInstalled, getCliInfo, getCapabilities, installHarness, installPlugin, getPromptContext.',
        'Verify handleStopHook integrates with completionProof.ts and journal replay — not just a stub.',
        'Verify handleSessionStartHook creates proper env files and/or state files, injects context (skills, process library info), and considers compression integration.',
        'Verify bindSession creates a proper SessionState file via session.ts helpers.',
        'Verify getPromptContext uses or creates the correct PromptContext factory with proper hookDriven, interactive, and capabilities values.',

        // ── Registry entries ──
        'Verify KNOWN_HARNESSES entry in discovery.ts has correct name, cli command, callerEnvVars, and capabilities.',
        'Verify CONFIG_PATHS entry exists if the harness has a config directory.',
        'Verify HARNESS_CLI_MAP entry in invoker.ts has correct cli, workspaceFlag, supportsModel, promptStyle, and baseArgs.',
        'Verify the adapter factory is registered in registry.ts in the correct priority order.',
        'Verify the adapter is exported from harness/index.ts.',

        // ── Plugin and hooks ──
        'Verify the plugin has correct manifest, hooks, and config files.',
        'Verify hooks follow the standard delegate-to-CLI pattern (invoke babysitter hook:run, not inline logic).',
        'Verify skills use the SDK CLI instructions command, not embedded static content.',
        'Verify install/uninstall scripts are idempotent and complete.',

        // ── Plugin naming convention ──
        'Verify the plugin registers as "babysitter" (NOT "babysitter-<harness>") in: the harness-specific manifest name field (.cursor-plugin/plugin.json, .codex-plugin/plugin.json, .github/plugin.json, etc.), the PLUGIN_NAME or EXTENSION_DIR_NAME constant in install scripts, marketplace entries, and install target directory paths.',
        'Verify log prefixes use "[babysitter]" not "[babysitter-<harness>]".',
        'Verify the install target directory path matches the harness official docs (e.g. Cursor requires plugins/local/, not just plugins/).',

        // ── Testing coverage ──
        'Verify adapter unit tests exist at packages/sdk/src/harness/__tests__/<adapterName>.test.ts.',
        'Verify adapter tests cover: isActive, resolveSessionId, resolveStateDir, resolvePluginRoot, bindSession, handleStopHook (with completion proof and journal replay), handleSessionStartHook (with state file and context injection), findHookDispatcherPath.',
        'Verify adapter tests cover discovery entries (KNOWN_HARNESSES), invoker entries (HARNESS_CLI_MAP, buildHarnessArgs), and registry integration (detectAdapter, getAdapterByName).',
        'Verify adapter tests use proper patterns: env var save/restore, vi.mock for execFile, mkdtemp for file ops, synthetic stdin for hooks.',
        'Verify plugin integration tests exist at <pluginDir>/test/integration.test.js with: JS syntax validation (node --check), shell script validation (sh -n).',
        'Verify plugin packaged-install tests exist at <pluginDir>/test/packaged-install.test.js with: npm pack, install verification, file manifest check, hooks.json validation, skill distribution, config validation, marketplace registration.',
        'Verify E2E Docker test file exists at e2e-tests/docker/<adapterName>.test.ts with: harness discovery, plugin installation, hook executability, session flow.',
        'Verify package.json has test script that runs both integration and packaged-install tests.',
        'Verify all tests pass: adapter tests via vitest, plugin tests via node.',

        // ── CI/CD integration ──
        'Verify .github/workflows/e2e-docker.yml paths triggers include the plugin directory.',
        'Verify .github/workflows/release.yml validate job includes plugin test step.',
        'Verify .github/workflows/ci.yml includes plugin test step if the plugin has tests.',
        'If npm-published: verify release.yml has npm publish step, staging-publish.yml has staging publish step.',
        'Verify .github/workflows/docker-publish.yml paths include the plugin directory if Docker-relevant.',
        'Verify E2E test is included in the Docker E2E test run commands.',

        // ── Anti-patterns ──
        'Verify README does not expose raw CLI primitives to end users.',
        'Verify no generated code uses kind: "node" effects, direct result.json writes, or implicit breakpoint approval.',
        'Deduct heavily for: missing adapter methods (especially stop/session-start hooks), broken discovery/invoker entries, stub implementations that skip journal replay or completion proof, redundant orchestration scripts or custom tools, missing getPromptContext or incorrect PromptContext values, missing or inadequate tests, missing CI/CD integration.',
        'Return both score and qualityScore for backwards compatibility.',
      ],
      outputFormat: 'JSON with score, qualityScore, dimensions, issues, recommendations, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'qualityScore', 'dimensions', 'issues', 'summary'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensions: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'verify'],
}));

// ---------------------------------------------------------------------------
// Convergence refinement
// ---------------------------------------------------------------------------

export const refineAssimilationTask = defineTask('refine-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine ${args.harnessName} assimilation (iteration ${args.iteration})`,
  description: 'Apply targeted fixes to close the highest-impact quality gaps',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'staff integration engineer',
      task: `Fix the highest-impact gaps in the ${args.harnessName} harness assimilation`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        iteration: args.iteration,
        issues: args.issues,
        recommendations: args.recommendations,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        'Prioritize fixes that restore missing adapter methods, broken registry entries, or incorrect hook delegation.',
        'Fix missing or incorrect KNOWN_HARNESSES or HARNESS_CLI_MAP entries.',
        'Fix skills that embed static content instead of using the SDK CLI instructions command.',
        'Fix hooks that implement logic directly instead of delegating to babysitter hook:run.',
        'Remove any redundant orchestration scripts, loop drivers, effect adapters, or custom tools.',
        'Fix README content that exposes raw CLI primitives to end users.',
        'Fix incorrect plugin naming: the plugin must register as "babysitter" (not "babysitter-<harness>") in manifests, PLUGIN_NAME constants, marketplace entries, install target paths, and log prefixes.',
        'Fix incorrect install paths: verify the install target directory matches the harness official docs (e.g. Cursor requires plugins/local/, not just plugins/).',
        'Return the files created or modified and summarize the fixes applied.',
      ],
      outputFormat: 'JSON with filesCreated, filesModified, fixesApplied, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'fixesApplied', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        fixesApplied: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['agent', 'assimilation', 'converge'],
}));
