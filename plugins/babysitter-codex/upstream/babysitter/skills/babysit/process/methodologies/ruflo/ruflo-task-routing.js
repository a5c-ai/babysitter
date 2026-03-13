/**
 * @process methodologies/ruflo/ruflo-task-routing
 * @description Ruflo Smart Task Routing - Complexity assessment -> Agent Booster check -> model selection -> task delegation with Q-Learning router
 * @inputs { task: string, taskType?: string, projectRoot?: string, costBudget?: number, latencyTarget?: string, routingHistory?: array }
 * @outputs { success: boolean, route: object, result: object, routerFeedback: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const analyzeComplexityTask = defineTask('ruflo-analyze-complexity', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Analyze Task Complexity with Feature Extraction',
  labels: ['ruflo', 'routing', 'complexity-analysis'],
  io: {
    inputs: { task: 'string', taskType: 'string', projectRoot: 'string' },
    outputs: { complexity: 'string', features: 'object', tokenEstimate: 'number', scopeMetrics: 'object', riskFactors: 'array' }
  }
});

const checkBoostEligibilityTask = defineTask('ruflo-check-boost', async (args, _ctx) => {
  return { boost: args };
}, {
  kind: 'agent',
  title: 'Check Agent Booster Eligibility for WASM Fast-Path',
  labels: ['ruflo', 'routing', 'agent-booster'],
  io: {
    inputs: { task: 'string', complexity: 'string', features: 'object' },
    outputs: { eligible: 'boolean', boostType: 'string', estimatedSpeedup: 'string', supportedTransforms: 'array', confidence: 'number' }
  }
});

const executeBoostTask = defineTask('ruflo-execute-boost', async (args, _ctx) => {
  return { boostResult: args };
}, {
  kind: 'agent',
  title: 'Execute via Agent Booster WASM Fast-Path (<1ms)',
  labels: ['ruflo', 'routing', 'agent-booster', 'wasm'],
  io: {
    inputs: { task: 'string', boostType: 'string', sourceCode: 'string' },
    outputs: { result: 'object', transformApplied: 'string', executionTime: 'string', cost: 'number', artifacts: 'array' }
  }
});

const qLearningRouteTask = defineTask('ruflo-q-learning-route', async (args, _ctx) => {
  return { route: args };
}, {
  kind: 'agent',
  title: 'Q-Learning Router: Select Optimal Execution Path',
  labels: ['ruflo', 'routing', 'q-learning'],
  io: {
    inputs: { complexity: 'string', features: 'object', costBudget: 'number', latencyTarget: 'string', routingHistory: 'array' },
    outputs: { selectedTier: 'string', modelSelection: 'string', expertMixture: 'array', qValues: 'object', explorationRate: 'number' }
  }
});

const selectMoEExpertsTask = defineTask('ruflo-select-moe-experts', async (args, _ctx) => {
  return { experts: args };
}, {
  kind: 'agent',
  title: 'Select Mixture-of-Experts (8 MoE) for Task',
  labels: ['ruflo', 'routing', 'moe'],
  io: {
    inputs: { complexity: 'string', taskType: 'string', expertMixture: 'array' },
    outputs: { activeExperts: 'array', expertWeights: 'object', gatingScores: 'array', expectedQuality: 'number' }
  }
});

const executeTieredTask = defineTask('ruflo-execute-tiered', async (args, _ctx) => {
  return { execution: args };
}, {
  kind: 'agent',
  title: 'Execute Task Through Selected Tier and Model',
  labels: ['ruflo', 'routing', 'tiered-execution'],
  io: {
    inputs: { task: 'string', selectedTier: 'string', modelSelection: 'string', activeExperts: 'array', projectRoot: 'string' },
    outputs: { result: 'object', executionTime: 'string', tokensUsed: 'number', cost: 'number', quality: 'number', artifacts: 'array' }
  }
});

const updateRouterTask = defineTask('ruflo-update-router', async (args, _ctx) => {
  return { update: args };
}, {
  kind: 'agent',
  title: 'Update Q-Learning Router with Execution Feedback',
  labels: ['ruflo', 'routing', 'feedback', 'learning'],
  io: {
    inputs: { route: 'object', executionResult: 'object', reward: 'number' },
    outputs: { qTableUpdated: 'boolean', newQValue: 'number', policyImproved: 'boolean', explorationDecay: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Ruflo Smart Task Routing Process
 *
 * Implements the Q-Learning-based intelligent routing system:
 * 1. Complexity Analysis - Feature extraction and scope assessment
 * 2. Agent Booster Check - WASM fast-path for simple transforms (352x faster, $0)
 * 3. Q-Learning Routing - Multi-armed bandit for optimal tier selection
 * 4. MoE Expert Selection - 8 Mixture-of-Experts with gating network
 * 5. Tiered Execution - Route to appropriate model/swarm
 * 6. Router Feedback - Update Q-values with execution reward
 *
 * Routing Tiers:
 * - Simple: Agent Booster WASM (<1ms, $0) - var-to-const, add-types, etc.
 * - Medium: Haiku/Sonnet models (~500ms, low cost)
 * - Complex: Opus + multi-agent swarms (2-5s, higher cost)
 *
 * Agent Booster Transforms:
 * - var-to-const, add-types, add-error-handling, async-await
 * - extract-function, inline-variable, add-jsdoc, etc.
 *
 * MoE Experts (8):
 * - Code generation, refactoring, debugging, testing
 * - Architecture, security, documentation, optimization
 *
 * Attribution: Adapted from https://github.com/ruvnet/ruflo by ruvnet
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task to route
 * @param {string} inputs.taskType - Task category
 * @param {string} inputs.projectRoot - Project root
 * @param {number} inputs.costBudget - Max cost (default: 1.0)
 * @param {string} inputs.latencyTarget - fast|standard|thorough (default: standard)
 * @param {Array} inputs.routingHistory - Previous routing decisions for Q-learning
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Routing and execution results
 */
export async function process(inputs, ctx) {
  const {
    task,
    taskType = 'general',
    projectRoot = '.',
    costBudget = 1.0,
    latencyTarget = 'standard',
    routingHistory = []
  } = inputs;

  ctx.log('Ruflo Router: Starting smart routing', { task, taskType, latencyTarget });

  // ============================================================================
  // STEP 1: COMPLEXITY ANALYSIS
  // ============================================================================

  ctx.log('Step 1: Analyzing task complexity');

  const complexityResult = await ctx.task(analyzeComplexityTask, {
    task,
    taskType,
    projectRoot
  });

  ctx.log('Complexity assessed', {
    complexity: complexityResult.complexity,
    tokenEstimate: complexityResult.tokenEstimate,
    riskFactors: complexityResult.riskFactors
  });

  // ============================================================================
  // STEP 2: AGENT BOOSTER CHECK (WASM FAST-PATH)
  // ============================================================================

  ctx.log('Step 2: Checking Agent Booster eligibility');

  const boostCheck = await ctx.task(checkBoostEligibilityTask, {
    task,
    complexity: complexityResult.complexity,
    features: complexityResult.features
  });

  if (boostCheck.eligible && boostCheck.confidence > 0.9) {
    ctx.log('Agent Booster eligible - executing WASM fast-path', {
      boostType: boostCheck.boostType,
      speedup: boostCheck.estimatedSpeedup
    });

    const boostResult = await ctx.task(executeBoostTask, {
      task,
      boostType: boostCheck.boostType,
      sourceCode: task
    });

    // Update router with fast-path result
    await ctx.task(updateRouterTask, {
      route: { tier: 'boost', boostType: boostCheck.boostType },
      executionResult: boostResult,
      reward: 1.0
    });

    return {
      success: true,
      route: {
        tier: 'agent-booster',
        boostType: boostCheck.boostType,
        complexity: complexityResult.complexity,
        modelUsed: 'wasm',
        expertsMixed: []
      },
      result: boostResult.result,
      routerFeedback: { fastPathUsed: true, reward: 1.0 },
      summary: {
        task,
        taskType,
        routed: 'agent-booster',
        executionTime: boostResult.executionTime,
        cost: 0,
        quality: 'fast-path'
      },
      metadata: {
        processId: 'methodologies/ruflo/ruflo-task-routing',
        attribution: 'https://github.com/ruvnet/ruflo',
        author: 'ruvnet',
        timestamp: ctx.now()
      }
    };
  }

  // ============================================================================
  // STEPS 3-4: Q-LEARNING ROUTING + MOE EXPERT SELECTION (parallel)
  // ============================================================================

  ctx.log('Steps 3-4: Q-Learning routing and MoE expert selection (parallel)');

  const [routeDecision, moeResult] = await ctx.parallel.all([
    ctx.task(qLearningRouteTask, {
      complexity: complexityResult.complexity,
      features: complexityResult.features,
      costBudget,
      latencyTarget,
      routingHistory
    }),
    ctx.task(selectMoEExpertsTask, {
      complexity: complexityResult.complexity,
      taskType,
      expertMixture: []
    })
  ]);

  ctx.log('MoE experts selected', {
    activeCount: moeResult.activeExperts.length,
    expectedQuality: moeResult.expectedQuality
  });

  // ============================================================================
  // STEP 5: TIERED EXECUTION
  // ============================================================================

  ctx.log('Step 5: Executing through selected tier');

  if (routeDecision.selectedTier === 'complex') {
    await ctx.breakpoint({
      question: `Task routed to complex tier (Opus + swarm). Estimated cost: ~${costBudget}. Model: ${routeDecision.modelSelection}. Experts: ${moeResult.activeExperts.join(', ')}. Approve execution.`,
      title: 'Ruflo Router: Complex Tier Execution Approval',
      context: { runId: ctx.runId }
    });
  }

  const executionResult = await ctx.task(executeTieredTask, {
    task,
    selectedTier: routeDecision.selectedTier,
    modelSelection: routeDecision.modelSelection,
    activeExperts: moeResult.activeExperts,
    projectRoot
  });

  // ============================================================================
  // STEP 6: ROUTER FEEDBACK (Q-TABLE UPDATE)
  // ============================================================================

  ctx.log('Step 6: Updating Q-Learning router with feedback');

  const reward = executionResult.quality >= 80 ? 1.0 :
                 executionResult.quality >= 60 ? 0.5 :
                 executionResult.quality >= 40 ? 0.2 : -0.5;

  const routerUpdate = await ctx.task(updateRouterTask, {
    route: {
      tier: routeDecision.selectedTier,
      model: routeDecision.modelSelection,
      experts: moeResult.activeExperts
    },
    executionResult: {
      quality: executionResult.quality,
      cost: executionResult.cost,
      executionTime: executionResult.executionTime,
      tokensUsed: executionResult.tokensUsed
    },
    reward
  });

  return {
    success: executionResult.quality >= 60,
    route: {
      tier: routeDecision.selectedTier,
      model: routeDecision.modelSelection,
      complexity: complexityResult.complexity,
      expertsMixed: moeResult.activeExperts,
      explorationRate: routeDecision.explorationRate
    },
    result: executionResult.result,
    routerFeedback: {
      fastPathUsed: false,
      reward,
      qTableUpdated: routerUpdate.qTableUpdated,
      policyImproved: routerUpdate.policyImproved
    },
    summary: {
      task,
      taskType,
      routed: routeDecision.selectedTier,
      model: routeDecision.modelSelection,
      executionTime: executionResult.executionTime,
      cost: executionResult.cost,
      quality: executionResult.quality,
      tokensUsed: executionResult.tokensUsed,
      expertsUsed: moeResult.activeExperts.length
    },
    metadata: {
      processId: 'methodologies/ruflo/ruflo-task-routing',
      attribution: 'https://github.com/ruvnet/ruflo',
      author: 'ruvnet',
      timestamp: ctx.now()
    }
  };
}
