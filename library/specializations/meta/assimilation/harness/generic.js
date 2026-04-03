/**
 * @process assimilation/harness/generic
 * @description Orchestrate babysitter SDK integration into a new AI coding harness.
 *   Produces: SDK adapter, discovery/invoker/registry entries, plugin with hooks and
 *   skills, install/dist method, harness wrapper support, and README.
 * @inputs { projectDir: string, harnessName: string, harnessCliCommand: string, targetQuality: number, maxIterations: number }
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
    harnessName,
    harnessCliCommand,
    targetQuality = 80,
    maxIterations = 5,
  } = inputs;

  const adapterName = harnessCliCommand || harnessName.toLowerCase().replace(/\s+/g, '-');
  const pluginDir = `plugins/babysitter-${adapterName}`;
  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  // ==========================================================================
  // PHASE 0: RESEARCH
  // The shared researchHarnessTask covers comprehensive official docs
  // verification including: exact hook type names (do NOT assume from other
  // harnesses), which hooks can control flow vs fire-and-forget, hooks
  // config format (version field, entry schema, platform-specific scripts),
  // plugin manifest format and location (skills/hooks as path strings,
  // no contextFileName, no inline objects), plugin install/distribution
  // CLI commands and marketplace system, official documentation URL reading,
  // and critically — whether a stop-hook or equivalent exists that can
  // block agent completion and trigger re-entry (determines the entire
  // orchestration model: hook-driven vs in-turn).
  // ==========================================================================

  ctx.log('phase:research', `Researching ${harnessName} integration surfaces and distribution model`);

  const research = await ctx.task(researchHarnessTask, {
    projectDir,
    harnessName,
  });

  // ==========================================================================
  // PHASE 1: SDK ADAPTER
  // ==========================================================================

  ctx.log('phase:adapter', `Implementing ${harnessName} SDK harness adapter`);

  const adapter = await ctx.task(implementAdapterTask, {
    projectDir,
    harnessName,
    adapterName,
    research,
  });

  integrationFiles.push(...adapter.filesCreated, ...adapter.filesModified);

  // ==========================================================================
  // PHASE 2: PLUGIN STRUCTURE + SKILLS + COMMANDS
  // Hooks and plugin manifest can be created in parallel with skill porting.
  // Plugin manifest: skills/hooks as path strings, no contextFileName field,
  // no inline objects for hooks.
  // Commands: ALL 15 command files from plugins/babysitter/commands/ must be
  // ported identically (harness-agnostic, invoke skills via Skill tool).
  // ==========================================================================

  ctx.log('phase:plugin', `Creating ${harnessName} plugin structure and porting skills`);

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
  // These are independent and can run in parallel.
  // ==========================================================================

  ctx.log('phase:install', `Creating install/dist method and harness wrapper for ${harnessName}`);

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

  ctx.log('phase:docs', `Writing ${harnessName} plugin README`);

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
  // Adapter unit tests + plugin integration tests run in parallel
  // ==========================================================================

  ctx.log('phase:testing', `Writing tests for ${harnessName} adapter and plugin`);

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
  // ==========================================================================

  ctx.log('phase:ci-cd', `Configuring CI/CD pipelines for ${harnessName} plugin`);

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
  // Create a sync script at <pluginDir>/scripts/ that keeps plugin commands
  // and/or skills in sync with the canonical babysitter commands. The sync
  // variant (commands-and-skills vs skills-only) is auto-detected based on
  // whether the plugin has both commands/ and skills/ directories or only
  // skills/. The script is registered in scripts/sync-plugin-commands.cjs
  // so that `node scripts/sync-plugin-commands.cjs` and `--check` mode
  // include this new plugin.
  // ==========================================================================

  ctx.log('phase:sync-script', `Creating command sync script for ${harnessName} plugin`);

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
  // PHASE 7: VERIFY
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

  ctx.log('phase:verify:complete', `Quality: ${finalQuality}/${targetQuality}`);

  // ==========================================================================
  // PHASE 8: CONVERGE
  // ==========================================================================

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
    ctx.log('phase:converge:score', `Quality: ${finalQuality}/${targetQuality} (iteration ${iterations})`);
  }

  return {
    success: finalQuality >= targetQuality,
    integrationFiles: [...new Set(integrationFiles)],
    finalQuality,
    iterations,
  };
}
