/**
 * @process assimilation/harness/cursor
 * @description Orchestrate babysitter SDK integration into Cursor IDE/CLI.
 *   Cursor is a VS Code fork with built-in AI capabilities. It has:
 *   - A CLI (`cursor`) with headless agent mode (`cursor agent --print -p "prompt"`)
 *   - Hooks system (1.7+): beforeSubmitPrompt, beforeShellExecution, beforeMCPExecution,
 *     afterFileEdit, afterAgentResponse, stop — configured via .cursor/hooks.json
 *   - NOTE: As of writing, hooks only fire in IDE mode, NOT in headless CLI mode.
 *     The sessionStart hook fires in headless, but afterAgentResponse and stop do not.
 *     This is a known limitation that may change — the research phase must verify current state.
 *   - Config: .cursor/ directory, .cursorrules for rules
 *   - MCP server support for tool access
 *   - VS Code extension model (not a standalone plugin system)
 *   - Already has minimal KNOWN_HARNESSES entry (HeadlessPrompt only, no callerEnvVars)
 *
 *   Key challenge: hooks don't work in headless CLI mode, so the continuation mechanism
 *   is limited. The process must research the current state of Cursor hooks in CLI mode
 *   and determine whether stop-hook, in-turn, or a hybrid approach is appropriate.
 *
 * @inputs { projectDir: string, targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, integrationFiles: string[], finalQuality: number, iterations: number }
 */

import {
  researchHarnessTask,
  implementAdapterTask,
  createPluginTask,
  portSkillsTask,
  createInstallDistTask,
  implementHarnessWrapperTask,
  writeReadmeTask,
  writeAdapterTestsTask,
  writePluginTestsTask,
  setupCiCdTask,
  createSyncScriptTask,
  verifyAssimilationTask,
  refineAssimilationTask,
} from './shared-assimilation.js';

export async function process(inputs, ctx) {
  const {
    projectDir,
    targetQuality = 80,
    maxIterations = 6,
  } = inputs;

  const harnessName = 'Cursor';
  const adapterName = 'cursor';
  const pluginDir = 'plugins/babysitter-cursor';
  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  // ==========================================================================
  // PHASE 0: RESEARCH
  // The shared researchHarnessTask now covers comprehensive official docs
  // verification including: exact hook type names, which hooks control flow,
  // hooks config format, plugin manifest format/location, plugin install/
  // distribution CLI commands, and stop-hook existence verification.
  //
  // Cursor-specific research priorities:
  //   1. Current state of hooks in CLI headless mode (cursor -p / --print).
  //      As of Cursor 1.7+, hooks (stop, afterAgentResponse, afterFileEdit)
  //      do NOT fire in headless CLI mode. Only sessionStart fires. This may
  //      have changed — the feature is still in beta. Research MUST verify
  //      from official Cursor docs which hooks fire in headless mode and
  //      which hooks can control flow (block/approve).
  //   2. Environment variables Cursor sets (session ID, workspace, etc.)
  //      Currently KNOWN_HARNESSES has empty callerEnvVars — research if
  //      Cursor now sets any identifiable env vars. Known user-set vars:
  //      CURSOR_API_KEY (auth for headless), NO_OPEN_BROWSER.
  //   3. MCP server support — Cursor has MCP, but headless mode requires
  //      --approve-mcps flag to auto-approve MCP connections. Research
  //      whether this is sufficient for babysitter MCP tool access.
  //   4. Hook events — verify from official docs: sessionStart, afterFileEdit,
  //      beforeShellExecution, afterMCPExecution, preToolUse, postToolUse,
  //      postToolUseFailure. Verify which can return flow-control decisions.
  //      Configured in .cursor/hooks.json (project) or ~/.cursor/hooks.json.
  //   5. .cursorrules format for embedding orchestration rules, .cursor/rules/
  //      directory for project rules, .mdc format.
  //   6. CLI invocation flags (critical for adapter/invoker):
  //      -p/--print (headless), --force/--yolo (bypass approvals),
  //      --output-format text|json|stream-json, --stream-partial-output,
  //      --mode agent|plan|ask, --model <model>, --workspace <path>,
  //      --cloud/-c (Cloud Agent background execution),
  //      --resume <chatId> (resume session by UUID), --continue (resume latest),
  //      --sandbox enabled|disabled, --approve-mcps, --api-key, --trust.
  //   7. Session model: Cursor has UUID-based session IDs, session listing
  //      (agent ls), session resume (--resume/--continue). No auto-set env var
  //      for session ID detection — BABYSITTER_SESSION_ID used as cross-harness fallback if set externally.
  //   8. Plugin manifest and marketplace — verify from official docs:
  //      .cursor-plugin/plugin.json manifest format (skills/hooks as path
  //      strings not arrays/objects, no contextFileName field), Cursor
  //      Marketplace submission process, ~/.cursor/plugins/local/ for local
  //      testing, /add-plugin command, and plugin install/uninstall CLI commands.
  //   9. Known headless bugs: terminal not fully released, agent hangs
  //      indefinitely without exiting in some versions. Must verify current state.
  //  10. Existing SDK support: cursor entry in KNOWN_HARNESSES (HeadlessPrompt
  //      only, empty callerEnvVars), HARNESS_CLI_MAP (cli="cursor",
  //      supportsModel=false, promptStyle="flag"), NO dedicated adapter file.
  // ==========================================================================

  ctx.log('phase:research', 'Researching Cursor hooks model, headless CLI state, and integration surfaces');

  const research = await ctx.task(researchHarnessTask, {
    projectDir,
    harnessName,
  });

  // ==========================================================================
  // PHASE 1: SDK ADAPTER
  // Cursor has a minimal entry in discovery/invoker but NO adapter file.
  // This phase creates the adapter. Key decisions from research:
  //   - If hooks work in CLI mode now → stop-hook model, hookDriven=true
  //   - If hooks still IDE-only → in-turn model, hookDriven=false
  //   - callerEnvVars: research must determine if Cursor sets identifiable env vars
  //     (currently empty — no auto-detection possible)
  //   - Capabilities: currently HeadlessPrompt only, may add StopHook, SessionBinding,
  //     Mcp (Cursor supports MCP but with --approve-mcps caveat)
  //   - HARNESS_CLI_MAP update: supportsModel may now be true (--model flag exists),
  //     add workspaceFlag (--workspace), add baseArgs if needed
  //   - getPromptContext: determine correct loopControlTerm based on hook support
  //   - Cloud Agent (--cloud flag): consider whether this maps to a capability
  //   - Session resume (--resume/--continue): consider SessionBinding support
  //   - Output format (--output-format json): structured output for result parsing
  // ==========================================================================

  ctx.log('phase:adapter', 'Implementing Cursor adapter and updating discovery/invoker entries');

  const adapter = await ctx.task(implementAdapterTask, {
    projectDir,
    harnessName,
    adapterName,
    adapterFile: 'cursor.ts',
    research,
  });

  integrationFiles.push(...adapter.filesCreated, ...adapter.filesModified);

  // ==========================================================================
  // PHASE 2: PLUGIN + SKILLS + COMMANDS
  // Cursor plugin uses the Cursor Plugin Marketplace model:
  //   - Manifest: .cursor-plugin/plugin.json (skills/hooks as path strings,
  //     no contextFileName field, no inline objects for hooks)
  //   - Can package: rules, skills, agents, commands, MCP servers, hooks
  //   - Local testing: ~/.cursor/plugins/local/
  //   - Distribution: Cursor Marketplace (manually reviewed) or direct install
  //   - Installation: /add-plugin command in Cursor (marketplace-first)
  // Skills may be embedded as .cursorrules, .cursor/rules/ entries, or as
  // MCP tool descriptions accessible via the plugin's MCP server.
  // Commands: ALL 15 command files from plugins/babysitter/commands/ must be
  // ported identically (assimilate, call, cleanup, contrib, doctor, forever,
  // help, observe, plan, plugins, project-install, resume, retrospect,
  // user-install, yolo). Commands are harness-agnostic.
  // ==========================================================================

  ctx.log('phase:plugin', 'Creating Cursor plugin structure and porting skills');

  const [plugin, skills] = await ctx.parallel.all([
    async () => ctx.task(createPluginTask, {
      projectDir,
      harnessName,
      pluginDir,
      research,
    }),
    async () => ctx.task(portSkillsTask, {
      projectDir,
      harnessName,
      pluginDir,
      research,
    }),
  ]);

  integrationFiles.push(...plugin.filesCreated, ...skills.filesCreated);

  // ==========================================================================
  // PHASE 3: INSTALL/DIST + HARNESS WRAPPER
  // PRIMARY install: Cursor Plugin Marketplace (marketplace-first).
  // SECONDARY install: npm/bin-based for development/testing convenience.
  // Cursor distribution: Cursor Plugin Marketplace or ~/.cursor/plugins/local/.
  // Harness wrapper: cursor -p "prompt" --force --output-format json
  //   (headless mode with structured output).
  // HARNESS_CLI_MAP already has cursor entry but may need updates:
  //   supportsModel → true (--model flag exists), add workspaceFlag.
  // Known issue: headless mode may hang — wrapper should handle timeouts.
  // ==========================================================================

  ctx.log('phase:install', 'Creating install/dist method and verifying harness wrapper');

  const [installDist, harnessWrapper] = await ctx.parallel.all([
    async () => ctx.task(createInstallDistTask, {
      projectDir,
      harnessName,
      pluginDir,
      research,
    }),
    async () => ctx.task(implementHarnessWrapperTask, {
      projectDir,
      harnessName,
      adapterName,
      research,
    }),
  ]);

  integrationFiles.push(...installDist.filesCreated, ...(harnessWrapper.filesModified || []));

  // ==========================================================================
  // PHASE 4: README
  // ==========================================================================

  ctx.log('phase:docs', 'Writing Cursor plugin README');

  const readme = await ctx.task(writeReadmeTask, {
    projectDir,
    harnessName,
    pluginDir,
    research,
    pluginFiles: integrationFiles,
  });

  integrationFiles.push(...readme.filesCreated);

  // ==========================================================================
  // PHASE 5: TESTING
  // Adapter unit tests and plugin integration tests run in parallel.
  // Adapter tests: Vitest in packages/sdk/src/harness/__tests__/
  // Plugin tests: syntax validation + packaged-install in <pluginDir>/test/
  // ==========================================================================

  ctx.log('phase:testing', 'Writing adapter unit tests and plugin integration tests');

  const [adapterTests, pluginTests] = await ctx.parallel.all([
    async () => ctx.task(writeAdapterTestsTask, {
      projectDir,
      harnessName,
      adapterName,
      adapterFile: adapter.adapterFile,
      research,
      integrationFiles,
    }),
    async () => ctx.task(writePluginTestsTask, {
      projectDir,
      harnessName,
      adapterName,
      pluginDir,
      research,
      integrationFiles,
    }),
  ]);

  integrationFiles.push(...adapterTests.filesCreated, ...pluginTests.filesCreated);

  // ==========================================================================
  // PHASE 6: CI/CD INTEGRATION
  // Update CI workflows: PR validation, E2E Docker tests, release pipeline,
  // staging publish, Docker image build triggers.
  // ==========================================================================

  ctx.log('phase:ci-cd', 'Configuring CI/CD pipelines for new plugin');

  const ciCd = await ctx.task(setupCiCdTask, {
    projectDir,
    harnessName,
    pluginDir,
    adapterName,
    research,
    integrationFiles,
  });

  integrationFiles.push(...ciCd.filesModified);

  // ==========================================================================
  // PHASE 6b: COMMAND SYNC SCRIPT
  // Create a sync script at plugins/babysitter-cursor/scripts/ that keeps
  // plugin commands and skills in sync with the canonical babysitter commands.
  // Cursor has both commands/ and skills/ directories, so this should use
  // the "commands + skills" variant (sync-command-surfaces.js pattern).
  // The script is registered in scripts/sync-plugin-commands.cjs so that
  // `node scripts/sync-plugin-commands.cjs` and `--check` mode include it.
  // ==========================================================================

  ctx.log('phase:sync-script', 'Creating command sync script and registering in central orchestrator');

  const syncScript = await ctx.task(createSyncScriptTask, {
    projectDir,
    harnessName,
    pluginDir,
    adapterName,
    research,
    syncVariant: 'commands-and-skills',
  });

  integrationFiles.push(...syncScript.filesCreated, ...syncScript.filesModified);

  // ==========================================================================
  // PHASE 7: VERIFY + CONVERGE
  // ==========================================================================

  ctx.log('phase:verify', 'Scoring assimilation quality');

  let verification = await ctx.task(verifyAssimilationTask, {
    projectDir,
    harnessName,
    targetQuality,
    integrationFiles,
    research,
  });

  finalQuality = verification.qualityScore;
  iterations = 1;

  while (finalQuality < targetQuality && iterations < maxIterations) {
    iterations++;
    ctx.log('phase:converge', `Refinement iteration ${iterations}`);

    const refinement = await ctx.task(refineAssimilationTask, {
      projectDir,
      harnessName,
      iteration: iterations,
      issues: verification.issues,
      recommendations: verification.recommendations,
      integrationFiles,
    });

    integrationFiles.push(...refinement.filesCreated, ...refinement.filesModified);

    verification = await ctx.task(verifyAssimilationTask, {
      projectDir,
      harnessName,
      targetQuality,
      integrationFiles,
      research,
    });

    finalQuality = verification.qualityScore;
    ctx.log('phase:converge:score', `Quality: ${finalQuality}/${targetQuality}`);
  }

  return {
    success: finalQuality >= targetQuality,
    integrationFiles: [...new Set(integrationFiles)],
    finalQuality,
    iterations,
  };
}
