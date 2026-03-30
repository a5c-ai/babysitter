/**
 * @process specializations/robotics-simulation/imitation-learning
 * @description Imitation Learning from Demonstrations - Train robot policy from human demonstrations using
 * behavior cloning or inverse RL including data collection, preprocessing, training, and deployment.
 * @inputs { projectName: string, demonstrationSource?: string, learningMethod?: string, outputDir?: string }
 * @outputs { success: boolean, trainedPolicy: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/imitation-learning', {
 *   projectName: 'manipulation_from_demos',
 *   demonstrationSource: 'teleoperation',
 *   learningMethod: 'behavior-cloning'
 * });
 *
 * @references
 * - DAgger: https://arxiv.org/abs/1011.0686
 * - Deep Imitation Learning: https://sites.google.com/view/deep-imitation-learning
 * - Berkeley RL: https://rll.berkeley.edu/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    demonstrationSource = 'teleoperation',
    learningMethod = 'behavior-cloning',
    outputDir = 'imitation-learning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Imitation Learning: ${projectName}`);

  const demoCollection = await ctx.task(demonstrationCollectionTask, { projectName, demonstrationSource, outputDir });
  artifacts.push(...demoCollection.artifacts);

  const dataPreprocessing = await ctx.task(demonstrationPreprocessingTask, { projectName, demoCollection, outputDir });
  artifacts.push(...dataPreprocessing.artifacts);

  const networkDesign = await ctx.task(policyNetworkDesignTask, { projectName, dataPreprocessing, outputDir });
  artifacts.push(...networkDesign.artifacts);

  const bcTraining = await ctx.task(behaviorCloningTrainingTask, { projectName, learningMethod, dataPreprocessing, networkDesign, outputDir });
  artifacts.push(...bcTraining.artifacts);

  const daggerImprovement = await ctx.task(daggerImprovementTask, { projectName, bcTraining, outputDir });
  artifacts.push(...daggerImprovement.artifacts);

  const simValidation = await ctx.task(imitationSimValidationTask, { projectName, daggerImprovement, outputDir });
  artifacts.push(...simValidation.artifacts);

  const accuracyMeasurement = await ctx.task(imitationAccuracyTask, { projectName, simValidation, outputDir });
  artifacts.push(...accuracyMeasurement.artifacts);

  const rlFineTuning = await ctx.task(rlFineTuningTask, { projectName, daggerImprovement, outputDir });
  artifacts.push(...rlFineTuning.artifacts);

  const robotDeployment = await ctx.task(imitationDeploymentTask, { projectName, rlFineTuning, outputDir });
  artifacts.push(...robotDeployment.artifacts);

  await ctx.breakpoint({
    question: `Imitation Learning Complete for ${projectName}. Success rate: ${accuracyMeasurement.successRate}%. Review?`,
    title: 'Imitation Learning Complete',
    context: { runId: ctx.runId, successRate: accuracyMeasurement.successRate }
  });

  return {
    success: accuracyMeasurement.successRate >= 85,
    projectName,
    trainedPolicy: { policyPath: rlFineTuning.policyPath, method: learningMethod },
    performanceMetrics: { successRate: accuracyMeasurement.successRate, imitationAccuracy: accuracyMeasurement.accuracy },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/imitation-learning', timestamp: startTime, outputDir }
  };
}

export const demonstrationCollectionTask = defineTask('demonstration-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Demo Collection - ${args.projectName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Collect expert demonstrations', context: args, instructions: ['1. Set up data collection system', '2. Record teleoperation demos', '3. Collect motion capture data', '4. Annotate demonstrations', '5. Validate demo quality'] },
    outputSchema: { type: 'object', required: ['demoDataset', 'numDemos', 'artifacts'], properties: { demoDataset: { type: 'string' }, numDemos: { type: 'number' }, demoFormat: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'collection']
}));

export const demonstrationPreprocessingTask = defineTask('demonstration-preprocessing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Demo Preprocessing - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Data Engineer', task: 'Preprocess and augment demonstration data', context: args, instructions: ['1. Clean noisy demonstrations', '2. Normalize data', '3. Apply data augmentation', '4. Create train/val splits', '5. Verify data quality'] },
    outputSchema: { type: 'object', required: ['processedDataset', 'statistics', 'artifacts'], properties: { processedDataset: { type: 'string' }, statistics: { type: 'object' }, augmentations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'preprocessing']
}));

export const policyNetworkDesignTask = defineTask('policy-network-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Design - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Design neural network architecture', context: args, instructions: ['1. Design policy network', '2. Choose architecture type', '3. Configure input/output layers', '4. Add regularization', '5. Document architecture'] },
    outputSchema: { type: 'object', required: ['architecture', 'layers', 'artifacts'], properties: { architecture: { type: 'object' }, layers: { type: 'array' }, parameters: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'network']
}));

export const behaviorCloningTrainingTask = defineTask('behavior-cloning-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `BC Training - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Implement behavior cloning training', context: args, instructions: ['1. Configure training loop', '2. Set loss function', '3. Train on demonstrations', '4. Monitor validation loss', '5. Save best model'] },
    outputSchema: { type: 'object', required: ['modelPath', 'trainingLoss', 'artifacts'], properties: { modelPath: { type: 'string' }, trainingLoss: { type: 'number' }, validationLoss: { type: 'number' }, epochs: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'training']
}));

export const daggerImprovementTask = defineTask('dagger-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: `DAgger Improvement - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Add DAgger for iterative improvement', context: args, instructions: ['1. Run policy in environment', '2. Query expert for corrections', '3. Aggregate new data', '4. Retrain policy', '5. Iterate until convergence'] },
    outputSchema: { type: 'object', required: ['improvedPolicy', 'daggerIterations', 'artifacts'], properties: { improvedPolicy: { type: 'string' }, daggerIterations: { type: 'number' }, performanceGain: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'dagger']
}));

export const imitationSimValidationTask = defineTask('imitation-sim-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sim Validation - ${args.projectName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Validate learned policy in simulation', context: args, instructions: ['1. Run evaluation episodes', '2. Compare to demonstrations', '3. Test generalization', '4. Analyze failure modes', '5. Generate report'] },
    outputSchema: { type: 'object', required: ['validationResults', 'successRate', 'artifacts'], properties: { validationResults: { type: 'object' }, successRate: { type: 'number' }, failureModes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'validation']
}));

export const imitationAccuracyTask = defineTask('imitation-accuracy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Accuracy Measurement - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Measure imitation accuracy', context: args, instructions: ['1. Compute trajectory similarity', '2. Measure action accuracy', '3. Calculate success rate', '4. Compare to expert', '5. Document metrics'] },
    outputSchema: { type: 'object', required: ['accuracy', 'successRate', 'artifacts'], properties: { accuracy: { type: 'number' }, successRate: { type: 'number' }, trajectorySimilarity: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'accuracy']
}));

export const rlFineTuningTask = defineTask('rl-fine-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `RL Fine-Tuning - ${args.projectName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Fine-tune with RL if needed', context: args, instructions: ['1. Initialize from BC policy', '2. Configure RL fine-tuning', '3. Train with sparse reward', '4. Balance exploration', '5. Validate improvement'] },
    outputSchema: { type: 'object', required: ['policyPath', 'improvement', 'artifacts'], properties: { policyPath: { type: 'string' }, improvement: { type: 'number' }, rlEpisodes: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'fine-tuning']
}));

export const imitationDeploymentTask = defineTask('imitation-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Robot Deployment - ${args.projectName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Deploy to physical robot', context: args, instructions: ['1. Export policy for deployment', '2. Configure ROS interface', '3. Test on hardware', '4. Measure real performance', '5. Document deployment'] },
    outputSchema: { type: 'object', required: ['deploymentConfig', 'realWorldResults', 'artifacts'], properties: { deploymentConfig: { type: 'object' }, realWorldResults: { type: 'object' }, transferGap: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'imitation-learning', 'deployment']
}));
