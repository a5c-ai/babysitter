/**
 * @process specializations/domains/business/logistics/slotting-optimization
 * @description AI-driven warehouse slotting to optimize product placement based on velocity, pick frequency, ergonomics, and operational efficiency.
 * @inputs { products: array, warehouseLayout: object, pickData?: array, ergonomicRules?: object, slottingStrategy?: string }
 * @outputs { success: boolean, slottingPlan: array, efficiencyMetrics: object, expectedSavings: object, implementationPlan: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/slotting-optimization', {
 *   products: [{ sku: 'SKU001', velocity: 'A', dimensions: { l: 12, w: 8, h: 6 }, weight: 5 }],
 *   warehouseLayout: { zones: ['A', 'B', 'C'], aisles: 10, levels: 4 },
 *   pickData: [{ sku: 'SKU001', picksPerDay: 50 }]
 * });
 *
 * @references
 * - World Class Warehousing: https://www.mheducation.com/highered/product/world-class-warehousing-material-handling-frazelle/M9780071376006.html
 * - Warehouse Slotting Best Practices: https://www.werc.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    products = [],
    warehouseLayout,
    pickData = [],
    ergonomicRules = {},
    slottingStrategy = 'velocity-based', // 'velocity-based', 'family-grouping', 'golden-zone'
    outputDir = 'slotting-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Slotting Optimization Process');
  ctx.log('info', `Products: ${products.length}, Strategy: ${slottingStrategy}`);

  // ============================================================================
  // PHASE 1: PRODUCT VELOCITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing product velocity');

  const velocityAnalysis = await ctx.task(velocityAnalysisTask, {
    products,
    pickData,
    outputDir
  });

  artifacts.push(...velocityAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: ABC-XYZ CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing ABC-XYZ classification');

  const abcxyzClassification = await ctx.task(abcxyzClassificationTask, {
    products,
    velocityAnalysis: velocityAnalysis.velocityData,
    outputDir
  });

  artifacts.push(...abcxyzClassification.artifacts);

  // ============================================================================
  // PHASE 3: WAREHOUSE ZONE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping warehouse zones');

  const zoneMapping = await ctx.task(zoneMappingTask, {
    warehouseLayout,
    ergonomicRules,
    outputDir
  });

  artifacts.push(...zoneMapping.artifacts);

  // ============================================================================
  // PHASE 4: ERGONOMIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing ergonomic factors');

  const ergonomicAnalysis = await ctx.task(ergonomicAnalysisTask, {
    products,
    zoneMapping: zoneMapping.zones,
    ergonomicRules,
    outputDir
  });

  artifacts.push(...ergonomicAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: SLOTTING ALGORITHM EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Running slotting algorithm');

  const slottingAlgorithm = await ctx.task(slottingAlgorithmTask, {
    products,
    abcxyzClassification: abcxyzClassification.classifications,
    zoneMapping: zoneMapping.zones,
    ergonomicAnalysis: ergonomicAnalysis.recommendations,
    slottingStrategy,
    outputDir
  });

  artifacts.push(...slottingAlgorithm.artifacts);

  // Quality Gate: Review slotting plan
  await ctx.breakpoint({
    question: `Slotting plan generated for ${products.length} products. Expected pick efficiency improvement: ${slottingAlgorithm.expectedImprovement}%. Review plan?`,
    title: 'Slotting Plan Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalProducts: products.length,
        productsRelocated: slottingAlgorithm.relocations.length,
        expectedImprovement: slottingAlgorithm.expectedImprovement
      },
      files: slottingAlgorithm.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 6: FAMILY GROUPING OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Optimizing family groupings');

  const familyGrouping = await ctx.task(familyGroupingTask, {
    slottingPlan: slottingAlgorithm.plan,
    products,
    pickData,
    outputDir
  });

  artifacts.push(...familyGrouping.artifacts);

  // ============================================================================
  // PHASE 7: TRAVEL DISTANCE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Calculating travel distances');

  const travelCalculation = await ctx.task(travelDistanceTask, {
    currentSlotting: inputs.currentSlotting,
    proposedSlotting: familyGrouping.optimizedPlan,
    warehouseLayout,
    pickData,
    outputDir
  });

  artifacts.push(...travelCalculation.artifacts);

  // ============================================================================
  // PHASE 8: EFFICIENCY METRICS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Calculating efficiency metrics');

  const efficiencyMetrics = await ctx.task(efficiencyMetricsTask, {
    currentSlotting: inputs.currentSlotting,
    proposedSlotting: familyGrouping.optimizedPlan,
    travelCalculation,
    pickData,
    outputDir
  });

  artifacts.push(...efficiencyMetrics.artifacts);

  // ============================================================================
  // PHASE 9: IMPLEMENTATION PLAN GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating implementation plan');

  const implementationPlan = await ctx.task(implementationPlanTask, {
    relocations: slottingAlgorithm.relocations,
    products,
    warehouseLayout,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 10: ROI AND SAVINGS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Calculating ROI and savings');

  const roiCalculation = await ctx.task(roiCalculationTask, {
    efficiencyMetrics: efficiencyMetrics.metrics,
    implementationPlan: implementationPlan.plan,
    laborCosts: inputs.laborCosts,
    outputDir
  });

  artifacts.push(...roiCalculation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Slotting optimization complete. ${slottingAlgorithm.relocations.length} products to relocate. Expected annual savings: $${roiCalculation.annualSavings}. Approve implementation plan?`,
    title: 'Slotting Optimization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalProducts: products.length,
        productsToRelocate: slottingAlgorithm.relocations.length,
        travelReduction: `${travelCalculation.travelReduction}%`,
        pickEfficiencyGain: `${efficiencyMetrics.metrics.pickEfficiencyGain}%`,
        annualSavings: `$${roiCalculation.annualSavings}`,
        paybackPeriod: `${roiCalculation.paybackMonths} months`
      },
      files: [
        { path: implementationPlan.planPath, format: 'json', label: 'Implementation Plan' },
        { path: roiCalculation.reportPath, format: 'markdown', label: 'ROI Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    slottingPlan: familyGrouping.optimizedPlan,
    efficiencyMetrics: {
      travelReduction: travelCalculation.travelReduction,
      pickEfficiencyGain: efficiencyMetrics.metrics.pickEfficiencyGain,
      ergonomicScore: ergonomicAnalysis.overallScore
    },
    expectedSavings: {
      annualSavings: roiCalculation.annualSavings,
      laborSavings: roiCalculation.laborSavings,
      paybackPeriod: roiCalculation.paybackMonths
    },
    implementationPlan: implementationPlan.plan,
    relocations: slottingAlgorithm.relocations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/slotting-optimization',
      timestamp: startTime,
      productsAnalyzed: products.length,
      slottingStrategy,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const velocityAnalysisTask = defineTask('velocity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze product velocity',
  agent: {
    name: 'velocity-analyst',
    prompt: {
      role: 'Velocity Analysis Specialist',
      task: 'Analyze product picking velocity and movement patterns',
      context: args,
      instructions: [
        'Calculate picks per day/week for each product',
        'Identify seasonal velocity variations',
        'Calculate cube movement rate',
        'Identify velocity outliers',
        'Determine fast, medium, slow movers',
        'Analyze pick frequency distribution',
        'Generate velocity profile',
        'Document velocity patterns'
      ],
      outputFormat: 'JSON with velocity analysis data'
    },
    outputSchema: {
      type: 'object',
      required: ['velocityData', 'artifacts'],
      properties: {
        velocityData: { type: 'array' },
        fastMovers: { type: 'array' },
        slowMovers: { type: 'array' },
        velocityDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'velocity']
}));

export const abcxyzClassificationTask = defineTask('abcxyz-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform ABC-XYZ classification',
  agent: {
    name: 'classification-specialist',
    prompt: {
      role: 'ABC-XYZ Classification Specialist',
      task: 'Classify products using ABC (value) and XYZ (demand variability) analysis',
      context: args,
      instructions: [
        'Perform ABC analysis by pick frequency/value',
        'Perform XYZ analysis by demand variability',
        'Combine into matrix classification',
        'Identify AX items (high value, stable demand)',
        'Identify CZ items (low value, variable demand)',
        'Recommend slot type by classification',
        'Generate classification report',
        'Document classification methodology'
      ],
      outputFormat: 'JSON with ABC-XYZ classifications'
    },
    outputSchema: {
      type: 'object',
      required: ['classifications', 'artifacts'],
      properties: {
        classifications: { type: 'array' },
        classificationMatrix: { type: 'object' },
        slotRecommendations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'classification']
}));

export const zoneMappingTask = defineTask('zone-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map warehouse zones',
  agent: {
    name: 'zone-mapping-specialist',
    prompt: {
      role: 'Warehouse Zone Mapping Specialist',
      task: 'Map warehouse zones and their characteristics',
      context: args,
      instructions: [
        'Define zone boundaries',
        'Identify golden zone locations (waist-height)',
        'Map ergonomic zones by height',
        'Calculate zone capacities',
        'Determine zone accessibility',
        'Map proximity to dock doors',
        'Identify forward pick vs reserve areas',
        'Generate zone map'
      ],
      outputFormat: 'JSON with zone mapping data'
    },
    outputSchema: {
      type: 'object',
      required: ['zones', 'artifacts'],
      properties: {
        zones: { type: 'array' },
        goldenZone: { type: 'object' },
        zoneCapacities: { type: 'object' },
        zoneMap: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'zone-mapping']
}));

export const ergonomicAnalysisTask = defineTask('ergonomic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze ergonomic factors',
  agent: {
    name: 'ergonomic-analyst',
    prompt: {
      role: 'Warehouse Ergonomics Specialist',
      task: 'Analyze ergonomic factors for slotting decisions',
      context: args,
      instructions: [
        'Assess product weight vs slot height',
        'Apply golden zone principle',
        'Consider reach distances',
        'Evaluate bending/lifting requirements',
        'Check heavy item placement rules',
        'Apply NIOSH lifting guidelines',
        'Score ergonomic risk by location',
        'Generate ergonomic recommendations'
      ],
      outputFormat: 'JSON with ergonomic analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'overallScore', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        overallScore: { type: 'number' },
        riskAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'ergonomics']
}));

export const slottingAlgorithmTask = defineTask('slotting-algorithm', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run slotting algorithm',
  agent: {
    name: 'slotting-optimizer',
    prompt: {
      role: 'Slotting Algorithm Specialist',
      task: 'Execute optimal slotting algorithm',
      context: args,
      instructions: [
        'Apply selected slotting strategy',
        'Place fast movers in golden zone',
        'Respect product-slot compatibility',
        'Apply ergonomic constraints',
        'Minimize travel distance',
        'Balance zone utilization',
        'Generate slot assignments',
        'Calculate expected improvement'
      ],
      outputFormat: 'JSON with slotting plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'relocations', 'expectedImprovement', 'artifacts'],
      properties: {
        plan: { type: 'array' },
        relocations: { type: 'array' },
        expectedImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'algorithm']
}));

export const familyGroupingTask = defineTask('family-grouping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize family groupings',
  agent: {
    name: 'family-grouping-specialist',
    prompt: {
      role: 'Family Grouping Specialist',
      task: 'Optimize product family groupings for picking efficiency',
      context: args,
      instructions: [
        'Identify frequently co-picked items',
        'Group by product family/category',
        'Analyze order affinity patterns',
        'Position related items adjacently',
        'Optimize for zone picking',
        'Consider kit assembly groupings',
        'Refine slot assignments',
        'Document family groupings'
      ],
      outputFormat: 'JSON with optimized family groupings'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedPlan', 'artifacts'],
      properties: {
        optimizedPlan: { type: 'array' },
        familyGroups: { type: 'array' },
        coPickAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'family-grouping']
}));

export const travelDistanceTask = defineTask('travel-distance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate travel distances',
  agent: {
    name: 'travel-distance-analyst',
    prompt: {
      role: 'Travel Distance Analyst',
      task: 'Calculate and compare travel distances',
      context: args,
      instructions: [
        'Calculate current pick path distances',
        'Calculate proposed pick path distances',
        'Model typical order profiles',
        'Calculate travel time savings',
        'Analyze by zone and aisle',
        'Compare batch vs discrete picking',
        'Generate distance comparison',
        'Calculate travel reduction percentage'
      ],
      outputFormat: 'JSON with travel distance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['travelReduction', 'artifacts'],
      properties: {
        currentDistance: { type: 'number' },
        proposedDistance: { type: 'number' },
        travelReduction: { type: 'number' },
        timeSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'travel-distance']
}));

export const efficiencyMetricsTask = defineTask('efficiency-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate efficiency metrics',
  agent: {
    name: 'efficiency-metrics-analyst',
    prompt: {
      role: 'Efficiency Metrics Analyst',
      task: 'Calculate slotting efficiency metrics',
      context: args,
      instructions: [
        'Calculate pick rate improvement',
        'Calculate picks per hour gain',
        'Measure golden zone utilization',
        'Calculate cube utilization efficiency',
        'Measure velocity-zone alignment',
        'Calculate ergonomic improvement',
        'Generate efficiency scorecard',
        'Compare to industry benchmarks'
      ],
      outputFormat: 'JSON with efficiency metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        scorecard: { type: 'object' },
        benchmarkComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'efficiency']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Implementation Planner',
      task: 'Generate detailed slotting implementation plan',
      context: args,
      instructions: [
        'Sequence relocations by priority',
        'Plan wave-based implementation',
        'Schedule during low-activity periods',
        'Calculate labor requirements',
        'Plan equipment needs',
        'Create move sequences',
        'Generate work instructions',
        'Estimate implementation timeline'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'planPath', 'artifacts'],
      properties: {
        plan: { type: 'array' },
        planPath: { type: 'string' },
        timeline: { type: 'object' },
        laborHours: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'implementation']
}));

export const roiCalculationTask = defineTask('roi-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate ROI and savings',
  agent: {
    name: 'roi-analyst',
    prompt: {
      role: 'ROI Analysis Specialist',
      task: 'Calculate return on investment for slotting optimization',
      context: args,
      instructions: [
        'Calculate implementation costs',
        'Calculate labor savings (picks/hour)',
        'Calculate injury reduction savings',
        'Calculate space optimization value',
        'Calculate annual net savings',
        'Calculate payback period',
        'Compute NPV and IRR',
        'Generate ROI report'
      ],
      outputFormat: 'JSON with ROI analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['annualSavings', 'paybackMonths', 'reportPath', 'artifacts'],
      properties: {
        annualSavings: { type: 'number' },
        laborSavings: { type: 'number' },
        implementationCost: { type: 'number' },
        paybackMonths: { type: 'number' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'slotting', 'roi']
}));
