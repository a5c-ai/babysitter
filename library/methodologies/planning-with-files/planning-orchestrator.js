/**
 * @process methodologies/planning-with-files/planning-orchestrator
 * @description Planning with Files - Main orchestrator implementing persistent markdown-based planning with filesystem as extended memory
 * @inputs { taskDescription: string, projectPath: string, sessionId?: string, recoveryMode?: boolean, qualityThreshold?: number }
 * @outputs { success: boolean, planFile: string, findingsFile: string, progressFile: string, completionReport: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Planning with Files - Main Orchestrator
 *
 * Adapted from Planning with Files (https://github.com/OthmanAdi/planning-with-files)
 * A persistent markdown-based planning methodology inspired by Manus AI's context
 * engineering patterns. Treats filesystem as extended memory for volatile agent workflows.
 *
 * Central Principle: "Context Window = RAM (volatile); Filesystem = Disk (persistent)"
 *
 * 5 Manus Principles:
 * 1. Filesystem as Memory - Store in files, not context
 * 2. Attention Manipulation - Re-read plan before decisions
 * 3. Error Persistence - Log failures in plan file
 * 4. Goal Tracking - Checkboxes show progress
 * 5. Completion Verification - Stop hook checks all phases
 *
 * Three-File Pattern:
 * - task_plan.md - Phases, goals, progress checkboxes
 * - findings.md - Research, discoveries, decision rationale
 * - progress.md - Session logs, test results, errors
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.taskDescription - Description of the task to plan and execute
 * @param {string} inputs.projectPath - Root path for planning files
 * @param {string} inputs.sessionId - Session identifier for recovery (optional)
 * @param {boolean} inputs.recoveryMode - Whether to attempt session recovery (default: false)
 * @param {number} inputs.qualityThreshold - Minimum completion score 0-100 (default: 80)
 * @param {Array<string>} inputs.phases - Custom phase names (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Plan execution results with file paths and completion report
 */
export async function process(inputs, ctx) {
  const {
    taskDescription,
    projectPath,
    sessionId = null,
    recoveryMode = false,
    qualityThreshold = 80,
    phases = null
  } = inputs;

  ctx.log('Starting Planning with Files orchestrator');
  ctx.log(`Task: ${taskDescription}`);
  ctx.log(`Project path: ${projectPath}`);

  // --- Phase 0: Session Recovery (if applicable) ---
  let recoveredState = null;
  if (recoveryMode && sessionId) {
    ctx.log('Attempting session recovery...');
    recoveredState = await ctx.task(sessionRecoveryTask, {
      sessionId,
      projectPath,
      taskDescription
    });
    ctx.log(`Recovery result: ${recoveredState.recovered ? 'Previous session found' : 'Fresh start'}`);
  }

  // --- Phase 1: Plan Creation ---
  ctx.log('Phase 1: Creating task plan (task_plan.md)');
  const plan = await ctx.task(createPlanTask, {
    taskDescription,
    projectPath,
    recoveredState,
    customPhases: phases
  });

  await ctx.breakpoint({
    question: `Task plan created for "${taskDescription}" with ${plan.phaseCount} phases and ${plan.totalGoals} goals. Review task_plan.md before execution begins?`,
    title: 'Planning with Files - Plan Created',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${projectPath}/task_plan.md`, format: 'markdown', label: 'Task Plan' }
      ]
    }
  });

  // --- Phase 2: Initialize Progress & Findings Files ---
  ctx.log('Phase 2: Initializing findings.md and progress.md');
  const [findingsInit, progressInit] = await ctx.parallel.all([
    ctx.task(initFindingsTask, {
      projectPath,
      taskDescription,
      planSummary: plan.summary
    }),
    ctx.task(initProgressTask, {
      projectPath,
      taskDescription,
      sessionId: sessionId || ctx.runId,
      planPhases: plan.phases
    })
  ]);

  // --- Phase 3: Execute Plan Phases (convergence loop) ---
  ctx.log('Phase 3: Executing plan phases');
  let completionScore = 0;
  let iterationCount = 0;
  const maxIterations = plan.phaseCount * 3;

  while (completionScore < qualityThreshold && iterationCount < maxIterations) {
    iterationCount++;
    ctx.log(`Execution iteration ${iterationCount}/${maxIterations}`);

    // Re-read plan before decisions (Manus Principle 2: Attention Manipulation)
    const currentPlan = await ctx.task(readPlanStateTask, {
      projectPath
    });

    // Find next incomplete phase
    const nextPhase = currentPlan.phases.find(p => !p.complete);
    if (!nextPhase) {
      ctx.log('All phases marked complete');
      break;
    }

    ctx.log(`Executing phase: ${nextPhase.name}`);

    // Execute the phase
    const phaseResult = await ctx.task(executePhaseTask, {
      projectPath,
      taskDescription,
      phase: nextPhase,
      currentFindings: currentPlan.findingsSummary,
      errorHistory: currentPlan.errorHistory
    });

    // Log findings and progress (Manus Principle 1: Filesystem as Memory)
    await ctx.parallel.all([
      ctx.task(appendFindingsTask, {
        projectPath,
        phase: nextPhase.name,
        findings: phaseResult.findings,
        decisions: phaseResult.decisions
      }),
      ctx.task(updateProgressTask, {
        projectPath,
        phase: nextPhase.name,
        result: phaseResult,
        iteration: iterationCount
      })
    ]);

    // Log errors if any (Manus Principle 3: Error Persistence)
    if (phaseResult.errors && phaseResult.errors.length > 0) {
      await ctx.task(logErrorsTask, {
        projectPath,
        phase: nextPhase.name,
        errors: phaseResult.errors,
        iteration: iterationCount
      });
    }

    // Update plan checkboxes (Manus Principle 4: Goal Tracking)
    await ctx.task(updatePlanCheckboxesTask, {
      projectPath,
      phase: nextPhase.name,
      completedGoals: phaseResult.completedGoals
    });

    // Assess completion
    completionScore = await ctx.task(assessCompletionTask, {
      projectPath,
      qualityThreshold
    });

    ctx.log(`Completion score: ${completionScore}/${qualityThreshold}`);

    // Breakpoint between phases for human review
    if (nextPhase.requiresReview) {
      await ctx.breakpoint({
        question: `Phase "${nextPhase.name}" complete (score: ${completionScore}). ${phaseResult.errors?.length || 0} errors logged. Review progress before continuing?`,
        title: `Planning with Files - Phase Complete: ${nextPhase.name}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `${projectPath}/task_plan.md`, format: 'markdown', label: 'Task Plan' },
            { path: `${projectPath}/findings.md`, format: 'markdown', label: 'Findings' },
            { path: `${projectPath}/progress.md`, format: 'markdown', label: 'Progress' }
          ]
        }
      });
    }
  }

  // --- Phase 4: Completion Verification (Manus Principle 5) ---
  ctx.log('Phase 4: Completion verification');
  const verificationResult = await ctx.task(verifyCompletionTask, {
    projectPath,
    taskDescription,
    qualityThreshold,
    iterationCount
  });

  await ctx.breakpoint({
    question: `Planning with Files complete. Score: ${verificationResult.finalScore}/100. ${verificationResult.phasesComplete}/${verificationResult.totalPhases} phases done. ${verificationResult.unresolvedErrors} unresolved errors. Approve final output?`,
    title: 'Planning with Files - Completion Verification',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${projectPath}/task_plan.md`, format: 'markdown', label: 'Final Plan' },
        { path: `${projectPath}/findings.md`, format: 'markdown', label: 'All Findings' },
        { path: `${projectPath}/progress.md`, format: 'markdown', label: 'Full Progress Log' }
      ]
    }
  });

  return {
    success: verificationResult.finalScore >= qualityThreshold,
    planFile: `${projectPath}/task_plan.md`,
    findingsFile: `${projectPath}/findings.md`,
    progressFile: `${projectPath}/progress.md`,
    completionReport: {
      finalScore: verificationResult.finalScore,
      phasesComplete: verificationResult.phasesComplete,
      totalPhases: verificationResult.totalPhases,
      totalIterations: iterationCount,
      unresolvedErrors: verificationResult.unresolvedErrors,
      keyFindings: verificationResult.keyFindings,
      sessionId: sessionId || ctx.runId
    }
  };
}

// --- Task Definitions ---

const sessionRecoveryTask = defineTask('pwf-session-recovery', {
  kind: 'agent',
  title: 'Recover Previous Planning Session',
  labels: ['planning-with-files', 'session', 'recovery'],
  io: {
    input: 'Session ID, project path, and task description',
    output: 'Recovered state with previous progress, findings, and error history'
  },
  agent: 'agents/session-manager',
  instructions: [
    'Check for existing task_plan.md, findings.md, and progress.md at the project path',
    'Parse progress.md for last session timestamp and completed phases',
    'Extract post-update context that may have been lost',
    'Build a catchup report summarizing what was accomplished',
    'Return recovered state or indicate fresh start needed'
  ]
});

const createPlanTask = defineTask('pwf-create-plan', {
  kind: 'agent',
  title: 'Create Task Plan (task_plan.md)',
  labels: ['planning-with-files', 'plan', 'creation'],
  io: {
    input: 'Task description, project path, optional recovered state and custom phases',
    output: 'Plan object with phases, goals, and file path'
  },
  agent: 'agents/plan-architect',
  instructions: [
    'Never start without creating task_plan.md first (Rule 1)',
    'Decompose task into logical phases with clear goals',
    'Each phase gets checkbox-tracked goals',
    'Include phase dependencies and review gates',
    'Write task_plan.md with markdown checkbox format',
    'If recovered state exists, merge with existing plan preserving completed items',
    'Return phase count, total goals, summary, and phase list'
  ]
});

const initFindingsTask = defineTask('pwf-init-findings', {
  kind: 'agent',
  title: 'Initialize Findings File (findings.md)',
  labels: ['planning-with-files', 'findings', 'init'],
  io: {
    input: 'Project path, task description, plan summary',
    output: 'Confirmation of findings.md creation'
  },
  agent: 'agents/findings-curator',
  instructions: [
    'Create findings.md with header section and task context',
    'Include sections for Research, Discoveries, Decisions, and References',
    'Add timestamps for traceability',
    'Filesystem as Memory principle: this file persists all research'
  ]
});

const initProgressTask = defineTask('pwf-init-progress', {
  kind: 'agent',
  title: 'Initialize Progress File (progress.md)',
  labels: ['planning-with-files', 'progress', 'init'],
  io: {
    input: 'Project path, task description, session ID, plan phases',
    output: 'Confirmation of progress.md creation'
  },
  agent: 'agents/execution-monitor',
  instructions: [
    'Create progress.md with session header and phase tracking sections',
    'Include session ID for recovery support',
    'Add sections for Session Log, Test Results, and Errors',
    'Initialize phase progress tracking with status indicators'
  ]
});

const readPlanStateTask = defineTask('pwf-read-plan-state', {
  kind: 'agent',
  title: 'Re-read Plan State (Attention Manipulation)',
  labels: ['planning-with-files', 'plan', 'attention'],
  io: {
    input: 'Project path',
    output: 'Current plan state with phases, completion status, findings summary, error history'
  },
  agent: 'agents/plan-architect',
  instructions: [
    'Re-read task_plan.md before every decision (Manus Principle 2)',
    'Parse checkbox state to determine phase completion',
    'Read findings.md summary for context',
    'Read progress.md error section for history',
    'Return structured state for execution decisions'
  ]
});

const executePhaseTask = defineTask('pwf-execute-phase', {
  kind: 'agent',
  title: 'Execute Plan Phase',
  labels: ['planning-with-files', 'execution', 'phase'],
  io: {
    input: 'Project path, task description, phase details, current findings, error history',
    output: 'Phase result with findings, decisions, completed goals, and errors'
  },
  agent: 'agents/execution-monitor',
  instructions: [
    'Execute the specified phase goals sequentially',
    'Apply 2-Action Rule: save findings after every 2 view/browser operations',
    'Never repeat failures: check error history and mutate approach (Rule 4)',
    'Log ALL errors encountered (Rule 3)',
    'Track which goals were completed',
    'Capture findings and decisions made during execution',
    'Return comprehensive phase result'
  ]
});

const appendFindingsTask = defineTask('pwf-append-findings', {
  kind: 'agent',
  title: 'Append Findings to findings.md',
  labels: ['planning-with-files', 'findings', 'capture'],
  io: {
    input: 'Project path, phase name, findings, decisions',
    output: 'Updated findings.md confirmation'
  },
  agent: 'agents/findings-curator',
  instructions: [
    'Append new findings under the appropriate phase section',
    'Include timestamps on all entries',
    'Record decision rationale with context',
    'Filesystem as Memory: persist everything to disk'
  ]
});

const updateProgressTask = defineTask('pwf-update-progress', {
  kind: 'agent',
  title: 'Update Progress Log (progress.md)',
  labels: ['planning-with-files', 'progress', 'update'],
  io: {
    input: 'Project path, phase name, result, iteration number',
    output: 'Updated progress.md confirmation'
  },
  agent: 'agents/execution-monitor',
  instructions: [
    'Append session log entry with timestamp and iteration number',
    'Record phase result summary',
    'Update test results if any tests were run',
    'Mark phase status indicator'
  ]
});

const logErrorsTask = defineTask('pwf-log-errors', {
  kind: 'agent',
  title: 'Log Errors to Progress File',
  labels: ['planning-with-files', 'errors', 'persistence'],
  io: {
    input: 'Project path, phase name, errors, iteration number',
    output: 'Error logging confirmation'
  },
  agent: 'agents/error-analyst',
  instructions: [
    'Log ALL errors to progress.md error section (Rule 3)',
    'Include error context, stack traces, and reproduction steps',
    'Analyze error patterns to detect recurring issues',
    'Suggest alternative approaches for known failure patterns',
    'Tag errors with phase and iteration for traceability'
  ]
});

const updatePlanCheckboxesTask = defineTask('pwf-update-checkboxes', {
  kind: 'agent',
  title: 'Update Plan Checkboxes (Goal Tracking)',
  labels: ['planning-with-files', 'plan', 'tracking'],
  io: {
    input: 'Project path, phase name, completed goals list',
    output: 'Updated task_plan.md with checked goals'
  },
  agent: 'agents/plan-architect',
  instructions: [
    'Read task_plan.md and locate the specified phase',
    'Check off completed goals using [x] checkbox syntax',
    'Preserve all existing checked items',
    'Goal Tracking principle: checkboxes show progress at a glance'
  ]
});

const assessCompletionTask = defineTask('pwf-assess-completion', {
  kind: 'agent',
  title: 'Assess Completion Score',
  labels: ['planning-with-files', 'verification', 'scoring'],
  io: {
    input: 'Project path, quality threshold',
    output: 'Numeric completion score 0-100'
  },
  agent: 'agents/completion-verifier',
  instructions: [
    'Read task_plan.md and count checked vs unchecked goals',
    'Read progress.md for error count and resolution status',
    'Calculate completion percentage based on goals and quality',
    'Factor in unresolved errors as quality deductions',
    'Return numeric score 0-100'
  ]
});

const verifyCompletionTask = defineTask('pwf-verify-completion', {
  kind: 'agent',
  title: 'Final Completion Verification',
  labels: ['planning-with-files', 'verification', 'final'],
  io: {
    input: 'Project path, task description, quality threshold, iteration count',
    output: 'Verification report with final score, phase counts, errors, and key findings'
  },
  agent: 'agents/completion-verifier',
  instructions: [
    'Completion Verification principle: verify all phases before exit',
    'Read all three files: task_plan.md, findings.md, progress.md',
    'Verify every phase has been addressed',
    'Count unresolved errors and assess their severity',
    'Extract key findings from findings.md',
    'Calculate final quality score',
    'Return comprehensive verification report'
  ]
});
