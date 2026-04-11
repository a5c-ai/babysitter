/**
 * @process specializations/ux-ui-design/user-feedback
 * @description User Feedback Collection and Analysis process for gathering, synthesizing, and prioritizing user feedback
 * through multiple channels including in-app tools, surveys, NPS/CSAT measurement, sentiment analysis, and insight generation
 * @inputs { projectName: string, productName: string, feedbackChannels?: array, targetResponseRate?: number, npsTarget?: number, outputDir?: string }
 * @outputs { success: boolean, feedbackSummary: object, sentimentAnalysis: object, insights: array, recommendations: array, artifacts: array, qualityScore: number }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/user-feedback', {
 *   projectName: 'Mobile App User Feedback Initiative',
 *   productName: 'TaskMaster Pro',
 *   feedbackChannels: ['in-app-widget', 'surveys', 'support-tickets', 'app-reviews'],
 *   targetResponseRate: 15,
 *   npsTarget: 50
 * });
 *
 * @references
 * - NPS Methodology: https://www.netpromoter.com/know/
 * - CSAT Best Practices: https://www.questionpro.com/blog/csat/
 * - Sentiment Analysis: https://www.nngroup.com/articles/sentiment-analysis-user-research/
 * - Voice of Customer: https://www.forrester.com/what-it-means/voice-of-the-customer/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productName,
    feedbackChannels = ['in-app-widget', 'surveys', 'support-tickets', 'app-reviews', 'user-interviews'],
    targetResponseRate = 10,
    npsTarget = 40,
    csatTarget = 4.0,
    collectionPeriod = '30 days',
    minimumResponses = 100,
    outputDir = 'user-feedback-output',
    targetQualityScore = 80,
    enableSentimentAnalysis = true,
    generateActionPlan = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting User Feedback Collection and Analysis for ${productName}`);

  // ============================================================================
  // PHASE 1: FEEDBACK STRATEGY AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning feedback collection strategy');
  const feedbackStrategy = await ctx.task(feedbackStrategyTask, {
    projectName,
    productName,
    feedbackChannels,
    targetResponseRate,
    npsTarget,
    csatTarget,
    collectionPeriod,
    minimumResponses,
    outputDir
  });

  artifacts.push(...feedbackStrategy.artifacts);

  // ============================================================================
  // PHASE 2: FEEDBACK CHANNEL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up feedback collection channels');
  const channelSetup = await ctx.task(feedbackChannelSetupTask, {
    projectName,
    productName,
    feedbackStrategy,
    feedbackChannels,
    outputDir
  });

  artifacts.push(...channelSetup.artifacts);

  // ============================================================================
  // PHASE 3: IN-APP FEEDBACK TOOL IMPLEMENTATION
  // ============================================================================

  const inAppFeedback = feedbackChannels.includes('in-app-widget') || feedbackChannels.includes('in-app-tool');
  let inAppImplementation = null;

  if (inAppFeedback) {
    ctx.log('info', 'Phase 3: Implementing in-app feedback tools');
    inAppImplementation = await ctx.task(inAppFeedbackTask, {
      projectName,
      productName,
      feedbackStrategy,
      channelSetup,
      outputDir
    });
    artifacts.push(...inAppImplementation.artifacts);
  }

  // ============================================================================
  // PHASE 4: SURVEY DESIGN AND DEPLOYMENT
  // ============================================================================

  const includeSurveys = feedbackChannels.includes('surveys') || feedbackChannels.includes('email-surveys');
  let surveyDeployment = null;

  if (includeSurveys) {
    ctx.log('info', 'Phase 4: Designing and deploying feedback surveys');
    surveyDeployment = await ctx.task(surveyDesignTask, {
      projectName,
      productName,
      feedbackStrategy,
      targetResponseRate,
      minimumResponses,
      collectionPeriod,
      outputDir
    });
    artifacts.push(...surveyDeployment.artifacts);
  }

  // ============================================================================
  // PHASE 5: NPS MEASUREMENT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing NPS measurement');
  const npsMeasurement = await ctx.task(npsMeasurementTask, {
    projectName,
    productName,
    feedbackStrategy,
    npsTarget,
    collectionPeriod,
    outputDir
  });

  artifacts.push(...npsMeasurement.artifacts);

  // ============================================================================
  // PHASE 6: CSAT MEASUREMENT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing CSAT measurement');
  const csatMeasurement = await ctx.task(csatMeasurementTask, {
    projectName,
    productName,
    feedbackStrategy,
    csatTarget,
    collectionPeriod,
    outputDir
  });

  artifacts.push(...csatMeasurement.artifacts);

  // Breakpoint: Review feedback collection setup
  await ctx.breakpoint({
    question: `Feedback collection channels configured for ${productName}. Review setup before data collection?`,
    title: 'Feedback Channel Setup Review',
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
        productName,
        channelsConfigured: channelSetup.configuredChannels.length,
        expectedResponseRate: feedbackStrategy.projectedResponseRate,
        npsTarget,
        csatTarget
      }
    }
  });

  // ============================================================================
  // PHASE 7: FEEDBACK DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Collecting feedback data from all channels');
  const feedbackCollection = await ctx.task(feedbackCollectionTask, {
    projectName,
    productName,
    feedbackStrategy,
    channelSetup,
    inAppImplementation,
    surveyDeployment,
    npsMeasurement,
    csatMeasurement,
    collectionPeriod,
    minimumResponses,
    outputDir
  });

  artifacts.push(...feedbackCollection.artifacts);

  // Quality Gate: Minimum response threshold
  const totalResponses = feedbackCollection.totalResponses || 0;
  if (totalResponses < minimumResponses) {
    await ctx.breakpoint({
      question: `Only ${totalResponses} responses collected (target: ${minimumResponses}). Continue with analysis or extend collection period?`,
      title: 'Response Volume Warning',
      context: {
        runId: ctx.runId,
        totalResponses,
        minimumResponses,
        responseRate: feedbackCollection.responseRate,
        recommendation: 'Consider extending collection period or promoting feedback channels more actively'
      }
    });
  }

  // ============================================================================
  // PHASE 8: SENTIMENT ANALYSIS
  // ============================================================================

  let sentimentAnalysis = null;
  if (enableSentimentAnalysis && feedbackCollection.qualitativeResponses > 0) {
    ctx.log('info', 'Phase 8: Performing sentiment analysis on qualitative feedback');
    sentimentAnalysis = await ctx.task(sentimentAnalysisTask, {
      projectName,
      productName,
      feedbackCollection,
      outputDir
    });
    artifacts.push(...sentimentAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 9: FEEDBACK SYNTHESIS AND CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Synthesizing and categorizing feedback');
  const feedbackSynthesis = await ctx.task(feedbackSynthesisTask, {
    projectName,
    productName,
    feedbackCollection,
    sentimentAnalysis,
    npsMeasurement,
    csatMeasurement,
    outputDir
  });

  artifacts.push(...feedbackSynthesis.artifacts);

  // ============================================================================
  // PHASE 10: INSIGHT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating actionable insights from feedback');
  const insightGeneration = await ctx.task(insightGenerationTask, {
    projectName,
    productName,
    feedbackSynthesis,
    sentimentAnalysis,
    npsMeasurement,
    csatMeasurement,
    outputDir
  });

  artifacts.push(...insightGeneration.artifacts);

  // ============================================================================
  // PHASE 11: FEEDBACK PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Prioritizing feedback items by impact and frequency');
  const feedbackPrioritization = await ctx.task(feedbackPrioritizationTask, {
    projectName,
    productName,
    feedbackSynthesis,
    insightGeneration,
    outputDir
  });

  artifacts.push(...feedbackPrioritization.artifacts);

  // ============================================================================
  // PHASE 12: TREND ANALYSIS AND PATTERN DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 12: Analyzing feedback trends and patterns');
  const trendAnalysis = await ctx.task(trendAnalysisTask, {
    projectName,
    productName,
    feedbackCollection,
    feedbackSynthesis,
    npsMeasurement,
    csatMeasurement,
    collectionPeriod,
    outputDir
  });

  artifacts.push(...trendAnalysis.artifacts);

  // ============================================================================
  // PHASE 13: RECOMMENDATIONS GENERATION
  // ============================================================================

  let recommendations = null;
  if (generateActionPlan) {
    ctx.log('info', 'Phase 13: Generating actionable recommendations and action plan');
    recommendations = await ctx.task(recommendationsGenerationTask, {
      projectName,
      productName,
      feedbackSynthesis,
      insightGeneration,
      feedbackPrioritization,
      trendAnalysis,
      outputDir
    });
    artifacts.push(...recommendations.artifacts);
  }

  // ============================================================================
  // PHASE 14: FEEDBACK REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive feedback analysis report');
  const feedbackReport = await ctx.task(feedbackReportGenerationTask, {
    projectName,
    productName,
    feedbackStrategy,
    channelSetup,
    feedbackCollection,
    npsMeasurement,
    csatMeasurement,
    sentimentAnalysis,
    feedbackSynthesis,
    insightGeneration,
    feedbackPrioritization,
    trendAnalysis,
    recommendations,
    outputDir
  });

  artifacts.push(...feedbackReport.artifacts);

  // ============================================================================
  // PHASE 15: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Evaluating feedback analysis quality');
  const qualityScore = await ctx.task(feedbackQualityScoringTask, {
    projectName,
    productName,
    feedbackCollection,
    feedbackSynthesis,
    insightGeneration,
    recommendations,
    feedbackReport,
    targetQualityScore,
    minimumResponses,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= targetQualityScore;

  // Final Breakpoint: Review feedback analysis results
  await ctx.breakpoint({
    question: `User Feedback Analysis complete for ${productName}. Quality Score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review findings?`,
    title: 'Feedback Analysis Review',
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
        productName,
        qualityScore: qualityScore.overallScore,
        qualityMet,
        totalResponses: feedbackCollection.totalResponses,
        npsScore: npsMeasurement.npsScore,
        csatScore: csatMeasurement.csatScore,
        insightsGenerated: insightGeneration.insights.length,
        criticalIssues: feedbackPrioritization.criticalIssues.length,
        topThemes: feedbackSynthesis.themes.slice(0, 5).map(t => t.theme)
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    productName,
    qualityScore: qualityScore.overallScore,
    qualityMet,
    feedbackReport: feedbackReport.reportPath,
    feedbackCollection: {
      totalResponses: feedbackCollection.totalResponses,
      responseRate: feedbackCollection.responseRate,
      channelsUsed: feedbackCollection.channelsUsed,
      collectionPeriod,
      qualitativeResponses: feedbackCollection.qualitativeResponses,
      quantitativeResponses: feedbackCollection.quantitativeResponses
    },
    npsMetrics: {
      score: npsMeasurement.npsScore,
      target: npsTarget,
      metTarget: npsMeasurement.npsScore >= npsTarget,
      promoters: npsMeasurement.promotersPercentage,
      passives: npsMeasurement.passivesPercentage,
      detractors: npsMeasurement.detractorsPercentage,
      trend: npsMeasurement.trend
    },
    csatMetrics: {
      score: csatMeasurement.csatScore,
      target: csatTarget,
      metTarget: csatMeasurement.csatScore >= csatTarget,
      distribution: csatMeasurement.ratingDistribution,
      trend: csatMeasurement.trend
    },
    sentimentAnalysis: sentimentAnalysis ? {
      overallSentiment: sentimentAnalysis.overallSentiment,
      positivePercentage: sentimentAnalysis.positivePercentage,
      neutralPercentage: sentimentAnalysis.neutralPercentage,
      negativePercentage: sentimentAnalysis.negativePercentage,
      sentimentByTopic: sentimentAnalysis.sentimentByTopic
    } : null,
    feedbackSynthesis: {
      totalThemes: feedbackSynthesis.themes.length,
      topThemes: feedbackSynthesis.themes.slice(0, 10),
      categories: feedbackSynthesis.categories,
      painPoints: feedbackSynthesis.painPoints.slice(0, 10),
      featureRequests: feedbackSynthesis.featureRequests.slice(0, 10)
    },
    insights: {
      total: insightGeneration.insights.length,
      critical: insightGeneration.insights.filter(i => i.priority === 'critical').length,
      high: insightGeneration.insights.filter(i => i.priority === 'high').length,
      insights: insightGeneration.insights
    },
    prioritization: {
      criticalIssues: feedbackPrioritization.criticalIssues,
      quickWins: feedbackPrioritization.quickWins,
      longTermImprovements: feedbackPrioritization.longTermImprovements,
      priorityMatrix: feedbackPrioritization.priorityMatrix
    },
    trends: {
      emergingThemes: trendAnalysis.emergingThemes,
      decliningIssues: trendAnalysis.decliningIssues,
      consistentPainPoints: trendAnalysis.consistentPainPoints,
      seasonalPatterns: trendAnalysis.seasonalPatterns
    },
    recommendations: recommendations ? {
      total: recommendations.recommendations.length,
      immediate: recommendations.immediateActions,
      shortTerm: recommendations.shortTermActions,
      longTerm: recommendations.longTermActions,
      estimatedImpact: recommendations.estimatedImpact
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/user-feedback',
      timestamp: startTime,
      version: '1.0.0',
      projectName,
      productName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Feedback Strategy Planning
export const feedbackStrategyTask = defineTask('feedback-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan feedback collection strategy',
  agent: {
    name: 'feedback-strategist',
    prompt: {
      role: 'UX Research Strategist with expertise in Voice of Customer programs and feedback management',
      task: 'Develop comprehensive feedback collection strategy with clear goals, channels, and success metrics',
      context: args,
      instructions: [
        'Define clear objectives for feedback collection (improve NPS, identify pain points, validate features, etc.)',
        'Analyze proposed feedback channels for effectiveness and reach',
        'For each channel, define: purpose, target audience, expected response volume, timing',
        'Develop sampling strategy to ensure representative feedback',
        'Set realistic response rate targets based on industry benchmarks',
        'Define success metrics: response rate, NPS target, CSAT target, sentiment score',
        'Create timeline for feedback collection with milestones',
        'Plan for multi-channel approach to capture diverse feedback',
        'Identify potential biases in feedback collection and mitigation strategies',
        'Define data quality standards and validation criteria',
        'Plan for ongoing vs point-in-time feedback collection',
        'Document feedback collection governance and privacy considerations',
        'Generate comprehensive feedback strategy document'
      ],
      outputFormat: 'JSON with objectives (array), channels (array with channel, purpose, targetAudience, expectedVolume), samplingStrategy, responseRateTarget, successMetrics, timeline, biasConsiderations, dataQualityStandards, governance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'channels', 'successMetrics', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              rationale: { type: 'string' },
              successCriteria: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              targetAudience: { type: 'string' },
              expectedVolume: { type: 'string' },
              timing: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        samplingStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['random', 'stratified', 'convenience', 'purposive', 'mixed'] },
            segmentation: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          }
        },
        projectedResponseRate: { type: 'string' },
        successMetrics: {
          type: 'object',
          properties: {
            responseRateTarget: { type: 'string' },
            npsTarget: { type: 'number' },
            csatTarget: { type: 'number' },
            minResponses: { type: 'number' },
            qualityThreshold: { type: 'number' }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            collectionPeriod: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  date: { type: 'string' },
                  deliverable: { type: 'string' }
                }
              }
            }
          }
        },
        biasConsiderations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bias: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        dataQualityStandards: { type: 'array', items: { type: 'string' } },
        governance: {
          type: 'object',
          properties: {
            dataPrivacy: { type: 'string' },
            consentRequirements: { type: 'string' },
            dataRetention: { type: 'string' },
            accessControl: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'strategy-planning']
}));

// Task 2: Feedback Channel Setup
export const feedbackChannelSetupTask = defineTask('feedback-channel-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up feedback collection channels',
  agent: {
    name: 'feedback-engineer',
    prompt: {
      role: 'UX Engineer and Feedback Systems Specialist',
      task: 'Configure and set up all feedback collection channels according to strategy',
      context: args,
      instructions: [
        'For each feedback channel in strategy, design implementation approach',
        'In-app feedback: widget placement, trigger conditions, form design',
        'Surveys: tool selection (Typeform, SurveyMonkey, Qualtrics, Google Forms), distribution method',
        'Support tickets: integration with helpdesk (Zendesk, Intercom, Freshdesk)',
        'App store reviews: API integration for iOS/Android review monitoring',
        'User interviews: scheduling tool setup, screening process',
        'Social media: monitoring tools setup (Hootsuite, Sprout Social)',
        'Design feedback forms with optimal question flow',
        'Configure feedback routing and notification workflows',
        'Set up data collection endpoints and storage',
        'Implement feedback tagging and categorization system',
        'Configure response tracking and follow-up mechanisms',
        'Test all channels for functionality and data quality',
        'Generate channel setup documentation and configuration guide'
      ],
      outputFormat: 'JSON with configuredChannels (array), channelConfigurations, feedbackForms, dataRouting, testResults, setupDocumentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuredChannels', 'channelConfigurations', 'artifacts'],
      properties: {
        configuredChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              status: { type: 'string', enum: ['configured', 'pending', 'testing', 'live'] },
              tool: { type: 'string' },
              url: { type: 'string' },
              configuration: { type: 'string' }
            }
          }
        },
        channelConfigurations: {
          type: 'object',
          properties: {
            inAppFeedback: {
              type: 'object',
              properties: {
                widgetType: { type: 'string' },
                placement: { type: 'array', items: { type: 'string' } },
                triggerConditions: { type: 'array', items: { type: 'string' } },
                formFields: { type: 'array', items: { type: 'string' } }
              }
            },
            surveys: {
              type: 'object',
              properties: {
                tool: { type: 'string' },
                distributionMethods: { type: 'array', items: { type: 'string' } },
                targetingRules: { type: 'array', items: { type: 'string' } }
              }
            },
            supportIntegration: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                feedbackCategories: { type: 'array', items: { type: 'string' } },
                automationRules: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        feedbackForms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              formName: { type: 'string' },
              purpose: { type: 'string' },
              fields: { type: 'array', items: { type: 'string' } },
              estimatedCompletionTime: { type: 'string' }
            }
          }
        },
        dataRouting: {
          type: 'object',
          properties: {
            collectionEndpoint: { type: 'string' },
            storage: { type: 'string' },
            notifications: { type: 'array', items: { type: 'string' } },
            integrations: { type: 'array', items: { type: 'string' } }
          }
        },
        taggingSystem: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            autoTaggingRules: { type: 'array', items: { type: 'string' } }
          }
        },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              testType: { type: 'string' },
              result: { type: 'string', enum: ['passed', 'failed', 'warning'] },
              notes: { type: 'string' }
            }
          }
        },
        setupDocumentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-feedback', 'channel-setup']
}));

// Task 3: In-App Feedback Implementation
export const inAppFeedbackTask = defineTask('in-app-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement in-app feedback tools',
  agent: {
    name: 'feedback-ux-engineer',
    prompt: {
      role: 'Product Engineer with expertise in in-app feedback mechanisms and user experience',
      task: 'Design and implement user-friendly in-app feedback collection tools',
      context: args,
      instructions: [
        'Design in-app feedback widget: floating button, slide-out panel, modal, embedded form',
        'Choose optimal widget placement: bottom-right corner, side panel, contextual inline',
        'Design feedback form: rating, text input, screenshot capture, emotion selection',
        'Implement smart triggers: post-action, time-based, feature-specific, exit intent',
        'Add contextual feedback: page/feature-specific forms, bug reporting, feature requests',
        'Implement screenshot annotation tool for visual feedback',
        'Design minimal, non-intrusive UI that doesnt disrupt user flow',
        'Add feedback confirmation and thank you message',
        'Implement rate limiting to avoid survey fatigue (max 1 prompt per user per week)',
        'Add opt-out mechanism respecting user preference',
        'Implement A/B testing for widget design and placement',
        'Track widget impression rate and engagement metrics',
        'Ensure mobile responsiveness and accessibility',
        'Generate implementation guide with code examples and best practices'
      ],
      outputFormat: 'JSON with widgetDesign, placementStrategy, formConfiguration, triggerLogic, engagementMetrics, implementationGuide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['widgetDesign', 'placementStrategy', 'formConfiguration', 'artifacts'],
      properties: {
        widgetDesign: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['floating-button', 'slide-out-panel', 'modal', 'embedded', 'contextual'] },
            appearance: { type: 'string' },
            interactionFlow: { type: 'string' },
            mobileOptimization: { type: 'boolean' },
            accessibility: { type: 'array', items: { type: 'string' } }
          }
        },
        placementStrategy: {
          type: 'object',
          properties: {
            defaultPlacement: { type: 'string' },
            contextualPlacements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  page: { type: 'string' },
                  placement: { type: 'string' },
                  rationale: { type: 'string' }
                }
              }
            },
            avoidanceRules: { type: 'array', items: { type: 'string' } }
          }
        },
        formConfiguration: {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fieldType: { type: 'string' },
                  label: { type: 'string' },
                  required: { type: 'boolean' },
                  placeholder: { type: 'string' }
                }
              }
            },
            ratingScale: { type: 'string' },
            allowScreenshots: { type: 'boolean' },
            allowAnonymous: { type: 'boolean' },
            estimatedTime: { type: 'string' }
          }
        },
        triggerLogic: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              condition: { type: 'string' },
              timing: { type: 'string' },
              rateLimiting: { type: 'string' }
            }
          }
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of features: screenshot tool, emotion picker, category selector, etc.'
        },
        engagementMetrics: {
          type: 'object',
          properties: {
            impressionTracking: { type: 'boolean' },
            engagementRate: { type: 'string' },
            completionRate: { type: 'string' },
            dropOffPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        rateLimiting: {
          type: 'object',
          properties: {
            maxPromptsPerUser: { type: 'string' },
            cooldownPeriod: { type: 'string' },
            respectOptOut: { type: 'boolean' }
          }
        },
        implementationGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-feedback', 'in-app-feedback']
}));

// Task 4: Survey Design and Deployment
export const surveyDesignTask = defineTask('survey-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design and deploy feedback surveys',
  agent: {
    name: 'survey-designer',
    prompt: {
      role: 'UX Researcher with expertise in survey methodology and questionnaire design',
      task: 'Design effective feedback surveys with high completion rates and actionable data',
      context: args,
      instructions: [
        'Design survey with clear objective: product feedback, feature validation, satisfaction, usability',
        'Create optimal question flow: screening → warm-up → core questions → demographics',
        'Use mix of question types: multiple choice, rating scales, Likert scales, open-ended',
        'Include NPS question: "How likely are you to recommend us?" (0-10 scale)',
        'Include CSAT questions: "How satisfied are you with [feature]?" (1-5 scale)',
        'Include CES question: "How easy was it to [accomplish task]?" (1-7 scale)',
        'Add open-ended questions for qualitative insights: "What could we improve?"',
        'Keep survey short: 5-10 minutes, 10-15 questions maximum',
        'Use clear, unbiased language; avoid leading questions',
        'Add logic branching for personalized question paths',
        'Design mobile-optimized survey interface',
        'Add progress indicator to reduce drop-off',
        'Create compelling invitation with clear value proposition',
        'Set up automated reminders for non-responders',
        'Configure survey targeting: user segments, behavior triggers, timing',
        'Pilot test survey with small group',
        'Generate survey deployment plan with distribution channels and timeline'
      ],
      outputFormat: 'JSON with surveyDesign, questions (array), distributionPlan, targetingRules, pilotResults, projectedResponseRate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['surveyDesign', 'questions', 'distributionPlan', 'artifacts'],
      properties: {
        surveyDesign: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            targetAudience: { type: 'string' },
            estimatedTime: { type: 'string' },
            questionCount: { type: 'number' },
            incentive: { type: 'string' }
          }
        },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionNumber: { type: 'number' },
              question: { type: 'string' },
              type: { type: 'string', enum: ['multiple-choice', 'rating', 'likert', 'open-ended', 'nps', 'csat', 'ces', 'matrix'] },
              required: { type: 'boolean' },
              options: { type: 'array', items: { type: 'string' } },
              logicBranching: { type: 'string' }
            }
          }
        },
        distributionPlan: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            schedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  channel: { type: 'string' },
                  sendDate: { type: 'string' },
                  targetCount: { type: 'number' }
                }
              }
            },
            reminderStrategy: { type: 'string' }
          }
        },
        targetingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              criteria: { type: 'string' },
              sampleSize: { type: 'number' }
            }
          }
        },
        invitation: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
            valueProposition: { type: 'string' },
            callToAction: { type: 'string' }
          }
        },
        pilotResults: {
          type: 'object',
          properties: {
            pilotSize: { type: 'number' },
            completionRate: { type: 'string' },
            averageTime: { type: 'string' },
            feedback: { type: 'array', items: { type: 'string' } },
            adjustmentsMade: { type: 'array', items: { type: 'string' } }
          }
        },
        projectedResponseRate: { type: 'string' },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-feedback', 'survey-design']
}));

// Task 5: NPS Measurement
export const npsMeasurementTask = defineTask('nps-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement NPS measurement',
  agent: {
    name: 'nps-analyst',
    prompt: {
      role: 'Customer Experience Analyst with expertise in Net Promoter Score methodology',
      task: 'Implement comprehensive NPS measurement and analysis program',
      context: args,
      instructions: [
        'Implement standard NPS question: "On a scale of 0-10, how likely are you to recommend [product] to a friend or colleague?"',
        'Add mandatory follow-up question: "What is the primary reason for your score?"',
        'Segment respondents: Promoters (9-10), Passives (7-8), Detractors (0-6)',
        'Calculate NPS: % Promoters - % Detractors (range: -100 to +100)',
        'Analyze NPS by user segment, feature, usage frequency, tenure',
        'Identify top drivers of promoter scores (what delights users)',
        'Identify top drivers of detractor scores (what frustrates users)',
        'Compare NPS against target and industry benchmarks',
        'Analyze NPS trends over time if historical data available',
        'Conduct closed-loop feedback: follow up with detractors to resolve issues',
        'Prioritize improvements based on detractor feedback volume and impact',
        'Create NPS dashboard with real-time score, distribution, and trends',
        'Generate actionable NPS improvement recommendations',
        'Document NPS methodology and calculation for transparency'
      ],
      outputFormat: 'JSON with npsScore (number -100 to 100), promotersPercentage, passivesPercentage, detractorsPercentage, segmentAnalysis, drivers, closedLoopActions, trend, benchmarkComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['npsScore', 'promotersPercentage', 'passivesPercentage', 'detractorsPercentage', 'artifacts'],
      properties: {
        npsScore: { type: 'number', minimum: -100, maximum: 100 },
        promotersPercentage: { type: 'number', minimum: 0, maximum: 100 },
        passivesPercentage: { type: 'number', minimum: 0, maximum: 100 },
        detractorsPercentage: { type: 'number', minimum: 0, maximum: 100 },
        totalResponses: { type: 'number' },
        segmentAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              npsScore: { type: 'number' },
              sampleSize: { type: 'number' },
              insights: { type: 'string' }
            }
          }
        },
        promoterDrivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driver: { type: 'string' },
              frequency: { type: 'number' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        detractorDrivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driver: { type: 'string' },
              frequency: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        closedLoopActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              detractorIssue: { type: 'string' },
              affectedUsers: { type: 'number' },
              action: { type: 'string' },
              owner: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        trend: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'stable', 'declining', 'insufficient-data'] },
            changeFromPrevious: { type: 'number' },
            historicalScores: { type: 'array', items: { type: 'number' } }
          }
        },
        benchmarkComparison: {
          type: 'object',
          properties: {
            target: { type: 'number' },
            industryAverage: { type: 'number' },
            performanceVsTarget: { type: 'string' },
            performanceVsIndustry: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-feedback', 'nps-measurement']
}));

// Task 6: CSAT Measurement
export const csatMeasurementTask = defineTask('csat-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement CSAT measurement',
  agent: {
    name: 'csat-analyst',
    prompt: {
      role: 'Customer Satisfaction Analyst with expertise in CSAT methodology and experience metrics',
      task: 'Implement Customer Satisfaction Score (CSAT) measurement for product experiences',
      context: args,
      instructions: [
        'Implement CSAT questions: "How satisfied are you with [product/feature]?" (1-5 scale)',
        '5-point scale: Very Dissatisfied, Dissatisfied, Neutral, Satisfied, Very Satisfied',
        'Alternatively use 1-5 numeric scale or emoji scale for visual appeal',
        'Add follow-up question: "What did you like most/least about your experience?"',
        'Implement feature-specific CSAT: measure satisfaction with specific features/interactions',
        'Implement transactional CSAT: measure satisfaction after key events (purchase, support, onboarding)',
        'Calculate CSAT: (Number of Satisfied + Very Satisfied) / Total Responses × 100',
        'Analyze CSAT distribution: percentage at each satisfaction level',
        'Identify features/experiences with highest and lowest satisfaction',
        'Analyze correlation between CSAT and usage/retention',
        'Compare CSAT against target and historical data',
        'Identify satisfaction improvement opportunities',
        'Create CSAT dashboard with scores by feature, user segment, time period',
        'Generate actionable CSAT improvement recommendations'
      ],
      outputFormat: 'JSON with csatScore (number 0-100), ratingDistribution, featureScores, lowPerformingAreas, highPerformingAreas, correlations, trend, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['csatScore', 'ratingDistribution', 'artifacts'],
      properties: {
        csatScore: { type: 'number', minimum: 0, maximum: 100 },
        averageRating: { type: 'number', minimum: 1, maximum: 5 },
        totalResponses: { type: 'number' },
        ratingDistribution: {
          type: 'object',
          properties: {
            verySatisfied: { type: 'number' },
            satisfied: { type: 'number' },
            neutral: { type: 'number' },
            dissatisfied: { type: 'number' },
            veryDissatisfied: { type: 'number' }
          }
        },
        featureScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              csatScore: { type: 'number' },
              sampleSize: { type: 'number' },
              trend: { type: 'string' }
            }
          }
        },
        lowPerformingAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              score: { type: 'number' },
              topComplaints: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        highPerformingAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              score: { type: 'number' },
              successFactors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        correlations: {
          type: 'object',
          properties: {
            withUsageFrequency: { type: 'string' },
            withRetention: { type: 'string' },
            withNPS: { type: 'string' }
          }
        },
        trend: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'stable', 'declining', 'insufficient-data'] },
            changeFromPrevious: { type: 'number' },
            historicalScores: { type: 'array', items: { type: 'number' } }
          }
        },
        targetComparison: {
          type: 'object',
          properties: {
            target: { type: 'number' },
            current: { type: 'number' },
            metTarget: { type: 'boolean' },
            gap: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-feedback', 'csat-measurement']
}));

// Task 7: Feedback Data Collection
export const feedbackCollectionTask = defineTask('feedback-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect feedback data from all channels',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'Data Operations Specialist with expertise in multi-channel data aggregation',
      task: 'Collect, aggregate, and validate feedback data from all configured channels',
      context: args,
      instructions: [
        'Monitor all feedback channels during collection period',
        'Aggregate data from: in-app feedback, surveys, support tickets, app reviews, interviews',
        'Track response rates by channel and user segment',
        'Monitor data quality: completeness, validity, duplicates',
        'Flag low-quality responses: spam, gibberish, test data',
        'Categorize feedback by type: bug report, feature request, usability issue, praise, complaint',
        'Extract and normalize data fields across channels',
        'Link feedback to user metadata: segment, tenure, usage level, device',
        'Track response timing and seasonality patterns',
        'Calculate actual vs projected response rates',
        'Identify under-performing channels and recommend adjustments',
        'Monitor for survey fatigue or response quality degradation',
        'Compile comprehensive feedback dataset with metadata',
        'Generate data collection summary report'
      ],
      outputFormat: 'JSON with totalResponses, responseRate, responsesByChannel, qualitativeResponses, quantitativeResponses, dataQuality, channelPerformance, userSegmentBreakdown, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalResponses', 'responseRate', 'responsesByChannel', 'artifacts'],
      properties: {
        totalResponses: { type: 'number' },
        responseRate: { type: 'string' },
        responsesByChannel: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              responses: { type: 'number' },
              responseRate: { type: 'string' },
              averageQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
            }
          }
        },
        qualitativeResponses: { type: 'number' },
        quantitativeResponses: { type: 'number' },
        channelsUsed: { type: 'array', items: { type: 'string' } },
        dataQuality: {
          type: 'object',
          properties: {
            overallQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
            completenessRate: { type: 'string' },
            validResponses: { type: 'number' },
            flaggedResponses: { type: 'number' },
            duplicates: { type: 'number' }
          }
        },
        channelPerformance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              performance: { type: 'string', enum: ['exceeds-expectations', 'meets-expectations', 'below-expectations'] },
              notes: { type: 'string' },
              recommendations: { type: 'string' }
            }
          }
        },
        userSegmentBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              responses: { type: 'number' },
              percentage: { type: 'string' },
              representativeness: { type: 'string' }
            }
          }
        },
        feedbackTypes: {
          type: 'object',
          properties: {
            bugReports: { type: 'number' },
            featureRequests: { type: 'number' },
            usabilityIssues: { type: 'number' },
            praise: { type: 'number' },
            complaints: { type: 'number' },
            questions: { type: 'number' }
          }
        },
        collectionPeriod: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            actualDuration: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'data-collection']
}));

// Task 8: Sentiment Analysis
export const sentimentAnalysisTask = defineTask('sentiment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sentiment analysis on feedback',
  agent: {
    name: 'sentiment-analyst',
    prompt: {
      role: 'Data Scientist with expertise in Natural Language Processing and sentiment analysis',
      task: 'Analyze sentiment of qualitative feedback to understand emotional tone and user feelings',
      context: args,
      instructions: [
        'Collect all qualitative feedback: open-ended survey responses, comments, reviews, interview transcripts',
        'Apply sentiment analysis to classify feedback: positive, neutral, negative',
        'Use NLP techniques: lexicon-based analysis, machine learning models, or sentiment APIs',
        'Calculate sentiment scores for each feedback item (-1 to +1 or 0-100 scale)',
        'Aggregate sentiment by: overall, by feature, by channel, by user segment, over time',
        'Identify emotionally charged feedback (very positive or very negative)',
        'Extract emotion categories: joy, trust, fear, sadness, anger, surprise',
        'Analyze sentiment trends over collection period',
        'Perform topic-specific sentiment: sentiment per product feature or aspect',
        'Identify sentiment drivers: what makes feedback positive vs negative',
        'Compare sentiment across user segments and channels',
        'Correlate sentiment with quantitative metrics (NPS, CSAT, usage)',
        'Flag extreme negative feedback for immediate attention',
        'Generate sentiment analysis report with visualizations',
        'Validate sentiment accuracy with sample review'
      ],
      outputFormat: 'JSON with overallSentiment, positivePercentage, neutralPercentage, negativePercentage, sentimentScore, sentimentByTopic, emotionCategories, sentimentDrivers, extremeFeedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallSentiment', 'positivePercentage', 'neutralPercentage', 'negativePercentage', 'artifacts'],
      properties: {
        overallSentiment: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
        sentimentScore: { type: 'number', minimum: -1, maximum: 1 },
        positivePercentage: { type: 'number', minimum: 0, maximum: 100 },
        neutralPercentage: { type: 'number', minimum: 0, maximum: 100 },
        negativePercentage: { type: 'number', minimum: 0, maximum: 100 },
        totalAnalyzed: { type: 'number' },
        sentimentByTopic: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              sentiment: { type: 'string' },
              sentimentScore: { type: 'number' },
              feedbackCount: { type: 'number' }
            }
          }
        },
        sentimentByChannel: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              sentiment: { type: 'string' },
              positivePercentage: { type: 'number' }
            }
          }
        },
        sentimentBySegment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              sentiment: { type: 'string' },
              sentimentScore: { type: 'number' }
            }
          }
        },
        emotionCategories: {
          type: 'object',
          properties: {
            joy: { type: 'number' },
            trust: { type: 'number' },
            fear: { type: 'number' },
            sadness: { type: 'number' },
            anger: { type: 'number' },
            surprise: { type: 'number' }
          }
        },
        sentimentDrivers: {
          type: 'object',
          properties: {
            positiveDrivers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  driver: { type: 'string' },
                  frequency: { type: 'number' },
                  examples: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            negativeDrivers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  driver: { type: 'string' },
                  frequency: { type: 'number' },
                  examples: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        extremeFeedback: {
          type: 'object',
          properties: {
            veryPositive: { type: 'array', items: { type: 'string' } },
            veryNegative: { type: 'array', items: { type: 'string' } }
          }
        },
        sentimentTrend: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            weekOverWeekChange: { type: 'number' }
          }
        },
        validationAccuracy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-feedback', 'sentiment-analysis', 'nlp']
}));

// Task 9: Feedback Synthesis
export const feedbackSynthesisTask = defineTask('feedback-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize and categorize feedback',
  agent: {
    name: 'feedback-synthesizer',
    prompt: {
      role: 'UX Researcher with expertise in qualitative data analysis and thematic synthesis',
      task: 'Synthesize feedback from all sources to identify themes, patterns, pain points, and feature requests',
      context: args,
      instructions: [
        'Aggregate all feedback: qualitative responses, NPS comments, CSAT feedback, support tickets, reviews',
        'Perform thematic analysis: affinity mapping to group similar feedback',
        'Identify major themes: recurring topics mentioned across multiple feedback items',
        'Categorize feedback by type: usability, performance, features, content, design, support',
        'Extract user pain points with severity (critical, high, medium, low)',
        'Extract feature requests with demand level (high, medium, low)',
        'Identify positive feedback: what users love and appreciate',
        'Quantify theme frequency: how many users mentioned each theme',
        'Prioritize themes by frequency and sentiment',
        'Link feedback themes to product areas and features',
        'Identify contradictory feedback and edge cases',
        'Create feedback taxonomy for consistent categorization',
        'Generate quotes and examples for each major theme',
        'Validate themes are distinct and non-overlapping',
        'Generate comprehensive feedback synthesis document with theme hierarchy'
      ],
      outputFormat: 'JSON with themes (array with theme, frequency, sentiment, examples), categories, painPoints, featureRequests, positives, contradictions, taxonomy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'categories', 'painPoints', 'featureRequests', 'artifacts'],
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              description: { type: 'string' },
              frequency: { type: 'number' },
              percentage: { type: 'string' },
              sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative', 'mixed'] },
              category: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              affectedFeatures: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            usability: { type: 'number' },
            performance: { type: 'number' },
            features: { type: 'number' },
            content: { type: 'number' },
            design: { type: 'number' },
            support: { type: 'number' },
            pricing: { type: 'number' },
            bugs: { type: 'number' }
          }
        },
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'number' },
              affectedUsers: { type: 'string' },
              currentWorkaround: { type: 'string' },
              quotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        featureRequests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              description: { type: 'string' },
              demand: { type: 'string', enum: ['high', 'medium', 'low'] },
              frequency: { type: 'number' },
              userBenefit: { type: 'string' },
              quotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        positives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              description: { type: 'string' },
              frequency: { type: 'number' },
              quotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contradictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              viewpoint1: { type: 'string' },
              viewpoint2: { type: 'string' },
              segmentDifference: { type: 'string' }
            }
          }
        },
        taxonomy: {
          type: 'object',
          properties: {
            level1Categories: { type: 'array', items: { type: 'string' } },
            level2Subcategories: { type: 'object' },
            taggingGuidelines: { type: 'string' }
          }
        },
        keyQuotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              theme: { type: 'string' },
              sentiment: { type: 'string' },
              impact: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'synthesis', 'thematic-analysis']
}));

// Task 10: Insight Generation
export const insightGenerationTask = defineTask('insight-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate actionable insights from feedback',
  agent: {
    name: 'insight-strategist',
    prompt: {
      role: 'Product Strategist with expertise in transforming feedback into actionable insights',
      task: 'Transform feedback themes and patterns into strategic, actionable insights',
      context: args,
      instructions: [
        'Review feedback synthesis, sentiment analysis, NPS/CSAT data',
        'Transform themes into insights: what does this feedback mean for the product?',
        'An insight goes beyond observation to explain WHY and WHAT TO DO',
        'For each major theme, generate insight:',
        '  - What is the underlying user need or problem?',
        '  - Why is this important? (business impact, user impact)',
        '  - What are the implications for product strategy?',
        '  - What action should be taken?',
        'Connect feedback to business metrics: retention, satisfaction, growth',
        'Identify quick wins: high-impact, low-effort improvements',
        'Identify strategic opportunities: insights that could differentiate product',
        'Prioritize insights by: user impact, business impact, feasibility',
        'Validate insights are actionable, specific, and evidence-based',
        'Link insights back to original feedback for traceability',
        'Identify insights by user segment if patterns differ',
        'Generate insight summary with prioritization framework'
      ],
      outputFormat: 'JSON with insights (array with insight, evidence, userImpact, businessImpact, action, priority), criticalInsights, quickWins, strategicOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'criticalInsights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              category: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              underlyingNeed: { type: 'string' },
              userImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              businessImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              implications: { type: 'string' },
              recommendedAction: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              feasibility: { type: 'string', enum: ['easy', 'moderate', 'difficult'] },
              affectedSegments: { type: 'array', items: { type: 'string' } },
              linkedThemes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              urgency: { type: 'string' },
              risk: { type: 'string' },
              immediateAction: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' },
              estimatedValue: { type: 'string' }
            }
          }
        },
        strategicOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              differentiation: { type: 'string' },
              marketPotential: { type: 'string' },
              investmentRequired: { type: 'string' }
            }
          }
        },
        insightsBySegment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              uniqueInsights: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prioritizationFramework: {
          type: 'object',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            methodology: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'insight-generation']
}));

// Task 11: Feedback Prioritization
export const feedbackPrioritizationTask = defineTask('feedback-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize feedback by impact and frequency',
  agent: {
    name: 'feedback-prioritizer',
    prompt: {
      role: 'Product Manager with expertise in prioritization frameworks and roadmap planning',
      task: 'Prioritize feedback items using systematic framework to guide product decisions',
      context: args,
      instructions: [
        'Aggregate all feedback items: pain points, feature requests, bugs, improvements',
        'Apply prioritization framework: Impact vs Effort (2×2 matrix)',
        '  - High Impact + Low Effort = Quick Wins (do immediately)',
        '  - High Impact + High Effort = Major Projects (plan for roadmap)',
        '  - Low Impact + Low Effort = Fill-ins (nice to have)',
        '  - Low Impact + High Effort = Avoid (deprioritize)',
        'Calculate impact score based on:',
        '  - Frequency: how many users mentioned it',
        '  - Severity: how much it affects user experience',
        '  - Sentiment: how negatively it impacts satisfaction',
        '  - Business impact: effect on retention, conversion, revenue',
        'Estimate effort based on: complexity, dependencies, resources required',
        'Identify critical issues requiring immediate attention (security, data loss, blockers)',
        'Separate into categories: bugs, usability improvements, new features, design changes',
        'Consider strategic alignment: does it align with product vision?',
        'Factor in technical debt and long-term maintainability',
        'Create prioritized backlog with recommended timeline',
        'Generate priority matrix visualization',
        'Document prioritization rationale for transparency'
      ],
      outputFormat: 'JSON with prioritizedItems (array), criticalIssues, quickWins, majorProjects, longTermImprovements, deprioritized, priorityMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedItems', 'criticalIssues', 'quickWins', 'priorityMatrix', 'artifacts'],
      properties: {
        prioritizedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              item: { type: 'string' },
              type: { type: 'string', enum: ['bug', 'usability', 'feature', 'design', 'performance', 'content'] },
              impactScore: { type: 'number', minimum: 0, maximum: 100 },
              effortEstimate: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'number' },
              affectedUsers: { type: 'string' },
              businessImpact: { type: 'string' },
              recommendedTimeline: { type: 'string' }
            }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              affectedUsers: { type: 'string' },
              risk: { type: 'string' },
              recommendedAction: { type: 'string' },
              deadline: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              estimatedTime: { type: 'string' },
              expectedOutcome: { type: 'string' }
            }
          }
        },
        majorProjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              project: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              roadmapFit: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        longTermImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              strategicValue: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        deprioritized: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        priorityMatrix: {
          type: 'object',
          properties: {
            quickWinsCount: { type: 'number' },
            majorProjectsCount: { type: 'number' },
            fillInsCount: { type: 'number' },
            avoidCount: { type: 'number' }
          }
        },
        scoringCriteria: {
          type: 'object',
          properties: {
            impactFactors: { type: 'array', items: { type: 'string' } },
            effortFactors: { type: 'array', items: { type: 'string' } },
            methodology: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'prioritization']
}));

// Task 12: Trend Analysis
export const trendAnalysisTask = defineTask('trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze feedback trends and patterns',
  agent: {
    name: 'trend-analyst',
    prompt: {
      role: 'Data Analyst with expertise in trend analysis and pattern detection',
      task: 'Analyze feedback trends over time to identify emerging issues, improvements, and patterns',
      context: args,
      instructions: [
        'Analyze feedback trends over collection period',
        'Identify emerging themes: new topics gaining traction',
        'Identify declining issues: problems being resolved or becoming less relevant',
        'Identify consistent pain points: persistent issues mentioned throughout period',
        'Analyze NPS and CSAT trends: improving, stable, or declining',
        'Correlate feedback trends with product changes, releases, marketing campaigns',
        'Identify seasonal or cyclical patterns in feedback',
        'Analyze feedback volume trends: increasing, decreasing, stable',
        'Compare feedback sentiment over time',
        'Identify early warning signals: small issues potentially growing',
        'Segment trend analysis by user cohort, channel, feature',
        'Predict future trends based on current trajectory',
        'Identify correlation between trends (e.g., new feature launch → feedback spike)',
        'Generate trend analysis report with time-series visualizations'
      ],
      outputFormat: 'JSON with emergingThemes, decliningIssues, consistentPainPoints, metricTrends, seasonalPatterns, volumeTrends, sentimentTrend, earlyWarnings, predictions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['emergingThemes', 'decliningIssues', 'consistentPainPoints', 'artifacts'],
      properties: {
        emergingThemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              growthRate: { type: 'string' },
              currentVolume: { type: 'number' },
              trajectory: { type: 'string' },
              potentialImpact: { type: 'string' }
            }
          }
        },
        decliningIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              declineRate: { type: 'string' },
              likelyReason: { type: 'string' },
              validation: { type: 'string' }
            }
          }
        },
        consistentPainPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              frequency: { type: 'string' },
              duration: { type: 'string' },
              urgency: { type: 'string' }
            }
          }
        },
        metricTrends: {
          type: 'object',
          properties: {
            npsHistory: { type: 'array', items: { type: 'number' } },
            npsTrend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            csatHistory: { type: 'array', items: { type: 'number' } },
            csatTrend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            sentimentHistory: { type: 'array', items: { type: 'number' } },
            sentimentTrend: { type: 'string', enum: ['improving', 'stable', 'declining'] }
          }
        },
        seasonalPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              timing: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        volumeTrends: {
          type: 'object',
          properties: {
            overallTrend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
            weekOverWeekChange: { type: 'string' },
            channelTrends: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  channel: { type: 'string' },
                  trend: { type: 'string' }
                }
              }
            }
          }
        },
        earlyWarnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              warning: { type: 'string' },
              signal: { type: 'string' },
              recommendedAction: { type: 'string' }
            }
          }
        },
        correlations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              feedbackImpact: { type: 'string' },
              correlation: { type: 'string' }
            }
          }
        },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prediction: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              basis: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'trend-analysis']
}));

// Task 13: Recommendations Generation
export const recommendationsGenerationTask = defineTask('recommendations-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate actionable recommendations',
  agent: {
    name: 'product-strategist',
    prompt: {
      role: 'Senior Product Strategist with expertise in translating insights into action plans',
      task: 'Generate comprehensive, prioritized recommendations and action plan based on feedback analysis',
      context: args,
      instructions: [
        'Review all insights, prioritized feedback, and trend analysis',
        'Generate specific, actionable recommendations for each critical insight',
        'Structure recommendations by timeline:',
        '  - Immediate actions (this week): critical issues, quick wins',
        '  - Short-term actions (1-3 months): high-priority improvements',
        '  - Long-term actions (3-12 months): strategic initiatives',
        'For each recommendation, specify:',
        '  - What to do (specific action)',
        '  - Why to do it (benefit, impact)',
        '  - Who should own it (team/role)',
        '  - Success metrics (how to measure)',
        '  - Dependencies and risks',
        'Group recommendations by category: UX improvements, features, bugs, performance, content',
        'Estimate impact on key metrics: NPS, CSAT, retention, engagement',
        'Consider resource constraints and feasibility',
        'Identify quick wins that can build momentum',
        'Include recommendations for feedback program improvement',
        'Create roadmap view of recommendations',
        'Generate executive summary for stakeholders',
        'Document expected outcomes and success criteria'
      ],
      outputFormat: 'JSON with recommendations (array), immediateActions, shortTermActions, longTermActions, estimatedImpact, roadmap, executiveSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'immediateActions', 'executiveSummary', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              category: { type: 'string' },
              rationale: { type: 'string' },
              expectedBenefit: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              timeline: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              owner: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              successMetrics: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        immediateActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              urgency: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              expectedOutcome: { type: 'string' }
            }
          }
        },
        shortTermActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              timeline: { type: 'string' },
              priority: { type: 'string' },
              estimatedImpact: { type: 'string' }
            }
          }
        },
        longTermActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              strategicValue: { type: 'string' },
              timeline: { type: 'string' },
              investmentRequired: { type: 'string' }
            }
          }
        },
        estimatedImpact: {
          type: 'object',
          properties: {
            npsImprovement: { type: 'string' },
            csatImprovement: { type: 'string' },
            retentionImpact: { type: 'string' },
            engagementImpact: { type: 'string' }
          }
        },
        roadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quarter: { type: 'string' },
              initiatives: { type: 'array', items: { type: 'string' } },
              expectedOutcomes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        feedbackProgramImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-feedback', 'recommendations', 'action-planning']
}));

// Task 14: Feedback Report Generation
export const feedbackReportGenerationTask = defineTask('feedback-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive feedback report',
  agent: {
    name: 'feedback-reporter',
    prompt: {
      role: 'UX Research Lead and Technical Writer',
      task: 'Generate comprehensive, stakeholder-ready feedback analysis report',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - Overall feedback sentiment and key metrics',
        '  - Top 5 insights and implications',
        '  - Critical issues requiring attention',
        '  - Top recommendations',
        'Include methodology section:',
        '  - Feedback collection approach and channels',
        '  - Response rates and sample demographics',
        '  - Analysis methods used',
        '  - Limitations and confidence levels',
        'Present quantitative findings:',
        '  - NPS score, trend, distribution',
        '  - CSAT score, trend, distribution',
        '  - Response volume by channel',
        '  - Key metrics with visualizations',
        'Present qualitative findings:',
        '  - Major themes with frequency and sentiment',
        '  - Representative quotes',
        '  - Pain points ranked by severity',
        '  - Feature requests ranked by demand',
        'Include sentiment analysis section:',
        '  - Overall sentiment distribution',
        '  - Sentiment by topic/feature',
        '  - Emotional patterns',
        'Present insights section:',
        '  - Actionable insights with evidence',
        '  - Prioritization framework',
        '  - Impact assessment',
        'Include trend analysis:',
        '  - Emerging themes and patterns',
        '  - Metric trends over time',
        '  - Predictions and early warnings',
        'Present recommendations:',
        '  - Prioritized action plan',
        '  - Expected impact',
        '  - Implementation roadmap',
        'Add appendices: raw data, full theme list, methodology details',
        'Design report for multiple audiences: executives, product, design, engineering',
        'Include data visualizations: charts, graphs, word clouds, journey maps',
        'Format professionally with consistent branding'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keySections, dataVisualizations, targetAudiences, distributionPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keySections', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keySections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              summary: { type: 'string' },
              pageCount: { type: 'number' }
            }
          }
        },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              importance: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        dataVisualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              visualization: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        targetAudiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              audience: { type: 'string' },
              relevantSections: { type: 'array', items: { type: 'string' } },
              format: { type: 'string' }
            }
          }
        },
        distributionPlan: {
          type: 'object',
          properties: {
            presentationDate: { type: 'string' },
            stakeholders: { type: 'array', items: { type: 'string' } },
            formats: { type: 'array', items: { type: 'string' } },
            followUpActions: { type: 'array', items: { type: 'string' } }
          }
        },
        supplementaryMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              material: { type: 'string' },
              purpose: { type: 'string' },
              path: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'reporting', 'documentation']
}));

// Task 15: Feedback Quality Scoring
export const feedbackQualityScoringTask = defineTask('feedback-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score feedback analysis quality',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'Senior UX Researcher and Quality Assurance Specialist',
      task: 'Assess overall quality, rigor, and actionability of feedback analysis',
      context: args,
      instructions: [
        'Evaluate data collection quality (weight: 20%):',
        '  - Was response volume sufficient?',
        '  - Was sample representative of user base?',
        '  - Was data quality high (completeness, validity)?',
        '  - Were multiple channels used effectively?',
        'Evaluate synthesis quality (weight: 20%):',
        '  - Was thematic analysis thorough?',
        '  - Were themes well-defined and distinct?',
        '  - Was categorization logical and consistent?',
        '  - Were patterns validated across data sources?',
        'Evaluate insight quality (weight: 25%):',
        '  - Are insights truly insightful (non-obvious)?',
        '  - Are insights actionable and specific?',
        '  - Are insights well-supported by evidence?',
        '  - Do insights address strategic questions?',
        'Evaluate prioritization quality (weight: 15%):',
        '  - Was systematic framework used?',
        '  - Are priorities well-justified?',
        '  - Are critical issues identified correctly?',
        'Evaluate recommendations quality (weight: 15%):',
        '  - Are recommendations specific and actionable?',
        '  - Is expected impact quantified?',
        '  - Are timelines and owners defined?',
        'Evaluate reporting quality (weight: 5%):',
        '  - Is report clear and comprehensive?',
        '  - Are findings presented effectively?',
        '  - Is report tailored for stakeholders?',
        'Calculate weighted overall score (0-100)',
        'Identify strengths and gaps in analysis',
        'Provide recommendations for improving future feedback cycles'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores, strengths, gaps, improvements, confidenceLevel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'strengths', 'gaps', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            dataCollectionQuality: { type: 'number' },
            synthesisQuality: { type: 'number' },
            insightQuality: { type: 'number' },
            prioritizationQuality: { type: 'number' },
            recommendationsQuality: { type: 'number' },
            reportingQuality: { type: 'number' }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              benefit: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        confidenceLevel: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
        readinessForAction: { type: 'string', enum: ['ready', 'mostly-ready', 'needs-refinement'] },
        validationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              passed: { type: 'boolean' },
              notes: { type: 'string' }
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
  labels: ['agent', 'user-feedback', 'quality-scoring', 'validation']
}));
