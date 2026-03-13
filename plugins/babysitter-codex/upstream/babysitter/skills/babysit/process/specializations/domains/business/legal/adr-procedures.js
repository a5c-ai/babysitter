/**
 * @process specializations/domains/business/legal/adr-procedures
 * @description Alternative Dispute Resolution (ADR) - Establish mediation and arbitration procedures as
 * alternatives to litigation for efficient dispute resolution.
 * @inputs { disputeId: string, adrType?: string, parties?: array, outputDir?: string }
 * @outputs { success: boolean, adrPlan: object, proceedings: object, resolution: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/adr-procedures', {
 *   disputeId: 'DISP-2024-001',
 *   adrType: 'mediation',
 *   parties: ['Acme Corp', 'Beta Inc'],
 *   outputDir: 'adr-proceedings'
 * });
 *
 * @references
 * - ICC Arbitration: https://iccwbo.org/business-solutions/model-contracts-clauses/
 * - AAA Mediation: https://www.adr.org/
 * - JAMS: https://www.jamsadr.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    disputeId,
    adrType = 'mediation', // 'mediation', 'arbitration', 'med-arb'
    parties = [],
    disputeValue = null,
    governingRules = 'AAA',
    outputDir = 'adr-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ADR Process for ${disputeId} - Type: ${adrType}`);

  // Phase 1: ADR Assessment
  const assessment = await ctx.task(adrAssessmentTask, {
    disputeId,
    adrType,
    parties,
    disputeValue,
    outputDir
  });
  artifacts.push(...assessment.artifacts);

  // Phase 2: Neutral Selection
  const neutralSelection = await ctx.task(neutralSelectionTask, {
    disputeId,
    adrType,
    parties,
    governingRules,
    outputDir
  });
  artifacts.push(...neutralSelection.artifacts);

  // Phase 3: Procedural Setup
  const proceduralSetup = await ctx.task(proceduralSetupTask, {
    disputeId,
    adrType,
    neutral: neutralSelection.selectedNeutral,
    governingRules,
    outputDir
  });
  artifacts.push(...proceduralSetup.artifacts);

  // Phase 4: Document Preparation
  const documentPrep = await ctx.task(adrDocumentPrepTask, {
    disputeId,
    adrType,
    parties,
    proceduralSetup,
    outputDir
  });
  artifacts.push(...documentPrep.artifacts);

  await ctx.breakpoint({
    question: `ADR proceedings for ${disputeId} set up. Type: ${adrType}. Neutral: ${neutralSelection.selectedNeutral?.name}. Proceed with proceedings?`,
    title: 'ADR Setup Review',
    context: {
      runId: ctx.runId,
      disputeId,
      adrType,
      neutral: neutralSelection.selectedNeutral?.name,
      scheduledDate: proceduralSetup.scheduledDate,
      files: documentPrep.artifacts.map(a => ({ path: a.path, format: a.format || 'docx' }))
    }
  });

  // Phase 5: Proceedings Management
  const proceedings = await ctx.task(proceedingsManagementTask, {
    disputeId,
    adrType,
    proceduralSetup,
    outputDir
  });
  artifacts.push(...proceedings.artifacts);

  // Phase 6: Resolution Documentation
  const resolution = await ctx.task(resolutionDocumentationTask, {
    disputeId,
    adrType,
    proceedings,
    outputDir
  });
  artifacts.push(...resolution.artifacts);

  return {
    success: true,
    disputeId,
    adrType,
    adrPlan: {
      type: adrType,
      neutral: neutralSelection.selectedNeutral,
      rules: governingRules,
      scheduledDate: proceduralSetup.scheduledDate
    },
    proceedings: proceedings.status,
    resolution: resolution.outcome,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/adr-procedures', timestamp: startTime }
  };
}

export const adrAssessmentTask = defineTask('adr-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess ADR suitability',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'ADR Assessment Specialist',
      task: 'Assess dispute for ADR suitability',
      context: args,
      instructions: ['Evaluate dispute for ADR', 'Assess party willingness', 'Recommend ADR type', 'Identify potential barriers'],
      outputFormat: 'JSON with suitability object, recommendation, artifacts'
    },
    outputSchema: { type: 'object', required: ['suitability', 'recommendation', 'artifacts'], properties: { suitability: { type: 'object' }, recommendation: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'adr']
}));

export const neutralSelectionTask = defineTask('neutral-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select neutral',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Neutral Selection Specialist',
      task: 'Select mediator or arbitrator',
      context: args,
      instructions: ['Identify qualified neutrals', 'Check conflicts', 'Coordinate selection with parties', 'Confirm availability'],
      outputFormat: 'JSON with selectedNeutral object, alternates, artifacts'
    },
    outputSchema: { type: 'object', required: ['selectedNeutral', 'artifacts'], properties: { selectedNeutral: { type: 'object' }, alternates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'adr']
}));

export const proceduralSetupTask = defineTask('procedural-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up procedures',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'ADR Procedural Specialist',
      task: 'Set up ADR procedures',
      context: args,
      instructions: ['Establish procedural rules', 'Set schedule', 'Define document exchange', 'Arrange logistics'],
      outputFormat: 'JSON with procedures object, scheduledDate, artifacts'
    },
    outputSchema: { type: 'object', required: ['procedures', 'scheduledDate', 'artifacts'], properties: { procedures: { type: 'object' }, scheduledDate: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'adr']
}));

export const adrDocumentPrepTask = defineTask('adr-document-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare ADR documents',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'ADR Document Specialist',
      task: 'Prepare ADR documentation',
      context: args,
      instructions: ['Prepare position statement', 'Compile supporting documents', 'Prepare opening statement', 'Create settlement authority memo'],
      outputFormat: 'JSON with documents array, artifacts'
    },
    outputSchema: { type: 'object', required: ['documents', 'artifacts'], properties: { documents: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'adr']
}));

export const proceedingsManagementTask = defineTask('proceedings-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage proceedings',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'ADR Proceedings Manager',
      task: 'Manage ADR proceedings',
      context: args,
      instructions: ['Track proceedings', 'Document sessions', 'Manage negotiations', 'Track settlement discussions'],
      outputFormat: 'JSON with status object, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'adr']
}));

export const resolutionDocumentationTask = defineTask('resolution-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document resolution',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Resolution Documentation Specialist',
      task: 'Document ADR resolution',
      context: args,
      instructions: ['Document settlement terms', 'Draft settlement agreement', 'Document award if arbitration', 'Confirm party signatures'],
      outputFormat: 'JSON with outcome object, agreementPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['outcome', 'artifacts'], properties: { outcome: { type: 'object' }, agreementPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'adr']
}));
