/**
 * @process methodologies/ccpm/ccpm-task-decomposition
 * @description CCPM Task Decomposition - Break epics into concrete tasks with acceptance criteria, effort estimates, and parallelization flags
 * @inputs { projectName: string, featureName: string, epic: object, prd: object, parallelAgents?: number }
 * @outputs { success: boolean, tasks: array, streams: array, dependencyGraph: object, coverageReport: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * CCPM Task Decomposition Process
 *
 * Adapted from CCPM (https://github.com/automazeio/ccpm)
 * Phase 3: Task Decomposition - Breaks epics into concrete, parallelizable tasks
 * organized into work streams with acceptance criteria and effort estimates.
 *
 * Work Streams (CCPM standard):
 * - Database: Schema design, migrations, data layer
 * - API: Service layer, endpoints, business logic
 * - UI: Components, forms, frontend implementation
 * - Testing: Test suites, validation, QA
 * - Documentation: Technical docs, API docs, user guides
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.featureName - Feature name
 * @param {Object} inputs.epic - Epic document from Phase 2
 * @param {Object} inputs.prd - PRD from Phase 1
 * @param {number} inputs.parallelAgents - Max parallel agents (default: 5)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Task decomposition results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureName,
    epic,
    prd,
    parallelAgents = 5
  } = inputs;

  ctx.log('Starting CCPM Task Decomposition', { projectName, featureName });

  // ============================================================================
  // STEP 1: ANALYZE EPIC AND IDENTIFY WORK STREAMS
  // ============================================================================

  ctx.log('Step 1: Analyzing epic and identifying work streams');

  const streamAnalysis = await ctx.task(analyzeStreamsTask, {
    epic,
    prd,
    projectName,
    featureName,
    maxStreams: parallelAgents
  });

  // ============================================================================
  // STEP 2: DECOMPOSE INTO TASKS PER STREAM (Parallel)
  // ============================================================================

  ctx.log('Step 2: Decomposing into tasks per stream', { streamCount: streamAnalysis.streams.length });

  const streamTasks = await ctx.parallel.all(
    streamAnalysis.streams.map(stream =>
      ctx.task(decomposeStreamTask, {
        stream,
        epic,
        prd,
        projectName,
        featureName,
        otherStreams: streamAnalysis.streams.filter(s => s.name !== stream.name)
      })
    )
  );

  // ============================================================================
  // STEP 3: SET ACCEPTANCE CRITERIA
  // ============================================================================

  ctx.log('Step 3: Setting acceptance criteria');

  const allTasks = streamTasks.flatMap((st, idx) =>
    (st.tasks || []).map(t => ({ ...t, stream: streamAnalysis.streams[idx].name, streamType: streamAnalysis.streams[idx].type }))
  );

  const tasksWithCriteria = await ctx.task(setAcceptanceCriteriaTask, {
    tasks: allTasks,
    prd,
    epic,
    featureName
  });

  // ============================================================================
  // STEP 4: ESTIMATE EFFORT AND SET PARALLELIZATION FLAGS
  // ============================================================================

  ctx.log('Step 4: Estimating effort and setting parallelization');

  const tasksWithEstimates = await ctx.task(estimateEffortTask, {
    tasks: tasksWithCriteria.tasks,
    epic,
    projectName
  });

  // ============================================================================
  // STEP 5: BUILD DEPENDENCY GRAPH
  // ============================================================================

  ctx.log('Step 5: Building dependency graph');

  const dependencyGraph = await ctx.task(buildDependencyGraphTask, {
    tasks: tasksWithEstimates.tasks,
    streams: streamAnalysis.streams,
    epic
  });

  // ============================================================================
  // STEP 6: VALIDATE COVERAGE
  // ============================================================================

  ctx.log('Step 6: Validating PRD coverage');

  const coverageReport = await ctx.task(validateTaskCoverageTask, {
    tasks: tasksWithEstimates.tasks,
    prd,
    featureName
  });

  // Fill gaps if needed
  let finalTasks = tasksWithEstimates.tasks;
  if (!coverageReport.fullCoverage) {
    ctx.log('Coverage gaps found, generating additional tasks', { gaps: coverageReport.gaps });

    const gapTasks = await ctx.task(generateGapTasksTask, {
      gaps: coverageReport.gaps,
      existingTasks: finalTasks,
      prd,
      epic,
      streams: streamAnalysis.streams
    });

    finalTasks = [...finalTasks, ...gapTasks.tasks];
  }

  // Write task files
  const writeResult = await ctx.task(writeTaskFilesTask, {
    tasks: finalTasks,
    featureName,
    streams: streamAnalysis.streams,
    dependencyGraph
  });

  await ctx.breakpoint({
    question: `Task decomposition for "${featureName}" complete. ${finalTasks.length} tasks across ${streamAnalysis.streams.length} streams. Coverage: ${coverageReport.coveragePercentage}%. Approve task breakdown?`,
    title: 'Task Decomposition Review',
    context: {
      runId: ctx.runId,
      files: finalTasks.map((t, i) => ({
        path: `.claude/epics/${featureName}/${i + 1}.md`,
        format: 'markdown',
        label: `Task ${i + 1}: ${t.title}`
      }))
    }
  });

  return {
    success: coverageReport.fullCoverage || coverageReport.coveragePercentage >= 90,
    projectName,
    featureName,
    tasks: finalTasks,
    streams: streamAnalysis.streams,
    dependencyGraph,
    coverageReport,
    totalEffort: tasksWithEstimates.totalEffort,
    artifacts: {
      taskPaths: finalTasks.map((_, i) => `.claude/epics/${featureName}/${i + 1}.md`)
    },
    metadata: {
      processId: 'methodologies/ccpm/ccpm-task-decomposition',
      attribution: 'https://github.com/automazeio/ccpm',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const analyzeStreamsTask = defineTask('ccpm-analyze-streams', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Streams: ${args.featureName}`,
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Work stream analyst',
      task: `Identify parallel work streams for "${args.featureName}"`,
      context: { epic: args.epic, prd: args.prd, maxStreams: args.maxStreams },
      instructions: [
        'Identify 4-5 work streams from: database, api, ui, testing, docs, infrastructure',
        'Describe scope and responsibility of each stream',
        'Identify shared interfaces between streams',
        'Determine stream priorities and ordering',
        'Assign stream types for agent specialization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['streams'],
      properties: {
        streams: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, scope: { type: 'string' }, priority: { type: 'number' } } } },
        sharedInterfaces: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'stream-analysis', 'decomposition']
}));

export const decomposeStreamTask = defineTask('ccpm-decompose-stream', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decompose Stream: ${args.stream.name}`,
  agent: {
    name: 'task-analyst',
    prompt: {
      role: `${args.stream.type} work stream decomposition specialist`,
      task: `Break down the "${args.stream.name}" stream into concrete tasks`,
      context: { stream: args.stream, epic: args.epic, prd: args.prd, otherStreams: args.otherStreams },
      instructions: [
        'Create 3-8 concrete tasks for this stream',
        'Each task should be completable in one session',
        'Define clear boundaries to avoid overlap with other streams',
        'Order tasks by dependency within the stream',
        'Map each task to PRD user stories'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks'],
      properties: {
        tasks: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, userStoryRefs: { type: 'array' } } } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'stream-decomposition', 'decomposition']
}));

export const setAcceptanceCriteriaTask = defineTask('ccpm-set-acceptance-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set Acceptance Criteria',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Acceptance criteria specialist',
      task: 'Define testable acceptance criteria for all tasks',
      context: { tasks: args.tasks, prd: args.prd, epic: args.epic },
      instructions: [
        'Write acceptance criteria in Given/When/Then format',
        'Ensure criteria are specific and testable',
        'Include edge cases and error scenarios',
        'Map criteria to PRD success metrics',
        'Mark criteria as required vs. nice-to-have'
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
  labels: ['agent', 'ccpm', 'acceptance-criteria', 'decomposition']
}));

export const estimateEffortTask = defineTask('ccpm-estimate-effort', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate Effort',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Effort estimation specialist',
      task: 'Estimate effort and set parallelization flags for all tasks',
      context: { tasks: args.tasks, epic: args.epic },
      instructions: [
        'Estimate each task as S (< 1h), M (1-4h), L (4-8h), XL (> 8h)',
        'Set canParallelize flag based on dependencies',
        'Identify tasks that must be sequential',
        'Calculate total effort per stream',
        'Identify critical path tasks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'totalEffort'],
      properties: {
        tasks: { type: 'array' },
        totalEffort: { type: 'string' },
        criticalPath: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'estimation', 'decomposition']
}));

export const buildDependencyGraphTask = defineTask('ccpm-build-dependency-graph', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Dependency Graph',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Dependency graph specialist',
      task: 'Build complete dependency graph across all streams',
      context: { tasks: args.tasks, streams: args.streams, epic: args.epic },
      instructions: [
        'Map intra-stream task dependencies',
        'Map inter-stream task dependencies',
        'Detect circular dependencies and resolve',
        'Identify execution waves (groups of parallelizable tasks)',
        'Output adjacency list format'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['adjacencyList', 'executionWaves'],
      properties: {
        adjacencyList: { type: 'object' },
        executionWaves: { type: 'array' },
        circularDependencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'dependency-graph', 'decomposition']
}));

export const validateTaskCoverageTask = defineTask('ccpm-validate-task-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Task Coverage',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Coverage validation specialist',
      task: 'Verify task coverage against PRD user stories',
      context: { tasks: args.tasks, prd: args.prd },
      instructions: [
        'Map each PRD user story to implementing tasks',
        'Identify uncovered user stories',
        'Verify acceptance criteria trace to PRD requirements',
        'Calculate coverage percentage',
        'Report gaps with recommended stream assignment'
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
  labels: ['agent', 'ccpm', 'coverage', 'decomposition']
}));

export const generateGapTasksTask = defineTask('ccpm-generate-gap-tasks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Gap Tasks',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Gap analysis specialist',
      task: 'Create tasks to fill coverage gaps',
      context: { gaps: args.gaps, existingTasks: args.existingTasks, prd: args.prd, streams: args.streams },
      instructions: [
        'Create tasks for each uncovered user story',
        'Assign to appropriate work stream',
        'Include acceptance criteria and effort estimate',
        'Set dependencies with existing tasks',
        'Avoid duplicating existing work'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks'],
      properties: { tasks: { type: 'array' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'gap-fill', 'decomposition']
}));

export const writeTaskFilesTask = defineTask('ccpm-write-task-files', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Task Files',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Task file generator',
      task: 'Write individual task files to .claude/epics/<featureName>/',
      context: { tasks: args.tasks, featureName: args.featureName, streams: args.streams, dependencyGraph: args.dependencyGraph },
      instructions: [
        'Write each task as .claude/epics/<featureName>/<N>.md',
        'Include title, description, stream, acceptance criteria, effort, dependencies',
        'Add parallelization flag and user story references',
        'Create task index as .claude/epics/<featureName>/tasks-index.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['taskFiles', 'indexFile'],
      properties: {
        taskFiles: { type: 'array' },
        indexFile: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'file-generation', 'decomposition']
}));
