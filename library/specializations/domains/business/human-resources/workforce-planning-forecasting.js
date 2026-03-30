/**
 * @process workforce-planning-forecasting
 * @description Strategic process for analyzing workforce needs, forecasting future talent
 * requirements, and developing workforce plans that align human capital with business strategy
 * and objectives.
 * @inputs {
 *   organizationContext: { industry, size, growthPlans, businessStrategy },
 *   currentWorkforce: { headcount, skills, demographics, structure },
 *   planningHorizon: { timeframe, scenarios, assumptions },
 *   externalFactors: { laborMarket, economic, regulatory, technology },
 *   stakeholders: { hrLeadership, businessLeaders, finance }
 * }
 * @outputs {
 *   workforceAnalysis: { current, gaps, projections },
 *   forecastModels: { demand, supply, scenarios },
 *   workforcePlan: { strategies, actions, timeline, budget },
 *   implementation: { roadmap, metrics, governance }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'healthcare', growthPlans: '15% annually' },
 *   planningHorizon: { timeframe: '3-year', scenarios: ['growth', 'steady', 'decline'] },
 *   currentWorkforce: { headcount: 5000 }
 * });
 * @references
 * - SHRM Strategic Workforce Planning Framework
 * - Human Capital Institute Planning Models
 * - McKinsey Workforce Planning Methodology
 * - WorldatWork Workforce Analytics Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, currentWorkforce, planningHorizon, externalFactors, stakeholders } = inputs;

  // Phase 1: Business Strategy Alignment
  const strategyAlignment = await ctx.task('align-with-business-strategy', {
    organizationContext,
    planningHorizon,
    alignmentElements: [
      'business strategy review and interpretation',
      'growth and transformation plans',
      'key business initiatives and priorities',
      'geographic expansion plans',
      'technology and automation roadmap'
    ]
  });

  // Phase 2: Current Workforce Analysis
  const workforceAnalysis = await ctx.task('analyze-current-workforce', {
    currentWorkforce,
    organizationContext,
    analysisElements: [
      'headcount and FTE analysis',
      'skills and competency inventory',
      'demographic profile',
      'organizational structure review',
      'workforce cost analysis'
    ]
  });

  // Phase 3: External Environment Scan
  const environmentScan = await ctx.task('scan-external-environment', {
    externalFactors,
    organizationContext,
    scanElements: [
      'labor market trends and availability',
      'economic indicators and forecasts',
      'regulatory changes and compliance',
      'technology disruption impact',
      'competitive talent landscape'
    ]
  });

  // Phase 4: Analysis Review
  await ctx.breakpoint('analysis-review', {
    title: 'Workforce Analysis Review',
    description: 'Review current state analysis and external environment findings',
    artifacts: {
      strategyAlignment,
      workforceAnalysis,
      environmentScan
    },
    questions: [
      'Is the business strategy interpretation accurate?',
      'Are there any gaps in workforce data?',
      'Are the external factors comprehensive?'
    ]
  });

  // Phase 5: Demand Forecasting
  const demandForecast = await ctx.task('forecast-workforce-demand', {
    strategyAlignment,
    workforceAnalysis,
    planningHorizon,
    forecastElements: [
      'business driver identification',
      'demand modeling methodology',
      'role and skill requirements projection',
      'headcount demand by function/location',
      'scenario-based demand variations'
    ]
  });

  // Phase 6: Supply Forecasting
  const supplyForecast = await ctx.task('forecast-workforce-supply', {
    workforceAnalysis,
    environmentScan,
    planningHorizon,
    forecastElements: [
      'internal supply projection',
      'attrition and retirement modeling',
      'promotion and movement patterns',
      'external labor market supply',
      'skill availability projections'
    ]
  });

  // Phase 7: Gap Analysis
  const gapAnalysis = await ctx.task('analyze-workforce-gaps', {
    demandForecast,
    supplyForecast,
    gapElements: [
      'quantity gaps by role/function',
      'quality gaps (skills and competencies)',
      'geographic gaps',
      'timing gaps',
      'cost gaps'
    ]
  });

  // Phase 8: Scenario Planning
  const scenarioPlanning = await ctx.task('develop-scenarios', {
    demandForecast,
    supplyForecast,
    gapAnalysis,
    planningHorizon,
    scenarioElements: [
      'baseline scenario development',
      'growth scenario modeling',
      'decline scenario planning',
      'disruption scenario analysis',
      'sensitivity analysis'
    ]
  });

  // Phase 9: Gap and Scenario Review
  await ctx.breakpoint('forecast-review', {
    title: 'Workforce Forecast Review',
    description: 'Review demand/supply forecasts and gap analysis',
    artifacts: {
      demandForecast,
      supplyForecast,
      gapAnalysis,
      scenarioPlanning
    },
    questions: [
      'Are the forecast assumptions reasonable?',
      'Are the gap calculations accurate?',
      'Do the scenarios cover key uncertainties?'
    ]
  });

  // Phase 10: Strategy Development
  const strategyDevelopment = await ctx.task('develop-workforce-strategies', {
    gapAnalysis,
    scenarioPlanning,
    strategyElements: [
      'build strategies (hire, develop)',
      'buy strategies (recruit, acquire)',
      'borrow strategies (contingent, outsource)',
      'bind strategies (retain, engage)',
      'bot strategies (automate, AI)'
    ]
  });

  // Phase 11: Action Planning
  const actionPlanning = await ctx.task('develop-action-plans', {
    strategyDevelopment,
    gapAnalysis,
    planningElements: [
      'initiative prioritization',
      'resource requirements',
      'timeline and milestones',
      'budget allocation',
      'risk mitigation plans'
    ]
  });

  // Phase 12: Implementation Roadmap
  const implementationRoadmap = await ctx.task('create-implementation-roadmap', {
    actionPlanning,
    strategyDevelopment,
    roadmapElements: [
      'phased implementation plan',
      'quick wins and long-term initiatives',
      'dependencies and sequencing',
      'stakeholder responsibilities',
      'communication plan'
    ]
  });

  // Phase 13: Metrics and Governance
  const metricsGovernance = await ctx.task('establish-metrics-governance', {
    implementationRoadmap,
    governanceElements: [
      'key performance indicators',
      'monitoring and reporting cadence',
      'governance structure',
      'review and adjustment process',
      'technology and tools requirements'
    ]
  });

  // Phase 14: Executive Presentation
  const executivePresentation = await ctx.task('prepare-executive-presentation', {
    strategyAlignment,
    gapAnalysis,
    strategyDevelopment,
    implementationRoadmap,
    presentationElements: [
      'executive summary',
      'key findings and insights',
      'strategic recommendations',
      'investment requirements',
      'expected outcomes'
    ]
  });

  return {
    workforceAnalysis: {
      current: workforceAnalysis,
      gaps: gapAnalysis,
      external: environmentScan
    },
    forecasts: {
      demand: demandForecast,
      supply: supplyForecast,
      scenarios: scenarioPlanning
    },
    workforcePlan: {
      strategies: strategyDevelopment,
      actions: actionPlanning,
      roadmap: implementationRoadmap
    },
    governance: metricsGovernance,
    executivePresentation,
    metrics: {
      planningHorizon: planningHorizon.timeframe,
      gapSummary: gapAnalysis.summary,
      investmentRequired: actionPlanning.totalBudget
    }
  };
}

export const alignWithBusinessStrategy = defineTask('align-with-business-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align with Business Strategy',
  agent: {
    name: 'workforce-planning-strategist',
    prompt: {
      role: 'Strategic Workforce Planning Expert',
      task: 'Align workforce planning with business strategy',
      context: args,
      instructions: [
        'Review and interpret business strategy',
        'Understand growth and transformation plans',
        'Identify key business initiatives',
        'Map geographic expansion plans',
        'Assess technology and automation roadmap'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        strategyInterpretation: { type: 'object' },
        growthPlans: { type: 'object' },
        keyInitiatives: { type: 'array' },
        expansionPlans: { type: 'object' },
        technologyRoadmap: { type: 'object' }
      },
      required: ['strategyInterpretation', 'keyInitiatives']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCurrentWorkforce = defineTask('analyze-current-workforce', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Current Workforce',
  agent: {
    name: 'workforce-analyst',
    prompt: {
      role: 'Workforce Analytics Specialist',
      task: 'Analyze current workforce composition',
      context: args,
      instructions: [
        'Analyze headcount and FTE data',
        'Inventory skills and competencies',
        'Profile workforce demographics',
        'Review organizational structure',
        'Analyze workforce costs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        headcountAnalysis: { type: 'object' },
        skillsInventory: { type: 'object' },
        demographics: { type: 'object' },
        structure: { type: 'object' },
        costAnalysis: { type: 'object' }
      },
      required: ['headcountAnalysis', 'skillsInventory']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const scanExternalEnvironment = defineTask('scan-external-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scan External Environment',
  agent: {
    name: 'labor-market-analyst',
    prompt: {
      role: 'External Environment Analyst',
      task: 'Scan external labor and business environment',
      context: args,
      instructions: [
        'Analyze labor market trends',
        'Review economic indicators',
        'Identify regulatory changes',
        'Assess technology disruption',
        'Map competitive talent landscape'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        laborMarket: { type: 'object' },
        economicIndicators: { type: 'object' },
        regulatory: { type: 'array' },
        technology: { type: 'object' },
        competitiveLandscape: { type: 'object' }
      },
      required: ['laborMarket', 'competitiveLandscape']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const forecastWorkforceDemand = defineTask('forecast-workforce-demand', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast Workforce Demand',
  agent: {
    name: 'workforce-planning-analyst',
    prompt: {
      role: 'Demand Forecasting Specialist',
      task: 'Forecast future workforce demand',
      context: args,
      instructions: [
        'Identify key business drivers',
        'Apply demand modeling methodology',
        'Project role and skill requirements',
        'Forecast headcount by function/location',
        'Model scenario-based demand variations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        businessDrivers: { type: 'array' },
        methodology: { type: 'object' },
        skillRequirements: { type: 'object' },
        headcountProjections: { type: 'object' },
        scenarioVariations: { type: 'object' }
      },
      required: ['headcountProjections', 'skillRequirements']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const forecastWorkforceSupply = defineTask('forecast-workforce-supply', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast Workforce Supply',
  agent: {
    name: 'workforce-planning-analyst',
    prompt: {
      role: 'Supply Forecasting Specialist',
      task: 'Forecast workforce supply',
      context: args,
      instructions: [
        'Project internal workforce supply',
        'Model attrition and retirement patterns',
        'Analyze promotion and movement trends',
        'Assess external labor market supply',
        'Project skill availability'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        internalSupply: { type: 'object' },
        attritionModel: { type: 'object' },
        movementPatterns: { type: 'object' },
        externalSupply: { type: 'object' },
        skillAvailability: { type: 'object' }
      },
      required: ['internalSupply', 'attritionModel']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeWorkforceGaps = defineTask('analyze-workforce-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Workforce Gaps',
  agent: {
    name: 'workforce-planning-analyst',
    prompt: {
      role: 'Gap Analysis Specialist',
      task: 'Analyze workforce supply-demand gaps',
      context: args,
      instructions: [
        'Calculate quantity gaps by role/function',
        'Identify quality gaps (skills/competencies)',
        'Map geographic gaps',
        'Assess timing gaps',
        'Analyze cost gaps'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        quantityGaps: { type: 'object' },
        qualityGaps: { type: 'object' },
        geographicGaps: { type: 'object' },
        timingGaps: { type: 'object' },
        costGaps: { type: 'object' },
        summary: { type: 'object' }
      },
      required: ['quantityGaps', 'qualityGaps', 'summary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developScenarios = defineTask('develop-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Scenarios',
  agent: {
    name: 'scenario-planning-specialist',
    prompt: {
      role: 'Workforce Scenario Planner',
      task: 'Develop workforce planning scenarios',
      context: args,
      instructions: [
        'Build baseline scenario',
        'Model growth scenario',
        'Plan for decline scenario',
        'Analyze disruption scenarios',
        'Conduct sensitivity analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        baseline: { type: 'object' },
        growth: { type: 'object' },
        decline: { type: 'object' },
        disruption: { type: 'object' },
        sensitivityAnalysis: { type: 'object' }
      },
      required: ['baseline', 'growth', 'decline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developWorkforceStrategies = defineTask('develop-workforce-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Workforce Strategies',
  agent: {
    name: 'workforce-planning-strategist',
    prompt: {
      role: 'Workforce Strategy Developer',
      task: 'Develop workforce strategies to address gaps',
      context: args,
      instructions: [
        'Design build strategies (hire, develop)',
        'Create buy strategies (recruit, acquire)',
        'Plan borrow strategies (contingent, outsource)',
        'Develop bind strategies (retain, engage)',
        'Consider bot strategies (automate, AI)'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        buildStrategies: { type: 'array' },
        buyStrategies: { type: 'array' },
        borrowStrategies: { type: 'array' },
        bindStrategies: { type: 'array' },
        botStrategies: { type: 'array' }
      },
      required: ['buildStrategies', 'buyStrategies']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developActionPlans = defineTask('develop-action-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Action Plans',
  agent: {
    name: 'workforce-planning-manager',
    prompt: {
      role: 'Action Planning Specialist',
      task: 'Develop detailed workforce action plans',
      context: args,
      instructions: [
        'Prioritize initiatives by impact',
        'Define resource requirements',
        'Establish timeline and milestones',
        'Allocate budget',
        'Plan risk mitigation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        prioritizedInitiatives: { type: 'array' },
        resourceRequirements: { type: 'object' },
        timeline: { type: 'array' },
        budgetAllocation: { type: 'object' },
        riskMitigation: { type: 'array' },
        totalBudget: { type: 'number' }
      },
      required: ['prioritizedInitiatives', 'timeline', 'totalBudget']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createImplementationRoadmap = defineTask('create-implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Implementation Roadmap',
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Implementation Roadmap Developer',
      task: 'Create workforce plan implementation roadmap',
      context: args,
      instructions: [
        'Design phased implementation plan',
        'Identify quick wins and long-term initiatives',
        'Map dependencies and sequencing',
        'Assign stakeholder responsibilities',
        'Develop communication plan'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        phases: { type: 'array' },
        quickWins: { type: 'array' },
        dependencies: { type: 'object' },
        responsibilities: { type: 'object' },
        communicationPlan: { type: 'object' }
      },
      required: ['phases', 'quickWins']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const establishMetricsGovernance = defineTask('establish-metrics-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Metrics and Governance',
  agent: {
    name: 'hr-governance-specialist',
    prompt: {
      role: 'Workforce Planning Governance Expert',
      task: 'Establish metrics and governance framework',
      context: args,
      instructions: [
        'Define key performance indicators',
        'Establish monitoring and reporting cadence',
        'Design governance structure',
        'Create review and adjustment process',
        'Specify technology and tools requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        kpis: { type: 'array' },
        reportingCadence: { type: 'object' },
        governanceStructure: { type: 'object' },
        reviewProcess: { type: 'object' },
        technologyRequirements: { type: 'array' }
      },
      required: ['kpis', 'governanceStructure']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareExecutivePresentation = defineTask('prepare-executive-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Executive Presentation',
  agent: {
    name: 'workforce-planning-strategist',
    prompt: {
      role: 'Executive Presentation Developer',
      task: 'Prepare workforce plan executive presentation',
      context: args,
      instructions: [
        'Write executive summary',
        'Highlight key findings and insights',
        'Present strategic recommendations',
        'Detail investment requirements',
        'Project expected outcomes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSummary: { type: 'object' },
        keyFindings: { type: 'array' },
        recommendations: { type: 'array' },
        investmentRequirements: { type: 'object' },
        expectedOutcomes: { type: 'array' }
      },
      required: ['executiveSummary', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
