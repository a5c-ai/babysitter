/**
 * @process specializations/domains/business/legal/entity-management
 * @description Entity Management - Deploy subsidiary and entity tracking including formation, governance,
 * compliance, and dissolution procedures.
 * @inputs { action: string, entityDetails?: object, parentEntity?: string, outputDir?: string }
 * @outputs { success: boolean, entity: object, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/entity-management', {
 *   action: 'form',
 *   entityDetails: { name: 'Acme Sub LLC', type: 'llc', jurisdiction: 'Delaware' },
 *   parentEntity: 'Acme Corp',
 *   outputDir: 'entity-management'
 * });
 *
 * @references
 * - Model Business Corporation Act: https://www.americanbar.org/content/dam/aba/administrative/business_law/corplaws/2016_mbca.pdf
 * - Delaware General Corporation Law: https://delcode.delaware.gov/title8/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    action, // 'form', 'maintain', 'dissolve', 'audit', 'report'
    entityDetails = {},
    parentEntity = null,
    entityId = null,
    outputDir = 'entity-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Entity Management - Action: ${action}`);

  switch (action) {
    case 'form':
      return await formEntity(ctx, entityDetails, parentEntity, outputDir, artifacts, startTime);
    case 'maintain':
      return await maintainEntity(ctx, entityId, outputDir, artifacts, startTime);
    case 'dissolve':
      return await dissolveEntity(ctx, entityId, outputDir, artifacts, startTime);
    case 'audit':
      return await auditEntities(ctx, parentEntity, outputDir, artifacts, startTime);
    case 'report':
      return await reportEntities(ctx, parentEntity, outputDir, artifacts, startTime);
    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

async function formEntity(ctx, entityDetails, parentEntity, outputDir, artifacts, startTime) {
  // Phase 1: Formation Planning
  const formationPlan = await ctx.task(formationPlanningTask, {
    entityDetails,
    parentEntity,
    outputDir
  });
  artifacts.push(...formationPlan.artifacts);

  // Phase 2: Document Preparation
  const documents = await ctx.task(formationDocumentsTask, {
    entityDetails,
    formationPlan,
    outputDir
  });
  artifacts.push(...documents.artifacts);

  // Phase 3: Filing
  const filing = await ctx.task(entityFilingTask, {
    entityDetails,
    documents,
    outputDir
  });
  artifacts.push(...filing.artifacts);

  await ctx.breakpoint({
    question: `Entity ${entityDetails.name} formation documents prepared. Ready to file in ${entityDetails.jurisdiction}?`,
    title: 'Entity Formation Review',
    context: {
      runId: ctx.runId,
      entityName: entityDetails.name,
      jurisdiction: entityDetails.jurisdiction,
      files: documents.artifacts.map(a => ({ path: a.path, format: a.format || 'docx' }))
    }
  });

  // Phase 4: Post-Formation Setup
  const postFormation = await ctx.task(postFormationSetupTask, {
    entityDetails,
    filingResult: filing,
    outputDir
  });
  artifacts.push(...postFormation.artifacts);

  return {
    success: true,
    action: 'form',
    entity: {
      name: entityDetails.name,
      type: entityDetails.type,
      jurisdiction: entityDetails.jurisdiction,
      formationDate: filing.formationDate,
      entityNumber: filing.entityNumber
    },
    complianceStatus: postFormation.complianceSetup,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/entity-management', timestamp: startTime }
  };
}

async function maintainEntity(ctx, entityId, outputDir, artifacts, startTime) {
  const maintenance = await ctx.task(entityMaintenanceTask, { entityId, outputDir });
  artifacts.push(...maintenance.artifacts);

  const compliance = await ctx.task(entityComplianceCheckTask, { entityId, outputDir });
  artifacts.push(...compliance.artifacts);

  return {
    success: true,
    action: 'maintain',
    entityId,
    maintenanceStatus: maintenance.status,
    complianceStatus: compliance.status,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/entity-management', timestamp: startTime }
  };
}

async function dissolveEntity(ctx, entityId, outputDir, artifacts, startTime) {
  const dissolution = await ctx.task(entityDissolutionTask, { entityId, outputDir });
  artifacts.push(...dissolution.artifacts);

  await ctx.breakpoint({
    question: `Dissolution documents for ${entityId} prepared. Proceed with dissolution filing?`,
    title: 'Entity Dissolution Review',
    context: { runId: ctx.runId, entityId }
  });

  return {
    success: true,
    action: 'dissolve',
    entityId,
    dissolutionStatus: dissolution.status,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/entity-management', timestamp: startTime }
  };
}

async function auditEntities(ctx, parentEntity, outputDir, artifacts, startTime) {
  const audit = await ctx.task(entityAuditTask, { parentEntity, outputDir });
  artifacts.push(...audit.artifacts);

  return {
    success: true,
    action: 'audit',
    parentEntity,
    auditResults: audit.results,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/entity-management', timestamp: startTime }
  };
}

async function reportEntities(ctx, parentEntity, outputDir, artifacts, startTime) {
  const report = await ctx.task(entityReportTask, { parentEntity, outputDir });
  artifacts.push(...report.artifacts);

  return {
    success: true,
    action: 'report',
    parentEntity,
    reportPath: report.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/entity-management', timestamp: startTime }
  };
}

export const formationPlanningTask = defineTask('formation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan entity formation',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Entity Formation Specialist',
      task: 'Plan entity formation',
      context: args,
      instructions: ['Determine entity type', 'Select jurisdiction', 'Plan ownership structure', 'Identify filing requirements'],
      outputFormat: 'JSON with plan object, requirements, artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, requirements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const formationDocumentsTask = defineTask('formation-documents', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare formation documents',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Formation Documents Specialist',
      task: 'Prepare entity formation documents',
      context: args,
      instructions: ['Draft articles/certificate', 'Prepare bylaws/operating agreement', 'Draft initial resolutions', 'Prepare registered agent forms'],
      outputFormat: 'JSON with documents array, artifacts'
    },
    outputSchema: { type: 'object', required: ['documents', 'artifacts'], properties: { documents: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const entityFilingTask = defineTask('entity-filing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'File entity documents',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Entity Filing Specialist',
      task: 'File entity formation documents',
      context: args,
      instructions: ['Submit formation documents', 'Pay filing fees', 'Obtain filed documents', 'Record entity number'],
      outputFormat: 'JSON with formationDate, entityNumber, filedDocuments, artifacts'
    },
    outputSchema: { type: 'object', required: ['formationDate', 'entityNumber', 'artifacts'], properties: { formationDate: { type: 'string' }, entityNumber: { type: 'string' }, filedDocuments: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const postFormationSetupTask = defineTask('post-formation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Post-formation setup',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Post-Formation Specialist',
      task: 'Complete post-formation setup',
      context: args,
      instructions: ['Obtain EIN', 'Open bank accounts', 'Set up compliance tracking', 'Register in foreign jurisdictions'],
      outputFormat: 'JSON with complianceSetup object, artifacts'
    },
    outputSchema: { type: 'object', required: ['complianceSetup', 'artifacts'], properties: { complianceSetup: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const entityMaintenanceTask = defineTask('entity-maintenance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Maintain entity',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Entity Maintenance Specialist',
      task: 'Perform entity maintenance',
      context: args,
      instructions: ['File annual reports', 'Pay franchise taxes', 'Update registered agent', 'Maintain good standing'],
      outputFormat: 'JSON with status object, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const entityComplianceCheckTask = defineTask('entity-compliance-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check entity compliance',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Entity Compliance Specialist',
      task: 'Check entity compliance status',
      context: args,
      instructions: ['Verify good standing', 'Check filing status', 'Review tax compliance', 'Identify compliance gaps'],
      outputFormat: 'JSON with status object, issues, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const entityDissolutionTask = defineTask('entity-dissolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dissolve entity',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Entity Dissolution Specialist',
      task: 'Prepare entity dissolution',
      context: args,
      instructions: ['Prepare dissolution documents', 'Clear outstanding obligations', 'File dissolution', 'Close accounts'],
      outputFormat: 'JSON with status object, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const entityAuditTask = defineTask('entity-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit entities',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Entity Audit Specialist',
      task: 'Audit entity portfolio',
      context: args,
      instructions: ['Inventory all entities', 'Check compliance status', 'Identify inactive entities', 'Recommend consolidation'],
      outputFormat: 'JSON with results object, artifacts'
    },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));

export const entityReportTask = defineTask('entity-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate entity report',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Entity Report Specialist',
      task: 'Generate entity portfolio report',
      context: args,
      instructions: ['Compile entity list', 'Summarize compliance status', 'Document ownership structure', 'Create org chart'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'entity-management']
}));
