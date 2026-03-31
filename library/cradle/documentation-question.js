/**
 * @process cradle/documentation-question
 * @description Ask an unanswered documentation question by searching existing docs and issues, then opening a GitHub issue with docs label
 * @inputs { question?: string, topic?: string, searchedAlready?: boolean, additionalContext?: string }
 * @outputs { success: boolean, issueUrl: string, issueNumber: number, existingAnswer: string, summary: string }
 *
 * Documentation Question Contribution Process
 *
 * Phases:
 * 1. Gather Question Details - Collect the documentation question and topic area
 * 2. Search Existing Documentation - Search repo docs, README, CLAUDE.md, SDK docs for answers
 * 3. Search Existing Issues - Check if this question was already asked on GitHub
 * 4. Answer Check Breakpoint - If answer found, present it; if not, proceed to issue creation
 * 5. Compose Issue - Build the GitHub documentation question issue
 * 6. Review Breakpoint - Let user review before submission
 * 7. Submit Issue - Open the issue on a5c-ai/babysitter with documentation label (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    question = '',
    topic = '',
    searchedAlready = false,
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: GATHER QUESTION DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering documentation question details');

  const questionDetails = await ctx.task(gatherQuestionDetailsTask, {
    question,
    topic,
    additionalContext
  });

  // ============================================================================
  // PHASE 2 & 3: SEARCH EXISTING DOCS AND ISSUES (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 2-3: Searching existing documentation and issues');

  const [docSearchResult, issueSearchResult] = await ctx.parallel.all([
    () => ctx.task(searchExistingDocsTask, {
      question: questionDetails.question,
      topic: questionDetails.topic,
      keywords: questionDetails.keywords,
      searchedAlready
    }),
    () => ctx.task(searchExistingDocIssuesTask, {
      question: questionDetails.question,
      topic: questionDetails.topic,
      keywords: questionDetails.keywords
    })
  ]);

  // ============================================================================
  // PHASE 4: ANSWER CHECK BREAKPOINT
  // ============================================================================

  if (docSearchResult.answerFound || issueSearchResult.answerFound) {
    const existingAnswer = docSearchResult.answerFound
      ? docSearchResult.answer
      : issueSearchResult.answer;

    let answerCheckLastFeedback = null;
    let answerCheckApproved = false;
    for (let answerCheckAttempt = 0; answerCheckAttempt < 3; answerCheckAttempt++) {
      const answerCheckResult = await ctx.breakpoint({
        question: [
            'We found an existing answer to your question:',
            '',
            `**Source:** ${docSearchResult.answerFound ? docSearchResult.source : issueSearchResult.source}`,
            '',
            `**Answer:** ${existingAnswer}`,
            '',
            'Would you like to:',
            '1. Accept this answer (no issue needed)',
            '2. This doesn\'t fully answer my question - create an issue anyway'
          ].join('\n'),
        previousFeedback: answerCheckLastFeedback || undefined,
        attempt: answerCheckAttempt > 0 ? answerCheckAttempt + 1 : undefined,
        title: 'Existing Answer Found',
        options: ['Approve', 'Request changes'],
        expert: 'owner',
        tags: ['approval-gate', 'answer-check'],
        context: { runId: ctx.runId }
      });
      if (answerCheckResult.approved) {
        answerCheckApproved = true;
        break;
      }
      answerCheckLastFeedback = answerCheckResult.response || answerCheckResult.feedback || 'Changes requested';
    }
    if (!answerCheckApproved) {
      // After 3 attempts, accept the existing answer gracefully
      return { success: true, existingAnswer, reason: 'Existing answer provided after review', feedback: answerCheckLastFeedback };
    }
  }

  if (issueSearchResult.duplicateFound) {
    let dupLastFeedback = null;
    for (let dupAttempt = 0; dupAttempt < 3; dupAttempt++) {
      const duplicateApproval = await ctx.breakpoint({
        question: [
            'A similar documentation question may already be open:',
            '',
            ...issueSearchResult.matches.map(m => `- #${m.number}: ${m.title} (${m.state})`),
            '',
            'Would you like to continue creating a new issue, or provide feedback?'
          ].join('\n'),
        previousFeedback: dupLastFeedback || undefined,
        attempt: dupAttempt > 0 ? dupAttempt + 1 : undefined,
        title: 'Potential Duplicate Question Found',
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
  // PHASE 5: COMPOSE ISSUE
  // ============================================================================

  ctx.log('info', 'Phase 5: Composing documentation question issue');

  const issueComposition = await ctx.task(composeDocQuestionIssueTask, {
    questionDetails,
    docSearchResult,
    issueSearchResult
  });

  // ============================================================================
  // PHASE 6: REVIEW BREAKPOINT
  // ============================================================================

  let reviewLastFeedback = null;
  let currentIssueComposition = issueComposition;
  for (let reviewAttempt = 0; reviewAttempt < 3; reviewAttempt++) {
    if (reviewLastFeedback) {
      currentIssueComposition = await ctx.task(composeDocQuestionIssueTask, {
        questionDetails,
        docSearchResult,
        issueSearchResult,
        feedback: reviewLastFeedback,
        attempt: reviewAttempt + 1
      });
    }
    const reviewApproval = await ctx.breakpoint({
      question: [
          'Please review the documentation question before submission:',
          '',
          `**Title:** ${currentIssueComposition.title}`,
          '',
          '**Labels:** ' + currentIssueComposition.labels.join(', '),
          '',
          '**Body preview:**',
          currentIssueComposition.bodyPreview,
          '',
          'Approve to submit this question to a5c-ai/babysitter, or request changes.'
        ].join('\n'),
      previousFeedback: reviewLastFeedback || undefined,
      attempt: reviewAttempt > 0 ? reviewAttempt + 1 : undefined,
      title: 'Review Documentation Question Before Submission',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'review'],
      context: { runId: ctx.runId }
    });
    if (reviewApproval.approved) break;
    reviewLastFeedback = reviewApproval.response || reviewApproval.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 7: SUBMIT ISSUE
  // ============================================================================

  ctx.log('info', 'Phase 7: Submitting documentation question to GitHub');

  let submitLastFeedback = null;
  for (let submitAttempt = 0; submitAttempt < 3; submitAttempt++) {
    const submitApproval = await ctx.breakpoint({
      question: 'Confirm: Open this documentation question on a5c-ai/babysitter GitHub repository?',
      previousFeedback: submitLastFeedback || undefined,
      attempt: submitAttempt > 0 ? submitAttempt + 1 : undefined,
      title: 'Confirm GitHub Issue Submission',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'submit'],
      context: { runId: ctx.runId }
    });
    if (submitApproval.approved) break;
    submitLastFeedback = submitApproval.response || submitApproval.feedback || 'Changes requested';
  }

  const submitResult = await ctx.task(submitDocQuestionTask, {
    title: issueComposition.title,
    body: issueComposition.body,
    labels: issueComposition.labels
  });

  return {
    success: submitResult.success,
    issueUrl: submitResult.issueUrl,
    issueNumber: submitResult.issueNumber,
    existingAnswer: docSearchResult.answerFound ? docSearchResult.answer : null,
    summary: submitResult.success
      ? `Documentation question submitted: ${submitResult.issueUrl}`
      : `Submission failed: ${submitResult.error}`,
    metadata: {
      processId: 'cradle/documentation-question',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatherQuestionDetailsTask = defineTask('gather-question-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather documentation question details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation analyst structuring a documentation question',
      task: 'Analyze the provided question and extract structured details including topic area, keywords, and what documentation is expected',
      context: {
        question: args.question,
        topic: args.topic,
        additionalContext: args.additionalContext,
        validTopics: ['sdk', 'cli', 'runtime', 'storage', 'tasks', 'hooks', 'testing', 'config', 'processes', 'plugins', 'methodologies', 'specializations', 'harness', 'orchestration', 'getting-started', 'api']
      },
      instructions: [
        'If question is empty, analyze additionalContext to form a clear question',
        'Identify the documentation topic area from validTopics',
        'Extract keywords for searching existing docs and issues',
        'Identify what kind of documentation is expected (tutorial, API reference, example, explanation)',
        'Return structured question details'
      ],
      outputFormat: 'JSON with question (string), topic (string), keywords (array of strings), expectedDocType (string), docAreas (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['question', 'topic', 'keywords'],
      properties: {
        question: { type: 'string' },
        topic: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
        expectedDocType: { type: 'string' },
        docAreas: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation-question', 'gather']
}));

export const searchExistingDocsTask = defineTask('search-existing-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search existing documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation researcher searching for existing answers in the babysitter repo',
      task: 'Search the babysitter repository documentation for an answer to the user\'s question',
      context: {
        question: args.question,
        topic: args.topic,
        keywords: args.keywords,
        searchedAlready: args.searchedAlready
      },
      instructions: [
        'Search these documentation sources:',
        '  - CLAUDE.md (project instructions)',
        '  - packages/sdk/sdk.md (SDK API reference)',
        '  - README.md files in relevant packages',
        '  - plugins/babysitter/skills/babysit/SKILL.md (babysit skill docs)',
        '  - library/reference/ (advanced patterns)',
        '  - CHANGELOG.md (for recent changes)',
        'Use grep/glob to search for keywords in .md files',
        'If an answer is found, extract and summarize it with the source location',
        'If searchedAlready is true, focus on less obvious documentation locations',
        'Return whether an answer was found and the answer content'
      ],
      outputFormat: 'JSON with answerFound (boolean), answer (string, the answer text if found), source (string, file path where found), relatedDocs (array of strings, other relevant doc paths)'
    },
    outputSchema: {
      type: 'object',
      required: ['answerFound'],
      properties: {
        answerFound: { type: 'boolean' },
        answer: { type: 'string' },
        source: { type: 'string' },
        relatedDocs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation-question', 'search-docs']
}));

export const searchExistingDocIssuesTask = defineTask('search-existing-doc-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search existing documentation issues',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub researcher checking for existing documentation questions and answers',
      task: 'Search the a5c-ai/babysitter GitHub repository for existing documentation questions that match',
      context: {
        question: args.question,
        topic: args.topic,
        keywords: args.keywords
      },
      instructions: [
        'Use `gh issue list --repo a5c-ai/babysitter --search "<keywords>" --label "documentation" --json number,title,state,url,body` to search',
        'Also search without label filter for broader matches',
        'Check both open and closed issues - closed issues may have answers in comments',
        'If a closed issue has an answer, extract it',
        'Return whether a duplicate or answer was found',
        'If gh is not authenticated or fails, return answerFound: false, duplicateFound: false'
      ],
      outputFormat: 'JSON with answerFound (boolean), answer (string), source (string), duplicateFound (boolean), matches (array of {number, title, state, url})'
    },
    outputSchema: {
      type: 'object',
      required: ['answerFound', 'duplicateFound'],
      properties: {
        answerFound: { type: 'boolean' },
        answer: { type: 'string' },
        source: { type: 'string' },
        duplicateFound: { type: 'boolean' },
        matches: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation-question', 'search-issues']
}));

export const composeDocQuestionIssueTask = defineTask('compose-doc-question-issue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose documentation question issue',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer composing a well-structured documentation question issue',
      task: 'Compose a GitHub issue for the unanswered documentation question',
      context: {
        questionDetails: args.questionDetails,
        docSearchResult: args.docSearchResult,
        issueSearchResult: args.issueSearchResult
      },
      instructions: [
        'Create a clear issue title following the pattern: [Docs] Question: Brief question summary',
        'Compose the issue body using this template:',
        '  ## Documentation Question',
        '  <clear question>',
        '  ',
        '  ## Topic Area',
        '  <topic and expected doc type>',
        '  ',
        '  ## What I\'ve Searched',
        '  <list of places already searched>',
        '  ',
        '  ## Expected Documentation',
        '  <what kind of docs would answer this: tutorial, API ref, example, etc.>',
        '  ',
        '  ## Related Documentation',
        '  <links to related but insufficient docs>',
        '',
        'Include labels: documentation, question, topic label',
        'Generate bodyPreview (first 500 chars)',
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
  labels: ['agent', 'documentation-question', 'compose']
}));

export const submitDocQuestionTask = defineTask('submit-doc-question', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit documentation question to GitHub',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent submitting a documentation question issue',
      task: 'Submit the documentation question as a GitHub issue to the a5c-ai/babysitter repository',
      context: {
        title: args.title,
        body: args.body,
        labels: args.labels
      },
      instructions: [
        'Use the gh CLI to create the issue:',
        'gh issue create --repo a5c-ai/babysitter --title "<title>" --body "<body>" --label "<labels>"',
        'Use a heredoc for the body to handle multi-line content',
        'If label creation fails, retry without labels',
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
  labels: ['agent', 'documentation-question', 'submit', 'github']
}));
