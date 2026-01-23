/**
 * @process specializations/product-management/quarterly-roadmap
 * @description Quarterly Roadmap Planning - Comprehensive quarterly planning process including OKR review,
 * market analysis, customer research synthesis, theme identification, initiative mapping, and timeline creation
 * with 70% committed / 30% exploratory allocation.
 * @inputs { quarter: string, productName: string, previousOKRs?: object, customerFeedback?: array, marketData?: object, teamCapacity?: object }
 * @outputs { success: boolean, roadmap: object, okrAlignment: object, initiatives: array, themes: array, timeline: object }
 *
 * @example
 * const result = await orchestrate('specializations/product-management/quarterly-roadmap', {
 *   quarter: 'Q2 2024',
 *   productName: 'CloudConnect Platform',
 *   previousOKRs: { objectives: [...], results: [...] },
 *   customerFeedback: ['Feature request 1', 'Pain point 2'],
 *   marketData: { competitors: [...], trends: [...] },
 *   teamCapacity: { engineering: 5, design: 2, pm: 1 }
 * });
 *
 * @references
 * - Product Roadmap Best Practices: https://www.productplan.com/learn/product-roadmap-best-practices/
 * - OKR Framework: https://www.whatmatters.com/faqs/okr-meaning-definition-example
 * - Theme-Based Roadmapping: https://www.aha.io/roadmapping/guide/product-strategy/what-is-a-theme-based-roadmap
 * - Evidence-Guided Product Development: https://www.svpg.com/product-roadmaps-in-scrum/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    quarter,
    productName,
    previousOKRs = null,
    customerFeedback = [],
    marketData = {},
    teamCapacity = {},
    stakeholders = [],
    committedPercentage = 70,
    exploratoryPercentage = 30
  } = inputs;

  const startTime = ctx.now();

  ctx.log('info', `Starting Quarterly Roadmap Planning for ${productName} - ${quarter}`);

  // Phase 1: OKR Review and Retrospective
  const okrReview = await ctx.task(okrReviewTask, {
    quarter,
    productName,
    previousOKRs,
    stakeholders
  });

  // Quality Gate: Previous OKRs must be reviewed
  if (previousOKRs && (!okrReview.reviewComplete || !okrReview.lessonsLearned)) {
    return {
      success: false,
      error: 'Previous OKR review incomplete',
      phase: 'okr-review',
      roadmap: null
    };
  }

  // Breakpoint: Review previous quarter outcomes
  await ctx.breakpoint({
    question: `Previous quarter OKR review complete for ${productName}. Review outcomes and key learnings before proceeding?`,
    title: 'OKR Retrospective Review',
    context: {
      runId: ctx.runId,
      quarter,
      productName,
      okrCompletion: okrReview.overallCompletion,
      keyLearnings: okrReview.lessonsLearned,
      files: [{
        path: `artifacts/phase1-okr-review.json`,
        format: 'json',
        content: okrReview
      }]
    }
  });

  // Phase 2: Market Analysis and Competitive Intelligence
  const marketAnalysis = await ctx.task(marketAnalysisTask, {
    quarter,
    productName,
    marketData,
    okrReview
  });

  // Phase 3: Customer Research Synthesis
  const customerResearch = await ctx.task(customerResearchSynthesisTask, {
    quarter,
    productName,
    customerFeedback,
    marketAnalysis,
    okrReview
  });

  // Phase 4: Strategic Theme Identification
  const themeIdentification = await ctx.task(themeIdentificationTask, {
    quarter,
    productName,
    okrReview,
    marketAnalysis,
    customerResearch
  });

  // Quality Gate: Themes must be clearly defined
  if (!themeIdentification.themes || themeIdentification.themes.length === 0) {
    return {
      success: false,
      error: 'Strategic themes not identified',
      phase: 'theme-identification',
      roadmap: null
    };
  }

  // Breakpoint: Review strategic themes
  await ctx.breakpoint({
    question: `${themeIdentification.themes.length} strategic themes identified for ${quarter}. Review and approve themes before initiative mapping?`,
    title: 'Strategic Themes Review',
    context: {
      runId: ctx.runId,
      quarter,
      themes: themeIdentification.themes,
      themePriorities: themeIdentification.themePriorities,
      files: [{
        path: `artifacts/phase4-themes.json`,
        format: 'json',
        content: themeIdentification
      }]
    }
  });

  // Phase 5: Initiative Mapping and Prioritization
  const initiativeMapping = await ctx.task(initiativeMappingTask, {
    quarter,
    productName,
    themes: themeIdentification.themes,
    customerResearch,
    marketAnalysis,
    teamCapacity
  });

  // Phase 6: Capacity Planning and Resource Allocation
  const capacityPlanning = await ctx.task(capacityPlanningTask, {
    quarter,
    productName,
    initiatives: initiativeMapping.initiatives,
    teamCapacity,
    committedPercentage,
    exploratoryPercentage
  });

  // Quality Gate: Capacity must not exceed 100%
  if (capacityPlanning.totalCapacityUsed > 100) {
    await ctx.breakpoint({
      question: `Capacity overallocated at ${capacityPlanning.totalCapacityUsed}%. Review and adjust initiative scope or team capacity?`,
      title: 'Capacity Overallocation Warning',
      context: {
        runId: ctx.runId,
        totalCapacity: capacityPlanning.totalCapacityUsed,
        committedCapacity: capacityPlanning.committedCapacity,
        exploratoryCapacity: capacityPlanning.exploratoryCapacity,
        recommendation: 'Reduce initiative scope or deprioritize lower-value initiatives'
      }
    });
  }

  // Phase 7: Timeline Creation and Milestone Planning
  const timelinePlanning = await ctx.task(timelinePlanningTask, {
    quarter,
    productName,
    initiatives: initiativeMapping.initiatives,
    capacityPlanning,
    committedPercentage,
    exploratoryPercentage
  });

  // Phase 8: OKR Definition for Upcoming Quarter
  const newOKRs = await ctx.task(okrDefinitionTask, {
    quarter,
    productName,
    themes: themeIdentification.themes,
    initiatives: initiativeMapping.initiatives,
    marketAnalysis,
    customerResearch,
    okrReview
  });

  // Phase 9: Risk Assessment and Dependency Mapping
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    quarter,
    productName,
    initiatives: initiativeMapping.initiatives,
    capacityPlanning,
    timelinePlanning,
    teamCapacity
  });

  // Phase 10: Stakeholder Communication Plan
  const communicationPlan = await ctx.task(communicationPlanTask, {
    quarter,
    productName,
    themes: themeIdentification.themes,
    initiatives: initiativeMapping.initiatives,
    newOKRs,
    timelinePlanning,
    stakeholders
  });

  // Phase 11: Final Roadmap Document Generation
  const roadmapDocument = await ctx.task(roadmapDocumentGenerationTask, {
    quarter,
    productName,
    okrReview,
    marketAnalysis,
    customerResearch,
    themeIdentification,
    initiativeMapping,
    capacityPlanning,
    timelinePlanning,
    newOKRs,
    riskAssessment,
    communicationPlan,
    stakeholders
  });

  // Final Quality Gate: Roadmap quality score
  const roadmapScore = roadmapDocument.qualityScore || 0;
  const qualityMet = roadmapScore >= 85;

  // Final Breakpoint: Roadmap Approval
  await ctx.breakpoint({
    question: `Quarterly Roadmap Planning Complete for ${productName} - ${quarter}. Quality Score: ${roadmapScore}/100. ${qualityMet ? 'Roadmap meets quality standards!' : 'Roadmap may need refinement.'} Approve for stakeholder distribution?`,
    title: 'Quarterly Roadmap Approval',
    context: {
      runId: ctx.runId,
      quarter,
      productName,
      roadmapScore,
      qualityMet,
      themeCount: themeIdentification.themes.length,
      initiativeCount: initiativeMapping.initiatives.length,
      committedCapacity: `${capacityPlanning.committedCapacity}%`,
      exploratoryCapacity: `${capacityPlanning.exploratoryCapacity}%`,
      files: [
        { path: `artifacts/final-roadmap.json`, format: 'json', content: roadmapDocument },
        { path: `artifacts/final-roadmap.md`, format: 'markdown', content: roadmapDocument.markdown }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    quarter,
    productName,
    roadmapScore,
    qualityMet,
    okrAlignment: {
      previousQuarterCompletion: okrReview.overallCompletion,
      lessonsLearned: okrReview.lessonsLearned,
      newObjectives: newOKRs.objectives,
      newKeyResults: newOKRs.keyResults
    },
    themes: {
      count: themeIdentification.themes.length,
      themes: themeIdentification.themes,
      priorities: themeIdentification.themePriorities
    },
    initiatives: {
      count: initiativeMapping.initiatives.length,
      committed: initiativeMapping.committedInitiatives,
      exploratory: initiativeMapping.exploratoryInitiatives,
      list: initiativeMapping.initiatives
    },
    capacity: {
      committed: `${capacityPlanning.committedCapacity}%`,
      exploratory: `${capacityPlanning.exploratoryCapacity}%`,
      totalUsed: `${capacityPlanning.totalCapacityUsed}%`,
      buffer: `${capacityPlanning.bufferCapacity}%`
    },
    timeline: {
      milestones: timelinePlanning.milestones,
      deliverySchedule: timelinePlanning.deliverySchedule,
      dependencies: timelinePlanning.dependencies
    },
    risks: {
      total: riskAssessment.totalRisks,
      high: riskAssessment.highRisks,
      medium: riskAssessment.mediumRisks,
      mitigationStrategies: riskAssessment.mitigationStrategies
    },
    marketInsights: {
      trends: marketAnalysis.keyTrends,
      competitorMoves: marketAnalysis.competitorMoves,
      opportunities: marketAnalysis.opportunities
    },
    customerInsights: {
      topPainPoints: customerResearch.topPainPoints,
      topFeatureRequests: customerResearch.topFeatureRequests,
      segmentPriorities: customerResearch.segmentPriorities
    },
    roadmapDocument: roadmapDocument.document,
    communicationPlan: communicationPlan.plan,
    duration,
    metadata: {
      processId: 'specializations/product-management/quarterly-roadmap',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const okrReviewTask = defineTask('okr-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: OKR Review and Retrospective - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Product Manager with expertise in OKR framework and retrospective facilitation',
      task: 'Conduct comprehensive OKR review and retrospective for the previous quarter',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        previousOKRs: args.previousOKRs,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Review each objective from the previous quarter and assess completion percentage',
        '2. Analyze each key result - did we hit the target? What was the actual outcome?',
        '3. Calculate overall OKR completion rate (average across all objectives)',
        '4. Identify what went well - successes, wins, and positive outcomes',
        '5. Identify what didn\'t go well - blockers, failures, and missed targets',
        '6. Extract key lessons learned that should inform the next quarter',
        '7. Identify recurring patterns or systemic issues',
        '8. Document team velocity and capacity utilization from previous quarter',
        '9. Assess stakeholder satisfaction with previous quarter outcomes',
        '10. Generate recommendations for improvement in upcoming quarter',
        '11. If no previous OKRs provided, document that this is baseline establishment'
      ],
      outputFormat: 'JSON object with structured OKR review analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewComplete', 'overallCompletion', 'lessonsLearned', 'recommendations'],
      properties: {
        reviewComplete: { type: 'boolean' },
        overallCompletion: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall OKR completion percentage'
        },
        objectiveReviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              completed: { type: 'boolean' },
              completionPercentage: { type: 'number' },
              keyResultsAchieved: { type: 'number' },
              keyResultsTotal: { type: 'number' },
              analysis: { type: 'string' }
            }
          }
        },
        successes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'string' },
              impact: { type: 'string' },
              category: { type: 'string', enum: ['delivery', 'quality', 'collaboration', 'innovation', 'customer-impact'] }
            }
          }
        },
        challenges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              challenge: { type: 'string' },
              impact: { type: 'string' },
              rootCause: { type: 'string' }
            }
          }
        },
        lessonsLearned: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lesson: { type: 'string' },
              actionable: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        teamVelocity: {
          type: 'object',
          properties: {
            actualVelocity: { type: 'string' },
            plannedVelocity: { type: 'string' },
            variance: { type: 'string' },
            capacityUtilization: { type: 'number' }
          }
        },
        stakeholderSatisfaction: {
          type: 'object',
          properties: {
            overallSatisfaction: { type: 'string', enum: ['very-satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very-dissatisfied'] },
            keyFeedback: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'okr-review', 'retrospective']
}));

export const marketAnalysisTask = defineTask('market-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Market Analysis and Competitive Intelligence - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Marketing Manager with expertise in competitive intelligence and market research',
      task: 'Conduct comprehensive market analysis and competitive intelligence for quarterly planning',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        marketData: args.marketData,
        okrReview: args.okrReview
      },
      instructions: [
        '1. Analyze current market trends relevant to the product domain',
        '2. Identify emerging technologies or paradigm shifts affecting the market',
        '3. Review competitor moves - new features, pricing changes, acquisitions, partnerships',
        '4. Assess competitive positioning - where do we stand vs competitors?',
        '5. Identify market opportunities - gaps, underserved segments, new use cases',
        '6. Analyze market threats - new entrants, disruptive technologies, regulatory changes',
        '7. Review industry analyst reports and predictions for the quarter',
        '8. Assess total addressable market (TAM) changes and growth projections',
        '9. Identify strategic partnerships or ecosystem opportunities',
        '10. Generate market-driven product recommendations for the roadmap',
        '11. Create competitive feature gap analysis',
        '12. Document macroeconomic factors affecting product adoption'
      ],
      outputFormat: 'JSON object with comprehensive market analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['keyTrends', 'competitorMoves', 'opportunities', 'threats'],
      properties: {
        keyTrends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trend: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              timeframe: { type: 'string' },
              relevance: { type: 'string' }
            }
          }
        },
        emergingTechnologies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technology: { type: 'string' },
              maturity: { type: 'string', enum: ['experimental', 'emerging', 'mature'] },
              applicability: { type: 'string' },
              adoptionRecommendation: { type: 'string' }
            }
          }
        },
        competitorMoves: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              action: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              responseRequired: { type: 'boolean' },
              recommendedResponse: { type: 'string' }
            }
          }
        },
        competitivePositioning: {
          type: 'object',
          properties: {
            currentPosition: { type: 'string', enum: ['leader', 'challenger', 'follower', 'niche'] },
            strengthAreas: { type: 'array', items: { type: 'string' } },
            weaknessAreas: { type: 'array', items: { type: 'string' } },
            differentiators: { type: 'array', items: { type: 'string' } }
          }
        },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              marketSize: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              investmentRequired: { type: 'string', enum: ['high', 'medium', 'low'] },
              timeToCapture: { type: 'string' }
            }
          }
        },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigationStrategy: { type: 'string' }
            }
          }
        },
        marketRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        featureGapAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              competitorsOffering: { type: 'array', items: { type: 'string' } },
              customerDemand: { type: 'string', enum: ['high', 'medium', 'low'] },
              developmentEffort: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'market-analysis', 'competitive-intelligence']
}));

export const customerResearchSynthesisTask = defineTask('customer-research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Customer Research Synthesis - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Researcher and Customer Insights Analyst with expertise in qualitative and quantitative research synthesis',
      task: 'Synthesize customer feedback, research, and usage data to inform roadmap priorities',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        customerFeedback: args.customerFeedback,
        marketAnalysis: args.marketAnalysis,
        okrReview: args.okrReview
      },
      instructions: [
        '1. Aggregate and categorize all customer feedback sources (surveys, interviews, support tickets, feature requests)',
        '2. Identify top customer pain points with frequency and severity analysis',
        '3. Analyze feature requests by demand, frequency, and customer segment',
        '4. Review product usage analytics - which features are used most? Which are underutilized?',
        '5. Identify customer segments and their specific needs/priorities',
        '6. Analyze churn reasons and retention drivers',
        '7. Review NPS/CSAT scores and identify improvement opportunities',
        '8. Synthesize qualitative insights from customer interviews and user testing',
        '9. Map customer jobs-to-be-done and assess how well product serves them',
        '10. Identify customer success patterns and blockers',
        '11. Prioritize customer needs using impact vs effort framework',
        '12. Generate customer-driven recommendations for roadmap'
      ],
      outputFormat: 'JSON object with comprehensive customer research synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['topPainPoints', 'topFeatureRequests', 'segmentPriorities', 'recommendations'],
      properties: {
        topPainPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              frequency: { type: 'number', description: 'Number of customers reporting this' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              affectedSegments: { type: 'array', items: { type: 'string' } },
              businessImpact: { type: 'string' }
            }
          }
        },
        topFeatureRequests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              requestCount: { type: 'number' },
              requestingSegments: { type: 'array', items: { type: 'string' } },
              businessValue: { type: 'string', enum: ['high', 'medium', 'low'] },
              urgency: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] }
            }
          }
        },
        usageAnalytics: {
          type: 'object',
          properties: {
            mostUsedFeatures: { type: 'array', items: { type: 'string' } },
            underutilizedFeatures: { type: 'array', items: { type: 'string' } },
            featureAdoptionRate: { type: 'string' },
            averageSessionDuration: { type: 'string' },
            powerUserCharacteristics: { type: 'array', items: { type: 'string' } }
          }
        },
        segmentPriorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              size: { type: 'string' },
              revenue: { type: 'string', enum: ['high', 'medium', 'low'] },
              topNeeds: { type: 'array', items: { type: 'string' } },
              strategicImportance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        churnAnalysis: {
          type: 'object',
          properties: {
            churnRate: { type: 'string' },
            topChurnReasons: { type: 'array', items: { type: 'string' } },
            retentionDrivers: { type: 'array', items: { type: 'string' } },
            atRiskSegments: { type: 'array', items: { type: 'string' } }
          }
        },
        satisfactionMetrics: {
          type: 'object',
          properties: {
            npsScore: { type: 'number' },
            csatScore: { type: 'number' },
            promoterFeedback: { type: 'array', items: { type: 'string' } },
            detractorFeedback: { type: 'array', items: { type: 'string' } },
            improvementOpportunities: { type: 'array', items: { type: 'string' } }
          }
        },
        jobsToBeDone: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              job: { type: 'string' },
              currentSolution: { type: 'string' },
              satisfactionLevel: { type: 'string', enum: ['satisfied', 'partially-satisfied', 'unsatisfied'] },
              improvementOpportunity: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              supportingEvidence: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'customer-research', 'user-insights']
}));

export const themeIdentificationTask = defineTask('theme-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Strategic Theme Identification - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chief Product Officer with expertise in strategic planning and theme-based roadmapping',
      task: 'Identify and define strategic themes that will guide the quarterly roadmap',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        okrReview: args.okrReview,
        marketAnalysis: args.marketAnalysis,
        customerResearch: args.customerResearch
      },
      instructions: [
        '1. Synthesize inputs from OKR review, market analysis, and customer research',
        '2. Identify 3-5 strategic themes that should drive this quarter (e.g., "Scale for Enterprise", "Improve Onboarding", "AI-Powered Features")',
        '3. Define each theme with clear purpose, business objectives, and success criteria',
        '4. Ensure themes align with company strategy and product vision',
        '5. Map themes to market opportunities and customer needs',
        '6. Assess theme impact on different customer segments',
        '7. Define theme-level metrics and KPIs',
        '8. Prioritize themes by strategic importance and urgency',
        '9. Identify dependencies and relationships between themes',
        '10. Estimate resource allocation across themes (percentage of team capacity)',
        '11. Define what "done" looks like for each theme this quarter',
        '12. Validate themes with stakeholder business objectives'
      ],
      outputFormat: 'JSON object with strategic themes and prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'themePriorities', 'resourceAllocation'],
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              themeId: { type: 'string' },
              themeName: { type: 'string' },
              description: { type: 'string' },
              businessObjective: { type: 'string' },
              customerValue: { type: 'string' },
              marketRationale: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } },
              keyMetrics: { type: 'array', items: { type: 'string' } },
              targetSegments: { type: 'array', items: { type: 'string' } },
              strategicPriority: { type: 'string', enum: ['critical', 'high', 'medium'] }
            }
          },
          minItems: 3,
          maxItems: 5
        },
        themePriorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              themeId: { type: 'string' },
              rank: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        resourceAllocation: {
          type: 'object',
          properties: {
            byTheme: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  themeId: { type: 'string' },
                  allocatedPercentage: { type: 'number' },
                  rationale: { type: 'string' }
                }
              }
            }
          }
        },
        themeDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              themeId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              dependencyType: { type: 'string', enum: ['blocking', 'supporting', 'related'] }
            }
          }
        },
        stakeholderAlignment: {
          type: 'object',
          properties: {
            alignedObjectives: { type: 'array', items: { type: 'string' } },
            potentialConflicts: { type: 'array', items: { type: 'string' } },
            consensusLevel: { type: 'string', enum: ['full', 'partial', 'needs-discussion'] }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'strategic-themes', 'prioritization']
}));

export const initiativeMappingTask = defineTask('initiative-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Initiative Mapping and Prioritization - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Product Manager with expertise in initiative planning and prioritization frameworks',
      task: 'Map specific initiatives to strategic themes and prioritize based on impact, effort, and strategic alignment',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        themes: args.themes,
        customerResearch: args.customerResearch,
        marketAnalysis: args.marketAnalysis,
        teamCapacity: args.teamCapacity
      },
      instructions: [
        '1. For each strategic theme, identify specific initiatives (epics/major features) that support it',
        '2. Define clear scope, objectives, and deliverables for each initiative',
        '3. Estimate effort using T-shirt sizing (S/M/L/XL) or story points',
        '4. Assess business value/impact for each initiative (high/medium/low)',
        '5. Apply prioritization framework (RICE, Value vs Effort, or similar)',
        '6. Identify which initiatives are "committed" (70%) vs "exploratory" (30%)',
        '7. Committed initiatives: High confidence, well-defined, critical for business',
        '8. Exploratory initiatives: Innovation, learning, experimentation, lower risk',
        '9. Map initiatives to customer pain points and feature requests',
        '10. Identify technical dependencies and prerequisite work',
        '11. Assess risk level for each initiative (high/medium/low)',
        '12. Define initiative-level success metrics',
        '13. Validate that committed initiatives total ~70% of capacity'
      ],
      outputFormat: 'JSON object with initiatives mapped to themes and prioritized'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'committedInitiatives', 'exploratoryInitiatives', 'prioritizationFramework'],
      properties: {
        initiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiativeId: { type: 'string' },
              name: { type: 'string' },
              themeId: { type: 'string' },
              description: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              effortEstimate: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL'] },
              businessValue: { type: 'string', enum: ['high', 'medium', 'low'] },
              priorityScore: { type: 'number' },
              initiativeType: { type: 'string', enum: ['committed', 'exploratory'] },
              riskLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              successMetrics: { type: 'array', items: { type: 'string' } },
              customerImpact: { type: 'string' },
              technicalDependencies: { type: 'array', items: { type: 'string' } },
              requiredSkills: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        committedInitiatives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Initiative IDs for committed work (~70% capacity)'
        },
        exploratoryInitiatives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Initiative IDs for exploratory work (~30% capacity)'
        },
        prioritizationFramework: {
          type: 'object',
          properties: {
            frameworkUsed: { type: 'string' },
            criteria: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          }
        },
        initiativesByTheme: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        deferredInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiativeId: { type: 'string' },
              name: { type: 'string' },
              deferralReason: { type: 'string' },
              revisitQuarter: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'initiative-mapping', 'prioritization']
}));

export const capacityPlanningTask = defineTask('capacity-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Capacity Planning and Resource Allocation - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Engineering Manager and Resource Planning Specialist with expertise in capacity planning',
      task: 'Plan team capacity allocation ensuring 70% committed / 30% exploratory split',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        initiatives: args.initiatives,
        teamCapacity: args.teamCapacity,
        committedPercentage: args.committedPercentage,
        exploratoryPercentage: args.exploratoryPercentage
      },
      instructions: [
        '1. Calculate total available team capacity for the quarter (person-weeks or story points)',
        '2. Account for holidays, PTO, training, and other non-project time',
        '3. Apply historical velocity data to adjust capacity estimates',
        '4. Allocate capacity to committed initiatives (target: 70%)',
        '5. Allocate capacity to exploratory initiatives (target: 30%)',
        '6. Ensure buffer capacity (~10-15%) for unplanned work, bugs, and support',
        '7. Balance capacity across different skill sets (engineering, design, QA)',
        '8. Identify capacity constraints or bottlenecks',
        '9. Flag if initiatives exceed available capacity',
        '10. Provide recommendations for scope adjustments if overallocated',
        '11. Consider parallel vs sequential work based on dependencies',
        '12. Document assumptions and risks in capacity plan'
      ],
      outputFormat: 'JSON object with detailed capacity allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCapacityUsed', 'committedCapacity', 'exploratoryCapacity', 'bufferCapacity'],
      properties: {
        totalAvailableCapacity: {
          type: 'object',
          properties: {
            personWeeks: { type: 'number' },
            storyPoints: { type: 'number' },
            adjustedForNonProjectTime: { type: 'number' }
          }
        },
        committedCapacity: {
          type: 'number',
          description: 'Percentage of capacity allocated to committed initiatives'
        },
        exploratoryCapacity: {
          type: 'number',
          description: 'Percentage of capacity allocated to exploratory initiatives'
        },
        bufferCapacity: {
          type: 'number',
          description: 'Percentage of capacity reserved as buffer'
        },
        totalCapacityUsed: {
          type: 'number',
          description: 'Total percentage of capacity allocated (should be <= 100)'
        },
        capacityByInitiative: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiativeId: { type: 'string' },
              initiativeName: { type: 'string' },
              allocatedCapacity: { type: 'number' },
              capacityUnit: { type: 'string', enum: ['person-weeks', 'story-points', 'percentage'] },
              team: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        capacityBySkill: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              available: { type: 'number' },
              allocated: { type: 'number' },
              utilization: { type: 'number' },
              constraint: { type: 'boolean' }
            }
          }
        },
        capacityConstraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        overallocation: {
          type: 'object',
          properties: {
            isOverallocated: { type: 'boolean' },
            overallocationAmount: { type: 'number' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'capacity-planning', 'resource-allocation']
}));

export const timelinePlanningTask = defineTask('timeline-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Timeline Creation and Milestone Planning - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Delivery Manager with expertise in release planning and milestone management',
      task: 'Create detailed quarterly timeline with milestones, delivery schedule, and dependencies',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        initiatives: args.initiatives,
        capacityPlanning: args.capacityPlanning,
        committedPercentage: args.committedPercentage,
        exploratoryPercentage: args.exploratoryPercentage
      },
      instructions: [
        '1. Define key milestones for the quarter (e.g., Month 1, Month 2, Month 3 targets)',
        '2. Sequence initiatives based on dependencies and priorities',
        '3. Create delivery schedule showing when each initiative will be delivered',
        '4. Identify critical path items that must complete on time',
        '5. Plan sprints/iterations with initiative allocation',
        '6. Define alpha/beta/GA timelines for major initiatives',
        '7. Schedule stakeholder reviews and demo points',
        '8. Plan for integration points between dependent initiatives',
        '9. Build in buffer time for unknowns and risk mitigation',
        '10. Identify decision points and go/no-go gates',
        '11. Create visual timeline (Gantt-style) representation',
        '12. Document assumptions about delivery velocity and scope'
      ],
      outputFormat: 'JSON object with timeline, milestones, and delivery schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['milestones', 'deliverySchedule', 'dependencies'],
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestoneId: { type: 'string' },
              milestoneName: { type: 'string' },
              targetDate: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              stakeholderReview: { type: 'boolean' }
            }
          }
        },
        deliverySchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiativeId: { type: 'string' },
              initiativeName: { type: 'string' },
              startDate: { type: 'string' },
              targetCompletionDate: { type: 'string' },
              deliveryPhase: { type: 'string', enum: ['alpha', 'beta', 'GA', 'iterative'] },
              criticalPath: { type: 'boolean' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiativeId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              dependencyType: { type: 'string', enum: ['hard-blocker', 'soft-blocker', 'nice-to-have'] },
              mitigation: { type: 'string' }
            }
          }
        },
        sprintAllocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprintNumber: { type: 'number' },
              sprintGoal: { type: 'string' },
              allocatedInitiatives: { type: 'array', items: { type: 'string' } },
              committedVsExploratory: { type: 'object' }
            }
          }
        },
        decisionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decisionDate: { type: 'string' },
              decision: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              stakeholders: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalPath: {
          type: 'array',
          items: { type: 'string' },
          description: 'Initiative IDs on critical path'
        },
        bufferAllocation: {
          type: 'object',
          properties: {
            totalBufferWeeks: { type: 'number' },
            bufferPurpose: { type: 'array', items: { type: 'string' } }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'timeline-planning', 'milestone-management']
}));

export const okrDefinitionTask = defineTask('okr-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: OKR Definition for Upcoming Quarter - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OKR Coach and Goal-Setting Specialist with expertise in SMART objectives',
      task: 'Define clear, measurable OKRs for the upcoming quarter based on themes and initiatives',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        themes: args.themes,
        initiatives: args.initiatives,
        marketAnalysis: args.marketAnalysis,
        customerResearch: args.customerResearch,
        okrReview: args.okrReview
      },
      instructions: [
        '1. Define 3-5 objectives for the quarter that are aspirational yet achievable',
        '2. Ensure objectives align with strategic themes and company goals',
        '3. For each objective, define 2-4 key results that are measurable and time-bound',
        '4. Key results should use metrics (numbers, percentages, completions)',
        '5. Apply SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound',
        '6. Set ambitious but realistic targets (aim for 70-80% achievement as success)',
        '7. Align OKRs with customer outcomes and business impact',
        '8. Map key results to specific initiatives on the roadmap',
        '9. Define how progress will be measured and tracked',
        '10. Identify dependencies between key results',
        '11. Ensure OKRs address learnings from previous quarter review',
        '12. Validate OKRs with stakeholder expectations'
      ],
      outputFormat: 'JSON object with defined OKRs for the quarter'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'keyResults'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              objective: { type: 'string' },
              description: { type: 'string' },
              alignedThemes: { type: 'array', items: { type: 'string' } },
              businessRationale: { type: 'string' },
              customerImpact: { type: 'string' }
            }
          },
          minItems: 3,
          maxItems: 5
        },
        keyResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyResultId: { type: 'string' },
              objectiveId: { type: 'string' },
              keyResult: { type: 'string' },
              metric: { type: 'string' },
              currentValue: { type: 'string' },
              targetValue: { type: 'string' },
              measurementMethod: { type: 'string' },
              supportingInitiatives: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        okrDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyResultId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              dependencyType: { type: 'string' }
            }
          }
        },
        trackingPlan: {
          type: 'object',
          properties: {
            trackingFrequency: { type: 'string', enum: ['weekly', 'bi-weekly', 'monthly'] },
            reviewMeetings: { type: 'array', items: { type: 'string' } },
            dashboardLocation: { type: 'string' },
            ownershipModel: { type: 'string' }
          }
        },
        riskFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyResultId: { type: 'string' },
              risk: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'okr-definition', 'goal-setting']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Risk Assessment and Dependency Mapping - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist and Program Manager with expertise in roadmap risk assessment',
      task: 'Identify, assess, and create mitigation plans for roadmap risks and dependencies',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        initiatives: args.initiatives,
        capacityPlanning: args.capacityPlanning,
        timelinePlanning: args.timelinePlanning,
        teamCapacity: args.teamCapacity
      },
      instructions: [
        '1. Identify delivery risks for each initiative (scope, timeline, resources, technical)',
        '2. Assess dependency risks - what happens if dependencies are not met?',
        '3. Identify capacity risks - team availability, skill gaps, overallocation',
        '4. Assess technical risks - complexity, unknowns, technical debt',
        '5. Identify external risks - third-party dependencies, regulatory, market changes',
        '6. Rate each risk by probability (low/medium/high) and impact (low/medium/high)',
        '7. Calculate risk score (probability × impact)',
        '8. Prioritize risks by score and create risk register',
        '9. Develop mitigation strategies for high and medium risks',
        '10. Identify early warning signals for each major risk',
        '11. Create contingency plans for critical path initiatives',
        '12. Define escalation paths for blocked initiatives'
      ],
      outputFormat: 'JSON object with comprehensive risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRisks', 'highRisks', 'mediumRisks', 'mitigationStrategies'],
      properties: {
        totalRisks: { type: 'number' },
        highRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              risk: { type: 'string' },
              category: { type: 'string', enum: ['delivery', 'dependency', 'capacity', 'technical', 'external', 'market'] },
              probability: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              riskScore: { type: 'number' },
              affectedInitiatives: { type: 'array', items: { type: 'string' } },
              earlyWarningSignals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mediumRisks: { type: 'array' },
        lowRisks: { type: 'array' },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              cost: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
              effectiveness: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        contingencyPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiativeId: { type: 'string' },
              scenario: { type: 'string' },
              contingencyAction: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        dependencyRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dependency: { type: 'string' },
              riskLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        escalationPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              escalateTo: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'risk-assessment', 'dependency-management']
}));

export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Stakeholder Communication Plan - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Communications Manager with expertise in stakeholder management and communication planning',
      task: 'Create comprehensive communication plan for roadmap rollout and ongoing updates',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        themes: args.themes,
        initiatives: args.initiatives,
        newOKRs: args.newOKRs,
        timelinePlanning: args.timelinePlanning,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Identify all stakeholder groups (executives, sales, marketing, customers, partners, internal teams)',
        '2. Determine what each stakeholder group needs to know about the roadmap',
        '3. Create tailored messaging for each stakeholder group',
        '4. Plan roadmap kickoff presentation/meeting',
        '5. Define ongoing communication cadence (weekly updates, monthly reviews, quarterly business reviews)',
        '6. Create public-facing roadmap communication (what customers/prospects should know)',
        '7. Plan internal enablement sessions for sales and customer success teams',
        '8. Define update mechanisms for roadmap changes',
        '9. Create feedback collection mechanisms from stakeholders',
        '10. Plan demo days and milestone celebrations',
        '11. Define metrics dashboard for stakeholder visibility',
        '12. Create FAQ document addressing common stakeholder questions'
      ],
      outputFormat: 'JSON object with comprehensive communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'stakeholderGroups', 'communicationSchedule'],
      properties: {
        stakeholderGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              keyMessage: { type: 'string' },
              communicationChannel: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              detailLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        kickoffPlan: {
          type: 'object',
          properties: {
            kickoffDate: { type: 'string' },
            format: { type: 'string' },
            audience: { type: 'array', items: { type: 'string' } },
            agenda: { type: 'array', items: { type: 'string' } },
            deliverables: { type: 'array', items: { type: 'string' } }
          }
        },
        communicationSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frequency: { type: 'string' },
              channel: { type: 'string' },
              audience: { type: 'string' },
              content: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        publicRoadmap: {
          type: 'object',
          properties: {
            publiclyShared: { type: 'boolean' },
            audience: { type: 'array', items: { type: 'string' } },
            detailLevel: { type: 'string' },
            updateFrequency: { type: 'string' },
            location: { type: 'string' }
          }
        },
        internalEnablement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              session: { type: 'string' },
              audience: { type: 'string' },
              date: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        feedbackMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              stakeholderGroup: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        dashboardSetup: {
          type: 'object',
          properties: {
            dashboardLocation: { type: 'string' },
            updateFrequency: { type: 'string' },
            keyMetrics: { type: 'array', items: { type: 'string' } },
            accessList: { type: 'array', items: { type: 'string' } }
          }
        },
        plan: {
          type: 'object',
          description: 'Overall communication plan summary'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'communication-plan', 'stakeholder-management']
}));

export const roadmapDocumentGenerationTask = defineTask('roadmap-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Final Roadmap Document Generation - ${args.quarter}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Product Manager and Technical Writer with expertise in roadmap documentation',
      task: 'Generate comprehensive quarterly roadmap document synthesizing all planning phases',
      context: {
        quarter: args.quarter,
        productName: args.productName,
        okrReview: args.okrReview,
        marketAnalysis: args.marketAnalysis,
        customerResearch: args.customerResearch,
        themeIdentification: args.themeIdentification,
        initiativeMapping: args.initiativeMapping,
        capacityPlanning: args.capacityPlanning,
        timelinePlanning: args.timelinePlanning,
        newOKRs: args.newOKRs,
        riskAssessment: args.riskAssessment,
        communicationPlan: args.communicationPlan,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Create executive summary highlighting strategic direction and key deliverables',
        '2. Document previous quarter review and lessons learned',
        '3. Present market and customer insights informing the roadmap',
        '4. Detail strategic themes with objectives and success criteria',
        '5. Present initiative portfolio with committed (70%) and exploratory (30%) breakdown',
        '6. Show timeline with milestones and delivery schedule',
        '7. Present OKRs for the quarter with measurement plan',
        '8. Document capacity allocation and resource plan',
        '9. Include risk assessment and mitigation strategies',
        '10. Add communication plan and stakeholder engagement approach',
        '11. Include visual elements: timeline diagram, theme breakdown, initiative prioritization matrix',
        '12. Generate both structured JSON and formatted markdown document',
        '13. Calculate overall roadmap quality score based on completeness and alignment',
        '14. Add appendices with detailed initiative descriptions and dependencies'
      ],
      outputFormat: 'JSON object with complete roadmap document and quality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown', 'qualityScore'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            quarter: { type: 'string' },
            productName: { type: 'string' },
            previousQuarterReview: {
              type: 'object',
              properties: {
                okrCompletion: { type: 'number' },
                keySuccesses: { type: 'array', items: { type: 'string' } },
                lessonsLearned: { type: 'array', items: { type: 'string' } }
              }
            },
            strategicContext: {
              type: 'object',
              properties: {
                marketTrends: { type: 'array', items: { type: 'string' } },
                customerInsights: { type: 'array', items: { type: 'string' } },
                competitiveLandscape: { type: 'string' }
              }
            },
            themes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  theme: { type: 'string' },
                  objective: { type: 'string' },
                  successMetrics: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            initiatives: {
              type: 'object',
              properties: {
                committed: { type: 'array' },
                exploratory: { type: 'array' },
                commitmentRatio: { type: 'string' }
              }
            },
            timeline: {
              type: 'object',
              properties: {
                milestones: { type: 'array' },
                criticalPath: { type: 'array', items: { type: 'string' } }
              }
            },
            okrs: {
              type: 'object',
              properties: {
                objectives: { type: 'array' },
                trackingPlan: { type: 'string' }
              }
            },
            resourceAllocation: {
              type: 'object',
              properties: {
                capacity: { type: 'string' },
                teamComposition: { type: 'string' }
              }
            },
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  mitigation: { type: 'string' }
                }
              }
            }
          }
        },
        markdown: {
          type: 'string',
          description: 'Complete roadmap in markdown format for stakeholder review'
        },
        qualityScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall roadmap quality score'
        },
        qualityAssessment: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            alignment: { type: 'number' },
            feasibility: { type: 'number' },
            clarity: { type: 'number' },
            stakeholderReadiness: { type: 'string', enum: ['ready', 'needs-refinement', 'needs-major-work'] }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['roadmap-planning', 'documentation', 'roadmap-document']
}));
