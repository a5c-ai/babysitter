/**
 * @process specializations/domains/business/legal/gdpr-compliance-program
 * @description GDPR Compliance Program - Implement comprehensive GDPR compliance including lawful basis
 * documentation, DPIA, cross-border transfers, and DPA liaison.
 * @inputs { organizationProfile: object, action?: string, outputDir?: string }
 * @outputs { success: boolean, complianceStatus: object, ropa: object, dpiaList: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/gdpr-compliance-program', {
 *   organizationProfile: { name: 'Acme Corp', euOperations: true, dataSubjects: ['employees', 'customers'] },
 *   action: 'implement',
 *   outputDir: 'gdpr-compliance'
 * });
 *
 * @references
 * - GDPR Official Text: https://gdpr.eu/
 * - ICO GDPR Guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/
 * - EDPB Guidelines: https://edpb.europa.eu/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    action = 'assess', // 'assess', 'implement', 'audit', 'report'
    outputDir = 'gdpr-compliance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GDPR Compliance Program for ${organizationProfile.name}`);

  // Phase 1: GDPR Gap Assessment
  const gapAssessment = await ctx.task(gdprGapAssessmentTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...gapAssessment.artifacts);

  // Phase 2: Lawful Basis Documentation
  const lawfulBasis = await ctx.task(lawfulBasisDocumentationTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...lawfulBasis.artifacts);

  // Phase 3: ROPA Development
  const ropa = await ctx.task(ropaTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...ropa.artifacts);

  // Phase 4: DPIA Framework
  const dpiaFramework = await ctx.task(dpiaFrameworkTask, {
    organizationProfile,
    processingActivities: ropa.activities,
    outputDir
  });
  artifacts.push(...dpiaFramework.artifacts);

  // Phase 5: Cross-Border Transfer Assessment
  const transferAssessment = await ctx.task(crossBorderTransferTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...transferAssessment.artifacts);

  // Phase 6: DSR Procedures
  const dsrProcedures = await ctx.task(dsrProceduresTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...dsrProcedures.artifacts);

  // Phase 7: Breach Notification Procedures
  const breachProcedures = await ctx.task(breachNotificationTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...breachProcedures.artifacts);

  // Phase 8: DPA Liaison Setup
  const dpaLiaison = await ctx.task(dpaLiaisonTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...dpaLiaison.artifacts);

  // Phase 9: Compliance Report
  const report = await ctx.task(gdprComplianceReportTask, {
    organizationProfile,
    gapAssessment,
    lawfulBasis,
    ropa,
    dpiaFramework,
    transferAssessment,
    outputDir
  });
  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `GDPR compliance assessment for ${organizationProfile.name} complete. Compliance score: ${gapAssessment.complianceScore}%. ${gapAssessment.gaps.length} gaps identified. Review report?`,
    title: 'GDPR Compliance Review',
    context: {
      runId: ctx.runId,
      complianceScore: gapAssessment.complianceScore,
      gapsCount: gapAssessment.gaps.length,
      files: [{ path: report.reportPath, format: 'markdown', label: 'GDPR Compliance Report' }]
    }
  });

  return {
    success: true,
    organization: organizationProfile.name,
    complianceStatus: {
      score: gapAssessment.complianceScore,
      gaps: gapAssessment.gaps,
      recommendations: gapAssessment.recommendations
    },
    ropa: ropa.register,
    dpiaList: dpiaFramework.requiredDPIAs,
    transferMechanisms: transferAssessment.mechanisms,
    reportPath: report.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/gdpr-compliance-program', timestamp: startTime }
  };
}

export const gdprGapAssessmentTask = defineTask('gdpr-gap-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess GDPR gaps',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'GDPR Assessment Specialist',
      task: 'Assess GDPR compliance gaps',
      context: args,
      instructions: ['Review current compliance', 'Identify gaps against GDPR', 'Calculate compliance score', 'Prioritize remediation'],
      outputFormat: 'JSON with complianceScore, gaps, recommendations, artifacts'
    },
    outputSchema: { type: 'object', required: ['complianceScore', 'gaps', 'artifacts'], properties: { complianceScore: { type: 'number' }, gaps: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const lawfulBasisDocumentationTask = defineTask('lawful-basis-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document lawful basis',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Lawful Basis Specialist',
      task: 'Document lawful basis for processing',
      context: args,
      instructions: ['Identify all processing activities', 'Determine lawful basis for each', 'Document legitimate interest assessments', 'Record consent mechanisms'],
      outputFormat: 'JSON with documentation object, artifacts'
    },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const ropaTask = defineTask('ropa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create ROPA',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'ROPA Specialist',
      task: 'Create Record of Processing Activities',
      context: args,
      instructions: ['Document all processing activities', 'Record purposes and lawful basis', 'Document data categories', 'Record retention periods'],
      outputFormat: 'JSON with register object, activities array, artifacts'
    },
    outputSchema: { type: 'object', required: ['register', 'activities', 'artifacts'], properties: { register: { type: 'object' }, activities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const dpiaFrameworkTask = defineTask('dpia-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish DPIA framework',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DPIA Specialist',
      task: 'Establish DPIA framework',
      context: args,
      instructions: ['Create DPIA template', 'Identify high-risk processing', 'Define DPIA triggers', 'Create DPIA register'],
      outputFormat: 'JSON with framework object, requiredDPIAs array, artifacts'
    },
    outputSchema: { type: 'object', required: ['framework', 'requiredDPIAs', 'artifacts'], properties: { framework: { type: 'object' }, requiredDPIAs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const crossBorderTransferTask = defineTask('cross-border-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess cross-border transfers',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Transfer Assessment Specialist',
      task: 'Assess cross-border data transfers',
      context: args,
      instructions: ['Map international transfers', 'Assess adequacy decisions', 'Implement transfer mechanisms', 'Document SCCs/BCRs'],
      outputFormat: 'JSON with transfers array, mechanisms object, artifacts'
    },
    outputSchema: { type: 'object', required: ['transfers', 'mechanisms', 'artifacts'], properties: { transfers: { type: 'array' }, mechanisms: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const dsrProceduresTask = defineTask('dsr-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish DSR procedures',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DSR Procedures Specialist',
      task: 'Establish data subject rights procedures',
      context: args,
      instructions: ['Create DSR intake process', 'Define verification procedures', 'Set response timelines', 'Create response templates'],
      outputFormat: 'JSON with procedures object, artifacts'
    },
    outputSchema: { type: 'object', required: ['procedures', 'artifacts'], properties: { procedures: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const breachNotificationTask = defineTask('breach-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish breach procedures',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Breach Notification Specialist',
      task: 'Establish breach notification procedures',
      context: args,
      instructions: ['Create breach response plan', 'Define notification triggers', 'Prepare notification templates', 'Document 72-hour process'],
      outputFormat: 'JSON with procedures object, artifacts'
    },
    outputSchema: { type: 'object', required: ['procedures', 'artifacts'], properties: { procedures: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const dpaLiaisonTask = defineTask('dpa-liaison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up DPA liaison',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DPA Liaison Specialist',
      task: 'Set up DPA liaison procedures',
      context: args,
      instructions: ['Identify lead supervisory authority', 'Set up contact procedures', 'Document DPO appointment', 'Create DPA communication templates'],
      outputFormat: 'JSON with liaison object, artifacts'
    },
    outputSchema: { type: 'object', required: ['liaison', 'artifacts'], properties: { liaison: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));

export const gdprComplianceReportTask = defineTask('gdpr-compliance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate compliance report',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'GDPR Report Specialist',
      task: 'Generate GDPR compliance report',
      context: args,
      instructions: ['Summarize compliance status', 'Document gaps and remediation', 'Include ROPA summary', 'Provide recommendations'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'gdpr']
}));
