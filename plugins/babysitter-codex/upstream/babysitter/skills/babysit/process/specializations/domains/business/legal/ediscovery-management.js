/**
 * @process specializations/domains/business/legal/ediscovery-management
 * @description E-Discovery Management - Implement e-discovery workflow covering data collection, processing,
 * review, production, and defensibility documentation.
 * @inputs { matterId: string, phase?: string, outputDir?: string }
 * @outputs { success: boolean, collection: object, processing: object, reviewStatus: object, production: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/ediscovery-management', {
 *   matterId: 'LIT-2024-001',
 *   phase: 'full-cycle',
 *   outputDir: 'ediscovery'
 * });
 *
 * @references
 * - EDRM Model: https://www.edrm.net/
 * - ACEDS Certification: https://aceds.org/certification/
 * - Relativity: https://www.relativity.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    matterId,
    phase = 'full-cycle', // 'collection', 'processing', 'review', 'production', 'full-cycle'
    custodians = [],
    dataSources = [],
    outputDir = 'ediscovery-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting E-Discovery Process for ${matterId}`);

  // Phase 1: Collection Planning
  const collectionPlan = await ctx.task(collectionPlanningTask, {
    matterId,
    custodians,
    dataSources,
    outputDir
  });
  artifacts.push(...collectionPlan.artifacts);

  // Phase 2: Data Collection
  const collection = await ctx.task(dataCollectionTask, {
    matterId,
    plan: collectionPlan.plan,
    outputDir
  });
  artifacts.push(...collection.artifacts);

  ctx.log('info', `Collected ${collection.totalItems} items`);

  if (phase === 'collection') {
    return { success: true, phase, collection, artifacts, metadata: { processId: 'specializations/domains/business/legal/ediscovery-management', timestamp: startTime } };
  }

  // Phase 3: Processing
  const processing = await ctx.task(dataProcessingTask, {
    matterId,
    collectedData: collection,
    outputDir
  });
  artifacts.push(...processing.artifacts);

  ctx.log('info', `Processed ${processing.processedItems} items, ${processing.deduplicatedItems} after dedup`);

  if (phase === 'processing') {
    return { success: true, phase, collection, processing, artifacts, metadata: { processId: 'specializations/domains/business/legal/ediscovery-management', timestamp: startTime } };
  }

  // Phase 4: Review Setup
  const reviewSetup = await ctx.task(reviewSetupTask, {
    matterId,
    processedData: processing,
    outputDir
  });
  artifacts.push(...reviewSetup.artifacts);

  // Phase 5: Review Execution
  const reviewStatus = await ctx.task(documentReviewTask, {
    matterId,
    reviewSetup,
    outputDir
  });
  artifacts.push(...reviewStatus.artifacts);

  await ctx.breakpoint({
    question: `Document review for ${matterId}. ${reviewStatus.reviewedCount}/${reviewStatus.totalCount} reviewed, ${reviewStatus.responsiveCount} responsive. Proceed to production?`,
    title: 'Document Review Status',
    context: {
      runId: ctx.runId,
      matterId,
      reviewedCount: reviewStatus.reviewedCount,
      responsiveCount: reviewStatus.responsiveCount,
      files: reviewStatus.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  if (phase === 'review') {
    return { success: true, phase, collection, processing, reviewStatus, artifacts, metadata: { processId: 'specializations/domains/business/legal/ediscovery-management', timestamp: startTime } };
  }

  // Phase 6: Production
  const production = await ctx.task(productionTask, {
    matterId,
    reviewStatus,
    outputDir
  });
  artifacts.push(...production.artifacts);

  // Phase 7: Defensibility Documentation
  const defensibility = await ctx.task(defensibilityDocTask, {
    matterId,
    collectionPlan,
    collection,
    processing,
    reviewStatus,
    production,
    outputDir
  });
  artifacts.push(...defensibility.artifacts);

  return {
    success: true,
    matterId,
    phase,
    collection: { totalItems: collection.totalItems },
    processing: { processedItems: processing.processedItems, deduplicatedItems: processing.deduplicatedItems },
    reviewStatus: { reviewedCount: reviewStatus.reviewedCount, responsiveCount: reviewStatus.responsiveCount },
    production: { producedItems: production.producedItems, productionPath: production.productionPath },
    defensibilityReport: defensibility.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/ediscovery-management', timestamp: startTime }
  };
}

export const collectionPlanningTask = defineTask('collection-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan data collection',
  agent: {
    name: 'ediscovery-specialist',
    prompt: {
      role: 'E-Discovery Collection Specialist',
      task: 'Plan data collection for e-discovery',
      context: args,
      instructions: ['Identify data sources', 'Define collection scope', 'Plan collection methodology', 'Document chain of custody'],
      outputFormat: 'JSON with plan object, artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ediscovery']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect data',
  agent: {
    name: 'ediscovery-specialist',
    prompt: {
      role: 'Data Collection Specialist',
      task: 'Collect data per plan',
      context: args,
      instructions: ['Execute collection per plan', 'Maintain chain of custody', 'Document collection metadata', 'Verify collection completeness'],
      outputFormat: 'JSON with totalItems, collectionLog, artifacts'
    },
    outputSchema: { type: 'object', required: ['totalItems', 'artifacts'], properties: { totalItems: { type: 'number' }, collectionLog: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ediscovery']
}));

export const dataProcessingTask = defineTask('data-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process data',
  agent: {
    name: 'ediscovery-specialist',
    prompt: {
      role: 'Data Processing Specialist',
      task: 'Process collected data',
      context: args,
      instructions: ['Extract text and metadata', 'De-duplicate documents', 'Apply date/custodian filters', 'Generate processing report'],
      outputFormat: 'JSON with processedItems, deduplicatedItems, artifacts'
    },
    outputSchema: { type: 'object', required: ['processedItems', 'deduplicatedItems', 'artifacts'], properties: { processedItems: { type: 'number' }, deduplicatedItems: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ediscovery']
}));

export const reviewSetupTask = defineTask('review-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up review',
  agent: {
    name: 'ediscovery-specialist',
    prompt: {
      role: 'Review Setup Specialist',
      task: 'Set up document review',
      context: args,
      instructions: ['Configure review platform', 'Create coding panel', 'Define review protocol', 'Assign reviewers'],
      outputFormat: 'JSON with reviewConfig object, artifacts'
    },
    outputSchema: { type: 'object', required: ['reviewConfig', 'artifacts'], properties: { reviewConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ediscovery']
}));

export const documentReviewTask = defineTask('document-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute document review',
  agent: {
    name: 'ediscovery-specialist',
    prompt: {
      role: 'Document Review Manager',
      task: 'Execute document review',
      context: args,
      instructions: ['Execute review workflow', 'Track review progress', 'Perform QC checks', 'Document review decisions'],
      outputFormat: 'JSON with reviewedCount, totalCount, responsiveCount, artifacts'
    },
    outputSchema: { type: 'object', required: ['reviewedCount', 'totalCount', 'responsiveCount', 'artifacts'], properties: { reviewedCount: { type: 'number' }, totalCount: { type: 'number' }, responsiveCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ediscovery']
}));

export const productionTask = defineTask('production', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Produce documents',
  agent: {
    name: 'ediscovery-specialist',
    prompt: {
      role: 'Production Specialist',
      task: 'Produce documents',
      context: args,
      instructions: ['Apply redactions', 'Generate production images', 'Create load files', 'Generate production log'],
      outputFormat: 'JSON with producedItems, productionPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['producedItems', 'productionPath', 'artifacts'], properties: { producedItems: { type: 'number' }, productionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ediscovery']
}));

export const defensibilityDocTask = defineTask('defensibility-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document defensibility',
  agent: {
    name: 'ediscovery-specialist',
    prompt: {
      role: 'Defensibility Documentation Specialist',
      task: 'Document e-discovery defensibility',
      context: args,
      instructions: ['Document collection methodology', 'Document processing steps', 'Document review protocol', 'Create defensibility report'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ediscovery']
}));
