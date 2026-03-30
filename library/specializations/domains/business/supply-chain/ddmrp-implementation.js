/**
 * @process specializations/domains/business/supply-chain/ddmrp-implementation
 * @description Demand-Driven Material Requirements Planning (DDMRP) - Implement strategic inventory buffers
 * with dynamic adjustment based on demand signals for improved flow and reduced variability amplification.
 * @inputs { billOfMaterials?: object, demandData?: object, leadTimes?: object, currentInventory?: object }
 * @outputs { success: boolean, bufferDesign: object, positioningResults: object, dynamicAdjustments: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/ddmrp-implementation', {
 *   billOfMaterials: { items: [...], structure: {...} },
 *   demandData: { independent: [...], dependent: [...] },
 *   leadTimes: { decoupled: {...}, cumulative: {...} },
 *   currentInventory: { levels: {...} }
 * });
 *
 * @references
 * - Demand Driven Institute Certification: https://www.demanddriveninstitute.com/certification
 * - DDMRP Book: https://www.demanddriveninstitute.com/books
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    billOfMaterials = {},
    demandData = {},
    leadTimes = {},
    currentInventory = {},
    variabilityFactors = {},
    outputDir = 'ddmrp-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting DDMRP Implementation Process');

  // ============================================================================
  // PHASE 1: STRATEGIC INVENTORY POSITIONING
  // ============================================================================

  ctx.log('info', 'Phase 1: Determining strategic inventory positions');

  const inventoryPositioning = await ctx.task(strategicPositioningTask, {
    billOfMaterials,
    leadTimes,
    demandData,
    outputDir
  });

  artifacts.push(...inventoryPositioning.artifacts);

  // ============================================================================
  // PHASE 2: BUFFER PROFILE DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Determining buffer profiles');

  const bufferProfiles = await ctx.task(bufferProfileTask, {
    inventoryPositioning,
    demandData,
    variabilityFactors,
    outputDir
  });

  artifacts.push(...bufferProfiles.artifacts);

  // ============================================================================
  // PHASE 3: BUFFER SIZING (ZONES)
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating buffer zones');

  const bufferSizing = await ctx.task(bufferSizingTask, {
    inventoryPositioning,
    bufferProfiles,
    demandData,
    leadTimes,
    outputDir
  });

  artifacts.push(...bufferSizing.artifacts);

  // Breakpoint: Review buffer design
  await ctx.breakpoint({
    question: `Buffer design complete. ${bufferSizing.bufferCount} buffers sized. Total buffer investment: $${bufferSizing.totalInvestment}. Review buffer design?`,
    title: 'DDMRP Buffer Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        bufferCount: bufferSizing.bufferCount,
        totalInvestment: bufferSizing.totalInvestment,
        avgLeadTimeReduction: bufferSizing.avgLeadTimeReduction
      }
    }
  });

  // ============================================================================
  // PHASE 4: DYNAMIC ADJUSTMENT FACTORS
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring dynamic adjustment factors');

  const dynamicAdjustments = await ctx.task(dynamicAdjustmentTask, {
    bufferSizing,
    demandData,
    variabilityFactors,
    outputDir
  });

  artifacts.push(...dynamicAdjustments.artifacts);

  // ============================================================================
  // PHASE 5: DEMAND-DRIVEN PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing demand-driven planning');

  const demandDrivenPlanning = await ctx.task(demandDrivenPlanningTask, {
    bufferSizing,
    dynamicAdjustments,
    currentInventory,
    demandData,
    outputDir
  });

  artifacts.push(...demandDrivenPlanning.artifacts);

  // ============================================================================
  // PHASE 6: VISIBLE AND COLLABORATIVE EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up execution visibility');

  const executionSetup = await ctx.task(executionVisibilityTask, {
    bufferSizing,
    demandDrivenPlanning,
    outputDir
  });

  artifacts.push(...executionSetup.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining performance measurement');

  const performanceMeasurement = await ctx.task(performanceMeasurementTask, {
    bufferSizing,
    demandDrivenPlanning,
    executionSetup,
    outputDir
  });

  artifacts.push(...performanceMeasurement.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    bufferDesign: {
      bufferCount: bufferSizing.bufferCount,
      totalInvestment: bufferSizing.totalInvestment,
      buffersByItem: bufferSizing.buffersByItem,
      zones: bufferSizing.zones
    },
    positioningResults: {
      decouplingPoints: inventoryPositioning.decouplingPoints,
      leadTimeReduction: inventoryPositioning.leadTimeReduction,
      positioningCriteria: inventoryPositioning.criteria
    },
    dynamicAdjustments: {
      demandAdjustmentFactors: dynamicAdjustments.daf,
      plannedAdjustmentFactors: dynamicAdjustments.paf,
      seasonalFactors: dynamicAdjustments.seasonalFactors
    },
    execution: {
      alertThresholds: executionSetup.alertThresholds,
      prioritizationRules: executionSetup.prioritizationRules
    },
    metrics: performanceMeasurement.kpis,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/ddmrp-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const strategicPositioningTask = defineTask('strategic-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Strategic Inventory Positioning',
  agent: {
    name: 'ddmrp-positioning-analyst',
    prompt: {
      role: 'DDMRP Positioning Specialist',
      task: 'Determine strategic inventory decoupling points',
      context: args,
      instructions: [
        '1. Analyze bill of materials structure',
        '2. Identify longest cumulative lead times',
        '3. Apply decoupling point criteria',
        '4. Evaluate customer tolerance time',
        '5. Identify market potential leverage points',
        '6. Analyze variability amplification points',
        '7. Determine decoupling points',
        '8. Calculate lead time compression'
      ],
      outputFormat: 'JSON with strategic positioning results'
    },
    outputSchema: {
      type: 'object',
      required: ['decouplingPoints', 'leadTimeReduction', 'artifacts'],
      properties: {
        decouplingPoints: { type: 'array' },
        leadTimeReduction: { type: 'object' },
        criteria: { type: 'object' },
        bomAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'ddmrp', 'positioning']
}));

export const bufferProfileTask = defineTask('buffer-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Buffer Profile Determination',
  agent: {
    name: 'buffer-profile-analyst',
    prompt: {
      role: 'DDMRP Buffer Profile Analyst',
      task: 'Determine buffer profiles for decoupled items',
      context: args,
      instructions: [
        '1. Categorize items by demand variability (high/medium/low)',
        '2. Categorize items by lead time (long/medium/short)',
        '3. Determine order spike threshold',
        '4. Assign buffer profile codes',
        '5. Set lead time factor ranges',
        '6. Set variability factor ranges',
        '7. Validate profile assignments',
        '8. Document buffer profiles'
      ],
      outputFormat: 'JSON with buffer profiles'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'profileAssignments', 'artifacts'],
      properties: {
        profiles: { type: 'object' },
        profileAssignments: { type: 'object' },
        demandCategories: { type: 'object' },
        leadTimeCategories: { type: 'object' },
        spikeThresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'ddmrp', 'buffer-profile']
}));

export const bufferSizingTask = defineTask('buffer-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Buffer Sizing (Zones)',
  agent: {
    name: 'buffer-sizing-analyst',
    prompt: {
      role: 'DDMRP Buffer Sizing Specialist',
      task: 'Calculate buffer zones (green, yellow, red)',
      context: args,
      instructions: [
        '1. Calculate average daily usage (ADU)',
        '2. Calculate green zone (order cycle + safety)',
        '3. Calculate yellow zone (lead time demand)',
        '4. Calculate red zone (red base + red safety)',
        '5. Determine top of green (TOG)',
        '6. Determine top of yellow (TOY)',
        '7. Determine top of red (TOR)',
        '8. Calculate total buffer investment'
      ],
      outputFormat: 'JSON with buffer sizing'
    },
    outputSchema: {
      type: 'object',
      required: ['buffersByItem', 'zones', 'bufferCount', 'totalInvestment', 'artifacts'],
      properties: {
        buffersByItem: { type: 'object' },
        zones: { type: 'object' },
        bufferCount: { type: 'number' },
        totalInvestment: { type: 'number' },
        avgLeadTimeReduction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'ddmrp', 'buffer-sizing']
}));

export const dynamicAdjustmentTask = defineTask('dynamic-adjustment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Dynamic Adjustment Factors',
  agent: {
    name: 'dynamic-adjustment-analyst',
    prompt: {
      role: 'DDMRP Dynamic Adjustment Specialist',
      task: 'Configure dynamic adjustment factors for buffers',
      context: args,
      instructions: [
        '1. Define Demand Adjustment Factors (DAF)',
        '2. Configure seasonal adjustment zones',
        '3. Define Planned Adjustment Factors (PAF)',
        '4. Set ramp-up/ramp-down periods',
        '5. Configure threshold triggers',
        '6. Define recalculation frequency',
        '7. Set guardrails and limits',
        '8. Document adjustment policies'
      ],
      outputFormat: 'JSON with dynamic adjustment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['daf', 'paf', 'seasonalFactors', 'artifacts'],
      properties: {
        daf: { type: 'object' },
        paf: { type: 'object' },
        seasonalFactors: { type: 'object' },
        thresholdTriggers: { type: 'object' },
        recalculationRules: { type: 'object' },
        guardrails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'ddmrp', 'dynamic-adjustment']
}));

export const demandDrivenPlanningTask = defineTask('demand-driven-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Demand-Driven Planning',
  agent: {
    name: 'ddmrp-planner',
    prompt: {
      role: 'DDMRP Planning Specialist',
      task: 'Implement demand-driven planning process',
      context: args,
      instructions: [
        '1. Calculate Net Flow Position (NFP)',
        '2. Apply net flow equation (OH + OO - QDR)',
        '3. Generate supply orders when NFP < TOY',
        '4. Calculate recommended order quantities',
        '5. Handle qualified demand (spikes)',
        '6. Prioritize supply orders by zone',
        '7. Apply decoupled explosion',
        '8. Document planning process'
      ],
      outputFormat: 'JSON with demand-driven planning setup'
    },
    outputSchema: {
      type: 'object',
      required: ['netFlowPositions', 'supplyOrders', 'artifacts'],
      properties: {
        netFlowPositions: { type: 'object' },
        supplyOrders: { type: 'array' },
        qualifiedDemand: { type: 'array' },
        orderPriorities: { type: 'object' },
        planningRules: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'ddmrp', 'planning']
}));

export const executionVisibilityTask = defineTask('execution-visibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Visible and Collaborative Execution',
  agent: {
    name: 'execution-specialist',
    prompt: {
      role: 'DDMRP Execution Specialist',
      task: 'Set up visible and collaborative execution',
      context: args,
      instructions: [
        '1. Define buffer status alerts (green/yellow/red)',
        '2. Configure execution alerts and notifications',
        '3. Set up synchronization alerts',
        '4. Define priority sequencing rules',
        '5. Configure buffer penetration alerts',
        '6. Set up collaboration workflows',
        '7. Define escalation procedures',
        '8. Document execution setup'
      ],
      outputFormat: 'JSON with execution visibility setup'
    },
    outputSchema: {
      type: 'object',
      required: ['alertThresholds', 'prioritizationRules', 'artifacts'],
      properties: {
        alertThresholds: { type: 'object' },
        prioritizationRules: { type: 'object' },
        synchronizationAlerts: { type: 'array' },
        collaborationWorkflows: { type: 'array' },
        escalationProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'ddmrp', 'execution']
}));

export const performanceMeasurementTask = defineTask('performance-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Performance Measurement',
  agent: {
    name: 'ddmrp-metrics-analyst',
    prompt: {
      role: 'DDMRP Performance Analyst',
      task: 'Define DDMRP performance measurement framework',
      context: args,
      instructions: [
        '1. Define buffer health metrics',
        '2. Set up flow metrics',
        '3. Define service metrics',
        '4. Configure inventory metrics',
        '5. Set up compliance metrics',
        '6. Define improvement metrics',
        '7. Create performance dashboard',
        '8. Document KPI framework'
      ],
      outputFormat: 'JSON with performance measurement framework'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'dashboardConfig', 'artifacts'],
      properties: {
        kpis: { type: 'array' },
        bufferHealthMetrics: { type: 'object' },
        flowMetrics: { type: 'object' },
        serviceMetrics: { type: 'object' },
        inventoryMetrics: { type: 'object' },
        dashboardConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'ddmrp', 'performance']
}));
