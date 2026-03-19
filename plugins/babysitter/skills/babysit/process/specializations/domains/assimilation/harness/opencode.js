/**
 * @process assimilation/harness/opencode
 * @description Orchestrate babysitter SDK integration into OpenCode. Sets up plugin hooks, MCP tools, session.idle loop driver, and custom tools.
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
 * OpenCode Harness Integration Process
 *
 * Orchestrates the full integration of babysitter SDK into an OpenCode project.
 * Follows the Plugin with Stop Hook strategy (Strategy A) from the integration guide.
 *
 * Phases:
 *   1. Analyze  - Inspect project structure, detect existing OpenCode config
 *   2. Scaffold - Create plugin directory, opencode.json, custom tools directory
 *   3. Implement - Write plugin hooks, MCP tool registration, session.idle driver,
 *                  effect mapping, result posting, doom_loop handling, custom tool
 *   4. Test     - Run integration tests against scaffolded files
 *   5. Verify   - Quality gate: lint, type-check, smoke test
 *   6. Converge - Iterative refinement until targetQuality is met
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Absolute path to the OpenCode project
 * @param {number} inputs.targetQuality - Minimum quality score (0-100) to accept
 * @param {number} inputs.maxIterations - Maximum convergence iterations
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Integration result with file list and quality score
 */
export async function process(inputs, ctx) {
  const {
    projectDir,
    targetQuality = 80,
    maxIterations = 10
  } = inputs;

  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  const researchResult = await ctx.task(runHarnessResearchTask, {
    projectDir,
    harnessName: 'OpenCode',
    upstreamSource: 'official OpenCode plugin model plus the canonical babysitter plugin repo',
    distributionTarget: 'OpenCode plugin hooks, opencode.json, custom tools, and runtime install path',
    loopModel: 'session.idle and stop-hook continuation with explicit yield back to the harness user'
  });

  integrationFiles.push(...(researchResult.artifactsCreated || []));

  // ==========================================================================
  // PHASE 1: ANALYZE
  // ==========================================================================

  ctx.log('Phase 1: Analyzing OpenCode project structure');

  const analysis = await ctx.task(analyzeProjectTask, {
    projectDir
  });

  ctx.log(`Analysis complete: opencode.json=${analysis.hasOpencodeJson}, plugins=${analysis.hasPluginsDir}, tools=${analysis.hasToolsDir}`);

  // ==========================================================================
  // PHASE 2: SCAFFOLD
  // ==========================================================================

  ctx.log('Phase 2: Scaffolding integration directories and config files');

  const [scaffoldPluginResult, scaffoldToolsResult, scaffoldConfigResult] = await ctx.parallel.all([
    async () => ctx.task(scaffoldPluginDirTask, {
      projectDir,
      existingPluginsDir: analysis.hasPluginsDir
    }),
    async () => ctx.task(scaffoldToolsDirTask, {
      projectDir,
      existingToolsDir: analysis.hasToolsDir
    }),
    async () => ctx.task(scaffoldOpencodeConfigTask, {
      projectDir,
      existingConfig: analysis.opencodeJsonContent,
      hasOpencodeJson: analysis.hasOpencodeJson
    })
  ]);

  integrationFiles.push(
    ...scaffoldPluginResult.filesCreated,
    ...scaffoldToolsResult.filesCreated,
    ...scaffoldConfigResult.filesCreated
  );

  const assimilationResult = await ctx.task(adaptOriginalBabysitTask, {
    projectDir,
    harnessName: 'OpenCode',
    upstreamSource: 'the canonical babysitter plugin repo and its babysit process library',
    research: researchResult
  });

  integrationFiles.push(...(assimilationResult.filesCreated || []), ...(assimilationResult.filesModified || []));

  ctx.log(`Scaffolding complete: ${integrationFiles.length} files created`);

  // Breakpoint: confirm scaffold before implementation
  await ctx.breakpoint({
    question: 'Scaffolding complete. Review the created directories and config before proceeding to implementation.',
    title: 'Scaffold Review',
    context: {
      runId: ctx.runId,
      files: integrationFiles.map(f => ({
        path: f,
        format: 'text',
        label: f.split('/').pop()
      }))
    }
  });

  // ==========================================================================
  // PHASE 3: IMPLEMENT
  // ==========================================================================

  ctx.log('Phase 3: Implementing OpenCode plugin hooks, MCP tools, and custom tools');

  // 3a-3c can run in parallel (independent implementation files)
  const [pluginHooksResult, mcpToolsResult, customToolResult] = await ctx.parallel.all([
    async () => ctx.task(implementPluginHooksTask, {
      projectDir,
      analysis
    }),
    async () => ctx.task(registerMcpToolsTask, {
      projectDir,
      analysis
    }),
    async () => ctx.task(implementCustomToolTask, {
      projectDir
    })
  ]);

  integrationFiles.push(
    ...pluginHooksResult.filesCreated,
    ...mcpToolsResult.filesCreated,
    ...customToolResult.filesCreated
  );

  // 3d-3g depend on plugin hooks being in place
  const [idleDriverResult, effectMapResult, resultPostResult, doomLoopResult] = await ctx.parallel.all([
    async () => ctx.task(implementIdleDriverTask, {
      projectDir,
      pluginFile: pluginHooksResult.pluginEntryFile
    }),
    async () => ctx.task(implementEffectMappingTask, {
      projectDir,
      pluginFile: pluginHooksResult.pluginEntryFile
    }),
    async () => ctx.task(implementResultPostingTask, {
      projectDir,
      pluginFile: pluginHooksResult.pluginEntryFile
    }),
    async () => ctx.task(implementDoomLoopHandlingTask, {
      projectDir,
      pluginFile: pluginHooksResult.pluginEntryFile
    })
  ]);

  integrationFiles.push(
    ...idleDriverResult.filesModified,
    ...effectMapResult.filesModified,
    ...resultPostResult.filesModified,
    ...doomLoopResult.filesModified
  );

  const docsResult = await ctx.task(writeHarnessInstallDocsTask, {
    projectDir,
    harnessName: 'OpenCode',
    research: researchResult,
    assimilation: assimilationResult
  });

  integrationFiles.push(...(docsResult.filesCreated || []), ...(docsResult.filesModified || []));

  ctx.log(`Implementation complete: ${integrationFiles.length} total integration files`);

  // ==========================================================================
  // PHASE 4: TEST
  // ==========================================================================

  ctx.log('Phase 4: Running integration tests');

  const testResult = await ctx.task(runIntegrationTestsTask, {
    projectDir,
    integrationFiles
  });

  ctx.log(`Tests: ${testResult.passed}/${testResult.total} passed`);

  let runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
    projectDir,
    harnessName: 'OpenCode',
    loopModel: 'session.idle and stop-hook continuation with explicit yield back to the harness user',
    research: researchResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult
  });

  if (!testResult.allPassed) {
    await ctx.breakpoint({
      question: `Integration tests failed: ${testResult.failures.join(', ')}. Fix issues and retry?`,
      title: 'Test Failures',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'test-results.json', format: 'json', label: 'Test Results' }
        ]
      }
    });
  }

  // ==========================================================================
  // PHASE 5: VERIFY
  // ==========================================================================

  ctx.log('Phase 5: Quality verification');

  let verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
    projectDir,
    harnessName: 'OpenCode',
    research: researchResult,
    assimilation: assimilationResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult,
    runtimeValidation: runtimeValidationResult,
    targetQuality
  });

  finalQuality = verifyResult.qualityScore;
  ctx.log(`Verification: quality=${finalQuality}, target=${targetQuality}`);

  // ==========================================================================
  // PHASE 6: CONVERGE
  // ==========================================================================

  ctx.log('Phase 6: Iterative convergence');

  while (finalQuality < targetQuality && iterations < maxIterations) {
    iterations++;
    ctx.log(`Convergence iteration ${iterations}/${maxIterations}: quality=${finalQuality}`);

    const fixResult = await ctx.task(refineHarnessAssimilationTask, {
      projectDir,
      harnessName: 'OpenCode',
      integrationFiles,
      issues: verifyResult.issues,
      recommendations: verifyResult.recommendations,
      iteration: iterations
    });

    integrationFiles.push(...(fixResult.newFiles || []), ...(fixResult.filesCreated || []), ...(fixResult.filesModified || []));

    runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
      projectDir,
      harnessName: 'OpenCode',
      loopModel: 'session.idle and stop-hook continuation with explicit yield back to the harness user',
      research: researchResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: testResult
    });

    const reVerify = await ctx.task(verifyHarnessAssimilationTask, {
      projectDir,
      harnessName: 'OpenCode',
      research: researchResult,
      assimilation: assimilationResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: testResult,
      runtimeValidation: runtimeValidationResult,
      targetQuality
    });

    verifyResult = reVerify;
    finalQuality = reVerify.qualityScore;

    if (finalQuality >= targetQuality) {
      ctx.log(`Convergence achieved at iteration ${iterations}: quality=${finalQuality}`);
      break;
    }
  }

  if (finalQuality < targetQuality) {
    await ctx.breakpoint({
      question: `Quality ${finalQuality} did not reach target ${targetQuality} after ${iterations} iterations. Accept or continue manually?`,
      title: 'Convergence Incomplete',
      context: { runId: ctx.runId }
    });
  }

  // Deduplicate integration files
  const uniqueFiles = [...new Set(integrationFiles)];

  return {
    success: finalQuality >= targetQuality,
    integrationFiles: uniqueFiles,
    finalQuality,
    iterations,
    phases: ['analyze', 'scaffold', 'implement', 'test', 'verify', 'converge'],
    metadata: {
      processId: 'assimilation/harness/opencode',
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

export const analyzeProjectTask = defineTask('analyze-opencode-project', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze OpenCode project structure',
  description: 'Inspect project for existing OpenCode configuration, plugin dirs, and tools dirs',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer analyzing an OpenCode project',
      task: 'Analyze the target project directory for OpenCode integration readiness',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        `Inspect ${args.projectDir} for the following:`,
        '1. Check if .opencode/ directory exists',
        '2. Check if .opencode/plugins/ directory exists',
        '3. Check if .opencode/tools/ directory exists',
        '4. Check if opencode.json exists and read its contents',
        '5. Check if package.json exists and has @opencode-ai/sdk dependency',
        '6. Check if .a5c/ directory exists (prior babysitter integration)',
        '7. Check if any MCP servers are already configured',
        '8. Identify the project language/framework (Go, Node, etc.)',
        'Return a structured analysis of what exists and what needs to be created'
      ],
      outputFormat: 'JSON with hasOpencodeJson (bool), hasPluginsDir (bool), hasToolsDir (bool), opencodeJsonContent (object|null), hasA5cDir (bool), projectType (string), existingMcpServers (array), recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['hasOpencodeJson', 'hasPluginsDir', 'hasToolsDir'],
      properties: {
        hasOpencodeJson: { type: 'boolean' },
        hasPluginsDir: { type: 'boolean' },
        hasToolsDir: { type: 'boolean' },
        opencodeJsonContent: { type: ['object', 'null'] },
        hasA5cDir: { type: 'boolean' },
        projectType: { type: 'string' },
        existingMcpServers: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'analyze']
}));

// --- Phase 2: Scaffold ---

export const scaffoldPluginDirTask = defineTask('scaffold-plugin-dir', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold .opencode/plugins/babysitter/ directory',
  description: 'Create the babysitter plugin directory with package.json and entry point stub',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer scaffolding an OpenCode plugin',
      task: 'Create the .opencode/plugins/babysitter/ directory structure',
      context: {
        projectDir: args.projectDir,
        existingPluginsDir: args.existingPluginsDir
      },
      instructions: [
        `Create directory: ${args.projectDir}/.opencode/plugins/babysitter/`,
        'Create package.json with name "babysitter-opencode-plugin", type "module"',
        'Create index.ts entry point with Plugin type import from @opencode-ai/plugin',
        'Create a plugin skeleton that exports default Plugin object with:',
        '  - name: "babysitter"',
        '  - hooks placeholder for: session.created, session.idle, session.error, stop',
        '  - tools array placeholder',
        'Ensure the plugin follows OpenCode plugin conventions',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'scaffold']
}));

export const scaffoldToolsDirTask = defineTask('scaffold-tools-dir', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold .opencode/tools/ directory for babysitter CLI access',
  description: 'Create custom tool directory with babysitter CLI wrapper tool',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer creating OpenCode custom tools',
      task: 'Create a custom tool in .opencode/tools/ for babysitter CLI access',
      context: {
        projectDir: args.projectDir,
        existingToolsDir: args.existingToolsDir
      },
      instructions: [
        `Create directory: ${args.projectDir}/.opencode/tools/`,
        'Create babysitter-cli.ts tool that wraps babysitter CLI commands',
        'The tool should accept: command (string), args (array of strings)',
        'Supported commands: run:create, run:iterate, run:status, run:events,',
        '  task:post, task:list, task:show, session:init, session:check-iteration,',
        '  session:state, health, version',
        'Tool should use Bun shell ($) or child_process.execSync to invoke npx babysitter',
        'Return stdout/stderr and exit code',
        'Include proper error handling and timeout (NODE_TASK_TIMEOUT_MS)',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'scaffold']
}));

export const scaffoldOpencodeConfigTask = defineTask('scaffold-opencode-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure opencode.json with babysitter MCP tools',
  description: 'Update or create opencode.json to register babysitter plugin and MCP tools',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer configuring OpenCode for babysitter',
      task: 'Update or create opencode.json to register the babysitter plugin and MCP server',
      context: {
        projectDir: args.projectDir,
        existingConfig: args.existingConfig,
        hasOpencodeJson: args.hasOpencodeJson
      },
      instructions: [
        args.hasOpencodeJson
          ? 'Merge babysitter configuration into the existing opencode.json without overwriting existing settings'
          : `Create opencode.json at ${args.projectDir}/opencode.json`,
        'Register the babysitter plugin: plugins.babysitter = { path: ".opencode/plugins/babysitter" }',
        'Register babysitter MCP server in mcpServers section:',
        '  "babysitter": {',
        '    "command": "npx",',
        '    "args": ["babysitter", "mcp-serve"],',
        '    "env": { "BABYSITTER_RUNS_DIR": ".a5c/runs" }',
        '  }',
        'Add tool permissions for babysitter tools: babysitter_run_create, babysitter_run_iterate,',
        '  babysitter_task_post, babysitter_session_init, babysitter_session_check',
        'Set experimental.chat.system.transform if not already set',
        'Return list of created/modified files'
      ],
      outputFormat: 'JSON with filesCreated (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'scaffold', 'config']
}));

// --- Phase 3: Implement ---

export const implementPluginHooksTask = defineTask('implement-plugin-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement plugin hooks (session.created, session.idle, session.error)',
  description: 'Write the core plugin hook implementations for babysitter lifecycle',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer implementing OpenCode plugin hooks for babysitter',
      task: 'Implement the plugin hooks object with session.created, session.idle, session.error, and stop hook',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Edit the babysitter plugin entry point at .opencode/plugins/babysitter/index.ts',
        'Implement the following hooks:',
        '',
        'session.created:',
        '  - Generate babysitter session ID (opencode-<timestamp>-<random>)',
        '  - Run: npx babysitter session:init --session-id <id>',
        '  - Run: npx babysitter run:create --process-id <processId> --harness opencode --session-id <id> --plugin-root <pluginRoot> when native binding is available',
        '  - Only fall back to explicit association if OpenCode truly lacks a first-class harness binding path',
        '  - Store run ID and session state in plugin state',
        '',
        'session.idle:',
        '  - This is the orchestration loop driver',
        '  - Run: npx babysitter session:check-iteration --session-id <id> --run-id <runId>',
        '  - If shouldContinue: run npx babysitter run:iterate --run-id <runId>',
        '  - Parse iterate output for pending effects',
        '  - Build continuation prompt with pending task instructions',
        '  - Send prompt via client.session.prompt()',
        '  - If completed: set state.completed = true',
        '',
        'session.error:',
        '  - Log error to babysitter via: npx babysitter session:update --status error',
        '  - Clean up any pending state',
        '',
        'stop hook:',
        '  - Check if run is completed; if yes, allow stop',
        '  - If not completed, check iteration count against MAX_ITERATIONS',
        '  - If under limit, send continuation prompt to keep working',
        '  - If over limit, allow stop with warning',
        '',
        'Include proper TypeScript types and error handling',
        'Use CONFIG constants for all tunable values',
        'Return the main plugin file path as pluginEntryFile'
      ],
      outputFormat: 'JSON with filesCreated (array), pluginEntryFile (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'pluginEntryFile'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        pluginEntryFile: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'implement', 'hooks']
}));

export const registerMcpToolsTask = defineTask('register-mcp-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Register babysitter MCP tools via opencode.json',
  description: 'Configure MCP server and tool definitions for babysitter CLI access',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer registering MCP tools for babysitter in OpenCode',
      task: 'Register babysitter CLI commands as MCP tools accessible by the OpenCode agent',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Ensure opencode.json has the babysitter MCP server registered',
        'The MCP server exposes these tools to the agent:',
        '  - babysitter_run_status: Get current run status and pending effects',
        '  - babysitter_task_post: Post a task result back to the run',
        '  - babysitter_session_state: Get current session orchestration state',
        '  - babysitter_health: Check babysitter SDK health',
        'Each tool should have proper description and input schema',
        'Set tool permissions in opencode.json to auto-approve babysitter tools',
        'This avoids the agent needing user confirmation for orchestration commands',
        'Return list of created/modified files'
      ],
      outputFormat: 'JSON with filesCreated (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'implement', 'mcp']
}));

export const implementCustomToolTask = defineTask('implement-custom-tool', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create custom tool in .opencode/tools/ for babysitter CLI access',
  description: 'Implement a custom OpenCode tool that wraps babysitter CLI commands',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer building an OpenCode custom tool',
      task: 'Create a custom tool in .opencode/tools/ that gives the agent direct babysitter CLI access',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        `Write the tool at ${args.projectDir}/.opencode/tools/babysitter-cli.ts`,
        'Use the OpenCode tool() API to define the tool',
        'Tool name: "babysitter"',
        'Tool description: "Execute babysitter SDK CLI commands for orchestration"',
        'Tool parameters:',
        '  - command: string (required) - CLI command (e.g., "run:status", "task:post")',
        '  - args: string[] (optional) - Additional CLI arguments',
        '  - input: string (optional) - JSON input to pipe to stdin',
        'Implementation:',
        '  - Use Bun.spawn or child_process.execSync',
        '  - Invoke: npx babysitter <command> [args...]',
        '  - Set BABYSITTER_RUNS_DIR in env',
        '  - Capture stdout, stderr, exit code',
        '  - Parse JSON output if --json flag was included',
        '  - Return structured result',
        'Include timeout handling using NODE_TASK_TIMEOUT_MS',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'implement', 'custom-tool']
}));

export const implementIdleDriverTask = defineTask('implement-idle-driver', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement session.idle hook as orchestration loop driver',
  description: 'Use session.idle event to drive the babysitter orchestration loop',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer implementing the orchestration loop driver',
      task: 'Implement the session.idle hook to drive babysitter orchestration iterations',
      context: {
        projectDir: args.projectDir,
        pluginFile: args.pluginFile
      },
      instructions: [
        `Edit the plugin file at ${args.pluginFile}`,
        'The session.idle hook fires when the agent completes a turn',
        'Implementation:',
        '  1. Check if a babysitter run is active (state.runId is set)',
        '  2. Run session:check-iteration to see if more work is needed',
        '  3. If shouldContinue is true:',
        '     a. Increment state.iteration',
        '     b. Check runaway detection:',
        '        - Calculate elapsed since lastIterationTime',
        '        - If elapsed < MIN_ITERATION_INTERVAL_MS, increment fastIterationCount',
        '        - If fastIterationCount > MAX_FAST_ITERATIONS, halt with error',
        '     c. Run run:iterate to get pending effects',
        '     d. Build continuation prompt from pending effects',
        '     e. Send prompt via client.session.prompt()',
        '     f. Update lastIterationTime',
        '  4. If shouldContinue is false:',
        '     a. Set state.completed = true',
        '     b. Log completion',
        'Ensure proper error handling and state updates',
        'Return list of modified files'
      ],
      outputFormat: 'JSON with filesModified (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'implement', 'idle-driver']
}));

export const implementEffectMappingTask = defineTask('implement-effect-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map OpenCode tool execution to babysitter effect execution',
  description: 'Bridge OpenCode tool calls to babysitter effect resolution',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer mapping OpenCode tools to babysitter effects',
      task: 'Map OpenCode tool execution to babysitter effect execution within the plugin',
      context: {
        projectDir: args.projectDir,
        pluginFile: args.pluginFile
      },
      instructions: [
        `Edit the plugin file at ${args.pluginFile}`,
        'When babysitter emits pending effects (via run:iterate), each effect has:',
        '  - effectId, taskId, kind, title, description, and agent/skill/shell configuration',
        'Map effect kinds to OpenCode execution:',
        '  - kind=agent: Build a prompt from the agent config and send via client.session.prompt()',
        '  - kind=skill: Expand the matching installed skill through the plugin surface when available',
        '  - kind=shell: Execute the shell command via shell tool',
        '  - kind=breakpoint: Present to user via TUI toast or auto-resolve in CLI mode',
        '  - kind=sleep: Use setTimeout or schedule for later',
        '  - complex orchestration requests: delegate to a sub-session while keeping the public effect kind as agent or skill and preserving the canonical yield-and-resume contract',
        'After effect execution, write output.json and post via: npx babysitter task:post <runDir> <effectId> --status ok --value tasks/<effectId>/output.json',
        'Never write result.json directly',
        'Include tool.execute.after hook to capture tool results for effect mapping',
        'Return list of modified files'
      ],
      outputFormat: 'JSON with filesModified (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'implement', 'effect-mapping']
}));

export const implementResultPostingTask = defineTask('implement-result-posting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement result posting via plugin tool',
  description: 'Post task results back to babysitter run via task:post CLI',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer implementing result posting for babysitter',
      task: 'Implement the result posting mechanism that posts task results back to the babysitter run',
      context: {
        projectDir: args.projectDir,
        pluginFile: args.pluginFile
      },
      instructions: [
        `Edit the plugin file at ${args.pluginFile}`,
        'Create a postResult helper function that:',
        '  1. Takes effectId, result object, and optional metadata',
        '  2. Serializes the result to JSON',
          '  3. Writes the value payload to tasks/<effectId>/output.json',
          '  4. Invokes: npx babysitter task:post <runDir> <effectId> --status ok --value tasks/<effectId>/output.json',
          '  5. Handles errors: retry once on EBUSY/EPERM, fail on other errors',
          '  6. Logs the post result for debugging',
          'Also create a postFailure helper for when effect execution fails:',
          '  - Writes an error payload file and posts with --error <file>',
          'Never write result.json directly; the SDK owns that file',
        'Wire postResult into the effect mapping so results are automatically posted',
        'after each tool execution completes',
        'Return list of modified files'
      ],
      outputFormat: 'JSON with filesModified (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'implement', 'result-posting']
}));

export const implementDoomLoopHandlingTask = defineTask('implement-doom-loop-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add doom_loop permission handling',
  description: 'Implement runaway detection and doom loop prevention',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer implementing safety guards for babysitter orchestration',
      task: 'Implement doom loop detection and permission handling in the babysitter plugin',
      context: {
        projectDir: args.projectDir,
        pluginFile: args.pluginFile
      },
      instructions: [
        `Edit the plugin file at ${args.pluginFile}`,
        'Implement doom loop / runaway detection:',
        '',
        '1. Iteration count guard:',
        '   - Track iterations in session state',
        '   - If iteration >= MAX_ITERATIONS, halt and report',
        '',
        '2. Fast iteration detection:',
        '   - Track time between iterations',
        '   - If interval < MIN_ITERATION_INTERVAL_MS, increment fastIterationCount',
        '   - If fastIterationCount >= MAX_FAST_ITERATIONS, halt with doom_loop error',
        '   - Reset fastIterationCount when a normal-speed iteration occurs',
        '',
        '3. Permission handling:',
        '   - When doom_loop is detected, emit a breakpoint effect',
        '   - The breakpoint asks: "Runaway detected. Continue, abort, or increase limit?"',
        '   - If user approves continue: reset counters and resume',
        '   - If user approves abort: mark run as failed',
        '   - If user increases limit: update MAX_ITERATIONS in runtime config',
        '',
        '4. Logging:',
        '   - Log each iteration with: iteration number, elapsed time, pending effect count',
        '   - Log doom_loop detection with full state dump',
        '',
        'Return list of modified files'
      ],
      outputFormat: 'JSON with filesModified (array of string paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'implement', 'doom-loop']
}));

// --- Phase 4: Test ---

export const runIntegrationTestsTask = defineTask('run-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run integration tests for OpenCode babysitter plugin',
  description: 'Verify all integration files are syntactically valid and structurally correct',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior QA engineer testing an OpenCode plugin integration',
      task: 'Run integration tests against the babysitter OpenCode plugin',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles
      },
      instructions: [
        'For each integration file, verify:',
        '  1. File exists and is non-empty',
        '  2. TypeScript files parse without syntax errors (use tsc --noEmit or similar)',
        '  3. JSON files are valid JSON',
        '  4. opencode.json has required babysitter sections (plugins, mcpServers)',
        '  5. Plugin entry point exports a valid Plugin object',
        '  6. Custom tool exports a valid tool definition',
        '  7. All imports resolve (check for missing dependencies)',
        'Run: npx tsc --noEmit on the plugin directory if tsconfig exists',
        'Run: npx babysitter health to verify SDK is accessible',
        'Compile test results into a summary',
        'Return: total tests, passed count, failed count, failure details'
      ],
      outputFormat: 'JSON with total (number), passed (number), allPassed (boolean), failures (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'passed', 'allPassed'],
      properties: {
        total: { type: 'number' },
        passed: { type: 'number' },
        allPassed: { type: 'boolean' },
        failures: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'test']
}));

// --- Phase 5: Verify ---

export const verifyIntegrationTask = defineTask('verify-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify integration quality',
  description: 'Score the integration against quality criteria',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior QA engineer performing quality verification on a babysitter integration',
      task: 'Verify the OpenCode babysitter integration meets quality standards, including research fidelity, runtime installability, canonical skill adaptation, and user-yield continuation',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Score the integration on these criteria (each 0-10 points, total 100):',
        '',
        '1. Research and upstream install model (10): real distribution and hook points understood first',
        '2. Canonical babysit skill adaptation (10): important Claude Code behavior preserved',
        '3. Plugin structure (10): Correct directory layout, valid package.json, proper exports',
        '4. Hook completeness (10): All 4 hooks implemented (session.created, session.idle, session.error, stop)',
        '5. Orchestration loop (10): session.idle and stop handling preserve yield-to-user continuation',
        '6. Effect mapping (10): public effect kinds stay agent, skill, shell, breakpoint, or sleep',
        '7. Result posting (10): output.json plus task:post used correctly',
        '8. Install docs and operator readiness (10): install, upgrade, rollback, troubleshooting',
        '9. Error handling and doom loop handling (10): retries, state cleanup, configurable limits',
        '10. Runtime validation (10): real harness run proved beyond structural tests',
        '',
        'Provide per-criterion scores and overall quality score',
        'List any issues that need fixing',
        'Return qualityScore (0-100) and issues array'
      ],
      outputFormat: 'JSON with qualityScore (number), criteriaScores (object), issues (array of strings), recommendations (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'issues'],
      properties: {
        qualityScore: { type: 'number' },
        criteriaScores: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'verify']
}));

// --- Phase 6: Converge ---

export const convergenceFixTask = defineTask('convergence-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Convergence fix iteration ${args.iteration}`,
  description: `Fix issues to improve quality from ${args.currentQuality} toward ${args.targetQuality}`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer fixing quality issues in a babysitter integration',
      task: `Fix the identified issues to improve integration quality from ${args.currentQuality} to ${args.targetQuality} and remove stale contract drift`,
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        currentQuality: args.currentQuality,
        targetQuality: args.targetQuality,
        issues: args.issues,
        iteration: args.iteration
      },
      instructions: [
        `Current quality: ${args.currentQuality}/${args.targetQuality}`,
        `Iteration: ${args.iteration}`,
        'Fix the following issues in priority order:',
        ...(args.issues || []).map((issue, i) => `  ${i + 1}. ${issue}`),
        '',
        'Prioritize research, install-doc, canonical skill migration, and yield-loop gaps first.',
        'For each fix:',
        '  1. Identify the file and specific location',
        '  2. Apply the minimal change needed',
        '  3. Verify the fix does not break other parts',
        '  4. Document what was changed and why',
        '  5. Replace any stale direct result.json, node-effect, or fallback-first binding guidance if still present',
        '',
        'Return list of modified files and any new files created'
      ],
      outputFormat: 'JSON with filesModified (array), newFiles (array), fixesSummary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        newFiles: { type: 'array', items: { type: 'string' } },
        fixesSummary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'opencode', 'converge', `iteration-${args.iteration}`]
}));
