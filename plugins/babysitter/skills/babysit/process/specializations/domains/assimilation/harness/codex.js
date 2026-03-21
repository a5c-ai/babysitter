/**
 * @process assimilation/harness/codex
 * @description Orchestrate babysitter SDK integration into OpenAI Codex using research-first selection among real Codex surfaces: App Server, SDK threads, MCP, AGENTS.md, repo skills, project config.toml, and notify telemetry, while treating the canonical upstream babysit process library as a cloned or synced source of truth instead of a bundled snapshot.
 * @inputs { projectDir: string, targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, integrationFiles: string[], finalQuality: number, iterations: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  adaptOriginalBabysitTask,
  refineHarnessAssimilationTask,
  runHarnessResearchTask,
  runHarnessRuntimeValidationTask,
  verifyHarnessAssimilationTask,
  writeHarnessInstallDocsTask
} from './shared-assimilation.js';

/**
 * Codex CLI Harness Integration Process
 *
 * Integrates babysitter SDK orchestration into OpenAI Codex CLI using a
 * phased approach: Analyze -> Scaffold -> Implement -> Test -> Verify -> Converge.
 *
 * Supports four strategies in descending preference:
 *   - Strategy A: App Server client owned by babysitter (closest to host-native control)
 *   - Strategy B: Codex SDK thread orchestration with persistent thread resume
 *   - Strategy C: AGENTS.md + repo skills + MCP tools for in-session assistance
 *   - Strategy D: External wrapper loop around `codex exec` (fallback / CI / bootstrap)
 *
 * Codex distribution rules:
 *   - Treat Codex as exposing skills, AGENTS.md, config.toml, MCP, CLI, and SDK surfaces
 *   - Do not model the integration as a native Codex plugin manifest unless upstream Codex docs add such a feature
 *   - Any local plugin.json-style file is Babysitter compatibility metadata only, not a Codex platform primitive
 *
 * Process-library distribution rules:
 *   - Prefer SDK/CLI-supported clone or sync of the canonical upstream babysit library
 *   - Require an explicit description of the actual process-library lifecycle and fallback behavior when Codex cannot use the preferred path directly
 *   - Treat bundled copies only as temporary compatibility fallbacks, never the source of truth
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Target Codex project directory
 * @param {number} inputs.targetQuality - Quality threshold to converge (0-100)
 * @param {number} inputs.maxIterations - Maximum convergence iterations
 * @param {string} inputs.strategy - Integration strategy: 'app-server', 'sdk', 'mcp', or 'wrapper'. Default: 'sdk'
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Integration result
 */
export async function process(inputs, ctx) {
  const {
    projectDir,
    targetQuality = 80,
    maxIterations = 6,
    strategy = 'sdk'
  } = inputs;

  const integrationFiles = [];
  let finalQuality = 0;
  let iteration = 0;

  ctx.log('Starting Codex CLI harness integration', { projectDir, strategy, targetQuality });

  const researchResult = await ctx.task(runHarnessResearchTask, {
    projectDir,
    harnessName: 'Codex CLI',
    upstreamSource: 'official Codex CLI distribution, runtime extension surface, the canonical babysitter repo, and the original Claude Code babysit skill/process library',
    distributionTarget: 'Codex App Server client assets, SDK-thread orchestration code, AGENTS.md, .agents/skills, config.toml, notify wiring, MCP tools, wrapper scripts, and a runtime-cloned or runtime-synced canonical process library',
    loopModel:
      strategy === 'app-server'
        ? 'babysitter-owned App Server client with streamed agent events and explicit approval handling'
        : strategy === 'sdk'
          ? 'persistent Codex SDK thread orchestration with explicit thread resume'
          : strategy === 'mcp'
            ? 'in-session Codex assistance via AGENTS, repo skills, and MCP tools, with continuation owned by the chosen control plane'
            : 'external supervisor fallback with explicit user-yield and resume behavior'
  });

  integrationFiles.push(...(researchResult.artifactsCreated || []));

  // ============================================================================
  // PHASE 1: ANALYZE -- Assess Codex project structure and capabilities
  // ============================================================================

  ctx.log('Phase 1: Analyze -- Assessing Codex project and environment');

  const analysis = await ctx.task(analyzeCodexProjectTask, {
    projectDir,
    strategy
  });

  ctx.log('Analysis complete', {
    codexVersion: analysis.codexVersion,
    hasMcp: analysis.hasMcpSupport,
    hasExec: analysis.hasExecMode,
    existingConfig: analysis.existingConfigFiles
  });

  // Breakpoint: review analysis before scaffolding
  await ctx.breakpoint({
    question: `Codex project analysis complete. Codex version: ${analysis.codexVersion}. Strategy: ${strategy}. MCP support: ${analysis.hasMcpSupport}. Proceed with scaffolding?`,
    title: 'Review Codex Analysis',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/analysis/codex-project-report.md`, format: 'markdown', label: 'Project Analysis' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: SCAFFOLD -- Create integration file structure
  // ============================================================================

  ctx.log('Phase 2: Scaffold -- Creating integration files in parallel');

  // Steps a, b, c, d can run in parallel (independent scaffolding)
  const [depsResult, agentsMdResult, mcpConfigResult, hookScriptsResult] = await ctx.parallel.all([
    // (a) Add babysitter SDK to Codex project dependencies
    async () => {
      const result = await ctx.task(addSdkDependencyTask, { projectDir });
      integrationFiles.push(...(result.filesCreated || []));
      return result;
    },
    // (b) Create AGENTS.md with babysitter orchestration instructions
    async () => {
      const result = await ctx.task(createAgentsMdTask, { projectDir, strategy, analysis });
      integrationFiles.push(...(result.filesCreated || []));
      return result;
    },
    // (c) Configure real Codex project config surface
    async () => {
      const result = await ctx.task(configureMcpServerTask, { projectDir, strategy, analysis });
      integrationFiles.push(...(result.filesCreated || []), ...(result.filesModified || []));
      return result;
    },
    // (d) Create notify/support scripts and wrapper entry points
    async () => {
      const result = await ctx.task(createHookScriptsTask, { projectDir, strategy });
      integrationFiles.push(...(result.filesCreated || []));
      return result;
    }
  ]);

  ctx.log('Scaffold complete', {
    depsAdded: depsResult.success,
    agentsMdCreated: agentsMdResult.success,
    mcpConfigured: mcpConfigResult.success,
    hookScriptsCreated: hookScriptsResult.success,
    totalFiles: integrationFiles.length
  });

  const assimilationResult = await ctx.task(adaptOriginalBabysitTask, {
    projectDir,
    harnessName: 'Codex CLI',
    upstreamSource: 'the canonical babysitter repo and the original Claude Code babysit skill/process library',
    research: researchResult
  });

  integrationFiles.push(...(assimilationResult.filesCreated || []), ...(assimilationResult.filesModified || []));

  // ============================================================================
  // PHASE 3: IMPLEMENT -- Build wrapper loop, effect mapping, result posting
  // ============================================================================

  ctx.log('Phase 3: Implement -- Building orchestration components');

  // Steps e, f, g can run in parallel (independent implementations)
  const [wrapperResult, effectMapResult, resultPostResult] = await ctx.parallel.all([
    // (e) Implement wrapper loop or MCP-assisted orchestration
    async () => {
      const result = await ctx.task(implementWrapperLoopTask, {
        projectDir,
        strategy,
        analysis
      });
      integrationFiles.push(...(result.filesCreated || []));
      return result;
    },
    // (f) Map Codex tool use to effect execution
    async () => {
      const result = await ctx.task(mapEffectExecutionTask, {
        projectDir,
        strategy
      });
      integrationFiles.push(...(result.filesCreated || []));
      return result;
    },
    // (g) Create result posting via MCP tool or CLI
    async () => {
      const result = await ctx.task(createResultPostingTask, {
        projectDir,
        strategy
      });
      integrationFiles.push(...(result.filesCreated || []));
      return result;
    }
  ]);

  // (h) Add runaway detection via iteration counting (depends on wrapper)
  const runawayGuardResult = await ctx.task(addRunawayDetectionTask, {
    projectDir,
    strategy,
    maxIterations,
    wrapperResult
  });
  integrationFiles.push(...(runawayGuardResult.filesCreated || []));

  ctx.log('Implementation complete', {
    wrapperCreated: wrapperResult.success,
    effectMapCreated: effectMapResult.success,
    resultPostCreated: resultPostResult.success,
    runawayGuardCreated: runawayGuardResult.success
  });

  const docsResult = await ctx.task(writeHarnessInstallDocsTask, {
    projectDir,
    harnessName: 'Codex CLI',
    research: researchResult,
    assimilation: assimilationResult
  });

  integrationFiles.push(...(docsResult.filesCreated || []), ...(docsResult.filesModified || []));

  // ============================================================================
  // PHASE 4: TEST -- Validate the integration
  // ============================================================================

  ctx.log('Phase 4: Test -- Running integration tests');

  const testResult = await ctx.task(runIntegrationTestsTask, {
    projectDir,
    strategy,
    integrationFiles
  });

  ctx.log('Tests complete', {
    passed: testResult.passed,
    failed: testResult.failed,
    total: testResult.total
  });

  const runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
    projectDir,
    harnessName: 'Codex CLI',
    loopModel:
      strategy === 'app-server'
        ? 'App Server notifications and approval events keep babysitter in the orchestration loop'
        : strategy === 'sdk'
          ? 'persistent SDK thread resume keeps babysitter in the orchestration loop'
          : strategy === 'mcp'
            ? 'MCP-assisted continuation with explicit validation of user-yield reentry'
            : 'wrapper-driven orchestration with explicit user-yield and resume behavior',
    research: researchResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult
  });

  // ============================================================================
  // PHASE 5: VERIFY -- Check integration quality
  // ============================================================================

  ctx.log('Phase 5: Verify -- Scoring integration quality');

  let verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
    projectDir,
    harnessName: 'Codex CLI',
    research: researchResult,
    assimilation: assimilationResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult,
    runtimeValidation: runtimeValidationResult,
    targetQuality
  });

  finalQuality = verifyResult.qualityScore;
  iteration = 1;

  ctx.log('Verification complete', { quality: finalQuality, target: targetQuality });

  // ============================================================================
  // PHASE 6: CONVERGE -- Quality loop until target met
  // ============================================================================

  while (finalQuality < targetQuality && iteration < maxIterations) {
    iteration++;

    ctx.log(`Convergence iteration ${iteration}`, {
      currentQuality: finalQuality,
      target: targetQuality,
      remaining: maxIterations - iteration
    });

    await ctx.breakpoint({
      question: `Integration quality: ${finalQuality}/${targetQuality} after iteration ${iteration - 1}. Issues: ${verifyResult.issues?.join(', ') || 'none'}. Continue refinement?`,
      title: `Convergence Iteration ${iteration}`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/convergence/iteration-${iteration - 1}.md`, format: 'markdown', label: `Iteration ${iteration - 1} Report` }
        ]
      }
    });

    // Refine based on feedback
    const refinement = await ctx.task(refineHarnessAssimilationTask, {
      projectDir,
      harnessName: 'Codex CLI',
      integrationFiles,
      issues: verifyResult.issues,
      recommendations: verifyResult.recommendations,
      iteration
    });

    integrationFiles.push(...(refinement.filesCreated || []));

    // Re-test
    const retest = await ctx.task(runIntegrationTestsTask, {
      projectDir,
      strategy,
      integrationFiles
    });

    // Re-verify
    const reruntime = await ctx.task(runHarnessRuntimeValidationTask, {
      projectDir,
      harnessName: 'Codex CLI',
      loopModel:
        strategy === 'app-server'
          ? 'App Server notifications and approval events keep babysitter in the orchestration loop'
          : strategy === 'sdk'
            ? 'persistent SDK thread resume keeps babysitter in the orchestration loop'
            : strategy === 'mcp'
              ? 'MCP-assisted continuation with explicit validation of user-yield reentry'
              : 'wrapper-driven orchestration with explicit user-yield and resume behavior',
      research: researchResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: retest
    });

    verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
      projectDir,
      harnessName: 'Codex CLI',
      research: researchResult,
      assimilation: assimilationResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: retest,
      runtimeValidation: reruntime,
      targetQuality
    });

    finalQuality = verifyResult.qualityScore;

    ctx.log(`Iteration ${iteration} complete`, {
      quality: finalQuality,
      converged: finalQuality >= targetQuality
    });
  }

  // ============================================================================
  // RESULT
  // ============================================================================

  const converged = finalQuality >= targetQuality;

  ctx.log('Codex harness integration complete', {
    success: converged,
    finalQuality,
    iterations: iteration,
    totalFiles: integrationFiles.length
  });

  return {
    success: converged,
    converged,
    integrationFiles: [...new Set(integrationFiles)],
    finalQuality,
    targetQuality,
    iterations: iteration,
    strategy,
    projectDir,
    phases: ['analyze', 'scaffold', 'implement', 'test', 'verify', 'converge'],
    metadata: {
      processId: 'assimilation/harness/codex',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Analyze the target Codex project: detect version, config, App Server / SDK / MCP support, and sandbox mode.
 */
export const analyzeCodexProjectTask = defineTask('analyze-codex-project', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Codex project: ${args.projectDir}`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer specializing in CLI tooling',
      task: 'Analyze the target Codex CLI project to determine integration requirements',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy
      },
      instructions: [
        'Run `codex --version` to detect Codex CLI version',
        'Run `codex --help`, `codex mcp --help`, and `codex app-server --help` when available to confirm supported control planes',
        'Check for existing .codex/config.toml (project-level) and ~/.codex/config.toml (user-level)',
        'Check for existing AGENTS.md files, .agents/skills/ directories, and any repo-scoped Codex skill assets',
        'Verify sandbox mode capabilities: read-only, workspace-write, danger-full-access',
        'Check if MCP server support is available (codex mcp add/list/remove)',
        'Check whether Codex App Server is available and whether its event stream / approvals model can be used as the primary babysitter control plane',
        'Check whether the Codex SDK or thread-oriented integration path is available for persistent thread resume',
        'Check if exec mode is available (codex exec --help)',
        'Determine whether Codex exposes any real host-owned lifecycle events, approval callbacks, streamed notifications, or only post-turn notify',
        'Determine how Codex context identity is passed without a fake session-start hook: App Server thread IDs, SDK thread IDs, MCP structuredContent.threadId, and approval payload thread IDs',
        'Document the preferred context propagation method for each strategy and reject any design that uses a startup hook only to smuggle context into later callbacks',
        'Determine how Codex skills are actually distributed and installed for end users before proposing package layout',
        'Determine whether custom prompts are deprecated in favor of skills and AGENTS guidance, and avoid proposing prompt-only integration',
        'Determine whether Codex subagents can help execute babysitter effects without giving up orchestration ownership',
        'Detect Node.js version (must be >= 18)',
        'Check for existing babysitter SDK installation (babysitter version --json)',
        'List existing config files that may need modification',
        'Report all findings as structured JSON'
      ],
      outputFormat: 'JSON with codexVersion, hasAppServerSupport, hasSdkThreadPath, hasMcpSupport, hasExecMode, supportsRepoSkills, supportsNotify, contextPropagationMethods, sandboxModes, existingConfigFiles, nodeVersion, hasBabysitterSdk, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['codexVersion', 'hasMcpSupport', 'hasExecMode'],
      properties: {
        codexVersion: { type: 'string' },
        hasAppServerSupport: { type: 'boolean' },
        hasSdkThreadPath: { type: 'boolean' },
        hasMcpSupport: { type: 'boolean' },
        hasExecMode: { type: 'boolean' },
        supportsRepoSkills: { type: 'boolean' },
        supportsNotify: { type: 'boolean' },
        contextPropagationMethods: { type: 'array', items: { type: 'string' } },
        sandboxModes: { type: 'array', items: { type: 'string' } },
        existingConfigFiles: { type: 'array', items: { type: 'string' } },
        nodeVersion: { type: 'string' },
        hasBabysitterSdk: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'analysis']
}));

/**
 * (a) Add babysitter SDK as a dependency to the Codex project.
 */
export const addSdkDependencyTask = defineTask('add-sdk-dependency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add babysitter SDK dependency',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Node.js package manager expert',
      task: 'Add @a5c-ai/babysitter-sdk and @a5c-ai/babysitter as dependencies to the Codex project',
      context: { projectDir: args.projectDir },
      instructions: [
        `Navigate to ${args.projectDir}`,
        'Check if package.json exists; create if needed',
        'Run: npm install @a5c-ai/babysitter-sdk @a5c-ai/babysitter --save',
        'Verify installation: babysitter version --json',
        'Confirm the babysitter CLI is accessible from node_modules/.bin/',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with success, filesCreated, filesModified, installedVersion'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesCreated'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        installedVersion: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'dependencies']
}));

/**
 * (b) Create AGENTS.md with babysitter orchestration instructions for Codex.
 */
export const createAgentsMdTask = defineTask('create-agents-md', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create AGENTS.md for babysitter orchestration',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI agent instruction designer',
      task: 'Create AGENTS.md that instructs the Codex agent to follow babysitter orchestration protocol',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        codexVersion: args.analysis?.codexVersion
      },
      instructions: [
          'Create AGENTS.md in the project root directory',
          'Prefer repo-scoped Codex skills under .agents/skills/ over only global skill installation when the repo should be self-contained',
          'Keep AGENTS.md truthful and concise about Codex integration boundaries',
          'Describe the selected control plane in order of preference: App Server, SDK thread integration, MCP assistance, then wrapper fallback',
          'Describe how Codex should cooperate with babysitter and where .a5c state lives',
          'Describe how context identity is propagated without a session-start hack: persist threadId or run mapping from App Server, SDK thread creation, or MCP tool responses',
          'Explain result posting, error reporting, and explicit resume behavior',
          'Do not claim Codex has native SessionStart/Stop hooks or automatic self-reentry after yielding to the user',
          'Do not emulate the Claude session-start hack solely to pass context into a later notify callback',
          'If strategy is "app-server", describe App Server as the authoritative streamed control plane',
          'If strategy is "sdk", describe persistent thread resume and why it is closer to harness-native continuation than repeated codex exec calls',
          'If strategy is "mcp", describe MCP as assistance tooling unless research proves it can safely own the loop',
          'If strategy is "wrapper", explain that the wrapper/supervisor owns continuation and breakpoint collection as a fallback, not the ideal architecture',
          'Include error handling: report failures via task:post with error details',
          'Include quality gate: self-assess work quality before posting results',
          'Keep instructions clear and concise for LLM consumption',
        'Also create .codex/AGENTS.md for project-scoped instructions if needed',
        'Create repo-scoped .agents/skills/babysitter-codex/SKILL.md when the research indicates repo-local skills are the right distribution model',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated, agentsMdPath'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesCreated'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        agentsMdPath: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'agents-md']
}));

/**
 * (c) Configure Codex project config.toml for the selected control plane.
 */
export const configureMcpServerTask = defineTask('configure-mcp-server', (args, taskCtx) => ({
  kind: 'agent',
    title: 'Configure Codex project config.toml for babysitter',

  agent: {
    name: 'general-purpose',
    prompt: {
        role: 'Codex configuration specialist',
        task: 'Configure real Codex config.toml settings for babysitter integration',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        existingConfig: args.analysis?.existingConfigFiles
      },
      instructions: [
          'Create or update .codex/config.toml in the project directory',
          'Use only real Codex config keys discovered during research',
          'Configure sandbox to allow .a5c/ directory writes',
          'Set an approval policy consistent with babysitter CLI usage',
          'Configure notify only for telemetry / wakeups if supported, not as if it were a blocking orchestration hook',
          'Add MCP server configuration only if research proves it is needed for the chosen strategy',
          'If App Server or SDK thread mode is chosen, document the config expectations that route users toward that control plane instead of wrapper-first execution',
          'Do not invent [plugin], [hooks], SessionStart, or Stop sections',
          'If existing config.toml found, merge settings without overwriting user config',
          'Return list of files created or modified'
      ],
      outputFormat: 'JSON with success, filesCreated, filesModified, configPath'
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        configPath: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'mcp-config']
}));

/**
 * (d) Create hook scripts for session initialization and loop control.
 */
export const createHookScriptsTask = defineTask('create-hook-scripts', (args, taskCtx) => ({
  kind: 'agent',
    title: 'Create notify/support scripts and wrapper entry points',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'shell scripting and Node.js automation engineer',
        task: 'Create only the Codex support scripts that are real: notify handlers, validation helpers, and external wrapper entry points',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy
      },
      instructions: [
          'Create .codex/hooks/ directory in the project',
          'Create on-turn-complete.js only as a notify/monitoring handler, not as a blocking orchestration hook',
          'Create iteration-guard.js: checks current iteration count against max, writes warning if approaching limit',
          'If strategy is "app-server", create App Server client bootstrap scripts instead of a codex-exec loop',
          'If strategy is "sdk", create SDK thread bootstrap / resume helpers instead of a codex-exec loop',
          'If strategy is "mcp", create MCP helper scripts and repo-scoped skill assets that keep Codex inside the chosen control plane',
          'If strategy is "wrapper", create loop-control.sh (POSIX) as the fallback wrapper entry point that initializes babysitter, runs codex exec, posts results, checks completion, and enforces guards',
          'Where later callbacks need run or thread identity, persist that mapping explicitly in .a5c or pass it through tool payloads; do not create a startup hook only to smuggle context into notify',
          'Do not invent SessionStart/Stop hook files unless research finds a real supported Codex surface for them',
          'Make shell scripts executable (chmod +x)',
          'Return list of all files created'
      ],
      outputFormat: 'JSON with success, filesCreated, hookScripts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesCreated'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        hookScripts: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'hooks']
}));

/**
 * (e) Implement the selected Codex control plane for orchestration.
 */
export const implementWrapperLoopTask = defineTask('implement-wrapper-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${
    args.strategy === 'app-server'
      ? 'App Server client control plane'
      : args.strategy === 'sdk'
        ? 'SDK thread orchestration'
        : args.strategy === 'mcp'
          ? 'MCP-assisted orchestration'
          : 'external wrapper loop'
  }`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'orchestration systems engineer',
      task: 'Implement the selected Codex orchestration control plane for babysitter',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        codexVersion: args.analysis?.codexVersion,
        hasExecMode: args.analysis?.hasExecMode
      },
        instructions: args.strategy === 'app-server' ? [
          'Create an App Server client entry point that treats Codex App Server as the primary control plane',
          'Use streamed agent events, approvals, and conversation history instead of repeated codex exec subprocesses',
          'Keep babysitter as the orchestration owner that maps run state to thread / conversation state',
          'Persist the App Server thread ID and any approval correlation IDs at thread creation time rather than inventing a startup hook to bridge context',
          'Model breakpoints as approval / elicitation events instead of stdin pauses',
          'Persist run state so the client can resume without losing orchestration continuity',
          'Only keep a codex exec wrapper as a compatibility fallback if App Server is unavailable',
          'Return list of files created'
        ] : args.strategy === 'sdk' ? [
          'Create a persistent Codex SDK thread adapter instead of a codex exec while-loop',
          'Start or resume a single Codex thread per babysitter run',
          'Persist the SDK thread ID in babysitter state at thread creation time and reuse it for later resume',
          'Use SDK thread resume to preserve conversational continuity across iterations',
          'Model user-yield and breakpoint continuation through persisted thread and run state, not stdin pauses',
          'Keep babysitter as the orchestration owner that decides when to iterate and when to suspend',
          'Only keep a codex exec wrapper as a fallback when SDK thread integration is unavailable',
          'Return list of files created'
        ] : args.strategy === 'wrapper' ? [
          'Create .codex/orchestrate.js -- the main Node.js wrapper script',
          'Implement the full orchestration loop:',
          '  1. Parse CLI args (--runs-dir, --max-iterations, --process-id)',
          '  2. Call babysitter session:init --json to get or seed a stable session ID when available',
          '  3. Call babysitter run:create --process-id <id> --harness codex --session-id <id> --state-dir .a5c --json when session binding is possible',
          '  4. Loop:',
          '     a. Call babysitter run:iterate --run-id <id> --json',
          '     b. Parse pending actions from iterate output',
        '     c. For each pending task: build codex exec prompt with task context',
        '     d. Spawn codex exec --full-auto --json with the prompt',
        '     e. Parse codex output and extract results',
        '     f. Call babysitter task:post --run-id <id> --effect-id <eid> with results',
        '     g. Check run:status for completion',
        '     h. Increment iteration counter and check guard',
          '  5. Report final status',
          'Keep breakpoint collection and user-yield continuation in the wrapper/supervisor, not in fictional Codex stop hooks',
          'Handle errors gracefully: catch spawn failures, timeouts, parse errors',
          'Use child_process.execFile for spawning codex and babysitter CLI',
          'Support --json output mode for all CLI calls',
          'Return list of files created'
        ] : [
          'Create .codex/mcp-orchestrate.js only if research proves MCP materially improves the chosen strategy',
          'Implement MCP tools as assistance to the chosen control plane rather than pretending Codex can own the loop by prompt alone',
          'Expose real babysitter primitives such as run:create, run:iterate, run:status, task:list, task:post, and breakpoint or approval helpers',
          'Capture and persist thread identity from MCP structured content or approval payloads instead of inventing a session-start bridge',
          'Include iteration guard logic in babysitter_iterate-style helpers',
          'If the harness supports MCP elicitations or approval flows, use them for breakpoints instead of stdin pauses',
          'Document that MCP mode alone is not enough unless research proves it can preserve orchestration continuity after yielding to the user',
          'Return list of files created'
        ],
      outputFormat: 'JSON with success, filesCreated, entryPoint'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesCreated'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        entryPoint: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'wrapper-loop']
}));

/**
 * (f) Map Codex tool use to babysitter effect execution.
 */
export const mapEffectExecutionTask = defineTask('map-effect-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Codex tool use to effect execution',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'systems integration engineer',
      task: 'Create the mapping layer between Codex tool calls and babysitter effect execution',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy
      },
      instructions: [
        'Create .codex/effect-mapper.js with effect-to-tool mapping logic',
        'Map babysitter effect kinds to Codex tool execution:',
        '  agent effect -> App Server / SDK thread action / codex exec prompt / MCP-assisted agent call depending on strategy',
        '  node effect -> Node.js script execution via shell tool',
        '  shell effect -> shell command execution via Codex shell tool',
        '  breakpoint effect -> approval event, elicitation, interactive prompt, or auto-resolve based on verified harness capability',
        '  sleep effect -> setTimeout or process.nextTick with timestamp check',
        '  complex orchestration effect -> codex exec with an agent-style sub-task prompt rather than a custom orchestrator_task kind',
        'Handle effect serialization: read task.json, extract args, build Codex prompt',
        'Handle result deserialization: parse Codex output, format as task result',
        'Include error mapping: Codex error codes to babysitter error categories',
        'Prefer Codex subagents when they materially help execute effects without giving up orchestration ownership',
        'Support parallel effect batching when multiple effects are pending',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated, mappedEffectKinds'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesCreated'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        mappedEffectKinds: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'effect-mapping']
}));

/**
 * (g) Create result posting mechanism via MCP tool or CLI.
 */
export const createResultPostingTask = defineTask('create-result-posting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create result posting mechanism',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CLI integration engineer',
      task: 'Implement the result posting layer that feeds Codex task outputs back to babysitter',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy
      },
      instructions: [
        'Create .codex/result-poster.js with result posting logic',
        'Implement postTaskResult(runId, effectId, result) function:',
        '  1. Serialize result to JSON',
        '  2. Write the value payload to tasks/<effectId>/output.json',
        '  3. Call babysitter task:post <runDir> <effectId> --status ok --value tasks/<effectId>/output.json --json',
        '  4. Use --error <file> for failure payloads and let the SDK own result.json',
        '  5. Verify posting success by checking CLI exit code',
        '  6. Return posting confirmation',
        'Handle large results: check against BLOB_THRESHOLD_BYTES (1 MiB)',
        '  If result exceeds threshold, rely on task:post and the SDK blob flow instead of manual result.json writes',
        'Handle posting failures: retry up to 3 times with backoff',
        'Include result validation: ensure required fields (success, data) are present',
        'For App Server or SDK strategy: expose result posting through the chosen client control plane',
        'For MCP strategy: expose as babysitter_post_result MCP tool',
        'For wrapper strategy: call as part of wrapper loop iteration',
        'Never write result.json directly',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesCreated'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'result-posting']
}));

/**
 * (h) Add runaway detection via iteration counting.
 */
export const addRunawayDetectionTask = defineTask('add-runaway-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add runaway detection guards',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'reliability engineer',
      task: 'Implement runaway detection and iteration guards for the Codex orchestration loop',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        maxIterations: args.maxIterations,
        wrapperEntryPoint: args.wrapperResult?.entryPoint
      },
      instructions: [
        'Create .codex/iteration-guard.js with runaway detection logic',
        'Implement iteration counting:',
        '  - Read current iteration from .a5c/runs/<runId>/state/iteration-count.json',
        '  - Increment on each iteration',
        '  - Write updated count atomically',
        `  - Hard limit: ${args.maxIterations} iterations (configurable via BABYSITTER_MAX_ITERATIONS)`,
        '  - Soft warning at 80% of limit',
        'Implement time-based guards:',
        '  - Track total elapsed time since run start',
        '  - Warn at BABYSITTER_TIMEOUT threshold',
        '  - Hard stop at 2x timeout',
        'Implement cost estimation guard:',
        '  - Track approximate token usage per iteration',
        '  - Warn if projected total exceeds threshold',
        'Implement stall detection:',
        '  - Track quality score progression across iterations',
        '  - Detect if quality is not improving (plateau detection)',
        '  - Abort if no improvement for 3 consecutive iterations',
        'Integrate guards into the chosen control plane: App Server client, SDK thread adapter, MCP helper flow, or wrapper fallback',
        'Add guard check to AGENTS.md instructions for model self-enforcement',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated, guardTypes'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesCreated'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        guardTypes: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'runaway-detection']
}));

/**
 * Run integration tests against the scaffolded Codex harness.
 */
export const runIntegrationTestsTask = defineTask('run-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Codex harness integration tests',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer specializing in CLI integration testing',
      task: 'Test the babysitter-Codex integration by validating all scaffolded components',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        integrationFiles: args.integrationFiles
      },
      instructions: [
        'Verify all integration files exist and are syntactically valid',
        'Validate that the process includes research-first decisions about Codex distribution, runtime install, and continuation control plane selection',
        'Validate that the generated integration is framed as a Codex skill bundle / integration layer rather than a fictional native Codex plugin manifest',
        'Validate that the process-library plan prefers upstream clone or sync of the canonical babysit library and accurately describes the runtime lifecycle and fallback behavior used by the Codex integration',
        'Validate that AGENTS.md and related assets adapt the original Claude Code babysit skill semantics instead of inventing a weaker local workflow',
        'Test 1: Validate AGENTS.md contains truthful orchestration instructions and no fake Codex hook claims',
        'Test 2: Validate config.toml uses real Codex keys and correct sandbox/notify settings',
        'Test 3: Validate repo-scoped skills, notify helpers, and selected control-plane scripts are executable and syntactically valid',
        'Test 4: Exercise the selected control plane: App Server client, SDK thread adapter, MCP flow, or wrapper fallback, then identify what must be exercised in the real harness runtime',
        'Test 5: Verify babysitter CLI commands work: session:init, run:create (prefer harness-native binding), task:post protocol, and any available active process-library binding or inspection surface for the canonical process library',
        'Test 6: Verify effect-mapper handles all required effect kinds',
        'Test 7: Verify result-poster writes output.json and never instructs direct result.json writes',
        'Test 8: Verify iteration guard correctly counts and enforces limits',
        'Test 9: Verify run or thread identity is captured through the real Codex surface for the chosen strategy and not via a fake startup hook bridge',
        'Test 10: Validate sandbox configuration allows .a5c/ writes, the chosen control plane keeps Codex inside the orchestration loop after yielding to the user, and the integration does not silently depend on a bundled process-library snapshot as primary distribution',
        'Test 11: Fail if user-facing README or install docs still tell end users to use raw Babysitter SDK or CLI primitives instead of the Codex command surface',
        'Report pass/fail for each test with details on failures'
      ],
      outputFormat: 'JSON with passed (number), failed (number), total (number), testResults (array of {name, passed, details})'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'failed', 'total'],
      properties: {
        passed: { type: 'number' },
        failed: { type: 'number' },
        total: { type: 'number' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              details: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'testing']
}));

/**
 * Verify integration quality and score.
 */
export const verifyIntegrationTask = defineTask('verify-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify integration quality (target: ${args.targetQuality})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'integration quality assessor',
      task: 'Score the babysitter-Codex integration quality on a 0-100 scale, including research, skill adaptation, runtime installability, and yield-loop validation',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        integrationFiles: args.integrationFiles,
        testResults: args.testResult,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Assess research and upstream distribution fidelity (0-20 points):',
        '  - Real Codex distribution and extension model researched first',
        '  - Runtime install or sync path from the canonical babysitter repo documented',
        '  - SDK/CLI process-library clone, sync, active-binding, active-root inspection, and path-return gaps documented honestly',
        'Assess correctness (0-20 points):',
        '  - CLI commands correctly formed',
        '  - AGENTS.md and config assets preserve canonical babysit semantics',
        '  - output.json + task:post protocol used correctly',
        'Assess runtime robustness (0-30 points):',
        '  - Real harness run validated, not only dry-run',
        '  - Yield back to the user stays inside the orchestration loop',
        '  - App Server or SDK thread control plane preferred over wrapper fallback when actually available',
        '  - Canonical process library is cloned or synced from upstream when supported, with any snapshot fallback clearly demoted',
        '  - Retry logic and guards are properly configured',
        'Assess usability and operator readiness (0-30 points):',
        '  - Clear install, upgrade, rollback, and troubleshooting docs exist',
        '  - Helpful error messages and actionable operator guidance',
        '  - Easy to configure and customize without drifting from the canonical contract',
        'Identify specific issues that reduce the score',
        'Provide actionable feedback for improvement'
      ],
      outputFormat: 'JSON with score (0-100), breakdown ({completeness, correctness, robustness, usability}), issues (array), feedback (string), recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['score'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            correctness: { type: 'number' },
            robustness: { type: 'number' },
            usability: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'verification', 'scoring']
}));

/**
 * Refine integration based on quality feedback.
 */
export const refineIntegrationTask = defineTask('refine-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine integration (iteration ${args.iteration})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Refine the babysitter-Codex integration based on quality feedback and eliminate stale contract drift',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        integrationFiles: args.integrationFiles,
        feedback: args.feedback,
        issues: args.issues,
        iteration: args.iteration
      },
      instructions: [
        'Review all identified issues from verification',
        'Prioritize research, install-doc, skill-adaptation, and user-yield loop issues before cosmetic cleanup',
        'For each issue, determine the fix:',
        '  - Missing components: create them',
        '  - Syntax errors: fix the offending files',
        '  - Missing error handling: add try/catch and retries',
        '  - Missing documentation: add comments and docs',
        '  - Configuration issues: update config.toml or AGENTS.md',
        '  - Stale contract language: replace direct result.json writes, session-associate-first guidance, or non-agent public effect kinds',
        'Apply all fixes to the integration files',
        'Verify fixes do not introduce regressions',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with success, filesCreated, filesModified, fixesApplied'
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        fixesApplied: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'codex', 'refinement', `iteration-${args.iteration}`]
}));
