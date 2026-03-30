/**
 * @process specializations/robotics-simulation/rl-robot-control
 * @description Reinforcement Learning for Robot Control - Train RL agent for robot control tasks using
 * simulation including environment setup, algorithm selection, reward design, training, and sim-to-real
 * transfer.
 * @inputs { projectName: string, taskType?: string, rlAlgorithm?: string, outputDir?: string }
 * @outputs { success: boolean, trainedPolicy: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/rl-robot-control', {
 *   projectName: 'quadruped_locomotion',
 *   taskType: 'locomotion',
 *   rlAlgorithm: 'ppo'
 * });
 *
 * @references
 * - Stable Baselines3: https://stable-baselines3.readthedocs.io/
 * - Sim-to-Real Locomotion: https://arxiv.org/abs/1804.10332
 * - OpenAI Gym: https://sites.google.com/view/simtoreal
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    taskType = 'locomotion',
    rlAlgorithm = 'ppo',
    outputDir = 'rl-robot-control-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RL Robot Control Training: ${projectName}`);

  const taskDefinition = await ctx.task(rlTaskDefinitionTask, { projectName, taskType, outputDir });
  artifacts.push(...taskDefinition.artifacts);

  const environmentSetup = await ctx.task(rlEnvironmentSetupTask, { projectName, taskType, outputDir });
  artifacts.push(...environmentSetup.artifacts);

  const algorithmSelection = await ctx.task(rlAlgorithmSelectionTask, { projectName, rlAlgorithm, taskType, outputDir });
  artifacts.push(...algorithmSelection.artifacts);

  const observationAction = await ctx.task(observationActionSpaceTask, { projectName, taskType, environmentSetup, outputDir });
  artifacts.push(...observationAction.artifacts);

  const rewardDesign = await ctx.task(rewardDesignTask, { projectName, taskType, outputDir });
  artifacts.push(...rewardDesign.artifacts);

  const training = await ctx.task(rlTrainingTask, { projectName, rlAlgorithm, environmentSetup, rewardDesign, outputDir });
  artifacts.push(...training.artifacts);

  await ctx.breakpoint({
    question: `RL training for ${projectName} complete. Reward: ${training.finalReward}. Continue with validation?`,
    title: 'RL Training Complete',
    context: { runId: ctx.runId, finalReward: training.finalReward, episodes: training.totalEpisodes }
  });

  const policyValidation = await ctx.task(policyValidationTask, { projectName, training, outputDir });
  artifacts.push(...policyValidation.artifacts);

  const simToRealTransfer = await ctx.task(simToRealTransferTask, { projectName, training, outputDir });
  artifacts.push(...simToRealTransfer.artifacts);

  const hardwareTesting = await ctx.task(rlHardwareTestingTask, { projectName, simToRealTransfer, outputDir });
  artifacts.push(...hardwareTesting.artifacts);

  await ctx.breakpoint({
    question: `RL Robot Control Complete for ${projectName}. Sim success: ${policyValidation.successRate}%, Real success: ${hardwareTesting.successRate}%. Review?`,
    title: 'RL Robot Control Complete',
    context: { runId: ctx.runId, simSuccess: policyValidation.successRate, realSuccess: hardwareTesting.successRate }
  });

  return {
    success: policyValidation.successRate >= 90,
    projectName,
    trainedPolicy: { policyPath: training.policyPath, algorithm: rlAlgorithm },
    performanceMetrics: { simSuccessRate: policyValidation.successRate, realSuccessRate: hardwareTesting.successRate, finalReward: training.finalReward },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/rl-robot-control', timestamp: startTime, outputDir }
  };
}

export const rlTaskDefinitionTask = defineTask('rl-task-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Task Definition - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Define task and reward function', context: args, instructions: ['1. Define task objectives', '2. Specify success criteria', '3. Identify constraints', '4. Define episode structure', '5. Document task specification'] },
    outputSchema: { type: 'object', required: ['taskSpec', 'successCriteria', 'artifacts'], properties: { taskSpec: { type: 'object' }, successCriteria: { type: 'object' }, episodeLength: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'task-definition']
}));

export const rlEnvironmentSetupTask = defineTask('rl-environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Environment Setup - ${args.projectName}`,
  agent: {
    name: 'gazebo-simulation-expert',  // AG-002: Gazebo Simulation Expert Agent
    prompt: { role: 'Simulation Engineer', task: 'Set up simulation environment with Gym interface', context: args, instructions: ['1. Create Gym environment wrapper', '2. Configure physics simulation', '3. Set up robot model', '4. Configure reset function', '5. Test environment'] },
    outputSchema: { type: 'object', required: ['envConfig', 'gymInterface', 'artifacts'], properties: { envConfig: { type: 'object' }, gymInterface: { type: 'object' }, resetConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'environment']
}));

export const rlAlgorithmSelectionTask = defineTask('rl-algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Algorithm Selection - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Select RL algorithm', context: args, instructions: ['1. Evaluate PPO, SAC, TD3', '2. Consider action space type', '3. Configure hyperparameters', '4. Set up network architecture', '5. Document selection'] },
    outputSchema: { type: 'object', required: ['algorithm', 'hyperparameters', 'artifacts'], properties: { algorithm: { type: 'string' }, hyperparameters: { type: 'object' }, networkArchitecture: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'algorithm']
}));

export const observationActionSpaceTask = defineTask('observation-action-space', (args, taskCtx) => ({
  kind: 'agent',
  title: `Observation/Action Space - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Implement observation and action spaces', context: args, instructions: ['1. Define observation space', '2. Define action space', '3. Normalize observations', '4. Scale actions', '5. Test spaces'] },
    outputSchema: { type: 'object', required: ['observationSpace', 'actionSpace', 'artifacts'], properties: { observationSpace: { type: 'object' }, actionSpace: { type: 'object' }, normalization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'spaces']
}));

export const rewardDesignTask = defineTask('reward-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reward Design - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Design reward shaping strategy', context: args, instructions: ['1. Define primary reward', '2. Add auxiliary rewards', '3. Implement reward shaping', '4. Configure reward scaling', '5. Test reward signal'] },
    outputSchema: { type: 'object', required: ['rewardFunction', 'components', 'artifacts'], properties: { rewardFunction: { type: 'object' }, components: { type: 'array' }, shaping: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'reward']
}));

export const rlTrainingTask = defineTask('rl-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `RL Training - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Train agent in simulation', context: args, instructions: ['1. Configure parallel environments', '2. Start training', '3. Monitor reward curves', '4. Save checkpoints', '5. Select best policy'] },
    outputSchema: { type: 'object', required: ['policyPath', 'finalReward', 'totalEpisodes', 'artifacts'], properties: { policyPath: { type: 'string' }, finalReward: { type: 'number' }, totalEpisodes: { type: 'number' }, trainingCurve: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'training']
}));

export const policyValidationTask = defineTask('policy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Policy Validation - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Validate trained policy', context: args, instructions: ['1. Run evaluation episodes', '2. Measure success rate', '3. Analyze failure cases', '4. Test edge cases', '5. Generate validation report'] },
    outputSchema: { type: 'object', required: ['successRate', 'evaluationResults', 'artifacts'], properties: { successRate: { type: 'number' }, evaluationResults: { type: 'object' }, failureCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'validation']
}));

export const simToRealTransferTask = defineTask('sim-to-real-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sim-to-Real Transfer - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Implement sim-to-real transfer techniques', context: args, instructions: ['1. Apply domain randomization', '2. Add observation noise', '3. Randomize dynamics', '4. Test transfer robustness', '5. Document transfer method'] },
    outputSchema: { type: 'object', required: ['transferConfig', 'randomizationParams', 'artifacts'], properties: { transferConfig: { type: 'object' }, randomizationParams: { type: 'object' }, robustnessTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'sim-to-real']
}));

export const rlHardwareTestingTask = defineTask('rl-hardware-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hardware Testing - ${args.projectName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test on physical robot', context: args, instructions: ['1. Deploy policy to robot', '2. Run safety-constrained tests', '3. Measure real-world performance', '4. Compare to simulation', '5. Document transfer gap'] },
    outputSchema: { type: 'object', required: ['successRate', 'realWorldResults', 'artifacts'], properties: { successRate: { type: 'number' }, realWorldResults: { type: 'object' }, transferGap: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'rl', 'hardware']
}));
