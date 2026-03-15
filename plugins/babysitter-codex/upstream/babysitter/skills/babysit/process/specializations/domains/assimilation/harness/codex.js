/**
 * @process assimilation/harness/codex
 * @description Orchestrate babysitter SDK integration into OpenAI Codex CLI. Sets up AGENTS.md instructions, MCP config, hook scripts, and wrapper loop for orchestration.
 * @inputs { projectDir: string, targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, integrationFiles: string[], finalQuality: number, iterations: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Codex CLI Harness Integration Process
 *
 * Integrates babysitter SDK orchestration into OpenAI Codex CLI using a
 * phased approach: Analyze -> Scaffold -> Implement -> Test -> Verify -> Converge.
 *
 * Supports two strategies:
 *   - Strategy A: External wrapper loop around `codex exec` (production/CI)
 *   - Strategy B: AGENTS.md + MCP server for in-session orchestration (interactive)
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Target Codex project directory
 * @param {number} inputs.targetQuality - Quality threshold to converge (0-100)
 * @param {number} inputs.maxIterations - Maximum convergence iterations
 * @param {string} inputs.strategy - Integration strategy: 'wrapper' (A) or 'mcp' (B), default 'wrapper'
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Integration result
 */
export async function process(inputs, ctx) {
  const {
    projectDir,
    targetQuality = 80,
    maxIterations = 6,
    strategy = 'wrapper'
  } = inputs;

  const integrationFiles = [];
  let finalQuality = 0;
  let iteration = 0;

  ctx.log('Starting Codex CLI harness integration', { projectDir, strategy, targetQuality });

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
    // (c) Configure MCP server in config.toml for babysitter CLI tools
    async () => {
      const result = await ctx.task(configureMcpServerTask, { projectDir, strategy, analysis });
      integrationFiles.push(...(result.filesCreated || []), ...(result.filesModified || []));
      return result;
    },
    // (d) Create hook scripts for session init and loop control
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

  // ============================================================================
  // PHASE 3: IMPLEMENT -- Build wrapper loop, effect mapping, result posting
  // ============================================================================

  ctx.log('Phase 3: Implement -- Building orchestration components');

  // Steps e, f, g can run in parallel (independent implementations)
  const [wrapperResult, effectMapResult, resultPostResult] = await ctx.parallel.all([
    // (e) Implement wrapper loop or MCP-driven polling
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

  // ============================================================================
  // PHASE 5: VERIFY -- Check integration quality
  // ============================================================================

  ctx.log('Phase 5: Verify -- Scoring integration quality');

  const verifyResult = await ctx.task(verifyIntegrationTask, {
    projectDir,
    strategy,
    integrationFiles,
    testResult,
    targetQuality
  });

  finalQuality = verifyResult.score;
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
    const refinement = await ctx.task(refineIntegrationTask, {
      projectDir,
      strategy,
      integrationFiles,
      feedback: verifyResult.feedback,
      issues: verifyResult.issues,
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
    const reverify = await ctx.task(verifyIntegrationTask, {
      projectDir,
      strategy,
      integrationFiles,
      testResult: retest,
      targetQuality
    });

    finalQuality = reverify.score;

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
 * Analyze the target Codex project: detect version, config, MCP support, sandbox mode.
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
        'Run `codex --help` and `codex mcp --help` to confirm available subcommands',
        'Check for existing .codex/config.toml (project-level) and ~/.codex/config.toml (user-level)',
        'Check for existing AGENTS.md files in project root and .codex/ directory',
        'Verify sandbox mode capabilities: read-only, workspace-write, danger-full-access',
        'Check if MCP server support is available (codex mcp add/list/remove)',
        'Check if exec mode is available (codex exec --help)',
        'Detect Node.js version (must be >= 18)',
        'Check for existing babysitter SDK installation (babysitter version --json)',
        'List existing config files that may need modification',
        'Report all findings as structured JSON'
      ],
      outputFormat: 'JSON with codexVersion, hasMcpSupport, hasExecMode, sandboxModes, existingConfigFiles, nodeVersion, hasBabysitterSdk, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['codexVersion', 'hasMcpSupport', 'hasExecMode'],
      properties: {
        codexVersion: { type: 'string' },
        hasMcpSupport: { type: 'boolean' },
        hasExecMode: { type: 'boolean' },
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
        'Include babysitter orchestration protocol instructions:',
        '  - On session start: call babysitter session:init to initialize',
        '  - On each turn: call babysitter session:check-iteration to get pending tasks',
        '  - Execute pending task effects using available tools (shell, file, MCP)',
        '  - After completing each task: call babysitter task:post to report results',
        '  - Continue iteration loop until no pending tasks remain or run completes',
        '  - Respect iteration guards: check iteration count before continuing',
        'Include MCP tool usage instructions if strategy is "mcp"',
        'Include wrapper loop coordination instructions if strategy is "wrapper"',
        'Include error handling: report failures via task:post with error details',
        'Include quality gate: self-assess work quality before posting results',
        'Keep instructions clear and concise for LLM consumption',
        'Also create .codex/AGENTS.md for project-scoped instructions if needed',
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
 * (c) Configure MCP server in config.toml for babysitter CLI tools.
 */
export const configureMcpServerTask = defineTask('configure-mcp-server', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure babysitter MCP server in config.toml',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MCP server configuration specialist',
      task: 'Configure babysitter CLI as an MCP server in Codex config.toml',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        existingConfig: args.analysis?.existingConfigFiles
      },
      instructions: [
        'Create or update .codex/config.toml in the project directory',
        'Add [mcp_servers.babysitter] section with STDIO transport:',
        '  command = "npx"',
        '  args = ["babysitter", "mcp-server"]',
        '  env = { BABYSITTER_RUNS_DIR = ".a5c/runs" }',
        'Configure sandbox to allow .a5c/ directory writes:',
        '  sandbox = "workspace-write"',
        '  writable_roots = [".a5c/"]',
        'Set approval policy to allow babysitter CLI calls without prompting',
        'Configure notify hook for agent-turn-complete monitoring:',
        '  [notify]',
        '  command = ["node", ".codex/hooks/on-turn-complete.js"]',
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
  title: 'Create hook scripts for session init and loop control',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'shell scripting and Node.js automation engineer',
      task: 'Create hook scripts that bridge Codex lifecycle events to babysitter orchestration',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy
      },
      instructions: [
        'Create .codex/hooks/ directory in the project',
        'Create session-init.js: calls `babysitter session:init` on first run, stores session ID',
        'Create on-turn-complete.js: notify hook handler that logs turn completion and checks iteration state',
        'Create iteration-guard.js: checks current iteration count against max, writes warning if approaching limit',
        'Create loop-control.sh (POSIX): wrapper script entry point for Strategy A that:',
        '  1. Initializes babysitter session',
        '  2. Creates a run with babysitter run:create',
        '  3. Loops: calls codex exec --full-auto with iteration context',
        '  4. Parses output and posts results via babysitter task:post',
        '  5. Checks babysitter run:status for completion',
        '  6. Enforces max iteration guard',
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
 * (e) Implement wrapper loop or MCP-driven polling for orchestration.
 */
export const implementWrapperLoopTask = defineTask('implement-wrapper-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.strategy === 'mcp' ? 'MCP-driven polling' : 'external wrapper loop'}`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'orchestration systems engineer',
      task: `Implement the ${args.strategy === 'mcp' ? 'MCP-driven polling mechanism' : 'external wrapper loop'} for babysitter orchestration with Codex`,
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        codexVersion: args.analysis?.codexVersion,
        hasExecMode: args.analysis?.hasExecMode
      },
      instructions: args.strategy === 'wrapper' ? [
        'Create .codex/orchestrate.js -- the main Node.js wrapper script',
        'Implement the full orchestration loop:',
        '  1. Parse CLI args (--runs-dir, --max-iterations, --process-id)',
        '  2. Call babysitter session:init --json to get session ID',
        '  3. Call babysitter run:create --process-id <id> --json to start a run',
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
        'Handle errors gracefully: catch spawn failures, timeouts, parse errors',
        'Use child_process.execFile for spawning codex and babysitter CLI',
        'Support --json output mode for all CLI calls',
        'Return list of files created'
      ] : [
        'Create .codex/mcp-orchestrate.js -- MCP server extension for polling',
        'Implement MCP tools that the Codex agent can call:',
        '  babysitter_init: Initialize session and create run',
        '  babysitter_iterate: Get next pending tasks',
        '  babysitter_post_result: Post task completion result',
        '  babysitter_check_status: Check run status and iteration count',
        'Each tool wraps the corresponding babysitter CLI command',
        'Include iteration guard logic in babysitter_iterate',
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
        '  agent effect -> codex exec with task prompt (strategy A) or direct agent call (strategy B)',
        '  node effect -> Node.js script execution via shell tool',
        '  shell effect -> shell command execution via Codex shell tool',
        '  breakpoint effect -> interactive prompt or auto-resolve based on mode',
        '  sleep effect -> setTimeout or process.nextTick with timestamp check',
        '  orchestrator_task effect -> codex exec with sub-task prompt',
        'Handle effect serialization: read task.json, extract args, build Codex prompt',
        'Handle result deserialization: parse Codex output, format as task result',
        'Include error mapping: Codex error codes to babysitter error categories',
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
        '  2. Write result to tasks/<effectId>/result.json',
        '  3. Call babysitter task:post --run-id <runId> --effect-id <effectId> --json',
        '  4. Verify posting success by checking CLI exit code',
        '  5. Return posting confirmation',
        'Handle large results: check against BLOB_THRESHOLD_BYTES (1 MiB)',
        '  If result exceeds threshold, write to blobs/ and reference in result.json',
        'Handle posting failures: retry up to 3 times with backoff',
        'Include result validation: ensure required fields (success, data) are present',
        'For MCP strategy: expose as babysitter_post_result MCP tool',
        'For wrapper strategy: call as part of wrapper loop iteration',
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
        'Integrate guards into wrapper loop / MCP polling',
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
        'Test 1: Validate AGENTS.md contains required orchestration instructions',
        'Test 2: Validate config.toml has correct MCP server configuration',
        'Test 3: Validate hook scripts are executable and have correct shebang lines',
        'Test 4: Dry-run the wrapper script with --dry-run flag if supported',
        'Test 5: Verify babysitter CLI commands work: session:init, run:create (dry-run)',
        'Test 6: Verify effect-mapper handles all required effect kinds',
        'Test 7: Verify result-poster can serialize and write result JSON',
        'Test 8: Verify iteration guard correctly counts and enforces limits',
        'Test 9: Check for common issues: missing imports, unresolved paths, permission errors',
        'Test 10: Validate sandbox configuration allows .a5c/ writes',
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
      task: 'Score the babysitter-Codex integration quality on a 0-100 scale',
      context: {
        projectDir: args.projectDir,
        strategy: args.strategy,
        integrationFiles: args.integrationFiles,
        testResults: args.testResult,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Assess integration completeness (0-25 points):',
        '  - All 8 implementation steps (a-h) completed',
        '  - All required files created',
        '  - No missing components',
        'Assess correctness (0-25 points):',
        '  - All tests passing',
        '  - No syntax errors in generated files',
        '  - CLI commands correctly formed',
        '  - Config.toml valid TOML syntax',
        'Assess robustness (0-25 points):',
        '  - Error handling present in all scripts',
        '  - Retry logic for transient failures',
        '  - Runaway detection properly configured',
        '  - Atomic writes for state files',
        'Assess usability (0-25 points):',
        '  - Clear AGENTS.md instructions',
        '  - Helpful error messages',
        '  - Documentation in generated files',
        '  - Easy to configure and customize',
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
      task: 'Refine the babysitter-Codex integration based on quality feedback',
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
        'For each issue, determine the fix:',
        '  - Missing components: create them',
        '  - Syntax errors: fix the offending files',
        '  - Missing error handling: add try/catch and retries',
        '  - Missing documentation: add comments and docs',
        '  - Configuration issues: update config.toml or AGENTS.md',
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
