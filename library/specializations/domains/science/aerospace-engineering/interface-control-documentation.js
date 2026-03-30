/**
 * @process specializations/domains/science/aerospace-engineering/interface-control-documentation
 * @description Systematic approach to defining, documenting, and managing interfaces between aerospace subsystems
 * including ICDs and interface verification.
 * @inputs { projectName: string, systemArchitecture: object, subsystems: array }
 * @outputs { success: boolean, icdSet: object, interfaceMatrix: object, verificationStatus: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, systemArchitecture, subsystems } = inputs;

  const interfaceIdentification = await ctx.task(interfaceIdentificationTask, { projectName, systemArchitecture, subsystems });
  const interfaceMatrix = await ctx.task(interfaceMatrixTask, { projectName, interfaces: interfaceIdentification });

  await ctx.breakpoint({
    question: `${interfaceIdentification.totalInterfaces} interfaces identified for ${projectName}. Proceed with ICD development?`,
    title: 'Interface Identification Review',
    context: { runId: ctx.runId, interfaceMatrix }
  });

  const icdDevelopment = await ctx.task(icdDevelopmentTask, { projectName, interfaces: interfaceIdentification });
  const interfaceRequirements = await ctx.task(interfaceRequirementsTask, { projectName, icdSet: icdDevelopment });
  const verificationPlan = await ctx.task(interfaceVerificationPlanTask, { projectName, icdSet: icdDevelopment, interfaceRequirements });
  const verificationStatus = await ctx.task(interfaceVerificationStatusTask, { projectName, verificationPlan });
  const report = await ctx.task(icdReportTask, { projectName, interfaceMatrix, icdDevelopment, verificationStatus });

  await ctx.breakpoint({
    question: `ICD set complete for ${projectName}. ${verificationStatus.verified}/${verificationStatus.total} verified. Approve?`,
    title: 'ICD Approval',
    context: { runId: ctx.runId, summary: { totalICDs: icdDevelopment.count, verified: verificationStatus.verified } }
  });

  return { success: true, projectName, icdSet: icdDevelopment, interfaceMatrix, verificationStatus, report, metadata: { processId: 'interface-control-documentation', timestamp: ctx.now() } };
}

export const interfaceIdentificationTask = defineTask('interface-identification', (args, taskCtx) => ({
  kind: 'agent', title: `Interface Identification - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Interface Engineer', task: 'Identify all system interfaces', context: args,
    instructions: ['1. Map subsystem boundaries', '2. Identify physical interfaces', '3. Identify data interfaces', '4. Identify power interfaces', '5. Document interfaces'],
    outputFormat: 'JSON object with interfaces'
  }, outputSchema: { type: 'object', required: ['totalInterfaces', 'interfaces'], properties: { totalInterfaces: { type: 'number' }, interfaces: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['interfaces', 'aerospace']
}));

export const interfaceMatrixTask = defineTask('interface-matrix', (args, taskCtx) => ({
  kind: 'agent', title: `Interface Matrix - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Interface Matrix Engineer', task: 'Create N-squared interface matrix', context: args,
    instructions: ['1. Create N-squared diagram', '2. Map all connections', '3. Identify interface types', '4. Document owners', '5. Create matrix'],
    outputFormat: 'JSON object with interface matrix'
  }, outputSchema: { type: 'object', required: ['matrix'], properties: { matrix: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['interfaces', 'aerospace']
}));

export const icdDevelopmentTask = defineTask('icd-development', (args, taskCtx) => ({
  kind: 'agent', title: `ICD Development - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'ICD Author', task: 'Develop interface control documents', context: args,
    instructions: ['1. Define physical interfaces', '2. Define data protocols', '3. Define power interfaces', '4. Define environmental interfaces', '5. Create ICD set'],
    outputFormat: 'JSON object with ICDs'
  }, outputSchema: { type: 'object', required: ['count', 'icds'], properties: { count: { type: 'number' }, icds: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['interfaces', 'aerospace']
}));

export const interfaceRequirementsTask = defineTask('interface-requirements', (args, taskCtx) => ({
  kind: 'agent', title: `Interface Requirements - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Interface Requirements Engineer', task: 'Define interface requirements', context: args,
    instructions: ['1. Extract requirements from ICDs', '2. Define verification methods', '3. Link to system requirements', '4. Define tolerances', '5. Document requirements'],
    outputFormat: 'JSON object with interface requirements'
  }, outputSchema: { type: 'object', required: ['requirements'], properties: { requirements: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['interfaces', 'aerospace']
}));

export const interfaceVerificationPlanTask = defineTask('interface-verification-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Interface Verification Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Interface V&V Engineer', task: 'Plan interface verification', context: args,
    instructions: ['1. Plan fit checks', '2. Plan functional tests', '3. Plan integration tests', '4. Define success criteria', '5. Document plan'],
    outputFormat: 'JSON object with verification plan'
  }, outputSchema: { type: 'object', required: ['plan'], properties: { plan: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['interfaces', 'aerospace']
}));

export const interfaceVerificationStatusTask = defineTask('interface-verification-status', (args, taskCtx) => ({
  kind: 'agent', title: `Interface Verification Status - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Interface Verification Tracker', task: 'Track interface verification status', context: args,
    instructions: ['1. Track verification status', '2. Identify open items', '3. Calculate completion', '4. Document results', '5. Report status'],
    outputFormat: 'JSON object with verification status'
  }, outputSchema: { type: 'object', required: ['verified', 'total'], properties: { verified: { type: 'number' }, total: { type: 'number' }, openItems: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['interfaces', 'aerospace']
}));

export const icdReportTask = defineTask('icd-report', (args, taskCtx) => ({
  kind: 'agent', title: `ICD Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'ICD Report Engineer', task: 'Generate ICD report', context: args,
    instructions: ['1. Create summary', '2. Document interfaces', '3. Present verification', '4. Document status', '5. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['interfaces', 'aerospace']
}));
