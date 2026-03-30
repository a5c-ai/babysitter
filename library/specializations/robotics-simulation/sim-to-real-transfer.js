/**
 * @process specializations/robotics-simulation/sim-to-real-transfer
 * @description Sim-to-Real Transfer Validation - Validate and optimize transfer of policies and models from
 * simulation to real hardware including domain randomization, reality gap analysis, and transfer validation.
 * @inputs { projectName: string, transferMethod?: string, targetPlatform?: string, outputDir?: string }
 * @outputs { success: boolean, transferConfig: object, realWorldMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/sim-to-real-transfer', {
 *   projectName: 'locomotion_transfer',
 *   transferMethod: 'domain-randomization',
 *   targetPlatform: 'quadruped-robot'
 * });
 *
 * @references
 * - Domain Randomization: https://arxiv.org/abs/1703.06907
 * - Sim-to-Real: https://arxiv.org/abs/1812.05671
 * - Real-World Robot Learning: https://arxiv.org/abs/1910.02998
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    transferMethod = 'domain-randomization',
    targetPlatform = 'robot-arm',
    outputDir = 'sim-to-real-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Sim-to-Real Transfer for ${projectName}`);

  const realityGapAnalysis = await ctx.task(realityGapAnalysisTask, { projectName, targetPlatform, outputDir });
  artifacts.push(...realityGapAnalysis.artifacts);

  const domainRandomization = await ctx.task(domainRandomizationConfigTask, { projectName, realityGapAnalysis, outputDir });
  artifacts.push(...domainRandomization.artifacts);

  const systemIdentification = await ctx.task(systemIdentificationTask, { projectName, targetPlatform, outputDir });
  artifacts.push(...systemIdentification.artifacts);

  const simCalibration = await ctx.task(simulationCalibrationTask, { projectName, systemIdentification, outputDir });
  artifacts.push(...simCalibration.artifacts);

  const transferTraining = await ctx.task(transferTrainingTask, { projectName, domainRandomization, simCalibration, outputDir });
  artifacts.push(...transferTraining.artifacts);

  const simValidation = await ctx.task(simTransferValidationTask, { projectName, transferTraining, outputDir });
  artifacts.push(...simValidation.artifacts);

  const realWorldTesting = await ctx.task(realWorldTransferTestingTask, { projectName, targetPlatform, transferTraining, outputDir });
  artifacts.push(...realWorldTesting.artifacts);

  const transferGapMeasurement = await ctx.task(transferGapMeasurementTask, { projectName, simValidation, realWorldTesting, outputDir });
  artifacts.push(...transferGapMeasurement.artifacts);

  const adaptationRefinement = await ctx.task(adaptationRefinementTask, { projectName, transferGapMeasurement, outputDir });
  artifacts.push(...adaptationRefinement.artifacts);

  await ctx.breakpoint({
    question: `Sim-to-Real Transfer Complete for ${projectName}. Sim success: ${simValidation.successRate}%, Real success: ${realWorldTesting.successRate}%, Transfer gap: ${transferGapMeasurement.gap}%. Review?`,
    title: 'Sim-to-Real Transfer Complete',
    context: { runId: ctx.runId, simSuccess: simValidation.successRate, realSuccess: realWorldTesting.successRate, gap: transferGapMeasurement.gap }
  });

  return {
    success: realWorldTesting.successRate >= 80 && transferGapMeasurement.gap <= 15,
    projectName,
    transferConfig: { method: transferMethod, randomizationParams: domainRandomization.params },
    realWorldMetrics: { successRate: realWorldTesting.successRate, transferGap: transferGapMeasurement.gap },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/sim-to-real-transfer', timestamp: startTime, outputDir }
  };
}

export const realityGapAnalysisTask = defineTask('reality-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reality Gap Analysis - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Analyze reality gap factors', context: args, instructions: ['1. Identify physics mismatches', '2. Analyze visual differences', '3. Identify dynamics gaps', '4. Assess sensor noise', '5. Document gap factors'] },
    outputSchema: { type: 'object', required: ['gapFactors', 'priorities', 'artifacts'], properties: { gapFactors: { type: 'array' }, priorities: { type: 'array' }, estimatedImpact: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'gap-analysis']
}));

export const domainRandomizationConfigTask = defineTask('domain-randomization-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Domain Randomization - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Configure domain randomization', context: args, instructions: ['1. Randomize dynamics', '2. Randomize visuals', '3. Add sensor noise', '4. Configure ranges', '5. Test randomization'] },
    outputSchema: { type: 'object', required: ['params', 'ranges', 'artifacts'], properties: { params: { type: 'object' }, ranges: { type: 'object' }, categories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'domain-randomization']
}));

export const systemIdentificationTask = defineTask('system-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Identification - ${args.projectName}`,
  agent: {
    name: 'gazebo-simulation-expert',  // AG-002: Gazebo Simulation Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Identify real system parameters', context: args, instructions: ['1. Measure mass properties', '2. Identify friction', '3. Measure motor dynamics', '4. Identify delays', '5. Document parameters'] },
    outputSchema: { type: 'object', required: ['parameters', 'accuracy', 'artifacts'], properties: { parameters: { type: 'object' }, accuracy: { type: 'number' }, methodology: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'system-id']
}));

export const simulationCalibrationTask = defineTask('simulation-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Simulation Calibration - ${args.projectName}`,
  agent: {
    name: 'gazebo-simulation-expert',  // AG-002: Gazebo Simulation Expert Agent
    prompt: { role: 'Simulation Engineer', task: 'Calibrate simulation to real system', context: args, instructions: ['1. Update physics parameters', '2. Tune contact models', '3. Calibrate sensors', '4. Validate against real data', '5. Document calibration'] },
    outputSchema: { type: 'object', required: ['calibratedParams', 'matchAccuracy', 'artifacts'], properties: { calibratedParams: { type: 'object' }, matchAccuracy: { type: 'number' }, validationResults: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'calibration']
}));

export const transferTrainingTask = defineTask('transfer-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transfer Training - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Train with transfer techniques', context: args, instructions: ['1. Train with randomization', '2. Add adaptation layers', '3. Use progressive training', '4. Save robust policy', '5. Document training'] },
    outputSchema: { type: 'object', required: ['policyPath', 'trainingMetrics', 'artifacts'], properties: { policyPath: { type: 'string' }, trainingMetrics: { type: 'object' }, robustness: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'training']
}));

export const simTransferValidationTask = defineTask('sim-transfer-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sim Validation - ${args.projectName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Validate in simulation', context: args, instructions: ['1. Test without randomization', '2. Test with extreme params', '3. Calculate success rate', '4. Identify failure modes', '5. Document sim results'] },
    outputSchema: { type: 'object', required: ['successRate', 'scenarios', 'artifacts'], properties: { successRate: { type: 'number' }, scenarios: { type: 'array' }, failureModes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'sim-validation']
}));

export const realWorldTransferTestingTask = defineTask('real-world-transfer-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Real World Testing - ${args.projectName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test on real hardware', context: args, instructions: ['1. Deploy to robot', '2. Run test scenarios', '3. Measure success rate', '4. Compare to simulation', '5. Document real results'] },
    outputSchema: { type: 'object', required: ['successRate', 'testResults', 'artifacts'], properties: { successRate: { type: 'number' }, testResults: { type: 'array' }, observations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'real-testing']
}));

export const transferGapMeasurementTask = defineTask('transfer-gap-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gap Measurement - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Measure sim-to-real gap', context: args, instructions: ['1. Compare success rates', '2. Measure trajectory deviation', '3. Analyze timing differences', '4. Calculate transfer gap', '5. Document gap analysis'] },
    outputSchema: { type: 'object', required: ['gap', 'metrics', 'artifacts'], properties: { gap: { type: 'number' }, metrics: { type: 'object' }, gapBreakdown: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'gap-measurement']
}));

export const adaptationRefinementTask = defineTask('adaptation-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adaptation Refinement - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Refine transfer adaptation', context: args, instructions: ['1. Analyze gap sources', '2. Tune randomization', '3. Add online adaptation', '4. Fine-tune on real data', '5. Validate improvements'] },
    outputSchema: { type: 'object', required: ['refinements', 'improvement', 'artifacts'], properties: { refinements: { type: 'array' }, improvement: { type: 'number' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sim-to-real', 'adaptation']
}));
