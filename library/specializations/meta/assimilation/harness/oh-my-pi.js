/**
 * @process assimilation/harness/oh-my-pi
 * @description Orchestrate babysitter SDK integration into oh-my-pi (can1357/oh-my-pi).
 *   Oh-my-pi is a fork/extension of Pi Coding Agent with CLI command `omp`. It has
 *   its own plugin ecosystem, TUI widgets, sub-agent management, MCP support, and
 *   extension API with full lifecycle events. Uses OMP_SESSION_ID/OMP_PLUGIN_ROOT
 *   env vars, loop-driver mechanism (agent_end + followUp), and in-process event
 *   handling. Shares the SDK adapter with Pi but has a distinct plugin structure,
 *   distribution, CLI surface, and richer extension capabilities.
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
    projectDir = 'plugins/babysitter-omp',
    targetQuality = 80,
    maxIterations = 6,
  } = inputs;

  const harnessName = 'oh-my-pi';
  const adapterName = 'oh-my-pi';
  const pluginDir = 'plugins/babysitter-omp';
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
  // Oh-my-pi-specific: CLI command `omp`, OMP_SESSION_ID/OMP_PLUGIN_ROOT env
  // vars, npm package with omp.extensions/omp.skills fields in package.json,
  // richer extension API (CustomToolAPI, TUI widgets, status line, overlays),
  // plugin manager (install/uninstall/link/enable/disable), sub-agent/task tool
  // with parallel execution, session JSONL with tree semantics, hash-anchored
  // edits, LSP integration. Loop-driver via agent_end event — research must
  // verify this mechanism from official docs and confirm whether agent_end
  // can block completion (like a stop-hook) or only triggers continuation.
  // Research must also verify plugin manifest format (skills/hooks as path
  // strings vs arrays/objects, no contextFileName field).
  // ==========================================================================

  ctx.log('phase:research', 'Researching oh-my-pi extension API, plugin manager, and distribution');

  const research = await ctx.task(researchHarnessTask, {
    projectDir,
    harnessName,
  });

  // ==========================================================================
  // PHASE 1: SDK ADAPTER
  // Oh-my-pi shares the adapter at packages/sdk/src/harness/pi.ts with Pi.
  // This phase verifies the oh-my-pi-specific discovery entry (name="oh-my-pi",
  // cli="omp", OMP_* env vars) and invoker entry are correct and distinct from
  // the pi entry. Key: Programmatic capability, loop-driver via agent_end,
  // richer capabilities from omp extension API.
  // ==========================================================================

  ctx.log('phase:adapter', 'Verifying/updating oh-my-pi adapter and registry entries');

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
  // Oh-my-pi plugin uses package.json with omp field (skills/hooks as path
  // strings, no contextFileName field), extensions/ for lifecycle and custom
  // tool registration, skills/ for SKILL.md files, bin/ for CLI entry points.
  // Can also leverage TUI widget registration and status line integration
  // for babysitter run status display.
  // Commands: ALL 15 command files from plugins/babysitter/commands/ must be
  // ported identically (harness-agnostic, invoke skills via Skill tool).
  // ==========================================================================

  ctx.log('phase:plugin', 'Creating oh-my-pi plugin structure and porting skills');

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
  // PRIMARY install: omp plugin manager (marketplace-first).
  // SECONDARY install: npm/bin-based for development/testing convenience.
  // Oh-my-pi distribution: npm package, installable via omp plugin manager
  // (omp plugin install) or npm directly.
  // Harness wrapper: omp --workspace <dir> --prompt <text>
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

  ctx.log('phase:docs', 'Writing oh-my-pi plugin README');

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
  // Create a sync script at plugins/babysitter-omp/scripts/ that keeps
  // plugin commands/skills in sync with the canonical babysitter commands.
  // oh-my-pi uses npm package distribution with omp field in package.json.
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
