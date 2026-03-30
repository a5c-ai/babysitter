/**
 * @process specializations/robotics-simulation/autonomous-exploration
 * @description Autonomous Exploration and Mapping - Implement frontier-based autonomous exploration for
 * unknown environments including frontier detection, information gain prioritization, SLAM integration,
 * and exploration efficiency measurement.
 * @inputs { robotName: string, explorationAlgorithm?: string, environmentType?: string, outputDir?: string }
 * @outputs { success: boolean, explorationConfig: object, coverageMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/autonomous-exploration', {
 *   robotName: 'exploration_robot',
 *   explorationAlgorithm: 'frontier-based',
 *   environmentType: 'indoor-unknown'
 * });
 *
 * @references
 * - explore_lite: https://github.com/RobustFieldAutonomyLab/explore_lite
 * - Frontier Exploration: http://wiki.ros.org/frontier_exploration
 * - Frontier-based Exploration: https://ieeexplore.ieee.org/document/613851
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    explorationAlgorithm = 'frontier-based',
    environmentType = 'indoor',
    outputDir = 'autonomous-exploration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Autonomous Exploration for ${robotName}`);

  const frontierDetection = await ctx.task(frontierDetectionTask, { robotName, explorationAlgorithm, outputDir });
  artifacts.push(...frontierDetection.artifacts);

  const informationGain = await ctx.task(informationGainPrioritizationTask, { robotName, frontierDetection, outputDir });
  artifacts.push(...informationGain.artifacts);

  const slamIntegration = await ctx.task(explorationSlamIntegrationTask, { robotName, explorationAlgorithm, outputDir });
  artifacts.push(...slamIntegration.artifacts);

  const pathPlanning = await ctx.task(explorationPathPlanningTask, { robotName, frontierDetection, outputDir });
  artifacts.push(...pathPlanning.artifacts);

  const complexEnvironments = await ctx.task(complexEnvironmentHandlingTask, { robotName, environmentType, outputDir });
  artifacts.push(...complexEnvironments.artifacts);

  const loopClosure = await ctx.task(explorationLoopClosureTask, { robotName, slamIntegration, outputDir });
  artifacts.push(...loopClosure.artifacts);

  const terminationCriteria = await ctx.task(explorationTerminationTask, { robotName, frontierDetection, outputDir });
  artifacts.push(...terminationCriteria.artifacts);

  const environmentTesting = await ctx.task(explorationEnvironmentTestingTask, { robotName, environmentType, outputDir });
  artifacts.push(...environmentTesting.artifacts);

  const efficiencyMetrics = await ctx.task(explorationEfficiencyTask, { robotName, environmentTesting, outputDir });
  artifacts.push(...efficiencyMetrics.artifacts);

  await ctx.breakpoint({
    question: `Autonomous Exploration Complete for ${robotName}. Coverage: ${efficiencyMetrics.coverage}%, Efficiency: ${efficiencyMetrics.efficiency}. Review?`,
    title: 'Autonomous Exploration Complete',
    context: { runId: ctx.runId, coverage: efficiencyMetrics.coverage, efficiency: efficiencyMetrics.efficiency }
  });

  return {
    success: efficiencyMetrics.coverage >= 95,
    robotName,
    explorationConfig: { algorithm: explorationAlgorithm, parameters: frontierDetection.parameters },
    coverageMetrics: { coverage: efficiencyMetrics.coverage, explorationTime: efficiencyMetrics.explorationTime, efficiency: efficiencyMetrics.efficiency },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/autonomous-exploration', timestamp: startTime, outputDir }
  };
}

export const frontierDetectionTask = defineTask('frontier-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Frontier Detection - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement frontier detection algorithm', context: args, instructions: ['1. Configure frontier detection', '2. Set minimum frontier size', '3. Filter invalid frontiers', '4. Cluster nearby frontiers', '5. Test frontier detection'] },
    outputSchema: { type: 'object', required: ['frontierConfig', 'parameters', 'artifacts'], properties: { frontierConfig: { type: 'object' }, parameters: { type: 'object' }, minFrontierSize: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'frontier']
}));

export const informationGainPrioritizationTask = defineTask('information-gain-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Information Gain - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Prioritize frontiers by information gain', context: args, instructions: ['1. Compute expected information gain', '2. Add distance cost', '3. Balance exploration vs travel', '4. Implement utility function', '5. Test prioritization'] },
    outputSchema: { type: 'object', required: ['utilityFunction', 'weights', 'artifacts'], properties: { utilityFunction: { type: 'object' }, weights: { type: 'object' }, gainMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'information-gain']
}));

export const explorationSlamIntegrationTask = defineTask('exploration-slam-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `SLAM Integration - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Integrate with SLAM system', context: args, instructions: ['1. Subscribe to map updates', '2. Handle map growth', '3. Coordinate with localization', '4. Handle map reset scenarios', '5. Test SLAM integration'] },
    outputSchema: { type: 'object', required: ['slamIntegration', 'mapTopics', 'artifacts'], properties: { slamIntegration: { type: 'object' }, mapTopics: { type: 'array' }, updateFrequency: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'slam']
}));

export const explorationPathPlanningTask = defineTask('exploration-path-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Path Planning - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Plan safe paths to exploration targets', context: args, instructions: ['1. Integrate with navigation stack', '2. Handle unknown regions', '3. Add safety margins', '4. Configure replanning', '5. Test path planning'] },
    outputSchema: { type: 'object', required: ['pathPlanningConfig', 'navigationIntegration', 'artifacts'], properties: { pathPlanningConfig: { type: 'object' }, navigationIntegration: { type: 'object' }, safetyMargins: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'path-planning']
}));

export const complexEnvironmentHandlingTask = defineTask('complex-environment-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Complex Environments - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Handle exploration in complex environments', context: args, instructions: ['1. Handle multi-story buildings', '2. Handle narrow passages', '3. Handle dead ends', '4. Handle dynamic obstacles', '5. Test complex scenarios'] },
    outputSchema: { type: 'object', required: ['complexHandling', 'scenarios', 'artifacts'], properties: { complexHandling: { type: 'object' }, scenarios: { type: 'array' }, recoveryStrategies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'complex-environments']
}));

export const explorationLoopClosureTask = defineTask('exploration-loop-closure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Loop Closure - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Add loop closure for map consistency', context: args, instructions: ['1. Detect loop closure opportunities', '2. Coordinate with SLAM', '3. Handle map corrections', '4. Update frontiers after closure', '5. Test loop closure'] },
    outputSchema: { type: 'object', required: ['loopClosureConfig', 'mapUpdateHandling', 'artifacts'], properties: { loopClosureConfig: { type: 'object' }, mapUpdateHandling: { type: 'object' }, closureFrequency: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'loop-closure']
}));

export const explorationTerminationTask = defineTask('exploration-termination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Termination Criteria - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement exploration termination criteria', context: args, instructions: ['1. Define coverage threshold', '2. Add frontier exhaustion check', '3. Configure timeout', '4. Handle unreachable areas', '5. Test termination'] },
    outputSchema: { type: 'object', required: ['terminationCriteria', 'thresholds', 'artifacts'], properties: { terminationCriteria: { type: 'array' }, thresholds: { type: 'object' }, coverageTarget: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'termination']
}));

export const explorationEnvironmentTestingTask = defineTask('exploration-environment-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Environment Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test in diverse environments', context: args, instructions: ['1. Test in indoor structured', '2. Test in outdoor unstructured', '3. Test in cluttered environments', '4. Test in large-scale areas', '5. Measure coverage'] },
    outputSchema: { type: 'object', required: ['testResults', 'environmentCoverage', 'artifacts'], properties: { testResults: { type: 'array' }, environmentCoverage: { type: 'object' }, challengingCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'testing']
}));

export const explorationEfficiencyTask = defineTask('exploration-efficiency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Efficiency Metrics - ${args.robotName}`,
  agent: {
    name: 'slam-localization-expert',  // AG-006: SLAM and Localization Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Measure exploration efficiency', context: args, instructions: ['1. Measure coverage percentage', '2. Compute exploration time', '3. Calculate path efficiency', '4. Measure redundancy', '5. Generate efficiency report'] },
    outputSchema: { type: 'object', required: ['coverage', 'explorationTime', 'efficiency', 'artifacts'], properties: { coverage: { type: 'number' }, explorationTime: { type: 'number' }, efficiency: { type: 'number' }, pathLength: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'exploration', 'efficiency']
}));
