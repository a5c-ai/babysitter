/**
 * @process assimilation/harness/opencode
 * @description Orchestrate babysitter SDK integration into OpenCode.
 *   OpenCode uses project/global config (opencode.json), repo-local plugins and
 *   custom tools, session.created and session.idle events for lifecycle management,
 *   and MCP helpers for tool access. The continuation mechanism is session.idle
 *   callback with plugin state.
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

  const harnessName = 'OpenCode';
  const adapterName = 'opencode';
  const pluginDir = 'plugins/babysitter-opencode';
  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  // ==========================================================================
  // PHASE 0: RESEARCH
  // The shared researchHarnessTask now covers comprehensive official docs
  // verification including: exact hook/event type names, which hooks control
  // flow, hooks config format, plugin manifest format/location, plugin
  // install/distribution CLI commands, and stop-hook existence verification.
  //
  // OpenCode-specific: opencode.json config, .opencode/ directory,
  // session.created/session.idle events, plugin directory, custom tools,
  // MCP helpers. Claimed to have no shell hooks - uses event-based plugin
  // model. Research MUST verify this from official OpenCode documentation
  // and determine whether events can control flow or are fire-and-forget.
  // Research must also verify plugin manifest format (skills/hooks as path
  // strings vs arrays/objects, no contextFileName field).
  // ==========================================================================

  ctx.log('phase:research', 'Researching OpenCode plugin model, event system, and distribution');

  const research = await ctx.task(researchHarnessTask, {
    projectDir,
    harnessName,
  });

  // ==========================================================================
  // PHASE 1: SDK ADAPTER
  // OpenCode adapter may need creation or update.
  // Key: session.idle as continuation mechanism (in-turn loop driving if no
  // event support), HeadlessPrompt capability only.
  // ==========================================================================

  ctx.log('phase:adapter', 'Implementing/updating OpenCode adapter and registry entries');

  const adapter = await ctx.task(implementAdapterTask, {
    projectDir,
    harnessName,
    adapterName,
    adapterFile: 'opencode.ts',
    research,
  });

  integrationFiles.push(...adapter.filesCreated, ...adapter.filesModified);

  // ==========================================================================
  // PHASE 2: PLUGIN + SKILLS + COMMANDS
  // Plugin manifest: skills/hooks as path strings, no contextFileName field.
  // Commands: ALL 15 command files from plugins/babysitter/commands/ must be
  // ported identically (harness-agnostic, invoke skills via Skill tool).
  // ==========================================================================

  ctx.log('phase:plugin', 'Creating OpenCode plugin and porting skills');

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
  // PRIMARY install: marketplace/plugin-system (marketplace-first).
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
  // Create a sync script at plugins/babysitter-opencode/scripts/ that keeps
  // plugin commands/skills in sync with the canonical babysitter commands.
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
