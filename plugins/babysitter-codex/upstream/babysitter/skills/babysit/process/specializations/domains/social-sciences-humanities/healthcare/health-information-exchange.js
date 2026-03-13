/**
 * @process specializations/domains/social-sciences-humanities/healthcare/health-information-exchange
 * @description Health Information Exchange (HIE) Integration - Process for establishing secure electronic
 * sharing of patient health information between healthcare organizations with interoperability standards.
 * @inputs { organizationName: string, hieNetwork?: string, participatingOrganizations?: array, useCase?: string }
 * @outputs { success: boolean, integrationPlan: object, governance: object, technicalSpec: object, artifacts: array }
 * @recommendedSkills SK-HC-006 (health-data-integration), SK-HC-003 (regulatory-compliance-assessment)
 * @recommendedAgents AG-HC-005 (clinical-informatics-specialist), AG-HC-002 (compliance-readiness-manager)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationName, hieNetwork = 'regional', participatingOrganizations = [], useCase = 'care-coordination', outputDir = 'hie-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HIE Integration for: ${organizationName}`);

  const readinessAssessment = await ctx.task(hieReadinessTask, { organizationName, hieNetwork, outputDir });
  artifacts.push(...readinessAssessment.artifacts);

  await ctx.breakpoint({ question: `HIE readiness: ${readinessAssessment.readinessScore}%. Proceed with governance planning?`, title: 'HIE Readiness Review', context: { runId: ctx.runId, readiness: readinessAssessment.findings } });

  const governanceFramework = await ctx.task(hieGovernanceTask, { readinessAssessment, participatingOrganizations, outputDir });
  artifacts.push(...governanceFramework.artifacts);

  const dataGovernance = await ctx.task(hieDataGovernanceTask, { governanceFramework, useCase, outputDir });
  artifacts.push(...dataGovernance.artifacts);

  const technicalArchitecture = await ctx.task(hieTechnicalArchitectureTask, { hieNetwork, useCase, outputDir });
  artifacts.push(...technicalArchitecture.artifacts);

  await ctx.breakpoint({ question: `Technical architecture designed. ${technicalArchitecture.interfaces.length} interfaces. Proceed with consent management?`, title: 'Technical Architecture Review', context: { runId: ctx.runId, architecture: technicalArchitecture.architecture } });

  const consentManagement = await ctx.task(hieConsentManagementTask, { dataGovernance, outputDir });
  artifacts.push(...consentManagement.artifacts);

  const securityCompliance = await ctx.task(hieSecurityComplianceTask, { technicalArchitecture, dataGovernance, outputDir });
  artifacts.push(...securityCompliance.artifacts);

  const implementationPlan = await ctx.task(hieImplementationTask, { technicalArchitecture, securityCompliance, consentManagement, outputDir });
  artifacts.push(...implementationPlan.artifacts);

  const testingPlan = await ctx.task(hieTestingTask, { technicalArchitecture, implementationPlan, outputDir });
  artifacts.push(...testingPlan.artifacts);

  const operationsSupport = await ctx.task(hieOperationsTask, { implementationPlan, outputDir });
  artifacts.push(...operationsSupport.artifacts);

  const documentation = await ctx.task(hieDocumentationTask, { organizationName, governanceFramework, dataGovernance, technicalArchitecture, consentManagement, securityCompliance, implementationPlan, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, organizationName, integrationPlan: implementationPlan.plan, governance: governanceFramework.framework, technicalSpec: technicalArchitecture.architecture, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/domains/social-sciences-humanities/healthcare/health-information-exchange', timestamp: startTime, outputDir } };
}

export const hieReadinessTask = defineTask('hie-readiness', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Readiness Assessment', agent: { name: 'hie-analyst', prompt: { role: 'HIE Analyst', task: 'Assess HIE readiness', context: args, instructions: ['1. Assess current interoperability capabilities', '2. Review existing interfaces', '3. Evaluate EHR readiness for HIE', '4. Assess network connectivity', '5. Review security infrastructure', '6. Evaluate staff readiness', '7. Assess organizational commitment', '8. Review regulatory compliance', '9. Identify gaps', '10. Calculate readiness score'], outputFormat: 'JSON with readiness assessment' }, outputSchema: { type: 'object', required: ['readinessScore', 'findings', 'artifacts'], properties: { readinessScore: { type: 'number' }, findings: { type: 'array', items: { type: 'object' } }, gaps: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'readiness', 'healthcare'] }));

export const hieGovernanceTask = defineTask('hie-governance', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Governance Framework', agent: { name: 'governance-architect', prompt: { role: 'HIE Governance Architect', task: 'Design HIE governance framework', context: args, instructions: ['1. Define governance structure', '2. Establish participant agreements', '3. Define data sharing policies', '4. Create dispute resolution process', '5. Define roles and responsibilities', '6. Establish fee structure', '7. Create sustainability model', '8. Define performance standards', '9. Establish oversight mechanisms', '10. Document governance framework'], outputFormat: 'JSON with governance framework' }, outputSchema: { type: 'object', required: ['framework', 'policies', 'artifacts'], properties: { framework: { type: 'object' }, policies: { type: 'array', items: { type: 'object' } }, agreements: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'governance', 'healthcare'] }));

export const hieDataGovernanceTask = defineTask('hie-data-governance', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Data Governance', agent: { name: 'data-governance-specialist', prompt: { role: 'HIE Data Governance Specialist', task: 'Design data governance for HIE', context: args, instructions: ['1. Define data standards', '2. Establish data quality requirements', '3. Define data use agreements', '4. Create data stewardship model', '5. Define minimum data sets', '6. Establish data retention policies', '7. Create data quality metrics', '8. Define breach protocols', '9. Establish audit requirements', '10. Document data governance'], outputFormat: 'JSON with data governance' }, outputSchema: { type: 'object', required: ['dataGovernance', 'standards', 'artifacts'], properties: { dataGovernance: { type: 'object' }, standards: { type: 'array', items: { type: 'object' } }, dataUseAgreements: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'data-governance', 'healthcare'] }));

export const hieTechnicalArchitectureTask = defineTask('hie-technical', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Technical Architecture', agent: { name: 'integration-architect', prompt: { role: 'Healthcare Integration Architect', task: 'Design HIE technical architecture', context: args, instructions: ['1. Define architecture model (federated/centralized)', '2. Design interface specifications', '3. Define FHIR/HL7 standards', '4. Plan master patient index', '5. Design query/response model', '6. Plan document exchange', '7. Design notifications/alerts', '8. Plan API gateway', '9. Define scalability approach', '10. Document technical architecture'], outputFormat: 'JSON with technical architecture' }, outputSchema: { type: 'object', required: ['architecture', 'interfaces', 'artifacts'], properties: { architecture: { type: 'object' }, interfaces: { type: 'array', items: { type: 'object' } }, standards: { type: 'object' }, mpiDesign: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'architecture', 'healthcare'] }));

export const hieConsentManagementTask = defineTask('hie-consent', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Consent Management', agent: { name: 'consent-specialist', prompt: { role: 'HIE Consent Specialist', task: 'Design consent management', context: args, instructions: ['1. Define consent model (opt-in/opt-out)', '2. Design consent capture process', '3. Create consent forms', '4. Plan consent storage', '5. Design consent query process', '6. Plan consent revocation', '7. Address sensitive data', '8. Plan patient access', '9. Design audit trail', '10. Document consent process'], outputFormat: 'JSON with consent management' }, outputSchema: { type: 'object', required: ['consentModel', 'process', 'artifacts'], properties: { consentModel: { type: 'object' }, process: { type: 'object' }, forms: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'consent', 'healthcare'] }));

export const hieSecurityComplianceTask = defineTask('hie-security', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Security and Compliance', agent: { name: 'security-officer', prompt: { role: 'HIE Security Officer', task: 'Design security and compliance', context: args, instructions: ['1. Define security requirements', '2. Design authentication/authorization', '3. Plan encryption approach', '4. Design audit logging', '5. Plan intrusion detection', '6. Define HIPAA compliance', '7. Plan security monitoring', '8. Design incident response', '9. Plan security testing', '10. Document security framework'], outputFormat: 'JSON with security framework' }, outputSchema: { type: 'object', required: ['securityFramework', 'compliance', 'artifacts'], properties: { securityFramework: { type: 'object' }, compliance: { type: 'object' }, authentication: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'security', 'healthcare'] }));

export const hieImplementationTask = defineTask('hie-implementation', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Implementation Plan', agent: { name: 'implementation-manager', prompt: { role: 'HIE Implementation Manager', task: 'Plan HIE implementation', context: args, instructions: ['1. Create implementation phases', '2. Define milestone schedule', '3. Plan resource requirements', '4. Design onboarding process', '5. Plan change management', '6. Create communication plan', '7. Define success criteria', '8. Plan risk mitigation', '9. Create go-live checklist', '10. Document implementation plan'], outputFormat: 'JSON with implementation plan' }, outputSchema: { type: 'object', required: ['plan', 'phases', 'milestones', 'artifacts'], properties: { plan: { type: 'object' }, phases: { type: 'array', items: { type: 'object' } }, milestones: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'implementation', 'healthcare'] }));

export const hieTestingTask = defineTask('hie-testing', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Testing Plan', agent: { name: 'testing-lead', prompt: { role: 'HIE Testing Lead', task: 'Plan HIE testing', context: args, instructions: ['1. Define testing strategy', '2. Plan connectivity testing', '3. Design integration testing', '4. Plan security testing', '5. Design end-to-end testing', '6. Plan performance testing', '7. Create test scenarios', '8. Define acceptance criteria', '9. Plan certification testing', '10. Document testing plan'], outputFormat: 'JSON with testing plan' }, outputSchema: { type: 'object', required: ['testingPlan', 'scenarios', 'artifacts'], properties: { testingPlan: { type: 'object' }, scenarios: { type: 'array', items: { type: 'object' } }, acceptanceCriteria: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'testing', 'healthcare'] }));

export const hieOperationsTask = defineTask('hie-operations', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Operations Support', agent: { name: 'operations-manager', prompt: { role: 'HIE Operations Manager', task: 'Plan HIE operations', context: args, instructions: ['1. Define operational model', '2. Plan support structure', '3. Design monitoring approach', '4. Create incident management', '5. Plan capacity management', '6. Define SLAs', '7. Plan maintenance windows', '8. Design reporting', '9. Plan continuous improvement', '10. Document operations'], outputFormat: 'JSON with operations plan' }, outputSchema: { type: 'object', required: ['operationsPlan', 'slas', 'artifacts'], properties: { operationsPlan: { type: 'object' }, slas: { type: 'array', items: { type: 'object' } }, monitoring: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'operations', 'healthcare'] }));

export const hieDocumentationTask = defineTask('hie-documentation', (args, taskCtx) => ({ kind: 'agent', title: 'HIE Documentation', agent: { name: 'technical-writer', prompt: { role: 'HIE Technical Writer', task: 'Document HIE program', context: args, instructions: ['1. Write executive summary', '2. Document governance', '3. Include technical specs', '4. Document security', '5. Include consent process', '6. Document implementation', '7. Include testing', '8. Document operations', '9. Create appendices', '10. Format professionally'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['documentPath', 'artifacts'], properties: { documentPath: { type: 'string' }, summary: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'hie', 'documentation', 'healthcare'] }));
