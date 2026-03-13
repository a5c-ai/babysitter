/**
 * @process specializations/domains/business/operations/cost-of-quality
 * @description Cost of Quality (COQ) Analysis for measuring and managing quality-related costs.
 *              Categorizes costs into Prevention, Appraisal, Internal Failure, and External Failure
 *              to identify optimization opportunities and drive quality investment decisions.
 * @inputs {
 *   organizationContext: { industry: string, businessModel: string, qualityMaturity: string },
 *   financialData: { qualityBudget: object, historicalCosts: object[], accountingStructure: object },
 *   processData: { processes: object[], defectData: object[], inspectionData: object },
 *   qualityPrograms: { currentPrograms: object[], investments: object[], resources: object },
 *   analysisScope: { timeframe: string, scope: string[], granularity: string }
 * }
 * @outputs {
 *   coqAnalysis: { preventionCosts: object, appraisalCosts: object, internalFailure: object, externalFailure: object },
 *   coqMetrics: { totalCOQ: number, coqPercentRevenue: number, categoryBreakdown: object },
 *   optimizationPlan: { recommendations: object[], investmentPriorities: object[], expectedROI: object },
 *   trackingSystem: { metrics: object[], targets: object[], reportingCadence: object }
 * }
 * @example
 * // Input
 * {
 *   organizationContext: { industry: "manufacturing", businessModel: "B2B", qualityMaturity: "intermediate" },
 *   financialData: { qualityBudget: {...}, historicalCosts: [...], accountingStructure: {...} },
 *   processData: { processes: [...], defectData: [...], inspectionData: [...] },
 *   qualityPrograms: { currentPrograms: [...], investments: [...], resources: {...} },
 *   analysisScope: { timeframe: "12-months", scope: ["manufacturing", "customer-service"], granularity: "monthly" }
 * }
 * @references Juran's Quality Costs, ASQ COQ Guidelines, PAF Model
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, financialData, processData, qualityPrograms, analysisScope } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Cost Category Framework Setup
  const frameworkSetup = await ctx.task(setupCOQFramework, {
    organizationContext,
    financialData
  });
  artifacts.push({ phase: 'framework-setup', output: frameworkSetup });

  // Phase 2: Prevention Cost Analysis
  const preventionAnalysis = await ctx.task(analyzePreventionCosts, {
    frameworkSetup,
    qualityPrograms,
    financialData
  });
  artifacts.push({ phase: 'prevention-costs', output: preventionAnalysis });

  // Phase 3: Appraisal Cost Analysis
  const appraisalAnalysis = await ctx.task(analyzeAppraisalCosts, {
    frameworkSetup,
    processData,
    financialData
  });
  artifacts.push({ phase: 'appraisal-costs', output: appraisalAnalysis });

  // Phase 4: Internal Failure Cost Analysis
  const internalFailureAnalysis = await ctx.task(analyzeInternalFailureCosts, {
    frameworkSetup,
    processData,
    financialData
  });
  artifacts.push({ phase: 'internal-failure-costs', output: internalFailureAnalysis });

  // Phase 5: External Failure Cost Analysis
  const externalFailureAnalysis = await ctx.task(analyzeExternalFailureCosts, {
    frameworkSetup,
    processData,
    financialData
  });
  artifacts.push({ phase: 'external-failure-costs', output: externalFailureAnalysis });

  // Quality Gate: COQ Data Validation
  await ctx.breakpoint('coq-data-validation', {
    title: 'COQ Data Validation',
    description: 'Review and validate COQ category analyses before aggregation',
    artifacts: [preventionAnalysis, appraisalAnalysis, internalFailureAnalysis, externalFailureAnalysis]
  });

  // Phase 6: Hidden Quality Costs Identification
  const hiddenCosts = await ctx.task(identifyHiddenCosts, {
    processData,
    internalFailureAnalysis,
    externalFailureAnalysis
  });
  artifacts.push({ phase: 'hidden-costs', output: hiddenCosts });

  // Phase 7: COQ Aggregation and Metrics
  const coqAggregation = await ctx.task(aggregateCOQMetrics, {
    preventionAnalysis,
    appraisalAnalysis,
    internalFailureAnalysis,
    externalFailureAnalysis,
    hiddenCosts,
    financialData
  });
  artifacts.push({ phase: 'coq-aggregation', output: coqAggregation });

  // Phase 8: Trend Analysis
  const trendAnalysis = await ctx.task(analyzeTrends, {
    coqAggregation,
    financialData,
    analysisScope
  });
  artifacts.push({ phase: 'trend-analysis', output: trendAnalysis });

  // Phase 9: Benchmarking
  const benchmarking = await ctx.task(benchmarkCOQ, {
    coqAggregation,
    organizationContext,
    trendAnalysis
  });
  artifacts.push({ phase: 'benchmarking', output: benchmarking });

  // Phase 10: Optimization Opportunity Identification
  const optimizationOpportunities = await ctx.task(identifyOptimizations, {
    coqAggregation,
    trendAnalysis,
    benchmarking,
    qualityPrograms
  });
  artifacts.push({ phase: 'optimization-opportunities', output: optimizationOpportunities });

  // Phase 11: Investment Priority Analysis
  const investmentPriorities = await ctx.task(prioritizeInvestments, {
    optimizationOpportunities,
    coqAggregation,
    qualityPrograms
  });
  artifacts.push({ phase: 'investment-priorities', output: investmentPriorities });

  // Phase 12: Tracking System Design
  const trackingSystem = await ctx.task(designTrackingSystem, {
    coqAggregation,
    frameworkSetup,
    analysisScope
  });
  artifacts.push({ phase: 'tracking-system', output: trackingSystem });

  // Phase 13: Reporting Framework
  const reportingFramework = await ctx.task(createReportingFramework, {
    trackingSystem,
    coqAggregation,
    organizationContext
  });
  artifacts.push({ phase: 'reporting-framework', output: reportingFramework });

  // Final Quality Gate: COQ Analysis Approval
  await ctx.breakpoint('coq-analysis-approval', {
    title: 'COQ Analysis Approval',
    description: 'Final approval of COQ analysis and optimization recommendations',
    artifacts: [coqAggregation, investmentPriorities, trackingSystem]
  });

  return {
    success: true,
    coqAnalysis: {
      preventionCosts: preventionAnalysis,
      appraisalCosts: appraisalAnalysis,
      internalFailure: internalFailureAnalysis,
      externalFailure: externalFailureAnalysis,
      hiddenCosts
    },
    coqMetrics: coqAggregation,
    trendAnalysis,
    benchmarking,
    optimizationPlan: {
      recommendations: optimizationOpportunities,
      investmentPriorities,
      expectedROI: investmentPriorities.roiAnalysis
    },
    trackingSystem,
    reportingFramework,
    artifacts,
    metadata: {
      processId: 'cost-of-quality',
      startTime,
      endTime: ctx.now(),
      organizationContext,
      analysisScope
    }
  };
}

export const setupCOQFramework = defineTask('setup-coq-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup COQ Framework',
  agent: {
    name: 'coq-framework-specialist',
    prompt: {
      role: 'Cost of Quality framework specialist',
      task: 'Setup the COQ categorization framework',
      context: {
        organizationContext: args.organizationContext,
        financialData: args.financialData
      },
      instructions: [
        'Define PAF categories for organization',
        'Map cost elements to categories',
        'Establish data collection sources',
        'Create cost allocation rules',
        'Define calculation methodologies',
        'Document framework assumptions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        categories: { type: 'object' },
        costElementMapping: { type: 'object' },
        dataSources: { type: 'array' },
        allocationRules: { type: 'object' },
        calculationMethods: { type: 'object' },
        assumptions: { type: 'array' }
      },
      required: ['categories', 'costElementMapping', 'calculationMethods']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'framework', 'coq']
}));

export const analyzePreventionCosts = defineTask('analyze-prevention-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Prevention Costs',
  agent: {
    name: 'prevention-cost-analyst',
    prompt: {
      role: 'Quality cost analysis specialist',
      task: 'Analyze prevention-related quality costs',
      context: {
        frameworkSetup: args.frameworkSetup,
        qualityPrograms: args.qualityPrograms,
        financialData: args.financialData
      },
      instructions: [
        'Identify quality planning costs',
        'Calculate training and education costs',
        'Assess process improvement costs',
        'Quantify supplier quality costs',
        'Analyze quality system maintenance costs',
        'Document prevention investment breakdown'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        planningCosts: { type: 'object' },
        trainingCosts: { type: 'object' },
        processImprovementCosts: { type: 'object' },
        supplierQualityCosts: { type: 'object' },
        systemMaintenanceCosts: { type: 'object' },
        totalPrevention: { type: 'number' },
        breakdown: { type: 'array' }
      },
      required: ['totalPrevention', 'breakdown']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prevention', 'costs']
}));

export const analyzeAppraisalCosts = defineTask('analyze-appraisal-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Appraisal Costs',
  agent: {
    name: 'appraisal-cost-analyst',
    prompt: {
      role: 'Appraisal cost analysis specialist',
      task: 'Analyze appraisal and inspection-related costs',
      context: {
        frameworkSetup: args.frameworkSetup,
        processData: args.processData,
        financialData: args.financialData
      },
      instructions: [
        'Calculate incoming inspection costs',
        'Quantify in-process inspection costs',
        'Assess final inspection and testing costs',
        'Calculate audit costs',
        'Analyze calibration and equipment costs',
        'Document appraisal cost breakdown'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        incomingInspection: { type: 'object' },
        inProcessInspection: { type: 'object' },
        finalInspection: { type: 'object' },
        auditCosts: { type: 'object' },
        equipmentCosts: { type: 'object' },
        totalAppraisal: { type: 'number' },
        breakdown: { type: 'array' }
      },
      required: ['totalAppraisal', 'breakdown']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'appraisal', 'costs']
}));

export const analyzeInternalFailureCosts = defineTask('analyze-internal-failure-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Internal Failure Costs',
  agent: {
    name: 'internal-failure-analyst',
    prompt: {
      role: 'Internal failure cost analysis specialist',
      task: 'Analyze internal failure-related costs',
      context: {
        frameworkSetup: args.frameworkSetup,
        processData: args.processData,
        financialData: args.financialData
      },
      instructions: [
        'Calculate scrap and waste costs',
        'Quantify rework costs',
        'Assess re-inspection costs',
        'Calculate downtime costs',
        'Analyze failure analysis costs',
        'Document internal failure breakdown'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        scrapCosts: { type: 'object' },
        reworkCosts: { type: 'object' },
        reinspectionCosts: { type: 'object' },
        downtimeCosts: { type: 'object' },
        failureAnalysisCosts: { type: 'object' },
        totalInternalFailure: { type: 'number' },
        breakdown: { type: 'array' }
      },
      required: ['totalInternalFailure', 'breakdown']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'internal-failure', 'costs']
}));

export const analyzeExternalFailureCosts = defineTask('analyze-external-failure-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze External Failure Costs',
  agent: {
    name: 'external-failure-analyst',
    prompt: {
      role: 'External failure cost analysis specialist',
      task: 'Analyze external failure-related costs',
      context: {
        frameworkSetup: args.frameworkSetup,
        processData: args.processData,
        financialData: args.financialData
      },
      instructions: [
        'Calculate warranty costs',
        'Quantify returns and recalls',
        'Assess customer complaint handling costs',
        'Calculate liability and legal costs',
        'Analyze lost sales and reputation costs',
        'Document external failure breakdown'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        warrantyCosts: { type: 'object' },
        returnsCosts: { type: 'object' },
        complaintHandlingCosts: { type: 'object' },
        liabilityCosts: { type: 'object' },
        lostSalesCosts: { type: 'object' },
        totalExternalFailure: { type: 'number' },
        breakdown: { type: 'array' }
      },
      required: ['totalExternalFailure', 'breakdown']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'external-failure', 'costs']
}));

export const identifyHiddenCosts = defineTask('identify-hidden-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Hidden Quality Costs',
  agent: {
    name: 'hidden-cost-analyst',
    prompt: {
      role: 'Hidden quality cost specialist',
      task: 'Identify and estimate hidden quality costs',
      context: {
        processData: args.processData,
        internalFailureAnalysis: args.internalFailureAnalysis,
        externalFailureAnalysis: args.externalFailureAnalysis
      },
      instructions: [
        'Identify excess inventory from quality issues',
        'Calculate expediting and overtime costs',
        'Assess capacity lost to quality problems',
        'Estimate customer dissatisfaction costs',
        'Quantify opportunity costs',
        'Document hidden cost estimates'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        excessInventory: { type: 'object' },
        expeditingCosts: { type: 'object' },
        lostCapacity: { type: 'object' },
        customerDissatisfaction: { type: 'object' },
        opportunityCosts: { type: 'object' },
        totalHiddenCosts: { type: 'number' },
        estimateConfidence: { type: 'string' }
      },
      required: ['totalHiddenCosts', 'estimateConfidence']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hidden', 'costs']
}));

export const aggregateCOQMetrics = defineTask('aggregate-coq-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate COQ Metrics',
  agent: {
    name: 'coq-aggregator',
    prompt: {
      role: 'COQ metrics aggregation specialist',
      task: 'Aggregate and calculate comprehensive COQ metrics',
      context: {
        preventionAnalysis: args.preventionAnalysis,
        appraisalAnalysis: args.appraisalAnalysis,
        internalFailureAnalysis: args.internalFailureAnalysis,
        externalFailureAnalysis: args.externalFailureAnalysis,
        hiddenCosts: args.hiddenCosts,
        financialData: args.financialData
      },
      instructions: [
        'Calculate total COQ',
        'Compute COQ as percentage of revenue',
        'Calculate category distributions',
        'Compute conformance vs non-conformance ratios',
        'Calculate COQ per unit metrics',
        'Document key metrics summary'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        totalCOQ: { type: 'number' },
        coqPercentRevenue: { type: 'number' },
        categoryBreakdown: { type: 'object' },
        conformanceRatio: { type: 'number' },
        coqPerUnit: { type: 'number' },
        metricsSummary: { type: 'object' }
      },
      required: ['totalCOQ', 'coqPercentRevenue', 'categoryBreakdown']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'aggregation', 'metrics']
}));

export const analyzeTrends = defineTask('analyze-trends', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze COQ Trends',
  agent: {
    name: 'trend-analyst',
    prompt: {
      role: 'COQ trend analysis specialist',
      task: 'Analyze COQ trends over time',
      context: {
        coqAggregation: args.coqAggregation,
        financialData: args.financialData,
        analysisScope: args.analysisScope
      },
      instructions: [
        'Analyze total COQ trend',
        'Evaluate category mix trends',
        'Identify seasonal patterns',
        'Assess improvement trajectory',
        'Calculate trend statistics',
        'Project future COQ'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        totalTrend: { type: 'object' },
        categoryTrends: { type: 'object' },
        seasonalPatterns: { type: 'array' },
        improvementRate: { type: 'number' },
        trendStatistics: { type: 'object' },
        projections: { type: 'object' }
      },
      required: ['totalTrend', 'categoryTrends', 'improvementRate']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'trend', 'analysis']
}));

export const benchmarkCOQ = defineTask('benchmark-coq', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark COQ',
  agent: {
    name: 'benchmarking-specialist',
    prompt: {
      role: 'Quality cost benchmarking specialist',
      task: 'Benchmark COQ against industry standards',
      context: {
        coqAggregation: args.coqAggregation,
        organizationContext: args.organizationContext,
        trendAnalysis: args.trendAnalysis
      },
      instructions: [
        'Compare COQ to industry benchmarks',
        'Assess category distribution vs best practice',
        'Identify performance gaps',
        'Evaluate maturity level',
        'Determine target state',
        'Document benchmark findings'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        industryComparison: { type: 'object' },
        distributionComparison: { type: 'object' },
        performanceGaps: { type: 'array' },
        maturityLevel: { type: 'string' },
        targetState: { type: 'object' },
        findings: { type: 'array' }
      },
      required: ['industryComparison', 'performanceGaps', 'targetState']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'benchmarking', 'comparison']
}));

export const identifyOptimizations = defineTask('identify-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Optimization Opportunities',
  agent: {
    name: 'optimization-analyst',
    prompt: {
      role: 'COQ optimization specialist',
      task: 'Identify opportunities to optimize quality costs',
      context: {
        coqAggregation: args.coqAggregation,
        trendAnalysis: args.trendAnalysis,
        benchmarking: args.benchmarking,
        qualityPrograms: args.qualityPrograms
      },
      instructions: [
        'Identify high-impact cost reduction opportunities',
        'Find prevention investment opportunities',
        'Locate appraisal efficiency improvements',
        'Target failure cost reduction areas',
        'Quantify opportunity values',
        'Prioritize by ROI potential'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        costReductionOpportunities: { type: 'array' },
        preventionInvestments: { type: 'array' },
        appraisalEfficiencies: { type: 'array' },
        failureCostTargets: { type: 'array' },
        opportunityValues: { type: 'object' },
        roiPrioritization: { type: 'array' }
      },
      required: ['costReductionOpportunities', 'preventionInvestments', 'roiPrioritization']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'optimization', 'opportunities']
}));

export const prioritizeInvestments = defineTask('prioritize-investments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize Quality Investments',
  agent: {
    name: 'investment-prioritizer',
    prompt: {
      role: 'Quality investment prioritization specialist',
      task: 'Prioritize quality investments based on COQ impact',
      context: {
        optimizationOpportunities: args.optimizationOpportunities,
        coqAggregation: args.coqAggregation,
        qualityPrograms: args.qualityPrograms
      },
      instructions: [
        'Evaluate investment options',
        'Calculate expected ROI for each option',
        'Assess implementation feasibility',
        'Consider resource constraints',
        'Create prioritized investment portfolio',
        'Document investment recommendations'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        investmentOptions: { type: 'array' },
        roiAnalysis: { type: 'object' },
        feasibilityAssessment: { type: 'object' },
        resourceConstraints: { type: 'array' },
        prioritizedPortfolio: { type: 'array' },
        recommendations: { type: 'array' }
      },
      required: ['roiAnalysis', 'prioritizedPortfolio', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'investment', 'prioritization']
}));

export const designTrackingSystem = defineTask('design-tracking-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design COQ Tracking System',
  agent: {
    name: 'tracking-system-designer',
    prompt: {
      role: 'COQ tracking system specialist',
      task: 'Design ongoing COQ tracking and monitoring system',
      context: {
        coqAggregation: args.coqAggregation,
        frameworkSetup: args.frameworkSetup,
        analysisScope: args.analysisScope
      },
      instructions: [
        'Define key tracking metrics',
        'Design data collection processes',
        'Establish targets by category',
        'Create alert thresholds',
        'Design review cadence',
        'Document tracking procedures'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        metrics: { type: 'array' },
        dataCollectionProcess: { type: 'object' },
        targets: { type: 'object' },
        alertThresholds: { type: 'object' },
        reportingCadence: { type: 'object' },
        procedures: { type: 'array' }
      },
      required: ['metrics', 'targets', 'reportingCadence']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tracking', 'system']
}));

export const createReportingFramework = defineTask('create-reporting-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create COQ Reporting Framework',
  agent: {
    name: 'reporting-framework-designer',
    prompt: {
      role: 'COQ reporting framework specialist',
      task: 'Create comprehensive COQ reporting framework',
      context: {
        trackingSystem: args.trackingSystem,
        coqAggregation: args.coqAggregation,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Design executive COQ dashboard',
        'Create operational reports',
        'Design trend and analysis reports',
        'Establish report distribution',
        'Create report templates',
        'Document reporting procedures'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveDashboard: { type: 'object' },
        operationalReports: { type: 'array' },
        analysisReports: { type: 'array' },
        distribution: { type: 'object' },
        templates: { type: 'array' },
        procedures: { type: 'array' }
      },
      required: ['executiveDashboard', 'operationalReports', 'templates']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'framework']
}));
