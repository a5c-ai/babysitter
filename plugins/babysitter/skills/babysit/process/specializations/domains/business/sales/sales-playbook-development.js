/**
 * @process sales/sales-playbook-development
 * @description Methodology for creating and maintaining sales playbooks including messaging, objection handling, competitive positioning, and deal strategy guides.
 * @inputs { playbookType: string, targetAudience: string, products: array, competitors?: array, existingContent?: object }
 * @outputs { success: boolean, playbook: object, sections: array, contentAssets: array, maintenancePlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/sales-playbook-development', {
 *   playbookType: 'enterprise-sales',
 *   targetAudience: 'Account Executives',
 *   products: ['Product A', 'Product B'],
 *   competitors: ['Competitor 1', 'Competitor 2']
 * });
 *
 * @references
 * - Highspot Sales Enablement: https://www.highspot.com/
 * - Sales Playbook Best Practices: https://www.gartner.com/en/sales
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    playbookType,
    targetAudience,
    products = [],
    competitors = [],
    existingContent = {},
    outputDir = 'playbook-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Sales Playbook Development - ${playbookType}`);

  // Phase 1: Playbook Structure Design
  const structureDesign = await ctx.task(playbookStructureTask, { playbookType, targetAudience, products, outputDir });
  artifacts.push(...(structureDesign.artifacts || []));

  // Phase 2: Messaging Framework
  const messagingFramework = await ctx.task(messagingFrameworkTask, { products, targetAudience, outputDir });
  artifacts.push(...(messagingFramework.artifacts || []));

  // Phase 3: Objection Handling
  const objectionHandling = await ctx.task(objectionHandlingTask, { products, competitors, outputDir });
  artifacts.push(...(objectionHandling.artifacts || []));

  // Phase 4: Competitive Positioning
  const competitivePositioning = await ctx.task(competitivePositioningTask, { products, competitors, outputDir });
  artifacts.push(...(competitivePositioning.artifacts || []));

  // Phase 5: Discovery Questions
  const discoveryQuestions = await ctx.task(discoveryQuestionsTask, { products, targetAudience, outputDir });
  artifacts.push(...(discoveryQuestions.artifacts || []));

  // Phase 6: Deal Strategy Guides
  const dealStrategyGuides = await ctx.task(dealStrategyGuidesTask, { playbookType, products, outputDir });
  artifacts.push(...(dealStrategyGuides.artifacts || []));

  // Phase 7: Content Asset Creation
  const contentAssets = await ctx.task(contentAssetCreationTask, {
    messagingFramework, objectionHandling, competitivePositioning, discoveryQuestions, outputDir
  });
  artifacts.push(...(contentAssets.artifacts || []));

  // Phase 8: Playbook Compilation
  const playbookCompilation = await ctx.task(playbookCompilationTask, {
    structureDesign, messagingFramework, objectionHandling, competitivePositioning,
    discoveryQuestions, dealStrategyGuides, contentAssets, outputDir
  });
  artifacts.push(...(playbookCompilation.artifacts || []));

  await ctx.breakpoint({
    question: `Sales playbook complete for ${playbookType}. ${playbookCompilation.sections?.length || 0} sections created. Review?`,
    title: 'Sales Playbook Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    playbookType,
    playbook: playbookCompilation.playbook,
    sections: playbookCompilation.sections,
    contentAssets: contentAssets.assets,
    maintenancePlan: playbookCompilation.maintenancePlan,
    artifacts,
    metadata: { processId: 'sales/sales-playbook-development', timestamp: startTime }
  };
}

export const playbookStructureTask = defineTask('playbook-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Playbook Structure Design',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Playbook architect',
      task: 'Design playbook structure and organization',
      context: args,
      instructions: ['Define playbook sections', 'Create navigation structure', 'Design user experience', 'Plan content organization']
    },
    outputSchema: { type: 'object', required: ['structure', 'artifacts'], properties: { structure: { type: 'object' }, sections: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'structure']
}));

export const messagingFrameworkTask = defineTask('messaging-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Messaging Framework',
  agent: {
    name: 'messaging-specialist',
    prompt: {
      role: 'Sales messaging specialist',
      task: 'Create messaging framework',
      context: args,
      instructions: ['Develop value propositions', 'Create elevator pitches', 'Build persona-specific messaging', 'Design messaging hierarchy']
    },
    outputSchema: { type: 'object', required: ['messaging', 'artifacts'], properties: { messaging: { type: 'object' }, valueProp: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'messaging']
}));

export const objectionHandlingTask = defineTask('objection-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Objection Handling Guide',
  agent: {
    name: 'sales-trainer',
    prompt: {
      role: 'Objection handling specialist',
      task: 'Create objection handling guide',
      context: args,
      instructions: ['Identify common objections', 'Develop response frameworks', 'Create talk tracks', 'Include practice scenarios']
    },
    outputSchema: { type: 'object', required: ['objections', 'artifacts'], properties: { objections: { type: 'array' }, categories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'objections']
}));

export const competitivePositioningTask = defineTask('competitive-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Competitive Positioning',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'Competitive positioning specialist',
      task: 'Create competitive positioning guides',
      context: args,
      instructions: ['Analyze competitor weaknesses', 'Create battle cards', 'Develop win themes', 'Design trap questions']
    },
    outputSchema: { type: 'object', required: ['positioning', 'artifacts'], properties: { positioning: { type: 'object' }, battleCards: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'competitive']
}));

export const discoveryQuestionsTask = defineTask('discovery-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discovery Questions',
  agent: {
    name: 'sales-trainer',
    prompt: {
      role: 'Discovery methodology specialist',
      task: 'Create discovery question bank',
      context: args,
      instructions: ['Develop situation questions', 'Create pain-finding questions', 'Build qualification questions', 'Design follow-up probes']
    },
    outputSchema: { type: 'object', required: ['questions', 'artifacts'], properties: { questions: { type: 'array' }, categories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'discovery']
}));

export const dealStrategyGuidesTask = defineTask('deal-strategy-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deal Strategy Guides',
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Deal strategy specialist',
      task: 'Create deal strategy guides',
      context: args,
      instructions: ['Create stage-based guides', 'Develop deal review templates', 'Build strategy frameworks', 'Design coaching guides']
    },
    outputSchema: { type: 'object', required: ['guides', 'artifacts'], properties: { guides: { type: 'array' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'deal-strategy']
}));

export const contentAssetCreationTask = defineTask('content-asset-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Content Asset Creation',
  agent: {
    name: 'content-specialist',
    prompt: {
      role: 'Sales content specialist',
      task: 'Create supporting content assets',
      context: args,
      instructions: ['Create quick reference cards', 'Develop cheat sheets', 'Build email templates', 'Design presentation snippets']
    },
    outputSchema: { type: 'object', required: ['assets', 'artifacts'], properties: { assets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'content']
}));

export const playbookCompilationTask = defineTask('playbook-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Playbook Compilation',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Playbook program manager',
      task: 'Compile and finalize playbook',
      context: args,
      instructions: ['Compile all sections', 'Create navigation', 'Build maintenance plan', 'Define update process']
    },
    outputSchema: { type: 'object', required: ['playbook', 'sections', 'maintenancePlan', 'artifacts'], properties: { playbook: { type: 'object' }, sections: { type: 'array' }, maintenancePlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'playbook', 'compilation']
}));
