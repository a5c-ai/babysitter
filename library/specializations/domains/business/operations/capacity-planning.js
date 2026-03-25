/**
 * @process specializations/domains/business/operations/capacity-planning
 * @description Capacity Requirements Planning Process - Analyze capacity needs against demand forecasts, identify gaps,
 * and develop capacity strategies (lead, lag, match) for effective resource planning.
 * @inputs { planningHorizon: string, demandForecast?: object, currentCapacity?: object, strategy?: string }
 * @outputs { success: boolean, capacityGaps: array, recommendations: array, capacityPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/capacity-planning', {
 *   planningHorizon: '12-months',
 *   demandForecast: { q1: 10000, q2: 12000, q3: 15000, q4: 11000 },
 *   currentCapacity: { production: 11000, warehouse: 50000 },
 *   strategy: 'match'
 * });
 *
 * @references
 * - APICS CPIM Body of Knowledge
 * - Vollmann, T.E. (2005). Manufacturing Planning and Control Systems
 * - Chase, R.B. (2017). Operations and Supply Chain Management
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    planningHorizon = '12-months',
    demandForecast = null,
    currentCapacity = null,
    strategy = 'match',
    resourceTypes = ['equipment', 'labor', 'space'],
    outputDir = 'capacity-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Capacity Requirements Planning for horizon: ${planningHorizon}`);

  // Phase 1: Demand Analysis
  ctx.log('info', 'Phase 1: Demand Analysis and Forecasting');
  const demandAnalysis = await ctx.task(demandAnalysisTask, {
    planningHorizon,
    demandForecast,
    outputDir
  });

  artifacts.push(...demandAnalysis.artifacts);

  // Phase 2: Current Capacity Assessment
  ctx.log('info', 'Phase 2: Current Capacity Assessment');
  const capacityAssessment = await ctx.task(capacityAssessmentTask, {
    currentCapacity,
    resourceTypes,
    outputDir
  });

  artifacts.push(...capacityAssessment.artifacts);

  // Quality Gate: Demand vs Capacity Overview
  await ctx.breakpoint({
    question: `Demand analysis: Peak ${demandAnalysis.peakDemand}, Average ${demandAnalysis.averageDemand}. Current capacity: ${capacityAssessment.totalCapacity}. Initial gap: ${demandAnalysis.peakDemand - capacityAssessment.totalCapacity}. Proceed with detailed gap analysis?`,
    title: 'Capacity Planning Initial Assessment',
    context: {
      runId: ctx.runId,
      demandProfile: demandAnalysis.demandProfile,
      capacityProfile: capacityAssessment.capacityProfile,
      files: [...demandAnalysis.artifacts, ...capacityAssessment.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Capacity-Demand Gap Analysis
  ctx.log('info', 'Phase 3: Capacity-Demand Gap Analysis');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    demandAnalysis,
    capacityAssessment,
    planningHorizon,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Phase 4: Capacity Strategy Development
  ctx.log('info', 'Phase 4: Capacity Strategy Development');
  const strategyDevelopment = await ctx.task(strategyDevelopmentTask, {
    gapAnalysis,
    strategy,
    planningHorizon,
    outputDir
  });

  artifacts.push(...strategyDevelopment.artifacts);

  // Phase 5: Capacity Options Analysis
  ctx.log('info', 'Phase 5: Capacity Options Analysis');
  const optionsAnalysis = await ctx.task(optionsAnalysisTask, {
    gapAnalysis,
    strategyDevelopment,
    resourceTypes,
    outputDir
  });

  artifacts.push(...optionsAnalysis.artifacts);

  // Quality Gate: Strategy and Options Review
  await ctx.breakpoint({
    question: `Strategy: ${strategyDevelopment.recommendedStrategy}. ${optionsAnalysis.options.length} capacity options identified. Total investment range: ${optionsAnalysis.investmentRange}. Review options before planning?`,
    title: 'Capacity Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: strategyDevelopment.recommendedStrategy,
      options: optionsAnalysis.options,
      investmentRange: optionsAnalysis.investmentRange,
      files: [...strategyDevelopment.artifacts, ...optionsAnalysis.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Rough-Cut Capacity Planning
  ctx.log('info', 'Phase 6: Rough-Cut Capacity Planning');
  const rccp = await ctx.task(rccpTask, {
    demandAnalysis,
    optionsAnalysis,
    planningHorizon,
    outputDir
  });

  artifacts.push(...rccp.artifacts);

  // Phase 7: Capacity Requirements Planning (CRP)
  ctx.log('info', 'Phase 7: Detailed Capacity Requirements Planning');
  const crp = await ctx.task(crpTask, {
    rccp,
    demandAnalysis,
    capacityAssessment,
    outputDir
  });

  artifacts.push(...crp.artifacts);

  // Phase 8: Financial Analysis
  ctx.log('info', 'Phase 8: Financial Analysis');
  const financialAnalysis = await ctx.task(financialAnalysisTask, {
    optionsAnalysis,
    crp,
    planningHorizon,
    outputDir
  });

  artifacts.push(...financialAnalysis.artifacts);

  // Phase 9: Risk Assessment
  ctx.log('info', 'Phase 9: Risk Assessment');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    crp,
    demandAnalysis,
    optionsAnalysis,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Phase 10: Capacity Plan Development
  ctx.log('info', 'Phase 10: Final Capacity Plan Development');
  const capacityPlan = await ctx.task(capacityPlanTask, {
    demandAnalysis,
    gapAnalysis,
    strategyDevelopment,
    optionsAnalysis,
    crp,
    financialAnalysis,
    riskAssessment,
    planningHorizon,
    outputDir
  });

  artifacts.push(...capacityPlan.artifacts);

  // Phase 11: Report Generation
  ctx.log('info', 'Phase 11: Report Generation');
  const report = await ctx.task(reportTask, {
    demandAnalysis,
    capacityAssessment,
    gapAnalysis,
    strategyDevelopment,
    optionsAnalysis,
    crp,
    financialAnalysis,
    riskAssessment,
    capacityPlan,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    planningHorizon,
    demandSummary: {
      averageDemand: demandAnalysis.averageDemand,
      peakDemand: demandAnalysis.peakDemand,
      demandVariability: demandAnalysis.variability
    },
    currentCapacity: capacityAssessment.totalCapacity,
    capacityGaps: gapAnalysis.gaps,
    strategy: strategyDevelopment.recommendedStrategy,
    recommendations: optionsAnalysis.recommendations,
    capacityPlan: {
      phases: capacityPlan.implementationPhases,
      timeline: capacityPlan.timeline,
      investment: financialAnalysis.totalInvestment,
      roi: financialAnalysis.roi
    },
    risks: riskAssessment.risks,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/capacity-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Demand Analysis
export const demandAnalysisTask = defineTask('capacity-demand-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Demand Analysis',
  agent: {
    name: 'demand-planner',
    prompt: {
      role: 'Demand Planning Analyst',
      task: 'Analyze demand forecast for capacity planning',
      context: args,
      instructions: [
        '1. Review demand forecast data',
        '2. Analyze demand patterns (trend, seasonality)',
        '3. Calculate average and peak demand',
        '4. Measure demand variability',
        '5. Identify demand drivers',
        '6. Assess forecast accuracy',
        '7. Create demand profile by period',
        '8. Identify high/low demand periods',
        '9. Calculate required capacity per period',
        '10. Document demand analysis'
      ],
      outputFormat: 'JSON with demand analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['demandProfile', 'averageDemand', 'peakDemand', 'variability', 'artifacts'],
      properties: {
        demandProfile: { type: 'array', items: { type: 'object' } },
        averageDemand: { type: 'number' },
        peakDemand: { type: 'number' },
        variability: { type: 'number' },
        trends: { type: 'object' },
        seasonality: { type: 'object' },
        demandDrivers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'demand']
}));

// Task 2: Capacity Assessment
export const capacityAssessmentTask = defineTask('capacity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Current Capacity Assessment',
  agent: {
    name: 'capacity-analyst',
    prompt: {
      role: 'Capacity Analyst',
      task: 'Assess current capacity by resource type',
      context: args,
      instructions: [
        '1. Inventory all capacity resources',
        '2. Measure theoretical capacity',
        '3. Calculate demonstrated capacity',
        '4. Assess effective capacity (accounting losses)',
        '5. Identify capacity constraints',
        '6. Measure current utilization',
        '7. Assess flexibility and scalability',
        '8. Document capacity by resource type',
        '9. Identify capacity improvement opportunities',
        '10. Create capacity profile'
      ],
      outputFormat: 'JSON with capacity assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['capacityProfile', 'totalCapacity', 'utilizationRate', 'artifacts'],
      properties: {
        capacityProfile: { type: 'array', items: { type: 'object' } },
        totalCapacity: { type: 'number' },
        theoreticalCapacity: { type: 'number' },
        demonstratedCapacity: { type: 'number' },
        effectiveCapacity: { type: 'number' },
        utilizationRate: { type: 'number' },
        constraints: { type: 'array', items: { type: 'object' } },
        flexibility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'assessment']
}));

// Task 3: Gap Analysis
export const gapAnalysisTask = defineTask('capacity-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Gap Analysis',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'Capacity Gap Analyst',
      task: 'Analyze gaps between demand and capacity',
      context: args,
      instructions: [
        '1. Compare demand to capacity by period',
        '2. Calculate capacity surplus/deficit',
        '3. Identify timing of gaps',
        '4. Quantify gap magnitude',
        '5. Assess gap by resource type',
        '6. Identify critical gaps (affecting delivery)',
        '7. Calculate capacity cushion needed',
        '8. Model demand scenarios',
        '9. Rank gaps by severity',
        '10. Document gap analysis'
      ],
      outputFormat: 'JSON with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'gapsByPeriod', 'criticalGaps', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              demand: { type: 'number' },
              capacity: { type: 'number' },
              gap: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        gapsByPeriod: { type: 'object' },
        gapsByResource: { type: 'object' },
        criticalGaps: { type: 'array', items: { type: 'object' } },
        capacityCushion: { type: 'number' },
        scenarioAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'gap-analysis']
}));

// Task 4: Strategy Development
export const strategyDevelopmentTask = defineTask('capacity-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Strategy Development',
  agent: {
    name: 'strategy-developer',
    prompt: {
      role: 'Capacity Strategy Developer',
      task: 'Develop capacity strategy (lead, lag, match)',
      context: args,
      instructions: [
        '1. Evaluate lead strategy (add capacity before demand)',
        '2. Evaluate lag strategy (add capacity after demand proven)',
        '3. Evaluate match strategy (incremental additions)',
        '4. Consider business context and risk tolerance',
        '5. Assess capital availability',
        '6. Consider competitive factors',
        '7. Evaluate market uncertainty',
        '8. Assess economies of scale vs flexibility',
        '9. Recommend strategy with rationale',
        '10. Document strategy analysis'
      ],
      outputFormat: 'JSON with strategy recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedStrategy', 'strategyAnalysis', 'artifacts'],
      properties: {
        recommendedStrategy: { type: 'string', enum: ['lead', 'lag', 'match'] },
        strategyAnalysis: {
          type: 'object',
          properties: {
            lead: { type: 'object' },
            lag: { type: 'object' },
            match: { type: 'object' }
          }
        },
        rationale: { type: 'array', items: { type: 'string' } },
        riskAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'strategy']
}));

// Task 5: Options Analysis
export const optionsAnalysisTask = defineTask('capacity-options', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Options Analysis',
  agent: {
    name: 'options-analyst',
    prompt: {
      role: 'Capacity Options Analyst',
      task: 'Analyze capacity addition options',
      context: args,
      instructions: [
        '1. Identify capacity addition options by type',
        '2. Evaluate equipment purchase/lease',
        '3. Evaluate labor additions (shifts, hiring)',
        '4. Evaluate facility expansion',
        '5. Evaluate outsourcing/subcontracting',
        '6. Evaluate overtime options',
        '7. Assess lead times for each option',
        '8. Calculate costs for each option',
        '9. Evaluate flexibility of each option',
        '10. Create options comparison matrix'
      ],
      outputFormat: 'JSON with options analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['options', 'recommendations', 'investmentRange', 'artifacts'],
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              type: { type: 'string' },
              capacityGain: { type: 'number' },
              cost: { type: 'number' },
              leadTime: { type: 'string' },
              flexibility: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'object' } },
        investmentRange: { type: 'string' },
        comparisonMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'options']
}));

// Task 6: Rough-Cut Capacity Planning
export const rccpTask = defineTask('capacity-rccp', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - RCCP',
  agent: {
    name: 'rccp-planner',
    prompt: {
      role: 'RCCP Planner',
      task: 'Develop rough-cut capacity plan',
      context: args,
      instructions: [
        '1. Translate demand into capacity requirements',
        '2. Use bill of capacity or planning factors',
        '3. Calculate work center loads',
        '4. Compare to available capacity',
        '5. Identify overloaded periods',
        '6. Level load across periods where possible',
        '7. Create load/capacity chart',
        '8. Validate master schedule feasibility',
        '9. Identify capacity-constrained periods',
        '10. Document RCCP results'
      ],
      outputFormat: 'JSON with RCCP results'
    },
    outputSchema: {
      type: 'object',
      required: ['loadProfile', 'capacityRequired', 'feasibilityAssessment', 'artifacts'],
      properties: {
        loadProfile: { type: 'array', items: { type: 'object' } },
        capacityRequired: { type: 'object' },
        availableCapacity: { type: 'object' },
        overloadedPeriods: { type: 'array', items: { type: 'object' } },
        loadCapacityChart: { type: 'object' },
        feasibilityAssessment: { type: 'object' },
        levelingOpportunities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'rccp']
}));

// Task 7: Detailed CRP
export const crpTask = defineTask('capacity-crp', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Detailed CRP',
  agent: {
    name: 'crp-planner',
    prompt: {
      role: 'Capacity Requirements Planner',
      task: 'Develop detailed capacity requirements plan',
      context: args,
      instructions: [
        '1. Explode planned orders to operations',
        '2. Calculate detailed work center requirements',
        '3. Apply routings and standard times',
        '4. Account for queue and move times',
        '5. Create detailed load reports',
        '6. Identify infinite vs finite capacity issues',
        '7. Simulate finite capacity schedule',
        '8. Identify schedule adjustments needed',
        '9. Create capacity action plan',
        '10. Document CRP results'
      ],
      outputFormat: 'JSON with CRP results'
    },
    outputSchema: {
      type: 'object',
      required: ['detailedRequirements', 'workCenterLoads', 'capacityPlan', 'artifacts'],
      properties: {
        detailedRequirements: { type: 'array', items: { type: 'object' } },
        workCenterLoads: { type: 'object' },
        loadReports: { type: 'array', items: { type: 'object' } },
        finiteSchedule: { type: 'object' },
        scheduleAdjustments: { type: 'array', items: { type: 'object' } },
        capacityPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'crp']
}));

// Task 8: Financial Analysis
export const financialAnalysisTask = defineTask('capacity-financial', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Financial Analysis',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'Financial Analyst',
      task: 'Analyze financial implications of capacity plan',
      context: args,
      instructions: [
        '1. Calculate total investment required',
        '2. Develop cash flow projection',
        '3. Calculate ROI for capacity investments',
        '4. Calculate NPV and IRR',
        '5. Perform break-even analysis',
        '6. Assess cost per unit impact',
        '7. Compare options financially',
        '8. Assess financing options',
        '9. Develop sensitivity analysis',
        '10. Document financial analysis'
      ],
      outputFormat: 'JSON with financial analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalInvestment', 'roi', 'npv', 'artifacts'],
      properties: {
        totalInvestment: { type: 'number' },
        cashFlowProjection: { type: 'array', items: { type: 'object' } },
        roi: { type: 'number' },
        npv: { type: 'number' },
        irr: { type: 'number' },
        breakEvenAnalysis: { type: 'object' },
        costPerUnitImpact: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'financial']
}));

// Task 9: Risk Assessment
export const riskAssessmentTask = defineTask('capacity-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Risk Assessment',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'Risk Assessment Specialist',
      task: 'Assess risks in capacity plan',
      context: args,
      instructions: [
        '1. Identify demand forecast risks',
        '2. Assess capacity addition execution risks',
        '3. Evaluate technology risks',
        '4. Assess labor availability risks',
        '5. Identify supply chain risks',
        '6. Evaluate market/competitive risks',
        '7. Assess financial risks',
        '8. Develop risk mitigation strategies',
        '9. Create contingency plans',
        '10. Document risk assessment'
      ],
      outputFormat: 'JSON with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigationStrategies', 'contingencyPlans', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        mitigationStrategies: { type: 'array', items: { type: 'object' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        riskMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'risk']
}));

// Task 10: Capacity Plan
export const capacityPlanTask = defineTask('capacity-plan-final', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Final Plan',
  agent: {
    name: 'plan-developer',
    prompt: {
      role: 'Capacity Plan Developer',
      task: 'Develop final capacity plan',
      context: args,
      instructions: [
        '1. Consolidate all analysis results',
        '2. Define implementation phases',
        '3. Create detailed timeline',
        '4. Define resource requirements',
        '5. Establish milestones',
        '6. Define success metrics',
        '7. Create governance structure',
        '8. Define review cadence',
        '9. Create communication plan',
        '10. Document final capacity plan'
      ],
      outputFormat: 'JSON with capacity plan'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationPhases', 'timeline', 'milestones', 'artifacts'],
      properties: {
        implementationPhases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        resources: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        governance: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'final-plan']
}));

// Task 11: Report
export const reportTask = defineTask('capacity-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capacity Planning - Report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate capacity planning report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Present demand analysis',
        '3. Document capacity assessment',
        '4. Present gap analysis',
        '5. Detail strategy recommendation',
        '6. Present options analysis',
        '7. Include financial analysis',
        '8. Present risk assessment',
        '9. Document implementation plan',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity-planning', 'reporting']
}));
