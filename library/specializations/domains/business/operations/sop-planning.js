/**
 * @process specializations/domains/business/operations/sop-planning
 * @description Sales and Operations Planning (S&OP) process implementation for aligning
 *              demand, supply, and financial plans. Establishes a cross-functional planning
 *              process to balance demand and supply at the aggregate level.
 * @inputs {
 *   organizationContext: { industry: string, businessModel: string, planningHorizon: string },
 *   demandData: { historicalSales: object[], forecasts: object[], customerCommitments: object },
 *   supplyData: { capacity: object, inventory: object, supplierLeadTimes: object },
 *   financialTargets: { revenueTargets: object, marginTargets: object, budgetConstraints: object },
 *   processScope: { productFamilies: string[], geographies: string[], planningCycle: string }
 * }
 * @outputs {
 *   demandPlan: { unconstrainedDemand: object, consensusDemand: object, demandAssumptions: object[] },
 *   supplyPlan: { capacityPlan: object, inventoryPlan: object, supplyCommitments: object },
 *   integratedPlan: { balancedPlan: object, gaps: object[], resolutions: object[] },
 *   executiveSummary: { recommendations: object[], decisions: object[], performanceProjections: object }
 * }
 * @example
 * // Input
 * {
 *   organizationContext: { industry: "consumer-goods", businessModel: "make-to-stock", planningHorizon: "18-months" },
 *   demandData: { historicalSales: [...], forecasts: [...], customerCommitments: {...} },
 *   supplyData: { capacity: {...}, inventory: {...}, supplierLeadTimes: {...} },
 *   financialTargets: { revenueTargets: {...}, marginTargets: {...}, budgetConstraints: {...} },
 *   processScope: { productFamilies: ["Category-A", "Category-B"], geographies: ["NA", "EU"], planningCycle: "monthly" }
 * }
 * @references APICS S&OP Framework, IBP Best Practices, Demand-Driven S&OP
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, demandData, supplyData, financialTargets, processScope } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Data Collection and Preparation
  const dataPreparation = await ctx.task(prepareData, {
    demandData,
    supplyData,
    processScope
  });
  artifacts.push({ phase: 'data-preparation', output: dataPreparation });

  // Phase 2: Statistical Forecasting
  const statisticalForecast = await ctx.task(generateStatisticalForecast, {
    dataPreparation,
    demandData,
    organizationContext
  });
  artifacts.push({ phase: 'statistical-forecast', output: statisticalForecast });

  // Phase 3: Demand Review and Consensus
  const demandConsensus = await ctx.task(buildDemandConsensus, {
    statisticalForecast,
    demandData,
    processScope
  });
  artifacts.push({ phase: 'demand-consensus', output: demandConsensus });

  // Quality Gate: Demand Plan Review
  await ctx.breakpoint('demand-plan-review', {
    title: 'Demand Plan Review',
    description: 'Review and approve consensus demand plan before supply planning',
    artifacts: [demandConsensus, statisticalForecast]
  });

  // Phase 4: Supply Capacity Analysis
  const capacityAnalysis = await ctx.task(analyzeCapacity, {
    demandConsensus,
    supplyData,
    organizationContext
  });
  artifacts.push({ phase: 'capacity-analysis', output: capacityAnalysis });

  // Phase 5: Inventory Planning
  const inventoryPlan = await ctx.task(planInventory, {
    demandConsensus,
    capacityAnalysis,
    supplyData
  });
  artifacts.push({ phase: 'inventory-plan', output: inventoryPlan });

  // Phase 6: Supply Plan Development
  const supplyPlan = await ctx.task(developSupplyPlan, {
    demandConsensus,
    capacityAnalysis,
    inventoryPlan,
    supplyData
  });
  artifacts.push({ phase: 'supply-plan', output: supplyPlan });

  // Phase 7: Demand-Supply Gap Analysis
  const gapAnalysis = await ctx.task(analyzeGaps, {
    demandConsensus,
    supplyPlan,
    capacityAnalysis
  });
  artifacts.push({ phase: 'gap-analysis', output: gapAnalysis });

  // Phase 8: Scenario Planning
  const scenarioAnalysis = await ctx.task(analyzeScenarios, {
    gapAnalysis,
    demandConsensus,
    supplyPlan,
    financialTargets
  });
  artifacts.push({ phase: 'scenario-analysis', output: scenarioAnalysis });

  // Phase 9: Financial Integration
  const financialIntegration = await ctx.task(integrateFinancials, {
    demandConsensus,
    supplyPlan,
    financialTargets,
    scenarioAnalysis
  });
  artifacts.push({ phase: 'financial-integration', output: financialIntegration });

  // Quality Gate: Pre-S&OP Review
  await ctx.breakpoint('pre-sop-review', {
    title: 'Pre-S&OP Meeting Review',
    description: 'Review integrated plan before executive S&OP meeting',
    artifacts: [gapAnalysis, scenarioAnalysis, financialIntegration]
  });

  // Phase 10: Executive S&OP Package Preparation
  const executivePackage = await ctx.task(prepareExecutivePackage, {
    demandConsensus,
    supplyPlan,
    gapAnalysis,
    scenarioAnalysis,
    financialIntegration
  });
  artifacts.push({ phase: 'executive-package', output: executivePackage });

  // Phase 11: Decision Documentation
  const decisionDocumentation = await ctx.task(documentDecisions, {
    executivePackage,
    gapAnalysis,
    scenarioAnalysis
  });
  artifacts.push({ phase: 'decision-documentation', output: decisionDocumentation });

  // Phase 12: Plan Communication
  const communicationPlan = await ctx.task(developCommunicationPlan, {
    decisionDocumentation,
    processScope,
    organizationContext
  });
  artifacts.push({ phase: 'communication-plan', output: communicationPlan });

  // Final Quality Gate: S&OP Cycle Approval
  await ctx.breakpoint('sop-cycle-approval', {
    title: 'S&OP Cycle Approval',
    description: 'Final approval of S&OP decisions and communication plan',
    artifacts: [executivePackage, decisionDocumentation, communicationPlan]
  });

  return {
    success: true,
    demandPlan: {
      unconstrainedDemand: statisticalForecast,
      consensusDemand: demandConsensus,
      demandAssumptions: demandConsensus.assumptions
    },
    supplyPlan: {
      capacityPlan: capacityAnalysis,
      inventoryPlan,
      supplyCommitments: supplyPlan
    },
    integratedPlan: {
      balancedPlan: financialIntegration,
      gaps: gapAnalysis.gaps,
      resolutions: gapAnalysis.resolutions
    },
    executiveSummary: executivePackage,
    decisions: decisionDocumentation,
    communicationPlan,
    artifacts,
    metadata: {
      processId: 'sop-planning',
      startTime,
      endTime: ctx.now(),
      organizationContext,
      planningCycle: processScope.planningCycle
    }
  };
}

export const prepareData = defineTask('prepare-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare S&OP Data',
  agent: {
    name: 'data-preparation-specialist',
    prompt: {
      role: 'S&OP data analyst',
      task: 'Collect and prepare data for S&OP planning cycle',
      context: {
        demandData: args.demandData,
        supplyData: args.supplyData,
        processScope: args.processScope
      },
      instructions: [
        'Collect historical sales data by product family',
        'Gather current forecast data from all sources',
        'Compile inventory levels by location',
        'Gather capacity data by resource',
        'Validate data quality and completeness',
        'Prepare data aggregation by planning hierarchy'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        salesHistory: { type: 'object' },
        currentForecasts: { type: 'object' },
        inventorySnapshot: { type: 'object' },
        capacitySnapshot: { type: 'object' },
        dataQualityReport: { type: 'object' },
        aggregatedData: { type: 'object' }
      },
      required: ['salesHistory', 'currentForecasts', 'inventorySnapshot']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data', 'preparation']
}));

export const generateStatisticalForecast = defineTask('generate-statistical-forecast', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Statistical Forecast',
  agent: {
    name: 'forecast-analyst',
    prompt: {
      role: 'Demand forecasting specialist',
      task: 'Generate statistical baseline forecast',
      context: {
        dataPreparation: args.dataPreparation,
        demandData: args.demandData,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Apply appropriate forecasting methods',
        'Generate baseline forecast by product family',
        'Calculate forecast accuracy metrics',
        'Identify seasonality and trends',
        'Generate forecast confidence intervals',
        'Document forecast assumptions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        baselineForecast: { type: 'object' },
        forecastByFamily: { type: 'object' },
        accuracyMetrics: { type: 'object' },
        seasonalityFactors: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        assumptions: { type: 'array' }
      },
      required: ['baselineForecast', 'forecastByFamily', 'accuracyMetrics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'forecasting', 'statistical']
}));

export const buildDemandConsensus = defineTask('build-demand-consensus', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Demand Consensus',
  agent: {
    name: 'demand-consensus-facilitator',
    prompt: {
      role: 'Demand planning facilitator',
      task: 'Facilitate demand consensus building process',
      context: {
        statisticalForecast: args.statisticalForecast,
        demandData: args.demandData,
        processScope: args.processScope
      },
      instructions: [
        'Review statistical forecast with sales team',
        'Incorporate market intelligence',
        'Add customer commitments and opportunities',
        'Adjust for known events and promotions',
        'Reconcile top-down and bottom-up forecasts',
        'Document consensus demand and assumptions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        consensusDemand: { type: 'object' },
        salesAdjustments: { type: 'array' },
        marketIntelligence: { type: 'array' },
        promotionalDemand: { type: 'object' },
        reconciliation: { type: 'object' },
        assumptions: { type: 'array' }
      },
      required: ['consensusDemand', 'assumptions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'demand', 'consensus']
}));

export const analyzeCapacity = defineTask('analyze-capacity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Supply Capacity',
  agent: {
    name: 'capacity-analyst',
    prompt: {
      role: 'Supply chain capacity analyst',
      task: 'Analyze capacity to meet demand plan',
      context: {
        demandConsensus: args.demandConsensus,
        supplyData: args.supplyData,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Map demand to capacity requirements',
        'Calculate capacity utilization by resource',
        'Identify capacity constraints',
        'Analyze capacity options (overtime, outsourcing)',
        'Project capacity over planning horizon',
        'Document capacity assumptions and risks'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        capacityRequirements: { type: 'object' },
        utilizationAnalysis: { type: 'object' },
        constraints: { type: 'array' },
        capacityOptions: { type: 'array' },
        capacityProjection: { type: 'object' },
        risksAndAssumptions: { type: 'array' }
      },
      required: ['capacityRequirements', 'utilizationAnalysis', 'constraints']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capacity', 'analysis']
}));

export const planInventory = defineTask('plan-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Inventory',
  agent: {
    name: 'inventory-planner',
    prompt: {
      role: 'Inventory planning specialist',
      task: 'Develop inventory plan aligned with demand and capacity',
      context: {
        demandConsensus: args.demandConsensus,
        capacityAnalysis: args.capacityAnalysis,
        supplyData: args.supplyData
      },
      instructions: [
        'Set inventory targets by product family',
        'Calculate safety stock requirements',
        'Plan build-ahead strategies for peak periods',
        'Project inventory levels over horizon',
        'Calculate inventory investment',
        'Identify inventory risks and opportunities'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        inventoryTargets: { type: 'object' },
        safetyStockLevels: { type: 'object' },
        buildAheadPlan: { type: 'object' },
        inventoryProjection: { type: 'object' },
        investmentProjection: { type: 'object' },
        risksOpportunities: { type: 'array' }
      },
      required: ['inventoryTargets', 'safetyStockLevels', 'inventoryProjection']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inventory', 'planning']
}));

export const developSupplyPlan = defineTask('develop-supply-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Supply Plan',
  agent: {
    name: 'supply-planner',
    prompt: {
      role: 'Supply planning specialist',
      task: 'Develop comprehensive supply plan',
      context: {
        demandConsensus: args.demandConsensus,
        capacityAnalysis: args.capacityAnalysis,
        inventoryPlan: args.inventoryPlan,
        supplyData: args.supplyData
      },
      instructions: [
        'Create production plan by time period',
        'Allocate production to facilities',
        'Plan supplier commitments',
        'Schedule capacity investments',
        'Define supply contingencies',
        'Document supply plan assumptions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        productionPlan: { type: 'object' },
        facilityAllocation: { type: 'object' },
        supplierCommitments: { type: 'object' },
        capacityInvestments: { type: 'array' },
        contingencies: { type: 'array' },
        assumptions: { type: 'array' }
      },
      required: ['productionPlan', 'facilityAllocation', 'supplierCommitments']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply', 'planning']
}));

export const analyzeGaps = defineTask('analyze-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Demand-Supply Gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'S&OP gap analysis specialist',
      task: 'Identify and analyze demand-supply gaps',
      context: {
        demandConsensus: args.demandConsensus,
        supplyPlan: args.supplyPlan,
        capacityAnalysis: args.capacityAnalysis
      },
      instructions: [
        'Compare demand plan to supply capability',
        'Quantify gaps by product family and period',
        'Identify root causes of gaps',
        'Develop gap resolution options',
        'Prioritize resolution actions',
        'Document gap management recommendations'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        gaps: { type: 'array' },
        gapQuantification: { type: 'object' },
        rootCauses: { type: 'array' },
        resolutionOptions: { type: 'array' },
        resolutions: { type: 'array' },
        recommendations: { type: 'array' }
      },
      required: ['gaps', 'gapQuantification', 'resolutions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gap', 'analysis']
}));

export const analyzeScenarios = defineTask('analyze-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Scenarios',
  agent: {
    name: 'scenario-analyst',
    prompt: {
      role: 'S&OP scenario planning specialist',
      task: 'Develop and analyze planning scenarios',
      context: {
        gapAnalysis: args.gapAnalysis,
        demandConsensus: args.demandConsensus,
        supplyPlan: args.supplyPlan,
        financialTargets: args.financialTargets
      },
      instructions: [
        'Define base case scenario',
        'Develop upside demand scenario',
        'Develop downside demand scenario',
        'Model supply response for each scenario',
        'Calculate financial impact of scenarios',
        'Recommend contingency triggers'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        baseCase: { type: 'object' },
        upsideScenario: { type: 'object' },
        downsideScenario: { type: 'object' },
        supplyResponses: { type: 'object' },
        financialImpacts: { type: 'object' },
        contingencyTriggers: { type: 'array' }
      },
      required: ['baseCase', 'upsideScenario', 'downsideScenario', 'financialImpacts']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scenario', 'planning']
}));

export const integrateFinancials = defineTask('integrate-financials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Financial Plan',
  agent: {
    name: 'financial-integrator',
    prompt: {
      role: 'S&OP financial integration specialist',
      task: 'Integrate operational plans with financial targets',
      context: {
        demandConsensus: args.demandConsensus,
        supplyPlan: args.supplyPlan,
        financialTargets: args.financialTargets,
        scenarioAnalysis: args.scenarioAnalysis
      },
      instructions: [
        'Translate volume plans to revenue',
        'Calculate cost implications of supply plan',
        'Project margins by product family',
        'Compare to financial targets',
        'Identify financial gaps',
        'Recommend financial adjustments'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        revenueProjection: { type: 'object' },
        costProjection: { type: 'object' },
        marginProjection: { type: 'object' },
        targetComparison: { type: 'object' },
        financialGaps: { type: 'array' },
        recommendations: { type: 'array' }
      },
      required: ['revenueProjection', 'marginProjection', 'targetComparison']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'financial', 'integration']
}));

export const prepareExecutivePackage = defineTask('prepare-executive-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Executive S&OP Package',
  agent: {
    name: 'executive-package-preparer',
    prompt: {
      role: 'S&OP executive reporting specialist',
      task: 'Prepare executive S&OP meeting package',
      context: {
        demandConsensus: args.demandConsensus,
        supplyPlan: args.supplyPlan,
        gapAnalysis: args.gapAnalysis,
        scenarioAnalysis: args.scenarioAnalysis,
        financialIntegration: args.financialIntegration
      },
      instructions: [
        'Summarize demand and supply plans',
        'Highlight key gaps and risks',
        'Present scenario analysis results',
        'Show financial projections vs targets',
        'Frame decisions needed',
        'Prepare executive presentation'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSummary: { type: 'string' },
        keyHighlights: { type: 'array' },
        gapsAndRisks: { type: 'array' },
        scenarioSummary: { type: 'object' },
        financialSummary: { type: 'object' },
        decisionsNeeded: { type: 'array' },
        recommendations: { type: 'array' }
      },
      required: ['executiveSummary', 'decisionsNeeded', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'executive', 'package']
}));

export const documentDecisions = defineTask('document-decisions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document S&OP Decisions',
  agent: {
    name: 'decision-documenter',
    prompt: {
      role: 'S&OP decision documentation specialist',
      task: 'Document decisions made in executive S&OP meeting',
      context: {
        executivePackage: args.executivePackage,
        gapAnalysis: args.gapAnalysis,
        scenarioAnalysis: args.scenarioAnalysis
      },
      instructions: [
        'Record all decisions made',
        'Document decision rationale',
        'Assign action owners and deadlines',
        'Specify contingency triggers',
        'Update approved plans',
        'Create decision audit trail'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        decisions: { type: 'array' },
        rationale: { type: 'array' },
        actionItems: { type: 'array' },
        contingencyTriggers: { type: 'array' },
        approvedPlans: { type: 'object' },
        auditTrail: { type: 'object' }
      },
      required: ['decisions', 'actionItems', 'approvedPlans']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decision', 'documentation']
}));

export const developCommunicationPlan = defineTask('develop-communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Communication Plan',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'S&OP communication specialist',
      task: 'Develop plan to communicate S&OP decisions',
      context: {
        decisionDocumentation: args.decisionDocumentation,
        processScope: args.processScope,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Identify stakeholder groups',
        'Tailor messaging by audience',
        'Define communication channels',
        'Create communication timeline',
        'Develop feedback mechanisms',
        'Plan next cycle preparation'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        stakeholders: { type: 'array' },
        messagingByAudience: { type: 'object' },
        communicationChannels: { type: 'array' },
        timeline: { type: 'object' },
        feedbackMechanisms: { type: 'array' },
        nextCyclePrep: { type: 'object' }
      },
      required: ['stakeholders', 'messagingByAudience', 'timeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'communication', 'planning']
}));
