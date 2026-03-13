/**
 * @process methodologies/spec-kit/spec-kit-implementation
 * @description Spec Kit implementation workflow: task execution + quality validation + checklist. Executes development tasks against specification with progressive quality gates following GitHub's Spec-Driven Development.
 * @inputs { tasks: array, plan: object, specification: object, constitution: object, customChecks?: array }
 * @outputs { success: boolean, implementation: object, testResults: object, checklist: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const prepareEnvironmentTask = defineTask('spec-kit-impl-prepare-env', async (args, _ctx) => {
  return { environment: args };
}, {
  kind: 'agent',
  title: 'Prepare Implementation Environment',
  labels: ['spec-kit', 'implementation', 'setup'],
  io: {
    inputs: { plan: 'object', constitution: 'object', tasks: 'array' },
    outputs: { scaffolding: 'object', directories: 'array', configFiles: 'array', ready: 'boolean' }
  }
});

const executeTaskTask = defineTask('spec-kit-impl-execute-task', async (args, _ctx) => {
  return { result: args };
}, {
  kind: 'agent',
  title: 'Execute Implementation Task',
  labels: ['spec-kit', 'implementation', 'execution'],
  io: {
    inputs: { task: 'object', plan: 'object', constitution: 'object', specification: 'object', priorResults: 'array' },
    outputs: { taskId: 'string', status: 'string', artifacts: 'array', filesChanged: 'array', testsPassed: 'boolean', issues: 'array' }
  }
});

const runTaskTestsTask = defineTask('spec-kit-impl-run-tests', async (args, _ctx) => {
  return { testResults: args };
}, {
  kind: 'agent',
  title: 'Run Tests for Completed Task',
  labels: ['spec-kit', 'implementation', 'testing'],
  io: {
    inputs: { task: 'object', artifacts: 'array', constitution: 'object' },
    outputs: { passed: 'boolean', totalTests: 'number', passedTests: 'number', failedTests: 'number', coverage: 'number', failures: 'array' }
  }
});

const validateAgainstSpecTask = defineTask('spec-kit-impl-validate-spec', async (args, _ctx) => {
  return { validation: args };
}, {
  kind: 'agent',
  title: 'Validate Implementation Against Specification',
  labels: ['spec-kit', 'implementation', 'validation'],
  io: {
    inputs: { completedTasks: 'array', specification: 'object', constitution: 'object' },
    outputs: { requirementsCovered: 'number', requirementsTotal: 'number', storiesSatisfied: 'number', storiesTotal: 'number', gaps: 'array', deviations: 'array', score: 'number' }
  }
});

const runIntegrationTestsTask = defineTask('spec-kit-impl-integration-tests', async (args, _ctx) => {
  return { results: args };
}, {
  kind: 'agent',
  title: 'Run Integration Tests Across Components',
  labels: ['spec-kit', 'implementation', 'integration-testing'],
  io: {
    inputs: { artifacts: 'array', plan: 'object', specification: 'object' },
    outputs: { passed: 'boolean', totalTests: 'number', passedTests: 'number', failures: 'array', integrationIssues: 'array' }
  }
});

const runQualityChecklistTask = defineTask('spec-kit-impl-quality-checklist', async (args, _ctx) => {
  return { checklist: args };
}, {
  kind: 'agent',
  title: 'Run Quality Validation Checklist',
  labels: ['spec-kit', 'implementation', 'quality-checklist'],
  io: {
    inputs: { constitution: 'object', specification: 'object', implementation: 'object', testResults: 'object', customChecks: 'array' },
    outputs: { passed: 'boolean', score: 'number', categories: 'array', checkResults: 'array', failedItems: 'array', recommendations: 'array' }
  }
});

const remediateIssuesTask = defineTask('spec-kit-impl-remediate', async (args, _ctx) => {
  return { remediation: args };
}, {
  kind: 'agent',
  title: 'Remediate Quality Issues',
  labels: ['spec-kit', 'implementation', 'remediation'],
  io: {
    inputs: { failedItems: 'array', recommendations: 'array', plan: 'object', constitution: 'object', specification: 'object' },
    outputs: { fixedItems: 'array', artifacts: 'array', remainingIssues: 'array', fixedCount: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Spec Kit Implementation Workflow
 *
 * Implements the Implementation + Quality Validation + Checklist phases from
 * GitHub's Spec Kit. Executes development tasks with progressive quality gates,
 * spec validation, and convergence loops for remediation.
 *
 * Workflow:
 * 1. Prepare implementation environment
 * 2. Execute tasks (parallel where possible, sequential for dependencies)
 * 3. Run per-task tests
 * 4. Validate implementation against specification
 * 5. Run integration tests
 * 6. Run quality checklist
 * 7. Remediation loop if quality gate fails
 *
 * Attribution: Adapted from https://github.com/github/spec-kit
 *
 * @param {Object} inputs - Process inputs
 * @param {Array} inputs.tasks - Tasks from spec-kit-planning task decomposition
 * @param {Object} inputs.plan - Technical plan from spec-kit-planning
 * @param {Object} inputs.specification - Feature specification from spec-kit-specification
 * @param {Object} inputs.constitution - Project constitution
 * @param {Array} inputs.customChecks - Additional custom quality checks
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Implementation results with quality validation
 */
export async function process(inputs, ctx) {
  const {
    tasks,
    plan,
    specification,
    constitution,
    customChecks = []
  } = inputs;

  ctx.log('Spec Kit Implementation: Starting task execution + quality validation workflow');
  ctx.log(`Tasks to implement: ${(tasks || []).length}`);

  // ============================================================================
  // PHASE 1: ENVIRONMENT PREPARATION
  // ============================================================================

  ctx.log('Phase 1: Preparing implementation environment');

  const environment = await ctx.task(prepareEnvironmentTask, {
    plan,
    constitution,
    tasks
  });

  // ============================================================================
  // PHASE 2: TASK EXECUTION
  // ============================================================================

  ctx.log('Phase 2: Executing implementation tasks');

  const allTasks = tasks || [];
  const completedTasks = [];
  const allArtifacts = [];
  const allTestResults = [];
  const allIssues = [];

  // Group tasks by dependency level for optimal execution
  const independentTasks = allTasks.filter(t => !(t.dependencies || []).length);
  const dependentTasks = allTasks.filter(t => (t.dependencies || []).length > 0);

  // Execute independent tasks in parallel
  if (independentTasks.length > 0) {
    ctx.log(`Executing ${independentTasks.length} independent tasks in parallel`);

    const parallelResults = await ctx.parallel.all(
      independentTasks.map(task => () =>
        ctx.task(executeTaskTask, {
          task,
          plan,
          constitution,
          specification,
          priorResults: []
        })
      )
    );

    for (const result of parallelResults) {
      completedTasks.push(result);
      allArtifacts.push(...(result.artifacts || []));
      allIssues.push(...(result.issues || []));
    }

    // Run tests for independent tasks in parallel
    const testResults = await ctx.parallel.all(
      independentTasks.map((task, i) => () =>
        ctx.task(runTaskTestsTask, {
          task,
          artifacts: parallelResults[i].artifacts || [],
          constitution
        })
      )
    );

    allTestResults.push(...testResults);
  }

  // Execute dependent tasks sequentially
  for (const task of dependentTasks) {
    ctx.log(`Executing dependent task: ${task.id || task.title}`);

    const result = await ctx.task(executeTaskTask, {
      task,
      plan,
      constitution,
      specification,
      priorResults: completedTasks
    });

    completedTasks.push(result);
    allArtifacts.push(...(result.artifacts || []));
    allIssues.push(...(result.issues || []));

    const testResult = await ctx.task(runTaskTestsTask, {
      task,
      artifacts: result.artifacts || [],
      constitution
    });

    allTestResults.push(testResult);
  }

  ctx.log(`Task execution complete: ${completedTasks.length}/${allTasks.length} tasks done`);

  // ============================================================================
  // PHASE 3: SPECIFICATION VALIDATION
  // ============================================================================

  ctx.log('Phase 3: Validating implementation against specification');

  const specValidation = await ctx.task(validateAgainstSpecTask, {
    completedTasks,
    specification,
    constitution
  });

  await ctx.breakpoint({
    question: `Implementation complete: ${completedTasks.length} tasks done. Spec coverage: ${specValidation.requirementsCovered}/${specValidation.requirementsTotal} requirements, ${specValidation.storiesSatisfied}/${specValidation.storiesTotal} stories. Score: ${specValidation.score}/100. ${(specValidation.gaps || []).length} gaps found. Approve to run integration tests.`,
    title: 'Spec Kit: Implementation Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 4: INTEGRATION TESTING
  // ============================================================================

  ctx.log('Phase 4: Running integration tests');

  const integrationResults = await ctx.task(runIntegrationTestsTask, {
    artifacts: allArtifacts,
    plan,
    specification
  });

  // ============================================================================
  // PHASE 5: QUALITY CHECKLIST
  // ============================================================================

  ctx.log('Phase 5: Running quality validation checklist');

  const implementation = {
    completedTasks,
    artifacts: allArtifacts,
    issues: allIssues,
    taskTestResults: allTestResults,
    integrationResults,
    specValidation
  };

  let checklist = await ctx.task(runQualityChecklistTask, {
    constitution,
    specification,
    implementation,
    testResults: {
      unit: allTestResults,
      integration: integrationResults
    },
    customChecks
  });

  // ============================================================================
  // CONVERGENCE: Quality-Gated Remediation Loop
  // ============================================================================

  let iteration = 0;
  const maxIterations = 3;
  const qualityThreshold = 80;

  while (!checklist.passed && (checklist.score || 0) < qualityThreshold && iteration < maxIterations) {
    iteration++;
    ctx.log(`Quality gate failed (score: ${checklist.score}/${qualityThreshold}). Remediation iteration ${iteration}/${maxIterations}.`);

    await ctx.breakpoint({
      question: `Quality checklist: ${checklist.score}/100 (threshold: ${qualityThreshold}). ${(checklist.failedItems || []).length} items failed across ${(checklist.categories || []).length} categories. Approve remediation attempt ${iteration}/${maxIterations}, or skip to accept current state.`,
      title: `Spec Kit: Quality Remediation (Attempt ${iteration})`,
      context: { runId: ctx.runId }
    });

    const remediation = await ctx.task(remediateIssuesTask, {
      failedItems: checklist.failedItems || [],
      recommendations: checklist.recommendations || [],
      plan,
      constitution,
      specification
    });

    implementation.artifacts = implementation.artifacts.concat(remediation.artifacts || []);
    implementation.completedTasks = implementation.completedTasks.concat(
      (remediation.fixedItems || []).map(item => ({ ...item, isRemediation: true }))
    );

    // Re-run checklist after remediation
    checklist = await ctx.task(runQualityChecklistTask, {
      constitution,
      specification,
      implementation,
      testResults: {
        unit: allTestResults,
        integration: integrationResults
      },
      customChecks
    });

    ctx.log(`Post-remediation score: ${checklist.score}/100. Passed: ${checklist.passed}`);
  }

  if (!checklist.passed) {
    ctx.log(`Quality gate not fully passed after ${iteration} iterations. Final score: ${checklist.score}/100.`);
  }

  return {
    success: true,
    implementation: {
      completedTasks: completedTasks.length,
      totalTasks: allTasks.length,
      artifacts: allArtifacts,
      issues: allIssues
    },
    testResults: {
      unit: {
        total: allTestResults.reduce((sum, r) => sum + (r.totalTests || 0), 0),
        passed: allTestResults.reduce((sum, r) => sum + (r.passedTests || 0), 0),
        failed: allTestResults.reduce((sum, r) => sum + (r.failedTests || 0), 0)
      },
      integration: {
        passed: integrationResults.passed,
        total: integrationResults.totalTests,
        failures: integrationResults.failures
      }
    },
    specValidation,
    checklist: {
      passed: checklist.passed,
      score: checklist.score,
      categories: checklist.categories,
      failedItems: checklist.failedItems,
      recommendations: checklist.recommendations
    },
    artifacts: allArtifacts,
    metadata: {
      processId: 'methodologies/spec-kit/spec-kit-implementation',
      attribution: 'https://github.com/github/spec-kit',
      qualityScore: checklist.score,
      remediationIterations: iteration,
      specCoverage: `${specValidation.requirementsCovered}/${specValidation.requirementsTotal}`,
      timestamp: ctx.now()
    }
  };
}
