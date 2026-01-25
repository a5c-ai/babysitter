/**
 * @process chemical-engineering/alarm-rationalization
 * @description Review and rationalize process alarms to reduce alarm floods and improve operator response
 * @inputs { processName: string, alarmDatabase: object, alarmHistory: object, performanceTargets: object, outputDir: string }
 * @outputs { success: boolean, rationalizedAlarms: object, performanceMetrics: object, managementPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    alarmDatabase,
    alarmHistory,
    performanceTargets = {},
    outputDir = 'alarm-rationalization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Inventory Existing Alarms
  ctx.log('info', 'Starting alarm rationalization: Inventorying existing alarms');
  const inventoryResult = await ctx.task(alarmInventoryTask, {
    processName,
    alarmDatabase,
    outputDir
  });

  if (!inventoryResult.success) {
    return {
      success: false,
      error: 'Alarm inventory failed',
      details: inventoryResult,
      metadata: { processId: 'chemical-engineering/alarm-rationalization', timestamp: startTime }
    };
  }

  artifacts.push(...inventoryResult.artifacts);

  // Task 2: Analyze Alarm Performance
  ctx.log('info', 'Analyzing current alarm performance');
  const performanceAnalysisResult = await ctx.task(alarmPerformanceTask, {
    processName,
    alarmHistory,
    inventory: inventoryResult.inventory,
    performanceTargets,
    outputDir
  });

  artifacts.push(...performanceAnalysisResult.artifacts);

  // Task 3: Classify Alarms by Priority and Consequence
  ctx.log('info', 'Classifying alarms by priority and consequence');
  const classificationResult = await ctx.task(alarmClassificationTask, {
    processName,
    inventory: inventoryResult.inventory,
    alarmHistory,
    outputDir
  });

  artifacts.push(...classificationResult.artifacts);

  // Task 4: Identify and Remove Nuisance Alarms
  ctx.log('info', 'Identifying nuisance alarms');
  const nuisanceResult = await ctx.task(nuisanceAlarmIdentificationTask, {
    processName,
    alarmHistory,
    classification: classificationResult.classification,
    outputDir
  });

  artifacts.push(...nuisanceResult.artifacts);

  // Task 5: Optimize Setpoints and Deadbands
  ctx.log('info', 'Optimizing alarm setpoints and deadbands');
  const setpointResult = await ctx.task(setpointOptimizationTask, {
    processName,
    alarms: classificationResult.classification,
    nuisanceAnalysis: nuisanceResult.analysis,
    outputDir
  });

  artifacts.push(...setpointResult.artifacts);

  // Breakpoint: Review alarm rationalization
  await ctx.breakpoint({
    question: `Alarm rationalization in progress for ${processName}. Total alarms: ${inventoryResult.inventory.totalCount}. Nuisance alarms identified: ${nuisanceResult.nuisanceCount}. Current alarm rate: ${performanceAnalysisResult.alarmRate}/hour. Target: ${performanceTargets.alarmRate || 6}/hour. Review results?`,
    title: 'Alarm Rationalization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalAlarms: inventoryResult.inventory.totalCount,
        nuisanceAlarms: nuisanceResult.nuisanceCount,
        currentAlarmRate: performanceAnalysisResult.alarmRate,
        targetAlarmRate: performanceTargets.alarmRate || 6
      }
    }
  });

  // Task 6: Design Alarm Response Procedures
  ctx.log('info', 'Designing alarm response procedures');
  const responseProceduresResult = await ctx.task(alarmResponseProceduresTask, {
    processName,
    rationalizedAlarms: setpointResult.optimizedAlarms,
    classification: classificationResult.classification,
    outputDir
  });

  artifacts.push(...responseProceduresResult.artifacts);

  // Task 7: Implement Alarm Management System
  ctx.log('info', 'Implementing alarm management system');
  const implementationResult = await ctx.task(alarmManagementImplementationTask, {
    processName,
    rationalizedAlarms: setpointResult.optimizedAlarms,
    responseProcedures: responseProceduresResult.procedures,
    performanceTargets,
    outputDir
  });

  artifacts.push(...implementationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    rationalizedAlarms: setpointResult.optimizedAlarms,
    performanceMetrics: {
      currentRate: performanceAnalysisResult.alarmRate,
      expectedRate: implementationResult.expectedAlarmRate,
      improvement: implementationResult.expectedImprovement
    },
    managementPlan: implementationResult.managementPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/alarm-rationalization',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Alarm Inventory
export const alarmInventoryTask = defineTask('alarm-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory existing alarms',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'alarm systems analyst',
      task: 'Create comprehensive inventory of existing alarms',
      context: args,
      instructions: [
        'Extract all configured alarms from system',
        'Document alarm tag, description, type',
        'Record current setpoints and deadbands',
        'Identify alarm priorities',
        'Document alarm groups/areas',
        'Identify duplicate or redundant alarms',
        'Check for orphaned alarms',
        'Create alarm inventory database'
      ],
      outputFormat: 'JSON with alarm inventory, statistics, anomalies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'inventory', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        inventory: {
          type: 'object',
          properties: {
            totalCount: { type: 'number' },
            byType: { type: 'object' },
            byPriority: { type: 'object' },
            byArea: { type: 'object' },
            alarms: { type: 'array' }
          }
        },
        anomalies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'alarm-management', 'inventory']
}));

// Task 2: Alarm Performance Analysis
export const alarmPerformanceTask = defineTask('alarm-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current alarm performance',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'alarm performance analyst',
      task: 'Analyze alarm system performance metrics',
      context: args,
      instructions: [
        'Calculate average alarm rate per operator',
        'Identify alarm floods (>10 alarms/10 min)',
        'Analyze top 10 bad actors (most frequent)',
        'Calculate stale/standing alarm count',
        'Analyze alarm shelving/suppression usage',
        'Compare to ISA-18.2 benchmarks',
        'Identify peak alarm periods',
        'Create performance baseline'
      ],
      outputFormat: 'JSON with performance metrics, benchmarks, bad actors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'alarmRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        alarmRate: { type: 'number' },
        floodEvents: { type: 'array' },
        badActors: { type: 'array' },
        standingAlarms: { type: 'number' },
        benchmarkComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'alarm-management', 'performance']
}));

// Task 3: Alarm Classification
export const alarmClassificationTask = defineTask('alarm-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify alarms by priority and consequence',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'alarm classification engineer',
      task: 'Classify alarms by priority based on consequence',
      context: args,
      instructions: [
        'Review consequence of not responding to each alarm',
        'Apply consequence matrix (safety, environment, production)',
        'Assign priority per ISA-18.2 guidelines',
        'Verify priority distribution (target: 80% low, 15% medium, 5% high)',
        'Identify miscategorized alarms',
        'Validate critical alarms have proper priority',
        'Document classification rationale',
        'Create classification register'
      ],
      outputFormat: 'JSON with classification, priority distribution, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'classification', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        classification: {
          type: 'object',
          properties: {
            alarms: { type: 'array' },
            priorityDistribution: { type: 'object' },
            miscategorized: { type: 'array' }
          }
        },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'alarm-management', 'classification']
}));

// Task 4: Nuisance Alarm Identification
export const nuisanceAlarmIdentificationTask = defineTask('nuisance-alarm-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and address nuisance alarms',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'nuisance alarm analyst',
      task: 'Identify nuisance alarms for elimination',
      context: args,
      instructions: [
        'Identify chattering alarms (rapid on/off)',
        'Identify fleeting alarms (short duration)',
        'Identify stale alarms (always on)',
        'Identify frequently suppressed alarms',
        'Categorize root causes (setpoint, process, design)',
        'Recommend disposition (delete, modify, group)',
        'Estimate impact of elimination',
        'Document nuisance alarm analysis'
      ],
      outputFormat: 'JSON with nuisance analysis, count, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'nuisanceCount', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        nuisanceCount: { type: 'number' },
        analysis: {
          type: 'object',
          properties: {
            chattering: { type: 'array' },
            fleeting: { type: 'array' },
            stale: { type: 'array' },
            frequentlySuppressed: { type: 'array' }
          }
        },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'alarm-management', 'nuisance']
}));

// Task 5: Setpoint Optimization
export const setpointOptimizationTask = defineTask('setpoint-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize alarm setpoints and deadbands',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'alarm setpoint optimizer',
      task: 'Optimize alarm setpoints and deadbands',
      context: args,
      instructions: [
        'Review setpoints against process variability',
        'Optimize deadbands to prevent chattering',
        'Ensure adequate response time',
        'Avoid setpoints at normal operating values',
        'Coordinate related alarm setpoints',
        'Document setpoint changes',
        'Calculate expected alarm reduction',
        'Create optimized alarm settings'
      ],
      outputFormat: 'JSON with optimized alarms, setpoint changes, expected improvement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'optimizedAlarms', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        optimizedAlarms: {
          type: 'object',
          properties: {
            changes: { type: 'array' },
            deletions: { type: 'array' },
            additions: { type: 'array' }
          }
        },
        expectedImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'alarm-management', 'setpoints']
}));

// Task 6: Alarm Response Procedures
export const alarmResponseProceduresTask = defineTask('alarm-response-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design alarm response procedures',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'alarm response procedure developer',
      task: 'Develop alarm response procedures',
      context: args,
      instructions: [
        'Create response procedure for each alarm',
        'Document cause, consequence, action',
        'Specify response time requirements',
        'Prioritize actions for multiple alarms',
        'Create alarm response flowcharts',
        'Integrate with emergency procedures',
        'Train operators on new procedures',
        'Create alarm response documentation'
      ],
      outputFormat: 'JSON with response procedures, documentation paths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'procedures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alarmTag: { type: 'string' },
              cause: { type: 'string' },
              consequence: { type: 'string' },
              action: { type: 'string' },
              responseTime: { type: 'number' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'alarm-management', 'procedures']
}));

// Task 7: Alarm Management Implementation
export const alarmManagementImplementationTask = defineTask('alarm-management-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement alarm management system',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'alarm management implementation engineer',
      task: 'Implement alarm management system and ongoing plan',
      context: args,
      instructions: [
        'Implement rationalized alarm settings',
        'Set up alarm performance monitoring',
        'Configure alarm KPI dashboards',
        'Establish MOC process for alarm changes',
        'Define periodic alarm review process',
        'Set up bad actor tracking',
        'Create ongoing management plan',
        'Document implementation'
      ],
      outputFormat: 'JSON with implementation status, expected metrics, management plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'managementPlan', 'expectedAlarmRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        expectedAlarmRate: { type: 'number' },
        expectedImprovement: { type: 'number' },
        managementPlan: {
          type: 'object',
          properties: {
            monitoringProcess: { type: 'object' },
            mocProcess: { type: 'object' },
            reviewSchedule: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'alarm-management', 'implementation']
}));
