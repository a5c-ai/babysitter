/**
 * @process specializations/game-development/game-engine-setup
 * @description Game Engine Selection and Setup Process - Evaluate and configure appropriate game engine for project
 * requirements including technical evaluation, project setup, coding standards, and build pipeline configuration.
 * @inputs { projectName: string, targetPlatforms?: array, graphicsRequirements?: string, teamExperience?: object, outputDir?: string }
 * @outputs { success: boolean, selectedEngine: string, projectSetupPath: string, buildPipelinePath: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/game-engine-setup', {
 *   projectName: 'Stellar Odyssey',
 *   targetPlatforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
 *   graphicsRequirements: 'high-end',
 *   teamExperience: { unity: 3, unreal: 5, godot: 1 }
 * });
 *
 * @references
 * - Unity Official Documentation
 * - Unreal Engine Documentation
 * - Godot Engine Documentation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetPlatforms = ['PC'],
    graphicsRequirements = 'medium',
    teamExperience = {},
    projectType = '3d-action',
    multiplayerRequirements = 'none',
    budgetConstraints = 'standard',
    outputDir = 'engine-setup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Game Engine Setup: ${projectName}`);

  // Phase 1: Requirements Analysis
  const requirementsAnalysis = await ctx.task(engineRequirementsTask, {
    projectName, targetPlatforms, graphicsRequirements, projectType, multiplayerRequirements, outputDir
  });
  artifacts.push(...requirementsAnalysis.artifacts);

  // Phase 2: Engine Evaluation
  const engineEvaluation = await ctx.task(engineEvaluationTask, {
    projectName, requirementsAnalysis, teamExperience, budgetConstraints, outputDir
  });
  artifacts.push(...engineEvaluation.artifacts);

  await ctx.breakpoint({
    question: `Engine evaluation complete for ${projectName}. Recommended: ${engineEvaluation.recommendedEngine}. Score: ${engineEvaluation.scores[engineEvaluation.recommendedEngine]}/100. Approve engine selection?`,
    title: 'Engine Selection Review',
    context: { runId: ctx.runId, scores: engineEvaluation.scores, recommendation: engineEvaluation.recommendedEngine }
  });

  // Phase 3: Engine Selection Decision
  const engineSelection = await ctx.task(engineSelectionTask, {
    projectName, engineEvaluation, outputDir
  });
  artifacts.push(...engineSelection.artifacts);

  // Phase 4: Project Setup
  const projectSetup = await ctx.task(projectSetupTask, {
    projectName, selectedEngine: engineSelection.selectedEngine, targetPlatforms, outputDir
  });
  artifacts.push(...projectSetup.artifacts);

  // Phase 5: Version Control Setup
  const versionControl = await ctx.task(versionControlSetupTask, {
    projectName, selectedEngine: engineSelection.selectedEngine, outputDir
  });
  artifacts.push(...versionControl.artifacts);

  // Phase 6: Coding Standards
  const codingStandards = await ctx.task(codingStandardsTask, {
    projectName, selectedEngine: engineSelection.selectedEngine, outputDir
  });
  artifacts.push(...codingStandards.artifacts);

  // Phase 7: Build Pipeline
  const buildPipeline = await ctx.task(buildPipelineSetupTask, {
    projectName, selectedEngine: engineSelection.selectedEngine, targetPlatforms, outputDir
  });
  artifacts.push(...buildPipeline.artifacts);

  return {
    success: true,
    projectName,
    selectedEngine: engineSelection.selectedEngine,
    projectSetupPath: projectSetup.projectPath,
    buildPipelinePath: buildPipeline.pipelinePath,
    configuration: {
      versionControl: versionControl.repoUrl,
      codingStandards: codingStandards.standardsPath
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/game-engine-setup', timestamp: startTime, outputDir }
  };
}

export const engineRequirementsTask = defineTask('engine-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engine Requirements - ${args.projectName}`,
  agent: {
    name: 'technical-director-agent',
    prompt: { role: 'Technical Director', task: 'Analyze engine requirements', context: args, instructions: ['1. Define graphics requirements', '2. Define platform requirements', '3. Assess multiplayer needs', '4. Identify performance targets'] },
    outputSchema: { type: 'object', required: ['requirements', 'priorities', 'artifacts'], properties: { requirements: { type: 'object' }, priorities: { type: 'array' }, constraints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'engine', 'requirements']
}));

export const engineEvaluationTask = defineTask('engine-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engine Evaluation - ${args.projectName}`,
  agent: {
    name: 'technical-director-agent',
    prompt: { role: 'Technical Director', task: 'Evaluate game engines', context: args, instructions: ['1. Evaluate Unity against requirements', '2. Evaluate Unreal against requirements', '3. Evaluate Godot against requirements', '4. Score and recommend'] },
    outputSchema: { type: 'object', required: ['scores', 'recommendedEngine', 'artifacts'], properties: { scores: { type: 'object' }, recommendedEngine: { type: 'string' }, evaluationNotes: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'engine', 'evaluation']
}));

export const engineSelectionTask = defineTask('engine-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engine Selection - ${args.projectName}`,
  agent: {
    name: 'technical-director-agent',
    prompt: { role: 'Technical Director', task: 'Finalize engine selection', context: args, instructions: ['1. Review evaluation results', '2. Consider team input', '3. Document selection rationale', '4. Plan training if needed'] },
    outputSchema: { type: 'object', required: ['selectedEngine', 'rationale', 'artifacts'], properties: { selectedEngine: { type: 'string' }, rationale: { type: 'string' }, trainingNeeds: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'engine', 'selection']
}));

export const projectSetupTask = defineTask('project-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Project Setup - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Lead Programmer', task: 'Set up engine project', context: args, instructions: ['1. Create project with proper settings', '2. Configure render pipeline', '3. Set up folder structure', '4. Configure platform settings'] },
    outputSchema: { type: 'object', required: ['projectPath', 'configuration', 'artifacts'], properties: { projectPath: { type: 'string' }, configuration: { type: 'object' }, folderStructure: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'engine', 'project-setup']
}));

export const versionControlSetupTask = defineTask('version-control-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Version Control Setup - ${args.projectName}`,
  agent: {
    name: 'devops-engineer-agent',
    prompt: { role: 'DevOps Engineer', task: 'Set up version control', context: args, instructions: ['1. Create repository', '2. Configure .gitignore for engine', '3. Set up Git LFS for assets', '4. Create branching strategy'] },
    outputSchema: { type: 'object', required: ['repoUrl', 'branchStrategy', 'artifacts'], properties: { repoUrl: { type: 'string' }, branchStrategy: { type: 'object' }, lfsConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'engine', 'version-control']
}));

export const codingStandardsTask = defineTask('coding-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coding Standards - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Lead Programmer', task: 'Define coding standards', context: args, instructions: ['1. Define naming conventions', '2. Create code style guide', '3. Define architecture patterns', '4. Set up linting tools'] },
    outputSchema: { type: 'object', required: ['standardsPath', 'patterns', 'artifacts'], properties: { standardsPath: { type: 'string' }, patterns: { type: 'array' }, lintingConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'engine', 'coding-standards']
}));

export const buildPipelineSetupTask = defineTask('build-pipeline-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Pipeline - ${args.projectName}`,
  agent: {
    name: 'build-engineer-agent',
    prompt: { role: 'Build Engineer', task: 'Configure build pipeline', context: args, instructions: ['1. Set up CI/CD pipeline', '2. Configure platform builds', '3. Add automated testing', '4. Configure artifact storage'] },
    outputSchema: { type: 'object', required: ['pipelinePath', 'platforms', 'artifacts'], properties: { pipelinePath: { type: 'string' }, platforms: { type: 'array' }, testingConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'engine', 'build-pipeline']
}));
