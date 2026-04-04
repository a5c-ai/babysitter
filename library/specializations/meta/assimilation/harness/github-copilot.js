/**
 * @process assimilation/harness/github-copilot
 * @description Orchestrate babysitter SDK integration into GitHub Copilot CLI agent.
 *   GitHub CLI (`gh`) is GitHub's official CLI tool. It includes:
 *   - `gh copilot` subcommand for AI features (suggest, explain)
 *   - `gh copilot suggest` / `gh copilot explain` for one-shot AI interactions
 *   - `gh extension` system for distributing custom CLI commands as repos
 *   - GitHub Copilot in the CLI for agent-style coding (emerging feature)
 *
 *   The GitHub CLI is NOT a traditional coding harness like Claude Code or Codex.
 *   It's a GitHub API client with Copilot features bolted on. The integration
 *   approach differs from other harnesses:
 *   - Hook system exists but limited: hooks.json with camelCase types
 *     (sessionStart, sessionEnd, userPromptSubmitted, preToolUse, postToolUse,
 *     errorOccurred) — but ONLY preToolUse can return flow-control decisions.
 *     All other hook outputs are IGNORED. No stop-hook equivalent exists.
 *   - Plugin system: manifest in .plugin/, .github/plugin/, .claude-plugin/,
 *     or repo root. Install via `copilot plugin install OWNER/REPO`.
 *   - Marketplace: marketplace.json, `copilot plugin marketplace add/browse/list`
 *   - Plugin storage: ~/.copilot/installed-plugins/
 *   - Skills: skills/NAME/SKILL.md format with frontmatter
 *   - Extension model: `gh extension install owner/repo` (binary or script)
 *   - Config: ~/.config/gh/ (hosts.yml, config.yml)
 *   - Environment: GH_TOKEN, GITHUB_TOKEN, GH_HOST, GH_REPO, etc.
 *   - GitHub Copilot Workspace and Copilot Agent may introduce richer surfaces
 *
 *   The research phase MUST verify the current state of:
 *   - GitHub Copilot agent capabilities (beyond suggest/explain)
 *   - Whether `gh copilot` supports agent loops, tool use, or MCP
 *   - GitHub Copilot Workspace API/CLI if available
 *   - Whether there's a session or conversation model
 *   - Any hook or callback mechanism for continuation
 *
 *   This is a more speculative integration — the process must determine whether
 *   GitHub Copilot CLI has evolved enough to support babysitter orchestration,
 *   or if the integration should focus on the extension model as a distribution
 *   mechanism with in-turn loop driving.
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

  const harnessName = 'GitHub Copilot CLI';
  const adapterName = 'github-copilot';
  const pluginDir = 'plugins/babysitter-github';
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
  // GitHub Copilot CLI-specific research priorities:
  //   1. Current state of `gh copilot` — is there an agent loop beyond
  //      suggest/explain? Does it support tool use, MCP, or multi-turn?
  //   2. GitHub Copilot Workspace — is there a CLI/API for agent-style coding?
  //   3. GitHub Copilot Agent (coding agent in PR) — any CLI interface?
  //   4. `gh extension` model: how extensions are built (Go binary, shell script,
  //      or precompiled binary), distributed (gh extension install owner/repo),
  //      and discovered. Can an extension register hooks or intercept events?
  //   5. Environment variables: GH_TOKEN, GITHUB_TOKEN, GH_HOST, GH_REPO,
  //      GH_ENTERPRISE_TOKEN, GITHUB_ACTIONS, CI, plus any Copilot-specific vars.
  //   6. Config directory: ~/.config/gh/ (hosts.yml, config.yml, extensions/).
  //   7. Whether `gh` supports --version for CLI probing.
  //   8. Whether there's any session/conversation persistence in gh copilot.
  //   9. Whether `gh copilot` accepts model selection flags.
  //  10. Whether GitHub CLI has any concept of workspaces or project context.
  //  11. Existing SDK support: currently NONE — no KNOWN_HARNESSES entry,
  //      no HARNESS_CLI_MAP entry, no adapter file.
  //  12. CRITICAL: Verify from official GitHub Copilot CLI docs the exact hook
  //      type names (known to be camelCase: sessionStart, sessionEnd,
  //      userPromptSubmitted, preToolUse, postToolUse, errorOccurred).
  //  13. CRITICAL: Verify that ONLY preToolUse can return flow-control
  //      decisions — all other hook outputs are IGNORED by GitHub Copilot.
  //      This means NO stop-hook mechanism exists for loop driving.
  //  14. Verify hooks.json format: "version": 1, entries with type, bash,
  //      powershell, cwd, timeoutSec fields.
  //  15. Verify plugin manifest locations (.plugin/, .github/plugin/,
  //      .claude-plugin/, or repo root) and install via CLI commands
  //      (copilot plugin install OWNER/REPO). Verify manifest format:
  //      skills/hooks as path strings, no contextFileName field.
  //  16. Verify marketplace system: marketplace.json, copilot plugin
  //      marketplace add/browse/list commands, storage at
  //      ~/.copilot/installed-plugins/.
  //  17. Verify skill format: skills/NAME/SKILL.md with frontmatter.
  //
  //  The research MUST be honest about limitations. If gh copilot doesn't
  //  support agent loops, the process should document that and adjust scope
  //  to what IS possible (extension-based distribution, in-turn driving).
  // ==========================================================================

  ctx.log('phase:research', 'Researching GitHub CLI copilot capabilities, extension model, and agent support');

  const research = await ctx.task(researchHarnessTask, {
    projectDir,
    harnessName,
  });

  // ==========================================================================
  // PHASE 1: SDK ADAPTER
  // GitHub Copilot has NO existing adapter or discovery entry.
  // Key decisions from research:
  //   - If gh copilot has agent loops → implement full adapter
  //   - If gh copilot is suggest/explain only → lighter adapter with
  //     HeadlessPrompt capability, in-turn loop driving
  //   - callerEnvVars: GH_TOKEN or Copilot-specific vars
  //   - HARNESS_CLI_MAP: likely { cli: "gh", baseArgs: ["copilot"], ... }
  //   - KNOWN_HARNESSES: { name: "github-copilot", cli: "gh", ... }
  // ==========================================================================

  ctx.log('phase:adapter', 'Implementing GitHub Copilot adapter and registering in SDK');

  const adapter = await ctx.task(implementAdapterTask, {
    projectDir,
    harnessName,
    adapterName,
    adapterFile: 'githubCopilot.ts',
    research,
  });

  integrationFiles.push(...adapter.filesCreated, ...adapter.filesModified);

  // ==========================================================================
  // PHASE 2: PLUGIN + SKILLS + COMMANDS
  // GitHub plugin may use the `gh extension` model:
  //   - Extension is a Git repo with gh-babysitter as the binary/script name
  //   - Installed via: gh extension install a5c-ai/gh-babysitter
  //   - Skills adapted to work within gh extension invocation model
  //   - Plugin manifest: skills/hooks as path strings, no contextFileName
  // Or it may use config-based integration if Copilot supports it.
  // Commands: ALL 15 command files from plugins/babysitter/commands/ must be
  // ported identically (assimilate, call, cleanup, contrib, doctor, forever,
  // help, observe, plan, plugins, project-install, resume, retrospect,
  // user-install, yolo). Commands are harness-agnostic.
  // ==========================================================================

  ctx.log('phase:plugin', 'Creating GitHub CLI plugin/extension and porting skills');

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
  // PRIMARY install: marketplace-based (copilot plugin install OWNER/REPO).
  // SECONDARY install: npm/bin-based for development/testing convenience.
  // GitHub distribution: gh extension install owner/repo
  // Harness wrapper: gh copilot suggest "prompt" or equivalent
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

  ctx.log('phase:docs', 'Writing GitHub Copilot plugin README');

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
  // Create a sync script at plugins/babysitter-github/scripts/ that keeps
  // plugin commands and skills in sync with the canonical babysitter commands.
  // GitHub Copilot has both commands/ and skills/ directories, so this should
  // use the "commands + skills" variant (sync-command-surfaces.js pattern).
  // The script is registered in scripts/sync-plugin-commands.cjs so that
  // `node scripts/sync-plugin-commands.cjs` and `--check` mode include it.
  // ==========================================================================

  ctx.log('phase:sync-script', 'Creating command sync script and registering in central orchestrator');

  const syncScript = await ctx.task(createSyncScriptTask, {
    projectDir,
    harnessName,
    pluginDir,
    adapterName: 'github',
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
