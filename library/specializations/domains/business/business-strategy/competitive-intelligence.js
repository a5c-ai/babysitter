/**
 * @process business-strategy/competitive-intelligence
 * @description Systematic collection, analysis, and dissemination of information about competitors, market trends, and industry dynamics
 * @inputs { targetCompetitors: array, industry: string, organizationContext: object, intelligenceRequirements: array, outputDir: string }
 * @outputs { success: boolean, competitorProfiles: array, marketIntelligence: object, strategicInsights: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetCompetitors = [],
    industry = '',
    organizationContext = {},
    intelligenceRequirements = [],
    outputDir = 'competitive-intel-output',
    analysisDepth = 'comprehensive'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Competitive Intelligence Gathering Process');

  // ============================================================================
  // PHASE 1: INTELLIGENCE REQUIREMENTS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining intelligence requirements');
  const requirements = await ctx.task(intelligenceRequirementsTask, {
    intelligenceRequirements,
    industry,
    organizationContext,
    targetCompetitors,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: COMPETITOR IDENTIFICATION AND MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying and mapping competitors');
  const competitorMapping = await ctx.task(competitorMappingTask, {
    targetCompetitors,
    industry,
    organizationContext,
    outputDir
  });

  artifacts.push(...competitorMapping.artifacts);

  // ============================================================================
  // PHASE 3: COMPETITOR PROFILE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing competitor profiles');
  const competitorProfiles = await ctx.task(competitorProfilesTask, {
    competitors: competitorMapping.competitors,
    requirements: requirements.keyQuestions,
    analysisDepth,
    outputDir
  });

  artifacts.push(...competitorProfiles.artifacts);

  // ============================================================================
  // PHASE 4: COMPETITIVE POSITIONING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing competitive positioning');
  const positioningAnalysis = await ctx.task(competitivePositioningTask, {
    competitorProfiles: competitorProfiles.profiles,
    organizationContext,
    industry,
    outputDir
  });

  artifacts.push(...positioningAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: MARKET DYNAMICS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing market dynamics');
  const marketDynamics = await ctx.task(marketDynamicsTask, {
    industry,
    competitorProfiles: competitorProfiles.profiles,
    outputDir
  });

  artifacts.push(...marketDynamics.artifacts);

  // Breakpoint: Review intelligence gathering
  await ctx.breakpoint({
    question: `Competitive intelligence gathered. Analyzed ${competitorProfiles.profiles.length} competitors. Review detailed findings?`,
    title: 'Competitive Intelligence Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        competitorsAnalyzed: competitorProfiles.profiles.length,
        directCompetitors: competitorMapping.directCompetitors.length,
        indirectCompetitors: competitorMapping.indirectCompetitors.length,
        marketTrends: marketDynamics.trends.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: COMPETITOR STRATEGY INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 6: Inferring competitor strategies');
  const strategyInference = await ctx.task(strategyInferenceTask, {
    competitorProfiles: competitorProfiles.profiles,
    marketDynamics,
    outputDir
  });

  artifacts.push(...strategyInference.artifacts);

  // ============================================================================
  // PHASE 7: COMPETITIVE THREAT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing competitive threats');
  const threatAssessment = await ctx.task(threatAssessmentTask, {
    competitorProfiles: competitorProfiles.profiles,
    strategyInference,
    organizationContext,
    outputDir
  });

  artifacts.push(...threatAssessment.artifacts);

  // ============================================================================
  // PHASE 8: STRATEGIC INSIGHTS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating strategic insights');
  const strategicInsights = await ctx.task(strategicInsightsTask, {
    competitorProfiles: competitorProfiles.profiles,
    positioningAnalysis,
    marketDynamics,
    strategyInference,
    threatAssessment,
    organizationContext,
    outputDir
  });

  artifacts.push(...strategicInsights.artifacts);

  // ============================================================================
  // PHASE 9: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive intelligence report');
  const intelligenceReport = await ctx.task(intelligenceReportTask, {
    requirements,
    competitorMapping,
    competitorProfiles,
    positioningAnalysis,
    marketDynamics,
    strategyInference,
    threatAssessment,
    strategicInsights,
    outputDir
  });

  artifacts.push(...intelligenceReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    competitorProfiles: competitorProfiles.profiles,
    competitorMapping: {
      direct: competitorMapping.directCompetitors,
      indirect: competitorMapping.indirectCompetitors,
      emerging: competitorMapping.emergingCompetitors
    },
    marketIntelligence: {
      trends: marketDynamics.trends,
      dynamics: marketDynamics.dynamics
    },
    strategicInsights: strategicInsights.insights,
    recommendations: strategicInsights.recommendations,
    threatAssessment: threatAssessment.threats,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/competitive-intelligence',
      timestamp: startTime,
      industry,
      analysisDepth
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Intelligence Requirements Definition
export const intelligenceRequirementsTask = defineTask('intelligence-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define intelligence requirements',
  agent: {
    name: 'intelligence-analyst',
    prompt: {
      role: 'competitive intelligence analyst',
      task: 'Define key intelligence requirements and questions',
      context: args,
      instructions: [
        'Review provided intelligence requirements',
        'Develop key intelligence questions (KIQs):',
        '  - Competitor strategy and intentions',
        '  - Competitive capabilities and resources',
        '  - Market share and positioning',
        '  - Product/service roadmaps',
        '  - Pricing and go-to-market strategies',
        '  - M&A and partnership activities',
        '  - Leadership and organizational changes',
        'Prioritize questions by strategic importance',
        'Define intelligence collection approach',
        'Save requirements to output directory'
      ],
      outputFormat: 'JSON with keyQuestions (array), collectionApproach (object), priorities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyQuestions', 'artifacts'],
      properties: {
        keyQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' }
            }
          }
        },
        collectionApproach: { type: 'object' },
        priorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'requirements']
}));

// Task 2: Competitor Mapping
export const competitorMappingTask = defineTask('competitor-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map competitive landscape',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'market analyst and competitive mapping specialist',
      task: 'Map the competitive landscape and categorize competitors',
      context: args,
      instructions: [
        'Identify all competitors in the market',
        'Categorize competitors:',
        '  - Direct competitors (same market, same offering)',
        '  - Indirect competitors (same need, different solution)',
        '  - Potential competitors (adjacent markets)',
        '  - Emerging competitors (startups, disruptors)',
        'Create competitive landscape map',
        'Identify strategic groups',
        'Assess competitive intensity by segment',
        'Save mapping to output directory'
      ],
      outputFormat: 'JSON with competitors (array), directCompetitors, indirectCompetitors, emergingCompetitors, strategicGroups, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'directCompetitors', 'indirectCompetitors', 'artifacts'],
      properties: {
        competitors: { type: 'array', items: { type: 'string' } },
        directCompetitors: { type: 'array', items: { type: 'string' } },
        indirectCompetitors: { type: 'array', items: { type: 'string' } },
        emergingCompetitors: { type: 'array', items: { type: 'string' } },
        strategicGroups: { type: 'array' },
        landscapeMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'mapping']
}));

// Task 3: Competitor Profiles
export const competitorProfilesTask = defineTask('competitor-profiles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop competitor profiles',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence analyst',
      task: 'Develop detailed profiles for key competitors',
      context: args,
      instructions: [
        'For each competitor, analyze:',
        '  - Company overview and history',
        '  - Products and services portfolio',
        '  - Target markets and customer segments',
        '  - Revenue and financial performance',
        '  - Organizational structure and leadership',
        '  - Core competencies and capabilities',
        '  - Technology and innovation',
        '  - Partnerships and alliances',
        '  - Recent news and developments',
        'Assess competitor strengths and weaknesses',
        'Identify competitive advantages',
        'Save profiles to output directory'
      ],
      outputFormat: 'JSON with profiles (array of detailed competitor objects), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'artifacts'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              overview: { type: 'string' },
              products: { type: 'array', items: { type: 'string' } },
              targetMarkets: { type: 'array', items: { type: 'string' } },
              financials: { type: 'object' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              competitiveAdvantage: { type: 'string' }
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
  labels: ['agent', 'competitive-intelligence', 'profiles']
}));

// Task 4: Competitive Positioning Analysis
export const competitivePositioningTask = defineTask('competitive-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitive positioning',
  agent: {
    name: 'positioning-analyst',
    prompt: {
      role: 'competitive positioning analyst',
      task: 'Analyze competitive positioning and market placement',
      context: args,
      instructions: [
        'Create positioning maps based on key dimensions:',
        '  - Price vs quality',
        '  - Innovation vs stability',
        '  - Breadth vs depth',
        '  - Custom dimensions relevant to industry',
        'Identify positioning gaps and white spaces',
        'Analyze value proposition differentiation',
        'Compare brand positioning and perception',
        'Assess positioning sustainability',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with positioningMaps (array), positioningGaps (array), differentiators (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['positioningMaps', 'artifacts'],
      properties: {
        positioningMaps: { type: 'array' },
        positioningGaps: { type: 'array', items: { type: 'string' } },
        differentiators: { type: 'array' },
        whiteSpaces: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'positioning']
}));

// Task 5: Market Dynamics Analysis
export const marketDynamicsTask = defineTask('market-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market dynamics',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'market dynamics analyst',
      task: 'Analyze overall market dynamics and trends',
      context: args,
      instructions: [
        'Analyze market dynamics:',
        '  - Market size and growth rates',
        '  - Market segmentation',
        '  - Competitive intensity trends',
        '  - Industry profitability',
        '  - Market consolidation patterns',
        'Identify key market trends:',
        '  - Technology trends',
        '  - Customer preference shifts',
        '  - Regulatory changes',
        '  - Pricing trends',
        'Assess market lifecycle stage',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with dynamics (object), trends (array), marketSize (object), lifecycleStage (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dynamics', 'trends', 'artifacts'],
      properties: {
        dynamics: { type: 'object' },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trend: { type: 'string' },
              impact: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        marketSize: { type: 'object' },
        lifecycleStage: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'market-dynamics']
}));

// Task 6: Strategy Inference
export const strategyInferenceTask = defineTask('strategy-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Infer competitor strategies',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'competitive strategy analyst',
      task: 'Infer competitor strategies from observed behaviors',
      context: args,
      instructions: [
        'Analyze competitor actions to infer strategy:',
        '  - Product launch patterns',
        '  - Pricing behaviors',
        '  - Marketing and messaging',
        '  - Investment and acquisition patterns',
        '  - Hiring and organizational changes',
        '  - Partnership announcements',
        'Infer strategic intent and direction',
        'Predict likely next moves',
        'Identify strategic shifts',
        'Save inferences to output directory'
      ],
      outputFormat: 'JSON with inferences (array of objects by competitor), predictedMoves (array), strategicShifts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences', 'artifacts'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              inferredStrategy: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string' }
            }
          }
        },
        predictedMoves: { type: 'array' },
        strategicShifts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'strategy-inference']
}));

// Task 7: Threat Assessment
export const threatAssessmentTask = defineTask('threat-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess competitive threats',
  agent: {
    name: 'threat-analyst',
    prompt: {
      role: 'competitive threat analyst',
      task: 'Assess competitive threats to the organization',
      context: args,
      instructions: [
        'Assess threat level from each competitor:',
        '  - Capability to compete',
        '  - Intent and motivation',
        '  - Historical competitive behavior',
        '  - Resource availability',
        'Categorize threats:',
        '  - Immediate threats',
        '  - Emerging threats',
        '  - Potential threats',
        'Identify vulnerable areas',
        'Assess threat scenarios',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with threats (array of objects), vulnerabilities (array), threatScenarios (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['threats', 'artifacts'],
      properties: {
        threats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              threatLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              timeframe: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        threatScenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'threat-assessment']
}));

// Task 8: Strategic Insights
export const strategicInsightsTask = defineTask('strategic-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate strategic insights',
  agent: {
    name: 'chief-strategy-officer',
    prompt: {
      role: 'chief strategy officer',
      task: 'Generate strategic insights and recommendations from competitive intelligence',
      context: args,
      instructions: [
        'Synthesize key competitive insights',
        'Develop strategic recommendations:',
        '  - Offensive strategies (attack opportunities)',
        '  - Defensive strategies (protect position)',
        '  - Differentiation opportunities',
        '  - Partnership possibilities',
        'Prioritize by impact and feasibility',
        'Identify quick wins',
        'Define monitoring priorities',
        'Save insights to output directory'
      ],
      outputFormat: 'JSON with insights (array), recommendations (array), quickWins (array), monitoringPriorities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'recommendations', 'artifacts'],
      properties: {
        insights: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              type: { type: 'string', enum: ['offensive', 'defensive', 'differentiation', 'partnership'] },
              priority: { type: 'string' },
              targetCompetitor: { type: 'string' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        monitoringPriorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'insights', 'recommendations']
}));

// Task 9: Intelligence Report Generation
export const intelligenceReportTask = defineTask('intelligence-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive intelligence report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'competitive intelligence consultant and technical writer',
      task: 'Generate comprehensive competitive intelligence report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document intelligence methodology',
        'Present competitive landscape overview',
        'Include detailed competitor profiles',
        'Present positioning analysis',
        'Document market dynamics and trends',
        'Include strategy inferences and predictions',
        'Present threat assessment',
        'Document strategic recommendations',
        'Include monitoring framework',
        'Add appendices with detailed data',
        'Format as professional intelligence brief',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'reporting', 'documentation']
}));
