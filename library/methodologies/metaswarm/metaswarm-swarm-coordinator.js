/**
 * @process methodologies/metaswarm/metaswarm-swarm-coordinator
 * @description Metaswarm Swarm Coordinator - Meta-orchestrator managing parallel issues across worktrees, spawning Issue Orchestrators, detecting conflicts, and balancing workload
 * @inputs { issues: array, worktrees?: array, maxConcurrent?: number, priorityRules?: object }
 * @outputs { success: boolean, assignments: array, conflicts: array, completedIssues: array, healthReport: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const scanReadyIssuesTask = defineTask('metaswarm-scan-issues', async (args, _ctx) => {
  return { scan: args };
}, {
  kind: 'agent',
  title: 'Scan and Prioritize Agent-Ready Issues',
  labels: ['metaswarm', 'swarm', 'scanning'],
  io: {
    inputs: { issues: 'array', priorityRules: 'object' },
    outputs: { prioritizedIssues: 'array', priorityBreakdown: 'object', blockedIssues: 'array', estimatedLoad: 'number' }
  }
});

const allocateWorktreesTask = defineTask('metaswarm-allocate-worktrees', async (args, _ctx) => {
  return { allocation: args };
}, {
  kind: 'agent',
  title: 'Allocate Issues to Worktrees',
  labels: ['metaswarm', 'swarm', 'allocation'],
  io: {
    inputs: { prioritizedIssues: 'array', worktrees: 'array', maxConcurrent: 'number' },
    outputs: { assignments: 'array', worktreeUtilization: 'object', queuedIssues: 'array' }
  }
});

const detectConflictsTask = defineTask('metaswarm-detect-conflicts', async (args, _ctx) => {
  return { conflicts: args };
}, {
  kind: 'agent',
  title: 'Detect File, Schema, and Dependency Conflicts',
  labels: ['metaswarm', 'swarm', 'conflict-detection'],
  io: {
    inputs: { assignments: 'array' },
    outputs: { fileConflicts: 'array', schemaConflicts: 'array', dependencyConflicts: 'array', resolutionPlan: 'object' }
  }
});

const spawnOrchestratorTask = defineTask('metaswarm-spawn-orchestrator', async (args, _ctx) => {
  return { orchestrator: args };
}, {
  kind: 'agent',
  title: 'Spawn Issue Orchestrator for Assigned Issue',
  labels: ['metaswarm', 'swarm', 'spawn'],
  io: {
    inputs: { issue: 'object', worktree: 'string', contextBundle: 'object' },
    outputs: { orchestratorId: 'string', pid: 'number', status: 'string', startedAt: 'string' }
  }
});

const monitorHealthTask = defineTask('metaswarm-monitor-health', async (args, _ctx) => {
  return { health: args };
}, {
  kind: 'agent',
  title: 'Monitor Agent Heartbeats and Worktree Health',
  labels: ['metaswarm', 'swarm', 'monitoring'],
  io: {
    inputs: { activeOrchestrators: 'array', worktreeStatus: 'object' },
    outputs: { healthReport: 'object', stuckAgents: 'array', recoveryActions: 'array', utilization: 'number' }
  }
});

const rebalanceWorkloadTask = defineTask('metaswarm-rebalance', async (args, _ctx) => {
  return { rebalance: args };
}, {
  kind: 'agent',
  title: 'Rebalance Workload Across Worktrees',
  labels: ['metaswarm', 'swarm', 'rebalancing'],
  io: {
    inputs: { healthReport: 'object', assignments: 'array', queuedIssues: 'array' },
    outputs: { reassignments: 'array', pausedTasks: 'array', newAssignments: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Metaswarm Swarm Coordinator Process
 *
 * Meta-orchestrator for managing multiple parallel issues. Coordinates across
 * worktrees, spawns dedicated Issue Orchestrators, detects conflicts before
 * they reach PR stage, and maintains workload balance.
 *
 * Autonomous authority:
 * - Assign issues to worktrees
 * - Spawn orchestrators
 * - Rebalance workload
 * - Pause lower-priority tasks for P0/P1
 *
 * Must escalate:
 * - Resource exhaustion
 * - Unresolvable conflicts
 * - Agent failures needing human input
 * - Priority disputes
 *
 * Targets: claim all ready issues within 5 minutes, prevent conflicts from
 * reaching PR stage, maintain >80% worktree utilization.
 *
 * Attribution: Adapted from https://github.com/dsifry/metaswarm by David Sifry
 *
 * @param {Object} inputs - Process inputs
 * @param {Array} inputs.issues - Issues labeled agent-ready
 * @param {Array} inputs.worktrees - Available worktree paths
 * @param {number} inputs.maxConcurrent - Max concurrent orchestrators
 * @param {Object} inputs.priorityRules - Priority hierarchy (P0-P4)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Swarm coordination results
 */
export async function process(inputs, ctx) {
  const {
    issues,
    worktrees = [],
    maxConcurrent = 4,
    priorityRules = { P0: 'critical', P1: 'high', P2: 'medium', P3: 'low', P4: 'backlog' }
  } = inputs;

  ctx.log('Swarm Coordinator: Managing parallel issue orchestration', { issueCount: issues.length });

  // ============================================================================
  // STEP 1: SCAN AND PRIORITIZE
  // ============================================================================

  ctx.log('Step 1: Scanning and prioritizing issues');

  const scanResult = await ctx.task(scanReadyIssuesTask, {
    issues,
    priorityRules
  });

  // ============================================================================
  // STEP 2: ALLOCATE WORKTREES
  // ============================================================================

  ctx.log('Step 2: Allocating issues to worktrees');

  const allocationResult = await ctx.task(allocateWorktreesTask, {
    prioritizedIssues: scanResult.prioritizedIssues,
    worktrees,
    maxConcurrent
  });

  // ============================================================================
  // STEP 3: DETECT CONFLICTS
  // ============================================================================

  ctx.log('Step 3: Pre-emptive conflict detection');

  const conflictResult = await ctx.task(detectConflictsTask, {
    assignments: allocationResult.assignments
  });

  if (conflictResult.schemaConflicts.length > 0 || conflictResult.fileConflicts.length > 0) {
    ctx.log('Conflicts detected, sequencing by priority', {
      fileConflicts: conflictResult.fileConflicts.length,
      schemaConflicts: conflictResult.schemaConflicts.length
    });
  }

  // ============================================================================
  // STEP 4: SPAWN ORCHESTRATORS (parallel for non-conflicting)
  // ============================================================================

  ctx.log('Step 4: Spawning Issue Orchestrators');

  const spawnResults = await ctx.parallel.all(
    allocationResult.assignments.map(assignment =>
      ctx.task(spawnOrchestratorTask, {
        issue: assignment.issue,
        worktree: assignment.worktree,
        contextBundle: { priorityRules, conflicts: conflictResult }
      })
    )
  );

  // ============================================================================
  // STEP 5: MONITOR AND REBALANCE
  // ============================================================================

  ctx.log('Step 5: Monitoring health and rebalancing');

  const healthResult = await ctx.task(monitorHealthTask, {
    activeOrchestrators: spawnResults,
    worktreeStatus: allocationResult.worktreeUtilization
  });

  if (healthResult.stuckAgents.length > 0 || healthResult.utilization < 80) {
    ctx.log('Rebalancing workload', {
      stuckAgents: healthResult.stuckAgents.length,
      utilization: healthResult.utilization
    });

    const rebalanceResult = await ctx.task(rebalanceWorkloadTask, {
      healthReport: healthResult.healthReport,
      assignments: allocationResult.assignments,
      queuedIssues: allocationResult.queuedIssues
    });

    ctx.log('Rebalance complete', {
      reassigned: rebalanceResult.reassignments.length,
      paused: rebalanceResult.pausedTasks.length
    });
  }

  if (healthResult.stuckAgents.length > 0) {
    await ctx.breakpoint({
      question: `${healthResult.stuckAgents.length} agents are stuck and may require human intervention. Recovery actions: ${healthResult.recoveryActions.join(', ')}. Approve automatic recovery or provide manual direction.`,
      title: 'Swarm Coordinator: Agent Recovery Needed',
      context: { runId: ctx.runId }
    });
  }

  return {
    success: true,
    assignments: allocationResult.assignments.map(a => ({
      issue: a.issue.id || a.issue.title,
      worktree: a.worktree,
      priority: a.issue.priority
    })),
    conflicts: {
      file: conflictResult.fileConflicts,
      schema: conflictResult.schemaConflicts,
      dependency: conflictResult.dependencyConflicts
    },
    completedIssues: spawnResults.filter(s => s.status === 'completed').map(s => s.orchestratorId),
    healthReport: healthResult.healthReport,
    summary: {
      totalIssues: issues.length,
      assigned: allocationResult.assignments.length,
      queued: allocationResult.queuedIssues.length,
      conflictsDetected: conflictResult.fileConflicts.length + conflictResult.schemaConflicts.length,
      worktreeUtilization: healthResult.utilization
    },
    metadata: {
      processId: 'methodologies/metaswarm/metaswarm-swarm-coordinator',
      attribution: 'https://github.com/dsifry/metaswarm',
      author: 'David Sifry',
      timestamp: ctx.now()
    }
  };
}
