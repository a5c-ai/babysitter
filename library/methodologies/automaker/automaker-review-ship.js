/**
 * @process methodologies/automaker/automaker-review-ship
 * @description AutoMaker Review & Ship - Code review, quality gates, merge, deployment, and release
 * @inputs { projectName: string, featureBranches: array, baseBranch?: string, reviewPolicy?: string, deployTarget?: string, qualityThreshold?: number }
 * @outputs { success: boolean, reviewResults: array, mergeResults: array, deploymentResult: object, releaseNotes: string, metrics: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * AutoMaker Review & Ship
 *
 * Adapted from AutoMaker (https://github.com/AutoMaker-Org/automaker)
 * Handles the post-implementation pipeline: code review, quality gates,
 * merge orchestration, build, deployment, and release notes generation.
 *
 * Pipeline stages:
 * 1. Code Review - Automated quality review with configurable policy
 * 2. Quality Gates - Enforce thresholds for coverage, complexity, security
 * 3. Merge Orchestration - Ordered merge with conflict resolution
 * 4. Build & Deploy - Production build and deployment
 * 5. Release Notes - Automated release documentation
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {Array<Object>} inputs.featureBranches - Branches to review, each with { featureId, featureTitle, branch, changedFiles, testResults }
 * @param {string} inputs.baseBranch - Base branch for merging (default: 'main')
 * @param {string} inputs.reviewPolicy - Review policy: 'auto', 'manual', 'hybrid' (default: 'hybrid')
 * @param {string} inputs.deployTarget - Deploy target: 'production', 'staging', 'preview' (default: 'staging')
 * @param {number} inputs.qualityThreshold - Minimum quality score 0-100 (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Review and shipping results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureBranches = [],
    baseBranch = 'main',
    reviewPolicy = 'hybrid',
    deployTarget = 'staging',
    qualityThreshold = 80
  } = inputs;

  ctx.log(`AutoMaker review & ship for "${projectName}" - ${featureBranches.length} branches to process`);

  // ============================================================================
  // STAGE 1: CODE REVIEW
  // ============================================================================

  ctx.log('Stage 1: Running code reviews');

  const reviewResults = await ctx.parallel.map(featureBranches, async (featureBranch) => {
    return await ctx.task(performCodeReviewTask, {
      projectName,
      featureId: featureBranch.featureId,
      featureTitle: featureBranch.featureTitle,
      branch: featureBranch.branch,
      changedFiles: featureBranch.changedFiles,
      testResults: featureBranch.testResults,
      reviewPolicy
    });
  });

  // ============================================================================
  // STAGE 2: QUALITY GATES
  // ============================================================================

  ctx.log('Stage 2: Enforcing quality gates');

  const qualityResults = await ctx.parallel.map(reviewResults, async (review) => {
    return await ctx.task(enforceQualityGateTask, {
      projectName,
      featureId: review.featureId,
      branch: review.branch,
      review,
      qualityThreshold
    });
  });

  const passedGates = qualityResults.filter((q) => q.passed);
  const failedGates = qualityResults.filter((q) => !q.passed);

  if (failedGates.length > 0) {
    ctx.log(`Quality gate failures: ${failedGates.map((f) => f.featureId).join(', ')}`);

    // Convergence: attempt to fix quality issues
    for (const failed of failedGates) {
      ctx.log(`Attempting quality fixes for feature ${failed.featureId}`);

      const fixResult = await ctx.task(fixQualityIssuesTask, {
        projectName,
        featureId: failed.featureId,
        branch: failed.branch,
        qualityIssues: failed.issues,
        qualityThreshold
      });

      if (fixResult.resolved) {
        const recheck = await ctx.task(enforceQualityGateTask, {
          projectName,
          featureId: failed.featureId,
          branch: failed.branch,
          review: { ...reviewResults.find((r) => r.featureId === failed.featureId), qualityFixes: fixResult },
          qualityThreshold
        });

        if (recheck.passed) {
          passedGates.push(recheck);
        }
      }
    }
  }

  if (reviewPolicy !== 'auto') {
    await ctx.breakpoint({
      question: `Code review and quality gates complete for "${projectName}". ${passedGates.length}/${featureBranches.length} features passed all gates. ${failedGates.length} features need manual attention. Quality threshold: ${qualityThreshold}. Approve merge for passing features?`,
      title: 'AutoMaker: Review & Quality Gate Approval',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/automaker/reviews/review-details.md', format: 'markdown', label: 'Review Details' },
          { path: 'artifacts/automaker/reviews/quality-gate-report.md', format: 'markdown', label: 'Quality Gate Report' }
        ]
      }
    });
  }

  // ============================================================================
  // STAGE 3: MERGE ORCHESTRATION
  // ============================================================================

  ctx.log('Stage 3: Merging approved features');

  const mergeResults = [];
  const passedFeatureIds = new Set(passedGates.map((q) => q.featureId));

  // Merge in order to minimize conflicts
  for (const featureBranch of featureBranches) {
    if (!passedFeatureIds.has(featureBranch.featureId)) {
      ctx.log(`Skipping merge for ${featureBranch.featureId} - did not pass quality gates`);
      continue;
    }

    const mergeResult = await ctx.task(orchestrateMergeTask, {
      projectName,
      featureId: featureBranch.featureId,
      featureTitle: featureBranch.featureTitle,
      branch: featureBranch.branch,
      baseBranch,
      previousMerges: mergeResults
    });

    if (mergeResult.hasConflicts) {
      ctx.log(`Conflict detected merging ${featureBranch.featureId}, attempting resolution`);

      const conflictResult = await ctx.task(resolveConflictsTask, {
        projectName,
        featureId: featureBranch.featureId,
        branch: featureBranch.branch,
        baseBranch,
        conflicts: mergeResult.conflicts
      });

      if (!conflictResult.resolved) {
        await ctx.breakpoint({
          question: `Merge conflict for feature "${featureBranch.featureTitle}" could not be auto-resolved. ${conflictResult.unresolvedFiles?.length || 0} files need manual resolution. Skip this feature or attempt manual resolution?`,
          title: `AutoMaker: Merge Conflict - ${featureBranch.featureTitle}`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/automaker/merges/${featureBranch.featureId}/conflict-details.md`, format: 'markdown', label: 'Conflict Details' }
            ]
          }
        });
      }

      mergeResults.push({ ...mergeResult, conflictResolution: conflictResult });
    } else {
      mergeResults.push(mergeResult);
    }
  }

  // Post-merge integration test
  const integrationResult = await ctx.task(runIntegrationTestsTask, {
    projectName,
    baseBranch,
    mergedFeatures: mergeResults.filter((m) => m.merged).map((m) => m.featureId)
  });

  if (!integrationResult.allPassed) {
    await ctx.breakpoint({
      question: `Integration tests failed after merging ${mergeResults.filter((m) => m.merged).length} features. ${integrationResult.failures?.length || 0} test failures detected. Review and decide how to proceed?`,
      title: 'AutoMaker: Post-Merge Integration Test Failure',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/automaker/integration/test-report.md', format: 'markdown', label: 'Integration Test Report' }
        ]
      }
    });
  }

  // ============================================================================
  // STAGE 4: BUILD & DEPLOY
  // ============================================================================

  ctx.log(`Stage 4: Building and deploying to ${deployTarget}`);

  const buildResult = await ctx.task(buildProjectTask, {
    projectName,
    baseBranch,
    deployTarget
  });

  const deploymentResult = await ctx.task(deployProjectTask, {
    projectName,
    buildResult,
    deployTarget
  });

  // ============================================================================
  // STAGE 5: RELEASE NOTES
  // ============================================================================

  ctx.log('Stage 5: Generating release notes');

  const releaseNotesResult = await ctx.task(generateReleaseNotesTask, {
    projectName,
    mergedFeatures: mergeResults.filter((m) => m.merged),
    featureBranches,
    deploymentResult
  });

  await ctx.breakpoint({
    question: `AutoMaker review & ship complete for "${projectName}". ${mergeResults.filter((m) => m.merged).length} features merged, deployed to ${deployTarget}. Build: ${buildResult.status}. Deployment: ${deploymentResult.status}. Approve final release?`,
    title: 'AutoMaker: Release Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/automaker/release/release-notes.md', format: 'markdown', label: 'Release Notes' },
        { path: 'artifacts/automaker/deployment/deploy-report.md', format: 'markdown', label: 'Deployment Report' }
      ]
    }
  });

  return {
    success: deploymentResult.status === 'healthy',
    reviewResults,
    qualityResults: qualityResults.map((q) => ({ featureId: q.featureId, passed: q.passed, score: q.score })),
    mergeResults: mergeResults.map((m) => ({ featureId: m.featureId, merged: m.merged, branch: m.branch })),
    deploymentResult: {
      status: deploymentResult.status,
      target: deployTarget,
      url: deploymentResult.url
    },
    releaseNotes: releaseNotesResult.markdown,
    metrics: {
      featuresReviewed: reviewResults.length,
      featuresPassedGates: passedGates.length,
      featuresMerged: mergeResults.filter((m) => m.merged).length,
      integrationTestsPassed: integrationResult.allPassed,
      buildStatus: buildResult.status,
      deployStatus: deploymentResult.status
    },
    metadata: {
      processId: 'methodologies/automaker/automaker-review-ship',
      timestamp: ctx.now(),
      framework: 'AutoMaker',
      source: 'https://github.com/AutoMaker-Org/automaker'
    }
  };
}

// ============================================================================
// CODE REVIEW TASKS
// ============================================================================

export const performCodeReviewTask = defineTask('automaker-review-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Code Review: ${args.featureTitle}`,
  description: 'Code Reviewer performs comprehensive quality review',
  agent: {
    name: 'automaker-code-reviewer',
    prompt: {
      role: 'Code Reviewer agent performing thorough code reviews for correctness, security, performance, and style.',
      task: `Review code changes for feature "${args.featureTitle}" on branch ${args.branch}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        branch: args.branch,
        changedFiles: args.changedFiles,
        testResults: args.testResults,
        reviewPolicy: args.reviewPolicy
      },
      instructions: [
        'Review all changed files for correctness',
        'Check for security vulnerabilities (XSS, injection, auth bypasses)',
        'Verify error handling is comprehensive',
        'Check for performance issues (N+1 queries, memory leaks)',
        'Verify test coverage is adequate for changes',
        'Check code style and naming conventions',
        'Look for dead code, unused imports, and debug artifacts',
        'Verify no secrets or sensitive data in code',
        'Provide specific, actionable feedback with line references',
        'Assign overall score (0-100) and approve/reject decision'
      ],
      outputFormat: 'JSON with featureId, branch, approved, score, comments[], severity, securityIssues[], performanceIssues[]'
    }
  },
  labels: ['automaker', 'review', 'code-quality'],
  io: {
    inputs: { feature: args.featureTitle, branch: args.branch, fileCount: args.changedFiles?.length || 0 },
    outputs: 'Code review result with score and comments'
  }
}), {
  labels: ['automaker', 'review']
});

// ============================================================================
// QUALITY GATE TASKS
// ============================================================================

export const enforceQualityGateTask = defineTask('automaker-review-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Gate: ${args.featureId}`,
  description: 'Enforce quality thresholds on feature branch',
  agent: {
    name: 'automaker-code-reviewer',
    prompt: {
      role: 'Code Reviewer agent enforcing quality gates with configurable thresholds.',
      task: `Enforce quality gate for feature ${args.featureId} (threshold: ${args.qualityThreshold})`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        branch: args.branch,
        review: args.review,
        qualityThreshold: args.qualityThreshold
      },
      instructions: [
        `Check review score >= ${args.qualityThreshold}`,
        'Verify no critical security issues',
        'Verify no high-severity bugs',
        'Check test coverage meets minimum threshold',
        'Verify no TODO/FIXME items in production code',
        'Check for any unresolved review comments',
        'Make pass/fail decision with detailed reasoning'
      ],
      outputFormat: 'JSON with featureId, branch, passed, score, issues[], gateDetails'
    }
  },
  labels: ['automaker', 'review', 'quality-gate'],
  io: {
    inputs: { featureId: args.featureId, threshold: args.qualityThreshold },
    outputs: 'Quality gate pass/fail with details'
  }
}), {
  labels: ['automaker', 'quality']
});

export const fixQualityIssuesTask = defineTask('automaker-review-fix-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix Quality: ${args.featureId}`,
  description: 'Attempt to automatically fix quality gate failures',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent applying fixes for quality gate failures.',
      task: `Fix quality issues for feature ${args.featureId}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        branch: args.branch,
        qualityIssues: args.qualityIssues,
        qualityThreshold: args.qualityThreshold
      },
      instructions: [
        'Address each quality issue from the gate report',
        'Fix code style violations',
        'Remove TODO/FIXME items or convert to tracked issues',
        'Add missing error handling',
        'Improve test coverage for uncovered paths',
        'Apply minimal changes to pass the quality gate'
      ],
      outputFormat: 'JSON with resolved, fixesApplied[], remainingIssues[], filesChanged[]'
    }
  },
  labels: ['automaker', 'review', 'quality-fix'],
  io: {
    inputs: { featureId: args.featureId, issueCount: args.qualityIssues?.length || 0 },
    outputs: 'Quality fix results'
  }
}), {
  labels: ['automaker', 'quality']
});

// ============================================================================
// MERGE TASKS
// ============================================================================

export const orchestrateMergeTask = defineTask('automaker-review-merge', (args, taskCtx) => ({
  kind: 'agent',
  title: `Merge: ${args.featureTitle}`,
  description: 'Worktree Manager orchestrates feature branch merge',
  agent: {
    name: 'automaker-worktree-manager',
    prompt: {
      role: 'Worktree Manager agent orchestrating safe branch merges with conflict detection.',
      task: `Merge feature branch ${args.branch} into ${args.baseBranch}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        branch: args.branch,
        baseBranch: args.baseBranch,
        previousMerges: args.previousMerges
      },
      instructions: [
        `Checkout ${args.baseBranch} and pull latest`,
        `Attempt merge of ${args.branch} with --no-ff`,
        'Detect any merge conflicts',
        'If no conflicts, complete the merge and push',
        'If conflicts exist, report details without forcing resolution',
        'Verify merge commit is clean'
      ],
      outputFormat: 'JSON with featureId, branch, merged, hasConflicts, conflicts[], mergeCommit'
    }
  },
  labels: ['automaker', 'review', 'merge'],
  io: {
    inputs: { featureId: args.featureId, branch: args.branch, baseBranch: args.baseBranch },
    outputs: 'Merge result with conflict status'
  }
}), {
  labels: ['automaker', 'merge']
});

export const resolveConflictsTask = defineTask('automaker-review-resolve-conflicts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resolve Conflicts: ${args.featureId}`,
  description: 'Code Generator attempts automatic conflict resolution',
  agent: {
    name: 'automaker-code-generator',
    prompt: {
      role: 'Code Generator agent resolving merge conflicts by understanding both sides of the change.',
      task: `Resolve merge conflicts for feature ${args.featureId}`,
      context: {
        projectName: args.projectName,
        featureId: args.featureId,
        branch: args.branch,
        baseBranch: args.baseBranch,
        conflicts: args.conflicts
      },
      instructions: [
        'Analyze each conflicting file',
        'Understand the intent of changes on both sides',
        'Apply resolution that preserves both changes where possible',
        'For semantic conflicts, prefer the feature branch changes',
        'Verify resolved code compiles and makes logical sense',
        'Report any conflicts that need manual resolution'
      ],
      outputFormat: 'JSON with resolved, resolvedFiles[], unresolvedFiles[], resolutionNotes'
    }
  },
  labels: ['automaker', 'review', 'conflict-resolution'],
  io: {
    inputs: { featureId: args.featureId, conflictCount: args.conflicts?.length || 0 },
    outputs: 'Conflict resolution result'
  }
}), {
  labels: ['automaker', 'merge']
});

export const runIntegrationTestsTask = defineTask('automaker-review-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Tests: ${args.projectName}`,
  description: 'Test Runner executes post-merge integration tests',
  agent: {
    name: 'automaker-test-runner',
    prompt: {
      role: 'Test Runner agent executing integration tests after feature merges to verify system integrity.',
      task: `Run integration tests after merging ${args.mergedFeatures.length} features`,
      context: {
        projectName: args.projectName,
        baseBranch: args.baseBranch,
        mergedFeatures: args.mergedFeatures
      },
      instructions: [
        'Run the full test suite on the merged base branch',
        'Execute both unit tests and E2E tests',
        'Check for regressions introduced by merges',
        'Verify feature interactions are correct',
        'Report any new failures not present before merges'
      ],
      outputFormat: 'JSON with allPassed, totalTests, passed, failed, failures[], regressions[]'
    }
  },
  labels: ['automaker', 'review', 'integration-testing'],
  io: {
    inputs: { featureCount: args.mergedFeatures.length },
    outputs: 'Integration test results'
  }
}), {
  labels: ['automaker', 'testing']
});

// ============================================================================
// BUILD & DEPLOY TASKS
// ============================================================================

export const buildProjectTask = defineTask('automaker-review-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build: ${args.projectName}`,
  description: 'Deployment Engineer runs production build',
  agent: {
    name: 'automaker-deployment-engineer',
    prompt: {
      role: 'Deployment Engineer agent running production builds and verifying build artifacts.',
      task: `Build ${args.projectName} for ${args.deployTarget} deployment`,
      context: {
        projectName: args.projectName,
        baseBranch: args.baseBranch,
        deployTarget: args.deployTarget
      },
      instructions: [
        'Run the production build: npm run build',
        'Verify build artifacts are generated',
        'Check bundle sizes and flag any regressions',
        'Run build-time checks (TypeScript compilation, linting)',
        'Generate build manifest with artifact checksums',
        'Report build status and timing'
      ],
      outputFormat: 'JSON with status, buildTime, artifacts[], bundleSize, checksums'
    }
  },
  labels: ['automaker', 'review', 'build'],
  io: {
    inputs: { projectName: args.projectName, target: args.deployTarget },
    outputs: 'Build result with artifacts'
  }
}), {
  labels: ['automaker', 'build']
});

export const deployProjectTask = defineTask('automaker-review-deploy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy: ${args.projectName} → ${args.deployTarget}`,
  description: 'Deployment Engineer deploys to target environment',
  agent: {
    name: 'automaker-deployment-engineer',
    prompt: {
      role: 'Deployment Engineer agent handling production deployments with health checks.',
      task: `Deploy ${args.projectName} to ${args.deployTarget}`,
      context: {
        projectName: args.projectName,
        buildResult: args.buildResult,
        deployTarget: args.deployTarget
      },
      instructions: [
        `Deploy build artifacts to ${args.deployTarget} environment`,
        'Run pre-deployment health checks',
        'Execute rolling deployment to minimize downtime',
        'Verify deployment health with smoke tests',
        'Monitor for errors in first 5 minutes',
        'Generate deployment report with URL and status'
      ],
      outputFormat: 'JSON with status, url, deployTime, healthCheck, rollbackAvailable'
    }
  },
  labels: ['automaker', 'review', 'deployment'],
  io: {
    inputs: { projectName: args.projectName, target: args.deployTarget },
    outputs: 'Deployment result with URL and status'
  }
}), {
  labels: ['automaker', 'deployment']
});

// ============================================================================
// RELEASE NOTES TASKS
// ============================================================================

export const generateReleaseNotesTask = defineTask('automaker-review-release-notes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release Notes: ${args.projectName}`,
  description: 'Deployment Engineer generates release notes from merged features',
  agent: {
    name: 'automaker-deployment-engineer',
    prompt: {
      role: 'Deployment Engineer agent generating comprehensive release notes from merged features.',
      task: `Generate release notes for ${args.projectName}`,
      context: {
        projectName: args.projectName,
        mergedFeatures: args.mergedFeatures,
        featureBranches: args.featureBranches,
        deploymentResult: args.deploymentResult
      },
      instructions: [
        'Summarize all merged features with user-facing descriptions',
        'Categorize changes: features, improvements, bug fixes, internal',
        'Highlight breaking changes if any',
        'Include deployment URL and environment details',
        'Generate both markdown and plain text versions',
        'Add credits for contributing agents'
      ],
      outputFormat: 'JSON with markdown, plainText, categories, version'
    }
  },
  labels: ['automaker', 'review', 'release-notes'],
  io: {
    inputs: { featureCount: args.mergedFeatures?.length || 0 },
    outputs: 'Release notes in markdown and plain text'
  }
}), {
  labels: ['automaker', 'release']
});
