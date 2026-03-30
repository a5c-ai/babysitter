/**
 * @process methodologies/ruflo/ruflo-orchestrator
 * @description Ruflo Swarm Orchestrator - Main multi-agent coordination pipeline: routing -> agent selection -> swarm formation -> execution -> consensus -> verification
 * @inputs { task: string, taskType: string, projectRoot?: string, maxAgents?: number, consensusStrategy?: string, qualityThreshold?: number }
 * @outputs { success: boolean, phases: array, swarmResult: object, consensusResult: object, verificationResult: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const assessComplexityTask = defineTask('ruflo-assess-complexity', async (args, _ctx) => {
  return { assessment: args };
}, {
  kind: 'agent',
  title: 'Assess Task Complexity and Route to Execution Tier',
  labels: ['ruflo', 'routing', 'phase-1'],
  io: {
    inputs: { task: 'string', taskType: 'string', projectRoot: 'string' },
    outputs: { complexity: 'string', tier: 'string', estimatedLatency: 'string', estimatedCost: 'string', boostEligible: 'boolean', routingRationale: 'string' }
  }
});

const selectAgentsTask = defineTask('ruflo-select-agents', async (args, _ctx) => {
  return { selection: args };
}, {
  kind: 'agent',
  title: 'Select Specialized Agents for Task Type',
  labels: ['ruflo', 'agent-selection', 'phase-2'],
  io: {
    inputs: { task: 'string', taskType: 'string', complexity: 'string', tier: 'string' },
    outputs: { selectedAgents: 'array', queenType: 'string', workerRoles: 'array', agentCount: 'number', roleJustification: 'object' }
  }
});

const formSwarmTask = defineTask('ruflo-form-swarm', async (args, _ctx) => {
  return { swarm: args };
}, {
  kind: 'agent',
  title: 'Form Agent Swarm with Topology and Consensus Protocol',
  labels: ['ruflo', 'swarm-formation', 'phase-3'],
  io: {
    inputs: { selectedAgents: 'array', queenType: 'string', complexity: 'string', taskType: 'string' },
    outputs: { swarmId: 'string', topology: 'string', consensusProtocol: 'string', agentAssignments: 'array', communicationPlan: 'object' }
  }
});

const executeSwarmTask = defineTask('ruflo-execute-swarm', async (args, _ctx) => {
  return { execution: args };
}, {
  kind: 'agent',
  title: 'Execute Task Through Coordinated Agent Swarm',
  labels: ['ruflo', 'execution', 'phase-4'],
  io: {
    inputs: { swarmId: 'string', task: 'string', agentAssignments: 'array', topology: 'string', projectRoot: 'string' },
    outputs: { agentResults: 'array', intermediateArtifacts: 'array', driftDetected: 'boolean', executionLog: 'array' }
  }
});

const runConsensusTask = defineTask('ruflo-run-consensus', async (args, _ctx) => {
  return { consensus: args };
}, {
  kind: 'agent',
  title: 'Run Consensus Protocol on Agent Results',
  labels: ['ruflo', 'consensus', 'phase-5'],
  io: {
    inputs: { agentResults: 'array', consensusProtocol: 'string', consensusStrategy: 'string', queenWeight: 'number' },
    outputs: { consensusReached: 'boolean', finalDecision: 'object', votingBreakdown: 'object', dissent: 'array', confidence: 'number' }
  }
});

const verifyOutputTask = defineTask('ruflo-verify-output', async (args, _ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify Final Output Against Quality Threshold',
  labels: ['ruflo', 'verification', 'phase-6'],
  io: {
    inputs: { finalDecision: 'object', task: 'string', qualityThreshold: 'number', projectRoot: 'string' },
    outputs: { verified: 'boolean', qualityScore: 'number', issues: 'array', securityCheck: 'object', recommendations: 'array' }
  }
});

const extractLearningsTask = defineTask('ruflo-extract-learnings', async (args, _ctx) => {
  return { learnings: args };
}, {
  kind: 'agent',
  title: 'Extract Patterns and Update RuVector Intelligence',
  labels: ['ruflo', 'learning', 'ruvector'],
  io: {
    inputs: { task: 'string', swarmResult: 'object', consensusResult: 'object', verificationResult: 'object' },
    outputs: { patterns: 'array', routingFeedback: 'object', agentPerformance: 'array', knowledgeUpdates: 'array' }
  }
});

const antiDriftCheckTask = defineTask('ruflo-anti-drift-check', async (args, _ctx) => {
  return { driftCheck: args };
}, {
  kind: 'agent',
  title: 'Anti-Drift Checkpoint: Validate Swarm Alignment',
  labels: ['ruflo', 'anti-drift', 'checkpoint'],
  io: {
    inputs: { swarmId: 'string', agentResults: 'array', originalTask: 'string', topology: 'string' },
    outputs: { aligned: 'boolean', driftScore: 'number', deviations: 'array', correctionPlan: 'object' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Ruflo Swarm Orchestrator Process
 *
 * Implements the full Ruflo v3 multi-agent orchestration pipeline:
 * 1. Complexity Assessment & Smart Routing (Q-Learning Router)
 * 2. Agent Selection (Queen + Workers based on task type)
 * 3. Swarm Formation (topology + consensus protocol selection)
 * 4. Coordinated Execution (parallel agent work with anti-drift)
 * 5. Consensus Protocol (weighted voting, Byzantine tolerance)
 * 6. Output Verification (quality gates + security check)
 * 7. Learning Extraction (RuVector pattern persistence)
 *
 * Task-to-Agent Mappings:
 * - Bug Fix: coordinator + researcher + coder + tester
 * - Feature: coordinator + architect + coder + tester + reviewer
 * - Refactor: coordinator + architect + coder + reviewer
 * - Performance: coordinator + optimizer + coder
 * - Security: coordinator + security-auditor + coder
 *
 * Attribution: Adapted from https://github.com/ruvnet/ruflo by ruvnet
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task description
 * @param {string} inputs.taskType - bug-fix|feature|refactor|performance|security
 * @param {string} inputs.projectRoot - Project root directory
 * @param {number} inputs.maxAgents - Maximum agents in swarm (default: 8)
 * @param {string} inputs.consensusStrategy - majority|weighted|byzantine|unanimous (default: weighted)
 * @param {number} inputs.qualityThreshold - Minimum quality score (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Orchestration results
 */
export async function process(inputs, ctx) {
  const {
    task,
    taskType = 'feature',
    projectRoot = '.',
    maxAgents = 8,
    consensusStrategy = 'weighted',
    qualityThreshold = 80
  } = inputs;

  ctx.log('Ruflo: Starting swarm orchestration', { task, taskType });

  // ============================================================================
  // PHASE 1: COMPLEXITY ASSESSMENT & SMART ROUTING
  // ============================================================================

  ctx.log('Phase 1: Complexity assessment and smart routing');

  const complexityResult = await ctx.task(assessComplexityTask, {
    task,
    taskType,
    projectRoot
  });

  ctx.log('Routing decision', {
    complexity: complexityResult.complexity,
    tier: complexityResult.tier,
    boostEligible: complexityResult.boostEligible
  });

  // ============================================================================
  // PHASE 2: AGENT SELECTION
  // ============================================================================

  ctx.log('Phase 2: Selecting specialized agents');

  const agentSelection = await ctx.task(selectAgentsTask, {
    task,
    taskType,
    complexity: complexityResult.complexity,
    tier: complexityResult.tier
  });

  ctx.log('Agent selection complete', {
    queenType: agentSelection.queenType,
    agentCount: agentSelection.agentCount,
    roles: agentSelection.workerRoles
  });

  // ============================================================================
  // PHASE 3: SWARM FORMATION
  // ============================================================================

  ctx.log('Phase 3: Forming agent swarm');

  const swarmResult = await ctx.task(formSwarmTask, {
    selectedAgents: agentSelection.selectedAgents,
    queenType: agentSelection.queenType,
    complexity: complexityResult.complexity,
    taskType
  });

  ctx.log('Swarm formed', {
    swarmId: swarmResult.swarmId,
    topology: swarmResult.topology,
    consensus: swarmResult.consensusProtocol
  });

  await ctx.breakpoint({
    question: `Swarm formed: ${agentSelection.agentCount} agents in ${swarmResult.topology} topology with ${swarmResult.consensusProtocol} consensus. Task: "${task}". Approve to begin execution.`,
    title: 'Ruflo: Swarm Formation Complete - Approve Execution',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 4: COORDINATED EXECUTION WITH ANTI-DRIFT
  // ============================================================================

  ctx.log('Phase 4: Executing through coordinated swarm');

  // Parallel execution: run swarm execution and then anti-drift in quick succession
  const executionResult = await ctx.task(executeSwarmTask, {
    swarmId: swarmResult.swarmId,
    task,
    agentAssignments: swarmResult.agentAssignments,
    topology: swarmResult.topology,
    projectRoot
  });

  // Anti-drift checkpoint + consensus run in parallel to maximize throughput
  ctx.log('Phase 4b: Anti-drift checkpoint + consensus preparation (parallel)');

  const [driftResult, consensusResult] = await ctx.parallel.all([
    ctx.task(antiDriftCheckTask, {
      swarmId: swarmResult.swarmId,
      agentResults: executionResult.agentResults,
      originalTask: task,
      topology: swarmResult.topology
    }),
    ctx.task(runConsensusTask, {
      agentResults: executionResult.agentResults,
      consensusProtocol: swarmResult.consensusProtocol,
      consensusStrategy,
      queenWeight: 3
    })
  ]);

  if (!driftResult.aligned) {
    ctx.log('Drift detected, requesting human review', { driftScore: driftResult.driftScore });
    await ctx.breakpoint({
      question: `Anti-drift check detected deviations (score: ${driftResult.driftScore}). Deviations: ${driftResult.deviations.join('; ')}. Review correction plan and approve to continue.`,
      title: 'Ruflo: Drift Detected - Review Required',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 5: CONSENSUS VALIDATION
  // ============================================================================

  ctx.log('Phase 5: Validating consensus result');

  if (!consensusResult.consensusReached) {
    await ctx.breakpoint({
      question: `Consensus not reached (confidence: ${consensusResult.confidence}%). Dissenting views: ${consensusResult.dissent.map(d => d.agent).join(', ')}. Review voting breakdown and decide.`,
      title: 'Ruflo: Consensus Not Reached',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 6: OUTPUT VERIFICATION
  // ============================================================================

  ctx.log('Phase 6: Verifying output quality');

  let verified = false;
  let verificationAttempts = 0;
  let verificationResult = null;
  const maxVerificationAttempts = 3;

  while (!verified && verificationAttempts < maxVerificationAttempts) {
    verificationAttempts++;

    verificationResult = await ctx.task(verifyOutputTask, {
      finalDecision: consensusResult.finalDecision,
      task,
      qualityThreshold,
      projectRoot
    });

    verified = verificationResult.verified;

    if (!verified) {
      ctx.log('Verification failed', {
        attempt: verificationAttempts,
        score: verificationResult.qualityScore,
        threshold: qualityThreshold
      });

      if (verificationAttempts >= maxVerificationAttempts) {
        await ctx.breakpoint({
          question: `Output verification failed after ${maxVerificationAttempts} attempts. Score: ${verificationResult.qualityScore}/${qualityThreshold}. Issues: ${verificationResult.issues.join('; ')}. Escalating to human.`,
          title: 'Ruflo: Verification Escalation',
          context: { runId: ctx.runId }
        });
        break;
      }
    }
  }

  // ============================================================================
  // PHASE 7: LEARNING EXTRACTION (RuVector)
  // ============================================================================

  ctx.log('Phase 7: Extracting learnings for RuVector intelligence');

  const learningsResult = await ctx.task(extractLearningsTask, {
    task,
    swarmResult: {
      topology: swarmResult.topology,
      agentCount: agentSelection.agentCount,
      consensusProtocol: swarmResult.consensusProtocol
    },
    consensusResult: {
      reached: consensusResult.consensusReached,
      confidence: consensusResult.confidence,
      strategy: consensusStrategy
    },
    verificationResult: {
      verified,
      score: verificationResult?.qualityScore,
      attempts: verificationAttempts
    }
  });

  return {
    success: verified || verificationResult?.qualityScore >= qualityThreshold * 0.9,
    phases: [
      'complexity-assessment', 'agent-selection', 'swarm-formation',
      'coordinated-execution', 'anti-drift-check', 'consensus-protocol',
      'output-verification', 'learning-extraction'
    ],
    routing: {
      complexity: complexityResult.complexity,
      tier: complexityResult.tier,
      boostEligible: complexityResult.boostEligible
    },
    swarmResult: {
      swarmId: swarmResult.swarmId,
      topology: swarmResult.topology,
      agentCount: agentSelection.agentCount,
      queenType: agentSelection.queenType,
      workerRoles: agentSelection.workerRoles
    },
    consensusResult: {
      reached: consensusResult.consensusReached,
      confidence: consensusResult.confidence,
      strategy: consensusStrategy,
      dissent: consensusResult.dissent
    },
    verificationResult: {
      verified,
      qualityScore: verificationResult?.qualityScore,
      attempts: verificationAttempts,
      securityCheck: verificationResult?.securityCheck
    },
    learnings: learningsResult.patterns,
    summary: {
      task,
      taskType,
      agentsUsed: agentSelection.agentCount,
      topology: swarmResult.topology,
      consensusReached: consensusResult.consensusReached,
      qualityScore: verificationResult?.qualityScore,
      driftDetected: !driftResult.aligned
    },
    metadata: {
      processId: 'methodologies/ruflo/ruflo-orchestrator',
      attribution: 'https://github.com/ruvnet/ruflo',
      author: 'ruvnet',
      timestamp: ctx.now()
    }
  };
}
