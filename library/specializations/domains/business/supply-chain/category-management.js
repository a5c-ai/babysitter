/**
 * @process specializations/domains/business/supply-chain/category-management
 * @description Category Management - Develop and execute category strategies based on Kraljic Matrix segmentation,
 * market analysis, and spend optimization opportunities.
 * @inputs { categoryName?: string, spendData?: object, suppliers?: array, objectives?: object }
 * @outputs { success: boolean, categoryStrategy: object, kraljicPosition: object, actionPlan: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/category-management', {
 *   categoryName: 'IT Hardware',
 *   spendData: { annual: 10000000, growth: 0.05 },
 *   suppliers: ['Dell', 'HP', 'Lenovo'],
 *   objectives: { costReduction: 10, riskMitigation: true }
 * });
 *
 * @references
 * - GEP Category Management: https://www.gep.com/software
 * - Kraljic Matrix: https://www.mckinsey.com/capabilities/operations/how-we-help-clients/procurement
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    categoryName = '',
    spendData = {},
    suppliers = [],
    objectives = {},
    businessRequirements = {},
    marketData = {},
    outputDir = 'category-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Category Management Process for: ${categoryName}`);

  // ============================================================================
  // PHASE 1: CATEGORY PROFILE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Developing category profile');

  const categoryProfile = await ctx.task(categoryProfileTask, {
    categoryName,
    spendData,
    suppliers,
    businessRequirements,
    outputDir
  });

  artifacts.push(...categoryProfile.artifacts);

  // ============================================================================
  // PHASE 2: SPEND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing category spend');

  const spendAnalysis = await ctx.task(categorySpendAnalysisTask, {
    categoryName,
    spendData,
    suppliers,
    outputDir
  });

  artifacts.push(...spendAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: KRALJIC MATRIX POSITIONING
  // ============================================================================

  ctx.log('info', 'Phase 3: Positioning category in Kraljic Matrix');

  const kraljicPositioning = await ctx.task(kraljicPositioningTask, {
    categoryName,
    categoryProfile,
    spendAnalysis,
    marketData,
    outputDir
  });

  artifacts.push(...kraljicPositioning.artifacts);

  // ============================================================================
  // PHASE 4: SUPPLY MARKET ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing supply market');

  const supplyMarketAnalysis = await ctx.task(supplyMarketAnalysisTask, {
    categoryName,
    suppliers,
    marketData,
    outputDir
  });

  artifacts.push(...supplyMarketAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing category strategy');

  const strategyDevelopment = await ctx.task(categoryStrategyTask, {
    categoryName,
    categoryProfile,
    spendAnalysis,
    kraljicPositioning,
    supplyMarketAnalysis,
    objectives,
    outputDir
  });

  artifacts.push(...strategyDevelopment.artifacts);

  // Breakpoint: Review category strategy
  await ctx.breakpoint({
    question: `Category strategy developed for ${categoryName}. Kraljic Position: ${kraljicPositioning.quadrant}. Recommended approach: ${strategyDevelopment.primaryStrategy}. Review strategy?`,
    title: 'Category Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        categoryName,
        kraljicQuadrant: kraljicPositioning.quadrant,
        primaryStrategy: strategyDevelopment.primaryStrategy,
        savingsTarget: strategyDevelopment.savingsTarget
      }
    }
  });

  // ============================================================================
  // PHASE 6: INITIATIVE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying strategic initiatives');

  const initiativeIdentification = await ctx.task(initiativeIdentificationTask, {
    categoryName,
    strategyDevelopment,
    spendAnalysis,
    objectives,
    outputDir
  });

  artifacts.push(...initiativeIdentification.artifacts);

  // ============================================================================
  // PHASE 7: ACTION PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing action plan');

  const actionPlan = await ctx.task(actionPlanDevelopmentTask, {
    categoryName,
    strategyDevelopment,
    initiativeIdentification,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    categoryStrategy: {
      categoryName,
      primaryStrategy: strategyDevelopment.primaryStrategy,
      strategicApproach: strategyDevelopment.strategicApproach,
      savingsTarget: strategyDevelopment.savingsTarget,
      keyInitiatives: initiativeIdentification.initiatives
    },
    kraljicPosition: {
      quadrant: kraljicPositioning.quadrant,
      supplyRisk: kraljicPositioning.supplyRisk,
      profitImpact: kraljicPositioning.profitImpact,
      recommendedStrategies: kraljicPositioning.recommendedStrategies
    },
    spendInsights: {
      totalSpend: spendAnalysis.totalSpend,
      supplierConcentration: spendAnalysis.supplierConcentration,
      savingsOpportunities: spendAnalysis.savingsOpportunities
    },
    actionPlan: actionPlan.actions,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/category-management',
      timestamp: startTime,
      categoryName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const categoryProfileTask = defineTask('category-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Category Profile Development',
  agent: {
    name: 'category-analyst',
    prompt: {
      role: 'Category Management Analyst',
      task: 'Develop comprehensive category profile',
      context: args,
      instructions: [
        '1. Define category scope and boundaries',
        '2. Identify business stakeholders',
        '3. Document business requirements',
        '4. Map category to business processes',
        '5. Identify critical success factors',
        '6. Document current state assessment',
        '7. Identify pain points and issues',
        '8. Create category profile summary'
      ],
      outputFormat: 'JSON with category profile'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'stakeholders', 'artifacts'],
      properties: {
        scope: { type: 'object' },
        stakeholders: { type: 'array' },
        businessRequirements: { type: 'array' },
        criticalSuccessFactors: { type: 'array' },
        currentState: { type: 'object' },
        painPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'category-management', 'profile']
}));

export const categorySpendAnalysisTask = defineTask('category-spend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Category Spend Analysis',
  agent: {
    name: 'spend-analyst',
    prompt: {
      role: 'Spend Analysis Specialist',
      task: 'Analyze category spend patterns and opportunities',
      context: args,
      instructions: [
        '1. Aggregate spend by supplier',
        '2. Analyze spend trends over time',
        '3. Calculate supplier concentration',
        '4. Identify maverick spend',
        '5. Segment spend by product/service type',
        '6. Benchmark pricing vs. market',
        '7. Identify savings opportunities',
        '8. Document spend insights'
      ],
      outputFormat: 'JSON with spend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSpend', 'supplierConcentration', 'savingsOpportunities', 'artifacts'],
      properties: {
        totalSpend: { type: 'number' },
        spendBySupplier: { type: 'object' },
        supplierConcentration: { type: 'object' },
        maverickSpend: { type: 'number' },
        savingsOpportunities: { type: 'array' },
        pricingBenchmark: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'category-management', 'spend-analysis']
}));

export const kraljicPositioningTask = defineTask('kraljic-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Kraljic Matrix Positioning',
  agent: {
    name: 'strategic-analyst',
    prompt: {
      role: 'Strategic Category Analyst',
      task: 'Position category in Kraljic Matrix',
      context: args,
      instructions: [
        '1. Assess profit impact (spend value, cost impact)',
        '2. Assess supply risk (supplier concentration, availability)',
        '3. Position in Kraljic quadrant',
        '4. Validate positioning with stakeholders',
        '5. Identify appropriate strategies for quadrant',
        '6. Assess movement potential to other quadrants',
        '7. Document positioning rationale',
        '8. Generate Kraljic analysis report'
      ],
      outputFormat: 'JSON with Kraljic positioning'
    },
    outputSchema: {
      type: 'object',
      required: ['quadrant', 'supplyRisk', 'profitImpact', 'artifacts'],
      properties: {
        quadrant: { type: 'string', enum: ['Strategic', 'Leverage', 'Bottleneck', 'Non-Critical'] },
        supplyRisk: { type: 'number' },
        profitImpact: { type: 'number' },
        positioningRationale: { type: 'string' },
        recommendedStrategies: { type: 'array' },
        movementPotential: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'category-management', 'kraljic']
}));

export const supplyMarketAnalysisTask = defineTask('supply-market-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Supply Market Analysis',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'Supply Market Analyst',
      task: 'Analyze supply market dynamics',
      context: args,
      instructions: [
        '1. Assess market structure and concentration',
        '2. Identify key suppliers in market',
        '3. Analyze market trends and forecasts',
        '4. Evaluate switching costs',
        '5. Assess supplier power dynamics',
        '6. Identify emerging technologies/suppliers',
        '7. Evaluate supply risk factors',
        '8. Document market intelligence'
      ],
      outputFormat: 'JSON with supply market analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['marketStructure', 'keySuppliers', 'artifacts'],
      properties: {
        marketStructure: { type: 'object' },
        keySuppliers: { type: 'array' },
        marketTrends: { type: 'array' },
        supplierPower: { type: 'string' },
        switchingCosts: { type: 'object' },
        emergingTrends: { type: 'array' },
        supplyRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'category-management', 'market-analysis']
}));

export const categoryStrategyTask = defineTask('category-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Category Strategy Development',
  agent: {
    name: 'category-strategist',
    prompt: {
      role: 'Category Strategy Manager',
      task: 'Develop comprehensive category strategy',
      context: args,
      instructions: [
        '1. Define strategic objectives for category',
        '2. Select primary strategy based on Kraljic position',
        '3. Define sourcing approach',
        '4. Set savings targets',
        '5. Define supplier relationship strategy',
        '6. Address risk mitigation',
        '7. Define performance metrics',
        '8. Document category strategy'
      ],
      outputFormat: 'JSON with category strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryStrategy', 'strategicApproach', 'savingsTarget', 'artifacts'],
      properties: {
        primaryStrategy: { type: 'string' },
        strategicApproach: { type: 'object' },
        savingsTarget: { type: 'number' },
        sourcingApproach: { type: 'string' },
        supplierStrategy: { type: 'object' },
        riskMitigation: { type: 'array' },
        performanceMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'category-management', 'strategy']
}));

export const initiativeIdentificationTask = defineTask('initiative-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Initiative Identification',
  agent: {
    name: 'initiative-analyst',
    prompt: {
      role: 'Strategic Initiative Analyst',
      task: 'Identify strategic initiatives to execute category strategy',
      context: args,
      instructions: [
        '1. Brainstorm potential initiatives',
        '2. Align initiatives to strategy',
        '3. Estimate savings potential per initiative',
        '4. Assess implementation complexity',
        '5. Prioritize initiatives by value/effort',
        '6. Identify quick wins',
        '7. Define initiative dependencies',
        '8. Document initiative roadmap'
      ],
      outputFormat: 'JSON with strategic initiatives'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'prioritization', 'artifacts'],
      properties: {
        initiatives: { type: 'array' },
        prioritization: { type: 'object' },
        quickWins: { type: 'array' },
        dependencies: { type: 'array' },
        totalSavingsPotential: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'category-management', 'initiatives']
}));

export const actionPlanDevelopmentTask = defineTask('action-plan-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Action Plan Development',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'Category Action Planning Manager',
      task: 'Develop detailed action plan for strategy execution',
      context: args,
      instructions: [
        '1. Define specific actions for each initiative',
        '2. Set timelines and milestones',
        '3. Assign owners and responsibilities',
        '4. Identify resource requirements',
        '5. Define success metrics and KPIs',
        '6. Identify risks and mitigation',
        '7. Create governance structure',
        '8. Document comprehensive action plan'
      ],
      outputFormat: 'JSON with action plan'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'timeline', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        timeline: { type: 'object' },
        milestones: { type: 'array' },
        resourceRequirements: { type: 'object' },
        successMetrics: { type: 'array' },
        risks: { type: 'array' },
        governance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'category-management', 'action-plan']
}));
