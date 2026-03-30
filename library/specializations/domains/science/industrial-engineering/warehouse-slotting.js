/**
 * @process domains/science/industrial-engineering/warehouse-slotting
 * @description Warehouse Layout and Slotting Optimization - Design warehouse layouts and optimize product slotting
 * to minimize travel time, improve picking productivity, and maximize space utilization.
 * @inputs { warehouseData: string, orderProfile?: object, constraints?: array }
 * @outputs { success: boolean, layoutDesign: object, slottingPlan: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/warehouse-slotting', {
 *   warehouseData: 'Distribution center layout and SKU data',
 *   orderProfile: { avgLinesPerOrder: 5, ordersPerDay: 500 },
 *   constraints: ['height-restrictions', 'temperature-zones']
 * });
 *
 * @references
 * - Bartholdi & Hackman, Warehouse & Distribution Science
 * - Tompkins et al., Facilities Planning
 * - De Koster et al., Design and control of warehouse order picking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    warehouseData,
    orderProfile = {},
    constraints = [],
    outputDir = 'warehouse-slotting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Warehouse Layout and Slotting Optimization process');

  // Task 1: Order Profile Analysis
  ctx.log('info', 'Phase 1: Analyzing order and pick profiles');
  const orderAnalysis = await ctx.task(orderProfileTask, {
    warehouseData,
    orderProfile,
    outputDir
  });

  artifacts.push(...orderAnalysis.artifacts);

  // Task 2: Product Velocity Classification
  ctx.log('info', 'Phase 2: Classifying products by velocity');
  const velocityClassification = await ctx.task(velocityClassificationTask, {
    orderAnalysis,
    outputDir
  });

  artifacts.push(...velocityClassification.artifacts);

  // Breakpoint: Review classification
  await ctx.breakpoint({
    question: `Product velocity analysis complete. A-movers: ${velocityClassification.aMoversCount}. ${velocityClassification.paretoRatio}% of picks from ${velocityClassification.fastMoversPercent}% of SKUs. Proceed with layout design?`,
    title: 'Velocity Classification Review',
    context: {
      runId: ctx.runId,
      classification: velocityClassification.summary,
      files: velocityClassification.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 3: Zone Layout Design
  ctx.log('info', 'Phase 3: Designing warehouse zone layout');
  const zoneLayout = await ctx.task(zoneLayoutTask, {
    velocityClassification,
    constraints,
    outputDir
  });

  artifacts.push(...zoneLayout.artifacts);

  // Task 4: Flow Pattern Design
  ctx.log('info', 'Phase 4: Designing flow patterns');
  const flowPattern = await ctx.task(flowPatternTask, {
    zoneLayout,
    orderAnalysis,
    outputDir
  });

  artifacts.push(...flowPattern.artifacts);

  // Task 5: Slotting Strategy
  ctx.log('info', 'Phase 5: Developing slotting strategy');
  const slottingStrategy = await ctx.task(slottingStrategyTask, {
    velocityClassification,
    zoneLayout,
    outputDir
  });

  artifacts.push(...slottingStrategy.artifacts);

  // Task 6: Slot Assignment
  ctx.log('info', 'Phase 6: Creating slot assignments');
  const slotAssignment = await ctx.task(slotAssignmentTask, {
    slottingStrategy,
    velocityClassification,
    constraints,
    outputDir
  });

  artifacts.push(...slotAssignment.artifacts);

  // Task 7: Performance Measurement
  ctx.log('info', 'Phase 7: Measuring baseline and projected performance');
  const performanceMeasurement = await ctx.task(performanceMeasurementTask, {
    slotAssignment,
    orderAnalysis,
    outputDir
  });

  artifacts.push(...performanceMeasurement.artifacts);

  // Task 8: Implementation Plan
  ctx.log('info', 'Phase 8: Creating slotting implementation plan');
  const implementationPlan = await ctx.task(slottingImplementationTask, {
    slotAssignment,
    performanceMeasurement,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Warehouse slotting optimization complete. Expected travel reduction: ${performanceMeasurement.travelReduction}%. Productivity improvement: ${performanceMeasurement.productivityImprovement}%. Review implementation plan?`,
    title: 'Warehouse Slotting Results',
    context: {
      runId: ctx.runId,
      summary: {
        skusSlotted: slotAssignment.skusSlotted,
        travelReduction: performanceMeasurement.travelReduction,
        productivityImprovement: performanceMeasurement.productivityImprovement,
        spaceUtilization: performanceMeasurement.spaceUtilization
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    layoutDesign: {
      zones: zoneLayout.zones,
      flowPatterns: flowPattern.patterns
    },
    slottingPlan: {
      strategy: slottingStrategy.strategy,
      assignments: slotAssignment.assignments
    },
    performanceMetrics: {
      travelReduction: performanceMeasurement.travelReduction,
      productivityImprovement: performanceMeasurement.productivityImprovement,
      spaceUtilization: performanceMeasurement.spaceUtilization
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/warehouse-slotting',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions follow the same pattern as other processes...
export const orderProfileTask = defineTask('order-profile-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze order and pick profiles',
  agent: {
    name: 'order-analyst',
    prompt: {
      role: 'Warehouse Analyst',
      task: 'Analyze order profiles and picking patterns',
      context: args,
      instructions: [
        '1. Analyze order frequency distribution',
        '2. Calculate lines per order statistics',
        '3. Analyze order composition patterns',
        '4. Identify correlated SKUs',
        '5. Analyze pick density by location',
        '6. Identify peak periods',
        '7. Calculate travel distances',
        '8. Document order profile'
      ],
      outputFormat: 'JSON with order profile analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['orderStatistics', 'pickPatterns', 'artifacts'],
      properties: {
        orderStatistics: { type: 'object' },
        pickPatterns: { type: 'object' },
        correlatedSKUs: { type: 'array' },
        peakPeriods: { type: 'array' },
        travelAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'order-profile']
}));

export const velocityClassificationTask = defineTask('velocity-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify products by velocity',
  agent: {
    name: 'velocity-classifier',
    prompt: {
      role: 'Inventory Velocity Analyst',
      task: 'Classify products by pick velocity',
      context: args,
      instructions: [
        '1. Calculate pick frequency by SKU',
        '2. Calculate cube movement by SKU',
        '3. Apply ABC velocity classification',
        '4. Identify fast, medium, slow movers',
        '5. Analyze Pareto distribution',
        '6. Consider seasonality',
        '7. Create velocity profiles',
        '8. Document classification'
      ],
      outputFormat: 'JSON with velocity classification'
    },
    outputSchema: {
      type: 'object',
      required: ['aMoversCount', 'fastMoversPercent', 'paretoRatio', 'summary', 'artifacts'],
      properties: {
        velocityClasses: { type: 'object' },
        aMoversCount: { type: 'number' },
        fastMoversPercent: { type: 'number' },
        paretoRatio: { type: 'number' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'velocity']
}));

export const zoneLayoutTask = defineTask('zone-layout-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design warehouse zone layout',
  agent: {
    name: 'layout-designer',
    prompt: {
      role: 'Warehouse Layout Designer',
      task: 'Design warehouse zones based on velocity and constraints',
      context: args,
      instructions: [
        '1. Define forward pick zones',
        '2. Define reserve/bulk storage zones',
        '3. Locate fast movers near shipping',
        '4. Consider temperature requirements',
        '5. Define staging areas',
        '6. Plan aisle configuration',
        '7. Create zone layout drawing',
        '8. Document zone design'
      ],
      outputFormat: 'JSON with zone layout design'
    },
    outputSchema: {
      type: 'object',
      required: ['zones', 'layoutDrawing', 'artifacts'],
      properties: {
        zones: { type: 'array' },
        forwardPickArea: { type: 'object' },
        reserveArea: { type: 'object' },
        aisleConfiguration: { type: 'object' },
        layoutDrawing: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'layout']
}));

export const flowPatternTask = defineTask('flow-pattern-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design flow patterns',
  agent: {
    name: 'flow-designer',
    prompt: {
      role: 'Material Flow Engineer',
      task: 'Design optimal flow patterns for picking',
      context: args,
      instructions: [
        '1. Analyze receiving flow',
        '2. Design putaway paths',
        '3. Design pick paths (serpentine, U-shape)',
        '4. Minimize cross-traffic',
        '5. Design replenishment flows',
        '6. Plan shipping flow',
        '7. Create flow diagrams',
        '8. Document flow patterns'
      ],
      outputFormat: 'JSON with flow pattern design'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'pickPath', 'artifacts'],
      properties: {
        patterns: { type: 'array' },
        receivingFlow: { type: 'object' },
        pickPath: { type: 'object' },
        replenishmentFlow: { type: 'object' },
        flowDiagrams: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'flow']
}));

export const slottingStrategyTask = defineTask('slotting-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop slotting strategy',
  agent: {
    name: 'slotting-strategist',
    prompt: {
      role: 'Slotting Optimization Specialist',
      task: 'Develop product slotting strategy',
      context: args,
      instructions: [
        '1. Define slotting objectives',
        '2. Define golden zone criteria',
        '3. Match product characteristics to slot types',
        '4. Consider ergonomics (weight, size)',
        '5. Plan family grouping',
        '6. Define slot size optimization',
        '7. Plan replenishment triggers',
        '8. Document slotting strategy'
      ],
      outputFormat: 'JSON with slotting strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'goldenZoneCriteria', 'slotTypes', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        goldenZoneCriteria: { type: 'object' },
        slotTypes: { type: 'array' },
        familyGroups: { type: 'array' },
        ergonomicRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'slotting-strategy']
}));

export const slotAssignmentTask = defineTask('slot-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create slot assignments',
  agent: {
    name: 'slot-assigner',
    prompt: {
      role: 'Slotting Analyst',
      task: 'Create specific slot assignments for each SKU',
      context: args,
      instructions: [
        '1. Match SKUs to optimal slots',
        '2. Apply velocity-based assignment',
        '3. Consider slot capacity constraints',
        '4. Apply special handling rules',
        '5. Group related items',
        '6. Validate all constraints',
        '7. Create slot assignment database',
        '8. Document assignments'
      ],
      outputFormat: 'JSON with slot assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'skusSlotted', 'artifacts'],
      properties: {
        assignments: { type: 'object' },
        skusSlotted: { type: 'number' },
        constraintViolations: { type: 'array' },
        assignmentDatabase: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'slot-assignment']
}));

export const performanceMeasurementTask = defineTask('performance-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measure performance improvement',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Warehouse Performance Analyst',
      task: 'Measure baseline and projected performance',
      context: args,
      instructions: [
        '1. Calculate current travel distance',
        '2. Calculate projected travel distance',
        '3. Estimate productivity improvement',
        '4. Measure space utilization',
        '5. Estimate pick rate improvement',
        '6. Calculate ROI',
        '7. Create performance dashboard',
        '8. Document metrics'
      ],
      outputFormat: 'JSON with performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['travelReduction', 'productivityImprovement', 'spaceUtilization', 'artifacts'],
      properties: {
        baselineMetrics: { type: 'object' },
        projectedMetrics: { type: 'object' },
        travelReduction: { type: 'number' },
        productivityImprovement: { type: 'number' },
        spaceUtilization: { type: 'number' },
        roi: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'performance']
}));

export const slottingImplementationTask = defineTask('slotting-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Warehouse Project Manager',
      task: 'Create slotting implementation plan',
      context: args,
      instructions: [
        '1. Plan phased implementation',
        '2. Schedule product moves',
        '3. Minimize disruption to operations',
        '4. Plan WMS updates',
        '5. Train warehouse staff',
        '6. Plan verification process',
        '7. Define sustainment process',
        '8. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'moveSchedule', 'timeline', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        moveSchedule: { type: 'array' },
        timeline: { type: 'object' },
        wmsUpdates: { type: 'array' },
        trainingPlan: { type: 'object' },
        sustainmentProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'warehouse', 'implementation']
}));
