/**
 * @process methodologies/automaker/automaker-agent-execution
 * @description AutoMaker Agent Execution - Worktree setup, code generation, test running, and real-time streaming
 * @inputs { projectName: string, featurePlan: object, baseBranch?: string, testFramework?: string, maxRetries?: number, streamUpdates?: boolean }
 * @outputs { success: boolean, featureId: string, branch: string, changedFiles: array, testResults: object, streamLog: array, metrics: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * AutoMaker Agent Execution
 *
 * Adapted from AutoMaker (https://github.com/AutoMaker-Org/automaker)
 * Handles the core execution loop for a single feature: sets up an isolated
 * git worktree, generates code, runs tests, and streams real-time progress.
 *
 * Execution flow:
 * 1. Worktree Setup - Create isolated branch and worktree
 * 2. Code Generation - Implement tasks from the feature plan
 * 3. Test Execution - Run Vitest and Playwright suites
 * 4. Convergence Loop - Fix failures and re-test (up to maxRetries)
 * 5. Streaming - Real-time progress updates throughout
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {Object} inputs.featurePlan - Feature plan from decomposition
 * @param {string} inputs.baseBranch - Base branch (default: 'main')
 * @param {string} inputs.testFramework - Test framework (default: 'both')
 * @param {number} inputs.maxRetries - Max convergence retries (default: 3)
 * @param {boolean} inputs.streamUpdates - Enable streaming updates (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Execution results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featurePlan,
    baseBranch = 'main',
    testFramework = 'both',
    maxRetries = 3,
    streamUpdates = true
  } = inputs;

  const featureId = featurePlan.featureId;
  const featureTitle = featurePlan.featureTitle;

  ctx.log(`Agent execution starting for feature "${featureTitle}" (${featureId})`);

  const streamLog = [];

  const emitProgress = async (stage, message, data) => {
    if (streamUpdates) {
      const update = { stage, message, data, timestamp: ctx.now() };
      streamLog.push(update);
      await ctx.task(emitStreamEventTask, {
        projectName,
        featureId,
        event: update
      });
    }
  };

  // ============================================================================
  // STAGE 1: WORKTREE SETUP
  // ============================================================================

  ctx.log('Stage 1: Setting up isolated worktree');
  await emitProgress('worktree', 'Creating isolated worktree', { featureId });

  const worktree = await ctx.task(createWorktreeTask, {
    projectName,
    featureId,
    featureTitle,
    baseBranch
  });

  await emitProgress('worktree', 'Worktree ready', { path: worktree.worktreePath, branch: worktree.branchName });

  // ============================================================================
  // STAGE 2: ENVIRONMENT PREPARATION
  // ============================================================================

  ctx.log('Stage 2: Preparing development environment');
  await emitProgress('environment', 'Installing dependencies', { worktreePath: worktree.worktreePath });

  const envResult = await ctx.task(prepareEnvironmentTask, {
    projectName,
    worktreePath: worktree.worktreePath,
    featurePlan
  });

  // ============================================================================
  // STAGE 3: CODE GENERATION (Task by Task)
  // ============================================================================

  ctx.log(`Stage 3: Implementing ${featurePlan.tasks?.length || 0} tasks`);

  const taskResults = [];
  const tasks = featurePlan.tasks || [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    await emitProgress('implementation', `Implementing task ${i + 1}/${tasks.length}: ${task.title || task.id}`, { taskIndex: i });

    const implResult = await ctx.task(implementTaskTask, {
      projectName,
      featureId,
      worktreePath: worktree.worktreePath,
      task,
      taskIndex: i,
      totalTasks: tasks.length,
      previousResults: taskResults
    });

    taskResults.push(implResult);

    await emitProgress('implementation', `Task ${i + 1} complete: ${implResult.filesChanged?.length || 0} files changed`, {
      taskIndex: i,
      filesChanged: implResult.filesChanged
    });
  }

  // Commit all implementation changes
  const commitResult = await ctx.task(commitChangesTask, {
    projectName,
    featureId,
    featureTitle,
    worktreePath: worktree.worktreePath,
    taskResults
  });

  // ============================================================================
  // STAGE 4: TEST EXECUTION
  // ============================================================================

  ctx.log('Stage 4: Running test suites');
  await emitProgress('testing', 'Starting test execution', { testFramework });

  let testResults = await ctx.task(executeTestSuiteTask, {
    projectName,
    featureId,
    worktreePath: worktree.worktreePath,
    testFramework,
    changedFiles: taskResults.flatMap((r) => r.filesChanged || [])
  });

  // ============================================================================
  // STAGE 5: CONVERGENCE LOOP
  // ============================================================================

  let converged = testResults.allPassed;
  let retryCount = 0;

  while (!converged && retryCount < maxRetries) {
    retryCount++;
    ctx.log(`Convergence retry ${retryCount}/${maxRetries}: fixing ${testResults.failures?.length || 0} test failures`);
    await emitProgress('convergence', `Retry ${retryCount}/${maxRetries}: fixing test failures`, {
      failureCount: testResults.failures?.length || 0
    });

    // Analyze failures
    const analysisResult = await ctx.task(analyzeTestFailuresTask, {
      projectName,
      featureId,
      worktreePath: worktree.worktreePath,
      testResults,
      attempt: retryCount
    });

    // Apply fixes
    const fixResult = await ctx.task(applyTestFixesTask, {
      projectName,
      featureId,
      worktreePath: worktree.worktreePath,
      analysis: analysisResult,
      attempt: retryCount
    });

    await emitProgress('convergence', `Applied ${fixResult.fixesApplied?.length || 0} fixes`, {
      fixes: fixResult.fixesApplied
    });

    // Re-commit and re-test
    await ctx.task(commitChangesTask, {
      projectName,
      featureId,
      featureTitle: `${featureTitle} (fix attempt ${retryCount})`,
      worktreePath: worktree.worktreePath,
      taskResults: [fixResult]
    });

    testResults = await ctx.task(executeTestSuiteTask, {
      projectName,
      featureId,
      worktreePath: worktree.worktreePath,
      testFramework,
      changedFiles: fixResult.filesChanged || []
    });

    converged = testResults.allPassed;

    await emitProgress('convergence', converged ? 'All tests passing' : `Still ${testResults.failures?.length || 0} failures`, {
      allPassed: converged,
      attempt: retryCount
    });
  }

  if (!converged) {
    await emitProgress('failure', 'Feature failed: tests not passing after max retries', {
      retries: maxRetries,
      remainingFailures: testResults.failures
    });
  }

  // ============================================================================
  // FINAL: COLLECT RESULTS
  // ============================================================================

  const allChangedFiles = taskResults.flatMap((r) => r.filesChanged || []);

  await emitProgress('complete', converged ? 'Feature implementation complete' : 'Feature implementation failed', {
    success: converged,
    filesChanged: allChangedFiles.length,
    testsRun: testResults.totalTests,
    retries: retryCount
  });

  return {
    success: converged,
    featureId,
    featureTitle,
    branch: worktree.branchName,
    worktreePath: worktree.worktreePath,
    changedFiles: allChangedFiles,
    testResults: {
      allPassed: testResults.allPassed,
      totalTests: testResults.totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      coverage: testResults.coverage
    },
    streamLog,
    metrics: {
      tasksImplemented: taskResults.length,
      retries: retryCount,
      converged,
      filesChanged: allChangedFiles.length
    },
    metadata: {
      processId: 'methodologies/automaker/automaker-agent-execution',
      timestamp: ctx.now(),
      framework: 'AutoMaker',
      source: 'https://github.com/AutoMaker-Org/automaker'
    }
  };
}

// ============================================================================
// WORKTREE TASKS
// ============================================================================

export const createWorktreeTask = defineTask('automaker-exec-create-worktree', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Worktree: ${args.featureTitle}`,
  description: 'Create an isolated git worktree for feature implementation',
  agent: {
    name: 'automaker-worktree-manager',
    prompt: {
      role: 'Worktree Manager agent creating isolated git worktrees for safe parallel development.',
      task: `Create worktree for feature "${args.featureTitle}"`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        baseBranch: args.baseBranch
      },
      instructions: [
        `Create branch: feature/${args.featureId} from ${args.baseBranch}`,
        'Set up worktree in .worktrees/ directory',
        'Verify the worktree is properly isolated',
        'Return worktree path and branch name'
      ],
      outputFormat: 'JSON with worktreePath, branchName, isolationVerified'
    }
  },
  labels: ['automaker', 'execution', 'worktree'],
  io: {
    inputs: { featureId: args.featureId, baseBranch: args.baseBranch },
    outputs: 'Worktree path and branch name'
  }
}), {
  labels: ['automaker', 'worktree']
});

// ============================================================================
// ENVIRONMENT TASKS
// ============================================================================

export const prepareEnvironmentTask = defineTask('automaker-exec-prepare-env', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Environment: ${args.projectName}`,
  description: 'Install dependencies and prepare the worktree environment',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent preparing the development environment in the worktree.',
      task: 'Prepare the worktree environment for development',
      context: {
        projectName: args.projectName,
        worktreePath: args.worktreePath,
        featurePlan: args.featurePlan
      },
      instructions: [
        'Navigate to the worktree path',
        'Install dependencies (npm install)',
        'Verify build tools are available',
        'Check that existing tests pass before making changes',
        'Set up any feature-specific configuration'
      ],
      outputFormat: 'JSON with environmentReady, depsInstalled, existingTestsPass'
    }
  },
  labels: ['automaker', 'execution', 'environment'],
  io: {
    inputs: { worktreePath: args.worktreePath },
    outputs: 'Environment readiness status'
  }
}), {
  labels: ['automaker', 'environment']
});

// ============================================================================
// IMPLEMENTATION TASKS
// ============================================================================

export const implementTaskTask = defineTask('automaker-exec-implement-task', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Task ${args.taskIndex + 1}/${args.totalTasks}: ${args.task.title || args.task.id}`,
  description: 'Code Generator implements a single atomic task from the feature plan',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent implementing atomic tasks. Writes production code and tests within the isolated worktree.',
      task: `Implement task "${args.task.title || args.task.id}" (${args.taskIndex + 1}/${args.totalTasks})`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        worktreePath: args.worktreePath,
        task: args.task,
        taskIndex: args.taskIndex,
        totalTasks: args.totalTasks,
        previousResults: args.previousResults
      },
      instructions: [
        `Implement task: ${args.task.description || args.task.title}`,
        'Create or modify files as specified in the task plan',
        'Write unit tests for new functionality',
        'Ensure code integrates with previous task results',
        'Follow project coding conventions',
        'Keep changes minimal and focused on this task only'
      ],
      outputFormat: 'JSON with taskId, filesChanged, filesCreated, linesAdded, linesRemoved, testFilesCreated'
    }
  },
  labels: ['automaker', 'execution', 'implementation'],
  io: {
    inputs: { taskId: args.task.id, taskIndex: args.taskIndex },
    outputs: 'Implementation result with changed files'
  }
}), {
  labels: ['automaker', 'implementation']
});

export const commitChangesTask = defineTask('automaker-exec-commit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Commit: ${args.featureTitle}`,
  description: 'Commit implementation changes with descriptive message',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent committing changes with clear, descriptive commit messages.',
      task: `Commit changes for feature "${args.featureTitle}"`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        worktreePath: args.worktreePath,
        taskResults: args.taskResults
      },
      instructions: [
        'Stage all changed and new files',
        'Write a descriptive commit message following conventional commits format',
        'Include feature ID in commit message',
        'Commit changes',
        'Return commit hash'
      ],
      outputFormat: 'JSON with commitHash, message, filesCommitted'
    }
  },
  labels: ['automaker', 'execution', 'git'],
  io: {
    inputs: { featureId: args.featureId, featureTitle: args.featureTitle },
    outputs: 'Commit hash and metadata'
  }
}), {
  labels: ['automaker', 'git']
});

// ============================================================================
// TEST EXECUTION TASKS
// ============================================================================

export const executeTestSuiteTask = defineTask('automaker-exec-test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Suite: ${args.featureId}`,
  description: 'Test Runner executes full test suite in the worktree',
  agent: {
    name: 'automaker-test-runner',
    prompt: {
      role: 'Test Runner agent executing automated test suites and collecting results.',
      task: `Execute test suite for feature ${args.featureId}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        worktreePath: args.worktreePath,
        testFramework: args.testFramework,
        changedFiles: args.changedFiles
      },
      instructions: [
        'Navigate to the worktree path',
        args.testFramework !== 'playwright' ? 'Run Vitest: npx vitest run --reporter=json' : null,
        args.testFramework !== 'vitest' ? 'Run Playwright: npx playwright test --reporter=json' : null,
        'Collect pass/fail counts for each suite',
        'Extract failure messages and stack traces',
        'Measure code coverage if available',
        'Identify flaky tests (passed on retry)'
      ].filter(Boolean),
      outputFormat: 'JSON with allPassed, totalTests, passed, failed, failures[], coverage, flakyTests[]'
    }
  },
  labels: ['automaker', 'execution', 'testing'],
  io: {
    inputs: { featureId: args.featureId, testFramework: args.testFramework },
    outputs: 'Test results with pass/fail counts'
  }
}), {
  labels: ['automaker', 'testing']
});

// ============================================================================
// CONVERGENCE TASKS
// ============================================================================

export const analyzeTestFailuresTask = defineTask('automaker-exec-analyze-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Failures: ${args.featureId} (attempt ${args.attempt})`,
  description: 'Analyze test failures to determine root cause and fix strategy',
  agent: {
    name: 'automaker-test-runner',
    prompt: {
      role: 'Test Runner agent analyzing test failures to identify root causes and suggest fixes.',
      task: `Analyze test failures for feature ${args.featureId}, attempt ${args.attempt}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        worktreePath: args.worktreePath,
        testResults: args.testResults,
        attempt: args.attempt
      },
      instructions: [
        'Analyze each test failure message and stack trace',
        'Categorize failures: code bug, test bug, environment, flaky',
        'Identify the root cause for each failure',
        'Determine if the fix is in production code or test code',
        'Prioritize fixes by impact (fixing one may fix others)',
        'Generate a fix plan with specific file and line changes'
      ],
      outputFormat: 'JSON with failures[], rootCauses[], fixPlan[], estimatedFixDifficulty'
    }
  },
  labels: ['automaker', 'execution', 'convergence', 'analysis'],
  io: {
    inputs: { featureId: args.featureId, failureCount: args.testResults.failures?.length || 0 },
    outputs: 'Failure analysis with fix plan'
  }
}), {
  labels: ['automaker', 'convergence']
});

export const applyTestFixesTask = defineTask('automaker-exec-apply-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Apply Fixes: ${args.featureId} (attempt ${args.attempt})`,
  description: 'Code Generator applies fixes for test failures',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent applying targeted fixes for test failures based on analysis.',
      task: `Apply fixes for test failures, attempt ${args.attempt}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        worktreePath: args.worktreePath,
        analysis: args.analysis,
        attempt: args.attempt
      },
      instructions: [
        'Follow the fix plan from the failure analysis',
        'Apply minimal, targeted changes',
        'Fix production code bugs first, then test issues',
        'Do not change test expectations unless the test is wrong',
        'Verify each fix addresses the identified root cause',
        'Keep changes as small as possible'
      ],
      outputFormat: 'JSON with fixesApplied[], filesChanged[], linesModified'
    }
  },
  labels: ['automaker', 'execution', 'convergence', 'fix'],
  io: {
    inputs: { featureId: args.featureId, fixCount: args.analysis.fixPlan?.length || 0 },
    outputs: 'Applied fixes with changed files'
  }
}), {
  labels: ['automaker', 'convergence']
});

// ============================================================================
// STREAMING TASKS
// ============================================================================

export const emitStreamEventTask = defineTask('automaker-exec-stream-event', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stream: ${args.event.stage}`,
  description: 'Progress Streamer emits real-time event to UI',
  agent: {
    name: 'automaker-progress-streamer',
    prompt: {
      role: 'Progress Streamer agent emitting real-time progress events for UI consumption.',
      task: 'Emit progress event to streaming UI',
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        event: args.event
      },
      instructions: [
        'Format the event for streaming UI display',
        'Include timestamp and stage information',
        'Provide human-readable summary',
        'Include machine-readable data for UI rendering'
      ],
      outputFormat: 'JSON with formatted event for streaming'
    }
  },
  labels: ['automaker', 'execution', 'streaming'],
  io: {
    inputs: { stage: args.event.stage, featureId: args.featureId },
    outputs: 'Formatted stream event'
  }
}), {
  labels: ['automaker', 'streaming']
});
