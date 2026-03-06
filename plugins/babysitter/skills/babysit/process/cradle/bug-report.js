/**
 * @process cradle/bug-report
 * @description Report a bug in babysitter (SDK, processes, plugins) by gathering details, searching existing issues, and opening a GitHub issue
 * @inputs { bugDescription?: string, component?: string, reproSteps?: string, additionalContext?: string }
 * @outputs { success: boolean, issueUrl: string, issueNumber: number, summary: string }
 *
 * Bug Report Contribution Process
 *
 * Phases:
 * 1. Gather Bug Details - Collect bug description, component, severity, expected/actual behavior
 * 2. Reproduction Steps - Gather or generate reproduction steps and environment info
 * 3. Search Existing Issues - Check if a similar issue already exists on GitHub
 * 4. Compose Issue - Build the GitHub issue body with all gathered information
 * 5. Review Breakpoint - Let user review the issue before submission
 * 6. Submit Issue - Open the issue on a5c-ai/babysitter GitHub (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    bugDescription = '',
    component = '',
    reproSteps = '',
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: GATHER BUG DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering bug details');

  const bugDetails = await ctx.task(gatherBugDetailsTask, {
    bugDescription,
    component,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: REPRODUCTION STEPS & ENVIRONMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Gathering reproduction steps and environment info');

  const [reproResult, envInfo] = await ctx.parallel.all([
    () => ctx.task(gatherReproStepsTask, {
      bugDescription: bugDetails.description,
      component: bugDetails.component,
      reproSteps
    }),
    () => ctx.task(gatherEnvironmentInfoTask, {
      component: bugDetails.component
    })
  ]);

  // ============================================================================
  // PHASE 3: SEARCH EXISTING ISSUES
  // ============================================================================

  ctx.log('info', 'Phase 3: Searching for existing similar issues');

  const existingIssues = await ctx.task(searchExistingIssuesTask, {
    bugDescription: bugDetails.description,
    component: bugDetails.component,
    labels: bugDetails.labels
  });

  if (existingIssues.duplicateFound) {
    await ctx.breakpoint({
      question: [
        'A similar issue may already exist:',
        '',
        ...existingIssues.matches.map(m => `- #${m.number}: ${m.title} (${m.state})`),
        '',
        'Would you like to:',
        '1. Continue creating a new issue anyway',
        '2. Add a comment to an existing issue instead',
        '3. Cancel the bug report'
      ].join('\n'),
      title: 'Potential Duplicate Issue Found',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 4: COMPOSE ISSUE
  // ============================================================================

  ctx.log('info', 'Phase 4: Composing GitHub issue');

  const issueComposition = await ctx.task(composeIssueTask, {
    bugDetails,
    reproResult,
    envInfo,
    existingIssues
  });

  // ============================================================================
  // PHASE 5: REVIEW BREAKPOINT
  // ============================================================================

  await ctx.breakpoint({
    question: [
      'Please review the bug report before submission:',
      '',
      `**Title:** ${issueComposition.title}`,
      '',
      '**Labels:** ' + issueComposition.labels.join(', '),
      '',
      '**Body preview:**',
      issueComposition.bodyPreview,
      '',
      'Approve to submit this issue to a5c-ai/babysitter, or reject to cancel.'
    ].join('\n'),
    title: 'Review Bug Report Before Submission',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 6: SUBMIT ISSUE
  // ============================================================================

  ctx.log('info', 'Phase 6: Submitting issue to GitHub');

  await ctx.breakpoint({
    question: 'Confirm: Open this issue on a5c-ai/babysitter GitHub repository?',
    title: 'Confirm GitHub Issue Submission',
    context: { runId: ctx.runId }
  });

  const submitResult = await ctx.task(submitIssueTask, {
    title: issueComposition.title,
    body: issueComposition.body,
    labels: issueComposition.labels
  });

  return {
    success: submitResult.success,
    issueUrl: submitResult.issueUrl,
    issueNumber: submitResult.issueNumber,
    summary: `Bug report submitted: ${submitResult.issueUrl}`,
    metadata: {
      processId: 'cradle/bug-report',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatherBugDetailsTask = defineTask('gather-bug-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather bug details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Bug report analyst gathering structured bug information',
      task: 'Analyze the provided bug description and extract structured bug details including component, severity, expected vs actual behavior, and suggested labels',
      context: {
        bugDescription: args.bugDescription,
        component: args.component,
        additionalContext: args.additionalContext,
        validComponents: ['sdk', 'cli', 'runtime', 'storage', 'tasks', 'hooks', 'testing', 'config', 'processes', 'plugins', 'catalog', 'documentation']
      },
      instructions: [
        'If bugDescription is empty, analyze the additionalContext to extract bug details',
        'Identify the affected component from the valid components list',
        'Determine severity: critical (crash/data loss), high (major feature broken), medium (feature partially broken), low (cosmetic/minor)',
        'Extract or infer expected behavior vs actual behavior',
        'Suggest GitHub labels based on component and severity',
        'Return structured bug details'
      ],
      outputFormat: 'JSON with description (string), component (string), severity (string), expectedBehavior (string), actualBehavior (string), labels (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['description', 'component', 'severity'],
      properties: {
        description: { type: 'string' },
        component: { type: 'string' },
        severity: { type: 'string' },
        expectedBehavior: { type: 'string' },
        actualBehavior: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bug-report', 'gather']
}));

export const gatherReproStepsTask = defineTask('gather-repro-steps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather reproduction steps',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer building clear reproduction steps for a bug report',
      task: 'Create clear, numbered reproduction steps for the reported bug',
      context: {
        bugDescription: args.bugDescription,
        component: args.component,
        reproSteps: args.reproSteps
      },
      instructions: [
        'If reproSteps are already provided, validate and clean them up',
        'If not provided, generate likely reproduction steps based on the bug description and component',
        'Steps should be numbered, specific, and actionable',
        'Include any prerequisites (installed packages, configuration, etc.)',
        'Include the exact command or action that triggers the bug',
        'Return formatted reproduction steps'
      ],
      outputFormat: 'JSON with steps (array of strings), prerequisites (array of strings), triggerCommand (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['steps'],
      properties: {
        steps: { type: 'array', items: { type: 'string' } },
        prerequisites: { type: 'array', items: { type: 'string' } },
        triggerCommand: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bug-report', 'repro']
}));

export const gatherEnvironmentInfoTask = defineTask('gather-environment-info', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather environment information',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems engineer collecting environment information for a bug report',
      task: 'Collect the current environment information relevant to the bug report',
      context: {
        component: args.component
      },
      instructions: [
        'Run `babysitter --version` to get the SDK version',
        'Run `node --version` to get the Node.js version',
        'Run `npm --version` to get the npm version',
        'Detect the OS and platform',
        'Check if running in a git repository',
        'If component is cli or sdk, check the installed package version in node_modules',
        'Return structured environment info'
      ],
      outputFormat: 'JSON with sdkVersion (string), nodeVersion (string), npmVersion (string), os (string), platform (string), shell (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['sdkVersion', 'nodeVersion', 'os'],
      properties: {
        sdkVersion: { type: 'string' },
        nodeVersion: { type: 'string' },
        npmVersion: { type: 'string' },
        os: { type: 'string' },
        platform: { type: 'string' },
        shell: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bug-report', 'environment']
}));

export const searchExistingIssuesTask = defineTask('search-existing-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search existing GitHub issues',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub issue researcher checking for duplicate bug reports',
      task: 'Search the a5c-ai/babysitter GitHub repository for existing issues that match the reported bug',
      context: {
        bugDescription: args.bugDescription,
        component: args.component,
        labels: args.labels
      },
      instructions: [
        'Use `gh issue list --repo a5c-ai/babysitter --search "<keywords>" --json number,title,state,labels,url` to search for similar issues',
        'Search with key terms from the bug description',
        'Also search with the component name as a label filter',
        'Check both open and closed issues',
        'Return whether a potential duplicate was found and the matching issues',
        'If gh is not authenticated or fails, return duplicateFound: false with an empty matches array'
      ],
      outputFormat: 'JSON with duplicateFound (boolean), matches (array of {number, title, state, url}), searchTerms (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['duplicateFound', 'matches'],
      properties: {
        duplicateFound: { type: 'boolean' },
        matches: { type: 'array', items: { type: 'object' } },
        searchTerms: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bug-report', 'search']
}));

export const composeIssueTask = defineTask('compose-issue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose GitHub issue',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer composing a well-structured GitHub bug report issue',
      task: 'Compose a complete GitHub issue with title, body, and labels from the gathered bug information',
      context: {
        bugDetails: args.bugDetails,
        reproResult: args.reproResult,
        envInfo: args.envInfo,
        existingIssues: args.existingIssues
      },
      instructions: [
        'Create a clear, concise issue title following the pattern: [Component] Brief description of the bug',
        'Compose the issue body using this template:',
        '  ## Bug Description',
        '  <clear description>',
        '  ',
        '  ## Expected Behavior',
        '  <what should happen>',
        '  ',
        '  ## Actual Behavior',
        '  <what actually happens>',
        '  ',
        '  ## Steps to Reproduce',
        '  <numbered steps>',
        '  ',
        '  ## Environment',
        '  - SDK Version: ...',
        '  - Node.js: ...',
        '  - OS: ...',
        '  ',
        '  ## Additional Context',
        '  <any extra info>',
        '',
        'Include appropriate labels: bug, component label, severity label',
        'Also generate a shorter bodyPreview (first 500 chars) for the review breakpoint',
        'Return the complete issue composition'
      ],
      outputFormat: 'JSON with title (string), body (string), bodyPreview (string), labels (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'body', 'labels'],
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        bodyPreview: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bug-report', 'compose']
}));

export const submitIssueTask = defineTask('submit-issue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit bug report to GitHub',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent submitting a bug report issue',
      task: 'Submit the composed bug report as a GitHub issue to the a5c-ai/babysitter repository',
      context: {
        title: args.title,
        body: args.body,
        labels: args.labels
      },
      instructions: [
        'Use the gh CLI to create the issue:',
        'gh issue create --repo a5c-ai/babysitter --title "<title>" --body "<body>" --label "<label1>,<label2>"',
        'Use a heredoc for the body to handle multi-line content properly',
        'If label creation fails (labels may not exist), retry without labels',
        'Capture the issue URL and number from the output',
        'If gh is not authenticated, return success: false with an error message',
        'Return the submission result'
      ],
      outputFormat: 'JSON with success (boolean), issueUrl (string), issueNumber (number), error (string, only if failed)'
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        issueUrl: { type: 'string' },
        issueNumber: { type: 'number' },
        error: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bug-report', 'submit', 'github']
}));
