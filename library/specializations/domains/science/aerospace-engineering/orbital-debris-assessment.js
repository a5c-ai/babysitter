/**
 * @process specializations/domains/science/aerospace-engineering/orbital-debris-assessment
 * @description Process for assessing and mitigating orbital debris risks including collision probability analysis
 * and debris mitigation planning.
 * @inputs { projectName: string, orbitDefinition: object, spacecraftConfig: object, missionDuration?: number }
 * @outputs { success: boolean, collisionRisk: object, mitigationPlan: object, complianceStatus: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, orbitDefinition, spacecraftConfig, missionDuration = 5 } = inputs;

  const riskAssessment = await ctx.task(debrisRiskAssessmentTask, { projectName, orbitDefinition, missionDuration });
  const collisionAnalysis = await ctx.task(collisionAnalysisTask, { projectName, orbitDefinition, spacecraftConfig });

  if (collisionAnalysis.probability > 1e-4) {
    await ctx.breakpoint({
      question: `Collision probability ${collisionAnalysis.probability.toExponential(2)} exceeds 1e-4. Review mitigation options?`,
      title: 'Collision Risk Warning',
      context: { runId: ctx.runId, collisionAnalysis }
    });
  }

  const shieldingAnalysis = await ctx.task(shieldingAnalysisTask, { projectName, spacecraftConfig, riskAssessment });
  const deorbitPlan = await ctx.task(deorbitPlanTask, { projectName, orbitDefinition, spacecraftConfig, missionDuration });
  const mitigationPlan = await ctx.task(mitigationPlanTask, { projectName, riskAssessment, shieldingAnalysis, deorbitPlan });
  const complianceStatus = await ctx.task(debrisComplianceTask, { projectName, mitigationPlan, deorbitPlan });
  const report = await ctx.task(debrisReportTask, { projectName, riskAssessment, collisionAnalysis, mitigationPlan, complianceStatus });

  await ctx.breakpoint({
    question: `Debris assessment complete for ${projectName}. Compliance: ${complianceStatus.compliant ? 'Yes' : 'No'}. Approve?`,
    title: 'Debris Assessment Approval',
    context: { runId: ctx.runId, summary: { probability: collisionAnalysis.probability, deorbitTime: deorbitPlan.deorbitTime, compliant: complianceStatus.compliant } }
  });

  return { success: true, projectName, collisionRisk: collisionAnalysis, mitigationPlan, complianceStatus, report, metadata: { processId: 'orbital-debris-assessment', timestamp: ctx.now() } };
}

export const debrisRiskAssessmentTask = defineTask('debris-risk-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Risk Assessment - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Orbital Debris Analyst', task: 'Assess debris environment risk', context: args,
    instructions: ['1. Characterize debris environment', '2. Calculate flux', '3. Identify risk drivers', '4. Assess temporal trends', '5. Document assessment'],
    outputFormat: 'JSON object with risk assessment'
  }, outputSchema: { type: 'object', required: ['fluxLevel', 'riskCategory'], properties: { fluxLevel: { type: 'number' }, riskCategory: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['debris', 'aerospace']
}));

export const collisionAnalysisTask = defineTask('collision-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Collision Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Collision Risk Analyst', task: 'Analyze collision probability', context: args,
    instructions: ['1. Calculate cross-section', '2. Apply debris models', '3. Calculate probability', '4. Identify threats', '5. Document analysis'],
    outputFormat: 'JSON object with collision analysis'
  }, outputSchema: { type: 'object', required: ['probability'], properties: { probability: { type: 'number' }, threats: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['debris', 'aerospace']
}));

export const shieldingAnalysisTask = defineTask('shielding-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Shielding Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'MMOD Shielding Engineer', task: 'Design debris shielding', context: args,
    instructions: ['1. Assess MMOD threat', '2. Design shielding', '3. Calculate weight', '4. Verify protection', '5. Document design'],
    outputFormat: 'JSON object with shielding analysis'
  }, outputSchema: { type: 'object', required: ['shieldingMass'], properties: { shieldingMass: { type: 'number' }, protection: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['debris', 'aerospace']
}));

export const deorbitPlanTask = defineTask('deorbit-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Deorbit Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Deorbit Planning Engineer', task: 'Design deorbit strategy', context: args,
    instructions: ['1. Calculate natural decay', '2. Design active deorbit', '3. Calculate delta-V', '4. Verify 25-year rule', '5. Document plan'],
    outputFormat: 'JSON object with deorbit plan'
  }, outputSchema: { type: 'object', required: ['deorbitTime', 'method'], properties: { deorbitTime: { type: 'number' }, method: { type: 'string' }, deltaV: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['debris', 'aerospace']
}));

export const mitigationPlanTask = defineTask('mitigation-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Mitigation Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Debris Mitigation Planner', task: 'Develop mitigation plan', context: args,
    instructions: ['1. Identify mitigation measures', '2. Design collision avoidance', '3. Plan passivation', '4. Design debris release prevention', '5. Document plan'],
    outputFormat: 'JSON object with mitigation plan'
  }, outputSchema: { type: 'object', required: ['measures'], properties: { measures: { type: 'array', items: { type: 'object' } }, collisionAvoidance: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['debris', 'aerospace']
}));

export const debrisComplianceTask = defineTask('debris-compliance', (args, taskCtx) => ({
  kind: 'agent', title: `Compliance Assessment - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Debris Compliance Engineer', task: 'Assess regulatory compliance', context: args,
    instructions: ['1. Check NASA-STD-8719.14', '2. Check IADC guidelines', '3. Check FCC requirements', '4. Verify 25-year rule', '5. Document compliance'],
    outputFormat: 'JSON object with compliance status'
  }, outputSchema: { type: 'object', required: ['compliant'], properties: { compliant: { type: 'boolean' }, complianceMatrix: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['debris', 'aerospace']
}));

export const debrisReportTask = defineTask('debris-report', (args, taskCtx) => ({
  kind: 'agent', title: `Debris Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Debris Report Engineer', task: 'Generate debris assessment report', context: args,
    instructions: ['1. Create summary', '2. Document risk', '3. Present mitigation', '4. Document compliance', '5. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['debris', 'aerospace']
}));
