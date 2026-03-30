/**
 * @process specializations/domains/business/entrepreneurship/competitive-landscape-mapping
 * @description Competitive Landscape Mapping Process - Comprehensive analysis of competitive environment including direct competitors, substitutes, and potential entrants.
 * @inputs { projectName: string, productDescription: string, targetMarket: string, knownCompetitors?: array, industryVertical: string }
 * @outputs { success: boolean, competitiveMatrix: object, positioningMap: object, strategicImplications: object, whitespaceAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/competitive-landscape-mapping', {
 *   projectName: 'Project Management SaaS',
 *   productDescription: 'AI-powered project management for remote teams',
 *   targetMarket: 'Small to medium tech companies',
 *   industryVertical: 'Productivity Software'
 * });
 *
 * @references
 * - Porter's Five Forces: https://www.isc.hbs.edu/strategy/business-strategy/
 * - Blue Ocean Strategy: https://www.blueoceanstrategy.com/
 * - Competitive Strategy - Michael Porter
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productDescription,
    targetMarket,
    knownCompetitors = [],
    industryVertical
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Competitive Landscape Mapping for ${projectName}`);

  // Phase 1: Competitor Identification
  const competitorIdentification = await ctx.task(competitorIdentificationTask, {
    projectName,
    productDescription,
    targetMarket,
    knownCompetitors,
    industryVertical
  });

  artifacts.push(...(competitorIdentification.artifacts || []));

  // Phase 2: Competitor Profiling
  const competitorProfiling = await ctx.task(competitorProfilingTask, {
    projectName,
    competitors: competitorIdentification.competitors
  });

  artifacts.push(...(competitorProfiling.artifacts || []));

  // Phase 3: Porter's Five Forces Analysis
  const fiveForcesAnalysis = await ctx.task(fiveForcesAnalysisTask, {
    projectName,
    industryVertical,
    competitorProfiling
  });

  artifacts.push(...(fiveForcesAnalysis.artifacts || []));

  // Breakpoint: Review competitive landscape
  await ctx.breakpoint({
    question: `Review competitive landscape for ${projectName}. ${competitorIdentification.competitors.length} competitors identified. Industry rivalry: ${fiveForcesAnalysis.industryRivalry}. Continue with positioning analysis?`,
    title: 'Competitive Landscape Review',
    context: {
      runId: ctx.runId,
      projectName,
      competitorCount: competitorIdentification.competitors.length,
      fiveForcesScore: fiveForcesAnalysis.overallScore,
      files: artifacts
    }
  });

  // Phase 4: Competitive Dimensions Analysis
  const dimensionsAnalysis = await ctx.task(dimensionsAnalysisTask, {
    projectName,
    productDescription,
    competitorProfiling
  });

  artifacts.push(...(dimensionsAnalysis.artifacts || []));

  // Phase 5: Positioning Map Creation
  const positioningMap = await ctx.task(positioningMapTask, {
    projectName,
    dimensionsAnalysis,
    competitorProfiling
  });

  artifacts.push(...(positioningMap.artifacts || []));

  // Phase 6: Differentiation Analysis
  const differentiationAnalysis = await ctx.task(differentiationAnalysisTask, {
    projectName,
    productDescription,
    competitorProfiling,
    positioningMap
  });

  artifacts.push(...(differentiationAnalysis.artifacts || []));

  // Phase 7: Barriers and Moats Analysis
  const barriersAnalysis = await ctx.task(barriersAnalysisTask, {
    projectName,
    competitorProfiling,
    fiveForcesAnalysis
  });

  artifacts.push(...(barriersAnalysis.artifacts || []));

  // Phase 8: Whitespace Identification
  const whitespaceAnalysis = await ctx.task(whitespaceAnalysisTask, {
    projectName,
    positioningMap,
    competitorProfiling,
    targetMarket
  });

  artifacts.push(...(whitespaceAnalysis.artifacts || []));

  // Phase 9: Strategic Implications
  const strategicImplications = await ctx.task(strategicImplicationsTask, {
    projectName,
    fiveForcesAnalysis,
    differentiationAnalysis,
    whitespaceAnalysis,
    barriersAnalysis
  });

  artifacts.push(...(strategicImplications.artifacts || []));

  // Final Breakpoint: Complete analysis
  await ctx.breakpoint({
    question: `Competitive analysis complete for ${projectName}. Key opportunities identified: ${whitespaceAnalysis.opportunities?.length || 0}. Approve analysis?`,
    title: 'Competitive Analysis Approval',
    context: {
      runId: ctx.runId,
      projectName,
      opportunities: whitespaceAnalysis.opportunities?.length || 0,
      threats: strategicImplications.threats?.length || 0,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    competitiveMatrix: {
      competitors: competitorProfiling.profiles,
      dimensions: dimensionsAnalysis.dimensions,
      fiveForces: fiveForcesAnalysis
    },
    positioningMap: positioningMap,
    strategicImplications: strategicImplications,
    whitespaceAnalysis: whitespaceAnalysis,
    differentiation: differentiationAnalysis,
    barriers: barriersAnalysis,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/competitive-landscape-mapping',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const competitorIdentificationTask = defineTask('competitor-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitor Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Intelligence Analyst',
      task: 'Identify all relevant competitors in the market landscape',
      context: {
        projectName: args.projectName,
        productDescription: args.productDescription,
        targetMarket: args.targetMarket,
        knownCompetitors: args.knownCompetitors,
        industryVertical: args.industryVertical
      },
      instructions: [
        '1. Identify direct competitors offering similar solutions',
        '2. Identify indirect competitors solving same problem differently',
        '3. Identify substitute products and alternatives',
        '4. Identify potential new entrants (adjacent players, well-funded startups)',
        '5. Categorize competitors by tier (primary, secondary, tertiary)',
        '6. Identify geographic coverage of each competitor',
        '7. Note funding status and growth trajectory of competitors',
        '8. Identify market leaders and emerging challengers',
        '9. Map competitor target customer segments',
        '10. Create comprehensive competitor inventory'
      ],
      outputFormat: 'JSON object with competitor identification'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'competitorCategories'],
      properties: {
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['direct', 'indirect', 'substitute', 'potential'] },
              tier: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] },
              geography: { type: 'string' }
            }
          }
        },
        competitorCategories: {
          type: 'object',
          properties: {
            direct: { type: 'array', items: { type: 'string' } },
            indirect: { type: 'array', items: { type: 'string' } },
            substitutes: { type: 'array', items: { type: 'string' } },
            potentialEntrants: { type: 'array', items: { type: 'string' } }
          }
        },
        marketLeaders: { type: 'array', items: { type: 'string' } },
        emergingChallengers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'competitive-analysis', 'competitor-identification']
}));

export const competitorProfilingTask = defineTask('competitor-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitor Profiling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Intelligence Analyst',
      task: 'Create detailed profiles for each significant competitor',
      context: {
        projectName: args.projectName,
        competitors: args.competitors
      },
      instructions: [
        '1. Research each competitor\'s product offering and features',
        '2. Identify pricing models and price points',
        '3. Analyze target customer segments',
        '4. Assess company size, funding, and growth stage',
        '5. Identify key strengths and weaknesses',
        '6. Analyze go-to-market strategy and channels',
        '7. Review customer reviews and satisfaction levels',
        '8. Identify technology stack and capabilities',
        '9. Assess brand positioning and messaging',
        '10. Note recent news, developments, and strategic moves'
      ],
      outputFormat: 'JSON object with competitor profiles'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              products: { type: 'array', items: { type: 'string' } },
              pricing: { type: 'object' },
              targetCustomers: { type: 'array', items: { type: 'string' } },
              companySize: { type: 'string' },
              funding: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              goToMarket: { type: 'string' },
              customerSatisfaction: { type: 'string' },
              recentDevelopments: { type: 'array', items: { type: 'string' } }
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
  labels: ['entrepreneurship', 'competitive-analysis', 'competitor-profiling']
}));

export const fiveForcesAnalysisTask = defineTask('five-forces-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Porter's Five Forces Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Analysis Expert with Porter\'s Five Forces expertise',
      task: 'Conduct comprehensive Porter\'s Five Forces analysis of the industry',
      context: {
        projectName: args.projectName,
        industryVertical: args.industryVertical,
        competitorProfiling: args.competitorProfiling
      },
      instructions: [
        '1. Analyze industry rivalry intensity (number of competitors, growth rate, differentiation)',
        '2. Assess threat of new entrants (barriers to entry, capital requirements, economies of scale)',
        '3. Evaluate bargaining power of suppliers (concentration, switching costs)',
        '4. Evaluate bargaining power of buyers (concentration, price sensitivity)',
        '5. Assess threat of substitutes (availability, performance, switching costs)',
        '6. Rate each force (low, medium, high)',
        '7. Calculate overall industry attractiveness',
        '8. Identify key success factors in the industry',
        '9. Provide strategic recommendations based on forces',
        '10. Create forces diagram and summary'
      ],
      outputFormat: 'JSON object with five forces analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['industryRivalry', 'threatOfNewEntrants', 'supplierPower', 'buyerPower', 'threatOfSubstitutes'],
      properties: {
        industryRivalry: {
          type: 'object',
          properties: {
            rating: { type: 'string', enum: ['low', 'medium', 'high'] },
            factors: { type: 'array', items: { type: 'string' } }
          }
        },
        threatOfNewEntrants: {
          type: 'object',
          properties: {
            rating: { type: 'string', enum: ['low', 'medium', 'high'] },
            barriers: { type: 'array', items: { type: 'string' } }
          }
        },
        supplierPower: {
          type: 'object',
          properties: {
            rating: { type: 'string', enum: ['low', 'medium', 'high'] },
            factors: { type: 'array', items: { type: 'string' } }
          }
        },
        buyerPower: {
          type: 'object',
          properties: {
            rating: { type: 'string', enum: ['low', 'medium', 'high'] },
            factors: { type: 'array', items: { type: 'string' } }
          }
        },
        threatOfSubstitutes: {
          type: 'object',
          properties: {
            rating: { type: 'string', enum: ['low', 'medium', 'high'] },
            substitutes: { type: 'array', items: { type: 'string' } }
          }
        },
        overallScore: { type: 'string' },
        industryAttractiveness: { type: 'string' },
        keySuccessFactors: { type: 'array', items: { type: 'string' } },
        strategicRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'competitive-analysis', 'five-forces']
}));

export const dimensionsAnalysisTask = defineTask('dimensions-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive Dimensions Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Strategy Analyst',
      task: 'Identify and analyze key competitive dimensions in the market',
      context: {
        projectName: args.projectName,
        productDescription: args.productDescription,
        competitorProfiling: args.competitorProfiling
      },
      instructions: [
        '1. Identify key competitive dimensions (price, quality, features, service, etc.)',
        '2. Determine which dimensions matter most to customers',
        '3. Score competitors on each dimension',
        '4. Identify table-stakes vs. differentiating dimensions',
        '5. Analyze dimension trade-offs competitors make',
        '6. Identify underserved dimensions',
        '7. Determine dimension weighting by customer segment',
        '8. Create competitive comparison matrix',
        '9. Identify dimension trends over time',
        '10. Recommend dimensions to compete on'
      ],
      outputFormat: 'JSON object with dimensions analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'competitorScores', 'recommendations'],
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              importance: { type: 'string' },
              type: { type: 'string', enum: ['table-stakes', 'differentiating'] }
            }
          }
        },
        competitorScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              scores: { type: 'object' }
            }
          }
        },
        underservedDimensions: { type: 'array', items: { type: 'string' } },
        dimensionTradeoffs: { type: 'array', items: { type: 'object' } },
        segmentWeighting: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'competitive-analysis', 'dimensions']
}));

export const positioningMapTask = defineTask('positioning-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Positioning Map Creation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Positioning Strategist',
      task: 'Create competitive positioning maps showing market landscape',
      context: {
        projectName: args.projectName,
        dimensionsAnalysis: args.dimensionsAnalysis,
        competitorProfiling: args.competitorProfiling
      },
      instructions: [
        '1. Select most meaningful dimensions for positioning map axes',
        '2. Plot competitors on positioning map',
        '3. Identify clusters of competitors',
        '4. Identify positioning gaps and whitespace',
        '5. Create multiple positioning map variations',
        '6. Recommend positioning for the startup',
        '7. Identify risks and vulnerabilities of each position',
        '8. Show competitor movement over time (if data available)',
        '9. Map customer preferences to positioning space',
        '10. Create positioning map visualization'
      ],
      outputFormat: 'JSON object with positioning map'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'recommendedPosition', 'whitespace'],
      properties: {
        maps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              xAxis: { type: 'string' },
              yAxis: { type: 'string' },
              positions: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        clusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              competitors: { type: 'array', items: { type: 'string' } },
              characteristics: { type: 'string' }
            }
          }
        },
        whitespace: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'string' },
              attractiveness: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendedPosition: {
          type: 'object',
          properties: {
            position: { type: 'string' },
            rationale: { type: 'string' },
            risks: { type: 'array', items: { type: 'string' } }
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
  labels: ['entrepreneurship', 'competitive-analysis', 'positioning']
}));

export const differentiationAnalysisTask = defineTask('differentiation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Differentiation Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Differentiation Strategy Expert',
      task: 'Analyze differentiation opportunities and strategies',
      context: {
        projectName: args.projectName,
        productDescription: args.productDescription,
        competitorProfiling: args.competitorProfiling,
        positioningMap: args.positioningMap
      },
      instructions: [
        '1. Identify potential differentiation factors',
        '2. Assess sustainability of each differentiation option',
        '3. Evaluate differentiation fit with capabilities',
        '4. Analyze competitor differentiation strategies',
        '5. Identify differentiation that commands premium pricing',
        '6. Assess differentiation copy-ability risk',
        '7. Map differentiation to customer value drivers',
        '8. Create differentiation strategy recommendations',
        '9. Identify required investments for differentiation',
        '10. Define differentiation messaging and positioning'
      ],
      outputFormat: 'JSON object with differentiation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['differentiationOptions', 'recommendedStrategy', 'competitorStrategies'],
      properties: {
        differentiationOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              sustainability: { type: 'string' },
              copyRisk: { type: 'string' },
              investmentRequired: { type: 'string' }
            }
          }
        },
        competitorStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              strategy: { type: 'string' },
              effectiveness: { type: 'string' }
            }
          }
        },
        recommendedStrategy: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            secondary: { type: 'string' },
            rationale: { type: 'string' },
            implementation: { type: 'array', items: { type: 'string' } }
          }
        },
        messaging: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'competitive-analysis', 'differentiation']
}));

export const barriersAnalysisTask = defineTask('barriers-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Barriers and Moats Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Strategy Expert',
      task: 'Analyze competitive barriers and moats in the market',
      context: {
        projectName: args.projectName,
        competitorProfiling: args.competitorProfiling,
        fiveForcesAnalysis: args.fiveForcesAnalysis
      },
      instructions: [
        '1. Identify existing barriers to entry in the market',
        '2. Analyze competitor moats (network effects, switching costs, brand, data, etc.)',
        '3. Assess strength and durability of competitor moats',
        '4. Identify potential moats for the startup to build',
        '5. Analyze regulatory and compliance barriers',
        '6. Assess capital and technology barriers',
        '7. Identify distribution and partnership barriers',
        '8. Analyze talent and expertise barriers',
        '9. Create moat-building roadmap',
        '10. Identify moat vulnerabilities'
      ],
      outputFormat: 'JSON object with barriers and moats analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['existingBarriers', 'competitorMoats', 'potentialMoats'],
      properties: {
        existingBarriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              barrier: { type: 'string' },
              strength: { type: 'string' },
              overcomability: { type: 'string' }
            }
          }
        },
        competitorMoats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              moatType: { type: 'string' },
              strength: { type: 'string' },
              durability: { type: 'string' }
            }
          }
        },
        potentialMoats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moat: { type: 'string' },
              buildTime: { type: 'string' },
              investmentRequired: { type: 'string' },
              defensibility: { type: 'string' }
            }
          }
        },
        moatBuildingRoadmap: { type: 'array', items: { type: 'object' } },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'competitive-analysis', 'barriers-moats']
}));

export const whitespaceAnalysisTask = defineTask('whitespace-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Whitespace Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Opportunity Analyst',
      task: 'Identify whitespace opportunities and unserved market needs',
      context: {
        projectName: args.projectName,
        positioningMap: args.positioningMap,
        competitorProfiling: args.competitorProfiling,
        targetMarket: args.targetMarket
      },
      instructions: [
        '1. Identify unserved or underserved customer segments',
        '2. Identify unmet needs within served segments',
        '3. Analyze positioning map whitespace areas',
        '4. Assess attractiveness of each whitespace opportunity',
        '5. Identify emerging trends creating new whitespace',
        '6. Analyze Blue Ocean opportunities',
        '7. Assess risk of whitespace being filled by competitors',
        '8. Prioritize whitespace opportunities',
        '9. Map whitespace to startup capabilities',
        '10. Create whitespace opportunity recommendations'
      ],
      outputFormat: 'JSON object with whitespace analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'unservedSegments', 'recommendations'],
      properties: {
        unservedSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              size: { type: 'string' },
              attractiveness: { type: 'string' }
            }
          }
        },
        unmetNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              segment: { type: 'string' },
              intensity: { type: 'string' }
            }
          }
        },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              type: { type: 'string' },
              attractiveness: { type: 'string' },
              competitorRisk: { type: 'string' },
              capabilityFit: { type: 'string' }
            }
          }
        },
        blueOceanOpportunities: { type: 'array', items: { type: 'object' } },
        emergingTrends: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'competitive-analysis', 'whitespace']
}));

export const strategicImplicationsTask = defineTask('strategic-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Implications - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Strategy Advisor',
      task: 'Synthesize competitive analysis into strategic implications and recommendations',
      context: {
        projectName: args.projectName,
        fiveForcesAnalysis: args.fiveForcesAnalysis,
        differentiationAnalysis: args.differentiationAnalysis,
        whitespaceAnalysis: args.whitespaceAnalysis,
        barriersAnalysis: args.barriersAnalysis
      },
      instructions: [
        '1. Synthesize key strategic insights from analysis',
        '2. Identify primary competitive threats',
        '3. Identify primary competitive opportunities',
        '4. Define recommended competitive strategy',
        '5. Outline defensive strategies against threats',
        '6. Outline offensive strategies for opportunities',
        '7. Define competitive monitoring priorities',
        '8. Create action items for strategy execution',
        '9. Identify key decisions required',
        '10. Create strategic implications report'
      ],
      outputFormat: 'JSON object with strategic implications'
    },
    outputSchema: {
      type: 'object',
      required: ['keyInsights', 'threats', 'opportunities', 'recommendedStrategy'],
      properties: {
        keyInsights: { type: 'array', items: { type: 'string' } },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              severity: { type: 'string' },
              defensiveStrategy: { type: 'string' }
            }
          }
        },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              attractiveness: { type: 'string' },
              offensiveStrategy: { type: 'string' }
            }
          }
        },
        recommendedStrategy: {
          type: 'object',
          properties: {
            positioning: { type: 'string' },
            differentiation: { type: 'string' },
            competitive: { type: 'string' }
          }
        },
        monitoringPriorities: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'object' } },
        keyDecisions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'competitive-analysis', 'strategic-implications']
}));
