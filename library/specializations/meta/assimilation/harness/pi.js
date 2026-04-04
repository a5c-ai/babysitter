/**
 * @process assimilation/harness/pi
 * @description Orchestrate babysitter SDK integration into Pi Coding Agent (pi CLI).
 *   Pi is the upstream Pi Coding Agent with CLI command `pi`. It shares the
 *   adapter codebase with oh-my-pi but has its own CLI, env vars (PI_SESSION_ID,
 *   PI_PLUGIN_ROOT), discovery entry, invoker entry, plugin structure, and
 *   distribution. Uses a loop-driver mechanism (agent_end + followUp) and
 *   in-process event handling rather than shell hooks.
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
    projectDir = 'plugins/babysitter-pi',
    targetQuality = 80,
    maxIterations = 6,
  } = inputs;

  const harnessName = 'Pi Coding Agent';
  const adapterName = 'pi';
  const pluginDir = 'plugins/babysitter-pi';
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
  // Pi-specific: CLI command `pi`, PI_SESSION_ID/PI_PLUGIN_ROOT env vars,
  // npm package with pi-specific fields in package.json, extensions/ directory,
  // skills/ for SKILL.md files, bin/ for CLI entry points, loop-driver via
  // agent_end event. Shares adapter code with oh-my-pi but distinct plugin,
  // distribution, and CLI surface. Research must verify the loop-driver
  // mechanism and skill format (SKILL.md) from official Pi documentation.
  // Research must also verify plugin manifest format (skills/hooks as path
  // strings vs arrays/objects, no contextFileName field).
  // ==========================================================================

  ctx.log('phase:research', 'Researching Pi Coding Agent extension model, loop-driver, and distribution');

  const research = await ctx.task(researchHarnessTask, {
    projectDir,
    harnessName,
  });

  // ==========================================================================
  // PHASE 1: SDK ADAPTER
  // Pi adapter exists at packages/sdk/src/harness/pi.ts (shared with oh-my-pi).
  // This phase verifies the pi-specific discovery entry (name="pi", cli="pi",
  // PI_* env vars) and invoker entry are correct and distinct from oh-my-pi.
  // Key: Programmatic capability, loop-driver, dual env var support.
  // ==========================================================================

  ctx.log('phase:adapter', 'Verifying/updating Pi adapter and registry entries');

  const adapter = await ctx.task(implementAdapterTask, {
    projectDir,
    harnessName,
    adapterName,
    adapterFile: 'pi.ts',
    research,
  });

  integrationFiles.push(...adapter.filesCreated, ...adapter.filesModified);

  // ==========================================================================
  // PHASE 2: PLUGIN + SKILLS + COMMANDS
  // Pi plugin uses package.json with pi-specific fields (skills/hooks as path
  // strings, no contextFileName field), extensions/ for lifecycle hooks,
  // skills/ for SKILL.md files, bin/ for CLI entry points.
  // Commands: ALL 15 command files from plugins/babysitter/commands/ must be
  // ported identically (harness-agnostic, invoke skills via Skill tool).
  // ==========================================================================

  ctx.log('phase:plugin', 'Creating Pi plugin structure and porting skills');

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
  // PRIMARY install: pi plugin manager (marketplace-first).
  // SECONDARY install: npm/bin-based for development/testing convenience.
  // Pi distribution: npm package with bin scripts.
  // Harness wrapper: pi --workspace <dir> --prompt <text>
  // ==========================================================================

  ctx.log('phase:install', 'Creating npm install/dist method and verifying harness wrapper');

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

  ctx.log('phase:docs', 'Writing Pi plugin README');

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
  // Create a sync script at plugins/babysitter-pi/scripts/ that keeps
  // plugin commands/skills in sync with the canonical babysitter commands.
  // Pi already has sync-command-docs.cjs registered — this phase ensures
  // it exists and is properly integrated, or creates the appropriate variant.
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
