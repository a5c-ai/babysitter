/**
 * @process specializations/domains/business/supply-chain/strategic-sourcing
 * @description Strategic Sourcing Initiative - Execute end-to-end sourcing projects including spend analysis,
 * market assessment, strategy development, RFx process, evaluation, and contract negotiation for major categories.
 * @inputs { category?: string, spendData?: object, currentSuppliers?: array, objectives?: object }
 * @outputs { success: boolean, sourcingStrategy: object, awardRecommendation: object, savings: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/strategic-sourcing', {
 *   category: 'IT Hardware',
 *   spendData: { annual: 5000000, suppliers: [...] },
 *   currentSuppliers: ['Dell', 'HP', 'Lenovo'],
 *   objectives: { costReduction: 15, consolidation: true }
 * });
 *
 * @references
 * - ISM CPSM Certification: https://www.ismworld.org/certification-and-training/certification/cpsm/
 * - Strategic Sourcing Best Practices: https://www.gep.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    category = '',
    spendData = {},
    currentSuppliers = [],
    objectives = {},
    stakeholders = [],
    timeline = '12-weeks',
    sourcingApproach = 'competitive',
    outputDir = 'strategic-sourcing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Strategic Sourcing Initiative for: ${category}`);

  // ============================================================================
  // PHASE 1: SPEND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting spend analysis');

  const spendAnalysis = await ctx.task(spendAnalysisTask, {
    category,
    spendData,
    currentSuppliers,
    outputDir
  });

  artifacts.push(...spendAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: MARKET ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing supply market');

  const marketAssessment = await ctx.task(marketAssessmentTask, {
    category,
    spendAnalysis,
    currentSuppliers,
    outputDir
  });

  artifacts.push(...marketAssessment.artifacts);

  // ============================================================================
  // PHASE 3: STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing sourcing strategy');

  const strategyDevelopment = await ctx.task(strategyDevelopmentTask, {
    category,
    spendAnalysis,
    marketAssessment,
    objectives,
    sourcingApproach,
    outputDir
  });

  artifacts.push(...strategyDevelopment.artifacts);

  // Breakpoint: Review sourcing strategy
  await ctx.breakpoint({
    question: `Sourcing strategy developed for ${category}. Recommended approach: ${strategyDevelopment.recommendedApproach}. Target savings: ${strategyDevelopment.targetSavings}%. Review strategy before RFx?`,
    title: 'Sourcing Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        category,
        approach: strategyDevelopment.recommendedApproach,
        targetSavings: strategyDevelopment.targetSavings,
        keyStrategies: strategyDevelopment.keyStrategies
      }
    }
  });

  // ============================================================================
  // PHASE 4: RFx DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing RFx documents');

  const rfxDevelopment = await ctx.task(rfxDevelopmentTask, {
    category,
    strategyDevelopment,
    objectives,
    stakeholders,
    outputDir
  });

  artifacts.push(...rfxDevelopment.artifacts);

  // ============================================================================
  // PHASE 5: SUPPLIER EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating supplier responses');

  const supplierEvaluation = await ctx.task(supplierEvaluationTask, {
    category,
    rfxDevelopment,
    strategyDevelopment,
    outputDir
  });

  artifacts.push(...supplierEvaluation.artifacts);

  // ============================================================================
  // PHASE 6: NEGOTIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning supplier negotiations');

  const negotiationPlanning = await ctx.task(negotiationPlanningTask, {
    category,
    supplierEvaluation,
    strategyDevelopment,
    objectives,
    outputDir
  });

  artifacts.push(...negotiationPlanning.artifacts);

  // ============================================================================
  // PHASE 7: AWARD RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing award recommendation');

  const awardRecommendation = await ctx.task(awardRecommendationTask, {
    category,
    supplierEvaluation,
    negotiationPlanning,
    objectives,
    outputDir
  });

  artifacts.push(...awardRecommendation.artifacts);

  // Breakpoint: Review award recommendation
  await ctx.breakpoint({
    question: `Award recommendation ready for ${category}. Recommended supplier(s): ${awardRecommendation.recommendedSuppliers.join(', ')}. Projected savings: $${awardRecommendation.projectedSavings}. Approve award?`,
    title: 'Award Recommendation Review',
    context: {
      runId: ctx.runId,
      files: awardRecommendation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        recommendedSuppliers: awardRecommendation.recommendedSuppliers,
        projectedSavings: awardRecommendation.projectedSavings,
        savingsPercentage: awardRecommendation.savingsPercentage
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sourcingStrategy: {
      category,
      approach: strategyDevelopment.recommendedApproach,
      keyStrategies: strategyDevelopment.keyStrategies,
      targetSavings: strategyDevelopment.targetSavings
    },
    awardRecommendation: {
      recommendedSuppliers: awardRecommendation.recommendedSuppliers,
      awardSplit: awardRecommendation.awardSplit,
      contractTerms: awardRecommendation.contractTerms
    },
    savings: {
      projected: awardRecommendation.projectedSavings,
      percentage: awardRecommendation.savingsPercentage,
      costAvoidance: awardRecommendation.costAvoidance
    },
    marketInsights: marketAssessment.marketInsights,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/strategic-sourcing',
      timestamp: startTime,
      category,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const spendAnalysisTask = defineTask('spend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Spend Analysis',
  agent: {
    name: 'spend-analyst',
    prompt: {
      role: 'Procurement Spend Analyst',
      task: 'Analyze category spend and supplier landscape',
      context: args,
      instructions: [
        '1. Aggregate spend data by supplier',
        '2. Identify maverick spend and compliance issues',
        '3. Analyze price trends over time',
        '4. Segment spend by product/service type',
        '5. Identify consolidation opportunities',
        '6. Calculate total cost of ownership (TCO)',
        '7. Benchmark pricing against market rates',
        '8. Document spend insights and opportunities'
      ],
      outputFormat: 'JSON with spend analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSpend', 'supplierBreakdown', 'artifacts'],
      properties: {
        totalSpend: { type: 'number' },
        supplierBreakdown: { type: 'object' },
        maverickSpend: { type: 'number' },
        consolidationOpportunities: { type: 'array' },
        priceTrends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'strategic-sourcing', 'spend-analysis']
}));

export const marketAssessmentTask = defineTask('market-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Market Assessment',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'Supply Market Analyst',
      task: 'Assess supply market dynamics and supplier landscape',
      context: args,
      instructions: [
        '1. Analyze market structure and concentration',
        '2. Identify qualified suppliers in market',
        '3. Assess supplier capabilities and capacity',
        '4. Analyze market trends and forecasts',
        '5. Evaluate switching costs and barriers',
        '6. Assess supply risk factors',
        '7. Identify emerging suppliers and technologies',
        '8. Document market intelligence'
      ],
      outputFormat: 'JSON with market assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['marketInsights', 'qualifiedSuppliers', 'artifacts'],
      properties: {
        marketInsights: { type: 'object' },
        qualifiedSuppliers: { type: 'array' },
        marketConcentration: { type: 'string' },
        supplyRisks: { type: 'array' },
        marketTrends: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'strategic-sourcing', 'market-assessment']
}));

export const strategyDevelopmentTask = defineTask('strategy-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Strategy Development',
  agent: {
    name: 'sourcing-strategist',
    prompt: {
      role: 'Strategic Sourcing Manager',
      task: 'Develop comprehensive sourcing strategy',
      context: args,
      instructions: [
        '1. Apply Kraljic Matrix for category positioning',
        '2. Define sourcing objectives and success criteria',
        '3. Determine optimal sourcing approach',
        '4. Define supplier selection criteria',
        '5. Develop negotiation strategies',
        '6. Plan demand management initiatives',
        '7. Define contract strategy and terms',
        '8. Create sourcing strategy document'
      ],
      outputFormat: 'JSON with sourcing strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedApproach', 'targetSavings', 'keyStrategies', 'artifacts'],
      properties: {
        recommendedApproach: { type: 'string' },
        targetSavings: { type: 'number' },
        keyStrategies: { type: 'array' },
        selectionCriteria: { type: 'object' },
        negotiationStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'strategic-sourcing', 'strategy']
}));

export const rfxDevelopmentTask = defineTask('rfx-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: RFx Development',
  agent: {
    name: 'rfx-specialist',
    prompt: {
      role: 'RFx Development Specialist',
      task: 'Develop comprehensive RFx documents',
      context: args,
      instructions: [
        '1. Define scope and requirements',
        '2. Develop technical specifications',
        '3. Create pricing templates',
        '4. Define evaluation criteria and weights',
        '5. Include terms and conditions',
        '6. Set timeline and milestones',
        '7. Prepare supplier communication',
        '8. Finalize RFx package'
      ],
      outputFormat: 'JSON with RFx documents and structure'
    },
    outputSchema: {
      type: 'object',
      required: ['rfxType', 'evaluationCriteria', 'artifacts'],
      properties: {
        rfxType: { type: 'string' },
        scope: { type: 'object' },
        evaluationCriteria: { type: 'object' },
        timeline: { type: 'object' },
        invitedSuppliers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'strategic-sourcing', 'rfx']
}));

export const supplierEvaluationTask = defineTask('supplier-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Supplier Evaluation',
  agent: {
    name: 'evaluation-analyst',
    prompt: {
      role: 'Supplier Evaluation Analyst',
      task: 'Evaluate supplier RFx responses',
      context: args,
      instructions: [
        '1. Score supplier responses against criteria',
        '2. Normalize and weight evaluation scores',
        '3. Analyze pricing proposals',
        '4. Conduct TCO analysis',
        '5. Assess supplier capabilities',
        '6. Evaluate risk factors',
        '7. Rank suppliers by total score',
        '8. Document evaluation findings'
      ],
      outputFormat: 'JSON with supplier evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['supplierRankings', 'evaluationScores', 'artifacts'],
      properties: {
        supplierRankings: { type: 'array' },
        evaluationScores: { type: 'object' },
        tcoAnalysis: { type: 'object' },
        riskAssessment: { type: 'object' },
        shortlistedSuppliers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'strategic-sourcing', 'evaluation']
}));

export const negotiationPlanningTask = defineTask('negotiation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Negotiation Planning',
  agent: {
    name: 'negotiation-planner',
    prompt: {
      role: 'Negotiation Planning Specialist',
      task: 'Develop negotiation strategy and approach',
      context: args,
      instructions: [
        '1. Identify negotiation priorities',
        '2. Determine BATNA and walk-away points',
        '3. Develop negotiation tactics',
        '4. Identify value levers to negotiate',
        '5. Plan negotiation sequence',
        '6. Prepare negotiation team',
        '7. Define success criteria',
        '8. Create negotiation playbook'
      ],
      outputFormat: 'JSON with negotiation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['negotiationStrategy', 'priorities', 'artifacts'],
      properties: {
        negotiationStrategy: { type: 'object' },
        priorities: { type: 'array' },
        batna: { type: 'object' },
        valueLevers: { type: 'array' },
        negotiationPlaybook: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'strategic-sourcing', 'negotiation']
}));

export const awardRecommendationTask = defineTask('award-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Award Recommendation',
  agent: {
    name: 'sourcing-lead',
    prompt: {
      role: 'Strategic Sourcing Lead',
      task: 'Develop award recommendation for stakeholder approval',
      context: args,
      instructions: [
        '1. Finalize supplier selection',
        '2. Determine award split strategy',
        '3. Calculate projected savings',
        '4. Define contract terms',
        '5. Identify implementation requirements',
        '6. Assess risk and mitigation',
        '7. Prepare executive summary',
        '8. Create award recommendation package'
      ],
      outputFormat: 'JSON with award recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedSuppliers', 'projectedSavings', 'artifacts'],
      properties: {
        recommendedSuppliers: { type: 'array' },
        awardSplit: { type: 'object' },
        projectedSavings: { type: 'number' },
        savingsPercentage: { type: 'number' },
        costAvoidance: { type: 'number' },
        contractTerms: { type: 'object' },
        implementationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'strategic-sourcing', 'award']
}));
