/**
 * @process specializations/domains/business/logistics/route-optimization
 * @description AI-driven route planning and optimization to minimize transportation costs, reduce delivery times, and maximize vehicle utilization through dynamic routing algorithms.
 * @inputs { deliveryPoints: array, vehicleFleet: array, constraints?: object, timeWindows?: array, priorityOrders?: array, trafficData?: object }
 * @outputs { success: boolean, optimizedRoutes: array, totalDistance: number, totalTime: number, costSavings: object, vehicleUtilization: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/route-optimization', {
 *   deliveryPoints: [{ id: 'D001', address: '123 Main St', lat: 40.7128, lng: -74.0060 }],
 *   vehicleFleet: [{ id: 'V001', capacity: 1000, startLocation: 'warehouse-1' }],
 *   constraints: { maxDrivingHours: 8, maxStops: 20 },
 *   timeWindows: [{ deliveryId: 'D001', start: '09:00', end: '12:00' }]
 * });
 *
 * @references
 * - Google OR-Tools Routing: https://developers.google.com/optimization/routing
 * - VROOM Project: https://github.com/VROOM-Project/vroom
 * - Vehicle Routing Problem: https://en.wikipedia.org/wiki/Vehicle_routing_problem
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deliveryPoints = [],
    vehicleFleet = [],
    constraints = {},
    timeWindows = [],
    priorityOrders = [],
    trafficData = null,
    depotLocation = null,
    optimizationObjective = 'minimize-distance', // 'minimize-distance', 'minimize-time', 'balance-workload'
    outputDir = 'route-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Route Optimization Process');
  ctx.log('info', `Delivery Points: ${deliveryPoints.length}, Vehicles: ${vehicleFleet.length}`);

  // ============================================================================
  // PHASE 1: DATA VALIDATION AND PREPROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating and preprocessing input data');

  const dataValidation = await ctx.task(dataValidationTask, {
    deliveryPoints,
    vehicleFleet,
    constraints,
    timeWindows,
    depotLocation,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  if (!dataValidation.valid) {
    return {
      success: false,
      error: 'Data validation failed',
      validationErrors: dataValidation.errors,
      artifacts,
      metadata: { processId: 'specializations/domains/business/logistics/route-optimization', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 2: GEOCODING AND DISTANCE MATRIX
  // ============================================================================

  ctx.log('info', 'Phase 2: Computing distance and time matrices');

  const distanceMatrix = await ctx.task(distanceMatrixTask, {
    deliveryPoints: dataValidation.processedDeliveryPoints,
    depotLocation: dataValidation.processedDepot,
    trafficData,
    outputDir
  });

  artifacts.push(...distanceMatrix.artifacts);

  // ============================================================================
  // PHASE 3: CONSTRAINT MODELING
  // ============================================================================

  ctx.log('info', 'Phase 3: Modeling optimization constraints');

  const constraintModel = await ctx.task(constraintModelingTask, {
    deliveryPoints: dataValidation.processedDeliveryPoints,
    vehicleFleet,
    constraints,
    timeWindows,
    priorityOrders,
    distanceMatrix: distanceMatrix.matrix,
    outputDir
  });

  artifacts.push(...constraintModel.artifacts);

  // ============================================================================
  // PHASE 4: ROUTE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Running route optimization algorithm');

  const routeOptimization = await ctx.task(routeOptimizationTask, {
    deliveryPoints: dataValidation.processedDeliveryPoints,
    vehicleFleet,
    distanceMatrix: distanceMatrix.matrix,
    timeMatrix: distanceMatrix.timeMatrix,
    constraintModel: constraintModel.model,
    optimizationObjective,
    outputDir
  });

  artifacts.push(...routeOptimization.artifacts);

  // Quality Gate: Review optimization results
  await ctx.breakpoint({
    question: `Route optimization complete. Total routes: ${routeOptimization.routes.length}. Total distance: ${routeOptimization.totalDistance} km. Estimated savings: ${routeOptimization.estimatedSavings}%. Review routes?`,
    title: 'Route Optimization Results',
    context: {
      runId: ctx.runId,
      summary: {
        totalRoutes: routeOptimization.routes.length,
        totalDistance: routeOptimization.totalDistance,
        totalTime: routeOptimization.totalTime,
        estimatedSavings: routeOptimization.estimatedSavings,
        unassignedDeliveries: routeOptimization.unassignedDeliveries.length
      },
      files: routeOptimization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: ROUTE VALIDATION AND FEASIBILITY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 5: Validating route feasibility');

  const routeValidation = await ctx.task(routeValidationTask, {
    optimizedRoutes: routeOptimization.routes,
    vehicleFleet,
    constraints,
    timeWindows,
    outputDir
  });

  artifacts.push(...routeValidation.artifacts);

  if (!routeValidation.allRoutesFeasible) {
    ctx.log('warn', `Some routes have feasibility issues: ${routeValidation.issues.length}`);
  }

  // ============================================================================
  // PHASE 6: VEHICLE UTILIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing vehicle utilization');

  const utilizationAnalysis = await ctx.task(vehicleUtilizationTask, {
    optimizedRoutes: routeOptimization.routes,
    vehicleFleet,
    outputDir
  });

  artifacts.push(...utilizationAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: COST ANALYSIS AND SAVINGS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Calculating cost savings');

  const costAnalysis = await ctx.task(costAnalysisTask, {
    optimizedRoutes: routeOptimization.routes,
    vehicleFleet,
    distanceMatrix: distanceMatrix.matrix,
    baselineDistance: distanceMatrix.baselineDistance,
    outputDir
  });

  artifacts.push(...costAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE ROUTE INSTRUCTIONS AND MANIFESTS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating route instructions and manifests');

  const routeInstructions = await ctx.task(routeInstructionsTask, {
    optimizedRoutes: routeOptimization.routes,
    deliveryPoints: dataValidation.processedDeliveryPoints,
    vehicleFleet,
    outputDir
  });

  artifacts.push(...routeInstructions.artifacts);

  // Final Breakpoint: Review complete optimization
  await ctx.breakpoint({
    question: `Route optimization complete. ${routeOptimization.routes.length} routes generated for ${deliveryPoints.length} deliveries. Cost savings: $${costAnalysis.totalSavings}. Approve routes for dispatch?`,
    title: 'Final Route Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalRoutes: routeOptimization.routes.length,
        totalDeliveries: deliveryPoints.length,
        totalDistance: `${routeOptimization.totalDistance} km`,
        totalTime: `${routeOptimization.totalTime} hours`,
        costSavings: `$${costAnalysis.totalSavings}`,
        vehicleUtilization: `${utilizationAnalysis.averageUtilization}%`
      },
      files: [
        { path: routeInstructions.manifestPath, format: 'json', label: 'Route Manifests' },
        { path: costAnalysis.reportPath, format: 'markdown', label: 'Cost Analysis Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    optimizedRoutes: routeOptimization.routes,
    totalDistance: routeOptimization.totalDistance,
    totalTime: routeOptimization.totalTime,
    costSavings: {
      totalSavings: costAnalysis.totalSavings,
      percentageSaved: costAnalysis.percentageSaved,
      fuelSavings: costAnalysis.fuelSavings,
      timeSavings: costAnalysis.timeSavings
    },
    vehicleUtilization: {
      averageUtilization: utilizationAnalysis.averageUtilization,
      utilizationByVehicle: utilizationAnalysis.utilizationByVehicle
    },
    unassignedDeliveries: routeOptimization.unassignedDeliveries,
    feasibilityIssues: routeValidation.issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/route-optimization',
      timestamp: startTime,
      deliveryCount: deliveryPoints.length,
      vehicleCount: vehicleFleet.length,
      optimizationObjective,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate and preprocess routing data',
  agent: {
    name: 'logistics-data-analyst',
    prompt: {
      role: 'Logistics Data Analyst',
      task: 'Validate and preprocess delivery points, vehicle fleet, and constraints',
      context: args,
      instructions: [
        'Validate all delivery point addresses and coordinates',
        'Verify vehicle fleet capacity and availability',
        'Check constraint consistency and feasibility',
        'Validate time windows for overlaps and conflicts',
        'Geocode addresses if coordinates not provided',
        'Identify and flag data quality issues',
        'Preprocess data for optimization algorithm',
        'Generate validation report'
      ],
      outputFormat: 'JSON with validation results and processed data'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'processedDeliveryPoints', 'artifacts'],
      properties: {
        valid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        processedDeliveryPoints: { type: 'array' },
        processedDepot: { type: 'object' },
        dataQualityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'validation']
}));

export const distanceMatrixTask = defineTask('distance-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute distance and time matrices',
  agent: {
    name: 'geospatial-analyst',
    prompt: {
      role: 'Geospatial Analyst',
      task: 'Calculate distance and time matrices between all delivery points',
      context: args,
      instructions: [
        'Calculate distances between all point pairs',
        'Compute travel times considering traffic data',
        'Account for road network constraints',
        'Generate asymmetric matrix if one-way streets exist',
        'Calculate baseline distance for comparison',
        'Store matrices efficiently for optimization',
        'Generate matrix visualization'
      ],
      outputFormat: 'JSON with distance and time matrices'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'timeMatrix', 'artifacts'],
      properties: {
        matrix: { type: 'object', description: 'Distance matrix' },
        timeMatrix: { type: 'object', description: 'Travel time matrix' },
        baselineDistance: { type: 'number' },
        totalPoints: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'geospatial']
}));

export const constraintModelingTask = defineTask('constraint-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model optimization constraints',
  agent: {
    name: 'operations-research-analyst',
    prompt: {
      role: 'Operations Research Analyst',
      task: 'Model all constraints for the vehicle routing problem',
      context: args,
      instructions: [
        'Model vehicle capacity constraints',
        'Model time window constraints',
        'Model driver hours of service constraints',
        'Model priority order constraints',
        'Model vehicle-delivery compatibility',
        'Define objective function coefficients',
        'Create constraint matrix for solver',
        'Document constraint definitions'
      ],
      outputFormat: 'JSON with constraint model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'artifacts'],
      properties: {
        model: { type: 'object', description: 'Constraint model for optimization' },
        constraintCount: { type: 'number' },
        hardConstraints: { type: 'array' },
        softConstraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'constraints']
}));

export const routeOptimizationTask = defineTask('route-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run route optimization algorithm',
  agent: {
    name: 'route-optimizer',
    prompt: {
      role: 'Route Optimization Specialist',
      task: 'Execute vehicle routing optimization algorithm',
      context: args,
      instructions: [
        'Apply VRP (Vehicle Routing Problem) optimization',
        'Use appropriate algorithm (Clarke-Wright, genetic, or metaheuristic)',
        'Respect all hard constraints',
        'Optimize for specified objective function',
        'Generate multiple solution candidates',
        'Select best solution based on criteria',
        'Identify unassigned deliveries if any',
        'Calculate route metrics (distance, time, cost)'
      ],
      outputFormat: 'JSON with optimized routes'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'totalDistance', 'totalTime', 'artifacts'],
      properties: {
        routes: { type: 'array', items: { type: 'object' } },
        totalDistance: { type: 'number', description: 'Total distance in km' },
        totalTime: { type: 'number', description: 'Total time in hours' },
        estimatedSavings: { type: 'number', description: 'Percentage savings vs baseline' },
        unassignedDeliveries: { type: 'array' },
        solutionQuality: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'algorithm']
}));

export const routeValidationTask = defineTask('route-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate route feasibility',
  agent: {
    name: 'route-validator',
    prompt: {
      role: 'Route Validation Specialist',
      task: 'Validate feasibility of optimized routes',
      context: args,
      instructions: [
        'Verify all time window constraints are met',
        'Check vehicle capacity not exceeded',
        'Validate driver hours compliance',
        'Verify depot return times',
        'Check for route continuity',
        'Identify any constraint violations',
        'Assess route practicality',
        'Generate validation report'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allRoutesFeasible', 'artifacts'],
      properties: {
        allRoutesFeasible: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        validationScore: { type: 'number' },
        constraintViolations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'validation']
}));

export const vehicleUtilizationTask = defineTask('vehicle-utilization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze vehicle utilization',
  agent: {
    name: 'fleet-analyst',
    prompt: {
      role: 'Fleet Utilization Analyst',
      task: 'Analyze vehicle utilization and efficiency',
      context: args,
      instructions: [
        'Calculate capacity utilization per vehicle',
        'Analyze time utilization per vehicle',
        'Identify underutilized vehicles',
        'Calculate average fleet utilization',
        'Compare to industry benchmarks',
        'Identify optimization opportunities',
        'Generate utilization report'
      ],
      outputFormat: 'JSON with utilization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['averageUtilization', 'utilizationByVehicle', 'artifacts'],
      properties: {
        averageUtilization: { type: 'number' },
        utilizationByVehicle: { type: 'object' },
        underutilizedVehicles: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'utilization']
}));

export const costAnalysisTask = defineTask('cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate cost savings',
  agent: {
    name: 'cost-analyst',
    prompt: {
      role: 'Transportation Cost Analyst',
      task: 'Calculate cost savings from route optimization',
      context: args,
      instructions: [
        'Calculate total transportation costs',
        'Compare optimized vs baseline costs',
        'Calculate fuel savings',
        'Calculate time/labor savings',
        'Calculate vehicle wear savings',
        'Compute ROI of optimization',
        'Generate cost analysis report'
      ],
      outputFormat: 'JSON with cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSavings', 'percentageSaved', 'artifacts'],
      properties: {
        totalSavings: { type: 'number' },
        percentageSaved: { type: 'number' },
        fuelSavings: { type: 'number' },
        timeSavings: { type: 'number' },
        laborSavings: { type: 'number' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'cost-analysis']
}));

export const routeInstructionsTask = defineTask('route-instructions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate route instructions and manifests',
  agent: {
    name: 'route-documentation-specialist',
    prompt: {
      role: 'Route Documentation Specialist',
      task: 'Generate driver instructions and delivery manifests',
      context: args,
      instructions: [
        'Generate turn-by-turn directions for each route',
        'Create delivery manifests with stop details',
        'Include customer contact information',
        'Add special delivery instructions',
        'Generate printable route sheets',
        'Create GPS-compatible route files',
        'Include estimated arrival times',
        'Generate driver assignment summary'
      ],
      outputFormat: 'JSON with route instructions and manifest paths'
    },
    outputSchema: {
      type: 'object',
      required: ['manifestPath', 'artifacts'],
      properties: {
        manifestPath: { type: 'string' },
        routeSheets: { type: 'array' },
        gpsFiles: { type: 'array' },
        driverAssignments: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'route-optimization', 'documentation']
}));
