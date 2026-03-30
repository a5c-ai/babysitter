/**
 * @process specializations/domains/social-sciences-humanities/healthcare/clinical-decision-support
 * @description Clinical Decision Support Implementation - Methodology for designing, implementing, and
 * optimizing CDS systems that provide clinicians with knowledge at the point of care.
 * @inputs { organizationName: string, cdsScope?: string, targetAreas?: array, ehrPlatform?: string }
 * @outputs { success: boolean, cdsDesign: object, implementationPlan: object, evaluationPlan: object, artifacts: array }
 * @recommendedSkills SK-HC-014 (clinical-decision-support-rules), SK-HC-006 (health-data-integration), SK-HC-001 (clinical-workflow-analysis)
 * @recommendedAgents AG-HC-005 (clinical-informatics-specialist), AG-HC-001 (quality-improvement-orchestrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationName, cdsScope = 'enterprise', targetAreas = [], ehrPlatform = '', outputDir = 'cds-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CDS Implementation for: ${organizationName}`);

  const needsAssessment = await ctx.task(cdsNeedsAssessmentTask, { organizationName, cdsScope, targetAreas, outputDir });
  artifacts.push(...needsAssessment.artifacts);

  await ctx.breakpoint({ question: `Needs assessment complete. ${needsAssessment.opportunities.length} CDS opportunities identified. Proceed with design?`, title: 'CDS Needs Assessment Review', context: { runId: ctx.runId, opportunities: needsAssessment.opportunities } });

  const contentDesign = await ctx.task(cdsContentDesignTask, { needsAssessment, targetAreas, outputDir });
  artifacts.push(...contentDesign.artifacts);

  const knowledgeManagement = await ctx.task(cdsKnowledgeManagementTask, { contentDesign, outputDir });
  artifacts.push(...knowledgeManagement.artifacts);

  const technicalDesign = await ctx.task(cdsTechnicalDesignTask, { contentDesign, ehrPlatform, outputDir });
  artifacts.push(...technicalDesign.artifacts);

  await ctx.breakpoint({ question: `${contentDesign.alerts.length} alerts and ${contentDesign.orderSets.length} order sets designed. Proceed with workflow integration?`, title: 'CDS Content Design Review', context: { runId: ctx.runId, content: contentDesign.summary } });

  const workflowIntegration = await ctx.task(cdsWorkflowIntegrationTask, { contentDesign, technicalDesign, outputDir });
  artifacts.push(...workflowIntegration.artifacts);

  const alertFatigueMitigation = await ctx.task(cdsAlertFatigueTask, { contentDesign, workflowIntegration, outputDir });
  artifacts.push(...alertFatigueMitigation.artifacts);

  const testingStrategy = await ctx.task(cdsTestingTask, { contentDesign, technicalDesign, outputDir });
  artifacts.push(...testingStrategy.artifacts);

  const implementationPlan = await ctx.task(cdsImplementationPlanTask, { contentDesign, technicalDesign, workflowIntegration, outputDir });
  artifacts.push(...implementationPlan.artifacts);

  const evaluationPlan = await ctx.task(cdsEvaluationTask, { contentDesign, implementationPlan, outputDir });
  artifacts.push(...evaluationPlan.artifacts);

  const documentation = await ctx.task(cdsDocumentationTask, { organizationName, needsAssessment, contentDesign, knowledgeManagement, technicalDesign, workflowIntegration, implementationPlan, evaluationPlan, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, organizationName, cdsDesign: { content: contentDesign.summary, technical: technicalDesign.architecture, workflow: workflowIntegration.integrations }, implementationPlan: implementationPlan.plan, evaluationPlan: evaluationPlan.plan, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/domains/social-sciences-humanities/healthcare/clinical-decision-support', timestamp: startTime, outputDir } };
}

export const cdsNeedsAssessmentTask = defineTask('cds-needs', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Needs Assessment', agent: { name: 'cds-analyst', prompt: { role: 'CDS Analyst', task: 'Assess CDS needs and opportunities', context: args, instructions: ['1. Review current CDS landscape', '2. Identify clinical gaps', '3. Assess quality measure needs', '4. Review medication safety needs', '5. Identify diagnostic support needs', '6. Assess preventive care gaps', '7. Review regulatory requirements', '8. Prioritize opportunities', '9. Assess technical capabilities', '10. Document needs assessment'], outputFormat: 'JSON with needs assessment' }, outputSchema: { type: 'object', required: ['opportunities', 'priorities', 'artifacts'], properties: { opportunities: { type: 'array', items: { type: 'object' } }, priorities: { type: 'array', items: { type: 'object' } }, gaps: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'assessment', 'healthcare'] }));

export const cdsContentDesignTask = defineTask('cds-content', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Content Design', agent: { name: 'cds-designer', prompt: { role: 'CDS Content Designer', task: 'Design CDS content', context: args, instructions: ['1. Design alert/reminder content', '2. Create order set designs', '3. Design documentation templates', '4. Create drug interaction rules', '5. Design diagnostic support', '6. Create condition management', '7. Design reference information', '8. Apply Five Rights of CDS', '9. Define triggering logic', '10. Document content specifications'], outputFormat: 'JSON with content design' }, outputSchema: { type: 'object', required: ['alerts', 'orderSets', 'summary', 'artifacts'], properties: { alerts: { type: 'array', items: { type: 'object' } }, orderSets: { type: 'array', items: { type: 'object' } }, templates: { type: 'array', items: { type: 'object' } }, rules: { type: 'array', items: { type: 'object' } }, summary: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'content', 'healthcare'] }));

export const cdsKnowledgeManagementTask = defineTask('cds-knowledge', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Knowledge Management', agent: { name: 'knowledge-manager', prompt: { role: 'CDS Knowledge Manager', task: 'Design knowledge management', context: args, instructions: ['1. Define knowledge sources', '2. Design update process', '3. Create governance structure', '4. Plan evidence review', '5. Design version control', '6. Create maintenance schedule', '7. Plan knowledge validation', '8. Design conflict resolution', '9. Plan knowledge metrics', '10. Document knowledge management'], outputFormat: 'JSON with knowledge management' }, outputSchema: { type: 'object', required: ['knowledgePlan', 'governance', 'artifacts'], properties: { knowledgePlan: { type: 'object' }, governance: { type: 'object' }, sources: { type: 'array', items: { type: 'object' } }, updateProcess: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'knowledge', 'healthcare'] }));

export const cdsTechnicalDesignTask = defineTask('cds-technical', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Technical Design', agent: { name: 'cds-architect', prompt: { role: 'CDS Technical Architect', task: 'Design CDS technical architecture', context: args, instructions: ['1. Define CDS architecture', '2. Design rules engine', '3. Plan EHR integration', '4. Design terminology services', '5. Plan external CDS services', '6. Design FHIR CDS Hooks', '7. Plan scalability', '8. Design logging/audit', '9. Plan failover', '10. Document technical design'], outputFormat: 'JSON with technical design' }, outputSchema: { type: 'object', required: ['architecture', 'integration', 'artifacts'], properties: { architecture: { type: 'object' }, rulesEngine: { type: 'object' }, integration: { type: 'object' }, cdsHooks: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'technical', 'healthcare'] }));

export const cdsWorkflowIntegrationTask = defineTask('cds-workflow', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Workflow Integration', agent: { name: 'workflow-specialist', prompt: { role: 'CDS Workflow Specialist', task: 'Design workflow integration', context: args, instructions: ['1. Map clinical workflows', '2. Identify integration points', '3. Design alert presentation', '4. Plan information delivery', '5. Design response capture', '6. Plan escalation paths', '7. Design mobile integration', '8. Plan portal integration', '9. Test workflow impact', '10. Document integrations'], outputFormat: 'JSON with workflow integration' }, outputSchema: { type: 'object', required: ['integrations', 'workflows', 'artifacts'], properties: { integrations: { type: 'array', items: { type: 'object' } }, workflows: { type: 'array', items: { type: 'object' } }, alertPresentation: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'workflow', 'healthcare'] }));

export const cdsAlertFatigueTask = defineTask('cds-alert-fatigue', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Alert Fatigue Mitigation', agent: { name: 'alert-specialist', prompt: { role: 'CDS Alert Fatigue Specialist', task: 'Design alert fatigue mitigation', context: args, instructions: ['1. Assess alert volume baseline', '2. Design tiered alerting', '3. Plan suppression rules', '4. Design context sensitivity', '5. Plan override tracking', '6. Design alert optimization', '7. Create monitoring metrics', '8. Plan regular review', '9. Design user feedback', '10. Document mitigation strategy'], outputFormat: 'JSON with fatigue mitigation' }, outputSchema: { type: 'object', required: ['strategy', 'metrics', 'artifacts'], properties: { strategy: { type: 'object' }, tieredAlerts: { type: 'object' }, suppressionRules: { type: 'array', items: { type: 'object' } }, metrics: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'alert-fatigue', 'healthcare'] }));

export const cdsTestingTask = defineTask('cds-testing', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Testing Strategy', agent: { name: 'cds-tester', prompt: { role: 'CDS Testing Specialist', task: 'Design CDS testing strategy', context: args, instructions: ['1. Define testing approach', '2. Create test scenarios', '3. Plan logic validation', '4. Design usability testing', '5. Plan clinical review', '6. Design regression testing', '7. Plan performance testing', '8. Create acceptance criteria', '9. Design ongoing testing', '10. Document testing strategy'], outputFormat: 'JSON with testing strategy' }, outputSchema: { type: 'object', required: ['strategy', 'scenarios', 'artifacts'], properties: { strategy: { type: 'object' }, scenarios: { type: 'array', items: { type: 'object' } }, acceptanceCriteria: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'testing', 'healthcare'] }));

export const cdsImplementationPlanTask = defineTask('cds-implementation', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Implementation Plan', agent: { name: 'implementation-manager', prompt: { role: 'CDS Implementation Manager', task: 'Plan CDS implementation', context: args, instructions: ['1. Create implementation phases', '2. Plan pilot approach', '3. Define timeline', '4. Plan training', '5. Design communication', '6. Plan change management', '7. Define go-live support', '8. Create success criteria', '9. Plan risk mitigation', '10. Document implementation'], outputFormat: 'JSON with implementation plan' }, outputSchema: { type: 'object', required: ['plan', 'phases', 'artifacts'], properties: { plan: { type: 'object' }, phases: { type: 'array', items: { type: 'object' } }, timeline: { type: 'object' }, training: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'implementation', 'healthcare'] }));

export const cdsEvaluationTask = defineTask('cds-evaluation', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Evaluation Plan', agent: { name: 'cds-evaluator', prompt: { role: 'CDS Evaluation Specialist', task: 'Design CDS evaluation', context: args, instructions: ['1. Define evaluation framework', '2. Design outcome measures', '3. Plan process measures', '4. Design usage metrics', '5. Plan clinical impact', '6. Design user satisfaction', '7. Plan ROI analysis', '8. Create evaluation timeline', '9. Plan continuous monitoring', '10. Document evaluation plan'], outputFormat: 'JSON with evaluation plan' }, outputSchema: { type: 'object', required: ['plan', 'measures', 'artifacts'], properties: { plan: { type: 'object' }, measures: { type: 'array', items: { type: 'object' } }, framework: { type: 'object' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'evaluation', 'healthcare'] }));

export const cdsDocumentationTask = defineTask('cds-documentation', (args, taskCtx) => ({ kind: 'agent', title: 'CDS Documentation', agent: { name: 'technical-writer', prompt: { role: 'CDS Technical Writer', task: 'Document CDS program', context: args, instructions: ['1. Write executive summary', '2. Document needs assessment', '3. Include content design', '4. Document technical architecture', '5. Include workflow integration', '6. Document implementation', '7. Include evaluation plan', '8. Add knowledge management', '9. Create appendices', '10. Format professionally'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['documentPath', 'artifacts'], properties: { documentPath: { type: 'string' }, summary: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'cds', 'documentation', 'healthcare'] }));
