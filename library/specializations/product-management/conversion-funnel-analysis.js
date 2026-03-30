/**
 * @process product-management/conversion-funnel-analysis
 * @description Conversion Funnel Analysis - Comprehensive process for analyzing user conversion funnels,
 * identifying drop-off points, uncovering friction, designing A/B tests, and generating data-driven
 * optimization recommendations to improve conversion rates across critical user journeys
 * @inputs { productName: string, funnelName: string, funnelSteps?: array, segment?: string, timeframe?: string, targetMetrics?: object }
 * @outputs { success: boolean, funnelAnalysis: object, dropOffPoints: array, frictionAreas: array, testRecommendations: array, optimizationPlan: object }
 *
 * @example
 * const result = await orchestrate('product-management/conversion-funnel-analysis', {
 *   productName: 'E-commerce Platform',
 *   funnelName: 'Checkout Flow',
 *   funnelSteps: ['Cart', 'Shipping Info', 'Payment', 'Confirmation'],
 *   segment: 'New Users',
 *   timeframe: 'Last 30 Days',
 *   targetMetrics: { conversionRate: 0.35, averageTimeToConvert: 180 }
 * });
 *
 * @references
 * - Funnel Analysis Best Practices: https://www.amplitude.com/blog/funnel-analysis
 * - Conversion Rate Optimization: https://www.optimizely.com/optimization-glossary/conversion-rate-optimization/
 * - Google Analytics Funnel Visualization: https://support.google.com/analytics/answer/6180923
 * - Mixpanel Funnels: https://mixpanel.com/blog/funnel-analysis/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    funnelName,
    funnelSteps = [],
    segment = 'All Users',
    timeframe = 'Last 30 Days',
    targetMetrics = {},
    conversionGoal = null,
    analyticsDataSource = null,
    includeABTestDesign = true,
    minimumSampleSize = 1000,
    outputDir = 'conversion-funnel-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Conversion Funnel Analysis for ${funnelName} in ${productName}`);

  // ============================================================================
  // PHASE 1: FUNNEL DEFINITION AND SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining funnel structure and analysis parameters');
  const funnelDefinition = await ctx.task(funnelDefinitionTask, {
    productName,
    funnelName,
    initialSteps: funnelSteps,
    segment,
    timeframe,
    conversionGoal,
    outputDir
  });

  artifacts.push(...funnelDefinition.artifacts);

  // Quality Gate: Must have at least 2 steps for a valid funnel
  if (funnelDefinition.steps.length < 2) {
    return {
      success: false,
      error: `Insufficient funnel steps. Found: ${funnelDefinition.steps.length}, minimum: 2`,
      phase: 'funnel-definition',
      recommendation: 'Define at least 2 steps for funnel analysis (e.g., start and goal)'
    };
  }

  // ============================================================================
  // PHASE 2: DATA COLLECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Collecting and validating funnel data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    productName,
    funnelName,
    funnelDefinition,
    segment,
    timeframe,
    analyticsDataSource,
    minimumSampleSize,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Quality Gate: Ensure sufficient sample size
  if (dataCollection.totalUsers < minimumSampleSize) {
    await ctx.breakpoint({
      question: `Sample size (${dataCollection.totalUsers}) is below minimum (${minimumSampleSize}). This may affect analysis reliability. Continue with analysis or adjust parameters?`,
      title: 'Low Sample Size Warning',
      context: {
        runId: ctx.runId,
        productName,
        funnelName,
        actualSampleSize: dataCollection.totalUsers,
        minimumRequired: minimumSampleSize,
        recommendation: 'Consider expanding timeframe or broadening segment'
      }
    });
  }

  // ============================================================================
  // PHASE 3: BASELINE CONVERSION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing baseline conversion metrics');
  const baselineAnalysis = await ctx.task(baselineAnalysisTask, {
    productName,
    funnelName,
    funnelDefinition,
    dataCollection,
    targetMetrics,
    segment,
    outputDir
  });

  artifacts.push(...baselineAnalysis.artifacts);

  // Breakpoint: Review baseline metrics
  await ctx.breakpoint({
    question: `Baseline analysis complete for ${funnelName}. Overall conversion rate: ${(baselineAnalysis.overallConversionRate * 100).toFixed(2)}%. Target: ${targetMetrics.conversionRate ? (targetMetrics.conversionRate * 100).toFixed(2) + '%' : 'Not specified'}. Review baseline?`,
    title: 'Baseline Metrics Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        funnelName,
        overallConversion: baselineAnalysis.overallConversionRate,
        totalUsers: dataCollection.totalUsers,
        completedUsers: baselineAnalysis.completedUsers,
        meetsTarget: baselineAnalysis.meetsTarget
      }
    }
  });

  // ============================================================================
  // PHASE 4: STEP-BY-STEP DROP-OFF ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing drop-off at each funnel step');
  const dropOffAnalysis = await ctx.task(dropOffAnalysisTask, {
    productName,
    funnelName,
    funnelDefinition,
    dataCollection,
    baselineAnalysis,
    outputDir
  });

  artifacts.push(...dropOffAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: SEGMENT COMPARISON ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Comparing conversion across user segments');
  const segmentComparison = await ctx.task(segmentComparisonTask, {
    productName,
    funnelName,
    funnelDefinition,
    dataCollection,
    baselineAnalysis,
    dropOffAnalysis,
    outputDir
  });

  artifacts.push(...segmentComparison.artifacts);

  // ============================================================================
  // PHASE 6: TIME-BASED ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing time patterns and conversion duration');
  const timeAnalysis = await ctx.task(timeAnalysisTask, {
    productName,
    funnelName,
    funnelDefinition,
    dataCollection,
    baselineAnalysis,
    targetMetrics,
    outputDir
  });

  artifacts.push(...timeAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: FRICTION POINT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying friction points and user pain areas');
  const frictionIdentification = await ctx.task(frictionIdentificationTask, {
    productName,
    funnelName,
    funnelDefinition,
    dropOffAnalysis,
    segmentComparison,
    timeAnalysis,
    outputDir
  });

  artifacts.push(...frictionIdentification.artifacts);

  // Breakpoint: Review friction points
  await ctx.breakpoint({
    question: `Friction analysis complete. Found ${frictionIdentification.frictionPoints.length} friction areas. Highest impact: ${frictionIdentification.topFrictionPoint.step} (${(frictionIdentification.topFrictionPoint.dropOffRate * 100).toFixed(1)}% drop-off). Review friction points?`,
    title: 'Friction Points Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        funnelName,
        totalFrictionPoints: frictionIdentification.frictionPoints.length,
        topFrictionPoint: frictionIdentification.topFrictionPoint.step,
        topDropOffRate: frictionIdentification.topFrictionPoint.dropOffRate
      }
    }
  });

  // ============================================================================
  // PHASE 8: USER BEHAVIOR ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing user behavior patterns within funnel');
  const behaviorAnalysis = await ctx.task(behaviorAnalysisTask, {
    productName,
    funnelName,
    funnelDefinition,
    dataCollection,
    dropOffAnalysis,
    frictionIdentification,
    outputDir
  });

  artifacts.push(...behaviorAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: DEVICE AND PLATFORM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing conversion by device and platform');
  const platformAnalysis = await ctx.task(platformAnalysisTask, {
    productName,
    funnelName,
    funnelDefinition,
    dataCollection,
    baselineAnalysis,
    outputDir
  });

  artifacts.push(...platformAnalysis.artifacts);

  // ============================================================================
  // PHASE 10: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 10: Conducting root cause analysis for drop-offs');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    productName,
    funnelName,
    dropOffAnalysis,
    frictionIdentification,
    behaviorAnalysis,
    platformAnalysis,
    segmentComparison,
    timeAnalysis,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 11: HYPOTHESIS GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating optimization hypotheses');
  const hypothesisGeneration = await ctx.task(hypothesisGenerationTask, {
    productName,
    funnelName,
    funnelDefinition,
    rootCauseAnalysis,
    frictionIdentification,
    baselineAnalysis,
    targetMetrics,
    outputDir
  });

  artifacts.push(...hypothesisGeneration.artifacts);

  // ============================================================================
  // PHASE 12: A/B TEST DESIGN (if enabled)
  // ============================================================================

  let abTestDesign = null;
  if (includeABTestDesign && hypothesisGeneration.hypotheses.length > 0) {
    ctx.log('info', 'Phase 12: Designing A/B tests for top hypotheses');
    abTestDesign = await ctx.task(abTestDesignTask, {
      productName,
      funnelName,
      funnelDefinition,
      hypothesisGeneration,
      baselineAnalysis,
      dataCollection,
      outputDir
    });

    artifacts.push(...abTestDesign.artifacts);
  } else {
    ctx.log('info', 'Phase 12: Skipping A/B test design (disabled or no hypotheses)');
  }

  // ============================================================================
  // PHASE 13: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating prioritized optimization recommendations');
  const optimizationRecommendations = await ctx.task(optimizationRecommendationsTask, {
    productName,
    funnelName,
    funnelDefinition,
    baselineAnalysis,
    rootCauseAnalysis,
    hypothesisGeneration,
    abTestDesign,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // Breakpoint: Review optimization plan
  await ctx.breakpoint({
    question: `Optimization recommendations ready. ${optimizationRecommendations.recommendations.length} recommendations prioritized. Estimated potential improvement: ${(optimizationRecommendations.estimatedImpact.conversionLift * 100).toFixed(1)}%. Review optimization plan?`,
    title: 'Optimization Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        funnelName,
        totalRecommendations: optimizationRecommendations.recommendations.length,
        highPriorityCount: optimizationRecommendations.highPriorityCount,
        estimatedConversionLift: optimizationRecommendations.estimatedImpact.conversionLift
      }
    }
  });

  // ============================================================================
  // PHASE 14: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating implementation roadmap for optimizations');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    productName,
    funnelName,
    optimizationRecommendations,
    abTestDesign,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 15: SUCCESS METRICS AND MONITORING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 15: Defining success metrics and monitoring plan');
  const monitoringPlan = await ctx.task(monitoringPlanTask, {
    productName,
    funnelName,
    funnelDefinition,
    baselineAnalysis,
    optimizationRecommendations,
    targetMetrics,
    outputDir
  });

  artifacts.push(...monitoringPlan.artifacts);

  // ============================================================================
  // PHASE 16: EXECUTIVE SUMMARY AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 16: Creating executive summary and stakeholder reports');
  const executiveReporting = await ctx.task(executiveReportingTask, {
    productName,
    funnelName,
    segment,
    timeframe,
    baselineAnalysis,
    dropOffAnalysis,
    frictionIdentification,
    optimizationRecommendations,
    implementationRoadmap,
    monitoringPlan,
    outputDir
  });

  artifacts.push(...executiveReporting.artifacts);

  // ============================================================================
  // PHASE 17: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Validating analysis quality and completeness');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    productName,
    funnelName,
    funnelDefinition,
    dataCollection,
    baselineAnalysis,
    dropOffAnalysis,
    frictionIdentification,
    rootCauseAnalysis,
    optimizationRecommendations,
    minimumSampleSize,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const analysisScore = qualityValidation.overallScore;
  const qualityMet = analysisScore >= 80;

  // Final Breakpoint: Approve analysis and recommendations
  await ctx.breakpoint({
    question: `Conversion Funnel Analysis complete for ${funnelName}. Quality score: ${analysisScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Current conversion: ${(baselineAnalysis.overallConversionRate * 100).toFixed(2)}%. Potential improvement: ${(optimizationRecommendations.estimatedImpact.conversionLift * 100).toFixed(1)}%. Approve and proceed with optimizations?`,
    title: 'Final Analysis Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        funnelName,
        analysisScore,
        qualityMet,
        currentConversion: baselineAnalysis.overallConversionRate,
        estimatedImprovement: optimizationRecommendations.estimatedImpact.conversionLift,
        totalRecommendations: optimizationRecommendations.recommendations.length,
        implementationPhases: implementationRoadmap.phases.length,
        duration: ctx.now() - startTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    funnelName,
    segment,
    timeframe,
    analysisScore,
    qualityMet,
    funnelAnalysis: {
      steps: funnelDefinition.steps,
      totalUsers: dataCollection.totalUsers,
      overallConversionRate: baselineAnalysis.overallConversionRate,
      completedUsers: baselineAnalysis.completedUsers,
      averageTimeToConvert: timeAnalysis.averageTimeToConvert,
      meetsTarget: baselineAnalysis.meetsTarget
    },
    dropOffPoints: {
      stepAnalysis: dropOffAnalysis.stepAnalysis.map(step => ({
        step: step.stepName,
        usersEntered: step.usersEntered,
        usersCompleted: step.usersCompleted,
        dropOffCount: step.dropOffCount,
        dropOffRate: step.dropOffRate,
        conversionRate: step.conversionRate,
        severity: step.severity
      })),
      highestDropOff: dropOffAnalysis.highestDropOff,
      totalDropOffs: dropOffAnalysis.totalDropOffs
    },
    frictionAreas: {
      frictionPoints: frictionIdentification.frictionPoints.map(fp => ({
        step: fp.step,
        frictionType: fp.frictionType,
        severity: fp.severity,
        impactScore: fp.impactScore,
        description: fp.description
      })),
      topFrictionPoint: frictionIdentification.topFrictionPoint,
      totalFrictionPoints: frictionIdentification.frictionPoints.length
    },
    segmentInsights: {
      topPerformingSegment: segmentComparison.topPerformingSegment,
      lowestPerformingSegment: segmentComparison.lowestPerformingSegment,
      significantDifferences: segmentComparison.significantDifferences
    },
    platformInsights: {
      bestPerformingPlatform: platformAnalysis.bestPerformingPlatform,
      worstPerformingPlatform: platformAnalysis.worstPerformingPlatform,
      conversionByPlatform: platformAnalysis.conversionByPlatform
    },
    rootCauses: {
      primaryCauses: rootCauseAnalysis.primaryCauses,
      contributingFactors: rootCauseAnalysis.contributingFactors,
      dataQualityIssues: rootCauseAnalysis.dataQualityIssues
    },
    hypotheses: {
      totalHypotheses: hypothesisGeneration.hypotheses.length,
      prioritizedHypotheses: hypothesisGeneration.hypotheses.slice(0, 5).map(h => ({
        hypothesis: h.hypothesis,
        expectedImpact: h.expectedImpact,
        confidence: h.confidence,
        effort: h.effort
      }))
    },
    testRecommendations: abTestDesign ? {
      totalTests: abTestDesign.tests.length,
      prioritizedTests: abTestDesign.tests.slice(0, 3).map(test => ({
        testName: test.testName,
        hypothesis: test.hypothesis,
        variants: test.variants,
        primaryMetric: test.primaryMetric,
        sampleSizeRequired: test.sampleSizeRequired,
        estimatedDuration: test.estimatedDuration
      })),
      sequencingStrategy: abTestDesign.sequencingStrategy
    } : null,
    optimizationPlan: {
      totalRecommendations: optimizationRecommendations.recommendations.length,
      highPriority: optimizationRecommendations.recommendations.filter(r => r.priority === 'high').length,
      mediumPriority: optimizationRecommendations.recommendations.filter(r => r.priority === 'medium').length,
      lowPriority: optimizationRecommendations.recommendations.filter(r => r.priority === 'low').length,
      estimatedImpact: {
        conversionLift: optimizationRecommendations.estimatedImpact.conversionLift,
        additionalConversions: optimizationRecommendations.estimatedImpact.additionalConversions,
        revenueImpact: optimizationRecommendations.estimatedImpact.revenueImpact
      },
      quickWins: optimizationRecommendations.quickWins
    },
    implementationRoadmap: {
      phases: implementationRoadmap.phases,
      estimatedDuration: implementationRoadmap.estimatedDuration,
      resourceRequirements: implementationRoadmap.resourceRequirements
    },
    monitoringPlan: {
      keyMetrics: monitoringPlan.keyMetrics,
      alertThresholds: monitoringPlan.alertThresholds,
      reportingCadence: monitoringPlan.reportingCadence,
      dashboardUrl: monitoringPlan.dashboardUrl
    },
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/conversion-funnel-analysis',
      timestamp: startTime,
      productName,
      funnelName,
      segment,
      timeframe,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Funnel Definition
export const funnelDefinitionTask = defineTask('funnel-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define funnel structure and analysis parameters',
  agent: {
    name: 'conversion-analyst',
    prompt: {
      role: 'conversion rate optimization analyst with expertise in funnel analysis and user journey mapping',
      task: 'Define comprehensive funnel structure, steps, events, and analysis parameters',
      context: args,
      instructions: [
        'Review initial funnel steps provided',
        'Validate that funnel represents a complete user journey with clear start and end',
        'Define each step with: step name, description, key events/actions, success criteria',
        'Identify entry point (first step) and conversion goal (final step)',
        'Map intermediate steps that users must complete',
        'Define step transition criteria (what qualifies as moving to next step)',
        'Identify optional vs required steps',
        'Document expected user actions at each step',
        'Define time window for funnel completion (e.g., 24 hours, 7 days)',
        'Specify segment criteria and filters',
        'Create funnel visualization diagram',
        'Generate comprehensive funnel definition document'
      ],
      outputFormat: 'JSON with steps (array), entryPoint, conversionGoal, timeWindow, segmentCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'entryPoint', 'conversionGoal', 'artifacts'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              stepName: { type: 'string' },
              description: { type: 'string' },
              keyEvents: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'string' },
              isOptional: { type: 'boolean' },
              expectedUserActions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        entryPoint: { type: 'string' },
        conversionGoal: { type: 'string' },
        timeWindow: { type: 'string' },
        segmentCriteria: {
          type: 'object',
          properties: {
            segmentName: { type: 'string' },
            filters: { type: 'array', items: { type: 'string' } }
          }
        },
        funnelType: { type: 'string', enum: ['linear', 'multi-path', 'looping'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'funnel-definition']
}));

// Task 2: Data Collection
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and validate funnel data',
  agent: {
    name: 'data-engineer',
    prompt: {
      role: 'analytics data engineer specializing in event data extraction and validation',
      task: 'Collect, validate, and prepare funnel data from analytics systems',
      context: args,
      instructions: [
        'Connect to analytics data source (Amplitude, Mixpanel, Google Analytics, custom database)',
        'Query user event data for defined funnel steps within timeframe',
        'Apply segment filters to focus on target user cohort',
        'Extract user-level data: user_id, timestamp per step, completion status',
        'Calculate total users who entered funnel (step 1)',
        'Calculate users who reached each subsequent step',
        'Calculate users who completed entire funnel',
        'Validate data quality: check for missing events, duplicate records, timestamp issues',
        'Calculate sample size and statistical power',
        'Aggregate data by: step, segment, device, platform, time period',
        'Flag data quality issues (low sample size, missing data, anomalies)',
        'Generate data collection report with sample characteristics'
      ],
      outputFormat: 'JSON with totalUsers, stepData, dataQuality, sampleCharacteristics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalUsers', 'stepData', 'dataQuality', 'artifacts'],
      properties: {
        totalUsers: { type: 'number' },
        stepData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepName: { type: 'string' },
              usersReached: { type: 'number' },
              eventCount: { type: 'number' },
              uniqueUsers: { type: 'number' }
            }
          }
        },
        completedUsers: { type: 'number' },
        dataQuality: {
          type: 'object',
          properties: {
            completenessScore: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } },
            dataSource: { type: 'string' },
            collectionDate: { type: 'string' }
          }
        },
        sampleCharacteristics: {
          type: 'object',
          properties: {
            sampleSize: { type: 'number' },
            statisticalPower: { type: 'number' },
            dateRange: { type: 'string' },
            segments: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'data-collection']
}));

// Task 3: Baseline Analysis
export const baselineAnalysisTask = defineTask('baseline-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze baseline conversion metrics',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'product metrics analyst specializing in conversion rate analysis',
      task: 'Calculate and analyze baseline conversion metrics for the funnel',
      context: args,
      instructions: [
        'Calculate overall conversion rate: (completed users / total users who entered) × 100',
        'Calculate step-to-step conversion rates',
        'Compare current conversion rate to target (if specified)',
        'Calculate conversion rate by cohort (day, week)',
        'Identify conversion rate trends over time',
        'Calculate key statistics: median, percentiles, variance',
        'Benchmark against industry standards (if available)',
        'Calculate conversion velocity metrics (time to convert)',
        'Identify best and worst performing time periods',
        'Flag if target is met or gap exists',
        'Generate baseline metrics summary',
        'Create conversion rate visualization data'
      ],
      outputFormat: 'JSON with overallConversionRate, completedUsers, meetsTarget, trendData, benchmarks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallConversionRate', 'completedUsers', 'artifacts'],
      properties: {
        overallConversionRate: { type: 'number', minimum: 0, maximum: 1 },
        completedUsers: { type: 'number' },
        droppedUsers: { type: 'number' },
        meetsTarget: { type: 'boolean' },
        targetGap: { type: 'number' },
        conversionRateByPeriod: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              conversionRate: { type: 'number' }
            }
          }
        },
        trendDirection: { type: 'string', enum: ['improving', 'declining', 'stable'] },
        benchmarks: {
          type: 'object',
          properties: {
            industryAverage: { type: 'number' },
            topPerformers: { type: 'number' },
            source: { type: 'string' }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            median: { type: 'number' },
            p25: { type: 'number' },
            p75: { type: 'number' },
            p90: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'baseline-analysis']
}));

// Task 4: Drop-Off Analysis
export const dropOffAnalysisTask = defineTask('drop-off-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze drop-off at each funnel step',
  agent: {
    name: 'drop-off-analyst',
    prompt: {
      role: 'conversion analyst specializing in user drop-off identification and analysis',
      task: 'Conduct detailed drop-off analysis for each step in the funnel',
      context: args,
      instructions: [
        'For each funnel step, calculate: users entered, users who completed, drop-off count, drop-off rate',
        'Calculate step-to-step conversion rate',
        'Identify steps with highest drop-off (absolute and percentage)',
        'Compare drop-off rates across all steps',
        'Calculate cumulative drop-off from funnel start',
        'Identify abnormal drop-off patterns (sudden spikes, unusual rates)',
        'Classify drop-off severity: critical (>50%), high (30-50%), medium (15-30%), low (<15%)',
        'Calculate the total conversion leak (all drop-offs)',
        'Identify which steps contribute most to overall conversion loss',
        'Create drop-off waterfall visualization data',
        'Generate step-by-step drop-off analysis report'
      ],
      outputFormat: 'JSON with stepAnalysis (array), highestDropOff, totalDropOffs, criticalSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stepAnalysis', 'highestDropOff', 'artifacts'],
      properties: {
        stepAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              stepName: { type: 'string' },
              usersEntered: { type: 'number' },
              usersCompleted: { type: 'number' },
              dropOffCount: { type: 'number' },
              dropOffRate: { type: 'number' },
              conversionRate: { type: 'number' },
              cumulativeConversion: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              contributionToTotalLoss: { type: 'number' }
            }
          }
        },
        highestDropOff: {
          type: 'object',
          properties: {
            stepName: { type: 'string' },
            dropOffRate: { type: 'number' },
            usersLost: { type: 'number' }
          }
        },
        totalDropOffs: { type: 'number' },
        criticalSteps: { type: 'array', items: { type: 'string' } },
        dropOffDistribution: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'drop-off-analysis']
}));

// Task 5: Segment Comparison
export const segmentComparisonTask = defineTask('segment-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare conversion across user segments',
  agent: {
    name: 'segmentation-analyst',
    prompt: {
      role: 'user segmentation analyst with expertise in comparative analysis',
      task: 'Compare conversion performance across different user segments and cohorts',
      context: args,
      instructions: [
        'Identify key user segments: new vs returning, device type, traffic source, geography, plan tier',
        'Calculate conversion rate for each segment',
        'Compare segment performance: identify best and worst performing segments',
        'Calculate conversion rate difference between segments',
        'Test statistical significance of differences',
        'Identify segments with disproportionate drop-off at specific steps',
        'Find segments where funnel behaves differently',
        'Look for segment-specific friction points',
        'Identify opportunities to optimize for specific segments',
        'Flag segments that require targeted interventions',
        'Generate segment comparison report with actionable insights'
      ],
      outputFormat: 'JSON with segmentAnalysis (array), topPerformingSegment, lowestPerformingSegment, significantDifferences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segmentAnalysis', 'artifacts'],
      properties: {
        segmentAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              users: { type: 'number' },
              conversionRate: { type: 'number' },
              performanceTier: { type: 'string', enum: ['top', 'above-average', 'average', 'below-average', 'bottom'] },
              dropOffPattern: { type: 'string' },
              keyInsight: { type: 'string' }
            }
          }
        },
        topPerformingSegment: {
          type: 'object',
          properties: {
            segmentName: { type: 'string' },
            conversionRate: { type: 'number' },
            successFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        lowestPerformingSegment: {
          type: 'object',
          properties: {
            segmentName: { type: 'string' },
            conversionRate: { type: 'number' },
            challenges: { type: 'array', items: { type: 'string' } }
          }
        },
        significantDifferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment1: { type: 'string' },
              segment2: { type: 'string' },
              conversionRateDiff: { type: 'number' },
              statistically_significant: { type: 'boolean' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'segment-comparison']
}));

// Task 6: Time Analysis
export const timeAnalysisTask = defineTask('time-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze time patterns and conversion duration',
  agent: {
    name: 'temporal-analyst',
    prompt: {
      role: 'analytics specialist focusing on temporal patterns and time-based user behavior',
      task: 'Analyze time-based patterns in funnel conversion',
      context: args,
      instructions: [
        'Calculate time between each funnel step (step-to-step duration)',
        'Calculate total time to convert (first step to completion)',
        'Identify average, median, p90 time to convert',
        'Compare to target time (if specified)',
        'Identify users who convert quickly vs slowly',
        'Find steps where users spend excessive time (potential friction)',
        'Analyze conversion by time of day, day of week',
        'Identify time-based drop-off patterns (users who abandon after X minutes)',
        'Calculate optimal time windows for each step',
        'Find correlation between time spent and conversion success',
        'Identify "dead zones" where users get stuck',
        'Generate time-based analysis report with optimization opportunities'
      ],
      outputFormat: 'JSON with averageTimeToConvert, stepDurations, temporalPatterns, timeBasedInsights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['averageTimeToConvert', 'stepDurations', 'artifacts'],
      properties: {
        averageTimeToConvert: { type: 'number', description: 'in seconds' },
        medianTimeToConvert: { type: 'number' },
        p90TimeToConvert: { type: 'number' },
        meetsTargetTime: { type: 'boolean' },
        stepDurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepName: { type: 'string' },
              avgDuration: { type: 'number' },
              medianDuration: { type: 'number' },
              excessiveTimeFlag: { type: 'boolean' }
            }
          }
        },
        temporalPatterns: {
          type: 'object',
          properties: {
            bestTimeOfDay: { type: 'string' },
            worstTimeOfDay: { type: 'string' },
            bestDayOfWeek: { type: 'string' },
            conversionByHour: { type: 'array' }
          }
        },
        timeBasedInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        deadZones: {
          type: 'array',
          description: 'Steps where users get stuck for extended periods',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              avgStuckTime: { type: 'number' },
              affectedUsers: { type: 'number' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'time-analysis']
}));

// Task 7: Friction Identification
export const frictionIdentificationTask = defineTask('friction-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify friction points and pain areas',
  agent: {
    name: 'ux-researcher',
    prompt: {
      role: 'UX researcher and friction analysis expert',
      task: 'Identify and categorize friction points causing user drop-off and poor conversion',
      context: args,
      instructions: [
        'Review drop-off analysis, segment data, and time analysis to identify friction',
        'Categorize friction types: usability issues, technical problems, trust/security concerns, complexity, value perception, performance issues',
        'For each friction point, document: step affected, friction type, severity, user impact, evidence',
        'Prioritize friction by: impact on conversion, number of users affected, ease of fix',
        'Identify quick wins: high-impact, low-effort friction fixes',
        'Map friction to specific user experience issues',
        'Correlate friction with segment-specific challenges',
        'Identify friction compounding (multiple issues at same step)',
        'Recommend user research methods to validate friction (usability testing, session replay, user interviews)',
        'Generate comprehensive friction identification report',
        'Create friction heatmap showing intensity by step'
      ],
      outputFormat: 'JSON with frictionPoints (array), topFrictionPoint, quickWinFriction, researchRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['frictionPoints', 'topFrictionPoint', 'artifacts'],
      properties: {
        frictionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frictionId: { type: 'string' },
              step: { type: 'string' },
              frictionType: { type: 'string', enum: ['usability', 'technical', 'trust', 'complexity', 'value', 'performance', 'other'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impactScore: { type: 'number' },
              usersAffected: { type: 'number' },
              evidence: { type: 'array', items: { type: 'string' } },
              effortToFix: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        topFrictionPoint: {
          type: 'object',
          properties: {
            step: { type: 'string' },
            description: { type: 'string' },
            dropOffRate: { type: 'number' },
            impactScore: { type: 'number' }
          }
        },
        quickWinFriction: {
          type: 'array',
          description: 'High-impact, low-effort friction points',
          items: {
            type: 'object',
            properties: {
              frictionId: { type: 'string' },
              description: { type: 'string' },
              expectedImprovement: { type: 'number' }
            }
          }
        },
        frictionByType: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        researchRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              purpose: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'friction-identification']
}));

// Task 8: Behavior Analysis
export const behaviorAnalysisTask = defineTask('behavior-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze user behavior patterns',
  agent: {
    name: 'behavioral-analyst',
    prompt: {
      role: 'behavioral data analyst specializing in user journey and interaction patterns',
      task: 'Analyze user behavior patterns within the funnel to understand conversion drivers and barriers',
      context: args,
      instructions: [
        'Identify common behavior patterns: linear progression, back-and-forth, looping, abandonment',
        'Analyze converters vs non-converters: behavior differences',
        'Identify user actions correlated with successful conversion',
        'Find anti-patterns (behaviors associated with drop-off)',
        'Analyze engagement signals: clicks, time on page, scroll depth, interactions',
        'Identify users who exit and return to funnel',
        'Map common paths through funnel (path analysis)',
        'Find unexpected user journeys (entering funnel mid-way)',
        'Identify power users vs struggling users',
        'Analyze error rates and retry behavior',
        'Generate behavioral insights report with recommendations'
      ],
      outputFormat: 'JSON with behaviorPatterns, converterBehaviors, dropOffBehaviors, pathAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['behaviorPatterns', 'converterBehaviors', 'artifacts'],
      properties: {
        behaviorPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              patternName: { type: 'string' },
              frequency: { type: 'number' },
              associatedWithConversion: { type: 'boolean' },
              description: { type: 'string' }
            }
          }
        },
        converterBehaviors: {
          type: 'array',
          description: 'Behaviors associated with successful conversion',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              prevalence: { type: 'number' },
              correlation: { type: 'number' }
            }
          }
        },
        dropOffBehaviors: {
          type: 'array',
          description: 'Behaviors associated with abandonment',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              prevalence: { type: 'number' },
              correlation: { type: 'number' }
            }
          }
        },
        pathAnalysis: {
          type: 'object',
          properties: {
            linearPath: { type: 'number', description: 'Percentage following linear path' },
            loopingBehavior: { type: 'number' },
            midFunnelEntry: { type: 'number' },
            returnVisitors: { type: 'number' }
          }
        },
        engagementSignals: {
          type: 'object',
          properties: {
            highEngagement: { type: 'array', items: { type: 'string' } },
            lowEngagement: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'behavior-analysis']
}));

// Task 9: Platform Analysis
export const platformAnalysisTask = defineTask('platform-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze conversion by device and platform',
  agent: {
    name: 'platform-analyst',
    prompt: {
      role: 'cross-platform analytics specialist',
      task: 'Analyze conversion performance across devices, platforms, and browsers',
      context: args,
      instructions: [
        'Segment users by device type: desktop, mobile, tablet',
        'Segment by operating system: iOS, Android, Windows, macOS',
        'Segment by browser: Chrome, Safari, Firefox, Edge',
        'Calculate conversion rate for each platform',
        'Identify best and worst performing platforms',
        'Analyze drop-off patterns by platform (do certain steps fail on mobile?)',
        'Identify platform-specific friction points',
        'Compare time to convert across platforms',
        'Test if differences are statistically significant',
        'Identify technical issues specific to platforms (rendering, compatibility)',
        'Recommend platform-specific optimizations',
        'Generate platform analysis report with cross-device insights'
      ],
      outputFormat: 'JSON with conversionByPlatform, bestPerformingPlatform, worstPerformingPlatform, platformSpecificIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conversionByPlatform', 'artifacts'],
      properties: {
        conversionByPlatform: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              deviceType: { type: 'string' },
              users: { type: 'number' },
              conversionRate: { type: 'number' },
              relativePerformance: { type: 'string', enum: ['above-average', 'average', 'below-average'] }
            }
          }
        },
        bestPerformingPlatform: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            conversionRate: { type: 'number' }
          }
        },
        worstPerformingPlatform: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            conversionRate: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        platformSpecificIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              step: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        crossPlatformInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'platform-analysis']
}));

// Task 10: Root Cause Analysis
export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct root cause analysis for drop-offs',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'product analyst specializing in root cause analysis and systematic problem diagnosis',
      task: 'Conduct comprehensive root cause analysis to identify why users are dropping off',
      context: args,
      instructions: [
        'Review all analysis inputs: drop-offs, friction, behavior, platform, segment, time data',
        'Use 5 Whys technique to drill into each major drop-off point',
        'Distinguish symptoms from root causes',
        'Categorize root causes: product design, technical issues, user expectations, external factors, business model',
        'Identify primary root causes (most impactful)',
        'Identify contributing factors (secondary causes)',
        'Map root causes to specific steps and user segments',
        'Assess confidence level in each root cause identification',
        'Recommend validation approaches (user research, technical audit)',
        'Identify data gaps that limit root cause certainty',
        'Prioritize root causes by: impact, confidence, fixability',
        'Generate comprehensive root cause analysis report with causal chains'
      ],
      outputFormat: 'JSON with primaryCauses, contributingFactors, causalChains, dataGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryCauses', 'contributingFactors', 'artifacts'],
      properties: {
        primaryCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              causeId: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['product-design', 'technical', 'user-expectation', 'external', 'business-model'] },
              affectedSteps: { type: 'array', items: { type: 'string' } },
              impactScore: { type: 'number' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contributingFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              primaryCauseLinked: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        causalChains: {
          type: 'array',
          description: 'Cause-effect chains showing how issues cascade',
          items: {
            type: 'object',
            properties: {
              chain: { type: 'array', items: { type: 'string' } },
              finalImpact: { type: 'string' }
            }
          }
        },
        dataGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              impact: { type: 'string' },
              recommendedResearch: { type: 'string' }
            }
          }
        },
        dataQualityIssues: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'root-cause-analysis']
}));

// Task 11: Hypothesis Generation
export const hypothesisGenerationTask = defineTask('hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate optimization hypotheses',
  agent: {
    name: 'optimization-strategist',
    prompt: {
      role: 'conversion rate optimization strategist with expertise in hypothesis formulation',
      task: 'Generate testable hypotheses for improving conversion based on root cause analysis',
      context: args,
      instructions: [
        'Review root causes and friction points',
        'For each root cause, generate optimization hypotheses',
        'Use format: "If we [change], then [outcome] because [reasoning]"',
        'Ensure hypotheses are: specific, measurable, testable, actionable',
        'Estimate expected impact: % conversion lift',
        'Assess confidence level: high (>70% likely), medium (40-70%), low (<40%)',
        'Estimate effort: low (days), medium (weeks), high (months)',
        'Prioritize hypotheses using ICE score: (Impact × Confidence) / Effort',
        'Categorize by type: design, copy, flow, technical, pricing, trust',
        'Link each hypothesis to specific funnel step and root cause',
        'Identify prerequisite hypotheses (must test A before B)',
        'Generate comprehensive hypothesis backlog with prioritization'
      ],
      outputFormat: 'JSON with hypotheses (array), topHypotheses, iceScores, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses', 'artifacts'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              hypothesis: { type: 'string' },
              change: { type: 'string' },
              expectedOutcome: { type: 'string' },
              reasoning: { type: 'string' },
              linkedRootCause: { type: 'string' },
              targetStep: { type: 'string' },
              expectedImpact: { type: 'number', description: 'Expected conversion lift' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              iceScore: { type: 'number' },
              type: { type: 'string', enum: ['design', 'copy', 'flow', 'technical', 'pricing', 'trust', 'other'] },
              testable: { type: 'boolean' }
            }
          }
        },
        topHypotheses: {
          type: 'array',
          description: 'Top 5 hypotheses by ICE score',
          items: { type: 'string' }
        },
        hypothesesByType: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'hypothesis-generation']
}));

// Task 12: A/B Test Design
export const abTestDesignTask = defineTask('ab-test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design A/B tests for top hypotheses',
  agent: {
    name: 'experimentation-designer',
    prompt: {
      role: 'experimentation expert specializing in A/B test design and statistical rigor',
      task: 'Design rigorous A/B tests to validate top optimization hypotheses',
      context: args,
      instructions: [
        'Select top 3-5 hypotheses for A/B testing (highest ICE score)',
        'For each hypothesis, design experiment: control, treatment variants',
        'Define primary metric (conversion rate improvement)',
        'Define secondary metrics (time to convert, step completion, revenue)',
        'Define guardrail metrics (ensure no negative side effects)',
        'Calculate required sample size using: baseline conversion, minimum detectable effect (MDE), statistical power (80%), significance level (95%)',
        'Estimate test duration based on traffic',
        'Design experiment variants with clear descriptions',
        'Specify targeting criteria (which users see test)',
        'Plan instrumentation and tracking requirements',
        'Define success criteria and decision framework',
        'Create test sequencing strategy (which tests to run first, in parallel, sequentially)',
        'Generate comprehensive A/B test specifications'
      ],
      outputFormat: 'JSON with tests (array), sequencingStrategy, totalTestingDuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'sequencingStrategy', 'artifacts'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              hypothesis: { type: 'string' },
              targetStep: { type: 'string' },
              variants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    variantName: { type: 'string' },
                    description: { type: 'string' },
                    trafficAllocation: { type: 'number' }
                  }
                }
              },
              primaryMetric: { type: 'string' },
              secondaryMetrics: { type: 'array', items: { type: 'string' } },
              guardrailMetrics: { type: 'array', items: { type: 'string' } },
              sampleSizeRequired: { type: 'number' },
              estimatedDuration: { type: 'string' },
              minimumDetectableEffect: { type: 'number' },
              statisticalPower: { type: 'number' },
              successCriteria: { type: 'string' },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        sequencingStrategy: {
          type: 'object',
          properties: {
            phase1: { type: 'array', items: { type: 'string' } },
            phase2: { type: 'array', items: { type: 'string' } },
            phase3: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          }
        },
        totalTestingDuration: { type: 'string' },
        resourceRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'ab-test-design']
}));

// Task 13: Optimization Recommendations
export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create prioritized optimization recommendations',
  agent: {
    name: 'optimization-director',
    prompt: {
      role: 'conversion optimization director with expertise in prioritization and impact estimation',
      task: 'Create comprehensive, prioritized optimization recommendations with expected impact',
      context: args,
      instructions: [
        'Consolidate insights from all analyses: root causes, hypotheses, A/B tests',
        'Generate specific, actionable recommendations',
        'Categorize recommendations: immediate (no test needed), test-and-learn (A/B test), research-first (validate before acting)',
        'Prioritize by: expected impact, confidence, effort, risk',
        'Identify quick wins (high impact, low effort)',
        'Identify strategic bets (high impact, high effort)',
        'For each recommendation: describe change, expected impact, implementation steps, success metrics, dependencies',
        'Estimate cumulative conversion improvement if all implemented',
        'Calculate potential revenue impact (if revenue data available)',
        'Sequence recommendations: what to do first, second, third',
        'Identify no-regret moves (safe to implement immediately)',
        'Flag high-risk changes requiring extra validation',
        'Generate comprehensive optimization playbook'
      ],
      outputFormat: 'JSON with recommendations (array), estimatedImpact, quickWins, strategicBets, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'estimatedImpact', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              targetStep: { type: 'string' },
              rootCauseAddressed: { type: 'string' },
              category: { type: 'string', enum: ['immediate', 'test-and-learn', 'research-first'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              expectedConversionLift: { type: 'number' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              risk: { type: 'string', enum: ['low', 'medium', 'high'] },
              implementationSteps: { type: 'array', items: { type: 'string' } },
              successMetrics: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              estimatedTimeline: { type: 'string' }
            }
          }
        },
        estimatedImpact: {
          type: 'object',
          properties: {
            conversionLift: { type: 'number', description: 'Expected overall conversion rate improvement' },
            additionalConversions: { type: 'number' },
            revenueImpact: { type: 'number' },
            confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        },
        quickWins: {
          type: 'array',
          description: 'High-impact, low-effort recommendations',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              title: { type: 'string' },
              expectedLift: { type: 'number' }
            }
          }
        },
        strategicBets: {
          type: 'array',
          description: 'High-impact, high-effort recommendations',
          items: { type: 'string' }
        },
        highPriorityCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'optimization-recommendations']
}));

// Task 14: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'roadmap-planner',
    prompt: {
      role: 'product roadmap planner specializing in CRO implementation planning',
      task: 'Create time-phased implementation roadmap for optimization recommendations',
      context: args,
      instructions: [
        'Review all recommendations and A/B test plans',
        'Group recommendations into implementation phases',
        'Phase 1: Quick wins and immediate fixes (0-2 weeks)',
        'Phase 2: A/B tests for high-priority hypotheses (2-8 weeks)',
        'Phase 3: Strategic improvements requiring significant work (2-6 months)',
        'Sequence based on: dependencies, effort, expected impact, risk',
        'Ensure phases don\'t overload team capacity',
        'Plan for: design, development, QA, deployment, monitoring',
        'Identify resource requirements per phase (design, eng, PM, data)',
        'Build in review gates between phases',
        'Plan learning and iteration cycles',
        'Create timeline with milestones',
        'Generate comprehensive implementation roadmap document'
      ],
      outputFormat: 'JSON with phases (array), estimatedDuration, resourceRequirements, milestones, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'estimatedDuration', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseNumber: { type: 'number' },
              phaseName: { type: 'string' },
              duration: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              recommendations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    recommendationId: { type: 'string' },
                    title: { type: 'string' },
                    type: { type: 'string' }
                  }
                }
              },
              expectedCumulativeLift: { type: 'number' },
              milestones: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        resourceRequirements: {
          type: 'object',
          properties: {
            productManagers: { type: 'number' },
            designers: { type: 'number' },
            engineers: { type: 'number' },
            dataAnalysts: { type: 'number' },
            uxResearchers: { type: 'number' }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestoneId: { type: 'string' },
              name: { type: 'string' },
              targetDate: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'implementation-roadmap']
}));

// Task 15: Monitoring Plan
export const monitoringPlanTask = defineTask('monitoring-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics and monitoring plan',
  agent: {
    name: 'analytics-strategist',
    prompt: {
      role: 'analytics strategist specializing in KPI definition and monitoring systems',
      task: 'Define success metrics and ongoing monitoring plan for conversion optimization',
      context: args,
      instructions: [
        'Define key metrics to monitor: overall conversion rate, step-by-step conversion, drop-off rates',
        'Set baseline values from current analysis',
        'Define target values for each metric',
        'Establish alert thresholds: critical (>20% change), warning (10-20% change)',
        'Design monitoring dashboard: real-time metrics, trends, segment breakdowns',
        'Define reporting cadence: daily checks, weekly deep dives, monthly reviews',
        'Plan for A/B test monitoring: test status, results, statistical significance',
        'Set up automated alerts for anomalies and regressions',
        'Define review process: who reviews, how often, decision criteria',
        'Plan for ongoing analysis: weekly funnel health checks',
        'Document instrumentation requirements',
        'Generate comprehensive monitoring playbook'
      ],
      outputFormat: 'JSON with keyMetrics, alertThresholds, reportingCadence, dashboardUrl, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyMetrics', 'alertThresholds', 'reportingCadence', 'artifacts'],
      properties: {
        keyMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              description: { type: 'string' },
              baselineValue: { type: 'number' },
              targetValue: { type: 'number' },
              unit: { type: 'string' }
            }
          }
        },
        alertThresholds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              criticalThreshold: { type: 'number' },
              warningThreshold: { type: 'number' },
              direction: { type: 'string', enum: ['increase', 'decrease', 'both'] }
            }
          }
        },
        reportingCadence: {
          type: 'object',
          properties: {
            daily: { type: 'string' },
            weekly: { type: 'string' },
            monthly: { type: 'string' },
            reviewProcess: { type: 'string' }
          }
        },
        dashboardUrl: { type: 'string' },
        dashboardSpec: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            sections: { type: 'array', items: { type: 'string' } },
            visualizations: { type: 'array', items: { type: 'string' } }
          }
        },
        instrumentationRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              properties: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'monitoring-plan']
}));

// Task 16: Executive Reporting
export const executiveReportingTask = defineTask('executive-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create executive summary and reports',
  agent: {
    name: 'executive-communicator',
    prompt: {
      role: 'product communications specialist with expertise in executive reporting',
      task: 'Create comprehensive executive summary and stakeholder reports',
      context: args,
      instructions: [
        'Create executive summary: current state, key findings, recommendations, expected impact',
        'Highlight critical insights: biggest drop-off points, highest-impact opportunities',
        'Present business case: current conversion, target conversion, revenue impact',
        'Summarize optimization plan: phases, timeline, resources needed',
        'Create data visualizations: funnel chart, drop-off waterfall, improvement forecast',
        'Prepare supporting materials: detailed analysis, test plans, technical specs',
        'Address potential questions and concerns',
        'Create stakeholder-specific views: executive (strategic), product team (tactical), engineering (technical)',
        'Prepare presentation deck for stakeholder review',
        'Generate one-pager summary for broad distribution',
        'Create FAQ document',
        'Generate comprehensive reporting package'
      ],
      outputFormat: 'JSON with executiveSummary, keyFindings, businessCase, stakeholderViews, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'keyFindings', 'businessCase', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              actionRequired: { type: 'string' }
            }
          }
        },
        businessCase: {
          type: 'object',
          properties: {
            currentConversionRate: { type: 'number' },
            targetConversionRate: { type: 'number' },
            expectedLift: { type: 'number' },
            additionalConversions: { type: 'number' },
            revenueImpact: { type: 'number' },
            investmentRequired: { type: 'string' },
            roi: { type: 'string' }
          }
        },
        topRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              expectedImpact: { type: 'number' },
              timeline: { type: 'string' }
            }
          }
        },
        stakeholderViews: {
          type: 'object',
          properties: {
            executiveSummaryPath: { type: 'string' },
            productTeamReportPath: { type: 'string' },
            technicalSpecsPath: { type: 'string' }
          }
        },
        presentationDeckPath: { type: 'string' },
        onePagerPath: { type: 'string' },
        faqPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'executive-reporting']
}));

// Task 17: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate analysis quality and completeness',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'analytics quality assurance specialist',
      task: 'Validate quality, completeness, and rigor of conversion funnel analysis',
      context: args,
      instructions: [
        'Evaluate funnel definition quality: clear steps, appropriate scope (weight: 10%)',
        'Assess data quality: sample size, completeness, validity (weight: 15%)',
        'Validate baseline analysis: accurate calculations, proper benchmarking (weight: 10%)',
        'Review drop-off analysis: comprehensive coverage, severity assessment (weight: 15%)',
        'Check friction identification: thorough, evidence-based, actionable (weight: 10%)',
        'Assess root cause analysis: depth, logic, confidence levels (weight: 15%)',
        'Evaluate hypotheses: testable, prioritized, realistic impact estimates (weight: 10%)',
        'Review recommendations: specific, actionable, properly prioritized (weight: 15%)',
        'Calculate weighted overall quality score (0-100)',
        'Identify quality gaps and areas for improvement',
        'Validate statistical rigor and methodology',
        'Generate quality assessment report'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object), qualityGaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            funnelDefinitionQuality: { type: 'number' },
            dataQuality: { type: 'number' },
            baselineAnalysis: { type: 'number' },
            dropOffAnalysis: { type: 'number' },
            frictionIdentification: { type: 'number' },
            rootCauseAnalysis: { type: 'number' },
            hypothesisQuality: { type: 'number' },
            recommendationQuality: { type: 'number' }
          }
        },
        qualityGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              improvement: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        methodologyValidation: {
          type: 'object',
          properties: {
            statisticalRigor: { type: 'boolean' },
            sufficientSampleSize: { type: 'boolean' },
            comprehensiveCoverage: { type: 'boolean' },
            actionableInsights: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conversion-funnel-analysis', 'quality-validation']
}));
