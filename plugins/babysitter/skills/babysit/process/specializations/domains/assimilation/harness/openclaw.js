/**
 * @process assimilation/harness/openclaw
 * @description Orchestrate babysitter SDK integration into OpenClaw with research-first use of the real plugin, capability, session, and hook surfaces. Prefer authoritative session and capability context over legacy hook-only bridging, with daemon-safe reentry after user yield.
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
 * OpenClaw Harness Integration Process
 *
 * Orchestrates the full integration of the babysitter SDK into an OpenClaw
 * Gateway instance. OpenClaw is a Node.js daemon for personal AI that routes
 * messages from multiple channels (WhatsApp, Telegram, Slack, etc.) through
 * isolated agent sessions backed by SQLite persistence.
 *
 * Phases:
 * 1. Analyze   - Audit existing OpenClaw setup and determine integration surface
 * 2. Scaffold  - Create npm plugin package structure with openclaw field
 * 3. Implement - Build lifecycle hooks, MCP tools, agent routing, result posting
 * 4. Test      - Validate each integration point end-to-end
 * 5. Verify    - Run quality checks against targetQuality threshold
 * 6. Converge  - Iteratively fix issues until quality target met or maxIterations reached
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Path to the OpenClaw project workspace
 * @param {number} inputs.targetQuality - Quality score threshold (0-100) to pass
 * @param {number} inputs.maxIterations - Maximum convergence iterations allowed
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with integration files and quality metrics
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
    harnessName: 'OpenClaw',
    upstreamSource: 'official OpenClaw package, plugin registry, and the canonical babysitter plugin repo',
    distributionTarget: 'OpenClaw plugin package, openclaw.json MCP tools, hooks, and runtime install path',
    loopModel: 'session-serialized daemon continuation using authoritative session or capability context, with agent_end or documented wait or resume callbacks owning reentry after user yield'
  });

  integrationFiles.push(...(researchResult.artifactsCreated || []));

  // ============================================================================
  // PHASE 1: ANALYZE
  // ============================================================================

  ctx.log('phase:analyze', 'Auditing existing OpenClaw setup and integration surface');

  const analysisResult = await ctx.task(analyzeOpenClawSetupTask, {
    projectDir
  });

  await ctx.breakpoint({
    question: `Review the OpenClaw integration analysis for "${projectDir}". Does the existing setup match expectations? Proceed with scaffolding?`,
    title: 'OpenClaw Analysis Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/analysis/openclaw-audit.md', format: 'markdown', label: 'OpenClaw Audit' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: SCAFFOLD
  // ============================================================================

  ctx.log('phase:scaffold', 'Creating npm plugin package structure');

  const [
    packageScaffoldResult,
    skillMdResult
  ] = await ctx.parallel.all([
    () => ctx.task(scaffoldPluginPackageTask, {
      projectDir,
      analysis: analysisResult
    }),
    () => ctx.task(createSkillMdTask, {
      projectDir,
      analysis: analysisResult
    })
  ]);

  integrationFiles.push(...packageScaffoldResult.filesCreated);
  integrationFiles.push(...skillMdResult.filesCreated);

  const assimilationResult = await ctx.task(adaptOriginalBabysitTask, {
    projectDir,
    harnessName: 'OpenClaw',
    upstreamSource: 'the canonical babysitter plugin repo and its babysit process library',
    research: researchResult
  });

  integrationFiles.push(...(assimilationResult.filesCreated || []), ...(assimilationResult.filesModified || []));

  // ============================================================================
  // PHASE 3: IMPLEMENT
  // ============================================================================

  ctx.log('phase:implement', 'Building lifecycle hooks, MCP tools, and daemon adapters');

  // 3a. Lifecycle hooks and MCP tools can be built in parallel
  const [
    lifecycleHooksResult,
    mcpToolsResult
  ] = await ctx.parallel.all([
    () => ctx.task(implementLifecycleHooksTask, {
      projectDir,
      analysis: analysisResult,
      scaffold: packageScaffoldResult
    }),
    () => ctx.task(registerMcpToolsTask, {
      projectDir,
      analysis: analysisResult,
      scaffold: packageScaffoldResult
    })
  ]);

  integrationFiles.push(...lifecycleHooksResult.filesCreated);
  integrationFiles.push(...mcpToolsResult.filesCreated);

  // 3b. Agent routing and result posting depend on hooks being in place
  const [
    agentRoutingResult,
    resultPostingResult
  ] = await ctx.parallel.all([
    () => ctx.task(mapAgentRoutingTask, {
      projectDir,
      analysis: analysisResult,
      hooks: lifecycleHooksResult
    }),
    () => ctx.task(implementResultPostingTask, {
      projectDir,
      analysis: analysisResult,
      hooks: lifecycleHooksResult
    })
  ]);

  integrationFiles.push(...agentRoutingResult.filesCreated);
  integrationFiles.push(...resultPostingResult.filesCreated);

  // 3c. Daemon-specific adapter (always-on, multi-channel considerations)
  const daemonAdapterResult = await ctx.task(implementDaemonAdapterTask, {
    projectDir,
    analysis: analysisResult,
    hooks: lifecycleHooksResult,
    routing: agentRoutingResult
  });

  integrationFiles.push(...daemonAdapterResult.filesCreated);

  const docsResult = await ctx.task(writeHarnessInstallDocsTask, {
    projectDir,
    harnessName: 'OpenClaw',
    research: researchResult,
    assimilation: assimilationResult
  });

  integrationFiles.push(...(docsResult.filesCreated || []), ...(docsResult.filesModified || []));

  await ctx.breakpoint({
    question: `Implementation phase complete. Review the integration files before testing. All lifecycle hooks, MCP tools, agent routing, result posting, and daemon adapter are in place.`,
    title: 'Implementation Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/implementation/summary.md', format: 'markdown', label: 'Implementation Summary' }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: TEST
  // ============================================================================

  ctx.log('phase:test', 'Validating each integration point end-to-end');

  const testResult = await ctx.task(runIntegrationTestsTask, {
    projectDir,
    integrationFiles,
    analysis: analysisResult
  });

  let runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
    projectDir,
    harnessName: 'OpenClaw',
    loopModel: 'session-serialized daemon continuation using authoritative session or capability context, with agent_end or documented wait or resume callbacks owning reentry after user yield',
    research: researchResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult
  });

  // ============================================================================
  // PHASE 5: VERIFY
  // ============================================================================

  ctx.log('phase:verify', 'Running quality checks against target threshold');

  let verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
    projectDir,
    harnessName: 'OpenClaw',
    research: researchResult,
    assimilation: assimilationResult,
    docs: docsResult,
    targetQuality,
    integrationFiles,
    localTestResult: testResult,
    runtimeValidation: runtimeValidationResult
  });

  currentQuality = verifyResult.qualityScore;
  iterations = 1;

  // ============================================================================
  // PHASE 6: CONVERGE
  // ============================================================================

  while (currentQuality < targetQuality && iterations < maxIterations) {
    ctx.log('phase:converge', `Iteration ${iterations + 1}: quality=${currentQuality}, target=${targetQuality}`);

    const fixResult = await ctx.task(refineHarnessAssimilationTask, {
      projectDir,
      harnessName: 'OpenClaw',
      iteration: iterations + 1,
      issues: verifyResult.issues,
      recommendations: verifyResult.recommendations,
      integrationFiles
    });

    integrationFiles.push(...(fixResult.filesCreated || []));

    // Re-test after fixes
    const reTestResult = await ctx.task(runIntegrationTestsTask, {
      projectDir,
      integrationFiles,
      analysis: analysisResult
    });

    // Re-verify quality
    runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
      projectDir,
      harnessName: 'OpenClaw',
      loopModel: 'session-serialized daemon continuation using authoritative session or capability context, with agent_end or documented wait or resume callbacks owning reentry after user yield',
      research: researchResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: reTestResult
    });

    const reVerifyResult = await ctx.task(verifyHarnessAssimilationTask, {
      projectDir,
      harnessName: 'OpenClaw',
      research: researchResult,
      assimilation: assimilationResult,
      docs: docsResult,
      targetQuality,
      integrationFiles,
      localTestResult: reTestResult,
      runtimeValidation: runtimeValidationResult
    });

    verifyResult = reVerifyResult;
    currentQuality = reVerifyResult.qualityScore;
    iterations++;

    if (currentQuality < targetQuality && iterations >= maxIterations) {
      await ctx.breakpoint({
        question: `Convergence reached ${maxIterations} iterations but quality (${currentQuality}) is below target (${targetQuality}). Continue with additional iterations or accept current state?`,
        title: 'Convergence Limit Reached',
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/convergence/status.md', format: 'markdown', label: 'Convergence Status' }
          ]
        }
      });
    }
  }

  ctx.log('phase:complete', `Integration complete: quality=${currentQuality}, iterations=${iterations}`);

  // Deduplicate integration files
  const uniqueFiles = [...new Set(integrationFiles)];

  return {
    success: currentQuality >= targetQuality,
    integrationFiles: uniqueFiles,
    finalQuality: currentQuality,
    iterations,
    phases: ['analyze', 'scaffold', 'implement', 'test', 'verify', 'converge'],
    artifacts: {
      analysis: 'artifacts/analysis/openclaw-audit.md',
      implementation: 'artifacts/implementation/summary.md',
      tests: 'artifacts/tests/results.json',
      convergence: 'artifacts/convergence/status.md'
    },
    metadata: {
      processId: 'assimilation/harness/openclaw',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Analyze OpenClaw Setup Task
 * Audit the existing OpenClaw installation, gateway version, plugin registry,
 * and determine the integration surface area.
 */
export const analyzeOpenClawSetupTask = defineTask('analyze-openclaw-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze OpenClaw setup: ${args.projectDir}`,
  description: 'Audit OpenClaw gateway, plugin registry, session manager, and channel configuration',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer with deep knowledge of OpenClaw and babysitter SDK',
      task: 'Audit the existing OpenClaw installation and determine the integration surface for babysitter SDK',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        'Record the installed OpenClaw and Node.js versions, then confirm required minimums from the current upstream docs instead of assuming older thresholds',
        'Inspect existing plugin registry for conflicts',
        'Identify session manager configuration (SQLite path, per-agent isolation)',
        'Map channel router configuration (WhatsApp, Telegram, Slack, etc.)',
        'Check for existing hooks or capabilities that may conflict with before_agent_start, agent_end, agent.wait, or session-scoped continuation surfaces',
        'Verify file system access to workspace for .a5c/runs/ and session state',
        'Check whether capability registration, agent.wait, session keys, or equivalent authoritative per-session context surfaces are available and preferred over legacy hook-only flow',
        'Check if tool_result_persist hook is available and whether it is authoritative or only advisory',
        'Document the OpenClawPluginApi surface: registerHook, registerCommand, registerService, registerGatewayMethod, capability registration, and any session APIs',
        'Generate an audit report as openclaw-audit.md'
      ],
      outputFormat: 'JSON with gatewayVersion (string), nodeVersion (string), existingPlugins (array), channels (array), conflicts (array), capabilities (object), auditMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['gatewayVersion', 'existingPlugins', 'capabilities', 'auditMarkdown'],
      properties: {
        gatewayVersion: { type: 'string' },
        nodeVersion: { type: 'string' },
        existingPlugins: { type: 'array', items: { type: 'string' } },
        channels: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'string' } },
        capabilities: {
          type: 'object',
          properties: {
            hasToolResultPersist: { type: 'boolean' },
            hasSessionsSend: { type: 'boolean' },
            hasSessionsSpawn: { type: 'boolean' },
            fileSystemAccess: { type: 'boolean' }
          }
        },
        auditMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'analysis']
}));

/**
 * Scaffold Plugin Package Task
 * Create the npm plugin package with openclaw field in package.json,
 * entry point, and directory structure.
 */
export const scaffoldPluginPackageTask = defineTask('scaffold-plugin-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold babysitter OpenClaw plugin package',
  description: 'Create npm package with openclaw field, entry point, and directory structure',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Node.js engineer specializing in OpenClaw plugin development',
      task: 'Create a complete npm plugin package for babysitter SDK integration into OpenClaw',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create package.json with openclaw field containing plugin metadata',
        'Set up entry point (index.js) that exports the plugin activation function',
        'The activation function receives OpenClawPluginApi and registers hooks/commands/services',
        'Include @a5c-ai/babysitter-sdk as a dependency',
        'Create directory structure: src/, src/hooks/, src/tools/, src/adapters/',
        'Add openclaw.json manifest for MCP tool registration',
        'Include proper npm scripts for build, test, lint',
        'Return list of all files created'
      ],
      outputFormat: 'JSON with filesCreated (array), packageJson (object), entryPoint (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'packageJson', 'entryPoint'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        packageJson: { type: 'object' },
        entryPoint: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'scaffold']
}));

/**
 * Create SKILL.md Task
 * Generate the SKILL.md file for babysitter orchestration within OpenClaw.
 */
export const createSkillMdTask = defineTask('create-skill-md', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create SKILL.md for babysitter orchestration',
  description: 'Generate SKILL.md defining the babysit skill for OpenClaw agents',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer with deep knowledge of babysitter SDK and OpenClaw agent patterns',
      task: 'Create a SKILL.md file that defines how OpenClaw agents invoke babysitter orchestration',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Define the skill name, description, and trigger conditions',
        'Document input schema for process invocation',
        'Explain the orchestration loop: harness-native run:create binding -> iterate -> execute -> post -> yield -> harness-driven reentry',
        'Explain which runtime surface actually owns reentry for the researched deployment: capability callback, agent_end, agent.wait, or another documented session callback',
        'Document explicit session association only as a secondary external recovery path, not the primary contract',
        'Make clear that before_agent_start is initialization or compatibility glue only when richer session context already exists',
        'Describe how breakpoints surface to the user via channel messages',
        'Include examples for common use cases (code review, project planning, etc.)',
        'Document daemon-specific behavior (always-on, multi-channel routing)',
        'Return the SKILL.md content and file path'
      ],
      outputFormat: 'JSON with filesCreated (array), skillContent (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'skillContent'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        skillContent: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'scaffold', 'skill']
}));

/**
 * Implement Lifecycle Hooks Task
 * Build the before_agent_start and agent_end hooks that drive the
 * babysitter orchestration loop within OpenClaw.
 */
export const implementLifecycleHooksTask = defineTask('implement-lifecycle-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OpenClaw lifecycle hooks',
  description: 'Build before_agent_start and agent_end hooks for babysitter orchestration',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer building the orchestration bridge between OpenClaw and babysitter SDK',
      task: 'Implement the lifecycle hooks that drive babysitter orchestration within the OpenClaw daemon',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        scaffold: args.scaffold
      },
      instructions: [
        'Prefer the strongest researched control plane in this order: capability registration and session APIs, authoritative wait or resume callbacks, agent_end, and before_agent_start compatibility glue last',
        'Implement before_agent_start only for initialization or migration compatibility:',
        '  - Initialize babysitter session state when the session does not already expose authoritative run context',
        '  - Check for existing active runs and resume if needed',
        '  - Do not use before_agent_start as a fake bridge just to pass identity to later callbacks if the later callback already includes a session key or context object',
        'Implement the researched continuation owner (agent_end, agent.wait, or equivalent):',
        '  - After agent completes a turn or resumes from wait, evaluate run state (session:check-iteration)',
        '  - If run is incomplete: call run:iterate, extract pending effects, execute them',
        '  - If effects need agent work: re-inject context via the documented session messaging surface',
        '  - If run is complete with proof matched: allow session to end, cleanup state',
        'Persist run-to-session mapping from authoritative session keys or capability payloads at creation time instead of rebuilding identity from hook order assumptions',
        'Implement tool_result_persist only if it is a real supported surface for proof scanning; otherwise scan the authoritative turn transcript or agent_end payload',
        'Handle errors gracefully with retry logic and cleanup',
        'Return list of created files'
      ],
      outputFormat: 'JSON with filesCreated (array), hooksRegistered (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'hooksRegistered'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        hooksRegistered: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'implement', 'hooks']
}));

/**
 * Register MCP Tools Task
 * Register babysitter MCP tools in openclaw.json so they are available
 * to agents within OpenClaw sessions.
 */
export const registerMcpToolsTask = defineTask('register-mcp-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Register babysitter MCP tools in openclaw.json',
  description: 'Configure MCP tool definitions for babysitter CLI commands in the OpenClaw manifest',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior engineer with expertise in MCP tool registration and OpenClaw plugin manifests',
      task: 'Register babysitter SDK MCP tools in the openclaw.json manifest',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        scaffold: args.scaffold
      },
      instructions: [
        'Create or update openclaw.json with babysitter MCP tool definitions',
        'Register tools for: run:create, run:iterate, run:status, task:list, task:post, task:show',
        'Register tools for: session:init, session:check-iteration',
        'Prefer harness-native run:create binding and document explicit session association only as a secondary recovery path when a native binding surface is genuinely absent',
        'When OpenClaw already exposes capability or session APIs for orchestration, treat MCP tools as agent-facing helpers rather than the sole control plane',
        'Define input schemas for each tool matching babysitter CLI argument formats',
        'Set appropriate sandbox permissions for file system access (.a5c/runs/)',
        'Include the researched session messaging primitive for orchestration re-injection only if it is a supported public surface',
        'Return list of tools registered and files created/modified'
      ],
      outputFormat: 'JSON with filesCreated (array), toolsRegistered (array), manifest (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'toolsRegistered'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        toolsRegistered: { type: 'array', items: { type: 'string' } },
        manifest: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'implement', 'mcp-tools']
}));

/**
 * Map Agent Routing Task
 * Map OpenClaw agent routing to babysitter effect execution so that
 * pending effects are dispatched to the correct agent session.
 */
export const mapAgentRoutingTask = defineTask('map-agent-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map OpenClaw agent routing to effect execution',
  description: 'Bridge OpenClaw channel routing with babysitter effect dispatch',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior architect bridging OpenClaw multi-channel agent routing with babysitter effect execution',
      task: 'Implement the mapping from OpenClaw agent sessions to babysitter effect execution',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        hooks: args.hooks
      },
      instructions: [
        'Map agent task effects to OpenClaw agent sessions via sessions_send or sessions_spawn',
        'Handle multi-channel routing: effects may originate from WhatsApp, Telegram, Slack, etc.',
        'Ensure session isolation: each agent session maps to one babysitter run at a time',
        'Implement effect-type routing: agent tasks -> agent session, shell tasks -> direct execution, and keep complex local execution under agent or shell semantics rather than inventing public node effects',
        'Handle breakpoint effects: surface as channel messages, await user response',
        'Handle sleep effects: use daemon scheduling (setTimeout or cron) since OpenClaw is always-on',
        'Handle parallel effects: dispatch multiple agent sessions concurrently',
        'Handle complex orchestration effects by delegating to sub-agents via sessions_spawn while keeping the public effect kind as agent or skill',
        'Return created files and routing table'
      ],
      outputFormat: 'JSON with filesCreated (array), routingTable (object), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'routingTable'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        routingTable: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'implement', 'routing']
}));

/**
 * Implement Result Posting Task
 * Build the result posting mechanism that writes task results back
 * to the babysitter journal via the plugin API.
 */
export const implementResultPostingTask = defineTask('implement-result-posting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement result posting via plugin API',
  description: 'Build mechanism to post task results back to babysitter journal',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior engineer implementing the result-posting bridge between OpenClaw agents and babysitter SDK',
      task: 'Implement the mechanism for posting task results from OpenClaw agent sessions back to the babysitter run journal',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        hooks: args.hooks
      },
      instructions: [
        'Implement result posting using babysitter task:post CLI command',
        'Parse agent output from tool_result_persist hook or agent_end payload',
        'Write output.json to the correct tasks/<effectId>/ directory',
        'Call task:post with --status ok/fail and --value pointing to output.json',
        'Handle large results (>1 MiB) by storing as blobs per SDK protocol',
        'Implement retry logic for transient failures (EBUSY, lock contention)',
        'Handle concurrent result posting from parallel agent sessions',
        'Never write result.json directly; the SDK owns that file',
        'Validate result schema before posting',
        'Return created files'
      ],
      outputFormat: 'JSON with filesCreated (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'implement', 'result-posting']
}));

/**
 * Implement Daemon Adapter Task
 * Handle daemon-specific considerations: always-on process, multi-channel
 * message routing, session persistence across restarts, and graceful shutdown.
 */
export const implementDaemonAdapterTask = defineTask('implement-daemon-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement daemon-specific adapter',
  description: 'Handle always-on, multi-channel, and daemon lifecycle considerations',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior systems engineer with expertise in daemon processes and OpenClaw gateway internals',
      task: 'Implement the daemon-specific adapter that handles OpenClaw always-on and multi-channel concerns',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        hooks: args.hooks,
        routing: args.routing
      },
      instructions: [
        'Handle always-on daemon lifecycle: graceful startup, shutdown, restart recovery',
        'Implement run resumption after daemon restart using the strongest researched startup or resume surface, with before_agent_start used only if it is the real public restart hook in this deployment',
        'Handle multi-channel considerations: same user across WhatsApp + Telegram should share context',
        'Implement session-to-run mapping persistence in SQLite alongside OpenClaw session state',
        'Handle concurrent sessions: multiple users running babysitter processes simultaneously',
        'Implement lock contention handling for shared .a5c/runs/ directory',
        'Add health check integration via api.registerService for monitoring',
        'Handle memory management: cleanup completed run state from in-memory caches',
        'Implement graceful degradation when babysitter SDK is unavailable',
        'Return created files'
      ],
      outputFormat: 'JSON with filesCreated (array), services (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        services: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'implement', 'daemon']
}));

/**
 * Run Integration Tests Task
 * Execute end-to-end tests validating each integration point.
 */
export const runIntegrationTestsTask = defineTask('run-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run OpenClaw integration tests',
  description: 'Validate each integration point end-to-end',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior QA engineer with expertise in integration testing for daemon-based systems',
      task: 'Run comprehensive integration tests for the babysitter-OpenClaw integration, including runtime install, canonical skill adaptation, and user-yield continuation',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        analysis: args.analysis
      },
      instructions: [
        'Test plugin activation: verify package loads and hooks register correctly',
        'Test runtime install and sync: verify the plugin can be installed or refreshed from the upstream source and that canonical babysit assets are present',
        'Test initialization path: verify authoritative session or capability context is captured without relying on a startup bridge when the host already provides identity',
        'Test the researched continuation path (agent_end, agent.wait, or equivalent): verify orchestration loop driver evaluates run state correctly',
        'Test MCP tool registration: verify all babysitter tools appear in openclaw.json',
        'Test run lifecycle: create -> iterate -> execute effect -> post result -> yield -> harness-driven reentry -> complete',
        'Test breakpoint surfacing: verify breakpoints appear as channel messages',
        'Test multi-channel routing: verify effects dispatch to correct agent sessions',
        'Test daemon restart recovery: verify incomplete runs resume after restart',
        'Test concurrent sessions: verify multiple simultaneous runs do not conflict',
        'Test channels or execution modes where agent_end is skipped or delayed and verify the documented fallback continuation surface still keeps babysitter in the loop',
        'Test error handling: verify graceful degradation on SDK unavailability',
        'Generate test results report'
      ],
      outputFormat: 'JSON with passed (number), failed (number), skipped (number), testResults (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'failed', 'testResults'],
      properties: {
        passed: { type: 'number' },
        failed: { type: 'number' },
        skipped: { type: 'number' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
              duration: { type: 'number' },
              error: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'test']
}));

/**
 * Verify Integration Quality Task
 * Run quality checks and produce a score against the targetQuality threshold.
 */
export const verifyIntegrationQualityTask = defineTask('verify-integration-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify integration quality',
  description: 'Run quality checks and score against target threshold',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior quality engineer assessing integration completeness and correctness',
      task: 'Verify the babysitter-OpenClaw integration quality and produce a score, including research fidelity, runtime installability, and user-yield continuation strength',
      context: {
        projectDir: args.projectDir,
        targetQuality: args.targetQuality,
        testResult: args.testResult,
        integrationFiles: args.integrationFiles
      },
      instructions: [
        'Score the integration across these dimensions (each 0-100):',
        '  - Research and upstream install fidelity',
        '  - Canonical babysit skill adaptation quality',
        '  - Correctness: test pass rate and protocol compliance',
        '  - Runtime robustness: daemon restart recovery, concurrent session handling, lock contention, authoritative session mapping, and user-yield continuation',
        '  - Documentation and operator readiness: SKILL.md, README, install, upgrade, rollback',
        '  - Code quality: no any types, proper error handling, no floating promises',
        'Compute weighted average as overall quality score',
        'Identify specific issues preventing higher quality',
        'Provide actionable recommendations for improvement'
      ],
      outputFormat: 'JSON with qualityScore (number), dimensions (object), issues (array), recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'dimensions', 'issues'],
      properties: {
        qualityScore: { type: 'number' },
        dimensions: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            correctness: { type: 'number' },
            robustness: { type: 'number' },
            documentation: { type: 'number' },
            codeQuality: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              description: { type: 'string' },
              file: { type: 'string' },
              recommendation: { type: 'string' }
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

  labels: ['agent', 'assimilation', 'openclaw', 'verify']
}));

/**
 * Convergence Fix Task
 * Fix issues identified during verification to improve quality score.
 */
export const convergenceFixTask = defineTask('convergence-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Convergence fix iteration ${args.iteration}`,
  description: 'Fix identified issues to improve integration quality',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior engineer performing targeted fixes to improve integration quality',
      task: 'Fix the identified issues from the previous verification to improve the quality score and remove stale contract drift',
      context: {
        projectDir: args.projectDir,
        iteration: args.iteration,
        issues: args.issues,
        verifyResult: args.verifyResult
      },
      instructions: [
        'Review each issue from the verification report',
        'Prioritize: fix research, install-doc, canonical skill, and user-yield continuation issues first; then critical, major, minor',
        'Apply targeted fixes to the specific files identified',
        'Do not introduce new issues while fixing existing ones',
        'Add or improve tests for each fix',
        'Replace any stale direct result.json, fallback-first session binding, or non-agent public effect guidance that remains',
        'Document what was fixed and why',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), fixesSummary (array), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'fixesSummary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        fixesSummary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              fix: { type: 'string' },
              file: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'openclaw', 'converge']
}));
