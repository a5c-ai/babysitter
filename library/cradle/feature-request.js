/**
 * @process cradle/feature-request
 * @description Request a new feature for babysitter by gathering details, use cases, impact analysis, and opening a GitHub issue
 * @inputs { featureDescription?: string, component?: string, useCase?: string, additionalContext?: string }
 * @outputs { success: boolean, issueUrl: string, issueNumber: number, summary: string }
 *
 * Feature Request Contribution Process
 *
 * Phases:
 * 1. Gather Feature Details - Collect feature description, component, priority, use cases
 * 2. Use Case & Impact Analysis - Analyze use cases and assess impact on existing functionality
 * 3. Search Existing Issues/PRs - Check if a similar feature request or PR already exists
 * 4. Compose Issue - Build the GitHub feature request issue body
 * 5. Review Breakpoint - Let user review the request before submission
 * 6. Submit Issue - Open the feature request on a5c-ai/babysitter GitHub (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    featureDescription = '',
    component = '',
    useCase = '',
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: GATHER FEATURE DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering feature details');

  let featureDetails = await ctx.task(gatherFeatureDetailsTask, {
    featureDescription,
    component,
    useCase,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: USE CASE & IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing use cases and impact');

  const [useCaseAnalysis, impactAnalysis] = await ctx.parallel.all([
    () => ctx.task(analyzeUseCasesTask, {
      featureDescription: featureDetails.description,
      component: featureDetails.component,
      useCase: featureDetails.useCase,
      userStories: featureDetails.userStories
    }),
    () => ctx.task(analyzeImpactTask, {
      featureDescription: featureDetails.description,
      component: featureDetails.component,
      affectedAreas: featureDetails.affectedAreas
    })
  ]);

  // ============================================================================
  // PHASE 3: SEARCH EXISTING ISSUES/PRS
  // ============================================================================

  ctx.log('info', 'Phase 3: Searching for existing feature requests and PRs');

  const existingResults = await ctx.task(searchExistingTask, {
    featureDescription: featureDetails.description,
    component: featureDetails.component,
    keywords: featureDetails.keywords
  });

  if (existingResults.duplicateFound) {
    let dupLastFeedback = null;
    for (let dupAttempt = 0; dupAttempt < 3; dupAttempt++) {
      if (dupLastFeedback) {
        featureDetails = await ctx.task(gatherFeatureDetailsTask, {
          featureDescription,
          component,
          useCase,
          additionalContext,
          feedback: dupLastFeedback,
          attempt: dupAttempt + 1
        });
      }
      const duplicateApproval = await ctx.breakpoint({
        question: [
            'A similar feature request or PR may already exist:',
            '',
            ...existingResults.matches.map(m => `- ${m.type} #${m.number}: ${m.title} (${m.state})`),
            '',
            'Would you like to continue creating a new feature request, add to an existing one, or provide feedback?'
          ].join('\n'),
        previousFeedback: dupLastFeedback || undefined,
        attempt: dupAttempt > 0 ? dupAttempt + 1 : undefined,
        title: 'Potential Duplicate Feature Request Found',
        options: ['Approve', 'Request changes'],
        expert: 'owner',
        tags: ['approval-gate', 'duplicate-check'],
        context: { runId: ctx.runId }
      });
      if (duplicateApproval.approved) break;
      dupLastFeedback = duplicateApproval.response || duplicateApproval.feedback || 'Changes requested';
    }
  }

  // ============================================================================
  // PHASE 4: COMPOSE ISSUE
  // ============================================================================

  ctx.log('info', 'Phase 4: Composing feature request issue');

  const issueComposition = await ctx.task(composeFeatureIssueTask, {
    featureDetails,
    useCaseAnalysis,
    impactAnalysis,
    existingResults
  });

  // ============================================================================
  // PHASE 5: REVIEW BREAKPOINT
  // ============================================================================

  let reviewLastFeedback = null;
  let currentIssueComposition = issueComposition;
  for (let reviewAttempt = 0; reviewAttempt < 3; reviewAttempt++) {
    if (reviewLastFeedback) {
      currentIssueComposition = await ctx.task(composeFeatureIssueTask, {
        featureDetails,
        useCaseAnalysis,
        impactAnalysis,
        existingResults,
        feedback: reviewLastFeedback,
        attempt: reviewAttempt + 1
      });
    }
    const reviewApproval = await ctx.breakpoint({
      question: [
          'Please review the feature request before submission:',
          '',
          `**Title:** ${currentIssueComposition.title}`,
          '',
          '**Labels:** ' + currentIssueComposition.labels.join(', '),
          '',
          '**Body preview:**',
          currentIssueComposition.bodyPreview,
          '',
          'Approve to submit this feature request to a5c-ai/babysitter, or request changes.'
        ].join('\n'),
      previousFeedback: reviewLastFeedback || undefined,
      attempt: reviewAttempt > 0 ? reviewAttempt + 1 : undefined,
      title: 'Review Feature Request Before Submission',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'review'],
      context: { runId: ctx.runId }
    });
    if (reviewApproval.approved) break;
    reviewLastFeedback = reviewApproval.response || reviewApproval.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 6: SUBMIT ISSUE
  // ============================================================================

  ctx.log('info', 'Phase 6: Submitting feature request to GitHub');

  let submitLastFeedback = null;
  for (let submitAttempt = 0; submitAttempt < 3; submitAttempt++) {
    const submitApproval = await ctx.breakpoint({
      question: 'Confirm: Open this feature request on a5c-ai/babysitter GitHub repository?',
      previousFeedback: submitLastFeedback || undefined,
      attempt: submitAttempt > 0 ? submitAttempt + 1 : undefined,
      title: 'Confirm GitHub Feature Request Submission',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'submit'],
      context: { runId: ctx.runId }
    });
    if (submitApproval.approved) break;
    submitLastFeedback = submitApproval.response || submitApproval.feedback || 'Changes requested';
  }

  const submitResult = await ctx.task(submitFeatureIssueTask, {
    title: issueComposition.title,
    body: issueComposition.body,
    labels: issueComposition.labels
  });

  return {
    success: submitResult.success,
    issueUrl: submitResult.issueUrl,
    issueNumber: submitResult.issueNumber,
    summary: `Feature request submitted: ${submitResult.issueUrl}`,
    metadata: {
      processId: 'cradle/feature-request',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatherFeatureDetailsTask = defineTask('gather-feature-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather feature request details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product analyst gathering structured feature request information',
      task: 'Analyze the provided feature description and extract structured details including component, priority, use cases, user stories, and affected areas',
      context: {
        featureDescription: args.featureDescription,
        component: args.component,
        useCase: args.useCase,
        additionalContext: args.additionalContext,
        validComponents: ['sdk', 'cli', 'runtime', 'storage', 'tasks', 'hooks', 'testing', 'config', 'processes', 'plugins', 'catalog', 'documentation', 'harness']
      },
      instructions: [
        'If featureDescription is empty, analyze the additionalContext to extract feature details',
        'Identify the affected component from the valid components list',
        'Determine priority: critical (blocking many users), high (significant improvement), medium (nice to have), low (minor enhancement)',
        'Extract or infer user stories in the format "As a <role>, I want <feature> so that <benefit>"',
        'Identify affected areas of the codebase',
        'Extract keywords for duplicate searching',
        'Return structured feature details'
      ],
      outputFormat: 'JSON with description (string), component (string), priority (string), useCase (string), userStories (array of strings), affectedAreas (array of strings), keywords (array of strings), labels (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['description', 'component', 'priority'],
      properties: {
        description: { type: 'string' },
        component: { type: 'string' },
        priority: { type: 'string' },
        useCase: { type: 'string' },
        userStories: { type: 'array', items: { type: 'string' } },
        affectedAreas: { type: 'array', items: { type: 'string' } },
        keywords: { type: 'array', items: { type: 'string' } },
        labels: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feature-request', 'gather']
}));

export const analyzeUseCasesTask = defineTask('analyze-use-cases', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze feature use cases',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product manager analyzing feature use cases and user stories',
      task: 'Analyze and expand use cases for the requested feature, identifying primary and secondary beneficiaries',
      context: {
        featureDescription: args.featureDescription,
        component: args.component,
        useCase: args.useCase,
        userStories: args.userStories
      },
      instructions: [
        'Expand on the provided use cases with concrete scenarios',
        'Identify primary users who would benefit from this feature',
        'Identify secondary users or downstream benefits',
        'Describe how the feature fits into existing workflows',
        'Suggest acceptance criteria for the feature',
        'Return structured use case analysis'
      ],
      outputFormat: 'JSON with primaryUseCases (array of strings), secondaryUseCases (array of strings), beneficiaries (array of strings), workflowFit (string), acceptanceCriteria (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryUseCases', 'acceptanceCriteria'],
      properties: {
        primaryUseCases: { type: 'array', items: { type: 'string' } },
        secondaryUseCases: { type: 'array', items: { type: 'string' } },
        beneficiaries: { type: 'array', items: { type: 'string' } },
        workflowFit: { type: 'string' },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feature-request', 'use-cases']
}));

export const analyzeImpactTask = defineTask('analyze-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze feature impact',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software architect assessing the impact of a proposed feature',
      task: 'Analyze the potential impact of implementing this feature on the existing codebase and users',
      context: {
        featureDescription: args.featureDescription,
        component: args.component,
        affectedAreas: args.affectedAreas
      },
      instructions: [
        'Assess impact on existing functionality (breaking changes, backward compatibility)',
        'Estimate complexity: low (simple addition), medium (moderate changes), high (architectural changes)',
        'Identify potential risks or concerns',
        'Suggest implementation approach at a high level',
        'Assess whether this could be contributed by the community or requires core team work',
        'Return structured impact analysis'
      ],
      outputFormat: 'JSON with breakingChanges (boolean), complexity (string), risks (array of strings), implementationApproach (string), communityContributable (boolean), estimatedEffort (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['breakingChanges', 'complexity'],
      properties: {
        breakingChanges: { type: 'boolean' },
        complexity: { type: 'string' },
        risks: { type: 'array', items: { type: 'string' } },
        implementationApproach: { type: 'string' },
        communityContributable: { type: 'boolean' },
        estimatedEffort: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feature-request', 'impact']
}));

export const searchExistingTask = defineTask('search-existing-features', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search existing feature requests and PRs',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub researcher checking for duplicate feature requests and related PRs',
      task: 'Search the a5c-ai/babysitter GitHub repository for existing feature requests and PRs that match the proposed feature',
      context: {
        featureDescription: args.featureDescription,
        component: args.component,
        keywords: args.keywords
      },
      instructions: [
        'Use `gh issue list --repo a5c-ai/babysitter --search "<keywords>" --label "enhancement" --json number,title,state,url` to search issues',
        'Use `gh pr list --repo a5c-ai/babysitter --search "<keywords>" --json number,title,state,url` to search PRs',
        'Search with key terms from the feature description and keywords',
        'Check both open and closed items',
        'Return whether a potential duplicate was found and the matching items',
        'If gh is not authenticated or fails, return duplicateFound: false with empty matches'
      ],
      outputFormat: 'JSON with duplicateFound (boolean), matches (array of {type: "issue"|"pr", number, title, state, url}), searchTerms (array of strings)'
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
  labels: ['agent', 'feature-request', 'search']
}));

export const composeFeatureIssueTask = defineTask('compose-feature-issue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose feature request issue',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer composing a well-structured GitHub feature request',
      task: 'Compose a complete GitHub feature request issue with title, body, and labels from the gathered information',
      context: {
        featureDetails: args.featureDetails,
        useCaseAnalysis: args.useCaseAnalysis,
        impactAnalysis: args.impactAnalysis,
        existingResults: args.existingResults
      },
      instructions: [
        'Create a clear, concise issue title following the pattern: [Component] Feature: Brief description',
        'Compose the issue body using this template:',
        '  ## Feature Description',
        '  <clear description of the feature>',
        '  ',
        '  ## Use Cases',
        '  <bullet list of use cases>',
        '  ',
        '  ## User Stories',
        '  <user stories in As a / I want / So that format>',
        '  ',
        '  ## Impact Analysis',
        '  - Breaking changes: yes/no',
        '  - Complexity: low/medium/high',
        '  - Community contributable: yes/no',
        '  ',
        '  ## Acceptance Criteria',
        '  <checklist of acceptance criteria>',
        '  ',
        '  ## Additional Context',
        '  <any extra info, related issues, alternatives considered>',
        '',
        'Include labels: enhancement, component label, priority label',
        'Generate a bodyPreview (first 500 chars) for the review breakpoint',
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
  labels: ['agent', 'feature-request', 'compose']
}));

export const submitFeatureIssueTask = defineTask('submit-feature-issue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit feature request to GitHub',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent submitting a feature request issue',
      task: 'Submit the composed feature request as a GitHub issue to the a5c-ai/babysitter repository',
      context: {
        title: args.title,
        body: args.body,
        labels: args.labels
      },
      instructions: [
        'Use the gh CLI to create the issue:',
        'gh issue create --repo a5c-ai/babysitter --title "<title>" --body "<body>" --label "<labels>"',
        'Use a heredoc for the body to handle multi-line content',
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
  labels: ['agent', 'feature-request', 'submit', 'github']
}));
