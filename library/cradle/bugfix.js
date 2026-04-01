/**
 * @process cradle/bugfix
 * @description Submit a bugfix with code. Phase 0: root-cause diagnosis with git diff and evidence. Then forks repo, creates branch, applies fix, runs tests, and submits PR
 * @inputs { bugDescription?: string, fixDescription?: string, component?: string, filesToChange?: array, additionalContext?: string }
 * @outputs { success: boolean, prUrl: string, prNumber: number, forkUrl: string, summary: string }
 *
 * Bugfix Contribution Process (PR-based)
 *
 * Phases:
 * 0. Root-Cause Diagnosis - Diagnose root cause with git diff and 2+ evidence signals (no code changes)
 * 1. Gather Bug & Fix Details - Collect bug description, fix details, affected files
 * 2. Fork Repository - Fork a5c-ai/babysitter (with breakpoint)
 * 3. Star Repository - Ask to star if not already starred (with breakpoint)
 * 4. Create Branch - Create a bugfix branch in the fork
 * 5. Apply Fix - Apply the bugfix changes to the fork
 * 6. Run Tests & Lint - Verify the fix doesn't break anything
 * 7. Review Breakpoint - Let user review all changes before PR
 * 8. Submit PR - Create pull request from fork to upstream (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { rootCauseDiagnosisTask, diagnosisBreakpointQuestion } from '../methodologies/shared/root-cause-diagnosis.js';

export async function process(inputs, ctx) {
  const {
    bugDescription = '',
    fixDescription = '',
    component = '',
    filesToChange = [],
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 0: ROOT-CAUSE DIAGNOSIS (no code changes)
  // ============================================================================

  ctx.log('info', 'Phase 0: Root-cause diagnosis');

  const diagnosis = await ctx.task(rootCauseDiagnosisTask, {
    description: bugDescription || additionalContext || 'Bug reported for contribution',
    projectDir: '.',
    errorMessage: '',
    stackTrace: '',
    context: { component, filesToChange }
  });

  await ctx.breakpoint({
    question: diagnosisBreakpointQuestion(diagnosis),
    title: 'Review Root-Cause Diagnosis (Phase 0)',
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['approval-gate', 'diagnosis'],
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 1: GATHER BUG & FIX DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering bug and fix details');

  let details = await ctx.task(gatherBugFixDetailsTask, {
    bugDescription,
    fixDescription,
    component,
    filesToChange,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: FORK REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 2: Forking repository');

  let forkLastFeedback = null;
  for (let forkAttempt = 0; forkAttempt < 3; forkAttempt++) {
    if (forkLastFeedback) {
      details = await ctx.task(gatherBugFixDetailsTask, {
        bugDescription,
        fixDescription,
        component,
        filesToChange,
        additionalContext,
        feedback: forkLastFeedback,
        attempt: forkAttempt + 1
      });
    }
    const forkApproval = await ctx.breakpoint({
      question: [
          'To submit your bugfix, we need to fork the a5c-ai/babysitter repository to your GitHub account.',
          '',
          `**Bug:** ${details.bugSummary}`,
          `**Fix:** ${details.fixSummary}`,
          `**Files:** ${details.affectedFiles.join(', ')}`,
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
  // PHASE 3: STAR REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 3: Star repository check');

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
  // PHASE 4: CREATE BRANCH
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating bugfix branch');

  const branchResult = await ctx.task(createBranchTask, {
    forkUrl: forkResult.forkUrl,
    forkOwner: forkResult.forkOwner,
    branchName: `fix/${details.branchSlug}`,
    component: details.component
  });

  // ============================================================================
  // PHASE 5: APPLY FIX
  // ============================================================================

  ctx.log('info', 'Phase 5: Applying bugfix changes');

  const applyResult = await ctx.task(applyFixTask, {
    forkUrl: forkResult.forkUrl,
    forkOwner: forkResult.forkOwner,
    branchName: branchResult.branchName,
    details,
    additionalContext
  });

  // ============================================================================
  // PHASE 6: RUN TESTS & LINT
  // ============================================================================

  ctx.log('info', 'Phase 6: Running tests and lint');

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
  // PHASE 7: REVIEW BREAKPOINT
  // ============================================================================

  let reviewLastFeedback = null;
  let currentApplyResult = applyResult;
  let currentTestResult = testResult;
  let currentLintResult = lintResult;
  for (let reviewAttempt = 0; reviewAttempt < 3; reviewAttempt++) {
    if (reviewLastFeedback) {
      currentApplyResult = await ctx.task(applyFixTask, {
        forkUrl: forkResult.forkUrl,
        forkOwner: forkResult.forkOwner,
        branchName: branchResult.branchName,
        details,
        additionalContext,
        feedback: reviewLastFeedback,
        attempt: reviewAttempt + 1
      });
      [currentTestResult, currentLintResult] = await ctx.parallel.all([
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
    }
    const reviewApproval = await ctx.breakpoint({
      question: [
          'Please review your bugfix before submitting the PR:',
          '',
          `**Bug:** ${details.bugSummary}`,
          `**Fix:** ${details.fixSummary}`,
          `**Branch:** ${branchResult.branchName}`,
          `**Files changed:** ${currentApplyResult.filesChanged.join(', ')}`,
          `**Tests:** ${currentTestResult.passed ? 'PASSING' : 'FAILING'}`,
          `**Lint:** ${currentLintResult.passed ? 'PASSING' : 'FAILING'}`,
          '',
          currentTestResult.passed && currentLintResult.passed
            ? 'All checks pass. Approve to submit the PR, or request changes.'
            : 'Some checks are failing. You may want to fix them before submitting. Approve to submit anyway, or request changes.'
        ].join('\n'),
      previousFeedback: reviewLastFeedback || undefined,
      attempt: reviewAttempt > 0 ? reviewAttempt + 1 : undefined,
      title: 'Review Bugfix Before PR Submission',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'review'],
      context: { runId: ctx.runId }
    });
    if (reviewApproval.approved) break;
    reviewLastFeedback = reviewApproval.response || reviewApproval.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 8: SUBMIT PR
  // ============================================================================

  ctx.log('info', 'Phase 8: Submitting pull request');

  let submitLastFeedback = null;
  for (let submitAttempt = 0; submitAttempt < 3; submitAttempt++) {
    const submitApproval = await ctx.breakpoint({
      question: 'Confirm: Submit this bugfix as a pull request to a5c-ai/babysitter?',
      previousFeedback: submitLastFeedback || undefined,
      attempt: submitAttempt > 0 ? submitAttempt + 1 : undefined,
      title: 'Confirm PR Submission',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'submit'],
      context: { runId: ctx.runId }
    });
    if (submitApproval.approved) break;
    submitLastFeedback = submitApproval.response || submitApproval.feedback || 'Changes requested';
  }

  const prResult = await ctx.task(submitPrTask, {
    forkOwner: forkResult.forkOwner,
    branchName: branchResult.branchName,
    details,
    testResult,
    lintResult
  });

  return {
    success: prResult.success,
    prUrl: prResult.prUrl,
    prNumber: prResult.prNumber,
    forkUrl: forkResult.forkUrl,
    summary: prResult.success
      ? `Bugfix PR submitted: ${prResult.prUrl}`
      : `PR submission failed: ${prResult.error}`,
    metadata: {
      processId: 'cradle/bugfix',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatherBugFixDetailsTask = defineTask('gather-bugfix-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather bug and fix details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Bug triage analyst gathering structured bugfix information',
      task: 'Analyze the bug description and fix details to extract structured information for the PR',
      context: {
        bugDescription: args.bugDescription,
        fixDescription: args.fixDescription,
        component: args.component,
        filesToChange: args.filesToChange,
        additionalContext: args.additionalContext,
        validComponents: ['sdk', 'cli', 'runtime', 'storage', 'tasks', 'hooks', 'testing', 'config', 'processes', 'plugins', 'catalog']
      },
      instructions: [
        'Extract or infer: bug summary, fix summary, affected component, affected files',
        'Generate a branch slug from the bug summary (e.g., "fix-journal-corruption" from "journal corruption on concurrent writes")',
        'Identify the severity of the bug',
        'Determine which test suite should be run to verify the fix',
        'Return structured details'
      ],
      outputFormat: 'JSON with bugSummary (string), fixSummary (string), component (string), affectedFiles (array), branchSlug (string), severity (string), testSuite (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['bugSummary', 'fixSummary', 'component', 'affectedFiles', 'branchSlug'],
      properties: {
        bugSummary: { type: 'string' },
        fixSummary: { type: 'string' },
        component: { type: 'string' },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        branchSlug: { type: 'string' },
        severity: { type: 'string' },
        testSuite: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'gather']
}));

export const forkRepoTask = defineTask('fork-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fork a5c-ai/babysitter repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent forking a repository',
      task: 'Fork the a5c-ai/babysitter repository to the authenticated user\'s GitHub account',
      context: {},
      instructions: [
        'Check if a fork already exists: `gh repo list --fork --json nameWithOwner | jq \'.[] | select(.nameWithOwner | contains("babysitter"))\'`',
        'If fork exists, use it. If not, create one: `gh repo fork a5c-ai/babysitter --clone=false`',
        'Get the fork URL and owner from the output',
        'Clone the fork locally if needed for applying changes',
        'Return the fork details'
      ],
      outputFormat: 'JSON with success (boolean), forkUrl (string), forkOwner (string), alreadyExisted (boolean), message (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'forkUrl', 'forkOwner'],
      properties: {
        success: { type: 'boolean' },
        forkUrl: { type: 'string' },
        forkOwner: { type: 'string' },
        alreadyExisted: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'fork', 'github']
}));

export const checkStarTask = defineTask('check-star', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check if repo is starred',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent checking star status',
      task: 'Check if the user has starred a5c-ai/babysitter',
      context: {},
      instructions: [
        'Use `gh api user/starred/a5c-ai/babysitter` - 204 means starred, 404 means not',
        'Return the star status'
      ],
      outputFormat: 'JSON with starred (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['starred'],
      properties: { starred: { type: 'boolean' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'star-check']
}));

export const starRepoTask = defineTask('star-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Star the repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent',
      task: 'Star the a5c-ai/babysitter repository',
      context: {},
      instructions: [
        'Use `gh api -X PUT user/starred/a5c-ai/babysitter` to star',
        'Return success status'
      ],
      outputFormat: 'JSON with success (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: { success: { type: 'boolean' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'star', 'github']
}));

export const createBranchTask = defineTask('create-branch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create branch: ${args.branchName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Git operations agent creating a feature branch',
      task: 'Create a bugfix branch in the forked repository',
      context: {
        forkUrl: args.forkUrl,
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        component: args.component
      },
      instructions: [
        'Ensure the fork is cloned locally or use gh CLI to create the branch',
        `Create branch "${args.branchName}" from the latest main/master`,
        'Use `git checkout -b <branchName>` or equivalent gh API call',
        'Push the branch to the fork',
        'Return the branch details'
      ],
      outputFormat: 'JSON with success (boolean), branchName (string), baseBranch (string), message (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'branchName'],
      properties: {
        success: { type: 'boolean' },
        branchName: { type: 'string' },
        baseBranch: { type: 'string' },
        message: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'branch']
}));

export const applyFixTask = defineTask('apply-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply bugfix changes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software engineer applying a bugfix to the codebase',
      task: 'Apply the bugfix changes described by the user to the forked repository',
      context: {
        forkUrl: args.forkUrl,
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        details: args.details,
        additionalContext: args.additionalContext
      },
      instructions: [
        'Read the affected files to understand the current state',
        'Apply the fix as described in details.fixSummary',
        'If specific file changes were provided, apply them',
        'If the fix is described conceptually, implement it following SDK conventions',
        'Commit the changes with a descriptive message: "fix(<component>): <summary>"',
        'Push to the fork branch',
        'Return the list of files changed'
      ],
      outputFormat: 'JSON with success (boolean), filesChanged (array of strings), commitHash (string), commitMessage (string)'
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
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'apply']
}));

export const runTestsTask = defineTask('run-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run tests',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer running test suites to verify a bugfix',
      task: 'Run the relevant test suite to verify the bugfix doesn\'t break anything',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        component: args.component
      },
      instructions: [
        'Run the appropriate test command based on component:',
        '  - sdk: `npm run test --workspace=@a5c-ai/babysitter-sdk`',
        '  - catalog: `cd packages/catalog && npm run type-check`',
        '  - e2e: `npm run test:e2e:docker`',
        '  - default: `npm run test:sdk`',
        'Capture test output (pass/fail, number of tests)',
        'Return structured test results'
      ],
      outputFormat: 'JSON with passed (boolean), totalTests (number), failedTests (number), output (string summary)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed'],
      properties: {
        passed: { type: 'boolean' },
        totalTests: { type: 'number' },
        failedTests: { type: 'number' },
        output: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'tests']
}));

export const runLintTask = defineTask('run-lint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run lint',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code quality engineer running lint checks',
      task: 'Run lint checks on the bugfix changes',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        component: args.component
      },
      instructions: [
        'Run the appropriate lint command:',
        '  - sdk: `npm run lint --workspace=@a5c-ai/babysitter-sdk`',
        '  - catalog: `cd packages/catalog && npm run lint`',
        '  - default: `npm run lint --workspace=@a5c-ai/babysitter-sdk`',
        'Capture lint output (warnings, errors)',
        'Return structured lint results'
      ],
      outputFormat: 'JSON with passed (boolean), errors (number), warnings (number), output (string summary)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed'],
      properties: {
        passed: { type: 'boolean' },
        errors: { type: 'number' },
        warnings: { type: 'number' },
        output: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'lint']
}));

export const submitPrTask = defineTask('submit-pr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit bugfix pull request',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent creating a pull request',
      task: 'Create a pull request from the fork branch to a5c-ai/babysitter main',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        details: args.details,
        testResult: args.testResult,
        lintResult: args.lintResult
      },
      instructions: [
        'Create the PR using gh CLI:',
        '`gh pr create --repo a5c-ai/babysitter --head <forkOwner>:<branchName> --base main --title "<title>" --body "<body>"`',
        'PR title format: fix(<component>): <brief description>',
        'PR body should include:',
        '  ## Bug Description',
        '  <bug summary>',
        '  ## Fix Description',
        '  <fix summary>',
        '  ## Test Results',
        '  - Tests: PASS/FAIL',
        '  - Lint: PASS/FAIL',
        '  ## Files Changed',
        '  <list of files>',
        '  ## Environment',
        '  - Babysitter SDK: <run `babysitter --version`> (<global/local>)',
        '  - AI Harness: <detect harness -- Claude Code, Codex, etc. with version>',
        '  - OS: <run `uname -a` for detailed OS info>',
        '  - Node.js: <run `node --version`>',
        'Use a heredoc for the body',
        'Capture the PR URL and number',
        'Return the PR submission result'
      ],
      outputFormat: 'JSON with success (boolean), prUrl (string), prNumber (number), error (string if failed)'
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        prUrl: { type: 'string' },
        prNumber: { type: 'number' },
        error: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bugfix', 'pr', 'github']
}));
