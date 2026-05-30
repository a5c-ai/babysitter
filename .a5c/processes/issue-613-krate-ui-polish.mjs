/**
 * @process repo/issue-613-krate-ui-polish
 * @description Implement Krate web UI polish for stable React keys, deploy feedback, color tokens, and approval-mode keyboard navigation.
 * @inputs { issueNumber: number, repo: string, packagePath: string, targetFiles: string[], maxImplementationAttempts?: number }
 * @outputs { success: boolean, tests, implementation, verification, review, runtimeCallPaths }
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/web-development/react-app-development
 * @process specializations/web-development/keyboard-navigation-focus
 * @process specializations/web-development/e2e-testing-playwright
 * @agent web-code-reviewer specializations/web-development/agents/code-reviewer/AGENT.md
 * @agent e2e-testing specializations/web-development/agents/e2e-testing/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readSpecAndContextTask = defineTask('issue-613.read-spec-and-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #613 and Krate UI context',
  labels: ['issue-613', 'context', 'spec'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- referenced gap document ---\\n"',
      'sed -n "1,140p" packages/krate/docs/gaps/ui-ux-remaining.md',
      'printf "\\n--- krate web package scripts ---\\n"',
      'node -e "const p=require(\'./packages/krate/web/package.json\'); console.log(JSON.stringify({scripts:p.scripts}, null, 2))"',
      'printf "\\n--- targeted key/warn/radiogroup evidence ---\\n"',
      'rg -n "key=\\\\{i\\\\}|key=\\\\{idx\\\\}|console\\\\.warn|role=\\\\\\"radiogroup\\\\\"|#[0-9a-fA-F]{6}" packages/krate/web/app/components/agent/session-cost.jsx packages/krate/web/app/components/external/external-conflict-resolver.jsx packages/krate/web/app/components/inference/virtual-model-manager.jsx packages/krate/web/app/components/inference/inference-service-list.jsx packages/krate/web/app/components/settings/secret-manager.jsx packages/krate/web/app/components/inference/curated-model-catalog.jsx packages/krate/web/app/components/agent/approval-mode-toggle.jsx || true',
      'printf "\\n--- relevant tests ---\\n"',
      'find packages/krate/web/tests packages/krate/web/e2e -maxdepth 2 -type f | sort',
      'printf "\\n--- git state ---\\n"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionTestsTask = defineTask('issue-613.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression tests for issue #613',
  labels: ['issue-613', 'tdd', 'red'],
  agent: {
    name: 'krate-ui-test-engineer',
    prompt: {
      role: 'senior React test engineer',
      task: 'Write focused failing tests for the Krate UI polish issue before implementation.',
      instructions: [
        'Use the existing node:test style under packages/krate/web/tests.',
        'Create or update a focused test file for issue #613, and make sure it can be run directly with node --test.',
        'Do not read files under packages/krate/web/app/components while authoring these tests. Author tests strictly from the spec text and existing test harness patterns.',
        'Cover all issue areas: mutable list keys, curated model deploy route failure feedback, approval-mode radiogroup arrow/Home/End behavior, and color-token migration scope.',
        'Tests may use static source assertions when the project has no React component test renderer, but each assertion must map to one acceptance criterion from SPEC.',
        'Return JSON: { testFiles: string[], runCommand: string, coveredCriteria: string[], notes: string[] }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runRedGateTask = defineTask('issue-613.run-red-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify new issue #613 tests fail before implementation',
  labels: ['issue-613', 'tdd', 'red-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      `cd ${args.packagePath}`,
      args.runCommand || 'node --test tests/ui-polish-issue-613.test.js',
    ].join('\n'),
    expectedExitCode: 1,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const validateRedGateTask = defineTask('issue-613.validate-red-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate RED failure reason',
  labels: ['issue-613', 'tdd', 'red-review'],
  agent: {
    name: 'krate-ui-red-gate-reviewer',
    prompt: {
      role: 'test reviewer',
      task: 'Determine whether the failing tests fail for the intended missing issue #613 behavior.',
      instructions: [
        'Return JSON: { validRed: boolean, problems: string[], requiredTestFixes: string[] }.',
        'Do not approve syntax errors, missing imports, wrong paths, or tests that are unrelated to the SPEC.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'RED OUTPUT (verbatim):',
        '---',
        args.redStdout,
        args.redStderr,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviseRegressionTestsTask = defineTask('issue-613.revise-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise invalid RED tests',
  labels: ['issue-613', 'tdd', 'red-repair'],
  agent: {
    name: 'krate-ui-test-engineer',
    prompt: {
      role: 'senior React test engineer',
      task: 'Repair the issue #613 regression tests so their RED failure is meaningful.',
      instructions: [
        'Edit only issue #613 test files and package test wiring if needed.',
        'Fix the problems identified by the RED reviewer without weakening acceptance coverage.',
        'Return JSON: { testFiles: string[], runCommand: string, fixes: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'REVIEW (verbatim):',
        '---',
        JSON.stringify(args.redReview ?? {}, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementUiPolishTask = defineTask('issue-613.implement-ui-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement issue #613 Krate UI polish',
  labels: ['issue-613', 'implementation', 'krate-web'],
  agent: {
    name: 'krate-ui-implementer',
    prompt: {
      role: 'senior Krate web UI engineer',
      task: 'Implement the focused issue #613 UI polish changes.',
      instructions: [
        'Edit the repository directly.',
        'Keep changes scoped to the target files, tests, CSS token definitions, and minimal package test wiring.',
        'Trace and record runtimeCallPaths for every modified component from the page/component entry point to the affected map, fetch, or interaction.',
        'Use stable domain identifiers for server-backed list keys.',
        'For editable local rows that can be inserted or removed before persistence, use immutable local row IDs created when rows are added; do not derive keys from mutable user-entered fields or array positions.',
        'Surface the curated model post-deploy route creation failure in visible UI state. Do not leave the user-initiated route failure as console.warn-only feedback.',
        'Add standard radiogroup keyboard support to ApprovalModeToggle for ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, and End while preserving click/tap behavior.',
        'Migrate only the high-impact hardcoded colors in touched issue files to named CSS variables or existing variables. Avoid a broad all-repo color rewrite.',
        'Preserve unrelated dirty workspace changes.',
        'Return JSON: { changedFiles: string[], summary: string, runtimeCallPaths: string[], colorVariables: string[], testsUpdated: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'TEST PLAN (verbatim):',
        '---',
        JSON.stringify(args.tests ?? {}, null, 2),
        '---',
        '',
        'RED REVIEW (verbatim):',
        '---',
        JSON.stringify(args.redReview ?? {}, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyImplementationTask = defineTask('issue-613.verify-implementation', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run Krate web deterministic verification',
  labels: ['issue-613', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      `cd ${args.packagePath}`,
      'node --test tests/ui-polish-issue-613.test.js',
      'npm test',
      'npm run build',
      'npm run test:e2e',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const staticGuardrailsTask = defineTask('issue-613.static-guardrails', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run issue-specific static guardrails',
  labels: ['issue-613', 'verification', 'guardrails'],
  shell: {
    command: [
      'set -euo pipefail',
      '! rg -n "key=\\\\{i\\\\}|key=\\\\{idx\\\\}" packages/krate/web/app/components/agent/session-cost.jsx packages/krate/web/app/components/external/external-conflict-resolver.jsx packages/krate/web/app/components/inference/virtual-model-manager.jsx packages/krate/web/app/components/inference/inference-service-list.jsx packages/krate/web/app/components/settings/secret-manager.jsx',
      "! rg -n \"catch\\\\(\\\\(err\\\\) => console\\\\.warn\\\\('\\[krate\\]'\" packages/krate/web/app/components/inference/curated-model-catalog.jsx",
      'rg -n "onKeyDown|ArrowLeft|ArrowRight|Home|End" packages/krate/web/app/components/agent/approval-mode-toggle.jsx',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-613.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #613 implementation artifacts',
  labels: ['issue-613', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/krate/web packages/krate/docs . ":!.codex/**" ":!plugins/babysitter/**" ":!.agents/plugins/marketplace.json"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewAgainstSpecTask = defineTask('issue-613.review-against-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #613 implementation against spec',
  labels: ['issue-613', 'review', 'quality-gate'],
  agent: {
    name: 'krate-ui-code-reviewer',
    prompt: {
      role: 'code reviewer focused on React correctness, accessibility, and visual consistency',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Check that mutable rows do not use index-derived keys and that local editable rows have immutable IDs.',
        'Check that deploy route failure is user-visible.',
        'Check that radiogroup keyboard behavior follows standard arrow/Home/End expectations.',
        'Check that color migration is incremental and token-based, not an unsafe broad rewrite.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisk: string[], needsHumanColorReview: boolean }.',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        args.guardrailsStdout,
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const refineImplementationTask = defineTask('issue-613.refine-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine issue #613 implementation',
  labels: ['issue-613', 'refinement'],
  agent: {
    name: 'krate-ui-implementer',
    prompt: {
      role: 'senior Krate web UI engineer',
      task: 'Fix the review findings without expanding issue #613 scope.',
      instructions: [
        'Edit the repository directly.',
        'Address every review issue that is supported by SPEC.',
        'Do not weaken or remove regression tests to pass verification.',
        'Keep changes scoped to the target files, tests, and minimal CSS token definitions.',
        'Return JSON: { changedFiles: string[], fixes: string[], remainingRisk: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'REVIEW (verbatim):',
        '---',
        JSON.stringify(args.review ?? {}, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const unresolvedReviewBreakpointTask = defineTask('issue-613.unresolved-review-breakpoint', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Issue #613 review needs human decision',
  labels: ['issue-613', 'breakpoint'],
  breakpoint: {
    question: 'Issue #613 still has unresolved review findings after the configured refinement attempts. Continue refining, accept residual risk, or stop?',
    expert: 'owner',
    tags: ['issue-613', 'review-gate'],
    context: {
      issueNumber: args.issueNumber,
      review: args.review,
      attempts: args.attempts,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const spec = await ctx.task(readSpecAndContextTask, {
    issueNumber: inputs.issueNumber,
  });

  let tests = await ctx.task(authorRegressionTestsTask, {
    specStdout: spec.stdout,
  });

  let redReview = null;
  for (let attempt = 0; attempt < (inputs.maxRedAttempts ?? 2); attempt += 1) {
    const red = await ctx.task(runRedGateTask, {
      packagePath: inputs.packagePath,
      runCommand: tests.runCommand,
    });
    redReview = await ctx.task(validateRedGateTask, {
      specStdout: spec.stdout,
      redStdout: red.stdout,
      redStderr: red.stderr,
    });
    if (redReview.validRed) break;
    tests = await ctx.task(reviseRegressionTestsTask, {
      specStdout: spec.stdout,
      redReview,
    });
  }

  if (!redReview?.validRed) {
    await ctx.task(unresolvedReviewBreakpointTask, {
      issueNumber: inputs.issueNumber,
      review: redReview,
      attempts: inputs.maxRedAttempts ?? 2,
    });
  }

  let implementation = null;
  let verification = null;
  let guardrails = null;
  let artifacts = null;
  let review = null;

  for (let attempt = 0; attempt < (inputs.maxImplementationAttempts ?? 2); attempt += 1) {
    implementation = await ctx.task(implementUiPolishTask, {
      specStdout: spec.stdout,
      tests,
      redReview,
      targetFiles: inputs.targetFiles,
    });

    verification = await ctx.task(verifyImplementationTask, {
      packagePath: inputs.packagePath,
    });
    guardrails = await ctx.task(staticGuardrailsTask, {});
    artifacts = await ctx.task(readArtifactsTask, {});
    review = await ctx.task(reviewAgainstSpecTask, {
      specStdout: spec.stdout,
      artifactsStdout: artifacts.stdout,
      verificationStdout: verification.stdout,
      guardrailsStdout: guardrails.stdout,
    });

    if (review.approved && !review.needsHumanColorReview) break;

    if (attempt + 1 < (inputs.maxImplementationAttempts ?? 2)) {
      await ctx.task(refineImplementationTask, {
        specStdout: spec.stdout,
        review,
      });
    }
  }

  if (!review?.approved || review?.needsHumanColorReview) {
    await ctx.task(unresolvedReviewBreakpointTask, {
      issueNumber: inputs.issueNumber,
      review,
      attempts: inputs.maxImplementationAttempts ?? 2,
    });
  }

  return {
    success: Boolean(review?.approved),
    tests,
    implementation,
    verification: {
      stdout: verification?.stdout,
      guardrails: guardrails?.stdout,
    },
    review,
    runtimeCallPaths: implementation?.runtimeCallPaths || [],
  };
}
