/**
 * @process specializations/technical-documentation/docs-pr-workflow
 * @description Automated workflow for reviewing documentation pull requests with style validation, automated checks, and approval gates
 * @specialization Technical Documentation
 * @category Docs-as-Code
 * @inputs { prNumber: number, repository: string, branch: string, targetQuality: number, autoApprove: boolean }
 * @outputs { success: boolean, approved: boolean, quality: number, checks: object, artifacts: string[] }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    prNumber,
    repository,
    branch,
    targetQuality = 90,
    autoApprove = false,
    strictMode = true
  } = inputs;

  // Phase 1: PR Metadata and Change Analysis
  await ctx.breakpoint({
    question: `Starting documentation PR review for #${prNumber}. Fetch and analyze changes?`,
    title: 'Phase 1: PR Metadata Analysis',
    context: {
      runId: ctx.runId,
      phase: 'pr-analysis',
      prNumber,
      repository,
      branch
    }
  });

  const prAnalysis = await ctx.task(analyzePrMetadataTask, {
    prNumber,
    repository,
    branch
  });

  if (!prAnalysis.valid) {
    return {
      success: false,
      approved: false,
      error: 'Invalid PR or unable to fetch changes',
      details: prAnalysis.errors,
      metadata: { processId: 'docs-pr-workflow', timestamp: ctx.now() }
    };
  }

  // Phase 2: Automated Quality Checks (Parallel Execution)
  await ctx.breakpoint({
    question: `PR analyzed: ${prAnalysis.filesChanged} files changed. Run automated quality checks?`,
    title: 'Phase 2: Automated Quality Checks',
    context: {
      runId: ctx.runId,
      phase: 'automated-checks',
      filesChanged: prAnalysis.filesChanged,
      additions: prAnalysis.additions,
      deletions: prAnalysis.deletions
    }
  });

  const [
    styleCheck,
    linkCheck,
    spellCheck,
    grammarCheck,
    formatCheck,
    accessibilityCheck
  ] = await Promise.all([
    ctx.task(styleValidationTask, {
      files: prAnalysis.changedFiles,
      repository,
      branch
    }),
    ctx.task(linkValidationTask, {
      files: prAnalysis.changedFiles,
      repository,
      branch
    }),
    ctx.task(spellCheckTask, {
      files: prAnalysis.changedFiles,
      repository,
      branch
    }),
    ctx.task(grammarCheckTask, {
      files: prAnalysis.changedFiles,
      repository,
      branch
    }),
    ctx.task(formatValidationTask, {
      files: prAnalysis.changedFiles,
      repository,
      branch
    }),
    ctx.task(accessibilityValidationTask, {
      files: prAnalysis.changedFiles,
      repository,
      branch
    })
  ]);

  // Phase 3: Code Example Validation (if applicable)
  let codeExampleValidation = null;
  if (prAnalysis.hasCodeExamples) {
    await ctx.breakpoint({
      question: 'Code examples detected. Validate code examples?',
      title: 'Phase 3: Code Example Validation',
      context: {
        runId: ctx.runId,
        phase: 'code-example-validation',
        exampleCount: prAnalysis.codeExampleCount
      }
    });

    codeExampleValidation = await ctx.task(validateCodeExamplesTask, {
      files: prAnalysis.changedFiles,
      examples: prAnalysis.codeExamples,
      repository,
      branch
    });
  }

  // Phase 4: Content Quality Review
  await ctx.breakpoint({
    question: 'Automated checks complete. Review documentation content quality?',
    title: 'Phase 4: Content Quality Review',
    context: {
      runId: ctx.runId,
      phase: 'content-review',
      styleIssues: styleCheck.issueCount,
      brokenLinks: linkCheck.brokenCount,
      spellingErrors: spellCheck.errorCount
    }
  });

  const contentQuality = await ctx.task(reviewContentQualityTask, {
    prAnalysis,
    changedFiles: prAnalysis.changedFiles,
    checks: {
      style: styleCheck,
      links: linkCheck,
      spelling: spellCheck,
      grammar: grammarCheck,
      format: formatCheck,
      accessibility: accessibilityCheck,
      codeExamples: codeExampleValidation
    },
    repository,
    branch
  });

  // Phase 5: Technical Accuracy Verification
  await ctx.breakpoint({
    question: 'Content quality reviewed. Verify technical accuracy?',
    title: 'Phase 5: Technical Accuracy Verification',
    context: {
      runId: ctx.runId,
      phase: 'technical-accuracy',
      contentQualityScore: contentQuality.score
    }
  });

  const technicalAccuracy = await ctx.task(verifyTechnicalAccuracyTask, {
    prAnalysis,
    changedFiles: prAnalysis.changedFiles,
    contentQuality,
    repository,
    branch
  });

  // Phase 6: Comprehensive Quality Scoring
  await ctx.breakpoint({
    question: 'Technical accuracy verified. Calculate overall quality score?',
    title: 'Phase 6: Quality Scoring',
    context: {
      runId: ctx.runId,
      phase: 'quality-scoring',
      technicalAccuracyScore: technicalAccuracy.score
    }
  });

  const qualityScore = await ctx.task(calculateQualityScoreTask, {
    prAnalysis,
    checks: {
      style: styleCheck,
      links: linkCheck,
      spelling: spellCheck,
      grammar: grammarCheck,
      format: formatCheck,
      accessibility: accessibilityCheck,
      codeExamples: codeExampleValidation
    },
    contentQuality,
    technicalAccuracy,
    targetQuality,
    strictMode
  });

  const overallQuality = qualityScore.overallScore;

  // Phase 7: Build Preview and Screenshots
  let buildPreview = null;
  if (prAnalysis.requiresBuild) {
    await ctx.breakpoint({
      question: 'Generate documentation build preview?',
      title: 'Phase 7: Build Preview',
      context: {
        runId: ctx.runId,
        phase: 'build-preview',
        overallQuality
      }
    });

    buildPreview = await ctx.task(generateBuildPreviewTask, {
      prNumber,
      repository,
      branch,
      changedFiles: prAnalysis.changedFiles
    });
  }

  // Phase 8: Approval Decision
  const criticalIssues = qualityScore.criticalIssues || [];
  const blockingIssues = qualityScore.blockingIssues || [];
  const hasBlockingIssues = blockingIssues.length > 0;
  const meetsQualityGate = overallQuality >= targetQuality && !hasBlockingIssues;

  let approved = false;
  let approvalReason = '';

  if (meetsQualityGate) {
    if (autoApprove) {
      await ctx.breakpoint({
        question: `Quality gate passed (${overallQuality}/${targetQuality}). Auto-approve enabled. Approve PR?`,
        title: 'Phase 8: Auto-Approval Decision',
        context: {
          runId: ctx.runId,
          phase: 'approval-decision',
          overallQuality,
          targetQuality,
          autoApprove: true,
          files: [
            { path: `artifacts/pr-${prNumber}-review-report.md`, format: 'markdown' },
            { path: `artifacts/pr-${prNumber}-quality-score.json`, format: 'json' }
          ]
        }
      });

      approved = true;
      approvalReason = `Auto-approved: Quality score ${overallQuality}/${targetQuality}, no blocking issues`;
    } else {
      await ctx.breakpoint({
        question: `Quality gate passed (${overallQuality}/${targetQuality}). Manual approval required. Review and approve?`,
        title: 'Phase 8: Manual Approval Required',
        context: {
          runId: ctx.runId,
          phase: 'manual-approval',
          overallQuality,
          targetQuality,
          autoApprove: false,
          files: [
            { path: `artifacts/pr-${prNumber}-review-report.md`, format: 'markdown' },
            { path: `artifacts/pr-${prNumber}-quality-score.json`, format: 'json' },
            { path: buildPreview?.previewUrl ? `artifacts/build-preview.html` : null, format: 'html' }
          ].filter(f => f.path)
        }
      });

      // This will be resolved by human via breakpoint
      approved = false;
      approvalReason = 'Awaiting manual approval';
    }
  } else {
    await ctx.breakpoint({
      question: `Quality gate FAILED (${overallQuality}/${targetQuality})${hasBlockingIssues ? ` with ${blockingIssues.length} blocking issue(s)` : ''}. Request changes?`,
      title: 'Phase 8: Quality Gate Failed',
      context: {
        runId: ctx.runId,
        phase: 'rejection-decision',
        overallQuality,
        targetQuality,
        blockingIssues: blockingIssues.length,
        criticalIssues: criticalIssues.length,
        files: [
          { path: `artifacts/pr-${prNumber}-review-report.md`, format: 'markdown' },
          { path: `artifacts/pr-${prNumber}-quality-score.json`, format: 'json' },
          { path: `artifacts/pr-${prNumber}-issues.json`, format: 'json' }
        ]
      }
    });

    approved = false;
    approvalReason = hasBlockingIssues
      ? `Rejected: ${blockingIssues.length} blocking issue(s) must be resolved`
      : `Quality below threshold: ${overallQuality}/${targetQuality}`;
  }

  // Phase 9: Post Review Comment
  await ctx.breakpoint({
    question: `Post review comment to PR #${prNumber}?`,
    title: 'Phase 9: Post Review Comment',
    context: {
      runId: ctx.runId,
      phase: 'post-comment',
      approved,
      approvalReason
    }
  });

  const reviewComment = await ctx.task(postReviewCommentTask, {
    prNumber,
    repository,
    approved,
    approvalReason,
    qualityScore,
    checks: {
      style: styleCheck,
      links: linkCheck,
      spelling: spellCheck,
      grammar: grammarCheck,
      format: formatCheck,
      accessibility: accessibilityCheck,
      codeExamples: codeExampleValidation
    },
    contentQuality,
    technicalAccuracy,
    buildPreview
  });

  // Return final result
  return {
    success: true,
    approved,
    approvalReason,
    prNumber,
    repository,
    branch,
    quality: overallQuality,
    targetQuality,
    meetsQualityGate,
    checks: {
      style: {
        passed: styleCheck.passed,
        issueCount: styleCheck.issueCount,
        issues: styleCheck.issues
      },
      links: {
        passed: linkCheck.passed,
        brokenCount: linkCheck.brokenCount,
        brokenLinks: linkCheck.brokenLinks
      },
      spelling: {
        passed: spellCheck.passed,
        errorCount: spellCheck.errorCount,
        errors: spellCheck.errors
      },
      grammar: {
        passed: grammarCheck.passed,
        issueCount: grammarCheck.issueCount,
        issues: grammarCheck.issues
      },
      format: {
        passed: formatCheck.passed,
        issueCount: formatCheck.issueCount,
        issues: formatCheck.issues
      },
      accessibility: {
        passed: accessibilityCheck.passed,
        score: accessibilityCheck.score,
        issues: accessibilityCheck.issues
      },
      codeExamples: codeExampleValidation ? {
        passed: codeExampleValidation.passed,
        failedCount: codeExampleValidation.failedCount,
        failures: codeExampleValidation.failures
      } : null
    },
    contentQuality: {
      score: contentQuality.score,
      clarity: contentQuality.clarity,
      completeness: contentQuality.completeness,
      consistency: contentQuality.consistency
    },
    technicalAccuracy: {
      score: technicalAccuracy.score,
      accurate: technicalAccuracy.accurate,
      issues: technicalAccuracy.issues
    },
    qualityScore: {
      overall: qualityScore.overallScore,
      breakdown: qualityScore.breakdown,
      criticalIssues: qualityScore.criticalIssues,
      blockingIssues: qualityScore.blockingIssues,
      recommendations: qualityScore.recommendations
    },
    buildPreview: buildPreview ? {
      url: buildPreview.previewUrl,
      status: buildPreview.status
    } : null,
    reviewComment: {
      posted: reviewComment.posted,
      commentUrl: reviewComment.commentUrl
    },
    artifacts: [
      `artifacts/pr-${prNumber}-review-report.md`,
      `artifacts/pr-${prNumber}-quality-score.json`,
      buildPreview?.artifactPath || null
    ].filter(Boolean),
    metadata: {
      processId: 'specializations/technical-documentation/docs-pr-workflow',
      timestamp: ctx.now(),
      filesChanged: prAnalysis.filesChanged,
      additions: prAnalysis.additions,
      deletions: prAnalysis.deletions
    }
  };
}

// Task Definitions

export const analyzePrMetadataTask = defineTask('analyze-pr-metadata', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze PR #${args.prNumber} Metadata`,
  agent: {
    name: 'pr-metadata-analyzer',
    prompt: {
      role: 'DevOps engineer and documentation specialist',
      task: 'Fetch and analyze pull request metadata and changed files',
      context: args,
      instructions: [
        'Fetch PR metadata using GitHub/GitLab API or git commands',
        'Get list of changed files with their paths and change types',
        'Calculate additions and deletions',
        'Identify file types: Markdown, MDX, AsciiDoc, reStructuredText, etc.',
        'Detect code examples in documentation files',
        'Identify if documentation build is required',
        'Extract PR title, description, labels, and author',
        'Check if PR follows naming conventions',
        'Validate branch naming and target branch',
        'Identify documentation categories affected'
      ],
      outputFormat: 'JSON with valid, prNumber, title, description, author, changedFiles array, filesChanged, additions, deletions, hasCodeExamples, codeExampleCount, codeExamples, requiresBuild, categories, errors'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'prNumber', 'changedFiles', 'filesChanged'],
      properties: {
        valid: { type: 'boolean' },
        prNumber: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        author: { type: 'string' },
        changedFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              status: { type: 'string' },
              additions: { type: 'number' },
              deletions: { type: 'number' }
            }
          }
        },
        filesChanged: { type: 'number' },
        additions: { type: 'number' },
        deletions: { type: 'number' },
        hasCodeExamples: { type: 'boolean' },
        codeExampleCount: { type: 'number' },
        codeExamples: { type: 'array' },
        requiresBuild: { type: 'boolean' },
        categories: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'metadata-analysis']
}));

export const styleValidationTask = defineTask('style-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Documentation Style',
  agent: {
    name: 'style-validator',
    prompt: {
      role: 'technical writer and style guide enforcer',
      task: 'Validate documentation against style guide rules',
      context: args,
      instructions: [
        'Run Vale or similar style linter on changed documentation files',
        'Check voice and tone consistency (active voice, present tense)',
        'Validate terminology against glossary/word list',
        'Check heading structure and hierarchy',
        'Verify consistent capitalization and formatting',
        'Check for jargon, buzzwords, and unclear language',
        'Validate use of second person (you) vs first person',
        'Check sentence length and readability',
        'Verify proper use of code formatting and inline code',
        'Report style violations with severity (error, warning, suggestion)'
      ],
      outputFormat: 'JSON with passed, issueCount, issues array (file, line, rule, severity, message), summary, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issueCount'],
      properties: {
        passed: { type: 'boolean' },
        issueCount: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              rule: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning', 'suggestion'] },
              message: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'style-validation']
}));

export const linkValidationTask = defineTask('link-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Links',
  agent: {
    name: 'link-validator',
    prompt: {
      role: 'QA engineer specializing in documentation testing',
      task: 'Validate all links in changed documentation files',
      context: args,
      instructions: [
        'Extract all links from changed files (internal, external, anchor links)',
        'Check internal links point to valid files/sections',
        'Verify external links are reachable (HTTP 200)',
        'Validate anchor links match existing headers',
        'Check for broken, redirected, or slow-loading links',
        'Verify relative vs absolute paths are used correctly',
        'Check image links and alt text',
        'Identify links that need updating',
        'Report broken links with location and error type',
        'Suggest fixes for broken links'
      ],
      outputFormat: 'JSON with passed, totalLinks, validLinks, brokenCount, brokenLinks array (file, line, url, type, status, error, suggestion), warnings'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'totalLinks', 'brokenCount'],
      properties: {
        passed: { type: 'boolean' },
        totalLinks: { type: 'number' },
        validLinks: { type: 'number' },
        brokenCount: { type: 'number' },
        brokenLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              url: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external', 'anchor', 'image'] },
              status: { type: 'string' },
              error: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'link-validation']
}));

export const spellCheckTask = defineTask('spell-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Spell Check',
  agent: {
    name: 'spell-checker',
    prompt: {
      role: 'copy editor and proofreader',
      task: 'Check spelling in documentation changes',
      context: args,
      instructions: [
        'Run spell checker on changed documentation files',
        'Ignore code blocks, inline code, and technical terms',
        'Use custom dictionary for technical terminology',
        'Identify misspelled words with location',
        'Provide spelling suggestions',
        'Check for common typos and homophones',
        'Verify proper nouns and product names',
        'Report spelling errors with context',
        'Allow technical terms and abbreviations from glossary',
        'Flag potential typos that might be valid technical terms'
      ],
      outputFormat: 'JSON with passed, errorCount, errors array (file, line, word, suggestions, context), summary'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'errorCount'],
      properties: {
        passed: { type: 'boolean' },
        errorCount: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              word: { type: 'string' },
              suggestions: { type: 'array', items: { type: 'string' } },
              context: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'spell-check']
}));

export const grammarCheckTask = defineTask('grammar-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Grammar Check',
  agent: {
    name: 'grammar-checker',
    prompt: {
      role: 'copy editor specializing in technical writing',
      task: 'Check grammar and writing quality in documentation',
      context: args,
      instructions: [
        'Analyze grammar, punctuation, and sentence structure',
        'Check for subject-verb agreement',
        'Identify run-on sentences and fragments',
        'Verify proper punctuation usage',
        'Check for passive voice (prefer active)',
        'Identify wordy or complex sentences',
        'Check for misused words and phrases',
        'Verify parallel structure in lists',
        'Check pronoun agreement and clarity',
        'Provide suggestions for improvement'
      ],
      outputFormat: 'JSON with passed, issueCount, issues array (file, line, type, message, suggestion, severity), summary'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issueCount'],
      properties: {
        passed: { type: 'boolean' },
        issueCount: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              type: { type: 'string' },
              message: { type: 'string' },
              suggestion: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning', 'info'] }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'grammar-check']
}));

export const formatValidationTask = defineTask('format-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Formatting',
  agent: {
    name: 'format-validator',
    prompt: {
      role: 'technical documentation specialist',
      task: 'Validate documentation formatting and structure',
      context: args,
      instructions: [
        'Check Markdown/MDX syntax correctness',
        'Validate frontmatter/metadata format',
        'Check heading hierarchy (H1, H2, H3 order)',
        'Verify code block language tags',
        'Check list formatting (nesting, indentation)',
        'Validate table structure and formatting',
        'Check image syntax and alt text',
        'Verify proper use of emphasis (bold, italic)',
        'Check for trailing whitespace and line breaks',
        'Validate file naming conventions'
      ],
      outputFormat: 'JSON with passed, issueCount, issues array (file, line, type, message, suggestion), summary'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issueCount'],
      properties: {
        passed: { type: 'boolean' },
        issueCount: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              type: { type: 'string' },
              message: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'format-validation']
}));

export const accessibilityValidationTask = defineTask('accessibility-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Accessibility',
  agent: {
    name: 'accessibility-validator',
    prompt: {
      role: 'accessibility specialist and inclusive design expert',
      task: 'Validate documentation accessibility compliance',
      context: args,
      instructions: [
        'Check all images have descriptive alt text',
        'Verify heading hierarchy for screen readers',
        'Check link text is descriptive (not "click here")',
        'Validate color contrast in examples',
        'Check for proper semantic HTML/Markdown',
        'Verify tables have headers',
        'Check for keyboard navigation considerations',
        'Validate ARIA labels where applicable',
        'Check for plain language and readability',
        'Report WCAG 2.1 compliance issues'
      ],
      outputFormat: 'JSON with passed, score, issues array (file, line, wcagLevel, criterion, message, impact), summary'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA'] },
              criterion: { type: 'string' },
              message: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'accessibility-validation']
}));

export const validateCodeExamplesTask = defineTask('validate-code-examples', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Code Examples (${args.examples.length} found)`,
  agent: {
    name: 'code-example-validator',
    prompt: {
      role: 'QA engineer and developer advocate',
      task: 'Validate code examples in documentation',
      context: args,
      instructions: [
        'Extract code examples from documentation files',
        'Validate syntax correctness for each language',
        'Check code examples are complete and runnable',
        'Verify imports and dependencies are included',
        'Check for security vulnerabilities or bad practices',
        'Validate code follows language conventions',
        'Check code examples match API/SDK documentation',
        'Verify error handling is demonstrated',
        'Check for deprecated APIs or patterns',
        'Test examples compile/parse (syntax check)'
      ],
      outputFormat: 'JSON with passed, totalCount, passedCount, failedCount, failures array (file, line, language, issue, recommendation), summary'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'totalCount', 'failedCount'],
      properties: {
        passed: { type: 'boolean' },
        totalCount: { type: 'number' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              language: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'code-example-validation']
}));

export const reviewContentQualityTask = defineTask('review-content-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Content Quality',
  agent: {
    name: 'content-quality-reviewer',
    prompt: {
      role: 'senior technical writer and content strategist',
      task: 'Comprehensive review of documentation content quality',
      context: args,
      instructions: [
        'Assess content clarity and readability (Flesch reading ease)',
        'Evaluate completeness: does it cover the topic thoroughly?',
        'Check consistency with existing documentation tone and style',
        'Verify logical flow and organization',
        'Assess user empathy and task-oriented approach',
        'Check for redundancy or outdated information',
        'Evaluate use of examples and visuals',
        'Assess beginner vs advanced user balance',
        'Check for missing context or prerequisites',
        'Score content quality 0-100 across dimensions'
      ],
      outputFormat: 'JSON with score, clarity, completeness, consistency, organization, recommendations array, strengths array, improvements array'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'clarity', 'completeness', 'consistency'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        clarity: { type: 'number', minimum: 0, maximum: 100 },
        completeness: { type: 'number', minimum: 0, maximum: 100 },
        consistency: { type: 'number', minimum: 0, maximum: 100 },
        organization: { type: 'number', minimum: 0, maximum: 100 },
        readability: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'content-quality']
}));

export const verifyTechnicalAccuracyTask = defineTask('verify-technical-accuracy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Technical Accuracy',
  agent: {
    name: 'technical-accuracy-verifier',
    prompt: {
      role: 'subject matter expert and technical reviewer',
      task: 'Verify technical accuracy of documentation changes',
      context: args,
      instructions: [
        'Review technical content against source code/APIs',
        'Verify API signatures, parameters, and return types',
        'Check configuration examples are correct',
        'Validate command-line examples and flags',
        'Verify version compatibility information',
        'Check technical specifications and numbers',
        'Validate system requirements and constraints',
        'Verify best practices and recommendations',
        'Check for outdated or deprecated information',
        'Score technical accuracy 0-100'
      ],
      outputFormat: 'JSON with score, accurate, issues array (file, line, issue, severity, correction), recommendations, warnings'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'accurate'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        accurate: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              correction: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'technical-accuracy']
}));

export const calculateQualityScoreTask = defineTask('calculate-quality-score', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate Overall Quality Score',
  agent: {
    name: 'quality-score-calculator',
    prompt: {
      role: 'documentation quality analyst',
      task: 'Calculate comprehensive quality score and determine pass/fail',
      context: args,
      instructions: [
        'Aggregate all check results into weighted score',
        'Style checks: 15% weight',
        'Link validation: 15% weight',
        'Spelling/Grammar: 10% weight',
        'Format validation: 10% weight',
        'Accessibility: 15% weight',
        'Code examples: 10% weight (if applicable)',
        'Content quality: 15% weight',
        'Technical accuracy: 20% weight',
        'Identify critical and blocking issues',
        'Calculate overall score 0-100',
        'Determine pass/fail against target quality',
        'Provide prioritized recommendations',
        'Assess if manual review required'
      ],
      outputFormat: 'JSON with overallScore, passed, breakdown object, criticalIssues array, blockingIssues array, recommendations array, requiresManualReview'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passed', 'breakdown'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        breakdown: {
          type: 'object',
          properties: {
            style: { type: 'number' },
            links: { type: 'number' },
            spelling: { type: 'number' },
            grammar: { type: 'number' },
            format: { type: 'number' },
            accessibility: { type: 'number' },
            codeExamples: { type: 'number' },
            contentQuality: { type: 'number' },
            technicalAccuracy: { type: 'number' }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        requiresManualReview: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'quality-scoring']
}));

export const generateBuildPreviewTask = defineTask('generate-build-preview', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Build Preview for PR #${args.prNumber}`,
  agent: {
    name: 'build-preview-generator',
    prompt: {
      role: 'DevOps engineer managing documentation deployment',
      task: 'Generate preview build of documentation for review',
      context: args,
      instructions: [
        'Checkout PR branch',
        'Run documentation build process (Docusaurus, MkDocs, Sphinx, etc.)',
        'Handle build errors gracefully',
        'Generate static site preview',
        'Deploy to preview environment or generate artifact',
        'Capture screenshots of changed pages',
        'Generate preview URL or local preview path',
        'Validate preview builds successfully',
        'Check for broken links in built site',
        'Report build time and any warnings'
      ],
      outputFormat: 'JSON with status, previewUrl, artifactPath, buildTime, warnings array, screenshots array'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'previewUrl'],
      properties: {
        status: { type: 'string', enum: ['success', 'failed', 'partial'] },
        previewUrl: { type: 'string' },
        artifactPath: { type: 'string' },
        buildTime: { type: 'number' },
        warnings: { type: 'array', items: { type: 'string' } },
        screenshots: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'build-preview']
}));

export const postReviewCommentTask = defineTask('post-review-comment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post Review Comment to PR #${args.prNumber}`,
  agent: {
    name: 'review-comment-poster',
    prompt: {
      role: 'DevOps automation engineer',
      task: 'Generate and post comprehensive review comment to pull request',
      context: args,
      instructions: [
        'Generate comprehensive review comment with all check results',
        'Include quality score and breakdown',
        'List critical and blocking issues prominently',
        'Include detailed check results (style, links, spelling, etc.)',
        'Add recommendations for improvement',
        'Include link to build preview if available',
        'Format comment in Markdown with sections and tables',
        'Add approval/request changes status',
        'Include links to detailed artifacts',
        'Post comment to PR using GitHub/GitLab API'
      ],
      outputFormat: 'JSON with posted, commentUrl, commentBody, error'
    },
    outputSchema: {
      type: 'object',
      required: ['posted'],
      properties: {
        posted: { type: 'boolean' },
        commentUrl: { type: 'string' },
        commentBody: { type: 'string' },
        error: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pr-review', 'comment-posting']
}));
