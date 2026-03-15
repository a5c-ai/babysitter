/**
 * @process business-strategy/porters-five-forces
 * @description Comprehensive analysis of industry competitive dynamics through threat of new entrants, supplier power, buyer power, substitutes, and competitive rivalry
 * @inputs { industry: string, organizationContext: object, marketScope: string, outputDir: string }
 * @outputs { success: boolean, fiveForces: object, industryAttractiveness: number, strategicImplications: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    industry = '',
    organizationContext = {},
    marketScope = 'national',
    outputDir = 'five-forces-output',
    includeScoring = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Porter\'s Five Forces Analysis');

  // ============================================================================
  // PHASE 1: THREAT OF NEW ENTRANTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing threat of new entrants');
  const newEntrantsAnalysis = await ctx.task(newEntrantsAnalysisTask, {
    industry,
    organizationContext,
    marketScope,
    outputDir
  });

  artifacts.push(...newEntrantsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: BARGAINING POWER OF SUPPLIERS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing bargaining power of suppliers');
  const supplierPowerAnalysis = await ctx.task(supplierPowerAnalysisTask, {
    industry,
    organizationContext,
    outputDir
  });

  artifacts.push(...supplierPowerAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: BARGAINING POWER OF BUYERS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing bargaining power of buyers');
  const buyerPowerAnalysis = await ctx.task(buyerPowerAnalysisTask, {
    industry,
    organizationContext,
    outputDir
  });

  artifacts.push(...buyerPowerAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: THREAT OF SUBSTITUTES
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing threat of substitutes');
  const substitutesAnalysis = await ctx.task(substitutesAnalysisTask, {
    industry,
    organizationContext,
    outputDir
  });

  artifacts.push(...substitutesAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: COMPETITIVE RIVALRY
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing competitive rivalry');
  const rivalryAnalysis = await ctx.task(rivalryAnalysisTask, {
    industry,
    organizationContext,
    outputDir
  });

  artifacts.push(...rivalryAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: INDUSTRY ATTRACTIVENESS SCORING
  // ============================================================================

  ctx.log('info', 'Phase 6: Calculating industry attractiveness');
  const attractivenessScore = await ctx.task(industryAttractivenessTask, {
    newEntrantsAnalysis,
    supplierPowerAnalysis,
    buyerPowerAnalysis,
    substitutesAnalysis,
    rivalryAnalysis,
    includeScoring,
    outputDir
  });

  artifacts.push(...attractivenessScore.artifacts);

  // Breakpoint: Review five forces analysis
  await ctx.breakpoint({
    question: `Five Forces analysis complete. Industry attractiveness score: ${attractivenessScore.overallScore}/100. Review detailed findings?`,
    title: 'Five Forces Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        newEntrantsForce: newEntrantsAnalysis.forceStrength,
        supplierPowerForce: supplierPowerAnalysis.forceStrength,
        buyerPowerForce: buyerPowerAnalysis.forceStrength,
        substitutesForce: substitutesAnalysis.forceStrength,
        rivalryForce: rivalryAnalysis.forceStrength,
        overallAttractiveness: attractivenessScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 7: STRATEGIC IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Deriving strategic implications');
  const strategicImplications = await ctx.task(fiveForcesImplicationsTask, {
    fiveForces: {
      newEntrants: newEntrantsAnalysis,
      supplierPower: supplierPowerAnalysis,
      buyerPower: buyerPowerAnalysis,
      substitutes: substitutesAnalysis,
      rivalry: rivalryAnalysis
    },
    attractivenessScore,
    organizationContext,
    outputDir
  });

  artifacts.push(...strategicImplications.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const fiveForcesReport = await ctx.task(fiveForcesReportTask, {
    industry,
    newEntrantsAnalysis,
    supplierPowerAnalysis,
    buyerPowerAnalysis,
    substitutesAnalysis,
    rivalryAnalysis,
    attractivenessScore,
    strategicImplications,
    outputDir
  });

  artifacts.push(...fiveForcesReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    fiveForces: {
      newEntrants: {
        strength: newEntrantsAnalysis.forceStrength,
        score: newEntrantsAnalysis.score,
        keyFactors: newEntrantsAnalysis.keyFactors
      },
      supplierPower: {
        strength: supplierPowerAnalysis.forceStrength,
        score: supplierPowerAnalysis.score,
        keyFactors: supplierPowerAnalysis.keyFactors
      },
      buyerPower: {
        strength: buyerPowerAnalysis.forceStrength,
        score: buyerPowerAnalysis.score,
        keyFactors: buyerPowerAnalysis.keyFactors
      },
      substitutes: {
        strength: substitutesAnalysis.forceStrength,
        score: substitutesAnalysis.score,
        keyFactors: substitutesAnalysis.keyFactors
      },
      rivalry: {
        strength: rivalryAnalysis.forceStrength,
        score: rivalryAnalysis.score,
        keyFactors: rivalryAnalysis.keyFactors
      }
    },
    industryAttractiveness: attractivenessScore.overallScore,
    strategicImplications: strategicImplications.implications,
    recommendations: strategicImplications.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/porters-five-forces',
      timestamp: startTime,
      industry,
      marketScope
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Threat of New Entrants Analysis
export const newEntrantsAnalysisTask = defineTask('new-entrants-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze threat of new entrants',
  agent: {
    name: 'industry-analyst',
    prompt: {
      role: 'senior industry analyst and competitive strategy expert',
      task: 'Analyze barriers to entry and threat of new entrants in the industry',
      context: args,
      instructions: [
        'Evaluate entry barriers across dimensions:',
        '  - Economies of scale requirements',
        '  - Capital requirements and startup costs',
        '  - Product differentiation and brand loyalty',
        '  - Switching costs for customers',
        '  - Access to distribution channels',
        '  - Cost advantages independent of scale',
        '  - Government policies and regulations',
        '  - Expected retaliation from incumbents',
        'Assess current threat level (high/medium/low)',
        'Identify potential new entrants',
        'Analyze recent entry attempts and outcomes',
        'Evaluate technology disruption potential',
        'Score force strength (1-10)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with forceStrength (string), score (number 1-10), keyFactors (array), barriers (array), potentialEntrants (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forceStrength', 'score', 'keyFactors', 'artifacts'],
      properties: {
        forceStrength: { type: 'string', enum: ['very-high', 'high', 'moderate', 'low', 'very-low'] },
        score: { type: 'number', minimum: 1, maximum: 10 },
        keyFactors: { type: 'array', items: { type: 'string' } },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              barrier: { type: 'string' },
              strength: { type: 'string' },
              trend: { type: 'string' }
            }
          }
        },
        potentialEntrants: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'new-entrants', 'barriers']
}));

// Task 2: Supplier Power Analysis
export const supplierPowerAnalysisTask = defineTask('supplier-power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze bargaining power of suppliers',
  agent: {
    name: 'supply-chain-analyst',
    prompt: {
      role: 'supply chain analyst and procurement strategist',
      task: 'Analyze the bargaining power of suppliers in the industry',
      context: args,
      instructions: [
        'Evaluate supplier power factors:',
        '  - Supplier concentration vs industry concentration',
        '  - Importance of volume to suppliers',
        '  - Differentiation of supplier products',
        '  - Switching costs for buyers',
        '  - Availability of substitute inputs',
        '  - Threat of forward integration',
        '  - Importance of industry to supplier profitability',
        'Identify key supplier categories',
        'Assess supplier power by category',
        'Analyze supply chain vulnerabilities',
        'Evaluate trends in supplier landscape',
        'Score force strength (1-10)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with forceStrength (string), score (number 1-10), keyFactors (array), supplierCategories (array), vulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forceStrength', 'score', 'keyFactors', 'artifacts'],
      properties: {
        forceStrength: { type: 'string', enum: ['very-high', 'high', 'moderate', 'low', 'very-low'] },
        score: { type: 'number', minimum: 1, maximum: 10 },
        keyFactors: { type: 'array', items: { type: 'string' } },
        supplierCategories: { type: 'array' },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'supplier-power', 'supply-chain']
}));

// Task 3: Buyer Power Analysis
export const buyerPowerAnalysisTask = defineTask('buyer-power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze bargaining power of buyers',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'market analyst and customer strategy expert',
      task: 'Analyze the bargaining power of buyers in the industry',
      context: args,
      instructions: [
        'Evaluate buyer power factors:',
        '  - Buyer concentration and purchase volumes',
        '  - Product standardization and differentiation',
        '  - Buyer switching costs',
        '  - Buyer information and transparency',
        '  - Threat of backward integration',
        '  - Price sensitivity and margins',
        '  - Importance of quality to buyer',
        'Segment buyers by power level',
        'Analyze buyer behavior trends',
        'Assess channel power dynamics',
        'Evaluate digital disruption impact on buyer power',
        'Score force strength (1-10)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with forceStrength (string), score (number 1-10), keyFactors (array), buyerSegments (array), trends (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forceStrength', 'score', 'keyFactors', 'artifacts'],
      properties: {
        forceStrength: { type: 'string', enum: ['very-high', 'high', 'moderate', 'low', 'very-low'] },
        score: { type: 'number', minimum: 1, maximum: 10 },
        keyFactors: { type: 'array', items: { type: 'string' } },
        buyerSegments: { type: 'array' },
        trends: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'buyer-power', 'customer-analysis']
}));

// Task 4: Threat of Substitutes Analysis
export const substitutesAnalysisTask = defineTask('substitutes-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze threat of substitutes',
  agent: {
    name: 'innovation-analyst',
    prompt: {
      role: 'innovation analyst and market disruption expert',
      task: 'Analyze the threat of substitute products or services',
      context: args,
      instructions: [
        'Evaluate substitute threat factors:',
        '  - Relative price-performance of substitutes',
        '  - Buyer switching costs to substitutes',
        '  - Buyer propensity to substitute',
        '  - Substitute availability and visibility',
        'Identify direct and indirect substitutes',
        'Analyze emerging substitute technologies',
        'Assess disruption potential',
        'Evaluate substitute adoption trends',
        'Consider cross-industry substitution',
        'Score force strength (1-10)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with forceStrength (string), score (number 1-10), keyFactors (array), substitutes (array), emergingThreats (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forceStrength', 'score', 'keyFactors', 'artifacts'],
      properties: {
        forceStrength: { type: 'string', enum: ['very-high', 'high', 'moderate', 'low', 'very-low'] },
        score: { type: 'number', minimum: 1, maximum: 10 },
        keyFactors: { type: 'array', items: { type: 'string' } },
        substitutes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              substitute: { type: 'string' },
              threatLevel: { type: 'string' },
              pricePerformance: { type: 'string' }
            }
          }
        },
        emergingThreats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'substitutes', 'disruption']
}));

// Task 5: Competitive Rivalry Analysis
export const rivalryAnalysisTask = defineTask('rivalry-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitive rivalry',
  agent: {
    name: 'competitive-intelligence-analyst',
    prompt: {
      role: 'competitive intelligence analyst and strategy expert',
      task: 'Analyze intensity of competitive rivalry in the industry',
      context: args,
      instructions: [
        'Evaluate rivalry intensity factors:',
        '  - Number and balance of competitors',
        '  - Industry growth rate',
        '  - Fixed costs and overcapacity',
        '  - Product differentiation levels',
        '  - Switching costs',
        '  - Strategic stakes and diversity',
        '  - Exit barriers',
        'Map key competitors and positioning',
        'Analyze competitive dynamics and behaviors',
        'Identify competitive weapons used',
        'Assess price competition intensity',
        'Evaluate innovation competition',
        'Score force strength (1-10)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with forceStrength (string), score (number 1-10), keyFactors (array), competitors (array), competitiveDynamics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forceStrength', 'score', 'keyFactors', 'artifacts'],
      properties: {
        forceStrength: { type: 'string', enum: ['very-high', 'high', 'moderate', 'low', 'very-low'] },
        score: { type: 'number', minimum: 1, maximum: 10 },
        keyFactors: { type: 'array', items: { type: 'string' } },
        competitors: { type: 'array' },
        competitiveDynamics: {
          type: 'object',
          properties: {
            priceCompetition: { type: 'string' },
            innovationIntensity: { type: 'string' },
            marketingIntensity: { type: 'string' }
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
  labels: ['agent', 'five-forces', 'rivalry', 'competition']
}));

// Task 6: Industry Attractiveness Scoring
export const industryAttractivenessTask = defineTask('industry-attractiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate industry attractiveness score',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'senior strategy consultant',
      task: 'Calculate overall industry attractiveness based on five forces analysis',
      context: args,
      instructions: [
        'Calculate weighted industry attractiveness score',
        'Default weights: 20% each force (adjust if needed)',
        'Convert force scores to attractiveness:',
        '  - High force = Low attractiveness',
        '  - Low force = High attractiveness',
        'Calculate overall score (0-100)',
        'Determine industry lifecycle stage',
        'Assess profit potential',
        'Identify critical forces to address',
        'Save scoring to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), forceScores (object), profitPotential (string), criticalForces (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'forceScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        forceScores: {
          type: 'object',
          properties: {
            newEntrants: { type: 'number' },
            supplierPower: { type: 'number' },
            buyerPower: { type: 'number' },
            substitutes: { type: 'number' },
            rivalry: { type: 'number' }
          }
        },
        profitPotential: { type: 'string', enum: ['very-high', 'high', 'moderate', 'low', 'very-low'] },
        lifecycleStage: { type: 'string' },
        criticalForces: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'attractiveness', 'scoring']
}));

// Task 7: Strategic Implications
export const fiveForcesImplicationsTask = defineTask('five-forces-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive strategic implications',
  agent: {
    name: 'chief-strategy-officer',
    prompt: {
      role: 'chief strategy officer',
      task: 'Derive strategic implications and recommendations from five forces analysis',
      context: args,
      instructions: [
        'Synthesize key findings from all five forces',
        'Identify strategic position implications',
        'Recommend positioning strategies:',
        '  - Defensive positioning against strong forces',
        '  - Offensive moves to exploit weak forces',
        '  - Strategies to reshape industry structure',
        'Prioritize strategic initiatives',
        'Identify resource allocation implications',
        'Define monitoring and early warning indicators',
        'Save implications to output directory'
      ],
      outputFormat: 'JSON with implications (array), recommendations (array), positioningStrategy (string), monitoringIndicators (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'recommendations', 'artifacts'],
      properties: {
        implications: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              targetForce: { type: 'string' },
              priority: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        positioningStrategy: { type: 'string' },
        monitoringIndicators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-forces', 'implications', 'strategy']
}));

// Task 8: Five Forces Report Generation
export const fiveForcesReportTask = defineTask('five-forces-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive five forces report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and technical writer',
      task: 'Generate comprehensive Porter\'s Five Forces analysis report',
      context: args,
      instructions: [
        'Create executive summary',
        'Include methodology explanation',
        'Document each force analysis in detail',
        'Present five forces diagram/visualization',
        'Include industry attractiveness assessment',
        'Present strategic implications and recommendations',
        'Add competitive positioning guidance',
        'Include appendices with detailed data',
        'Format as professional strategy document',
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
  labels: ['agent', 'five-forces', 'reporting', 'documentation']
}));
