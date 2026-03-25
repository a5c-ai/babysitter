/**
 * @process methodologies/superpowers/test-driven-development
 * @description Test-Driven Development - Iron Law RED-GREEN-REFACTOR: write failing test, verify fail, minimal code, verify pass, refactor
 * @inputs { task: string, testFramework?: string, maxCycles?: number, qualityThreshold?: number }
 * @outputs { success: boolean, cycles: array, totalCycles: number, allTestsPass: boolean, coverage: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentIdentifyBehaviorsTask = defineTask('tdd-identify-behaviors', async (args, ctx) => {
  return { behaviors: args };
}, {
  kind: 'agent',
  title: 'Identify Behaviors to Test',
  labels: ['superpowers', 'tdd', 'analysis'],
  io: {
    inputs: { task: 'string', existingCode: 'string' },
    outputs: { behaviors: 'array', testOrder: 'array', complexity: 'string' }
  }
});

const agentWriteFailingTestTask = defineTask('tdd-write-failing-test', async (args, ctx) => {
  return { test: args };
}, {
  kind: 'agent',
  title: 'RED: Write Failing Test',
  labels: ['superpowers', 'tdd', 'red-phase'],
  io: {
    inputs: { behavior: 'string', testFilePath: 'string', testFramework: 'string', existingTests: 'string' },
    outputs: { testCode: 'string', testName: 'string', testFilePath: 'string', runCommand: 'string' }
  }
});

const agentVerifyTestFailsTask = defineTask('tdd-verify-red', async (args, ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify Test Fails Correctly',
  labels: ['superpowers', 'tdd', 'red-verification'],
  io: {
    inputs: { runCommand: 'string', testName: 'string', expectedFailureReason: 'string' },
    outputs: { failed: 'boolean', failureMessage: 'string', failedForRightReason: 'boolean', output: 'string' }
  }
});

const agentWriteMinimalCodeTask = defineTask('tdd-write-minimal-code', async (args, ctx) => {
  return { code: args };
}, {
  kind: 'agent',
  title: 'GREEN: Write Minimal Code to Pass',
  labels: ['superpowers', 'tdd', 'green-phase'],
  io: {
    inputs: { behavior: 'string', testCode: 'string', failureMessage: 'string' },
    outputs: { productionCode: 'string', filePath: 'string', isMinimal: 'boolean' }
  }
});

const agentVerifyTestPassesTask = defineTask('tdd-verify-green', async (args, ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify All Tests Pass',
  labels: ['superpowers', 'tdd', 'green-verification'],
  io: {
    inputs: { runCommand: 'string', fullSuiteCommand: 'string' },
    outputs: { targetPasses: 'boolean', allPass: 'boolean', output: 'string', failureCount: 'number' }
  }
});

const agentRefactorTask = defineTask('tdd-refactor', async (args, ctx) => {
  return { refactored: args };
}, {
  kind: 'agent',
  title: 'REFACTOR: Clean Up While Green',
  labels: ['superpowers', 'tdd', 'refactor-phase'],
  io: {
    inputs: { productionCode: 'string', testCode: 'string', cycleNumber: 'number' },
    outputs: { refactored: 'boolean', changes: 'array', stillGreen: 'boolean' }
  }
});

const agentCommitCycleTask = defineTask('tdd-commit-cycle', async (args, ctx) => {
  return { committed: args };
}, {
  kind: 'agent',
  title: 'Commit TDD Cycle',
  labels: ['superpowers', 'tdd', 'commit'],
  io: {
    inputs: { behavior: 'string', filesChanged: 'array', cycleNumber: 'number' },
    outputs: { committed: 'boolean', commitSha: 'string' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Test-Driven Development Process
 *
 * Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
 * Write code before the test? Delete it. Start over.
 *
 * RED-GREEN-REFACTOR cycle per behavior:
 * 1. RED: Write one failing test showing desired behavior
 * 2. Verify RED: Run test, confirm it fails for the right reason
 * 3. GREEN: Write simplest code to make test pass (YAGNI)
 * 4. Verify GREEN: Run test + full suite, all must pass
 * 5. REFACTOR: Clean up while keeping tests green
 * 6. COMMIT: Frequent small commits
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Feature or bugfix to implement via TDD
 * @param {string} inputs.testFramework - Test framework (default: 'vitest')
 * @param {number} inputs.maxCycles - Maximum RED-GREEN-REFACTOR cycles (default: 20)
 * @param {number} inputs.qualityThreshold - Quality threshold (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} TDD cycle results with coverage
 */
export async function process(inputs, ctx) {
  const {
    task,
    testFramework = 'vitest',
    maxCycles = 20,
    qualityThreshold = 80
  } = inputs;

  ctx.log('Starting Test-Driven Development', { task, testFramework });
  ctx.log('IRON LAW: No production code without a failing test first.');

  // ============================================================================
  // STEP 1: IDENTIFY BEHAVIORS TO TEST
  // ============================================================================

  const behaviorsResult = await ctx.task(agentIdentifyBehaviorsTask, {
    task,
    existingCode: ''
  });

  const behaviors = behaviorsResult.behaviors || [];
  ctx.log('Identified behaviors to implement', { count: behaviors.length });

  // ============================================================================
  // STEP 2: RED-GREEN-REFACTOR CYCLES
  // ============================================================================

  const cycles = [];

  for (let i = 0; i < Math.min(behaviors.length, maxCycles); i++) {
    const behavior = behaviors[i];
    ctx.log(`Cycle ${i + 1}/${behaviors.length}: ${behavior}`);

    // --- RED: Write Failing Test ---
    const testResult = await ctx.task(agentWriteFailingTestTask, {
      behavior,
      testFilePath: '',
      testFramework,
      existingTests: cycles.map(c => c.testName).join(', ')
    });

    // --- VERIFY RED: Must fail for the right reason ---
    let redVerified = false;
    let redAttempts = 0;

    while (!redVerified && redAttempts < 3) {
      redAttempts++;
      const redVerification = await ctx.task(agentVerifyTestFailsTask, {
        runCommand: testResult.runCommand,
        testName: testResult.testName,
        expectedFailureReason: 'feature not implemented'
      });

      if (redVerification.failed && redVerification.failedForRightReason) {
        redVerified = true;
        ctx.log('RED verified: test fails correctly', { testName: testResult.testName });
      } else if (!redVerification.failed) {
        // Test passes immediately - testing existing behavior, fix test
        ctx.log('WARNING: Test passes immediately. Fix test to test new behavior.');
        await ctx.breakpoint({
          question: `Test "${testResult.testName}" passes immediately without new code. This means it tests existing behavior, not new behavior. The test must be rewritten.`,
          title: 'TDD Violation: Test Passes Immediately',
          context: { runId: ctx.runId }
        });
        break;
      } else {
        // Test errors (not fails) - fix error
        ctx.log('Test errors instead of failing. Fixing test setup.');
      }
    }

    if (!redVerified) {
      cycles.push({
        behavior,
        testName: testResult.testName,
        redVerified: false,
        greenVerified: false,
        refactored: false,
        skipped: true
      });
      continue;
    }

    // --- GREEN: Write Minimal Code ---
    const codeResult = await ctx.task(agentWriteMinimalCodeTask, {
      behavior,
      testCode: testResult.testCode,
      failureMessage: ''
    });

    // --- VERIFY GREEN: All tests must pass ---
    let greenVerified = false;
    let greenAttempts = 0;

    while (!greenVerified && greenAttempts < 3) {
      greenAttempts++;
      const greenVerification = await ctx.task(agentVerifyTestPassesTask, {
        runCommand: testResult.runCommand,
        fullSuiteCommand: `npx ${testFramework} run`
      });

      if (greenVerification.targetPasses && greenVerification.allPass) {
        greenVerified = true;
        ctx.log('GREEN verified: all tests pass', { testName: testResult.testName });
      } else {
        ctx.log('GREEN failed: fixing code (not test)', { attempt: greenAttempts });
        // Fix code, not test
        await ctx.task(agentWriteMinimalCodeTask, {
          behavior,
          testCode: testResult.testCode,
          failureMessage: greenVerification.output
        });
      }
    }

    // --- REFACTOR: Clean up while green ---
    let refactored = false;
    if (greenVerified) {
      const refactorResult = await ctx.task(agentRefactorTask, {
        productionCode: codeResult.productionCode,
        testCode: testResult.testCode,
        cycleNumber: i + 1
      });
      refactored = refactorResult.refactored && refactorResult.stillGreen;
    }

    // --- COMMIT ---
    const commitResult = await ctx.task(agentCommitCycleTask, {
      behavior,
      filesChanged: [testResult.testFilePath, codeResult.filePath],
      cycleNumber: i + 1
    });

    cycles.push({
      behavior,
      testName: testResult.testName,
      redVerified,
      greenVerified,
      refactored,
      committed: commitResult.committed,
      commitSha: commitResult.commitSha
    });
  }

  // ============================================================================
  // STEP 3: FINAL VERIFICATION
  // ============================================================================

  ctx.log('Running final verification: full test suite');

  const finalVerification = await ctx.task(agentVerifyTestPassesTask, {
    runCommand: `npx ${testFramework} run`,
    fullSuiteCommand: `npx ${testFramework} run`
  });

  return {
    success: finalVerification.allPass,
    task,
    cycles,
    totalCycles: cycles.length,
    allTestsPass: finalVerification.allPass,
    completedCycles: cycles.filter(c => c.greenVerified).length,
    skippedCycles: cycles.filter(c => c.skipped).length,
    coverage: {
      behaviorsIdentified: behaviors.length,
      behaviorsImplemented: cycles.filter(c => c.greenVerified).length,
      allRefactored: cycles.filter(c => c.refactored).length
    },
    metadata: {
      processId: 'methodologies/superpowers/test-driven-development',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
