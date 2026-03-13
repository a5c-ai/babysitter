/**
 * @process specializations/domains/business/legal/legal-hold-implementation
 * @description Legal Hold Implementation - Establish legal hold procedures for document preservation including
 * custodian identification, hold issuance, and compliance monitoring.
 * @inputs { matterId: string, matterType?: string, custodians?: array, outputDir?: string }
 * @outputs { success: boolean, holdNotice: object, custodians: array, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/legal-hold-implementation', {
 *   matterId: 'LIT-2024-001',
 *   matterType: 'litigation',
 *   custodians: ['john.smith@acme.com', 'jane.doe@acme.com'],
 *   outputDir: 'legal-holds'
 * });
 *
 * @references
 * - Relativity Legal Hold: https://www.relativity.com/
 * - Sedona Conference: https://thesedonaconference.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    matterId,
    matterType = 'litigation',
    custodians = [],
    preservationScope = null,
    action = 'implement', // 'implement', 'release', 'monitor', 'audit'
    outputDir = 'legal-hold-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Legal Hold Process for ${matterId}`);

  // Phase 1: Scope Definition
  const scopeDefinition = await ctx.task(holdScopeTask, {
    matterId,
    matterType,
    preservationScope,
    outputDir
  });
  artifacts.push(...scopeDefinition.artifacts);

  // Phase 2: Custodian Identification
  const custodianIdentification = await ctx.task(custodianIdentificationTask, {
    matterId,
    providedCustodians: custodians,
    scope: scopeDefinition.scope,
    outputDir
  });
  artifacts.push(...custodianIdentification.artifacts);

  ctx.log('info', `Identified ${custodianIdentification.custodians.length} custodians`);

  // Phase 3: Hold Notice Drafting
  const holdNotice = await ctx.task(holdNoticeDraftingTask, {
    matterId,
    matterType,
    scope: scopeDefinition.scope,
    custodians: custodianIdentification.custodians,
    outputDir
  });
  artifacts.push(...holdNotice.artifacts);

  // Quality Gate: Review hold notice
  await ctx.breakpoint({
    question: `Legal hold notice drafted for ${matterId}. ${custodianIdentification.custodians.length} custodians identified. Review and approve hold issuance?`,
    title: 'Legal Hold Notice Review',
    context: {
      runId: ctx.runId,
      matterId,
      custodianCount: custodianIdentification.custodians.length,
      scope: scopeDefinition.scope.summary,
      files: [{ path: holdNotice.noticePath, format: 'docx', label: 'Hold Notice' }]
    }
  });

  // Phase 4: Hold Issuance
  const holdIssuance = await ctx.task(holdIssuanceTask, {
    matterId,
    holdNotice: holdNotice.notice,
    custodians: custodianIdentification.custodians,
    outputDir
  });
  artifacts.push(...holdIssuance.artifacts);

  // Phase 5: Acknowledgment Tracking
  const acknowledgmentTracking = await ctx.task(acknowledgmentTrackingTask, {
    matterId,
    custodians: custodianIdentification.custodians,
    outputDir
  });
  artifacts.push(...acknowledgmentTracking.artifacts);

  // Phase 6: Compliance Monitoring Setup
  const complianceMonitoring = await ctx.task(holdComplianceMonitoringTask, {
    matterId,
    custodians: custodianIdentification.custodians,
    outputDir
  });
  artifacts.push(...complianceMonitoring.artifacts);

  return {
    success: true,
    matterId,
    matterType,
    holdNotice: {
      path: holdNotice.noticePath,
      issuedDate: holdIssuance.issuedDate
    },
    custodians: custodianIdentification.custodians.map(c => ({
      name: c.name,
      email: c.email,
      acknowledged: acknowledgmentTracking.acknowledgments[c.email] || false
    })),
    complianceStatus: complianceMonitoring.status,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/legal-hold-implementation', timestamp: startTime }
  };
}

export const holdScopeTask = defineTask('hold-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define hold scope',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Hold Specialist',
      task: 'Define legal hold scope',
      context: args,
      instructions: ['Define relevant date range', 'Identify relevant data sources', 'Define document types to preserve', 'Specify search terms'],
      outputFormat: 'JSON with scope object, artifacts'
    },
    outputSchema: { type: 'object', required: ['scope', 'artifacts'], properties: { scope: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'legal-hold']
}));

export const custodianIdentificationTask = defineTask('custodian-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify custodians',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Custodian Identification Specialist',
      task: 'Identify custodians for legal hold',
      context: args,
      instructions: ['Review matter details', 'Identify key custodians', 'Identify additional custodians', 'Document custodian roles'],
      outputFormat: 'JSON with custodians array, artifacts'
    },
    outputSchema: { type: 'object', required: ['custodians', 'artifacts'], properties: { custodians: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'legal-hold']
}));

export const holdNoticeDraftingTask = defineTask('hold-notice-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft hold notice',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Hold Notice Drafter',
      task: 'Draft legal hold notice',
      context: args,
      instructions: ['Draft clear preservation obligations', 'Include scope details', 'Add compliance instructions', 'Include acknowledgment requirement'],
      outputFormat: 'JSON with notice object, noticePath, artifacts'
    },
    outputSchema: { type: 'object', required: ['notice', 'noticePath', 'artifacts'], properties: { notice: { type: 'object' }, noticePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'legal-hold']
}));

export const holdIssuanceTask = defineTask('hold-issuance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Issue legal hold',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Hold Administrator',
      task: 'Issue legal hold notices',
      context: args,
      instructions: ['Send notices to custodians', 'Record issuance date', 'Set up reminder schedule', 'Document issuance'],
      outputFormat: 'JSON with issuedDate, notificationsSent, artifacts'
    },
    outputSchema: { type: 'object', required: ['issuedDate', 'artifacts'], properties: { issuedDate: { type: 'string' }, notificationsSent: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'legal-hold']
}));

export const acknowledgmentTrackingTask = defineTask('acknowledgment-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track acknowledgments',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Acknowledgment Tracker',
      task: 'Track custodian acknowledgments',
      context: args,
      instructions: ['Monitor acknowledgments', 'Send reminders for pending', 'Document acknowledgment status', 'Escalate non-responses'],
      outputFormat: 'JSON with acknowledgments object, pendingCount, artifacts'
    },
    outputSchema: { type: 'object', required: ['acknowledgments', 'artifacts'], properties: { acknowledgments: { type: 'object' }, pendingCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'legal-hold']
}));

export const holdComplianceMonitoringTask = defineTask('hold-compliance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor compliance',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Compliance Monitor',
      task: 'Monitor legal hold compliance',
      context: args,
      instructions: ['Set up periodic reminders', 'Monitor data preservation', 'Document compliance status', 'Report non-compliance'],
      outputFormat: 'JSON with status object, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'legal-hold']
}));
