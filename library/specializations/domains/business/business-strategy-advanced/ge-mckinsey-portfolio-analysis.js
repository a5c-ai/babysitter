/**
 * @process business-strategy/ge-mckinsey-portfolio-analysis
 * @description Multi-factor portfolio analysis using GE-McKinsey Nine-Box Matrix for strategic investment decisions
 * @inputs { organizationName: string, businessUnits: array, industryData: object, competitiveData: object }
 * @outputs { success: boolean, nineBoxMatrix: object, investmentStrategy: object, portfolioPriorities: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    businessUnits = [],
    industryData = {},
    competitiveData = {},
    outputDir = 'ge-mckinsey-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GE-McKinsey Portfolio Analysis for ${organizationName}`);

  // ============================================================================
  // PHASE 1: INDUSTRY ATTRACTIVENESS FACTORS
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining industry attractiveness factors and weightings');
  const attractivenessFactors = await ctx.task(attractivenessFactorsTask, {
    organizationName,
    industryData,
    businessUnits,
    outputDir
  });

  artifacts.push(...attractivenessFactors.artifacts);

  // ============================================================================
  // PHASE 2: COMPETITIVE POSITION FACTORS
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining competitive position factors and weightings');
  const competitiveFactors = await ctx.task(competitivePositionFactorsTask, {
    organizationName,
    competitiveData,
    businessUnits,
    outputDir
  });

  artifacts.push(...competitiveFactors.artifacts);

  // ============================================================================
  // PHASE 3: INDUSTRY ATTRACTIVENESS SCORING
  // ============================================================================

  ctx.log('info', 'Phase 3: Scoring each business unit on industry attractiveness');
  const attractivenessScoring = await ctx.task(attractivenessScoringTask, {
    organizationName,
    businessUnits,
    attractivenessFactors,
    industryData,
    outputDir
  });

  artifacts.push(...attractivenessScoring.artifacts);

  // ============================================================================
  // PHASE 4: COMPETITIVE POSITION SCORING
  // ============================================================================

  ctx.log('info', 'Phase 4: Scoring each business unit on competitive position');
  const competitiveScoring = await ctx.task(competitiveScoringTask, {
    organizationName,
    businessUnits,
    competitiveFactors,
    competitiveData,
    outputDir
  });

  artifacts.push(...competitiveScoring.artifacts);

  // ============================================================================
  // PHASE 5: NINE-BOX MATRIX PLOTTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Plotting business units on nine-box matrix');
  const nineBoxMatrix = await ctx.task(nineBoxPlottingTask, {
    organizationName,
    businessUnits,
    attractivenessScoring,
    competitiveScoring,
    outputDir
  });

  artifacts.push(...nineBoxMatrix.artifacts);

  // ============================================================================
  // PHASE 6: STRATEGIC ZONE CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Classifying units by strategic investment zone');
  const zoneClassification = await ctx.task(zoneClassificationTask, {
    organizationName,
    nineBoxMatrix,
    outputDir
  });

  artifacts.push(...zoneClassification.artifacts);

  // ============================================================================
  // PHASE 7: INVESTMENT STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing investment strategy recommendations');
  const investmentStrategy = await ctx.task(investmentStrategyTask, {
    organizationName,
    zoneClassification,
    nineBoxMatrix,
    outputDir
  });

  artifacts.push(...investmentStrategy.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive GE-McKinsey report');
  const geMcKinseyReport = await ctx.task(geMcKinseyReportTask, {
    organizationName,
    attractivenessFactors,
    competitiveFactors,
    attractivenessScoring,
    competitiveScoring,
    nineBoxMatrix,
    zoneClassification,
    investmentStrategy,
    outputDir
  });

  artifacts.push(...geMcKinseyReport.artifacts);

  // Breakpoint: Review GE-McKinsey analysis
  await ctx.breakpoint({
    question: `GE-McKinsey portfolio analysis complete for ${organizationName}. Review investment strategy recommendations?`,
    title: 'GE-McKinsey Portfolio Analysis Review',
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
        zoneDistribution: {
          investGrow: zoneClassification.investGrow?.length || 0,
          selectiveInvestment: zoneClassification.selectiveInvestment?.length || 0,
          harvestDivest: zoneClassification.harvestDivest?.length || 0
        }
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    nineBoxMatrix: nineBoxMatrix.matrix,
    investmentStrategy: investmentStrategy.strategy,
    portfolioPriorities: zoneClassification.priorities,
    attractivenessAssessment: attractivenessScoring.scores,
    competitiveAssessment: competitiveScoring.scores,
    reportPath: geMcKinseyReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/ge-mckinsey-portfolio-analysis',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Industry Attractiveness Factors
export const attractivenessFactorsTask = defineTask('attractiveness-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define industry attractiveness factors and weightings',
  agent: {
    name: 'attractiveness-analyst',
    prompt: {
      role: 'industry analysis specialist',
      task: 'Define and weight industry attractiveness factors',
      context: args,
      instructions: [
        'Identify key industry attractiveness factors',
        'Include market size and growth rate',
        'Include industry profitability',
        'Include competitive intensity',
        'Include technological requirements',
        'Include regulatory environment',
        'Include cyclicality and seasonality',
        'Assign weights to factors (must sum to 100%)',
        'Define scoring scale (1-5 or 1-10)',
        'Generate attractiveness factors framework'
      ],
      outputFormat: 'JSON with factors (array with factor, description, weight), totalWeight, scoringScale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'totalWeight', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              description: { type: 'string' },
              weight: { type: 'number' }
            }
          }
        },
        totalWeight: { type: 'number' },
        scoringScale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ge-mckinsey', 'attractiveness-factors']
}));

// Task 2: Competitive Position Factors
export const competitivePositionFactorsTask = defineTask('competitive-position-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define competitive position factors and weightings',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive analysis specialist',
      task: 'Define and weight competitive position factors',
      context: args,
      instructions: [
        'Identify key competitive position factors',
        'Include market share and market share growth',
        'Include brand strength and reputation',
        'Include production capacity and efficiency',
        'Include technology position',
        'Include management strength',
        'Include cost position',
        'Assign weights to factors (must sum to 100%)',
        'Define scoring scale (1-5 or 1-10)',
        'Generate competitive position factors framework'
      ],
      outputFormat: 'JSON with factors (array with factor, description, weight), totalWeight, scoringScale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'totalWeight', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              description: { type: 'string' },
              weight: { type: 'number' }
            }
          }
        },
        totalWeight: { type: 'number' },
        scoringScale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ge-mckinsey', 'competitive-factors']
}));

// Task 3: Industry Attractiveness Scoring
export const attractivenessScoringTask = defineTask('attractiveness-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score business units on industry attractiveness',
  agent: {
    name: 'attractiveness-scorer',
    prompt: {
      role: 'industry attractiveness analyst',
      task: 'Score each business unit on industry attractiveness factors',
      context: args,
      instructions: [
        'Score each business unit on each attractiveness factor',
        'Apply factor weights to calculate weighted scores',
        'Calculate total weighted attractiveness score for each unit',
        'Classify as High (3.7-5.0), Medium (2.4-3.6), or Low (1.0-2.3)',
        'Provide scoring rationale for each unit',
        'Identify scoring uncertainties and assumptions',
        'Generate attractiveness scoring matrix'
      ],
      outputFormat: 'JSON with scores (array with unit, factorScores, weightedTotal, classification), scoringMatrix, rationales, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'artifacts'],
      properties: {
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unit: { type: 'string' },
              factorScores: { type: 'object' },
              weightedTotal: { type: 'number' },
              classification: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        scoringMatrix: { type: 'object' },
        rationales: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ge-mckinsey', 'attractiveness-scoring']
}));

// Task 4: Competitive Position Scoring
export const competitiveScoringTask = defineTask('competitive-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score business units on competitive position',
  agent: {
    name: 'competitive-scorer',
    prompt: {
      role: 'competitive position analyst',
      task: 'Score each business unit on competitive position factors',
      context: args,
      instructions: [
        'Score each business unit on each competitive factor',
        'Apply factor weights to calculate weighted scores',
        'Calculate total weighted competitive score for each unit',
        'Classify as Strong (3.7-5.0), Medium (2.4-3.6), or Weak (1.0-2.3)',
        'Provide scoring rationale for each unit',
        'Identify scoring uncertainties and assumptions',
        'Generate competitive scoring matrix'
      ],
      outputFormat: 'JSON with scores (array with unit, factorScores, weightedTotal, classification), scoringMatrix, rationales, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'artifacts'],
      properties: {
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unit: { type: 'string' },
              factorScores: { type: 'object' },
              weightedTotal: { type: 'number' },
              classification: { type: 'string', enum: ['strong', 'medium', 'weak'] }
            }
          }
        },
        scoringMatrix: { type: 'object' },
        rationales: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ge-mckinsey', 'competitive-scoring']
}));

// Task 5: Nine-Box Matrix Plotting
export const nineBoxPlottingTask = defineTask('nine-box-plotting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plot business units on nine-box matrix',
  agent: {
    name: 'matrix-plotter',
    prompt: {
      role: 'portfolio visualization specialist',
      task: 'Plot business units on GE-McKinsey nine-box matrix',
      context: args,
      instructions: [
        'Create 3x3 matrix with attractiveness (Y) and competitive position (X)',
        'Plot each business unit based on scores',
        'Size bubbles by revenue, assets, or strategic importance',
        'Label each unit clearly',
        'Show movement trajectory if historical data available',
        'Create visual nine-box matrix diagram',
        'Generate matrix plotting documentation'
      ],
      outputFormat: 'JSON with matrix (units by cell), plotCoordinates, bubbleSizes, visualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'plotCoordinates', 'artifacts'],
      properties: {
        matrix: { type: 'object' },
        plotCoordinates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unit: { type: 'string' },
              x: { type: 'number' },
              y: { type: 'number' },
              size: { type: 'number' },
              cell: { type: 'string' }
            }
          }
        },
        bubbleSizes: { type: 'object' },
        visualization: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ge-mckinsey', 'nine-box-plotting']
}));

// Task 6: Strategic Zone Classification
export const zoneClassificationTask = defineTask('zone-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify units by strategic investment zone',
  agent: {
    name: 'zone-classifier',
    prompt: {
      role: 'portfolio strategy specialist',
      task: 'Classify business units into strategic investment zones',
      context: args,
      instructions: [
        'Green Zone (Invest/Grow): High-High, High-Medium, Medium-High',
        'Yellow Zone (Selective Investment): High-Low, Medium-Medium, Low-High',
        'Red Zone (Harvest/Divest): Medium-Low, Low-Medium, Low-Low',
        'Classify each business unit into appropriate zone',
        'Provide strategic rationale for each classification',
        'Prioritize units within each zone',
        'Generate zone classification report'
      ],
      outputFormat: 'JSON with investGrow, selectiveInvestment, harvestDivest (arrays), priorities, rationales, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['investGrow', 'selectiveInvestment', 'harvestDivest', 'artifacts'],
      properties: {
        investGrow: { type: 'array', items: { type: 'object' } },
        selectiveInvestment: { type: 'array', items: { type: 'object' } },
        harvestDivest: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'string' } },
        rationales: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ge-mckinsey', 'zone-classification']
}));

// Task 7: Investment Strategy Development
export const investmentStrategyTask = defineTask('investment-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop investment strategy recommendations',
  agent: {
    name: 'investment-strategist',
    prompt: {
      role: 'portfolio investment strategist',
      task: 'Develop investment strategy recommendations for each zone',
      context: args,
      instructions: [
        'Green Zone: Recommend aggressive investment and growth strategies',
        'Yellow Zone: Recommend selective investment with clear criteria',
        'Red Zone: Recommend harvesting, divesting, or turnaround strategies',
        'Specify investment levels and types for each unit',
        'Define strategic priorities and sequencing',
        'Identify resource requirements',
        'Create investment allocation plan',
        'Generate investment strategy report'
      ],
      outputFormat: 'JSON with strategy (by zone), investmentLevels, resourceRequirements, allocationPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            investGrow: { type: 'array', items: { type: 'object' } },
            selectiveInvestment: { type: 'array', items: { type: 'object' } },
            harvestDivest: { type: 'array', items: { type: 'object' } }
          }
        },
        investmentLevels: { type: 'object' },
        resourceRequirements: { type: 'object' },
        allocationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ge-mckinsey', 'investment-strategy']
}));

// Task 8: GE-McKinsey Report Generation
export const geMcKinseyReportTask = defineTask('ge-mckinsey-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive GE-McKinsey report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'portfolio strategy report author',
      task: 'Generate comprehensive GE-McKinsey portfolio analysis report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Document factor definitions and weightings',
        'Present scoring methodology and results',
        'Include nine-box matrix visualization',
        'Document zone classifications with rationale',
        'Present investment strategy recommendations',
        'Include implementation guidance',
        'Add appendices with detailed scoring',
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
  labels: ['agent', 'ge-mckinsey', 'reporting']
}));
