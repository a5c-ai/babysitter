/**
 * @process repo/issue-600-deduplicate-background-registry-shell-invocation
 * @description Plan and execute issue #600: deduplicate background process registry/state and shell invocation across agent-core, agent-runtime, and agent-platform.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: array, verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-reference/repo-map.md
 * - docs/agent-layer-gaps.md
 * - docs/here-be-dragons.md
 * - .a5c/processes/issue-136-session-resolution-leak.mjs
 * - methodologies/pilot-shell/pilot-shell-feature.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Canonical background registry/state already exists in @a5c-ai/agent-runtime:
 *   packages/agent-runtime/src/backgroundProcessRegistry.ts and
 *   packages/agent-runtime/src/background/state.ts.
 * - agent-core already uses compatibility re-export shims:
 *   packages/agent-core/src/backgroundProcessRegistry.ts and
 *   packages/agent-core/src/agenticTools/background/state.ts.
 * - agent-platform still carries copied registry/state:
 *   packages/tula-platform/src/harness/backgroundProcessRegistry.ts and
 *   packages/tula-platform/src/harness/agenticTools/background/state.ts.
 * - Shell argv construction is repeated in session execution, foreground bash
 *   tools, and background process spawning. No shared shell invocation helper
 *   was found in the inspected paths.
 * - agent-platform already depends on @a5c-ai/agent-runtime, so the plan should
 *   prefer re-export/import consolidation over new infrastructure.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-600.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-600.reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceRuntimePathsTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-600.runtime-trace',
  });

  const regressionPlan = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
  }, {
    key: 'issue-600.author-regression-tests',
  });

  const designReview = await ctx.task(reviewRefactorDesignTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    regressionPlan,
  }, {
    key: 'issue-600.design-review',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementFocusedRefactorTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      designReview,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-600.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-600.verification.${attempt}`,
    });

    review = await ctx.task(reviewCompatibilityTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      designReview,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-600.compatibility-review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    regressionPlan,
    designReview,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-600.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #600 Deduplication Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Proceed with recommended scope', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-600', 'architecture-refactor'],
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
      'runtime-call-path-trace',
      'regression-tests',
      'design-review',
      'focused-refactor',
      'verification-loop',
      'compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    reuseAudit,
    regressionPlan,
    designReview,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-600.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #600 and architecture-debt context',
  labels: ['agent-stack', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-stack architect',
      task: 'Read the GitHub issue and produce the authoritative behavioral spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read docs/agent-layer-gaps.md and docs/here-be-dragons.md only for entries directly related to background registries, shell invocation, endpoint resolution, and plugin registry duplication.',
        'Treat the issue body, every comment, and labels as the source of truth. Preserve raw observations that downstream tasks can compare against.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, acceptanceCriteria, explicitNonGoals, relatedIssues, affectedFilesFromIssue, risks, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-600.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform Phase 0 reuse audit',
  labels: ['agent-stack', 'reuse-audit', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Find existing infrastructure that should be reused before proposing new helpers or registries.',
      instructions: [
        'This is Phase 0 -- REUSE-AUDIT. Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the issue: background process registry, background state, registryId, shell invocation, spawn, cmd.exe /c, /bin/bash -c, compatibility shim, deep import, agent-core, agent-runtime, agent-platform.',
        'Search the repo for matching implementations, package dependencies, public exports, imports, test coverage, and docs. Use rg or equivalent.',
        'Start with these paths:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Check whether @a5c-ai/agent-runtime already exposes the needed registry/state/shell contracts and whether agent-platform can depend on them without reversing package boundaries.',
        'Identify existing tests that can be extended instead of adding duplicate suites.',
        'Return JSON: { findingsMarkdown, existingInfrastructure, duplicateImplementations, importAndExportMap, candidateTestFiles, packageBoundaryNotes, noNewInfrastructureNeeded, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimePathsTask = defineTask('issue-600.trace-runtime-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace background and shell runtime call paths',
  labels: ['agent-stack', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior runtime engineer',
      task: 'Map the live execution paths before any code changes.',
      instructions: [
        'Work from the issue context and reuse-audit JSON below. Inspect the current codebase directly.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Trace foreground bash execution from agent-core and agent-platform createExecutionTools through spawnAsync.',
        'Trace agent-core session executeCommand shell spawning.',
        'Trace background bash execution from createExecutionTools(run_in_background) through getBackgroundRegistry, BackgroundProcessRegistry.spawn, lifecycle callbacks, background list/get/cancel tools, dispose, and killAll.',
        'Trace package exports and deep-import paths for backgroundProcessRegistry and background/state in agent-core, agent-runtime, and agent-platform.',
        'Confirm whether agent-platform AgenticToolOptions can adopt the runtime BackgroundRegistryOwner shape, including registryId, without widening public API unexpectedly.',
        'Keep endpoint resolution and SDK plugin registry duplication as explicitly out-of-scope unless the issue comments require them for this implementation.',
        'Return JSON: { rootCause, runtimeCallPaths, duplicatedFiles, liveEntryPoints, publicImportPaths, packageBoundaryFindings, proposedDesign, testsToAddOrUpdate, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-600.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression coverage before implementation',
  labels: ['agent-stack', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer practicing strict TDD',
      task: 'Add or update tests for issue #600 before implementation changes.',
      instructions: [
        'You own test files only in this task. Do not modify implementation files.',
        'Do not read files outside the target packages except existing tests needed to follow local patterns.',
        'Use the issue context, reuse-audit, and runtime trace JSON below as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Add focused coverage proving one shared shell invocation contract constructs Windows argv as cmd.exe /c <command> and POSIX argv as /bin/bash -c <command>.',
        'Add or update background registry/state coverage proving agent-platform consumes the same registry/state behavior as agent-runtime, including max concurrency, onComplete, stdout/stderr capture, cancel, killAll, dispose, and registryId reuse across recreated options objects.',
        'Add compatibility coverage for public or known deep-import paths that must continue to resolve after duplicate files become shims.',
        'Run the relevant tests to confirm the new tests fail for the expected pre-implementation reason, not syntax or fixture errors. If the repo-specific process policy prevents a shell subtask, run commands within this agent task and report exact command output.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsRun, failureEvidence, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewRefactorDesignTask = defineTask('issue-600.review-refactor-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review deduplication design before implementation',
  labels: ['agent-stack', 'architecture-review', 'package-boundaries'],
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'senior architecture reviewer',
      task: 'Validate that the proposed refactor is complete, atomic, and does not create package-boundary regressions.',
      instructions: [
        'Review the runtime trace and regression-test plan before implementation starts.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Challenge assumptions about package dependency direction, public exports, deep imports, Windows/POSIX command semantics, and background lifecycle behavior.',
        'Approve only if the plan keeps the implementation focused on background registry/state and shell invocation. Endpoint resolution and SDK plugin registry duplication should remain separate unless required by discovered coupling.',
        'Return JSON: { approved, issues, risks, revisionRequests, implementationOrder, compatibilityRequirements }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFocusedRefactorTask = defineTask('issue-600.implement-focused-refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement focused deduplication attempt ${args.attempt}`,
  labels: ['agent-stack', 'implementation', 'refactor'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-stack engineer',
      task: 'Implement the focused issue #600 refactor.',
      instructions: [
        'You own only the files required to deduplicate background registry/state and shell invocation, plus tests/docs that must change with those behaviors.',
        'Do not weaken or rewrite the regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Regression test context JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Design review JSON:',
        JSON.stringify(args.designReview, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Make agent-runtime the canonical owner for background registry/state behavior. Convert agent-platform duplicate implementations into compatibility shims or imports from @a5c-ai/agent-runtime where package boundaries allow.',
        'Preserve public and known deep-import paths in agent-core and agent-platform unless the design review explicitly approves a breaking removal.',
        'Introduce one shared shell invocation helper/contract for command shell selection and argv construction. Use it from agent-core session executeCommand, agent-core bash tool foreground/background paths, agent-platform bash tool foreground/background paths, and background process spawning.',
        'Keep the existing behavior: Windows uses cmd.exe with /c, non-Windows uses /bin/bash with -c, shell:false, windowsHide where appropriate, cwd/env semantics unchanged, stdout/stderr capture unchanged.',
        'Remove or update HERE BE DRAGONS comments that refer to duplicated shell logic once the duplication is removed; do not leave docs claiming duplication remains.',
        'Keep endpoint resolution and SDK plugin registry unification out of this PR unless implementation proves they are unavoidable dependencies.',
        'Return JSON: { changedFiles, summary, backgroundRegistrySemantics, shellInvocationSemantics, compatibilityNotes, docsUpdated, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-600.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run verification gate for issue #600 attempt ${args.attempt}`,
  labels: ['agent-stack', 'verification', 'tests'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run the targeted and package-level verification gates and interpret failures.',
      instructions: [
        'Run the commands listed in inputs.verificationCommands. The repo-specific process policy asks for agent tasks rather than shell subtasks, so execute commands directly in this task and report exact command, exit code, and relevant output.',
        'Inputs verification commands:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Also run targeted tests named by the regression plan if they are not covered by the command list.',
        'Verify there are no remaining duplicated shell-selection blocks in the affected live execution paths except inside the single shared helper/contract and tests.',
        'Verify agent-platform background registry/state no longer carries a full copied implementation when a runtime import or compatibility shim is sufficient.',
        'Verify package builds still respect dependency direction and public exports.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Return JSON: { passed, commandsRun, failedCommands, duplicateShellScan, duplicateRegistryScan, changedFilesVerified, unrelatedFailures, nextFixes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCompatibilityTask = defineTask('issue-600.review-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review compatibility and architecture for issue #600 attempt ${args.attempt}`,
  labels: ['agent-stack', 'review', 'compatibility'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior compatibility auditor for TypeScript monorepos',
      task: 'Review the refactor for compatibility, package-boundary, and behavior regressions.',
      instructions: [
        'Review the implementation against the issue context, runtime trace, regression plan, design review, and verification output.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Design review JSON:',
        JSON.stringify(args.designReview, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Check public and deep-import compatibility for backgroundProcessRegistry and background/state in agent-core and agent-platform.',
        'Check Windows/POSIX shell argv construction, cwd/env handling, timeout handling, stream capture, onComplete, cancellation, killAll, dispose, max concurrency, and registryId reuse.',
        'Check that duplication has decreased rather than moved under another copied helper in multiple packages.',
        'Check docs/here-be-dragons.md and docs/agent-layer-gaps.md if the implementation changes claims in those docs.',
        'Return JSON: { approved, findings, requiredFixes, compatibilityMatrix, residualRisks, needsHumanDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-600.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #600',
  labels: ['agent-stack', 'final-gate', 'spec-guard'],
  agent: {
    name: 'spec-guard',
    prompt: {
      role: 'spec completion guardian',
      task: 'Compare the issue requirements to the implementation artifacts directly and decide whether the run can complete.',
      instructions: [
        'Ignore any narrative in your context about how artifacts were built. Compare the issue context to the final implementation, verification, and review evidence.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Design review JSON:',
        JSON.stringify(args.designReview, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Compatibility review JSON:',
        JSON.stringify(args.review, null, 2),
        'Attempt history JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Acceptance requires: tests-first evidence, runtime call paths recorded, platform background registry/state deduplicated through runtime or compatibility shims, one shared shell invocation contract used by all live paths, targeted and package verification run, compatibility review approved, and no unapproved expansion into endpoint/plugin-registry work.',
        'If a maintainer decision is required, set needsHumanDecision true and provide one concise question with the recommended option first.',
        'Return JSON: { passed, changedFiles, criteria, unresolvedItems, needsHumanDecision, question, releaseNotesCandidate }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
