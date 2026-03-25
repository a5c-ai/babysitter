/**
 * @process methodologies/gastown/gastown-patrol
 * @description Gas Town Patrol - Continuous monitoring using Deacon/Witness patterns for health checks, stuck agent detection, and recovery
 * @inputs { townId?: string, patrolInterval?: number, maxCycles?: number, recoveryMode?: string }
 * @outputs { success: boolean, patrolCycles: number, issues: array, recoveries: array, report: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const healthCheckTask = defineTask('gastown-health-check', async (args, _ctx) => {
  return { health: args };
}, {
  kind: 'agent',
  title: 'Run Health Check on All Agents',
  labels: ['gastown', 'patrol', 'health'],
  io: {
    inputs: { townId: 'string', activeAgents: 'array', activeConvoys: 'array' },
    outputs: { healthy: 'array', unhealthy: 'array', warnings: 'array', systemLoad: 'object', timestamp: 'string' }
  }
});

const detectStuckAgentsTask = defineTask('gastown-detect-stuck', async (args, _ctx) => {
  return { stuck: args };
}, {
  kind: 'agent',
  title: 'Detect Stuck or Unresponsive Agents',
  labels: ['gastown', 'patrol', 'detection'],
  io: {
    inputs: { activeAgents: 'array', lastHeartbeats: 'object', stuckThreshold: 'number' },
    outputs: { stuckAgents: 'array', slowAgents: 'array', diagnostics: 'object', recommendations: 'array' }
  }
});

const recoveryActionTask = defineTask('gastown-recovery-action', async (args, _ctx) => {
  return { recovery: args };
}, {
  kind: 'agent',
  title: 'Execute Recovery Action for Failed Agent',
  labels: ['gastown', 'patrol', 'recovery'],
  io: {
    inputs: { agentId: 'string', failureType: 'string', context: 'object', recoveryMode: 'string' },
    outputs: { recovered: 'boolean', action: 'string', newAgentId: 'string', reassignedBeads: 'array', log: 'string' }
  }
});

const patrolReportTask = defineTask('gastown-patrol-report', async (args, _ctx) => {
  return { report: args };
}, {
  kind: 'agent',
  title: 'Generate Patrol Summary Report',
  labels: ['gastown', 'patrol', 'reporting'],
  io: {
    inputs: { cycles: 'array', recoveries: 'array', healthHistory: 'array', townId: 'string' },
    outputs: { report: 'object', overallHealth: 'string', trendAnalysis: 'object', recommendations: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Gas Town Patrol Process
 *
 * Implements the Deacon/Witness monitoring pattern from Gas Town. The Deacon
 * supervises agent health, the Witness manages per-rig lifecycle, and the Boot
 * (Dog) watches the Deacon itself. Patrol runs continuous monitoring cycles.
 *
 * Workflow:
 * 1. Run health checks on all active agents and convoys
 * 2. Detect stuck or unresponsive agents using heartbeat analysis
 * 3. Execute recovery actions (restart, reassign, escalate)
 * 4. Generate patrol summary report with trend analysis
 *
 * The patrol repeats for maxCycles iterations, providing continuous oversight.
 *
 * Attribution: Adapted from https://github.com/steveyegge/gastown by Steve Yegge
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.townId - Town identifier for scoping
 * @param {number} inputs.patrolInterval - Seconds between patrol cycles (default: 300)
 * @param {number} inputs.maxCycles - Maximum patrol cycles (default: 10)
 * @param {string} inputs.recoveryMode - Recovery strategy: 'restart', 'reassign', 'escalate' (default: 'reassign')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Patrol results with health history
 */
export async function process(inputs, ctx) {
  const {
    townId = 'default',
    patrolInterval = 300,
    maxCycles = 10,
    recoveryMode = 'reassign'
  } = inputs;

  ctx.log('Deacon: Starting Gas Town patrol', { townId, maxCycles });

  const allCycles = [];
  const allRecoveries = [];
  const healthHistory = [];

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    ctx.log(`Patrol cycle ${cycle + 1}/${maxCycles}`);

    // ========================================================================
    // HEALTH CHECK
    // ========================================================================

    const healthResult = await ctx.task(healthCheckTask, {
      townId,
      activeAgents: inputs.activeAgents || [],
      activeConvoys: inputs.activeConvoys || []
    });

    healthHistory.push({
      cycle,
      timestamp: healthResult.timestamp,
      healthy: healthResult.healthy.length,
      unhealthy: healthResult.unhealthy.length,
      warnings: healthResult.warnings.length
    });

    // ========================================================================
    // DETECT STUCK AGENTS
    // ========================================================================

    if (healthResult.unhealthy.length > 0 || healthResult.warnings.length > 0) {
      ctx.log('Detecting stuck agents', { unhealthy: healthResult.unhealthy.length });

      const stuckResult = await ctx.task(detectStuckAgentsTask, {
        activeAgents: healthResult.unhealthy.concat(healthResult.warnings),
        lastHeartbeats: inputs.lastHeartbeats || {},
        stuckThreshold: patrolInterval * 2
      });

      // ======================================================================
      // RECOVERY ACTIONS
      // ======================================================================

      for (const stuckAgent of stuckResult.stuckAgents) {
        ctx.log('Executing recovery for stuck agent', { agentId: stuckAgent });

        const recovery = await ctx.task(recoveryActionTask, {
          agentId: stuckAgent,
          failureType: 'stuck',
          context: { cycle, healthResult, diagnostics: stuckResult.diagnostics },
          recoveryMode
        });

        allRecoveries.push({
          cycle,
          agentId: stuckAgent,
          recovered: recovery.recovered,
          action: recovery.action
        });
      }
    }

    allCycles.push({ cycle, health: healthResult, timestamp: ctx.now() });

    // If configured for sleep between cycles, use sleepUntil
    if (cycle < maxCycles - 1 && patrolInterval > 0) {
      ctx.log(`Waiting ${patrolInterval}s before next patrol cycle`);
    }
  }

  // ============================================================================
  // PATROL REPORT
  // ============================================================================

  ctx.log('Generating patrol summary report');

  const reportResult = await ctx.task(patrolReportTask, {
    cycles: allCycles,
    recoveries: allRecoveries,
    healthHistory,
    townId
  });

  return {
    success: true,
    townId,
    patrolCycles: allCycles.length,
    issues: allRecoveries.filter(r => !r.recovered),
    recoveries: allRecoveries,
    report: reportResult.report,
    healthTrend: reportResult.trendAnalysis,
    metadata: {
      processId: 'methodologies/gastown/gastown-patrol',
      attribution: 'https://github.com/steveyegge/gastown',
      author: 'Steve Yegge',
      timestamp: ctx.now()
    }
  };
}
