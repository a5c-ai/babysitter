/**
 * @process repo/issue-140-observer-dashboard-launch-plan
 * @description Plan and execute the fix for issue #140: the observe skill must launch a working observer dashboard package with an executable CLI artifact.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, packageName: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - cradle/bugfix.js
 * - processes/shared/tdd-triplet.js
 * - specializations/sdk-platform-development/package-distribution.js
 * - specializations/sdk-platform-development/sdk-versioning-release-management.js
 * - specializations/qa-testing-automation/quality-gates.js
 * - specializations/collaboration/github/pr-policies.js
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent cli-ux-reviewer specializations/sdk-platform-development/agents/cli-ux-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-140.read-issue-context',
  });

  const runtimeTrace = await ctx.task(traceObserverLaunchPathTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-140.trace-observer-launch-path',
  });

  const regressionPlan = await ctx.task(authorRegressionAndReleaseGuardsTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-140.author-regression-and-release-guards',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementObserverLaunchFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-140.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      implementation,
      attempt,
    }, {
      key: `issue-140.verification.${attempt}`,
    });

    review = await ctx.task(reviewObserverLaunchFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-140.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const artifacts = await ctx.task(captureFinalArtifactsTask, inputs, {
    key: 'issue-140.capture-final-artifacts',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    runtimeTrace,
    regressionPlan,
    implementation,
    verification,
    review,
    artifacts,
    attempts,
  }, {
    key: 'issue-140.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #140 Observer Launch Decision Needed',
      question: finalGate.question,
      options: ['Proceed with recommended launch path', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-140', 'observer-dashboard'],
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
      'runtime-launch-trace',
      'regression-and-release-guards',
      'focused-implementation',
      'verification-loop',
      'review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-140.read-issue-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #140 and PR fallback context',
  labels: ['plugins', 'observer-dashboard', 'research', 'issue-context'],
  expectedExitCode: 0,
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr view ${args.issueNumber} --json files,title,body,comments 2>/dev/null || true`,
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceObserverLaunchPathTask = defineTask('issue-140.trace-observer-launch-path', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace observer dashboard launch and publish path',
  labels: ['plugins', 'observer-dashboard', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript package and release engineer',
      task: 'Trace the live observer launch path before code changes.',
      instructions: [
        'Use the issue/PR output below as the authoritative spec. Do not rely on memory of the issue.',
        'ISSUE_AND_PR_CONTEXT (verbatim):',
        '---',
        args.issueContext?.stdout ?? JSON.stringify(args.issueContext, null, 2),
        '---',
        'Inspect the current codebase and trace every live path from /babysitter:observe to a launched dashboard and from release workflows to the published npm tarball.',
        'Inspect these likely files first, then follow imports, generators, and workflow references as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Confirm whether the current package exists on npm, whether its current published tarball has the declared bin target, and whether the repository build/publish path creates that target before npm publish.',
        'Record the distinction between core babysitter CLI, optional babysitter-agent observe, and standalone @a5c-ai/babysitter-observer-dashboard command surfaces.',
        'Return JSON: { rootCause, currentPublishedState, runtimeCallPaths, releaseCallPaths, liveExecutionFiles, docsAndSkillSurfaces, testFiles, proposedDesign, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionAndReleaseGuardsTask = defineTask('issue-140.author-regression-and-release-guards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression and release guardrails before implementation',
  labels: ['plugins', 'observer-dashboard', 'tests', 'release-guard', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test and release engineer',
      task: 'Add failing guardrails for the observer dashboard launch failure before implementation changes.',
      instructions: [
        'You own tests, package-level verification scripts, and CI/release guard definitions needed to prove the package tarball is executable. Do not modify application implementation files in this task.',
        'ISSUE_AND_PR_CONTEXT (verbatim):',
        '---',
        args.issueContext?.stdout ?? JSON.stringify(args.issueContext, null, 2),
        '---',
        'RUNTIME_TRACE (verbatim JSON):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'Add the smallest deterministic guardrails that fail on the current bug and would have caught the bad publish artifact.',
        'Expected coverage: building the observer workspace creates the declared bin file, the packed tarball includes that bin file, package metadata points at an existing executable, and the built CLI responds to --help or --version without invoking a long-running server.',
        'Prefer package-local tests or a package-local verify:release script that CI and publish workflows can call. Keep model/provider-free and bounded.',
        'Return JSON: { changedFiles, testsOrScriptsAdded, expectedInitialFailures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementObserverLaunchFixTask = defineTask('issue-140.implement-observer-launch-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement observer launch fix attempt ${args.attempt}`,
  labels: ['plugins', 'observer-dashboard', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript package and release engineer',
      task: 'Implement the focused issue #140 fix.',
      instructions: [
        'Keep the change scoped to the live observer launch and publish path. Do not rewrite unrelated observer UI behavior.',
        'ISSUE_AND_PR_CONTEXT (verbatim):',
        '---',
        args.issueContext?.stdout ?? JSON.stringify(args.issueContext, null, 2),
        '---',
        'RUNTIME_TRACE (verbatim JSON):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'REGRESSION_GUARDS (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionPlan, null, 2),
        '---',
        'PREVIOUS_VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.previousVerification, null, 2),
        '---',
        'PREVIOUS_REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.previousReview, null, 2),
        '---',
        'Fix the root cause so the package build used by publish workflows produces the declared CLI bin artifact before npm publish.',
        'Expected implementation direction: make the observer workspace build produce both the Next.js app and dist/cli.js, or otherwise make all publish paths run build:cli before packing. Avoid relying on CI-only build steps that are not part of npm publish inputs.',
        'Add a release/package smoke check that inspects the packed tarball for dist/cli.js and verifies the generated CLI can print help/version.',
        'Update observe skill and generated plugin/docs surfaces only as needed to describe the verified supported command. Do not document a nonexistent core `babysitter observe` fallback; distinguish optional `babysitter-agent observe` if it remains separate.',
        'Regenerate derived plugin command/skill artifacts when the repository provides a generator, rather than hand-editing generated output alone.',
        'Return JSON: { changedFiles, summary, packageSemantics, publishSemantics, docsSemantics, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-140.run-verification-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run observer dashboard verification gate attempt ${args.attempt}`,
  labels: ['plugins', 'observer-dashboard', 'verification', 'quality-gate'],
  expectedExitCode: 0,
  shell: {
    command: [
      'set -euo pipefail',
      ...args.inputs.verificationCommands,
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewObserverLaunchFixTask = defineTask('issue-140.review-observer-launch-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review observer launch fix attempt ${args.attempt}`,
  labels: ['plugins', 'observer-dashboard', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior package release reviewer',
      task: 'Review the observer dashboard launch fix against the issue and verification evidence.',
      instructions: [
        'Compare the spec, runtime trace, implementation, and verification directly. Do not infer acceptance from a narrative summary alone.',
        'ISSUE_AND_PR_CONTEXT (verbatim):',
        '---',
        args.issueContext?.stdout ?? JSON.stringify(args.issueContext, null, 2),
        '---',
        'RUNTIME_TRACE (verbatim JSON):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'REGRESSION_GUARDS (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionPlan, null, 2),
        '---',
        'IMPLEMENTATION (verbatim JSON):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification, null, 2),
        '---',
        'Check that the packed npm artifact contains the declared bin, that the command path used by /babysitter:observe is verified, that docs/skills do not advertise nonexistent command surfaces, and that the release guard will fail on a future missing-bin tarball.',
        'Return JSON: { approved, issues, changedFiles, releaseRisks, commandSurfaceRisks, requiredFixes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const captureFinalArtifactsTask = defineTask('issue-140.capture-final-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture final issue #140 artifacts for acceptance comparison',
  labels: ['plugins', 'observer-dashboard', 'final-artifacts'],
  expectedExitCode: 0,
  shell: {
    command: [
      'set -euo pipefail',
      'git diff -- .',
      'printf "\\n--- packages/observer-dashboard/package.json ---\\n"',
      'sed -n "1,140p" packages/observer-dashboard/package.json',
      'printf "\\n--- observe skill ---\\n"',
      'sed -n "1,120p" .codex/skills/observe/SKILL.md 2>/dev/null || true',
      'sed -n "1,120p" .agents/plugins/babysitter/skills/observe/SKILL.md 2>/dev/null || true',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-140.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #140',
  labels: ['plugins', 'observer-dashboard', 'acceptance', 'quality-gate'],
  agent: {
    name: 'cli-ux-reviewer',
    prompt: {
      role: 'senior CLI and plugin release reviewer',
      task: 'Decide whether the issue #140 fix is complete.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'SPEC (verbatim):',
        '---',
        args.issueContext?.stdout ?? JSON.stringify(args.issueContext, null, 2),
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifacts?.stdout ?? JSON.stringify(args.artifacts, null, 2),
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification, null, 2),
        '---',
        'REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.review, null, 2),
        '---',
        'Pass only if the verified launch path is executable from the packed npm package, /babysitter:observe documentation points at a real supported command, release workflows cannot publish a missing-bin package, and the relevant no-model checks passed.',
        'Return JSON: { passed, needsHumanDecision, question, changedFiles, remainingRisks, evidence }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
