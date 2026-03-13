/**
 * @process assimilation/harness/generic
 * @description Orchestrate babysitter SDK integration into a generic AI coding harness. Guides through analysis, scaffolding, implementation, testing, and quality verification.
 * @inputs { projectDir: string, harnessType: string, targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, integrationFiles: string[], finalQuality: number, iterations: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// PROCESS ENTRY POINT
// ============================================================================

export async function process(inputs, ctx) {
  const {
    projectDir,
    harnessType,
    targetQuality = 80,
    maxIterations = 5
  } = inputs;

  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  // ==========================================================================
  // PHASE 1: ANALYZE
  // ==========================================================================

  ctx.log('phase:analyze', `Analyzing project at ${projectDir} for harness type: ${harnessType}`);

  const analysis = await ctx.task(analyzeProjectTask, {
    projectDir,
    harnessType
  });

  ctx.log('phase:analyze:complete', `Detected capabilities: ${JSON.stringify(analysis.capabilities)}`);

  // Breakpoint: let the user review the analysis before proceeding
  await ctx.breakpoint({
    question: `Analysis complete for "${harnessType}" harness. Detected capabilities: ${Object.entries(analysis.capabilities).filter(([_, v]) => v).map(([k]) => k).join(', ')}. Proceed with scaffolding?`,
    title: 'Harness Analysis Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/analysis-report.md`, format: 'markdown', label: 'Analysis Report' }
      ]
    }
  });

  // ==========================================================================
  // PHASE 2: SCAFFOLD
  // ==========================================================================

  ctx.log('phase:scaffold', 'Creating integration directory structure and config stubs');

  const scaffold = await ctx.task(scaffoldIntegrationTask, {
    projectDir,
    harnessType,
    capabilities: analysis.capabilities,
    configPaths: analysis.configPaths
  });

  integrationFiles.push(...scaffold.filesCreated);
  ctx.log('phase:scaffold:complete', `Scaffolded ${scaffold.filesCreated.length} files`);

  // ==========================================================================
  // PHASE 3: IMPLEMENT
  // ==========================================================================

  ctx.log('phase:implement', 'Implementing core integration components');

  // 3a & 3b: SDK installation script and session init adapter run in parallel
  const [installScript, sessionAdapter] = await ctx.parallel.all([
    async () => {
      ctx.log('phase:implement:install-script', 'Implementing SDK installation script');
      return ctx.task(implementInstallScriptTask, {
        projectDir,
        harnessType,
        capabilities: analysis.capabilities
      });
    },
    async () => {
      ctx.log('phase:implement:session-adapter', 'Implementing session initialization adapter');
      return ctx.task(implementSessionAdapterTask, {
        projectDir,
        harnessType,
        capabilities: analysis.capabilities,
        configPaths: analysis.configPaths
      });
    }
  ]);

  integrationFiles.push(...installScript.filesCreated, ...installScript.filesModified);
  integrationFiles.push(...sessionAdapter.filesCreated, ...sessionAdapter.filesModified);

  // 3c: Run creation and binding (depends on session adapter)
  ctx.log('phase:implement:run-binding', 'Implementing run creation and session binding');
  const runBinding = await ctx.task(implementRunBindingTask, {
    projectDir,
    harnessType,
    capabilities: analysis.capabilities,
    sessionAdapterPath: sessionAdapter.entryPoint
  });

  integrationFiles.push(...runBinding.filesCreated, ...runBinding.filesModified);

  // 3d & 3e & 3f & 3g: Orchestration loop, effect execution, result posting,
  // and iteration guards can be implemented in parallel
  const [loopDriver, effectAdapter, resultAdapter, iterationGuards] = await ctx.parallel.all([
    async () => {
      ctx.log('phase:implement:loop-driver', 'Implementing orchestration loop driver (exit/stop mechanism)');
      return ctx.task(implementLoopDriverTask, {
        projectDir,
        harnessType,
        capabilities: analysis.capabilities,
        configPaths: analysis.configPaths
      });
    },
    async () => {
      ctx.log('phase:implement:effect-adapter', 'Implementing effect execution adapter');
      return ctx.task(implementEffectAdapterTask, {
        projectDir,
        harnessType,
        capabilities: analysis.capabilities
      });
    },
    async () => {
      ctx.log('phase:implement:result-adapter', 'Implementing result posting adapter');
      return ctx.task(implementResultAdapterTask, {
        projectDir,
        harnessType,
        capabilities: analysis.capabilities
      });
    },
    async () => {
      ctx.log('phase:implement:iteration-guards', 'Implementing iteration guards');
      return ctx.task(implementIterationGuardsTask, {
        projectDir,
        harnessType,
        capabilities: analysis.capabilities
      });
    }
  ]);

  integrationFiles.push(
    ...loopDriver.filesCreated, ...loopDriver.filesModified,
    ...effectAdapter.filesCreated, ...effectAdapter.filesModified,
    ...resultAdapter.filesCreated, ...resultAdapter.filesModified,
    ...iterationGuards.filesCreated, ...iterationGuards.filesModified
  );

  ctx.log('phase:implement:complete', `Implemented ${integrationFiles.length} integration files total`);

  // ==========================================================================
  // PHASE 4: TEST
  // ==========================================================================

  ctx.log('phase:test', 'Running smoke tests against integration');

  const smokeTests = await ctx.task(smokeTestTask, {
    projectDir,
    harnessType,
    integrationFiles
  });

  ctx.log('phase:test:complete', `Smoke tests: ${smokeTests.passed}/${smokeTests.total} passed`);

  // ==========================================================================
  // PHASE 5: VERIFY
  // ==========================================================================

  ctx.log('phase:verify', 'Scoring implementation quality');

  const verification = await ctx.task(verifyQualityTask, {
    projectDir,
    harnessType,
    capabilities: analysis.capabilities,
    integrationFiles,
    smokeTestResults: smokeTests,
    targetQuality
  });

  finalQuality = verification.score;
  iterations = 1;

  ctx.log('phase:verify:complete', `Quality score: ${finalQuality}/${targetQuality}`);

  // ==========================================================================
  // PHASE 6: CONVERGE
  // ==========================================================================

  while (finalQuality < targetQuality && iterations < maxIterations) {
    iterations++;

    ctx.log('phase:converge', `Iteration ${iterations}: quality ${finalQuality} < target ${targetQuality}, fixing issues`);

    // Fix identified issues
    const fix = await ctx.task(fixIssuesTask, {
      projectDir,
      harnessType,
      issues: verification.issues,
      recommendations: verification.recommendations,
      integrationFiles,
      iteration: iterations
    });

    // Update file list with any new or modified files
    integrationFiles.push(...fix.filesCreated.filter(f => !integrationFiles.includes(f)));
    for (const f of fix.filesModified) {
      if (!integrationFiles.includes(f)) {
        integrationFiles.push(f);
      }
    }

    // Re-run smoke tests
    const retestResults = await ctx.task(smokeTestTask, {
      projectDir,
      harnessType,
      integrationFiles
    });

    ctx.log('phase:converge:retest', `Smoke tests: ${retestResults.passed}/${retestResults.total} passed`);

    // Re-verify quality
    const reverify = await ctx.task(verifyQualityTask, {
      projectDir,
      harnessType,
      capabilities: analysis.capabilities,
      integrationFiles,
      smokeTestResults: retestResults,
      targetQuality
    });

    finalQuality = reverify.score;

    ctx.log('phase:converge:score', `Iteration ${iterations}: quality now ${finalQuality}/${targetQuality}`);
  }

  // ==========================================================================
  // RESULT
  // ==========================================================================

  const success = finalQuality >= targetQuality;

  ctx.log('process:complete', `Integration ${success ? 'succeeded' : 'did not meet target'}. Final quality: ${finalQuality}/${targetQuality} after ${iterations} iteration(s).`);

  return {
    success,
    integrationFiles: [...new Set(integrationFiles)],
    finalQuality,
    iterations,
    harnessType,
    projectDir,
    targetQuality,
    capabilities: analysis.capabilities,
    metadata: {
      processId: 'assimilation/harness/generic',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// --- PHASE 1: ANALYZE ---

export const analyzeProjectTask = defineTask('analyze-project', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze harness: ${args.harnessType}`,
  description: 'Detect harness capabilities, config files, and integration points',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer specializing in AI coding harness architecture',
      task: 'Analyze the target project and harness to determine integration capabilities and configuration',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType
      },
      instructions: [
        `Examine the project at ${args.projectDir} for harness configuration files`,
        `Identify the harness type "${args.harnessType}" and its architecture (hook-based, middleware, event-based, loop-based, API-based)`,
        'Detect which capabilities are available:',
        '  - shellExec: can the harness execute shell commands?',
        '  - exitInterception: can exit/stop signals be intercepted?',
        '  - contextReinjection: can new context be injected after blocking an exit?',
        '  - sessionIdentity: does the harness provide stable session/conversation IDs?',
        '  - lifecycleHooks: are pre-session, post-session, pre-turn, post-turn hooks available?',
        '  - transcriptAccess: can the harness read the agent\'s recent output text?',
        'Locate existing config files, hook registration points, and plugin directories',
        'Identify the interception mechanism (stop hook, middleware wrapper, event listener, loop condition, API check)',
        'Identify the re-injection mechanism (system message, user message, tool result, context prepend)',
        'Document any blockers or missing capabilities that will need workarounds',
        'Generate an analysis report as markdown artifact'
      ],
      outputFormat: 'JSON with capabilities (object of booleans), configPaths (array of strings), architecture (string), interceptionMechanism (string), reinjectionMechanism (string), blockers (array of strings), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'configPaths', 'architecture'],
      properties: {
        capabilities: {
          type: 'object',
          properties: {
            shellExec: { type: 'boolean' },
            exitInterception: { type: 'boolean' },
            contextReinjection: { type: 'boolean' },
            sessionIdentity: { type: 'boolean' },
            lifecycleHooks: { type: 'boolean' },
            transcriptAccess: { type: 'boolean' }
          }
        },
        configPaths: { type: 'array', items: { type: 'string' } },
        architecture: { type: 'string' },
        interceptionMechanism: { type: 'string' },
        reinjectionMechanism: { type: 'string' },
        blockers: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'analyze']
}));

// --- PHASE 2: SCAFFOLD ---

export const scaffoldIntegrationTask = defineTask('scaffold-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold integration structure',
  description: 'Create directories, config stubs, and script templates',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Create the directory structure, configuration stubs, and script templates for the babysitter SDK integration',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities,
        configPaths: args.configPaths
      },
      instructions: [
        'Create the integration directory structure under the project:',
        '  - {projectDir}/.babysitter/ or appropriate location for this harness',
        '  - hooks/ directory for lifecycle hook scripts',
        '  - scripts/ directory for integration scripts',
        '  - state/ directory for session state files',
        'Create config stub files:',
        '  - babysitter integration config (JSON or YAML per harness convention)',
        '  - hook registration config pointing to the hook scripts',
        'Create script template files (empty shells with correct exports/signatures):',
        '  - install.sh or install.js for SDK installation',
        '  - session-init adapter',
        '  - stop-hook adapter',
        '  - effect-executor adapter',
        '  - result-poster adapter',
        'Add a .gitignore for state/ directory contents',
        'Return the list of all files created'
      ],
      outputFormat: 'JSON with filesCreated (array of paths), directoryStructure (string showing tree), configFormat (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        directoryStructure: { type: 'string' },
        configFormat: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'scaffold']
}));

// --- PHASE 3a: IMPLEMENT SDK INSTALLATION SCRIPT ---

export const implementInstallScriptTask = defineTask('implement-install-script', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK installation script',
  description: 'Create script that ensures babysitter CLI is available on PATH',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement the SDK installation script following the babysitter generic harness guide pattern',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities
      },
      instructions: [
        'Implement ensureBabysitterCLI() that:',
        '  1. Checks if babysitter command already exists on PATH',
        '  2. If not, checks for a marker file (.babysitter-install-attempted)',
        '  3. If no marker, attempts: npm install -g @a5c-ai/babysitter-sdk@{version}',
        '  4. Falls back to: npm install -g @a5c-ai/babysitter-sdk@{version} --prefix $HOME/.local',
        '  5. Writes the marker file after attempt',
        '  6. Final fallback: returns npx -y @a5c-ai/babysitter-sdk@{version} babysitter',
        '  7. Verifies with: babysitter version --json',
        'Read SDK version from plugin manifest or package.json if available',
        'Handle cross-platform concerns (Windows, macOS, Linux)',
        'Include proper error handling and logging',
        'Return the CLI command path or npx fallback string'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'implement', 'install']
}));

// --- PHASE 3b: IMPLEMENT SESSION INITIALIZATION ADAPTER ---

export const implementSessionAdapterTask = defineTask('implement-session-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement session initialization adapter',
  description: 'Create adapter that initializes babysitter session state on harness session start',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement the session initialization adapter for the babysitter SDK integration',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities,
        configPaths: args.configPaths
      },
      instructions: [
        'Implement onSessionStart(sessionId, pluginRoot) that:',
        '  1. Determines the state directory: {pluginRoot}/skills/babysit/state/',
        '  2. Ensures the state directory exists',
        '  3. Calls: babysitter session:init --session-id {sessionId} --state-dir {stateDir} --json',
        '  4. Persists session ID and plugin root in the harness environment',
        '  5. Handles failures gracefully with warning logs',
        'Wire the adapter into the harness lifecycle:',
        `  - For hook-based: register as session start hook`,
        '  - For middleware-based: call at top of agent main loop',
        '  - For event-based: listen for session_start event',
        'Obtain or generate unique session ID from harness session/conversation identity',
        'Export the entry point path for other adapters to reference'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), entryPoint (string), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'entryPoint', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        entryPoint: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'implement', 'session']
}));

// --- PHASE 3c: IMPLEMENT RUN CREATION AND BINDING ---

export const implementRunBindingTask = defineTask('implement-run-binding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement run creation and session binding',
  description: 'Create adapter for babysitter run:create and session:associate',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement run creation and session binding for the babysitter SDK integration',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities,
        sessionAdapterPath: args.sessionAdapterPath
      },
      instructions: [
        'Implement createAndBindRun(processId, entryPoint, inputs, prompt, sessionId, pluginRoot) that:',
        '  1. Calls: babysitter run:create --process-id {processId} --entry {entryPoint} --inputs {inputsFilePath} --prompt "{prompt}" --json',
        '  2. Parses the runId from JSON stdout',
        '  3. Calls: babysitter session:associate --session-id {sessionId} --run-id {runId} --state-dir {stateDir} --json',
        '  4. Returns { runId, runDir }',
        'Handle re-entrant run prevention:',
        '  - If session already bound to a different run, surface error to user',
        '  - Provide cleanup mechanism for stale sessions',
        'Handle CLI failures gracefully with structured error messages',
        'Wire into the harness skill/command trigger mechanism'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'implement', 'run-binding']
}));

// --- PHASE 3d: IMPLEMENT ORCHESTRATION LOOP DRIVER ---

export const implementLoopDriverTask = defineTask('implement-loop-driver', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement orchestration loop driver',
  description: 'Create the exit/stop interception mechanism that drives the orchestration loop',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement the orchestration loop driver (exit/stop interception and context re-injection)',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities,
        configPaths: args.configPaths
      },
      instructions: [
        'Implement onAgentStop(sessionId, pluginRoot, runsDir, lastAgentOutput) decision algorithm:',
        '  Guard 1: No state file -> APPROVE exit',
        '  Guard 2: iteration >= maxIterations -> APPROVE exit, cleanup',
        '  Guard 3: Runaway loop detection (avg iteration time <= 15s after 5 iterations) -> APPROVE, cleanup',
        '  Guard 4: No run bound (empty runId) -> APPROVE exit, cleanup',
        '  Guard 5: run:status fails -> APPROVE exit, cleanup',
        '  Guard 6: Completion proof match -> APPROVE exit, cleanup',
        '  Otherwise: BLOCK exit and re-inject context',
        'On BLOCK:',
        '  1. Increment iteration in session state file',
        '  2. Call: babysitter session:iteration-message --iteration {N} --run-id {runId} --runs-dir {runsDir} --plugin-root {pluginRoot} --json',
        '  3. Return BLOCK with the systemMessage for context re-injection',
        'Implement extractPromiseTag(text) to scan for <promise>VALUE</promise>',
        'Wire the interception into the harness stop/exit mechanism:',
        `  - Harness type "${args.harnessType}": use appropriate mechanism (stop hook, middleware, event, loop condition, API check)`,
        'Implement context re-injection via the harness mechanism (system message, user message, tool result, or context prepend)'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'implement', 'loop-driver']
}));

// --- PHASE 3e: IMPLEMENT EFFECT EXECUTION ADAPTER ---

export const implementEffectAdapterTask = defineTask('implement-effect-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement effect execution adapter',
  description: 'Create adapter that executes pending effects by kind (node, breakpoint, sleep, agent, orchestrator_task)',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement the effect execution adapter for the babysitter SDK integration',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities
      },
      instructions: [
        'Implement the effect execution cycle:',
        '  1. Call: babysitter run:iterate .a5c/runs/{runId} --json to get pending actions',
        '  2. Call: babysitter task:list .a5c/runs/{runId} --pending --json to get pending tasks',
        '  3. For each pending task, dispatch by kind:',
        '    - kind="node": Execute the Node.js script specified in task.node.entry with task.node.args',
        '    - kind="breakpoint": Present the breakpoint question to the user for approval',
        '    - kind="sleep": Wait until the specified time (sleepUntil)',
        '    - kind="orchestrator_task": Delegate to a sub-agent or orchestrator within the harness',
        '    - kind="agent": Delegate to an agent subprocess with the specified prompt',
        '    - custom kinds: Log a warning and attempt generic execution',
        'Each handler must return EffectResult: { status: "ok"|"error", value: object }',
        'Handle errors gracefully: catch exceptions and return { status: "error", value: { message, stack } }',
        'Support concurrent effect execution where possible'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'implement', 'effect-adapter']
}));

// --- PHASE 3f: IMPLEMENT RESULT POSTING ADAPTER ---

export const implementResultAdapterTask = defineTask('implement-result-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement result posting adapter',
  description: 'Create adapter that posts effect results back via babysitter task:post',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement the result posting adapter for the babysitter SDK integration',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities
      },
      instructions: [
        'Implement postEffectResult(runId, effectId, result) that:',
        '  1. Writes the result JSON to the task directory: .a5c/runs/{runId}/tasks/{effectId}/result.json',
        '  2. Calls: babysitter task:post .a5c/runs/{runId} --effect-id {effectId} --json',
        '  3. Handles BLOB_THRESHOLD (1 MiB) - large payloads are stored as blobs',
        '  4. Returns the post confirmation',
        'Implement batch posting for parallel effect results',
        'Handle errors: retry on transient failures (EBUSY, ETXTBSY), fail on permanent errors',
        'Follow the atomic write protocol: write to .tmp file, fsync, rename',
        'Support both ok and error result statuses'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'implement', 'result-adapter']
}));

// --- PHASE 3g: IMPLEMENT ITERATION GUARDS ---

export const implementIterationGuardsTask = defineTask('implement-iteration-guards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement iteration guards',
  description: 'Create guard checks for max iterations, runaway detection, and session cleanup',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement iteration guards for the babysitter SDK orchestration loop',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities
      },
      instructions: [
        'Implement the following guard functions:',
        '  checkMaxIterations(state): returns true if iteration >= maxIterations',
        '  checkRunawayLoop(state): returns true if avg of last 3 iteration times <= 15 seconds after 5+ iterations',
        '  checkSessionBound(state): returns true if runId is empty',
        '  checkRunStatus(runId): calls run:status and returns true if status call fails',
        '  checkCompletionProof(runId, lastOutput): checks if run is completed AND promise tag matches proof',
        '  cleanupSession(stateFile): removes or archives the session state file',
        'Implement session state file parser that reads the markdown state format:',
        '  - Extracts run_id, iteration, max_iterations, iteration_times from the state file',
        'Implement session state file updater that atomically writes updated state',
        'Configure guards with sensible defaults from environment variables:',
        '  - BABYSITTER_MAX_ITERATIONS (default: 256)',
        '  - Runaway threshold: 15 seconds average',
        '  - Minimum iterations before runaway check: 5'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'implement', 'iteration-guards']
}));

// --- PHASE 4: SMOKE TEST ---

export const smokeTestTask = defineTask('smoke-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Smoke test integration',
  description: 'Verify SDK available, session init works, run create/iterate works',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior QA engineer specializing in integration testing',
      task: 'Run smoke tests against the babysitter SDK integration',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        integrationFiles: args.integrationFiles
      },
      instructions: [
        'Execute the following smoke tests:',
        '  Test 1 - SDK Available: Run "babysitter version --json" and verify it returns valid JSON with version field',
        '  Test 2 - Session Init: Run the session initialization adapter and verify a state file is created',
        '  Test 3 - Run Create: Create a test run with a minimal process and verify run.json exists',
        '  Test 4 - Run Iterate: Call run:iterate on the test run and verify it returns valid JSON status',
        '  Test 5 - Guard Check: Verify iteration guards correctly identify max iterations exceeded',
        'For each test, record: testName, passed (boolean), error (string if failed), duration (ms)',
        'Clean up any test artifacts after execution',
        'Return aggregate results'
      ],
      outputFormat: 'JSON with total (number), passed (number), failed (number), tests (array of { testName, passed, error, durationMs })'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'passed', 'failed', 'tests'],
      properties: {
        total: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              passed: { type: 'boolean' },
              error: { type: 'string' },
              durationMs: { type: 'number' }
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

  labels: ['agent', 'assimilation', 'harness', 'test', 'smoke']
}));

// --- PHASE 5: VERIFY QUALITY ---

export const verifyQualityTask = defineTask('verify-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify integration quality (target: ${args.targetQuality})`,
  description: 'Score implementation for accuracy, completeness, and working code',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior QA engineer and integration architect',
      task: 'Score the babysitter SDK integration quality on accuracy, completeness, and working code',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        capabilities: args.capabilities,
        integrationFiles: args.integrationFiles,
        smokeTestResults: args.smokeTestResults,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Score the integration on three dimensions (each 0-100):',
        '  Accuracy: Do the integration components correctly implement the babysitter protocol?',
        '    - Session init creates correct state file format',
        '    - Run creation uses correct CLI flags and parses output correctly',
        '    - Loop driver implements all 6 guards from the generic harness guide',
        '    - Effect adapter handles all effect kinds (node, breakpoint, sleep, agent, orchestrator_task)',
        '    - Result posting follows atomic write protocol',
        '    - Completion proof extraction uses correct regex',
        '  Completeness: Are all integration points implemented?',
        '    - All 7 core components present (install, session, run-binding, loop, effects, results, guards)',
        '    - Config files properly reference all adapters',
        '    - Error handling for all CLI failure modes',
        '    - Cross-platform support where applicable',
        '  Working Code: Does the code actually run?',
        '    - Smoke test pass rate',
        '    - No syntax errors',
        '    - Correct imports and exports',
        '    - Proper async/await usage',
        'Calculate overall score as weighted average: accuracy(40%) + completeness(30%) + workingCode(30%)',
        'Identify specific issues and provide actionable recommendations for each',
        'Return score, issues, and recommendations'
      ],
      outputFormat: 'JSON with score (number 0-100), accuracy (number), completeness (number), workingCode (number), issues (array of { severity, component, description }), recommendations (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'accuracy', 'completeness', 'workingCode'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        accuracy: { type: 'number', minimum: 0, maximum: 100 },
        completeness: { type: 'number', minimum: 0, maximum: 100 },
        workingCode: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              component: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'verify', 'quality']
}));

// --- PHASE 6: FIX ISSUES (convergence loop) ---

export const fixIssuesTask = defineTask('fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix issues (iteration ${args.iteration})`,
  description: 'Address quality issues and apply recommendations',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Fix the identified issues in the babysitter SDK integration to improve quality score',
      context: {
        projectDir: args.projectDir,
        harnessType: args.harnessType,
        issues: args.issues,
        recommendations: args.recommendations,
        integrationFiles: args.integrationFiles,
        iteration: args.iteration
      },
      instructions: [
        'Review all identified issues sorted by severity (critical first)',
        'For each issue:',
        '  1. Locate the affected file(s)',
        '  2. Implement the fix',
        '  3. Verify the fix does not break other components',
        'Apply recommendations where they improve quality',
        'Focus on the highest-impact fixes first:',
        '  - Correctness of CLI command invocations',
        '  - Guard implementation completeness',
        '  - Error handling gaps',
        '  - Missing effect kind handlers',
        'Do NOT introduce new features or refactors beyond what is needed to fix issues',
        'Return the list of files created and modified'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), issuesFixed (array of strings), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'issuesFixed', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        issuesFixed: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'converge', `iteration-${args.iteration}`]
}));
