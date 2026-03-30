/**
 * @process turnover-analysis-retention
 * @description Comprehensive process for analyzing employee turnover patterns, identifying
 * root causes of attrition, and developing targeted retention strategies to reduce unwanted
 * turnover and improve organizational stability.
 * @inputs {
 *   organizationContext: { industry, size, culture, competitiveLandscape },
 *   turnoverData: { historical, current, bySegment, exitData },
 *   employeeData: { demographics, tenure, performance, engagement },
 *   benchmarks: { industry, market, competitors },
 *   stakeholders: { hrLeadership, businessLeaders, analytics }
 * }
 * @outputs {
 *   turnoverAnalysis: { rates, trends, patterns, costs },
 *   rootCauseAnalysis: { drivers, segments, predictions },
 *   retentionStrategy: { initiatives, targeting, timeline },
 *   implementation: { actionPlan, metrics, governance }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'retail', size: 10000 },
 *   turnoverData: { annualRate: 25, voluntaryRate: 18 },
 *   benchmarks: { industryAverage: 20 }
 * });
 * @references
 * - SHRM Turnover Analysis Framework
 * - Work Institute Retention Report Methodology
 * - Gallup Employee Engagement and Retention Research
 * - Corporate Leadership Council Retention Studies
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, turnoverData, employeeData, benchmarks, stakeholders } = inputs;

  // Phase 1: Turnover Data Collection
  const dataCollection = await ctx.task('collect-turnover-data', {
    turnoverData,
    employeeData,
    collectionElements: [
      'historical turnover data compilation',
      'exit interview data aggregation',
      'employee survey data integration',
      'performance and engagement data',
      'demographic and tenure data'
    ]
  });

  // Phase 2: Turnover Rate Analysis
  const rateAnalysis = await ctx.task('analyze-turnover-rates', {
    dataCollection,
    benchmarks,
    analysisElements: [
      'overall turnover rate calculation',
      'voluntary vs involuntary breakdown',
      'regrettable vs non-regrettable classification',
      'trend analysis over time',
      'benchmark comparison'
    ]
  });

  // Phase 3: Segmentation Analysis
  const segmentationAnalysis = await ctx.task('analyze-turnover-segments', {
    dataCollection,
    rateAnalysis,
    segmentationElements: [
      'department/function analysis',
      'tenure cohort analysis',
      'performance segment analysis',
      'demographic analysis',
      'geographic analysis'
    ]
  });

  // Phase 4: Cost of Turnover Analysis
  const costAnalysis = await ctx.task('analyze-turnover-costs', {
    rateAnalysis,
    segmentationAnalysis,
    organizationContext,
    costElements: [
      'direct costs (recruiting, training)',
      'indirect costs (productivity, knowledge)',
      'opportunity costs',
      'impact on remaining workforce',
      'customer impact costs'
    ]
  });

  // Phase 5: Analysis Review
  await ctx.breakpoint('analysis-review', {
    title: 'Turnover Analysis Review',
    description: 'Review turnover analysis findings',
    artifacts: {
      rateAnalysis,
      segmentationAnalysis,
      costAnalysis
    },
    questions: [
      'Is the data quality sufficient for analysis?',
      'Are the segmentation categories appropriate?',
      'Are the cost calculations realistic?'
    ]
  });

  // Phase 6: Exit Interview Analysis
  const exitAnalysis = await ctx.task('analyze-exit-interviews', {
    dataCollection,
    segmentationAnalysis,
    analysisElements: [
      'reason for leaving categorization',
      'theme identification',
      'manager and leadership feedback',
      'compensation and benefits feedback',
      'career development feedback'
    ]
  });

  // Phase 7: Predictive Analytics
  const predictiveAnalytics = await ctx.task('develop-predictive-models', {
    dataCollection,
    segmentationAnalysis,
    employeeData,
    predictiveElements: [
      'flight risk modeling',
      'early warning indicators',
      'survival analysis',
      'risk factor identification',
      'prediction validation'
    ]
  });

  // Phase 8: Root Cause Analysis
  const rootCauseAnalysis = await ctx.task('analyze-root-causes', {
    exitAnalysis,
    predictiveAnalytics,
    segmentationAnalysis,
    analysisElements: [
      'primary driver identification',
      'controllable vs uncontrollable factors',
      'systemic issues mapping',
      'manager and leadership factors',
      'cultural and organizational factors'
    ]
  });

  // Phase 9: Root Cause Review
  await ctx.breakpoint('root-cause-review', {
    title: 'Root Cause Analysis Review',
    description: 'Review root cause findings and validate drivers',
    artifacts: {
      exitAnalysis,
      predictiveAnalytics,
      rootCauseAnalysis
    },
    questions: [
      'Are the root causes accurately identified?',
      'Which factors are within our control?',
      'What priority should be given to each driver?'
    ]
  });

  // Phase 10: Retention Strategy Development
  const retentionStrategy = await ctx.task('develop-retention-strategy', {
    rootCauseAnalysis,
    segmentationAnalysis,
    organizationContext,
    strategyElements: [
      'targeted retention initiatives',
      'compensation and benefits adjustments',
      'career development enhancements',
      'manager effectiveness programs',
      'culture and engagement initiatives'
    ]
  });

  // Phase 11: Initiative Prioritization
  const initiativePrioritization = await ctx.task('prioritize-initiatives', {
    retentionStrategy,
    costAnalysis,
    rootCauseAnalysis,
    prioritizationElements: [
      'impact assessment',
      'cost-benefit analysis',
      'implementation complexity',
      'speed to impact',
      'resource requirements'
    ]
  });

  // Phase 12: Implementation Planning
  const implementationPlan = await ctx.task('create-implementation-plan', {
    initiativePrioritization,
    retentionStrategy,
    planElements: [
      'phased rollout plan',
      'resource allocation',
      'stakeholder assignments',
      'communication strategy',
      'risk mitigation'
    ]
  });

  // Phase 13: Metrics and Monitoring
  const metricsMonitoring = await ctx.task('establish-metrics-monitoring', {
    implementationPlan,
    retentionStrategy,
    monitoringElements: [
      'leading indicator KPIs',
      'lagging indicator KPIs',
      'dashboard design',
      'reporting cadence',
      'continuous improvement process'
    ]
  });

  // Phase 14: Executive Summary and Recommendations
  const executiveSummary = await ctx.task('create-executive-summary', {
    rateAnalysis,
    costAnalysis,
    rootCauseAnalysis,
    retentionStrategy,
    implementationPlan,
    summaryElements: [
      'key findings overview',
      'cost of inaction',
      'strategic recommendations',
      'investment requirements',
      'expected ROI'
    ]
  });

  return {
    turnoverAnalysis: {
      rates: rateAnalysis,
      segments: segmentationAnalysis,
      costs: costAnalysis
    },
    rootCauseAnalysis: {
      exitAnalysis,
      predictions: predictiveAnalytics,
      rootCauses: rootCauseAnalysis
    },
    retentionStrategy: {
      strategy: retentionStrategy,
      prioritization: initiativePrioritization
    },
    implementation: {
      plan: implementationPlan,
      metrics: metricsMonitoring
    },
    executiveSummary,
    metrics: {
      currentTurnoverRate: rateAnalysis.overallRate,
      annualCost: costAnalysis.totalAnnualCost,
      targetedReduction: retentionStrategy.targetReduction
    }
  };
}

export const collectTurnoverData = defineTask('collect-turnover-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect Turnover Data',
  agent: {
    name: 'hr-data-analyst',
    prompt: {
      role: 'Turnover Data Collection Specialist',
      task: 'Collect and compile turnover data',
      context: args,
      instructions: [
        'Compile historical turnover data',
        'Aggregate exit interview data',
        'Integrate employee survey data',
        'Collect performance and engagement data',
        'Gather demographic and tenure data'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        historicalData: { type: 'object' },
        exitData: { type: 'object' },
        surveyData: { type: 'object' },
        performanceData: { type: 'object' },
        demographicData: { type: 'object' }
      },
      required: ['historicalData', 'exitData']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeTurnoverRates = defineTask('analyze-turnover-rates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Turnover Rates',
  agent: {
    name: 'workforce-analyst',
    prompt: {
      role: 'Turnover Rate Analyst',
      task: 'Analyze turnover rates and trends',
      context: args,
      instructions: [
        'Calculate overall turnover rates',
        'Break down voluntary vs involuntary',
        'Classify regrettable vs non-regrettable',
        'Analyze trends over time',
        'Compare against benchmarks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        overallRate: { type: 'number' },
        voluntaryRate: { type: 'number' },
        involuntaryRate: { type: 'number' },
        regrettableRate: { type: 'number' },
        trends: { type: 'object' },
        benchmarkComparison: { type: 'object' }
      },
      required: ['overallRate', 'voluntaryRate', 'trends']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeTurnoverSegments = defineTask('analyze-turnover-segments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Turnover Segments',
  agent: {
    name: 'workforce-analyst',
    prompt: {
      role: 'Segmentation Analysis Specialist',
      task: 'Analyze turnover by segments',
      context: args,
      instructions: [
        'Analyze by department/function',
        'Analyze by tenure cohort',
        'Analyze by performance segment',
        'Analyze by demographics',
        'Analyze by geography'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        byDepartment: { type: 'object' },
        byTenure: { type: 'object' },
        byPerformance: { type: 'object' },
        byDemographics: { type: 'object' },
        byGeography: { type: 'object' }
      },
      required: ['byDepartment', 'byTenure']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeTurnoverCosts = defineTask('analyze-turnover-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Turnover Costs',
  agent: {
    name: 'hr-financial-analyst',
    prompt: {
      role: 'Turnover Cost Analyst',
      task: 'Calculate and analyze turnover costs',
      context: args,
      instructions: [
        'Calculate direct costs',
        'Estimate indirect costs',
        'Assess opportunity costs',
        'Evaluate impact on remaining workforce',
        'Calculate customer impact costs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        directCosts: { type: 'object' },
        indirectCosts: { type: 'object' },
        opportunityCosts: { type: 'object' },
        workforceImpact: { type: 'object' },
        customerImpact: { type: 'object' },
        totalAnnualCost: { type: 'number' }
      },
      required: ['directCosts', 'indirectCosts', 'totalAnnualCost']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeExitInterviews = defineTask('analyze-exit-interviews', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Exit Interviews',
  agent: {
    name: 'employee-relations-analyst',
    prompt: {
      role: 'Exit Interview Analyst',
      task: 'Analyze exit interview data',
      context: args,
      instructions: [
        'Categorize reasons for leaving',
        'Identify common themes',
        'Analyze manager and leadership feedback',
        'Review compensation and benefits feedback',
        'Assess career development feedback'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        reasonCategories: { type: 'object' },
        themes: { type: 'array' },
        leadershipFeedback: { type: 'object' },
        compensationFeedback: { type: 'object' },
        careerFeedback: { type: 'object' }
      },
      required: ['reasonCategories', 'themes']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developPredictiveModels = defineTask('develop-predictive-models', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Predictive Models',
  agent: {
    name: 'hr-data-scientist',
    prompt: {
      role: 'Predictive Analytics Specialist',
      task: 'Develop turnover prediction models',
      context: args,
      instructions: [
        'Build flight risk model',
        'Identify early warning indicators',
        'Conduct survival analysis',
        'Identify key risk factors',
        'Validate prediction accuracy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        flightRiskModel: { type: 'object' },
        warningIndicators: { type: 'array' },
        survivalAnalysis: { type: 'object' },
        riskFactors: { type: 'array' },
        modelValidation: { type: 'object' }
      },
      required: ['flightRiskModel', 'riskFactors']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeRootCauses = defineTask('analyze-root-causes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Root Causes',
  agent: {
    name: 'organizational-analyst',
    prompt: {
      role: 'Root Cause Analysis Expert',
      task: 'Analyze root causes of turnover',
      context: args,
      instructions: [
        'Identify primary drivers',
        'Categorize controllable vs uncontrollable',
        'Map systemic issues',
        'Assess manager and leadership factors',
        'Evaluate cultural and organizational factors'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        primaryDrivers: { type: 'array' },
        controllability: { type: 'object' },
        systemicIssues: { type: 'array' },
        leadershipFactors: { type: 'object' },
        culturalFactors: { type: 'object' }
      },
      required: ['primaryDrivers', 'controllability']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developRetentionStrategy = defineTask('develop-retention-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Retention Strategy',
  agent: {
    name: 'talent-management-strategist',
    prompt: {
      role: 'Retention Strategy Developer',
      task: 'Develop comprehensive retention strategy',
      context: args,
      instructions: [
        'Design targeted retention initiatives',
        'Plan compensation and benefits adjustments',
        'Enhance career development programs',
        'Improve manager effectiveness',
        'Address culture and engagement'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        retentionInitiatives: { type: 'array' },
        compensationAdjustments: { type: 'object' },
        careerDevelopment: { type: 'object' },
        managerPrograms: { type: 'object' },
        cultureInitiatives: { type: 'object' },
        targetReduction: { type: 'number' }
      },
      required: ['retentionInitiatives', 'targetReduction']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prioritizeInitiatives = defineTask('prioritize-initiatives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize Initiatives',
  agent: {
    name: 'hr-strategist',
    prompt: {
      role: 'Initiative Prioritization Specialist',
      task: 'Prioritize retention initiatives',
      context: args,
      instructions: [
        'Assess potential impact',
        'Conduct cost-benefit analysis',
        'Evaluate implementation complexity',
        'Estimate speed to impact',
        'Assess resource requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        impactAssessment: { type: 'object' },
        costBenefit: { type: 'object' },
        complexityRating: { type: 'object' },
        speedToImpact: { type: 'object' },
        prioritizedList: { type: 'array' }
      },
      required: ['prioritizedList', 'costBenefit']
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
      role: 'Implementation Planning Specialist',
      task: 'Create retention initiative implementation plan',
      context: args,
      instructions: [
        'Design phased rollout plan',
        'Allocate resources',
        'Assign stakeholder responsibilities',
        'Develop communication strategy',
        'Plan risk mitigation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        rolloutPlan: { type: 'array' },
        resourceAllocation: { type: 'object' },
        stakeholderAssignments: { type: 'object' },
        communicationStrategy: { type: 'object' },
        riskMitigation: { type: 'array' }
      },
      required: ['rolloutPlan', 'stakeholderAssignments']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const establishMetricsMonitoring = defineTask('establish-metrics-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Metrics and Monitoring',
  agent: {
    name: 'hr-analytics-specialist',
    prompt: {
      role: 'Retention Metrics Specialist',
      task: 'Establish retention metrics and monitoring',
      context: args,
      instructions: [
        'Define leading indicator KPIs',
        'Define lagging indicator KPIs',
        'Design monitoring dashboard',
        'Establish reporting cadence',
        'Create continuous improvement process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        leadingKPIs: { type: 'array' },
        laggingKPIs: { type: 'array' },
        dashboardDesign: { type: 'object' },
        reportingCadence: { type: 'object' },
        improvementProcess: { type: 'object' }
      },
      required: ['leadingKPIs', 'laggingKPIs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createExecutiveSummary = defineTask('create-executive-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Executive Summary',
  agent: {
    name: 'hr-strategist',
    prompt: {
      role: 'Executive Summary Writer',
      task: 'Create executive summary and recommendations',
      context: args,
      instructions: [
        'Summarize key findings',
        'Quantify cost of inaction',
        'Present strategic recommendations',
        'Detail investment requirements',
        'Project expected ROI'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        keyFindings: { type: 'array' },
        costOfInaction: { type: 'object' },
        recommendations: { type: 'array' },
        investmentRequirements: { type: 'object' },
        expectedROI: { type: 'object' }
      },
      required: ['keyFindings', 'recommendations', 'expectedROI']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
