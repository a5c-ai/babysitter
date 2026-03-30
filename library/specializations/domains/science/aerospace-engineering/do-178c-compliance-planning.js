/**
 * @process specializations/domains/science/aerospace-engineering/do-178c-compliance-planning
 * @description DO-178C/ED-12C airborne software compliance planning process including PSAC development,
 * software lifecycle planning, and certification liaison.
 * @inputs { projectName: string, softwareDefinition: object, dalLevel: string, supplements?: array }
 * @outputs { success: boolean, psac: object, softwarePlans: object, complianceMatrix: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, softwareDefinition, dalLevel, supplements = [] } = inputs;

  const objectivesAnalysis = await ctx.task(objectivesAnalysisTask, { projectName, dalLevel, supplements });
  const psac = await ctx.task(psacDevelopmentTask, { projectName, softwareDefinition, dalLevel, objectivesAnalysis });

  await ctx.breakpoint({
    question: `PSAC drafted for ${projectName} at DAL ${dalLevel}. ${objectivesAnalysis.objectives.length} objectives. Proceed with plans development?`,
    title: 'PSAC Review',
    context: { runId: ctx.runId, psac }
  });

  const sdp = await ctx.task(sdpTask, { projectName, psac, dalLevel });
  const svp = await ctx.task(svpTask, { projectName, psac, dalLevel });
  const scmp = await ctx.task(scmpTask, { projectName, psac, dalLevel });
  const sqap = await ctx.task(sqapTask, { projectName, psac, dalLevel });

  const softwarePlans = { sdp, svp, scmp, sqap };

  const sas = await ctx.task(sasTask, { projectName, psac, softwarePlans, supplements });
  const complianceMatrix = await ctx.task(do178ComplianceMatrixTask, { projectName, objectivesAnalysis, softwarePlans, sas });

  if (complianceMatrix.independenceGaps.length > 0) {
    await ctx.breakpoint({
      question: `${complianceMatrix.independenceGaps.length} independence requirements need attention. Review?`,
      title: 'Independence Gap Warning',
      context: { runId: ctx.runId, gaps: complianceMatrix.independenceGaps }
    });
  }

  const toolQualification = await ctx.task(toolQualificationTask, { projectName, dalLevel, softwarePlans });
  const certificationLiaison = await ctx.task(certificationLiaisonTask, { projectName, psac, complianceMatrix });
  const report = await ctx.task(do178ReportTask, { projectName, psac, softwarePlans, complianceMatrix, toolQualification });

  await ctx.breakpoint({
    question: `DO-178C planning complete for ${projectName}. Coverage: ${complianceMatrix.coverage}%. Approve?`,
    title: 'DO-178C Plan Approval',
    context: { runId: ctx.runId, summary: { dalLevel, objectives: objectivesAnalysis.objectives.length, coverage: complianceMatrix.coverage } }
  });

  return { success: true, projectName, psac, softwarePlans, complianceMatrix, toolQualification, report, metadata: { processId: 'do-178c-compliance-planning', timestamp: ctx.now() } };
}

export const objectivesAnalysisTask = defineTask('objectives-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Objectives Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'DO-178C Engineer', task: 'Analyze DO-178C objectives', context: args,
    instructions: ['1. Identify applicable objectives by DAL', '2. Identify supplement objectives', '3. Determine independence requirements', '4. Map to lifecycle data', '5. Document objectives'],
    outputFormat: 'JSON object with objectives analysis'
  }, outputSchema: { type: 'object', required: ['objectives'], properties: { objectives: { type: 'array', items: { type: 'object' } }, independenceRequired: { type: 'array', items: { type: 'string' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const psacDevelopmentTask = defineTask('psac-development', (args, taskCtx) => ({
  kind: 'agent', title: `PSAC Development - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'PSAC Author', task: 'Develop Plan for Software Aspects of Certification', context: args,
    instructions: ['1. Define software overview', '2. Define certification considerations', '3. Define software lifecycle', '4. Define software lifecycle data', '5. Define schedule', '6. Define additional considerations'],
    outputFormat: 'JSON object with PSAC'
  }, outputSchema: { type: 'object', required: ['psac'], properties: { psac: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const sdpTask = defineTask('sdp', (args, taskCtx) => ({
  kind: 'agent', title: `SDP - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'SDP Author', task: 'Develop Software Development Plan', context: args,
    instructions: ['1. Define development environment', '2. Define development standards', '3. Define development processes', '4. Define requirements process', '5. Define design process', '6. Define coding process', '7. Define integration process'],
    outputFormat: 'JSON object with SDP'
  }, outputSchema: { type: 'object', required: ['sdp'], properties: { sdp: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const svpTask = defineTask('svp', (args, taskCtx) => ({
  kind: 'agent', title: `SVP - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'SVP Author', task: 'Develop Software Verification Plan', context: args,
    instructions: ['1. Define verification environment', '2. Define review processes', '3. Define analysis processes', '4. Define test processes', '5. Define coverage analysis', '6. Define independence'],
    outputFormat: 'JSON object with SVP'
  }, outputSchema: { type: 'object', required: ['svp'], properties: { svp: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const scmpTask = defineTask('scmp', (args, taskCtx) => ({
  kind: 'agent', title: `SCMP - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'SCMP Author', task: 'Develop Software Configuration Management Plan', context: args,
    instructions: ['1. Define CM environment', '2. Define configuration identification', '3. Define baseline management', '4. Define change control', '5. Define status accounting', '6. Define archive/retrieval'],
    outputFormat: 'JSON object with SCMP'
  }, outputSchema: { type: 'object', required: ['scmp'], properties: { scmp: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const sqapTask = defineTask('sqap', (args, taskCtx) => ({
  kind: 'agent', title: `SQAP - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'SQAP Author', task: 'Develop Software Quality Assurance Plan', context: args,
    instructions: ['1. Define SQA environment', '2. Define SQA authority', '3. Define SQA activities', '4. Define independence', '5. Define conformity review', '6. Define problem reporting'],
    outputFormat: 'JSON object with SQAP'
  }, outputSchema: { type: 'object', required: ['sqap'], properties: { sqap: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const sasTask = defineTask('sas', (args, taskCtx) => ({
  kind: 'agent', title: `SAS - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'SAS Author', task: 'Develop Software Accomplishment Summary', context: args,
    instructions: ['1. Define SAS structure', '2. Plan compliance summary', '3. Plan deviations documentation', '4. Plan lifecycle data summary', '5. Document SAS template'],
    outputFormat: 'JSON object with SAS plan'
  }, outputSchema: { type: 'object', required: ['sasTemplate'], properties: { sasTemplate: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const do178ComplianceMatrixTask = defineTask('do178-compliance-matrix', (args, taskCtx) => ({
  kind: 'agent', title: `DO-178C Compliance Matrix - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Compliance Engineer', task: 'Build DO-178C compliance matrix', context: args,
    instructions: ['1. Map objectives to plans', '2. Map objectives to data items', '3. Identify independence gaps', '4. Calculate coverage', '5. Document matrix'],
    outputFormat: 'JSON object with compliance matrix'
  }, outputSchema: { type: 'object', required: ['coverage', 'independenceGaps'], properties: { coverage: { type: 'number' }, independenceGaps: { type: 'array', items: { type: 'object' } }, matrix: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const toolQualificationTask = defineTask('tool-qualification', (args, taskCtx) => ({
  kind: 'agent', title: `Tool Qualification - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Tool Qualification Engineer', task: 'Plan tool qualification', context: args,
    instructions: ['1. Identify development tools', '2. Identify verification tools', '3. Classify tool impact (TQL)', '4. Plan qualification activities', '5. Document tool qualification plan'],
    outputFormat: 'JSON object with tool qualification plan'
  }, outputSchema: { type: 'object', required: ['tools'], properties: { tools: { type: 'array', items: { type: 'object' } }, qualificationRequired: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const certificationLiaisonTask = defineTask('certification-liaison', (args, taskCtx) => ({
  kind: 'agent', title: `Certification Liaison - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Certification Liaison', task: 'Plan certification liaison activities', context: args,
    instructions: ['1. Plan SOI meetings', '2. Plan stage of involvement', '3. Plan conformity reviews', '4. Plan DER involvement', '5. Document liaison plan'],
    outputFormat: 'JSON object with liaison plan'
  }, outputSchema: { type: 'object', required: ['soiPlan'], properties: { soiPlan: { type: 'object' }, meetings: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));

export const do178ReportTask = defineTask('do178-report', (args, taskCtx) => ({
  kind: 'agent', title: `DO-178C Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'DO-178C Report Author', task: 'Generate DO-178C compliance report', context: args,
    instructions: ['1. Create executive summary', '2. Document PSAC', '3. Document plans', '4. Present compliance matrix', '5. Document tool qualification', '6. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['do-178c', 'aerospace', 'software']
}));
