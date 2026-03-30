/**
 * @process salary-benchmarking-market-pricing
 * @description Comprehensive process for conducting salary benchmarking and market pricing analysis
 * to ensure competitive compensation positioning, internal equity, and attraction/retention of talent.
 * @inputs {
 *   organizationContext: { industry, size, location, compensationPhilosophy },
 *   benchmarkingScope: { roles, levels, geographies, jobFamilies },
 *   dataSources: { surveys, databases, providers },
 *   stakeholders: { compensation, hrBusinessPartners, finance, leadership },
 *   constraints: { budget, timeline, confidentiality }
 * }
 * @outputs {
 *   marketAnalysis: { benchmarkData, competitivePositioning, gapAnalysis },
 *   recommendations: { salaryRanges, adjustments, prioritization },
 *   documentation: { methodology, dataSources, reports },
 *   implementationPlan: { adjustmentStrategy, communication, timeline }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'technology', size: 'enterprise', compensationPhilosophy: 'P50-P75' },
 *   benchmarkingScope: { roles: 200, geographies: ['US', 'EMEA', 'APAC'] },
 *   dataSources: { surveys: ['Radford', 'Mercer', 'CompAnalyst'] }
 * });
 * @references
 * - WorldatWork Market Pricing Guidelines
 * - Radford Global Technology Survey
 * - Mercer Total Remuneration Survey
 * - SHRM Compensation Data Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, benchmarkingScope, dataSources, stakeholders, constraints } = inputs;

  // Phase 1: Compensation Philosophy Alignment
  const philosophyAlignment = await ctx.task('align-compensation-philosophy', {
    organizationContext,
    alignmentAreas: [
      'compensation philosophy review and validation',
      'market positioning strategy (lead, match, lag)',
      'total rewards components weighting',
      'geographic pay differentials approach',
      'pay equity principles integration'
    ]
  });

  // Phase 2: Job Matching Preparation
  const jobMatchingPrep = await ctx.task('prepare-job-matching', {
    benchmarkingScope,
    philosophyAlignment,
    preparationElements: [
      'job description review and standardization',
      'job leveling and slotting validation',
      'benchmark job selection criteria',
      'survey job matching guidelines',
      'hybrid and custom job definitions'
    ]
  });

  // Phase 3: Survey and Data Source Selection
  const dataSourceSelection = await ctx.task('select-data-sources', {
    dataSources,
    benchmarkingScope,
    organizationContext,
    selectionCriteria: [
      'survey relevance and industry coverage',
      'participant quality and peer group',
      'data currency and aging factors',
      'geographic coverage requirements',
      'cost-benefit analysis'
    ]
  });

  // Phase 4: Data Source Approval
  await ctx.breakpoint('data-source-approval', {
    title: 'Market Data Source Approval',
    description: 'Review and approve selected market data sources and methodology',
    artifacts: {
      philosophyAlignment,
      jobMatchingPrep,
      dataSourceSelection
    },
    questions: [
      'Are the selected surveys appropriate for our industry and size?',
      'Is the peer group composition competitive and relevant?',
      'Do we have adequate geographic coverage?'
    ]
  });

  // Phase 5: Job Matching Execution
  const jobMatchingResults = await ctx.task('execute-job-matching', {
    jobMatchingPrep,
    dataSourceSelection,
    matchingProcess: [
      'survey job code matching',
      'job content and scope alignment',
      'level calibration across surveys',
      'custom job composite builds',
      'match quality documentation'
    ]
  });

  // Phase 6: Market Data Collection and Analysis
  const marketDataAnalysis = await ctx.task('analyze-market-data', {
    jobMatchingResults,
    dataSourceSelection,
    analysisElements: [
      'data extraction and compilation',
      'aging and trending adjustments',
      'geographic differential application',
      'statistical analysis (percentiles, ranges)',
      'outlier identification and treatment'
    ]
  });

  // Phase 7: Competitive Positioning Analysis
  const competitivePositioning = await ctx.task('analyze-competitive-positioning', {
    marketDataAnalysis,
    philosophyAlignment,
    organizationContext,
    positioningAnalysis: [
      'current vs market comparison',
      'compa-ratio distribution analysis',
      'position in range analysis',
      'hot skills and premium roles',
      'competitive gaps identification'
    ]
  });

  // Phase 8: Pay Equity Integration
  const payEquityAnalysis = await ctx.task('integrate-pay-equity-analysis', {
    competitivePositioning,
    equityElements: [
      'demographic pay gap analysis',
      'unexplained variance identification',
      'legal risk assessment',
      'remediation prioritization',
      'equity-adjusted recommendations'
    ]
  });

  // Phase 9: Salary Range Development
  const salaryRanges = await ctx.task('develop-salary-ranges', {
    marketDataAnalysis,
    competitivePositioning,
    payEquityAnalysis,
    rangeElements: [
      'range spread determination',
      'midpoint progression calculation',
      'grade overlap considerations',
      'geographic differentials',
      'range penetration guidelines'
    ]
  });

  // Phase 10: Adjustment Recommendations
  const adjustmentRecommendations = await ctx.task('develop-adjustment-recommendations', {
    competitivePositioning,
    salaryRanges,
    payEquityAnalysis,
    recommendationElements: [
      'individual adjustment calculations',
      'budget impact modeling',
      'priority tiering (equity, retention, market)',
      'timing and phasing options',
      'exception handling guidelines'
    ]
  });

  // Phase 11: Leadership Review
  await ctx.breakpoint('recommendations-review', {
    title: 'Compensation Recommendations Review',
    description: 'Review market analysis findings and adjustment recommendations',
    artifacts: {
      competitivePositioning,
      salaryRanges,
      adjustmentRecommendations
    },
    questions: [
      'Do the salary ranges align with our compensation philosophy?',
      'Is the adjustment budget appropriate and achievable?',
      'Are the prioritization criteria correct?'
    ]
  });

  // Phase 12: Implementation Planning
  const implementationPlan = await ctx.task('create-implementation-plan', {
    adjustmentRecommendations,
    salaryRanges,
    stakeholders,
    planElements: [
      'rollout timeline and milestones',
      'manager communication and training',
      'employee communication strategy',
      'HRIS system updates',
      'governance and approval workflows'
    ]
  });

  // Phase 13: Documentation and Reporting
  const documentation = await ctx.task('create-documentation', {
    marketDataAnalysis,
    competitivePositioning,
    salaryRanges,
    adjustmentRecommendations,
    documentationElements: [
      'methodology documentation',
      'data source summary and limitations',
      'executive summary and dashboards',
      'detailed analysis reports',
      'annual review and refresh process'
    ]
  });

  return {
    marketAnalysis: {
      benchmarkData: marketDataAnalysis,
      competitivePositioning,
      payEquityAnalysis
    },
    salaryRanges,
    adjustmentRecommendations,
    implementationPlan,
    documentation,
    metrics: {
      rolesAnalyzed: benchmarkingScope.roles,
      marketPositioning: competitivePositioning.overallPosition,
      recommendedAdjustmentBudget: adjustmentRecommendations.totalBudget
    }
  };
}

export const alignCompensationPhilosophy = defineTask('align-compensation-philosophy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align Compensation Philosophy',
  agent: {
    name: 'compensation-strategist',
    prompt: {
      role: 'Compensation Philosophy Expert',
      task: 'Review and align compensation philosophy with market strategy',
      context: args,
      instructions: [
        'Review current compensation philosophy documentation',
        'Validate market positioning strategy',
        'Define total rewards component weighting',
        'Establish geographic differential approach',
        'Integrate pay equity principles'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        philosophy: { type: 'object' },
        marketPositioning: { type: 'string' },
        componentWeighting: { type: 'object' },
        geoStrategy: { type: 'object' },
        equityPrinciples: { type: 'array' }
      },
      required: ['philosophy', 'marketPositioning']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareJobMatching = defineTask('prepare-job-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Job Matching',
  agent: {
    name: 'compensation-analyst',
    prompt: {
      role: 'Job Matching Specialist',
      task: 'Prepare job matching framework for benchmarking',
      context: args,
      instructions: [
        'Review and standardize job descriptions',
        'Validate job leveling and slotting',
        'Define benchmark job selection criteria',
        'Create survey job matching guidelines',
        'Identify hybrid and custom job needs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        jobDescriptions: { type: 'array' },
        levelingValidation: { type: 'object' },
        benchmarkJobs: { type: 'array' },
        matchingGuidelines: { type: 'object' },
        customJobs: { type: 'array' }
      },
      required: ['jobDescriptions', 'benchmarkJobs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const selectDataSources = defineTask('select-data-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Data Sources',
  agent: {
    name: 'market-data-specialist',
    prompt: {
      role: 'Market Data Source Expert',
      task: 'Select and evaluate market data sources',
      context: args,
      instructions: [
        'Evaluate survey relevance and industry coverage',
        'Assess participant quality and peer groups',
        'Review data currency and aging factors',
        'Verify geographic coverage requirements',
        'Conduct cost-benefit analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        selectedSurveys: { type: 'array' },
        peerGroups: { type: 'object' },
        agingFactors: { type: 'object' },
        geoCoverage: { type: 'object' },
        costAnalysis: { type: 'object' }
      },
      required: ['selectedSurveys', 'peerGroups']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executeJobMatching = defineTask('execute-job-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Job Matching',
  agent: {
    name: 'compensation-analyst',
    prompt: {
      role: 'Job Matching Analyst',
      task: 'Execute comprehensive job matching process',
      context: args,
      instructions: [
        'Match internal jobs to survey job codes',
        'Align job content and scope appropriately',
        'Calibrate levels across multiple surveys',
        'Build composites for custom jobs',
        'Document match quality and rationale'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        matches: { type: 'array' },
        calibration: { type: 'object' },
        composites: { type: 'array' },
        qualityScores: { type: 'object' },
        documentation: { type: 'array' }
      },
      required: ['matches', 'qualityScores']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeMarketData = defineTask('analyze-market-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Market Data',
  agent: {
    name: 'compensation-analyst',
    prompt: {
      role: 'Market Data Analyst',
      task: 'Analyze and process market compensation data',
      context: args,
      instructions: [
        'Extract and compile data from selected sources',
        'Apply aging and trending adjustments',
        'Calculate geographic differentials',
        'Perform statistical analysis across percentiles',
        'Identify and treat outliers appropriately'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        compiledData: { type: 'object' },
        adjustments: { type: 'object' },
        percentileAnalysis: { type: 'object' },
        outliers: { type: 'array' },
        dataQuality: { type: 'object' }
      },
      required: ['compiledData', 'percentileAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCompetitivePositioning = defineTask('analyze-competitive-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Competitive Positioning',
  agent: {
    name: 'compensation-strategist',
    prompt: {
      role: 'Competitive Analysis Expert',
      task: 'Analyze competitive compensation positioning',
      context: args,
      instructions: [
        'Compare current compensation to market benchmarks',
        'Analyze compa-ratio distributions',
        'Evaluate position in range across roles',
        'Identify hot skills and premium role needs',
        'Document competitive gaps and opportunities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        marketComparison: { type: 'object' },
        compaRatios: { type: 'object' },
        rangePositions: { type: 'object' },
        hotSkills: { type: 'array' },
        gaps: { type: 'array' },
        overallPosition: { type: 'string' }
      },
      required: ['marketComparison', 'gaps', 'overallPosition']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const integratePayEquityAnalysis = defineTask('integrate-pay-equity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Pay Equity Analysis',
  agent: {
    name: 'pay-equity-specialist',
    prompt: {
      role: 'Pay Equity Analyst',
      task: 'Integrate pay equity analysis into market pricing',
      context: args,
      instructions: [
        'Analyze demographic pay gaps',
        'Identify unexplained variance in compensation',
        'Assess legal and compliance risks',
        'Prioritize remediation actions',
        'Develop equity-adjusted recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        gapAnalysis: { type: 'object' },
        unexplainedVariance: { type: 'array' },
        riskAssessment: { type: 'object' },
        remediationPriorities: { type: 'array' },
        adjustedRecommendations: { type: 'object' }
      },
      required: ['gapAnalysis', 'riskAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developSalaryRanges = defineTask('develop-salary-ranges', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Salary Ranges',
  agent: {
    name: 'compensation-designer',
    prompt: {
      role: 'Salary Range Designer',
      task: 'Develop comprehensive salary range structure',
      context: args,
      instructions: [
        'Determine appropriate range spreads by level',
        'Calculate midpoint progressions',
        'Address grade overlap considerations',
        'Apply geographic differentials',
        'Create range penetration guidelines'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        ranges: { type: 'array' },
        spreads: { type: 'object' },
        midpointProgression: { type: 'object' },
        geoDifferentials: { type: 'object' },
        penetrationGuidelines: { type: 'object' }
      },
      required: ['ranges', 'spreads']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developAdjustmentRecommendations = defineTask('develop-adjustment-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Adjustment Recommendations',
  agent: {
    name: 'compensation-strategist',
    prompt: {
      role: 'Compensation Adjustment Strategist',
      task: 'Develop individual and aggregate adjustment recommendations',
      context: args,
      instructions: [
        'Calculate individual adjustment amounts',
        'Model budget impact scenarios',
        'Apply priority tiering framework',
        'Develop timing and phasing options',
        'Create exception handling guidelines'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        individualAdjustments: { type: 'array' },
        budgetImpact: { type: 'object' },
        priorityTiers: { type: 'object' },
        phasingOptions: { type: 'array' },
        exceptionGuidelines: { type: 'object' },
        totalBudget: { type: 'number' }
      },
      required: ['individualAdjustments', 'budgetImpact', 'totalBudget']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createImplementationPlan = defineTask('create-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Implementation Plan',
  agent: {
    name: 'hr-project-manager',
    prompt: {
      role: 'Implementation Planner',
      task: 'Create comprehensive implementation plan',
      context: args,
      instructions: [
        'Define rollout timeline and milestones',
        'Design manager communication and training',
        'Create employee communication strategy',
        'Plan HRIS system updates',
        'Establish governance and approval workflows'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        timeline: { type: 'array' },
        managerTraining: { type: 'object' },
        employeeCommunication: { type: 'object' },
        systemUpdates: { type: 'array' },
        governanceWorkflows: { type: 'object' }
      },
      required: ['timeline', 'governanceWorkflows']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createDocumentation = defineTask('create-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Documentation',
  agent: {
    name: 'compensation-documentation-specialist',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Create comprehensive documentation package',
      context: args,
      instructions: [
        'Document methodology and approach',
        'Summarize data sources and limitations',
        'Create executive summary and dashboards',
        'Develop detailed analysis reports',
        'Define annual review and refresh process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        methodologyDoc: { type: 'object' },
        dataSourceSummary: { type: 'object' },
        executiveSummary: { type: 'object' },
        detailedReports: { type: 'array' },
        refreshProcess: { type: 'object' }
      },
      required: ['methodologyDoc', 'executiveSummary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
