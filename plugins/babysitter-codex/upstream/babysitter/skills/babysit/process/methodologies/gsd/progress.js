/**
 * @process gsd/progress
 * @description Progress check and intelligent routing to next action
 * @inputs { projectDir: string }
 * @outputs { success: boolean, route: string, status: object, recommendation: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Progress Check and Routing Process
 *
 * GSD Methodology: Reads STATE.md and ROADMAP.md to determine project position,
 * then routes to one of 6 paths:
 *   A - Execute existing plan (unexecuted plans found)
 *   B - Plan next phase (phase has no plans yet)
 *   C - Verify completed phase (executed but unverified)
 *   D - Complete milestone (all phases verified)
 *   E - Start new milestone (current milestone complete)
 *   F - No project found (initialize with new-project)
 *
 * Agents referenced from agents/ directory:
 *   (none - this is a routing/analysis process)
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config, path operations, project state detection
 *   - state-management: STATE.md reading and analysis
 *   - roadmap-management: ROADMAP.md reading and phase status queries
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Project root directory (default: '.')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with routing decision
 */
export async function process(inputs, ctx) {
  const {
    projectDir = '.'
  } = inputs;

  // ============================================================================
  // PHASE 1: LOAD STATE
  // ============================================================================

  ctx.log('Loading project state...');

  const [stateResult, roadmapResult] = await ctx.parallel.all([
    () => ctx.task(loadStateTask, { projectDir }),
    () => ctx.task(loadRoadmapTask, { projectDir })
  ]);

  const stateExists = stateResult.exists;
  const roadmapExists = roadmapResult.exists;

  // ============================================================================
  // PHASE 2: ANALYZE POSITION
  // ============================================================================

  ctx.log('Analyzing project position...');

  // Route F: No project found
  if (!stateExists || !roadmapExists) {
    ctx.log('No project found - routing to initialization');

    return {
      success: true,
      route: 'F',
      routeName: 'no-project-found',
      status: {
        stateExists,
        roadmapExists,
        milestoneProgress: null,
        currentPhase: null,
        blockers: []
      },
      recommendation: 'No GSD project detected. Run gsd/new-project to initialize.',
      nextProcess: 'gsd/new-project',
      nextInputs: { projectDir },
      metadata: {
        processId: 'gsd/progress',
        timestamp: ctx.now()
      }
    };
  }

  const analysisResult = await ctx.task(analyzePositionTask, {
    state: stateResult.state,
    roadmap: roadmapResult.roadmap,
    projectDir
  });

  const {
    currentPhase,
    completedPhases,
    totalPhases,
    unexecutedPlans,
    unverifiedPhases,
    allPhasesComplete,
    milestoneComplete,
    blockers,
    recentWork
  } = analysisResult;

  // ============================================================================
  // PHASE 3: PRESENT STATUS
  // ============================================================================

  ctx.log('Preparing status display...');

  const statusResult = await ctx.task(formatStatusTask, {
    currentPhase,
    completedPhases,
    totalPhases,
    unexecutedPlans,
    unverifiedPhases,
    allPhasesComplete,
    milestoneComplete,
    blockers,
    recentWork,
    projectDir
  });

  // ============================================================================
  // PHASE 4: ROUTE
  // ============================================================================

  let route;
  let routeName;
  let recommendation;
  let nextProcess;
  let nextInputs;

  if (milestoneComplete) {
    // Route E: All milestone phases completed and verified, milestone also completed
    route = 'E';
    routeName = 'start-new-milestone';
    recommendation = 'Current milestone is complete. Start a new milestone to continue development.';
    nextProcess = 'gsd/new-project'; // Or a future gsd/new-milestone process
    nextInputs = { projectDir, milestoneRollover: true };
  } else if (allPhasesComplete) {
    // Route D: All phases verified, ready for milestone completion
    route = 'D';
    routeName = 'complete-milestone';
    recommendation = `All ${totalPhases} phases verified. Ready to complete milestone: archive, tag, and cleanup.`;
    nextProcess = 'gsd/complete-milestone';
    nextInputs = { projectDir };
  } else if (unverifiedPhases.length > 0) {
    // Route C: Executed but unverified phases exist
    const nextUnverified = unverifiedPhases[0];
    route = 'C';
    routeName = 'verify-phase';
    recommendation = `Phase "${nextUnverified.name}" is executed but unverified. Run verification next.`;
    nextProcess = 'gsd/verify-work';
    nextInputs = {
      projectDir,
      phaseId: nextUnverified.id,
      phaseName: nextUnverified.name
    };
  } else if (unexecutedPlans.length > 0) {
    // Route A: Unexecuted plans exist
    const nextPlan = unexecutedPlans[0];
    route = 'A';
    routeName = 'execute-plan';
    recommendation = `Plan ready for execution in phase "${nextPlan.phaseName}". Execute to make progress.`;
    nextProcess = 'gsd/execute-phase';
    nextInputs = {
      projectDir,
      phaseId: nextPlan.phaseId,
      phaseName: nextPlan.phaseName,
      plans: [nextPlan]
    };
  } else {
    // Route B: Need to plan next phase
    route = 'B';
    routeName = 'plan-next-phase';
    const nextPhase = currentPhase || { id: 'unknown', name: 'next phase' };
    recommendation = `Phase "${nextPhase.name}" needs planning. Create plans before execution.`;
    nextProcess = 'gsd/plan-phase';
    nextInputs = {
      projectDir,
      phaseId: nextPhase.id,
      phaseName: nextPhase.name
    };
  }

  ctx.log(`Route ${route}: ${routeName} - ${recommendation}`);

  // Present routing decision to user
  await ctx.breakpoint({
    question: `${statusResult.statusDisplay}\n\nRecommended next action (Route ${route}): ${recommendation}\n\nProceed with recommended action, or choose a different path?`,
    title: `Progress: Route ${route} - ${routeName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: '.planning/STATE.md', format: 'markdown', label: 'Project State' },
        { path: '.planning/ROADMAP.md', format: 'markdown', label: 'Roadmap' }
      ]
    }
  });

  return {
    success: true,
    route,
    routeName,
    status: {
      currentPhase,
      completedPhases: completedPhases.length,
      totalPhases,
      unexecutedPlans: unexecutedPlans.length,
      unverifiedPhases: unverifiedPhases.length,
      allPhasesComplete,
      milestoneComplete,
      blockers,
      recentWork
    },
    recommendation,
    nextProcess,
    nextInputs,
    statusDisplay: statusResult.statusDisplay,
    metadata: {
      processId: 'gsd/progress',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const loadStateTask = defineTask('load-state', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Load STATE.md',
  description: 'Read and parse STATE.md via state-management skill',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'read',
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'progress', 'state']
}));

export const loadRoadmapTask = defineTask('load-roadmap', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Load ROADMAP.md',
  description: 'Read and parse ROADMAP.md via roadmap-management skill',

  orchestratorTask: {
    payload: {
      skill: 'roadmap-management',
      operation: 'read',
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'progress', 'roadmap']
}));

export const analyzePositionTask = defineTask('analyze-position', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Analyze project position',
  description: 'Determine current phase, completed work, and next actions',

  orchestratorTask: {
    payload: {
      skill: 'gsd-tools',
      operation: 'analyze-position',
      state: args.state,
      roadmap: args.roadmap,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'progress', 'analysis']
}));

export const formatStatusTask = defineTask('format-status', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Format progress status display',
  description: 'Create formatted progress display with milestone %, phase status, blockers',

  orchestratorTask: {
    payload: {
      skill: 'gsd-tools',
      operation: 'format-status',
      currentPhase: args.currentPhase,
      completedPhases: args.completedPhases,
      totalPhases: args.totalPhases,
      unexecutedPlans: args.unexecutedPlans.length,
      unverifiedPhases: args.unverifiedPhases.length,
      allComplete: args.allPhasesComplete,
      milestoneComplete: args.milestoneComplete,
      blockers: args.blockers,
      recentWork: args.recentWork,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'progress', 'display']
}));
