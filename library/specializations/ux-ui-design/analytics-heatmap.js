/**
 * @process specializations/ux-ui-design/analytics-heatmap
 * @description Analytics Integration and Heatmap Analysis process for comprehensive user behavior tracking,
 * heatmap generation, session replay analysis, funnel optimization, and data-driven UX insights using
 * analytics tools like Hotjar, Crazy Egg, Mixpanel, and Google Analytics.
 * @inputs { projectName: string, websiteUrl: string, analyticsTools?: array, trackingGoals?: array, businessMetrics?: object, conversionFunnels?: array }
 * @outputs { success: boolean, analyticsSetup: object, heatmapInsights: array, userBehaviorPatterns: array, optimizationRecommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/analytics-heatmap', {
 *   projectName: 'E-Commerce Website Optimization',
 *   websiteUrl: 'https://example.com',
 *   analyticsTools: ['Hotjar', 'Mixpanel', 'Google Analytics'],
 *   trackingGoals: ['User engagement', 'Conversion optimization', 'UX friction identification'],
 *   businessMetrics: { conversionRate: 2.5, bounceRate: 65, avgSessionDuration: '2:30' },
 *   conversionFunnels: ['Homepage → Product → Cart → Checkout', 'Landing Page → Signup']
 * });
 *
 * @references
 * - Hotjar Documentation: https://help.hotjar.com/
 * - Crazy Egg Heatmaps: https://www.crazyegg.com/heatmap
 * - Mixpanel Analytics: https://developer.mixpanel.com/docs
 * - Google Analytics: https://developers.google.com/analytics
 * - Heatmap Analysis Best Practices: https://www.nngroup.com/articles/heatmap-visualizations/
 * - Session Replay Ethics: https://www.nngroup.com/articles/session-replay/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    websiteUrl,
    analyticsTools = ['Hotjar', 'Google Analytics', 'Mixpanel'],
    trackingGoals = [],
    businessMetrics = {},
    conversionFunnels = [],
    keyPages = [],
    userSegments = [],
    trackingDuration = '2 weeks',
    outputDir = 'analytics-heatmap-output',
    minimumSampleSize = 1000,
    qualityScoreTarget = 85,
    privacyCompliance = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Analytics Integration and Heatmap Analysis for ${projectName}`);
  ctx.log('info', `Website: ${websiteUrl}`);
  ctx.log('info', `Analytics Tools: ${analyticsTools.join(', ')}`);

  // ============================================================================
  // PHASE 1: ANALYTICS REQUIREMENTS AND STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining analytics requirements and tracking strategy');
  const analyticsStrategy = await ctx.task(analyticsStrategyTask, {
    projectName,
    websiteUrl,
    analyticsTools,
    trackingGoals,
    businessMetrics,
    conversionFunnels,
    keyPages,
    userSegments,
    trackingDuration,
    privacyCompliance,
    outputDir
  });

  artifacts.push(...analyticsStrategy.artifacts);

  // Quality Gate: Strategy completeness
  const strategyCompleteness = analyticsStrategy.completenessScore || 0;
  if (strategyCompleteness < 70) {
    await ctx.breakpoint({
      question: `Analytics strategy completeness: ${strategyCompleteness}/100 (below threshold of 70). Review strategy and approve to continue?`,
      title: 'Analytics Strategy Review',
      context: {
        runId: ctx.runId,
        strategyCompleteness,
        trackingPlan: analyticsStrategy.trackingPlan,
        missingElements: analyticsStrategy.missingElements,
        recommendation: 'Consider defining more specific tracking goals and user segments'
      }
    });
  }

  // ============================================================================
  // PHASE 2: ANALYTICS TOOL SETUP AND INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up and integrating analytics tools');
  const toolSetup = await ctx.task(analyticsToolSetupTask, {
    projectName,
    websiteUrl,
    analyticsTools: analyticsStrategy.selectedTools,
    trackingPlan: analyticsStrategy.trackingPlan,
    privacyCompliance,
    outputDir
  });

  artifacts.push(...toolSetup.artifacts);

  // Quality Gate: Tool integration status
  if (!toolSetup.allToolsIntegrated) {
    await ctx.breakpoint({
      question: `${toolSetup.integratedTools.length}/${analyticsStrategy.selectedTools.length} analytics tools integrated successfully. Integration issues detected. Review and continue?`,
      title: 'Tool Integration Status',
      context: {
        runId: ctx.runId,
        integratedTools: toolSetup.integratedTools,
        failedTools: toolSetup.failedTools,
        integrationIssues: toolSetup.integrationIssues,
        files: toolSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: EVENT TRACKING IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing custom event tracking and tagging');
  const eventTracking = await ctx.task(eventTrackingImplementationTask, {
    projectName,
    websiteUrl,
    trackingPlan: analyticsStrategy.trackingPlan,
    conversionFunnels: analyticsStrategy.prioritizedFunnels,
    keyPages: analyticsStrategy.keyPages,
    toolSetup,
    outputDir
  });

  artifacts.push(...eventTracking.artifacts);

  // ============================================================================
  // PHASE 4: HEATMAP CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring heatmap tracking for key pages');
  const heatmapConfig = await ctx.task(heatmapConfigurationTask, {
    projectName,
    websiteUrl,
    keyPages: analyticsStrategy.keyPages,
    heatmapTools: toolSetup.heatmapTools,
    trackingDuration,
    minimumSampleSize,
    outputDir
  });

  artifacts.push(...heatmapConfig.artifacts);

  // ============================================================================
  // PHASE 5: SESSION RECORDING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up session recording and replay configuration');
  const sessionRecording = await ctx.task(sessionRecordingSetupTask, {
    projectName,
    websiteUrl,
    recordingTools: toolSetup.sessionReplayTools,
    userSegments: analyticsStrategy.targetSegments,
    privacyCompliance,
    recordingFilters: analyticsStrategy.recordingFilters,
    outputDir
  });

  artifacts.push(...sessionRecording.artifacts);

  // ============================================================================
  // PHASE 6: FUNNEL TRACKING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring conversion funnel tracking and analysis');
  const funnelTracking = await ctx.task(funnelTrackingSetupTask, {
    projectName,
    conversionFunnels: analyticsStrategy.prioritizedFunnels,
    eventTracking,
    analyticsTools: toolSetup.funnelTools,
    outputDir
  });

  artifacts.push(...funnelTracking.artifacts);

  // ============================================================================
  // PHASE 7: DATA COLLECTION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating analytics data collection and quality');
  const dataValidation = await ctx.task(dataCollectionValidationTask, {
    projectName,
    websiteUrl,
    toolSetup,
    eventTracking,
    heatmapConfig,
    sessionRecording,
    funnelTracking,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  // Quality Gate: Data quality
  const dataQualityScore = dataValidation.qualityScore;
  if (dataQualityScore < 80) {
    await ctx.breakpoint({
      question: `Data collection quality score: ${dataQualityScore}/100 (below threshold of 80). Data quality issues detected. Review and continue or fix issues?`,
      title: 'Data Quality Gate',
      context: {
        runId: ctx.runId,
        dataQualityScore,
        issues: dataValidation.issues,
        missingData: dataValidation.missingDataPoints,
        recommendation: 'Address critical data quality issues before proceeding with analysis',
        files: dataValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Breakpoint: Data collection period
  await ctx.breakpoint({
    question: `Analytics tools configured and validated. Data collection period: ${trackingDuration}. Proceed to data collection phase? (Note: In production, wait for sufficient data before analysis)`,
    title: 'Begin Data Collection Phase',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        toolsIntegrated: toolSetup.integratedTools.length,
        eventsTracked: eventTracking.totalEvents,
        heatmapPagesConfigured: heatmapConfig.configuredPages.length,
        funnelsConfigured: funnelTracking.configuredFunnels.length,
        dataQualityScore
      }
    }
  });

  // ============================================================================
  // PHASE 8: HEATMAP DATA COLLECTION AND GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Collecting heatmap data and generating visualizations');
  const heatmapGeneration = await ctx.task(heatmapGenerationTask, {
    projectName,
    websiteUrl,
    heatmapConfig,
    minimumSampleSize,
    outputDir
  });

  artifacts.push(...heatmapGeneration.artifacts);

  // Quality Gate: Sample size
  const sampleSizeAdequate = heatmapGeneration.totalSessions >= minimumSampleSize;
  if (!sampleSizeAdequate) {
    await ctx.breakpoint({
      question: `Heatmap sample size: ${heatmapGeneration.totalSessions} sessions (minimum: ${minimumSampleSize}). Sample size below threshold. Continue with available data or extend collection period?`,
      title: 'Heatmap Sample Size Review',
      context: {
        runId: ctx.runId,
        totalSessions: heatmapGeneration.totalSessions,
        minimumSampleSize,
        sessionsByPage: heatmapGeneration.sessionsByPage,
        recommendation: 'Larger sample sizes provide more reliable insights'
      }
    });
  }

  // ============================================================================
  // PHASE 9: HEATMAP ANALYSIS (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing heatmaps across different interaction types');

  // Analyze different heatmap types in parallel
  const heatmapAnalysisTasks = [
    () => ctx.task(clickHeatmapAnalysisTask, {
      projectName,
      heatmapData: heatmapGeneration.clickHeatmaps,
      keyPages: analyticsStrategy.keyPages,
      outputDir
    }),
    () => ctx.task(scrollHeatmapAnalysisTask, {
      projectName,
      heatmapData: heatmapGeneration.scrollHeatmaps,
      keyPages: analyticsStrategy.keyPages,
      outputDir
    }),
    () => ctx.task(moveHeatmapAnalysisTask, {
      projectName,
      heatmapData: heatmapGeneration.moveHeatmaps,
      keyPages: analyticsStrategy.keyPages,
      outputDir
    })
  ];

  const heatmapAnalysisResults = await ctx.parallel.all(heatmapAnalysisTasks);

  heatmapAnalysisResults.forEach(result => {
    artifacts.push(...(result.artifacts || []));
  });

  const heatmapInsights = {
    clickInsights: heatmapAnalysisResults[0].insights,
    scrollInsights: heatmapAnalysisResults[1].insights,
    moveInsights: heatmapAnalysisResults[2].insights
  };

  // ============================================================================
  // PHASE 10: SESSION REPLAY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 10: Analyzing session recordings for user behavior patterns');
  const sessionAnalysis = await ctx.task(sessionReplayAnalysisTask, {
    projectName,
    sessionRecording,
    userSegments: analyticsStrategy.targetSegments,
    conversionFunnels: analyticsStrategy.prioritizedFunnels,
    heatmapInsights,
    outputDir
  });

  artifacts.push(...sessionAnalysis.artifacts);

  // ============================================================================
  // PHASE 11: FUNNEL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 11: Analyzing conversion funnels and drop-off points');
  const funnelAnalysis = await ctx.task(funnelAnalysisTask, {
    projectName,
    funnelTracking,
    sessionAnalysis,
    heatmapInsights,
    businessMetrics,
    outputDir
  });

  artifacts.push(...funnelAnalysis.artifacts);

  // ============================================================================
  // PHASE 12: USER BEHAVIOR PATTERN IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Identifying user behavior patterns and segmentation');
  const behaviorPatterns = await ctx.task(behaviorPatternAnalysisTask, {
    projectName,
    heatmapInsights,
    sessionAnalysis,
    funnelAnalysis,
    userSegments: analyticsStrategy.targetSegments,
    eventTracking,
    outputDir
  });

  artifacts.push(...behaviorPatterns.artifacts);

  // ============================================================================
  // PHASE 13: ENGAGEMENT METRICS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 13: Analyzing user engagement metrics and interactions');
  const engagementAnalysis = await ctx.task(engagementMetricsAnalysisTask, {
    projectName,
    websiteUrl,
    toolSetup,
    eventTracking,
    behaviorPatterns,
    businessMetrics,
    outputDir
  });

  artifacts.push(...engagementAnalysis.artifacts);

  // ============================================================================
  // PHASE 14: UX FRICTION IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Identifying UX friction points and usability issues');
  const frictionAnalysis = await ctx.task(uxFrictionIdentificationTask, {
    projectName,
    heatmapInsights,
    sessionAnalysis,
    funnelAnalysis,
    behaviorPatterns,
    engagementAnalysis,
    outputDir
  });

  artifacts.push(...frictionAnalysis.artifacts);

  // ============================================================================
  // PHASE 15: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating data-driven optimization recommendations');
  const optimizationRecommendations = await ctx.task(optimizationRecommendationsTask, {
    projectName,
    analyticsStrategy,
    heatmapInsights,
    sessionAnalysis,
    funnelAnalysis,
    behaviorPatterns,
    engagementAnalysis,
    frictionAnalysis,
    businessMetrics,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // ============================================================================
  // PHASE 16: A/B TEST PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 16: Planning A/B tests based on analytics insights');
  const abTestPlanning = await ctx.task(abTestPlanningTask, {
    projectName,
    optimizationRecommendations,
    frictionAnalysis,
    funnelAnalysis,
    businessMetrics,
    outputDir
  });

  artifacts.push(...abTestPlanning.artifacts);

  // ============================================================================
  // PHASE 17: COMPREHENSIVE INSIGHTS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 17: Generating comprehensive analytics and insights report');
  const insightsReport = await ctx.task(insightsReportGenerationTask, {
    projectName,
    websiteUrl,
    analyticsStrategy,
    toolSetup,
    heatmapGeneration,
    heatmapInsights,
    sessionAnalysis,
    funnelAnalysis,
    behaviorPatterns,
    engagementAnalysis,
    frictionAnalysis,
    optimizationRecommendations,
    abTestPlanning,
    businessMetrics,
    outputDir
  });

  artifacts.push(...insightsReport.artifacts);

  // ============================================================================
  // PHASE 18: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 18: Scoring analysis quality and validating insights');
  const qualityScoring = await ctx.task(qualityScoringTask, {
    projectName,
    analyticsStrategy,
    heatmapGeneration,
    heatmapInsights,
    sessionAnalysis,
    funnelAnalysis,
    behaviorPatterns,
    optimizationRecommendations,
    insightsReport,
    qualityScoreTarget,
    minimumSampleSize,
    outputDir
  });

  artifacts.push(...qualityScoring.artifacts);

  const qualityScore = qualityScoring.overallQualityScore;
  const qualityMet = qualityScore >= qualityScoreTarget;

  // Final Breakpoint: Analysis Review and Approval
  await ctx.breakpoint({
    question: `Analytics Integration and Heatmap Analysis complete for ${projectName}. Quality Score: ${qualityScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need additional data or refinement.'} Review insights and approve?`,
    title: 'Final Analytics Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        qualityScore,
        qualityMet,
        toolsIntegrated: toolSetup.integratedTools.length,
        totalSessions: heatmapGeneration.totalSessions,
        pagesAnalyzed: heatmapGeneration.sessionsByPage.length,
        funnelsAnalyzed: funnelAnalysis.analyzedFunnels,
        criticalInsights: optimizationRecommendations.criticalRecommendations.length,
        totalRecommendations: optimizationRecommendations.recommendations.length,
        abTestsPlanned: abTestPlanning.plannedTests.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    websiteUrl,
    qualityScore,
    qualityMet,
    analyticsSetup: {
      toolsIntegrated: toolSetup.integratedTools,
      trackingImplemented: eventTracking.totalEvents,
      funnelsConfigured: funnelTracking.configuredFunnels.length,
      heatmapPagesConfigured: heatmapConfig.configuredPages.length,
      privacyCompliant: toolSetup.privacyCompliant
    },
    dataCollection: {
      trackingDuration,
      totalSessions: heatmapGeneration.totalSessions,
      sampleSizeAdequate,
      dataQualityScore,
      pagesAnalyzed: heatmapGeneration.sessionsByPage.length
    },
    heatmapInsights: {
      clickHeatmaps: heatmapInsights.clickInsights.length,
      scrollHeatmaps: heatmapInsights.scrollInsights.length,
      moveHeatmaps: heatmapInsights.moveInsights.length,
      keyFindings: [
        ...heatmapInsights.clickInsights.slice(0, 5),
        ...heatmapInsights.scrollInsights.slice(0, 5),
        ...heatmapInsights.moveInsights.slice(0, 5)
      ]
    },
    sessionAnalysis: {
      sessionsAnalyzed: sessionAnalysis.sessionsAnalyzed,
      behaviorPatterns: sessionAnalysis.patterns.length,
      usabilityIssues: sessionAnalysis.usabilityIssues.length,
      keyFindings: sessionAnalysis.keyFindings
    },
    funnelAnalysis: {
      funnelsAnalyzed: funnelAnalysis.analyzedFunnels,
      averageConversionRate: funnelAnalysis.averageConversionRate,
      dropoffPoints: funnelAnalysis.criticalDropoffPoints.length,
      conversionImprovementPotential: funnelAnalysis.improvementPotential
    },
    userBehaviorPatterns: {
      totalPatterns: behaviorPatterns.identifiedPatterns.length,
      userSegments: behaviorPatterns.segmentProfiles.length,
      topPatterns: behaviorPatterns.identifiedPatterns.slice(0, 10),
      engagementMetrics: engagementAnalysis.metrics
    },
    uxFriction: {
      frictionPoints: frictionAnalysis.frictionPoints.length,
      criticalIssues: frictionAnalysis.criticalIssues.length,
      impactAssessment: frictionAnalysis.impactAssessment,
      prioritizedIssues: frictionAnalysis.prioritizedIssues.slice(0, 10)
    },
    optimizationRecommendations: {
      totalRecommendations: optimizationRecommendations.recommendations.length,
      criticalRecommendations: optimizationRecommendations.criticalRecommendations,
      quickWins: optimizationRecommendations.quickWins,
      longTermInitiatives: optimizationRecommendations.longTermInitiatives,
      estimatedImpact: optimizationRecommendations.estimatedImpact
    },
    abTestPlanning: {
      plannedTests: abTestPlanning.plannedTests.length,
      priorityTests: abTestPlanning.priorityTests,
      estimatedTimeframe: abTestPlanning.estimatedTimeframe,
      resourceRequirements: abTestPlanning.resourceRequirements
    },
    businessImpact: {
      currentMetrics: businessMetrics,
      projectedImprovements: optimizationRecommendations.projectedImprovements,
      roi: optimizationRecommendations.estimatedROI
    },
    artifacts,
    documentation: {
      insightsReportPath: insightsReport.reportPath,
      executiveSummaryPath: insightsReport.executiveSummaryPath,
      heatmapReportPath: insightsReport.heatmapReportPath,
      recommendationsPath: insightsReport.recommendationsPath
    },
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/analytics-heatmap',
      timestamp: startTime,
      version: '1.0.0',
      projectName,
      websiteUrl,
      analyticsTools,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Analytics Strategy
export const analyticsStrategyTask = defineTask('analytics-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define analytics requirements and tracking strategy',
  agent: {
    name: 'analytics-strategist',
    prompt: {
      role: 'Senior Analytics Strategist and UX Researcher with expertise in digital analytics',
      task: 'Develop comprehensive analytics and heatmap tracking strategy',
      context: args,
      instructions: [
        'Review project goals and define specific tracking objectives',
        'Assess provided tracking goals and refine into measurable KPIs',
        'Evaluate business metrics and identify improvement opportunities',
        'Prioritize conversion funnels based on business impact',
        'Identify key pages for heatmap analysis (homepage, landing pages, checkout, high-traffic)',
        'Define user segments for targeted analysis',
        'Select optimal analytics tools from provided list based on capabilities',
        'Create comprehensive tracking plan: events, page views, interactions, custom dimensions',
        'Define data privacy and compliance requirements (GDPR, CCPA)',
        'Specify minimum sample sizes for statistical significance',
        'Identify tracking gaps and missing elements',
        'Estimate tracking duration for reliable data',
        'Calculate strategy completeness score (0-100)',
        'Generate detailed analytics strategy document'
      ],
      outputFormat: 'JSON with selectedTools, trackingPlan, prioritizedFunnels, keyPages, targetSegments, completenessScore, missingElements, recordingFilters, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTools', 'trackingPlan', 'completenessScore', 'artifacts'],
      properties: {
        selectedTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              capabilities: { type: 'array', items: { type: 'string' } },
              integrationPriority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        trackingPlan: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  eventName: { type: 'string' },
                  category: { type: 'string' },
                  triggerCondition: { type: 'string' },
                  properties: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                }
              }
            },
            pageViews: { type: 'array', items: { type: 'string' } },
            customDimensions: { type: 'array' }
          }
        },
        prioritizedFunnels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              funnelName: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' },
              businessImpact: { type: 'string' },
              currentConversionRate: { type: 'number' }
            }
          }
        },
        keyPages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              pageName: { type: 'string' },
              pageType: { type: 'string', enum: ['homepage', 'landing', 'product', 'checkout', 'high-traffic', 'conversion'] },
              heatmapTypes: { type: 'array', items: { type: 'string', enum: ['click', 'scroll', 'move', 'attention'] } },
              priority: { type: 'string' }
            }
          }
        },
        targetSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              criteria: { type: 'string' },
              size: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        missingElements: { type: 'array', items: { type: 'string' } },
        recordingFilters: {
          type: 'object',
          properties: {
            includedPages: { type: 'array', items: { type: 'string' } },
            excludedPages: { type: 'array', items: { type: 'string' } },
            userSegments: { type: 'array', items: { type: 'string' } },
            samplingRate: { type: 'number' }
          }
        },
        privacyRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'strategy']
}));

// Task 2: Analytics Tool Setup
export const analyticsToolSetupTask = defineTask('analytics-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up and integrate analytics tools',
  agent: {
    name: 'analytics-engineer',
    prompt: {
      role: 'Analytics Implementation Engineer with expertise in Hotjar, Mixpanel, Google Analytics',
      task: 'Integrate and configure analytics tools for comprehensive tracking',
      context: args,
      instructions: [
        'For each selected tool, create implementation plan',
        'Generate tracking code snippets and installation instructions',
        'Configure Hotjar: heatmaps, session recordings, surveys, feedback polls',
        'Configure Crazy Egg (if selected): heatmaps, scrollmaps, confetti reports, overlays',
        'Configure Mixpanel (if selected): event tracking, user profiles, funnels, cohorts',
        'Configure Google Analytics: pageviews, events, enhanced e-commerce, user-ID tracking',
        'Set up cross-domain tracking if needed',
        'Implement privacy controls: cookie consent, data anonymization, opt-out mechanisms',
        'Configure user identification and session tracking',
        'Set up data retention policies per privacy requirements',
        'Verify GDPR/CCPA compliance features',
        'Test tool integration on staging environment',
        'Document integration steps and configuration',
        'Identify successfully integrated vs failed tools',
        'Generate tool setup documentation and tracking code'
      ],
      outputFormat: 'JSON with integratedTools, failedTools, integrationIssues, heatmapTools, sessionReplayTools, funnelTools, privacyCompliant, allToolsIntegrated, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedTools', 'allToolsIntegrated', 'privacyCompliant', 'artifacts'],
      properties: {
        integratedTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              version: { type: 'string' },
              trackingCode: { type: 'string' },
              configurationStatus: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        failedTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              reason: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        integrationIssues: { type: 'array', items: { type: 'string' } },
        heatmapTools: { type: 'array', items: { type: 'string' } },
        sessionReplayTools: { type: 'array', items: { type: 'string' } },
        funnelTools: { type: 'array', items: { type: 'string' } },
        privacyCompliant: { type: 'boolean' },
        privacyFeatures: {
          type: 'object',
          properties: {
            cookieConsent: { type: 'boolean' },
            dataAnonymization: { type: 'boolean' },
            optOutMechanism: { type: 'boolean' },
            gdprCompliant: { type: 'boolean' },
            ccpaCompliant: { type: 'boolean' }
          }
        },
        allToolsIntegrated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'tool-setup', 'integration']
}));

// Task 3: Event Tracking Implementation
export const eventTrackingImplementationTask = defineTask('event-tracking-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement custom event tracking and tagging',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'Analytics Tracking Specialist with expertise in event instrumentation',
      task: 'Implement comprehensive event tracking based on tracking plan',
      context: args,
      instructions: [
        'Review tracking plan and identify all events to implement',
        'Categorize events: clicks, form interactions, page scrolls, video plays, downloads, custom actions',
        'Implement click event tracking for buttons, links, CTAs',
        'Implement form tracking: field interactions, submissions, abandonment',
        'Implement scroll depth tracking (25%, 50%, 75%, 100%)',
        'Implement video engagement tracking (play, pause, completion)',
        'Implement e-commerce tracking: product views, add-to-cart, checkout steps',
        'Implement custom business events per tracking plan',
        'Add event properties and custom dimensions',
        'Implement dataLayer for Google Tag Manager (if used)',
        'Set up enhanced e-commerce tracking',
        'Implement conversion funnel step tracking',
        'Validate event firing with browser dev tools and analytics debugger',
        'Document event tracking implementation',
        'Generate event tracking code snippets and GTM tags'
      ],
      outputFormat: 'JSON with implementedEvents, totalEvents, eventsByCategory, conversionEvents, trackingCode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedEvents', 'totalEvents', 'artifacts'],
      properties: {
        implementedEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              category: { type: 'string' },
              trigger: { type: 'string' },
              properties: { type: 'array', items: { type: 'string' } },
              implementationMethod: { type: 'string' },
              validated: { type: 'boolean' }
            }
          }
        },
        totalEvents: { type: 'number' },
        eventsByCategory: {
          type: 'object',
          properties: {
            click: { type: 'number' },
            form: { type: 'number' },
            scroll: { type: 'number' },
            video: { type: 'number' },
            ecommerce: { type: 'number' },
            custom: { type: 'number' }
          }
        },
        conversionEvents: { type: 'array', items: { type: 'string' } },
        trackingCode: { type: 'string' },
        gtmTags: { type: 'array' },
        validationResults: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'analytics-heatmap', 'event-tracking']
}));

// Task 4: Heatmap Configuration
export const heatmapConfigurationTask = defineTask('heatmap-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure heatmap tracking for key pages',
  agent: {
    name: 'heatmap-specialist',
    prompt: {
      role: 'Heatmap Analysis Specialist',
      task: 'Configure comprehensive heatmap tracking for key pages',
      context: args,
      instructions: [
        'Review key pages and configure heatmap tracking for each',
        'Set up click heatmaps: track where users click, identify dead clicks',
        'Set up scroll heatmaps: track how far users scroll, identify fold points',
        'Set up move heatmaps: track mouse movement, attention areas',
        'Set up attention heatmaps: aggregate time spent viewing areas',
        'Configure device-specific heatmaps (desktop, tablet, mobile)',
        'Set up heatmap segmentation by traffic source, user type, geography',
        'Configure minimum sample size per page for statistical significance',
        'Set up heatmap snapshot capture at regular intervals',
        'Configure dynamic content handling in heatmaps',
        'Set collection duration per tracking plan',
        'Validate heatmap configuration across browsers and devices',
        'Document heatmap configuration per page',
        'Generate heatmap setup guide'
      ],
      outputFormat: 'JSON with configuredPages, heatmapTypes, deviceSegments, collectionSettings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuredPages', 'heatmapTypes', 'artifacts'],
      properties: {
        configuredPages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              pageName: { type: 'string' },
              heatmapTypes: { type: 'array', items: { type: 'string' } },
              sampleSize: { type: 'number' },
              collectionDuration: { type: 'string' },
              segments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        heatmapTypes: {
          type: 'array',
          items: { type: 'string', enum: ['click', 'scroll', 'move', 'attention'] }
        },
        deviceSegments: {
          type: 'array',
          items: { type: 'string', enum: ['desktop', 'tablet', 'mobile'] }
        },
        collectionSettings: {
          type: 'object',
          properties: {
            minimumSampleSize: { type: 'number' },
            collectionDuration: { type: 'string' },
            snapshotFrequency: { type: 'string' }
          }
        },
        segmentation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentType: { type: 'string' },
              values: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'analytics-heatmap', 'heatmap-configuration']
}));

// Task 5: Session Recording Setup
export const sessionRecordingSetupTask = defineTask('session-recording-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up session recording and replay configuration',
  agent: {
    name: 'session-recording-specialist',
    prompt: {
      role: 'Session Recording and Privacy Specialist',
      task: 'Configure ethical session recording with privacy protections',
      context: args,
      instructions: [
        'Configure session replay tools (Hotjar, FullStory, etc.)',
        'Set up recording filters based on recording strategy',
        'Configure user segment targeting for recordings',
        'Implement privacy protections: mask sensitive data (passwords, credit cards, PII)',
        'Set up rage click detection (repeated frustrated clicks)',
        'Set up u-turn detection (users going back)',
        'Configure recording triggers: errors, conversion events, specific pages',
        'Set recording sampling rate to balance data vs performance',
        'Configure recording length limits',
        'Set up recording tagging and categorization',
        'Implement opt-out mechanism for privacy',
        'Configure data retention policy',
        'Ensure GDPR/CCPA compliance for recordings',
        'Validate privacy masking and recording quality',
        'Document session recording configuration and privacy measures'
      ],
      outputFormat: 'JSON with recordingConfiguration, privacyMeasures, triggers, samplingRate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recordingConfiguration', 'privacyMeasures', 'artifacts'],
      properties: {
        recordingConfiguration: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            recordedPages: { type: 'array', items: { type: 'string' } },
            userSegments: { type: 'array', items: { type: 'string' } },
            samplingRate: { type: 'number' },
            recordingLength: { type: 'string' },
            storageRetention: { type: 'string' }
          }
        },
        privacyMeasures: {
          type: 'object',
          properties: {
            dataMasking: { type: 'boolean' },
            maskedFields: { type: 'array', items: { type: 'string' } },
            optOutAvailable: { type: 'boolean' },
            gdprCompliant: { type: 'boolean' },
            ccpaCompliant: { type: 'boolean' },
            privacyPolicy: { type: 'string' }
          }
        },
        triggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              triggerType: { type: 'string', enum: ['rage-click', 'u-turn', 'error', 'conversion', 'page-specific'] },
              condition: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        samplingRate: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'session-recording', 'privacy']
}));

// Task 6: Funnel Tracking Setup
export const funnelTrackingSetupTask = defineTask('funnel-tracking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure conversion funnel tracking',
  agent: {
    name: 'funnel-analyst',
    prompt: {
      role: 'Conversion Funnel Specialist',
      task: 'Set up comprehensive conversion funnel tracking and analysis',
      context: args,
      instructions: [
        'Review prioritized conversion funnels from strategy',
        'For each funnel, identify and configure tracking for each step',
        'Map funnel steps to specific events and pageviews',
        'Configure funnel visualization in analytics tools',
        'Set up drop-off point tracking between steps',
        'Configure time-to-conversion tracking',
        'Set up multi-device funnel tracking',
        'Configure cohort analysis for funnels',
        'Set up segment-based funnel analysis',
        'Configure funnel goal and conversion tracking',
        'Set up funnel abandonment alerts',
        'Define success metrics per funnel',
        'Validate funnel tracking implementation',
        'Document funnel configuration and analysis approach'
      ],
      outputFormat: 'JSON with configuredFunnels, funnelSteps, conversionGoals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuredFunnels', 'artifacts'],
      properties: {
        configuredFunnels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              funnelName: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stepNumber: { type: 'number' },
                    stepName: { type: 'string' },
                    trackingEvent: { type: 'string' },
                    pageUrl: { type: 'string' }
                  }
                }
              },
              tool: { type: 'string' },
              conversionGoal: { type: 'string' },
              expectedConversionRate: { type: 'number' }
            }
          }
        },
        funnelSteps: { type: 'number' },
        conversionGoals: { type: 'array', items: { type: 'string' } },
        trackingValidation: {
          type: 'object',
          properties: {
            allFunnelsValid: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'analytics-heatmap', 'funnel-tracking']
}));

// Task 7: Data Collection Validation
export const dataCollectionValidationTask = defineTask('data-collection-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate analytics data collection quality',
  agent: {
    name: 'qa-analyst',
    prompt: {
      role: 'Analytics QA Specialist',
      task: 'Validate all analytics tracking implementation and data quality',
      context: args,
      instructions: [
        'Test analytics tool integration on staging/test environment',
        'Verify event tracking fires correctly for all implemented events',
        'Test heatmap data collection on configured pages',
        'Verify session recording captures properly with privacy masking',
        'Test funnel tracking flows end-to-end',
        'Validate cross-device and cross-browser tracking',
        'Check for tracking conflicts or duplicate events',
        'Verify data privacy compliance (PII masking, consent)',
        'Test tracking under different network conditions',
        'Validate data accuracy: compare analytics data with server logs',
        'Check for common implementation errors: missing tags, broken events',
        'Verify custom dimensions and properties',
        'Identify missing data points and gaps',
        'Calculate overall data quality score (0-100)',
        'Document validation results and issues'
      ],
      outputFormat: 'JSON with qualityScore, validationResults, issues, missingDataPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'validationResults', 'artifacts'],
      properties: {
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        validationResults: {
          type: 'object',
          properties: {
            toolIntegration: { type: 'boolean' },
            eventTracking: { type: 'boolean' },
            heatmaps: { type: 'boolean' },
            sessionRecording: { type: 'boolean' },
            funnels: { type: 'boolean' },
            privacy: { type: 'boolean' },
            crossBrowser: { type: 'boolean' },
            dataAccuracy: { type: 'boolean' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        missingDataPoints: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'validation', 'qa']
}));

// Task 8: Heatmap Generation
export const heatmapGenerationTask = defineTask('heatmap-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and generate heatmap visualizations',
  agent: {
    name: 'heatmap-generator',
    prompt: {
      role: 'Heatmap Data Analyst',
      task: 'Generate comprehensive heatmap visualizations from collected data',
      context: args,
      instructions: [
        'Collect heatmap data from configured tools and pages',
        'Verify sufficient sample size per page (minimum threshold)',
        'Generate click heatmaps showing click frequency and locations',
        'Generate scroll heatmaps showing scroll depth distribution',
        'Generate move heatmaps showing cursor movement patterns',
        'Generate attention heatmaps aggregating engagement time',
        'Create device-specific heatmaps (desktop vs mobile)',
        'Generate segment-specific heatmaps (traffic source, user type)',
        'Create heatmap overlays on actual page screenshots',
        'Calculate heatmap statistics: engagement zones, dead zones, fold points',
        'Export heatmap data in multiple formats (images, data files)',
        'Document collection period and sample sizes',
        'Generate heatmap gallery with annotations'
      ],
      outputFormat: 'JSON with clickHeatmaps, scrollHeatmaps, moveHeatmaps, totalSessions, sessionsByPage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clickHeatmaps', 'scrollHeatmaps', 'moveHeatmaps', 'totalSessions', 'artifacts'],
      properties: {
        clickHeatmaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              pageName: { type: 'string' },
              sessions: { type: 'number' },
              heatmapPath: { type: 'string' },
              dataPath: { type: 'string' },
              topClickAreas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scrollHeatmaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              pageName: { type: 'string' },
              sessions: { type: 'number' },
              heatmapPath: { type: 'string' },
              averageFold: { type: 'string' },
              scrollDepthDistribution: { type: 'object' }
            }
          }
        },
        moveHeatmaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              pageName: { type: 'string' },
              sessions: { type: 'number' },
              heatmapPath: { type: 'string' },
              attentionAreas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalSessions: { type: 'number' },
        sessionsByPage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              sessions: { type: 'number' },
              devices: { type: 'object' }
            }
          }
        },
        collectionPeriod: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            duration: { type: 'string' }
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
  labels: ['agent', 'analytics-heatmap', 'heatmap-generation']
}));

// Task 9: Click Heatmap Analysis
export const clickHeatmapAnalysisTask = defineTask('click-heatmap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze click heatmaps for interaction patterns',
  agent: {
    name: 'click-analyst',
    prompt: {
      role: 'UX Analyst specializing in click behavior analysis',
      task: 'Analyze click heatmaps to identify interaction patterns and usability issues',
      context: args,
      instructions: [
        'Analyze click heatmaps for each key page',
        'Identify high-click areas: buttons, links, CTAs that get most engagement',
        'Identify low-click areas: important elements being ignored',
        'Detect rage clicks: repeated frustrated clicks indicating confusion',
        'Identify dead clicks: clicks on non-interactive elements (false affordances)',
        'Analyze CTA effectiveness: click rates on primary vs secondary CTAs',
        'Compare click patterns across devices (desktop vs mobile)',
        'Identify click distribution: focused vs scattered',
        'Detect navigation issues: difficulty finding key actions',
        'Analyze click patterns in conversion funnels',
        'Identify distractions: clicks away from conversion path',
        'Compare actual clicks vs expected behavior',
        'Generate actionable insights per page',
        'Prioritize insights by impact on user experience and business goals'
      ],
      outputFormat: 'JSON with insights (array), highClickAreas, lowClickAreas, rageClicks, deadClicks, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              insight: { type: 'string' },
              category: { type: 'string', enum: ['high-engagement', 'low-engagement', 'rage-click', 'dead-click', 'cta-performance', 'navigation'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              evidence: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        highClickAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              element: { type: 'string' },
              clickRate: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        lowClickAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              element: { type: 'string' },
              expectedClicks: { type: 'string' },
              actualClicks: { type: 'number' },
              issue: { type: 'string' }
            }
          }
        },
        rageClicks: { type: 'array' },
        deadClicks: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'click-analysis']
}));

// Task 10: Scroll Heatmap Analysis
export const scrollHeatmapAnalysisTask = defineTask('scroll-heatmap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze scroll heatmaps for engagement depth',
  agent: {
    name: 'scroll-analyst',
    prompt: {
      role: 'Content Engagement Analyst',
      task: 'Analyze scroll heatmaps to understand content engagement and page layout effectiveness',
      context: args,
      instructions: [
        'Analyze scroll heatmaps for each key page',
        'Identify average fold: where most users stop scrolling',
        'Calculate scroll depth percentages (25%, 50%, 75%, 100%)',
        'Identify content visibility: which sections get seen vs missed',
        'Detect scroll abandonment points: where users stop reading',
        'Analyze page length effectiveness: is content too long/short?',
        'Identify prime content areas: sections with high scroll engagement',
        'Detect buried content: important information below the fold',
        'Compare scroll behavior across devices',
        'Analyze scroll speed: rushed vs careful reading',
        'Identify scroll-back behavior: content worth revisiting',
        'Detect scroll fatigue: declining engagement with page length',
        'Recommend content restructuring and prioritization',
        'Suggest optimal page length and content placement'
      ],
      outputFormat: 'JSON with insights, scrollDepthAnalysis, foldAnalysis, contentVisibility, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'scrollDepthAnalysis', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              insight: { type: 'string' },
              category: { type: 'string', enum: ['scroll-depth', 'abandonment', 'content-visibility', 'page-length', 'engagement'] },
              severity: { type: 'string' },
              data: { type: 'object' },
              recommendation: { type: 'string' }
            }
          }
        },
        scrollDepthAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              depth25: { type: 'number' },
              depth50: { type: 'number' },
              depth75: { type: 'number' },
              depth100: { type: 'number' },
              averageFold: { type: 'string' }
            }
          }
        },
        foldAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              foldLocation: { type: 'string' },
              aboveFoldContent: { type: 'string' },
              belowFoldContent: { type: 'string' },
              foldEngagement: { type: 'number' }
            }
          }
        },
        contentVisibility: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'scroll-analysis']
}));

// Task 11: Move Heatmap Analysis
export const moveHeatmapAnalysisTask = defineTask('move-heatmap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze mouse movement heatmaps for attention patterns',
  agent: {
    name: 'attention-analyst',
    prompt: {
      role: 'Attention Pattern Specialist',
      task: 'Analyze mouse movement heatmaps to understand user attention and reading patterns',
      context: args,
      instructions: [
        'Analyze move heatmaps showing cursor movement patterns',
        'Identify attention hotspots: areas with highest cursor activity',
        'Detect reading patterns: F-pattern, Z-pattern, layer-cake pattern',
        'Identify visual hierarchy effectiveness based on attention flow',
        'Detect distractions: unexpected attention areas',
        'Analyze headline and CTA visibility in attention patterns',
        'Identify ignored elements: low attention areas',
        'Compare attention patterns across page sections',
        'Detect confusion indicators: erratic cursor movement',
        'Analyze attention-to-click correlation',
        'Identify optimal content placement based on attention',
        'Compare attention patterns across devices',
        'Validate design assumptions against actual attention',
        'Recommend design changes to guide attention'
      ],
      outputFormat: 'JSON with insights, attentionHotspots, readingPatterns, ignoredAreas, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'attentionHotspots', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              insight: { type: 'string' },
              category: { type: 'string', enum: ['attention', 'reading-pattern', 'visual-hierarchy', 'distraction', 'confusion'] },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        attentionHotspots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              element: { type: 'string' },
              attentionScore: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        readingPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageUrl: { type: 'string' },
              pattern: { type: 'string', enum: ['F-pattern', 'Z-pattern', 'layer-cake', 'spotted', 'commitment'] },
              description: { type: 'string' }
            }
          }
        },
        ignoredAreas: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'move-analysis', 'attention']
}));

// Task 12: Session Replay Analysis
export const sessionReplayAnalysisTask = defineTask('session-replay-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze session recordings for behavior insights',
  agent: {
    name: 'session-analyst',
    prompt: {
      role: 'Session Replay Analysis Expert',
      task: 'Analyze session recordings to identify user behavior patterns and usability issues',
      context: args,
      instructions: [
        'Review sample of session recordings across user segments',
        'Focus on high-value sessions: conversions, drop-offs, errors, rage clicks',
        'Identify common user paths and navigation patterns',
        'Detect usability issues: confusion, hesitation, errors, dead ends',
        'Analyze form interactions: field abandonment, error corrections',
        'Identify mobile-specific behaviors and issues',
        'Detect technical issues: broken functionality, slow loading',
        'Analyze user intent vs actual behavior mismatches',
        'Identify workarounds users employ for poor UX',
        'Compare behavior across different user segments',
        'Quantify patterns: frequency of specific behaviors',
        'Extract specific examples illustrating key issues',
        'Correlate session insights with heatmap findings',
        'Generate prioritized list of usability issues with evidence'
      ],
      outputFormat: 'JSON with sessionsAnalyzed, patterns, usabilityIssues, keyFindings, videoExamples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sessionsAnalyzed', 'patterns', 'keyFindings', 'artifacts'],
      properties: {
        sessionsAnalyzed: { type: 'number' },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'number' },
              userSegments: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        usabilityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              pageUrl: { type: 'string' },
              frequency: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              userImpact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              category: { type: 'string' },
              evidence: { type: 'string' },
              businessImpact: { type: 'string' }
            }
          }
        },
        videoExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              description: { type: 'string' },
              timestamp: { type: 'string' },
              illustrates: { type: 'string' }
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
  labels: ['agent', 'analytics-heatmap', 'session-analysis']
}));

// Task 13: Funnel Analysis
export const funnelAnalysisTask = defineTask('funnel-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze conversion funnels and drop-off points',
  agent: {
    name: 'conversion-analyst',
    prompt: {
      role: 'Conversion Optimization Specialist',
      task: 'Analyze conversion funnels to identify optimization opportunities',
      context: args,
      instructions: [
        'Analyze each configured conversion funnel',
        'Calculate conversion rate for each funnel step',
        'Identify critical drop-off points between steps',
        'Analyze drop-off reasons using session replays and heatmaps',
        'Calculate time-to-conversion per funnel',
        'Compare funnel performance across user segments',
        'Identify abandoned funnel patterns',
        'Analyze micro-conversions within steps',
        'Compare actual vs expected conversion rates',
        'Identify friction points preventing conversion',
        'Analyze device-specific conversion differences',
        'Calculate funnel improvement potential',
        'Prioritize funnel optimizations by impact',
        'Generate funnel optimization recommendations'
      ],
      outputFormat: 'JSON with analyzedFunnels, averageConversionRate, criticalDropoffPoints, improvementPotential, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedFunnels', 'averageConversionRate', 'criticalDropoffPoints', 'artifacts'],
      properties: {
        analyzedFunnels: { type: 'number' },
        funnelData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              funnelName: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stepName: { type: 'string' },
                    enteredStep: { type: 'number' },
                    completedStep: { type: 'number' },
                    dropOffRate: { type: 'number' },
                    avgTimeOnStep: { type: 'string' }
                  }
                }
              },
              overallConversionRate: { type: 'number' },
              completions: { type: 'number' }
            }
          }
        },
        averageConversionRate: { type: 'number' },
        criticalDropoffPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              funnelName: { type: 'string' },
              fromStep: { type: 'string' },
              toStep: { type: 'string' },
              dropOffRate: { type: 'number' },
              usersLost: { type: 'number' },
              reasons: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        improvementPotential: {
          type: 'object',
          properties: {
            currentConversions: { type: 'number' },
            potentialConversions: { type: 'number' },
            estimatedLift: { type: 'string' },
            revenueImpact: { type: 'string' }
          }
        },
        segmentAnalysis: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'funnel-analysis', 'conversion']
}));

// Task 14: Behavior Pattern Analysis
export const behaviorPatternAnalysisTask = defineTask('behavior-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify user behavior patterns and segmentation',
  agent: {
    name: 'behavior-analyst',
    prompt: {
      role: 'Behavioral Analytics Specialist',
      task: 'Identify and analyze user behavior patterns across all data sources',
      context: args,
      instructions: [
        'Aggregate insights from heatmaps, sessions, funnels, and events',
        'Identify common user behavior patterns',
        'Segment users by behavior: engaged, explorers, converters, bouncers',
        'Analyze navigation patterns and user flows',
        'Identify content consumption patterns',
        'Detect purchase behavior patterns (for e-commerce)',
        'Analyze feature usage patterns',
        'Identify mobile vs desktop behavior differences',
        'Detect time-based patterns (day/time preferences)',
        'Analyze returning vs new user behaviors',
        'Identify power user behaviors and workflows',
        'Detect struggling user patterns',
        'Create behavior-based user segments',
        'Profile each segment with characteristics and needs',
        'Generate behavioral insights and segment recommendations'
      ],
      outputFormat: 'JSON with identifiedPatterns, segmentProfiles, navigationFlows, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedPatterns', 'segmentProfiles', 'artifacts'],
      properties: {
        identifiedPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              patternName: { type: 'string' },
              description: { type: 'string' },
              frequency: { type: 'string' },
              userPercentage: { type: 'number' },
              characteristics: { type: 'array', items: { type: 'string' } },
              businessValue: { type: 'string' }
            }
          }
        },
        segmentProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              size: { type: 'string' },
              behaviors: { type: 'array', items: { type: 'string' } },
              goals: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              conversionRate: { type: 'number' },
              optimizationOpportunity: { type: 'string' }
            }
          }
        },
        navigationFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              flowName: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'number' },
              outcome: { type: 'string' }
            }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'behavior-patterns', 'segmentation']
}));

// Task 15: Engagement Metrics Analysis
export const engagementMetricsAnalysisTask = defineTask('engagement-metrics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze user engagement metrics',
  agent: {
    name: 'engagement-analyst',
    prompt: {
      role: 'Engagement Metrics Analyst',
      task: 'Analyze comprehensive user engagement metrics and interaction data',
      context: args,
      instructions: [
        'Collect engagement metrics from analytics tools',
        'Calculate key metrics: bounce rate, session duration, pages per session',
        'Analyze event engagement rates',
        'Calculate feature adoption and usage metrics',
        'Analyze content engagement: time on page, scroll depth, interactions',
        'Calculate engagement score per user segment',
        'Identify highly engaged vs disengaged users',
        'Analyze engagement trends over time',
        'Compare engagement across traffic sources',
        'Identify engagement drivers and inhibitors',
        'Analyze mobile vs desktop engagement differences',
        'Calculate engagement correlation with conversions',
        'Benchmark engagement against industry standards',
        'Generate engagement improvement recommendations'
      ],
      outputFormat: 'JSON with metrics, engagementScores, trends, insights, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'engagementScores', 'insights', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            bounceRate: { type: 'number' },
            avgSessionDuration: { type: 'string' },
            pagesPerSession: { type: 'number' },
            eventEngagementRate: { type: 'number' },
            returnVisitorRate: { type: 'number' },
            featureAdoptionRate: { type: 'number' }
          }
        },
        engagementScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              score: { type: 'number' },
              category: { type: 'string', enum: ['highly-engaged', 'engaged', 'casual', 'disengaged'] },
              behaviors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              direction: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
              change: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'engagement', 'metrics']
}));

// Task 16: UX Friction Identification
export const uxFrictionIdentificationTask = defineTask('ux-friction-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify UX friction points and usability issues',
  agent: {
    name: 'ux-friction-analyst',
    prompt: {
      role: 'UX Research Analyst specializing in friction point identification',
      task: 'Identify and prioritize UX friction points causing poor user experience',
      context: args,
      instructions: [
        'Aggregate all findings from heatmaps, sessions, funnels, behaviors, engagement',
        'Identify UX friction points: obstacles preventing users from achieving goals',
        'Categorize friction: navigation, content, forms, performance, visual, interaction',
        'Quantify friction impact: affected users, severity, business impact',
        'Detect confusion indicators: hesitation, back-navigation, rage clicks',
        'Identify information architecture issues',
        'Detect form friction: complex fields, errors, validation issues',
        'Identify mobile-specific friction points',
        'Detect performance issues affecting UX',
        'Identify accessibility barriers',
        'Assess cumulative friction effect on conversions',
        'Prioritize friction points by impact and effort to fix',
        'Map friction to specific pages and flows',
        'Generate prioritized friction elimination roadmap'
      ],
      outputFormat: 'JSON with frictionPoints, criticalIssues, impactAssessment, prioritizedIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['frictionPoints', 'criticalIssues', 'prioritizedIssues', 'artifacts'],
      properties: {
        frictionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              category: { type: 'string', enum: ['navigation', 'content', 'form', 'performance', 'visual', 'interaction', 'mobile', 'accessibility'] },
              pageUrl: { type: 'string' },
              affectedUsers: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              evidenceSources: { type: 'array', items: { type: 'string' } },
              businessImpact: { type: 'string' },
              userImpact: { type: 'string' }
            }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              urgency: { type: 'string' },
              conversionImpact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        impactAssessment: {
          type: 'object',
          properties: {
            totalFrictionPoints: { type: 'number' },
            criticalIssues: { type: 'number' },
            estimatedUserImpact: { type: 'string' },
            estimatedRevenueImpact: { type: 'string' },
            overallFrictionScore: { type: 'number' }
          }
        },
        prioritizedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              issue: { type: 'string' },
              priority: { type: 'string' },
              impactScore: { type: 'number' },
              effortToFix: { type: 'string', enum: ['low', 'medium', 'high'] },
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
  labels: ['agent', 'analytics-heatmap', 'ux-friction', 'usability']
}));

// Task 17: Optimization Recommendations
export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate data-driven optimization recommendations',
  agent: {
    name: 'optimization-strategist',
    prompt: {
      role: 'Senior UX Optimization Strategist',
      task: 'Generate comprehensive, prioritized optimization recommendations based on all analytics insights',
      context: args,
      instructions: [
        'Review all insights: heatmaps, sessions, funnels, behaviors, engagement, friction',
        'Generate specific, actionable optimization recommendations',
        'Prioritize recommendations by: impact on business metrics, effort to implement, confidence level',
        'Categorize recommendations: quick wins, medium-term improvements, long-term initiatives',
        'For each recommendation: describe current issue, proposed solution, expected impact, implementation effort',
        'Focus on high-impact areas: conversion optimization, engagement improvement, friction reduction',
        'Generate layout and design recommendations from heatmap insights',
        'Generate content recommendations from scroll and engagement data',
        'Generate navigation recommendations from behavior patterns',
        'Generate form optimization recommendations from friction analysis',
        'Generate mobile-specific recommendations',
        'Estimate business impact: conversion rate lift, engagement increase, revenue impact',
        'Calculate estimated ROI for major recommendations',
        'Create implementation roadmap with phases'
      ],
      outputFormat: 'JSON with recommendations, criticalRecommendations, quickWins, longTermInitiatives, estimatedImpact, projectedImprovements, estimatedROI, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'criticalRecommendations', 'quickWins', 'estimatedImpact', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              category: { type: 'string', enum: ['layout', 'content', 'navigation', 'forms', 'mobile', 'performance', 'conversion'] },
              currentIssue: { type: 'string' },
              proposedSolution: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              expectedOutcome: { type: 'string' },
              confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              supportingData: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              urgency: { type: 'string' },
              businessImpact: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              effort: { type: 'string' },
              expectedImpact: { type: 'string' },
              implementationTime: { type: 'string' }
            }
          }
        },
        longTermInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              description: { type: 'string' },
              strategicValue: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        estimatedImpact: {
          type: 'object',
          properties: {
            conversionRateLift: { type: 'string' },
            engagementIncrease: { type: 'string' },
            bounceRateReduction: { type: 'string' },
            revenueImpact: { type: 'string' }
          }
        },
        projectedImprovements: {
          type: 'object',
          properties: {
            currentMetrics: { type: 'object' },
            projectedMetrics: { type: 'object' },
            improvementPercentage: { type: 'object' }
          }
        },
        estimatedROI: { type: 'string' },
        implementationRoadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              timeline: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
              expectedOutcome: { type: 'string' }
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
  labels: ['agent', 'analytics-heatmap', 'optimization', 'recommendations']
}));

// Task 18: A/B Test Planning
export const abTestPlanningTask = defineTask('ab-test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan A/B tests for optimization hypotheses',
  agent: {
    name: 'ab-test-planner',
    prompt: {
      role: 'Experimentation Specialist and A/B Testing Expert',
      task: 'Design A/B test plan to validate optimization recommendations',
      context: args,
      instructions: [
        'Review optimization recommendations and identify testable hypotheses',
        'Prioritize A/B tests by potential impact and implementation feasibility',
        'For each test: define hypothesis, control, variants, success metrics',
        'Calculate required sample size for statistical significance',
        'Estimate test duration based on traffic and conversion rates',
        'Design multivariate tests for complex optimizations',
        'Define primary and secondary metrics per test',
        'Identify potential confounding variables',
        'Create test implementation specifications',
        'Define test segmentation (all users vs specific segments)',
        'Plan test sequence and dependencies',
        'Estimate resources needed: design, development, QA',
        'Create testing roadmap with timeline',
        'Generate comprehensive A/B test plan document'
      ],
      outputFormat: 'JSON with plannedTests, priorityTests, estimatedTimeframe, resourceRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plannedTests', 'priorityTests', 'artifacts'],
      properties: {
        plannedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              hypothesis: { type: 'string' },
              basedOnInsight: { type: 'string' },
              control: { type: 'string' },
              variants: { type: 'array', items: { type: 'string' } },
              primaryMetric: { type: 'string' },
              secondaryMetrics: { type: 'array', items: { type: 'string' } },
              requiredSampleSize: { type: 'number' },
              estimatedDuration: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              expectedImpact: { type: 'string' }
            }
          }
        },
        priorityTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              priority: { type: 'number' },
              justification: { type: 'string' },
              estimatedLift: { type: 'string' }
            }
          }
        },
        estimatedTimeframe: { type: 'string' },
        resourceRequirements: {
          type: 'object',
          properties: {
            design: { type: 'string' },
            development: { type: 'string' },
            qa: { type: 'string' },
            analysis: { type: 'string' }
          }
        },
        testingRoadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              tests: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'analytics-heatmap', 'ab-testing', 'experimentation']
}));

// Task 19: Insights Report Generation
export const insightsReportGenerationTask = defineTask('insights-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive analytics insights report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Analytics Report Writer and Data Storyteller',
      task: 'Create comprehensive, stakeholder-ready analytics insights report',
      context: args,
      instructions: [
        'Generate executive summary highlighting key findings and recommendations',
        'Create analytics setup overview: tools, tracking, coverage',
        'Document data collection: period, sample sizes, quality',
        'Present heatmap insights with visualizations per page',
        'Document session replay findings with examples',
        'Present funnel analysis with conversion metrics and drop-offs',
        'Document behavior patterns and user segments',
        'Present engagement metrics and trends',
        'Document UX friction points with severity and impact',
        'Present prioritized optimization recommendations',
        'Include A/B test plan and roadmap',
        'Add business impact projections and ROI estimates',
        'Include supporting data, charts, and heatmap images',
        'Make report actionable with clear next steps',
        'Format for executive, product, design, and development audiences',
        'Generate separate detailed reports per analysis area'
      ],
      outputFormat: 'JSON with reportPath, executiveSummaryPath, heatmapReportPath, recommendationsPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummaryPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        heatmapReportPath: { type: 'string' },
        sessionAnalysisReportPath: { type: 'string' },
        funnelReportPath: { type: 'string' },
        behaviorReportPath: { type: 'string' },
        frictionReportPath: { type: 'string' },
        recommendationsPath: { type: 'string' },
        abTestPlanPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        topRecommendations: { type: 'array', items: { type: 'string' } },
        businessImpact: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'reporting', 'documentation']
}));

// Task 20: Quality Scoring
export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality and validate insights',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Senior Analytics Quality Auditor',
      task: 'Assess overall analysis quality, data reliability, and insight validity',
      context: args,
      instructions: [
        'Evaluate analytics strategy completeness and appropriateness (weight: 10%)',
        'Assess tool setup quality and tracking implementation (weight: 15%)',
        'Evaluate data collection quality: sample size, duration, coverage (weight: 20%)',
        'Assess heatmap analysis depth and insight quality (weight: 15%)',
        'Evaluate session analysis thoroughness (weight: 10%)',
        'Assess funnel analysis completeness (weight: 10%)',
        'Evaluate behavior pattern identification quality (weight: 10%)',
        'Assess recommendation quality: specificity, actionability, prioritization (weight: 10%)',
        'Calculate weighted overall quality score (0-100)',
        'Identify analysis strengths and gaps',
        'Validate statistical significance of findings',
        'Assess potential biases in data or interpretation',
        'Evaluate business relevance of insights',
        'Provide recommendations for analysis improvement'
      ],
      outputFormat: 'JSON with overallQualityScore, componentScores, strengths, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallQualityScore', 'componentScores', 'artifacts'],
      properties: {
        overallQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            strategyCompleteness: { type: 'number' },
            toolSetupQuality: { type: 'number' },
            dataCollectionQuality: { type: 'number' },
            heatmapAnalysisDepth: { type: 'number' },
            sessionAnalysisQuality: { type: 'number' },
            funnelAnalysisQuality: { type: 'number' },
            behaviorAnalysisQuality: { type: 'number' },
            recommendationQuality: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        dataReliability: {
          type: 'object',
          properties: {
            sampleSizeAdequate: { type: 'boolean' },
            durationAdequate: { type: 'boolean' },
            statisticalSignificance: { type: 'boolean' },
            potentialBiases: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        readinessAssessment: {
          type: 'string',
          enum: ['ready-for-action', 'ready-with-caveats', 'needs-more-data', 'needs-refinement']
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics-heatmap', 'quality-scoring', 'validation']
}));
