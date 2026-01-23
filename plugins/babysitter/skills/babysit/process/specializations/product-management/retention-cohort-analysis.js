/**
 * @process product-management/retention-cohort-analysis
 * @description Retention Analysis and Cohort Analysis - Comprehensive process for analyzing user retention patterns,
 * cohort behavior, churn dynamics, engagement metrics, and activation optimization to improve product stickiness
 * and long-term user value through data-driven insights
 * @inputs { productName: string, analysisTimeframe?: string, cohortDefinition?: object, retentionMetrics?: array, dataSource?: object }
 * @outputs { success: boolean, retentionAnalysis: object, cohortInsights: array, churnAnalysis: object, recommendations: array, dashboards: array }
 *
 * @example
 * const result = await orchestrate('product-management/retention-cohort-analysis', {
 *   productName: 'Mobile App',
 *   analysisTimeframe: 'Last 6 months',
 *   cohortDefinition: {
 *     groupBy: 'signup_month',
 *     segmentBy: ['acquisition_channel', 'user_type']
 *   },
 *   retentionMetrics: ['D1', 'D7', 'D30', 'D90'],
 *   dataSource: {
 *     platform: 'Analytics DB',
 *     userTable: 'users',
 *     eventTable: 'user_events'
 *   }
 * });
 *
 * @references
 * - Cohort Analysis Guide: https://www.amplitude.com/blog/cohort-analysis
 * - Retention Metrics: https://www.lennysnewsletter.com/p/what-is-good-retention
 * - Product Analytics: https://www.reforge.com/blog/retention-engagement-growth-silent-killer
 * - Activation Best Practices: https://www.productled.com/blog/user-activation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    analysisTimeframe = 'Last 6 months',
    cohortDefinition = {},
    retentionMetrics = ['D1', 'D7', 'D30'],
    dataSource = {},
    outputDir = 'retention-cohort-analysis-output',
    minimumCohortSize = 100,
    churnThreshold = 30, // days of inactivity
    includeEngagementAnalysis = true,
    includeActivationAnalysis = true,
    benchmarkComparison = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Retention and Cohort Analysis for ${productName}`);
  ctx.log('info', `Timeframe: ${analysisTimeframe}, Metrics: ${retentionMetrics.join(', ')}`);

  // ============================================================================
  // PHASE 1: DATA COLLECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting and validating data sources');
  const dataCollection = await ctx.task(dataCollectionTask, {
    productName,
    analysisTimeframe,
    dataSource,
    cohortDefinition,
    retentionMetrics,
    minimumCohortSize,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Quality Gate: Validate sufficient data
  if (!dataCollection.hasSufficientData) {
    return {
      success: false,
      error: 'Insufficient data for meaningful analysis',
      phase: 'data-collection',
      dataQuality: dataCollection.dataQuality,
      missingData: dataCollection.missingData,
      recommendations: dataCollection.recommendations
    };
  }

  // ============================================================================
  // PHASE 2: COHORT DEFINITION AND SEGMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining cohorts and user segments');
  const cohortSegmentation = await ctx.task(cohortSegmentationTask, {
    productName,
    analysisTimeframe,
    cohortDefinition,
    userData: dataCollection.userData,
    minimumCohortSize,
    outputDir
  });

  artifacts.push(...cohortSegmentation.artifacts);

  // Breakpoint: Review cohort definitions
  await ctx.breakpoint({
    question: `Cohort segmentation complete for ${productName}. ${cohortSegmentation.cohorts.length} cohorts identified with ${cohortSegmentation.totalUsers} users. Review cohort structure?`,
    title: 'Cohort Segmentation Review',
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
        cohortCount: cohortSegmentation.cohorts.length,
        totalUsers: cohortSegmentation.totalUsers,
        segmentationDimensions: cohortSegmentation.dimensions,
        analysisTimeframe
      }
    }
  });

  // ============================================================================
  // PHASE 3: RETENTION METRICS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating retention metrics (D1, D7, D30, etc.)');
  const retentionCalculation = await ctx.task(retentionCalculationTask, {
    productName,
    cohorts: cohortSegmentation.cohorts,
    retentionMetrics,
    userData: dataCollection.userData,
    eventData: dataCollection.eventData,
    outputDir
  });

  artifacts.push(...retentionCalculation.artifacts);

  // ============================================================================
  // PHASE 4: COHORT RETENTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing retention patterns across cohorts');
  const cohortRetentionAnalysis = await ctx.task(cohortRetentionAnalysisTask, {
    productName,
    cohorts: cohortSegmentation.cohorts,
    retentionData: retentionCalculation.retentionData,
    retentionMetrics,
    analysisTimeframe,
    outputDir
  });

  artifacts.push(...cohortRetentionAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CHURN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing churn patterns and risk factors');
  const churnAnalysis = await ctx.task(churnAnalysisTask, {
    productName,
    cohorts: cohortSegmentation.cohorts,
    retentionData: retentionCalculation.retentionData,
    userData: dataCollection.userData,
    eventData: dataCollection.eventData,
    churnThreshold,
    outputDir
  });

  artifacts.push(...churnAnalysis.artifacts);

  // Breakpoint: Review retention and churn insights
  await ctx.breakpoint({
    question: `Retention and churn analysis complete. Overall D7 retention: ${cohortRetentionAnalysis.overallRetention.D7.toFixed(1)}%, Churn rate: ${churnAnalysis.overallChurnRate.toFixed(1)}%. Review insights?`,
    title: 'Retention & Churn Analysis Review',
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
        d1Retention: cohortRetentionAnalysis.overallRetention.D1,
        d7Retention: cohortRetentionAnalysis.overallRetention.D7,
        d30Retention: cohortRetentionAnalysis.overallRetention.D30,
        churnRate: churnAnalysis.overallChurnRate,
        highRiskUsers: churnAnalysis.highRiskUsers,
        topChurnReasons: churnAnalysis.topChurnReasons.slice(0, 3)
      }
    }
  });

  // ============================================================================
  // PHASE 6: ENGAGEMENT PATTERN ANALYSIS
  // ============================================================================

  let engagementAnalysis = null;
  if (includeEngagementAnalysis) {
    ctx.log('info', 'Phase 6: Analyzing user engagement patterns');
    engagementAnalysis = await ctx.task(engagementAnalysisTask, {
      productName,
      cohorts: cohortSegmentation.cohorts,
      retentionData: retentionCalculation.retentionData,
      eventData: dataCollection.eventData,
      outputDir
    });

    artifacts.push(...engagementAnalysis.artifacts);
  } else {
    ctx.log('info', 'Phase 6: Skipping engagement analysis (disabled)');
  }

  // ============================================================================
  // PHASE 7: ACTIVATION ANALYSIS AND OPTIMIZATION
  // ============================================================================

  let activationAnalysis = null;
  if (includeActivationAnalysis) {
    ctx.log('info', 'Phase 7: Analyzing activation patterns and optimization opportunities');
    activationAnalysis = await ctx.task(activationAnalysisTask, {
      productName,
      cohorts: cohortSegmentation.cohorts,
      retentionData: retentionCalculation.retentionData,
      eventData: dataCollection.eventData,
      churnAnalysis,
      outputDir
    });

    artifacts.push(...activationAnalysis.artifacts);
  } else {
    ctx.log('info', 'Phase 7: Skipping activation analysis (disabled)');
  }

  // ============================================================================
  // PHASE 8: BEHAVIORAL SEGMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Segmenting users by behavior patterns');
  const behavioralSegmentation = await ctx.task(behavioralSegmentationTask, {
    productName,
    cohorts: cohortSegmentation.cohorts,
    retentionData: retentionCalculation.retentionData,
    engagementAnalysis,
    eventData: dataCollection.eventData,
    outputDir
  });

  artifacts.push(...behavioralSegmentation.artifacts);

  // ============================================================================
  // PHASE 9: RETENTION CURVE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing retention curves and lifecycle patterns');
  const retentionCurveAnalysis = await ctx.task(retentionCurveAnalysisTask, {
    productName,
    cohorts: cohortSegmentation.cohorts,
    retentionData: retentionCalculation.retentionData,
    analysisTimeframe,
    outputDir
  });

  artifacts.push(...retentionCurveAnalysis.artifacts);

  // ============================================================================
  // PHASE 10: FEATURE IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 10: Analyzing feature usage impact on retention');
  const featureImpactAnalysis = await ctx.task(featureImpactAnalysisTask, {
    productName,
    cohorts: cohortSegmentation.cohorts,
    retentionData: retentionCalculation.retentionData,
    eventData: dataCollection.eventData,
    behavioralSegmentation,
    outputDir
  });

  artifacts.push(...featureImpactAnalysis.artifacts);

  // ============================================================================
  // PHASE 11: BENCHMARK COMPARISON
  // ============================================================================

  let benchmarkAnalysis = null;
  if (benchmarkComparison) {
    ctx.log('info', 'Phase 11: Comparing metrics against industry benchmarks');
    benchmarkAnalysis = await ctx.task(benchmarkComparisonTask, {
      productName,
      retentionMetrics: cohortRetentionAnalysis.overallRetention,
      churnRate: churnAnalysis.overallChurnRate,
      engagementMetrics: engagementAnalysis?.engagementMetrics,
      outputDir
    });

    artifacts.push(...benchmarkAnalysis.artifacts);
  } else {
    ctx.log('info', 'Phase 11: Skipping benchmark comparison (disabled)');
  }

  // ============================================================================
  // PHASE 12: PREDICTIVE CHURN MODELING
  // ============================================================================

  ctx.log('info', 'Phase 12: Building predictive churn risk model');
  const predictiveModeling = await ctx.task(predictiveChurnModelTask, {
    productName,
    cohorts: cohortSegmentation.cohorts,
    retentionData: retentionCalculation.retentionData,
    churnAnalysis,
    behavioralSegmentation,
    featureImpactAnalysis,
    outputDir
  });

  artifacts.push(...predictiveModeling.artifacts);

  // ============================================================================
  // PHASE 13: INTERVENTION STRATEGY RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating retention improvement recommendations');
  const interventionStrategy = await ctx.task(interventionStrategyTask, {
    productName,
    cohortRetentionAnalysis,
    churnAnalysis,
    engagementAnalysis,
    activationAnalysis,
    behavioralSegmentation,
    featureImpactAnalysis,
    predictiveModeling,
    benchmarkAnalysis,
    outputDir
  });

  artifacts.push(...interventionStrategy.artifacts);

  // ============================================================================
  // PHASE 14: DASHBOARD AND VISUALIZATION CREATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating retention analytics dashboards');
  const dashboardCreation = await ctx.task(dashboardCreationTask, {
    productName,
    cohortSegmentation,
    retentionCalculation,
    cohortRetentionAnalysis,
    churnAnalysis,
    engagementAnalysis,
    retentionCurveAnalysis,
    featureImpactAnalysis,
    outputDir
  });

  artifacts.push(...dashboardCreation.artifacts);

  // ============================================================================
  // PHASE 15: ANALYSIS QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Validating analysis quality and completeness');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    productName,
    dataCollection,
    cohortSegmentation,
    retentionCalculation,
    cohortRetentionAnalysis,
    churnAnalysis,
    minimumCohortSize,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const analysisScore = qualityValidation.overallScore;
  const qualityMet = analysisScore >= 80;

  // Final Breakpoint: Review complete analysis
  await ctx.breakpoint({
    question: `Retention and Cohort Analysis complete for ${productName}. Quality score: ${analysisScore}/100. D7 retention: ${cohortRetentionAnalysis.overallRetention.D7.toFixed(1)}%, ${interventionStrategy.recommendations.length} improvement recommendations generated. Review and approve?`,
    title: 'Final Analysis Review',
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
        analysisScore,
        qualityMet,
        cohortCount: cohortSegmentation.cohorts.length,
        totalUsers: cohortSegmentation.totalUsers,
        d1Retention: cohortRetentionAnalysis.overallRetention.D1,
        d7Retention: cohortRetentionAnalysis.overallRetention.D7,
        d30Retention: cohortRetentionAnalysis.overallRetention.D30,
        churnRate: churnAnalysis.overallChurnRate,
        highImpactRecommendations: interventionStrategy.highImpactRecommendations,
        duration: ctx.now() - startTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    analysisTimeframe,
    analysisScore,
    qualityMet,
    dataQuality: {
      totalUsers: cohortSegmentation.totalUsers,
      totalEvents: dataCollection.totalEvents,
      dataCompleteness: dataCollection.dataQuality.completeness,
      dataReliability: dataCollection.dataQuality.reliability
    },
    cohortAnalysis: {
      cohortCount: cohortSegmentation.cohorts.length,
      segmentationDimensions: cohortSegmentation.dimensions,
      cohortSizeRange: cohortSegmentation.cohortSizeRange,
      bestPerformingCohort: cohortRetentionAnalysis.bestPerformingCohort,
      worstPerformingCohort: cohortRetentionAnalysis.worstPerformingCohort
    },
    retentionAnalysis: {
      overallRetention: cohortRetentionAnalysis.overallRetention,
      retentionTrends: cohortRetentionAnalysis.retentionTrends,
      retentionBySegment: cohortRetentionAnalysis.retentionBySegment,
      criticalDropoffPoints: retentionCurveAnalysis.criticalDropoffPoints,
      retentionCurveShape: retentionCurveAnalysis.curveShape
    },
    churnAnalysis: {
      overallChurnRate: churnAnalysis.overallChurnRate,
      churnBySegment: churnAnalysis.churnBySegment,
      topChurnReasons: churnAnalysis.topChurnReasons,
      highRiskUsers: churnAnalysis.highRiskUsers,
      churnPredictionAccuracy: predictiveModeling.modelAccuracy
    },
    engagementPatterns: engagementAnalysis ? {
      engagementScore: engagementAnalysis.overallEngagementScore,
      powerUsers: engagementAnalysis.powerUsers,
      casualUsers: engagementAnalysis.casualUsers,
      engagementDrivers: engagementAnalysis.topEngagementDrivers
    } : null,
    activationInsights: activationAnalysis ? {
      activationRate: activationAnalysis.activationRate,
      timeToActivation: activationAnalysis.averageTimeToActivation,
      activationMilestones: activationAnalysis.criticalMilestones,
      activationImpact: activationAnalysis.activationRetentionLift
    } : null,
    behavioralSegments: {
      segmentCount: behavioralSegmentation.segments.length,
      segments: behavioralSegmentation.segments.map(s => ({
        name: s.name,
        size: s.userCount,
        retentionRate: s.retentionRate,
        characteristics: s.keyCharacteristics
      }))
    },
    featureImpact: {
      highImpactFeatures: featureImpactAnalysis.highImpactFeatures,
      lowImpactFeatures: featureImpactAnalysis.lowImpactFeatures,
      featureRetentionCorrelation: featureImpactAnalysis.correlationScores
    },
    benchmarkComparison: benchmarkAnalysis ? {
      industryPosition: benchmarkAnalysis.position,
      competitiveGaps: benchmarkAnalysis.gaps,
      strengthAreas: benchmarkAnalysis.strengths
    } : null,
    recommendations: {
      total: interventionStrategy.recommendations.length,
      highImpact: interventionStrategy.highImpactRecommendations,
      quickWins: interventionStrategy.quickWins,
      strategicInitiatives: interventionStrategy.strategicInitiatives,
      estimatedImpact: interventionStrategy.estimatedRetentionLift
    },
    dashboards: dashboardCreation.dashboards.map(d => ({
      name: d.name,
      type: d.type,
      path: d.path,
      metrics: d.metrics
    })),
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/retention-cohort-analysis',
      timestamp: startTime,
      productName,
      analysisTimeframe,
      outputDir,
      retentionMetrics
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Data Collection and Validation
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and validate data sources',
  agent: {
    name: 'data-engineer',
    prompt: {
      role: 'data engineer specializing in product analytics and data quality',
      task: 'Collect, validate, and prepare user and event data for retention and cohort analysis',
      context: args,
      instructions: [
        'Connect to specified data sources (analytics platform, database, data warehouse)',
        'Extract user data: user_id, signup_date, last_active_date, user_attributes, acquisition_channel',
        'Extract event data: user_id, event_name, event_timestamp, event_properties',
        'Validate data completeness: check for missing values, null fields, data gaps',
        'Assess data quality: duplicate records, inconsistent timestamps, invalid user_ids',
        'Calculate data coverage: percentage of users with complete data',
        'Validate timeframe: ensure sufficient historical data for specified retention metrics',
        'Check minimum cohort size requirements',
        'Identify data quality issues and limitations',
        'Document data sources, extraction logic, and assumptions',
        'Flag insufficient data scenarios',
        'Generate data quality report and summary statistics'
      ],
      outputFormat: 'JSON with hasSufficientData (boolean), userData (object), eventData (object), totalUsers (number), totalEvents (number), dataQuality (object), missingData (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasSufficientData', 'userData', 'eventData', 'dataQuality', 'artifacts'],
      properties: {
        hasSufficientData: { type: 'boolean' },
        userData: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            dateRange: { type: 'object' },
            userAttributes: { type: 'array', items: { type: 'string' } },
            sampleUsers: { type: 'array' }
          }
        },
        eventData: {
          type: 'object',
          properties: {
            totalEvents: { type: 'number' },
            dateRange: { type: 'object' },
            eventTypes: { type: 'array', items: { type: 'string' } },
            eventsPerUser: { type: 'object' }
          }
        },
        totalUsers: { type: 'number' },
        totalEvents: { type: 'number' },
        dataQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number', minimum: 0, maximum: 100 },
            reliability: { type: 'number', minimum: 0, maximum: 100 },
            consistency: { type: 'number', minimum: 0, maximum: 100 },
            coverage: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        dataIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              affectedRecords: { type: 'number' }
            }
          }
        },
        missingData: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'retention-analysis', 'data-collection']
}));

// Task 2: Cohort Segmentation
export const cohortSegmentationTask = defineTask('cohort-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define cohorts and user segments',
  agent: {
    name: 'cohort-analyst',
    prompt: {
      role: 'product analyst specializing in cohort analysis and user segmentation',
      task: 'Define meaningful cohorts based on signup time, user attributes, and behavior patterns',
      context: args,
      instructions: [
        'Review cohort definition criteria provided (e.g., signup_month, acquisition_channel)',
        'Create time-based cohorts: group users by signup period (daily, weekly, monthly)',
        'Apply segmentation dimensions: acquisition channel, user type, geography, device, plan tier',
        'Ensure minimum cohort size requirements are met',
        'Balance cohort granularity: detailed enough for insights, large enough for statistical significance',
        'Calculate cohort sizes and distribution',
        'Identify cohorts with insufficient users (below minimum threshold)',
        'Create cohort metadata: cohort_id, cohort_name, date_range, size, attributes',
        'Document segmentation logic and business rationale',
        'Generate cohort overview and distribution charts',
        'Save cohort definitions and membership data'
      ],
      outputFormat: 'JSON with cohorts (array), totalUsers (number), dimensions (array), cohortSizeRange (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cohorts', 'totalUsers', 'artifacts'],
      properties: {
        cohorts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cohortId: { type: 'string' },
              cohortName: { type: 'string' },
              dateRange: {
                type: 'object',
                properties: {
                  startDate: { type: 'string' },
                  endDate: { type: 'string' }
                }
              },
              userCount: { type: 'number' },
              segments: {
                type: 'object',
                additionalProperties: { type: 'string' }
              },
              attributes: { type: 'object' }
            }
          }
        },
        totalUsers: { type: 'number' },
        dimensions: { type: 'array', items: { type: 'string' } },
        cohortSizeRange: {
          type: 'object',
          properties: {
            smallest: { type: 'number' },
            largest: { type: 'number' },
            median: { type: 'number' },
            average: { type: 'number' }
          }
        },
        insufficientCohorts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cohortName: { type: 'string' },
              userCount: { type: 'number' },
              minimumRequired: { type: 'number' }
            }
          }
        },
        segmentationSummary: {
          type: 'object',
          properties: {
            totalCohorts: { type: 'number' },
            segmentationDepth: { type: 'number' },
            averageCohortSize: { type: 'number' }
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
  labels: ['agent', 'retention-analysis', 'cohort-segmentation']
}));

// Task 3: Retention Calculation
export const retentionCalculationTask = defineTask('retention-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate retention metrics',
  agent: {
    name: 'retention-analyst',
    prompt: {
      role: 'retention analyst specializing in calculating and interpreting retention metrics',
      task: 'Calculate D1, D7, D30, D90 retention rates for each cohort',
      context: args,
      instructions: [
        'For each cohort, calculate specified retention metrics (D1, D7, D30, D90, etc.)',
        'D1 retention: percentage of users active 1 day after signup',
        'D7 retention: percentage of users active 7 days after signup',
        'D30 retention: percentage of users active 30 days after signup',
        'D90 retention: percentage of users active 90 days after signup',
        'Define "active" based on product usage (login, key action, session)',
        'Handle edge cases: cohorts too new for long-term metrics, users with gaps',
        'Calculate retention for each day/week from cohort start',
        'Compute rolling retention vs classic retention',
        'Calculate unbounded retention (active at any point after day X)',
        'Generate retention tables for each cohort',
        'Calculate confidence intervals for retention rates',
        'Identify statistically significant differences between cohorts'
      ],
      outputFormat: 'JSON with retentionData (object), retentionByMetric (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['retentionData', 'artifacts'],
      properties: {
        retentionData: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              cohortId: { type: 'string' },
              cohortName: { type: 'string' },
              userCount: { type: 'number' },
              retentionRates: {
                type: 'object',
                properties: {
                  D1: { type: 'number' },
                  D7: { type: 'number' },
                  D30: { type: 'number' },
                  D90: { type: 'number' }
                }
              },
              dailyRetention: { type: 'array', items: { type: 'number' } },
              confidenceIntervals: { type: 'object' }
            }
          }
        },
        retentionByMetric: {
          type: 'object',
          properties: {
            D1: {
              type: 'object',
              properties: {
                average: { type: 'number' },
                min: { type: 'number' },
                max: { type: 'number' },
                standardDeviation: { type: 'number' }
              }
            },
            D7: { type: 'object' },
            D30: { type: 'object' },
            D90: { type: 'object' }
          }
        },
        retentionType: { type: 'string', enum: ['classic', 'rolling', 'unbounded'] },
        activeDefinition: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'retention-analysis', 'retention-calculation']
}));

// Task 4: Cohort Retention Analysis
export const cohortRetentionAnalysisTask = defineTask('cohort-retention-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze retention patterns across cohorts',
  agent: {
    name: 'cohort-insights-analyst',
    prompt: {
      role: 'senior product analyst specializing in cohort behavior analysis',
      task: 'Analyze retention patterns, identify trends, and compare cohort performance',
      context: args,
      instructions: [
        'Calculate overall retention rates across all cohorts',
        'Identify best-performing cohorts (highest retention)',
        'Identify worst-performing cohorts (lowest retention)',
        'Analyze retention trends over time: improving, declining, stable',
        'Compare retention by segment: channel, user type, device, geography',
        'Identify cohort characteristics associated with high retention',
        'Detect retention anomalies: unusual spikes or drops',
        'Calculate retention lift between segments',
        'Analyze retention stability: consistent vs volatile',
        'Identify seasonality or cyclical patterns',
        'Generate retention comparison charts and heatmaps',
        'Document key insights and patterns discovered'
      ],
      outputFormat: 'JSON with overallRetention (object), bestPerformingCohort (object), worstPerformingCohort (object), retentionTrends (object), retentionBySegment (object), keyInsights (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRetention', 'retentionTrends', 'keyInsights', 'artifacts'],
      properties: {
        overallRetention: {
          type: 'object',
          properties: {
            D1: { type: 'number' },
            D7: { type: 'number' },
            D30: { type: 'number' },
            D90: { type: 'number' }
          }
        },
        bestPerformingCohort: {
          type: 'object',
          properties: {
            cohortId: { type: 'string' },
            cohortName: { type: 'string' },
            d7Retention: { type: 'number' },
            characteristics: { type: 'array', items: { type: 'string' } }
          }
        },
        worstPerformingCohort: {
          type: 'object',
          properties: {
            cohortId: { type: 'string' },
            cohortName: { type: 'string' },
            d7Retention: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        retentionTrends: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'declining', 'stable', 'volatile'] },
            changeRate: { type: 'number' },
            trendDescription: { type: 'string' }
          }
        },
        retentionBySegment: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              d7Retention: { type: 'number' },
              cohortCount: { type: 'number' },
              userCount: { type: 'number' }
            }
          }
        },
        retentionLift: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              comparison: { type: 'string' },
              liftPercentage: { type: 'number' },
              significance: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'retention-analysis', 'cohort-analysis']
}));

// Task 5: Churn Analysis
export const churnAnalysisTask = defineTask('churn-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze churn patterns and risk factors',
  agent: {
    name: 'churn-analyst',
    prompt: {
      role: 'churn analyst specializing in identifying at-risk users and churn drivers',
      task: 'Analyze churn patterns, identify churn reasons, and segment users by churn risk',
      context: args,
      instructions: [
        'Define churn: users inactive for X days (use churnThreshold parameter)',
        'Calculate overall churn rate across all cohorts',
        'Calculate churn rate by cohort and segment',
        'Identify time windows with highest churn (critical churn periods)',
        'Analyze churn reasons: low engagement, missing features, poor onboarding, competition',
        'Identify early churn signals: behavioral patterns before churning',
        'Segment churned users: churned early (D1-D7), churned mid-term (D7-D30), churned long-term (D30+)',
        'Calculate churn probability by user segment',
        'Identify high-risk users: active but showing churn signals',
        'Compare churn rates across acquisition channels',
        'Analyze resurrection patterns: churned users who returned',
        'Generate churn analysis report with actionable insights'
      ],
      outputFormat: 'JSON with overallChurnRate (number), churnBySegment (object), topChurnReasons (array), highRiskUsers (number), churnSignals (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallChurnRate', 'churnBySegment', 'topChurnReasons', 'artifacts'],
      properties: {
        overallChurnRate: { type: 'number' },
        churnBySegment: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              churnRate: { type: 'number' },
              churnedUsers: { type: 'number' },
              totalUsers: { type: 'number' }
            }
          }
        },
        churnByCohort: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cohortId: { type: 'string' },
              cohortName: { type: 'string' },
              churnRate: { type: 'number' }
            }
          }
        },
        criticalChurnPeriods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              churnPercentage: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        topChurnReasons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              percentage: { type: 'number' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        churnSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              churnProbability: { type: 'number' },
              leadTime: { type: 'string' }
            }
          }
        },
        highRiskUsers: { type: 'number' },
        highRiskSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              riskScore: { type: 'number' },
              userCount: { type: 'number' }
            }
          }
        },
        resurrectionRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'retention-analysis', 'churn-analysis']
}));

// Task 6: Engagement Analysis
export const engagementAnalysisTask = defineTask('engagement-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze user engagement patterns',
  agent: {
    name: 'engagement-analyst',
    prompt: {
      role: 'engagement analyst specializing in user behavior and product usage patterns',
      task: 'Analyze engagement patterns, identify power users, and understand engagement drivers',
      context: args,
      instructions: [
        'Define engagement metrics: DAU/MAU, session frequency, session duration, feature usage',
        'Calculate engagement score for each user/cohort',
        'Segment users by engagement level: power users, core users, casual users, at-risk users',
        'Identify power user characteristics: usage patterns, features used, session frequency',
        'Analyze engagement correlation with retention',
        'Identify engagement drivers: features/actions that increase engagement',
        'Calculate stickiness ratio (DAU/MAU)',
        'Analyze engagement trends over user lifecycle',
        'Identify engagement drop-off points',
        'Compare engagement across cohorts and segments',
        'Generate engagement distribution charts',
        'Document engagement insights and patterns'
      ],
      outputFormat: 'JSON with overallEngagementScore (number), powerUsers (number), casualUsers (number), topEngagementDrivers (array), engagementMetrics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallEngagementScore', 'engagementMetrics', 'artifacts'],
      properties: {
        overallEngagementScore: { type: 'number', minimum: 0, maximum: 100 },
        engagementMetrics: {
          type: 'object',
          properties: {
            dauMauRatio: { type: 'number' },
            averageSessionsPerUser: { type: 'number' },
            averageSessionDuration: { type: 'number' },
            featureAdoptionRate: { type: 'number' }
          }
        },
        powerUsers: { type: 'number' },
        coreUsers: { type: 'number' },
        casualUsers: { type: 'number' },
        atRiskUsers: { type: 'number' },
        engagementSegmentation: {
          type: 'object',
          properties: {
            powerUserCriteria: { type: 'string' },
            coreUserCriteria: { type: 'string' },
            casualUserCriteria: { type: 'string' }
          }
        },
        topEngagementDrivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driver: { type: 'string' },
              engagementLift: { type: 'number' },
              retentionImpact: { type: 'number' }
            }
          }
        },
        engagementCorrelation: {
          type: 'object',
          properties: {
            engagementRetentionCorrelation: { type: 'number' },
            threshold: { type: 'string' }
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
  labels: ['agent', 'retention-analysis', 'engagement-analysis']
}));

// Task 7: Activation Analysis
export const activationAnalysisTask = defineTask('activation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze activation patterns and optimization',
  agent: {
    name: 'activation-specialist',
    prompt: {
      role: 'activation specialist focused on new user onboarding and aha moments',
      task: 'Analyze user activation patterns, identify critical activation milestones, and optimize onboarding',
      context: args,
      instructions: [
        'Define activation: key actions/milestones indicating user has experienced value',
        'Calculate activation rate: percentage of users who activate',
        'Measure time to activation: how long until users reach activation milestone',
        'Identify critical activation milestones: first key action, aha moment, habit formation',
        'Analyze activation impact on retention: activated vs non-activated retention',
        'Segment users by activation speed: quick activators, slow activators, non-activators',
        'Identify activation blockers: friction points preventing activation',
        'Analyze onboarding completion rates',
        'Identify features used by successfully activated users',
        'Calculate activation retention lift (activated users retention vs non-activated)',
        'Recommend activation optimization strategies',
        'Generate activation funnel analysis'
      ],
      outputFormat: 'JSON with activationRate (number), averageTimeToActivation (string), criticalMilestones (array), activationRetentionLift (number), activationBlockers (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activationRate', 'criticalMilestones', 'activationRetentionLift', 'artifacts'],
      properties: {
        activationRate: { type: 'number' },
        activationDefinition: { type: 'string' },
        averageTimeToActivation: { type: 'string' },
        timeToActivationDistribution: {
          type: 'object',
          properties: {
            median: { type: 'number' },
            p25: { type: 'number' },
            p75: { type: 'number' },
            p90: { type: 'number' }
          }
        },
        criticalMilestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              completionRate: { type: 'number' },
              retentionImpact: { type: 'number' },
              averageTime: { type: 'string' }
            }
          }
        },
        activationRetentionLift: { type: 'number' },
        activatedVsNonActivated: {
          type: 'object',
          properties: {
            activatedD7Retention: { type: 'number' },
            nonActivatedD7Retention: { type: 'number' },
            liftPercentage: { type: 'number' }
          }
        },
        activationSegments: {
          type: 'object',
          properties: {
            quickActivators: { type: 'number' },
            slowActivators: { type: 'number' },
            nonActivators: { type: 'number' }
          }
        },
        activationBlockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              blocker: { type: 'string' },
              impactedUsers: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        onboardingCompletionRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'retention-analysis', 'activation-analysis']
}));

// Task 8: Behavioral Segmentation
export const behavioralSegmentationTask = defineTask('behavioral-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Segment users by behavior patterns',
  agent: {
    name: 'behavioral-scientist',
    prompt: {
      role: 'behavioral scientist specializing in user segmentation and pattern recognition',
      task: 'Segment users into behavioral groups based on usage patterns, features used, and engagement',
      context: args,
      instructions: [
        'Analyze user behavior patterns: feature usage, session patterns, engagement level',
        'Apply clustering techniques to identify natural user segments',
        'Create behavioral segments: power users, feature explorers, single-feature users, inactive, etc.',
        'For each segment define: size, characteristics, retention rate, engagement level, value',
        'Identify segment-specific retention patterns',
        'Analyze segment transitions: users moving between segments over time',
        'Calculate lifetime value (LTV) by segment',
        'Identify high-value segments vs low-value segments',
        'Recommend targeted strategies for each segment',
        'Create segment personas with typical behavior patterns',
        'Generate behavioral segmentation visualization',
        'Document segment definitions and characteristics'
      ],
      outputFormat: 'JSON with segments (array), segmentTransitions (object), highValueSegments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              userCount: { type: 'number' },
              percentage: { type: 'number' },
              retentionRate: { type: 'number' },
              engagementScore: { type: 'number' },
              keyCharacteristics: { type: 'array', items: { type: 'string' } },
              typicalBehaviors: { type: 'array', items: { type: 'string' } },
              estimatedLtv: { type: 'number' }
            }
          }
        },
        segmentTransitions: {
          type: 'object',
          properties: {
            upgradeTransitions: {
              type: 'array',
              description: 'Users moving to higher engagement segments',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  percentage: { type: 'number' }
                }
              }
            },
            downgradeTransitions: {
              type: 'array',
              description: 'Users moving to lower engagement segments'
            }
          }
        },
        highValueSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              userCount: { type: 'number' },
              avgLtv: { type: 'number' },
              retentionRate: { type: 'number' }
            }
          }
        },
        segmentationQuality: {
          type: 'object',
          properties: {
            distinctiveness: { type: 'number' },
            coverage: { type: 'number' },
            stability: { type: 'number' }
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
  labels: ['agent', 'retention-analysis', 'behavioral-segmentation']
}));

// Task 9: Retention Curve Analysis
export const retentionCurveAnalysisTask = defineTask('retention-curve-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze retention curves and lifecycle patterns',
  agent: {
    name: 'lifecycle-analyst',
    prompt: {
      role: 'product lifecycle analyst specializing in retention curve interpretation',
      task: 'Analyze retention curve shapes, identify critical drop-off points, and understand lifecycle patterns',
      context: args,
      instructions: [
        'Plot retention curves for each cohort over time',
        'Identify retention curve shape: linear decline, plateau, cliff, smile curve',
        'Locate critical drop-off points: days with steepest retention decline',
        'Analyze early retention (D1-D7): initial stickiness and onboarding quality',
        'Analyze mid-term retention (D7-D30): habit formation period',
        'Analyze long-term retention (D30+): product-market fit and sustained value',
        'Calculate retention half-life: time until 50% of cohort churns',
        'Identify plateau point: when retention stabilizes (product has sticky users)',
        'Compare retention curve shapes across cohorts',
        'Detect curve anomalies: unexpected spikes or drops',
        'Predict future retention based on curve trajectory',
        'Generate retention curve visualizations with annotations'
      ],
      outputFormat: 'JSON with curveShape (string), criticalDropoffPoints (array), retentionHalfLife (number), plateauPoint (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['curveShape', 'criticalDropoffPoints', 'artifacts'],
      properties: {
        curveShape: {
          type: 'string',
          enum: ['linear-decline', 'plateau', 'cliff', 'smile', 'healthy', 'concerning']
        },
        curveDescription: { type: 'string' },
        criticalDropoffPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'number' },
              dropoffRate: { type: 'number' },
              retentionRate: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        retentionPhases: {
          type: 'object',
          properties: {
            earlyRetention: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                averageRetention: { type: 'number' },
                assessment: { type: 'string' }
              }
            },
            midTermRetention: { type: 'object' },
            longTermRetention: { type: 'object' }
          }
        },
        retentionHalfLife: { type: 'number' },
        plateauPoint: {
          type: 'object',
          properties: {
            day: { type: 'number' },
            retentionRate: { type: 'number' },
            stabilizedUserPercentage: { type: 'number' }
          }
        },
        curveComparison: {
          type: 'object',
          properties: {
            bestCurve: { type: 'string' },
            worstCurve: { type: 'string' },
            averageCurve: { type: 'string' }
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
  labels: ['agent', 'retention-analysis', 'retention-curve']
}));

// Task 10: Feature Impact Analysis
export const featureImpactAnalysisTask = defineTask('feature-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze feature usage impact on retention',
  agent: {
    name: 'feature-analyst',
    prompt: {
      role: 'feature analyst specializing in product analytics and feature adoption',
      task: 'Analyze which features drive retention and which features correlate with churn',
      context: args,
      instructions: [
        'Identify all product features tracked in event data',
        'Calculate feature adoption rates across cohorts',
        'Analyze correlation between feature usage and retention',
        'Identify high-impact features: features strongly correlated with retention',
        'Identify low-impact features: features with little retention correlation',
        'Analyze feature usage timing: early usage vs late usage impact',
        'Identify feature combinations that drive retention',
        'Calculate retention lift for users who adopt specific features',
        'Identify unused features by high-retention users (candidates for removal)',
        'Analyze feature abandonment: features users try once but don\'t return to',
        'Recommend feature prioritization based on retention impact',
        'Generate feature retention correlation matrix'
      ],
      outputFormat: 'JSON with highImpactFeatures (array), lowImpactFeatures (array), correlationScores (object), featureCombinations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['highImpactFeatures', 'correlationScores', 'artifacts'],
      properties: {
        highImpactFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureName: { type: 'string' },
              adoptionRate: { type: 'number' },
              retentionLift: { type: 'number' },
              correlationScore: { type: 'number' },
              usersUsing: { type: 'number' }
            }
          }
        },
        lowImpactFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureName: { type: 'string' },
              adoptionRate: { type: 'number' },
              correlationScore: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        correlationScores: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        featureCombinations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              features: { type: 'array', items: { type: 'string' } },
              retentionRate: { type: 'number' },
              userCount: { type: 'number' }
            }
          }
        },
        featureAdoptionTimingImpact: {
          type: 'object',
          properties: {
            earlyAdopters: { type: 'number' },
            lateAdopters: { type: 'number' },
            timingSignificance: { type: 'string' }
          }
        },
        featureAbandonmentRate: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureName: { type: 'string' },
              abandonmentRate: { type: 'number' }
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
  labels: ['agent', 'retention-analysis', 'feature-impact']
}));

// Task 11: Benchmark Comparison
export const benchmarkComparisonTask = defineTask('benchmark-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare metrics against industry benchmarks',
  agent: {
    name: 'benchmark-analyst',
    prompt: {
      role: 'industry analyst with access to product analytics benchmarks and market data',
      task: 'Compare product retention, engagement, and activation metrics against industry standards',
      context: args,
      instructions: [
        'Identify industry benchmarks for similar products (SaaS, consumer app, B2B, etc.)',
        'Compare D1, D7, D30 retention rates against benchmarks',
        'Compare churn rate against industry standards',
        'Compare engagement metrics (DAU/MAU) against benchmarks',
        'Assess product performance: above benchmark, at benchmark, below benchmark',
        'Identify competitive gaps: areas where product underperforms',
        'Identify strength areas: areas where product outperforms',
        'Contextualize benchmarks: adjust for product type, maturity, market',
        'Provide realistic targets based on benchmark analysis',
        'Recommend focus areas based on gaps',
        'Generate benchmark comparison report with visualizations'
      ],
      outputFormat: 'JSON with position (string), gaps (array), strengths (array), targets (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['position', 'artifacts'],
      properties: {
        position: {
          type: 'string',
          enum: ['industry-leading', 'above-average', 'average', 'below-average', 'concerning']
        },
        benchmarkComparison: {
          type: 'object',
          properties: {
            d1Retention: {
              type: 'object',
              properties: {
                actual: { type: 'number' },
                benchmark: { type: 'number' },
                gap: { type: 'number' }
              }
            },
            d7Retention: { type: 'object' },
            d30Retention: { type: 'object' },
            churnRate: { type: 'object' },
            dauMau: { type: 'object' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              gap: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              advantage: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        targets: {
          type: 'object',
          properties: {
            d7RetentionTarget: { type: 'number' },
            d30RetentionTarget: { type: 'number' },
            churnRateTarget: { type: 'number' },
            dauMauTarget: { type: 'number' }
          }
        },
        industryContext: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'retention-analysis', 'benchmark-comparison']
}));

// Task 12: Predictive Churn Model
export const predictiveChurnModelTask = defineTask('predictive-churn-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build predictive churn risk model',
  agent: {
    name: 'ml-analyst',
    prompt: {
      role: 'machine learning analyst specializing in predictive modeling and churn prediction',
      task: 'Build predictive model to identify users at risk of churning before they churn',
      context: args,
      instructions: [
        'Identify predictive features: engagement metrics, feature usage, session patterns, demographics',
        'Build churn risk scoring model: logistic regression, decision tree, or ensemble',
        'Train model on historical data: churned users vs retained users',
        'Validate model accuracy: precision, recall, F1-score, AUC-ROC',
        'Identify most important churn predictors (feature importance)',
        'Score current active users for churn risk (high, medium, low)',
        'Calibrate churn probability thresholds',
        'Calculate lead time: how far in advance model predicts churn',
        'Segment users by churn risk score',
        'Recommend intervention timing based on model predictions',
        'Generate churn risk dashboard with user lists',
        'Document model methodology and limitations'
      ],
      outputFormat: 'JSON with modelAccuracy (number), featureImportance (array), churnRiskSegments (object), predictiveLeadTime (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modelAccuracy', 'featureImportance', 'artifacts'],
      properties: {
        modelAccuracy: { type: 'number', minimum: 0, maximum: 1 },
        modelMetrics: {
          type: 'object',
          properties: {
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1Score: { type: 'number' },
            aucRoc: { type: 'number' }
          }
        },
        featureImportance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              importance: { type: 'number' },
              direction: { type: 'string', enum: ['increases-risk', 'decreases-risk'] }
            }
          }
        },
        churnRiskSegments: {
          type: 'object',
          properties: {
            highRisk: {
              type: 'object',
              properties: {
                userCount: { type: 'number' },
                churnProbability: { type: 'number' },
                threshold: { type: 'number' }
              }
            },
            mediumRisk: { type: 'object' },
            lowRisk: { type: 'object' }
          }
        },
        predictiveLeadTime: { type: 'string' },
        interventionPriority: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              churnRisk: { type: 'number' },
              recommendedAction: { type: 'string' },
              urgency: { type: 'string' }
            }
          }
        },
        modelLimitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'retention-analysis', 'predictive-modeling']
}));

// Task 13: Intervention Strategy
export const interventionStrategyTask = defineTask('intervention-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate retention improvement recommendations',
  agent: {
    name: 'retention-strategist',
    prompt: {
      role: 'retention strategist and growth expert specializing in evidence-based interventions',
      task: 'Synthesize all analysis insights into actionable retention improvement recommendations',
      context: args,
      instructions: [
        'Synthesize insights from all analysis phases',
        'Identify root causes of churn and low retention',
        'Prioritize intervention opportunities: impact vs effort',
        'Generate specific, actionable recommendations for:',
        '  - Onboarding improvements (reduce early churn)',
        '  - Activation optimization (increase activated user percentage)',
        '  - Engagement enhancement (increase feature usage, session frequency)',
        '  - Retention campaigns (re-engagement for at-risk users)',
        '  - Feature improvements (based on feature impact analysis)',
        '  - Segment-specific interventions (tailored to behavioral segments)',
        'For each recommendation include:',
        '  - Problem statement: what issue it addresses',
        '  - Proposed solution: specific intervention',
        '  - Target segment: who it helps',
        '  - Expected impact: estimated retention lift',
        '  - Implementation effort: resources required',
        '  - Success metrics: how to measure impact',
        'Identify quick wins: high-impact, low-effort improvements',
        'Identify strategic initiatives: transformative but resource-intensive',
        'Estimate overall retention improvement potential',
        'Create implementation roadmap with prioritization'
      ],
      outputFormat: 'JSON with recommendations (array), highImpactRecommendations (number), quickWins (array), strategicInitiatives (array), estimatedRetentionLift (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'estimatedRetentionLift', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string', enum: ['onboarding', 'activation', 'engagement', 'retention-campaign', 'feature-improvement', 'segment-specific'] },
              title: { type: 'string' },
              problemStatement: { type: 'string' },
              proposedSolution: { type: 'string' },
              targetSegment: { type: 'string' },
              expectedImpact: { type: 'string' },
              estimatedRetentionLift: { type: 'number' },
              implementationEffort: { type: 'string', enum: ['low', 'medium', 'high'] },
              successMetrics: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        highImpactRecommendations: { type: 'number' },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        strategicInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              transformativePotential: { type: 'string' },
              resourceRequirements: { type: 'string' }
            }
          }
        },
        estimatedRetentionLift: { type: 'number' },
        implementationRoadmap: {
          type: 'object',
          properties: {
            phase1: { type: 'array', items: { type: 'string' } },
            phase2: { type: 'array', items: { type: 'string' } },
            phase3: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'retention-analysis', 'intervention-strategy']
}));

// Task 14: Dashboard Creation
export const dashboardCreationTask = defineTask('dashboard-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create retention analytics dashboards',
  agent: {
    name: 'analytics-engineer',
    prompt: {
      role: 'analytics engineer specializing in data visualization and dashboard design',
      task: 'Create comprehensive retention analytics dashboards for ongoing monitoring',
      context: args,
      instructions: [
        'Design executive retention dashboard: high-level KPIs and trends',
        'Create cohort analysis dashboard: cohort retention table and visualizations',
        'Build churn analytics dashboard: churn rate, reasons, at-risk users',
        'Create engagement dashboard: DAU/MAU, feature usage, engagement distribution',
        'Build activation dashboard: activation funnel, time to activation, milestones',
        'Create behavioral segments dashboard: segment sizes, retention by segment',
        'Design feature impact dashboard: feature adoption and retention correlation',
        'For each dashboard include:',
        '  - Key metrics with current values and trends',
        '  - Visualizations: line charts, heatmaps, bar charts, funnels',
        '  - Filters: date range, segment, cohort',
        '  - Benchmarks and targets',
        '  - Drill-down capabilities',
        'Generate dashboard specifications for BI tools (Looker, Tableau, Mode)',
        'Create SQL queries for dashboard metrics',
        'Document dashboard refresh schedule and data sources'
      ],
      outputFormat: 'JSON with dashboards (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'artifacts'],
      properties: {
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['executive', 'cohort', 'churn', 'engagement', 'activation', 'segments', 'feature-impact'] },
              description: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              visualizations: { type: 'array', items: { type: 'string' } },
              filters: { type: 'array', items: { type: 'string' } },
              path: { type: 'string' },
              refreshSchedule: { type: 'string' }
            }
          }
        },
        sqlQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              query: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        biToolSpecs: {
          type: 'object',
          properties: {
            lookerSpec: { type: 'string' },
            tableauSpec: { type: 'string' },
            metabaseSpec: { type: 'string' }
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
  labels: ['agent', 'retention-analysis', 'dashboards']
}));

// Task 15: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate analysis quality and completeness',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'analytics quality auditor specializing in data analysis validation',
      task: 'Validate quality, completeness, and statistical rigor of retention and cohort analysis',
      context: args,
      instructions: [
        'Evaluate data quality and completeness (weight: 20%)',
        'Assess cohort definition quality: appropriate segmentation, minimum sizes met (weight: 15%)',
        'Validate retention calculation accuracy: correct methodology, edge cases handled (weight: 15%)',
        'Review statistical significance: adequate sample sizes, confidence intervals (weight: 10%)',
        'Assess analysis depth: comprehensive insights, root cause identification (weight: 15%)',
        'Evaluate actionability: clear recommendations, measurable impact (weight: 15%)',
        'Validate methodology adherence: best practices followed (weight: 10%)',
        'Calculate weighted overall quality score (0-100)',
        'Identify quality gaps and analysis limitations',
        'Validate assumption documentation',
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
            dataQuality: { type: 'number' },
            cohortDefinitionQuality: { type: 'number' },
            retentionCalculationAccuracy: { type: 'number' },
            statisticalRigor: { type: 'number' },
            analysisDepth: { type: 'number' },
            actionability: { type: 'number' },
            methodologyAdherence: { type: 'number' }
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
        limitations: { type: 'array', items: { type: 'string' } },
        dataReliability: {
          type: 'object',
          properties: {
            sampleSize: { type: 'string' },
            statisticalPower: { type: 'string' },
            confidenceLevel: { type: 'string' }
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
  labels: ['agent', 'retention-analysis', 'quality-validation']
}));
