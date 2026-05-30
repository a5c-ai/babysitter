/**
 * @process repo/issue-531-plugin-marketplace-version-sync
 * @description Fix issue #531: plugin marketplace manifest versions stay stale, making Claude plugin update a silent no-op.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxAttempts: number, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: array, verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - cradle/bugfix
 * - methodologies/gsd/iterative-convergence
 * - .a5c/processes/issue-600-deduplicate-background-registry-shell-invocation.mjs
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Release version bumping already exists in scripts/bump-version.mjs, but the inspected path only updates .claude-plugin/marketplace.json directly.
 * - Workspace/plugin sync already exists in scripts/sync-workspace-versions.mjs, but the inspected path only updates plugins/babysitter-unified/plugin.json and plugins/babysitter-unified/versions.json.
 * - Plugin generation already resolves the unified plugin version from plugins/babysitter-unified/versions.json in scripts/generate-plugins.mjs and compares .claude-plugin/marketplace.json plus .agents/plugins/marketplace.json outputs.
 * - Staging external plugin sync already derives a prerelease TARGET_VERSION in .github/workflows/sync-external-plugins.yml before running sync-workspace-versions and generate:plugins.
 * - Existing marketplace/install surfaces to reuse or inspect include .claude-plugin/marketplace.json, .cursor-plugin/marketplace.json, .agents/plugins/marketplace.json, the generated .github/plugin marketplace surface if present, plugins/babysitter-unified/plugin.json, and plugins/babysitter-unified/versions.json.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const maxAttempts = inputs.maxAttempts ?? 3;

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-531.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-531.reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceVersionSurfacesTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-531.runtime-trace',
  });

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
  }, {
    key: 'issue-531.regression-plan',
  });

  const design = await ctx.task(designFixTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    regressionPlan,
  }, {
    key: 'issue-531.fix-design',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementFixTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      design,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-531.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyFixTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      design,
      implementation,
      attempt,
    }, {
      key: `issue-531.verification.${attempt}`,
    });

    review = await ctx.task(reviewFixTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      design,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-531.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    regressionPlan,
    design,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-531.final-acceptance',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #531 Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Proceed with recommended scope', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-531', 'plugins', 'release-automation'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  const delivery = finalGate?.passed === true
    ? await ctx.task(deliverTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      design,
      implementation,
      verification,
      review,
      finalGate,
    }, {
      key: 'issue-531.delivery',
    })
    : null;

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'runtime-call-path-trace',
      'regression-plan',
      'fix-design',
      'implementation-loop',
      'verification-gate',
      'review-gate',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    reuseAudit,
    regressionPlan,
    design,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const readIssueContextTask = defineTask('issue-531.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #531 and extract the behavioral spec',
  labels: ['issue-531', 'plugins', 'issue-context'],
  agent: {
    name: 'plugin-release-context-reader',
    prompt: {
      role: 'senior Babysitter plugin and release automation maintainer',
      task: 'Read the GitHub issue and return the authoritative implementation spec. Do not edit files.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also run: gh pr view ${args.issueNumber} --json files,title,body,comments; if GitHub says there is no PR with that number, record that result and continue.`,
        'Treat the issue body, every comment, and labels as the source of truth.',
        'Preserve the stale-update reproduction and the affected file/code-path list from the issue comment.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, acceptanceCriteria, explicitNonGoals, affectedFilesFromIssue, reproduction, priority, risks, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-531.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Phase 0 reuse audit for plugin version sync',
  labels: ['issue-531', 'reuse-audit', 'plugins'],
  agent: {
    name: 'plugin-version-reuse-auditor',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Find existing infrastructure that should be reused before changing release or plugin generation code. Do not edit files.',
      instructions: [
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract and scan these keywords: marketplace, plugin update, version, versions.json, plugin.json, gitCommitSha, release, bump-version, sync-workspace-versions, generate-plugins, sync-external-plugin-repos, claude-plugin, cursor-plugin, agents/plugins, github/plugin.',
        'Inspect package scripts, release workflows, plugin manifests, generated plugin compiler adapters, and existing tests before proposing new infrastructure.',
        'Start with target files:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Identify where the version should be sourced from and which surfaces already have version fields versus surfaces that need schema-compatible handling.',
        'Return JSON: { findingsMarkdown, existingInfrastructure, releaseEntrypoints, manifestSurfaces, generatedSurfaces, candidateTests, noNewInfrastructureNeeded, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceVersionSurfacesTask = defineTask('issue-531.trace-version-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace release version propagation paths',
  labels: ['issue-531', 'runtime-trace', 'release'],
  agent: {
    name: 'plugin-version-path-tracer',
    prompt: {
      role: 'senior release automation engineer',
      task: 'Trace live version propagation paths from release inputs to marketplace/install outputs. Do not edit files.',
      instructions: [
        'Use the issue context and reuse audit as context:',
        JSON.stringify({ issueContext: args.issueContext, reuseAudit: args.reuseAudit }, null, 2),
        'Trace these runtimeCallPaths:',
        '1. Manual release bump through scripts/bump-version.mjs into package manifests, plugins/babysitter-unified/plugin.json, versions.json, and marketplace manifests.',
        '2. CI staging sync through .github/workflows/sync-external-plugins.yml into scripts/sync-workspace-versions.mjs, npm run generate:plugins, and scripts/sync-external-plugin-repos.mjs.',
        '3. Unified plugin generation through scripts/generate-plugins.mjs and packages/extension-mux target adapters into generated marketplace files.',
        '4. Claude update decision surface: marketplace version label compared against installed plugin cache/gitCommitSha.',
        'Record source-of-truth conflicts, stale hard-coded values, and any schema differences across .claude-plugin, .cursor-plugin, .agents/plugins, and .github/plugin surfaces.',
        'Return JSON: { rootCauseHypotheses, confirmedRootCause, runtimeCallPaths, filesOnLivePath, versionSourceOfTruth, schemaNotes, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-531.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression and guardrail plan before implementation',
  labels: ['issue-531', 'tests', 'guardrail'],
  agent: {
    name: 'plugin-version-test-planner',
    prompt: {
      role: 'senior test engineer for release automation',
      task: 'Design focused tests and CI guardrails before implementation. Do not edit files.',
      instructions: [
        'Use only the issue context, reuse audit, and runtime trace. Do not inspect implementation diffs from later phases.',
        JSON.stringify({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          runtimeTrace: args.runtimeTrace,
        }, null, 2),
        'The regression must fail for the issue scenario: plugin content or gitCommitSha advances while the marketplace/install version label remains unchanged.',
        'Prefer extending existing script tests or adding a focused Node/Vitest regression over broad snapshot churn.',
        'The guardrail must cover both manual bump-version and CI sync-workspace-versions/generate-plugins paths where applicable.',
        'List exact verification commands the implementer must run:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Return JSON: { testFilesToAddOrModify, preImplementationAssertions, guardrails, verificationCommands, staleUpdateScenario, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designFixTask = defineTask('issue-531.design-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design the minimal version sync fix',
  labels: ['issue-531', 'design', 'release'],
  agent: {
    name: 'plugin-version-fix-designer',
    prompt: {
      role: 'senior Babysitter plugin maintainer',
      task: 'Design the smallest root-cause fix before editing code.',
      instructions: [
        'Use the context below and do not edit files.',
        JSON.stringify({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          runtimeTrace: args.runtimeTrace,
          regressionPlan: args.regressionPlan,
        }, null, 2),
        'The fix should make every published marketplace/install manifest that uses a version label receive the resolved release version.',
        'Prefer a shared manifest-sync helper inside existing scripts over duplicated one-off JSON mutation blocks if that reduces recurring drift.',
        'Do not invent new release state. Use package.json, the explicit bump version, the workflow-derived TARGET_VERSION, or plugins/babysitter-unified/versions.json as already appropriate on each path.',
        'Respect schemas that do not currently expose a plugin version field; decide whether to add one only if that surface uses it for update comparisons or generated output requires it.',
        'Return JSON: { designSummary, filesToChange, filesNotToChange, runtimeCallPaths, testPlan, rollbackPlan, maintainerDecisionNeeded, maintainerQuestion }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFixTask = defineTask('issue-531.implement-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement plugin marketplace version sync fix',
  labels: ['issue-531', 'implementation', 'plugins'],
  agent: {
    name: 'plugin-version-implementer',
    prompt: {
      role: 'senior TypeScript and release automation engineer',
      task: 'Implement the issue #531 root-cause fix and focused regression coverage.',
      instructions: [
        'Edit the repository directly.',
        'Keep changes scoped to files on the traced live path and the focused regression/guardrail files.',
        'Do not modify unrelated dirty worktree files. In particular, inspect git status before staging or editing and preserve user changes.',
        'Context:',
        JSON.stringify({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          runtimeTrace: args.runtimeTrace,
          regressionPlan: args.regressionPlan,
          design: args.design,
          previousVerification: args.previousVerification,
          previousReview: args.previousReview,
          attempt: args.attempt,
        }, null, 2),
        'Expected implementation direction:',
        '- Ensure scripts/bump-version.mjs updates all version-bearing marketplace/install manifests for Babysitter, not only .claude-plugin/marketplace.json.',
        '- Ensure scripts/sync-workspace-versions.mjs or the CI generation path updates the same source-of-truth version surfaces before generated external plugin output is produced.',
        '- Ensure generated marketplace output keeps manifest version labels in lockstep with plugins/babysitter-unified/versions.json or the workflow-derived release version.',
        '- Add or extend deterministic checks that fail when content/generation advances but the manifest version label stays stale.',
        'Return JSON: { changedFiles, summary, rootCauseAddressed, testsAddedOrModified, verificationCommands, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyFixTask = defineTask('issue-531.verify-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run deterministic verification for plugin version sync',
  labels: ['issue-531', 'verification', 'quality-gate'],
  agent: {
    name: 'plugin-version-verifier',
    prompt: {
      role: 'release automation verifier',
      task: 'Run the concrete verification commands and inspect the resulting manifests.',
      instructions: [
        'Run every verification command below from the repo root. Report exact pass/fail status and key output for failures.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Additionally inspect git diff and generated marketplace/plugin files to confirm version labels are updated on every applicable surface.',
        'Confirm that the stale-update scenario is prevented: a content/generation change cannot leave the update-comparison version unchanged.',
        'Context:',
        JSON.stringify({
          issueContext: args.issueContext,
          runtimeTrace: args.runtimeTrace,
          regressionPlan: args.regressionPlan,
          design: args.design,
          implementation: args.implementation,
          attempt: args.attempt,
        }, null, 2),
        'Return JSON: { passed: boolean, commands: [{ command: string, exitCode: number, summary: string }], manifestChecks: object, staleUpdateScenarioCovered: boolean, changedFiles: string[], failures: string[], residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewFixTask = defineTask('issue-531.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation against issue #531',
  labels: ['issue-531', 'review', 'quality-gate'],
  agent: {
    name: 'plugin-version-reviewer',
    prompt: {
      role: 'senior release automation code reviewer',
      task: 'Review the implementation against the issue spec and verification evidence.',
      instructions: [
        'Read the current git diff directly before reviewing.',
        'Compare the issue context to the artifacts directly. Do not rely on narrative summaries of what was supposedly built.',
        'Check for these failure modes: only Claude marketplace fixed, CI staging path missed, generated marketplace output still stale, hard-coded versions left behind, broad unrelated manifest churn, missing regression guardrail, and user dirty changes accidentally included.',
        'Context:',
        JSON.stringify({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          runtimeTrace: args.runtimeTrace,
          regressionPlan: args.regressionPlan,
          design: args.design,
          implementation: args.implementation,
          verification: args.verification,
          attempt: args.attempt,
        }, null, 2),
        'Return JSON: { approved: boolean, blockingIssues: string[], nonBlockingIssues: string[], missingTests: string[], summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-531.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #531',
  labels: ['issue-531', 'acceptance', 'quality-gate'],
  agent: {
    name: 'plugin-version-acceptance-gate',
    prompt: {
      role: 'maintainer acceptance reviewer',
      task: 'Decide whether the issue #531 implementation is ready for delivery.',
      instructions: [
        'Review the full run context:',
        JSON.stringify(args, null, 2),
        'Pass only if verification passed, code review approved, the stale plugin update scenario is covered by a deterministic guardrail, and changes are scoped to release/plugin version sync.',
        'If a schema or release-policy decision is unresolved, set needsMaintainerDecision true and provide one concise question.',
        'Return JSON: { passed: boolean, needsMaintainerDecision: boolean, question: string, changedFiles: string[], acceptanceCriteria: object, summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverTask = defineTask('issue-531.deliver', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, open PR, and comment on issue #531',
  labels: ['issue-531', 'delivery', 'github'],
  agent: {
    name: 'plugin-version-delivery-agent',
    prompt: {
      role: 'release automation maintainer',
      task: 'Deliver the completed issue #531 fix through GitHub.',
      instructions: [
        `Use branch ${args.inputs.implementationBranch} based on ${args.inputs.baseBranch}.`,
        'Before staging, run git status and verify only intended implementation files are staged. Do not stage unrelated local changes.',
        'Commit with a concise fix message, push the branch, and create a PR against the base branch.',
        'The PR title should be: Fix plugin marketplace version sync',
        'The PR body must link to #531, summarize the fix, list verification commands, and call out the stale-update regression guardrail.',
        'Post a comment on #531 with the implementation summary and PR link.',
        'Return JSON: { committed: boolean, pushed: boolean, prUrl: string, issueCommentUrl: string, summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
