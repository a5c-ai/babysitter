/**
 * @process repo/issue-367-global-babysitter-shim-preflight
 * @description Plan and execute the fix for issue #367: a global babysitter shim can exist while pointing at a missing SDK CLI module, and current skill fallback guidance can choose an ambiguous npx command.
 * @inputs { issueNumber: number, baseBranch: string, labels: string[], issueBody: string, triageComment: string, targetFiles: string[], testTargets: string[], qualityCommands: string[], packageHealthChecks: string[], maxVerificationAttempts: number }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], diagnostics: object, design: object, regression: object, implementation: object, qualityGate: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - library/processes/shared/runtime-call-tracer.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/deterministic-quality-gate.js
 * - library/processes/shared/n-strikes-escalation.js
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_VERIFICATION_ATTEMPTS = 2;

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 367,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    triageComment: inputs?.triageComment,
    affectedComponents: inputs?.affectedComponents ?? [],
    expectedBehavior: inputs?.expectedBehavior,
    actualBehavior: inputs?.actualBehavior,
  };

  const issueSpec = await ctx.task(readIssueSpecTask, {
    issueNumber: issueContext.issueNumber,
    seedIssueContext: issueContext,
  }, {
    key: 'issue-367.issue-spec',
  });

  const diagnostics = await ctx.task(traceCliInstallSurfacesTask, {
    issueContext: issueSpec,
    targetFiles: inputs?.targetFiles ?? [],
    packageHealthChecks: inputs?.packageHealthChecks ?? [],
  }, {
    key: 'issue-367.trace-cli-install-surfaces',
  });

  const design = await ctx.task(designPreflightRepairTask, {
    issueContext: issueSpec,
    diagnostics,
    constraints: inputs?.constraints ?? [],
    packageHealthChecks: inputs?.packageHealthChecks ?? [],
  }, {
    key: 'issue-367.design-preflight-repair',
  });

  if (design?.needsMaintainerDecision === true) {
    const bp = await ctx.breakpoint({
      breakpointId: 'issue-367.release-or-install-decision',
      title: 'Issue #367 release/install decision',
      question: design.question ?? 'Review the issue #367 design decision before implementation continues.',
      options: [
        'Proceed with recommended preflight/repair plan',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['issue-367', 'sdk', 'plugins', 'release'],
      context: {
        runId: ctx.runId,
        issueNumber: issueContext.issueNumber,
        diagnostics,
        design,
      },
    });

    if (bp && bp.approved === false) {
      return {
        success: false,
        blocked: true,
        reason: 'Maintainer paused the run at the release/install decision breakpoint.',
        feedback: bp.feedback,
        phases: ['issue-spec', 'diagnostics', 'design'],
        diagnostics,
        design,
      };
    }
  }

  const regression = await ctx.task(authorRegressionCoverageTask, {
    issueContext: issueSpec,
    diagnostics,
    design,
    testTargets: inputs?.testTargets ?? [],
  }, {
    key: 'issue-367.regression-coverage',
  });

  let implementation = null;
  let qualityGate = null;
  let review = null;
  let verificationFeedback = null;
  const attempts = [];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? DEFAULT_MAX_VERIFICATION_ATTEMPTS;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    implementation = await ctx.task(implementPreflightRepairTask, {
      issueContext: issueSpec,
      diagnostics,
      design,
      regression,
      targetFiles: inputs?.targetFiles ?? [],
      verificationFeedback,
      attempt,
    }, {
      key: `issue-367.implementation.${attempt}`,
    });

    qualityGate = await ctx.task(runQualityGateTask, {
      issueContext: issueSpec,
      diagnostics,
      design,
      regression,
      implementation,
      qualityCommands: inputs?.qualityCommands ?? [],
      packageHealthChecks: inputs?.packageHealthChecks ?? [],
      attempt,
    }, {
      key: `issue-367.quality-gate.${attempt}`,
    });

    review = await ctx.task(reviewFixTask, {
      issueContext: issueSpec,
      diagnostics,
      design,
      regression,
      implementation,
      qualityGate,
      attempt,
    }, {
      key: `issue-367.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, qualityGate, review });

    if (qualityGate?.passed === true && qualityGate?.cliFallbackVerified === true && qualityGate?.packageHealthVerified === true && review?.approved === true) {
      break;
    }

    verificationFeedback = { qualityGate, review };
  }

  if (qualityGate?.passed !== true || qualityGate?.cliFallbackVerified !== true || qualityGate?.packageHealthVerified !== true || review?.approved !== true) {
    const bp = await ctx.breakpoint({
      breakpointId: 'issue-367.quality-gate-failed',
      title: 'Issue #367 quality gate failed',
      question: 'The issue #367 quality gate or review did not pass within the configured attempts. Review the latest failures before any further changes?',
      options: [
        'Continue with another repair attempt',
        'Stop and report current failures',
      ],
      expert: 'owner',
      tags: ['issue-367', 'quality-gate', 'sdk'],
      context: {
        runId: ctx.runId,
        attempts,
        qualityGate,
        review,
      },
    });

    if (bp && bp.approved === false) {
      return {
        success: false,
        phases: [
          'issue-spec',
          'diagnostics',
          'design',
          'regression-coverage',
          'implementation-loop',
          'quality-gate',
          'review',
        ],
        stoppedAt: 'quality-gate-failed',
        feedback: bp.feedback,
        diagnostics,
        design,
        regression,
        implementation,
        qualityGate,
        review,
        attempts,
      };
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    issueContext: issueSpec,
    diagnostics,
    design,
    regression,
    implementation,
    qualityGate,
    review,
    attempts,
    allowedChangedFiles: inputs?.allowedChangedFiles ?? inputs?.targetFiles ?? [],
  }, {
    key: 'issue-367.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-spec',
      'diagnostics',
      'design',
      'regression-coverage',
      'implementation-loop',
      'quality-gate',
      'review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    diagnostics,
    design,
    regression,
    implementation,
    qualityGate,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueSpecTask = defineTask('issue-367.read-issue-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #367 and PR context',
  labels: ['sdk', 'plugins', 'ci', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK maintainer',
      task: 'Read the issue and produce the authoritative implementation spec for issue #367.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, all comments, and labels as the source of truth.',
        'Preserve the reported Windows/Git Bash/PowerShell shim failure, Node version, missing dist/cli/main.js error, and npx fallback failure.',
        'Extract acceptance criteria for: valid global CLI detection, broken shim repair guidance, explicit npm fallback command, generated skill instruction updates, docs updates, and package health/release guard coverage.',
        'Separate code changes from release/dist-tag actions that may need maintainer approval outside this branch.',
        'Do not edit files in this phase.',
        'Return JSON: { title, labels, rawIssue, comments, acceptanceCriteria, nonGoals, packageReleaseConcerns, priority, affectedComponents, implementationHints }.',
        '',
        'Seed context from the planning dispatch:',
        JSON.stringify(args.seedIssueContext ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceCliInstallSurfacesTask = defineTask('issue-367.trace-cli-install-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace CLI install, shim, prompt, and package health surfaces',
  labels: ['sdk', 'cli', 'plugins', 'release', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK platform engineer specializing in npm CLI packaging',
      task: 'Trace every current code path that can expose, document, validate, or package the babysitter CLI.',
      instructions: [
        'Use systematic debugging before proposing changes.',
        'Read the issue context JSON below.',
        'Inspect the target files first, then follow imports, template generators, tests, and release scripts as needed.',
        'Trace the SDK package bin metadata, the @a5c-ai/babysitter metapackage shim, generated prompt setup snippets, checked-in plugin skill docs, doctor/health guidance, SDK README examples, package pack/smoke scripts, and release workflows.',
        'Identify where `npx -y @a5c-ai/babysitter-sdk` is currently documented and whether the package has multiple bins requiring an explicit executable form.',
        'Identify existing test files that can cover generated prompt snippets, CLI package metadata, metapackage shim behavior, and smoke/pack health.',
        'Identify whether the fix should include source-level tests only, release workflow checks, docs changes, checked-in skill changes, or all of these.',
        'Do not edit files in this phase.',
        'Return JSON: { rootCause, runtimeCallPaths, installSurfaces, targetTests, packageMetadataFindings, docsAndSkillFindings, releaseWorkflowFindings, risks, recommendedScope }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'TARGET FILES:',
        JSON.stringify(args.targetFiles ?? [], null, 2),
        '',
        'PACKAGE HEALTH CHECKS TO CONSIDER:',
        JSON.stringify(args.packageHealthChecks ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designPreflightRepairTask = defineTask('issue-367.design-preflight-repair', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design robust CLI preflight and repair path',
  labels: ['sdk', 'cli', 'plugins', 'design'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK release and developer-experience engineer',
      task: 'Design the minimal robust fix for issue #367.',
      instructions: [
        'Use the issue context and diagnostics JSON below as constraints.',
        'The design must validate execution, not just PATH presence: a candidate CLI must satisfy `babysitter --version` or an equivalent non-mutating health command.',
        'The fallback must avoid ambiguous npx package execution when a package has multiple bins. Prefer an explicit executable form such as `npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter ...` unless diagnostics prove a better command.',
        'Include a repair path for stale/broken global shims: explain reinstall/removal of stale @a5c-ai/babysitter and @a5c-ai/babysitter-sdk globals and re-run validation.',
        'Keep skill instructions concise enough for generated prompts while still covering the missing-module case.',
        'Include package health guards that would fail if an SDK package ships without `dist/cli/main.js`, if the SDK bin cannot run by explicit npm exec, or if the metapackage shim cannot require the SDK CLI.',
        'Decide whether release/dist-tag repair is in branch scope or should be reported as a manual release follow-up.',
        'If a maintainer decision is truly required, set needsMaintainerDecision true and provide one precise question. Otherwise set it false.',
        'Do not edit files in this phase.',
        'Return JSON: { recommendedDesign, changedFilePlan, fallbackCommand, preflightSnippet, repairGuidance, testsToAdd, qualityGatePlan, releaseFollowUps, risks, needsMaintainerDecision, question }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'DIAGNOSTICS:',
        JSON.stringify(args.diagnostics ?? {}, null, 2),
        '',
        'CONSTRAINTS:',
        JSON.stringify(args.constraints ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionCoverageTask = defineTask('issue-367.author-regression-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression coverage for broken CLI shim handling',
  labels: ['sdk', 'cli', 'plugins', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused regression tests for issue #367 before implementation changes.',
      instructions: [
        'Follow TDD: add or update tests before changing production/source guidance code.',
        'Use the issue context, diagnostics, and design JSON below as the spec source.',
        'Cover generated prompt snippets so they no longer recommend ambiguous `npx -y @a5c-ai/babysitter-sdk` fallback and do include executable validation plus explicit npm exec fallback.',
        'Cover checked-in Babysitter skill guidance if it has a testable generation/sync path; otherwise record why it is verified by diff and docs review.',
        'Cover package health: SDK package files include `dist/cli/main.js`; SDK bin metadata includes the expected babysitter executable; metapackage shim has a test or smoke guard proving it fails clearly or works when SDK dist exists.',
        'Where practical, add a test fixture that simulates a PATH shim existing while the target SDK CLI module is missing and asserts the preflight treats it as invalid.',
        'Run the narrow tests and confirm they fail for the issue-specific reason before implementation.',
        'Do not weaken or skip existing tests.',
        'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommands: string[], redOutputSummary: string, failureMatchesIssue: boolean, gaps: array }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'DIAGNOSTICS:',
        JSON.stringify(args.diagnostics ?? {}, null, 2),
        '',
        'DESIGN:',
        JSON.stringify(args.design ?? {}, null, 2),
        '',
        'TEST TARGETS:',
        JSON.stringify(args.testTargets ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementPreflightRepairTask = defineTask('issue-367.implement-preflight-repair', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement CLI preflight, fallback, docs, and package guards',
  labels: ['sdk', 'cli', 'plugins', 'implementation'],
  agent: {
    name: 'sdk-runtime-implementer',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Implement the minimal issue #367 fix according to the approved design and regression tests.',
      instructions: [
        'Keep changes scoped to SDK prompt generation, checked-in Babysitter skill/docs guidance, package metadata/shim health checks, release/package smoke guards, and tests directly needed for issue #367.',
        'Replace ambiguous `npx -y @a5c-ai/babysitter-sdk...` guidance with an explicit-bin npm exec fallback unless the design found a better proven command.',
        'Add a preflight snippet that rejects a broken shim by running `babysitter --version`, not merely `command -v babysitter` or `where babysitter`.',
        'Include actionable repair guidance for stale global shims on Unix and Windows-like npm global installs without hardcoding user-specific paths.',
        'Preserve existing public CLI command behavior and avoid changing orchestration runtime semantics unless diagnostics prove it is necessary.',
        'If generated prompt snippets require checked-in skill/docs sync, update both the source generator and checked-in generated artifact consistently.',
        'Run the narrow regression tests after implementation and record results.',
        'Do not perform npm publish, dist-tag mutation, or any external release action from this implementation run.',
        'Return JSON: { changedFiles: string[], summary: string, commandsRun: array, testsNowPassing: boolean, releaseFollowUps: array, remainingRisks: array }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'DIAGNOSTICS:',
        JSON.stringify(args.diagnostics ?? {}, null, 2),
        '',
        'DESIGN:',
        JSON.stringify(args.design ?? {}, null, 2),
        '',
        'REGRESSION:',
        JSON.stringify(args.regression ?? {}, null, 2),
        '',
        'TARGET FILES:',
        JSON.stringify(args.targetFiles ?? [], null, 2),
        '',
        'VERIFICATION FEEDBACK FROM PRIOR ATTEMPT:',
        JSON.stringify(args.verificationFeedback ?? null, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runQualityGateTask = defineTask('issue-367.run-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify issue #367 CLI and package quality gates',
  labels: ['sdk', 'cli', 'plugins', 'ci', 'verification'],
  agent: {
    name: 'sdk-runtime-verifier',
    prompt: {
      role: 'senior SDK release verifier',
      task: 'Run and interpret all quality gates for the issue #367 fix.',
      instructions: [
        'Run the listed quality commands from the repository root.',
        'Run or manually execute the package health checks in a temporary directory when needed; avoid publishing or changing external npm state.',
        'Verify the new regression tests failed in the red phase and now pass.',
        'Verify generated prompt snippets and checked-in skill docs do not contain the ambiguous `CLI="npx -y @a5c-ai/babysitter-sdk...` fallback.',
        'Verify the recommended fallback command explicitly selects the `babysitter` bin through npm exec.',
        'Verify package health guards prove `dist/cli/main.js` is included in the SDK package and the metapackage shim can resolve the SDK CLI when package artifacts are present.',
        'Inspect the final diff and confirm no unrelated source or generated files were changed.',
        'Return JSON: { passed: boolean, cliFallbackVerified: boolean, packageHealthVerified: boolean, commands: array, failures: array, changedFiles: string[], notes: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'DIAGNOSTICS:',
        JSON.stringify(args.diagnostics ?? {}, null, 2),
        '',
        'DESIGN:',
        JSON.stringify(args.design ?? {}, null, 2),
        '',
        'REGRESSION:',
        JSON.stringify(args.regression ?? {}, null, 2),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'QUALITY COMMANDS:',
        JSON.stringify(args.qualityCommands ?? [], null, 2),
        '',
        'PACKAGE HEALTH CHECKS:',
        JSON.stringify(args.packageHealthChecks ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewFixTask = defineTask('issue-367.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #367 fix against spec',
  labels: ['sdk', 'cli', 'plugins', 'review'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior code reviewer for SDK CLI packaging and developer experience',
      task: 'Review the issue #367 fix against the issue spec and implementation design.',
      instructions: [
        'Lead with blocking bugs, behavioral regressions, missed acceptance criteria, and missing tests.',
        'Confirm the fix handles the central failure mode: a global shim exists but its target SDK CLI module is missing.',
        'Confirm the fallback command is explicit enough for npm packages with multiple bins and works with version pinning.',
        'Confirm Windows/Git Bash/PowerShell users get usable guidance without relying on a single platform command.',
        'Confirm package health checks would have caught the broken 5.0.0-style publish missing `dist/cli/main.js`.',
        'Confirm the implementation did not perform external release/tag mutations and clearly reports any required manual release follow-up.',
        'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, missingTests: array, finalSummary: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'DIAGNOSTICS:',
        JSON.stringify(args.diagnostics ?? {}, null, 2),
        '',
        'DESIGN:',
        JSON.stringify(args.design ?? {}, null, 2),
        '',
        'REGRESSION:',
        JSON.stringify(args.regression ?? {}, null, 2),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'QUALITY GATE:',
        JSON.stringify(args.qualityGate ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-367.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #367',
  labels: ['sdk', 'cli', 'plugins', 'final-gate'],
  agent: {
    name: 'sdk-release-steward',
    prompt: {
      role: 'release-minded SDK maintainer',
      task: 'Produce the final acceptance verdict for issue #367.',
      instructions: [
        'Compare the final state against every acceptance criterion from the issue and triage comment.',
        'Confirm qualityGate.passed, cliFallbackVerified, packageHealthVerified, and review.approved are all true.',
        'Confirm changed files are limited to the planned CLI/prompt/docs/package/test/release-guard scope.',
        'Confirm any npm dist-tag or publish repair remains a documented follow-up and was not attempted by this run.',
        'Confirm the branch is ready for a development PR that links issue #367.',
        'Return JSON: { passed: boolean, changedFiles: string[], acceptanceCriteriaStatus: array, releaseFollowUps: array, summary: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'DIAGNOSTICS:',
        JSON.stringify(args.diagnostics ?? {}, null, 2),
        '',
        'DESIGN:',
        JSON.stringify(args.design ?? {}, null, 2),
        '',
        'REGRESSION:',
        JSON.stringify(args.regression ?? {}, null, 2),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'QUALITY GATE:',
        JSON.stringify(args.qualityGate ?? {}, null, 2),
        '',
        'REVIEW:',
        JSON.stringify(args.review ?? {}, null, 2),
        '',
        'ATTEMPTS:',
        JSON.stringify(args.attempts ?? [], null, 2),
        '',
        'ALLOWED CHANGED FILES:',
        JSON.stringify(args.allowedChangedFiles ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
