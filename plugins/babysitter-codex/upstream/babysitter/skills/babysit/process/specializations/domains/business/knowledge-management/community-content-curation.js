/**
 * @process domains/business/knowledge-management/community-content-curation
 * @description Curate, organize, and maintain community knowledge assets, best practices, discussion archives, and resources for member access
 * @specialization Knowledge Management
 * @category Communities of Practice Management
 * @inputs { community: object, contentScope: object, curationGoals: array, outputDir: string }
 * @outputs { success: boolean, curatedContent: array, contentStructure: object, curationGuidelines: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    community = {},
    contentScope = {},
    curationGoals = [],
    existingContent = [],
    taxonomyRequirements = {},
    outputDir = 'content-curation-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Community Content Curation and Management Process');

  const contentInventory = await ctx.task(contentInventoryTask, { community, existingContent, contentScope, outputDir });
  artifacts.push(...contentInventory.artifacts);

  await ctx.breakpoint({
    question: `Inventoried ${contentInventory.totalAssets} content assets. Review?`,
    title: 'Content Inventory Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { totalAssets: contentInventory.totalAssets } }
  });

  const contentAssessment = await ctx.task(contentAssessmentTask, { inventory: contentInventory.inventory, curationGoals, outputDir });
  artifacts.push(...contentAssessment.artifacts);

  const taxonomyDesign = await ctx.task(taxonomyDesignTask, { contentAssessment, taxonomyRequirements, community, outputDir });
  artifacts.push(...taxonomyDesign.artifacts);

  const curationPrioritization = await ctx.task(curationPrioritizationTask, { contentAssessment, curationGoals, outputDir });
  artifacts.push(...curationPrioritization.artifacts);

  const contentOrganization = await ctx.task(contentOrganizationTask, { inventory: contentInventory.inventory, taxonomy: taxonomyDesign.taxonomy, prioritization: curationPrioritization.priorities, outputDir });
  artifacts.push(...contentOrganization.artifacts);

  const metadataEnrichment = await ctx.task(metadataEnrichmentTask, { organizedContent: contentOrganization.structure, taxonomy: taxonomyDesign.taxonomy, outputDir });
  artifacts.push(...metadataEnrichment.artifacts);

  const curationGuidelines = await ctx.task(curationGuidelinesTask, { community, taxonomy: taxonomyDesign.taxonomy, curationGoals, outputDir });
  artifacts.push(...curationGuidelines.artifacts);

  const maintenancePlan = await ctx.task(maintenancePlanTask, { organizedContent: contentOrganization.structure, curationGuidelines: curationGuidelines.guidelines, outputDir });
  artifacts.push(...maintenancePlan.artifacts);

  const qualityAssessment = await ctx.task(qualityAssessmentTask, { contentInventory, contentOrganization, metadataEnrichment, curationGuidelines, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  let reviewResult = null;
  if (requireApproval) {
    reviewResult = await ctx.task(stakeholderReviewTask, { curatedContent: contentOrganization.structure, curationGuidelines: curationGuidelines.guidelines, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    curatedContent: contentOrganization.structure,
    contentStructure: taxonomyDesign.taxonomy,
    curationGuidelines: curationGuidelines.guidelines,
    maintenancePlan: maintenancePlan.plan,
    statistics: { totalAssets: contentInventory.totalAssets, categoriesCreated: taxonomyDesign.categoryCount },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/community-content-curation', timestamp: startTime, outputDir }
  };
}

export const contentInventoryTask = defineTask('content-inventory', (args, taskCtx) => ({
  kind: 'agent', title: 'Inventory content',
  agent: { name: 'content-inventorist', prompt: { role: 'content inventory specialist', task: 'Inventory community content', context: args, instructions: ['Catalog all community content', 'Save to output directory'], outputFormat: 'JSON with inventory (array), totalAssets (number), artifacts' }, outputSchema: { type: 'object', required: ['inventory', 'totalAssets', 'artifacts'], properties: { inventory: { type: 'array' }, totalAssets: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'inventory']
}));

export const contentAssessmentTask = defineTask('content-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess content',
  agent: { name: 'content-assessor', prompt: { role: 'content quality assessor', task: 'Assess content quality and relevance', context: args, instructions: ['Evaluate content against criteria', 'Save to output directory'], outputFormat: 'JSON with assessment (object), artifacts' }, outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'assessment']
}));

export const taxonomyDesignTask = defineTask('taxonomy-design', (args, taskCtx) => ({
  kind: 'agent', title: 'Design taxonomy',
  agent: { name: 'taxonomy-designer', prompt: { role: 'taxonomy designer', task: 'Design content taxonomy', context: args, instructions: ['Create classification structure', 'Save to output directory'], outputFormat: 'JSON with taxonomy (object), categoryCount (number), artifacts' }, outputSchema: { type: 'object', required: ['taxonomy', 'categoryCount', 'artifacts'], properties: { taxonomy: { type: 'object' }, categoryCount: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'taxonomy']
}));

export const curationPrioritizationTask = defineTask('curation-prioritization', (args, taskCtx) => ({
  kind: 'agent', title: 'Prioritize curation',
  agent: { name: 'prioritization-analyst', prompt: { role: 'curation prioritization analyst', task: 'Prioritize curation activities', context: args, instructions: ['Rank content for curation effort', 'Save to output directory'], outputFormat: 'JSON with priorities (array), artifacts' }, outputSchema: { type: 'object', required: ['priorities', 'artifacts'], properties: { priorities: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'prioritization']
}));

export const contentOrganizationTask = defineTask('content-organization', (args, taskCtx) => ({
  kind: 'agent', title: 'Organize content',
  agent: { name: 'content-organizer', prompt: { role: 'content organizer', task: 'Organize content into structure', context: args, instructions: ['Apply taxonomy to organize content', 'Save to output directory'], outputFormat: 'JSON with structure (object), artifacts' }, outputSchema: { type: 'object', required: ['structure', 'artifacts'], properties: { structure: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'organization']
}));

export const metadataEnrichmentTask = defineTask('metadata-enrichment', (args, taskCtx) => ({
  kind: 'agent', title: 'Enrich metadata',
  agent: { name: 'metadata-specialist', prompt: { role: 'metadata enrichment specialist', task: 'Enrich content metadata', context: args, instructions: ['Add tags and metadata', 'Save to output directory'], outputFormat: 'JSON with enrichedContent (array), artifacts' }, outputSchema: { type: 'object', required: ['enrichedContent', 'artifacts'], properties: { enrichedContent: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'metadata']
}));

export const curationGuidelinesTask = defineTask('curation-guidelines', (args, taskCtx) => ({
  kind: 'agent', title: 'Create guidelines',
  agent: { name: 'guidelines-developer', prompt: { role: 'curation guidelines developer', task: 'Develop curation guidelines', context: args, instructions: ['Create content curation standards', 'Save to output directory'], outputFormat: 'JSON with guidelines (object), artifacts' }, outputSchema: { type: 'object', required: ['guidelines', 'artifacts'], properties: { guidelines: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'guidelines']
}));

export const maintenancePlanTask = defineTask('maintenance-plan', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan maintenance',
  agent: { name: 'maintenance-planner', prompt: { role: 'content maintenance planner', task: 'Plan ongoing maintenance', context: args, instructions: ['Define review cycles and processes', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' }, outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'curation', 'maintenance']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess quality',
  agent: { name: 'quality-assessor', prompt: { role: 'quality assessor', task: 'Assess curation quality', context: args, instructions: ['Evaluate curation quality', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent', title: 'Stakeholder review',
  agent: { name: 'project-manager', prompt: { role: 'project manager', task: 'Coordinate review', context: args, instructions: ['Present for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' }, outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
