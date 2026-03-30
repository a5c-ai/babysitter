/**
 * @process product-management/product-market-fit
 * @description Product-Market Fit Assessment process with PMF survey (40% rule), retention metrics, NPS analysis, growth indicators, qualitative signals, and iteration recommendations
 * @inputs { productName: string, productDescription: string, targetMarket: string, userBase: number, surveyResponses: array, retentionData: object, npsData: object, outputDir: string }
 * @outputs { success: boolean, pmfScore: number, pmfAchieved: boolean, surveyAnalysis: object, retentionAnalysis: object, npsAnalysis: object, growthIndicators: object, qualitativeSignals: object, recommendations: array, artifacts: array, metadata: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName = 'Product',
    productDescription = '',
    targetMarket = '',
    userBase = 0,
    surveyResponses = [],
    retentionData = {},
    npsData = {},
    growthMetrics = {},
    qualitativeData = [],
    outputDir = 'product-market-fit-output',
    pmfThreshold = 40, // 40% rule for PMF
    minimumQualityScore = 85,
    includeActionPlan = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Product-Market Fit Assessment for ${productName}`);

  // ============================================================================
  // PHASE 1: DATA COLLECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating data completeness for PMF assessment');
  const dataValidation = await ctx.task(dataValidationTask, {
    productName,
    productDescription,
    targetMarket,
    userBase,
    surveyResponses,
    retentionData,
    npsData,
    growthMetrics,
    qualitativeData,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  if (!dataValidation.hasAdequateData) {
    ctx.log('warn', 'Insufficient data for comprehensive PMF assessment');
    return {
      success: false,
      reason: 'Insufficient data',
      missingData: dataValidation.missingData,
      dataQualityScore: dataValidation.dataQualityScore,
      recommendations: dataValidation.recommendations,
      metadata: {
        processId: 'product-management/product-market-fit',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: PMF SURVEY ANALYSIS (40% RULE)
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing PMF survey responses using 40% rule');
  const surveyAnalysis = await ctx.task(pmfSurveyAnalysisTask, {
    productName,
    surveyResponses: dataValidation.validatedSurveyData,
    userSegments: dataValidation.identifiedSegments,
    pmfThreshold,
    outputDir
  });

  artifacts.push(...surveyAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: RETENTION METRICS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing user retention and engagement metrics');
  const retentionAnalysis = await ctx.task(retentionMetricsTask, {
    productName,
    retentionData: dataValidation.validatedRetentionData,
    userBase,
    productType: dataValidation.productType,
    benchmarks: dataValidation.industryBenchmarks,
    outputDir
  });

  artifacts.push(...retentionAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: NPS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Net Promoter Score and customer satisfaction');
  const npsAnalysis = await ctx.task(npsAnalysisTask, {
    productName,
    npsData: dataValidation.validatedNpsData,
    userSegments: dataValidation.identifiedSegments,
    feedbackData: dataValidation.validatedQualitativeData,
    outputDir
  });

  artifacts.push(...npsAnalysis.artifacts);

  // Breakpoint: Review quantitative metrics
  await ctx.breakpoint({
    question: `Quantitative PMF metrics analyzed for ${productName}. PMF Survey: ${surveyAnalysis.pmfPercentage}%, Retention: ${retentionAnalysis.retentionScore}/100, NPS: ${npsAnalysis.npsScore}. Review metrics before analyzing growth?`,
    title: 'Quantitative Metrics Review',
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
        pmfPercentage: surveyAnalysis.pmfPercentage,
        retentionScore: retentionAnalysis.retentionScore,
        npsScore: npsAnalysis.npsScore,
        userBase
      }
    }
  });

  // ============================================================================
  // PHASE 5: GROWTH INDICATORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing growth metrics and viral coefficients');
  const growthAnalysis = await ctx.task(growthIndicatorsTask, {
    productName,
    growthMetrics: dataValidation.validatedGrowthData,
    retentionAnalysis,
    surveyAnalysis,
    userBase,
    timeframe: dataValidation.dataTimeframe,
    outputDir
  });

  artifacts.push(...growthAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: QUALITATIVE SIGNALS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing qualitative signals and user feedback');
  const qualitativeAnalysis = await ctx.task(qualitativeSignalsTask, {
    productName,
    qualitativeData: dataValidation.validatedQualitativeData,
    surveyAnalysis,
    npsAnalysis,
    userSegments: dataValidation.identifiedSegments,
    outputDir
  });

  artifacts.push(...qualitativeAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: SEGMENT-SPECIFIC PMF ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing PMF by user segments and personas');
  const segmentAnalysis = await ctx.task(segmentPmfAnalysisTask, {
    productName,
    userSegments: dataValidation.identifiedSegments,
    surveyAnalysis,
    retentionAnalysis,
    npsAnalysis,
    growthAnalysis,
    qualitativeAnalysis,
    outputDir
  });

  artifacts.push(...segmentAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: COMPETITIVE POSITIONING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing competitive positioning and market dynamics');
  const competitiveAnalysis = await ctx.task(competitivePositioningTask, {
    productName,
    targetMarket,
    surveyAnalysis,
    qualitativeAnalysis,
    npsAnalysis,
    outputDir
  });

  artifacts.push(...competitiveAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: OVERALL PMF SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Calculating comprehensive PMF score');
  const pmfScoring = await ctx.task(pmfScoringTask, {
    productName,
    surveyAnalysis,
    retentionAnalysis,
    npsAnalysis,
    growthAnalysis,
    qualitativeAnalysis,
    segmentAnalysis,
    competitiveAnalysis,
    pmfThreshold,
    outputDir
  });

  artifacts.push(...pmfScoring.artifacts);

  // ============================================================================
  // PHASE 10: ITERATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating iteration recommendations for PMF improvement');
  const recommendations = await ctx.task(iterationRecommendationsTask, {
    productName,
    pmfScoring,
    surveyAnalysis,
    retentionAnalysis,
    npsAnalysis,
    growthAnalysis,
    qualitativeAnalysis,
    segmentAnalysis,
    competitiveAnalysis,
    pmfThreshold,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // ============================================================================
  // PHASE 11: ACTION PLAN (IF REQUESTED)
  // ============================================================================

  let actionPlan = null;
  if (includeActionPlan) {
    ctx.log('info', 'Phase 11: Creating prioritized action plan for PMF improvement');
    actionPlan = await ctx.task(actionPlanCreationTask, {
      productName,
      pmfScoring,
      recommendations,
      segmentAnalysis,
      outputDir
    });

    artifacts.push(...actionPlan.artifacts);
  }

  // ============================================================================
  // PHASE 12: PMF ASSESSMENT REPORT
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive PMF assessment report');
  const pmfReport = await ctx.task(pmfReportGenerationTask, {
    productName,
    productDescription,
    targetMarket,
    dataValidation,
    surveyAnalysis,
    retentionAnalysis,
    npsAnalysis,
    growthAnalysis,
    qualitativeAnalysis,
    segmentAnalysis,
    competitiveAnalysis,
    pmfScoring,
    recommendations,
    actionPlan,
    outputDir
  });

  artifacts.push(...pmfReport.artifacts);

  // ============================================================================
  // PHASE 13: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Validating assessment quality and completeness');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    productName,
    dataValidation,
    surveyAnalysis,
    retentionAnalysis,
    npsAnalysis,
    growthAnalysis,
    qualitativeAnalysis,
    pmfScoring,
    recommendations,
    minimumQualityScore,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= minimumQualityScore;
  const pmfAchieved = pmfScoring.pmfAchieved;

  // Final breakpoint: Review complete PMF assessment
  await ctx.breakpoint({
    question: `Product-Market Fit assessment complete for ${productName}. PMF Score: ${pmfScoring.overallPmfScore}/100, PMF ${pmfAchieved ? 'ACHIEVED' : 'NOT YET ACHIEVED'}. Quality score: ${qualityValidation.overallScore}/100. Review and approve?`,
    title: 'Final PMF Assessment Review',
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
        pmfScore: pmfScoring.overallPmfScore,
        pmfAchieved,
        pmfPercentage: surveyAnalysis.pmfPercentage,
        retentionScore: retentionAnalysis.retentionScore,
        npsScore: npsAnalysis.npsScore,
        growthRate: growthAnalysis.monthlyGrowthRate,
        qualityScore: qualityValidation.overallScore,
        qualityMet,
        topRecommendations: recommendations.criticalRecommendations.length,
        strongestSegment: segmentAnalysis.strongestSegment
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    pmfScore: pmfScoring.overallPmfScore,
    pmfAchieved,
    qualityScore: qualityValidation.overallScore,
    qualityMet,
    surveyAnalysis: {
      pmfPercentage: surveyAnalysis.pmfPercentage,
      veryDisappointedPercentage: surveyAnalysis.veryDisappointedPercentage,
      somewhatDisappointedPercentage: surveyAnalysis.somewhatDisappointedPercentage,
      notDisappointedPercentage: surveyAnalysis.notDisappointedPercentage,
      responseCount: surveyAnalysis.responseCount,
      meetsThreshold: surveyAnalysis.meetsThreshold,
      targetSegmentPmf: surveyAnalysis.targetSegmentPmf
    },
    retentionAnalysis: {
      retentionScore: retentionAnalysis.retentionScore,
      day1Retention: retentionAnalysis.day1Retention,
      day7Retention: retentionAnalysis.day7Retention,
      day30Retention: retentionAnalysis.day30Retention,
      cohortRetention: retentionAnalysis.cohortRetention,
      churnRate: retentionAnalysis.churnRate,
      retentionCurve: retentionAnalysis.retentionCurve
    },
    npsAnalysis: {
      npsScore: npsAnalysis.npsScore,
      promoters: npsAnalysis.promotersPercentage,
      passives: npsAnalysis.passivesPercentage,
      detractors: npsAnalysis.detractorsPercentage,
      responseCount: npsAnalysis.responseCount,
      topPraiseThemes: npsAnalysis.topPraiseThemes,
      topCriticismThemes: npsAnalysis.topCriticismThemes
    },
    growthIndicators: {
      monthlyGrowthRate: growthAnalysis.monthlyGrowthRate,
      viralCoefficient: growthAnalysis.viralCoefficient,
      organicGrowthRate: growthAnalysis.organicGrowthRate,
      cac: growthAnalysis.customerAcquisitionCost,
      ltv: growthAnalysis.lifetimeValue,
      ltvCacRatio: growthAnalysis.ltvCacRatio,
      paybackPeriod: growthAnalysis.paybackPeriod,
      growthStage: growthAnalysis.growthStage
    },
    qualitativeSignals: {
      strongSignals: qualitativeAnalysis.strongSignals,
      moderateSignals: qualitativeAnalysis.moderateSignals,
      weakSignals: qualitativeAnalysis.weakSignals,
      userQuotes: qualitativeAnalysis.representativeQuotes,
      emotionalResonance: qualitativeAnalysis.emotionalResonance,
      usagePatterns: qualitativeAnalysis.usagePatterns
    },
    segmentAnalysis: {
      strongestSegment: segmentAnalysis.strongestSegment,
      weakestSegment: segmentAnalysis.weakestSegment,
      segmentScores: segmentAnalysis.segmentScores,
      idealCustomerProfile: segmentAnalysis.idealCustomerProfile,
      segmentRecommendations: segmentAnalysis.segmentRecommendations
    },
    competitiveAnalysis: {
      competitivePosition: competitiveAnalysis.competitivePosition,
      uniqueValueProposition: competitiveAnalysis.uniqueValueProposition,
      competitiveAdvantages: competitiveAnalysis.competitiveAdvantages,
      competitiveWeaknesses: competitiveAnalysis.competitiveWeaknesses,
      marketOpportunities: competitiveAnalysis.marketOpportunities
    },
    recommendations: {
      critical: recommendations.criticalRecommendations,
      high: recommendations.highPriorityRecommendations,
      medium: recommendations.mediumPriorityRecommendations,
      quickWins: recommendations.quickWins,
      strategicInitiatives: recommendations.strategicInitiatives,
      iterationStrategy: recommendations.iterationStrategy
    },
    actionPlan: actionPlan ? {
      actionItems: actionPlan.actionItems,
      prioritizedInitiatives: actionPlan.prioritizedInitiatives,
      timeline: actionPlan.timeline,
      successMetrics: actionPlan.successMetrics
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/product-market-fit',
      timestamp: startTime,
      outputDir,
      productName,
      userBase,
      pmfThreshold
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Data Validation
export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data completeness for PMF assessment',
  agent: {
    name: 'data-validator',
    prompt: {
      role: 'product analytics specialist and data quality analyst',
      task: 'Validate data completeness, quality, and adequacy for comprehensive PMF assessment',
      context: args,
      instructions: [
        'Validate survey data:',
        '  - Minimum 30-40 responses recommended for statistical significance',
        '  - Check for PMF question format ("How would you feel if you could no longer use [product]?")',
        '  - Validate response categories (Very disappointed, Somewhat disappointed, Not disappointed)',
        '  - Identify user segments in survey data',
        'Validate retention data:',
        '  - Check for cohort analysis data (D1, D7, D30 retention)',
        '  - Validate time series completeness',
        '  - Calculate churn rate',
        '  - Verify data spans sufficient time period (3+ months recommended)',
        'Validate NPS data:',
        '  - Check NPS score format (0-10 scale)',
        '  - Validate promoter/passive/detractor categorization',
        '  - Review open-ended feedback availability',
        '  - Check for segment breakdown',
        'Validate growth metrics:',
        '  - User acquisition data',
        '  - Growth rates (MoM, QoQ)',
        '  - Viral coefficient data',
        '  - CAC and LTV metrics',
        'Validate qualitative data:',
        '  - User interviews',
        '  - Support tickets',
        '  - Feature requests',
        '  - User testimonials',
        'Assess data quality (0-100 score)',
        'Identify missing data elements',
        'Determine if assessment can proceed',
        'Identify product type and industry for benchmarking',
        'Provide data collection recommendations'
      ],
      outputFormat: 'JSON with hasAdequateData (boolean), dataQualityScore (number 0-100), validatedSurveyData (object), validatedRetentionData (object), validatedNpsData (object), validatedGrowthData (object), validatedQualitativeData (array), identifiedSegments (array), productType (string), industryBenchmarks (object), dataTimeframe (object), missingData (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasAdequateData', 'dataQualityScore', 'artifacts'],
      properties: {
        hasAdequateData: { type: 'boolean' },
        dataQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        validatedSurveyData: {
          type: 'object',
          properties: {
            responseCount: { type: 'number' },
            veryDisappointed: { type: 'number' },
            somewhatDisappointed: { type: 'number' },
            notDisappointed: { type: 'number' },
            responses: { type: 'array' }
          }
        },
        validatedRetentionData: {
          type: 'object',
          properties: {
            day1: { type: 'number' },
            day7: { type: 'number' },
            day30: { type: 'number' },
            cohorts: { type: 'array' }
          }
        },
        validatedNpsData: {
          type: 'object',
          properties: {
            promoters: { type: 'number' },
            passives: { type: 'number' },
            detractors: { type: 'number' },
            feedback: { type: 'array' }
          }
        },
        validatedGrowthData: { type: 'object' },
        validatedQualitativeData: { type: 'array' },
        identifiedSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              size: { type: 'number' },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        productType: { type: 'string' },
        industryBenchmarks: { type: 'object' },
        dataTimeframe: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            duration: { type: 'string' }
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
  labels: ['agent', 'pmf-assessment', 'data-validation']
}));

// Task 2: PMF Survey Analysis
export const pmfSurveyAnalysisTask = defineTask('pmf-survey-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze PMF survey using 40% rule',
  agent: {
    name: 'pmf-analyst',
    prompt: {
      role: 'product-market fit specialist and survey analyst',
      task: 'Analyze PMF survey responses using Sean Ellis 40% rule and segment analysis',
      context: args,
      instructions: [
        'Apply Sean Ellis PMF Survey methodology:',
        '  - Question: "How would you feel if you could no longer use this product?"',
        '  - Responses: "Very disappointed", "Somewhat disappointed", "Not disappointed (it isn\'t really that useful)"',
        'Calculate PMF percentage:',
        '  - PMF % = (Very disappointed responses / Total responses) × 100',
        '  - Threshold: 40% or higher indicates PMF',
        'Segment analysis:',
        '  - Calculate PMF % for each user segment',
        '  - Identify which segments show strongest PMF',
        '  - Analyze demographic patterns',
        '  - Identify target segment PMF vs overall PMF',
        'Response pattern analysis:',
        '  - Very disappointed: Strong PMF signal, core users',
        '  - Somewhat disappointed: Lukewarm users, potential improvements',
        '  - Not disappointed: Wrong audience or poor value delivery',
        'Analyze correlation with:',
        '  - Usage frequency',
        '  - Feature usage',
        '  - User tenure',
        '  - User segment',
        'Extract open-ended feedback themes',
        'Identify what users value most (from "very disappointed" group)',
        'Identify why users are lukewarm (from other groups)',
        'Calculate confidence intervals for PMF percentage',
        'Provide statistical significance assessment',
        'Generate PMF survey visualization and analysis report'
      ],
      outputFormat: 'JSON with pmfPercentage (number), veryDisappointedPercentage (number), somewhatDisappointedPercentage (number), notDisappointedPercentage (number), responseCount (number), meetsThreshold (boolean), segmentPmf (array), targetSegmentPmf (number), confidenceInterval (object), coreUserProfile (object), valueDrivers (array), improvementAreas (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pmfPercentage', 'responseCount', 'meetsThreshold', 'artifacts'],
      properties: {
        pmfPercentage: { type: 'number', minimum: 0, maximum: 100 },
        veryDisappointedPercentage: { type: 'number', minimum: 0, maximum: 100 },
        somewhatDisappointedPercentage: { type: 'number', minimum: 0, maximum: 100 },
        notDisappointedPercentage: { type: 'number', minimum: 0, maximum: 100 },
        responseCount: { type: 'number' },
        meetsThreshold: { type: 'boolean' },
        segmentPmf: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              pmfPercentage: { type: 'number' },
              responseCount: { type: 'number' },
              meetsThreshold: { type: 'boolean' }
            }
          }
        },
        targetSegmentPmf: { type: 'number' },
        confidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' },
            confidenceLevel: { type: 'number' }
          }
        },
        coreUserProfile: {
          type: 'object',
          properties: {
            characteristics: { type: 'array', items: { type: 'string' } },
            usagePatterns: { type: 'array', items: { type: 'string' } },
            commonFeatures: { type: 'array', items: { type: 'string' } }
          }
        },
        valueDrivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driver: { type: 'string' },
              frequency: { type: 'number' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium'] }
            }
          }
        },
        improvementAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              mentionCount: { type: 'number' },
              affectedSegment: { type: 'string' }
            }
          }
        },
        statisticalSignificance: { type: 'string', enum: ['high', 'medium', 'low'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pmf-assessment', 'survey-analysis']
}));

// Task 3: Retention Metrics Analysis
export const retentionMetricsTask = defineTask('retention-metrics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze retention and engagement metrics',
  agent: {
    name: 'retention-analyst',
    prompt: {
      role: 'growth analytics specialist and retention expert',
      task: 'Analyze user retention curves, cohort retention, and engagement metrics as PMF indicators',
      context: args,
      instructions: [
        'Analyze retention metrics:',
        '  - Day 1 retention (D1): First day return rate',
        '  - Day 7 retention (D7): Week 1 retention',
        '  - Day 30 retention (D30): Month 1 retention',
        '  - Long-term retention (D90, D180 if available)',
        'Cohort retention analysis:',
        '  - Retention by signup cohort (monthly cohorts)',
        '  - Identify improving vs declining cohorts',
        '  - Calculate cohort retention curves',
        '  - Find retention curve "flatline" point',
        'Calculate churn rate and churn cohorts',
        'Analyze engagement metrics:',
        '  - DAU/MAU ratio (stickiness)',
        '  - Session frequency',
        '  - Session duration',
        '  - Feature adoption rate',
        'Retention benchmarking:',
        '  - Compare against industry benchmarks',
        '  - B2C SaaS: 25-30% D30 retention = good',
        '  - B2B SaaS: 85-90% D30 retention = good',
        '  - Consumer mobile: 15-25% D30 retention = good',
        'Identify retention curve shape:',
        '  - Smile curve (PMF): Initial drop, then flattens (strong retention)',
        '  - Declining curve (no PMF): Continuous decline',
        '  - Flat curve (strong PMF): Minimal decline after initial period',
        'Segment retention analysis (power users vs casual)',
        'Identify retention leading indicators',
        'Calculate "aha moment" correlation with retention',
        'Score retention health (0-100)',
        'Generate retention visualization and analysis'
      ],
      outputFormat: 'JSON with retentionScore (number 0-100), day1Retention (number), day7Retention (number), day30Retention (number), cohortRetention (array), churnRate (number), retentionCurve (string), dauMauRatio (number), engagementMetrics (object), benchmarkComparison (object), segmentRetention (array), ahaMomentInsights (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['retentionScore', 'day1Retention', 'day7Retention', 'day30Retention', 'artifacts'],
      properties: {
        retentionScore: { type: 'number', minimum: 0, maximum: 100 },
        day1Retention: { type: 'number', minimum: 0, maximum: 100 },
        day7Retention: { type: 'number', minimum: 0, maximum: 100 },
        day30Retention: { type: 'number', minimum: 0, maximum: 100 },
        day90Retention: { type: 'number', minimum: 0, maximum: 100 },
        cohortRetention: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cohort: { type: 'string' },
              retentionCurve: { type: 'array', items: { type: 'number' } },
              retentionImproving: { type: 'boolean' }
            }
          }
        },
        churnRate: { type: 'number' },
        retentionCurve: { type: 'string', enum: ['smile', 'flat', 'declining', 'uncertain'] },
        dauMauRatio: { type: 'number' },
        engagementMetrics: {
          type: 'object',
          properties: {
            averageSessionsPerWeek: { type: 'number' },
            averageSessionDuration: { type: 'number' },
            featureAdoptionRate: { type: 'number' }
          }
        },
        benchmarkComparison: {
          type: 'object',
          properties: {
            industry: { type: 'string' },
            d30BenchmarkMin: { type: 'number' },
            d30BenchmarkMax: { type: 'number' },
            performanceVsBenchmark: { type: 'string', enum: ['above', 'within', 'below'] }
          }
        },
        segmentRetention: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              d30Retention: { type: 'number' },
              retentionStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        ahaMomentInsights: {
          type: 'object',
          properties: {
            identifiedAhaMoment: { type: 'boolean' },
            ahaMomentDescription: { type: 'string' },
            retentionLift: { type: 'number' }
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
  labels: ['agent', 'pmf-assessment', 'retention-analysis']
}));

// Task 4: NPS Analysis
export const npsAnalysisTask = defineTask('nps-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Net Promoter Score and satisfaction',
  agent: {
    name: 'nps-analyst',
    prompt: {
      role: 'customer satisfaction analyst and NPS expert',
      task: 'Analyze Net Promoter Score, customer satisfaction, and word-of-mouth indicators',
      context: args,
      instructions: [
        'Calculate Net Promoter Score (NPS):',
        '  - Promoters (9-10 score): % of promoters',
        '  - Passives (7-8 score): % of passives',
        '  - Detractors (0-6 score): % of detractors',
        '  - NPS = % Promoters - % Detractors',
        '  - NPS range: -100 to +100',
        'NPS interpretation:',
        '  - Above 50: Excellent (strong PMF signal)',
        '  - 30-50: Good (positive PMF signal)',
        '  - 0-30: Needs improvement',
        '  - Below 0: Critical issues',
        'Segment NPS analysis:',
        '  - Calculate NPS for each user segment',
        '  - Identify high-NPS segments',
        '  - Correlate with usage and demographics',
        'Analyze open-ended feedback:',
        '  - Theme analysis from promoters (what they love)',
        '  - Theme analysis from detractors (pain points)',
        '  - Extract specific feature feedback',
        '  - Identify competitive comparisons',
        'Word-of-mouth indicators:',
        '  - Referral rate analysis',
        '  - Social mentions sentiment',
        '  - Unsolicited testimonials',
        '  - Organic advocacy signals',
        'Correlation analysis:',
        '  - NPS vs PMF survey results',
        '  - NPS vs retention',
        '  - NPS vs usage frequency',
        'Trend analysis (if historical data available)',
        'Generate NPS dashboard and insights report'
      ],
      outputFormat: 'JSON with npsScore (number -100 to 100), promotersPercentage (number), passivesPercentage (number), detractorsPercentage (number), responseCount (number), segmentNps (array), topPraiseThemes (array), topCriticismThemes (array), wordOfMouthIndicators (object), npsInterpretation (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['npsScore', 'promotersPercentage', 'detractorsPercentage', 'artifacts'],
      properties: {
        npsScore: { type: 'number', minimum: -100, maximum: 100 },
        promotersPercentage: { type: 'number', minimum: 0, maximum: 100 },
        passivesPercentage: { type: 'number', minimum: 0, maximum: 100 },
        detractorsPercentage: { type: 'number', minimum: 0, maximum: 100 },
        responseCount: { type: 'number' },
        segmentNps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              npsScore: { type: 'number' },
              responseCount: { type: 'number' }
            }
          }
        },
        topPraiseThemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              mentionCount: { type: 'number' },
              sentiment: { type: 'string' },
              representativeQuotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        topCriticismThemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              mentionCount: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              representativeQuotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        wordOfMouthIndicators: {
          type: 'object',
          properties: {
            referralRate: { type: 'number' },
            organicAdvocacySignals: { type: 'array', items: { type: 'string' } },
            socialMentionsSentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] }
          }
        },
        npsInterpretation: { type: 'string', enum: ['excellent', 'good', 'needs-improvement', 'critical'] },
        npsTrend: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            changeRate: { type: 'number' }
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
  labels: ['agent', 'pmf-assessment', 'nps-analysis']
}));

// Task 5: Growth Indicators Analysis
export const growthIndicatorsTask = defineTask('growth-indicators-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze growth metrics and viral coefficients',
  agent: {
    name: 'growth-analyst',
    prompt: {
      role: 'growth marketing analyst and metrics specialist',
      task: 'Analyze growth rate, viral coefficient, organic growth, and unit economics as PMF indicators',
      context: args,
      instructions: [
        'Calculate growth metrics:',
        '  - Monthly growth rate (MoM)',
        '  - Quarterly growth rate (QoQ)',
        '  - Year-over-year growth (YoY) if available',
        '  - Compound monthly growth rate (CMGR)',
        'Viral coefficient analysis:',
        '  - Viral coefficient (K-factor): invites per user × conversion rate',
        '  - K > 1: Viral growth (strong PMF signal)',
        '  - K = 0.5-1: Strong word-of-mouth',
        '  - K < 0.5: Limited virality',
        'Organic vs paid growth breakdown:',
        '  - Organic growth rate (direct, referral, organic search)',
        '  - Paid growth rate',
        '  - Organic % of total growth',
        '  - High organic growth = strong PMF signal',
        'Unit economics analysis:',
        '  - Customer Acquisition Cost (CAC)',
        '  - Lifetime Value (LTV)',
        '  - LTV:CAC ratio (healthy ratio: 3:1 or higher)',
        '  - CAC payback period (healthy: <12 months)',
        'Growth stage identification:',
        '  - Early stage (validation)',
        '  - Growth stage (scaling)',
        '  - Mature stage (optimization)',
        'PMF growth signals:',
        '  - Accelerating growth without proportional marketing spend',
        '  - High organic/referral traffic',
        '  - Improving unit economics',
        '  - Word-of-mouth driving growth',
        'Identify growth bottlenecks and opportunities',
        'Generate growth metrics dashboard'
      ],
      outputFormat: 'JSON with monthlyGrowthRate (number), viralCoefficient (number), organicGrowthRate (number), customerAcquisitionCost (number), lifetimeValue (number), ltvCacRatio (number), paybackPeriod (number), growthStage (string), organicPercentage (number), growthAcceleration (boolean), growthBottlenecks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['monthlyGrowthRate', 'viralCoefficient', 'growthStage', 'artifacts'],
      properties: {
        monthlyGrowthRate: { type: 'number' },
        quarterlyGrowthRate: { type: 'number' },
        compoundMonthlyGrowthRate: { type: 'number' },
        viralCoefficient: { type: 'number' },
        viralityAssessment: { type: 'string', enum: ['viral', 'strong-wom', 'moderate', 'weak'] },
        organicGrowthRate: { type: 'number' },
        paidGrowthRate: { type: 'number' },
        organicPercentage: { type: 'number' },
        customerAcquisitionCost: { type: 'number' },
        lifetimeValue: { type: 'number' },
        ltvCacRatio: { type: 'number' },
        ltvCacHealth: { type: 'string', enum: ['healthy', 'acceptable', 'concerning'] },
        paybackPeriod: { type: 'number' },
        paybackPeriodHealth: { type: 'string', enum: ['healthy', 'acceptable', 'concerning'] },
        growthStage: { type: 'string', enum: ['validation', 'growth', 'mature'] },
        growthAcceleration: { type: 'boolean' },
        pmfGrowthSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        growthBottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bottleneck: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
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
  labels: ['agent', 'pmf-assessment', 'growth-analysis']
}));

// Task 6: Qualitative Signals Analysis
export const qualitativeSignalsTask = defineTask('qualitative-signals-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze qualitative PMF signals',
  agent: {
    name: 'qualitative-analyst',
    prompt: {
      role: 'user research specialist and qualitative analyst',
      task: 'Analyze qualitative signals, user feedback, and emotional resonance as PMF indicators',
      context: args,
      instructions: [
        'Analyze strong PMF signals:',
        '  - Users spontaneously recommending product',
        '  - Organic testimonials and case studies',
        '  - Users describing product as "essential" or "can\'t live without"',
        '  - High-quality unsolicited feedback',
        '  - Users creating content about product',
        '  - Feature requests indicating deep engagement',
        '  - Willingness to pay premium',
        'Analyze moderate PMF signals:',
        '  - Positive feedback but not enthusiastic',
        '  - Users continue using but don\'t recommend',
        '  - Interest in improvements',
        '  - Moderate engagement',
        'Analyze weak PMF signals:',
        '  - Users easily churn to alternatives',
        '  - Feedback focuses on minor features',
        '  - Price sensitivity',
        '  - Limited engagement',
        'Emotional resonance analysis:',
        '  - Language intensity in feedback',
        '  - Emotional attachment to product',
        '  - Identity association ("I\'m a [product] user")',
        '  - FOMO (fear of missing out) when product unavailable',
        'Usage pattern analysis:',
        '  - Frequency of voluntary usage',
        '  - Depth of feature adoption',
        '  - Creative/unexpected use cases',
        '  - Integration into workflows',
        'Pain point analysis:',
        '  - Critical pain points product solves',
        '  - Alternative solutions users tried',
        '  - Switching costs from alternatives',
        'Extract representative user quotes',
        'Identify most enthusiastic user segments',
        'Generate qualitative insights report'
      ],
      outputFormat: 'JSON with strongSignals (array), moderateSignals (array), weakSignals (array), emotionalResonance (object), usagePatterns (object), painPointsSolved (array), representativeQuotes (array), enthusiasticSegments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strongSignals', 'emotionalResonance', 'artifacts'],
      properties: {
        strongSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              frequency: { type: 'number' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        moderateSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              frequency: { type: 'number' }
            }
          }
        },
        weakSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              concernLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        emotionalResonance: {
          type: 'object',
          properties: {
            intensityScore: { type: 'number', minimum: 0, maximum: 100 },
            attachmentLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
            identityAssociation: { type: 'boolean' },
            fomoPresent: { type: 'boolean' }
          }
        },
        usagePatterns: {
          type: 'object',
          properties: {
            voluntaryUsageFrequency: { type: 'string', enum: ['daily', 'weekly', 'occasional'] },
            featureAdoptionDepth: { type: 'string', enum: ['deep', 'moderate', 'shallow'] },
            creativeUseCases: { type: 'array', items: { type: 'string' } },
            workflowIntegration: { type: 'string', enum: ['essential', 'helpful', 'nice-to-have'] }
          }
        },
        painPointsSolved: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'number' },
              alternativesTried: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        representativeQuotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              sentiment: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
              context: { type: 'string' }
            }
          }
        },
        enthusiasticSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              enthusiasmLevel: { type: 'string', enum: ['very-high', 'high', 'moderate'] },
              characteristics: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'pmf-assessment', 'qualitative-analysis']
}));

// Task 7: Segment-Specific PMF Analysis
export const segmentPmfAnalysisTask = defineTask('segment-pmf-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze PMF by user segments',
  agent: {
    name: 'segment-analyst',
    prompt: {
      role: 'market segmentation specialist and customer analytics expert',
      task: 'Analyze product-market fit for each user segment to identify strongest PMF segments',
      context: args,
      instructions: [
        'For each user segment, calculate:',
        '  - PMF survey score (% very disappointed)',
        '  - Retention rate (D30)',
        '  - NPS score',
        '  - Growth rate',
        '  - Engagement level',
        '  - Composite PMF score (weighted)',
        'Identify strongest PMF segment:',
        '  - Highest composite PMF score',
        '  - Best retention',
        '  - Most enthusiastic feedback',
        '  - Highest growth potential',
        'Identify weakest PMF segment:',
        '  - Lowest PMF metrics',
        '  - Poor retention',
        '  - Negative feedback',
        '  - Limited growth',
        'Define Ideal Customer Profile (ICP):',
        '  - Characteristics of strongest segment',
        '  - Demographics and firmographics',
        '  - Use cases and workflows',
        '  - Pain points and needs',
        '  - Purchase behavior',
        'Segment recommendations:',
        '  - Which segments to focus on (double down)',
        '  - Which segments to improve (iterate)',
        '  - Which segments to deprioritize (ignore for now)',
        'Analyze segment size and market opportunity',
        'Identify segment-specific value propositions',
        'Generate segment PMF scorecard and ICP profile'
      ],
      outputFormat: 'JSON with segmentScores (array), strongestSegment (object), weakestSegment (object), idealCustomerProfile (object), segmentRecommendations (array), marketOpportunityBySegment (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segmentScores', 'strongestSegment', 'idealCustomerProfile', 'artifacts'],
      properties: {
        segmentScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              compositePmfScore: { type: 'number', minimum: 0, maximum: 100 },
              pmfSurveyScore: { type: 'number' },
              retentionRate: { type: 'number' },
              npsScore: { type: 'number' },
              growthRate: { type: 'number' },
              engagementLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              pmfStatus: { type: 'string', enum: ['achieved', 'emerging', 'weak'] }
            }
          }
        },
        strongestSegment: {
          type: 'object',
          properties: {
            segment: { type: 'string' },
            pmfScore: { type: 'number' },
            size: { type: 'number' },
            characteristics: { type: 'array', items: { type: 'string' } },
            keyStrengths: { type: 'array', items: { type: 'string' } }
          }
        },
        weakestSegment: {
          type: 'object',
          properties: {
            segment: { type: 'string' },
            pmfScore: { type: 'number' },
            keyWeaknesses: { type: 'array', items: { type: 'string' } }
          }
        },
        idealCustomerProfile: {
          type: 'object',
          properties: {
            demographics: { type: 'array', items: { type: 'string' } },
            firmographics: { type: 'array', items: { type: 'string' } },
            useCases: { type: 'array', items: { type: 'string' } },
            painPoints: { type: 'array', items: { type: 'string' } },
            buyingBehavior: { type: 'array', items: { type: 'string' } },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        segmentRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              recommendation: { type: 'string', enum: ['double-down', 'iterate', 'deprioritize'] },
              rationale: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        marketOpportunityBySegment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              marketSize: { type: 'string' },
              captureOpportunity: { type: 'string', enum: ['high', 'medium', 'low'] },
              competitiveIntensity: { type: 'string', enum: ['high', 'medium', 'low'] }
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
  labels: ['agent', 'pmf-assessment', 'segment-analysis']
}));

// Task 8: Competitive Positioning Analysis
export const competitivePositioningTask = defineTask('competitive-positioning-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitive positioning and market dynamics',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence analyst and market strategist',
      task: 'Analyze competitive positioning, differentiation, and market opportunities based on PMF data',
      context: args,
      instructions: [
        'Extract competitive insights from qualitative feedback:',
        '  - Mentions of competitors',
        '  - Comparison statements',
        '  - Switching behaviors (to/from competitors)',
        '  - Perceived advantages vs competitors',
        'Identify unique value proposition:',
        '  - What users say is unique/better',
        '  - Features competitors lack',
        '  - Experience advantages',
        '  - Brand perceptions',
        'Competitive advantages:',
        '  - Technical advantages',
        '  - UX advantages',
        '  - Price/value advantages',
        '  - Support/service advantages',
        '  - Network effects or data advantages',
        'Competitive weaknesses:',
        '  - Areas where competitors are stronger',
        '  - Missing features users want',
        '  - Gaps competitors could exploit',
        'Market opportunities:',
        '  - Underserved segments',
        '  - Emerging needs',
        '  - Market trends favoring product',
        '  - White space opportunities',
        'Competitive threats:',
        '  - New entrants',
        '  - Feature parity risks',
        '  - Market shifts',
        'Strategic positioning recommendation',
        'Generate competitive analysis report'
      ],
      outputFormat: 'JSON with competitivePosition (string), uniqueValueProposition (object), competitiveAdvantages (array), competitiveWeaknesses (array), marketOpportunities (array), competitiveThreats (array), strategicPositioning (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitivePosition', 'uniqueValueProposition', 'competitiveAdvantages', 'artifacts'],
      properties: {
        competitivePosition: { type: 'string', enum: ['leader', 'challenger', 'niche-leader', 'emerging', 'follower'] },
        uniqueValueProposition: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            supporting: { type: 'array', items: { type: 'string' } },
            evidence: { type: 'array', items: { type: 'string' } }
          }
        },
        competitiveAdvantages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              advantage: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'emerging'] },
              sustainability: { type: 'string', enum: ['sustainable', 'temporary'] },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        competitiveWeaknesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              weakness: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              competitorAdvantage: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        marketOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              potential: { type: 'string', enum: ['high', 'medium', 'low'] },
              timeframe: { type: 'string' }
            }
          }
        },
        competitiveThreats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        strategicPositioning: { type: 'string' },
        competitorMentions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              mentionCount: { type: 'number' },
              sentiment: { type: 'string', enum: ['favorable-to-us', 'neutral', 'favorable-to-them'] }
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
  labels: ['agent', 'pmf-assessment', 'competitive-analysis']
}));

// Task 9: Overall PMF Scoring
export const pmfScoringTask = defineTask('pmf-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate comprehensive PMF score',
  agent: {
    name: 'pmf-scorer',
    prompt: {
      role: 'product-market fit expert and metrics synthesizer',
      task: 'Calculate comprehensive PMF score combining quantitative and qualitative indicators',
      context: args,
      instructions: [
        'Calculate weighted composite PMF score (0-100):',
        '  - PMF Survey (40% rule): 30% weight',
        '  - Retention metrics: 25% weight',
        '  - NPS score: 20% weight',
        '  - Growth indicators: 15% weight',
        '  - Qualitative signals: 10% weight',
        'PMF achievement determination:',
        '  - Score 70+: Strong PMF achieved',
        '  - Score 50-69: Emerging PMF (on track)',
        '  - Score 30-49: Weak PMF (significant work needed)',
        '  - Score <30: No PMF yet (pivot or major iteration)',
        'Analyze PMF consistency across metrics:',
        '  - All metrics strong: Confident PMF',
        '  - Mixed metrics: Segmented PMF or emerging',
        '  - All metrics weak: No PMF',
        'Identify PMF stage:',
        '  - Pre-PMF: Searching for fit',
        '  - Emerging PMF: Found fit with early adopters',
        '  - Strong PMF: Clear fit with target segment',
        '  - Scaling PMF: Ready to scale',
        'Key PMF strengths (what\'s working)',
        'Key PMF gaps (what needs improvement)',
        'Overall PMF verdict with confidence level',
        'Generate PMF scorecard and dashboard'
      ],
      outputFormat: 'JSON with overallPmfScore (number 0-100), pmfAchieved (boolean), pmfStage (string), componentScores (object), consistencyAnalysis (object), keyStrengths (array), keyGaps (array), pmfVerdict (string), confidenceLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallPmfScore', 'pmfAchieved', 'pmfStage', 'componentScores', 'artifacts'],
      properties: {
        overallPmfScore: { type: 'number', minimum: 0, maximum: 100 },
        pmfAchieved: { type: 'boolean' },
        pmfStage: { type: 'string', enum: ['pre-pmf', 'emerging-pmf', 'strong-pmf', 'scaling-pmf'] },
        componentScores: {
          type: 'object',
          properties: {
            surveyScore: { type: 'number' },
            retentionScore: { type: 'number' },
            npsScore: { type: 'number' },
            growthScore: { type: 'number' },
            qualitativeScore: { type: 'number' }
          }
        },
        consistencyAnalysis: {
          type: 'object',
          properties: {
            metricsAlignment: { type: 'string', enum: ['high', 'medium', 'low'] },
            strongestMetric: { type: 'string' },
            weakestMetric: { type: 'string' },
            consistencyNote: { type: 'string' }
          }
        },
        keyStrengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        pmfVerdict: { type: 'string' },
        confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        readinessToScale: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            reasoning: { type: 'string' },
            prerequisites: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'pmf-assessment', 'scoring']
}));

// Task 10: Iteration Recommendations
export const iterationRecommendationsTask = defineTask('iteration-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate iteration recommendations for PMF improvement',
  agent: {
    name: 'pmf-strategist',
    prompt: {
      role: 'product strategy consultant and PMF improvement specialist',
      task: 'Generate prioritized, actionable recommendations for improving product-market fit',
      context: args,
      instructions: [
        'Analyze PMF gaps and generate recommendations:',
        '  - Critical recommendations (must-do for PMF)',
        '  - High priority (important for strengthening PMF)',
        '  - Medium priority (nice-to-have improvements)',
        'Recommendation categories:',
        '  - Product improvements (features, UX, performance)',
        '  - Positioning changes (messaging, target segment)',
        '  - Go-to-market adjustments (channels, pricing)',
        '  - Customer success initiatives (onboarding, support)',
        'For each recommendation provide:',
        '  - Clear description',
        '  - Rationale (based on PMF data)',
        '  - Expected impact on PMF',
        '  - Effort estimate',
        '  - Priority level',
        '  - Success metrics',
        'Identify Quick Wins:',
        '  - High impact, low effort improvements',
        '  - Can be implemented in 2-4 weeks',
        '  - Will show measurable PMF improvement',
        'Identify Strategic Initiatives:',
        '  - Larger efforts with transformative impact',
        '  - May take 2-6 months',
        '  - Critical for achieving/strengthening PMF',
        'Define iteration strategy:',
        '  - If no PMF: Pivot vs persevere decision framework',
        '  - If emerging PMF: Double down on what\'s working',
        '  - If strong PMF: Optimize and scale',
        'Segment-specific recommendations',
        'Generate prioritized roadmap for PMF improvement'
      ],
      outputFormat: 'JSON with criticalRecommendations (array), highPriorityRecommendations (array), mediumPriorityRecommendations (array), quickWins (array), strategicInitiatives (array), iterationStrategy (object), segmentRecommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalRecommendations', 'iterationStrategy', 'artifacts'],
      properties: {
        criticalRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              recommendation: { type: 'string' },
              category: { type: 'string', enum: ['product', 'positioning', 'go-to-market', 'customer-success'] },
              rationale: { type: 'string' },
              expectedImpact: { type: 'string' },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              successMetrics: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        highPriorityRecommendations: {
          type: 'array',
          items: { type: 'object' }
        },
        mediumPriorityRecommendations: {
          type: 'array',
          items: { type: 'object' }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        strategicInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              transformativeImpact: { type: 'string' },
              timeline: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        iterationStrategy: {
          type: 'object',
          properties: {
            currentPmfStage: { type: 'string' },
            recommendedApproach: { type: 'string' },
            pivotOrPersevere: { type: 'string', enum: ['persevere', 'iterate', 'pivot-segment', 'pivot-product', 'not-applicable'] },
            focusAreas: { type: 'array', items: { type: 'string' } },
            nextMilestones: { type: 'array', items: { type: 'string' } },
            timeframeToReassess: { type: 'string' }
          }
        },
        segmentRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              approach: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'pmf-assessment', 'recommendations']
}));

// Task 11: Action Plan Creation
export const actionPlanCreationTask = defineTask('action-plan-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create prioritized action plan for PMF improvement',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'product operations manager and execution strategist',
      task: 'Create detailed, prioritized action plan with owners, timelines, and success metrics',
      context: args,
      instructions: [
        'Convert recommendations into actionable tasks:',
        '  - Specific action items',
        '  - Clear owners (roles)',
        '  - Time estimates',
        '  - Dependencies',
        '  - Success criteria',
        'Prioritize initiatives:',
        '  - P0: Critical for PMF (do first)',
        '  - P1: High impact (do next)',
        '  - P2: Medium impact (do if capacity)',
        'Create phased rollout:',
        '  - Phase 1 (0-4 weeks): Quick wins and critical fixes',
        '  - Phase 2 (1-3 months): High priority improvements',
        '  - Phase 3 (3-6 months): Strategic initiatives',
        'Define success metrics for each initiative:',
        '  - Leading indicators (early signals)',
        '  - Lagging indicators (outcome metrics)',
        '  - Target values',
        '  - Measurement frequency',
        'Create timeline and milestones',
        'Identify resource requirements',
        'Define review cadence for PMF tracking',
        'Generate action plan document and tracking dashboard'
      ],
      outputFormat: 'JSON with actionItems (array), prioritizedInitiatives (array), timeline (object), successMetrics (array), resourceRequirements (object), reviewCadence (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'prioritizedInitiatives', 'timeline', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              action: { type: 'string' },
              priority: { type: 'string', enum: ['P0', 'P1', 'P2'] },
              owner: { type: 'string' },
              effort: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              status: { type: 'string', enum: ['not-started', 'in-progress', 'completed'] }
            }
          }
        },
        prioritizedInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              phase: { type: 'number' },
              actionItemIds: { type: 'array', items: { type: 'string' } },
              expectedOutcome: { type: 'string' },
              targetMetrics: { type: 'object' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'number' },
                  name: { type: 'string' },
                  duration: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  milestones: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            totalDuration: { type: 'string' }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              type: { type: 'string', enum: ['leading', 'lagging'] },
              baseline: {},
              target: {},
              measurementFrequency: { type: 'string' }
            }
          }
        },
        resourceRequirements: {
          type: 'object',
          properties: {
            team: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } },
            budget: { type: 'string' }
          }
        },
        reviewCadence: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pmf-assessment', 'action-planning']
}));

// Task 12: PMF Report Generation
export const pmfReportGenerationTask = defineTask('pmf-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive PMF assessment report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'product documentation specialist and executive communicator',
      task: 'Generate comprehensive, stakeholder-ready PMF assessment report',
      context: args,
      instructions: [
        'Create executive summary:',
        '  - Overall PMF verdict and score',
        '  - Key findings (3-5 bullets)',
        '  - Critical recommendations',
        '  - Strategic implications',
        'Document assessment methodology',
        'Present quantitative results:',
        '  - PMF survey results with visualizations',
        '  - Retention metrics and curves',
        '  - NPS analysis',
        '  - Growth indicators',
        '  - Segment analysis',
        'Present qualitative insights:',
        '  - User feedback themes',
        '  - Representative quotes',
        '  - Emotional resonance findings',
        'Competitive positioning section',
        'Detailed recommendations with prioritization',
        'Action plan (if included)',
        'Appendices:',
        '  - Data tables',
        '  - Survey responses',
        '  - Methodology details',
        'Format as professional Markdown',
        'Include data visualizations descriptions',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), pmfVerdict (string), strategicImplications (array), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'pmfVerdict', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              significance: { type: 'string', enum: ['critical', 'high', 'medium'] },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pmfVerdict: { type: 'string' },
        strategicImplications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              implication: { type: 'string' },
              impact: { type: 'string' },
              recommendedAction: { type: 'string' }
            }
          }
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        reportSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              summary: { type: 'string' }
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
  labels: ['agent', 'pmf-assessment', 'documentation']
}));

// Task 13: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate PMF assessment quality and completeness',
  agent: {
    name: 'pmf-auditor',
    prompt: {
      role: 'product analytics auditor and PMF methodology expert',
      task: 'Audit PMF assessment quality, completeness, and adherence to best practices',
      context: args,
      instructions: [
        'Evaluate Data Quality (weight: 20%):',
        '  - Sufficient sample sizes',
        '  - Data completeness',
        '  - Temporal coverage',
        '  - Segment representation',
        'Evaluate Survey Analysis (weight: 20%):',
        '  - Proper application of 40% rule',
        '  - Segment breakdown',
        '  - Statistical significance',
        'Evaluate Retention Analysis (weight: 15%):',
        '  - Cohort analysis depth',
        '  - Benchmark comparison',
        '  - Trend identification',
        'Evaluate Growth Analysis (weight: 15%):',
        '  - Organic vs paid breakdown',
        '  - Unit economics',
        '  - Viral coefficient calculation',
        'Evaluate Qualitative Analysis (weight: 15%):',
        '  - Theme identification',
        '  - Quote representativeness',
        '  - Signal strength assessment',
        'Evaluate Recommendations (weight: 15%):',
        '  - Actionability',
        '  - Evidence-based',
        '  - Prioritization logic',
        'Calculate weighted overall score (0-100)',
        'Identify gaps in analysis',
        'Validate against PMF best practices',
        'Check for analytical biases'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), bestPracticesCheck (array), biases (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'completeness', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            dataQuality: { type: 'number' },
            surveyAnalysis: { type: 'number' },
            retentionAnalysis: { type: 'number' },
            growthAnalysis: { type: 'number' },
            qualitativeAnalysis: { type: 'number' },
            recommendations: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            allMetricsCovered: { type: 'boolean' },
            segmentAnalysisComplete: { type: 'boolean' },
            benchmarksIncluded: { type: 'boolean' },
            actionableRecommendations: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        bestPracticesCheck: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              practice: { type: 'string' },
              followed: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        biases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bias: { type: 'string' },
              detected: { type: 'boolean' },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        assessmentStrengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pmf-assessment', 'quality-validation']
}));
