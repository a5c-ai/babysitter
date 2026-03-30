/**
 * @process specializations/domains/business/operations/benchmarking
 * @description Benchmarking Program for systematic comparison of processes, practices, and
 *              performance against industry leaders and best-in-class organizations.
 *              Supports internal, competitive, functional, and generic benchmarking approaches.
 * @inputs {
 *   organizationContext: { industry: string, size: string, strategicPriorities: string[] },
 *   benchmarkingScope: { processAreas: string[], metrics: object[], benchmarkingType: string },
 *   currentPerformance: { metrics: object, processes: object[], capabilities: object },
 *   partnerCriteria: { targetCompanies: string[], selectionCriteria: object, accessMethods: string[] },
 *   projectParameters: { timeline: string, resources: object, budget: number }
 * }
 * @outputs {
 *   benchmarkingResults: { performanceGaps: object[], bestPractices: object[], enablers: object[] },
 *   gapAnalysis: { currentVsBenchmark: object, prioritizedGaps: object[], rootCauses: object[] },
 *   adaptationPlan: { practiceAdaptations: object[], implementationRoadmap: object, expectedImpact: object },
 *   programMetrics: { studiesCompleted: number, practicesAdopted: number, performanceImprovement: number }
 * }
 * @example
 * // Input
 * {
 *   organizationContext: { industry: "manufacturing", size: "mid-market", strategicPriorities: ["cost-reduction", "quality-improvement"] },
 *   benchmarkingScope: { processAreas: ["order-fulfillment", "production"], metrics: [...], benchmarkingType: "competitive" },
 *   currentPerformance: { metrics: {...}, processes: [...], capabilities: {...} },
 *   partnerCriteria: { targetCompanies: [...], selectionCriteria: {...}, accessMethods: [...] },
 *   projectParameters: { timeline: "6-months", resources: {...}, budget: 50000 }
 * }
 * @references APQC Benchmarking, Xerox Benchmarking Model, Camp's Benchmarking Process
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, benchmarkingScope, currentPerformance, partnerCriteria, projectParameters } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Benchmarking Planning
  const benchmarkingPlan = await ctx.task(planBenchmarking, {
    organizationContext,
    benchmarkingScope,
    projectParameters
  });
  artifacts.push({ phase: 'benchmarking-plan', output: benchmarkingPlan });

  // Phase 2: Process Selection and Documentation
  const processDocumentation = await ctx.task(documentProcesses, {
    benchmarkingScope,
    currentPerformance
  });
  artifacts.push({ phase: 'process-documentation', output: processDocumentation });

  // Phase 3: Metrics Definition
  const metricsDefinition = await ctx.task(defineMetrics, {
    benchmarkingScope,
    processDocumentation,
    currentPerformance
  });
  artifacts.push({ phase: 'metrics-definition', output: metricsDefinition });

  // Phase 4: Partner Identification and Selection
  const partnerSelection = await ctx.task(selectPartners, {
    partnerCriteria,
    benchmarkingScope,
    organizationContext
  });
  artifacts.push({ phase: 'partner-selection', output: partnerSelection });

  // Quality Gate: Benchmarking Setup Review
  await ctx.breakpoint('benchmarking-setup-review', {
    title: 'Benchmarking Setup Review',
    description: 'Review benchmarking plan, processes, metrics, and partners before data collection',
    artifacts: [benchmarkingPlan, processDocumentation, metricsDefinition, partnerSelection]
  });

  // Phase 5: Internal Data Collection
  const internalData = await ctx.task(collectInternalData, {
    metricsDefinition,
    processDocumentation,
    currentPerformance
  });
  artifacts.push({ phase: 'internal-data', output: internalData });

  // Phase 6: External Data Collection
  const externalData = await ctx.task(collectExternalData, {
    partnerSelection,
    metricsDefinition,
    benchmarkingScope
  });
  artifacts.push({ phase: 'external-data', output: externalData });

  // Phase 7: Data Normalization
  const normalizedData = await ctx.task(normalizeData, {
    internalData,
    externalData,
    metricsDefinition
  });
  artifacts.push({ phase: 'normalized-data', output: normalizedData });

  // Phase 8: Performance Gap Analysis
  const gapAnalysis = await ctx.task(analyzePerformanceGaps, {
    normalizedData,
    internalData,
    metricsDefinition
  });
  artifacts.push({ phase: 'gap-analysis', output: gapAnalysis });

  // Phase 9: Best Practice Identification
  const bestPractices = await ctx.task(identifyBestPractices, {
    externalData,
    gapAnalysis,
    processDocumentation
  });
  artifacts.push({ phase: 'best-practices', output: bestPractices });

  // Phase 10: Enabler Analysis
  const enablerAnalysis = await ctx.task(analyzeEnablers, {
    bestPractices,
    gapAnalysis,
    organizationContext
  });
  artifacts.push({ phase: 'enabler-analysis', output: enablerAnalysis });

  // Quality Gate: Findings Review
  await ctx.breakpoint('findings-review', {
    title: 'Benchmarking Findings Review',
    description: 'Review gap analysis, best practices, and enablers before adaptation planning',
    artifacts: [gapAnalysis, bestPractices, enablerAnalysis]
  });

  // Phase 11: Practice Adaptation Design
  const practiceAdaptation = await ctx.task(designPracticeAdaptation, {
    bestPractices,
    enablerAnalysis,
    organizationContext,
    gapAnalysis
  });
  artifacts.push({ phase: 'practice-adaptation', output: practiceAdaptation });

  // Phase 12: Implementation Roadmap Development
  const implementationRoadmap = await ctx.task(developImplementationRoadmap, {
    practiceAdaptation,
    projectParameters,
    organizationContext
  });
  artifacts.push({ phase: 'implementation-roadmap', output: implementationRoadmap });

  // Phase 13: Impact Projection
  const impactProjection = await ctx.task(projectImpact, {
    practiceAdaptation,
    gapAnalysis,
    currentPerformance
  });
  artifacts.push({ phase: 'impact-projection', output: impactProjection });

  // Phase 14: Benchmarking Report
  const benchmarkingReport = await ctx.task(createBenchmarkingReport, {
    gapAnalysis,
    bestPractices,
    practiceAdaptation,
    implementationRoadmap,
    impactProjection
  });
  artifacts.push({ phase: 'benchmarking-report', output: benchmarkingReport });

  // Phase 15: Knowledge Transfer Planning
  const knowledgeTransfer = await ctx.task(planKnowledgeTransfer, {
    bestPractices,
    practiceAdaptation,
    organizationContext
  });
  artifacts.push({ phase: 'knowledge-transfer', output: knowledgeTransfer });

  // Final Quality Gate: Benchmarking Program Approval
  await ctx.breakpoint('benchmarking-approval', {
    title: 'Benchmarking Program Approval',
    description: 'Final approval of benchmarking results and adaptation plan',
    artifacts: [benchmarkingReport, implementationRoadmap, impactProjection]
  });

  return {
    success: true,
    benchmarkingResults: {
      performanceGaps: gapAnalysis.gaps,
      bestPractices: bestPractices.practices,
      enablers: enablerAnalysis.enablers
    },
    gapAnalysis: {
      currentVsBenchmark: normalizedData.comparison,
      prioritizedGaps: gapAnalysis.prioritizedGaps,
      rootCauses: gapAnalysis.rootCauses
    },
    adaptationPlan: {
      practiceAdaptations: practiceAdaptation.adaptations,
      implementationRoadmap,
      expectedImpact: impactProjection
    },
    benchmarkingReport,
    knowledgeTransfer,
    programMetrics: {
      studiesCompleted: 1,
      practicesIdentified: bestPractices.practices.length,
      gapsIdentified: gapAnalysis.gaps.length,
      expectedImprovement: impactProjection.totalImpact
    },
    artifacts,
    metadata: {
      processId: 'benchmarking',
      startTime,
      endTime: ctx.now(),
      organizationContext,
      benchmarkingScope
    }
  };
}

export const planBenchmarking = defineTask('plan-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Benchmarking Study',
  agent: {
    name: 'benchmarking-planner',
    prompt: {
      role: 'Benchmarking program planner',
      task: 'Create comprehensive benchmarking study plan',
      context: {
        organizationContext: args.organizationContext,
        benchmarkingScope: args.benchmarkingScope,
        projectParameters: args.projectParameters
      },
      instructions: [
        'Define benchmarking objectives and success criteria',
        'Select appropriate benchmarking type',
        'Create project timeline and milestones',
        'Identify resource requirements',
        'Define governance and roles',
        'Document study methodology'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        objectives: { type: 'array' },
        successCriteria: { type: 'array' },
        benchmarkingType: { type: 'string' },
        projectTimeline: { type: 'object' },
        resourceRequirements: { type: 'object' },
        governance: { type: 'object' },
        methodology: { type: 'object' }
      },
      required: ['objectives', 'benchmarkingType', 'projectTimeline', 'methodology']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'benchmarking']
}));

export const documentProcesses = defineTask('document-processes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document Current Processes',
  agent: {
    name: 'process-documenter',
    prompt: {
      role: 'Process documentation specialist',
      task: 'Document current processes for benchmarking comparison',
      context: {
        benchmarkingScope: args.benchmarkingScope,
        currentPerformance: args.currentPerformance
      },
      instructions: [
        'Map selected processes end-to-end',
        'Document process steps and activities',
        'Identify inputs, outputs, and resources',
        'Note current process pain points',
        'Document process variations',
        'Create process documentation package'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        processMaps: { type: 'array' },
        processSteps: { type: 'object' },
        inputsOutputs: { type: 'object' },
        painPoints: { type: 'array' },
        variations: { type: 'array' },
        documentationPackage: { type: 'object' }
      },
      required: ['processMaps', 'processSteps', 'painPoints']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'process', 'documentation']
}));

export const defineMetrics = defineTask('define-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Benchmarking Metrics',
  agent: {
    name: 'metrics-definer',
    prompt: {
      role: 'Benchmarking metrics specialist',
      task: 'Define metrics for benchmarking comparison',
      context: {
        benchmarkingScope: args.benchmarkingScope,
        processDocumentation: args.processDocumentation,
        currentPerformance: args.currentPerformance
      },
      instructions: [
        'Select key performance indicators',
        'Define measurement methodology',
        'Establish data collection procedures',
        'Create normalization factors',
        'Define comparison basis',
        'Document metric definitions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        kpis: { type: 'array' },
        measurementMethods: { type: 'object' },
        dataCollectionProcedures: { type: 'object' },
        normalizationFactors: { type: 'object' },
        comparisonBasis: { type: 'object' },
        metricDefinitions: { type: 'array' }
      },
      required: ['kpis', 'measurementMethods', 'metricDefinitions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metrics', 'definition']
}));

export const selectPartners = defineTask('select-partners', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Benchmarking Partners',
  agent: {
    name: 'partner-selector',
    prompt: {
      role: 'Benchmarking partner selection specialist',
      task: 'Identify and select benchmarking partners',
      context: {
        partnerCriteria: args.partnerCriteria,
        benchmarkingScope: args.benchmarkingScope,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Identify potential benchmarking partners',
        'Evaluate against selection criteria',
        'Assess data accessibility',
        'Evaluate comparability',
        'Select optimal partner set',
        'Plan partner engagement approach'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        potentialPartners: { type: 'array' },
        evaluationResults: { type: 'object' },
        accessibilityAssessment: { type: 'object' },
        comparabilityAssessment: { type: 'object' },
        selectedPartners: { type: 'array' },
        engagementApproach: { type: 'object' }
      },
      required: ['selectedPartners', 'evaluationResults', 'engagementApproach']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'partner', 'selection']
}));

export const collectInternalData = defineTask('collect-internal-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect Internal Data',
  agent: {
    name: 'internal-data-collector',
    prompt: {
      role: 'Internal data collection specialist',
      task: 'Collect internal performance and process data',
      context: {
        metricsDefinition: args.metricsDefinition,
        processDocumentation: args.processDocumentation,
        currentPerformance: args.currentPerformance
      },
      instructions: [
        'Collect metric data from internal sources',
        'Gather process practice details',
        'Document enablers and barriers',
        'Validate data quality',
        'Address data gaps',
        'Compile internal data package'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        metricData: { type: 'object' },
        practiceDetails: { type: 'object' },
        enablersBarriers: { type: 'object' },
        dataQualityReport: { type: 'object' },
        dataGaps: { type: 'array' },
        internalDataPackage: { type: 'object' }
      },
      required: ['metricData', 'practiceDetails', 'internalDataPackage']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'internal', 'data-collection']
}));

export const collectExternalData = defineTask('collect-external-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect External Data',
  agent: {
    name: 'external-data-collector',
    prompt: {
      role: 'External benchmarking data collection specialist',
      task: 'Collect external benchmarking data from partners and sources',
      context: {
        partnerSelection: args.partnerSelection,
        metricsDefinition: args.metricsDefinition,
        benchmarkingScope: args.benchmarkingScope
      },
      instructions: [
        'Execute partner data collection',
        'Gather industry benchmark data',
        'Collect best practice examples',
        'Document data sources and methods',
        'Validate external data quality',
        'Compile external data package'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        partnerData: { type: 'object' },
        industryBenchmarks: { type: 'object' },
        bestPracticeExamples: { type: 'array' },
        dataSourceDocumentation: { type: 'object' },
        dataQualityReport: { type: 'object' },
        externalDataPackage: { type: 'object' }
      },
      required: ['partnerData', 'industryBenchmarks', 'externalDataPackage']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'external', 'data-collection']
}));

export const normalizeData = defineTask('normalize-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Normalize Data',
  agent: {
    name: 'data-normalizer',
    prompt: {
      role: 'Benchmarking data normalization specialist',
      task: 'Normalize data for valid comparison',
      context: {
        internalData: args.internalData,
        externalData: args.externalData,
        metricsDefinition: args.metricsDefinition
      },
      instructions: [
        'Apply normalization factors',
        'Adjust for scale and context differences',
        'Standardize measurement units',
        'Account for industry variations',
        'Create comparable datasets',
        'Document normalization methodology'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        normalizedInternalData: { type: 'object' },
        normalizedExternalData: { type: 'object' },
        comparison: { type: 'object' },
        adjustmentsMade: { type: 'array' },
        comparabilityAssessment: { type: 'object' },
        normalizationMethodology: { type: 'object' }
      },
      required: ['normalizedInternalData', 'normalizedExternalData', 'comparison']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'normalization', 'data']
}));

export const analyzePerformanceGaps = defineTask('analyze-performance-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Performance Gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'Performance gap analysis specialist',
      task: 'Analyze gaps between internal and benchmark performance',
      context: {
        normalizedData: args.normalizedData,
        internalData: args.internalData,
        metricsDefinition: args.metricsDefinition
      },
      instructions: [
        'Calculate performance gaps for each metric',
        'Identify largest gaps',
        'Analyze gap patterns',
        'Prioritize gaps by impact',
        'Identify potential root causes',
        'Document gap analysis findings'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        gaps: { type: 'array' },
        largestGaps: { type: 'array' },
        gapPatterns: { type: 'object' },
        prioritizedGaps: { type: 'array' },
        rootCauses: { type: 'array' },
        gapAnalysisFindings: { type: 'object' }
      },
      required: ['gaps', 'prioritizedGaps', 'rootCauses']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gap', 'analysis']
}));

export const identifyBestPractices = defineTask('identify-best-practices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Best Practices',
  agent: {
    name: 'best-practice-identifier',
    prompt: {
      role: 'Best practice identification specialist',
      task: 'Identify best practices from benchmark partners',
      context: {
        externalData: args.externalData,
        gapAnalysis: args.gapAnalysis,
        processDocumentation: args.processDocumentation
      },
      instructions: [
        'Identify practices driving superior performance',
        'Document practice details and implementation',
        'Assess practice applicability',
        'Identify practice prerequisites',
        'Evaluate practice transferability',
        'Create best practice profiles'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        practices: { type: 'array' },
        practiceDetails: { type: 'object' },
        applicabilityAssessment: { type: 'object' },
        prerequisites: { type: 'object' },
        transferabilityAssessment: { type: 'object' },
        practiceProfiles: { type: 'array' }
      },
      required: ['practices', 'practiceDetails', 'practiceProfiles']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'best-practice', 'identification']
}));

export const analyzeEnablers = defineTask('analyze-enablers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Enablers',
  agent: {
    name: 'enabler-analyst',
    prompt: {
      role: 'Performance enabler analysis specialist',
      task: 'Analyze enablers behind best practices',
      context: {
        bestPractices: args.bestPractices,
        gapAnalysis: args.gapAnalysis,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Identify technology enablers',
        'Analyze organizational enablers',
        'Assess cultural enablers',
        'Identify process enablers',
        'Evaluate enabler gaps',
        'Prioritize enabler development'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        enablers: { type: 'array' },
        technologyEnablers: { type: 'array' },
        organizationalEnablers: { type: 'array' },
        culturalEnablers: { type: 'array' },
        processEnablers: { type: 'array' },
        enablerGaps: { type: 'array' },
        enablerPriorities: { type: 'array' }
      },
      required: ['enablers', 'enablerGaps', 'enablerPriorities']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'enabler', 'analysis']
}));

export const designPracticeAdaptation = defineTask('design-practice-adaptation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Practice Adaptation',
  agent: {
    name: 'practice-adapter',
    prompt: {
      role: 'Best practice adaptation specialist',
      task: 'Design adaptations of best practices for local implementation',
      context: {
        bestPractices: args.bestPractices,
        enablerAnalysis: args.enablerAnalysis,
        organizationContext: args.organizationContext,
        gapAnalysis: args.gapAnalysis
      },
      instructions: [
        'Adapt practices to organizational context',
        'Design implementation approach',
        'Identify required modifications',
        'Plan enabler development',
        'Assess implementation risk',
        'Document adapted practices'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        adaptations: { type: 'array' },
        implementationApproach: { type: 'object' },
        modifications: { type: 'array' },
        enablerDevelopmentPlan: { type: 'object' },
        riskAssessment: { type: 'object' },
        adaptedPracticeDocumentation: { type: 'array' }
      },
      required: ['adaptations', 'implementationApproach', 'riskAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adaptation', 'design']
}));

export const developImplementationRoadmap = defineTask('develop-implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Implementation Roadmap',
  agent: {
    name: 'roadmap-developer',
    prompt: {
      role: 'Implementation roadmap specialist',
      task: 'Develop roadmap for implementing adapted practices',
      context: {
        practiceAdaptation: args.practiceAdaptation,
        projectParameters: args.projectParameters,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Sequence practice implementations',
        'Define implementation phases',
        'Allocate resources by phase',
        'Establish milestones and gates',
        'Identify dependencies',
        'Create change management plan'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        implementationSequence: { type: 'array' },
        phases: { type: 'array' },
        resourceAllocation: { type: 'object' },
        milestones: { type: 'array' },
        dependencies: { type: 'array' },
        changeManagementPlan: { type: 'object' }
      },
      required: ['implementationSequence', 'phases', 'milestones']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'roadmap', 'implementation']
}));

export const projectImpact = defineTask('project-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Project Impact',
  agent: {
    name: 'impact-projector',
    prompt: {
      role: 'Performance impact projection specialist',
      task: 'Project expected impact of practice implementations',
      context: {
        practiceAdaptation: args.practiceAdaptation,
        gapAnalysis: args.gapAnalysis,
        currentPerformance: args.currentPerformance
      },
      instructions: [
        'Estimate performance improvement by practice',
        'Calculate cumulative impact',
        'Assess implementation timeline to benefit',
        'Identify quick wins',
        'Calculate return on investment',
        'Document impact projections'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        practiceImpacts: { type: 'array' },
        cumulativeImpact: { type: 'object' },
        totalImpact: { type: 'number' },
        timelineToBenefit: { type: 'object' },
        quickWins: { type: 'array' },
        roiProjection: { type: 'object' },
        impactDocumentation: { type: 'object' }
      },
      required: ['practiceImpacts', 'totalImpact', 'roiProjection']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact', 'projection']
}));

export const createBenchmarkingReport = defineTask('create-benchmarking-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Benchmarking Report',
  agent: {
    name: 'report-creator',
    prompt: {
      role: 'Benchmarking report specialist',
      task: 'Create comprehensive benchmarking study report',
      context: {
        gapAnalysis: args.gapAnalysis,
        bestPractices: args.bestPractices,
        practiceAdaptation: args.practiceAdaptation,
        implementationRoadmap: args.implementationRoadmap,
        impactProjection: args.impactProjection
      },
      instructions: [
        'Compile executive summary',
        'Document methodology and approach',
        'Present key findings',
        'Detail gap analysis results',
        'Summarize best practices',
        'Present recommendations and roadmap'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSummary: { type: 'string' },
        methodologySection: { type: 'object' },
        keyFindings: { type: 'array' },
        gapAnalysisSection: { type: 'object' },
        bestPracticesSection: { type: 'object' },
        recommendations: { type: 'array' },
        fullReport: { type: 'object' }
      },
      required: ['executiveSummary', 'keyFindings', 'recommendations', 'fullReport']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'report', 'documentation']
}));

export const planKnowledgeTransfer = defineTask('plan-knowledge-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Knowledge Transfer',
  agent: {
    name: 'knowledge-transfer-planner',
    prompt: {
      role: 'Knowledge transfer planning specialist',
      task: 'Plan knowledge transfer for benchmarking findings',
      context: {
        bestPractices: args.bestPractices,
        practiceAdaptation: args.practiceAdaptation,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Identify knowledge transfer audiences',
        'Design communication approach',
        'Plan training requirements',
        'Create knowledge repository',
        'Establish ongoing learning mechanisms',
        'Document knowledge transfer plan'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        audiences: { type: 'array' },
        communicationPlan: { type: 'object' },
        trainingRequirements: { type: 'object' },
        knowledgeRepository: { type: 'object' },
        ongoingLearning: { type: 'object' },
        knowledgeTransferPlan: { type: 'object' }
      },
      required: ['audiences', 'communicationPlan', 'knowledgeTransferPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-transfer', 'planning']
}));
