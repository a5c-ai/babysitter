/**
 * @process product-management/competitive-analysis
 * @description Comprehensive competitive analysis and market positioning framework with competitor identification, feature comparison, SWOT analysis, positioning strategy, differentiation mapping, and market positioning visualization
 * @inputs { productName: string, targetMarket: object, competitorList: array, features: array, outputDir: string, analysisDepth: string }
 * @outputs { success: boolean, competitors: object, featureComparison: object, swotAnalysis: object, positioningStrategy: object, differentiation: object, marketPositioningMap: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName = 'Product',
    targetMarket = {},
    competitorList = [],
    features = [],
    outputDir = 'competitive-analysis-output',
    analysisDepth = 'comprehensive', // comprehensive | focused | quick
    includeEmergingCompetitors = true,
    generatePositioningMap = true,
    swotWorkshop = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Competitive Analysis and Positioning for ${productName}`);

  // ============================================================================
  // PHASE 1: MARKET LANDSCAPE AND COMPETITOR IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying competitors and mapping market landscape');
  const competitorIdentification = await ctx.task(competitorIdentificationTask, {
    productName,
    targetMarket,
    competitorList,
    includeEmergingCompetitors,
    analysisDepth,
    outputDir
  });

  artifacts.push(...competitorIdentification.artifacts);

  // Breakpoint: Review identified competitors
  await ctx.breakpoint({
    question: `Identified ${competitorIdentification.totalCompetitors} competitors (${competitorIdentification.directCompetitors.length} direct, ${competitorIdentification.indirectCompetitors.length} indirect, ${competitorIdentification.emergingCompetitors?.length || 0} emerging). Review competitor list before detailed analysis?`,
    title: 'Competitor Identification Review',
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
        totalCompetitors: competitorIdentification.totalCompetitors,
        directCompetitors: competitorIdentification.directCompetitors.length,
        indirectCompetitors: competitorIdentification.indirectCompetitors.length,
        emergingCompetitors: competitorIdentification.emergingCompetitors?.length || 0,
        marketSegments: competitorIdentification.marketSegments?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 2: COMPETITOR PROFILING AND RESEARCH
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating detailed competitor profiles');

  // Parallel profiling of top competitors
  const topCompetitors = [
    ...competitorIdentification.directCompetitors.slice(0, 3),
    ...competitorIdentification.indirectCompetitors.slice(0, 2)
  ];

  const competitorProfiles = await ctx.parallel.all(
    topCompetitors.map((competitor, index) =>
      () => ctx.task(competitorProfilingTask, {
        productName,
        competitor,
        competitorIndex: index + 1,
        targetMarket,
        analysisDepth,
        outputDir
      })
    )
  );

  competitorProfiles.forEach(profile => {
    artifacts.push(...(profile.artifacts || []));
  });

  const profilingSummary = {
    profiles: competitorProfiles,
    totalProfiled: competitorProfiles.length
  };

  // ============================================================================
  // PHASE 3: FEATURE COMPARISON MATRIX
  // ============================================================================

  ctx.log('info', 'Phase 3: Building comprehensive feature comparison matrix');
  const featureComparison = await ctx.task(featureComparisonTask, {
    productName,
    features,
    competitors: topCompetitors,
    competitorProfiles: profilingSummary.profiles,
    targetMarket,
    outputDir
  });

  artifacts.push(...featureComparison.artifacts);

  // ============================================================================
  // PHASE 4: SWOT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting SWOT analysis');
  const swotAnalysis = await ctx.task(swotAnalysisTask, {
    productName,
    featureComparison,
    competitorProfiles: profilingSummary.profiles,
    targetMarket,
    includeWorkshop: swotWorkshop,
    outputDir
  });

  artifacts.push(...swotAnalysis.artifacts);

  // Breakpoint: Review SWOT analysis
  await ctx.breakpoint({
    question: `SWOT analysis complete. Strengths: ${swotAnalysis.strengths.length}, Weaknesses: ${swotAnalysis.weaknesses.length}, Opportunities: ${swotAnalysis.opportunities.length}, Threats: ${swotAnalysis.threats.length}. Review before positioning strategy?`,
    title: 'SWOT Analysis Review',
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
        strengths: swotAnalysis.strengths.length,
        weaknesses: swotAnalysis.weaknesses.length,
        opportunities: swotAnalysis.opportunities.length,
        threats: swotAnalysis.threats.length,
        criticalStrengths: swotAnalysis.criticalStrengths?.length || 0,
        criticalWeaknesses: swotAnalysis.criticalWeaknesses?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 5: DIFFERENTIATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining differentiation strategy');
  const differentiation = await ctx.task(differentiationStrategyTask, {
    productName,
    featureComparison,
    swotAnalysis,
    competitorProfiles: profilingSummary.profiles,
    targetMarket,
    outputDir
  });

  artifacts.push(...differentiation.artifacts);

  // ============================================================================
  // PHASE 6: MARKET POSITIONING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing market positioning strategy');
  const positioningStrategy = await ctx.task(positioningStrategyTask, {
    productName,
    differentiation,
    swotAnalysis,
    featureComparison,
    targetMarket,
    competitorProfiles: profilingSummary.profiles,
    outputDir
  });

  artifacts.push(...positioningStrategy.artifacts);

  // ============================================================================
  // PHASE 7: PERCEPTUAL POSITIONING MAP
  // ============================================================================

  let positioningMap = null;
  if (generatePositioningMap) {
    ctx.log('info', 'Phase 7: Creating perceptual positioning map');
    positioningMap = await ctx.task(positioningMapTask, {
      productName,
      competitors: topCompetitors,
      positioningStrategy,
      featureComparison,
      targetMarket,
      outputDir
    });

    artifacts.push(...positioningMap.artifacts);
  }

  // ============================================================================
  // PHASE 8: COMPETITIVE INTELLIGENCE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating competitive intelligence report');
  const intelligenceReport = await ctx.task(competitiveIntelligenceReportTask, {
    productName,
    competitorIdentification,
    competitorProfiles: profilingSummary.profiles,
    featureComparison,
    swotAnalysis,
    differentiation,
    positioningStrategy,
    positioningMap,
    outputDir
  });

  artifacts.push(...intelligenceReport.artifacts);

  // ============================================================================
  // PHASE 9: STRATEGIC RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Formulating strategic recommendations');
  const strategicRecommendations = await ctx.task(strategicRecommendationsTask, {
    productName,
    swotAnalysis,
    differentiation,
    positioningStrategy,
    featureComparison,
    competitorProfiles: profilingSummary.profiles,
    outputDir
  });

  artifacts.push(...strategicRecommendations.artifacts);

  // ============================================================================
  // PHASE 10: GO-TO-MARKET IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 10: Analyzing go-to-market implications');
  const gtmImplications = await ctx.task(gtmImplicationsTask, {
    productName,
    positioningStrategy,
    differentiation,
    targetMarket,
    competitorProfiles: profilingSummary.profiles,
    strategicRecommendations,
    outputDir
  });

  artifacts.push(...gtmImplications.artifacts);

  // Final breakpoint: Review complete analysis
  await ctx.breakpoint({
    question: `Competitive analysis complete for ${productName}. Analyzed ${profilingSummary.totalProfiled} competitors, identified ${differentiation.differentiators.length} key differentiators, and ${strategicRecommendations.recommendations.length} strategic recommendations. Review and approve final analysis?`,
    title: 'Final Competitive Analysis Review',
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
        totalCompetitors: competitorIdentification.totalCompetitors,
        competitorsProfiled: profilingSummary.totalProfiled,
        keyDifferentiators: differentiation.differentiators.length,
        positioningTheme: positioningStrategy.positioningStatement,
        strategicRecommendations: strategicRecommendations.recommendations.length,
        totalArtifacts: artifacts.length,
        analysisDuration: ctx.now() - startTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    analysisDepth,
    competitors: {
      total: competitorIdentification.totalCompetitors,
      direct: competitorIdentification.directCompetitors,
      indirect: competitorIdentification.indirectCompetitors,
      emerging: competitorIdentification.emergingCompetitors,
      profiles: profilingSummary.profiles
    },
    featureComparison: {
      features: featureComparison.features,
      competitiveGaps: featureComparison.competitiveGaps,
      competitiveAdvantages: featureComparison.competitiveAdvantages,
      parityFeatures: featureComparison.parityFeatures,
      overallScore: featureComparison.competitiveScore
    },
    swotAnalysis: {
      strengths: swotAnalysis.strengths,
      weaknesses: swotAnalysis.weaknesses,
      opportunities: swotAnalysis.opportunities,
      threats: swotAnalysis.threats,
      criticalInsights: swotAnalysis.criticalInsights,
      strategicImplications: swotAnalysis.strategicImplications
    },
    positioningStrategy: {
      positioningStatement: positioningStrategy.positioningStatement,
      targetSegment: positioningStrategy.targetSegment,
      valueProposition: positioningStrategy.valueProposition,
      keyMessages: positioningStrategy.keyMessages,
      positioningPillars: positioningStrategy.positioningPillars
    },
    differentiation: {
      differentiators: differentiation.differentiators,
      uniqueValueProps: differentiation.uniqueValueProps,
      competitiveAdvantages: differentiation.competitiveAdvantages,
      differentiationStrategy: differentiation.strategy
    },
    marketPositioningMap: positioningMap ? {
      axes: positioningMap.axes,
      positions: positioningMap.positions,
      visualization: positioningMap.visualization,
      insights: positioningMap.insights
    } : null,
    strategicRecommendations: {
      recommendations: strategicRecommendations.recommendations,
      quickWins: strategicRecommendations.quickWins,
      longTermInitiatives: strategicRecommendations.longTermInitiatives,
      priorities: strategicRecommendations.priorities
    },
    gtmImplications: {
      targetChannels: gtmImplications.targetChannels,
      messagingStrategy: gtmImplications.messagingStrategy,
      pricingConsiderations: gtmImplications.pricingConsiderations,
      competitiveResponse: gtmImplications.competitiveResponse
    },
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/competitive-analysis',
      timestamp: startTime,
      outputDir,
      analysisDepth
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Competitor Identification
export const competitorIdentificationTask = defineTask('competitor-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and categorize competitors',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'market research analyst and competitive intelligence specialist',
      task: 'Identify and categorize competitors in the market landscape',
      context: args,
      instructions: [
        'Analyze target market and identify all relevant competitors',
        '',
        'DIRECT COMPETITORS:',
        '  - Companies offering similar products/services to same target market',
        '  - Head-to-head competition',
        '  - Same customer needs addressed',
        '  - Similar features and pricing',
        '',
        'INDIRECT COMPETITORS:',
        '  - Alternative solutions to same problem',
        '  - Different approach but same outcome',
        '  - Adjacent market players',
        '  - Substitute products/services',
        '',
        'EMERGING COMPETITORS:',
        '  - Startups entering the space',
        '  - New entrants with disruptive approaches',
        '  - Adjacent players expanding into the market',
        '  - Potential future threats',
        '',
        'POTENTIAL COMPETITORS:',
        '  - Large companies that could enter the market',
        '  - Companies with relevant capabilities',
        '  - Market expansion opportunities',
        '',
        'For each competitor, capture:',
        '  - Company name and description',
        '  - Product/service offerings',
        '  - Target market and customer segments',
        '  - Market position and size',
        '  - Geographic presence',
        '  - Competitive threat level (high/medium/low)',
        '  - Key differentiators',
        '',
        'Analyze market structure:',
        '  - Market leaders vs challengers vs niche players',
        '  - Market concentration (fragmented vs consolidated)',
        '  - Competitive intensity',
        '  - Barriers to entry',
        '',
        'Identify market segments and positioning',
        'Create competitor categorization matrix',
        'Save competitor landscape analysis to output directory'
      ],
      outputFormat: 'JSON with totalCompetitors, directCompetitors (array), indirectCompetitors (array), emergingCompetitors (array), potentialCompetitors (array), marketSegments (array), competitiveIntensity (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCompetitors', 'directCompetitors', 'indirectCompetitors', 'artifacts'],
      properties: {
        totalCompetitors: { type: 'number' },
        directCompetitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              products: { type: 'array', items: { type: 'string' } },
              targetMarket: { type: 'string' },
              marketPosition: { type: 'string', enum: ['leader', 'challenger', 'follower', 'niche'] },
              threatLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              geography: { type: 'array', items: { type: 'string' } },
              estimatedSize: { type: 'string' },
              keyDifferentiators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        indirectCompetitors: { type: 'array' },
        emergingCompetitors: { type: 'array' },
        potentialCompetitors: { type: 'array' },
        marketSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              size: { type: 'string' },
              growth: { type: 'string' },
              competitors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        marketStructure: {
          type: 'object',
          properties: {
            concentration: { type: 'string', enum: ['highly-concentrated', 'moderate', 'fragmented'] },
            leaders: { type: 'array', items: { type: 'string' } },
            competitiveIntensity: { type: 'string', enum: ['high', 'medium', 'low'] },
            barriersToEntry: { type: 'array', items: { type: 'string' } }
          }
        },
        competitiveIntensity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-analysis', 'competitor-identification']
}));

// Task 2: Competitor Profiling
export const competitorProfilingTask = defineTask('competitor-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Profile competitor ${args.competitorIndex}`,
  agent: {
    name: 'competitive-intelligence-analyst',
    prompt: {
      role: 'competitive intelligence analyst and business researcher',
      task: 'Create comprehensive competitor profile with deep analysis',
      context: args,
      instructions: [
        'Create detailed competitor profile covering:',
        '',
        'COMPANY OVERVIEW:',
        '  - Company background and history',
        '  - Leadership team',
        '  - Company size (employees, revenue)',
        '  - Funding/financial status',
        '  - Growth trajectory',
        '',
        'PRODUCT/SERVICE ANALYSIS:',
        '  - Product portfolio',
        '  - Feature set and capabilities',
        '  - Pricing model and tiers',
        '  - Technology stack (if known)',
        '  - Product roadmap signals',
        '  - Recent product launches',
        '',
        'GO-TO-MARKET STRATEGY:',
        '  - Target customers and segments',
        '  - Sales model (direct, channel, self-service)',
        '  - Marketing approach and channels',
        '  - Brand positioning',
        '  - Geographic coverage',
        '',
        'CUSTOMER BASE:',
        '  - Customer profile and segments',
        '  - Notable customers (case studies)',
        '  - Customer satisfaction signals',
        '  - Reviews and ratings',
        '  - NPS or satisfaction scores (if available)',
        '',
        'STRENGTHS AND WEAKNESSES:',
        '  - Key competitive advantages',
        '  - Unique capabilities',
        '  - Weaknesses and gaps',
        '  - Customer complaints and pain points',
        '',
        'MARKET PRESENCE:',
        '  - Market share (if available)',
        '  - Brand recognition',
        '  - Thought leadership',
        '  - Partnerships and integrations',
        '  - Community and ecosystem',
        '',
        'STRATEGY SIGNALS:',
        '  - Strategic direction indicators',
        '  - Recent acquisitions or partnerships',
        '  - Job postings (talent strategy)',
        '  - Executive statements and vision',
        '',
        'COMPETITIVE THREAT ASSESSMENT:',
        '  - Overall threat level',
        '  - Areas of direct competition',
        '  - Likely competitive moves',
        '  - Vulnerabilities to exploit',
        '',
        'Save detailed competitor profile to output directory'
      ],
      outputFormat: 'JSON with companyOverview (object), productAnalysis (object), gtmStrategy (object), customerBase (object), strengths (array), weaknesses (array), marketPresence (object), strategySignals (array), threatAssessment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['companyOverview', 'productAnalysis', 'strengths', 'weaknesses', 'artifacts'],
      properties: {
        companyOverview: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            founded: { type: 'string' },
            headquarters: { type: 'string' },
            employeeCount: { type: 'string' },
            revenue: { type: 'string' },
            funding: { type: 'string' },
            leadership: { type: 'array', items: { type: 'string' } }
          }
        },
        productAnalysis: {
          type: 'object',
          properties: {
            products: { type: 'array', items: { type: 'string' } },
            coreFeatures: { type: 'array', items: { type: 'string' } },
            pricingModel: { type: 'string' },
            pricingTiers: { type: 'array' },
            technologyStack: { type: 'array', items: { type: 'string' } },
            recentLaunches: { type: 'array', items: { type: 'string' } }
          }
        },
        gtmStrategy: {
          type: 'object',
          properties: {
            targetSegments: { type: 'array', items: { type: 'string' } },
            salesModel: { type: 'string' },
            marketingChannels: { type: 'array', items: { type: 'string' } },
            brandPositioning: { type: 'string' },
            geographicCoverage: { type: 'array', items: { type: 'string' } }
          }
        },
        customerBase: {
          type: 'object',
          properties: {
            customerProfile: { type: 'string' },
            notableCustomers: { type: 'array', items: { type: 'string' } },
            customerReviews: {
              type: 'object',
              properties: {
                averageRating: { type: 'number' },
                reviewCount: { type: 'number' },
                commonPraises: { type: 'array', items: { type: 'string' } },
                commonComplaints: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              description: { type: 'string' }
            }
          }
        },
        weaknesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              weakness: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              description: { type: 'string' }
            }
          }
        },
        marketPresence: {
          type: 'object',
          properties: {
            marketShare: { type: 'string' },
            brandRecognition: { type: 'string', enum: ['high', 'medium', 'low'] },
            partnerships: { type: 'array', items: { type: 'string' } },
            integrations: { type: 'array', items: { type: 'string' } }
          }
        },
        strategySignals: { type: 'array', items: { type: 'string' } },
        threatAssessment: {
          type: 'object',
          properties: {
            overallThreat: { type: 'string', enum: ['high', 'medium', 'low'] },
            competitionAreas: { type: 'array', items: { type: 'string' } },
            likelyMoves: { type: 'array', items: { type: 'string' } },
            vulnerabilities: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'competitive-analysis', 'competitor-profiling', `competitor-${args.competitorIndex}`]
}));

// Task 3: Feature Comparison Matrix
export const featureComparisonTask = defineTask('feature-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build feature comparison matrix',
  agent: {
    name: 'product-analyst',
    prompt: {
      role: 'product analyst and feature comparison specialist',
      task: 'Create comprehensive feature-by-feature comparison matrix',
      context: args,
      instructions: [
        'Build detailed feature comparison matrix:',
        '',
        'FEATURE CATEGORIES:',
        '  - Core features',
        '  - Advanced features',
        '  - Integration capabilities',
        '  - Platform capabilities',
        '  - User experience features',
        '  - Admin/management features',
        '  - Security and compliance',
        '  - Support and services',
        '',
        'For each feature, assess for your product and competitors:',
        '  - Available (Yes/No/Partial)',
        '  - Quality/maturity (1-5 scale)',
        '  - Ease of use',
        '  - Uniqueness',
        '  - Customer importance (based on feedback/research)',
        '',
        'COMPETITIVE ANALYSIS:',
        '  - Feature parity analysis',
        '  - Competitive gaps (features competitors have that we lack)',
        '  - Competitive advantages (unique features we have)',
        '  - Parity features (everyone has them)',
        '  - Differentiating features',
        '',
        'SCORING:',
        '  - Calculate feature completeness score',
        '  - Weight by customer importance',
        '  - Identify must-have features',
        '  - Identify nice-to-have features',
        '',
        'INSIGHTS:',
        '  - Where are we ahead?',
        '  - Where are we behind?',
        '  - Where does it matter most?',
        '  - What are table stakes?',
        '  - What creates differentiation?',
        '',
        'Create visual comparison matrix',
        'Generate feature gap analysis',
        'Prioritize feature development recommendations',
        'Save feature comparison to output directory'
      ],
      outputFormat: 'JSON with features (array), competitiveGaps (array), competitiveAdvantages (array), parityFeatures (array), competitiveScore (number), featureMatrix (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'competitiveGaps', 'competitiveAdvantages', 'competitiveScore', 'artifacts'],
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              feature: { type: 'string' },
              ourProduct: {
                type: 'object',
                properties: {
                  available: { type: 'string', enum: ['yes', 'no', 'partial', 'planned'] },
                  quality: { type: 'number', minimum: 1, maximum: 5 },
                  notes: { type: 'string' }
                }
              },
              competitors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    available: { type: 'string' },
                    quality: { type: 'number' }
                  }
                }
              },
              customerImportance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              differentiator: { type: 'boolean' }
            }
          }
        },
        competitiveGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              competitorsWithFeature: { type: 'array', items: { type: 'string' } },
              customerImportance: { type: 'string' },
              recommendedAction: { type: 'string' }
            }
          }
        },
        competitiveAdvantages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              advantage: { type: 'string' },
              uniqueness: { type: 'string', enum: ['unique', 'rare', 'better-implementation'] },
              marketingValue: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        parityFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              tableStakes: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        competitiveScore: { type: 'number', minimum: 0, maximum: 100 },
        featureMatrix: {
          type: 'object',
          properties: {
            totalFeatures: { type: 'number' },
            ourCoverage: { type: 'number' },
            averageCompetitorCoverage: { type: 'number' },
            uniqueFeatures: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' }
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
  labels: ['agent', 'competitive-analysis', 'feature-comparison']
}));

// Task 4: SWOT Analysis
export const swotAnalysisTask = defineTask('swot-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct SWOT analysis',
  agent: {
    name: 'strategic-analyst',
    prompt: {
      role: 'strategic analyst and business strategist',
      task: 'Conduct comprehensive SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)',
      context: args,
      instructions: [
        'Perform structured SWOT analysis:',
        '',
        'STRENGTHS (Internal, Positive):',
        '  - Unique capabilities and advantages',
        '  - Superior features or technology',
        '  - Strong team or expertise',
        '  - Brand reputation',
        '  - Customer relationships',
        '  - Financial resources',
        '  - Intellectual property',
        '  - Distribution channels',
        '  - For each strength: describe, quantify impact, explain sustainability',
        '',
        'WEAKNESSES (Internal, Negative):',
        '  - Feature gaps vs competitors',
        '  - Resource limitations',
        '  - Technology debt or limitations',
        '  - Market presence gaps',
        '  - Brand awareness issues',
        '  - Operational challenges',
        '  - Customer satisfaction issues',
        '  - For each weakness: describe, assess severity, identify mitigation',
        '',
        'OPPORTUNITIES (External, Positive):',
        '  - Market trends favoring our approach',
        '  - Competitor weaknesses to exploit',
        '  - Emerging customer needs',
        '  - Technology shifts',
        '  - Market expansion possibilities',
        '  - Partnership opportunities',
        '  - Regulatory changes',
        '  - For each opportunity: describe, assess potential, define action needed',
        '',
        'THREATS (External, Negative):',
        '  - Competitive threats',
        '  - Market trends against us',
        '  - Disruptive technologies',
        '  - New entrants',
        '  - Customer preference shifts',
        '  - Economic factors',
        '  - Regulatory risks',
        '  - For each threat: describe, assess likelihood and impact, plan defense',
        '',
        'CROSS-ANALYSIS:',
        '  - SO Strategies: Use strengths to capture opportunities',
        '  - WO Strategies: Overcome weaknesses to pursue opportunities',
        '  - ST Strategies: Use strengths to avoid threats',
        '  - WT Strategies: Minimize weaknesses and avoid threats',
        '',
        'PRIORITIZATION:',
        '  - Critical strengths to leverage',
        '  - Critical weaknesses to address',
        '  - High-potential opportunities',
        '  - Serious threats requiring attention',
        '',
        'Create SWOT matrix visualization',
        'Generate strategic implications from SWOT',
        'Save SWOT analysis to output directory'
      ],
      outputFormat: 'JSON with strengths (array), weaknesses (array), opportunities (array), threats (array), criticalStrengths (array), criticalWeaknesses (array), strategicImplications (object), crossAnalysis (object), criticalInsights (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strengths', 'weaknesses', 'opportunities', 'threats', 'artifacts'],
      properties: {
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              sustainability: { type: 'string', enum: ['sustainable', 'temporary', 'uncertain'] },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        weaknesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              weakness: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigation: { type: 'string' },
              timeToAddress: { type: 'string' }
            }
          }
        },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              description: { type: 'string' },
              potential: { type: 'string', enum: ['high', 'medium', 'low'] },
              timeframe: { type: 'string' },
              actionRequired: { type: 'string' }
            }
          }
        },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              description: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        criticalStrengths: { type: 'array', items: { type: 'string' } },
        criticalWeaknesses: { type: 'array', items: { type: 'string' } },
        strategicImplications: {
          type: 'object',
          properties: {
            keyInsights: { type: 'array', items: { type: 'string' } },
            strategicFocus: { type: 'array', items: { type: 'string' } },
            priorityActions: { type: 'array', items: { type: 'string' } }
          }
        },
        crossAnalysis: {
          type: 'object',
          properties: {
            soStrategies: { type: 'array', items: { type: 'string' } },
            woStrategies: { type: 'array', items: { type: 'string' } },
            stStrategies: { type: 'array', items: { type: 'string' } },
            wtStrategies: { type: 'array', items: { type: 'string' } }
          }
        },
        criticalInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-analysis', 'swot-analysis']
}));

// Task 5: Differentiation Strategy
export const differentiationStrategyTask = defineTask('differentiation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define differentiation strategy',
  agent: {
    name: 'positioning-strategist',
    prompt: {
      role: 'product positioning strategist and differentiation expert',
      task: 'Define clear differentiation strategy and unique value propositions',
      context: args,
      instructions: [
        'Define how your product differentiates from competition:',
        '',
        'DIFFERENTIATION DIMENSIONS:',
        '  - Product/Feature differentiation',
        '  - Technology differentiation',
        '  - User experience differentiation',
        '  - Service/Support differentiation',
        '  - Price/Value differentiation',
        '  - Brand/Reputation differentiation',
        '  - Integration/Ecosystem differentiation',
        '  - Performance differentiation',
        '',
        'For each differentiator:',
        '  - What makes it unique?',
        '  - Why does it matter to customers?',
        '  - How sustainable is it?',
        '  - How defendable is it?',
        '  - What evidence supports it?',
        '',
        'COMPETITIVE ADVANTAGES:',
        '  - Unique capabilities',
        '  - Superior execution',
        '  - Market position',
        '  - Strategic assets',
        '  - First-mover advantages',
        '',
        'VALUE PROPOSITIONS:',
        '  - Primary value proposition',
        '  - Secondary value propositions',
        '  - Value for different segments',
        '  - Quantified value (ROI, cost savings, productivity gains)',
        '',
        'DIFFERENTIATION STRATEGY:',
        '  - Core differentiation focus',
        '  - Supporting differentiation elements',
        '  - What we will NOT compete on',
        '  - How to amplify differentiation',
        '  - How to protect differentiation',
        '',
        'MESSAGING:',
        '  - Key differentiating messages',
        '  - Proof points for each claim',
        '  - Customer testimonials supporting differentiation',
        '  - Competitive contrast statements (us vs them)',
        '',
        'Validate differentiation is:',
        '  - Meaningful to customers',
        '  - Measurable and provable',
        '  - Sustainable over time',
        '  - Defensible from competition',
        '  - Aligned with brand promise',
        '',
        'Save differentiation strategy to output directory'
      ],
      outputFormat: 'JSON with differentiators (array), uniqueValueProps (array), competitiveAdvantages (array), strategy (object), messaging (array), proofPoints (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['differentiators', 'uniqueValueProps', 'competitiveAdvantages', 'strategy', 'artifacts'],
      properties: {
        differentiators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              differentiator: { type: 'string' },
              uniqueness: { type: 'string' },
              customerValue: { type: 'string' },
              sustainability: { type: 'string', enum: ['high', 'medium', 'low'] },
              defendability: { type: 'string', enum: ['high', 'medium', 'low'] },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        uniqueValueProps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              valueProposition: { type: 'string' },
              quantifiedValue: { type: 'string' },
              proofPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        competitiveAdvantages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              advantage: { type: 'string' },
              type: { type: 'string', enum: ['capability', 'execution', 'position', 'asset', 'first-mover'] },
              strength: { type: 'string', enum: ['strong', 'moderate', 'emerging'] },
              description: { type: 'string' }
            }
          }
        },
        strategy: {
          type: 'object',
          properties: {
            primaryFocus: { type: 'string' },
            supportingElements: { type: 'array', items: { type: 'string' } },
            notCompetingOn: { type: 'array', items: { type: 'string' } },
            amplificationPlan: { type: 'array', items: { type: 'string' } },
            protectionPlan: { type: 'array', items: { type: 'string' } }
          }
        },
        messaging: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              audience: { type: 'string' },
              proofPoints: { type: 'array', items: { type: 'string' } },
              contrastStatement: { type: 'string' }
            }
          }
        },
        proofPoints: {
          type: 'object',
          properties: {
            customerTestimonials: { type: 'array', items: { type: 'string' } },
            metrics: { type: 'array', items: { type: 'string' } },
            caseStudies: { type: 'array', items: { type: 'string' } },
            awards: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'competitive-analysis', 'differentiation']
}));

// Task 6: Positioning Strategy
export const positioningStrategyTask = defineTask('positioning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop market positioning strategy',
  agent: {
    name: 'positioning-strategist',
    prompt: {
      role: 'market positioning strategist and brand strategist',
      task: 'Develop comprehensive market positioning strategy',
      context: args,
      instructions: [
        'Create market positioning strategy using classic positioning framework:',
        '',
        'POSITIONING STATEMENT:',
        'For [target customer]',
        'Who [statement of need or opportunity]',
        'Our [product/service name] is [product category]',
        'That [statement of key benefit]',
        'Unlike [primary competitive alternative]',
        'Our product [statement of primary differentiation]',
        '',
        'TARGET SEGMENT:',
        '  - Specific customer segment(s)',
        '  - Segment characteristics',
        '  - Segment size and growth',
        '  - Why this segment?',
        '  - Segment needs and pain points',
        '',
        'FRAME OF REFERENCE:',
        '  - Product category',
        '  - How customers think about this space',
        '  - Mental models and associations',
        '  - Competitive set in customer mind',
        '',
        'POINTS OF DIFFERENCE:',
        '  - Key differentiators',
        '  - Unique attributes',
        '  - Competitive advantages',
        '  - Why customers should choose us',
        '',
        'POINTS OF PARITY:',
        '  - Table stakes features',
        '  - Must-have capabilities',
        '  - Competitive neutralizers',
        '',
        'POSITIONING PILLARS:',
        '  - 3-5 key themes that support positioning',
        '  - Evidence for each pillar',
        '  - How pillars work together',
        '',
        'KEY MESSAGES:',
        '  - Primary message',
        '  - Supporting messages',
        '  - Message hierarchy',
        '  - Proof points',
        '',
        'BRAND PERSONALITY:',
        '  - Brand attributes',
        '  - Tone and voice',
        '  - Visual identity implications',
        '',
        'COMPETITIVE POSITIONING:',
        '  - How positioned vs each key competitor',
        '  - Head-to-head comparisons',
        '  - Positioning maps/diagrams',
        '',
        'POSITIONING VALIDATION:',
        '  - Is it relevant to target customers?',
        '  - Is it differentiated from competition?',
        '  - Is it credible and defensible?',
        '  - Is it sustainable long-term?',
        '  - Is it simple and memorable?',
        '',
        'Save positioning strategy to output directory'
      ],
      outputFormat: 'JSON with positioningStatement (string), targetSegment (object), frameOfReference (string), pointsOfDifference (array), pointsOfParity (array), positioningPillars (array), keyMessages (array), brandPersonality (object), competitivePositioning (object), valueProposition (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['positioningStatement', 'targetSegment', 'pointsOfDifference', 'positioningPillars', 'artifacts'],
      properties: {
        positioningStatement: { type: 'string' },
        targetSegment: {
          type: 'object',
          properties: {
            segment: { type: 'string' },
            characteristics: { type: 'array', items: { type: 'string' } },
            needs: { type: 'array', items: { type: 'string' } },
            painPoints: { type: 'array', items: { type: 'string' } },
            size: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        frameOfReference: { type: 'string' },
        pointsOfDifference: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              difference: { type: 'string' },
              description: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'emerging'] }
            }
          }
        },
        pointsOfParity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parity: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'important', 'nice-to-have'] }
            }
          }
        },
        positioningPillars: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pillar: { type: 'string' },
              description: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              level: { type: 'string', enum: ['primary', 'secondary', 'supporting'] },
              proofPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        brandPersonality: {
          type: 'object',
          properties: {
            attributes: { type: 'array', items: { type: 'string' } },
            toneAndVoice: { type: 'string' },
            visualIdentityImplications: { type: 'array', items: { type: 'string' } }
          }
        },
        competitivePositioning: {
          type: 'object',
          properties: {
            vsCompetitors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  competitor: { type: 'string' },
                  positioning: { type: 'string' },
                  keyDifferences: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        valueProposition: { type: 'string' },
        validation: {
          type: 'object',
          properties: {
            relevant: { type: 'boolean' },
            differentiated: { type: 'boolean' },
            credible: { type: 'boolean' },
            sustainable: { type: 'boolean' },
            simple: { type: 'boolean' }
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
  labels: ['agent', 'competitive-analysis', 'positioning-strategy']
}));

// Task 7: Positioning Map
export const positioningMapTask = defineTask('positioning-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create perceptual positioning map',
  agent: {
    name: 'visualization-strategist',
    prompt: {
      role: 'market visualization strategist and positioning analyst',
      task: 'Create perceptual positioning map showing competitive landscape',
      context: args,
      instructions: [
        'Create 2x2 perceptual positioning map (also called perceptual map):',
        '',
        'CHOOSE AXES:',
        '  - Select two most important dimensions for customers',
        '  - Common examples:',
        '    * Price (Low to High) vs Features (Basic to Advanced)',
        '    * Ease of Use (Simple to Complex) vs Power (Limited to Comprehensive)',
        '    * Customization (Fixed to Flexible) vs Speed (Slow to Fast)',
        '    * Enterprise (SMB to Enterprise) vs Specialization (Generalist to Specialist)',
        '  - Axes should be:',
        '    * Meaningful to customers',
        '    * Differentiating',
        '    * Independent of each other',
        '',
        'POSITION PRODUCTS:',
        '  - Place your product on the map',
        '  - Place all key competitors',
        '  - Based on actual capabilities and positioning',
        '  - Use consistent criteria',
        '',
        'ANALYZE MAP:',
        '  - Identify clusters (competitive sets)',
        '  - Identify white space (unmet needs)',
        '  - Identify your positioning vs competitors',
        '  - Identify differentiation opportunities',
        '  - Identify repositioning opportunities',
        '',
        'INSIGHTS:',
        '  - Where is most competition concentrated?',
        '  - Where are gaps in the market?',
        '  - Is our positioning unique?',
        '  - Are we too close to competitors?',
        '  - Should we reposition?',
        '  - What positioning would be most defensible?',
        '',
        'VISUALIZATION:',
        '  - Create ASCII or text-based visualization',
        '  - Create mermaid diagram if possible',
        '  - Provide coordinates for each product',
        '  - Add annotations and insights',
        '',
        'ALTERNATIVE MAPS:',
        '  - Create 2-3 positioning maps with different axes',
        '  - Show different perspectives on competitive landscape',
        '',
        'Save positioning map and analysis to output directory'
      ],
      outputFormat: 'JSON with axes (object), positions (array), clusters (array), whitespace (array), insights (array), visualization (string), alternativeMaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['axes', 'positions', 'insights', 'visualization', 'artifacts'],
      properties: {
        axes: {
          type: 'object',
          properties: {
            xAxis: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                lowEnd: { type: 'string' },
                highEnd: { type: 'string' },
                rationale: { type: 'string' }
              }
            },
            yAxis: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                lowEnd: { type: 'string' },
                highEnd: { type: 'string' },
                rationale: { type: 'string' }
              }
            }
          }
        },
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: { type: 'string' },
              isOurProduct: { type: 'boolean' },
              xPosition: { type: 'number', minimum: 0, maximum: 100 },
              yPosition: { type: 'number', minimum: 0, maximum: 100 },
              rationale: { type: 'string' }
            }
          }
        },
        clusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              products: { type: 'array', items: { type: 'string' } },
              characteristics: { type: 'string' }
            }
          }
        },
        whitespace: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              opportunity: { type: 'string' },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              implication: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        visualization: { type: 'string' },
        alternativeMaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              axes: { type: 'object' },
              description: { type: 'string' }
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
  labels: ['agent', 'competitive-analysis', 'positioning-map']
}));

// Task 8: Competitive Intelligence Report
export const competitiveIntelligenceReportTask = defineTask('competitive-intelligence-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate competitive intelligence report',
  agent: {
    name: 'intelligence-reporter',
    prompt: {
      role: 'competitive intelligence analyst and business reporter',
      task: 'Generate comprehensive competitive intelligence report',
      context: args,
      instructions: [
        'Create comprehensive competitive intelligence report:',
        '',
        '1. EXECUTIVE SUMMARY:',
        '   - Key findings and insights',
        '   - Competitive landscape overview',
        '   - Strategic recommendations',
        '   - Critical actions needed',
        '',
        '2. MARKET LANDSCAPE:',
        '   - Market structure and dynamics',
        '   - Competitor categorization',
        '   - Market trends',
        '   - Growth opportunities',
        '',
        '3. COMPETITOR PROFILES:',
        '   - Detailed profiles of key competitors',
        '   - Strengths and weaknesses',
        '   - Recent moves and strategy signals',
        '   - Threat assessment',
        '',
        '4. FEATURE COMPARISON:',
        '   - Detailed feature matrix',
        '   - Competitive gaps',
        '   - Competitive advantages',
        '   - Recommendations for product development',
        '',
        '5. SWOT ANALYSIS:',
        '   - Comprehensive SWOT',
        '   - Strategic implications',
        '   - Priority actions',
        '',
        '6. POSITIONING ANALYSIS:',
        '   - Current positioning',
        '   - Recommended positioning',
        '   - Differentiation strategy',
        '   - Positioning maps',
        '',
        '7. STRATEGIC RECOMMENDATIONS:',
        '   - Product strategy',
        '   - Go-to-market strategy',
        '   - Competitive response',
        '   - Investment priorities',
        '',
        '8. COMPETITIVE MONITORING:',
        '   - Key metrics to track',
        '   - Competitive signals to watch',
        '   - Early warning indicators',
        '   - Ongoing intelligence gathering plan',
        '',
        'Format professionally with:',
        '  - Table of contents',
        '  - Executive summary',
        '  - Clear sections',
        '  - Visual elements (tables, matrices, maps)',
        '  - Actionable recommendations',
        '',
        'Save comprehensive report to output directory'
      ],
      outputFormat: 'JSON with executiveSummary (string), sections (array), keyFindings (array), strategicRecommendations (array), competitiveMonitoringPlan (object), reportPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'keyFindings', 'strategicRecommendations', 'reportPath', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              keyPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              significance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              implication: { type: 'string' }
            }
          }
        },
        strategicRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        competitiveMonitoringPlan: {
          type: 'object',
          properties: {
            metricsToTrack: { type: 'array', items: { type: 'string' } },
            signalsToWatch: { type: 'array', items: { type: 'string' } },
            monitoringFrequency: { type: 'string' },
            responsePlan: { type: 'array', items: { type: 'string' } }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-analysis', 'intelligence-report']
}));

// Task 9: Strategic Recommendations
export const strategicRecommendationsTask = defineTask('strategic-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate strategic recommendations',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'management consultant and strategy advisor',
      task: 'Formulate actionable strategic recommendations based on competitive analysis',
      context: args,
      instructions: [
        'Generate strategic recommendations across multiple dimensions:',
        '',
        'PRODUCT STRATEGY:',
        '  - Feature priorities based on competitive gaps',
        '  - Product roadmap implications',
        '  - Technology investments needed',
        '  - UX improvements to differentiate',
        '',
        'POSITIONING STRATEGY:',
        '  - Recommended positioning adjustments',
        '  - Messaging refinements',
        '  - Target segment focus',
        '  - Brand strategy implications',
        '',
        'GO-TO-MARKET STRATEGY:',
        '  - Channel strategy',
        '  - Sales approach',
        '  - Marketing campaigns',
        '  - Partnership opportunities',
        '',
        'COMPETITIVE RESPONSE:',
        '  - How to defend against competitive threats',
        '  - Opportunities to attack competitor weaknesses',
        '  - Strategic moves to make',
        '  - Timing considerations',
        '',
        'INVESTMENT PRIORITIES:',
        '  - Where to invest for maximum competitive advantage',
        '  - Quick wins vs long-term bets',
        '  - Resource allocation',
        '  - Budget implications',
        '',
        'RISK MITIGATION:',
        '  - Key risks to address',
        '  - Defensive strategies',
        '  - Contingency plans',
        '',
        'For each recommendation:',
        '  - Clear action statement',
        '  - Rationale and supporting analysis',
        '  - Expected impact',
        '  - Priority (high/medium/low)',
        '  - Time horizon (immediate/short-term/long-term)',
        '  - Resources required',
        '  - Success metrics',
        '',
        'Categorize recommendations:',
        '  - Quick wins (high impact, low effort)',
        '  - Strategic initiatives (high impact, high effort)',
        '  - Defensive moves (protect position)',
        '  - Offensive moves (gain position)',
        '',
        'Save strategic recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (array), quickWins (array), strategicInitiatives (array), longTermInitiatives (array), priorities (array), investmentPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'quickWins', 'priorities', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['product', 'positioning', 'gtm', 'competitive-response', 'investment'] },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              expectedImpact: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              timeHorizon: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              resourcesRequired: { type: 'array', items: { type: 'string' } },
              successMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        strategicInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              description: { type: 'string' },
              expectedOutcome: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        longTermInitiatives: { type: 'array' },
        priorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        investmentPlan: {
          type: 'object',
          properties: {
            topInvestments: { type: 'array', items: { type: 'string' } },
            resourceAllocation: { type: 'string' },
            budgetImplications: { type: 'string' }
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
  labels: ['agent', 'competitive-analysis', 'strategic-recommendations']
}));

// Task 10: Go-to-Market Implications
export const gtmImplicationsTask = defineTask('gtm-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze go-to-market implications',
  agent: {
    name: 'gtm-strategist',
    prompt: {
      role: 'go-to-market strategist and market launch specialist',
      task: 'Analyze go-to-market implications of competitive positioning',
      context: args,
      instructions: [
        'Analyze GTM implications based on competitive analysis:',
        '',
        'TARGET CHANNELS:',
        '  - Which channels to prioritize',
        '  - Channel strategy by competitor weakness',
        '  - Direct vs indirect channels',
        '  - Digital vs traditional',
        '  - Partner ecosystem opportunities',
        '',
        'MESSAGING STRATEGY:',
        '  - Core messaging framework',
        '  - Competitive messaging',
        '  - Value messaging by segment',
        '  - Battle cards and competitive positioning',
        '  - Objection handling',
        '',
        'PRICING CONSIDERATIONS:',
        '  - Competitive pricing analysis',
        '  - Pricing strategy recommendations',
        '  - Value-based pricing opportunities',
        '  - Packaging and bundling',
        '  - Promotional strategies',
        '',
        'SALES ENABLEMENT:',
        '  - Competitive battlecards',
        '  - Win/loss analysis framework',
        '  - Competitive objection handling',
        '  - Proof points and case studies',
        '  - Sales plays against specific competitors',
        '',
        'MARKETING CAMPAIGNS:',
        '  - Campaign themes based on differentiation',
        '  - Competitive comparison campaigns',
        '  - Thought leadership topics',
        '  - Content strategy',
        '  - Events and speaking opportunities',
        '',
        'CUSTOMER ACQUISITION:',
        '  - Target customer profiles',
        '  - Competitive displacement strategies',
        '  - Customer migration/switching strategies',
        '  - Acquisition channels and tactics',
        '',
        'COMPETITIVE RESPONSE PLAN:',
        '  - If competitor attacks us, how to respond',
        '  - If competitor changes pricing, how to respond',
        '  - If new competitor enters, how to respond',
        '  - Proactive competitive moves',
        '',
        'LAUNCH STRATEGY:',
        '  - Launch timing considerations',
        '  - Launch messaging',
        '  - Competitive announcement strategy',
        '  - Market education needed',
        '',
        'Save GTM implications and strategy to output directory'
      ],
      outputFormat: 'JSON with targetChannels (array), messagingStrategy (object), pricingConsiderations (object), salesEnablement (object), marketingCampaigns (array), acquisitionStrategy (object), competitiveResponse (object), launchStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targetChannels', 'messagingStrategy', 'pricingConsiderations', 'competitiveResponse', 'artifacts'],
      properties: {
        targetChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' },
              competitiveAdvantage: { type: 'string' }
            }
          }
        },
        messagingStrategy: {
          type: 'object',
          properties: {
            coreMessages: { type: 'array', items: { type: 'string' } },
            competitiveMessages: { type: 'array', items: { type: 'string' } },
            valueMessaging: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  segment: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            },
            objectionHandling: { type: 'array', items: { type: 'string' } }
          }
        },
        pricingConsiderations: {
          type: 'object',
          properties: {
            competitivePricing: { type: 'string' },
            recommendedStrategy: { type: 'string' },
            pricingOpportunities: { type: 'array', items: { type: 'string' } },
            packagingRecommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        salesEnablement: {
          type: 'object',
          properties: {
            battlecardTopics: { type: 'array', items: { type: 'string' } },
            competitiveObjections: { type: 'array', items: { type: 'string' } },
            proofPoints: { type: 'array', items: { type: 'string' } },
            salesPlays: { type: 'array', items: { type: 'string' } }
          }
        },
        marketingCampaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              campaignTheme: { type: 'string' },
              objective: { type: 'string' },
              targetAudience: { type: 'string' },
              competitiveDifferentiation: { type: 'string' }
            }
          }
        },
        acquisitionStrategy: {
          type: 'object',
          properties: {
            targetProfiles: { type: 'array', items: { type: 'string' } },
            displacementStrategies: { type: 'array', items: { type: 'string' } },
            acquisitionChannels: { type: 'array', items: { type: 'string' } }
          }
        },
        competitiveResponse: {
          type: 'object',
          properties: {
            ifAttacked: { type: 'array', items: { type: 'string' } },
            ifPricingChanges: { type: 'array', items: { type: 'string' } },
            ifNewEntrant: { type: 'array', items: { type: 'string' } },
            proactiveMoves: { type: 'array', items: { type: 'string' } }
          }
        },
        launchStrategy: {
          type: 'object',
          properties: {
            timing: { type: 'string' },
            launchMessaging: { type: 'array', items: { type: 'string' } },
            competitiveAnnouncement: { type: 'string' },
            marketEducation: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'competitive-analysis', 'gtm-implications']
}));
