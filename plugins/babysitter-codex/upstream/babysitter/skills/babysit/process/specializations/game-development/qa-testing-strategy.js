/**
 * @process specializations/game-development/qa-testing-strategy
 * @description QA Testing Strategy Process - Define and execute comprehensive quality assurance strategy including
 * functional testing, compatibility testing, regression testing, and bug tracking for game releases.
 * @inputs { projectName: string, testPhase?: string, targetPlatforms?: array, outputDir?: string }
 * @outputs { success: boolean, testPlan: object, bugReport: object, testCoverage: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/qa-testing-strategy', {
 *   projectName: 'Stellar Odyssey',
 *   testPhase: 'beta',
 *   targetPlatforms: ['PC', 'PlayStation 5', 'Xbox Series X']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    testPhase = 'alpha',
    targetPlatforms = ['PC'],
    automatedTestingRequired = true,
    outputDir = 'qa-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting QA Testing Strategy: ${projectName} - ${testPhase}`);

  // Phase 1: Test Plan Creation
  const testPlan = await ctx.task(testPlanCreationTask, { projectName, testPhase, targetPlatforms, outputDir });
  artifacts.push(...testPlan.artifacts);

  // Phase 2: Test Case Development
  const testCases = await ctx.task(testCaseDevTask, { projectName, testPlan, outputDir });
  artifacts.push(...testCases.artifacts);

  // Phase 3: Automated Testing Setup
  const automatedTesting = await ctx.task(automatedTestingSetupTask, { projectName, automatedTestingRequired, outputDir });
  artifacts.push(...automatedTesting.artifacts);

  // Phase 4: Functional Testing
  const functionalTesting = await ctx.task(functionalTestingTask, { projectName, testCases, outputDir });
  artifacts.push(...functionalTesting.artifacts);

  // Phase 5: Compatibility Testing
  const compatibilityTesting = await ctx.task(compatibilityTestingTask, { projectName, targetPlatforms, outputDir });
  artifacts.push(...compatibilityTesting.artifacts);

  // Phase 6: Bug Triage and Reporting
  const bugReporting = await ctx.task(bugTriageReportingTask, { projectName, functionalTesting, compatibilityTesting, outputDir });
  artifacts.push(...bugReporting.artifacts);

  await ctx.breakpoint({
    question: `QA testing complete for ${projectName}. Tests passed: ${functionalTesting.passRate}%. Bugs found: ${bugReporting.totalBugs}. Critical: ${bugReporting.criticalBugs}. Review report?`,
    title: 'QA Testing Review',
    context: { runId: ctx.runId, functionalTesting, bugReporting }
  });

  return {
    success: true,
    projectName,
    testPlan: testPlan.planDetails,
    bugReport: { totalBugs: bugReporting.totalBugs, criticalBugs: bugReporting.criticalBugs },
    testCoverage: functionalTesting.coverage,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/qa-testing-strategy', timestamp: startTime, outputDir }
  };
}

export const testPlanCreationTask = defineTask('test-plan-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Plan - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Lead', task: 'Create comprehensive test plan', context: args, instructions: ['1. Define test scope', '2. Identify test resources', '3. Create test schedule', '4. Define pass/fail criteria'] },
    outputSchema: { type: 'object', required: ['planDetails', 'artifacts'], properties: { planDetails: { type: 'object' }, schedule: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'qa', 'test-plan']
}));

export const testCaseDevTask = defineTask('test-case-dev', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Cases - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Develop test cases', context: args, instructions: ['1. Create functional test cases', '2. Create edge case tests', '3. Create regression tests', '4. Document expected results'] },
    outputSchema: { type: 'object', required: ['testCases', 'testCaseCount', 'artifacts'], properties: { testCases: { type: 'array' }, testCaseCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'qa', 'test-cases']
}));

export const automatedTestingSetupTask = defineTask('automated-testing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Automated Testing - ${args.projectName}`,
  agent: {
    name: 'automation-tester-agent',
    prompt: { role: 'QA Automation Engineer', task: 'Set up automated testing', context: args, instructions: ['1. Configure test framework', '2. Write automated tests', '3. Set up CI integration', '4. Create test reports'] },
    outputSchema: { type: 'object', required: ['automatedTests', 'ciIntegrated', 'artifacts'], properties: { automatedTests: { type: 'number' }, ciIntegrated: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'qa', 'automation']
}));

export const functionalTestingTask = defineTask('functional-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Functional Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Tester', task: 'Execute functional tests', context: args, instructions: ['1. Execute all test cases', '2. Document results', '3. Report bugs found', '4. Calculate pass rate'] },
    outputSchema: { type: 'object', required: ['passRate', 'coverage', 'bugsFound', 'artifacts'], properties: { passRate: { type: 'number' }, coverage: { type: 'number' }, bugsFound: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'qa', 'functional-testing']
}));

export const compatibilityTestingTask = defineTask('compatibility-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compatibility Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Tester', task: 'Test platform compatibility', context: args, instructions: ['1. Test each platform', '2. Test hardware configurations', '3. Document issues', '4. Verify performance targets'] },
    outputSchema: { type: 'object', required: ['platformResults', 'issues', 'artifacts'], properties: { platformResults: { type: 'object' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'qa', 'compatibility']
}));

export const bugTriageReportingTask = defineTask('bug-triage-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bug Reporting - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Lead', task: 'Triage and report bugs', context: args, instructions: ['1. Triage all bugs', '2. Prioritize by severity', '3. Create bug report', '4. Track resolution'] },
    outputSchema: { type: 'object', required: ['totalBugs', 'criticalBugs', 'reportPath', 'artifacts'], properties: { totalBugs: { type: 'number' }, criticalBugs: { type: 'number' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'qa', 'bug-reporting']
}));
