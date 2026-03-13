/**
 * @process methodologies/planning-with-files/planning-session
 * @description Planning with Files - Session lifecycle management with init, recovery, and state persistence
 * @inputs { taskDescription: string, projectPath: string, sessionId?: string, previousSessionPath?: string }
 * @outputs { success: boolean, sessionId: string, sessionState: object, recoveryReport?: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Planning with Files - Session Lifecycle Manager
 *
 * Adapted from Planning with Files (https://github.com/OthmanAdi/planning-with-files)
 * Manages the full session lifecycle: initialization, state persistence,
 * recovery from interrupted sessions, and session teardown.
 *
 * Session recovery checks for previous planning files and reconstructs
 * the context that may have been lost when the agent context window
 * was reset. This embodies the core principle: "Context Window = RAM;
 * Filesystem = Disk."
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.taskDescription - Description of the task
 * @param {string} inputs.projectPath - Root path for planning files
 * @param {string} inputs.sessionId - Session identifier (optional, auto-generated if missing)
 * @param {string} inputs.previousSessionPath - Path to previous session for recovery (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Session state with recovery report if applicable
 */
export async function process(inputs, ctx) {
  const {
    taskDescription,
    projectPath,
    sessionId = null,
    previousSessionPath = null
  } = inputs;

  ctx.log('Starting Planning with Files session manager');

  // --- Step 1: Detect existing session ---
  const existingSession = await ctx.task(detectSessionTask, {
    projectPath,
    previousSessionPath
  });

  if (existingSession.found) {
    ctx.log('Previous session detected, initiating recovery');

    // --- Step 2a: Recover session ---
    const recoveryReport = await ctx.task(recoverSessionTask, {
      projectPath,
      previousSessionPath: existingSession.path,
      taskDescription
    });

    await ctx.breakpoint({
      question: `Previous session found (last active: ${recoveryReport.lastActiveTimestamp}). ${recoveryReport.completedPhases}/${recoveryReport.totalPhases} phases were completed. ${recoveryReport.lostContextEstimate} items may need re-evaluation. Resume from recovered state?`,
      title: 'Planning with Files - Session Recovery',
      context: {
        runId: ctx.runId,
        files: [
          { path: `${existingSession.path}/task_plan.md`, format: 'markdown', label: 'Previous Plan' },
          { path: `${existingSession.path}/progress.md`, format: 'markdown', label: 'Previous Progress' }
        ]
      }
    });

    // Merge recovered state into current session
    const mergedSession = await ctx.task(mergeSessionTask, {
      projectPath,
      recoveryReport,
      taskDescription,
      sessionId: sessionId || ctx.runId
    });

    return {
      success: true,
      sessionId: mergedSession.sessionId,
      sessionState: mergedSession.state,
      recoveryReport: {
        recovered: true,
        previousSessionPath: existingSession.path,
        completedPhases: recoveryReport.completedPhases,
        totalPhases: recoveryReport.totalPhases,
        lostContextEstimate: recoveryReport.lostContextEstimate,
        catchupSummary: recoveryReport.catchupSummary
      }
    };
  }

  // --- Step 2b: Initialize fresh session ---
  ctx.log('No previous session found, initializing fresh session');

  const [sessionInit, filesInit] = await ctx.parallel.all([
    ctx.task(initSessionTask, {
      projectPath,
      taskDescription,
      sessionId: sessionId || ctx.runId
    }),
    ctx.task(initSessionFilesTask, {
      projectPath,
      taskDescription
    })
  ]);

  // --- Step 3: Persist session metadata ---
  await ctx.task(persistSessionMetadataTask, {
    projectPath,
    sessionId: sessionInit.sessionId,
    taskDescription,
    initTimestamp: sessionInit.timestamp
  });

  ctx.log(`Session initialized: ${sessionInit.sessionId}`);

  return {
    success: true,
    sessionId: sessionInit.sessionId,
    sessionState: {
      initialized: true,
      timestamp: sessionInit.timestamp,
      planExists: filesInit.planCreated,
      findingsExists: filesInit.findingsCreated,
      progressExists: filesInit.progressCreated
    }
  };
}

// --- Task Definitions ---

const detectSessionTask = defineTask('pwf-detect-session', {
  kind: 'agent',
  title: 'Detect Existing Planning Session',
  labels: ['planning-with-files', 'session', 'detection'],
  io: {
    input: 'Project path and optional previous session path',
    output: 'Detection result with found flag and path'
  },
  agent: 'agents/session-manager',
  instructions: [
    'Check project path for existing task_plan.md, findings.md, progress.md',
    'If previousSessionPath provided, check that location too',
    'Check ~/.claude/projects/ for session data (standard recovery location)',
    'Find last planning file update timestamp',
    'Return whether a previous session exists and its path'
  ]
});

const recoverSessionTask = defineTask('pwf-recover-session', {
  kind: 'agent',
  title: 'Recover Previous Session State',
  labels: ['planning-with-files', 'session', 'recovery'],
  io: {
    input: 'Project path, previous session path, task description',
    output: 'Recovery report with completed phases, lost context estimate, catchup summary'
  },
  agent: 'agents/session-manager',
  instructions: [
    'Parse task_plan.md for checkbox completion state',
    'Parse progress.md for last session log entry and timestamp',
    'Extract post-update conversation context that was lost',
    'Estimate how much context was lost since last file write',
    'Build a catchup report summarizing accomplished work',
    'Identify which phases need re-evaluation vs which are solid'
  ]
});

const mergeSessionTask = defineTask('pwf-merge-session', {
  kind: 'agent',
  title: 'Merge Recovered State into Current Session',
  labels: ['planning-with-files', 'session', 'merge'],
  io: {
    input: 'Project path, recovery report, task description, session ID',
    output: 'Merged session with combined state'
  },
  agent: 'agents/session-manager',
  instructions: [
    'Copy recovered planning files to current project path if different',
    'Add recovery log entry to progress.md',
    'Update session ID in progress.md',
    'Preserve all completed checkbox state from task_plan.md',
    'Mark recovered findings with [recovered] tags',
    'Return merged session state'
  ]
});

const initSessionTask = defineTask('pwf-init-session', {
  kind: 'agent',
  title: 'Initialize Fresh Session',
  labels: ['planning-with-files', 'session', 'init'],
  io: {
    input: 'Project path, task description, session ID',
    output: 'Session initialization confirmation with ID and timestamp'
  },
  agent: 'agents/session-manager',
  instructions: [
    'Create session directory if needed',
    'Generate session ID if not provided',
    'Record session start timestamp',
    'Initialize session metadata',
    'Return session ID and timestamp'
  ]
});

const initSessionFilesTask = defineTask('pwf-init-session-files', {
  kind: 'agent',
  title: 'Initialize Three-File Pattern',
  labels: ['planning-with-files', 'session', 'files'],
  io: {
    input: 'Project path, task description',
    output: 'File creation confirmation for all three files'
  },
  agent: 'agents/plan-architect',
  instructions: [
    'Create task_plan.md with initial template structure',
    'Create findings.md with section headers',
    'Create progress.md with session header',
    'All files must exist before any execution begins (Rule 1)',
    'Return creation confirmation for each file'
  ]
});

const persistSessionMetadataTask = defineTask('pwf-persist-metadata', {
  kind: 'agent',
  title: 'Persist Session Metadata to Disk',
  labels: ['planning-with-files', 'session', 'persistence'],
  io: {
    input: 'Project path, session ID, task description, init timestamp',
    output: 'Metadata persistence confirmation'
  },
  agent: 'agents/session-manager',
  instructions: [
    'Write session metadata to progress.md header section',
    'Include session ID, task description, start timestamp',
    'Filesystem as Memory: all metadata persisted to disk',
    'Ensure metadata survives context window resets'
  ]
});
