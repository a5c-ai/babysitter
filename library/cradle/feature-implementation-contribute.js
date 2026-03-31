/**
 * @process cradle/feature-implementation-contribute
 * @description Submit a feature implementation - user already has the code. Forks repo, creates branch, applies implementation, runs tests/lint, and submits PR
 * @inputs { featureDescription?: string, implementationDetails?: string, component?: string, filesToChange?: array, relatedIssue?: string, additionalContext?: string }
 * @outputs { success: boolean, prUrl: string, prNumber: number, forkUrl: string, summary: string }
 *
 * Feature Implementation Contribution Process (PR-based)
 *
 * Phases:
 * 1. Gather Feature & Implementation Details - Collect feature description, implementation details, affected files
 * 2. Search Related Issues/PRs - Check for related issues or existing PRs
 * 3. Fork Repository - Fork a5c-ai/babysitter (with breakpoint)
 * 4. Star Repository - Ask to star if not already starred (with breakpoint)
 * 5. Create Branch - Create a feature branch in the fork
 * 6. Apply Implementation - Apply the feature implementation changes
 * 7. Run Tests & Lint - Verify implementation doesn't break anything (parallel)
 * 8. Review Breakpoint - Let user review all changes before PR
 * 9. Submit PR - Create pull request from fork to upstream (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    featureDescription = '',
    implementationDetails = '',
    component = '',
    filesToChange = [],
    relatedIssue = '',
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: GATHER FEATURE & IMPLEMENTATION DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering feature and implementation details');

  let details = await ctx.task(gatherFeatureImplDetailsTask, {
    featureDescription,
    implementationDetails,
    component,
    filesToChange,
    relatedIssue,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: SEARCH RELATED ISSUES/PRS
  // ============================================================================

  ctx.log('info', 'Phase 2: Searching for related issues and PRs');

  const relatedResults = await ctx.task(searchRelatedTask, {
    featureDescription: details.featureSummary,
    component: details.component,
    relatedIssue: details.relatedIssue
  });

  // ============================================================================
  // PHASE 3: FORK REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 3: Forking repository');

  let forkLastFeedback = null;
  for (let forkAttempt = 0; forkAttempt < 3; forkAttempt++) {
    if (forkLastFeedback) {
      details = await ctx.task(gatherFeatureImplDetailsTask, {
        featureDescription,
        implementationDetails,
        component,
        filesToChange,
        relatedIssue,
        additionalContext,
        feedback: forkLastFeedback,
        attempt: forkAttempt + 1
      });
    }
    const forkApproval = await ctx.breakpoint({
      question: [
          'To submit your feature implementation, we need to fork the a5c-ai/babysitter repository.',
          '',
          `**Feature:** ${details.featureSummary}`,
          `**Component:** ${details.component}`,
          `**Files:** ${details.affectedFiles.join(', ')}`,
          relatedResults.relatedIssue ? `**Related issue:** #${relatedResults.relatedIssue}` : '',
          '',
          'Approve to fork the repository, or request changes.'
        ].join('\n'),
      previousFeedback: forkLastFeedback || undefined,
      attempt: forkAttempt > 0 ? forkAttempt + 1 : undefined,
      title: 'Confirm Repository Fork',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'fork'],
      context: { runId: ctx.runId }
    });
    if (forkApproval.approved) break;
    forkLastFeedback = forkApproval.response || forkApproval.feedback || 'Changes requested';
  }

  const forkResult = await ctx.task(forkRepoTask, {});

  // ============================================================================
  // PHASE 4: STAR REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 4: Star repository check');

  const starCheck = await ctx.task(checkStarTask, {});

  if (!starCheck.starred) {
    const starApproval = await ctx.breakpoint({
      question: 'Would you like to star the a5c-ai/babysitter repository? This helps the project gain visibility.',
      title: 'Star Repository',
      context: { runId: ctx.runId }
    });

    if (starApproval.approved) {
      await ctx.task(starRepoTask, {});
    }
  }

  // ============================================================================
  // PHASE 5: CREATE BRANCH
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating feature branch');

  const branchResult = await ctx.task(createBranchTask, {
    forkUrl: forkResult.forkUrl,
    forkOwner: forkResult.forkOwner,
    branchName: `feat/${details.branchSlug}`,
    component: details.component
  });

  // ============================================================================
  // PHASE 6: APPLY IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Applying feature implementation');

  const applyResult = await ctx.task(applyImplementationTask, {
    forkUrl: forkResult.forkUrl,
    forkOwner: forkResult.forkOwner,
    branchName: branchResult.branchName,
    details,
    additionalContext
  });

  // ============================================================================
  // PHASE 7: RUN TESTS & LINT (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 7: Running tests and lint');

  const [testResult, lintResult] = await ctx.parallel.all([
    () => ctx.task(runTestsTask, {
      forkOwner: forkResult.forkOwner,
      branchName: branchResult.branchName,
      component: details.component
    }),
    () => ctx.task(runLintTask, {
      forkOwner: forkResult.forkOwner,
      branchName: branchResult.branchName,
      component: details.component
    })
  ]);

  // ============================================================================
  // PHASE 8: REVIEW BREAKPOINT
  // ============================================================================

  const reviewResult = await ctx.breakpoint({
    question: [
      'Please review your feature implementation before submitting the PR:',
      '',
      `**Feature:** ${details.featureSummary}`,
      `**Branch:** ${branchResult.branchName}`,
      `**Files changed:** ${applyResult.filesChanged.join(', ')}`,
      `**Tests:** ${testResult.passed ? 'PASSING' : 'FAILING'}`,
      `**Lint:** ${lintResult.passed ? 'PASSING' : 'FAILING'}`,
      '',
      testResult.passed && lintResult.passed
        ? 'All checks pass. Approve to submit the PR, or reject to cancel.'
        : 'Some checks are failing. Approve to submit anyway, or reject to fix first.'
    ].join('\n'),
    title: 'Review Feature Implementation Before PR',
    context: { runId: ctx.runId }
  });
  if (!reviewResult.approved) {
    return { success: false, reason: 'User rejected at feature implementation review gate', feedback: reviewResult.response || reviewResult.feedback };
  }

  // ============================================================================
  // PHASE 9: SUBMIT PR
  // ============================================================================

  ctx.log('info', 'Phase 9: Submitting pull request');

  const submitApproval = await ctx.breakpoint({
    question: 'Confirm: Submit this feature implementation as a pull request to a5c-ai/babysitter?',
    title: 'Confirm PR Submission',
    context: { runId: ctx.runId }
  });
  if (!submitApproval.approved) {
    return { success: false, reason: 'User rejected at PR submission gate', feedback: submitApproval.response || submitApproval.feedback };
  }

  const prResult = await ctx.task(submitPrTask, {
    forkOwner: forkResult.forkOwner,
    branchName: branchResult.branchName,
    details,
    relatedResults,
    testResult,
    lintResult
  });

  return {
    success: prResult.success,
    prUrl: prResult.prUrl,
    prNumber: prResult.prNumber,
    forkUrl: forkResult.forkUrl,
    summary: prResult.success
      ? `Feature implementation PR submitted: ${prResult.prUrl}`
      : `PR submission failed: ${prResult.error}`,
    metadata: {
      processId: 'cradle/feature-implementation-contribute',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatherFeatureImplDetailsTask = defineTask('gather-feature-impl-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather feature implementation details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product engineer gathering structured feature implementation information',
      task: 'Analyze the feature description and implementation details to extract structured information for the PR',
      context: {
        featureDescription: args.featureDescription,
        implementationDetails: args.implementationDetails,
        component: args.component,
        filesToChange: args.filesToChange,
        relatedIssue: args.relatedIssue,
        additionalContext: args.additionalContext,
        validComponents: ['sdk', 'cli', 'runtime', 'storage', 'tasks', 'hooks', 'testing', 'config', 'processes', 'plugins', 'catalog', 'harness']
      },
      instructions: [
        'Extract: feature summary, implementation approach, affected component, affected files',
        'Generate a branch slug (e.g., "add-profile-merge-cli" from "Add profile merge command to CLI")',
        'Identify breaking changes if any',
        'Parse related issue number if provided',
        'Return structured details'
      ],
      outputFormat: 'JSON with featureSummary (string), implementationApproach (string), component (string), affectedFiles (array), branchSlug (string), breakingChanges (boolean), relatedIssue (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['featureSummary', 'component', 'affectedFiles', 'branchSlug'],
      properties: {
        featureSummary: { type: 'string' },
        implementationApproach: { type: 'string' },
        component: { type: 'string' },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        branchSlug: { type: 'string' },
        breakingChanges: { type: 'boolean' },
        relatedIssue: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feature-impl', 'gather']
}));

export const searchRelatedTask = defineTask('search-related', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search related issues and PRs',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub researcher finding related issues and PRs',
      task: 'Search for related issues and PRs on a5c-ai/babysitter',
      context: {
        featureDescription: args.featureDescription,
        component: args.component,
        relatedIssue: args.relatedIssue
      },
      instructions: [
        'If relatedIssue is provided, fetch its details: `gh issue view <number> --repo a5c-ai/babysitter --json title,state,url`',
        'Search for related PRs: `gh pr list --repo a5c-ai/babysitter --search "<keywords>" --json number,title,state,url`',
        'Return related issue details and any similar PRs found',
        'If gh fails, return gracefully with empty results'
      ],
      outputFormat: 'JSON with relatedIssue (string, issue number if found), relatedIssueTitle (string), relatedPrs (array of {number, title, state, url})'
    },
    outputSchema: {
      type: 'object',
      required: [],
      properties: {
        relatedIssue: { type: 'string' },
        relatedIssueTitle: { type: 'string' },
        relatedPrs: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feature-impl', 'search']
}));

export const forkRepoTask = defineTask('fork-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fork repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent forking a repository',
      task: 'Fork a5c-ai/babysitter to the authenticated user\'s account',
      context: {},
      instructions: [
        'Check if fork exists: `gh repo list --fork --json nameWithOwner`',
        'If not, fork: `gh repo fork a5c-ai/babysitter --clone=false`',
        'Return fork URL and owner'
      ],
      outputFormat: 'JSON with success (boolean), forkUrl (string), forkOwner (string), alreadyExisted (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'forkUrl', 'forkOwner'],
      properties: {
        success: { type: 'boolean' },
        forkUrl: { type: 'string' },
        forkOwner: { type: 'string' },
        alreadyExisted: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feature-impl', 'fork', 'github']
}));

export const checkStarTask = defineTask('check-star', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check star status',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub agent',
      task: 'Check if user has starred a5c-ai/babysitter',
      context: {},
      instructions: ['Use `gh api user/starred/a5c-ai/babysitter` - 204=starred, 404=not'],
      outputFormat: 'JSON with starred (boolean)'
    },
    outputSchema: { type: 'object', required: ['starred'], properties: { starred: { type: 'boolean' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'feature-impl', 'star-check']
}));

export const starRepoTask = defineTask('star-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Star repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub agent',
      task: 'Star a5c-ai/babysitter',
      context: {},
      instructions: ['Use `gh api -X PUT user/starred/a5c-ai/babysitter`'],
      outputFormat: 'JSON with success (boolean)'
    },
    outputSchema: { type: 'object', required: ['success'], properties: { success: { type: 'boolean' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'feature-impl', 'star', 'github']
}));

export const createBranchTask = defineTask('create-branch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create branch: ${args.branchName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Git operations agent',
      task: 'Create a feature branch in the fork',
      context: { forkUrl: args.forkUrl, forkOwner: args.forkOwner, branchName: args.branchName },
      instructions: [
        `Create branch "${args.branchName}" from latest main`,
        'Push to fork',
        'Return branch details'
      ],
      outputFormat: 'JSON with success (boolean), branchName (string), baseBranch (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'branchName'],
      properties: { success: { type: 'boolean' }, branchName: { type: 'string' }, baseBranch: { type: 'string' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'feature-impl', 'branch']
}));

export const applyImplementationTask = defineTask('apply-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply feature implementation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software engineer applying a feature implementation',
      task: 'Apply the feature implementation to the forked repository',
      context: {
        forkUrl: args.forkUrl,
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        details: args.details,
        additionalContext: args.additionalContext
      },
      instructions: [
        'Read affected files to understand current state',
        'Apply the implementation as described',
        'Follow SDK conventions (no any types, proper JSDoc, etc.)',
        'Commit with message: "feat(<component>): <summary>"',
        'Push to fork branch',
        'Return files changed'
      ],
      outputFormat: 'JSON with success (boolean), filesChanged (array), commitHash (string), commitMessage (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesChanged'],
      properties: {
        success: { type: 'boolean' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        commitHash: { type: 'string' },
        commitMessage: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'feature-impl', 'apply']
}));

export const runTestsTask = defineTask('run-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run tests',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer',
      task: 'Run tests to verify feature implementation',
      context: { component: args.component },
      instructions: [
        'Run appropriate test command for component:',
        '  sdk: `npm run test --workspace=@a5c-ai/babysitter-sdk`',
        '  catalog: `cd packages/catalog && npm run type-check`',
        '  default: `npm run test:sdk`',
        'Return results'
      ],
      outputFormat: 'JSON with passed (boolean), totalTests (number), failedTests (number), output (string)'
    },
    outputSchema: { type: 'object', required: ['passed'], properties: { passed: { type: 'boolean' }, totalTests: { type: 'number' }, failedTests: { type: 'number' }, output: { type: 'string' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'feature-impl', 'tests']
}));

export const runLintTask = defineTask('run-lint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run lint',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code quality engineer',
      task: 'Run lint on feature implementation',
      context: { component: args.component },
      instructions: [
        'Run lint: `npm run lint --workspace=@a5c-ai/babysitter-sdk`',
        'Return results'
      ],
      outputFormat: 'JSON with passed (boolean), errors (number), warnings (number), output (string)'
    },
    outputSchema: { type: 'object', required: ['passed'], properties: { passed: { type: 'boolean' }, errors: { type: 'number' }, warnings: { type: 'number' }, output: { type: 'string' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'feature-impl', 'lint']
}));

export const submitPrTask = defineTask('submit-pr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit feature PR',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent creating a pull request',
      task: 'Create a pull request for the feature implementation',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        details: args.details,
        relatedResults: args.relatedResults,
        testResult: args.testResult,
        lintResult: args.lintResult
      },
      instructions: [
        'Create PR: `gh pr create --repo a5c-ai/babysitter --head <forkOwner>:<branchName> --base main --title "<title>" --body "<body>"`',
        'Title format: feat(<component>): <brief description>',
        'Body template:',
        '  ## Feature Description',
        '  ## Implementation Details',
        '  ## Related Issues (Closes #N if applicable)',
        '  ## Test Results',
        '  ## Breaking Changes (if any)',
        'Use heredoc for body',
        'Return PR URL and number'
      ],
      outputFormat: 'JSON with success (boolean), prUrl (string), prNumber (number), error (string if failed)'
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: { success: { type: 'boolean' }, prUrl: { type: 'string' }, prNumber: { type: 'number' }, error: { type: 'string' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'feature-impl', 'pr', 'github']
}));
