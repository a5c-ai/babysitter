/**
 * @process domains/science/industrial-engineering/oee-improvement
 * @description Overall Equipment Effectiveness Improvement - Measure and improve OEE by analyzing availability,
 * performance, and quality losses to maximize productive equipment time.
 * @inputs { equipmentId: string, currentOEE?: number, targetOEE?: number }
 * @outputs { success: boolean, oeeAnalysis: object, lossAnalysis: object, improvementPlan: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/oee-improvement', {
 *   equipmentId: 'CNC-Machine-01',
 *   currentOEE: 0.65,
 *   targetOEE: 0.85
 * });
 *
 * @references
 * - Nakajima, Introduction to TPM
 * - Hansen, Overall Equipment Effectiveness
 * - SEMI E10 - Equipment Reliability, Availability, and Maintainability
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    equipmentId,
    currentOEE = null,
    targetOEE = 0.85,
    measurementPeriod = 'weekly',
    outputDir = 'oee-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting OEE Improvement process');

  // Task 1: OEE Measurement System
  ctx.log('info', 'Phase 1: Establishing OEE measurement system');
  const measurementSystem = await ctx.task(measurementSystemTask, {
    equipmentId,
    measurementPeriod,
    outputDir
  });

  artifacts.push(...measurementSystem.artifacts);

  // Task 2: OEE Calculation
  ctx.log('info', 'Phase 2: Calculating OEE components');
  const oeeCalculation = await ctx.task(oeeCalculationTask, {
    measurementSystem,
    currentOEE,
    outputDir
  });

  artifacts.push(...oeeCalculation.artifacts);

  // Task 3: Loss Categorization
  ctx.log('info', 'Phase 3: Categorizing losses (Six Big Losses)');
  const lossCategorization = await ctx.task(lossCategorizationTask, {
    oeeCalculation,
    outputDir
  });

  artifacts.push(...lossCategorization.artifacts);

  // Breakpoint: Review losses
  await ctx.breakpoint({
    question: `OEE: ${oeeCalculation.oee.toFixed(1)}% (A: ${oeeCalculation.availability.toFixed(1)}%, P: ${oeeCalculation.performance.toFixed(1)}%, Q: ${oeeCalculation.quality.toFixed(1)}%). Top loss: ${lossCategorization.topLoss}. Review loss analysis?`,
    title: 'OEE Analysis Review',
    context: {
      runId: ctx.runId,
      oee: {
        overall: oeeCalculation.oee,
        availability: oeeCalculation.availability,
        performance: oeeCalculation.performance,
        quality: oeeCalculation.quality
      },
      topLoss: lossCategorization.topLoss,
      files: oeeCalculation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Pareto Analysis
  ctx.log('info', 'Phase 4: Performing Pareto analysis of losses');
  const paretoAnalysis = await ctx.task(paretoAnalysisTask, {
    lossCategorization,
    outputDir
  });

  artifacts.push(...paretoAnalysis.artifacts);

  // Task 5: Focused Improvement
  ctx.log('info', 'Phase 5: Developing focused improvement actions');
  const focusedImprovement = await ctx.task(focusedImprovementTask, {
    paretoAnalysis,
    targetOEE,
    oeeCalculation,
    outputDir
  });

  artifacts.push(...focusedImprovement.artifacts);

  // Task 6: Autonomous Maintenance
  ctx.log('info', 'Phase 6: Implementing autonomous maintenance activities');
  const autonomousMaintenance = await ctx.task(autonomousMaintenanceTask, {
    lossCategorization,
    outputDir
  });

  artifacts.push(...autonomousMaintenance.artifacts);

  // Task 7: OEE Dashboard
  ctx.log('info', 'Phase 7: Creating OEE tracking dashboard');
  const oeeDashboard = await ctx.task(oeeDashboardTask, {
    oeeCalculation,
    measurementSystem,
    outputDir
  });

  artifacts.push(...oeeDashboard.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `OEE improvement plan developed. Current: ${oeeCalculation.oee.toFixed(1)}%, Target: ${targetOEE * 100}%. ${focusedImprovement.actionCount} improvement actions identified. Expected improvement: ${focusedImprovement.expectedImprovement}%. Review plan?`,
    title: 'OEE Improvement Results',
    context: {
      runId: ctx.runId,
      summary: {
        currentOEE: oeeCalculation.oee,
        targetOEE: targetOEE * 100,
        gap: (targetOEE * 100) - oeeCalculation.oee,
        actionCount: focusedImprovement.actionCount,
        expectedImprovement: focusedImprovement.expectedImprovement
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    oeeAnalysis: {
      oee: oeeCalculation.oee,
      availability: oeeCalculation.availability,
      performance: oeeCalculation.performance,
      quality: oeeCalculation.quality
    },
    lossAnalysis: {
      categories: lossCategorization.lossCategories,
      paretoRanking: paretoAnalysis.ranking,
      topLosses: paretoAnalysis.topLosses
    },
    improvementPlan: focusedImprovement.actions,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/oee-improvement',
      timestamp: startTime,
      equipmentId,
      targetOEE,
      outputDir
    }
  };
}

// Task definitions
export const measurementSystemTask = defineTask('measurement-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish OEE measurement system',
  agent: {
    name: 'measurement-specialist',
    prompt: {
      role: 'OEE Measurement Specialist',
      task: 'Establish OEE data collection and measurement system',
      context: args,
      instructions: [
        '1. Define planned production time',
        '2. Define ideal cycle time',
        '3. Create downtime tracking system',
        '4. Create speed loss tracking',
        '5. Create quality defect tracking',
        '6. Define loss categories',
        '7. Create data collection forms',
        '8. Document measurement procedures'
      ],
      outputFormat: 'JSON with measurement system'
    },
    outputSchema: {
      type: 'object',
      required: ['dataCollection', 'lossCategories', 'procedures', 'artifacts'],
      properties: {
        plannedProductionTime: { type: 'number' },
        idealCycleTime: { type: 'number' },
        dataCollection: { type: 'object' },
        lossCategories: { type: 'array' },
        collectionForms: { type: 'array' },
        procedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'oee', 'measurement']
}));

export const oeeCalculationTask = defineTask('oee-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate OEE components',
  agent: {
    name: 'oee-calculator',
    prompt: {
      role: 'OEE Analyst',
      task: 'Calculate Availability, Performance, and Quality rates',
      context: args,
      instructions: [
        '1. Calculate operating time (planned - downtime)',
        '2. Calculate availability rate',
        '3. Calculate net operating time',
        '4. Calculate performance rate',
        '5. Calculate quality rate',
        '6. Calculate overall OEE',
        '7. Identify component with largest gap',
        '8. Document calculations'
      ],
      outputFormat: 'JSON with OEE calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['oee', 'availability', 'performance', 'quality', 'artifacts'],
      properties: {
        oee: { type: 'number' },
        availability: { type: 'number' },
        performance: { type: 'number' },
        quality: { type: 'number' },
        operatingTime: { type: 'number' },
        netOperatingTime: { type: 'number' },
        valuableOperatingTime: { type: 'number' },
        largestGapComponent: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'oee', 'calculation']
}));

export const lossCategorizationTask = defineTask('loss-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize Six Big Losses',
  agent: {
    name: 'loss-categorizer',
    prompt: {
      role: 'TPM Loss Analyst',
      task: 'Categorize losses into Six Big Losses framework',
      context: args,
      instructions: [
        '1. Categorize breakdowns (availability)',
        '2. Categorize setup/adjustment (availability)',
        '3. Categorize minor stops (performance)',
        '4. Categorize reduced speed (performance)',
        '5. Categorize defects/rework (quality)',
        '6. Categorize startup losses (quality)',
        '7. Quantify each loss category',
        '8. Document loss categorization'
      ],
      outputFormat: 'JSON with loss categorization'
    },
    outputSchema: {
      type: 'object',
      required: ['lossCategories', 'topLoss', 'lossQuantification', 'artifacts'],
      properties: {
        lossCategories: { type: 'object' },
        breakdowns: { type: 'object' },
        setups: { type: 'object' },
        minorStops: { type: 'object' },
        reducedSpeed: { type: 'object' },
        defects: { type: 'object' },
        startupLosses: { type: 'object' },
        topLoss: { type: 'string' },
        lossQuantification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'oee', 'loss-categorization']
}));

export const paretoAnalysisTask = defineTask('pareto-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform Pareto analysis',
  agent: {
    name: 'pareto-analyst',
    prompt: {
      role: 'Continuous Improvement Analyst',
      task: 'Perform Pareto analysis of losses',
      context: args,
      instructions: [
        '1. Rank losses by impact',
        '2. Calculate cumulative percentage',
        '3. Identify vital few (80/20)',
        '4. Create Pareto chart',
        '5. Analyze by equipment',
        '6. Analyze by shift',
        '7. Identify focus areas',
        '8. Document Pareto analysis'
      ],
      outputFormat: 'JSON with Pareto analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['ranking', 'topLosses', 'paretoChart', 'artifacts'],
      properties: {
        ranking: { type: 'array' },
        topLosses: { type: 'array' },
        vitalFew: { type: 'array' },
        cumulativePercentage: { type: 'object' },
        paretoChart: { type: 'string' },
        byEquipment: { type: 'object' },
        byShift: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'oee', 'pareto']
}));

export const focusedImprovementTask = defineTask('focused-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop focused improvement actions',
  agent: {
    name: 'improvement-specialist',
    prompt: {
      role: 'Focused Improvement Leader',
      task: 'Develop improvement actions for top losses',
      context: args,
      instructions: [
        '1. Analyze root causes of top losses',
        '2. Develop countermeasures',
        '3. Estimate improvement potential',
        '4. Prioritize actions by impact',
        '5. Assign owners and due dates',
        '6. Define success metrics',
        '7. Calculate expected OEE improvement',
        '8. Create improvement action plan'
      ],
      outputFormat: 'JSON with improvement actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'actionCount', 'expectedImprovement', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        actionCount: { type: 'number' },
        rootCauseAnalysis: { type: 'array' },
        countermeasures: { type: 'array' },
        expectedImprovement: { type: 'number' },
        prioritization: { type: 'array' },
        successMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'oee', 'improvement']
}));

export const autonomousMaintenanceTask = defineTask('autonomous-maintenance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement autonomous maintenance',
  agent: {
    name: 'am-coordinator',
    prompt: {
      role: 'Autonomous Maintenance Coordinator',
      task: 'Develop autonomous maintenance activities',
      context: args,
      instructions: [
        '1. Identify cleaning requirements',
        '2. Identify inspection points',
        '3. Identify lubrication points',
        '4. Create AM checklists',
        '5. Define operator responsibilities',
        '6. Create visual standards',
        '7. Develop training materials',
        '8. Document AM activities'
      ],
      outputFormat: 'JSON with autonomous maintenance plan'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'checklists', 'standards', 'artifacts'],
      properties: {
        activities: { type: 'array' },
        cleaningRequirements: { type: 'array' },
        inspectionPoints: { type: 'array' },
        lubricationPoints: { type: 'array' },
        checklists: { type: 'array' },
        operatorResponsibilities: { type: 'object' },
        standards: { type: 'array' },
        trainingMaterials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'oee', 'autonomous-maintenance']
}));

export const oeeDashboardTask = defineTask('oee-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create OEE tracking dashboard',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'OEE Dashboard Designer',
      task: 'Create OEE tracking and trending dashboard',
      context: args,
      instructions: [
        '1. Design OEE display format',
        '2. Create availability tracking',
        '3. Create performance tracking',
        '4. Create quality tracking',
        '5. Add loss Pareto charts',
        '6. Add trend charts',
        '7. Define update frequency',
        '8. Create dashboard documentation'
      ],
      outputFormat: 'JSON with dashboard design'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardDesign', 'trackingElements', 'updateFrequency', 'artifacts'],
      properties: {
        dashboardDesign: { type: 'object' },
        oeeDisplay: { type: 'object' },
        trackingElements: { type: 'array' },
        trendCharts: { type: 'array' },
        paretoCharts: { type: 'array' },
        updateFrequency: { type: 'string' },
        dashboardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'oee', 'dashboard']
}));
