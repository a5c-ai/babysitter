/**
 * @process business-strategy/ansoff-matrix-growth-strategy
 * @description Product-market growth strategy development using Ansoff Matrix framework
 * @inputs { organizationName: string, currentProducts: array, currentMarkets: array, capabilities: object, riskAppetite: string }
 * @outputs { success: boolean, ansoffAnalysis: object, growthOptions: array, riskAssessment: object, growthRoadmap: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    currentProducts = [],
    currentMarkets = [],
    capabilities = {},
    riskAppetite = 'moderate',
    outputDir = 'ansoff-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Ansoff Matrix Growth Strategy for ${organizationName}`);

  // ============================================================================
  // PHASE 1: MARKET PENETRATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing market penetration opportunities');
  const marketPenetration = await ctx.task(marketPenetrationTask, {
    organizationName,
    currentProducts,
    currentMarkets,
    capabilities,
    outputDir
  });

  artifacts.push(...marketPenetration.artifacts);

  // ============================================================================
  // PHASE 2: PRODUCT DEVELOPMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing product development opportunities');
  const productDevelopment = await ctx.task(productDevelopmentTask, {
    organizationName,
    currentProducts,
    currentMarkets,
    capabilities,
    outputDir
  });

  artifacts.push(...productDevelopment.artifacts);

  // ============================================================================
  // PHASE 3: MARKET DEVELOPMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing market development opportunities');
  const marketDevelopment = await ctx.task(marketDevelopmentTask, {
    organizationName,
    currentProducts,
    currentMarkets,
    capabilities,
    outputDir
  });

  artifacts.push(...marketDevelopment.artifacts);

  // ============================================================================
  // PHASE 4: DIVERSIFICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing diversification opportunities');
  const diversification = await ctx.task(diversificationTask, {
    organizationName,
    currentProducts,
    currentMarkets,
    capabilities,
    outputDir
  });

  artifacts.push(...diversification.artifacts);

  // ============================================================================
  // PHASE 5: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing risks for each growth strategy');
  const riskAssessment = await ctx.task(growthRiskAssessmentTask, {
    organizationName,
    marketPenetration,
    productDevelopment,
    marketDevelopment,
    diversification,
    riskAppetite,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 6: GROWTH OPTIONS PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prioritizing growth options');
  const growthPrioritization = await ctx.task(growthPrioritizationTask, {
    organizationName,
    marketPenetration,
    productDevelopment,
    marketDevelopment,
    diversification,
    riskAssessment,
    capabilities,
    riskAppetite,
    outputDir
  });

  artifacts.push(...growthPrioritization.artifacts);

  // ============================================================================
  // PHASE 7: GROWTH INITIATIVE ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating growth initiative roadmap');
  const growthRoadmap = await ctx.task(growthRoadmapTask, {
    organizationName,
    growthPrioritization,
    capabilities,
    outputDir
  });

  artifacts.push(...growthRoadmap.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive Ansoff Matrix report');
  const ansoffReport = await ctx.task(ansoffReportTask, {
    organizationName,
    marketPenetration,
    productDevelopment,
    marketDevelopment,
    diversification,
    riskAssessment,
    growthPrioritization,
    growthRoadmap,
    outputDir
  });

  artifacts.push(...ansoffReport.artifacts);

  // Breakpoint: Review Ansoff Matrix analysis
  await ctx.breakpoint({
    question: `Ansoff Matrix growth strategy complete for ${organizationName}. ${growthPrioritization.prioritizedOptions?.length || 0} growth options identified. Review and approve?`,
    title: 'Ansoff Matrix Growth Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        quadrantOpportunities: {
          marketPenetration: marketPenetration.opportunities?.length || 0,
          productDevelopment: productDevelopment.opportunities?.length || 0,
          marketDevelopment: marketDevelopment.opportunities?.length || 0,
          diversification: diversification.opportunities?.length || 0
        },
        topGrowthOptions: growthPrioritization.topOptions?.slice(0, 3)
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    ansoffAnalysis: {
      marketPenetration: marketPenetration.opportunities,
      productDevelopment: productDevelopment.opportunities,
      marketDevelopment: marketDevelopment.opportunities,
      diversification: diversification.opportunities
    },
    growthOptions: growthPrioritization.prioritizedOptions,
    riskAssessment: riskAssessment.assessment,
    growthRoadmap: growthRoadmap.roadmap,
    reportPath: ansoffReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/ansoff-matrix-growth-strategy',
      timestamp: startTime,
      organizationName,
      riskAppetite,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Market Penetration Analysis
export const marketPenetrationTask = defineTask('market-penetration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market penetration opportunities',
  agent: {
    name: 'penetration-analyst',
    prompt: {
      role: 'market growth strategist',
      task: 'Analyze opportunities for market penetration (existing products, existing markets)',
      context: args,
      instructions: [
        'Assess current market share and headroom for growth',
        'Identify strategies to increase usage among existing customers',
        'Analyze opportunities to win competitors\' customers',
        'Evaluate pricing strategies for market share gains',
        'Assess promotional and marketing intensification options',
        'Identify distribution expansion opportunities',
        'Evaluate customer loyalty and retention programs',
        'Estimate growth potential and required investment',
        'Generate market penetration analysis report'
      ],
      outputFormat: 'JSON with opportunities (array with strategy, potential, investment, timeline), currentShare, growthPotential, strategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        currentShare: { type: 'string' },
        growthPotential: { type: 'string' },
        strategies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ansoff', 'market-penetration']
}));

// Task 2: Product Development Analysis
export const productDevelopmentTask = defineTask('product-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze product development opportunities',
  agent: {
    name: 'product-development-analyst',
    prompt: {
      role: 'product strategy specialist',
      task: 'Analyze opportunities for product development (new products, existing markets)',
      context: args,
      instructions: [
        'Identify unmet needs in existing customer base',
        'Analyze product line extension opportunities',
        'Evaluate new product development options',
        'Assess product enhancement and upgrade opportunities',
        'Identify adjacent product categories',
        'Evaluate technology-enabled product innovations',
        'Assess capability requirements for new products',
        'Estimate development investment and timelines',
        'Generate product development analysis report'
      ],
      outputFormat: 'JSON with opportunities (array), unmetNeeds, productIdeas, capabilityGaps, investmentRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        unmetNeeds: { type: 'array', items: { type: 'string' } },
        productIdeas: { type: 'array', items: { type: 'object' } },
        capabilityGaps: { type: 'array', items: { type: 'string' } },
        investmentRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ansoff', 'product-development']
}));

// Task 3: Market Development Analysis
export const marketDevelopmentTask = defineTask('market-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market development opportunities',
  agent: {
    name: 'market-development-analyst',
    prompt: {
      role: 'market expansion strategist',
      task: 'Analyze opportunities for market development (existing products, new markets)',
      context: args,
      instructions: [
        'Identify new geographic markets for expansion',
        'Analyze new customer segments to target',
        'Evaluate new distribution channels',
        'Assess international expansion opportunities',
        'Identify new use cases for existing products',
        'Evaluate market entry strategies and modes',
        'Assess localization and adaptation requirements',
        'Estimate market development investment and returns',
        'Generate market development analysis report'
      ],
      outputFormat: 'JSON with opportunities (array), newMarkets, newSegments, entryStrategies, localizationNeeds, investmentRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        newMarkets: { type: 'array', items: { type: 'object' } },
        newSegments: { type: 'array', items: { type: 'object' } },
        entryStrategies: { type: 'array', items: { type: 'object' } },
        localizationNeeds: { type: 'array', items: { type: 'string' } },
        investmentRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ansoff', 'market-development']
}));

// Task 4: Diversification Analysis
export const diversificationTask = defineTask('diversification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze diversification opportunities',
  agent: {
    name: 'diversification-analyst',
    prompt: {
      role: 'diversification strategy specialist',
      task: 'Analyze opportunities for diversification (new products, new markets)',
      context: args,
      instructions: [
        'Identify related diversification opportunities (synergies)',
        'Identify unrelated diversification opportunities',
        'Evaluate horizontal diversification options',
        'Assess vertical integration opportunities',
        'Analyze M&A targets for diversification',
        'Evaluate joint venture and partnership options',
        'Assess synergy potential and parenting advantages',
        'Estimate diversification risks and returns',
        'Generate diversification analysis report'
      ],
      outputFormat: 'JSON with opportunities (array), relatedDiversification, unrelatedDiversification, maTargets, partnerships, synergyPotential, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        relatedDiversification: { type: 'array', items: { type: 'object' } },
        unrelatedDiversification: { type: 'array', items: { type: 'object' } },
        maTargets: { type: 'array', items: { type: 'object' } },
        partnerships: { type: 'array', items: { type: 'object' } },
        synergyPotential: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ansoff', 'diversification']
}));

// Task 5: Growth Risk Assessment
export const growthRiskAssessmentTask = defineTask('growth-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess risks for each growth strategy',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'strategic risk analyst',
      task: 'Assess risk levels for each Ansoff quadrant strategy',
      context: args,
      instructions: [
        'Assess market penetration risks (lowest risk baseline)',
        'Assess product development risks (technology, market acceptance)',
        'Assess market development risks (unknown markets, entry barriers)',
        'Assess diversification risks (highest risk - new products and markets)',
        'Create risk-return analysis for each quadrant',
        'Align assessment with organizational risk appetite',
        'Identify risk mitigation strategies',
        'Create risk heat map across growth options',
        'Generate risk assessment report'
      ],
      outputFormat: 'JSON with assessment (quadrant risks), riskReturnAnalysis, riskHeatMap, mitigationStrategies, riskAppetiteAlignment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            marketPenetration: { type: 'object' },
            productDevelopment: { type: 'object' },
            marketDevelopment: { type: 'object' },
            diversification: { type: 'object' }
          }
        },
        riskReturnAnalysis: { type: 'object' },
        riskHeatMap: { type: 'object' },
        mitigationStrategies: { type: 'array', items: { type: 'object' } },
        riskAppetiteAlignment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ansoff', 'risk-assessment']
}));

// Task 6: Growth Options Prioritization
export const growthPrioritizationTask = defineTask('growth-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize growth options',
  agent: {
    name: 'prioritization-strategist',
    prompt: {
      role: 'growth strategy prioritization specialist',
      task: 'Prioritize growth options based on strategic fit and risk',
      context: args,
      instructions: [
        'Consolidate all growth options from four quadrants',
        'Score options on growth potential (1-10)',
        'Score options on strategic fit (1-10)',
        'Score options on risk level (1-10, inverted)',
        'Score options on resource requirements (1-10, inverted)',
        'Calculate composite priority scores',
        'Rank growth options by priority',
        'Identify balanced portfolio of growth initiatives',
        'Generate prioritization analysis report'
      ],
      outputFormat: 'JSON with prioritizedOptions, topOptions, portfolioBalance, scoringMatrix, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedOptions', 'topOptions', 'artifacts'],
      properties: {
        prioritizedOptions: { type: 'array', items: { type: 'object' } },
        topOptions: { type: 'array', items: { type: 'string' } },
        portfolioBalance: { type: 'object' },
        scoringMatrix: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ansoff', 'prioritization']
}));

// Task 7: Growth Initiative Roadmap
export const growthRoadmapTask = defineTask('growth-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create growth initiative roadmap',
  agent: {
    name: 'roadmap-planner',
    prompt: {
      role: 'growth roadmap specialist',
      task: 'Create phased roadmap for growth initiatives',
      context: args,
      instructions: [
        'Sequence growth initiatives based on priorities',
        'Define short-term initiatives (0-1 year)',
        'Define medium-term initiatives (1-3 years)',
        'Define long-term initiatives (3-5 years)',
        'Identify dependencies between initiatives',
        'Allocate resources across initiatives',
        'Define milestones and success metrics',
        'Create governance structure for execution',
        'Generate growth roadmap document'
      ],
      outputFormat: 'JSON with roadmap, phases, milestones, resourceAllocation, dependencies, governance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'phases', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        phases: {
          type: 'object',
          properties: {
            shortTerm: { type: 'array', items: { type: 'object' } },
            mediumTerm: { type: 'array', items: { type: 'object' } },
            longTerm: { type: 'array', items: { type: 'object' } }
          }
        },
        milestones: { type: 'array', items: { type: 'object' } },
        resourceAllocation: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        governance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ansoff', 'roadmap']
}));

// Task 8: Ansoff Report Generation
export const ansoffReportTask = defineTask('ansoff-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive Ansoff Matrix report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and report author',
      task: 'Generate comprehensive Ansoff Matrix growth strategy report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present Ansoff Matrix visualization',
        'Document each quadrant analysis in detail',
        'Include risk-return analysis',
        'Present prioritized growth options',
        'Document growth roadmap',
        'Include visualizations (matrix, risk heat map, roadmap)',
        'Add implementation recommendations',
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
  labels: ['agent', 'ansoff', 'reporting']
}));
