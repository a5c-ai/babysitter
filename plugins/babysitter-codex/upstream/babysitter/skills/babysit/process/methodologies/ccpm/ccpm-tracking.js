/**
 * @process methodologies/ccpm/ccpm-tracking
 * @description CCPM Progress Tracking - Standup reports, blocked task management, status dashboard, completion verification
 * @inputs { projectName: string, featureName: string, githubRepo?: string, epic?: object, tasks?: array, executionResults?: array }
 * @outputs { success: boolean, standupReport: object, statusDashboard: object, blockedTasks: array, completionStatus: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * CCPM Tracking Process
 *
 * Adapted from CCPM (https://github.com/automazeio/ccpm)
 * Cross-cutting: Progress tracking, standup reports, blocked task management,
 * status dashboards, and completion verification across all CCPM phases.
 *
 * Capabilities:
 * - Generate standup reports from current state
 * - Manage blocked tasks with escalation
 * - Create status dashboards with traceability
 * - Verify completion against PRD criteria
 * - Sync status bidirectionally with GitHub
 *
 * Issue States (CCPM): open -> in-progress -> blocked -> review -> closed
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.featureName - Feature name
 * @param {string} inputs.githubRepo - GitHub repository (optional)
 * @param {Object} inputs.epic - Epic document (optional)
 * @param {Array} inputs.tasks - Tasks list (optional)
 * @param {Array} inputs.executionResults - Execution results (optional)
 * @param {string} inputs.reportType - standup|dashboard|blocked|completion (default: dashboard)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Tracking results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureName,
    githubRepo = null,
    epic = null,
    tasks = [],
    executionResults = [],
    reportType = 'dashboard'
  } = inputs;

  ctx.log('Starting CCPM Tracking', { projectName, featureName, reportType });

  // ============================================================================
  // STEP 1: GATHER CURRENT STATE
  // ============================================================================

  ctx.log('Step 1: Gathering current state');

  const currentState = await ctx.task(gatherStateTask, {
    projectName,
    featureName,
    githubRepo,
    tasks,
    executionResults
  });

  // ============================================================================
  // STEP 2: GENERATE STANDUP REPORT
  // ============================================================================

  ctx.log('Step 2: Generating standup report');

  const standupReport = await ctx.task(generateStandupTask, {
    currentState,
    projectName,
    featureName
  });

  // ============================================================================
  // STEP 3: MANAGE BLOCKED TASKS
  // ============================================================================

  ctx.log('Step 3: Managing blocked tasks');

  const blockedManagement = await ctx.task(manageBlockedTasksTask, {
    currentState,
    projectName,
    featureName
  });

  if (blockedManagement.blockedTasks.length > 0) {
    await ctx.breakpoint({
      question: `${blockedManagement.blockedTasks.length} blocked task(s) found:\n${blockedManagement.blockedTasks.map(t => `- ${t.title}: ${t.blockReason}`).join('\n')}\n\nReview blockers and provide resolution guidance.`,
      title: 'Blocked Tasks',
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/ccpm/blocked-report-${featureName}.md`, format: 'markdown', label: 'Blocked Report' }
        ]
      }
    });
  }

  // ============================================================================
  // STEP 4: STATUS DASHBOARD
  // ============================================================================

  ctx.log('Step 4: Generating status dashboard');

  const statusDashboard = await ctx.task(generateDashboardTask, {
    currentState,
    standupReport,
    blockedManagement,
    projectName,
    featureName,
    githubRepo
  });

  // ============================================================================
  // STEP 5: COMPLETION VERIFICATION
  // ============================================================================

  ctx.log('Step 5: Completion verification');

  const completionStatus = await ctx.task(verifyCompletionTask, {
    currentState,
    epic,
    tasks,
    executionResults,
    featureName
  });

  // Sync to GitHub if available
  if (githubRepo) {
    await ctx.task(syncTrackingToGithubTask, {
      githubRepo,
      featureName,
      standupReport,
      statusDashboard,
      completionStatus
    });
  }

  return {
    success: true,
    projectName,
    featureName,
    standupReport,
    statusDashboard,
    blockedTasks: blockedManagement.blockedTasks,
    completionStatus,
    currentState,
    artifacts: {
      standupPath: `artifacts/ccpm/standup-${featureName}.md`,
      dashboardPath: `artifacts/ccpm/dashboard-${featureName}.md`,
      blockedPath: `artifacts/ccpm/blocked-report-${featureName}.md`
    },
    metadata: {
      processId: 'methodologies/ccpm/ccpm-tracking',
      attribution: 'https://github.com/automazeio/ccpm',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatherStateTask = defineTask('ccpm-gather-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gather State: ${args.featureName}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Project state analyst',
      task: 'Gather current project state from all sources',
      context: { projectName: args.projectName, featureName: args.featureName, githubRepo: args.githubRepo, tasks: args.tasks, executionResults: args.executionResults },
      instructions: [
        'Collect task statuses from execution results',
        'Check .claude/epics/ for task file states',
        'Gather GitHub issue states if repo configured',
        'Calculate overall progress metrics',
        'Identify state transitions since last check'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['taskStates', 'overallProgress', 'phaseStatus'],
      properties: {
        taskStates: { type: 'array' },
        overallProgress: { type: 'number' },
        phaseStatus: { type: 'object' },
        streamProgress: { type: 'array' },
        recentTransitions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'state-gathering', 'tracking']
}));

export const generateStandupTask = defineTask('ccpm-generate-standup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Standup: ${args.featureName}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Standup report generator',
      task: 'Generate standup-style progress report',
      context: { currentState: args.currentState, projectName: args.projectName },
      instructions: [
        'Summarize what was accomplished since last report',
        'List what is currently in progress',
        'Identify blockers and risks',
        'Estimate remaining work',
        'Highlight key decisions needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['accomplished', 'inProgress', 'blockers', 'nextUp'],
      properties: {
        accomplished: { type: 'array' },
        inProgress: { type: 'array' },
        blockers: { type: 'array' },
        nextUp: { type: 'array' },
        risks: { type: 'array' },
        decisionsNeeded: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'standup', 'tracking']
}));

export const manageBlockedTasksTask = defineTask('ccpm-manage-blocked', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage Blocked Tasks',
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Blocked task manager',
      task: 'Identify and manage blocked tasks',
      context: { currentState: args.currentState, projectName: args.projectName },
      instructions: [
        'Identify all blocked tasks and their block reasons',
        'Categorize blockers (dependency, external, decision, technical)',
        'Suggest unblocking actions for each',
        'Prioritize blockers by impact on critical path',
        'Identify workarounds where possible'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['blockedTasks'],
      properties: {
        blockedTasks: { type: 'array', items: { type: 'object', properties: { taskId: { type: 'string' }, title: { type: 'string' }, blockReason: { type: 'string' }, category: { type: 'string' }, suggestedAction: { type: 'string' }, criticalPathImpact: { type: 'boolean' } } } },
        totalBlocked: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'blocked', 'tracking']
}));

export const generateDashboardTask = defineTask('ccpm-generate-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dashboard: ${args.featureName}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Status dashboard generator',
      task: 'Generate comprehensive status dashboard',
      context: {
        currentState: args.currentState,
        standupReport: args.standupReport,
        blockedManagement: args.blockedManagement,
        githubRepo: args.githubRepo
      },
      instructions: [
        'Show progress per stream with visual indicators',
        'Display task state distribution (open/in-progress/blocked/review/closed)',
        'Show PRD-to-task traceability matrix',
        'Include timeline and velocity metrics',
        'List critical path status',
        'Output as artifacts/ccpm/dashboard-<featureName>.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['overallProgress', 'streamBreakdown', 'stateDistribution'],
      properties: {
        overallProgress: { type: 'number' },
        streamBreakdown: { type: 'array' },
        stateDistribution: { type: 'object' },
        traceabilityMatrix: { type: 'object' },
        criticalPathStatus: { type: 'string' },
        velocity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'dashboard', 'tracking']
}));

export const verifyCompletionTask = defineTask('ccpm-verify-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify Completion: ${args.featureName}`,
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'Completion verification specialist',
      task: 'Verify feature completion against PRD and epic requirements',
      context: { currentState: args.currentState, epic: args.epic, tasks: args.tasks, executionResults: args.executionResults },
      instructions: [
        'Check all tasks are in closed/completed state',
        'Verify all PRD user stories are satisfied',
        'Confirm all acceptance criteria are met',
        'Validate audit trail completeness (PRD -> Epic -> Task -> Code)',
        'Calculate final completion percentage'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['isComplete', 'completionPercentage'],
      properties: {
        isComplete: { type: 'boolean' },
        completionPercentage: { type: 'number' },
        unfinishedTasks: { type: 'array' },
        unsatisfiedStories: { type: 'array' },
        auditTrailComplete: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'completion', 'tracking']
}));

export const syncTrackingToGithubTask = defineTask('ccpm-sync-tracking-github', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sync Tracking to GitHub',
  agent: {
    name: 'project-tracker',
    prompt: {
      role: 'GitHub sync specialist',
      task: 'Sync tracking data to GitHub issues and project',
      context: { githubRepo: args.githubRepo, standupReport: args.standupReport, statusDashboard: args.statusDashboard, completionStatus: args.completionStatus },
      instructions: [
        'Update epic issue with dashboard summary',
        'Post standup as comment on epic issue',
        'Update blocked issue labels',
        'Close completed issues',
        'Maintain bidirectional sync state'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['synced'],
      properties: { synced: { type: 'boolean' }, updatedIssues: { type: 'array' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'github-sync', 'tracking']
}));
