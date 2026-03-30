/**
 * @process specializations/robotics-simulation/human-robot-interaction
 * @description Human-Robot Interaction (HRI) Interface - Develop intuitive and safe human-robot interaction
 * systems including gesture recognition, speech interfaces, safety monitoring, and collaborative behaviors.
 * @inputs { robotName: string, interactionMode?: string, safetyLevel?: string, outputDir?: string }
 * @outputs { success: boolean, hriConfig: object, safetyMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/human-robot-interaction', {
 *   robotName: 'collaborative_robot',
 *   interactionMode: 'collaborative',
 *   safetyLevel: 'iso-10218'
 * });
 *
 * @references
 * - HRI: https://humanrobotinteraction.org/
 * - ISO 10218: https://www.iso.org/standard/51330.html
 * - Collaborative Robots: https://www.iso.org/standard/62996.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    interactionMode = 'collaborative',
    safetyLevel = 'iso-10218',
    outputDir = 'hri-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Human-Robot Interaction Development for ${robotName}`);

  const gestureRecognition = await ctx.task(gestureRecognitionTask, { robotName, interactionMode, outputDir });
  artifacts.push(...gestureRecognition.artifacts);

  const speechInterface = await ctx.task(speechInterfaceTask, { robotName, interactionMode, outputDir });
  artifacts.push(...speechInterface.artifacts);

  const intentRecognition = await ctx.task(intentRecognitionTask, { robotName, gestureRecognition, speechInterface, outputDir });
  artifacts.push(...intentRecognition.artifacts);

  const humanDetection = await ctx.task(humanDetectionTrackingTask, { robotName, outputDir });
  artifacts.push(...humanDetection.artifacts);

  const safetyMonitoring = await ctx.task(hriSafetyMonitoringTask, { robotName, safetyLevel, humanDetection, outputDir });
  artifacts.push(...safetyMonitoring.artifacts);

  const collaborativeBehaviors = await ctx.task(collaborativeBehaviorsTask, { robotName, interactionMode, safetyMonitoring, outputDir });
  artifacts.push(...collaborativeBehaviors.artifacts);

  const feedbackSystems = await ctx.task(feedbackSystemsTask, { robotName, interactionMode, outputDir });
  artifacts.push(...feedbackSystems.artifacts);

  const userStudyTesting = await ctx.task(userStudyTestingTask, { robotName, collaborativeBehaviors, outputDir });
  artifacts.push(...userStudyTesting.artifacts);

  const safetyValidation = await ctx.task(hriSafetyValidationTask, { robotName, safetyLevel, safetyMonitoring, outputDir });
  artifacts.push(...safetyValidation.artifacts);

  await ctx.breakpoint({
    question: `HRI Development Complete for ${robotName}. User satisfaction: ${userStudyTesting.satisfaction}%, Safety compliant: ${safetyValidation.compliant}. Review?`,
    title: 'HRI Development Complete',
    context: { runId: ctx.runId, satisfaction: userStudyTesting.satisfaction, compliant: safetyValidation.compliant }
  });

  return {
    success: userStudyTesting.satisfaction >= 80 && safetyValidation.compliant,
    robotName,
    hriConfig: { interactionMode, configPath: gestureRecognition.configPath },
    safetyMetrics: { compliant: safetyValidation.compliant, safetyLevel, stoppingDistance: safetyMonitoring.stoppingDistance },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/human-robot-interaction', timestamp: startTime, outputDir }
  };
}

export const gestureRecognitionTask = defineTask('gesture-recognition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gesture Recognition - ${args.robotName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Implement gesture recognition', context: args, instructions: ['1. Set up pose estimation', '2. Train gesture classifier', '3. Define gesture vocabulary', '4. Implement real-time inference', '5. Test gesture recognition'] },
    outputSchema: { type: 'object', required: ['configPath', 'gestures', 'artifacts'], properties: { configPath: { type: 'string' }, gestures: { type: 'array' }, accuracy: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'gesture']
}));

export const speechInterfaceTask = defineTask('speech-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: `Speech Interface - ${args.robotName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Implement speech interface', context: args, instructions: ['1. Set up speech recognition', '2. Implement NLU pipeline', '3. Add text-to-speech', '4. Define command vocabulary', '5. Test speech interface'] },
    outputSchema: { type: 'object', required: ['speechConfig', 'commands', 'artifacts'], properties: { speechConfig: { type: 'object' }, commands: { type: 'array' }, wordErrorRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'speech']
}));

export const intentRecognitionTask = defineTask('intent-recognition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intent Recognition - ${args.robotName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Implement human intent recognition', context: args, instructions: ['1. Fuse multimodal inputs', '2. Train intent classifier', '3. Handle ambiguity', '4. Add context awareness', '5. Test intent recognition'] },
    outputSchema: { type: 'object', required: ['intentConfig', 'intents', 'artifacts'], properties: { intentConfig: { type: 'object' }, intents: { type: 'array' }, accuracy: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'intent']
}));

export const humanDetectionTrackingTask = defineTask('human-detection-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Human Detection - ${args.robotName}`,
  agent: {
    name: 'perception-engineer',
    prompt: { role: 'Perception Engineer', task: 'Implement human detection and tracking', context: args, instructions: ['1. Set up person detection', '2. Implement body tracking', '3. Add skeleton tracking', '4. Configure tracking filters', '5. Test detection accuracy'] },
    outputSchema: { type: 'object', required: ['detectionConfig', 'trackingAccuracy', 'artifacts'], properties: { detectionConfig: { type: 'object' }, trackingAccuracy: { type: 'number' }, latency: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'detection']
}));

export const hriSafetyMonitoringTask = defineTask('hri-safety-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Safety Monitoring - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Implement HRI safety monitoring', context: args, instructions: ['1. Configure safety zones', '2. Implement speed limiting', '3. Add force monitoring', '4. Configure safe stop', '5. Test safety systems'] },
    outputSchema: { type: 'object', required: ['safetyConfig', 'stoppingDistance', 'artifacts'], properties: { safetyConfig: { type: 'object' }, stoppingDistance: { type: 'number' }, responseTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'safety']
}));

export const collaborativeBehaviorsTask = defineTask('collaborative-behaviors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collaborative Behaviors - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement collaborative behaviors', context: args, instructions: ['1. Implement handover', '2. Add lead-through teaching', '3. Configure shared workspace', '4. Add adaptive behaviors', '5. Test collaboration'] },
    outputSchema: { type: 'object', required: ['behaviors', 'taskTypes', 'artifacts'], properties: { behaviors: { type: 'array' }, taskTypes: { type: 'array' }, successRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'collaboration']
}));

export const feedbackSystemsTask = defineTask('feedback-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feedback Systems - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement feedback systems', context: args, instructions: ['1. Add visual feedback', '2. Configure audio feedback', '3. Add haptic feedback', '4. Implement status displays', '5. Test feedback clarity'] },
    outputSchema: { type: 'object', required: ['feedbackConfig', 'modalities', 'artifacts'], properties: { feedbackConfig: { type: 'object' }, modalities: { type: 'array' }, clarity: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'feedback']
}));

export const userStudyTestingTask = defineTask('user-study-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `User Study Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Conduct user studies', context: args, instructions: ['1. Design user study', '2. Recruit participants', '3. Run interaction tests', '4. Collect feedback', '5. Analyze satisfaction'] },
    outputSchema: { type: 'object', required: ['satisfaction', 'usability', 'artifacts'], properties: { satisfaction: { type: 'number' }, usability: { type: 'number' }, feedback: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'user-study']
}));

export const hriSafetyValidationTask = defineTask('hri-safety-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Safety Validation - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Validate HRI safety compliance', context: args, instructions: ['1. Test against ISO standards', '2. Validate force limits', '3. Test emergency stops', '4. Document compliance', '5. Generate safety report'] },
    outputSchema: { type: 'object', required: ['compliant', 'standards', 'artifacts'], properties: { compliant: { type: 'boolean' }, standards: { type: 'array' }, testResults: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hri', 'safety-validation']
}));
