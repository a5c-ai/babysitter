/**
 * @process specializations/domains/business/entrepreneurship/market-sizing-analysis
 * @description Market Sizing (TAM/SAM/SOM) Analysis Process - Rigorous market sizing analysis using both top-down and bottom-up approaches to quantify market opportunity.
 * @inputs { projectName: string, productDescription: string, targetMarket: string, geographicScope: string, industryReports?: array, competitorData?: array }
 * @outputs { success: boolean, marketSizingModel: object, methodology: object, investorReadyAnalysis: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/market-sizing-analysis', {
 *   projectName: 'AI Writing Assistant',
 *   productDescription: 'AI-powered content writing tool for marketers',
 *   targetMarket: 'Marketing professionals in SaaS companies',
 *   geographicScope: 'North America'
 * });
 *
 * @references
 * - Strategyzer Market Sizing: https://www.strategyzer.com/
 * - McKinsey Market Sizing Frameworks: https://www.mckinsey.com/
 * - CB Insights Market Maps: https://www.cbinsights.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productDescription,
    targetMarket,
    geographicScope,
    industryReports = [],
    competitorData = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Market Sizing Analysis for ${projectName}`);

  // Phase 1: Market Definition
  const marketDefinition = await ctx.task(marketDefinitionTask, {
    projectName,
    productDescription,
    targetMarket,
    geographicScope
  });

  artifacts.push(...(marketDefinition.artifacts || []));

  // Phase 2: Top-Down Analysis (TAM)
  const topDownAnalysis = await ctx.task(topDownAnalysisTask, {
    projectName,
    marketDefinition,
    industryReports,
    geographicScope
  });

  artifacts.push(...(topDownAnalysis.artifacts || []));

  // Phase 3: Bottom-Up Analysis
  const bottomUpAnalysis = await ctx.task(bottomUpAnalysisTask, {
    projectName,
    marketDefinition,
    productDescription,
    targetMarket
  });

  artifacts.push(...(bottomUpAnalysis.artifacts || []));

  // Breakpoint: Review TAM calculations
  await ctx.breakpoint({
    question: `Review TAM calculations for ${projectName}. Top-down: ${topDownAnalysis.tam}, Bottom-up: ${bottomUpAnalysis.tamValidation}. Proceed with SAM/SOM analysis?`,
    title: 'TAM Analysis Review',
    context: {
      runId: ctx.runId,
      projectName,
      topDownTAM: topDownAnalysis.tam,
      bottomUpValidation: bottomUpAnalysis.tamValidation,
      files: artifacts
    }
  });

  // Phase 4: SAM Calculation
  const samCalculation = await ctx.task(samCalculationTask, {
    projectName,
    topDownAnalysis,
    bottomUpAnalysis,
    targetMarket,
    geographicScope
  });

  artifacts.push(...(samCalculation.artifacts || []));

  // Phase 5: SOM Estimation
  const somEstimation = await ctx.task(somEstimationTask, {
    projectName,
    samCalculation,
    competitorData,
    marketDefinition
  });

  artifacts.push(...(somEstimation.artifacts || []));

  // Phase 6: Growth Projections
  const growthProjections = await ctx.task(growthProjectionsTask, {
    projectName,
    topDownAnalysis,
    samCalculation,
    somEstimation
  });

  artifacts.push(...(growthProjections.artifacts || []));

  // Phase 7: Methodology Documentation
  const methodologyDoc = await ctx.task(methodologyDocumentationTask, {
    projectName,
    topDownAnalysis,
    bottomUpAnalysis,
    samCalculation,
    somEstimation
  });

  artifacts.push(...(methodologyDoc.artifacts || []));

  // Phase 8: Investor-Ready Analysis
  const investorAnalysis = await ctx.task(investorReadyAnalysisTask, {
    projectName,
    marketDefinition,
    topDownAnalysis,
    bottomUpAnalysis,
    samCalculation,
    somEstimation,
    growthProjections
  });

  artifacts.push(...(investorAnalysis.artifacts || []));

  // Final Breakpoint: Market sizing complete
  await ctx.breakpoint({
    question: `Market sizing analysis complete for ${projectName}. TAM: ${topDownAnalysis.tam}, SAM: ${samCalculation.sam}, SOM: ${somEstimation.som}. Approve analysis?`,
    title: 'Market Sizing Analysis Approval',
    context: {
      runId: ctx.runId,
      projectName,
      tam: topDownAnalysis.tam,
      sam: samCalculation.sam,
      som: somEstimation.som,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    marketSizingModel: {
      tam: topDownAnalysis.tam,
      tamBreakdown: topDownAnalysis.breakdown,
      sam: samCalculation.sam,
      samBreakdown: samCalculation.breakdown,
      som: somEstimation.som,
      somBreakdown: somEstimation.breakdown,
      growthProjections: growthProjections
    },
    methodology: methodologyDoc,
    investorReadyAnalysis: investorAnalysis,
    recommendations: investorAnalysis.recommendations || [],
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/market-sizing-analysis',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const marketDefinitionTask = defineTask('market-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Research Analyst with expertise in market sizing and segmentation',
      task: 'Define market boundaries and segmentation criteria for market sizing analysis',
      context: {
        projectName: args.projectName,
        productDescription: args.productDescription,
        targetMarket: args.targetMarket,
        geographicScope: args.geographicScope
      },
      instructions: [
        '1. Define the market category and industry classification',
        '2. Identify primary and secondary market segments',
        '3. Define geographic boundaries for analysis',
        '4. Identify customer segments by demographics, firmographics, and behaviors',
        '5. Define market boundaries (what is in/out of scope)',
        '6. Identify adjacent markets and potential expansion areas',
        '7. Define buyer personas within the market',
        '8. Identify market trends affecting sizing',
        '9. Define time horizon for analysis',
        '10. Create market taxonomy and hierarchy'
      ],
      outputFormat: 'JSON object with market definition'
    },
    outputSchema: {
      type: 'object',
      required: ['marketCategory', 'segments', 'boundaries'],
      properties: {
        marketCategory: { type: 'string' },
        industryClassification: { type: 'string' },
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        geographicScope: { type: 'object' },
        boundaries: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        adjacentMarkets: { type: 'array', items: { type: 'string' } },
        buyerPersonas: { type: 'array', items: { type: 'object' } },
        marketTrends: { type: 'array', items: { type: 'string' } },
        analysisTimeframe: { type: 'string' },
        taxonomy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'market-sizing', 'market-definition']
}));

export const topDownAnalysisTask = defineTask('top-down-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Top-Down TAM Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing Expert with expertise in top-down analysis',
      task: 'Conduct top-down Total Addressable Market (TAM) analysis using industry data',
      context: {
        projectName: args.projectName,
        marketDefinition: args.marketDefinition,
        industryReports: args.industryReports,
        geographicScope: args.geographicScope
      },
      instructions: [
        '1. Identify relevant industry market size reports and data sources',
        '2. Extract total market size for the broader industry',
        '3. Apply segmentation filters to narrow to relevant market',
        '4. Calculate TAM based on industry data',
        '5. Validate calculations with multiple data sources',
        '6. Document data sources and their reliability',
        '7. Calculate market size in both revenue and units',
        '8. Identify market concentration and key players',
        '9. Note any caveats or limitations in the analysis',
        '10. Create TAM breakdown by segment'
      ],
      outputFormat: 'JSON object with top-down TAM analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['tam', 'methodology', 'dataSources'],
      properties: {
        tam: { type: 'string' },
        tamNumeric: { type: 'number' },
        currency: { type: 'string' },
        methodology: { type: 'string' },
        dataSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              year: { type: 'number' },
              reliability: { type: 'string' }
            }
          }
        },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              value: { type: 'string' },
              percentage: { type: 'number' }
            }
          }
        },
        unitsAnalysis: { type: 'object' },
        marketConcentration: { type: 'object' },
        caveats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'market-sizing', 'top-down', 'tam']
}));

export const bottomUpAnalysisTask = defineTask('bottom-up-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bottom-Up Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing Expert with expertise in bottom-up analysis',
      task: 'Conduct bottom-up market sizing validation using unit economics',
      context: {
        projectName: args.projectName,
        marketDefinition: args.marketDefinition,
        productDescription: args.productDescription,
        targetMarket: args.targetMarket
      },
      instructions: [
        '1. Identify total number of potential customers in target market',
        '2. Estimate average revenue per customer (ARPU)',
        '3. Calculate TAM from customer count x ARPU',
        '4. Validate customer count from multiple sources',
        '5. Consider purchase frequency and contract values',
        '6. Account for multi-product/upsell potential',
        '7. Compare bottom-up to top-down results',
        '8. Reconcile any significant discrepancies',
        '9. Document assumptions and their basis',
        '10. Calculate confidence range for estimates'
      ],
      outputFormat: 'JSON object with bottom-up analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['tamValidation', 'customerCount', 'arpu'],
      properties: {
        customerCount: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            sources: { type: 'array', items: { type: 'string' } },
            calculation: { type: 'string' }
          }
        },
        arpu: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            currency: { type: 'string' },
            basis: { type: 'string' }
          }
        },
        tamValidation: { type: 'string' },
        purchaseFrequency: { type: 'string' },
        upsellPotential: { type: 'object' },
        comparisonToTopDown: {
          type: 'object',
          properties: {
            variance: { type: 'string' },
            explanation: { type: 'string' }
          }
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              basis: { type: 'string' }
            }
          }
        },
        confidenceRange: {
          type: 'object',
          properties: {
            low: { type: 'string' },
            mid: { type: 'string' },
            high: { type: 'string' }
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
  labels: ['entrepreneurship', 'market-sizing', 'bottom-up']
}));

export const samCalculationTask = defineTask('sam-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `SAM Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing Expert',
      task: 'Calculate Serviceable Addressable Market (SAM) based on realistic reach',
      context: {
        projectName: args.projectName,
        topDownAnalysis: args.topDownAnalysis,
        bottomUpAnalysis: args.bottomUpAnalysis,
        targetMarket: args.targetMarket,
        geographicScope: args.geographicScope
      },
      instructions: [
        '1. Apply geographic filters to TAM',
        '2. Apply product capability filters',
        '3. Apply customer segment filters',
        '4. Apply pricing tier filters',
        '5. Account for regulatory or compliance limitations',
        '6. Consider distribution channel reach',
        '7. Calculate SAM as percentage of TAM',
        '8. Break down SAM by segment',
        '9. Validate SAM reasonableness',
        '10. Document all filters and their rationale'
      ],
      outputFormat: 'JSON object with SAM calculation'
    },
    outputSchema: {
      type: 'object',
      required: ['sam', 'samAsPercentOfTam', 'filters'],
      properties: {
        sam: { type: 'string' },
        samNumeric: { type: 'number' },
        samAsPercentOfTam: { type: 'number' },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filter: { type: 'string' },
              impact: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              value: { type: 'string' },
              percentage: { type: 'number' }
            }
          }
        },
        distributionReach: { type: 'object' },
        validationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'market-sizing', 'sam']
}));

export const somEstimationTask = defineTask('som-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `SOM Estimation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing and Strategy Expert',
      task: 'Estimate Serviceable Obtainable Market (SOM) based on realistic capture rate',
      context: {
        projectName: args.projectName,
        samCalculation: args.samCalculation,
        competitorData: args.competitorData,
        marketDefinition: args.marketDefinition
      },
      instructions: [
        '1. Analyze competitive landscape and market share distribution',
        '2. Estimate realistic market share capture timeline',
        '3. Factor in go-to-market strategy effectiveness',
        '4. Consider sales and marketing resource constraints',
        '5. Account for customer switching costs',
        '6. Factor in brand awareness building time',
        '7. Calculate SOM for Year 1, 3, and 5',
        '8. Break down SOM by customer segment',
        '9. Identify key assumptions for market capture',
        '10. Compare to comparable company growth rates'
      ],
      outputFormat: 'JSON object with SOM estimation'
    },
    outputSchema: {
      type: 'object',
      required: ['som', 'captureTimeline', 'competitiveAnalysis'],
      properties: {
        som: { type: 'string' },
        somNumeric: { type: 'number' },
        somAsPercentOfSam: { type: 'number' },
        captureTimeline: {
          type: 'object',
          properties: {
            year1: { type: 'string' },
            year3: { type: 'string' },
            year5: { type: 'string' }
          }
        },
        competitiveAnalysis: {
          type: 'object',
          properties: {
            topCompetitors: { type: 'array', items: { type: 'object' } },
            marketShareDistribution: { type: 'object' }
          }
        },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              value: { type: 'string' },
              captureStrategy: { type: 'string' }
            }
          }
        },
        keyAssumptions: { type: 'array', items: { type: 'string' } },
        comparableGrowthRates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'market-sizing', 'som']
}));

export const growthProjectionsTask = defineTask('growth-projections', (args, taskCtx) => ({
  kind: 'agent',
  title: `Growth Projections - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Forecasting Analyst',
      task: 'Create market growth projections and trend analysis',
      context: {
        projectName: args.projectName,
        topDownAnalysis: args.topDownAnalysis,
        samCalculation: args.samCalculation,
        somEstimation: args.somEstimation
      },
      instructions: [
        '1. Analyze historical market growth rates',
        '2. Identify key growth drivers and inhibitors',
        '3. Project TAM growth over 5 years',
        '4. Project SAM evolution with market changes',
        '5. Create multiple growth scenarios (base, bull, bear)',
        '6. Identify potential market disruptions',
        '7. Factor in technology and regulatory trends',
        '8. Calculate compound annual growth rate (CAGR)',
        '9. Identify inflection points and triggers',
        '10. Create year-by-year projections'
      ],
      outputFormat: 'JSON object with growth projections'
    },
    outputSchema: {
      type: 'object',
      required: ['projections', 'cagr', 'scenarios'],
      properties: {
        historicalGrowth: { type: 'object' },
        growthDrivers: { type: 'array', items: { type: 'string' } },
        growthInhibitors: { type: 'array', items: { type: 'string' } },
        projections: {
          type: 'object',
          properties: {
            year1: { type: 'string' },
            year2: { type: 'string' },
            year3: { type: 'string' },
            year4: { type: 'string' },
            year5: { type: 'string' }
          }
        },
        cagr: { type: 'number' },
        scenarios: {
          type: 'object',
          properties: {
            base: { type: 'object' },
            bull: { type: 'object' },
            bear: { type: 'object' }
          }
        },
        potentialDisruptions: { type: 'array', items: { type: 'string' } },
        inflectionPoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'market-sizing', 'growth-projections']
}));

export const methodologyDocumentationTask = defineTask('methodology-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Methodology Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Research Documentation Specialist',
      task: 'Document market sizing methodology for transparency and defensibility',
      context: {
        projectName: args.projectName,
        topDownAnalysis: args.topDownAnalysis,
        bottomUpAnalysis: args.bottomUpAnalysis,
        samCalculation: args.samCalculation,
        somEstimation: args.somEstimation
      },
      instructions: [
        '1. Document step-by-step methodology used',
        '2. List all data sources with citations',
        '3. Document all assumptions and their basis',
        '4. Explain calculation formulas used',
        '5. Note limitations and caveats',
        '6. Document triangulation approach',
        '7. Explain how discrepancies were resolved',
        '8. Note confidence levels for each estimate',
        '9. Provide guidance for updating analysis',
        '10. Create methodology summary for presentations'
      ],
      outputFormat: 'JSON object with methodology documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['methodologySteps', 'dataSources', 'assumptions'],
      properties: {
        methodologySteps: { type: 'array', items: { type: 'string' } },
        dataSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string' },
              date: { type: 'string' },
              reliability: { type: 'string' }
            }
          }
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              basis: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        calculationFormulas: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        triangulationApproach: { type: 'string' },
        confidenceLevels: { type: 'object' },
        updateGuidance: { type: 'array', items: { type: 'string' } },
        methodologySummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'market-sizing', 'documentation']
}));

export const investorReadyAnalysisTask = defineTask('investor-ready-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Investor-Ready Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Relations and Market Analysis Expert',
      task: 'Create investor-ready market sizing analysis with presentation materials',
      context: {
        projectName: args.projectName,
        marketDefinition: args.marketDefinition,
        topDownAnalysis: args.topDownAnalysis,
        bottomUpAnalysis: args.bottomUpAnalysis,
        samCalculation: args.samCalculation,
        somEstimation: args.somEstimation,
        growthProjections: args.growthProjections
      },
      instructions: [
        '1. Create executive summary of market opportunity',
        '2. Design market sizing slide content',
        '3. Prepare talking points for investor presentations',
        '4. Anticipate and prepare answers for investor questions',
        '5. Create market opportunity narrative',
        '6. Highlight key market insights and trends',
        '7. Position opportunity relative to comparable deals',
        '8. Create visually compelling data presentations',
        '9. Prepare backup slides with methodology details',
        '10. Provide recommendations for market positioning'
      ],
      outputFormat: 'JSON object with investor-ready analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'slideContent', 'talkingPoints'],
      properties: {
        executiveSummary: { type: 'string' },
        slideContent: {
          type: 'object',
          properties: {
            marketSize: { type: 'object' },
            growth: { type: 'object' },
            opportunity: { type: 'object' }
          }
        },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        investorQA: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' }
            }
          }
        },
        marketNarrative: { type: 'string' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        comparableDeals: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'market-sizing', 'investor-ready']
}));
