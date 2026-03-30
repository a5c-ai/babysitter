/**
 * @process specializations/domains/science/aerospace-engineering/environmental-testing-sequence
 * @description Environmental testing sequence planning per MIL-STD-810 and RTCA DO-160 including
 * vibration, thermal, EMI/EMC, and combined environment testing.
 * @inputs { projectName: string, productSpecification: object, environmentalRequirements: object, standards?: array }
 * @outputs { success: boolean, testSequence: object, testSpecifications: array, complianceStatus: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, productSpecification, environmentalRequirements, standards = ['MIL-STD-810', 'DO-160'] } = inputs;

  const environmentAnalysis = await ctx.task(environmentAnalysisTask, { projectName, productSpecification, environmentalRequirements });
  const testTailoring = await ctx.task(testTailoringTask, { projectName, environmentAnalysis, standards });

  await ctx.breakpoint({
    question: `Environmental tests tailored for ${projectName}. ${testTailoring.tests.length} tests identified. Proceed with sequence planning?`,
    title: 'Test Tailoring Review',
    context: { runId: ctx.runId, testTailoring }
  });

  const vibrationTest = await ctx.task(vibrationTestTask, { projectName, testTailoring, productSpecification });
  const thermalTest = await ctx.task(thermalTestTask, { projectName, testTailoring, productSpecification });
  const emiEmcTest = await ctx.task(emiEmcTestTask, { projectName, testTailoring, productSpecification });
  const combinedEnvTest = await ctx.task(combinedEnvTestTask, { projectName, vibrationTest, thermalTest });

  const testSequence = await ctx.task(testSequenceTask, { projectName, vibrationTest, thermalTest, emiEmcTest, combinedEnvTest, testTailoring });

  if (testSequence.preconditioningRequired) {
    await ctx.breakpoint({
      question: `Preconditioning tests required before ${testSequence.preconditioningFor.length} tests. Confirm sequence?`,
      title: 'Preconditioning Review',
      context: { runId: ctx.runId, preconditioning: testSequence.preconditioningFor }
    });
  }

  const testSpecifications = await ctx.task(testSpecificationsTask, { projectName, testSequence, testTailoring });
  const complianceStatus = await ctx.task(environmentalComplianceTask, { projectName, testSpecifications, standards });
  const report = await ctx.task(environmentalReportTask, { projectName, testSequence, testSpecifications, complianceStatus });

  await ctx.breakpoint({
    question: `Environmental test sequence complete for ${projectName}. ${testSpecifications.length} test specs. Approve?`,
    title: 'Environmental Test Approval',
    context: { runId: ctx.runId, summary: { tests: testSpecifications.length, duration: testSequence.totalDuration, compliance: complianceStatus.compliant } }
  });

  return { success: true, projectName, testSequence, testSpecifications, complianceStatus, report, metadata: { processId: 'environmental-testing-sequence', timestamp: ctx.now() } };
}

export const environmentAnalysisTask = defineTask('environment-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Environment Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Environmental Engineer', task: 'Analyze operational environment', context: args,
    instructions: ['1. Define operational scenarios', '2. Characterize thermal environment', '3. Characterize vibration environment', '4. Characterize EMI environment', '5. Document environment profile'],
    outputFormat: 'JSON object with environment analysis'
  }, outputSchema: { type: 'object', required: ['environments'], properties: { environments: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace']
}));

export const testTailoringTask = defineTask('test-tailoring', (args, taskCtx) => ({
  kind: 'agent', title: `Test Tailoring - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Environmental Test Tailoring Engineer', task: 'Tailor environmental tests', context: args,
    instructions: ['1. Select applicable tests', '2. Tailor test levels', '3. Tailor test durations', '4. Define test categories', '5. Document tailoring rationale'],
    outputFormat: 'JSON object with tailored tests'
  }, outputSchema: { type: 'object', required: ['tests'], properties: { tests: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace']
}));

export const vibrationTestTask = defineTask('vibration-test', (args, taskCtx) => ({
  kind: 'agent', title: `Vibration Test - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Vibration Test Engineer', task: 'Plan vibration tests', context: args,
    instructions: ['1. Define sine vibration', '2. Define random vibration', '3. Define shock tests', '4. Define gunfire tests if applicable', '5. Define fixture requirements', '6. Document vibration tests'],
    outputFormat: 'JSON object with vibration tests'
  }, outputSchema: { type: 'object', required: ['vibrationTests'], properties: { vibrationTests: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace', 'vibration']
}));

export const thermalTestTask = defineTask('thermal-test', (args, taskCtx) => ({
  kind: 'agent', title: `Thermal Test - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Thermal Test Engineer', task: 'Plan thermal tests', context: args,
    instructions: ['1. Define temperature cycling', '2. Define thermal shock', '3. Define altitude tests', '4. Define humidity tests', '5. Define solar radiation', '6. Document thermal tests'],
    outputFormat: 'JSON object with thermal tests'
  }, outputSchema: { type: 'object', required: ['thermalTests'], properties: { thermalTests: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace', 'thermal']
}));

export const emiEmcTestTask = defineTask('emi-emc-test', (args, taskCtx) => ({
  kind: 'agent', title: `EMI/EMC Test - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'EMI/EMC Test Engineer', task: 'Plan EMI/EMC tests', context: args,
    instructions: ['1. Define conducted emissions', '2. Define radiated emissions', '3. Define conducted susceptibility', '4. Define radiated susceptibility', '5. Define lightning tests', '6. Document EMI/EMC tests'],
    outputFormat: 'JSON object with EMI/EMC tests'
  }, outputSchema: { type: 'object', required: ['emiEmcTests'], properties: { emiEmcTests: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace', 'emi']
}));

export const combinedEnvTestTask = defineTask('combined-env-test', (args, taskCtx) => ({
  kind: 'agent', title: `Combined Environment Test - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Combined Environment Test Engineer', task: 'Plan combined environment tests', context: args,
    instructions: ['1. Define HALT tests', '2. Define combined thermal-vibration', '3. Define altitude-temperature', '4. Define HASS screening', '5. Document combined tests'],
    outputFormat: 'JSON object with combined tests'
  }, outputSchema: { type: 'object', required: ['combinedTests'], properties: { combinedTests: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace']
}));

export const testSequenceTask = defineTask('test-sequence', (args, taskCtx) => ({
  kind: 'agent', title: `Test Sequence - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Test Sequence Engineer', task: 'Define environmental test sequence', context: args,
    instructions: ['1. Sequence tests optimally', '2. Identify preconditioning', '3. Plan specimen utilization', '4. Calculate total duration', '5. Document sequence rationale'],
    outputFormat: 'JSON object with test sequence'
  }, outputSchema: { type: 'object', required: ['sequence', 'totalDuration', 'preconditioningRequired'], properties: { sequence: { type: 'array', items: { type: 'object' } }, totalDuration: { type: 'number' }, preconditioningRequired: { type: 'boolean' }, preconditioningFor: { type: 'array', items: { type: 'string' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace']
}));

export const testSpecificationsTask = defineTask('test-specifications', (args, taskCtx) => ({
  kind: 'agent', title: `Test Specifications - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Test Specification Author', task: 'Write test specifications', context: args,
    instructions: ['1. Write detailed test procedures', '2. Define pass/fail criteria', '3. Define instrumentation', '4. Define data requirements', '5. Document specifications'],
    outputFormat: 'JSON object with test specifications'
  }, outputSchema: { type: 'object', required: ['specifications'], properties: { specifications: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace']
}));

export const environmentalComplianceTask = defineTask('environmental-compliance', (args, taskCtx) => ({
  kind: 'agent', title: `Environmental Compliance - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Environmental Compliance Engineer', task: 'Verify environmental compliance', context: args,
    instructions: ['1. Map tests to requirements', '2. Verify MIL-STD-810 compliance', '3. Verify DO-160 compliance', '4. Identify gaps', '5. Document compliance status'],
    outputFormat: 'JSON object with compliance status'
  }, outputSchema: { type: 'object', required: ['compliant'], properties: { compliant: { type: 'boolean' }, complianceMatrix: { type: 'object' }, gaps: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace', 'compliance']
}));

export const environmentalReportTask = defineTask('environmental-report', (args, taskCtx) => ({
  kind: 'agent', title: `Environmental Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Environmental Report Author', task: 'Generate environmental test report', context: args,
    instructions: ['1. Create executive summary', '2. Document test sequence', '3. Present specifications', '4. Document compliance', '5. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['environmental', 'aerospace']
}));
