/**
 * @process methodologies/ccpm/ccpm-orchestrator
 * @description Claude Code PM (CCPM) - Full lifecycle spec-driven orchestrator: PRD creation, epic planning, task decomposition, GitHub sync, parallel execution, tracking
 * @inputs { projectName: string, projectDescription: string, featureName: string, githubRepo?: string, parallelAgents?: number, qualityThreshold?: number }
 * @outputs { success: boolean, prd: object, epic: object, tasks: array, githubIssues: array, executionResults: array, trackingReport: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Claude Code PM (CCPM) - Full Lifecycle Orchestrator
 *
 * Adapted from CCPM (https://github.com/automazeio/ccpm)
 * Enforces spec-driven development: "Every line of code must trace back to a specification."
 *
 * Five strict phases with zero shortcuts:
 * 1. Product Planning - Brainstorm and create PRD with vision, user stories, success criteria
 * 2. Implementation Planning - Transform PRD into technical epic with architecture decisions
 * 3. Task Decomposition - Break epics into concrete tasks with acceptance criteria and parallelization
 * 4. GitHub Sync - Push epics/tasks to GitHub as issues with labels and relationships
 * 5. Execution - Specialized agents implement tasks with progress updates and audit trails
 *
 * Key Principles:
 * - No vibe coding - spec-driven entirely
 * - Persistent context - no session information lost
 * - Transparent audit trail - GitHub issues as source of truth
 * - Seamless human-AI handoffs
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.projectDescription - High-level project description and goals
 * @param {string} inputs.featureName - Feature name for PRD/epic naming
 * @param {string} inputs.githubRepo - GitHub repository (owner/repo) for issue sync (optional)
 * @param {number} inputs.parallelAgents - Max parallel agents per issue (default: 5)
 * @param {number} inputs.qualityThreshold - Minimum quality score to pass (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Complete CCPM lifecycle results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectDescription,
    featureName,
    githubRepo = null,
    parallelAgents = 5,
    qualityThreshold = 80
  } = inputs;

  ctx.log('Starting CCPM Full Lifecycle', { projectName, featureName, parallelAgents });

  const results = {
    projectName,
    featureName,
    phases: {}
  };

  // ============================================================================
  // PHASE 1: PRODUCT PLANNING (PRD Creation)
  // ============================================================================

  ctx.log('Phase 1: Product Planning - Creating PRD');

  const brainstormResult = await ctx.task(brainstormTask, {
    projectName,
    projectDescription,
    featureName
  });

  const prdResult = await ctx.task(createPrdTask, {
    projectName,
    featureName,
    brainstorm: brainstormResult,
    projectDescription
  });

  // Quality gate: validate PRD completeness
  const prdValidation = await ctx.task(validatePrdTask, {
    prd: prdResult,
    projectName,
    featureName
  });

  // Convergence loop for PRD quality
  let prdIteration = 0;
  let currentPrd = prdResult;
  while (!prdValidation.passes && prdIteration < 3) {
    prdIteration++;
    ctx.log('PRD refinement iteration', { iteration: prdIteration, issues: prdValidation.issues });

    currentPrd = await ctx.task(refinePrdTask, {
      prd: currentPrd,
      validationFeedback: prdValidation,
      projectName,
      featureName
    });

    const revalidation = await ctx.task(validatePrdTask, {
      prd: currentPrd,
      projectName,
      featureName
    });

    if (revalidation.passes) break;
  }

  await ctx.breakpoint({
    question: `Review the PRD for "${featureName}" in project "${projectName}". The PRD includes vision, user stories, success criteria, and constraints. ${prdIteration > 0 ? `Refined ${prdIteration} time(s) to meet quality standards.` : ''} Approve to proceed with implementation planning?`,
    title: 'Phase 1: PRD Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `.claude/prds/${featureName}.md`, format: 'markdown', label: 'Product Requirements Document' }
      ]
    }
  });

  results.phases.productPlanning = {
    brainstorm: brainstormResult,
    prd: currentPrd,
    validation: prdValidation,
    refinementIterations: prdIteration
  };

  // ============================================================================
  // PHASE 2: IMPLEMENTATION PLANNING (Epic Creation)
  // ============================================================================

  ctx.log('Phase 2: Implementation Planning - Creating Epic');

  const epicResult = await ctx.task(createEpicTask, {
    projectName,
    featureName,
    prd: currentPrd,
    projectDescription
  });

  // Architecture decision validation
  const archValidation = await ctx.task(validateArchitectureTask, {
    epic: epicResult,
    prd: currentPrd,
    projectName
  });

  if (!archValidation.passes) {
    ctx.log('Architecture validation found issues', { issues: archValidation.issues });

    const revisedEpic = await ctx.task(reviseEpicTask, {
      epic: epicResult,
      architectureFeedback: archValidation,
      prd: currentPrd,
      projectName
    });

    epicResult.epic = revisedEpic.epic;
    epicResult.architectureDecisions = revisedEpic.architectureDecisions;
  }

  await ctx.breakpoint({
    question: `Review the Epic for "${featureName}". Architecture decisions, tech approach, and dependency mapping are defined. Approve to proceed with task decomposition?`,
    title: 'Phase 2: Epic Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `.claude/epics/${featureName}/epic.md`, format: 'markdown', label: 'Epic Document' }
      ]
    }
  });

  results.phases.implementationPlanning = {
    epic: epicResult,
    architectureValidation: archValidation
  };

  // ============================================================================
  // PHASE 3: TASK DECOMPOSITION
  // ============================================================================

  ctx.log('Phase 3: Task Decomposition');

  const decompositionResult = await ctx.task(decomposeEpicTask, {
    projectName,
    featureName,
    epic: epicResult,
    prd: currentPrd,
    parallelAgents
  });

  // Validate task coverage against PRD user stories
  const coverageResult = await ctx.task(validateCoverageTask, {
    tasks: decompositionResult,
    prd: currentPrd,
    featureName
  });

  if (!coverageResult.fullCoverage) {
    ctx.log('Task coverage gaps found', { gaps: coverageResult.gaps });

    const additionalTasks = await ctx.task(fillCoverageGapsTask, {
      tasks: decompositionResult,
      gaps: coverageResult.gaps,
      prd: currentPrd,
      epic: epicResult
    });

    decompositionResult.tasks = [...decompositionResult.tasks, ...additionalTasks.tasks];
  }

  await ctx.breakpoint({
    question: `Review ${decompositionResult.tasks.length} tasks across ${decompositionResult.streams.length} work streams for "${featureName}". Tasks include acceptance criteria, effort estimates, and parallelization flags. Approve to proceed with ${githubRepo ? 'GitHub sync' : 'execution'}?`,
    title: 'Phase 3: Task Decomposition Review',
    context: {
      runId: ctx.runId,
      files: decompositionResult.tasks.map((t, i) => ({
        path: `.claude/epics/${featureName}/${i + 1}.md`,
        format: 'markdown',
        label: `Task ${i + 1}: ${t.title}`
      }))
    }
  });

  results.phases.taskDecomposition = {
    decomposition: decompositionResult,
    coverage: coverageResult
  };

  // ============================================================================
  // PHASE 4: GITHUB SYNC (Optional)
  // ============================================================================

  let githubIssues = [];

  if (githubRepo) {
    ctx.log('Phase 4: GitHub Sync', { repo: githubRepo });

    const syncResult = await ctx.task(syncToGithubTask, {
      githubRepo,
      featureName,
      epic: epicResult,
      tasks: decompositionResult,
      prd: currentPrd
    });

    githubIssues = syncResult.issues;

    await ctx.breakpoint({
      question: `GitHub sync complete for "${featureName}". Created ${syncResult.epicIssueNumber ? 'epic issue #' + syncResult.epicIssueNumber : 'epic'} and ${syncResult.issues.length} task issues in ${githubRepo}. Verify on GitHub and approve to proceed with execution?`,
      title: 'Phase 4: GitHub Sync Complete',
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/ccpm/github-sync-report.md`, format: 'markdown', label: 'Sync Report' }
        ]
      }
    });

    results.phases.githubSync = syncResult;
  }

  // ============================================================================
  // PHASE 5: PARALLEL EXECUTION
  // ============================================================================

  ctx.log('Phase 5: Parallel Execution', { streamCount: decompositionResult.streams.length });

  const executionResults = [];

  // Execute streams: tasks within a stream are sequential, streams run in parallel
  for (const streamBatch of organizeStreamBatches(decompositionResult.streams, parallelAgents)) {
    ctx.log('Executing stream batch', { streams: streamBatch.map(s => s.name) });

    const batchResults = await ctx.parallel.all(
      streamBatch.map(stream => async () => {
        const streamResults = [];

        for (const task of stream.tasks) {
          // Dispatch specialized agent based on stream type
          const agentResult = await ctx.task(executeTaskWithAgentTask, {
            task,
            stream,
            featureName,
            projectName,
            previousResults: streamResults,
            githubRepo,
            githubIssueNumber: githubIssues.find(i => i.taskId === task.id)?.issueNumber || null
          });

          // Quality validation
          const qualityResult = await ctx.task(validateTaskQualityTask, {
            task,
            implementation: agentResult,
            qualityThreshold
          });

          // Convergence loop for quality
          let qualityIteration = 0;
          let currentResult = agentResult;
          while (!qualityResult.passes && qualityIteration < 3) {
            qualityIteration++;
            ctx.log('Quality refinement', { taskId: task.id, iteration: qualityIteration, score: qualityResult.score });

            currentResult = await ctx.task(refineImplementationTask, {
              task,
              implementation: currentResult,
              qualityFeedback: qualityResult,
              qualityThreshold
            });

            const recheck = await ctx.task(validateTaskQualityTask, {
              task,
              implementation: currentResult,
              qualityThreshold
            });

            if (recheck.passes) break;
          }

          streamResults.push({
            taskId: task.id,
            taskTitle: task.title,
            result: currentResult,
            quality: qualityResult,
            qualityIterations: qualityIteration
          });

          // Sync progress to GitHub if available
          if (githubRepo) {
            await ctx.task(syncProgressTask, {
              githubRepo,
              taskId: task.id,
              issueNumber: githubIssues.find(i => i.taskId === task.id)?.issueNumber || null,
              status: qualityResult.passes ? 'completed' : 'needs-review',
              summary: currentResult.summary || ''
            });
          }
        }

        return { stream: stream.name, results: streamResults };
      })
    );

    executionResults.push(...batchResults);
  }

  results.phases.execution = executionResults;

  // ============================================================================
  // INTEGRATION AND FINAL VALIDATION
  // ============================================================================

  ctx.log('Integration and Final Validation');

  const integrationResult = await ctx.task(integrateAndVerifyTask, {
    executionResults,
    prd: currentPrd,
    epic: epicResult,
    featureName,
    projectName
  });

  // Generate tracking report
  const trackingReport = await ctx.task(generateTrackingReportTask, {
    projectName,
    featureName,
    prd: currentPrd,
    epic: epicResult,
    decomposition: decompositionResult,
    executionResults,
    integrationResult,
    githubIssues
  });

  await ctx.breakpoint({
    question: `CCPM lifecycle complete for "${featureName}". Integration ${integrationResult.passed ? 'PASSED' : 'found issues'}. ${trackingReport.completionPercentage}% of user stories verified. Review final report and approve?`,
    title: 'CCPM Lifecycle Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: `.claude/prds/${featureName}.md`, format: 'markdown', label: 'PRD' },
        { path: `.claude/epics/${featureName}/epic.md`, format: 'markdown', label: 'Epic' },
        { path: `artifacts/ccpm/tracking-report.md`, format: 'markdown', label: 'Tracking Report' },
        { path: `artifacts/ccpm/integration-report.md`, format: 'markdown', label: 'Integration Report' }
      ]
    }
  });

  return {
    success: integrationResult.passed,
    projectName,
    featureName,
    prd: currentPrd,
    epic: epicResult,
    tasks: decompositionResult,
    githubIssues,
    executionResults,
    integrationResult,
    trackingReport,
    traceability: {
      prdPath: `.claude/prds/${featureName}.md`,
      epicPath: `.claude/epics/${featureName}/epic.md`,
      taskPaths: decompositionResult.tasks.map((t, i) => `.claude/epics/${featureName}/${i + 1}.md`),
      githubIssues: githubIssues.map(i => `${githubRepo}#${i.issueNumber}`)
    },
    metadata: {
      processId: 'methodologies/ccpm/ccpm-orchestrator',
      attribution: 'https://github.com/automazeio/ccpm',
      timestamp: ctx.now()
    }
  };
}

/**
 * Organize parallel streams into batches respecting maxParallel limit
 */
function organizeStreamBatches(streams, maxParallel) {
  const batches = [];
  for (let i = 0; i < streams.length; i += maxParallel) {
    batches.push(streams.slice(i, i + maxParallel));
  }
  return batches;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const brainstormTask = defineTask('ccpm-brainstorm', (args, taskCtx) => ({
  kind: 'agent',
  title: `Brainstorm: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'Product visionary and brainstorming facilitator',
      task: `Brainstorm ideas for feature "${args.featureName}" in project "${args.projectName}"`,
      context: { projectDescription: args.projectDescription, featureName: args.featureName },
      instructions: [
        'Explore the problem space thoroughly',
        'Identify target users and their pain points',
        'Generate multiple solution approaches',
        'Define success criteria and constraints',
        'Prioritize ideas by impact and feasibility'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ideas', 'targetUsers', 'painPoints', 'successCriteria'],
      properties: {
        ideas: { type: 'array' },
        targetUsers: { type: 'array' },
        painPoints: { type: 'array' },
        successCriteria: { type: 'array' },
        constraints: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'brainstorm', 'phase-1']
}));

export const createPrdTask = defineTask('ccpm-create-prd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create PRD: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'Senior product manager creating a comprehensive PRD',
      task: `Create a Product Requirements Document for "${args.featureName}"`,
      context: { brainstorm: args.brainstorm, projectName: args.projectName, projectDescription: args.projectDescription },
      instructions: [
        'Define clear product vision and goals',
        'Write detailed user stories with acceptance criteria',
        'Specify success metrics and KPIs',
        'Document constraints and assumptions',
        'Define scope boundaries (in-scope / out-of-scope)',
        'Output PRD as .claude/prds/<featureName>.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'userStories', 'successCriteria', 'constraints', 'scope'],
      properties: {
        vision: { type: 'string' },
        userStories: { type: 'array' },
        successCriteria: { type: 'array' },
        constraints: { type: 'array' },
        scope: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'prd', 'phase-1']
}));

export const validatePrdTask = defineTask('ccpm-validate-prd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate PRD: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'PRD quality reviewer',
      task: 'Validate PRD completeness and quality',
      context: { prd: args.prd, projectName: args.projectName },
      instructions: [
        'Check all user stories have acceptance criteria',
        'Verify success criteria are measurable',
        'Ensure constraints are realistic',
        'Validate scope boundaries are clear',
        'Score PRD quality 0-100'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'score', 'issues'],
      properties: {
        passes: { type: 'boolean' },
        score: { type: 'number' },
        issues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'validation', 'phase-1']
}));

export const refinePrdTask = defineTask('ccpm-refine-prd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine PRD: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'PRD revision specialist',
      task: 'Refine PRD based on validation feedback',
      context: { prd: args.prd, feedback: args.validationFeedback },
      instructions: [
        'Address each validation issue',
        'Improve user story specificity',
        'Strengthen success criteria measurability',
        'Clarify ambiguous scope boundaries'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'userStories', 'successCriteria'],
      properties: {
        vision: { type: 'string' },
        userStories: { type: 'array' },
        successCriteria: { type: 'array' },
        constraints: { type: 'array' },
        scope: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'refinement', 'phase-1']
}));

export const createEpicTask = defineTask('ccpm-create-epic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Epic: ${args.featureName}`,
  agent: {
    name: 'architect',
    prompt: {
      role: 'Solutions architect creating a technical epic',
      task: `Transform PRD into technical epic for "${args.featureName}"`,
      context: { prd: args.prd, projectName: args.projectName, projectDescription: args.projectDescription },
      instructions: [
        'Define architecture decisions with rationale',
        'Specify technology approach and stack choices',
        'Map dependencies between components',
        'Document integration points',
        'Define non-functional requirements',
        'Output epic as .claude/epics/<featureName>/epic.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['epic', 'architectureDecisions', 'techApproach', 'dependencies'],
      properties: {
        epic: { type: 'object' },
        architectureDecisions: { type: 'array' },
        techApproach: { type: 'object' },
        dependencies: { type: 'array' },
        integrationPoints: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'epic', 'phase-2']
}));

export const validateArchitectureTask = defineTask('ccpm-validate-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Architecture',
  agent: {
    name: 'architect',
    prompt: {
      role: 'Architecture review specialist',
      task: 'Validate epic architecture against PRD requirements',
      context: { epic: args.epic, prd: args.prd },
      instructions: [
        'Verify all PRD requirements are architecturally supported',
        'Check for scalability concerns',
        'Validate dependency compatibility',
        'Assess security implications',
        'Score architecture quality 0-100'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'score', 'issues'],
      properties: {
        passes: { type: 'boolean' },
        score: { type: 'number' },
        issues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'validation', 'phase-2']
}));

export const reviseEpicTask = defineTask('ccpm-revise-epic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise Epic',
  agent: {
    name: 'architect',
    prompt: {
      role: 'Architecture revision specialist',
      task: 'Revise epic based on architecture validation feedback',
      context: { epic: args.epic, feedback: args.architectureFeedback, prd: args.prd },
      instructions: [
        'Address each architecture issue',
        'Revise decisions with updated rationale',
        'Update dependency mapping',
        'Ensure PRD alignment is maintained'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['epic', 'architectureDecisions'],
      properties: {
        epic: { type: 'object' },
        architectureDecisions: { type: 'array' },
        techApproach: { type: 'object' },
        dependencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'revision', 'phase-2']
}));

export const decomposeEpicTask = defineTask('ccpm-decompose-epic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decompose Epic: ${args.featureName}`,
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Task decomposition specialist',
      task: `Break epic "${args.featureName}" into concrete parallel work streams`,
      context: { epic: args.epic, prd: args.prd, maxParallel: args.parallelAgents },
      instructions: [
        'Identify 4-5 parallel work streams (database, API, UI, testing, docs)',
        'Create tasks with clear acceptance criteria for each stream',
        'Add effort estimates (S/M/L/XL)',
        'Set parallelization flags and dependencies',
        'Map each task to PRD user stories for traceability',
        'Output task files as .claude/epics/<featureName>/<N>.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'streams', 'dependencyGraph'],
      properties: {
        tasks: { type: 'array' },
        streams: { type: 'array' },
        dependencyGraph: { type: 'object' },
        totalEffort: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'decomposition', 'phase-3']
}));

export const validateCoverageTask = defineTask('ccpm-validate-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Task Coverage',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Coverage analyst',
      task: 'Verify all PRD user stories are covered by tasks',
      context: { tasks: args.tasks, prd: args.prd },
      instructions: [
        'Map each user story to implementing tasks',
        'Identify gaps where user stories have no task coverage',
        'Verify acceptance criteria are testable',
        'Report coverage percentage'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fullCoverage', 'coveragePercentage', 'gaps'],
      properties: {
        fullCoverage: { type: 'boolean' },
        coveragePercentage: { type: 'number' },
        gaps: { type: 'array' },
        storyToTaskMap: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'coverage', 'phase-3']
}));

export const fillCoverageGapsTask = defineTask('ccpm-fill-coverage-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fill Coverage Gaps',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Task gap analyst',
      task: 'Create additional tasks to fill coverage gaps',
      context: { gaps: args.gaps, prd: args.prd, epic: args.epic, existingTasks: args.tasks },
      instructions: [
        'Create tasks for each uncovered user story',
        'Include acceptance criteria and effort estimates',
        'Set appropriate stream assignment and dependencies',
        'Ensure no duplicate work with existing tasks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks'],
      properties: {
        tasks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'gap-fill', 'phase-3']
}));

export const syncToGithubTask = defineTask('ccpm-sync-github', (args, taskCtx) => ({
  kind: 'agent',
  title: `GitHub Sync: ${args.featureName}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'GitHub project manager',
      task: `Sync epic and tasks to GitHub issues in ${args.githubRepo}`,
      context: { epic: args.epic, tasks: args.tasks, prd: args.prd, repo: args.githubRepo },
      instructions: [
        'Create epic issue with labels: epic, ccpm',
        'Create task issues linked to epic',
        'Add labels for stream type (database, api, ui, testing, docs)',
        'Set issue relationships (parent/child)',
        'Add acceptance criteria as checkboxes',
        'Report all created issue numbers'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['epicIssueNumber', 'issues'],
      properties: {
        epicIssueNumber: { type: 'number' },
        issues: { type: 'array' },
        labels: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'github-sync', 'phase-4']
}));

export const executeTaskWithAgentTask = defineTask('ccpm-execute-task', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute: ${args.task.title}`,
  agent: {
    name: getAgentNameForStream(args.stream.type),
    prompt: {
      role: `Specialized ${args.stream.type} developer`,
      task: `Implement task: ${args.task.title}`,
      context: {
        task: args.task,
        stream: args.stream,
        featureName: args.featureName,
        previousResults: args.previousResults
      },
      instructions: [
        `Implement according to acceptance criteria`,
        'Write clean, well-documented code',
        'Include tests for all acceptance criteria',
        'Create atomic git commit with descriptive message',
        'Report implementation summary and files changed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged', 'testsWritten'],
      properties: {
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        testsWritten: { type: 'array' },
        commitHash: { type: 'string' },
        acceptanceCriteriaMet: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'execution', 'phase-5', args.stream.type]
}));

export const validateTaskQualityTask = defineTask('ccpm-validate-task-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Check: ${args.task.title}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Quality assurance engineer',
      task: 'Validate implementation quality against acceptance criteria',
      context: { task: args.task, implementation: args.implementation, threshold: args.qualityThreshold },
      instructions: [
        'Verify all acceptance criteria are met',
        'Run tests and verify they pass',
        'Check code quality and standards',
        'Score quality 0-100',
        'Report any issues found'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'score', 'issues'],
      properties: {
        passes: { type: 'boolean' },
        score: { type: 'number' },
        issues: { type: 'array' },
        acceptanceCriteriaResults: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'quality', 'phase-5']
}));

export const refineImplementationTask = defineTask('ccpm-refine-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine: ${args.task.title}`,
  agent: {
    name: getAgentNameForStream(args.task.stream || 'api'),
    prompt: {
      role: 'Implementation refinement specialist',
      task: `Refine implementation to meet quality threshold of ${args.qualityThreshold}`,
      context: { task: args.task, implementation: args.implementation, qualityFeedback: args.qualityFeedback },
      instructions: [
        'Address each quality issue',
        'Fix failing tests',
        'Improve code quality',
        'Re-verify acceptance criteria'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged'],
      properties: {
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        testsWritten: { type: 'array' },
        issuesFixed: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'refinement', 'phase-5']
}));

export const syncProgressTask = defineTask('ccpm-sync-progress', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sync Progress: ${args.taskId}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Progress reporter',
      task: `Update GitHub issue progress for task ${args.taskId}`,
      context: { githubRepo: args.githubRepo, issueNumber: args.issueNumber, status: args.status, summary: args.summary },
      instructions: [
        'Post progress comment on GitHub issue',
        'Update issue labels to reflect status',
        'Close issue if status is completed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['synced'],
      properties: { synced: { type: 'boolean' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'progress-sync', 'phase-5']
}));

export const integrateAndVerifyTask = defineTask('ccpm-integrate-verify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration: ${args.featureName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Integration test engineer',
      task: `Verify integration of all work streams for "${args.featureName}"`,
      context: { executionResults: args.executionResults, prd: args.prd, epic: args.epic },
      instructions: [
        'Run full test suite across all streams',
        'Verify cross-stream integration points',
        'Check all PRD user stories are satisfied end-to-end',
        'Report integration score and issues'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score', 'userStoriesSatisfied'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number' },
        userStoriesSatisfied: { type: 'array' },
        integrationIssues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'integration', 'final']
}));

export const generateTrackingReportTask = defineTask('ccpm-tracking-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tracking Report: ${args.featureName}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Project tracking analyst',
      task: `Generate comprehensive tracking report for "${args.featureName}"`,
      context: {
        projectName: args.projectName,
        prd: args.prd,
        epic: args.epic,
        decomposition: args.decomposition,
        executionResults: args.executionResults,
        integrationResult: args.integrationResult,
        githubIssues: args.githubIssues
      },
      instructions: [
        'Calculate completion percentage per stream',
        'List all commits with traceability to PRD user stories',
        'Report blocked and completed tasks',
        'Generate standup-style summary',
        'Output as artifacts/ccpm/tracking-report.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['completionPercentage', 'streamStatus', 'summary'],
      properties: {
        completionPercentage: { type: 'number' },
        streamStatus: { type: 'array' },
        summary: { type: 'string' },
        blockedTasks: { type: 'array' },
        completedTasks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'tracking', 'final']
}));

/**
 * Map stream type to specialized agent name
 */
function getAgentNameForStream(streamType) {
  const mapping = {
    database: 'database-engineer',
    api: 'api-developer',
    ui: 'ui-developer',
    testing: 'test-engineer',
    docs: 'documentation-writer',
    infrastructure: 'architect'
  };
  return mapping[streamType] || 'api-developer';
}
