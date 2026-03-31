/**
 * @process cradle/documentation-contribute-answer
 * @description Submit documentation answers for unanswered questions - adds or updates docs via PR
 * @inputs { questionUrl?: string, questionTitle?: string, answerContent?: string, docSection?: string, additionalContext?: string }
 * @outputs { success: boolean, prUrl: string, prNumber: number, forkUrl: string, summary: string }
 *
 * Documentation Answer Contribution Process (PR-based)
 *
 * Phases:
 * 1. Gather Answer Details - Collect question reference, answer content, target doc section
 * 2. Search Existing Docs - Find relevant existing documentation to update or extend
 * 3. Fork Repository - Fork a5c-ai/babysitter (with breakpoint)
 * 4. Star Repository - Ask to star if not already starred (with breakpoint)
 * 5. Create Branch - Create a docs branch in the fork
 * 6. Write Documentation - Add or update documentation with the answer
 * 7. Verify Links & Formatting - Check markdown formatting and internal links
 * 8. Review Breakpoint - Let user review all changes before PR
 * 9. Submit PR - Create pull request from fork to upstream (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    questionUrl = '',
    questionTitle = '',
    answerContent = '',
    docSection = '',
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: GATHER ANSWER DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering documentation answer details');

  let details = await ctx.task(gatherAnswerDetailsTask, {
    questionUrl,
    questionTitle,
    answerContent,
    docSection,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: SEARCH EXISTING DOCS
  // ============================================================================

  ctx.log('info', 'Phase 2: Searching existing documentation');

  const docSearch = await ctx.task(searchExistingDocsTask, {
    questionTitle: details.questionTitle,
    docSection: details.docSection,
    keywords: details.keywords,
    repoRoot: '.'
  });

  // ============================================================================
  // PHASE 3: FORK REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 3: Forking repository');

  let forkLastFeedback = null;
  for (let forkAttempt = 0; forkAttempt < 3; forkAttempt++) {
    if (forkLastFeedback) {
      details = await ctx.task(gatherAnswerDetailsTask, {
        questionUrl,
        questionTitle,
        answerContent,
        docSection,
        additionalContext,
        feedback: forkLastFeedback,
        attempt: forkAttempt + 1
      });
    }
    const forkApproval = await ctx.breakpoint({
      question: [
          'To submit your documentation answer, we need to fork the a5c-ai/babysitter repository to your GitHub account.',
          '',
          `**Question:** ${details.questionTitle}`,
          `**Target section:** ${details.docSection}`,
          `**Existing docs found:** ${docSearch.existingDocs.length} relevant file(s)`,
          `**Action:** ${docSearch.existingDocs.length > 0 ? 'Update existing documentation' : 'Add new documentation'}`,
          '',
          'Approve to fork the repository, or request changes.'
        ].join('\n'),
      previousFeedback: forkLastFeedback || undefined,
      attempt: forkAttempt > 0 ? forkAttempt + 1 : undefined,
      title: 'Fork a5c-ai/babysitter?',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'fork'],
      context: { runId: ctx.runId }
    });
    if (forkApproval.approved) break;
    forkLastFeedback = forkApproval.response || forkApproval.feedback || 'Changes requested';
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

  ctx.log('info', 'Phase 5: Creating docs branch');

  const slug = details.questionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const branchName = `docs/${slug}`;

  const branch = await ctx.task(createBranchTask, {
    forkUrl: fork.forkUrl,
    forkOwner: fork.forkOwner,
    branchName,
    baseBranch: 'main'
  });

  // ============================================================================
  // PHASE 6: WRITE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Writing documentation');

  const docWrite = await ctx.task(writeDocumentationTask, {
    questionTitle: details.questionTitle,
    questionUrl: details.questionUrl,
    answerContent: details.answerContent,
    docSection: details.docSection,
    existingDocs: docSearch.existingDocs,
    targetFiles: docSearch.targetFiles,
    forkOwner: fork.forkOwner,
    branchName
  });

  // ============================================================================
  // PHASE 7: VERIFY LINKS & FORMATTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Verifying links and formatting');

  const verification = await ctx.task(verifyDocsFormattingTask, {
    filesChanged: docWrite.filesChanged,
    forkOwner: fork.forkOwner,
    branchName
  });

  // ============================================================================
  // PHASE 8: REVIEW BREAKPOINT
  // ============================================================================

  ctx.log('info', 'Phase 8: Review before PR submission');

  const formatStatus = verification.passed ? 'PASSED' : 'ISSUES FOUND';

  let reviewLastFeedback = null;
  let currentDocWrite = docWrite;
  let currentVerification = verification;
  let currentFormatStatus = formatStatus;
  for (let reviewAttempt = 0; reviewAttempt < 3; reviewAttempt++) {
    if (reviewLastFeedback) {
      currentDocWrite = await ctx.task(writeDocumentationTask, {
        questionTitle: details.questionTitle,
        questionUrl: details.questionUrl,
        answerContent: details.answerContent,
        docSection: details.docSection,
        existingDocs: docSearch.existingDocs,
        targetFiles: docSearch.targetFiles,
        forkOwner: fork.forkOwner,
        branchName,
        feedback: reviewLastFeedback,
        attempt: reviewAttempt + 1
      });
      currentVerification = await ctx.task(verifyDocsFormattingTask, {
        filesChanged: currentDocWrite.filesChanged,
        forkOwner: fork.forkOwner,
        branchName
      });
      currentFormatStatus = currentVerification.passed ? 'PASSED' : 'ISSUES FOUND';
    }
    const reviewApproval = await ctx.breakpoint({
      question: [
          'Please review the documentation changes before submitting the PR.',
          '',
          `**Question:** ${details.questionTitle}`,
          `**Section:** ${details.docSection}`,
          `**Files changed:** ${currentDocWrite.filesChanged.join(', ')}`,
          `**Formatting check:** ${currentFormatStatus}`,
          currentVerification.issues.length > 0 ? `**Issues:** ${currentVerification.issues.join('; ')}` : '',
          '',
          'Approve to submit the PR, or request changes.'
        ],

        previousFeedback: reviewLastFeedback || undefined,

        attempt: reviewAttempt > 0 ? reviewAttempt + 1 : undefined,.filter(Boolean).join('\n'),
      title: 'Review documentation changes',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'review'],
      context: { runId: ctx.runId }
    });
    if (reviewApproval.approved) break;
    reviewLastFeedback = reviewApproval.response || reviewApproval.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 9: SUBMIT PR
  // ============================================================================

  ctx.log('info', 'Phase 9: Submitting pull request');

  let submitLastFeedback = null;
  for (let submitAttempt = 0; submitAttempt < 3; submitAttempt++) {
    const submitApproval = await ctx.breakpoint({
      question: 'Ready to submit the documentation pull request to a5c-ai/babysitter?',
      previousFeedback: submitLastFeedback || undefined,
      attempt: submitAttempt > 0 ? submitAttempt + 1 : undefined,
      title: 'Submit PR?',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['approval-gate', 'submit'],
      context: { runId: ctx.runId }
    });
    if (submitApproval.approved) break;
    submitLastFeedback = submitApproval.response || submitApproval.feedback || 'Changes requested';
  }

  const pr = await ctx.task(submitPrTask, {
    forkOwner: fork.forkOwner,
    branchName,
    questionTitle: details.questionTitle,
    questionUrl: details.questionUrl,
    docSection: details.docSection,
    filesChanged: docWrite.filesChanged,
    formatStatus
  });

  return {
    success: true,
    prUrl: pr.prUrl,
    prNumber: pr.prNumber,
    forkUrl: fork.forkUrl,
    summary: `Documentation PR #${pr.prNumber} submitted answering: ${details.questionTitle}`,
    metadata: {
      processId: 'cradle/documentation-contribute-answer',
      timestamp: ctx.now()
    }
  };
}

// =============================================================================
// TASK DEFINITIONS
// =============================================================================

export const gatherAnswerDetailsTask = defineTask('gather-answer-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather documentation answer details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation analyst gathering answer details for a documentation contribution',
      task: 'Collect and structure the documentation answer details from user input',
      context: {
        questionUrl: args.questionUrl,
        questionTitle: args.questionTitle,
        answerContent: args.answerContent,
        docSection: args.docSection,
        additionalContext: args.additionalContext,
        docSections: ['README.md', 'CLAUDE.md', 'CHANGELOG.md', 'packages/sdk/sdk.md', 'packages/sdk/README.md', 'plugins/babysitter/skills/babysit/SKILL.md']
      },
      instructions: [
        'Analyze the provided question and answer details',
        'If questionUrl is provided, extract the question title from the issue/discussion',
        'Determine which documentation section the answer belongs in',
        'Extract keywords for searching existing documentation',
        'Structure the answer content for markdown formatting',
        'Return structured details for the documentation writing phase'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['questionTitle', 'answerContent', 'docSection', 'keywords'],
      properties: {
        questionTitle: { type: 'string' },
        questionUrl: { type: 'string' },
        answerContent: { type: 'string' },
        docSection: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs', 'requirements']
}));

export const searchExistingDocsTask = defineTask('search-existing-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search existing documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation researcher searching for existing docs to update',
      task: 'Search the repository for existing documentation related to the question',
      context: {
        questionTitle: args.questionTitle,
        docSection: args.docSection,
        keywords: args.keywords,
        repoRoot: args.repoRoot,
        searchPaths: [
          '*.md',
          'packages/sdk/**/*.md',
          'plugins/babysitter/**/*.md',
          'docs/**/*'
        ]
      },
      instructions: [
        'Search for existing documentation files that relate to the question topic',
        'Check README.md, CLAUDE.md, sdk.md, and other markdown files',
        'Look for sections that already cover the topic partially',
        'Identify the best file(s) to update or the best location for new content',
        'Check for existing FAQ sections or similar Q&A patterns',
        'Return list of existing docs found and suggested target files for the answer'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['existingDocs', 'targetFiles'],
      properties: {
        existingDocs: { type: 'array', items: { type: 'string' } },
        targetFiles: { type: 'array', items: { type: 'string' } },
        relevantSections: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs', 'search']
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
  title: 'Create docs branch',
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
        'cd into the cloned repo',
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

export const writeDocumentationTask = defineTask('write-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write documentation answer',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer adding documentation to the babysitter project',
      task: 'Add or update documentation with the answer to the question',
      context: {
        questionTitle: args.questionTitle,
        questionUrl: args.questionUrl,
        answerContent: args.answerContent,
        docSection: args.docSection,
        existingDocs: args.existingDocs,
        targetFiles: args.targetFiles,
        forkOwner: args.forkOwner,
        branchName: args.branchName
      },
      instructions: [
        'Navigate to the cloned fork directory',
        'Determine whether to update existing docs or create new content',
        'If updating existing file: find the right section and add/modify content',
        'If creating new content: follow existing documentation patterns and formatting',
        'Use proper markdown formatting:',
        '  - Headers for sections',
        '  - Code blocks with language tags for code examples',
        '  - Internal links to related documentation',
        '  - Consistent style with existing docs',
        'If the question references an issue, link to it',
        'Use docs() commit convention: git commit -m "docs: answer {questionTitle}"',
        'Push changes to the branch',
        'Return list of files changed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['filesChanged', 'success'],
      properties: {
        filesChanged: { type: 'array', items: { type: 'string' } },
        success: { type: 'boolean' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs', 'writing']
}));

export const verifyDocsFormattingTask = defineTask('verify-docs-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify documentation formatting',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation QA engineer verifying markdown quality',
      task: 'Verify the documentation changes have correct formatting and valid links',
      context: {
        filesChanged: args.filesChanged,
        forkOwner: args.forkOwner,
        branchName: args.branchName
      },
      instructions: [
        'Navigate to the cloned fork directory',
        'For each changed file:',
        '  - Check markdown formatting (headers, code blocks, lists)',
        '  - Verify internal links point to existing files',
        '  - Check for broken references or anchors',
        '  - Verify code examples have language tags',
        '  - Check for consistent heading levels',
        '  - Verify no trailing whitespace or formatting issues',
        'Return verification results with any issues found'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues'],
      properties: {
        passed: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs', 'verification']
}));

export const submitPrTask = defineTask('submit-pr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit pull request',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent submitting a documentation pull request',
      task: 'Create a pull request from the fork branch to a5c-ai/babysitter main',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        questionTitle: args.questionTitle,
        questionUrl: args.questionUrl,
        docSection: args.docSection,
        filesChanged: args.filesChanged,
        formatStatus: args.formatStatus
      },
      instructions: [
        'Create a PR using gh CLI:',
        `gh pr create --repo a5c-ai/babysitter --head ${args.forkOwner}:${args.branchName} --base main`,
        `Title: "docs: answer ${args.questionTitle}"`,
        'Body should include:',
        '  - ## Summary: What question this answers',
        args.questionUrl ? `  - ## Question Reference: Link to ${args.questionUrl}` : '  - ## Question: Description of the question being answered',
        '  - ## Documentation Changes: Which files were updated and why',
        '  - ## Formatting Check: Pass/fail status',
        '  - ## Checklist: Markdown valid, links working, consistent style, answers question fully',
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
