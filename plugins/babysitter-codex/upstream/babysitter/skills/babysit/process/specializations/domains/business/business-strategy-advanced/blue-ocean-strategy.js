/**
 * @process business-strategy/blue-ocean-strategy
 * @description Create uncontested market space using Blue Ocean Strategy frameworks including value innovation and Four Actions Framework
 * @inputs { organizationName: string, currentIndustry: object, competitorData: array, customerData: object }
 * @outputs { success: boolean, strategyCanvas: object, fourActionsAnalysis: object, valueInnovation: object, blueOceanRoadmap: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    currentIndustry = {},
    competitorData = [],
    customerData = {},
    outputDir = 'blue-ocean-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Blue Ocean Strategy Development for ${organizationName}`);

  // ============================================================================
  // PHASE 1: CURRENT STRATEGY CANVAS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current industry strategy canvas');
  const currentStrategyCanvas = await ctx.task(currentStrategyCanvasTask, {
    organizationName,
    currentIndustry,
    competitorData,
    outputDir
  });

  artifacts.push(...currentStrategyCanvas.artifacts);

  // ============================================================================
  // PHASE 2: SIX PATHS FRAMEWORK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Applying Six Paths Framework');
  const sixPathsAnalysis = await ctx.task(sixPathsFrameworkTask, {
    organizationName,
    currentIndustry,
    competitorData,
    customerData,
    currentStrategyCanvas,
    outputDir
  });

  artifacts.push(...sixPathsAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: FOUR ACTIONS FRAMEWORK (ERRC)
  // ============================================================================

  ctx.log('info', 'Phase 3: Executing Four Actions Framework (Eliminate-Reduce-Raise-Create)');
  const fourActionsAnalysis = await ctx.task(fourActionsFrameworkTask, {
    organizationName,
    currentStrategyCanvas,
    sixPathsAnalysis,
    customerData,
    outputDir
  });

  artifacts.push(...fourActionsAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: THREE TIERS OF NONCUSTOMERS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing three tiers of noncustomers');
  const noncustomerAnalysis = await ctx.task(noncustomerAnalysisTask, {
    organizationName,
    currentIndustry,
    customerData,
    outputDir
  });

  artifacts.push(...noncustomerAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: VALUE INNOVATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing value innovation proposition');
  const valueInnovation = await ctx.task(valueInnovationTask, {
    organizationName,
    fourActionsAnalysis,
    noncustomerAnalysis,
    sixPathsAnalysis,
    outputDir
  });

  artifacts.push(...valueInnovation.artifacts);

  // ============================================================================
  // PHASE 6: NEW STRATEGY CANVAS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating new strategy canvas with differentiated value curve');
  const newStrategyCanvas = await ctx.task(newStrategyCanvasTask, {
    organizationName,
    currentStrategyCanvas,
    fourActionsAnalysis,
    valueInnovation,
    outputDir
  });

  artifacts.push(...newStrategyCanvas.artifacts);

  // ============================================================================
  // PHASE 7: BLUE OCEAN SEQUENCE TEST
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing blue ocean strategy sequence');
  const sequenceTest = await ctx.task(blueOceanSequenceTestTask, {
    organizationName,
    valueInnovation,
    newStrategyCanvas,
    noncustomerAnalysis,
    outputDir
  });

  artifacts.push(...sequenceTest.artifacts);

  // ============================================================================
  // PHASE 8: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating blue ocean implementation roadmap');
  const implementationRoadmap = await ctx.task(blueOceanImplementationTask, {
    organizationName,
    valueInnovation,
    newStrategyCanvas,
    sequenceTest,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 9: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive Blue Ocean Strategy report');
  const blueOceanReport = await ctx.task(blueOceanReportTask, {
    organizationName,
    currentStrategyCanvas,
    sixPathsAnalysis,
    fourActionsAnalysis,
    noncustomerAnalysis,
    valueInnovation,
    newStrategyCanvas,
    sequenceTest,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...blueOceanReport.artifacts);

  // Breakpoint: Review Blue Ocean Strategy
  await ctx.breakpoint({
    question: `Blue Ocean Strategy development complete for ${organizationName}. Value innovation: ${valueInnovation.summary}. Review and approve?`,
    title: 'Blue Ocean Strategy Review',
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
        fourActionsERRC: {
          eliminate: fourActionsAnalysis.eliminate?.length || 0,
          reduce: fourActionsAnalysis.reduce?.length || 0,
          raise: fourActionsAnalysis.raise?.length || 0,
          create: fourActionsAnalysis.create?.length || 0
        },
        valueInnovationScore: valueInnovation.innovationScore,
        sequenceTestPassed: sequenceTest.allTestsPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    strategyCanvas: {
      current: currentStrategyCanvas.canvas,
      new: newStrategyCanvas.canvas,
      valueGap: newStrategyCanvas.valueGap
    },
    fourActionsAnalysis: {
      eliminate: fourActionsAnalysis.eliminate,
      reduce: fourActionsAnalysis.reduce,
      raise: fourActionsAnalysis.raise,
      create: fourActionsAnalysis.create
    },
    valueInnovation: valueInnovation.proposition,
    noncustomerOpportunity: noncustomerAnalysis.totalOpportunity,
    sequenceTestResults: sequenceTest.results,
    blueOceanRoadmap: implementationRoadmap.roadmap,
    reportPath: blueOceanReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/blue-ocean-strategy',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Current Strategy Canvas
export const currentStrategyCanvasTask = defineTask('current-strategy-canvas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current industry strategy canvas',
  agent: {
    name: 'strategy-canvas-analyst',
    prompt: {
      role: 'blue ocean strategy analyst',
      task: 'Map the current industry strategy canvas showing competitive factors',
      context: args,
      instructions: [
        'Identify key competing factors in the industry',
        'Map company\'s current value curve',
        'Map key competitors\' value curves',
        'Identify industry standards and table stakes',
        'Analyze where competition is currently focused',
        'Identify factors the industry takes for granted',
        'Assess degree of convergence among competitors',
        'Generate strategy canvas visualization',
        'Save strategy canvas to output directory'
      ],
      outputFormat: 'JSON with canvas (competingFactors, companyCurve, competitorCurves), industryStandards, convergenceAreas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['canvas', 'artifacts'],
      properties: {
        canvas: {
          type: 'object',
          properties: {
            competingFactors: { type: 'array', items: { type: 'string' } },
            companyCurve: { type: 'object' },
            competitorCurves: { type: 'array', items: { type: 'object' } }
          }
        },
        industryStandards: { type: 'array', items: { type: 'string' } },
        convergenceAreas: { type: 'array', items: { type: 'string' } },
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

// Task 2: Six Paths Framework
export const sixPathsFrameworkTask = defineTask('six-paths-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Six Paths Framework to reconstruct market boundaries',
  agent: {
    name: 'market-boundary-analyst',
    prompt: {
      role: 'blue ocean strategy consultant',
      task: 'Apply Six Paths Framework to identify opportunities for market reconstruction',
      context: args,
      instructions: [
        'Path 1: Look across alternative industries',
        'Path 2: Look across strategic groups within industries',
        'Path 3: Look across the chain of buyers',
        'Path 4: Look across complementary product and service offerings',
        'Path 5: Look across functional or emotional appeal to buyers',
        'Path 6: Look across time',
        'Identify opportunities from each path',
        'Prioritize most promising reconstruction opportunities',
        'Generate Six Paths analysis report'
      ],
      outputFormat: 'JSON with paths (array with pathNumber, description, opportunities), prioritizedOpportunities, marketReconstructionIdeas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'prioritizedOpportunities', 'artifacts'],
      properties: {
        paths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pathNumber: { type: 'number' },
              pathName: { type: 'string' },
              description: { type: 'string' },
              opportunities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prioritizedOpportunities: { type: 'array', items: { type: 'string' } },
        marketReconstructionIdeas: { type: 'array', items: { type: 'object' } },
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

// Task 3: Four Actions Framework (ERRC)
export const fourActionsFrameworkTask = defineTask('four-actions-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Four Actions Framework (Eliminate-Reduce-Raise-Create)',
  agent: {
    name: 'errc-analyst',
    prompt: {
      role: 'value innovation specialist',
      task: 'Apply Four Actions Framework to create new value curve',
      context: args,
      instructions: [
        'ELIMINATE: Which factors should be eliminated that the industry takes for granted?',
        'REDUCE: Which factors should be reduced well below industry standard?',
        'RAISE: Which factors should be raised well above industry standard?',
        'CREATE: Which factors should be created that the industry has never offered?',
        'Ensure actions break the value-cost trade-off',
        'Validate each action against customer value',
        'Create ERRC grid visualization',
        'Generate Four Actions analysis report'
      ],
      outputFormat: 'JSON with eliminate, reduce, raise, create (arrays of objects with factor, rationale, impact), errcGrid, valueCostBreakthrough, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['eliminate', 'reduce', 'raise', 'create', 'artifacts'],
      properties: {
        eliminate: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              rationale: { type: 'string' },
              costSavings: { type: 'string' }
            }
          }
        },
        reduce: { type: 'array', items: { type: 'object' } },
        raise: { type: 'array', items: { type: 'object' } },
        create: { type: 'array', items: { type: 'object' } },
        errcGrid: { type: 'object' },
        valueCostBreakthrough: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'four-actions']
}));

// Task 4: Three Tiers of Noncustomers Analysis
export const noncustomerAnalysisTask = defineTask('noncustomer-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze three tiers of noncustomers',
  agent: {
    name: 'noncustomer-analyst',
    prompt: {
      role: 'market expansion analyst',
      task: 'Analyze three tiers of noncustomers to unlock new demand',
      context: args,
      instructions: [
        'Tier 1: "Soon-to-be" noncustomers - on edge of market, minimally purchase',
        'Tier 2: "Refusing" noncustomers - consciously chose against market',
        'Tier 3: "Unexplored" noncustomers - in distant markets, never considered',
        'Understand why each tier is not currently customers',
        'Identify commonalities across tiers',
        'Estimate size of each tier',
        'Identify strategies to convert each tier',
        'Calculate total demand expansion potential',
        'Generate noncustomer analysis report'
      ],
      outputFormat: 'JSON with tier1, tier2, tier3 (objects with description, size, reasons, conversionStrategies), totalOpportunity, commonalities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tier1', 'tier2', 'tier3', 'totalOpportunity', 'artifacts'],
      properties: {
        tier1: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            size: { type: 'string' },
            reasons: { type: 'array', items: { type: 'string' } },
            conversionStrategies: { type: 'array', items: { type: 'string' } }
          }
        },
        tier2: { type: 'object' },
        tier3: { type: 'object' },
        totalOpportunity: { type: 'string' },
        commonalities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'noncustomers']
}));

// Task 5: Value Innovation Development
export const valueInnovationTask = defineTask('value-innovation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop value innovation proposition',
  agent: {
    name: 'value-innovation-architect',
    prompt: {
      role: 'value innovation specialist',
      task: 'Synthesize insights into value innovation proposition',
      context: args,
      instructions: [
        'Combine cost reduction (eliminate/reduce) with value increase (raise/create)',
        'Ensure differentiation AND low cost simultaneously',
        'Create compelling value proposition for noncustomers',
        'Articulate the quantum leap in value',
        'Define the new market space created',
        'Validate value innovation against buyer utility',
        'Score innovation magnitude (incremental vs. breakthrough)',
        'Generate value innovation documentation'
      ],
      outputFormat: 'JSON with proposition, summary, costReduction, valueIncrease, targetMarket, innovationScore, quantumLeap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proposition', 'summary', 'innovationScore', 'artifacts'],
      properties: {
        proposition: { type: 'object' },
        summary: { type: 'string' },
        costReduction: { type: 'array', items: { type: 'string' } },
        valueIncrease: { type: 'array', items: { type: 'string' } },
        targetMarket: { type: 'string' },
        innovationScore: { type: 'number', minimum: 0, maximum: 100 },
        quantumLeap: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'value-innovation']
}));

// Task 6: New Strategy Canvas
export const newStrategyCanvasTask = defineTask('new-strategy-canvas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create new strategy canvas with differentiated value curve',
  agent: {
    name: 'new-canvas-creator',
    prompt: {
      role: 'strategy canvas designer',
      task: 'Create new strategy canvas reflecting value innovation',
      context: args,
      instructions: [
        'Remove eliminated factors from canvas',
        'Adjust reduced factors to new lower levels',
        'Adjust raised factors to new higher levels',
        'Add created factors as new dimensions',
        'Visualize new value curve vs. industry average',
        'Highlight divergence from competition',
        'Demonstrate focus, divergence, and compelling tagline',
        'Calculate value gap between old and new curves',
        'Generate new strategy canvas visualization'
      ],
      outputFormat: 'JSON with canvas (newFactors, newValueCurve), valueGap, focus, divergence, compellingTagline, canvasComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['canvas', 'valueGap', 'artifacts'],
      properties: {
        canvas: {
          type: 'object',
          properties: {
            newFactors: { type: 'array', items: { type: 'string' } },
            newValueCurve: { type: 'object' }
          }
        },
        valueGap: { type: 'string' },
        focus: { type: 'string' },
        divergence: { type: 'string' },
        compellingTagline: { type: 'string' },
        canvasComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'new-strategy-canvas']
}));

// Task 7: Blue Ocean Sequence Test
export const blueOceanSequenceTestTask = defineTask('blue-ocean-sequence-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test blue ocean strategy sequence',
  agent: {
    name: 'sequence-tester',
    prompt: {
      role: 'strategy validation specialist',
      task: 'Test blue ocean strategy against the strategic sequence',
      context: args,
      instructions: [
        'Test 1: Buyer Utility - Is there exceptional buyer utility?',
        'Test 2: Price - Is the price accessible to mass of buyers?',
        'Test 3: Cost - Can you attain cost target to profit at strategic price?',
        'Test 4: Adoption - What are adoption hurdles and how to address?',
        'Identify gaps in the sequence',
        'Recommend adjustments for each failed test',
        'Assess overall viability of blue ocean strategy',
        'Generate sequence test report'
      ],
      outputFormat: 'JSON with results (buyerUtility, price, cost, adoption tests), allTestsPassed, gaps, recommendations, overallViability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'allTestsPassed', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            buyerUtility: { type: 'object' },
            price: { type: 'object' },
            cost: { type: 'object' },
            adoption: { type: 'object' }
          }
        },
        allTestsPassed: { type: 'boolean' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        overallViability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'sequence-test']
}));

// Task 8: Blue Ocean Implementation Roadmap
export const blueOceanImplementationTask = defineTask('blue-ocean-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create blue ocean implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'blue ocean implementation specialist',
      task: 'Create implementation roadmap for blue ocean strategy',
      context: args,
      instructions: [
        'Define tipping point leadership approach',
        'Identify cognitive, resource, motivational, political hurdles',
        'Plan fair process for buy-in (engagement, explanation, expectation clarity)',
        'Define implementation phases and milestones',
        'Identify quick wins for early momentum',
        'Plan resource reallocation from red ocean activities',
        'Define success metrics and monitoring approach',
        'Address organizational change requirements',
        'Generate implementation roadmap document'
      ],
      outputFormat: 'JSON with roadmap, phases, hurdlesMitigation, fairProcess, quickWins, resourceReallocation, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'phases', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        hurdlesMitigation: {
          type: 'object',
          properties: {
            cognitive: { type: 'array', items: { type: 'string' } },
            resource: { type: 'array', items: { type: 'string' } },
            motivational: { type: 'array', items: { type: 'string' } },
            political: { type: 'array', items: { type: 'string' } }
          }
        },
        fairProcess: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'string' } },
        resourceReallocation: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blue-ocean', 'implementation']
}));

// Task 9: Blue Ocean Report Generation
export const blueOceanReportTask = defineTask('blue-ocean-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive Blue Ocean Strategy report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and report author',
      task: 'Generate comprehensive Blue Ocean Strategy report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present current vs. new strategy canvas',
        'Document Six Paths analysis',
        'Present Four Actions (ERRC) framework results',
        'Include three tiers of noncustomers analysis',
        'Document value innovation proposition',
        'Present strategic sequence test results',
        'Include implementation roadmap',
        'Add visualizations (strategy canvas, ERRC grid)',
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
  labels: ['agent', 'blue-ocean', 'reporting']
}));
