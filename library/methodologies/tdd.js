/**
 * @process methodologies/tdd
 * @description Test-Driven Development — classic Red/Green/Refactor loop per feature unit.
 * @inputs { project: string, feature: string, units?: Array<object>, maxIterations?: number }
 * @outputs { success: boolean, feature: string, units: Array<object>, finalState: string }
   * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:unit-testing, skill-area:integration-testing, skill-area:acceptance-testing]
 *   workflows: [workflow:feature-development]
 *   topics: [topic:test-driven-development]
 *   roles: [role:backend-engineer, role:qa-engineer, role:tech-lead]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Test-Driven Development methodology.
 *
 * For each unit of work:
 *   1. Red     — write a failing test that expresses the next small requirement.
 *   2. Green   — write the minimum code to make it pass.
 *   3. Refactor — clean up with tests still green.
 *
 * Outer loop drives the full feature by sequencing units. Stops early if a
 * unit cannot reach green within maxIterations — that is a signal to reconsider
 * the design rather than pile on more code.
 */

const writeFailingTestTask = defineTask(
  'tdd.write-failing-test',
  async ({ feature, unit, priorTests }, ctx) => {
    return ctx.agent({
      title: `Red: write failing test for "${unit.name}"`,
      prompt: [
        `Write a single failing test that captures the next small requirement for the unit.`,
        `Feature: ${feature}`,
        `Unit: ${unit.name} — ${unit.description}`,
        priorTests && priorTests.length
          ? `Existing tests in this unit: ${priorTests.map((t) => t.name).join(', ')}`
          : 'No existing tests yet for this unit.',
        `Run the test and confirm it fails for the expected reason (not a setup error).`,
        `Return JSON: { testFile, testName, failureOutput, diagnosis }.`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Write failing test',
    labels: ['tdd', 'red'],
  },
);

const makeTestPassTask = defineTask(
  'tdd.make-test-pass',
  async ({ feature, unit, testFile, testName }, ctx) => {
    return ctx.agent({
      title: `Green: make "${testName}" pass`,
      prompt: [
        `Write the minimum production code to make the failing test pass.`,
        `Do not add extra behavior, speculative abstractions, or additional tests in this step.`,
        `Feature: ${feature}`,
        `Unit: ${unit.name}`,
        `Failing test: ${testFile} :: ${testName}`,
        `Run the full test suite and confirm all tests pass (not just the new one).`,
        `Return JSON: { filesChanged: string[], testOutput, allPassing: boolean }.`,
      ].join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Make failing test pass',
    labels: ['tdd', 'green'],
  },
);

const refactorTask = defineTask(
  'tdd.refactor',
  async ({ feature, unit, filesChanged }, ctx) => {
    return ctx.agent({
      title: `Refactor "${unit.name}" with tests green`,
      prompt: [
        `Refactor for clarity and remove duplication, keeping all tests green.`,
        `Do not change behavior. Do not add new features in this step.`,
        `Feature: ${feature}`,
        `Unit: ${unit.name}`,
        `Files in scope: ${(filesChanged ?? []).join(', ')}`,
        `Run the full test suite after each change. If any test fails, revert and finish.`,
        `Return JSON: { refactors: Array<string>, testOutput, allPassing: boolean }.`,
      ].join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Refactor while green',
    labels: ['tdd', 'refactor'],
  },
);

export async function process(inputs, ctx) {
  const {
    project,
    feature,
    units = [],
    maxIterations = 3,
  } = inputs;

  const completedUnits = [];

  for (const unit of units) {
    const unitRecord = {
      name: unit.name,
      description: unit.description,
      iterations: [],
      status: 'pending',
    };

    for (let i = 0; i < maxIterations; i++) {
      const red = await ctx.task(writeFailingTestTask, {
        feature,
        unit,
        priorTests: unitRecord.iterations.flatMap((it) => it.tests ?? []),
      });

      const green = await ctx.task(makeTestPassTask, {
        feature,
        unit,
        testFile: red.testFile,
        testName: red.testName,
      });

      if (!green.allPassing) {
        unitRecord.iterations.push({
          iteration: i + 1,
          red,
          green,
          refactor: null,
          outcome: 'stuck-at-red',
        });
        unitRecord.status = 'blocked';
        break;
      }

      const refactor = await ctx.task(refactorTask, {
        feature,
        unit,
        filesChanged: green.filesChanged,
      });

      unitRecord.iterations.push({
        iteration: i + 1,
        red,
        green,
        refactor,
        outcome: refactor.allPassing ? 'green' : 'refactor-broke-tests',
      });

      if (!refactor.allPassing) {
        unitRecord.status = 'blocked';
        break;
      }

      if (red.completesUnit === true || (unit.stopCondition && unit.stopCondition(unitRecord))) {
        unitRecord.status = 'complete';
        break;
      }
    }

    if (unitRecord.status === 'pending') unitRecord.status = 'complete';
    completedUnits.push(unitRecord);

    if (unitRecord.status === 'blocked') break;
  }

  const anyBlocked = completedUnits.some((u) => u.status === 'blocked');

  return {
    success: !anyBlocked,
    feature,
    project,
    units: completedUnits,
    finalState: anyBlocked ? 'blocked' : 'all-units-green',
  };
}
