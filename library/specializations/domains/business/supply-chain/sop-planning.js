/**
 * @process specializations/domains/business/supply-chain/sop-planning
 * @description Sales and Operations Planning (S&OP) - Facilitate monthly S&OP cycle including demand review,
 * supply review, pre-S&OP, and executive S&OP to align demand, supply, and financial plans.
 * @inputs { planningCycle?: string, demandPlan?: object, supplyPlan?: object, financialPlan?: object }
 * @outputs { success: boolean, consensusPlan: object, gapAnalysis: object, decisions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/sop-planning', {
 *   planningCycle: 'monthly',
 *   demandPlan: { forecastId: 'fc-2024-01' },
 *   supplyPlan: { capacityId: 'cap-2024-01' },
 *   financialPlan: { budgetId: 'budget-2024' }
 * });
 *
 * @references
 * - Kinaxis S&OP: https://www.kinaxis.com/
 * - ASCM S&OP Best Practices: https://www.ascm.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    planningCycle = 'monthly',
    planningHorizon = '18-months',
    demandPlan = {},
    supplyPlan = {},
    financialPlan = {},
    productFamilies = [],
    businessUnits = [],
    stakeholders = [],
    outputDir = 'sop-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Sales and Operations Planning (S&OP) Process');

  // ============================================================================
  // PHASE 1: DEMAND REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting Demand Review');

  const demandReview = await ctx.task(demandReviewTask, {
    demandPlan,
    productFamilies,
    planningHorizon,
    outputDir
  });

  artifacts.push(...demandReview.artifacts);

  // ============================================================================
  // PHASE 2: SUPPLY REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting Supply Review');

  const supplyReview = await ctx.task(supplyReviewTask, {
    supplyPlan,
    demandReview,
    productFamilies,
    planningHorizon,
    outputDir
  });

  artifacts.push(...supplyReview.artifacts);

  // ============================================================================
  // PHASE 3: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing Demand-Supply Gap Analysis');

  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    demandReview,
    supplyReview,
    financialPlan,
    productFamilies,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Breakpoint: Review gaps before pre-S&OP
  await ctx.breakpoint({
    question: `Gap analysis complete. ${gapAnalysis.criticalGaps.length} critical gaps identified. Total gap value: $${gapAnalysis.totalGapValue}. Review gaps and scenarios before pre-S&OP meeting?`,
    title: 'S&OP Gap Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        criticalGaps: gapAnalysis.criticalGaps.length,
        totalGapValue: gapAnalysis.totalGapValue,
        scenarios: gapAnalysis.scenarios
      }
    }
  });

  // ============================================================================
  // PHASE 4: PRE-S&OP MEETING PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Preparing Pre-S&OP Meeting');

  const preSopPrep = await ctx.task(preSopPrepTask, {
    demandReview,
    supplyReview,
    gapAnalysis,
    financialPlan,
    stakeholders,
    outputDir
  });

  artifacts.push(...preSopPrep.artifacts);

  // ============================================================================
  // PHASE 5: SCENARIO PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing Resolution Scenarios');

  const scenarioPlanning = await ctx.task(scenarioPlanningTask, {
    gapAnalysis,
    demandReview,
    supplyReview,
    financialPlan,
    outputDir
  });

  artifacts.push(...scenarioPlanning.artifacts);

  // ============================================================================
  // PHASE 6: FINANCIAL RECONCILIATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Reconciling with Financial Plan');

  const financialReconciliation = await ctx.task(financialReconciliationTask, {
    demandReview,
    supplyReview,
    scenarioPlanning,
    financialPlan,
    outputDir
  });

  artifacts.push(...financialReconciliation.artifacts);

  // ============================================================================
  // PHASE 7: EXECUTIVE S&OP PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Preparing Executive S&OP Package');

  const executiveSopPrep = await ctx.task(executiveSopPrepTask, {
    demandReview,
    supplyReview,
    gapAnalysis,
    scenarioPlanning,
    financialReconciliation,
    stakeholders,
    outputDir
  });

  artifacts.push(...executiveSopPrep.artifacts);

  // Breakpoint: Executive S&OP review
  await ctx.breakpoint({
    question: `Executive S&OP package ready. ${executiveSopPrep.decisionsRequired.length} decisions required. Revenue at risk: $${financialReconciliation.revenueAtRisk}. Review executive package?`,
    title: 'Executive S&OP Package Review',
    context: {
      runId: ctx.runId,
      files: executiveSopPrep.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        decisionsRequired: executiveSopPrep.decisionsRequired,
        revenueAtRisk: financialReconciliation.revenueAtRisk,
        recommendedScenario: scenarioPlanning.recommendedScenario
      }
    }
  });

  // ============================================================================
  // PHASE 8: CONSENSUS PLAN GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Consensus Plan');

  const consensusPlan = await ctx.task(consensusPlanTask, {
    executiveSopPrep,
    scenarioPlanning,
    financialReconciliation,
    outputDir
  });

  artifacts.push(...consensusPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    consensusPlan: {
      planVersion: consensusPlan.planVersion,
      demandPlan: consensusPlan.alignedDemandPlan,
      supplyPlan: consensusPlan.alignedSupplyPlan,
      financialPlan: consensusPlan.alignedFinancialPlan
    },
    gapAnalysis: {
      criticalGaps: gapAnalysis.criticalGaps,
      totalGapValue: gapAnalysis.totalGapValue,
      resolutionActions: gapAnalysis.resolutionActions
    },
    decisions: executiveSopPrep.decisionsRequired,
    financialImpact: {
      revenueAtRisk: financialReconciliation.revenueAtRisk,
      plannedRevenue: financialReconciliation.plannedRevenue,
      variance: financialReconciliation.variance
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/sop-planning',
      timestamp: startTime,
      planningCycle,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const demandReviewTask = defineTask('demand-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Demand Review',
  agent: {
    name: 'demand-planner',
    prompt: {
      role: 'Demand Planning Manager',
      task: 'Review and validate demand plan for S&OP cycle',
      context: args,
      instructions: [
        '1. Review statistical forecast baseline',
        '2. Incorporate sales input and market intelligence',
        '3. Adjust for known events (promotions, new products)',
        '4. Validate demand assumptions',
        '5. Identify demand risks and opportunities',
        '6. Document demand plan changes from last cycle',
        '7. Prepare demand review presentation',
        '8. Highlight key demand issues for escalation'
      ],
      outputFormat: 'JSON with demand review results'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedDemand', 'demandRisks', 'artifacts'],
      properties: {
        validatedDemand: { type: 'object' },
        demandRisks: { type: 'array' },
        demandOpportunities: { type: 'array' },
        changesFromLastCycle: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'demand-review']
}));

export const supplyReviewTask = defineTask('supply-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Supply Review',
  agent: {
    name: 'supply-planner',
    prompt: {
      role: 'Supply Planning Manager',
      task: 'Review and validate supply capabilities against demand',
      context: args,
      instructions: [
        '1. Review production capacity by facility',
        '2. Assess supplier capacity and constraints',
        '3. Evaluate inventory positions and targets',
        '4. Identify supply risks and constraints',
        '5. Review capital requirements and investments',
        '6. Assess make vs. buy decisions',
        '7. Document supply plan changes',
        '8. Prepare supply review presentation'
      ],
      outputFormat: 'JSON with supply review results'
    },
    outputSchema: {
      type: 'object',
      required: ['supplyCapability', 'constraints', 'artifacts'],
      properties: {
        supplyCapability: { type: 'object' },
        constraints: { type: 'array' },
        supplyRisks: { type: 'array' },
        capitalRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'supply-review']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Gap Analysis',
  agent: {
    name: 'sop-analyst',
    prompt: {
      role: 'S&OP Analyst',
      task: 'Identify and quantify gaps between demand, supply, and financial plans',
      context: args,
      instructions: [
        '1. Compare demand plan vs. supply capability',
        '2. Identify capacity gaps by product family',
        '3. Calculate gap value (revenue at risk)',
        '4. Prioritize gaps by business impact',
        '5. Identify root causes of gaps',
        '6. Develop potential resolution options',
        '7. Quantify cost of gap closure options',
        '8. Prepare gap analysis summary'
      ],
      outputFormat: 'JSON with gap analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalGaps', 'totalGapValue', 'artifacts'],
      properties: {
        criticalGaps: { type: 'array' },
        totalGapValue: { type: 'number' },
        gapsByFamily: { type: 'object' },
        resolutionActions: { type: 'array' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'gap-analysis']
}));

export const preSopPrepTask = defineTask('pre-sop-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Pre-S&OP Preparation',
  agent: {
    name: 'sop-coordinator',
    prompt: {
      role: 'S&OP Coordinator',
      task: 'Prepare materials and agenda for pre-S&OP meeting',
      context: args,
      instructions: [
        '1. Compile demand and supply review outputs',
        '2. Prepare gap analysis presentation',
        '3. Develop meeting agenda',
        '4. Identify key discussion topics',
        '5. Prepare scenario options for review',
        '6. Document open issues and decisions needed',
        '7. Distribute pre-read materials to stakeholders',
        '8. Schedule and coordinate meeting logistics'
      ],
      outputFormat: 'JSON with pre-S&OP meeting materials'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'discussionTopics', 'artifacts'],
      properties: {
        agenda: { type: 'object' },
        discussionTopics: { type: 'array' },
        openIssues: { type: 'array' },
        preReadMaterials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'pre-sop']
}));

export const scenarioPlanningTask = defineTask('scenario-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Scenario Planning',
  agent: {
    name: 'scenario-planner',
    prompt: {
      role: 'Scenario Planning Specialist',
      task: 'Develop and evaluate resolution scenarios for demand-supply gaps',
      context: args,
      instructions: [
        '1. Develop multiple resolution scenarios',
        '2. Model scenario impacts on revenue and cost',
        '3. Evaluate feasibility of each scenario',
        '4. Assess risk profile of scenarios',
        '5. Calculate ROI for investment scenarios',
        '6. Identify trade-offs between scenarios',
        '7. Recommend preferred scenario with rationale',
        '8. Prepare scenario comparison matrix'
      ],
      outputFormat: 'JSON with scenario analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'recommendedScenario', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        recommendedScenario: { type: 'object' },
        scenarioComparison: { type: 'object' },
        tradeOffs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'scenario-planning']
}));

export const financialReconciliationTask = defineTask('financial-reconciliation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Financial Reconciliation',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'Financial Planning Analyst',
      task: 'Reconcile operational plans with financial targets',
      context: args,
      instructions: [
        '1. Calculate revenue implications of demand plan',
        '2. Calculate cost implications of supply plan',
        '3. Compare to financial budget and targets',
        '4. Identify variances and root causes',
        '5. Quantify revenue at risk from gaps',
        '6. Assess financial impact of scenarios',
        '7. Develop financial recommendations',
        '8. Prepare financial reconciliation summary'
      ],
      outputFormat: 'JSON with financial reconciliation results'
    },
    outputSchema: {
      type: 'object',
      required: ['plannedRevenue', 'revenueAtRisk', 'variance', 'artifacts'],
      properties: {
        plannedRevenue: { type: 'number' },
        revenueAtRisk: { type: 'number' },
        variance: { type: 'object' },
        costImplications: { type: 'object' },
        financialRecommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'financial-reconciliation']
}));

export const executiveSopPrepTask = defineTask('executive-sop-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Executive S&OP Preparation',
  agent: {
    name: 'sop-executive-coordinator',
    prompt: {
      role: 'S&OP Executive Coordinator',
      task: 'Prepare executive S&OP meeting package',
      context: args,
      instructions: [
        '1. Create executive summary of S&OP cycle',
        '2. Highlight key decisions required',
        '3. Present recommended scenarios with rationale',
        '4. Summarize risks and opportunities',
        '5. Prepare KPI dashboard',
        '6. Document assumptions and dependencies',
        '7. Create action item tracker',
        '8. Prepare executive presentation deck'
      ],
      outputFormat: 'JSON with executive S&OP package'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionsRequired', 'executiveSummary', 'artifacts'],
      properties: {
        decisionsRequired: { type: 'array' },
        executiveSummary: { type: 'string' },
        kpiDashboard: { type: 'object' },
        risksAndOpportunities: { type: 'object' },
        presentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'executive-sop']
}));

export const consensusPlanTask = defineTask('consensus-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Consensus Plan Generation',
  agent: {
    name: 'sop-planner',
    prompt: {
      role: 'S&OP Planning Lead',
      task: 'Generate aligned consensus plan based on executive decisions',
      context: args,
      instructions: [
        '1. Incorporate executive decisions into plan',
        '2. Align demand, supply, and financial plans',
        '3. Document plan assumptions and constraints',
        '4. Create actionable plan version',
        '5. Assign ownership for plan execution',
        '6. Set up plan monitoring and tracking',
        '7. Communicate plan to stakeholders',
        '8. Archive S&OP cycle documentation'
      ],
      outputFormat: 'JSON with consensus plan'
    },
    outputSchema: {
      type: 'object',
      required: ['planVersion', 'alignedDemandPlan', 'alignedSupplyPlan', 'artifacts'],
      properties: {
        planVersion: { type: 'string' },
        alignedDemandPlan: { type: 'object' },
        alignedSupplyPlan: { type: 'object' },
        alignedFinancialPlan: { type: 'object' },
        planAssumptions: { type: 'array' },
        ownershipMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sop', 'consensus-plan']
}));
