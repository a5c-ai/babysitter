/**
 * @process specializations/domains/science/aerospace-engineering/flight-test-planning
 * @description Comprehensive flight test planning process including test card development, risk assessment,
 * instrumentation requirements, and flight test safety.
 * @inputs { projectName: string, testObjectives: array, aircraftConfiguration: object, flightEnvelope?: object }
 * @outputs { success: boolean, testPlan: object, testCards: array, safetyAssessment: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, testObjectives, aircraftConfiguration, flightEnvelope = {} } = inputs;

  const testRequirements = await ctx.task(testRequirementsTask, { projectName, testObjectives, aircraftConfiguration });
  const testMatrix = await ctx.task(testMatrixTask, { projectName, testRequirements, flightEnvelope });

  await ctx.breakpoint({
    question: `Test matrix developed for ${projectName}. ${testMatrix.totalPoints} test points. Proceed with test card development?`,
    title: 'Test Matrix Review',
    context: { runId: ctx.runId, testMatrix }
  });

  const testCards = await ctx.task(testCardDevelopmentTask, { projectName, testMatrix, aircraftConfiguration });
  const instrumentationPlan = await ctx.task(instrumentationPlanTask, { projectName, testRequirements, testCards });
  const safetyAssessment = await ctx.task(flightTestSafetyTask, { projectName, testCards, aircraftConfiguration, flightEnvelope });

  if (safetyAssessment.highRiskPoints > 0) {
    await ctx.breakpoint({
      question: `${safetyAssessment.highRiskPoints} high-risk test points identified. Review risk mitigations?`,
      title: 'Flight Test Safety Warning',
      context: { runId: ctx.runId, highRiskPoints: safetyAssessment.highRiskItems }
    });
  }

  const buildUpApproach = await ctx.task(buildUpApproachTask, { projectName, testCards, safetyAssessment });
  const crewBriefing = await ctx.task(crewBriefingTask, { projectName, testCards, safetyAssessment, buildUpApproach });
  const testPlan = await ctx.task(testPlanTask, { projectName, testMatrix, testCards, instrumentationPlan, safetyAssessment, buildUpApproach });
  const report = await ctx.task(flightTestReportTask, { projectName, testPlan, testCards, safetyAssessment });

  await ctx.breakpoint({
    question: `Flight test plan complete for ${projectName}. ${testCards.length} test cards, ${safetyAssessment.overallRisk} overall risk. Approve?`,
    title: 'Flight Test Plan Approval',
    context: { runId: ctx.runId, summary: { testCards: testCards.length, totalPoints: testMatrix.totalPoints, overallRisk: safetyAssessment.overallRisk } }
  });

  return { success: true, projectName, testPlan, testCards, safetyAssessment, report, metadata: { processId: 'flight-test-planning', timestamp: ctx.now() } };
}

export const testRequirementsTask = defineTask('test-requirements', (args, taskCtx) => ({
  kind: 'agent', title: `Test Requirements - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Flight Test Engineer', task: 'Define flight test requirements', context: args,
    instructions: ['1. Analyze test objectives', '2. Define data requirements', '3. Define accuracy requirements', '4. Define test conditions', '5. Document requirements'],
    outputFormat: 'JSON object with test requirements'
  }, outputSchema: { type: 'object', required: ['requirements'], properties: { requirements: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));

export const testMatrixTask = defineTask('test-matrix', (args, taskCtx) => ({
  kind: 'agent', title: `Test Matrix - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Test Matrix Engineer', task: 'Develop flight test matrix', context: args,
    instructions: ['1. Define test configurations', '2. Define test conditions', '3. Define test points', '4. Optimize test efficiency', '5. Document test matrix'],
    outputFormat: 'JSON object with test matrix'
  }, outputSchema: { type: 'object', required: ['totalPoints', 'matrix'], properties: { totalPoints: { type: 'number' }, matrix: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));

export const testCardDevelopmentTask = defineTask('test-card-development', (args, taskCtx) => ({
  kind: 'agent', title: `Test Card Development - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Test Card Author', task: 'Develop flight test cards', context: args,
    instructions: ['1. Define test card format', '2. Write test procedures', '3. Define entry/exit criteria', '4. Define abort criteria', '5. Include safety considerations', '6. Sequence test points'],
    outputFormat: 'JSON object with test cards'
  }, outputSchema: { type: 'object', required: ['testCards'], properties: { testCards: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));

export const instrumentationPlanTask = defineTask('instrumentation-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Instrumentation Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Flight Test Instrumentation Engineer', task: 'Plan test instrumentation', context: args,
    instructions: ['1. Define parameter list', '2. Select sensors', '3. Define sample rates', '4. Plan data recording', '5. Plan telemetry', '6. Define calibration'],
    outputFormat: 'JSON object with instrumentation plan'
  }, outputSchema: { type: 'object', required: ['parameters'], properties: { parameters: { type: 'array', items: { type: 'object' } }, telemetry: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));

export const flightTestSafetyTask = defineTask('flight-test-safety', (args, taskCtx) => ({
  kind: 'agent', title: `Flight Test Safety - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Flight Test Safety Engineer', task: 'Assess flight test safety', context: args,
    instructions: ['1. Identify hazards', '2. Assess risks per test point', '3. Define mitigations', '4. Define chase requirements', '5. Define emergency procedures', '6. Document safety assessment'],
    outputFormat: 'JSON object with safety assessment'
  }, outputSchema: { type: 'object', required: ['highRiskPoints', 'overallRisk'], properties: { highRiskPoints: { type: 'number' }, overallRisk: { type: 'string' }, highRiskItems: { type: 'array', items: { type: 'object' } }, mitigations: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace', 'safety']
}));

export const buildUpApproachTask = defineTask('build-up-approach', (args, taskCtx) => ({
  kind: 'agent', title: `Build-Up Approach - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Flight Test Build-Up Engineer', task: 'Define build-up approach', context: args,
    instructions: ['1. Define envelope expansion', '2. Define incremental steps', '3. Define go/no-go criteria', '4. Define data review gates', '5. Document build-up sequence'],
    outputFormat: 'JSON object with build-up approach'
  }, outputSchema: { type: 'object', required: ['buildUpSequence'], properties: { buildUpSequence: { type: 'array', items: { type: 'object' } }, gates: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));

export const crewBriefingTask = defineTask('crew-briefing', (args, taskCtx) => ({
  kind: 'agent', title: `Crew Briefing - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Flight Test Crew Briefing Engineer', task: 'Develop crew briefing materials', context: args,
    instructions: ['1. Define mission objectives', '2. Document test sequences', '3. Define emergency procedures', '4. Define crew coordination', '5. Create briefing package'],
    outputFormat: 'JSON object with crew briefing'
  }, outputSchema: { type: 'object', required: ['briefingPackage'], properties: { briefingPackage: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));

export const testPlanTask = defineTask('test-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Test Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Flight Test Plan Author', task: 'Compile flight test plan', context: args,
    instructions: ['1. Compile test plan document', '2. Include all appendices', '3. Include safety assessment', '4. Include instrumentation', '5. Include schedule'],
    outputFormat: 'JSON object with test plan'
  }, outputSchema: { type: 'object', required: ['testPlan'], properties: { testPlan: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));

export const flightTestReportTask = defineTask('flight-test-report', (args, taskCtx) => ({
  kind: 'agent', title: `Flight Test Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Flight Test Report Author', task: 'Generate flight test plan report', context: args,
    instructions: ['1. Create executive summary', '2. Document test matrix', '3. Present test cards', '4. Document safety assessment', '5. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['flight-test', 'aerospace']
}));
