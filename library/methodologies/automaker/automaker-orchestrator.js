/**
 * @process methodologies/automaker/automaker-orchestrator
 * @description AutoMaker - Full lifecycle autonomous AI development studio: feature intake, agent assignment, execution in worktrees, review, and ship
 * @inputs { projectName: string, features: array, repoUrl?: string, baseBranch?: string, maxConcurrentAgents?: number, testFramework?: string, reviewPolicy?: string }
 * @outputs { success: boolean, featuresCompleted: array, featuresFailed: array, mergedBranches: array, deploymentResult: object, metrics: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * AutoMaker - Full Lifecycle Orchestrator
 *
 * Adapted from AutoMaker (https://github.com/AutoMaker-Org/automaker)
 * An autonomous AI development studio that transforms software building:
 * describe features on a Kanban board and AI agents implement them using
 * Claude Agent SDK with git worktree isolation.
 *
 * Workflow:
 * 1. Feature Intake - Add features (text, images, screenshots) to Kanban board
 * 2. Agent Dispatch - Move to "In Progress", AI agent assigned automatically
 * 3. Execution - Watch real-time progress as agent writes code, runs tests
 * 4. Review - Code review and quality gates before merge
 * 5. Ship - Merge approved changes, deploy
 *
 * Agents:
 * - Feature Planner - Decomposes features into implementable tasks
 * - Code Generator - Implements features in isolated worktrees
 * - Test Runner - Executes Vitest/Playwright test suites
 * - Code Reviewer - Reviews code for quality, correctness, and style
 * - Worktree Manager - Manages git worktree isolation and branch lifecycle
 * - Progress Streamer - Provides real-time streaming UI updates
 * - Deployment Engineer - Handles builds, packaging, and deployment
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {Array<Object>} inputs.features - Features to implement, each with { id, title, description, priority?, attachments? }
 * @param {string} inputs.repoUrl - Repository URL (optional)
 * @param {string} inputs.baseBranch - Base branch to create worktrees from (default: 'main')
 * @param {number} inputs.maxConcurrentAgents - Max parallel agents (default: 3)
 * @param {string} inputs.testFramework - Test framework: 'vitest', 'playwright', 'both' (default: 'both')
 * @param {string} inputs.reviewPolicy - Review policy: 'auto', 'manual', 'hybrid' (default: 'hybrid')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Complete development lifecycle results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    features = [],
    repoUrl = null,
    baseBranch = 'main',
    maxConcurrentAgents = 3,
    testFramework = 'both',
    reviewPolicy = 'hybrid'
  } = inputs;

  ctx.log(`AutoMaker orchestrator starting for "${projectName}" with ${features.length} features`);

  const results = {
    projectName,
    featuresCompleted: [],
    featuresFailed: [],
    mergedBranches: [],
    kanbanState: {},
    metrics: { startedAt: ctx.now() }
  };

  // ============================================================================
  // PHASE 1: KANBAN INITIALIZATION & FEATURE INTAKE
  // ============================================================================

  ctx.log('Phase 1: Initializing Kanban board and processing feature intake');

  const kanbanResult = await ctx.task(initializeKanbanTask, {
    projectName,
    features,
    baseBranch
  });

  results.kanbanState = kanbanResult.board;

  // ============================================================================
  // PHASE 2: FEATURE DECOMPOSITION & PLANNING
  // ============================================================================

  ctx.log('Phase 2: Decomposing features into implementable plans');

  const featurePlans = await ctx.parallel.map(features, async (feature) => {
    return await ctx.task(decomposeFeatureTask, {
      projectName,
      feature,
      baseBranch,
      testFramework
    });
  });

  await ctx.breakpoint({
    question: `Review feature plans for "${projectName}". ${featurePlans.length} features decomposed into implementation plans. Each plan includes task breakdown, estimated complexity, and test strategy. Approve to begin agent execution?`,
    title: 'AutoMaker: Feature Plans Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/automaker/plans/feature-plans-summary.md', format: 'markdown', label: 'Feature Plans Summary' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: AGENT EXECUTION (Batched by maxConcurrentAgents)
  // ============================================================================

  ctx.log(`Phase 3: Dispatching agents (max ${maxConcurrentAgents} concurrent)`);

  const batches = [];
  for (let i = 0; i < featurePlans.length; i += maxConcurrentAgents) {
    batches.push(featurePlans.slice(i, i + maxConcurrentAgents));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    ctx.log(`Executing batch ${batchIdx + 1}/${batches.length} with ${batch.length} features`);

    // Set up worktrees for all features in batch
    const worktreeResults = await ctx.parallel.map(batch, async (plan) => {
      return await ctx.task(setupWorktreeTask, {
        projectName,
        featureId: plan.featureId,
        featureTitle: plan.featureTitle,
        baseBranch
      });
    });

    // Execute code generation in parallel worktrees
    const executionResults = await ctx.parallel.map(batch, async (plan, idx) => {
      return await ctx.task(executeFeatureTask, {
        projectName,
        plan,
        worktree: worktreeResults[idx],
        testFramework
      });
    });

    // Run tests for all features in batch
    const testResults = await ctx.parallel.map(executionResults, async (execResult) => {
      return await ctx.task(runTestsTask, {
        projectName,
        featureId: execResult.featureId,
        worktreePath: execResult.worktreePath,
        testFramework,
        changedFiles: execResult.changedFiles
      });
    });

    // Process results for this batch
    for (let idx = 0; idx < batch.length; idx++) {
      const execResult = executionResults[idx];
      const testResult = testResults[idx];

      if (testResult.allPassed) {
        results.featuresCompleted.push({
          featureId: execResult.featureId,
          featureTitle: execResult.featureTitle,
          branch: execResult.branch,
          filesChanged: execResult.changedFiles?.length || 0,
          testsRun: testResult.totalTests,
          testsPassed: testResult.passed
        });
      } else {
        // Convergence loop: retry failed features up to 3 times
        let converged = false;
        for (let retry = 0; retry < 3 && !converged; retry++) {
          ctx.log(`Retry ${retry + 1}/3 for feature "${execResult.featureTitle}" - fixing test failures`);

          const fixResult = await ctx.task(fixTestFailuresTask, {
            projectName,
            featureId: execResult.featureId,
            worktreePath: execResult.worktreePath,
            testFailures: testResult.failures,
            attempt: retry + 1
          });

          const retestResult = await ctx.task(runTestsTask, {
            projectName,
            featureId: execResult.featureId,
            worktreePath: execResult.worktreePath,
            testFramework,
            changedFiles: fixResult.changedFiles
          });

          if (retestResult.allPassed) {
            converged = true;
            results.featuresCompleted.push({
              featureId: execResult.featureId,
              featureTitle: execResult.featureTitle,
              branch: execResult.branch,
              filesChanged: fixResult.changedFiles?.length || 0,
              testsRun: retestResult.totalTests,
              testsPassed: retestResult.passed,
              retries: retry + 1
            });
          }
        }

        if (!converged) {
          results.featuresFailed.push({
            featureId: execResult.featureId,
            featureTitle: execResult.featureTitle,
            reason: 'Tests failed after 3 retries',
            lastFailures: testResult.failures
          });
        }
      }
    }

    // Stream progress update after each batch
    await ctx.task(streamProgressTask, {
      projectName,
      batchNumber: batchIdx + 1,
      totalBatches: batches.length,
      completed: results.featuresCompleted.length,
      failed: results.featuresFailed.length,
      remaining: features.length - results.featuresCompleted.length - results.featuresFailed.length
    });
  }

  // ============================================================================
  // PHASE 4: CODE REVIEW & MERGE
  // ============================================================================

  ctx.log('Phase 4: Code review and merge');

  const reviewResults = await ctx.parallel.map(results.featuresCompleted, async (feature) => {
    return await ctx.task(codeReviewTask, {
      projectName,
      featureId: feature.featureId,
      featureTitle: feature.featureTitle,
      branch: feature.branch,
      reviewPolicy
    });
  });

  if (reviewPolicy !== 'auto') {
    await ctx.breakpoint({
      question: `Code reviews complete for "${projectName}". ${reviewResults.filter(r => r.approved).length}/${reviewResults.length} features approved. ${reviewResults.filter(r => !r.approved).length} need attention. Review results and approve merge?`,
      title: 'AutoMaker: Code Review Gate',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/automaker/reviews/review-summary.md', format: 'markdown', label: 'Review Summary' }
        ]
      }
    });
  }

  // Merge approved features
  const approvedFeatures = reviewResults.filter(r => r.approved);
  const mergeResults = [];

  for (const review of approvedFeatures) {
    const mergeResult = await ctx.task(mergeFeatureTask, {
      projectName,
      featureId: review.featureId,
      branch: review.branch,
      baseBranch
    });
    mergeResults.push(mergeResult);
    results.mergedBranches.push(mergeResult.branch);
  }

  // ============================================================================
  // PHASE 5: DEPLOYMENT
  // ============================================================================

  ctx.log('Phase 5: Build and deployment');

  const deploymentResult = await ctx.task(deployTask, {
    projectName,
    mergedFeatures: approvedFeatures.map(r => r.featureId),
    baseBranch
  });

  await ctx.breakpoint({
    question: `AutoMaker process complete for "${projectName}". ${results.featuresCompleted.length} features implemented, ${results.mergedBranches.length} branches merged, ${results.featuresFailed.length} failures. Deployment status: ${deploymentResult.status}. Approve final results?`,
    title: 'AutoMaker: Process Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/automaker/final-report.md', format: 'markdown', label: 'Final Report' },
        { path: 'artifacts/automaker/deployment/deploy-log.md', format: 'markdown', label: 'Deployment Log' }
      ]
    }
  });

  // Cleanup worktrees
  await ctx.task(cleanupWorktreesTask, {
    projectName,
    mergedBranches: results.mergedBranches,
    failedFeatures: results.featuresFailed.map(f => f.featureId)
  });

  results.metrics.completedAt = ctx.now();
  results.deploymentResult = deploymentResult;

  return {
    success: results.featuresFailed.length === 0,
    ...results,
    metadata: {
      processId: 'methodologies/automaker/automaker-orchestrator',
      timestamp: ctx.now(),
      framework: 'AutoMaker',
      source: 'https://github.com/AutoMaker-Org/automaker'
    }
  };
}

// ============================================================================
// KANBAN & INTAKE TASKS
// ============================================================================

export const initializeKanbanTask = defineTask('automaker-init-kanban', (args, taskCtx) => ({
  kind: 'agent',
  title: `Initialize Kanban: ${args.projectName}`,
  description: 'Set up Kanban board with feature columns and initial card placement',
  agent: {
    name: 'automaker-kanban-manager',
    prompt: {
      role: 'Kanban board manager responsible for organizing features into a structured workflow board with columns: Backlog, Ready, In Progress, Review, Done.',
      task: 'Initialize the Kanban board with provided features and establish workflow rules',
      context: {
        projectName: args.projectName,
        features: args.features,
        baseBranch: args.baseBranch
      },
      instructions: [
        'Create Kanban board with columns: Backlog, Ready, In Progress, Review, Done',
        'Place each feature as a card in the Backlog column',
        'Assign priority scores based on feature metadata',
        'Establish WIP limits per column',
        'Generate board state snapshot'
      ],
      outputFormat: 'JSON with board state, columns, cards, and WIP limits'
    }
  },
  labels: ['automaker', 'kanban', 'intake'],
  io: {
    inputs: { projectName: args.projectName, featureCount: args.features.length },
    outputs: 'Kanban board state with feature cards'
  }
}), {
  labels: ['automaker', 'kanban']
});

// ============================================================================
// FEATURE DECOMPOSITION TASKS
// ============================================================================

export const decomposeFeatureTask = defineTask('automaker-decompose-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decompose Feature: ${args.feature.title}`,
  description: 'Feature Planner decomposes a feature into implementable tasks with test strategy',
  agent: {
    name: 'automaker-feature-planner',
    prompt: {
      role: 'Feature Planner agent specializing in breaking down features into atomic, implementable tasks with clear acceptance criteria and test strategies.',
      task: `Decompose feature "${args.feature.title}" into an implementation plan`,
      context: {
        projectName: args.projectName,
        feature: args.feature,
        baseBranch: args.baseBranch,
        testFramework: args.testFramework
      },
      instructions: [
        'Analyze the feature description and any attachments',
        'Break down into atomic implementation tasks',
        'Define acceptance criteria for each task',
        'Specify test strategy (unit tests with Vitest, E2E tests with Playwright)',
        'Estimate complexity (small/medium/large)',
        'Identify dependencies between tasks',
        'Define the branch naming convention for this feature',
        'List files expected to be created or modified'
      ],
      outputFormat: 'JSON with featureId, featureTitle, tasks, testStrategy, complexity, branchName, expectedFiles'
    }
  },
  labels: ['automaker', 'planning', 'decomposition'],
  io: {
    inputs: { feature: args.feature.title, testFramework: args.testFramework },
    outputs: 'Implementation plan with task breakdown and test strategy'
  }
}), {
  labels: ['automaker', 'planning']
});

// ============================================================================
// WORKTREE TASKS
// ============================================================================

export const setupWorktreeTask = defineTask('automaker-setup-worktree', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Worktree: ${args.featureTitle}`,
  description: 'Worktree Manager creates isolated git worktree for feature development',
  agent: {
    name: 'automaker-worktree-manager',
    prompt: {
      role: 'Worktree Manager agent responsible for git worktree lifecycle: creation, isolation, branch management, and cleanup.',
      task: `Create an isolated git worktree for feature "${args.featureTitle}"`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        featureTitle: args.featureTitle,
        baseBranch: args.baseBranch
      },
      instructions: [
        `Create a new git worktree from ${args.baseBranch}`,
        `Name the branch: feature/${args.featureId}`,
        'Verify worktree isolation is complete',
        'Ensure dependencies are installed in the worktree',
        'Return the worktree path and branch name'
      ],
      outputFormat: 'JSON with worktreePath, branchName, isolationVerified'
    }
  },
  labels: ['automaker', 'worktree', 'isolation'],
  io: {
    inputs: { featureId: args.featureId, baseBranch: args.baseBranch },
    outputs: 'Worktree path and branch metadata'
  }
}), {
  labels: ['automaker', 'worktree']
});

export const cleanupWorktreesTask = defineTask('automaker-cleanup-worktrees', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cleanup Worktrees: ${args.projectName}`,
  description: 'Worktree Manager cleans up all worktrees after processing',
  agent: {
    name: 'automaker-worktree-manager',
    prompt: {
      role: 'Worktree Manager responsible for cleaning up git worktrees after feature completion.',
      task: 'Clean up all worktrees created during the AutoMaker session',
      context: {
        projectName: args.projectName,
        mergedBranches: args.mergedBranches,
        failedFeatures: args.failedFeatures
      },
      instructions: [
        'Remove worktrees for merged branches',
        'Preserve worktrees for failed features for debugging',
        'Prune stale worktree references',
        'Report cleanup summary'
      ],
      outputFormat: 'JSON with cleaned, preserved, and pruned counts'
    }
  },
  labels: ['automaker', 'worktree', 'cleanup'],
  io: {
    inputs: { mergedCount: args.mergedBranches.length, failedCount: args.failedFeatures.length },
    outputs: 'Cleanup summary'
  }
}), {
  labels: ['automaker', 'worktree']
});

// ============================================================================
// EXECUTION TASKS
// ============================================================================

export const executeFeatureTask = defineTask('automaker-execute-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement: ${args.plan.featureTitle}`,
  description: 'Code Generator implements feature in isolated worktree following the plan',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent that implements features by writing production code and tests. Works within isolated git worktrees for safety.',
      task: `Implement feature "${args.plan.featureTitle}" following the approved plan`,
      context: {
        projectName: args.projectName,
        plan: args.plan,
        worktree: args.worktree,
        testFramework: args.testFramework
      },
      instructions: [
        'Navigate to the worktree path',
        'Implement each task from the plan in order',
        'Write unit tests (Vitest) alongside implementation',
        'Write E2E tests (Playwright) for user-facing features',
        'Commit changes with descriptive messages',
        'Stream progress updates after each task completion',
        'Ensure code follows project conventions',
        'Handle errors gracefully and report blockers'
      ],
      outputFormat: 'JSON with featureId, featureTitle, worktreePath, branch, changedFiles, commits, status'
    }
  },
  labels: ['automaker', 'execution', 'code-generation'],
  io: {
    inputs: { feature: args.plan.featureTitle, taskCount: args.plan.tasks?.length || 0 },
    outputs: 'Implementation result with changed files and commits'
  }
}), {
  labels: ['automaker', 'execution']
});

export const fixTestFailuresTask = defineTask('automaker-fix-test-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix Tests: Feature ${args.featureId} (attempt ${args.attempt})`,
  description: 'Code Generator fixes test failures in convergence loop',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent fixing test failures. Analyzes failure output and applies targeted fixes.',
      task: `Fix test failures for feature ${args.featureId}, attempt ${args.attempt}/3`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        worktreePath: args.worktreePath,
        testFailures: args.testFailures,
        attempt: args.attempt
      },
      instructions: [
        'Analyze each test failure message and stack trace',
        'Identify root cause of failures',
        'Apply minimal, targeted fixes to resolve failures',
        'Avoid changing test expectations unless tests are incorrect',
        'Commit fixes with descriptive messages',
        'Report which failures were addressed'
      ],
      outputFormat: 'JSON with changedFiles, fixesApplied, remainingIssues'
    }
  },
  labels: ['automaker', 'execution', 'fix', 'convergence'],
  io: {
    inputs: { featureId: args.featureId, failureCount: args.testFailures?.length || 0, attempt: args.attempt },
    outputs: 'Fix result with changed files'
  }
}), {
  labels: ['automaker', 'convergence']
});

// ============================================================================
// TEST TASKS
// ============================================================================

export const runTestsTask = defineTask('automaker-run-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test: Feature ${args.featureId}`,
  description: 'Test Runner executes Vitest and Playwright test suites',
  agent: {
    name: 'automaker-test-runner',
    prompt: {
      role: 'Test Runner agent that executes automated test suites (Vitest for unit tests, Playwright for E2E) and reports results.',
      task: `Run tests for feature ${args.featureId}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        worktreePath: args.worktreePath,
        testFramework: args.testFramework,
        changedFiles: args.changedFiles
      },
      instructions: [
        'Navigate to the worktree path',
        args.testFramework === 'vitest' || args.testFramework === 'both'
          ? 'Run Vitest unit tests: npm run test'
          : 'Skip unit tests (not configured)',
        args.testFramework === 'playwright' || args.testFramework === 'both'
          ? 'Run Playwright E2E tests: npm run test:e2e'
          : 'Skip E2E tests (not configured)',
        'Collect test results, coverage metrics, and failure details',
        'Categorize failures: flaky vs deterministic',
        'Report pass/fail counts and failure messages'
      ],
      outputFormat: 'JSON with allPassed, totalTests, passed, failed, failures, coverage'
    }
  },
  labels: ['automaker', 'testing', args.testFramework],
  io: {
    inputs: { featureId: args.featureId, testFramework: args.testFramework },
    outputs: 'Test results with pass/fail counts and coverage'
  }
}), {
  labels: ['automaker', 'testing']
});

// ============================================================================
// STREAMING PROGRESS TASKS
// ============================================================================

export const streamProgressTask = defineTask('automaker-stream-progress', (args, taskCtx) => ({
  kind: 'agent',
  title: `Progress Update: Batch ${args.batchNumber}/${args.totalBatches}`,
  description: 'Progress Streamer sends real-time UI update on batch completion',
  agent: {
    name: 'automaker-progress-streamer',
    prompt: {
      role: 'Progress Streamer agent that provides real-time updates on development progress.',
      task: `Generate progress update for batch ${args.batchNumber} completion`,
      context: {
        projectName: args.projectName,
        batchNumber: args.batchNumber,
        totalBatches: args.totalBatches,
        completed: args.completed,
        failed: args.failed,
        remaining: args.remaining
      },
      instructions: [
        'Generate a progress summary for the completed batch',
        'Calculate overall completion percentage',
        'Highlight any failures that need attention',
        'Estimate remaining time based on batch duration',
        'Format for streaming UI display'
      ],
      outputFormat: 'JSON with progressPercent, summary, highlights, estimatedRemaining'
    }
  },
  labels: ['automaker', 'streaming', 'progress'],
  io: {
    inputs: { batch: `${args.batchNumber}/${args.totalBatches}`, completed: args.completed },
    outputs: 'Progress update for streaming UI'
  }
}), {
  labels: ['automaker', 'streaming']
});

// ============================================================================
// REVIEW TASKS
// ============================================================================

export const codeReviewTask = defineTask('automaker-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review: ${args.featureTitle}`,
  description: 'Code Reviewer performs quality review on feature branch',
  agent: {
    name: 'automaker-code-reviewer',
    prompt: {
      role: 'Code Reviewer agent that reviews code changes for quality, correctness, security, and adherence to project conventions.',
      task: `Review code changes for feature "${args.featureTitle}" on branch ${args.branch}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        featureTitle: args.featureTitle,
        branch: args.branch,
        reviewPolicy: args.reviewPolicy
      },
      instructions: [
        'Review all changed files in the feature branch',
        'Check for correctness and logic errors',
        'Verify test coverage is adequate',
        'Check for security vulnerabilities',
        'Ensure code style consistency',
        'Verify no unintended side effects',
        'Check for performance issues',
        'Provide actionable feedback with line references',
        'Make approve/request-changes decision'
      ],
      outputFormat: 'JSON with approved, featureId, branch, comments, severity, overallRating'
    }
  },
  labels: ['automaker', 'review', 'quality-gate'],
  io: {
    inputs: { feature: args.featureTitle, branch: args.branch, policy: args.reviewPolicy },
    outputs: 'Review result with approval decision and comments'
  }
}), {
  labels: ['automaker', 'review']
});

// ============================================================================
// MERGE TASKS
// ============================================================================

export const mergeFeatureTask = defineTask('automaker-merge-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Merge: Feature ${args.featureId}`,
  description: 'Worktree Manager merges approved feature branch into base',
  agent: {
    name: 'automaker-worktree-manager',
    prompt: {
      role: 'Worktree Manager handling branch merges after code review approval.',
      task: `Merge feature branch for ${args.featureId} into ${args.baseBranch}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        branch: args.branch,
        baseBranch: args.baseBranch
      },
      instructions: [
        `Checkout ${args.baseBranch} and pull latest`,
        `Merge ${args.branch} with --no-ff for clear history`,
        'Resolve any merge conflicts',
        'Run a quick smoke test after merge',
        'Push merged changes',
        'Report merge status'
      ],
      outputFormat: 'JSON with merged, branch, mergeCommit, conflictsResolved'
    }
  },
  labels: ['automaker', 'merge', 'git'],
  io: {
    inputs: { featureId: args.featureId, branch: args.branch, baseBranch: args.baseBranch },
    outputs: 'Merge result with commit hash'
  }
}), {
  labels: ['automaker', 'merge']
});

// ============================================================================
// DEPLOYMENT TASKS
// ============================================================================

export const deployTask = defineTask('automaker-deploy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy: ${args.projectName}`,
  description: 'Deployment Engineer builds and deploys the project',
  agent: {
    name: 'automaker-deployment-engineer',
    prompt: {
      role: 'Deployment Engineer agent handling build, packaging, and deployment pipelines.',
      task: `Build and deploy ${args.projectName} with merged features`,
      context: {
        projectName: args.projectName,
        mergedFeatures: args.mergedFeatures,
        baseBranch: args.baseBranch
      },
      instructions: [
        'Run the full build pipeline (npm run build)',
        'Execute final integration test suite',
        'Package the application for deployment',
        'Deploy to target environment',
        'Verify deployment health',
        'Generate deployment report with release notes'
      ],
      outputFormat: 'JSON with status, buildLog, deployUrl, releaseNotes, healthCheck'
    }
  },
  labels: ['automaker', 'deployment', 'shipping'],
  io: {
    inputs: { projectName: args.projectName, featureCount: args.mergedFeatures.length },
    outputs: 'Deployment result with status and URL'
  }
}), {
  labels: ['automaker', 'deployment']
});
