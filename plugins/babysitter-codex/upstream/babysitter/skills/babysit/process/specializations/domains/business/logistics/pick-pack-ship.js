/**
 * @process specializations/domains/business/logistics/pick-pack-ship
 * @description Automated wave planning, pick path optimization, and packing validation to maximize warehouse throughput and order accuracy.
 * @inputs { orders: array, inventory: object, warehouseConfig: object, shiftCapacity?: object, pickingStrategy?: string }
 * @outputs { success: boolean, waves: array, pickLists: array, packingInstructions: array, performanceMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/pick-pack-ship', {
 *   orders: [{ orderId: 'O001', items: [{ sku: 'SKU001', qty: 2 }], priority: 'standard' }],
 *   inventory: { 'SKU001': { location: 'A-01-01', qtyAvailable: 100 } },
 *   warehouseConfig: { zones: ['A', 'B'], packStations: 5 }
 * });
 *
 * @references
 * - WERC Best Practices: https://www.werc.org/
 * - Warehouse Operations: https://www.koganpage.com/logistics-operations-management
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    orders = [],
    inventory,
    warehouseConfig,
    shiftCapacity = {},
    pickingStrategy = 'batch', // 'discrete', 'batch', 'zone', 'wave'
    outputDir = 'pick-pack-ship-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Pick-Pack-Ship Operations Process');
  ctx.log('info', `Orders: ${orders.length}, Strategy: ${pickingStrategy}`);

  // ============================================================================
  // PHASE 1: ORDER ANALYSIS AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing and prioritizing orders');

  const orderAnalysis = await ctx.task(orderAnalysisTask, {
    orders,
    inventory,
    outputDir
  });

  artifacts.push(...orderAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: INVENTORY ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Allocating inventory');

  const inventoryAllocation = await ctx.task(inventoryAllocationTask, {
    prioritizedOrders: orderAnalysis.prioritizedOrders,
    inventory,
    outputDir
  });

  artifacts.push(...inventoryAllocation.artifacts);

  if (inventoryAllocation.shortages.length > 0) {
    ctx.log('warn', `Inventory shortages detected for ${inventoryAllocation.shortages.length} items`);
  }

  // ============================================================================
  // PHASE 3: WAVE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning pick waves');

  const wavePlanning = await ctx.task(wavePlanningTask, {
    allocatedOrders: inventoryAllocation.allocatedOrders,
    warehouseConfig,
    shiftCapacity,
    pickingStrategy,
    outputDir
  });

  artifacts.push(...wavePlanning.artifacts);

  // Quality Gate: Review wave plan
  await ctx.breakpoint({
    question: `Wave planning complete. ${wavePlanning.waves.length} waves created for ${orders.length} orders. Review wave assignments?`,
    title: 'Wave Planning Review',
    context: {
      runId: ctx.runId,
      waves: wavePlanning.waves.length,
      ordersPerWave: wavePlanning.averageOrdersPerWave,
      estimatedDuration: wavePlanning.totalEstimatedTime,
      files: wavePlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: PICK PATH OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Optimizing pick paths');

  const pickPathOptimization = await ctx.task(pickPathOptimizationTask, {
    waves: wavePlanning.waves,
    warehouseConfig,
    inventory,
    outputDir
  });

  artifacts.push(...pickPathOptimization.artifacts);

  // ============================================================================
  // PHASE 5: PICK LIST GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating pick lists');

  const pickListGeneration = await ctx.task(pickListGenerationTask, {
    optimizedWaves: pickPathOptimization.optimizedWaves,
    inventory,
    outputDir
  });

  artifacts.push(...pickListGeneration.artifacts);

  // ============================================================================
  // PHASE 6: PICKING EXECUTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing and validating picks');

  const pickExecution = await ctx.task(pickExecutionTask, {
    pickLists: pickListGeneration.pickLists,
    inventory,
    outputDir
  });

  artifacts.push(...pickExecution.artifacts);

  // ============================================================================
  // PHASE 7: PACK STATION ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assigning pack stations');

  const packStationAssignment = await ctx.task(packStationAssignmentTask, {
    completedPicks: pickExecution.completedPicks,
    warehouseConfig,
    outputDir
  });

  artifacts.push(...packStationAssignment.artifacts);

  // ============================================================================
  // PHASE 8: PACKING INSTRUCTIONS AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating packing instructions');

  const packingInstructions = await ctx.task(packingInstructionsTask, {
    stationAssignments: packStationAssignment.assignments,
    orders,
    outputDir
  });

  artifacts.push(...packingInstructions.artifacts);

  // ============================================================================
  // PHASE 9: CARRIER SELECTION AND LABEL GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Selecting carriers and generating labels');

  const carrierLabelGeneration = await ctx.task(carrierLabelGenerationTask, {
    packedOrders: packingInstructions.packedOrders,
    outputDir
  });

  artifacts.push(...carrierLabelGeneration.artifacts);

  // ============================================================================
  // PHASE 10: SHIP CONFIRMATION AND MANIFEST
  // ============================================================================

  ctx.log('info', 'Phase 10: Confirming shipments and generating manifests');

  const shipConfirmation = await ctx.task(shipConfirmationTask, {
    labeledOrders: carrierLabelGeneration.labeledOrders,
    outputDir
  });

  artifacts.push(...shipConfirmation.artifacts);

  // ============================================================================
  // PHASE 11: PERFORMANCE METRICS AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Calculating performance metrics');

  const performanceMetrics = await ctx.task(performanceMetricsTask, {
    wavePlanning,
    pickExecution,
    packingInstructions,
    shipConfirmation,
    startTime,
    outputDir
  });

  artifacts.push(...performanceMetrics.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Pick-Pack-Ship complete. ${shipConfirmation.shippedOrders.length} orders shipped. Pick accuracy: ${performanceMetrics.metrics.pickAccuracy}%. Finalize?`,
    title: 'Pick-Pack-Ship Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalOrders: orders.length,
        ordersShipped: shipConfirmation.shippedOrders.length,
        pickAccuracy: `${performanceMetrics.metrics.pickAccuracy}%`,
        packAccuracy: `${performanceMetrics.metrics.packAccuracy}%`,
        throughput: `${performanceMetrics.metrics.ordersPerHour} orders/hour`
      },
      files: [
        { path: shipConfirmation.manifestPath, format: 'json', label: 'Ship Manifest' },
        { path: performanceMetrics.reportPath, format: 'markdown', label: 'Performance Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    waves: wavePlanning.waves,
    pickLists: pickListGeneration.pickLists,
    packingInstructions: packingInstructions.instructions,
    performanceMetrics: {
      pickAccuracy: performanceMetrics.metrics.pickAccuracy,
      packAccuracy: performanceMetrics.metrics.packAccuracy,
      ordersPerHour: performanceMetrics.metrics.ordersPerHour,
      linesPerHour: performanceMetrics.metrics.linesPerHour
    },
    shippedOrders: shipConfirmation.shippedOrders,
    shortages: inventoryAllocation.shortages,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/pick-pack-ship',
      timestamp: startTime,
      ordersProcessed: orders.length,
      pickingStrategy,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const orderAnalysisTask = defineTask('order-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and prioritize orders',
  agent: {
    name: 'order-analyst',
    prompt: {
      role: 'Order Analysis Specialist',
      task: 'Analyze orders and determine priority',
      context: args,
      instructions: [
        'Parse order details and line items',
        'Determine order priority (express, standard, economy)',
        'Check cutoff times for same-day shipping',
        'Identify single-line vs multi-line orders',
        'Flag special handling requirements',
        'Calculate order complexity',
        'Sort by priority and cutoff',
        'Generate order priority queue'
      ],
      outputFormat: 'JSON with prioritized orders'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedOrders', 'artifacts'],
      properties: {
        prioritizedOrders: { type: 'array' },
        orderSummary: { type: 'object' },
        specialHandling: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'order-analysis']
}));

export const inventoryAllocationTask = defineTask('inventory-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate inventory to orders',
  agent: {
    name: 'inventory-allocator',
    prompt: {
      role: 'Inventory Allocation Specialist',
      task: 'Allocate available inventory to orders',
      context: args,
      instructions: [
        'Check inventory availability by location',
        'Allocate inventory in priority order',
        'Handle partial allocations',
        'Identify inventory shortages',
        'Select optimal pick locations',
        'Reserve allocated inventory',
        'Document allocation decisions',
        'Generate allocation report'
      ],
      outputFormat: 'JSON with inventory allocations'
    },
    outputSchema: {
      type: 'object',
      required: ['allocatedOrders', 'shortages', 'artifacts'],
      properties: {
        allocatedOrders: { type: 'array' },
        shortages: { type: 'array' },
        partialAllocations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'allocation']
}));

export const wavePlanningTask = defineTask('wave-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan pick waves',
  agent: {
    name: 'wave-planner',
    prompt: {
      role: 'Wave Planning Specialist',
      task: 'Plan optimal pick waves',
      context: args,
      instructions: [
        'Group orders into waves',
        'Balance wave sizes',
        'Consider zone and carrier grouping',
        'Apply picking strategy (batch, zone, wave)',
        'Respect capacity constraints',
        'Sequence waves by priority',
        'Estimate wave duration',
        'Generate wave schedule'
      ],
      outputFormat: 'JSON with wave plans'
    },
    outputSchema: {
      type: 'object',
      required: ['waves', 'averageOrdersPerWave', 'artifacts'],
      properties: {
        waves: { type: 'array' },
        averageOrdersPerWave: { type: 'number' },
        totalEstimatedTime: { type: 'string' },
        waveSchedule: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'wave-planning']
}));

export const pickPathOptimizationTask = defineTask('pick-path-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize pick paths',
  agent: {
    name: 'pick-path-optimizer',
    prompt: {
      role: 'Pick Path Optimization Specialist',
      task: 'Optimize picking paths for efficiency',
      context: args,
      instructions: [
        'Analyze pick locations per wave',
        'Apply TSP algorithm for path optimization',
        'Consider aisle direction rules',
        'Minimize backtracking',
        'Group picks by zone',
        'Sequence picks for LIFO loading',
        'Calculate optimized travel distance',
        'Generate optimized pick sequences'
      ],
      outputFormat: 'JSON with optimized pick paths'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedWaves', 'artifacts'],
      properties: {
        optimizedWaves: { type: 'array' },
        travelDistanceSaved: { type: 'number' },
        pathEfficiency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'path-optimization']
}));

export const pickListGenerationTask = defineTask('pick-list-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate pick lists',
  agent: {
    name: 'pick-list-generator',
    prompt: {
      role: 'Pick List Generation Specialist',
      task: 'Generate detailed pick lists for pickers',
      context: args,
      instructions: [
        'Create pick list per picker/cart',
        'Include location, SKU, quantity',
        'Add product descriptions',
        'Include barcode references',
        'Sequence by optimized path',
        'Include special handling notes',
        'Generate pick labels if needed',
        'Format for mobile devices'
      ],
      outputFormat: 'JSON with pick lists'
    },
    outputSchema: {
      type: 'object',
      required: ['pickLists', 'artifacts'],
      properties: {
        pickLists: { type: 'array' },
        totalLines: { type: 'number' },
        totalUnits: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'pick-lists']
}));

export const pickExecutionTask = defineTask('pick-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute and validate picks',
  agent: {
    name: 'pick-execution-specialist',
    prompt: {
      role: 'Pick Execution Specialist',
      task: 'Execute picks and validate accuracy',
      context: args,
      instructions: [
        'Simulate pick execution',
        'Validate picked items against list',
        'Record pick confirmations',
        'Handle short picks',
        'Log pick exceptions',
        'Update inventory in real-time',
        'Calculate pick accuracy',
        'Generate pick completion report'
      ],
      outputFormat: 'JSON with pick execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['completedPicks', 'artifacts'],
      properties: {
        completedPicks: { type: 'array' },
        shortPicks: { type: 'array' },
        pickExceptions: { type: 'array' },
        pickAccuracy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'pick-execution']
}));

export const packStationAssignmentTask = defineTask('pack-station-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign pack stations',
  agent: {
    name: 'pack-station-assigner',
    prompt: {
      role: 'Pack Station Assignment Specialist',
      task: 'Assign orders to pack stations',
      context: args,
      instructions: [
        'Balance workload across stations',
        'Consider station capabilities',
        'Route by carton type needed',
        'Consider special packing requirements',
        'Minimize queue times',
        'Assign priority orders first',
        'Update station queues',
        'Generate station assignments'
      ],
      outputFormat: 'JSON with pack station assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'artifacts'],
      properties: {
        assignments: { type: 'array' },
        stationWorkloads: { type: 'object' },
        queueTimes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'pack-station']
}));

export const packingInstructionsTask = defineTask('packing-instructions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate packing instructions',
  agent: {
    name: 'packing-instructions-specialist',
    prompt: {
      role: 'Packing Instructions Specialist',
      task: 'Generate packing instructions and validate',
      context: args,
      instructions: [
        'Determine optimal carton size',
        'Calculate dunnage requirements',
        'Generate packing sequence',
        'Include special handling instructions',
        'Add gift wrapping instructions if needed',
        'Generate packing slip',
        'Validate pack against order',
        'Calculate pack accuracy'
      ],
      outputFormat: 'JSON with packing instructions'
    },
    outputSchema: {
      type: 'object',
      required: ['instructions', 'packedOrders', 'artifacts'],
      properties: {
        instructions: { type: 'array' },
        packedOrders: { type: 'array' },
        packAccuracy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'packing']
}));

export const carrierLabelGenerationTask = defineTask('carrier-label-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate carrier labels',
  agent: {
    name: 'label-generation-specialist',
    prompt: {
      role: 'Carrier Label Generation Specialist',
      task: 'Select carriers and generate shipping labels',
      context: args,
      instructions: [
        'Apply carrier selection rules',
        'Rate shop if configured',
        'Generate shipping labels',
        'Generate return labels if needed',
        'Create tracking numbers',
        'Apply to cartons',
        'Validate addresses',
        'Generate label files'
      ],
      outputFormat: 'JSON with labeled orders'
    },
    outputSchema: {
      type: 'object',
      required: ['labeledOrders', 'artifacts'],
      properties: {
        labeledOrders: { type: 'array' },
        labelsByCarrier: { type: 'object' },
        addressErrors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'labels']
}));

export const shipConfirmationTask = defineTask('ship-confirmation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Confirm shipments and generate manifests',
  agent: {
    name: 'ship-confirmation-specialist',
    prompt: {
      role: 'Ship Confirmation Specialist',
      task: 'Confirm shipments and generate carrier manifests',
      context: args,
      instructions: [
        'Confirm shipments with carriers',
        'Generate carrier manifests',
        'Send ship confirmations to customers',
        'Update order status',
        'Record tracking information',
        'Generate end-of-day manifests',
        'Calculate shipping costs',
        'Archive shipping records'
      ],
      outputFormat: 'JSON with ship confirmations'
    },
    outputSchema: {
      type: 'object',
      required: ['shippedOrders', 'manifestPath', 'artifacts'],
      properties: {
        shippedOrders: { type: 'array' },
        manifestPath: { type: 'string' },
        manifestsByCarrier: { type: 'object' },
        totalShippingCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'ship-confirmation']
}));

export const performanceMetricsTask = defineTask('performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate performance metrics',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Performance Metrics Analyst',
      task: 'Calculate pick-pack-ship performance metrics',
      context: args,
      instructions: [
        'Calculate orders per hour',
        'Calculate lines per hour',
        'Calculate units per hour',
        'Calculate pick accuracy',
        'Calculate pack accuracy',
        'Measure cycle times',
        'Compare to targets',
        'Generate performance report'
      ],
      outputFormat: 'JSON with performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'reportPath', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        reportPath: { type: 'string' },
        kpiComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'pick-pack-ship', 'performance']
}));
