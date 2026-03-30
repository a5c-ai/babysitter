/**
 * @process specializations/game-development/vertical-slice-development
 * @description Vertical Slice Development Process - Create a complete, polished slice of the game demonstrating all core
 * systems including gameplay, art, audio, and polish to establish quality bar and serve as production reference.
 * @inputs { projectName: string, sliceScope?: string, targetDuration?: string, systemsToInclude?: array, outputDir?: string }
 * @outputs { success: boolean, sliceBuildPath: string, qualityAssessment: object, productionReadiness: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/vertical-slice-development', {
 *   projectName: 'Stellar Odyssey',
 *   sliceScope: 'opening-level',
 *   targetDuration: '15-20 minutes',
 *   systemsToInclude: ['combat', 'exploration', 'dialogue', 'progression']
 * });
 *
 * @references
 * - GDC: Building a Vertical Slice
 * - Game Production Handbook by Heather Maxwell Chandler
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sliceScope = 'single-level',
    targetDuration = '15 minutes',
    systemsToInclude = [],
    qualityBar = 'shippable',
    targetPlatform = 'PC',
    outputDir = 'vertical-slice-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Vertical Slice Development: ${projectName}`);
  ctx.log('info', `Scope: ${sliceScope}, Duration: ${targetDuration}`);

  // Phase 1: Slice Scope Definition
  const scopeDefinition = await ctx.task(sliceScopeTask, {
    projectName, sliceScope, targetDuration, systemsToInclude, qualityBar, outputDir
  });
  artifacts.push(...scopeDefinition.artifacts);

  // Phase 2: Systems Implementation
  const systemsImpl = await ctx.task(sliceSystemsTask, {
    projectName, scopeDefinition, systemsToInclude, outputDir
  });
  artifacts.push(...systemsImpl.artifacts);

  // Phase 3: Content Creation
  const contentCreation = await ctx.task(sliceContentTask, {
    projectName, scopeDefinition, systemsImpl, outputDir
  });
  artifacts.push(...contentCreation.artifacts);

  // Phase 4: Art Polish
  const artPolish = await ctx.task(sliceArtPolishTask, {
    projectName, contentCreation, qualityBar, outputDir
  });
  artifacts.push(...artPolish.artifacts);

  // Phase 5: Audio Integration
  const audioIntegration = await ctx.task(sliceAudioTask, {
    projectName, contentCreation, artPolish, outputDir
  });
  artifacts.push(...audioIntegration.artifacts);

  // Phase 6: Playtesting
  const playtesting = await ctx.task(slicePlaytestTask, {
    projectName, systemsImpl, contentCreation, artPolish, audioIntegration, outputDir
  });
  artifacts.push(...playtesting.artifacts);

  await ctx.breakpoint({
    question: `Vertical slice playtest complete for ${projectName}. Player satisfaction: ${playtesting.satisfactionScore}/10. Quality bar met: ${playtesting.qualityBarMet}. Review and iterate?`,
    title: 'Vertical Slice Playtest Review',
    context: { runId: ctx.runId, playtesting, files: playtesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
  });

  // Phase 7: Polish and Iteration
  const polishIteration = await ctx.task(slicePolishTask, {
    projectName, playtesting, qualityBar, outputDir
  });
  artifacts.push(...polishIteration.artifacts);

  // Phase 8: Stakeholder Review
  const stakeholderReview = await ctx.task(sliceStakeholderReviewTask, {
    projectName, polishIteration, qualityBar, outputDir
  });
  artifacts.push(...stakeholderReview.artifacts);

  await ctx.breakpoint({
    question: `Vertical Slice complete for ${projectName}. Stakeholder approval: ${stakeholderReview.approved ? 'YES' : 'PENDING'}. Ready for full production?`,
    title: 'Vertical Slice Complete',
    context: { runId: ctx.runId, summary: { projectName, qualityScore: polishIteration.qualityScore, approved: stakeholderReview.approved } }
  });

  return {
    success: true,
    projectName,
    sliceBuildPath: polishIteration.buildPath,
    qualityAssessment: { qualityScore: polishIteration.qualityScore, qualityBarMet: polishIteration.qualityBarMet },
    productionReadiness: { approved: stakeholderReview.approved, recommendations: stakeholderReview.recommendations },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/vertical-slice-development', timestamp: startTime, outputDir }
  };
}

export const sliceScopeTask = defineTask('slice-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: `Slice Scope Definition - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Producer',
      task: 'Define vertical slice scope and requirements',
      context: args,
      instructions: ['1. Define slice content boundaries', '2. List all systems to demonstrate', '3. Define quality requirements', '4. Create asset list', '5. Define acceptance criteria']
    },
    outputSchema: { type: 'object', required: ['sliceRequirements', 'assetList', 'acceptanceCriteria', 'artifacts'], properties: { sliceRequirements: { type: 'object' }, assetList: { type: 'array' }, acceptanceCriteria: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'scope']
}));

export const sliceSystemsTask = defineTask('slice-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: `Systems Implementation - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Lead Programmer', task: 'Implement all systems for vertical slice', context: args, instructions: ['1. Implement core gameplay systems', '2. Integrate all required mechanics', '3. Add polish and juice', '4. Verify system interactions'] },
    outputSchema: { type: 'object', required: ['systemsImplemented', 'integrationStatus', 'artifacts'], properties: { systemsImplemented: { type: 'array' }, integrationStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'systems']
}));

export const sliceContentTask = defineTask('slice-content', (args, taskCtx) => ({
  kind: 'agent',
  title: `Content Creation - ${args.projectName}`,
  agent: {
    name: 'level-designer-agent',
    prompt: { role: 'Content Lead', task: 'Create content for vertical slice', context: args, instructions: ['1. Build slice level/area', '2. Place gameplay elements', '3. Implement encounters', '4. Add narrative content'] },
    outputSchema: { type: 'object', required: ['contentCreated', 'artifacts'], properties: { contentCreated: { type: 'array' }, levelPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'content']
}));

export const sliceArtPolishTask = defineTask('slice-art-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: `Art Polish - ${args.projectName}`,
  agent: {
    name: 'art-director-agent',
    prompt: { role: 'Art Director', task: 'Polish art to final quality', context: args, instructions: ['1. Replace placeholder art', '2. Add VFX and particles', '3. Polish lighting', '4. Verify quality bar'] },
    outputSchema: { type: 'object', required: ['artAssetsPolished', 'qualityVerified', 'artifacts'], properties: { artAssetsPolished: { type: 'number' }, qualityVerified: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'art']
}));

export const sliceAudioTask = defineTask('slice-audio', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audio Integration - ${args.projectName}`,
  agent: {
    name: 'audio-designer-agent',
    prompt: { role: 'Audio Lead', task: 'Integrate final audio', context: args, instructions: ['1. Implement sound effects', '2. Add music and ambience', '3. Mix audio levels', '4. Add voice if applicable'] },
    outputSchema: { type: 'object', required: ['audioAssetsIntegrated', 'mixComplete', 'artifacts'], properties: { audioAssetsIntegrated: { type: 'number' }, mixComplete: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'audio']
}));

export const slicePlaytestTask = defineTask('slice-playtest', (args, taskCtx) => ({
  kind: 'agent',
  title: `Slice Playtesting - ${args.projectName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: { role: 'UX Researcher', task: 'Conduct vertical slice playtesting', context: args, instructions: ['1. Run playtest sessions', '2. Gather quantitative metrics', '3. Collect qualitative feedback', '4. Assess quality bar'] },
    outputSchema: { type: 'object', required: ['satisfactionScore', 'qualityBarMet', 'feedback', 'artifacts'], properties: { satisfactionScore: { type: 'number' }, qualityBarMet: { type: 'boolean' }, feedback: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'playtesting']
}));

export const slicePolishTask = defineTask('slice-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: `Final Polish - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: { role: 'Producer', task: 'Final polish and iteration', context: args, instructions: ['1. Address playtest feedback', '2. Bug fix and polish', '3. Verify quality bar', '4. Create final build'] },
    outputSchema: { type: 'object', required: ['qualityScore', 'qualityBarMet', 'buildPath', 'artifacts'], properties: { qualityScore: { type: 'number' }, qualityBarMet: { type: 'boolean' }, buildPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'polish']
}));

export const sliceStakeholderReviewTask = defineTask('slice-stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stakeholder Review - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: { role: 'Executive Producer', task: 'Conduct stakeholder review', context: args, instructions: ['1. Present vertical slice', '2. Gather stakeholder feedback', '3. Document approval status', '4. List recommendations for production'] },
    outputSchema: { type: 'object', required: ['approved', 'recommendations', 'artifacts'], properties: { approved: { type: 'boolean' }, feedback: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vertical-slice', 'review']
}));
