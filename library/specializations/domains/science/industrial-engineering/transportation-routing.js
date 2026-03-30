/**
 * @process domains/science/industrial-engineering/transportation-routing
 * @description Transportation Route Optimization - Optimize transportation routes and vehicle assignments to minimize
 * cost and time while meeting delivery constraints using routing algorithms and tools.
 * @inputs { networkData: string, deliveryRequirements?: object, vehicleFleet?: array }
 * @outputs { success: boolean, optimizedRoutes: array, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/transportation-routing', {
 *   networkData: 'Delivery network with 50 customers',
 *   deliveryRequirements: { timeWindows: true, maxDrivingTime: 10 },
 *   vehicleFleet: [{ type: 'truck', capacity: 1000, count: 5 }]
 * });
 *
 * @references
 * - Toth & Vigo, Vehicle Routing: Problems, Methods, and Applications
 * - Golden et al., The Vehicle Routing Problem
 * - Google OR-Tools Routing: https://developers.google.com/optimization/routing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    networkData,
    deliveryRequirements = {},
    vehicleFleet = [],
    optimizationObjective = 'minimize-distance',
    outputDir = 'routing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Transportation Route Optimization process');

  // Task 1: Network Definition
  ctx.log('info', 'Phase 1: Defining delivery network and constraints');
  const networkDefinition = await ctx.task(networkDefinitionTask, {
    networkData,
    deliveryRequirements,
    outputDir
  });

  artifacts.push(...networkDefinition.artifacts);

  // Task 2: Data Collection
  ctx.log('info', 'Phase 2: Collecting location and demand data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    networkDefinition,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Task 3: Problem Modeling
  ctx.log('info', 'Phase 3: Modeling routing problem');
  const problemModeling = await ctx.task(problemModelingTask, {
    networkDefinition,
    dataCollection,
    vehicleFleet,
    optimizationObjective,
    outputDir
  });

  artifacts.push(...problemModeling.artifacts);

  // Breakpoint: Review model
  await ctx.breakpoint({
    question: `Routing model created. ${problemModeling.customerCount} customers, ${problemModeling.vehicleCount} vehicles. Problem type: ${problemModeling.problemType}. Proceed with optimization?`,
    title: 'Routing Model Review',
    context: {
      runId: ctx.runId,
      model: {
        customers: problemModeling.customerCount,
        vehicles: problemModeling.vehicleCount,
        problemType: problemModeling.problemType
      },
      files: problemModeling.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Route Optimization
  ctx.log('info', 'Phase 4: Solving routing problem');
  const routeOptimization = await ctx.task(routeOptimizationTask, {
    problemModeling,
    outputDir
  });

  artifacts.push(...routeOptimization.artifacts);

  // Task 5: Solution Analysis
  ctx.log('info', 'Phase 5: Analyzing routing solution');
  const solutionAnalysis = await ctx.task(solutionAnalysisTask, {
    routeOptimization,
    networkDefinition,
    outputDir
  });

  artifacts.push(...solutionAnalysis.artifacts);

  // Task 6: Feasibility Validation
  ctx.log('info', 'Phase 6: Validating solution feasibility');
  const feasibilityValidation = await ctx.task(feasibilityValidationTask, {
    routeOptimization,
    deliveryRequirements,
    outputDir
  });

  artifacts.push(...feasibilityValidation.artifacts);

  // Task 7: Implementation Planning
  ctx.log('info', 'Phase 7: Planning route implementation');
  const implementationPlanning = await ctx.task(routeImplementationTask, {
    routeOptimization,
    solutionAnalysis,
    outputDir
  });

  artifacts.push(...implementationPlanning.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Route optimization complete. Total distance: ${routeOptimization.totalDistance}. ${routeOptimization.routeCount} routes. Improvement vs baseline: ${solutionAnalysis.improvement}%. Review routes?`,
    title: 'Route Optimization Results',
    context: {
      runId: ctx.runId,
      summary: {
        totalDistance: routeOptimization.totalDistance,
        totalTime: routeOptimization.totalTime,
        routeCount: routeOptimization.routeCount,
        improvement: solutionAnalysis.improvement,
        feasible: feasibilityValidation.allConstraintsMet
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    optimizedRoutes: routeOptimization.routes,
    performanceMetrics: {
      totalDistance: routeOptimization.totalDistance,
      totalTime: routeOptimization.totalTime,
      vehicleUtilization: solutionAnalysis.vehicleUtilization,
      improvement: solutionAnalysis.improvement
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/transportation-routing',
      timestamp: startTime,
      optimizationObjective,
      outputDir
    }
  };
}

// Task definitions...
export const networkDefinitionTask = defineTask('network-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define delivery network',
  agent: {
    name: 'network-analyst',
    prompt: {
      role: 'Transportation Network Analyst',
      task: 'Define delivery network structure and constraints',
      context: args,
      instructions: [
        '1. Identify depot location(s)',
        '2. Identify customer locations',
        '3. Define road network or distance matrix',
        '4. Identify time windows if applicable',
        '5. Define vehicle capacity constraints',
        '6. Define driving time constraints',
        '7. Identify special requirements',
        '8. Document network definition'
      ],
      outputFormat: 'JSON with network definition'
    },
    outputSchema: {
      type: 'object',
      required: ['depots', 'customers', 'constraints', 'artifacts'],
      properties: {
        depots: { type: 'array' },
        customers: { type: 'array' },
        distanceMatrix: { type: 'object' },
        timeWindows: { type: 'object' },
        constraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'routing', 'network']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect location and demand data',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'Logistics Data Analyst',
      task: 'Collect and prepare routing data',
      context: args,
      instructions: [
        '1. Collect customer addresses',
        '2. Geocode addresses to coordinates',
        '3. Calculate distance/time matrix',
        '4. Collect demand quantities',
        '5. Collect service time requirements',
        '6. Validate data quality',
        '7. Create location database',
        '8. Document data collection'
      ],
      outputFormat: 'JSON with collected data'
    },
    outputSchema: {
      type: 'object',
      required: ['locations', 'demands', 'distanceMatrix', 'artifacts'],
      properties: {
        locations: { type: 'array' },
        demands: { type: 'object' },
        serviceTimes: { type: 'object' },
        distanceMatrix: { type: 'object' },
        timeMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'routing', 'data']
}));

export const problemModelingTask = defineTask('problem-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model routing problem',
  agent: {
    name: 'routing-modeler',
    prompt: {
      role: 'Operations Research Analyst',
      task: 'Formulate vehicle routing problem model',
      context: args,
      instructions: [
        '1. Determine VRP variant (CVRP, VRPTW, etc.)',
        '2. Define decision variables',
        '3. Formulate objective function',
        '4. Add capacity constraints',
        '5. Add time window constraints',
        '6. Add any special constraints',
        '7. Create model formulation',
        '8. Document model'
      ],
      outputFormat: 'JSON with routing model'
    },
    outputSchema: {
      type: 'object',
      required: ['problemType', 'customerCount', 'vehicleCount', 'modelFormulation', 'artifacts'],
      properties: {
        problemType: { type: 'string' },
        customerCount: { type: 'number' },
        vehicleCount: { type: 'number' },
        modelFormulation: { type: 'object' },
        constraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'routing', 'modeling']
}));

export const routeOptimizationTask = defineTask('route-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solve routing problem',
  agent: {
    name: 'route-optimizer',
    prompt: {
      role: 'Routing Optimization Specialist',
      task: 'Solve vehicle routing problem using algorithms',
      context: args,
      instructions: [
        '1. Select solving approach',
        '2. Apply construction heuristic',
        '3. Apply improvement heuristic',
        '4. Run metaheuristic if needed',
        '5. Extract routes from solution',
        '6. Calculate route metrics',
        '7. Generate route visualizations',
        '8. Document solution'
      ],
      outputFormat: 'JSON with optimized routes'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'totalDistance', 'totalTime', 'routeCount', 'artifacts'],
      properties: {
        routes: { type: 'array' },
        totalDistance: { type: 'number' },
        totalTime: { type: 'number' },
        routeCount: { type: 'number' },
        solutionQuality: { type: 'number' },
        routeMaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'routing', 'optimization']
}));

export const solutionAnalysisTask = defineTask('solution-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze routing solution',
  agent: {
    name: 'solution-analyst',
    prompt: {
      role: 'Transportation Analyst',
      task: 'Analyze routing solution performance',
      context: args,
      instructions: [
        '1. Compare to baseline/current routes',
        '2. Calculate improvement percentage',
        '3. Analyze vehicle utilization',
        '4. Analyze route balance',
        '5. Identify any issues',
        '6. Calculate cost savings',
        '7. Create analysis report',
        '8. Document analysis'
      ],
      outputFormat: 'JSON with solution analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['improvement', 'vehicleUtilization', 'costSavings', 'artifacts'],
      properties: {
        baselineComparison: { type: 'object' },
        improvement: { type: 'number' },
        vehicleUtilization: { type: 'object' },
        routeBalance: { type: 'object' },
        costSavings: { type: 'number' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'routing', 'analysis']
}));

export const feasibilityValidationTask = defineTask('feasibility-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate solution feasibility',
  agent: {
    name: 'feasibility-validator',
    prompt: {
      role: 'Operations Validator',
      task: 'Validate routes meet all constraints',
      context: args,
      instructions: [
        '1. Check capacity constraints',
        '2. Check time window constraints',
        '3. Check driving time limits',
        '4. Check vehicle compatibility',
        '5. Verify route connectivity',
        '6. Check practical feasibility',
        '7. Get driver feedback if possible',
        '8. Document validation'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allConstraintsMet', 'violations', 'artifacts'],
      properties: {
        allConstraintsMet: { type: 'boolean' },
        capacityCheck: { type: 'object' },
        timeWindowCheck: { type: 'object' },
        drivingTimeCheck: { type: 'object' },
        violations: { type: 'array' },
        practicalIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'routing', 'validation']
}));

export const routeImplementationTask = defineTask('route-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan route implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Transportation Manager',
      task: 'Plan implementation of optimized routes',
      context: args,
      instructions: [
        '1. Create driver route sheets',
        '2. Plan vehicle assignments',
        '3. Create turn-by-turn directions',
        '4. Set up GPS/telematics',
        '5. Plan driver communication',
        '6. Define exception handling',
        '7. Create tracking system',
        '8. Document implementation'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['routeSheets', 'vehicleAssignments', 'trackingPlan', 'artifacts'],
      properties: {
        routeSheets: { type: 'array' },
        vehicleAssignments: { type: 'object' },
        directions: { type: 'array' },
        telematicsPlan: { type: 'object' },
        communicationPlan: { type: 'object' },
        exceptionProcess: { type: 'object' },
        trackingPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'routing', 'implementation']
}));
