/**
 * @process specializations/ai-agents-conversational/cost-optimization-llm
 * @description Cost Optimization for LLM Applications - Process for reducing LLM operational costs through
 * prompt compression, intelligent caching, model selection strategies, and usage optimization.
 * @inputs { systemName?: string, currentCosts?: object, optimizationGoals?: array, outputDir?: string }
 * @outputs { success: boolean, costAnalysis: object, optimizationStrategies: array, implementedSavings: object, projectedSavings: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/cost-optimization-llm', {
 *   systemName: 'production-chatbot',
 *   currentCosts: { monthlySpend: 10000, avgTokensPerRequest: 2000 },
 *   optimizationGoals: ['reduce-costs-30', 'maintain-quality']
 * });
 *
 * @references
 * - LLMLingua: https://github.com/microsoft/LLMLingua
 * - GPTCache: https://gptcache.io/
 * - Semantic Router: https://github.com/aurelio-labs/semantic-router
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'cost-optimization',
    currentCosts = {},
    optimizationGoals = ['reduce-costs'],
    outputDir = 'cost-optimization-output',
    enableCaching = true,
    enableModelRouting = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cost Optimization for ${systemName}`);

  // ============================================================================
  // PHASE 1: COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current costs');

  const costAnalysis = await ctx.task(costAnalysisTask, {
    systemName,
    currentCosts,
    outputDir
  });

  artifacts.push(...costAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PROMPT COMPRESSION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing prompt compression');

  const promptCompression = await ctx.task(promptCompressionTask, {
    systemName,
    costAnalysis: costAnalysis.analysis,
    outputDir
  });

  artifacts.push(...promptCompression.artifacts);

  // ============================================================================
  // PHASE 3: CACHING STRATEGY
  // ============================================================================

  let cachingStrategy = null;
  if (enableCaching) {
    ctx.log('info', 'Phase 3: Setting up caching strategy');

    cachingStrategy = await ctx.task(cachingStrategyTask, {
      systemName,
      outputDir
    });

    artifacts.push(...cachingStrategy.artifacts);
  }

  // ============================================================================
  // PHASE 4: MODEL ROUTING
  // ============================================================================

  let modelRouting = null;
  if (enableModelRouting) {
    ctx.log('info', 'Phase 4: Implementing model routing');

    modelRouting = await ctx.task(modelRoutingTask, {
      systemName,
      costAnalysis: costAnalysis.analysis,
      outputDir
    });

    artifacts.push(...modelRouting.artifacts);
  }

  // ============================================================================
  // PHASE 5: USAGE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing usage patterns');

  const usageOptimization = await ctx.task(usageOptimizationTask, {
    systemName,
    costAnalysis: costAnalysis.analysis,
    optimizationGoals,
    outputDir
  });

  artifacts.push(...usageOptimization.artifacts);

  // ============================================================================
  // PHASE 6: SAVINGS PROJECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Projecting savings');

  const savingsProjection = await ctx.task(savingsProjectionTask, {
    systemName,
    currentCosts,
    promptCompression: promptCompression.savings,
    caching: cachingStrategy ? cachingStrategy.savings : null,
    modelRouting: modelRouting ? modelRouting.savings : null,
    usageOptimization: usageOptimization.savings,
    outputDir
  });

  artifacts.push(...savingsProjection.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Cost optimization for ${systemName} complete. Projected savings: ${savingsProjection.totalSavingsPercent}%. Review optimization strategies?`,
    title: 'Cost Optimization Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        currentMonthlyCost: currentCosts.monthlySpend,
        projectedSavingsPercent: savingsProjection.totalSavingsPercent,
        enableCaching,
        enableModelRouting
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    costAnalysis: costAnalysis.analysis,
    optimizationStrategies: [
      promptCompression.strategy,
      ...(cachingStrategy ? [cachingStrategy.strategy] : []),
      ...(modelRouting ? [modelRouting.strategy] : []),
      usageOptimization.strategy
    ],
    implementedSavings: {
      promptCompression: promptCompression.savings,
      caching: cachingStrategy ? cachingStrategy.savings : null,
      modelRouting: modelRouting ? modelRouting.savings : null,
      usageOptimization: usageOptimization.savings
    },
    projectedSavings: savingsProjection.totalSavingsPercent,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/cost-optimization-llm',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const costAnalysisTask = defineTask('cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Current Costs - ${args.systemName}`,
  agent: {
    name: 'cost-optimizer',  // AG-OPS-002: Analyzes and reduces LLM token costs
    prompt: {
      role: 'Cost Analyst',
      task: 'Analyze current LLM costs and usage patterns',
      context: args,
      instructions: [
        '1. Analyze token usage patterns',
        '2. Break down costs by model',
        '3. Identify high-cost operations',
        '4. Analyze request patterns',
        '5. Find optimization opportunities',
        '6. Calculate unit economics',
        '7. Create cost breakdown report',
        '8. Save cost analysis'
      ],
      outputFormat: 'JSON with cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        optimizationOpportunities: { type: 'array' },
        costBreakdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost', 'analysis']
}));

export const promptCompressionTask = defineTask('prompt-compression', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Prompt Compression - ${args.systemName}`,
  agent: {
    name: 'compression-developer',
    prompt: {
      role: 'Prompt Compression Developer',
      task: 'Implement prompt compression strategies',
      context: args,
      instructions: [
        '1. Analyze prompt token usage',
        '2. Implement LLMLingua compression',
        '3. Optimize system prompts',
        '4. Reduce context window usage',
        '5. Implement summarization',
        '6. Test compression quality',
        '7. Measure token savings',
        '8. Save compression config'
      ],
      outputFormat: 'JSON with compression strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'savings', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        savings: { type: 'object' },
        compressionCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost', 'compression']
}));

export const cachingStrategyTask = defineTask('caching-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Caching Strategy - ${args.systemName}`,
  agent: {
    name: 'caching-developer',
    prompt: {
      role: 'Caching Strategy Developer',
      task: 'Implement semantic caching for LLM responses',
      context: args,
      instructions: [
        '1. Setup GPTCache or similar',
        '2. Configure embedding-based matching',
        '3. Set cache TTL policies',
        '4. Implement cache invalidation',
        '5. Add cache hit metrics',
        '6. Test cache effectiveness',
        '7. Calculate cache savings',
        '8. Save caching configuration'
      ],
      outputFormat: 'JSON with caching strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'savings', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        savings: { type: 'object' },
        cachingCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost', 'caching']
}));

export const modelRoutingTask = defineTask('model-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Model Routing - ${args.systemName}`,
  agent: {
    name: 'routing-developer',
    prompt: {
      role: 'Model Routing Developer',
      task: 'Implement intelligent model routing',
      context: args,
      instructions: [
        '1. Classify request complexity',
        '2. Setup model tiers',
        '3. Implement routing logic',
        '4. Use cheaper models for simple tasks',
        '5. Add fallback strategies',
        '6. Monitor quality per tier',
        '7. Calculate routing savings',
        '8. Save routing configuration'
      ],
      outputFormat: 'JSON with model routing'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'savings', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        savings: { type: 'object' },
        routingCodePath: { type: 'string' },
        modelTiers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost', 'routing']
}));

export const usageOptimizationTask = defineTask('usage-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Usage Patterns - ${args.systemName}`,
  agent: {
    name: 'usage-optimizer',
    prompt: {
      role: 'Usage Optimizer',
      task: 'Optimize LLM usage patterns',
      context: args,
      instructions: [
        '1. Batch similar requests',
        '2. Implement request deduplication',
        '3. Optimize streaming usage',
        '4. Reduce unnecessary retries',
        '5. Implement token budgets',
        '6. Add usage quotas',
        '7. Calculate usage savings',
        '8. Save optimization config'
      ],
      outputFormat: 'JSON with usage optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'savings', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        savings: { type: 'object' },
        optimizationCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost', 'usage']
}));

export const savingsProjectionTask = defineTask('savings-projection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Project Savings - ${args.systemName}`,
  agent: {
    name: 'savings-analyst',
    prompt: {
      role: 'Savings Analyst',
      task: 'Project total cost savings',
      context: args,
      instructions: [
        '1. Aggregate all savings',
        '2. Calculate total savings %',
        '3. Project monthly savings',
        '4. Estimate ROI',
        '5. Create implementation plan',
        '6. Prioritize optimizations',
        '7. Generate savings report',
        '8. Save projections'
      ],
      outputFormat: 'JSON with savings projection'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSavingsPercent', 'artifacts'],
      properties: {
        totalSavingsPercent: { type: 'number' },
        monthlySavings: { type: 'number' },
        implementationPlan: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost', 'projection']
}));
