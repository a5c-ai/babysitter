/**
 * @process repo/issue-613-kradle-ui-polish
 * @description Implement issue #613 for Kradle web UI polish: stable React keys, user-visible deploy errors, color-token consistency, and radiogroup keyboard behavior.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, title: string, issueUrl: string, issueBody: string, triageComment: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/kradle/docs/gaps/ui-ux-remaining.md
 *
 * Process-library references used:
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - specializations/web-development/keyboard-navigation-focus.js
 * - specializations/web-development/e2e-testing-playwright.js
 * - processes/shared/tdd-triplet.js
 * - processes/shared/completeness-gate.js
 * - processes/shared/prior-attempts-scanner.js
 *
 * This process intentionally uses agent tasks rather than kind: "shell" tasks to
 * respect the repository-specific authoring override for direct Babysitter
 * workflows. Agent tasks must runtime-read the issue, gap document, current
 * files, and diff before deciding scope or acceptance.
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/web-development/keyboard-navigation-focus
 * @process specializations/web-development/e2e-testing-playwright
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @process processes/shared/prior-attempts-scanner
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @agent web-code-reviewer specializations/web-development/agents/code-reviewer/AGENT.md
 * @agent e2e-testing specializations/web-development/agents/e2e-testing/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_REFINEMENT_ATTEMPTS = 3;

function specBlock(args) {
  const runtimeIssue = args.issueContext?.rawIssueJson || args.issueContext?.issueSummary || args.issueBody || '';
  const runtimeTriage = args.issueContext?.commentsSummary || args.triageComment || '';
  const runtimeGapDoc = args.issueContext?.gapDocText || 'packages/kradle/docs/gaps/ui-ux-remaining.md';
  return [
    'RUNTIME-READ ISSUE CONTEXT:',
    '---',
    typeof runtimeIssue === 'string' ? runtimeIssue : JSON.stringify(runtimeIssue, null, 2),
    '---',
    '',
    'RUNTIME-READ COMMENTS/TRIAGE:',
    '---',
    typeof runtimeTriage === 'string' ? runtimeTriage : JSON.stringify(runtimeTriage, null, 2),
    '---',
    '',
    'RUNTIME-READ REFERENCED GAP DOC:',
    '---',
    runtimeGapDoc,
    '---',
  ].join('\n');
}

export async function process(inputs, ctx) {
  const shared = {
    issueNumber: inputs?.issueNumber ?? 613,
    baseBranch: inputs?.baseBranch ?? 'staging',
    targetBranch: inputs?.targetBranch ?? 'feat/issue-613-kradle-ui-polish',
    title: inputs?.title ?? 'UI polish: index-based keys, remaining console.warn, hardcoded colors',
    issueUrl: inputs?.issueUrl,
    issueBody: inputs?.issueBody,
    triageComment: inputs?.triageComment,
    targetFiles: inputs?.targetFiles ?? [],
    verificationCommands: inputs?.verificationCommands ?? [],
  };

  const issueContext = await ctx.task(readIssueContextTask, shared, {
    key: 'issue-613.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    ...shared,
    issueContext,
  }, {
    key: 'issue-613.reuse-audit',
  });

  const scope = await ctx.task(scopeCurrentStateTask, {
    ...shared,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-613.scope-current-state',
  });

  if (scope?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #613 Scope Decision',
      question: scope.question ?? 'The current branch appears to have partially implemented #613 or conflicts with the requested scope. Choose how to proceed.',
      options: ['Proceed with unresolved issue-scoped fixes only', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-613', 'scope'],
      context: {
        runId: ctx.runId,
        issueNumber: shared.issueNumber,
        scope,
      },
    });
  }

  const testPlan = await ctx.task(authorRegressionTestsTask, {
    ...shared,
    issueContext,
    reuseAudit,
    scope,
  }, {
    key: 'issue-613.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_REFINEMENT_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementUiPolishTask, {
      ...shared,
      issueContext,
      reuseAudit,
      scope,
      testPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-613.implement.${attempt}`,
    });

    verification = await ctx.task(verifyQualityGatesTask, {
      ...shared,
      issueContext,
      reuseAudit,
      scope,
      testPlan,
      implementation,
      attempt,
    }, {
      key: `issue-613.verify.${attempt}`,
    });

    review = await ctx.task(reviewAgainstSpecTask, {
      ...shared,
      issueContext,
      reuseAudit,
      scope,
      testPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-613.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    ...shared,
    issueContext,
    reuseAudit,
    scope,
    testPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-613.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #613 Final Acceptance Decision',
      question: finalGate.question ?? 'Final acceptance found an unresolved UI risk or quality-gate failure.',
      options: ['Accept documented residual risk', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-613', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'current-state-scope',
      'regression-tests-red',
      'implementation-loop',
      'quality-gates',
      'spec-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    issueContext,
    reuseAudit,
    scope,
    testPlan,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-613.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #613 and Kradle UI gap context',
  labels: ['issue-613', 'kradle', 'kradle-web', 'research'],
  agent: {
    name: 'frontend-engineer',
    prompt: {
      role: 'senior Kradle web frontend engineer',
      task: 'Read the issue, comments, labels, and referenced gap document before planning code changes.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url`,
        `Confirm #${args.issueNumber} is not a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read all issue comments and labels carefully. Treat the issue body, triage comment, and gap document as the source of truth.',
        'Read packages/kradle/docs/gaps/ui-ux-remaining.md.',
        'Inspect current target files only enough to determine which issue items are still unresolved on the execution branch.',
        'Capture the raw issue JSON and gap document text in the returned JSON so downstream tasks compare against runtime-read context instead of authored paraphrase.',
        'Do not modify files in this phase.',
        'Return JSON: { title, state, labels, rawIssueJson, issueSummary, commentsSummary, acceptanceCriteria, nonGoals, gapDocText, gapDocSummary, targetFiles, openQuestions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['issueSummary', 'acceptanceCriteria', 'nonGoals', 'targetFiles', 'rawIssueJson', 'gapDocText'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-613.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0: Reuse-audit findings',
  labels: ['issue-613', 'kradle', 'reuse-audit', 'planning'],
  agent: {
    name: 'kradle-reuse-auditor',
    prompt: {
      role: 'senior frontend maintenance engineer',
      task: 'Run the repo-specific reuse audit before implementation work.',
      instructions: [
        specBlock(args),
        '',
        'Extract keyword nouns and verbs from the prompt and issue: React keys, index keys, generated row IDs, console.warn, deploy error state, hardcoded colors, CSS variables, radiogroup, arrow keys, Home, End.',
        'Start the response with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Scan existing Kradle web tests, component helpers, color variables, toast/status patterns, keyboard-handler patterns, and dynamic list identity patterns.',
        'Check whether .a5c/reuse-audit.json exists and honor its scan globs if present.',
        'Do not modify files in this phase.',
        'Return JSON: { findingsMarkdown, matchingInfrastructure, reusablePatterns, missingInfrastructure, targetFiles, recommendedTestFiles, noCodeChanges }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['findingsMarkdown', 'matchingInfrastructure', 'targetFiles', 'recommendedTestFiles'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const scopeCurrentStateTask = defineTask('issue-613.scope-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scope unresolved UI polish against current branch',
  labels: ['issue-613', 'kradle-web', 'scope', 'diagnosis'],
  agent: {
    name: 'frontend-engineer',
    prompt: {
      role: 'senior React maintainer',
      task: 'Determine exactly which issue #613 items remain unresolved on the current branch.',
      instructions: [
        specBlock(args),
        '',
        'REUSE AUDIT:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        '',
        'Inspect the current source for each target file. Do not assume the issue body line numbers are still current.',
        'Separate already-fixed behavior from unresolved behavior. In particular, verify whether CuratedModelCatalog already exposes route creation failures through visible UI state.',
        'Classify every index key as dynamic/mutable, server-backed stable list, generated local editable row, or static render-only content.',
        'For hardcoded colors, choose an incremental scope: touched files plus the top issue-relevant colors only. Do not plan a 735-instance sweep.',
        'Identify the smallest test surfaces that can lock the behavior without brittle snapshots.',
        'Return JSON: { unresolvedItems, alreadyResolvedItems, keyStrategyByFile, colorTokenStrategy, testsToAdd, filesToModify, needsMaintainerDecision, question, noCodeChanges }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['unresolvedItems', 'alreadyResolvedItems', 'keyStrategyByFile', 'testsToAdd', 'filesToModify'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-613.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author focused regression tests first',
  labels: ['issue-613', 'kradle-web', 'tdd', 'tests'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'React component test engineer',
      task: 'Add focused failing regression coverage for unresolved #613 behavior before implementation.',
      instructions: [
        specBlock(args),
        '',
        'CURRENT-STATE SCOPE:',
        JSON.stringify(args.scope ?? {}, null, 2),
        '',
        'Add or extend tests under packages/kradle/web/tests using existing node:test structural-test patterns unless the repo already has a stronger component test harness.',
        'Cover dynamic key identity without brittle broad grep-only checks: mutable local rows must have generated stable IDs, server-backed rows must use resource IDs/names, and unresolved issue-scoped index keys must fail.',
        'Cover CuratedModelCatalog only if current-state scope finds the route-creation warning/error is still missing or incomplete.',
        'Cover ApprovalModeToggle keyboard behavior for ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, and End in a way that verifies handler presence and expected mode order.',
        'Cover color-token migration with a bounded static guard for touched files and documented allowed exceptions for semantic state colors if needed.',
        'Run the narrow new test command and confirm RED for the expected missing behavior before implementation.',
        'Return JSON: { testsAdded, redCommands, redResults, failedForExpectedReason, coverageByAcceptanceCriterion, notes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['testsAdded', 'redCommands', 'failedForExpectedReason', 'coverageByAcceptanceCriterion'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementUiPolishTask = defineTask('issue-613.implement-ui-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement scoped Kradle UI polish fixes',
  labels: ['issue-613', 'kradle-web', 'implementation', 'ui-polish'],
  agent: {
    name: 'frontend-engineer',
    prompt: {
      role: 'senior React frontend engineer',
      task: 'Implement only the unresolved issue #613 fixes identified by scope and tests.',
      instructions: [
        specBlock(args),
        '',
        'CURRENT-STATE SCOPE:',
        JSON.stringify(args.scope ?? {}, null, 2),
        '',
        'TEST PLAN AND RED RESULT:',
        JSON.stringify(args.testPlan ?? {}, null, 2),
        '',
        'PREVIOUS VERIFICATION:',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        '',
        'PREVIOUS REVIEW:',
        JSON.stringify(args.previousReview ?? {}, null, 2),
        '',
        'Stable keys: use durable resource identities for server-backed rows, generated immutable row IDs for editable local arrays, and avoid mutable field values as the only key when rows can be edited.',
        'Curated model deploy: if still unresolved, surface post-deploy route creation failures as visible partial-success/error state while preserving service creation success semantics and existing onDeploy refresh behavior.',
        'ApprovalModeToggle: implement standard radiogroup keyboard support for ArrowLeft/ArrowUp, ArrowRight/ArrowDown, Home, and End. Keep click/tap behavior and accessibility attributes intact.',
        'Colors: migrate hardcoded colors only in files touched for this issue or in a small shared helper needed by those files. Prefer existing CSS variables and add narrowly named variables only when no existing token matches.',
        'Do not broaden into static markdown/render-only keys, unrelated console.warn calls, or a full 735-instance color migration.',
        'Run the narrow tests until they pass before returning.',
        'Preserve unrelated dirty workspace files; stage or commit nothing in this implementation process unless a later publication task explicitly asks for it.',
        'Return JSON: { changedFiles, summary, keyChanges, deployErrorBehavior, keyboardBehavior, colorTokenChanges, testCommands, testResults, decisions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'testCommands', 'testResults'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyQualityGatesTask = defineTask('issue-613.verify-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify deterministic quality gates',
  labels: ['issue-613', 'kradle-web', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'verification engineer',
      task: 'Run and report the quality gates for issue #613.',
      instructions: [
        specBlock(args),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'Run these verification commands from the repository root unless a command specifies otherwise:',
        JSON.stringify(args.verificationCommands ?? [], null, 2),
        '',
        'Also run any narrower test commands added by the implementation if they are not covered by the list above.',
        'For UI changes, include either Playwright e2e evidence or a concrete reason why the existing Playwright suite cannot be run in this environment.',
        'Report every command with exit code and relevant output. Do not mark passed if a command was skipped without a concrete reason.',
        'Return JSON: { passed, commands, failures, skipped, staticGuardrails, notes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'failures', 'skipped'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewAgainstSpecTask = defineTask('issue-613.review-against-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation against #613 spec',
  labels: ['issue-613', 'kradle-web', 'review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior code reviewer and accessibility reviewer',
      task: 'Review the working tree diff against the issue spec, current-state scope, and verification evidence.',
      instructions: [
        'Compare the runtime-read issue context to the artifacts directly. Ignore narrative claims unless the diff and verification support them.',
        '',
        specBlock(args),
        '',
        'ARTIFACTS AND VERIFICATION:',
        JSON.stringify({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          scope: args.scope,
          testPlan: args.testPlan,
          implementation: args.implementation,
          verification: args.verification,
        }, null, 2),
        '',
        'Review the actual diff in the working tree.',
        'Block on index keys remaining in issue-scoped dynamic lists, mutable fields used as sole keys for editable rows, missing visible deploy route failure state, incomplete radiogroup key handling, broad unrelated color churn, failing verification, or missing tests.',
        'Return JSON: { approved, issues, requiredFixes, residualRisk, changedFiles }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'issues', 'requiredFixes', 'residualRisk'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-613.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate',
  labels: ['issue-613', 'kradle-web', 'final-acceptance'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release readiness reviewer',
      task: 'Decide whether the issue #613 implementation is complete and ready for PR finalization.',
      instructions: [
        specBlock(args),
        '',
        'ATTEMPTS:',
        JSON.stringify(args.attempts ?? [], null, 2),
        '',
        'Confirm every unresolved acceptance criterion identified by current-state scope is satisfied.',
        'Confirm the implementation stayed within the requested source scope and did not include unrelated refactors.',
        'Confirm verification passed, or list exact failures and whether they are unrelated/pre-existing with evidence.',
        'Return JSON: { passed, changedFiles, acceptanceChecklist, verificationSummary, residualRisk, needsHumanDecision, question }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'acceptanceChecklist', 'verificationSummary', 'residualRisk'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
