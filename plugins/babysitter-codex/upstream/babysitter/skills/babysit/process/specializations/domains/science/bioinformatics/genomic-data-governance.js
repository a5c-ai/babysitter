/**
 * @process specializations/domains/science/bioinformatics/genomic-data-governance
 * @description Genomic Data Governance - Establishing and maintaining data governance frameworks for
 * genomic data including privacy protection, consent management, and regulatory compliance.
 * @inputs { projectName: string, dataInventory: object, regulations: array, outputDir?: string }
 * @outputs { success: boolean, governancePolicies: array, complianceReport: object, dataAgreements: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/genomic-data-governance', {
 *   projectName: 'Genomics Data Governance Program',
 *   dataInventory: { datasets: [{ name: 'WGS_Cohort', samples: 5000 }] },
 *   regulations: ['HIPAA', 'GDPR', 'GINA']
 * });
 *
 * @references
 * - GA4GH Framework: https://www.ga4gh.org/genomic-data-toolkit/
 * - HIPAA: https://www.hhs.gov/hipaa/
 * - GDPR: https://gdpr.eu/
 * - NIH Genomic Data Sharing: https://sharing.nih.gov/genomic-data-sharing-policy
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    dataInventory,
    regulations = ['HIPAA', 'GDPR'],
    outputDir = 'governance-output',
    organizationType = 'healthcare',
    includeInternational = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Genomic Data Governance for ${projectName}`);
  ctx.log('info', `Datasets: ${dataInventory.datasets?.length || 0}, Regulations: ${regulations.join(', ')}`);

  // Phase 1: Data Classification
  const classificationResult = await ctx.task(dataClassificationTask, { projectName, dataInventory, outputDir });
  artifacts.push(...classificationResult.artifacts);

  // Phase 2: Sensitivity Assessment
  const sensitivityResult = await ctx.task(sensitivityAssessmentTask, { projectName, classifiedData: classificationResult.classifiedData, outputDir });
  artifacts.push(...sensitivityResult.artifacts);

  await ctx.breakpoint({
    question: `Data classification complete. ${sensitivityResult.highSensitivity} high-sensitivity datasets identified. Review classification?`,
    title: 'Data Classification Review',
    context: { runId: ctx.runId, classification: sensitivityResult.summary, files: sensitivityResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Access Control Policy
  const accessResult = await ctx.task(accessControlPolicyTask, { projectName, sensitivityResult, regulations, outputDir });
  artifacts.push(...accessResult.artifacts);

  // Phase 4: Consent Management
  const consentResult = await ctx.task(consentManagementTask, { projectName, dataInventory, regulations, outputDir });
  artifacts.push(...consentResult.artifacts);

  // Phase 5: De-identification Procedures
  const deidentResult = await ctx.task(deidentificationTask, { projectName, sensitivityResult, regulations, outputDir });
  artifacts.push(...deidentResult.artifacts);

  // Phase 6: Audit Trail Setup
  const auditResult = await ctx.task(auditTrailSetupTask, { projectName, accessResult, outputDir });
  artifacts.push(...auditResult.artifacts);

  // Phase 7: Compliance Verification
  const complianceResult = await ctx.task(complianceVerificationTask, { projectName, regulations, accessResult, consentResult, deidentResult, auditResult, outputDir });
  artifacts.push(...complianceResult.artifacts);

  await ctx.breakpoint({
    question: `Compliance verification complete. Compliance score: ${complianceResult.score}%. Gaps identified: ${complianceResult.gaps.length}. Review compliance status?`,
    title: 'Compliance Review',
    context: { runId: ctx.runId, complianceStatus: complianceResult.status, gaps: complianceResult.gaps, files: complianceResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 8: Data Sharing Agreements
  const sharingResult = await ctx.task(dataSharingAgreementsTask, { projectName, dataInventory, regulations, includeInternational, outputDir });
  artifacts.push(...sharingResult.artifacts);

  // Phase 9: Breach Response Procedures
  const breachResult = await ctx.task(breachResponseTask, { projectName, regulations, outputDir });
  artifacts.push(...breachResult.artifacts);

  // Phase 10: Governance Report
  const reportResult = await ctx.task(generateGovernanceReportTask, { projectName, classificationResult, sensitivityResult, accessResult, consentResult, deidentResult, auditResult, complianceResult, sharingResult, breachResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Genomic Data Governance Complete. Compliance: ${complianceResult.score}%, ${sharingResult.agreementTemplates} agreement templates created. Approve governance framework?`,
    title: 'Governance Framework Complete',
    context: { runId: ctx.runId, summary: { compliance: complianceResult.score, policies: accessResult.policies.length, agreements: sharingResult.agreementTemplates }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Governance Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    regulations,
    governancePolicies: accessResult.policies,
    complianceReport: complianceResult.report,
    complianceScore: complianceResult.score,
    dataAgreements: sharingResult.templates,
    auditTrailSetup: auditResult.setup,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/genomic-data-governance', timestamp: startTime, regulations }
  };
}

// Task Definitions
export const dataClassificationTask = defineTask('data-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Classification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Classification Specialist',
      task: 'Classify genomic data assets',
      context: args,
      instructions: ['1. Inventory all genomic data assets', '2. Classify by data type', '3. Identify PHI elements', '4. Map data lineage', '5. Generate classification report'],
      outputFormat: 'JSON object with data classification'
    },
    outputSchema: { type: 'object', required: ['success', 'classifiedData', 'artifacts'], properties: { success: { type: 'boolean' }, classifiedData: { type: 'array' }, dataTypes: { type: 'object' }, phiElements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'classification']
}));

export const sensitivityAssessmentTask = defineTask('sensitivity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensitivity Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Sensitivity Specialist',
      task: 'Assess data sensitivity levels',
      context: args,
      instructions: ['1. Evaluate re-identification risk', '2. Assess sensitivity level', '3. Categorize by protection requirements', '4. Identify high-risk datasets', '5. Generate sensitivity report'],
      outputFormat: 'JSON object with sensitivity assessment'
    },
    outputSchema: { type: 'object', required: ['success', 'highSensitivity', 'summary', 'artifacts'], properties: { success: { type: 'boolean' }, highSensitivity: { type: 'number' }, mediumSensitivity: { type: 'number' }, lowSensitivity: { type: 'number' }, summary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'sensitivity']
}));

export const accessControlPolicyTask = defineTask('access-control-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Access Control Policy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Access Control Policy Specialist',
      task: 'Develop access control policies',
      context: args,
      instructions: ['1. Define role-based access controls', '2. Create data access tiers', '3. Develop approval workflows', '4. Set up access monitoring', '5. Generate access policies'],
      outputFormat: 'JSON object with access policies'
    },
    outputSchema: { type: 'object', required: ['success', 'policies', 'artifacts'], properties: { success: { type: 'boolean' }, policies: { type: 'array' }, accessTiers: { type: 'object' }, approvalWorkflows: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'access-control']
}));

export const consentManagementTask = defineTask('consent-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consent Management - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Consent Management Specialist',
      task: 'Establish consent management framework',
      context: args,
      instructions: ['1. Define consent types', '2. Create consent tracking system', '3. Establish consent withdrawal process', '4. Map data to consents', '5. Generate consent procedures'],
      outputFormat: 'JSON object with consent management'
    },
    outputSchema: { type: 'object', required: ['success', 'consentFramework', 'artifacts'], properties: { success: { type: 'boolean' }, consentFramework: { type: 'object' }, consentTypes: { type: 'array' }, withdrawalProcess: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'consent']
}));

export const deidentificationTask = defineTask('deidentification', (args, taskCtx) => ({
  kind: 'agent',
  title: `De-identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'De-identification Specialist',
      task: 'Develop de-identification procedures',
      context: args,
      instructions: ['1. Define de-identification standards', '2. Create anonymization procedures', '3. Establish re-identification risk assessment', '4. Document safe harbor requirements', '5. Generate de-identification SOPs'],
      outputFormat: 'JSON object with de-identification procedures'
    },
    outputSchema: { type: 'object', required: ['success', 'procedures', 'artifacts'], properties: { success: { type: 'boolean' }, procedures: { type: 'array' }, standards: { type: 'object' }, riskAssessment: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'de-identification']
}));

export const auditTrailSetupTask = defineTask('audit-trail-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Trail Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Audit Trail Specialist',
      task: 'Set up audit trail system',
      context: args,
      instructions: ['1. Define audit logging requirements', '2. Configure audit event capture', '3. Set up log retention', '4. Create audit review procedures', '5. Generate audit configuration'],
      outputFormat: 'JSON object with audit setup'
    },
    outputSchema: { type: 'object', required: ['success', 'setup', 'artifacts'], properties: { success: { type: 'boolean' }, setup: { type: 'object' }, loggingEvents: { type: 'array' }, retentionPolicy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'audit']
}));

export const complianceVerificationTask = defineTask('compliance-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compliance Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Verification Specialist',
      task: 'Verify regulatory compliance',
      context: args,
      instructions: ['1. Check HIPAA requirements', '2. Verify GDPR compliance', '3. Assess other regulations', '4. Identify compliance gaps', '5. Generate compliance report'],
      outputFormat: 'JSON object with compliance status'
    },
    outputSchema: { type: 'object', required: ['success', 'score', 'status', 'gaps', 'report', 'artifacts'], properties: { success: { type: 'boolean' }, score: { type: 'number' }, status: { type: 'object' }, gaps: { type: 'array' }, report: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'compliance']
}));

export const dataSharingAgreementsTask = defineTask('data-sharing-agreements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Sharing Agreements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Sharing Agreement Specialist',
      task: 'Develop data sharing agreement templates',
      context: args,
      instructions: ['1. Create DTA template', '2. Create DUA template', '3. Include required clauses', '4. Address international transfers', '5. Generate agreement library'],
      outputFormat: 'JSON object with agreement templates'
    },
    outputSchema: { type: 'object', required: ['success', 'templates', 'agreementTemplates', 'artifacts'], properties: { success: { type: 'boolean' }, templates: { type: 'array' }, agreementTemplates: { type: 'number' }, internationalClauses: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'data-sharing']
}));

export const breachResponseTask = defineTask('breach-response', (args, taskCtx) => ({
  kind: 'agent',
  title: `Breach Response - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Breach Response Specialist',
      task: 'Develop breach response procedures',
      context: args,
      instructions: ['1. Define breach categories', '2. Create notification timelines', '3. Establish response team', '4. Develop remediation procedures', '5. Generate breach response plan'],
      outputFormat: 'JSON object with breach response'
    },
    outputSchema: { type: 'object', required: ['success', 'responsePlan', 'artifacts'], properties: { success: { type: 'boolean' }, responsePlan: { type: 'object' }, notificationTimelines: { type: 'object' }, responseTeam: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'breach-response']
}));

export const generateGovernanceReportTask = defineTask('generate-governance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Governance Report Specialist',
      task: 'Generate comprehensive governance report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present governance framework', '3. Include compliance status', '4. Document policies', '5. Provide recommendations'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, policySummary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'governance', 'report-generation']
}));
