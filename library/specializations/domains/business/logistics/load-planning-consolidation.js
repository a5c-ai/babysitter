/**
 * @process specializations/domains/business/logistics/load-planning-consolidation
 * @description AI-powered load optimization to maximize trailer utilization, consolidate shipments, and reduce transportation costs through intelligent load building.
 * @inputs { shipments: array, trailers: array, constraints?: object, consolidationRules?: array, priorityShipments?: array }
 * @outputs { success: boolean, loadPlans: array, utilizationMetrics: object, consolidatedShipments: array, costSavings: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/load-planning-consolidation', {
 *   shipments: [{ id: 'S001', weight: 500, dimensions: { l: 48, w: 40, h: 48 }, destination: 'Chicago' }],
 *   trailers: [{ id: 'T001', type: 'dry-van', maxWeight: 45000, dimensions: { l: 53, w: 102, h: 110 } }],
 *   constraints: { maxWeightPerAxle: 20000 }
 * });
 *
 * @references
 * - VROOM Project: https://github.com/VROOM-Project/vroom
 * - Bin Packing Problem: https://en.wikipedia.org/wiki/Bin_packing_problem
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    shipments = [],
    trailers = [],
    constraints = {},
    consolidationRules = [],
    priorityShipments = [],
    stackingRules = {},
    outputDir = 'load-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Load Planning and Consolidation Process');
  ctx.log('info', `Shipments: ${shipments.length}, Trailers: ${trailers.length}`);

  // ============================================================================
  // PHASE 1: SHIPMENT ANALYSIS AND CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing and classifying shipments');

  const shipmentAnalysis = await ctx.task(shipmentAnalysisTask, {
    shipments,
    priorityShipments,
    outputDir
  });

  artifacts.push(...shipmentAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONSOLIDATION OPPORTUNITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying consolidation opportunities');

  const consolidationOpportunities = await ctx.task(consolidationIdentificationTask, {
    classifiedShipments: shipmentAnalysis.classifiedShipments,
    consolidationRules,
    outputDir
  });

  artifacts.push(...consolidationOpportunities.artifacts);

  // ============================================================================
  // PHASE 3: LOAD COMPATIBILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing load compatibility');

  const compatibilityAnalysis = await ctx.task(loadCompatibilityTask, {
    consolidationGroups: consolidationOpportunities.groups,
    stackingRules,
    constraints,
    outputDir
  });

  artifacts.push(...compatibilityAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: 3D BIN PACKING OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Running 3D bin packing optimization');

  const binPacking = await ctx.task(binPackingTask, {
    compatibleLoads: compatibilityAnalysis.compatibleGroups,
    trailers,
    constraints,
    stackingRules,
    outputDir
  });

  artifacts.push(...binPacking.artifacts);

  // Quality Gate: Review load plans
  await ctx.breakpoint({
    question: `Load planning complete. ${binPacking.loadPlans.length} loads created with ${binPacking.averageUtilization}% average utilization. Review load plans?`,
    title: 'Load Planning Results',
    context: {
      runId: ctx.runId,
      loadPlans: binPacking.loadPlans.length,
      averageUtilization: binPacking.averageUtilization,
      unassignedShipments: binPacking.unassignedShipments.length,
      files: binPacking.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: WEIGHT DISTRIBUTION OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing weight distribution');

  const weightDistribution = await ctx.task(weightDistributionTask, {
    loadPlans: binPacking.loadPlans,
    constraints,
    outputDir
  });

  artifacts.push(...weightDistribution.artifacts);

  // ============================================================================
  // PHASE 6: LOADING SEQUENCE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating loading sequences');

  const loadingSequence = await ctx.task(loadingSequenceTask, {
    optimizedLoads: weightDistribution.optimizedLoads,
    deliverySequence: shipmentAnalysis.deliverySequence,
    outputDir
  });

  artifacts.push(...loadingSequence.artifacts);

  // ============================================================================
  // PHASE 7: COST SAVINGS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Calculating cost savings');

  const costSavings = await ctx.task(costSavingsTask, {
    originalShipmentCount: shipments.length,
    finalLoadCount: binPacking.loadPlans.length,
    utilizationMetrics: binPacking.utilizationMetrics,
    outputDir
  });

  artifacts.push(...costSavings.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE LOAD DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating load documentation');

  const loadDocumentation = await ctx.task(loadDocumentationTask, {
    loadPlans: loadingSequence.sequencedLoads,
    shipments,
    trailers,
    outputDir
  });

  artifacts.push(...loadDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Load planning complete. ${shipments.length} shipments consolidated into ${binPacking.loadPlans.length} loads. Estimated savings: $${costSavings.totalSavings}. Approve load plans?`,
    title: 'Final Load Plan Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalShipments: shipments.length,
        totalLoads: binPacking.loadPlans.length,
        averageUtilization: `${binPacking.averageUtilization}%`,
        consolidationRate: `${((1 - binPacking.loadPlans.length / shipments.length) * 100).toFixed(1)}%`,
        estimatedSavings: `$${costSavings.totalSavings}`
      },
      files: [
        { path: loadDocumentation.manifestPath, format: 'json', label: 'Load Manifests' },
        { path: costSavings.reportPath, format: 'markdown', label: 'Savings Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    loadPlans: loadingSequence.sequencedLoads,
    utilizationMetrics: {
      averageWeightUtilization: binPacking.utilizationMetrics.averageWeight,
      averageVolumeUtilization: binPacking.utilizationMetrics.averageVolume,
      averageOverall: binPacking.averageUtilization
    },
    consolidatedShipments: consolidationOpportunities.consolidatedCount,
    costSavings: {
      totalSavings: costSavings.totalSavings,
      savingsPerLoad: costSavings.savingsPerLoad,
      percentageSaved: costSavings.percentageSaved
    },
    unassignedShipments: binPacking.unassignedShipments,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/load-planning-consolidation',
      timestamp: startTime,
      shipmentsProcessed: shipments.length,
      loadsCreated: binPacking.loadPlans.length,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const shipmentAnalysisTask = defineTask('shipment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and classify shipments',
  agent: {
    name: 'shipment-analyst',
    prompt: {
      role: 'Shipment Analysis Specialist',
      task: 'Analyze and classify shipments for load planning',
      context: args,
      instructions: [
        'Calculate actual and dimensional weight',
        'Classify by commodity type',
        'Identify stackable vs non-stackable',
        'Determine handling requirements',
        'Group by destination region',
        'Identify priority shipments',
        'Calculate density ratios',
        'Generate shipment profiles'
      ],
      outputFormat: 'JSON with classified shipments'
    },
    outputSchema: {
      type: 'object',
      required: ['classifiedShipments', 'artifacts'],
      properties: {
        classifiedShipments: { type: 'array' },
        shipmentProfiles: { type: 'object' },
        deliverySequence: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'analysis']
}));

export const consolidationIdentificationTask = defineTask('consolidation-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify consolidation opportunities',
  agent: {
    name: 'consolidation-analyst',
    prompt: {
      role: 'Consolidation Analyst',
      task: 'Identify shipments that can be consolidated',
      context: args,
      instructions: [
        'Group shipments by destination',
        'Apply consolidation rules',
        'Check delivery date compatibility',
        'Verify commodity compatibility',
        'Identify LTL to FTL opportunities',
        'Calculate consolidation benefits',
        'Create consolidation groups',
        'Document consolidation rationale'
      ],
      outputFormat: 'JSON with consolidation groups'
    },
    outputSchema: {
      type: 'object',
      required: ['groups', 'consolidatedCount', 'artifacts'],
      properties: {
        groups: { type: 'array' },
        consolidatedCount: { type: 'number' },
        unconsolidatedShipments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'consolidation']
}));

export const loadCompatibilityTask = defineTask('load-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze load compatibility',
  agent: {
    name: 'compatibility-analyst',
    prompt: {
      role: 'Load Compatibility Analyst',
      task: 'Analyze shipment compatibility for co-loading',
      context: args,
      instructions: [
        'Check commodity compatibility',
        'Apply stacking rules',
        'Verify temperature requirements',
        'Check hazmat compatibility',
        'Verify security requirements',
        'Apply customer-specific rules',
        'Identify incompatible combinations',
        'Create compatible load groups'
      ],
      outputFormat: 'JSON with compatibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['compatibleGroups', 'artifacts'],
      properties: {
        compatibleGroups: { type: 'array' },
        incompatiblePairs: { type: 'array' },
        compatibilityMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'compatibility']
}));

export const binPackingTask = defineTask('bin-packing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run 3D bin packing optimization',
  agent: {
    name: 'bin-packing-optimizer',
    prompt: {
      role: 'Bin Packing Optimization Specialist',
      task: 'Optimize 3D container loading using bin packing algorithms',
      context: args,
      instructions: [
        'Apply 3D bin packing algorithm',
        'Maximize volume utilization',
        'Respect weight constraints',
        'Apply stacking rules',
        'Consider floor loading patterns',
        'Minimize wasted space',
        'Handle irregular shapes',
        'Generate load visualizations'
      ],
      outputFormat: 'JSON with optimized load plans'
    },
    outputSchema: {
      type: 'object',
      required: ['loadPlans', 'averageUtilization', 'artifacts'],
      properties: {
        loadPlans: { type: 'array' },
        averageUtilization: { type: 'number' },
        utilizationMetrics: { type: 'object' },
        unassignedShipments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'bin-packing']
}));

export const weightDistributionTask = defineTask('weight-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize weight distribution',
  agent: {
    name: 'weight-distribution-specialist',
    prompt: {
      role: 'Weight Distribution Specialist',
      task: 'Optimize weight distribution for legal and safe transport',
      context: args,
      instructions: [
        'Calculate axle weights',
        'Verify legal weight limits',
        'Optimize center of gravity',
        'Check bridge formula compliance',
        'Adjust placement for balance',
        'Verify steering axle weight',
        'Check tandems weight',
        'Generate weight distribution diagram'
      ],
      outputFormat: 'JSON with weight-optimized loads'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedLoads', 'artifacts'],
      properties: {
        optimizedLoads: { type: 'array' },
        weightDistributions: { type: 'object' },
        complianceIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'weight-distribution']
}));

export const loadingSequenceTask = defineTask('loading-sequence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate loading sequences',
  agent: {
    name: 'loading-sequence-planner',
    prompt: {
      role: 'Loading Sequence Planner',
      task: 'Generate optimal loading sequences for delivery order',
      context: args,
      instructions: [
        'Order items for LIFO delivery',
        'Consider delivery stop sequence',
        'Plan floor loading pattern',
        'Account for accessibility needs',
        'Generate loading diagram',
        'Create step-by-step instructions',
        'Include handling notes',
        'Optimize unloading time'
      ],
      outputFormat: 'JSON with sequenced load plans'
    },
    outputSchema: {
      type: 'object',
      required: ['sequencedLoads', 'artifacts'],
      properties: {
        sequencedLoads: { type: 'array' },
        loadingInstructions: { type: 'array' },
        loadDiagrams: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'loading-sequence']
}));

export const costSavingsTask = defineTask('cost-savings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate cost savings',
  agent: {
    name: 'cost-savings-analyst',
    prompt: {
      role: 'Cost Savings Analyst',
      task: 'Calculate transportation cost savings from consolidation',
      context: args,
      instructions: [
        'Calculate baseline shipping cost',
        'Calculate consolidated shipping cost',
        'Compute fuel savings',
        'Calculate handling savings',
        'Compute labor savings',
        'Calculate per-load savings',
        'Project annual savings',
        'Generate savings report'
      ],
      outputFormat: 'JSON with cost savings analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSavings', 'reportPath', 'artifacts'],
      properties: {
        totalSavings: { type: 'number' },
        savingsPerLoad: { type: 'number' },
        percentageSaved: { type: 'number' },
        savingsBreakdown: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'cost-savings']
}));

export const loadDocumentationTask = defineTask('load-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate load documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Load Documentation Specialist',
      task: 'Generate comprehensive load documentation',
      context: args,
      instructions: [
        'Create load manifests',
        'Generate bills of lading',
        'Create loading diagrams',
        'Generate packing lists',
        'Include handling instructions',
        'Create seal logs',
        'Generate driver instructions',
        'Create customer documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['manifestPath', 'artifacts'],
      properties: {
        manifestPath: { type: 'string' },
        billsOfLading: { type: 'array' },
        loadDiagrams: { type: 'array' },
        driverInstructions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'load-planning', 'documentation']
}));
