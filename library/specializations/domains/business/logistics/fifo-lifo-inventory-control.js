/**
 * @process specializations/domains/business/logistics/fifo-lifo-inventory-control
 * @description Automated inventory rotation management ensuring proper product flow based on expiration dates, production dates, or receipt dates.
 * @inputs { inventory: array, rotationMethod: string, expirationRules?: object, productCategories?: array }
 * @outputs { success: boolean, rotationPlan: array, expirationAlerts: array, complianceStatus: object, performanceMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/fifo-lifo-inventory-control', {
 *   inventory: [{ sku: 'SKU001', location: 'A-01', qty: 100, lotNumber: 'L001', expirationDate: '2024-06-15' }],
 *   rotationMethod: 'FEFO',
 *   expirationRules: { warningDays: 30, criticalDays: 7 }
 * });
 *
 * @references
 * - FDA FSMA: https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/food-safety-modernization-act-fsma
 * - Inventory Rotation Best Practices: https://www.apics.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventory = [],
    rotationMethod = 'FIFO', // 'FIFO', 'LIFO', 'FEFO' (First Expired First Out)
    expirationRules = {},
    productCategories = [],
    outputDir = 'inventory-rotation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting FIFO/LIFO Inventory Control Process');
  ctx.log('info', `Inventory items: ${inventory.length}, Method: ${rotationMethod}`);

  // PHASE 1: INVENTORY DATE ANALYSIS
  ctx.log('info', 'Phase 1: Analyzing inventory dates');
  const dateAnalysis = await ctx.task(inventoryDateAnalysisTask, { inventory, rotationMethod, outputDir });
  artifacts.push(...dateAnalysis.artifacts);

  // PHASE 2: EXPIRATION RISK ASSESSMENT
  ctx.log('info', 'Phase 2: Assessing expiration risks');
  const expirationAssessment = await ctx.task(expirationAssessmentTask, {
    inventory,
    expirationRules,
    outputDir
  });
  artifacts.push(...expirationAssessment.artifacts);

  // Quality Gate: Critical expirations
  if (expirationAssessment.criticalItems.length > 0) {
    await ctx.breakpoint({
      question: `${expirationAssessment.criticalItems.length} items at critical expiration risk. Total value at risk: $${expirationAssessment.criticalValue}. Review and take action?`,
      title: 'Critical Expiration Alert',
      context: {
        runId: ctx.runId,
        criticalItems: expirationAssessment.criticalItems,
        criticalValue: expirationAssessment.criticalValue,
        files: expirationAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // PHASE 3: ROTATION SEQUENCE DETERMINATION
  ctx.log('info', 'Phase 3: Determining rotation sequence');
  const rotationSequence = await ctx.task(rotationSequenceTask, {
    dateAnalysis: dateAnalysis.analysis,
    rotationMethod,
    outputDir
  });
  artifacts.push(...rotationSequence.artifacts);

  // PHASE 4: PICK ALLOCATION RULES
  ctx.log('info', 'Phase 4: Generating pick allocation rules');
  const pickAllocationRules = await ctx.task(pickAllocationTask, {
    rotationSequence: rotationSequence.sequence,
    inventory,
    outputDir
  });
  artifacts.push(...pickAllocationRules.artifacts);

  // PHASE 5: LOCATION ROTATION OPTIMIZATION
  ctx.log('info', 'Phase 5: Optimizing location rotation');
  const locationOptimization = await ctx.task(locationRotationTask, {
    inventory,
    rotationSequence: rotationSequence.sequence,
    outputDir
  });
  artifacts.push(...locationOptimization.artifacts);

  // PHASE 6: COMPLIANCE VALIDATION
  ctx.log('info', 'Phase 6: Validating compliance');
  const complianceValidation = await ctx.task(complianceValidationTask, {
    inventory,
    rotationMethod,
    pickAllocationRules: pickAllocationRules.rules,
    productCategories,
    outputDir
  });
  artifacts.push(...complianceValidation.artifacts);

  // PHASE 7: ROTATION ACTION PLAN
  ctx.log('info', 'Phase 7: Generating rotation action plan');
  const actionPlan = await ctx.task(rotationActionPlanTask, {
    locationOptimization: locationOptimization.recommendations,
    expirationAssessment,
    complianceValidation,
    outputDir
  });
  artifacts.push(...actionPlan.artifacts);

  // PHASE 8: PERFORMANCE METRICS AND REPORTING
  ctx.log('info', 'Phase 8: Generating performance report');
  const performanceReport = await ctx.task(rotationPerformanceTask, {
    inventory,
    rotationSequence,
    expirationAssessment,
    complianceValidation,
    outputDir
  });
  artifacts.push(...performanceReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Inventory rotation analysis complete. Compliance: ${complianceValidation.complianceRate}%. Expiration alerts: ${expirationAssessment.alertCount}. Approve rotation plan?`,
    title: 'Inventory Rotation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalItems: inventory.length,
        rotationMethod,
        complianceRate: `${complianceValidation.complianceRate}%`,
        expirationAlerts: expirationAssessment.alertCount,
        criticalItems: expirationAssessment.criticalItems.length,
        actionsRequired: actionPlan.actions.length
      },
      files: [{ path: performanceReport.reportPath, format: 'markdown', label: 'Performance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    rotationPlan: rotationSequence.sequence,
    expirationAlerts: expirationAssessment.alerts,
    complianceStatus: complianceValidation.status,
    performanceMetrics: performanceReport.metrics,
    actionPlan: actionPlan.actions,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/fifo-lifo-inventory-control', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const inventoryDateAnalysisTask = defineTask('inventory-date-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze inventory dates',
  agent: {
    name: 'inventory-date-analyst',
    prompt: {
      role: 'Inventory Date Analysis Specialist',
      task: 'Analyze inventory dates for rotation planning',
      context: args,
      instructions: ['Extract receipt dates', 'Extract production dates', 'Extract expiration dates', 'Calculate age in days', 'Sort by rotation method', 'Generate date analysis report']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'array' }, ageDistribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'date-analysis']
}));

export const expirationAssessmentTask = defineTask('expiration-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess expiration risks',
  agent: {
    name: 'expiration-analyst',
    prompt: {
      role: 'Expiration Risk Analyst',
      task: 'Assess inventory expiration risks',
      context: args,
      instructions: ['Calculate days to expiration', 'Apply expiration rules', 'Identify critical items', 'Calculate value at risk', 'Generate expiration alerts', 'Prioritize action items']
    },
    outputSchema: { type: 'object', required: ['alerts', 'criticalItems', 'criticalValue', 'alertCount', 'artifacts'], properties: { alerts: { type: 'array' }, criticalItems: { type: 'array' }, criticalValue: { type: 'number' }, alertCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'expiration']
}));

export const rotationSequenceTask = defineTask('rotation-sequence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine rotation sequence',
  agent: {
    name: 'rotation-sequence-specialist',
    prompt: {
      role: 'Rotation Sequence Specialist',
      task: 'Determine optimal inventory rotation sequence',
      context: args,
      instructions: ['Apply rotation method rules', 'Sequence by appropriate date', 'Handle multi-lot locations', 'Generate pick sequence', 'Document rotation logic', 'Generate sequence report']
    },
    outputSchema: { type: 'object', required: ['sequence', 'artifacts'], properties: { sequence: { type: 'array' }, sequenceLogic: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'sequence']
}));

export const pickAllocationTask = defineTask('pick-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate pick allocation rules',
  agent: {
    name: 'pick-allocation-specialist',
    prompt: {
      role: 'Pick Allocation Specialist',
      task: 'Generate pick allocation rules for proper rotation',
      context: args,
      instructions: ['Define allocation priority', 'Create WMS pick rules', 'Handle partial picks', 'Define lot selection logic', 'Generate allocation rules', 'Document rule logic']
    },
    outputSchema: { type: 'object', required: ['rules', 'artifacts'], properties: { rules: { type: 'array' }, wmsConfiguration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'allocation']
}));

export const locationRotationTask = defineTask('location-rotation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize location rotation',
  agent: {
    name: 'location-rotation-specialist',
    prompt: {
      role: 'Location Rotation Specialist',
      task: 'Optimize inventory location for proper rotation',
      context: args,
      instructions: ['Identify rotation conflicts', 'Recommend relocations', 'Optimize for pick efficiency', 'Plan consolidation moves', 'Minimize handling', 'Generate relocation plan']
    },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, relocationPlan: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'location']
}));

export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate compliance',
  agent: {
    name: 'compliance-validator',
    prompt: {
      role: 'Rotation Compliance Specialist',
      task: 'Validate rotation compliance with regulations',
      context: args,
      instructions: ['Check FDA/FSMA requirements', 'Validate rotation adherence', 'Check lot traceability', 'Audit historical picks', 'Calculate compliance rate', 'Generate compliance report']
    },
    outputSchema: { type: 'object', required: ['status', 'complianceRate', 'artifacts'], properties: { status: { type: 'object' }, complianceRate: { type: 'number' }, violations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'compliance']
}));

export const rotationActionPlanTask = defineTask('rotation-action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate rotation action plan',
  agent: {
    name: 'action-plan-specialist',
    prompt: {
      role: 'Rotation Action Plan Specialist',
      task: 'Generate action plan for inventory rotation',
      context: args,
      instructions: ['Prioritize expiring inventory', 'Plan relocation tasks', 'Schedule disposal if needed', 'Coordinate with operations', 'Assign responsibilities', 'Generate action checklist']
    },
    outputSchema: { type: 'object', required: ['actions', 'artifacts'], properties: { actions: { type: 'array' }, prioritizedTasks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'action-plan']
}));

export const rotationPerformanceTask = defineTask('rotation-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate performance report',
  agent: {
    name: 'rotation-performance-analyst',
    prompt: {
      role: 'Rotation Performance Analyst',
      task: 'Generate inventory rotation performance report',
      context: args,
      instructions: ['Calculate rotation metrics', 'Measure shrink/waste', 'Track compliance trends', 'Analyze expiration losses', 'Compare to benchmarks', 'Generate performance report']
    },
    outputSchema: { type: 'object', required: ['metrics', 'reportPath', 'artifacts'], properties: { metrics: { type: 'object' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'inventory-rotation', 'performance']
}));
