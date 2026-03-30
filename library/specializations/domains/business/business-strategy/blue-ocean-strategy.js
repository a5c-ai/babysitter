/**
 * @process business-strategy/blue-ocean-strategy
 * @description Framework for creating uncontested market space through value innovation using the Four Actions Framework and Strategy Canvas
 * @inputs { industry: string, organizationContext: object, currentOffering: object, outputDir: string }
 * @outputs { success: boolean, strategyCanvas: object, fourActionsFramework: object, blueOceanIdeas: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    industry = '',
    organizationContext = {},
    currentOffering = {},
    outputDir = 'blue-ocean-output',
    targetNonCustomers = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Blue Ocean Strategy Formulation Process');

  // ============================================================================
  // PHASE 1: CURRENT STRATEGY CANVAS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current strategy canvas');
  const currentCanvas = await ctx.task(currentStrategyCanvasTask, {
    industry,
    organizationContext,
    currentOffering,
    outputDir
  });

  artifacts.push(...currentCanvas.artifacts);

  // ============================================================================
  // PHASE 2: INDUSTRY ANALYSIS - COMPETING FACTORS
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying industry competing factors');
  const competingFactors = await ctx.task(competingFactorsTask, {
    industry,
    currentCanvas: currentCanvas.canvas,
    outputDir
  });

  artifacts.push(...competingFactors.artifacts);

  // ============================================================================
  // PHASE 3: NON-CUSTOMER ANALYSIS
  // ============================================================================

  let nonCustomerAnalysis = null;
  if (targetNonCustomers) {
    ctx.log('info', 'Phase 3: Analyzing three tiers of non-customers');
    nonCustomerAnalysis = await ctx.task(nonCustomerAnalysisTask, {
      industry,
      organizationContext,
      outputDir
    });
    artifacts.push(...nonCustomerAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 4: SIX PATHS FRAMEWORK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying Six Paths Framework');
  const sixPaths = await ctx.task(sixPathsFrameworkTask, {
    industry,
    competingFactors: competingFactors.factors,
    nonCustomers: nonCustomerAnalysis ? nonCustomerAnalysis.tiers : null,
    outputDir
  });

  artifacts.push(...sixPaths.artifacts);

  // Breakpoint: Review strategic analysis
  await ctx.breakpoint({
    question: `Strategic analysis complete. ${competingFactors.factors.length} competing factors identified, ${sixPaths.opportunities.length} blue ocean opportunities found. Review before strategy formulation?`,
    title: 'Blue Ocean Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        competingFactors: competingFactors.factors.length,
        nonCustomerTiers: nonCustomerAnalysis ? 3 : 0,
        sixPathsOpportunities: sixPaths.opportunities.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: FOUR ACTIONS FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 5: Applying Four Actions Framework (ERRC Grid)');
  const fourActions = await ctx.task(fourActionsFrameworkTask, {
    competingFactors: competingFactors.factors,
    sixPathsOpportunities: sixPaths.opportunities,
    currentCanvas: currentCanvas.canvas,
    outputDir
  });

  artifacts.push(...fourActions.artifacts);

  // ============================================================================
  // PHASE 6: NEW VALUE CURVE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing new value curve');
  const newValueCurve = await ctx.task(newValueCurveTask, {
    fourActions: fourActions.errcGrid,
    competingFactors: competingFactors.factors,
    currentCanvas: currentCanvas.canvas,
    outputDir
  });

  artifacts.push(...newValueCurve.artifacts);

  // ============================================================================
  // PHASE 7: BLUE OCEAN IDEA GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating blue ocean ideas');
  const blueOceanIdeas = await ctx.task(blueOceanIdeaGenerationTask, {
    newValueCurve: newValueCurve.curve,
    fourActions: fourActions.errcGrid,
    sixPathsOpportunities: sixPaths.opportunities,
    outputDir
  });

  artifacts.push(...blueOceanIdeas.artifacts);

  // ============================================================================
  // PHASE 8: BUYER UTILITY MAP
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating buyer utility map');
  const buyerUtilityMap = await ctx.task(buyerUtilityMapTask, {
    blueOceanIdeas: blueOceanIdeas.ideas,
    industry,
    outputDir
  });

  artifacts.push(...buyerUtilityMap.artifacts);

  // ============================================================================
  // PHASE 9: STRATEGIC PRICING AND COST ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing strategic pricing and costs');
  const pricingCostAssessment = await ctx.task(pricingCostAssessmentTask, {
    blueOceanIdeas: blueOceanIdeas.ideas,
    fourActions: fourActions.errcGrid,
    organizationContext,
    outputDir
  });

  artifacts.push(...pricingCostAssessment.artifacts);

  // ============================================================================
  // PHASE 10: ADOPTION HURDLES ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing adoption hurdles');
  const adoptionHurdles = await ctx.task(adoptionHurdlesTask, {
    blueOceanIdeas: blueOceanIdeas.ideas,
    organizationContext,
    outputDir
  });

  artifacts.push(...adoptionHurdles.artifacts);

  // ============================================================================
  // PHASE 11: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive Blue Ocean Strategy report');
  const blueOceanReport = await ctx.task(blueOceanReportTask, {
    currentCanvas,
    competingFactors,
    nonCustomerAnalysis,
    sixPaths,
    fourActions,
    newValueCurve,
    blueOceanIdeas,
    buyerUtilityMap,
    pricingCostAssessment,
    adoptionHurdles,
    outputDir
  });

  artifacts.push(...blueOceanReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    strategyCanvas: {
      current: currentCanvas.canvas,
      newValueCurve: newValueCurve.curve
    },
    fourActionsFramework: fourActions.errcGrid,
    blueOceanIdeas: blueOceanIdeas.ideas,
    sixPathsOpportunities: sixPaths.opportunities,
    buyerUtilityMap: buyerUtilityMap.map,
    pricingStrategy: pricingCostAssessment.pricingStrategy,
    adoptionStrategy: adoptionHurdles.adoptionStrategy,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/blue-ocean-strategy',
      timestamp: startTime,
      industry
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Current Strategy Canvas
export const currentStrategyCanvasTask = defineTask('current-strategy-canvas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current strategy canvas',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'blue ocean strategy analyst',
      task: 'Analyze and map the current strategy canvas for the industry',
      context: args,
      instructions: [
        'Identify key competing factors in the industry',
        'Map value curves for:',
        '  - Your organization',
        '  - Key competitors',
        '  - Industry average',
        'Rate each factor (1-10) for each player',
        'Identify convergence points (red ocean indicators)',
        'Identify current strategic focus areas',
        'Save canvas to output directory'
      ],
      outputFormat: 'JSON with canvas (object with factors and valueCurves), convergencePoints (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['canvas', 'artifacts'],
      properties: {
        canvas: {
          type: 'object',
          properties: {
            factors: { type: 'array', items: { type: 'string' } },
            valueCurves: { type: 'object' }
          }
        },
        convergencePoints: { type: 'array', items: { type: 'string' } },
        redOceanIndicators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'strategy-canvas']
}));

// Task 2: Competing Factors Analysis
export const competingFactorsTask = defineTask('competing-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify industry competing factors',
  agent: {
    name: 'industry-analyst',
    prompt: {
      role: 'industry and competitive factors analyst',
      task: 'Identify and analyze all factors the industry competes on',
      context: args,
      instructions: [
        'Identify all factors industry competes on:',
        '  - Product features and attributes',
        '  - Service levels',
        '  - Price points',
        '  - Brand and image',
        '  - Convenience and accessibility',
        '  - Technology and innovation',
        'Assess each factor:',
        '  - Industry investment level',
        '  - Customer importance',
        '  - Differentiation potential',
        'Identify taken-for-granted factors',
        'Identify over-invested factors',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array of objects with name, industryLevel, customerImportance, differentiationPotential), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              industryLevel: { type: 'number' },
              customerImportance: { type: 'string' },
              differentiationPotential: { type: 'string' },
              takenForGranted: { type: 'boolean' },
              overInvested: { type: 'boolean' }
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
  labels: ['agent', 'blue-ocean', 'competing-factors']
}));

// Task 3: Non-Customer Analysis
export const nonCustomerAnalysisTask = defineTask('non-customer-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze three tiers of non-customers',
  agent: {
    name: 'non-customer-analyst',
    prompt: {
      role: 'market expansion and non-customer analyst',
      task: 'Analyze the three tiers of non-customers for blue ocean opportunities',
      context: args,
      instructions: [
        'Analyze three tiers of non-customers:',
        '  Tier 1: Soon-to-be non-customers',
        '    - On the edge of the market',
        '    - Use offerings minimally',
        '    - Actively seeking alternatives',
        '  Tier 2: Refusing non-customers',
        '    - Consciously chose against market',
        '    - See offerings as unacceptable option',
        '  Tier 3: Unexplored non-customers',
        '    - In distant markets',
        '    - Never considered as customers',
        'For each tier identify:',
        '  - Who they are',
        '  - Why they are non-customers',
        '  - What would make them customers',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with tiers (array of objects with tier, description, reasons, opportunities), totalNonCustomerPotential (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tiers', 'artifacts'],
      properties: {
        tiers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tier: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              reasons: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } },
              size: { type: 'string' }
            }
          }
        },
        totalNonCustomerPotential: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'non-customers']
}));

// Task 4: Six Paths Framework
export const sixPathsFrameworkTask = defineTask('six-paths-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Six Paths Framework',
  agent: {
    name: 'strategic-pathfinder',
    prompt: {
      role: 'blue ocean strategic pathfinder',
      task: 'Apply the Six Paths Framework to identify blue ocean opportunities',
      context: args,
      instructions: [
        'Analyze each path for opportunities:',
        '  Path 1: Look across alternative industries',
        '    - What alternatives do customers choose between?',
        '  Path 2: Look across strategic groups',
        '    - What makes customers trade up or down?',
        '  Path 3: Look across buyer groups',
        '    - Who are buyers, users, influencers?',
        '  Path 4: Look across complementary offerings',
        '    - What happens before, during, after use?',
        '  Path 5: Look across functional-emotional appeal',
        '    - Can we shift the orientation?',
        '  Path 6: Look across time',
        '    - What trends affect value to buyers?',
        'Identify top opportunities from each path',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with paths (array of objects with path, analysis, opportunities), topOpportunities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'opportunities', 'artifacts'],
      properties: {
        paths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pathNumber: { type: 'number' },
              pathName: { type: 'string' },
              analysis: { type: 'string' },
              opportunities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'six-paths']
}));

// Task 5: Four Actions Framework
export const fourActionsFrameworkTask = defineTask('four-actions-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Four Actions Framework (ERRC Grid)',
  agent: {
    name: 'value-innovator',
    prompt: {
      role: 'value innovation strategist',
      task: 'Apply the Four Actions Framework to reconstruct value elements',
      context: args,
      instructions: [
        'Apply Four Actions to competing factors:',
        '  ELIMINATE: Which factors should be eliminated?',
        '    - Taken for granted but add little value',
        '    - Raise costs without proportional benefits',
        '  REDUCE: Which factors should be reduced below standard?',
        '    - Over-delivered relative to value',
        '    - Can maintain competitiveness with less',
        '  RAISE: Which factors should be raised above standard?',
        '    - Currently underdelivered',
        '    - Significant value creation potential',
        '  CREATE: Which factors should be created that never existed?',
        '    - Unlock new value',
        '    - Address non-customer needs',
        'Create ERRC Grid visualization',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with errcGrid (object with eliminate, reduce, raise, create arrays), rationale (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['errcGrid', 'artifacts'],
      properties: {
        errcGrid: {
          type: 'object',
          properties: {
            eliminate: { type: 'array', items: { type: 'object' } },
            reduce: { type: 'array', items: { type: 'object' } },
            raise: { type: 'array', items: { type: 'object' } },
            create: { type: 'array', items: { type: 'object' } }
          }
        },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'four-actions', 'errc']
}));

// Task 6: New Value Curve Design
export const newValueCurveTask = defineTask('new-value-curve', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design new value curve',
  agent: {
    name: 'value-curve-designer',
    prompt: {
      role: 'value curve designer',
      task: 'Design the new blue ocean value curve',
      context: args,
      instructions: [
        'Design new value curve based on ERRC Grid:',
        '  - Set eliminated factors to 0',
        '  - Set reduced factors below industry',
        '  - Set raised factors above industry',
        '  - Add created factors with target levels',
        'Ensure curve is:',
        '  - Divergent from industry curve',
        '  - Focused on key value drivers',
        '  - Has compelling tagline',
        'Visualize new vs current curve',
        'Validate curve creates buyer value leap',
        'Save value curve to output directory'
      ],
      outputFormat: 'JSON with curve (object with factors and levels), divergenceScore (number), tagline (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['curve', 'artifacts'],
      properties: {
        curve: {
          type: 'object',
          properties: {
            factors: { type: 'array', items: { type: 'string' } },
            levels: { type: 'object' }
          }
        },
        divergenceScore: { type: 'number' },
        tagline: { type: 'string' },
        valueLeapDescription: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'value-curve']
}));

// Task 7: Blue Ocean Idea Generation
export const blueOceanIdeaGenerationTask = defineTask('blue-ocean-ideas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate blue ocean ideas',
  agent: {
    name: 'innovation-catalyst',
    prompt: {
      role: 'blue ocean innovation catalyst',
      task: 'Generate specific blue ocean product/service ideas',
      context: args,
      instructions: [
        'Generate 3-5 blue ocean ideas based on:',
        '  - New value curve',
        '  - Four Actions Framework',
        '  - Six Paths opportunities',
        'For each idea describe:',
        '  - Concept and offering',
        '  - Target market (including non-customers)',
        '  - Key value innovation',
        '  - Differentiation from red ocean',
        '  - Revenue model potential',
        'Prioritize by value innovation potential',
        'Save ideas to output directory'
      ],
      outputFormat: 'JSON with ideas (array of objects with name, concept, targetMarket, valueInnovation, differentiation, revenueModel, priority), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ideas', 'artifacts'],
      properties: {
        ideas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              concept: { type: 'string' },
              targetMarket: { type: 'string' },
              valueInnovation: { type: 'string' },
              differentiation: { type: 'string' },
              revenueModel: { type: 'string' },
              priority: { type: 'number' }
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
  labels: ['agent', 'blue-ocean', 'idea-generation']
}));

// Task 8: Buyer Utility Map
export const buyerUtilityMapTask = defineTask('buyer-utility-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create buyer utility map',
  agent: {
    name: 'utility-mapper',
    prompt: {
      role: 'buyer utility analyst',
      task: 'Create buyer utility map to identify utility opportunities',
      context: args,
      instructions: [
        'Map buyer experience cycle stages:',
        '  1. Purchase',
        '  2. Delivery',
        '  3. Use',
        '  4. Supplements',
        '  5. Maintenance',
        '  6. Disposal',
        'Map six utility levers:',
        '  - Customer productivity',
        '  - Simplicity',
        '  - Convenience',
        '  - Risk reduction',
        '  - Fun and image',
        '  - Environmental friendliness',
        'Identify utility gaps in 36-cell matrix',
        'Highlight blue ocean idea utility',
        'Save map to output directory'
      ],
      outputFormat: 'JSON with map (object with stages and levers), utilityGaps (array), blueOceanUtility (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'artifacts'],
      properties: {
        map: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'string' } },
            levers: { type: 'array', items: { type: 'string' } },
            matrix: { type: 'object' }
          }
        },
        utilityGaps: { type: 'array' },
        blueOceanUtility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'buyer-utility']
}));

// Task 9: Pricing and Cost Assessment
export const pricingCostAssessmentTask = defineTask('pricing-cost-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic pricing and costs',
  agent: {
    name: 'pricing-strategist',
    prompt: {
      role: 'strategic pricing and cost analyst',
      task: 'Assess strategic pricing and cost structure for blue ocean',
      context: args,
      instructions: [
        'Determine strategic price corridor:',
        '  - Identify price of alternatives and substitutes',
        '  - Determine mass price corridor',
        '  - Set price for mass adoption',
        'Apply target costing:',
        '  - Start from strategic price',
        '  - Deduct profit margin',
        '  - Calculate target cost',
        'Identify cost reduction through:',
        '  - Eliminated factors',
        '  - Reduced factors',
        '  - Operational innovations',
        '  - Partnerships',
        'Assess profit model viability',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with pricingStrategy (object), costStructure (object), profitModel (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pricingStrategy', 'artifacts'],
      properties: {
        pricingStrategy: {
          type: 'object',
          properties: {
            priceCorridor: { type: 'object' },
            strategicPrice: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        costStructure: {
          type: 'object',
          properties: {
            targetCost: { type: 'string' },
            costReductions: { type: 'array' }
          }
        },
        profitModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'pricing', 'costs']
}));

// Task 10: Adoption Hurdles Assessment
export const adoptionHurdlesTask = defineTask('adoption-hurdles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess adoption hurdles',
  agent: {
    name: 'adoption-strategist',
    prompt: {
      role: 'market adoption strategist',
      task: 'Assess and plan for overcoming adoption hurdles',
      context: args,
      instructions: [
        'Identify adoption hurdles across stakeholders:',
        '  - Employees (internal resistance)',
        '  - Partners (channel resistance)',
        '  - Public (market resistance)',
        'For each hurdle assess:',
        '  - Nature of resistance',
        '  - Stakeholder concerns',
        '  - Mitigation strategies',
        'Apply tipping point leadership principles:',
        '  - Cognitive hurdles',
        '  - Resource hurdles',
        '  - Motivational hurdles',
        '  - Political hurdles',
        'Create adoption strategy',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with hurdles (array of objects), adoptionStrategy (object), mitigationPlans (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hurdles', 'adoptionStrategy', 'artifacts'],
      properties: {
        hurdles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              hurdle: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        adoptionStrategy: { type: 'object' },
        mitigationPlans: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'adoption']
}));

// Task 11: Blue Ocean Report
export const blueOceanReportTask = defineTask('blue-ocean-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive Blue Ocean Strategy report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'blue ocean strategy consultant and technical writer',
      task: 'Generate comprehensive Blue Ocean Strategy report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document current red ocean analysis',
        'Present strategy canvas visualization',
        'Document Six Paths analysis',
        'Present Four Actions Framework (ERRC Grid)',
        'Show new value curve design',
        'Present blue ocean ideas',
        'Include buyer utility map',
        'Document pricing and cost strategy',
        'Present adoption strategy',
        'Add implementation roadmap',
        'Format as professional strategy document',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyInsights (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'reporting', 'documentation']
}));
