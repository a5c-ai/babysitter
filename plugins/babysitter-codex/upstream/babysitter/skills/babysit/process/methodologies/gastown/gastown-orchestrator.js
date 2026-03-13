/**
 * @process methodologies/gastown/gastown-orchestrator
 * @description Gas Town Mayor Orchestrator - Global coordinator that initiates Convoys, assigns agents, monitors execution, and handles escalations following the GUPP principle
 * @inputs { goal: string, projectRoot?: string, agentPool?: array, maxConvoys?: number, qualityThreshold?: number }
 * @outputs { success: boolean, convoys: array, agentAttribution: object, mergeResults: array, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const setupTownTask = defineTask('gastown-setup-town', async (args, _ctx) => {
  return { town: args };
}, {
  kind: 'agent',
  title: 'Setup Gas Town Infrastructure',
  labels: ['gastown', 'orchestrator', 'setup'],
  io: {
    inputs: { goal: 'string', projectRoot: 'string', agentPool: 'array' },
    outputs: { townConfig: 'object', availableAgents: 'array', hookHierarchy: 'object', gitState: 'object' }
  }
});

const analyzeWorkTask = defineTask('gastown-analyze-work', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Analyze Work and Decompose into MEOWs',
  labels: ['gastown', 'orchestrator', 'analysis'],
  io: {
    inputs: { goal: 'string', townConfig: 'object', projectContext: 'object' },
    outputs: { meows: 'array', dependencies: 'object', estimatedConvoys: 'number', complexity: 'string' }
  }
});

const createConvoyTask = defineTask('gastown-create-convoy', async (args, _ctx) => {
  return { convoy: args };
}, {
  kind: 'agent',
  title: 'Create Convoy Work Order',
  labels: ['gastown', 'orchestrator', 'convoy'],
  io: {
    inputs: { meows: 'array', convoyIndex: 'number', dependencies: 'object', priority: 'string' },
    outputs: { convoyId: 'string', beads: 'array', assignmentPlan: 'object', hooks: 'array' }
  }
});

const assignWorkersTask = defineTask('gastown-assign-workers', async (args, _ctx) => {
  return { assignments: args };
}, {
  kind: 'agent',
  title: 'Assign Workers to Convoy Beads',
  labels: ['gastown', 'orchestrator', 'assignment'],
  io: {
    inputs: { convoyId: 'string', beads: 'array', availableAgents: 'array', assignmentPlan: 'object' },
    outputs: { assignments: 'array', crewAssignments: 'array', polecatAssignments: 'array', hookSetup: 'object' }
  }
});

const monitorExecutionTask = defineTask('gastown-monitor-execution', async (args, _ctx) => {
  return { status: args };
}, {
  kind: 'agent',
  title: 'Monitor Convoy Execution Progress',
  labels: ['gastown', 'orchestrator', 'monitoring'],
  io: {
    inputs: { convoyId: 'string', assignments: 'array', timeout: 'number' },
    outputs: { progress: 'object', stuckAgents: 'array', completedBeads: 'array', pendingBeads: 'array', healthStatus: 'string' }
  }
});

const handleEscalationTask = defineTask('gastown-handle-escalation', async (args, _ctx) => {
  return { resolution: args };
}, {
  kind: 'agent',
  title: 'Handle Escalated Issues',
  labels: ['gastown', 'orchestrator', 'escalation'],
  io: {
    inputs: { issue: 'object', convoyId: 'string', agentId: 'string', context: 'object' },
    outputs: { resolution: 'string', action: 'string', reassignment: 'object', nudgeMessage: 'string' }
  }
});

const mergeReviewTask = defineTask('gastown-merge-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Review Merged Convoy Results',
  labels: ['gastown', 'orchestrator', 'merge-review'],
  io: {
    inputs: { convoyId: 'string', mergedChanges: 'array', qualityThreshold: 'number' },
    outputs: { approved: 'boolean', qualityScore: 'number', issues: 'array', attribution: 'object' }
  }
});

const completionSummaryTask = defineTask('gastown-completion-summary', async (args, _ctx) => {
  return { summary: args };
}, {
  kind: 'agent',
  title: 'Generate Completion Summary with Attribution',
  labels: ['gastown', 'orchestrator', 'summary'],
  io: {
    inputs: { convoys: 'array', mergeResults: 'array', agentAttribution: 'object', goal: 'string' },
    outputs: { summary: 'object', totalBeads: 'number', agentScores: 'object', lessonsLearned: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Gas Town Mayor Orchestrator Process
 *
 * Implements the Mayor workflow from Gas Town: the global coordinator that
 * initiates Convoys, assigns agents (Crew and Polecats), monitors execution,
 * and handles escalations. Follows GUPP: "If there is work on your Hook, YOU MUST RUN IT."
 *
 * Workflow:
 * 1. Setup town infrastructure (agents, hooks, git state)
 * 2. Analyze work and decompose into MEOWs (Molecular Expressions of Work)
 * 3. Create convoys wrapping related beads
 * 4. Assign workers (Crew for persistent, Polecats for transient tasks)
 * 5. Monitor execution, detect stuck agents, handle escalations
 * 6. Review merged results against quality threshold
 * 7. Generate completion summary with attribution
 *
 * Attribution: Adapted from https://github.com/steveyegge/gastown by Steve Yegge
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.goal - The high-level goal to accomplish
 * @param {string} inputs.projectRoot - Project root directory
 * @param {Array} inputs.agentPool - Available agents for assignment
 * @param {number} inputs.maxConvoys - Maximum concurrent convoys (default: 3)
 * @param {number} inputs.qualityThreshold - Minimum quality score (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Orchestration results with attribution
 */
export async function process(inputs, ctx) {
  const {
    goal,
    projectRoot = '.',
    agentPool = ['crew-lead', 'polecat'],
    maxConvoys = 3,
    qualityThreshold = 80
  } = inputs;

  ctx.log('Mayor: Starting Gas Town orchestration', { goal });
  ctx.log('GUPP: If there is work on your Hook, YOU MUST RUN IT.');

  // ============================================================================
  // STEP 1: SETUP TOWN
  // ============================================================================

  ctx.log('Step 1: Setting up Gas Town infrastructure');

  const townResult = await ctx.task(setupTownTask, {
    goal,
    projectRoot,
    agentPool
  });

  // ============================================================================
  // STEP 2: ANALYZE WORK (MEOW Decomposition)
  // ============================================================================

  ctx.log('Step 2: Analyzing work and decomposing into MEOWs');

  const analysisResult = await ctx.task(analyzeWorkTask, {
    goal,
    townConfig: townResult.townConfig,
    projectContext: { projectRoot, gitState: townResult.gitState }
  });

  // Human reviews the decomposition
  await ctx.breakpoint({
    question: `Review the MEOW decomposition: ${analysisResult.meows.length} atomic work units identified across ${analysisResult.estimatedConvoys} convoys. Complexity: ${analysisResult.complexity}. Approve to proceed with convoy creation.`,
    title: 'MEOW Decomposition Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // STEP 3-5: CREATE AND EXECUTE CONVOYS
  // ============================================================================

  const convoyResults = [];
  const allMergeResults = [];
  const agentAttribution = {};
  const convoyCount = Math.min(analysisResult.estimatedConvoys, maxConvoys);

  for (let i = 0; i < convoyCount; i++) {
    ctx.log(`Step 3: Creating Convoy ${i + 1}/${convoyCount}`);

    // Create convoy
    const convoy = await ctx.task(createConvoyTask, {
      meows: analysisResult.meows,
      convoyIndex: i,
      dependencies: analysisResult.dependencies,
      priority: i === 0 ? 'high' : 'normal'
    });

    // Assign workers
    ctx.log(`Step 4: Assigning workers to Convoy ${convoy.convoyId}`);

    const assignments = await ctx.task(assignWorkersTask, {
      convoyId: convoy.convoyId,
      beads: convoy.beads,
      availableAgents: townResult.availableAgents,
      assignmentPlan: convoy.assignmentPlan
    });

    // Monitor execution
    ctx.log(`Step 5: Monitoring Convoy ${convoy.convoyId} execution`);

    const monitorResult = await ctx.task(monitorExecutionTask, {
      convoyId: convoy.convoyId,
      assignments: assignments.assignments,
      timeout: inputs.timeout || 120000
    });

    // Handle stuck agents
    if (monitorResult.stuckAgents.length > 0) {
      ctx.log('Escalation: Stuck agents detected', { count: monitorResult.stuckAgents.length });

      for (const stuckAgent of monitorResult.stuckAgents) {
        const escalation = await ctx.task(handleEscalationTask, {
          issue: { type: 'stuck', agentId: stuckAgent },
          convoyId: convoy.convoyId,
          agentId: stuckAgent,
          context: monitorResult
        });

        ctx.log('Escalation resolved', { action: escalation.action });
      }
    }

    // Merge review
    ctx.log(`Step 6: Reviewing merged results for Convoy ${convoy.convoyId}`);

    const mergeResult = await ctx.task(mergeReviewTask, {
      convoyId: convoy.convoyId,
      mergedChanges: monitorResult.completedBeads,
      qualityThreshold
    });

    if (!mergeResult.approved) {
      await ctx.breakpoint({
        question: `Convoy ${convoy.convoyId} merge review failed (score: ${mergeResult.qualityScore}/${qualityThreshold}). ${mergeResult.issues.length} issues found. Review and decide whether to retry or proceed.`,
        title: `Merge Review Failed: Convoy ${convoy.convoyId}`,
        context: { runId: ctx.runId }
      });
    }

    convoyResults.push({ convoy, assignments, monitorResult, mergeResult });
    allMergeResults.push(mergeResult);

    // Collect attribution
    for (const assignment of assignments.assignments) {
      const agentId = assignment.agentId || 'unknown';
      if (!agentAttribution[agentId]) {
        agentAttribution[agentId] = { beadsCompleted: 0, convoys: [] };
      }
      agentAttribution[agentId].beadsCompleted += 1;
      agentAttribution[agentId].convoys.push(convoy.convoyId);
    }
  }

  // ============================================================================
  // STEP 7: COMPLETION SUMMARY
  // ============================================================================

  ctx.log('Step 7: Generating completion summary with attribution');

  const summaryResult = await ctx.task(completionSummaryTask, {
    convoys: convoyResults,
    mergeResults: allMergeResults,
    agentAttribution,
    goal
  });

  return {
    success: true,
    goal,
    convoys: convoyResults.map(c => ({
      convoyId: c.convoy.convoyId,
      beadCount: c.convoy.beads.length,
      qualityScore: c.mergeResult.qualityScore,
      approved: c.mergeResult.approved
    })),
    agentAttribution,
    mergeResults: allMergeResults,
    summary: summaryResult.summary,
    metadata: {
      processId: 'methodologies/gastown/gastown-orchestrator',
      attribution: 'https://github.com/steveyegge/gastown',
      author: 'Steve Yegge',
      timestamp: ctx.now()
    }
  };
}
