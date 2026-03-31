/**
 * @process assimilation/harness/gemini-cli
 * @description Orchestrate babysitter SDK integration into Gemini CLI using the real Gemini extension and hook surfaces first: extension manifest, SessionStart and AfterAgent hooks, BeforeTool guards, MCP tools, and runtime install or sync from the canonical babysitter repo.
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

// ============================================================================
// PROCESS ENTRY POINT
// ============================================================================

/**
 * Gemini CLI Harness Integration Process
 *
 * Phases: Analyze -> Scaffold -> Implement -> Test -> Verify -> Converge
 *
 * Integrates the babysitter SDK into Gemini CLI by creating the extension
 * manifest, using SessionStart for initialization only, using AfterAgent as
 * the primary continuation owner, wiring BeforeTool guards, exposing an MCP
 * server for CLI tool access, and preserving the canonical babysit contract.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Absolute path to the target project
 * @param {number} inputs.targetQuality - Minimum quality score to pass (0-100)
 * @param {number} inputs.maxIterations - Maximum convergence iterations
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Integration result
 */
export async function process(inputs, ctx) {
  const {
    projectDir,
    targetQuality = 80,
    maxIterations = 10
  } = inputs;

  const integrationFiles = [];
  let currentQuality = 0;
  let iterations = 0;

  const researchResult = await ctx.task(runHarnessResearchTask, {
    projectDir,
    harnessName: 'Gemini CLI',
    upstreamSource: 'official Gemini CLI extension and hook model plus the canonical babysitter plugin repo',
    distributionTarget: 'Gemini extension manifest, settings, hooks, commands, and runtime install path',
    loopModel: 'Gemini hook chain where SessionStart initializes state, AfterAgent owns continuation, BeforeTool enforces guards, and hook payload or environment session identity is used directly instead of a synthetic bridge'
  });

  integrationFiles.push(...(researchResult.artifactsCreated || []));

  // ==========================================================================
  // PHASE 1: ANALYZE
  // ==========================================================================

  ctx.log('phase:analyze', 'Analyzing project structure and Gemini CLI environment');

  let analysisResult = await ctx.task(analyzeEnvironmentTask, {
    projectDir
  });

  ctx.log('phase:analyze:complete', `Environment analysis complete. Gemini CLI detected: ${analysisResult.geminiCliDetected}`);

    let lastFeedback_phase1Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase1Review) {
      analysisResult = await ctx.task(analyzeEnvironmentTask, { ...{
    projectDir
  }, feedback: lastFeedback_phase1Review, attempt: attempt + 1 });
    }
  const phase1Review = await ctx.breakpoint({
    question: 'Environment analysis complete. Review the analysis and confirm to proceed with scaffolding.',
    title: 'Gemini CLI Integration: Analysis Review',
    context: {
      runId: ctx.runId,
      analysis: analysisResult
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase1Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase1Review.approved) break;
    lastFeedback_phase1Review = phase1Review.response || phase1Review.feedback || 'Changes requested';
  }
  // ==========================================================================
  // PHASE 2: SCAFFOLD
  // ==========================================================================

  ctx.log('phase:scaffold', 'Creating extension directory structure and manifest');

  // Scaffold independent artifacts in parallel
  const [manifestResult, directoryResult] = await ctx.parallel.all([
    async () => ctx.task(createExtensionManifestTask, {
      projectDir,
      analysis: analysisResult
    }),
    async () => ctx.task(scaffoldDirectoryStructureTask, {
      projectDir
    })
  ]);

  integrationFiles.push(...manifestResult.filesCreated);
  integrationFiles.push(...directoryResult.filesCreated);

  const assimilationResult = await ctx.task(adaptOriginalBabysitTask, {
    projectDir,
    harnessName: 'Gemini CLI',
    upstreamSource: 'the canonical babysitter plugin repo and its babysit process library',
    research: researchResult
  });

  integrationFiles.push(...(assimilationResult.filesCreated || []), ...(assimilationResult.filesModified || []));

  ctx.log('phase:scaffold:complete', `Scaffolded ${integrationFiles.length} files`);

  // ==========================================================================
  // PHASE 3: IMPLEMENT
  // ==========================================================================

  ctx.log('phase:implement', 'Implementing Gemini hook chain, MCP server, and sub-agent configs');

  // Implement all independent hook scripts in parallel
  const [
    sessionStartResult,
    afterAgentResult,
    sessionEndResult,
    mcpServerResult,
    beforeToolResult,
    subAgentResult
  ] = await ctx.parallel.all([
    // (a/b) SessionStart hook: SDK init and session binding
    async () => ctx.task(implementSessionStartHookTask, {
      projectDir,
      analysis: analysisResult
    }),
    // (c) AfterAgent hook: orchestration loop driver with exit code 2 blocking
    async () => ctx.task(implementAfterAgentHookTask, {
      projectDir,
      analysis: analysisResult
    }),
    // (h) SessionEnd hook: cleanup
    async () => ctx.task(implementSessionEndHookTask, {
      projectDir
    }),
    // (d) MCP server for babysitter CLI tools
    async () => ctx.task(configureMcpServerTask, {
      projectDir,
      analysis: analysisResult
    }),
    // (e/f) BeforeTool hook: iteration guards and tool-to-effect mapping
    async () => ctx.task(implementBeforeToolHookTask, {
      projectDir
    }),
    // (g) Sub-agent config for parallel effect execution
    async () => ctx.task(createSubAgentConfigTask, {
      projectDir,
      analysis: analysisResult
    })
  ]);

  integrationFiles.push(
    ...sessionStartResult.filesCreated,
    ...afterAgentResult.filesCreated,
    ...sessionEndResult.filesCreated,
    ...mcpServerResult.filesCreated,
    ...beforeToolResult.filesCreated,
    ...subAgentResult.filesCreated
  );

  // Create Gemini CLI settings.json with hook registrations
  const settingsResult = await ctx.task(createGeminiSettingsTask, {
    projectDir,
    hooks: {
      sessionStart: sessionStartResult,
      afterAgent: afterAgentResult,
      sessionEnd: sessionEndResult,
      beforeTool: beforeToolResult
    },
    mcpServer: mcpServerResult
  });

  integrationFiles.push(...settingsResult.filesCreated);

  const docsResult = await ctx.task(writeHarnessInstallDocsTask, {
    projectDir,
    harnessName: 'Gemini CLI',
    research: researchResult,
    assimilation: assimilationResult
  });

  integrationFiles.push(...(docsResult.filesCreated || []), ...(docsResult.filesModified || []));

  ctx.log('phase:implement:complete', `Implemented ${integrationFiles.length} total files`);

  // ==========================================================================
  // PHASE 4: TEST
  // ==========================================================================

  ctx.log('phase:test', 'Running integration tests');

  const testResult = await ctx.task(runIntegrationTestsTask, {
    projectDir,
    integrationFiles
  });

  ctx.log('phase:test:complete', `Tests passed: ${testResult.passed}/${testResult.total}`);

  let runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
    projectDir,
    harnessName: 'Gemini CLI',
    loopModel: 'Gemini hook chain where SessionStart initializes state, AfterAgent owns continuation, BeforeTool enforces guards, and hook payload or environment session identity is used directly instead of a synthetic bridge',
    research: researchResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult
  });

  // Gate: review test results
    let lastFeedback_reviewApproval = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_reviewApproval) {
        runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, { ...{
    projectDir,
    harnessName: 'Gemini CLI',
    loopModel: 'Gemini hook chain where SessionStart initializes state, AfterAgent owns continuation, BeforeTool enforces guards, and hook payload or environment session identity is used directly instead of a synthetic bridge',
    research: researchResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult
  }, feedback: lastFeedback_reviewApproval, attempt: attempt + 1 });
      }
  const reviewApproval = await ctx.breakpoint({
      question: `${testResult.total - testResult.passed} test(s) failed. Review failures and decide whether to fix or proceed.`,
      title: 'Gemini CLI Integration: Test Failures',
      context: {
        runId: ctx.runId,
        testResult
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_reviewApproval || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (reviewApproval.approved) break;
      lastFeedback_reviewApproval = reviewApproval.response || reviewApproval.feedback || 'Changes requested';
    }
  }
  // ==========================================================================
  // PHASE 5: VERIFY
  // ==========================================================================

  ctx.log('phase:verify', 'Verifying integration quality');

  let verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
    projectDir,
    harnessName: 'Gemini CLI',
    research: researchResult,
    assimilation: assimilationResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult,
    runtimeValidation: runtimeValidationResult,
    targetQuality
  });

  currentQuality = verifyResult.qualityScore;
  iterations = 1;

  ctx.log('phase:verify:complete', `Quality score: ${currentQuality}/${targetQuality}`);

  // ==========================================================================
  // PHASE 6: CONVERGE
  // ==========================================================================

  while (currentQuality < targetQuality && iterations < maxIterations) {
    ctx.log('phase:converge', `Iteration ${iterations + 1}: quality=${currentQuality}, target=${targetQuality}`);

    // Fix issues identified by verification
    const fixResult = await ctx.task(refineHarnessAssimilationTask, {
      projectDir,
      harnessName: 'Gemini CLI',
      issues: verifyResult.issues,
      recommendations: verifyResult.recommendations,
      integrationFiles,
      iteration: iterations + 1
    });

    integrationFiles.push(...(fixResult.newFiles || []), ...(fixResult.filesCreated || []), ...(fixResult.filesModified || []));

    runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
      projectDir,
      harnessName: 'Gemini CLI',
      loopModel: 'Gemini hook chain where SessionStart initializes state, AfterAgent owns continuation, BeforeTool enforces guards, and hook payload or environment session identity is used directly instead of a synthetic bridge',
      research: researchResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: testResult
    });

    // Re-verify
    let reconvergeResult = await ctx.task(verifyHarnessAssimilationTask, {
      projectDir,
      harnessName: 'Gemini CLI',
      research: researchResult,
      assimilation: assimilationResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: testResult,
      runtimeValidation: runtimeValidationResult,
      targetQuality
    });

    verifyResult = reconvergeResult;
    currentQuality = reconvergeResult.qualityScore;
    iterations++;

    ctx.log('phase:converge:iteration', `Iteration ${iterations} complete: quality=${currentQuality}`);

        let lastFeedback_iterationApproval = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (lastFeedback_iterationApproval) {
          reconvergeResult = await ctx.task(verifyHarnessAssimilationTask, { ...{
      projectDir,
      harnessName: 'Gemini CLI',
      research: researchResult,
      assimilation: assimilationResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: testResult,
      runtimeValidation: runtimeValidationResult,
      targetQuality
    }, feedback: lastFeedback_iterationApproval, attempt: attempt + 1 });
        }
  const iterationApproval = await ctx.breakpoint({
        question: `Quality target not met after ${iterations} iterations (${currentQuality}/${targetQuality}). Continue iterating or accept current state?`,
        title: 'Gemini CLI Integration: Convergence Stalled',
        context: {
          runId: ctx.runId,
          currentQuality,
          targetQuality,
          iterations,
          remainingIssues: reconvergeResult.issues
        },
        expert: 'owner',
        tags: ['approval-gate'],
        previousFeedback: lastFeedback_iterationApproval || undefined,
        attempt: attempt > 0 ? attempt + 1 : undefined
        });
        if (iterationApproval.approved) break;
        lastFeedback_iterationApproval = iterationApproval.response || iterationApproval.feedback || 'Changes requested';
      }   }
  }

  ctx.log('process:complete', `Integration complete. Quality: ${currentQuality}, Files: ${integrationFiles.length}, Iterations: ${iterations}`);

  return {
    success: currentQuality >= targetQuality,
    integrationFiles,
    finalQuality: currentQuality,
    iterations,
    metadata: {
      processId: 'assimilation/harness/gemini-cli',
      projectDir,
      targetQuality,
      maxIterations,
      timestamp: ctx.now()
    }
  };
}
  // ============================================================================
// TASK DEFINITIONS
// ============================================================================

// --- Phase 1: Analyze ---

export const analyzeEnvironmentTask = defineTask('analyze-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze project environment for Gemini CLI integration',
  description: 'Inspect project structure, detect existing Gemini CLI config, check SDK availability',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer specializing in AI agent toolchains',
      task: 'Analyze the target project environment for Gemini CLI babysitter SDK integration',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        `Inspect ${args.projectDir} for existing .gemini/ directory and settings.json`,
        'Check if Gemini CLI is installed (command -v gemini)',
        'Check if babysitter SDK is installed (command -v babysitter)',
        'Detect existing extensions in ~/.gemini/extensions/',
        'Check for existing GEMINI.md context file',
        'Identify any conflicting hook registrations',
        'Check Node.js version compatibility (>= 18)',
        'Detect package manager (npm, pnpm, yarn)',
        'Return structured analysis with recommendations'
      ],
      outputFormat: 'JSON with geminiCliDetected (boolean), sdkInstalled (boolean), existingExtensions (array), conflicts (array), nodeVersion (string), packageManager (string), recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['geminiCliDetected', 'sdkInstalled'],
      properties: {
        geminiCliDetected: { type: 'boolean' },
        sdkInstalled: { type: 'boolean' },
        existingExtensions: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'string' } },
        nodeVersion: { type: 'string' },
        packageManager: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'analyze']
}));

// --- Phase 2: Scaffold ---

export const createExtensionManifestTask = defineTask('create-extension-manifest', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create gemini-extension.json manifest',
  description: 'Generate the extension manifest with babysitter hooks, MCP server, and command definitions',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Create the gemini-extension.json manifest for the babysitter extension',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create gemini-extension.json in the extension directory',
        'Include name, version, description, sdkVersion, contextFileName fields',
        'Set contextFileName to "GEMINI.md"',
        'The manifest registers the extension with Gemini CLI',
        'Use the current babysitter SDK version from package.json',
        'Write the file to ~/.gemini/extensions/babysitter/gemini-extension.json',
        'Return the list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), manifest (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'manifest'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        manifest: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'scaffold', 'manifest']
}));

export const scaffoldDirectoryStructureTask = defineTask('scaffold-directory-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold extension directory structure',
  description: 'Create hooks/, commands/, mcp-server/, state/ directories and GEMINI.md context file',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Create the extension directory structure for Gemini CLI babysitter integration',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        'Create directory structure under ~/.gemini/extensions/babysitter/:',
        '  hooks/          - Lifecycle hook scripts',
        '  commands/        - Custom slash commands (e.g., /babysit)',
        '  mcp-server/     - MCP server for babysitter CLI tools',
        '  state/           - Session state files (runtime)',
        'Create GEMINI.md context file with babysitter workflow instructions',
        'Create commands/babysit.toml for the /babysit custom command',
        'GEMINI.md must instruct the agent on: run:iterate, task:list, task:post, completion proof',
        'Return list of created files and directories'
      ],
      outputFormat: 'JSON with filesCreated (array), directoriesCreated (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'directoriesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        directoriesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'scaffold', 'directory']
}));

// --- Phase 3: Implement ---

export const implementSessionStartHookTask = defineTask('implement-session-start-hook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SessionStart hook for runtime init and direct session capture',
  description: 'Create session-start.sh: install or sync the runtime assets if needed, capture Gemini session identity, and initialize baseline state without owning continuation',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior shell scripting and integration engineer',
      task: 'Implement the SessionStart lifecycle hook for Gemini CLI babysitter integration',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create hooks/session-start.sh in the extension directory',
        'The script must follow the Gemini CLI hook protocol: read JSON from stdin, write JSON to stdout, use stderr for debug',
        'On entry: ensure babysitter CLI or the repo-synced process library is available using the research-backed install order (extension-local runtime first, documented package-manager fallback second, ad-hoc global install last)',
        'Read the Gemini session identity from the hook stdin payload first and only fall back to documented environment variables if the payload omits it',
        'Call: babysitter session:init --session-id $SESSION_ID --state-dir $STATE_DIR --json',
        'Persist any run-to-session or session-to-hook metadata needed by later hooks explicitly in state; do not use SessionStart as a fake bridge just to smuggle identity into AfterAgent later',
        'This creates a session state file with YAML frontmatter or equivalent structured state (active, iteration, max_iterations, run_id, started_at)',
        'SessionStart is initialization only; it must not try to continue the orchestration loop or emulate a stop hook',
        'Output empty JSON {} on stdout and exit 0 on success',
        'Handle errors gracefully: output {} and exit 0 (non-fatal)',
        'Make the script executable (chmod +x)',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), hookType (string), scriptPath (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        hookType: { type: 'string' },
        scriptPath: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'implement', 'session-start']
}));

export const implementAfterAgentHookTask = defineTask('implement-after-agent-hook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement AfterAgent hook as the primary orchestration loop driver',
  description: 'Create after-agent.sh: evaluate run state after each turn, deny only when more babysitter work remains, and approve completion or fail-safe exit',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer with deep knowledge of orchestration loops',
      task: 'Implement the AfterAgent hook that drives the babysitter orchestration loop in Gemini CLI',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create hooks/after-agent.sh in the extension directory',
        'This is the CORE orchestration loop driver and the primary continuation owner; it fires after every agent turn',
        'Follow Gemini CLI hook protocol: read JSON stdin, write JSON stdout, exit codes',
        'Read the agent turn output and session identity from the hook stdin JSON payload',
        'Check if session has an active babysitter run using the direct hook identity first and persisted state second',
        'If no active run: output {} and exit 0 (allow session to end normally)',
        'If active run: call babysitter session:check-iteration --session-id $SESSION_ID --state-dir $STATE_DIR --json',
        'Do not create or depend on an external orchestrator process when AfterAgent plus persisted state is sufficient to keep the loop alive',
        'Check for completion proof: scan agent output for <promise>PROOF</promise> pattern',
        'Validate the proof: sha256("{runId}:babysitter-completion-secret-v1")',
        'Decision mapping:',
        '  - Run incomplete, no proof: output {"decision":"deny","systemMessage":"..."} exit 0 (BLOCK - continue loop)',
        '  - Valid proof found: output {} exit 0 (APPROVE - allow exit)',
        '  - Max iterations exceeded: output {} exit 0 (APPROVE - fail-safe exit)',
        '  - Error during check: output {} exit 0 (APPROVE - fail-safe)',
        'The systemMessage in deny response must include: iteration count, pending effects summary, next step instructions',
        'Use Gemini deny semantics rather than inventing a non-Gemini block contract; reserve non-zero exit handling for actual hook failure cases only',
        'Exit code 2 blocks the agent turn entirely (use for critical errors only)',
        'Make the script executable',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), hookType (string), scriptPath (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        hookType: { type: 'string' },
        scriptPath: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'implement', 'after-agent']
}));

export const implementSessionEndHookTask = defineTask('implement-session-end-hook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SessionEnd hook for cleanup',
  description: 'Create session-end.sh: clean up session state, release locks, deactivate session',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement the SessionEnd lifecycle hook for cleanup',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        'Create hooks/session-end.sh in the extension directory',
        'Follow Gemini CLI hook protocol: read JSON stdin, write JSON stdout',
        'Read GEMINI_SESSION_ID from environment',
        'Update the session state file: set active=false',
        'Call: babysitter session:update --session-id $SESSION_ID --state-dir $STATE_DIR --set active=false --json',
        'Clean up any stale lock files if present',
        'Output {} on stdout and exit 0',
        'Handle errors gracefully (exit 0 regardless)',
        'Make the script executable',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), hookType (string), scriptPath (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        hookType: { type: 'string' },
        scriptPath: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'implement', 'session-end']
}));

export const configureMcpServerTask = defineTask('configure-mcp-server', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure MCP server for babysitter CLI tools',
  description: 'Create MCP server that exposes babysitter CLI commands as tools to the Gemini agent',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior MCP protocol and integration engineer',
      task: 'Create an MCP server that exposes babysitter CLI commands as tools for Gemini CLI',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create mcp-server/babysitter-tools.js in the extension directory',
        'Implement an MCP server (stdio transport) that exposes babysitter CLI commands as tools',
        'Tools to expose:',
        '  - babysitter_run_create: Create a new orchestration run',
        '  - babysitter_run_iterate: Advance the run by one iteration',
        '  - babysitter_run_status: Get current run status and pending effects',
        '  - babysitter_task_list: List pending/completed tasks',
        '  - babysitter_task_post: Post a result for a pending task/effect',
        '  - babysitter_session_associate: Bind session to a run only if research proves Gemini lacks harness-native binding and the fallback helper must remain available',
        'Each tool must: validate inputs, shell out to babysitter CLI with --json flag, parse and return JSON result',
        'Include proper error handling and timeout management',
        'Map Gemini tool execution results to babysitter effect execution results',
        'Register the MCP server in the extension manifest or .gemini/settings.json mcpServers section',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), toolsExposed (array), mcpServerPath (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'toolsExposed'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        toolsExposed: { type: 'array', items: { type: 'string' } },
        mcpServerPath: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'implement', 'mcp-server']
}));

export const implementBeforeToolHookTask = defineTask('implement-before-tool-hook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement BeforeTool hook for iteration guards',
  description: 'Create iteration guard that validates tool calls against the current orchestration state',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement the BeforeTool hook for iteration guards and tool-to-effect mapping',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        'Create hooks/before-tool.sh in the extension directory',
        'Follow Gemini CLI hook protocol',
        'The BeforeTool hook fires before each tool execution',
        'Guard logic:',
        '  - If no active babysitter session: allow all tools (exit 0, output {})',
        '  - If active session: check iteration count against max_iterations',
        '  - If max iterations exceeded: deny tool execution with explanation (exit 2)',
        '  - Map Gemini tool names to babysitter effect kinds for tracking',
        'Tool-to-effect mapping:',
        '  - File read/write tools -> track as agent-owned work within the current turn; never mint a public node effect from this hook',
        '  - Shell execution tools -> shell effects',
        '  - MCP tool calls -> mapped by tool name prefix',
        'Log iteration progress to stderr for debugging',
        'Make the script executable',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), hookType (string), scriptPath (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        hookType: { type: 'string' },
        scriptPath: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'implement', 'before-tool']
}));

export const createSubAgentConfigTask = defineTask('create-sub-agent-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create sub-agent configuration for parallel effect execution',
  description: 'Configure sub-agent spawning for executing multiple effects concurrently',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer specializing in multi-agent systems',
      task: 'Create sub-agent configuration for parallel effect execution in Gemini CLI',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create a sub-agent configuration that enables parallel effect execution',
        'Gemini CLI supports delegating to sub-agents for concurrent work',
        'Create configs/sub-agent.json with:',
        '  - Agent name and role definition',
        '  - Tool access configuration (which tools the sub-agent can use)',
        '  - Context inheritance (GEMINI.md, run state)',
        '  - Output format specification (JSON for task:post)',
        'Create a sub-agent launcher script that:',
        '  - Reads pending effects from babysitter task:list',
        '  - Groups independent effects for parallel execution',
        '  - Spawns sub-agents for each effect group',
        '  - Collects results and posts them via task:post',
        '  - Handles sub-agent failures gracefully',
        'The sub-agent must have access to:',
        '  - File system tools (read, write, edit)',
        '  - Shell execution tools',
        '  - babysitter CLI (via MCP or direct)',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), subAgentConfig (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        subAgentConfig: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'implement', 'sub-agent']
}));

export const createGeminiSettingsTask = defineTask('create-gemini-settings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create .gemini/settings.json with hook registrations',
  description: 'Register all hooks and MCP server in Gemini CLI settings',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Create or update .gemini/settings.json to register babysitter hooks and MCP server',
      context: {
        projectDir: args.projectDir,
        hooks: args.hooks,
        mcpServer: args.mcpServer
      },
      instructions: [
        `Create or merge into ${args.projectDir}/.gemini/settings.json`,
        'Register hooks section with:',
        '  SessionStart: babysitter-session-start hook command',
        '  AfterAgent: babysitter-after-agent hook command (core loop driver)',
        '  SessionEnd: babysitter-session-end hook command',
        '  BeforeTool: babysitter-before-tool hook command (iteration guard)',
        'Register mcpServers section with the babysitter MCP server',
        'Use ${extensionPath} variable for hook command paths',
        'Set appropriate timeouts (SessionStart: 30s, AfterAgent: 30s, SessionEnd: 10s, BeforeTool: 5s)',
        'Document in settings comments or adjacent docs that SessionStart initializes state and AfterAgent owns continuation so later maintainers do not reintroduce an external supervisor unnecessarily',
        'If settings.json already exists, merge rather than overwrite',
        'Return list of created/modified files'
      ],
      outputFormat: 'JSON with filesCreated (array), settings (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        settings: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'gemini-cli', 'implement', 'settings']
}));

// --- Phase 4: Test ---

export const runIntegrationTestsTask = defineTask('run-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run integration tests for Gemini CLI harness',
  description: 'Validate hook scripts, MCP server, extension manifest, and end-to-end flow',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior QA engineer specializing in integration testing',
      task: 'Test the Gemini CLI babysitter integration',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles
      },
      instructions: [
        'Validate each integration file exists and has correct permissions',
        'Test gemini-extension.json: valid JSON, required fields present',
        'Test hook scripts:',
        '  - session-start.sh: runs without error, outputs valid JSON',
        '  - after-agent.sh: deny/approve decision logic works correctly',
        '  - session-end.sh: runs cleanup without error',
        '  - before-tool.sh: iteration guard logic works',
        'Test MCP server: starts, lists tools, handles basic requests',
        'Test .gemini/settings.json: valid JSON, hooks registered correctly',
        'Test GEMINI.md: exists and contains required workflow instructions',
        'Test commands/babysit.toml: valid TOML format',
        'Run a real host-level validation flow here as a preflight, with the shared runtime validation task providing the final runtime proof:',
        '  1. Verify SessionStart resolves session identity from hook payload or documented env without a synthetic bridge file',
        '  2. session:init',
        '  3. run:create using the Gemini harness binding path first (with --dry-run only as a shallow precheck if supported)',
        '  4. if native binding is unavailable, exercise the documented fallback association flow and record the gap rather than treating it as the primary contract',
        '  5. Check AfterAgent deny or approve behavior and user-yield reentry behavior on the next Gemini callback',
        'Report pass/fail for each test',
        'Return structured test results'
      ],
      outputFormat: 'JSON with allPassed (boolean), passed (number), total (number), results (array of {name, passed, error})'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passed', 'total', 'results'],
      properties: {
        allPassed: { type: 'boolean' },
        passed: { type: 'number' },
        total: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              error: { type: 'string' }
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

  labels: ['agent', 'assimilation', 'gemini-cli', 'test']
}));

// --- Phase 5: Verify ---

export const verifyIntegrationTask = defineTask('verify-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify integration quality',
  description: 'Score the integration against quality criteria and identify issues',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior quality assurance engineer',
      task: 'Verify the Gemini CLI babysitter integration quality, including research fidelity, runtime install docs, canonical skill adaptation, and user-yield loop behavior',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Score the integration on a 0-100 scale across these dimensions:',
        '  - Research and upstream distribution understanding (15 points)',
        '  - Canonical babysit skill adaptation fidelity (15 points)',
        '  - Hook protocol compliance and continuation behavior (20 points): correct stdin/stdout JSON, exit codes, yield-to-user reentry',
        '  - Direct session context propagation and runtime install flow (10 points): no synthetic startup bridge when hook payload or env already carries identity',
        '  - AfterAgent hook continuation ownership and completion proof validation (10 points)',
        '  - MCP server and tool exposure (10 points)',
        '  - Settings, docs, and operator install guidance (10 points)',
        '  - Error handling and edge cases (10 points)',
        'For each dimension below target, list specific issues to fix',
        'Identify any security concerns (e.g., unvalidated inputs, missing timeouts)',
        'Check for protocol mismatches (deny vs block, exit codes)',
        'Return quality score and issues list'
      ],
      outputFormat: 'JSON with qualityScore (number), dimensions (array of {name, score, maxScore}), issues (array of {severity, description, file, fix})'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'issues'],
      properties: {
        qualityScore: { type: 'number' },
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              score: { type: 'number' },
              maxScore: { type: 'number' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              description: { type: 'string' },
              file: { type: 'string' },
              fix: { type: 'string' }
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

  labels: ['agent', 'assimilation', 'gemini-cli', 'verify']
}));

// --- Phase 6: Converge ---

export const fixIntegrationIssuesTask = defineTask('fix-integration-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix integration issues (iteration ${args.iteration})`,
  description: 'Address quality issues identified during verification',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Fix the identified issues in the Gemini CLI babysitter integration and remove stale contract drift',
      context: {
        projectDir: args.projectDir,
        issues: args.issues,
        integrationFiles: args.integrationFiles,
        iteration: args.iteration
      },
      instructions: [
        'Review each issue from the verification report',
        'Fix issues in priority order: research gaps, install docs, canonical skill migration, and yield-loop issues first; then critical, high, medium, low',
        'For each fix:',
        '  - Read the affected file',
        '  - Apply the suggested fix or implement a better solution',
        '  - Verify the fix does not break other functionality',
        'Common fixes:',
        '  - Hook protocol compliance: ensure clean JSON on stdout, debug on stderr',
        '  - AfterAgent deny vs block: Gemini CLI uses "deny" not "block"',
        '  - Missing error handling: add try/catch or set -e guards',
        '  - Missing timeouts: add timeout parameters to hook registrations',
        '  - Completion proof: ensure SHA-256 validation is correct',
        '  - Stale contract language: remove fallback-first session association, direct result.json writes, or non-agent public effect kinds',
        'Return list of fixed issues and any new files created'
      ],
      outputFormat: 'JSON with fixedIssues (array), newFiles (array), unfixedIssues (array with reasons)'
    },
    outputSchema: {
      type: 'object',
      required: ['fixedIssues'],
      properties: {
        fixedIssues: { type: 'array', items: { type: 'string' } },
        newFiles: { type: 'array', items: { type: 'string' } },
        unfixedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              reason: { type: 'string' }
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

  labels: ['agent', 'assimilation', 'gemini-cli', 'converge', `iteration-${args.iteration}`]
}));
