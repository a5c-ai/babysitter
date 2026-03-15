/**
 * @process methodologies/ccpm/ccpm-parallel-execution
 * @description CCPM Parallel Execution - Dispatch specialized agents per work stream, coordinate commits, sync progress, merge
 * @inputs { projectName: string, featureName: string, tasks: array, streams: array, githubRepo?: string, qualityThreshold?: number }
 * @outputs { success: boolean, streamResults: array, integrationResult: object, conflictsFound: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * CCPM Parallel Execution Process
 *
 * Adapted from CCPM (https://github.com/automazeio/ccpm)
 * Phase 5: Execution - Dispatch specialized agents to implement tasks in parallel
 * work streams. Each stream gets a specialized agent (database, API, UI, testing, docs).
 *
 * Execution Model:
 * - Streams run in parallel batches (up to maxParallel)
 * - Tasks within a stream run sequentially
 * - Quality gates after each task with convergence loops
 * - Progress synced to GitHub issues if configured
 * - Integration verification after all streams complete
 *
 * Agent Specialization (CCPM standard):
 * - database-engineer: Schema design, migrations, data layer
 * - api-developer: Service layer, endpoints, API design
 * - ui-developer: Components, forms, frontend implementation
 * - test-engineer: Test suites, validation, QA
 * - documentation-writer: Technical docs, API docs, user guides
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.featureName - Feature name
 * @param {Array} inputs.tasks - Tasks from decomposition phase
 * @param {Array} inputs.streams - Work streams
 * @param {string} inputs.githubRepo - GitHub repo for progress sync (optional)
 * @param {number} inputs.qualityThreshold - Minimum quality score (default: 80)
 * @param {number} inputs.maxParallel - Maximum parallel streams (default: 5)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Parallel execution results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureName,
    tasks,
    streams,
    githubRepo = null,
    qualityThreshold = 80,
    maxParallel = 5
  } = inputs;

  ctx.log('Starting CCPM Parallel Execution', {
    projectName,
    featureName,
    streamCount: streams.length,
    taskCount: tasks.length
  });

  // ============================================================================
  // STEP 1: PREPARE EXECUTION PLAN
  // ============================================================================

  ctx.log('Step 1: Preparing execution plan');

  const executionPlan = await ctx.task(prepareExecutionPlanTask, {
    tasks,
    streams,
    maxParallel,
    featureName
  });

  await ctx.breakpoint({
    question: `Execution plan for "${featureName}": ${executionPlan.batches?.length || 0} batches, ${streams.length} streams, ${tasks.length} total tasks. ${executionPlan.estimatedDuration || 'unknown'} estimated duration. Proceed with execution?`,
    title: 'Execution Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/ccpm/execution-plan-${featureName}.md`, format: 'markdown', label: 'Execution Plan' }
      ]
    }
  });

  // ============================================================================
  // STEP 2: EXECUTE STREAM BATCHES
  // ============================================================================

  const allStreamResults = [];

  for (let batchIdx = 0; batchIdx < executionPlan.batches.length; batchIdx++) {
    const batch = executionPlan.batches[batchIdx];
    ctx.log('Executing batch', { batchIdx: batchIdx + 1, totalBatches: executionPlan.batches.length, streams: batch.map(s => s.name) });

    const batchResults = await ctx.parallel.all(
      batch.map(stream => async () => {
        const streamTasks = tasks.filter(t => t.stream === stream.name || t.streamType === stream.type);
        const streamResults = [];

        for (const task of streamTasks) {
          ctx.log('Executing task', { taskId: task.id, stream: stream.name });

          // Execute with specialized agent
          const implResult = await ctx.task(executeWithSpecializedAgentTask, {
            task,
            stream,
            featureName,
            projectName,
            previousResults: streamResults
          });

          // Quality gate
          const qualityCheck = await ctx.task(checkTaskQualityTask, {
            task,
            implementation: implResult,
            qualityThreshold
          });

          // Convergence loop
          let currentImpl = implResult;
          let qualityIterations = 0;
          while (!qualityCheck.passes && qualityIterations < 3) {
            qualityIterations++;
            ctx.log('Quality refinement', { taskId: task.id, iteration: qualityIterations, score: qualityCheck.score });

            currentImpl = await ctx.task(refineTaskImplementationTask, {
              task,
              implementation: currentImpl,
              feedback: qualityCheck,
              stream,
              qualityThreshold
            });

            const recheck = await ctx.task(checkTaskQualityTask, {
              task,
              implementation: currentImpl,
              qualityThreshold
            });

            if (recheck.passes) break;
          }

          streamResults.push({
            taskId: task.id,
            title: task.title,
            result: currentImpl,
            quality: qualityCheck,
            qualityIterations,
            status: qualityCheck.passes ? 'completed' : 'needs-review'
          });

          // Sync to GitHub
          if (githubRepo && task.githubIssueNumber) {
            await ctx.task(updateGithubProgressTask, {
              githubRepo,
              issueNumber: task.githubIssueNumber,
              status: qualityCheck.passes ? 'completed' : 'in-progress',
              summary: currentImpl.summary || ''
            });
          }
        }

        return { streamName: stream.name, streamType: stream.type, results: streamResults };
      })
    );

    allStreamResults.push(...batchResults);
  }

  // ============================================================================
  // STEP 3: CHECK FOR CROSS-STREAM CONFLICTS
  // ============================================================================

  ctx.log('Step 3: Checking for cross-stream conflicts');

  const conflictCheck = await ctx.task(checkCrossStreamConflictsTask, {
    streamResults: allStreamResults,
    featureName
  });

  if (conflictCheck.hasConflicts) {
    ctx.log('Cross-stream conflicts detected', { conflicts: conflictCheck.conflicts });

    await ctx.breakpoint({
      question: `Cross-stream conflicts detected:\n${conflictCheck.conflicts.map(c => `- ${c.description}`).join('\n')}\n\nReview and resolve conflicts before integration.`,
      title: 'Cross-Stream Conflicts',
      context: { runId: ctx.runId }
    });

    // Resolve conflicts
    await ctx.task(resolveConflictsTask, {
      conflicts: conflictCheck.conflicts,
      streamResults: allStreamResults,
      featureName
    });
  }

  // ============================================================================
  // STEP 4: INTEGRATION VERIFICATION
  // ============================================================================

  ctx.log('Step 4: Integration verification');

  const integrationResult = await ctx.task(verifyIntegrationTask, {
    streamResults: allStreamResults,
    featureName,
    projectName,
    qualityThreshold
  });

  if (!integrationResult.passed) {
    await ctx.breakpoint({
      question: `Integration verification failed. Score: ${integrationResult.score}/100. Issues:\n${(integrationResult.issues || []).map(i => `- ${i}`).join('\n')}\nReview and resolve integration issues.`,
      title: 'Integration Verification Failed',
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/ccpm/integration-report-${featureName}.md`, format: 'markdown', label: 'Integration Report' }
        ]
      }
    });
  }

  // ============================================================================
  // STEP 5: MERGE AND FINALIZE
  // ============================================================================

  ctx.log('Step 5: Merge and finalize');

  const mergeResult = await ctx.task(mergeStreamResultsTask, {
    streamResults: allStreamResults,
    integrationResult,
    featureName,
    projectName
  });

  return {
    success: integrationResult.passed,
    projectName,
    featureName,
    streamResults: allStreamResults,
    integrationResult,
    mergeResult,
    conflictsFound: conflictCheck.hasConflicts,
    summary: {
      totalTasks: tasks.length,
      completedTasks: allStreamResults.flatMap(s => s.results).filter(r => r.status === 'completed').length,
      streams: allStreamResults.map(s => ({
        name: s.streamName,
        tasksCompleted: s.results.filter(r => r.status === 'completed').length,
        totalTasks: s.results.length
      }))
    },
    metadata: {
      processId: 'methodologies/ccpm/ccpm-parallel-execution',
      attribution: 'https://github.com/automazeio/ccpm',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const prepareExecutionPlanTask = defineTask('ccpm-prepare-exec-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Execution Plan: ${args.featureName}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Execution planning specialist',
      task: 'Create parallel execution plan for work streams',
      context: { tasks: args.tasks, streams: args.streams, maxParallel: args.maxParallel },
      instructions: [
        'Organize streams into parallel execution batches',
        'Respect dependency ordering between streams',
        'Balance batch sizes for efficiency',
        'Estimate total execution duration',
        'Identify critical path'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['batches', 'estimatedDuration'],
      properties: {
        batches: { type: 'array' },
        estimatedDuration: { type: 'string' },
        criticalPath: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'execution-plan', 'parallel']
}));

export const executeWithSpecializedAgentTask = defineTask('ccpm-execute-specialized', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute: ${args.task.title}`,
  agent: {
    name: getAgentForStreamType(args.stream.type),
    prompt: {
      role: `Specialized ${args.stream.type} engineer`,
      task: `Implement: ${args.task.title}`,
      context: {
        task: args.task,
        acceptanceCriteria: args.task.acceptanceCriteria,
        previousResults: args.previousResults,
        featureName: args.featureName
      },
      instructions: [
        'Implement the task according to acceptance criteria',
        'Write clean, well-documented code',
        'Include tests for all acceptance criteria',
        'Create atomic git commit',
        'Report files changed and tests written'
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
        commitHash: { type: 'string' },
        acceptanceCriteriaMet: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'execution', 'specialized', args.stream.type]
}));

export const checkTaskQualityTask = defineTask('ccpm-check-task-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality: ${args.task.title}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Quality assurance engineer',
      task: 'Validate task implementation quality',
      context: { task: args.task, implementation: args.implementation, threshold: args.qualityThreshold },
      instructions: [
        'Verify all acceptance criteria are met',
        'Run tests and check results',
        'Review code quality',
        'Score 0-100',
        'Report issues'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'score', 'issues'],
      properties: { passes: { type: 'boolean' }, score: { type: 'number' }, issues: { type: 'array' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'quality', 'parallel']
}));

export const refineTaskImplementationTask = defineTask('ccpm-refine-task-impl', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine: ${args.task.title}`,
  agent: {
    name: getAgentForStreamType(args.stream.type),
    prompt: {
      role: 'Implementation refinement specialist',
      task: `Refine implementation to meet quality threshold of ${args.qualityThreshold}`,
      context: { task: args.task, implementation: args.implementation, feedback: args.feedback },
      instructions: ['Address each quality issue', 'Fix failing tests', 'Improve code quality'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged'],
      properties: { summary: { type: 'string' }, filesChanged: { type: 'array' }, issuesFixed: { type: 'array' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'refinement', 'parallel']
}));

export const updateGithubProgressTask = defineTask('ccpm-update-github', (args, taskCtx) => ({
  kind: 'agent',
  title: `GitHub Update: #${args.issueNumber}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'GitHub progress reporter',
      task: `Update GitHub issue #${args.issueNumber} with progress`,
      context: { githubRepo: args.githubRepo, issueNumber: args.issueNumber, status: args.status, summary: args.summary },
      instructions: ['Post progress comment', 'Update labels', 'Close if completed'],
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
  labels: ['agent', 'ccpm', 'github', 'parallel']
}));

export const checkCrossStreamConflictsTask = defineTask('ccpm-check-conflicts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check Cross-Stream Conflicts',
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Conflict detection specialist',
      task: 'Check for conflicts between parallel stream implementations',
      context: { streamResults: args.streamResults },
      instructions: [
        'Check for file conflicts between streams',
        'Verify interface compatibility',
        'Detect breaking changes across streams',
        'Identify merge conflicts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['hasConflicts', 'conflicts'],
      properties: {
        hasConflicts: { type: 'boolean' },
        conflicts: { type: 'array' },
        resolution: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'conflict-detection', 'parallel']
}));

export const resolveConflictsTask = defineTask('ccpm-resolve-conflicts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resolve Conflicts',
  agent: {
    name: 'architect',
    prompt: {
      role: 'Conflict resolution specialist',
      task: 'Resolve cross-stream conflicts',
      context: { conflicts: args.conflicts, streamResults: args.streamResults },
      instructions: [
        'Resolve each conflict maintaining both stream intents',
        'Update files to be compatible',
        'Verify resolution does not break either stream'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['resolved', 'resolutions'],
      properties: { resolved: { type: 'boolean' }, resolutions: { type: 'array' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'conflict-resolution', 'parallel']
}));

export const verifyIntegrationTask = defineTask('ccpm-verify-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration: ${args.featureName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Integration test engineer',
      task: 'Verify integration of all work streams',
      context: { streamResults: args.streamResults, qualityThreshold: args.qualityThreshold },
      instructions: [
        'Run full test suite',
        'Verify cross-stream integration points',
        'Check end-to-end functionality',
        'Score integration quality 0-100'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score'],
      properties: { passed: { type: 'boolean' }, score: { type: 'number' }, issues: { type: 'array' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'integration', 'parallel']
}));

export const mergeStreamResultsTask = defineTask('ccpm-merge-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Merge Stream Results',
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Merge coordinator',
      task: 'Merge and finalize all stream results',
      context: { streamResults: args.streamResults, integrationResult: args.integrationResult },
      instructions: [
        'Create final merge commit',
        'Update all GitHub issues to closed',
        'Generate execution summary report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['merged', 'summary'],
      properties: { merged: { type: 'boolean' }, summary: { type: 'string' }, commitHash: { type: 'string' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'merge', 'parallel']
}));

/**
 * Map stream type to specialized agent name
 */
function getAgentForStreamType(streamType) {
  const mapping = {
    database: 'database-engineer',
    api: 'api-developer',
    ui: 'ui-developer',
    testing: 'test-engineer',
    docs: 'documentation-writer',
    documentation: 'documentation-writer',
    infrastructure: 'architect'
  };
  return mapping[streamType] || 'api-developer';
}
