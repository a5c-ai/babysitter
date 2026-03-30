/**
 * @process customer-experience/touchpoint-optimization
 * @description Systematic process for analyzing and improving individual customer touchpoints based on journey analytics
 * @inputs { touchpoint: object, analyticsData: object, feedbackData: array, benchmarks: object }
 * @outputs { success: boolean, touchpointAnalysis: object, optimizationPlan: object, implementationGuide: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    touchpoint = {},
    analyticsData = {},
    feedbackData = [],
    benchmarks = {},
    outputDir = 'touchpoint-optimization-output',
    targetImprovement = 20
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Touchpoint Optimization for: ${touchpoint.name || 'touchpoint'}`);

  // ============================================================================
  // PHASE 1: TOUCHPOINT BASELINE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing touchpoint baseline');
  const baselineAnalysis = await ctx.task(baselineAnalysisTask, {
    touchpoint,
    analyticsData,
    benchmarks,
    outputDir
  });

  artifacts.push(...baselineAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PERFORMANCE METRICS DEEP DIVE
  // ============================================================================

  ctx.log('info', 'Phase 2: Deep diving into performance metrics');
  const metricsDeepDive = await ctx.task(metricsDeepDiveTask, {
    touchpoint,
    analyticsData,
    baselineAnalysis,
    outputDir
  });

  artifacts.push(...metricsDeepDive.artifacts);

  // ============================================================================
  // PHASE 3: CUSTOMER FEEDBACK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing customer feedback');
  const feedbackAnalysis = await ctx.task(feedbackAnalysisTask, {
    touchpoint,
    feedbackData,
    baselineAnalysis,
    outputDir
  });

  artifacts.push(...feedbackAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: FRICTION POINT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying friction points');
  const frictionAnalysis = await ctx.task(frictionAnalysisTask, {
    metricsDeepDive,
    feedbackAnalysis,
    analyticsData,
    outputDir
  });

  artifacts.push(...frictionAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: OPTIMIZATION OPPORTUNITY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Mapping optimization opportunities');
  const opportunityMapping = await ctx.task(opportunityMappingTask, {
    baselineAnalysis,
    frictionAnalysis,
    feedbackAnalysis,
    benchmarks,
    outputDir
  });

  artifacts.push(...opportunityMapping.artifacts);

  // ============================================================================
  // PHASE 6: SOLUTION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing optimization solutions');
  const solutionDesign = await ctx.task(solutionDesignTask, {
    opportunityMapping,
    frictionAnalysis,
    touchpoint,
    targetImprovement,
    outputDir
  });

  artifacts.push(...solutionDesign.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning implementation');
  const implementationPlanning = await ctx.task(implementationPlanningTask, {
    solutionDesign,
    touchpoint,
    outputDir
  });

  artifacts.push(...implementationPlanning.artifacts);

  // ============================================================================
  // PHASE 8: SUCCESS METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining success metrics');
  const successMetrics = await ctx.task(successMetricsTask, {
    baselineAnalysis,
    solutionDesign,
    targetImprovement,
    outputDir
  });

  artifacts.push(...successMetrics.artifacts);

  const currentPerformance = baselineAnalysis.performanceScore;
  const expectedImprovement = solutionDesign.expectedImprovement;

  await ctx.breakpoint({
    question: `Touchpoint optimization complete for ${touchpoint.name || 'touchpoint'}. Current performance: ${currentPerformance}%. Expected improvement: ${expectedImprovement}%. Friction points: ${frictionAnalysis.frictionPoints?.length || 0}. Solutions designed: ${solutionDesign.solutions?.length || 0}. Review and implement?`,
    title: 'Touchpoint Optimization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        touchpointName: touchpoint.name,
        currentPerformance,
        expectedImprovement,
        frictionPointCount: frictionAnalysis.frictionPoints?.length || 0,
        opportunityCount: opportunityMapping.opportunities?.length || 0,
        solutionCount: solutionDesign.solutions?.length || 0,
        implementationPhases: implementationPlanning.phases?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    touchpointAnalysis: {
      baseline: baselineAnalysis.baseline,
      performanceScore: baselineAnalysis.performanceScore,
      metrics: metricsDeepDive.metrics,
      feedbackInsights: feedbackAnalysis.insights,
      frictionPoints: frictionAnalysis.frictionPoints
    },
    optimizationPlan: {
      opportunities: opportunityMapping.opportunities,
      solutions: solutionDesign.solutions,
      expectedImprovement: solutionDesign.expectedImprovement,
      prioritization: solutionDesign.prioritization
    },
    implementationGuide: {
      phases: implementationPlanning.phases,
      timeline: implementationPlanning.timeline,
      resources: implementationPlanning.resources,
      risks: implementationPlanning.risks
    },
    successMetrics: successMetrics.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/touchpoint-optimization',
      timestamp: startTime,
      touchpointName: touchpoint.name,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const baselineAnalysisTask = defineTask('baseline-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze touchpoint baseline',
  agent: {
    name: 'baseline-analyst',
    prompt: {
      role: 'touchpoint analytics specialist',
      task: 'Establish baseline performance metrics for the touchpoint',
      context: args,
      instructions: [
        'Document touchpoint purpose and objectives',
        'Calculate current performance score',
        'Gather volume and traffic metrics',
        'Assess conversion and completion rates',
        'Measure time-based metrics',
        'Compare to benchmarks',
        'Identify historical trends',
        'Document current state',
        'Generate baseline analysis report'
      ],
      outputFormat: 'JSON with baseline, performanceScore, volumeMetrics, conversionRates, timeMetrics, benchmarkComparison, trends, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'performanceScore', 'artifacts'],
      properties: {
        baseline: { type: 'object' },
        performanceScore: { type: 'number', minimum: 0, maximum: 100 },
        volumeMetrics: { type: 'object' },
        conversionRates: { type: 'object' },
        timeMetrics: { type: 'object' },
        benchmarkComparison: { type: 'object' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'baseline']
}));

export const metricsDeepDiveTask = defineTask('metrics-deep-dive', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deep dive into performance metrics',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'performance metrics specialist',
      task: 'Conduct deep analysis of touchpoint performance metrics',
      context: args,
      instructions: [
        'Analyze user behavior patterns',
        'Examine drop-off and abandonment',
        'Assess engagement depth',
        'Analyze device and platform differences',
        'Examine time-of-day patterns',
        'Segment by user type',
        'Identify correlations',
        'Calculate statistical significance',
        'Generate metrics deep dive report'
      ],
      outputFormat: 'JSON with metrics, behaviorPatterns, dropOffs, engagement, segmentation, correlations, significance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'behaviorPatterns', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        behaviorPatterns: { type: 'array', items: { type: 'object' } },
        dropOffs: { type: 'array', items: { type: 'object' } },
        engagement: { type: 'object' },
        segmentation: { type: 'object' },
        correlations: { type: 'array', items: { type: 'object' } },
        significance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'metrics']
}));

export const feedbackAnalysisTask = defineTask('feedback-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze customer feedback',
  agent: {
    name: 'feedback-analyst',
    prompt: {
      role: 'customer feedback analyst',
      task: 'Analyze customer feedback specific to the touchpoint',
      context: args,
      instructions: [
        'Filter feedback for touchpoint',
        'Perform sentiment analysis',
        'Extract common themes',
        'Identify specific complaints',
        'Identify praise and positives',
        'Analyze NPS and CSAT data',
        'Identify suggestion patterns',
        'Prioritize feedback by frequency',
        'Generate feedback analysis report'
      ],
      outputFormat: 'JSON with insights, sentiment, themes, complaints, positives, nps, suggestions, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'sentiment', 'themes', 'artifacts'],
      properties: {
        insights: { type: 'array', items: { type: 'object' } },
        sentiment: { type: 'object' },
        themes: { type: 'array', items: { type: 'object' } },
        complaints: { type: 'array', items: { type: 'object' } },
        positives: { type: 'array', items: { type: 'object' } },
        nps: { type: 'object' },
        suggestions: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'feedback']
}));

export const frictionAnalysisTask = defineTask('friction-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify friction points',
  agent: {
    name: 'friction-analyst',
    prompt: {
      role: 'customer friction specialist',
      task: 'Identify and analyze friction points in the touchpoint',
      context: args,
      instructions: [
        'Identify usability friction',
        'Identify technical friction',
        'Identify process friction',
        'Identify information friction',
        'Assess friction severity',
        'Estimate friction impact',
        'Identify friction causes',
        'Map friction to metrics',
        'Generate friction analysis report'
      ],
      outputFormat: 'JSON with frictionPoints, usability, technical, process, information, severity, impact, causes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['frictionPoints', 'severity', 'impact', 'artifacts'],
      properties: {
        frictionPoints: { type: 'array', items: { type: 'object' } },
        usability: { type: 'array', items: { type: 'object' } },
        technical: { type: 'array', items: { type: 'object' } },
        process: { type: 'array', items: { type: 'object' } },
        information: { type: 'array', items: { type: 'object' } },
        severity: { type: 'object' },
        impact: { type: 'object' },
        causes: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'friction']
}));

export const opportunityMappingTask = defineTask('opportunity-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map optimization opportunities',
  agent: {
    name: 'opportunity-mapper',
    prompt: {
      role: 'optimization opportunity specialist',
      task: 'Map and prioritize optimization opportunities',
      context: args,
      instructions: [
        'Identify quick win opportunities',
        'Identify strategic opportunities',
        'Estimate improvement potential',
        'Assess implementation effort',
        'Calculate ROI for each opportunity',
        'Prioritize by impact-effort',
        'Identify dependencies',
        'Group related opportunities',
        'Generate opportunity map'
      ],
      outputFormat: 'JSON with opportunities, quickWins, strategic, potential, effort, roi, priorities, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'priorities', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        strategic: { type: 'array', items: { type: 'object' } },
        potential: { type: 'object' },
        effort: { type: 'object' },
        roi: { type: 'object' },
        priorities: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'opportunities']
}));

export const solutionDesignTask = defineTask('solution-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design optimization solutions',
  agent: {
    name: 'solution-designer',
    prompt: {
      role: 'solution design specialist',
      task: 'Design specific solutions for touchpoint optimization',
      context: args,
      instructions: [
        'Design solutions for each opportunity',
        'Define solution requirements',
        'Specify implementation approach',
        'Estimate expected improvement',
        'Define success criteria',
        'Identify risks and mitigations',
        'Plan A/B testing approach',
        'Create solution specifications',
        'Generate solution design documentation'
      ],
      outputFormat: 'JSON with solutions, requirements, approach, expectedImprovement, successCriteria, risks, testing, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'expectedImprovement', 'artifacts'],
      properties: {
        solutions: { type: 'array', items: { type: 'object' } },
        requirements: { type: 'object' },
        approach: { type: 'object' },
        expectedImprovement: { type: 'number' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } },
        testing: { type: 'object' },
        prioritization: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'solutions']
}));

export const implementationPlanningTask = defineTask('implementation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'implementation planning specialist',
      task: 'Create detailed implementation plan for optimization solutions',
      context: args,
      instructions: [
        'Define implementation phases',
        'Create detailed timeline',
        'Identify required resources',
        'Define roles and responsibilities',
        'Plan testing and validation',
        'Create rollback procedures',
        'Define communication plan',
        'Identify risks and mitigations',
        'Generate implementation plan'
      ],
      outputFormat: 'JSON with phases, timeline, resources, roles, testing, rollback, communication, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'resources', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        roles: { type: 'array', items: { type: 'object' } },
        testing: { type: 'object' },
        rollback: { type: 'object' },
        communication: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'implementation']
}));

export const successMetricsTask = defineTask('success-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics',
  agent: {
    name: 'metrics-designer',
    prompt: {
      role: 'success metrics specialist',
      task: 'Define success metrics and measurement approach',
      context: args,
      instructions: [
        'Define primary success metrics',
        'Define secondary metrics',
        'Set improvement targets',
        'Define measurement methodology',
        'Establish baseline measurements',
        'Plan measurement frequency',
        'Design monitoring dashboard',
        'Define success criteria',
        'Generate success metrics documentation'
      ],
      outputFormat: 'JSON with metrics, primary, secondary, targets, methodology, baselines, frequency, dashboard, criteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'targets', 'criteria', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        primary: { type: 'array', items: { type: 'object' } },
        secondary: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        methodology: { type: 'object' },
        baselines: { type: 'object' },
        frequency: { type: 'string' },
        dashboard: { type: 'object' },
        criteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'touchpoint-optimization', 'metrics']
}));
