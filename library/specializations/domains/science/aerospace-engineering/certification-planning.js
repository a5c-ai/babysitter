/**
 * @process specializations/domains/science/aerospace-engineering/certification-planning
 * @description Comprehensive certification planning process for aerospace products including regulatory compliance,
 * certification basis, and means of compliance documentation.
 * @inputs { projectName: string, productType: string, regulatoryAuthority: string, certificationScope?: object }
 * @outputs { success: boolean, certificationBasis: object, complianceMatrix: object, certificationPlan: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, productType, regulatoryAuthority, certificationScope = {} } = inputs;

  const regulatoryAnalysis = await ctx.task(regulatoryAnalysisTask, { projectName, productType, regulatoryAuthority });
  const certificationBasis = await ctx.task(certificationBasisTask, { projectName, regulatoryAnalysis, certificationScope });

  await ctx.breakpoint({
    question: `Certification basis established for ${projectName}: ${certificationBasis.regulations.length} regulations. Proceed with MOC development?`,
    title: 'Certification Basis Review',
    context: { runId: ctx.runId, certificationBasis }
  });

  const mocDefinition = await ctx.task(mocDefinitionTask, { projectName, certificationBasis });
  const complianceMatrix = await ctx.task(complianceMatrixTask, { projectName, certificationBasis, mocDefinition });
  const testPlan = await ctx.task(certificationTestPlanTask, { projectName, complianceMatrix, mocDefinition });

  if (complianceMatrix.gaps.length > 0) {
    await ctx.breakpoint({
      question: `${complianceMatrix.gaps.length} compliance gaps identified. Review and resolve?`,
      title: 'Compliance Gap Warning',
      context: { runId: ctx.runId, gaps: complianceMatrix.gaps }
    });
  }

  const scheduleRisk = await ctx.task(certificationScheduleTask, { projectName, complianceMatrix, testPlan });
  const certificationPlan = await ctx.task(certificationPlanTask, { projectName, certificationBasis, complianceMatrix, testPlan, scheduleRisk });
  const report = await ctx.task(certificationReportTask, { projectName, certificationBasis, complianceMatrix, certificationPlan });

  await ctx.breakpoint({
    question: `Certification plan complete for ${projectName}. ${complianceMatrix.compliantCount}/${complianceMatrix.totalRequirements} requirements addressed. Approve?`,
    title: 'Certification Plan Approval',
    context: { runId: ctx.runId, summary: { authority: regulatoryAuthority, totalRequirements: complianceMatrix.totalRequirements, compliant: complianceMatrix.compliantCount } }
  });

  return { success: true, projectName, certificationBasis, complianceMatrix, certificationPlan, report, metadata: { processId: 'certification-planning', timestamp: ctx.now() } };
}

export const regulatoryAnalysisTask = defineTask('regulatory-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Regulatory Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Certification Engineer', task: 'Analyze regulatory requirements', context: args,
    instructions: ['1. Identify applicable regulations (FAR/CS)', '2. Identify special conditions', '3. Review exemptions/deviations', '4. Identify advisory material', '5. Document regulatory landscape'],
    outputFormat: 'JSON object with regulatory analysis'
  }, outputSchema: { type: 'object', required: ['regulations', 'specialConditions'], properties: { regulations: { type: 'array', items: { type: 'object' } }, specialConditions: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));

export const certificationBasisTask = defineTask('certification-basis', (args, taskCtx) => ({
  kind: 'agent', title: `Certification Basis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Certification Basis Engineer', task: 'Establish certification basis', context: args,
    instructions: ['1. Define type certificate basis', '2. Identify amendment levels', '3. Document elected options', '4. Define equivalent safety', '5. Document certification basis'],
    outputFormat: 'JSON object with certification basis'
  }, outputSchema: { type: 'object', required: ['regulations', 'amendmentLevel'], properties: { regulations: { type: 'array', items: { type: 'object' } }, amendmentLevel: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));

export const mocDefinitionTask = defineTask('moc-definition', (args, taskCtx) => ({
  kind: 'agent', title: `MOC Definition - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Means of Compliance Engineer', task: 'Define means of compliance', context: args,
    instructions: ['1. Define MOC for each requirement', '2. Identify test requirements', '3. Identify analysis requirements', '4. Identify inspection requirements', '5. Map to certification basis'],
    outputFormat: 'JSON object with MOC definitions'
  }, outputSchema: { type: 'object', required: ['mocs'], properties: { mocs: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));

export const complianceMatrixTask = defineTask('compliance-matrix', (args, taskCtx) => ({
  kind: 'agent', title: `Compliance Matrix - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Compliance Engineer', task: 'Build compliance matrix', context: args,
    instructions: ['1. Map requirements to MOCs', '2. Identify compliance documents', '3. Track compliance status', '4. Identify gaps', '5. Calculate coverage'],
    outputFormat: 'JSON object with compliance matrix'
  }, outputSchema: { type: 'object', required: ['totalRequirements', 'compliantCount', 'gaps'], properties: { totalRequirements: { type: 'number' }, compliantCount: { type: 'number' }, gaps: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));

export const certificationTestPlanTask = defineTask('certification-test-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Certification Test Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Certification Test Engineer', task: 'Plan certification tests', context: args,
    instructions: ['1. Identify required tests', '2. Define test objectives', '3. Plan test sequence', '4. Identify DER witnessing', '5. Plan conformity inspections'],
    outputFormat: 'JSON object with test plan'
  }, outputSchema: { type: 'object', required: ['tests'], properties: { tests: { type: 'array', items: { type: 'object' } }, witnessPoints: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));

export const certificationScheduleTask = defineTask('certification-schedule', (args, taskCtx) => ({
  kind: 'agent', title: `Certification Schedule - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Certification Schedule Engineer', task: 'Develop certification schedule', context: args,
    instructions: ['1. Define certification milestones', '2. Plan authority engagement', '3. Schedule conformity inspections', '4. Plan document submissions', '5. Identify schedule risks'],
    outputFormat: 'JSON object with schedule'
  }, outputSchema: { type: 'object', required: ['milestones', 'risks'], properties: { milestones: { type: 'array', items: { type: 'object' } }, risks: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));

export const certificationPlanTask = defineTask('certification-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Certification Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Certification Plan Manager', task: 'Compile certification plan', context: args,
    instructions: ['1. Compile certification plan document', '2. Define organization responsibilities', '3. Document DER/DAR involvement', '4. Define quality system', '5. Plan authority meetings'],
    outputFormat: 'JSON object with certification plan'
  }, outputSchema: { type: 'object', required: ['plan'], properties: { plan: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));

export const certificationReportTask = defineTask('certification-report', (args, taskCtx) => ({
  kind: 'agent', title: `Certification Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Certification Report Author', task: 'Generate certification report', context: args,
    instructions: ['1. Create executive summary', '2. Document certification basis', '3. Present compliance matrix', '4. Document schedule', '5. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['certification', 'aerospace']
}));
