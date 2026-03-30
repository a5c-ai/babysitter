/**
 * @process assimilation/harness/antigravity
 * @description Orchestrate babysitter SDK integration into Google Antigravity by researching the real skill, workflow, rule, and MCP surfaces first, then adapting the canonical babysit contract onto those host-native entry points without inventing unsupported extension layers.
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
 * Antigravity Harness Integration Process
 *
 * Phases: Analyze -> Scaffold -> Implement -> Test -> Verify -> Converge
 *
 * Integrates the babysitter SDK orchestration loop into Google Antigravity's
 * agent-first IDE by producing all required extension artifacts:
 *   - SKILL.md with scripts/ and references/
 *   - MCP server config for babysitter CLI tools
 *   - Rule for orchestration discipline
 *   - Workflow for the researched /babysit command entry point
 *   - Multi-agent dispatch mapping for parallel effect execution
 *   - Artifact-based breakpoint review
 *   - Browser integration for e2e quality gates
 *   - Model-agnostic execution (Gemini, Claude, GPT)
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Root directory of the target Antigravity project
 * @param {number} inputs.targetQuality - Minimum quality score to pass (0-100)
 * @param {number} inputs.maxIterations - Maximum convergence iterations
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Integration result with file manifest and quality score
 */
export async function process(inputs, ctx) {
  const {
    projectDir,
    targetQuality = 80,
    maxIterations = 5
  } = inputs;

  const integrationFiles = [];

  const researchResult = await ctx.task(runHarnessResearchTask, {
    projectDir,
    harnessName: 'Google Antigravity',
    upstreamSource: 'official Antigravity distribution model plus the canonical babysitter plugin repo',
    distributionTarget: 'Antigravity skills, workflows, rules, MCP config, and runtime install path',
    loopModel: 'workflow-driven orchestration with explicit user-yield and resume discipline'
  });

  integrationFiles.push(...(researchResult.artifactsCreated || []));

  // ============================================================================
  // PHASE 1: ANALYZE
  // Inspect the target project to understand existing Antigravity configuration,
  // installed extensions, and model preferences.
  // ============================================================================

  ctx.log('Phase 1: Analyzing target Antigravity project');

  const analysis = await ctx.task(analyzeProjectTask, {
    projectDir
  });

  ctx.log(`Analysis complete: ${analysis.existingSkills.length} existing skills, model=${analysis.preferredModel}`);

  // ============================================================================
  // PHASE 2: SCAFFOLD
  // Create directory structure and generate all integration files in parallel.
  // Independent artifacts (Skill, MCP config, Rule, Workflow) can be scaffolded
  // concurrently since they do not depend on each other.
  // ============================================================================

  ctx.log('Phase 2: Scaffolding integration artifacts');

  const [skillResult, mcpResult, ruleResult, workflowResult] = await ctx.parallel.all([
    // 2a. Create babysitter SKILL.md with scripts/ and references/
    async () => ctx.task(scaffoldSkillTask, {
      projectDir,
      analysis
    }),

    // 2b. Configure MCP server (mcp_config.json) for babysitter CLI tools
    async () => ctx.task(scaffoldMcpConfigTask, {
      projectDir,
      analysis
    }),

    // 2c. Create Rule for babysitter orchestration constraints
    async () => ctx.task(scaffoldRuleTask, {
      projectDir,
      analysis
    }),

    // 2d. Implement Workflow for /babysit command
    async () => ctx.task(scaffoldWorkflowTask, {
      projectDir,
      analysis
    })
  ]);

  integrationFiles.push(...skillResult.filesCreated);
  integrationFiles.push(...mcpResult.filesCreated);
  integrationFiles.push(...ruleResult.filesCreated);
  integrationFiles.push(...workflowResult.filesCreated);

  const assimilationResult = await ctx.task(adaptOriginalBabysitTask, {
    projectDir,
    harnessName: 'Google Antigravity',
    upstreamSource: 'the canonical babysitter plugin repo and its babysit process library',
    research: researchResult
  });

  integrationFiles.push(...(assimilationResult.filesCreated || []), ...(assimilationResult.filesModified || []));

  // ============================================================================
  // PHASE 3: IMPLEMENT
  // Wire up multi-agent dispatch, artifact-based breakpoints, browser e2e gates,
  // and model-agnostic execution. These depend on the scaffold phase outputs.
  // ============================================================================

  ctx.log('Phase 3: Implementing orchestration wiring');

  const [dispatchResult, breakpointResult, browserResult, modelResult] = await ctx.parallel.all([
    // 3e. Map multi-agent dispatch to parallel effect execution
    async () => ctx.task(implementMultiAgentDispatchTask, {
      projectDir,
      analysis,
      skillResult
    }),

    // 3f. Use artifact system for breakpoint review
    async () => ctx.task(implementBreakpointArtifactsTask, {
      projectDir,
      analysis,
      skillResult
    }),

    // 3g. Leverage browser integration for e2e quality gates
    async () => ctx.task(implementBrowserGatesTask, {
      projectDir,
      analysis
    }),

    // 3h. Handle model-agnostic execution (Gemini, Claude, GPT)
    async () => ctx.task(implementModelAgnosticTask, {
      projectDir,
      analysis,
      preferredModel: analysis.preferredModel
    })
  ]);

  integrationFiles.push(...dispatchResult.filesCreated);
  integrationFiles.push(...breakpointResult.filesCreated);
  integrationFiles.push(...browserResult.filesCreated);
  integrationFiles.push(...modelResult.filesCreated);

  const docsResult = await ctx.task(writeHarnessInstallDocsTask, {
    projectDir,
    harnessName: 'Google Antigravity',
    research: researchResult,
    assimilation: assimilationResult
  });

  integrationFiles.push(...(docsResult.filesCreated || []), ...(docsResult.filesModified || []));

  // ============================================================================
  // PHASE 4: TEST
  // Run validation on each generated artifact to ensure correctness.
  // ============================================================================

  ctx.log('Phase 4: Testing integration artifacts');

  const testResult = await ctx.task(testIntegrationTask, {
    projectDir,
    integrationFiles,
    analysis
  });

  let runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
    projectDir,
    harnessName: 'Google Antigravity',
    loopModel: 'workflow-driven orchestration with explicit user-yield and resume discipline',
    research: researchResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult
  });

  if (!testResult.allPassed) {
    await ctx.breakpoint({
      question: `Integration tests found ${testResult.failures.length} issue(s). Review failures and decide whether to fix and retry or accept current state.`,
      title: 'Integration Test Failures',
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/antigravity-test-report.md`, format: 'markdown', label: 'Test Report' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 5: VERIFY
  // End-to-end verification: start a babysitter run through Antigravity's
  // extension layer and confirm the full orchestration loop executes.
  // ============================================================================

  ctx.log('Phase 5: Verifying end-to-end orchestration loop');

  let verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
    projectDir,
    harnessName: 'Google Antigravity',
    research: researchResult,
    assimilation: assimilationResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult,
    runtimeValidation: runtimeValidationResult,
    targetQuality
  });

  // ============================================================================
  // PHASE 6: CONVERGE
  // Iterative quality improvement until targetQuality is met or maxIterations
  // is exhausted.
  // ============================================================================

  ctx.log('Phase 6: Converging on quality target');

  let iteration = 0;
  let quality = verifyResult.qualityScore;
  let converged = quality >= targetQuality;

  while (!converged && iteration < maxIterations) {
    iteration++;

    ctx.log(`Convergence iteration ${iteration}: quality=${quality}, target=${targetQuality}`);

    const scoreResult = await ctx.task(verifyHarnessAssimilationTask, {
      projectDir,
      harnessName: 'Google Antigravity',
      research: researchResult,
      assimilation: assimilationResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: testResult,
      runtimeValidation: runtimeValidationResult,
      targetQuality,
      iteration
    });

    quality = scoreResult.qualityScore;
    converged = quality >= targetQuality;

    if (!converged && iteration < maxIterations) {
      const fixResult = await ctx.task(refineHarnessAssimilationTask, {
        projectDir,
        harnessName: 'Google Antigravity',
        integrationFiles,
        issues: scoreResult.issues,
        recommendations: scoreResult.recommendations,
        iteration
      });

      integrationFiles.push(...(fixResult.filesCreated || []), ...(fixResult.filesModified || []));
      runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
        projectDir,
        harnessName: 'Google Antigravity',
        loopModel: 'workflow-driven orchestration with explicit user-yield and resume discipline',
        research: researchResult,
        docs: docsResult,
        integrationFiles,
        localTestResult: testResult
      });
      verifyResult = scoreResult;

      await ctx.breakpoint({
        question: `Iteration ${iteration}/${maxIterations}: Quality ${quality}/${targetQuality}. Continue converging or accept current state?`,
        title: `Convergence Iteration ${iteration}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/convergence-iteration-${iteration}.md`, format: 'markdown', label: `Iteration ${iteration} Report` }
          ]
        }
      });
    }
  }

  // ============================================================================
  // RETURN RESULT
  // ============================================================================

  const uniqueFiles = [...new Set(integrationFiles)];

  return {
    success: converged,
    integrationFiles: uniqueFiles,
    finalQuality: quality,
    iterations: iteration,
    converged,
    projectDir,
    targetQuality,
    phases: {
      analyze: { status: 'completed', existingSkills: analysis.existingSkills.length },
      scaffold: { status: 'completed', filesCreated: skillResult.filesCreated.length + mcpResult.filesCreated.length + ruleResult.filesCreated.length + workflowResult.filesCreated.length },
      implement: { status: 'completed', filesCreated: dispatchResult.filesCreated.length + breakpointResult.filesCreated.length + browserResult.filesCreated.length + modelResult.filesCreated.length },
      test: { status: 'completed', allPassed: testResult.allPassed, failures: testResult.failures.length },
      verify: { status: 'completed', qualityScore: verifyResult.qualityScore },
      converge: { status: converged ? 'converged' : 'exhausted', finalQuality: quality, iterations: iteration }
    },
    metadata: {
      processId: 'assimilation/harness/antigravity',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// --- Phase 1: Analyze ---

export const analyzeProjectTask = defineTask('analyze-project', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Antigravity project structure',
  description: 'Inspect existing Antigravity extensions, model config, and project layout',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'integration architect specializing in Google Antigravity',
      task: 'Analyze the target project to determine existing Antigravity configuration, installed skills, rules, workflows, MCP servers, and preferred model backend',
      context: {
        projectDir: args.projectDir
      },
      instructions: [
        'Determine the actual Antigravity repo-local paths for skills, workflows, rules, and command definitions instead of assuming one fixed directory layout',
        'Check for any existing skill directories and list existing skills',
        'Check for the real rules or workflow directories and list existing rule or workflow files',
        'Check for mcp_config.json, mcp_servers.json, or any current Antigravity MCP config path',
        'Identify preferred model from Antigravity config (Gemini, Claude, GPT, etc.)',
        'Check if babysitter SDK is already installed (npm ls @a5c-ai/babysitter-sdk)',
        'Identify project type (language, framework, package manager)',
        'Check for existing .a5c/ directory from prior babysitter usage',
        'Document which Antigravity surface actually resumes the loop after user yield: workflow rerun, command entry, rule-governed follow-up, or another researched mechanism',
        'Return structured analysis of the project state'
      ],
      outputFormat: 'JSON with existingSkills (array), existingRules (array), mcpConfig (object|null), preferredModel (string), sdkInstalled (boolean), projectType (object), hasPriorBabysitter (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['existingSkills', 'preferredModel', 'sdkInstalled'],
      properties: {
        existingSkills: { type: 'array', items: { type: 'string' } },
        existingRules: { type: 'array', items: { type: 'string' } },
        mcpConfig: { type: 'object' },
        preferredModel: { type: 'string' },
        sdkInstalled: { type: 'boolean' },
        projectType: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            framework: { type: 'string' },
            packageManager: { type: 'string' }
          }
        },
        hasPriorBabysitter: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'analyze']
}));

// --- Phase 2: Scaffold ---

export const scaffoldSkillTask = defineTask('scaffold-skill', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create babysitter SKILL.md with scripts/ and references/',
  description: 'Generate the babysitter skill directory for Antigravity progressive disclosure',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Antigravity skill author with babysitter SDK expertise',
      task: 'Create the babysitter orchestration skill for Antigravity including SKILL.md, helper scripts, and reference documents',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create the babysitter SKILL.md under the actual skill directory discovered during analysis rather than assuming .agent/skills blindly',
        'Include full orchestration loop instructions in SKILL.md',
        'Create scripts/install.sh to install or sync the babysitter runtime using the researched operator path from the canonical repo, not a global-only shortcut',
        'Create scripts/iterate.sh to drive one orchestration iteration',
        'Create scripts/check-status.sh to verify run state and guard against runaway loops',
        'Create references/effect-kinds.md documenting agent, skill, shell, breakpoint, and sleep effects and explicitly rejecting node effects',
        'Create references/completion-proof.md explaining the SHA-256 completion secret protocol',
        'Ensure SKILL.md references the MCP server tools by name',
        'Include session state management instructions in SKILL.md',
        'Return list of all files created'
      ],
      outputFormat: 'JSON with filesCreated (array), skillManifest (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        skillManifest: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'scaffold', 'skill']
}));

export const scaffoldMcpConfigTask = defineTask('scaffold-mcp-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure MCP server for babysitter CLI tools',
  description: 'Generate mcp_config.json with babysitter CLI as stdio MCP server',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MCP server configuration specialist',
      task: 'Create or update mcp_config.json to register the babysitter CLI as an MCP server with stdio transport',
      context: {
        projectDir: args.projectDir,
        existingMcpConfig: args.analysis.mcpConfig
      },
      instructions: [
        'Create or merge into the real Antigravity MCP config path discovered during analysis',
        'Register babysitter as stdio MCP server: command=babysitter, transport=stdio',
        'Expose tools: run:create, run:iterate, run:status, run:events, task:list, task:post, task:show, session:init, session:resume, session:state, session:check-iteration, health, version',
        'Prefer harness-native run:create binding and, if that is missing, document the SDK or CLI gap plus a secondary external association workflow instead of presenting association as the default path',
        'Set --runs-dir flag to .a5c/runs for consistency',
        'Preserve any existing MCP server entries',
        'Include environment variable passthrough for BABYSITTER_* vars',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with filesCreated (array), mcpServerEntry (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        mcpServerEntry: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'scaffold', 'mcp']
}));

export const scaffoldRuleTask = defineTask('scaffold-rule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Rule for babysitter orchestration constraints',
  description: 'Generate .agents/babysitter-loop.md rule enforcing loop discipline',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Antigravity rule designer with orchestration expertise',
      task: 'Create .agents/babysitter-loop.md rule that enforces babysitter orchestration discipline',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create the babysitter orchestration rule in the actual Antigravity rule location discovered during analysis',
        'Rule MUST prevent agent from declaring task complete without completion proof',
        'Rule MUST enforce iterate -> execute -> post -> repeat cycle',
        'Rule MUST require checking run:status before exiting a babysitter session',
        'Rule MUST require echoing completionSecret in <promise> tags when run completes',
        'Rule should warn against skipping iterations or posting fake results',
        'Rule should enforce maximum iteration guard (check session:check-iteration)',
        'Keep rule concise - Antigravity rules are injected into system prompt',
        'Return list of files created'
      ],
      outputFormat: 'JSON with filesCreated (array), ruleContent (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        ruleContent: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'scaffold', 'rule']
}));

export const scaffoldWorkflowTask = defineTask('scaffold-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Workflow for /babysit command',
  description: 'Generate the /babysit workflow entry point for Antigravity',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Antigravity workflow designer',
      task: 'Create the /babysit workflow that initializes a babysitter session, creates a run, and triggers the orchestration skill',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'Create the /babysit workflow in the actual Antigravity workflow or command location discovered during analysis',
        'Workflow step 1: Install or sync the babysitter runtime if not present (scripts/install.sh)',
        'Workflow step 2: Call MCP session:init to initialize babysitter session',
        'Workflow step 3: Call MCP run:create with user-provided process-id, inputs, and the harness binding path when available',
        'Workflow step 4: Only if Antigravity lacks first-class binding, enter the documented secondary external association workflow and record the gap explicitly',
        'Workflow step 5: Enter orchestration loop, post results with output.json + task:post, then yield so the researched Antigravity continuation path resumes the next iteration',
        'Include parameter prompting for process-id and inputs',
        'Support --process-id and --inputs flags for non-interactive usage',
        'Return list of files created'
      ],
      outputFormat: 'JSON with filesCreated (array), workflowSteps (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        workflowSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'scaffold', 'workflow']
}));

// --- Phase 3: Implement ---

export const implementMultiAgentDispatchTask = defineTask('implement-multi-agent-dispatch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map multi-agent dispatch to parallel effect execution',
  description: 'Wire Antigravity Agent Manager to execute babysitter parallel effects',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'multi-agent systems architect',
      task: 'Implement the mapping between babysitter parallel effect dispatch (ctx.parallel.all) and Antigravity Agent Manager sub-agent spawning',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        skillResult: args.skillResult
      },
      instructions: [
        'Add dispatch logic to the babysitter skill for kind:agent effects',
        'When task:list returns multiple pending agent effects, spawn parallel sub-agents via Agent Manager',
        'Each sub-agent receives the task definition (task.json) as its prompt context',
        'Sub-agent results are posted back via MCP task:post',
        'Handle sub-agent failures gracefully with retry or escalation',
        'Ensure sub-agents operate in isolated workspaces to avoid file conflicts',
        'Document the dispatch strategy in references/multi-agent-dispatch.md',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with filesCreated (array), dispatchStrategy (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        dispatchStrategy: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'implement', 'multi-agent']
}));

export const implementBreakpointArtifactsTask = defineTask('implement-breakpoint-artifacts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement artifact-based breakpoint review',
  description: 'Map babysitter breakpoints to Antigravity artifact review with user feedback',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX integration engineer',
      task: 'Implement breakpoint handling using Antigravity artifact system for human-in-the-loop review',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        skillResult: args.skillResult
      },
      instructions: [
        'When task:list returns a pending breakpoint effect, create an Antigravity artifact',
        'Artifact should contain the breakpoint question, context files, and approval options',
        'Map artifact comments/approvals to breakpoint resolution via task:post',
        'Support approve, reject, and comment-with-feedback responses',
        'Include visual formatting for breakpoint artifacts (markdown with status badges)',
        'Add breakpoint handling instructions to the babysitter skill',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with filesCreated (array), breakpointFlow (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        breakpointFlow: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'implement', 'breakpoints']
}));

export const implementBrowserGatesTask = defineTask('implement-browser-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement browser-based e2e quality gates when Antigravity actually exposes them',
  description: 'Use the researched Antigravity browser or UI automation surface when it exists, otherwise make browser gates optional',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'test automation engineer with browser integration expertise',
      task: 'Implement e2e quality gates using the real Antigravity browser or UI automation surface if the harness actually provides one',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis
      },
      instructions: [
        'First confirm from analysis that Antigravity exposes a browser or UI automation surface; do not invent one',
        'Create scripts/browser-gate.sh only when such a browser surface is real and supported',
        'Support screenshot comparison for visual regression testing',
        'Support DOM assertion checking for functional verification',
        'Integrate browser gates as a verification step in the orchestration loop',
        'Gate results should be included in quality scoring',
        'Create references/browser-gates.md documenting supported gate types',
        'Handle projects without a web UI gracefully (skip browser gates)',
        'Return list of files created'
      ],
      outputFormat: 'JSON with filesCreated (array), gateTypes (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        gateTypes: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'implement', 'browser']
}));

export const implementModelAgnosticTask = defineTask('implement-model-agnostic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Handle model-agnostic execution',
  description: 'Ensure integration works across Gemini, Claude, GPT, and open models',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'LLM integration engineer with cross-model experience',
      task: 'Ensure babysitter integration works identically across all Antigravity-supported model backends',
      context: {
        projectDir: args.projectDir,
        analysis: args.analysis,
        preferredModel: args.preferredModel
      },
      instructions: [
        'Audit SKILL.md instructions for model-specific assumptions',
        'Ensure MCP tool calls use standard JSON-RPC format all models support',
        'Add model-specific notes in references/model-compatibility.md',
        'Test prompt formatting for Gemini 3 Pro, Claude Sonnet, GPT-4o, Llama, Grok, Qwen',
        'Ensure completion proof protocol works regardless of model output formatting',
        'Add fallback instructions for models with weaker tool-use capabilities',
        'Verify rule enforcement language is model-agnostic',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with filesCreated (array), modelNotes (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        modelNotes: {
          type: 'object',
          properties: {
            gemini: { type: 'string' },
            claude: { type: 'string' },
            gpt: { type: 'string' },
            openModels: { type: 'string' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'implement', 'model-agnostic']
}));

// --- Phase 4: Test ---

export const testIntegrationTask = defineTask('test-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test integration artifacts',
  description: 'Run preflight validation on generated files and researched host wiring before shared runtime validation',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'integration test engineer',
      task: 'Validate all generated Antigravity integration artifacts for correctness',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        analysis: args.analysis
      },
      instructions: [
        'Treat this task as preflight validation only; the shared runtime validation task is responsible for proving the real harness loop, user-yield continuation, and active process-library use',
        'Verify SKILL.md has valid markdown and all required sections',
        'Verify mcp_config.json is valid JSON and references correct babysitter command',
        'Verify .agents/babysitter-loop.md rule is well-formed',
        'Verify .agents/babysit.md workflow has all required steps',
        'Verify scripts/*.sh files are executable and have correct shebang lines',
        'Verify references/*.md files have valid content',
        'Check for broken cross-references between files',
        'Run babysitter health check to verify SDK is accessible',
        'Return test results with pass/fail per artifact'
      ],
      outputFormat: 'JSON with allPassed (boolean), results (array of {file, passed, issues}), failures (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'results', 'failures'],
      properties: {
        allPassed: { type: 'boolean' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              passed: { type: 'boolean' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        failures: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'test']
}));

// --- Phase 5: Verify ---

export const verifyOrchestrationLoopTask = defineTask('verify-orchestration-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify end-to-end orchestration loop',
  description: 'Validate the full orchestration cycle through the real Antigravity extension layer',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'integration verification engineer',
      task: 'Perform real end-to-end validation of the babysitter orchestration loop through the generated Antigravity extensions',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        analysis: args.analysis
      },
      instructions: [
        'Research and use the real Antigravity install, workflow, and skill activation path before validation begins',
        'Validate /babysit workflow activation through the actual harness entry point',
        'Prefer run:create with harness-native binding and, if that is missing, record the SDK or CLI gap and exercise the documented secondary external association workflow',
        'Verify run:iterate produces expected pending effects',
        'Verify task:list returns correct pending tasks',
        'Verify Agent Manager dispatch routes to the right sub-agents while preserving agent or skill public effect kinds',
        'Verify task:post resolves effects using output.json rather than direct result.json writes',
        'Verify yield back to the user still returns control to the orchestration loop on the next researched workflow, command, or callback path',
        'Verify run:status reports completion with the exact completion proof contract',
        'Verify the adapted skill still preserves the important canonical babysit instructions',
        'Verify the rule catches premature exit attempts',
        'Score the integration quality 0-100 with explicit attention to research, install docs, and edge-case coverage',
        'Return quality score and verification details'
      ],
      outputFormat: 'JSON with qualityScore (number), verified (boolean), steps (array of {step, passed, notes}), issues (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'verified'],
      properties: {
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        verified: { type: 'boolean' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              passed: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'verify']
}));

// --- Phase 6: Converge ---

export const qualityScoreTask = defineTask('quality-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score integration quality (iteration ${args.iteration})`,
  description: 'Assess overall integration quality against target threshold',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'quality assurance engineer',
      task: 'Score the babysitter-Antigravity integration quality on a 0-100 scale, including research fidelity and runtime validation strength',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        verifyResult: args.verifyResult,
        targetQuality: args.targetQuality,
        iteration: args.iteration
      },
      instructions: [
        'Assess research quality, upstream install path, and hook-point discovery (0-15 points)',
        'Assess SKILL.md adaptation fidelity to the canonical babysit skill (0-15 points)',
        'Assess MCP config correctness and tool coverage (0-10 points)',
        'Assess Rule and Workflow effectiveness for loop discipline and user-yield continuation (0-15 points)',
        'Assess multi-agent dispatch correctness (0-10 points)',
        'Assess breakpoint and artifact integration (0-10 points)',
        'Assess model-agnostic compatibility (0-5 points)',
        'Assess browser gate coverage and real runtime validation depth (0-10 points)',
        'Assess install docs, upgrade flow, and operator readiness (0-10 points)',
        'Provide specific feedback for improvement areas',
        'Return score with breakdown and recommendations'
      ],
      outputFormat: 'JSON with score (number), breakdown (object), feedback (string), recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['score'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: { type: 'object' },
        feedback: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'converge', 'scoring']
}));

export const applyQualityFixesTask = defineTask('apply-quality-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Apply quality fixes (iteration ${args.iteration})`,
  description: 'Address scoring feedback to improve integration quality',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Apply targeted fixes based on quality scoring feedback to improve the integration and remove stale contract drift',
      context: {
        projectDir: args.projectDir,
        integrationFiles: args.integrationFiles,
        scoreResult: args.scoreResult,
        iteration: args.iteration
      },
      instructions: [
        'Review scoring feedback and recommendations',
        'Prioritize fixes that close research, upstream install, docs, skill adaptation, and user-yield loop gaps first',
        'Apply fixes to existing integration files',
        'Create any missing files identified by scoring',
        'Replace stale contract language such as session-associate-first flow, direct result.json writes, implicit approvals, or public node effect kinds if any remain',
        'Do not introduce regressions in areas that scored well',
        'Document changes made in this iteration',
        'Return list of files created or modified'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), fixesSummary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        fixesSummary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'antigravity', 'converge', 'fixes']
}));
