/**
 * @process business-strategy/porters-five-forces-analysis
 * @description Systematic industry analysis using Michael Porter's Five Forces framework to assess industry attractiveness and competitive dynamics
 * @inputs { industryName: string, companyContext: object, marketData: object, competitorInfo: array }
 * @outputs { success: boolean, fiveForces: object, industryAttractiveness: object, strategicRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    industryName = 'Industry',
    companyContext = {},
    marketData = {},
    competitorInfo = [],
    outputDir = 'five-forces-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Porter's Five Forces Analysis for ${industryName}`);

  // ============================================================================
  // PHASE 1: THREAT OF NEW ENTRANTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing threat of new entrants');
  const newEntrantsAnalysis = await ctx.task(threatOfNewEntrantsTask, {
    industryName,
    companyContext,
    marketData,
    outputDir
  });

  artifacts.push(...newEntrantsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: BARGAINING POWER OF SUPPLIERS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing bargaining power of suppliers');
  const suppliersAnalysis = await ctx.task(supplierPowerTask, {
    industryName,
    companyContext,
    marketData,
    outputDir
  });

  artifacts.push(...suppliersAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: BARGAINING POWER OF BUYERS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing bargaining power of buyers');
  const buyersAnalysis = await ctx.task(buyerPowerTask, {
    industryName,
    companyContext,
    marketData,
    outputDir
  });

  artifacts.push(...buyersAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: THREAT OF SUBSTITUTES ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing threat of substitute products');
  const substitutesAnalysis = await ctx.task(threatOfSubstitutesTask, {
    industryName,
    companyContext,
    marketData,
    outputDir
  });

  artifacts.push(...substitutesAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: COMPETITIVE RIVALRY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing competitive rivalry intensity');
  const rivalryAnalysis = await ctx.task(competitiveRivalryTask, {
    industryName,
    companyContext,
    marketData,
    competitorInfo,
    outputDir
  });

  artifacts.push(...rivalryAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: INDUSTRY ATTRACTIVENESS SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesizing industry attractiveness assessment');
  const industryAttractivenessResult = await ctx.task(industryAttractivenessTask, {
    industryName,
    newEntrantsAnalysis,
    suppliersAnalysis,
    buyersAnalysis,
    substitutesAnalysis,
    rivalryAnalysis,
    outputDir
  });

  artifacts.push(...industryAttractivenessResult.artifacts);

  // ============================================================================
  // PHASE 7: STRATEGIC RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing strategic recommendations');
  const strategicRecommendations = await ctx.task(strategicRecommendationsTask, {
    industryName,
    companyContext,
    newEntrantsAnalysis,
    suppliersAnalysis,
    buyersAnalysis,
    substitutesAnalysis,
    rivalryAnalysis,
    industryAttractivenessResult,
    outputDir
  });

  artifacts.push(...strategicRecommendations.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive Five Forces report');
  const fiveForcesReport = await ctx.task(fiveForcesReportTask, {
    industryName,
    companyContext,
    newEntrantsAnalysis,
    suppliersAnalysis,
    buyersAnalysis,
    substitutesAnalysis,
    rivalryAnalysis,
    industryAttractivenessResult,
    strategicRecommendations,
    outputDir
  });

  artifacts.push(...fiveForcesReport.artifacts);

  // Breakpoint: Review Five Forces analysis
  await ctx.breakpoint({
    question: `Five Forces analysis complete for ${industryName}. Industry attractiveness: ${industryAttractivenessResult.overallScore}/100. Review findings and recommendations?`,
    title: 'Porter\'s Five Forces Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        industryName,
        overallAttractiveness: industryAttractivenessResult.overallScore,
        forceScores: {
          newEntrants: newEntrantsAnalysis.threatLevel,
          suppliers: suppliersAnalysis.powerLevel,
          buyers: buyersAnalysis.powerLevel,
          substitutes: substitutesAnalysis.threatLevel,
          rivalry: rivalryAnalysis.intensityLevel
        },
        topRecommendations: strategicRecommendations.topRecommendations?.slice(0, 3)
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    industryName,
    fiveForces: {
      threatOfNewEntrants: {
        score: newEntrantsAnalysis.threatScore,
        level: newEntrantsAnalysis.threatLevel,
        keyFactors: newEntrantsAnalysis.keyFactors
      },
      bargainingPowerOfSuppliers: {
        score: suppliersAnalysis.powerScore,
        level: suppliersAnalysis.powerLevel,
        keyFactors: suppliersAnalysis.keyFactors
      },
      bargainingPowerOfBuyers: {
        score: buyersAnalysis.powerScore,
        level: buyersAnalysis.powerLevel,
        keyFactors: buyersAnalysis.keyFactors
      },
      threatOfSubstitutes: {
        score: substitutesAnalysis.threatScore,
        level: substitutesAnalysis.threatLevel,
        keyFactors: substitutesAnalysis.keyFactors
      },
      competitiveRivalry: {
        score: rivalryAnalysis.intensityScore,
        level: rivalryAnalysis.intensityLevel,
        keyFactors: rivalryAnalysis.keyFactors
      }
    },
    industryAttractiveness: {
      overallScore: industryAttractivenessResult.overallScore,
      rating: industryAttractivenessResult.rating,
      profitabilityOutlook: industryAttractivenessResult.profitabilityOutlook
    },
    strategicRecommendations: strategicRecommendations.recommendations,
    competitiveDynamicsReport: fiveForcesReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/porters-five-forces-analysis',
      timestamp: startTime,
      industryName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Threat of New Entrants Analysis
export const threatOfNewEntrantsTask = defineTask('threat-of-new-entrants', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze threat of new entrants',
  agent: {
    name: 'industry-analyst',
    prompt: {
      role: 'senior industry analyst and strategy consultant',
      task: 'Analyze the threat of new entrants to the industry using Porter\'s framework',
      context: args,
      instructions: [
        'Assess barriers to entry: economies of scale, capital requirements, brand loyalty',
        'Evaluate proprietary technology and patents as barriers',
        'Analyze access to distribution channels',
        'Assess government regulations and licensing requirements',
        'Evaluate switching costs for customers',
        'Analyze expected retaliation from existing competitors',
        'Consider network effects and platform dynamics if applicable',
        'Score threat level (1-10) with detailed justification',
        'Identify specific potential new entrants on the horizon',
        'Generate threat of new entrants assessment report'
      ],
      outputFormat: 'JSON with threatScore, threatLevel, keyFactors, barriersToEntry, potentialEntrants, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['threatScore', 'threatLevel', 'keyFactors', 'artifacts'],
      properties: {
        threatScore: { type: 'number', minimum: 1, maximum: 10 },
        threatLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        keyFactors: { type: 'array', items: { type: 'string' } },
        barriersToEntry: {
          type: 'object',
          properties: {
            economiesOfScale: { type: 'string' },
            capitalRequirements: { type: 'string' },
            brandLoyalty: { type: 'string' },
            proprietaryTechnology: { type: 'string' },
            accessToDistribution: { type: 'string' },
            regulatoryBarriers: { type: 'string' },
            switchingCosts: { type: 'string' }
          }
        },
        potentialEntrants: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'new-entrants']
}));

// Task 2: Bargaining Power of Suppliers Analysis
export const supplierPowerTask = defineTask('supplier-power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze bargaining power of suppliers',
  agent: {
    name: 'supply-chain-analyst',
    prompt: {
      role: 'supply chain analyst and procurement specialist',
      task: 'Analyze the bargaining power of suppliers in the industry',
      context: args,
      instructions: [
        'Assess supplier concentration relative to industry',
        'Evaluate differentiation of supplier products/services',
        'Analyze switching costs for changing suppliers',
        'Assess threat of forward integration by suppliers',
        'Evaluate importance of industry to suppliers',
        'Analyze availability of substitute inputs',
        'Assess supplier\'s control over critical inputs',
        'Score supplier power level (1-10) with justification',
        'Identify key suppliers and their leverage',
        'Generate supplier power assessment report'
      ],
      outputFormat: 'JSON with powerScore, powerLevel, keyFactors, supplierAnalysis, keySuppliers, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['powerScore', 'powerLevel', 'keyFactors', 'artifacts'],
      properties: {
        powerScore: { type: 'number', minimum: 1, maximum: 10 },
        powerLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        keyFactors: { type: 'array', items: { type: 'string' } },
        supplierAnalysis: {
          type: 'object',
          properties: {
            concentration: { type: 'string' },
            differentiation: { type: 'string' },
            switchingCosts: { type: 'string' },
            forwardIntegrationThreat: { type: 'string' },
            industryImportance: { type: 'string' },
            substituteInputs: { type: 'string' }
          }
        },
        keySuppliers: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'supplier-power']
}));

// Task 3: Bargaining Power of Buyers Analysis
export const buyerPowerTask = defineTask('buyer-power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze bargaining power of buyers',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'market analyst and customer insights specialist',
      task: 'Analyze the bargaining power of buyers in the industry',
      context: args,
      instructions: [
        'Assess buyer concentration and volume',
        'Evaluate product differentiation and standardization',
        'Analyze buyer switching costs',
        'Assess price sensitivity of buyers',
        'Evaluate threat of backward integration',
        'Analyze buyer information and transparency',
        'Assess importance of product to buyer\'s cost structure',
        'Score buyer power level (1-10) with justification',
        'Segment buyers by power level (key accounts vs. mass market)',
        'Generate buyer power assessment report'
      ],
      outputFormat: 'JSON with powerScore, powerLevel, keyFactors, buyerAnalysis, buyerSegments, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['powerScore', 'powerLevel', 'keyFactors', 'artifacts'],
      properties: {
        powerScore: { type: 'number', minimum: 1, maximum: 10 },
        powerLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        keyFactors: { type: 'array', items: { type: 'string' } },
        buyerAnalysis: {
          type: 'object',
          properties: {
            concentration: { type: 'string' },
            productDifferentiation: { type: 'string' },
            switchingCosts: { type: 'string' },
            priceSensitivity: { type: 'string' },
            backwardIntegrationThreat: { type: 'string' },
            informationTransparency: { type: 'string' }
          }
        },
        buyerSegments: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'buyer-power']
}));

// Task 4: Threat of Substitutes Analysis
export const threatOfSubstitutesTask = defineTask('threat-of-substitutes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze threat of substitute products',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence analyst',
      task: 'Analyze the threat of substitute products or services',
      context: args,
      instructions: [
        'Identify direct and indirect substitutes',
        'Analyze price-performance trade-off of substitutes',
        'Evaluate switching costs to substitutes',
        'Assess buyer propensity to switch',
        'Analyze emerging technologies creating new substitutes',
        'Evaluate substitute availability and accessibility',
        'Assess perceived level of product differentiation',
        'Score threat level (1-10) with justification',
        'Map substitutes by category and competitive threat',
        'Generate threat of substitutes assessment report'
      ],
      outputFormat: 'JSON with threatScore, threatLevel, keyFactors, substituteAnalysis, keySubstitutes, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['threatScore', 'threatLevel', 'keyFactors', 'artifacts'],
      properties: {
        threatScore: { type: 'number', minimum: 1, maximum: 10 },
        threatLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        keyFactors: { type: 'array', items: { type: 'string' } },
        substituteAnalysis: {
          type: 'object',
          properties: {
            pricePerformanceRatio: { type: 'string' },
            switchingCosts: { type: 'string' },
            buyerPropensity: { type: 'string' },
            emergingTechnologies: { type: 'string' },
            availability: { type: 'string' }
          }
        },
        keySubstitutes: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'substitutes']
}));

// Task 5: Competitive Rivalry Analysis
export const competitiveRivalryTask = defineTask('competitive-rivalry-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitive rivalry intensity',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'senior strategy analyst and competitive intelligence expert',
      task: 'Analyze the intensity of competitive rivalry within the industry',
      context: args,
      instructions: [
        'Assess number and balance of competitors',
        'Analyze industry growth rate and capacity',
        'Evaluate product differentiation among rivals',
        'Assess fixed costs and exit barriers',
        'Analyze competitive strategies (price vs. non-price)',
        'Evaluate diversity of competitors (strategies, origins, goals)',
        'Assess level of strategic stakes (commitment to industry)',
        'Score rivalry intensity (1-10) with justification',
        'Profile key competitors with strategies and strengths',
        'Generate competitive rivalry assessment report'
      ],
      outputFormat: 'JSON with intensityScore, intensityLevel, keyFactors, rivalryAnalysis, competitorProfiles, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intensityScore', 'intensityLevel', 'keyFactors', 'artifacts'],
      properties: {
        intensityScore: { type: 'number', minimum: 1, maximum: 10 },
        intensityLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        keyFactors: { type: 'array', items: { type: 'string' } },
        rivalryAnalysis: {
          type: 'object',
          properties: {
            competitorCount: { type: 'string' },
            industryGrowth: { type: 'string' },
            differentiation: { type: 'string' },
            fixedCosts: { type: 'string' },
            exitBarriers: { type: 'string' },
            competitiveStrategy: { type: 'string' }
          }
        },
        competitorProfiles: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'competitive-rivalry']
}));

// Task 6: Industry Attractiveness Synthesis
export const industryAttractivenessTask = defineTask('industry-attractiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize industry attractiveness assessment',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'senior strategy consultant',
      task: 'Synthesize Five Forces analysis into overall industry attractiveness assessment',
      context: args,
      instructions: [
        'Weight each of the five forces based on industry context',
        'Calculate overall industry attractiveness score (0-100)',
        'Assess profitability implications of each force',
        'Evaluate industry lifecycle stage',
        'Identify key success factors for competing in this industry',
        'Assess overall profit potential and sustainability',
        'Compare to industry benchmarks if available',
        'Generate industry attractiveness scorecard',
        'Provide investment attractiveness rating',
        'Generate industry attractiveness synthesis report'
      ],
      outputFormat: 'JSON with overallScore, rating, forceWeights, profitabilityOutlook, keySuccessFactors, industryLifecycle, investmentRating, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'rating', 'profitabilityOutlook', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        rating: { type: 'string', enum: ['highly-attractive', 'attractive', 'moderate', 'unattractive', 'highly-unattractive'] },
        forceWeights: {
          type: 'object',
          properties: {
            newEntrants: { type: 'number' },
            supplierPower: { type: 'number' },
            buyerPower: { type: 'number' },
            substitutes: { type: 'number' },
            rivalry: { type: 'number' }
          }
        },
        profitabilityOutlook: { type: 'string' },
        keySuccessFactors: { type: 'array', items: { type: 'string' } },
        industryLifecycle: { type: 'string', enum: ['emerging', 'growth', 'mature', 'declining'] },
        investmentRating: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'industry-attractiveness']
}));

// Task 7: Strategic Recommendations
export const strategicRecommendationsTask = defineTask('strategic-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategic positioning recommendations',
  agent: {
    name: 'strategy-advisor',
    prompt: {
      role: 'chief strategy advisor',
      task: 'Develop strategic recommendations based on Five Forces analysis',
      context: args,
      instructions: [
        'Identify opportunities to strengthen position against each force',
        'Recommend strategies to mitigate threats from powerful forces',
        'Identify potential for industry structure transformation',
        'Recommend competitive positioning strategy (cost leadership, differentiation, focus)',
        'Suggest value chain positioning strategies',
        'Identify potential strategic moves (vertical integration, alliances, etc.)',
        'Prioritize recommendations by impact and feasibility',
        'Develop action roadmap with timeline',
        'Identify early warning indicators to monitor',
        'Generate strategic recommendations report'
      ],
      outputFormat: 'JSON with recommendations, topRecommendations, forceSpecificStrategies, positioningStrategy, actionRoadmap, monitoringIndicators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'topRecommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        topRecommendations: { type: 'array', items: { type: 'string' } },
        forceSpecificStrategies: {
          type: 'object',
          properties: {
            newEntrants: { type: 'array', items: { type: 'string' } },
            suppliers: { type: 'array', items: { type: 'string' } },
            buyers: { type: 'array', items: { type: 'string' } },
            substitutes: { type: 'array', items: { type: 'string' } },
            rivalry: { type: 'array', items: { type: 'string' } }
          }
        },
        positioningStrategy: { type: 'string' },
        actionRoadmap: { type: 'array', items: { type: 'object' } },
        monitoringIndicators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'strategic-recommendations']
}));

// Task 8: Comprehensive Report Generation
export const fiveForcesReportTask = defineTask('five-forces-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive Five Forces report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'senior strategy consultant and report author',
      task: 'Generate comprehensive Porter\'s Five Forces analysis report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Include industry overview and context',
        'Present each of the five forces with analysis and visualizations',
        'Include Five Forces diagram/matrix',
        'Present industry attractiveness scorecard',
        'Document competitive dynamics analysis',
        'Include strategic recommendations section',
        'Add action roadmap with priorities',
        'Include methodology and data sources',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
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
  labels: ['agent', 'five-forces', 'reporting']
}));
