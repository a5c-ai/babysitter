/**
 * @process specializations/fpga-programming/power-analysis-optimization
 * @description Power Analysis and Optimization - Analyze and optimize FPGA power consumption. Apply clock gating, power
 * domains, and low-power design techniques to meet power budgets.
 * @inputs { designName: string, targetDevice: string, powerBudget?: number, activityFile?: string, outputDir?: string }
 * @outputs { success: boolean, powerAnalysis: object, optimizations: array, projectedPower: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/power-analysis-optimization', {
 *   designName: 'wireless_baseband',
 *   targetDevice: 'Intel Agilex',
 *   powerBudget: 10.0,
 *   activityFile: 'simulation_activity.saif'
 * });
 *
 * @references
 * - Vivado Power Analysis: https://docs.amd.com/r/en-US/ug907-vivado-power-analysis-optimization
 * - PowerPlay Analysis: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1410384175702.html
 * - Low Power Design: https://docs.amd.com/r/en-US/ug949-vivado-design-methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    targetDevice,
    powerBudget = null,
    activityFile = null,
    thermalConstraints = null,
    outputDir = 'power-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Power Analysis for: ${designName}`);
  ctx.log('info', `Target: ${targetDevice}, Budget: ${powerBudget ? powerBudget + 'W' : 'none'}`);

  const powerEstimation = await ctx.task(powerEstimationTask, { designName, targetDevice, activityFile, outputDir });
  artifacts.push(...powerEstimation.artifacts);

  const powerBreakdown = await ctx.task(powerBreakdownTask, { designName, powerEstimation, outputDir });
  artifacts.push(...powerBreakdown.artifacts);

  const optimizationPlanning = await ctx.task(optimizationPlanningTask, { designName, powerBreakdown, powerBudget, outputDir });
  artifacts.push(...optimizationPlanning.artifacts);

  await ctx.breakpoint({
    question: `Power analysis complete for ${designName}. Total: ${powerEstimation.totalPower}W, Budget: ${powerBudget || 'N/A'}W. Review optimizations?`,
    title: 'Power Analysis Review',
    context: { runId: ctx.runId, designName, totalPower: powerEstimation.totalPower, budget: powerBudget }
  });

  const clockGatingOptimization = await ctx.task(clockGatingOptimizationTask, { designName, optimizationPlanning, outputDir });
  artifacts.push(...clockGatingOptimization.artifacts);

  const powerDomainsDesign = await ctx.task(powerDomainsDesignTask, { designName, powerBreakdown, outputDir });
  artifacts.push(...powerDomainsDesign.artifacts);

  const thermalAnalysis = thermalConstraints ? await ctx.task(thermalAnalysisTask, { designName, powerEstimation, thermalConstraints, outputDir }) : null;
  if (thermalAnalysis) artifacts.push(...thermalAnalysis.artifacts);

  const powerVerification = await ctx.task(powerVerificationTask, { designName, powerEstimation, optimizationPlanning, clockGatingOptimization, powerBudget, outputDir });
  artifacts.push(...powerVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: powerVerification.passed,
    designName,
    powerAnalysis: { total: powerEstimation.totalPower, breakdown: powerBreakdown.breakdown },
    optimizations: optimizationPlanning.optimizations,
    projectedPower: powerVerification.projectedPower,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/power-analysis-optimization', timestamp: startTime, designName, outputDir }
  };
}

export const powerEstimationTask = defineTask('power-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Power Estimation - ${args.designName}`,
  agent: {
    name: 'power-engineer',
    prompt: {
      role: 'FPGA Power Engineer',
      task: 'Estimate design power',
      context: args,
      instructions: ['1. Import design netlist', '2. Load activity data', '3. Set operating conditions', '4. Configure voltage rails', '5. Run power estimation', '6. Analyze static power', '7. Analyze dynamic power', '8. Document power sources', '9. Generate power report', '10. Review estimates']
    },
    outputSchema: {
      type: 'object',
      required: ['totalPower', 'artifacts'],
      properties: { totalPower: { type: 'number' }, staticPower: { type: 'number' }, dynamicPower: { type: 'number' }, powerReportPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'power', 'estimation']
}));

export const powerBreakdownTask = defineTask('power-breakdown', (args, taskCtx) => ({
  kind: 'agent',
  title: `Power Breakdown - ${args.designName}`,
  agent: {
    name: 'power-engineer',
    prompt: {
      role: 'FPGA Power Engineer',
      task: 'Analyze power breakdown',
      context: args,
      instructions: ['1. Analyze by resource type', '2. Analyze by clock domain', '3. Analyze by hierarchy', '4. Identify power hotspots', '5. Analyze I/O power', '6. Analyze memory power', '7. Analyze logic power', '8. Document breakdown', '9. Create power charts', '10. Prioritize optimizations']
    },
    outputSchema: {
      type: 'object',
      required: ['breakdown', 'artifacts'],
      properties: { breakdown: { type: 'object' }, hotspots: { type: 'array', items: { type: 'object' } }, byClockDomain: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'power', 'breakdown']
}));

export const optimizationPlanningTask = defineTask('optimization-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimization Planning - ${args.designName}`,
  agent: {
    name: 'power-engineer',
    prompt: {
      role: 'FPGA Power Engineer',
      task: 'Plan power optimizations',
      context: args,
      instructions: ['1. Review power targets', '2. Identify optimization candidates', '3. Prioritize by impact', '4. Plan clock gating', '5. Plan power domains', '6. Plan memory optimization', '7. Plan I/O optimization', '8. Estimate savings', '9. Document plan', '10. Get approval']
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: { optimizations: { type: 'array', items: { type: 'object' } }, estimatedSavings: { type: 'number' }, implementationPlan: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'power', 'planning']
}));

export const clockGatingOptimizationTask = defineTask('clock-gating-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clock Gating - ${args.designName}`,
  agent: {
    name: 'power-engineer',
    prompt: {
      role: 'FPGA Power Engineer',
      task: 'Implement clock gating',
      context: args,
      instructions: ['1. Identify gating candidates', '2. Design clock enable logic', '3. Use BUFGCE primitives', '4. Implement fine-grain gating', '5. Add enable synchronization', '6. Verify no glitches', '7. Test gating operation', '8. Document gating', '9. Measure savings', '10. Verify functionality']
    },
    outputSchema: {
      type: 'object',
      required: ['gatingCells', 'artifacts'],
      properties: { gatingCells: { type: 'number' }, powerSavings: { type: 'number' }, gatingLogic: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'power', 'clock-gating']
}));

export const powerDomainsDesignTask = defineTask('power-domains-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Power Domains - ${args.designName}`,
  agent: {
    name: 'power-engineer',
    prompt: {
      role: 'FPGA Power Engineer',
      task: 'Design power domains',
      context: args,
      instructions: ['1. Partition into domains', '2. Design isolation cells', '3. Implement retention', '4. Design power sequencing', '5. Add level shifters', '6. Implement power control', '7. Design wake-up logic', '8. Document power states', '9. Test state transitions', '10. Verify isolation']
    },
    outputSchema: {
      type: 'object',
      required: ['domains', 'artifacts'],
      properties: { domains: { type: 'array', items: { type: 'object' } }, isolationCells: { type: 'number' }, powerStates: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'power', 'domains']
}));

export const thermalAnalysisTask = defineTask('thermal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Analysis - ${args.designName}`,
  agent: {
    name: 'power-engineer',
    prompt: {
      role: 'FPGA Thermal Engineer',
      task: 'Analyze thermal characteristics',
      context: args,
      instructions: ['1. Calculate junction temperature', '2. Model heat dissipation', '3. Analyze thermal hotspots', '4. Evaluate cooling requirements', '5. Check thermal margins', '6. Design thermal mitigation', '7. Add temperature monitoring', '8. Document thermal analysis', '9. Recommend cooling', '10. Verify thermal compliance']
    },
    outputSchema: {
      type: 'object',
      required: ['thermalAnalysis', 'artifacts'],
      properties: { thermalAnalysis: { type: 'object' }, junctionTemp: { type: 'number' }, coolingRequired: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'power', 'thermal']
}));

export const powerVerificationTask = defineTask('power-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Power Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Power Verification Engineer',
      task: 'Verify power optimizations',
      context: args,
      instructions: ['1. Re-run power analysis', '2. Compare before/after', '3. Verify budget compliance', '4. Test power modes', '5. Verify clock gating', '6. Test power transitions', '7. Measure actual power', '8. Document savings', '9. Validate functionality', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'projectedPower', 'artifacts'],
      properties: { passed: { type: 'boolean' }, projectedPower: { type: 'object' }, actualSavings: { type: 'number' }, budgetCompliance: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'power', 'verification']
}));
