/**
 * @process cradle/feature-harness-integration-contribute
 * @description Submit a harness integration implementation - adds support for a new harness (CI/CD, IDE, editor) to babysitter
 * @inputs { harnessName?: string, harnessType?: string, integrationDescription?: string, configFormat?: string, additionalContext?: string }
 * @outputs { success: boolean, prUrl: string, prNumber: number, forkUrl: string, summary: string }
 *
 * Harness Integration Contribution Process (PR-based)
 *
 * Phases:
 * 1. Gather Harness Details - Collect harness name, type, integration scope, config format
 * 2. Analyze Existing Harnesses - Study existing harness implementations for patterns
 * 3. Fork Repository - Fork a5c-ai/babysitter (with breakpoint)
 * 4. Star Repository - Ask to star if not already starred (with breakpoint)
 * 5. Create Branch - Create a feature branch in the fork
 * 6. Implement Integration - Build the harness integration following existing patterns
 * 7. Run Tests & Lint - Verify implementation doesn't break anything (parallel)
 * 8. Review Breakpoint - Let user review all changes before PR
 * 9. Submit PR - Create pull request from fork to upstream (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    harnessName = '',
    harnessType = '',
    integrationDescription = '',
    configFormat = '',
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: GATHER HARNESS DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering harness integration details');

  const details = await ctx.task(gatherHarnessDetailsTask, {
    harnessName,
    harnessType,
    integrationDescription,
    configFormat,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: ANALYZE EXISTING HARNESSES
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing existing harness implementations');

  const analysis = await ctx.task(analyzeExistingHarnessesTask, {
    harnessName: details.harnessName,
    harnessType: details.harnessType,
    repoRoot: '.'
  });

  // ============================================================================
  // PHASE 3: FORK REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 3: Forking repository');

  const forkApproval = await ctx.breakpoint({
    question: [
      'To submit your harness integration, we need to fork the a5c-ai/babysitter repository to your GitHub account.',
      '',
      `**Harness:** ${details.harnessName} (${details.harnessType})`,
      `**Integration:** ${details.integrationSummary}`,
      `**Patterns found:** ${analysis.existingHarnesses.length} existing harness(es) analyzed`,
      '',
      'Approve to fork the repository, or reject to cancel.'
    ].join('\n'),
    title: 'Fork a5c-ai/babysitter?',
    context: { runId: ctx.runId }
  });
  if (!forkApproval.approved) {
    return { success: false, reason: 'User rejected at fork approval gate', feedback: forkApproval.response || forkApproval.feedback };
  }

  const fork = await ctx.task(forkRepoTask, {
    targetRepo: 'a5c-ai/babysitter'
  });

  // ============================================================================
  // PHASE 4: STAR REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 4: Star repository check');

  const starStatus = await ctx.task(checkStarTask, { targetRepo: 'a5c-ai/babysitter' });

  if (!starStatus.isStarred) {
    const starApproval = await ctx.breakpoint({
      question: 'Would you like to star the a5c-ai/babysitter repository to show your support?',
      title: 'Star repository?',
      context: { runId: ctx.runId }
    });

    if (starApproval.approved) {
      await ctx.task(starRepoTask, { targetRepo: 'a5c-ai/babysitter' });
    }
  }

  // ============================================================================
  // PHASE 5: CREATE BRANCH
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating feature branch');

  const branchName = `feat/harness-${details.harnessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const branch = await ctx.task(createBranchTask, {
    forkUrl: fork.forkUrl,
    forkOwner: fork.forkOwner,
    branchName,
    baseBranch: 'main'
  });

  // ============================================================================
  // PHASE 6: IMPLEMENT INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing harness integration');

  const implementation = await ctx.task(implementHarnessIntegrationTask, {
    harnessName: details.harnessName,
    harnessType: details.harnessType,
    integrationSpec: details.integrationSpec,
    existingPatterns: analysis.patterns,
    existingHarnesses: analysis.existingHarnesses,
    targetFiles: analysis.suggestedFiles,
    forkOwner: fork.forkOwner,
    branchName,
    configFormat: details.configFormat
  });

  // ============================================================================
  // PHASE 7: RUN TESTS & LINT (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 7: Running tests and lint in parallel');

  const [testResult, lintResult] = await ctx.parallel.all([
    () => ctx.task(runTestsTask, {
      forkOwner: fork.forkOwner,
      branchName,
      testScope: implementation.testScope || 'sdk'
    }),
    () => ctx.task(runLintTask, {
      forkOwner: fork.forkOwner,
      branchName
    })
  ]);

  // ============================================================================
  // PHASE 8: REVIEW BREAKPOINT
  // ============================================================================

  ctx.log('info', 'Phase 8: Review before PR submission');

  const testStatus = testResult.passed ? 'PASSED' : 'FAILED';
  const lintStatus = lintResult.passed ? 'PASSED' : 'FAILED';

  const reviewResult = await ctx.breakpoint({
    question: [
      'Please review the harness integration before submitting the PR.',
      '',
      `**Harness:** ${details.harnessName} (${details.harnessType})`,
      `**Integration:** ${details.integrationSummary}`,
      `**Files changed:** ${implementation.filesChanged.join(', ')}`,
      `**Tests:** ${testStatus}`,
      `**Lint:** ${lintStatus}`,
      `**Patterns followed:** ${analysis.patterns.join(', ')}`,
      '',
      'Approve to submit the PR, or reject to make further changes.'
    ].join('\n'),
    title: 'Review harness integration',
    context: { runId: ctx.runId }
  });
  if (!reviewResult.approved) {
    return { success: false, reason: 'User rejected at harness integration review gate', feedback: reviewResult.response || reviewResult.feedback };
  }

  // ============================================================================
  // PHASE 9: SUBMIT PR
  // ============================================================================

  ctx.log('info', 'Phase 9: Submitting pull request');

  const submitApproval = await ctx.breakpoint({
    question: 'Ready to submit the pull request to a5c-ai/babysitter?',
    title: 'Submit PR?',
    context: { runId: ctx.runId }
  });
  if (!submitApproval.approved) {
    return { success: false, reason: 'User rejected at PR submission gate', feedback: submitApproval.response || submitApproval.feedback };
  }

  const pr = await ctx.task(submitPrTask, {
    forkOwner: fork.forkOwner,
    branchName,
    harnessName: details.harnessName,
    harnessType: details.harnessType,
    integrationSummary: details.integrationSummary,
    filesChanged: implementation.filesChanged,
    testStatus,
    lintStatus
  });

  return {
    success: true,
    prUrl: pr.prUrl,
    prNumber: pr.prNumber,
    forkUrl: fork.forkUrl,
    summary: `Harness integration PR #${pr.prNumber} submitted for ${details.harnessName} (${details.harnessType})`,
    metadata: {
      processId: 'cradle/feature-harness-integration-contribute',
      timestamp: ctx.now()
    }
  };
}

// =============================================================================
// TASK DEFINITIONS
// =============================================================================

export const gatherHarnessDetailsTask = defineTask('gather-harness-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather harness integration details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Requirements analyst gathering harness integration specifications',
      task: 'Collect and structure the harness integration details from user input',
      context: {
        harnessName: args.harnessName,
        harnessType: args.harnessType,
        integrationDescription: args.integrationDescription,
        configFormat: args.configFormat,
        additionalContext: args.additionalContext,
        knownHarnessTypes: ['ci-cd', 'ide', 'editor', 'cli', 'cloud', 'container', 'custom']
      },
      instructions: [
        'Analyze the provided harness details',
        'Determine the harness type (CI/CD pipeline, IDE plugin, editor extension, CLI tool, cloud platform, container runtime, custom)',
        'Identify the integration scope: what SDK features need to be exposed to this harness',
        'Determine config format requirements (JSON, YAML, TOML, env vars, etc.)',
        'Identify entry points and hooks the harness needs',
        'Summarize the integration specification clearly',
        'Return structured details for the implementation phase'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['harnessName', 'harnessType', 'integrationSummary', 'integrationSpec', 'configFormat'],
      properties: {
        harnessName: { type: 'string' },
        harnessType: { type: 'string' },
        integrationSummary: { type: 'string' },
        integrationSpec: { type: 'object' },
        configFormat: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'harness', 'requirements']
}));

export const analyzeExistingHarnessesTask = defineTask('analyze-existing-harnesses', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze existing harness implementations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SDK architecture analyst studying existing harness patterns',
      task: 'Analyze existing harness implementations in the babysitter SDK to identify patterns, conventions, and integration points',
      context: {
        harnessName: args.harnessName,
        harnessType: args.harnessType,
        repoRoot: args.repoRoot,
        searchPaths: [
          'packages/sdk/src/',
          'packages/sdk/src/cli/',
          'packages/sdk/src/hooks/',
          'packages/sdk/src/config/',
          'plugins/babysitter/'
        ]
      },
      instructions: [
        'Search for existing harness implementations in the SDK source code',
        'Look for harness-related files in packages/sdk/src/ (especially cli/, hooks/, config/)',
        'Identify the claude-code harness as a reference implementation',
        'Study how session:init, session:associate, session:resume commands work',
        'Analyze the hooks system (on-run-start, on-run-complete, on-task-start, etc.)',
        'Identify patterns: config loading, session binding, hook registration, state management',
        'Determine what files a new harness integration would need to create/modify',
        'List the integration points (CLI commands, hooks, config) that need to be implemented',
        'Return the analysis with patterns and suggested file structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['existingHarnesses', 'patterns', 'suggestedFiles'],
      properties: {
        existingHarnesses: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        suggestedFiles: { type: 'array', items: { type: 'string' } },
        integrationPoints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'harness', 'analysis']
}));

export const forkRepoTask = defineTask('fork-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fork repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent',
      task: `Fork the repository ${args.targetRepo} to the authenticated user's account`,
      context: { targetRepo: args.targetRepo },
      instructions: [
        `Check if fork of ${args.targetRepo} already exists: gh api repos/{owner}/${args.targetRepo.split('/')[1]} 2>/dev/null`,
        `If no existing fork, create one: gh repo fork ${args.targetRepo} --clone=false`,
        'Get the fork URL and owner from the result',
        'Return forkUrl, forkOwner, and whether it already existed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['forkUrl', 'forkOwner', 'alreadyExisted'],
      properties: {
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
  labels: ['agent', 'github', 'fork']
}));

export const checkStarTask = defineTask('check-star', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check star status',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent',
      task: `Check if user has starred ${args.targetRepo}`,
      context: { targetRepo: args.targetRepo },
      instructions: [
        `Run: gh api user/starred/${args.targetRepo} 2>/dev/null`,
        'If status 204 → starred. If 404 → not starred.',
        'Return isStarred boolean'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['isStarred'],
      properties: { isStarred: { type: 'boolean' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'github', 'star']
}));

export const starRepoTask = defineTask('star-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Star repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent',
      task: `Star the repository ${args.targetRepo}`,
      context: { targetRepo: args.targetRepo },
      instructions: [
        `Run: gh api -X PUT user/starred/${args.targetRepo}`,
        'Return success status'
      ],
      outputFormat: 'JSON'
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
  labels: ['agent', 'github', 'star']
}));

export const createBranchTask = defineTask('create-branch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create feature branch',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Git operations agent',
      task: `Create branch ${args.branchName} in fork ${args.forkOwner}/babysitter`,
      context: {
        forkUrl: args.forkUrl,
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        baseBranch: args.baseBranch
      },
      instructions: [
        `Clone the fork if not already cloned: gh repo clone ${args.forkOwner}/babysitter -- --depth=1`,
        `cd into the cloned repo`,
        `Create and checkout the branch: git checkout -b ${args.branchName}`,
        `Push branch to remote: git push -u origin ${args.branchName}`,
        'Return branch name and confirmation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['branchName', 'created'],
      properties: {
        branchName: { type: 'string' },
        created: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'git', 'branch']
}));

export const implementHarnessIntegrationTask = defineTask('implement-harness-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement harness integration',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SDK developer implementing a new harness integration for babysitter',
      task: `Implement the ${args.harnessName} harness integration following existing patterns`,
      context: {
        harnessName: args.harnessName,
        harnessType: args.harnessType,
        integrationSpec: args.integrationSpec,
        existingPatterns: args.existingPatterns,
        existingHarnesses: args.existingHarnesses,
        targetFiles: args.targetFiles,
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        configFormat: args.configFormat
      },
      instructions: [
        'Follow the patterns identified from existing harness implementations',
        'Create necessary files for the harness integration:',
        '  - Session binding module (how the harness connects to babysitter)',
        '  - Hook handlers (how the harness responds to orchestration events)',
        '  - Config loader (how the harness reads its configuration)',
        '  - CLI integration (any new CLI commands or flags needed)',
        'Ensure the integration follows the SDK patterns:',
        '  - Use the hooks system for event handling',
        '  - Use the session system for state management',
        '  - Use the config system for settings',
        'Write tests for the new harness integration',
        'Use feat() commit convention: git commit -m "feat(harness): add {harnessName} integration"',
        'Push changes to the branch',
        'Return list of files changed and test scope'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['filesChanged', 'testScope', 'success'],
      properties: {
        filesChanged: { type: 'array', items: { type: 'string' } },
        testScope: { type: 'string' },
        success: { type: 'boolean' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'harness', 'implementation']
}));

export const runTestsTask = defineTask('run-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run tests',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer running test suite',
      task: 'Run the test suite to verify the harness integration',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        testScope: args.testScope
      },
      instructions: [
        'Navigate to the cloned fork directory',
        'Install dependencies: npm install',
        'Run SDK tests: npm run test --workspace=@a5c-ai/babysitter-sdk',
        'If there are harness-specific tests, run those too',
        'Return test results with passed/failed status and details'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        summary: { type: 'string' },
        testCount: { type: 'number' },
        failedTests: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'testing', 'verification']
}));

export const runLintTask = defineTask('run-lint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run lint',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code quality agent',
      task: 'Run linting to verify code quality',
      context: { forkOwner: args.forkOwner, branchName: args.branchName },
      instructions: [
        'Navigate to the cloned fork directory',
        'Run linter: npm run lint --workspace=@a5c-ai/babysitter-sdk',
        'Return lint results with passed/failed status'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        summary: { type: 'string' },
        errorCount: { type: 'number' },
        warningCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lint', 'verification']
}));

export const submitPrTask = defineTask('submit-pr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit pull request',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent submitting a pull request',
      task: 'Create a pull request from the fork branch to a5c-ai/babysitter main',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        harnessName: args.harnessName,
        harnessType: args.harnessType,
        integrationSummary: args.integrationSummary,
        filesChanged: args.filesChanged,
        testStatus: args.testStatus,
        lintStatus: args.lintStatus
      },
      instructions: [
        'Create a PR using gh CLI:',
        `gh pr create --repo a5c-ai/babysitter --head ${args.forkOwner}:${args.branchName} --base main`,
        `Title: "feat(harness): add ${args.harnessName} integration"`,
        'Body should include:',
        '  - ## Summary: What harness this adds and why',
        '  - ## Integration Details: Type, config format, hooks used',
        '  - ## Files Changed: List of modified/added files',
        '  - ## Test Status: Pass/fail for tests and lint',
        '  - ## Checklist: Tests pass, lint clean, docs updated, follows patterns',
        'Use a heredoc for the body to preserve formatting',
        'Return the PR URL and number'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['prUrl', 'prNumber'],
      properties: {
        prUrl: { type: 'string' },
        prNumber: { type: 'number' },
        success: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'github', 'pr']
}));
