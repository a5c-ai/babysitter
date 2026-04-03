/**
 * @process assimilation/harness/gemini-cli
 * @description Orchestrate babysitter SDK integration into Gemini CLI.
 *   Gemini CLI uses an extension manifest (gemini-extension.json with settings,
 *   mcpServers, contextFileName), GEMINI.md for agent instructions, 11 hook types
 *   (SessionStart, SessionEnd, BeforeAgent, AfterAgent, BeforeModel, AfterModel,
 *   BeforeToolSelection, BeforeTool, AfterTool, PreCompress, Notification), commands
 *   in TOML format, and git-based distribution (`gemini extensions install <repo>`).
 *   Hook I/O: JSON stdin/stdout with allow/block/deny decisions, exit codes 0/2.
 *   Environment variables: GEMINI_SESSION_ID, GEMINI_PROJECT_DIR, GEMINI_CWD,
 *   GEMINI_EXTENSION_PATH.
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

  const harnessName = 'Gemini CLI';
  const adapterName = 'gemini-cli';
  const pluginDir = 'plugins/babysitter-gemini';
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
  // Gemini-specific: extension manifest (gemini-extension.json) with settings
  // array, mcpServers, contextFileName in ~/.gemini/extensions/. GEMINI.md as
  // context file. 11 hook types: SessionStart, SessionEnd, BeforeAgent,
  // AfterAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool,
  // AfterTool, PreCompress, Notification. Hook I/O: JSON stdin/stdout with
  // allow/block/deny decisions, exit codes 0 (success) and 2 (system block).
  // AfterAgent is the primary continuation hook for orchestration loops.
  // Commands use TOML format in commands/<group>/<name>.toml with description
  // and prompt fields, {{args}} placeholder.
  // Distribution: git repo-based (`gemini extensions install <repo-uri>`),
  // GitHub Releases with pre-built archives, gallery via `gemini-cli-extension`
  // topic tag. Settings with sensitive:true stored in system keychain.
  // Env vars: GEMINI_SESSION_ID, GEMINI_PROJECT_DIR, GEMINI_CWD,
  // GEMINI_EXTENSION_PATH.
  // ==========================================================================

  ctx.log('phase:research', 'Researching Gemini CLI extension model, hook chain, and distribution');

  const research = await ctx.task(researchHarnessTask, {
    projectDir,
    harnessName,
  });

  // ==========================================================================
  // PHASE 1: SDK ADAPTER
  // Gemini CLI adapter exists at packages/sdk/src/harness/geminiCli.ts.
  // Key: AfterAgent as primary continuation hook (block/allow/deny JSON decisions),
  // GEMINI_* env vars (SESSION_ID, PROJECT_DIR, CWD, EXTENSION_PATH),
  // SessionBinding + StopHook + HeadlessPrompt capabilities.
  // ==========================================================================

  ctx.log('phase:adapter', 'Verifying/updating Gemini CLI adapter and registry entries');

  const adapter = await ctx.task(implementAdapterTask, {
    projectDir,
    harnessName,
    adapterName,
    adapterFile: 'geminiCli.ts',
    research,
  });

  integrationFiles.push(...adapter.filesCreated, ...adapter.filesModified);

  // ==========================================================================
  // PHASE 2: PLUGIN + SKILLS + COMMANDS
  // Gemini plugin uses gemini-extension.json manifest with settings array,
  // mcpServers, contextFileName. GEMINI.md for agent instructions.
  // Commands in TOML format: commands/<group>/<name>.toml with description
  // and prompt fields. Skills activated via activate_skill tool.
  // Commands: ALL 15 command files from plugins/babysitter/commands/ must be
  // ported identically (harness-agnostic, invoke skills via Skill tool).
  // ==========================================================================

  ctx.log('phase:plugin', 'Creating Gemini CLI plugin and porting skills');

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
  // PRIMARY install: git repo-based (`gemini extensions install <repo-uri>`).
  // Gallery listing via `gemini-cli-extension` GitHub topic tag.
  // GitHub Releases with pre-built archives for faster install.
  // SECONDARY install: npm/bin-based for development/testing convenience.
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
  // Create a sync script at plugins/babysitter-gemini/scripts/ that keeps
  // plugin commands/skills in sync with the canonical babysitter commands.
  // Gemini CLI uses extension manifest and GEMINI.md for agent instructions.
  // The sync variant is auto-detected based on the plugin directory structure.
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
    syncVariant: 'auto-detect',
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
