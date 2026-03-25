/**
 * @process specializations/domains/business/legal/corporate-records-management
 * @description Corporate Records Management - Implement corporate records maintenance for minutes, resolutions,
 * organizational documents, and regulatory filings.
 * @inputs { entityId: string, action?: string, recordType?: string, outputDir?: string }
 * @outputs { success: boolean, records: array, filings: array, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/corporate-records-management', {
 *   entityId: 'ACME-CORP',
 *   action: 'audit',
 *   recordType: 'all',
 *   outputDir: 'corporate-records'
 * });
 *
 * @references
 * - Corporate Secretary Manual: https://www.lexisnexis.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    entityId,
    action = 'audit', // 'audit', 'maintain', 'file', 'report'
    recordType = 'all',
    outputDir = 'corporate-records-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Corporate Records Management for ${entityId}`);

  // Phase 1: Records Inventory
  const inventory = await ctx.task(recordsInventoryTask, {
    entityId,
    recordType,
    outputDir
  });
  artifacts.push(...inventory.artifacts);

  // Phase 2: Compliance Check
  const complianceCheck = await ctx.task(recordsComplianceCheckTask, {
    entityId,
    records: inventory.records,
    outputDir
  });
  artifacts.push(...complianceCheck.artifacts);

  // Phase 3: Filing Status
  const filingStatus = await ctx.task(filingStatusTask, {
    entityId,
    outputDir
  });
  artifacts.push(...filingStatus.artifacts);

  // Phase 4: Document Organization
  const documentOrg = await ctx.task(documentOrganizationTask, {
    entityId,
    records: inventory.records,
    outputDir
  });
  artifacts.push(...documentOrg.artifacts);

  // Phase 5: Retention Management
  const retention = await ctx.task(retentionManagementTask, {
    entityId,
    records: inventory.records,
    outputDir
  });
  artifacts.push(...retention.artifacts);

  // Phase 6: Records Report
  const report = await ctx.task(recordsReportTask, {
    entityId,
    inventory,
    complianceCheck,
    filingStatus,
    retention,
    outputDir
  });
  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Corporate records audit for ${entityId} complete. ${inventory.records.length} records, compliance: ${complianceCheck.complianceRate}%. Review report?`,
    title: 'Corporate Records Review',
    context: {
      runId: ctx.runId,
      recordsCount: inventory.records.length,
      complianceRate: complianceCheck.complianceRate,
      files: [{ path: report.reportPath, format: 'markdown', label: 'Records Report' }]
    }
  });

  return {
    success: true,
    entityId,
    records: inventory.records,
    filings: filingStatus.filings,
    complianceStatus: {
      rate: complianceCheck.complianceRate,
      issues: complianceCheck.issues
    },
    retentionSchedule: retention.schedule,
    reportPath: report.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/corporate-records-management', timestamp: startTime }
  };
}

export const recordsInventoryTask = defineTask('records-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory records',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Records Inventory Specialist',
      task: 'Inventory corporate records',
      context: args,
      instructions: ['Catalog all corporate records', 'Identify record types', 'Document locations', 'Assess completeness'],
      outputFormat: 'JSON with records array, artifacts'
    },
    outputSchema: { type: 'object', required: ['records', 'artifacts'], properties: { records: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-records']
}));

export const recordsComplianceCheckTask = defineTask('records-compliance-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check compliance',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Records Compliance Specialist',
      task: 'Check records compliance',
      context: args,
      instructions: ['Check required records exist', 'Verify completeness', 'Identify gaps', 'Calculate compliance rate'],
      outputFormat: 'JSON with complianceRate, issues, artifacts'
    },
    outputSchema: { type: 'object', required: ['complianceRate', 'artifacts'], properties: { complianceRate: { type: 'number' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-records']
}));

export const filingStatusTask = defineTask('filing-status', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check filing status',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Filing Status Specialist',
      task: 'Check regulatory filing status',
      context: args,
      instructions: ['Review required filings', 'Check filing dates', 'Identify overdue filings', 'Track upcoming deadlines'],
      outputFormat: 'JSON with filings array, overdueCount, upcomingDeadlines, artifacts'
    },
    outputSchema: { type: 'object', required: ['filings', 'artifacts'], properties: { filings: { type: 'array' }, overdueCount: { type: 'number' }, upcomingDeadlines: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-records']
}));

export const documentOrganizationTask = defineTask('document-organization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Organize documents',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Document Organization Specialist',
      task: 'Organize corporate documents',
      context: args,
      instructions: ['Organize by category', 'Create index', 'Ensure proper storage', 'Document access controls'],
      outputFormat: 'JSON with organization object, index, artifacts'
    },
    outputSchema: { type: 'object', required: ['organization', 'artifacts'], properties: { organization: { type: 'object' }, index: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-records']
}));

export const retentionManagementTask = defineTask('retention-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage retention',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Retention Management Specialist',
      task: 'Manage records retention',
      context: args,
      instructions: ['Apply retention schedule', 'Identify records for disposal', 'Ensure legal holds', 'Document retention decisions'],
      outputFormat: 'JSON with schedule object, disposalCandidates, artifacts'
    },
    outputSchema: { type: 'object', required: ['schedule', 'artifacts'], properties: { schedule: { type: 'object' }, disposalCandidates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-records']
}));

export const recordsReportTask = defineTask('records-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate report',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Records Report Specialist',
      task: 'Generate corporate records report',
      context: args,
      instructions: ['Summarize records status', 'Document compliance findings', 'List action items', 'Provide recommendations'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-records']
}));
