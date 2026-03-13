/**
 * @process specializations/game-development/art-asset-pipeline
 * @description Art Asset Production Pipeline Process - Establish and manage art production pipeline from concept
 * to final implementation including style guides, asset creation workflows, optimization, and quality gates.
 * @inputs { projectName: string, artStyle?: string, targetPlatforms?: array, outputDir?: string }
 * @outputs { success: boolean, pipelineDoc: string, styleGuide: string, assetList: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/art-asset-pipeline', {
 *   projectName: 'Stellar Odyssey',
 *   artStyle: 'stylized-realistic',
 *   targetPlatforms: ['PC', 'console']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    artStyle = 'stylized',
    targetPlatforms = ['PC'],
    assetCategories = ['characters', 'environments', 'props', 'vfx'],
    outputDir = 'art-pipeline-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Art Asset Pipeline: ${projectName}`);

  // Phase 1: Art Direction
  const artDirection = await ctx.task(artDirectionTask, { projectName, artStyle, outputDir });
  artifacts.push(...artDirection.artifacts);

  // Phase 2: Style Guide Creation
  const styleGuide = await ctx.task(styleGuideTask, { projectName, artDirection, assetCategories, outputDir });
  artifacts.push(...styleGuide.artifacts);

  // Phase 3: Pipeline Setup
  const pipelineSetup = await ctx.task(artPipelineSetupTask, { projectName, targetPlatforms, assetCategories, outputDir });
  artifacts.push(...pipelineSetup.artifacts);

  // Phase 4: Asset Specifications
  const assetSpecs = await ctx.task(assetSpecificationsTask, { projectName, styleGuide, targetPlatforms, outputDir });
  artifacts.push(...assetSpecs.artifacts);

  // Phase 5: Quality Gates
  const qualityGates = await ctx.task(artQualityGatesTask, { projectName, assetSpecs, outputDir });
  artifacts.push(...qualityGates.artifacts);

  // Phase 6: Optimization Guidelines
  const optimizationGuidelines = await ctx.task(artOptimizationTask, { projectName, targetPlatforms, outputDir });
  artifacts.push(...optimizationGuidelines.artifacts);

  await ctx.breakpoint({
    question: `Art pipeline established for ${projectName}. Style guide complete. Quality gates defined. Review pipeline documentation?`,
    title: 'Art Pipeline Review',
    context: { runId: ctx.runId, styleGuide, qualityGates }
  });

  return {
    success: true,
    projectName,
    pipelineDoc: pipelineSetup.docPath,
    styleGuide: styleGuide.guidePath,
    assetList: assetSpecs.assets,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/art-asset-pipeline', timestamp: startTime, outputDir }
  };
}

export const artDirectionTask = defineTask('art-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Art Direction - ${args.projectName}`,
  agent: {
    name: 'art-director-agent',
    prompt: { role: 'Art Director', task: 'Define art direction', context: args, instructions: ['1. Define visual style', '2. Create mood boards', '3. Define color theory', '4. Establish visual hierarchy'] },
    outputSchema: { type: 'object', required: ['artStyleDoc', 'moodBoards', 'artifacts'], properties: { artStyleDoc: { type: 'string' }, moodBoards: { type: 'array' }, colorPalette: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'art-pipeline', 'art-direction']
}));

export const styleGuideTask = defineTask('style-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Style Guide - ${args.projectName}`,
  agent: {
    name: 'art-director-agent',
    prompt: { role: 'Art Director', task: 'Create comprehensive style guide', context: args, instructions: ['1. Document character style', '2. Document environment style', '3. Define prop guidelines', '4. Create visual examples'] },
    outputSchema: { type: 'object', required: ['guidePath', 'categories', 'artifacts'], properties: { guidePath: { type: 'string' }, categories: { type: 'array' }, examples: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'art-pipeline', 'style-guide']
}));

export const artPipelineSetupTask = defineTask('art-pipeline-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Setup - ${args.projectName}`,
  agent: {
    name: 'tech-artist-agent',
    prompt: { role: 'Tech Artist', task: 'Set up art production pipeline', context: args, instructions: ['1. Define folder structure', '2. Set up version control', '3. Configure asset import', '4. Create validation tools'] },
    outputSchema: { type: 'object', required: ['docPath', 'pipelineTools', 'artifacts'], properties: { docPath: { type: 'string' }, pipelineTools: { type: 'array' }, workflows: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'art-pipeline', 'setup']
}));

export const assetSpecificationsTask = defineTask('asset-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Asset Specifications - ${args.projectName}`,
  agent: {
    name: 'tech-artist-agent',
    prompt: { role: 'Tech Artist', task: 'Define asset specifications', context: args, instructions: ['1. Define poly budgets', '2. Define texture sizes', '3. Specify LOD requirements', '4. Document naming conventions'] },
    outputSchema: { type: 'object', required: ['assets', 'specifications', 'artifacts'], properties: { assets: { type: 'array' }, specifications: { type: 'object' }, namingConventions: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'art-pipeline', 'specifications']
}));

export const artQualityGatesTask = defineTask('art-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Gates - ${args.projectName}`,
  agent: {
    name: 'art-director-agent',
    prompt: { role: 'Art Director', task: 'Define art quality gates', context: args, instructions: ['1. Define concept approval', '2. Define modeling checkpoints', '3. Define final approval', '4. Create checklists'] },
    outputSchema: { type: 'object', required: ['gates', 'checklists', 'artifacts'], properties: { gates: { type: 'array' }, checklists: { type: 'object' }, approvalProcess: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'art-pipeline', 'quality-gates']
}));

export const artOptimizationTask = defineTask('art-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimization Guidelines - ${args.projectName}`,
  agent: {
    name: 'tech-artist-agent',
    prompt: { role: 'Tech Artist', task: 'Create optimization guidelines', context: args, instructions: ['1. Define optimization targets', '2. Create LOD guidelines', '3. Define texture compression', '4. Document best practices'] },
    outputSchema: { type: 'object', required: ['guidelines', 'targets', 'artifacts'], properties: { guidelines: { type: 'object' }, targets: { type: 'object' }, bestPractices: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'art-pipeline', 'optimization']
}));
