/**
 * @process cradle/contribute
 * @description General contribution workflow - explains contribution types and routes to the specific contribution process
 * @inputs { contributionType?: string, description?: string, additionalContext?: string }
 * @outputs { success: boolean, contributionType: string, routedTo: string, result: object, summary: string }
 *
 * General Contribution Router Process
 *
 * This is the main entry point for contributions to babysitter. It explains
 * the different ways to contribute and routes to the specific process based
 * on the user's choice.
 *
 * Phases:
 * 1. Check GitHub Auth - Verify gh CLI is authenticated
 * 2. Determine Contribution Type - Interview user or parse from inputs
 * 3. Star Repository Breakpoint - Ask if user wants to star the repo
 * 4. Route to Specific Process - Dispatch to the appropriate contribution process
 *
 * Contribution Types:
 * - star: Star the repository (handled inline)
 * - bug-report: Report a bug -> opens issue
 * - feature-request: Request a feature -> opens issue
 * - documentation-question: Ask a docs question -> opens issue
 * - bugfix: Submit a bugfix with code -> fork + PR
 * - feature-implementation: Submit feature code -> fork + PR
 * - harness-integration: Submit harness integration -> fork + PR
 * - library-contribution: Contribute processes/skills/agents -> fork + PR
 * - documentation-answer: Submit docs answer -> fork + PR
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const CONTRIBUTION_TYPES = {
  'star': { label: 'Star the repository', process: null, inline: true },
  'bug-report': { label: 'Report a bug', process: 'cradle/bug-report', inline: false },
  'feature-request': { label: 'Request a new feature', process: 'cradle/feature-request', inline: false },
  'documentation-question': { label: 'Ask a documentation question', process: 'cradle/documentation-question', inline: false },
  'bugfix': { label: 'Submit a bugfix (I have the fix)', process: 'cradle/bugfix', inline: false },
  'feature-implementation': { label: 'Submit a feature implementation (I have the code)', process: 'cradle/feature-implementation-contribute', inline: false },
  'harness-integration': { label: 'Submit a harness integration', process: 'cradle/feature-harness-integration-contribute', inline: false },
  'library-contribution': { label: 'Contribute to the process library (processes/skills/agents)', process: 'cradle/library-contribution', inline: false },
  'documentation-answer': { label: 'Submit a documentation answer', process: 'cradle/documentation-contribute-answer', inline: false }
};

export async function process(inputs, ctx) {
  const {
    contributionType = '',
    description = '',
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: CHECK GITHUB AUTH
  // ============================================================================

  ctx.log('info', 'Phase 1: Checking GitHub authentication');

  const authCheck = await ctx.task(checkGitHubAuthTask, {});

  if (!authCheck.authenticated) {
    let authLastFeedback = null;
    for (let authAttempt = 0; authAttempt < 3; authAttempt++) {
      const authApproval = await ctx.breakpoint({
        question: [
            'GitHub CLI is not authenticated. You need to authenticate to contribute.',
            '',
            'Run `gh auth login` in your terminal to authenticate, then try again.',
            '',
            'Would you like to continue anyway (some features may not work) or provide feedback?'
          ].join('\n'),
        previousFeedback: authLastFeedback || undefined,
        attempt: authAttempt > 0 ? authAttempt + 1 : undefined,
        title: 'GitHub Authentication Required',
        options: ['Approve', 'Request changes'],
        expert: 'owner',
        tags: ['approval-gate', 'auth'],
        context: { runId: ctx.runId }
      });
      if (authApproval.approved) break;
      authLastFeedback = authApproval.response || authApproval.feedback || 'Changes requested';
    }
  }

  // ============================================================================
  // PHASE 2: DETERMINE CONTRIBUTION TYPE
  // ============================================================================

  ctx.log('info', 'Phase 2: Determining contribution type');

  let selectedType = contributionType;

  if (!selectedType) {
    // Use breakpoint to ask user what kind of contribution they want
    let contribChoiceLastFeedback = null;
    for (let contribChoiceAttempt = 0; contribChoiceAttempt < 3; contribChoiceAttempt++) {
      const contributionChoice = await ctx.breakpoint({
        question: [
            'Welcome to babysitter contributions! Here are the ways you can contribute:',
            '',
            '**Quick contributions:**',
            '1. **star** - Star the repository on GitHub',
            '',
            '**Report issues (no code needed):**',
            '2. **bug-report** - Report a bug in the SDK, processes, or plugins',
            '3. **feature-request** - Request a new feature or enhancement',
            '4. **documentation-question** - Ask an unanswered documentation question',
            '',
            '**Code contributions (fork + PR):**',
            '5. **bugfix** - Submit a bugfix you\'ve already written',
            '6. **feature-implementation** - Submit a feature implementation you\'ve built',
            '7. **harness-integration** - Submit a harness integration',
            '8. **library-contribution** - Contribute processes, skills, or agents to the library',
            '9. **documentation-answer** - Submit an answer to a documentation question',
            '',
            'Which type of contribution would you like to make? (Enter the name, e.g., "bug-report")'
          ].join('\n'),
        previousFeedback: contribChoiceLastFeedback || undefined,
        attempt: contribChoiceAttempt > 0 ? contribChoiceAttempt + 1 : undefined,
        title: 'Choose Contribution Type',
        options: ['Approve', 'Request changes'],
        expert: 'owner',
        tags: ['approval-gate', 'contribution-type'],
        context: { runId: ctx.runId }
      });
      if (contributionChoice.approved) break;
      contribChoiceLastFeedback = contributionChoice.response || contributionChoice.feedback || 'Changes requested';
    }

    // The breakpoint response determines the type - analyze it
    const typeDetection = await ctx.task(detectContributionTypeTask, {
      description,
      additionalContext,
      validTypes: Object.keys(CONTRIBUTION_TYPES)
    });
    selectedType = typeDetection.detectedType;
  }

  // Normalize the type
  const normalizedType = selectedType.toLowerCase().trim().replace(/\s+/g, '-');
  const typeConfig = CONTRIBUTION_TYPES[normalizedType];

  if (!typeConfig) {
    return {
      success: false,
      contributionType: normalizedType,
      routedTo: null,
      result: null,
      summary: `Unknown contribution type: ${normalizedType}. Valid types: ${Object.keys(CONTRIBUTION_TYPES).join(', ')}`,
      metadata: { processId: 'cradle/contribute', timestamp: ctx.now() }
    };
  }

  // ============================================================================
  // PHASE 3: STAR REPOSITORY (if requested or as first-time prompt)
  // ============================================================================

  ctx.log('info', 'Phase 3: Star repository check');

  if (normalizedType === 'star' || authCheck.authenticated) {
    const starCheck = await ctx.task(checkRepoStarredTask, {
      authenticated: authCheck.authenticated
    });

    if (!starCheck.starred && authCheck.authenticated) {
      const starApproval = await ctx.breakpoint({
        question: 'Would you like to star the a5c-ai/babysitter repository on GitHub? This helps the project gain visibility.',
        title: 'Star Repository',
        context: { runId: ctx.runId }
      });

      if (starApproval.approved) {
        await ctx.task(starRepoTask, {});
      }
    }

    if (normalizedType === 'star') {
      return {
        success: true,
        contributionType: 'star',
        routedTo: null,
        result: { starred: true },
        summary: starCheck.starred
          ? 'You have already starred the repository. Thank you!'
          : 'Repository starred! Thank you for your support!',
        metadata: { processId: 'cradle/contribute', timestamp: ctx.now() }
      };
    }
  }

  // ============================================================================
  // PHASE 4: ROUTE TO SPECIFIC PROCESS
  // ============================================================================

  ctx.log('info', `Phase 4: Routing to ${typeConfig.process}`);

  const routeResult = await ctx.task(routeContributionTask, {
    contributionType: normalizedType,
    processId: typeConfig.process,
    description,
    additionalContext
  });

  return {
    success: routeResult.success,
    contributionType: normalizedType,
    routedTo: typeConfig.process,
    result: routeResult,
    summary: routeResult.summary || `Contribution routed to ${typeConfig.process}`,
    metadata: {
      processId: 'cradle/contribute',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const checkGitHubAuthTask = defineTask('check-github-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check GitHub CLI authentication',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer checking GitHub CLI authentication status',
      task: 'Check if the gh CLI is installed and authenticated',
      context: {},
      instructions: [
        'Run `gh auth status` to check authentication',
        'Parse the output to determine if the user is authenticated',
        'Also check the authenticated username and scopes',
        'If gh is not installed, return authenticated: false with appropriate message',
        'Return the authentication status'
      ],
      outputFormat: 'JSON with authenticated (boolean), username (string), scopes (array of strings), message (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['authenticated'],
      properties: {
        authenticated: { type: 'boolean' },
        username: { type: 'string' },
        scopes: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contribute', 'auth']
}));

export const detectContributionTypeTask = defineTask('detect-contribution-type', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect contribution type from user input',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Input classifier determining the type of contribution from user description',
      task: 'Analyze the user\'s description and context to determine which contribution type they want',
      context: {
        description: args.description,
        additionalContext: args.additionalContext,
        validTypes: args.validTypes
      },
      instructions: [
        'Analyze the description and additionalContext to determine the contribution type',
        'Map common phrases to types:',
        '  - "bug", "broken", "error", "crash" -> bug-report',
        '  - "feature", "add", "new", "enhance" -> feature-request',
        '  - "how to", "question", "docs", "documentation" -> documentation-question',
        '  - "fix", "patch", "I fixed" -> bugfix',
        '  - "implemented", "I built", "code for" -> feature-implementation',
        '  - "harness", "integration" -> harness-integration',
        '  - "process", "skill", "agent", "library" -> library-contribution',
        '  - "answer", "documentation answer" -> documentation-answer',
        '  - "star" -> star',
        'If unclear, default to "bug-report" for issues or "bugfix" for code contributions',
        'Return the detected type'
      ],
      outputFormat: 'JSON with detectedType (string from validTypes), confidence (number 0-1), reasoning (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['detectedType'],
      properties: {
        detectedType: { type: 'string' },
        confidence: { type: 'number' },
        reasoning: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contribute', 'classify']
}));

export const checkRepoStarredTask = defineTask('check-repo-starred', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check if repo is starred',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent checking star status',
      task: 'Check if the user has already starred the a5c-ai/babysitter repository',
      context: {
        authenticated: args.authenticated
      },
      instructions: [
        'If not authenticated, return starred: false, checkable: false',
        'Use `gh api user/starred/a5c-ai/babysitter` to check star status',
        'A 204 response means starred, 404 means not starred',
        'Return the star status'
      ],
      outputFormat: 'JSON with starred (boolean), checkable (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['starred'],
      properties: {
        starred: { type: 'boolean' },
        checkable: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contribute', 'star-check']
}));

export const starRepoTask = defineTask('star-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Star the repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent starring the repository',
      task: 'Star the a5c-ai/babysitter repository on GitHub',
      context: {},
      instructions: [
        'Use `gh api -X PUT user/starred/a5c-ai/babysitter` to star the repo',
        'A 204 response means success',
        'Return the result'
      ],
      outputFormat: 'JSON with success (boolean), message (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contribute', 'star', 'github']
}));

export const routeContributionTask = defineTask('route-contribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Route to ${args.processId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contribution router dispatching to the specific contribution process',
      task: `Execute the ${args.processId} contribution process with the user's details`,
      context: {
        contributionType: args.contributionType,
        processId: args.processId,
        description: args.description,
        additionalContext: args.additionalContext
      },
      instructions: [
        `This contribution has been routed to the ${args.processId} process.`,
        'The specific process will handle:',
        args.contributionType.includes('bug') || args.contributionType.includes('feature-request') || args.contributionType.includes('documentation-question')
          ? '- Gathering details, searching for duplicates, composing and submitting a GitHub issue'
          : '- Forking the repo, creating a branch, applying changes, running tests, and submitting a PR',
        '',
        'Pass the description and context to the routed process.',
        'The routed process will handle all breakpoints and GitHub interactions.',
        'Return a summary of the routing action.'
      ],
      outputFormat: 'JSON with success (boolean), routedTo (string), summary (string), nextSteps (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'routedTo'],
      properties: {
        success: { type: 'boolean' },
        routedTo: { type: 'string' },
        summary: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contribute', 'route']
}));
