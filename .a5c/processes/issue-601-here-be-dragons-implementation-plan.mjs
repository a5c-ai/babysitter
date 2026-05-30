/**
 * @process repo/issue-601-here-be-dragons-implementation-plan
 * @description Plan and execute a current-state implementation workflow for issue #601, the remaining here-be-dragons umbrella tracker.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string, relatedIssues: number[], priorPrs: number[], maxImplementationLoops?: number, verificationCommands: string[] }
 * @outputs { success: boolean, issueContext: object, reuseAudit: object, decomposition: object, regressionPlan: object, verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - methodologies/spec-kit/spec-kit-planning.js
 * - methodologies/maestro/maestro-maintenance.js
 * - methodologies/process-hardening/process-hardening-patterns.js
 * - cradle/bugfix.js
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Existing #601 process artifacts already exist at
 *   .a5c/processes/issue-601-remaining-dragons-plan.mjs and
 *   .a5c/processes/issue-601-remaining-dragons-plan.inputs.json.
 * - PR #683 was merged with implementation changes for #601; the run must audit
 *   those changes and the current base branch before assuming any dragon remains.
 * - PR #716 is an open process-artifact refresh for #601; this process must not
 *   overwrite or duplicate that branch without an explicit maintainer decision.
 * - Related issues #584 and #586 cover process.env coupling and kanban
 *   exhaustiveness. This process treats them as coordinated dependencies, not as
 *   work to duplicate inside the umbrella stream.
 * - Matching existing infrastructure includes docs/here-be-dragons.md, agent-core
 *   tool lifecycle code, agent-platform piWrapper code, agent-core/platform shell
 *   execution helpers, agent-mux SessionDetailScreen tests, root tsconfig, and
 *   package-level npm scripts. No new migrations, routes, SDK dependencies, or
 *   environment variables are expected.
 *
 * @process methodologies/spec-kit/spec-kit-planning
 * @process methodologies/maestro/maestro-maintenance
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process cradle/bugfix
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_IMPLEMENTATION_LOOPS = 2;

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? result?.result?.stdout ?? '';
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 601;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const workBranch = inputs?.workBranch ?? 'fix/issue-601-here-be-dragons';
  const relatedIssues = inputs?.relatedIssues ?? [584, 586];
  const priorPrs = inputs?.priorPrs ?? [683, 716];
  const maxImplementationLoops = inputs?.maxImplementationLoops ?? DEFAULT_MAX_IMPLEMENTATION_LOOPS;
  const verificationCommands = inputs?.verificationCommands ?? [];

  const issueContext = await ctx.task(readIssueAndRepoContextTask, {
    issueNumber,
    relatedIssues,
    priorPrs,
    baseBranch,
    workBranch,
  }, {
    key: 'issue-601.read-issue-and-repo-context',
  });

  const processLibraryResearch = await ctx.task(readProcessLibraryContextTask, {}, {
    key: 'issue-601.process-library-research',
  });

  const reuseAudit = await ctx.task(phaseZeroReuseAuditTask, {
    inputs,
    issueContextStdout: stdoutOf(issueContext),
    processLibraryStdout: stdoutOf(processLibraryResearch),
  }, {
    key: 'issue-601.phase-zero-reuse-audit',
  });

  const decomposition = await ctx.task(decomposeUmbrellaTask, {
    inputs,
    issueContextStdout: stdoutOf(issueContext),
    processLibraryStdout: stdoutOf(processLibraryResearch),
    reuseAudit,
  }, {
    key: 'issue-601.decompose-umbrella',
  });

  if (decomposition?.needsMaintainerScopeDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #601 Scope Decision',
      question: decomposition.scopeQuestion ?? 'Review the #601 decomposition and approve which residual streams should proceed.',
      options: ['Proceed with recommended residual streams', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-601', 'scope'],
      context: {
        issueNumber,
        relatedIssues,
        priorPrs,
        decomposition,
      },
    });
  }

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContextStdout: stdoutOf(issueContext),
    reuseAudit,
    decomposition,
  }, {
    key: 'issue-601.regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxImplementationLoops; attempt += 1) {
    implementation = await ctx.task(implementApprovedStreamsTask, {
      inputs,
      issueContextStdout: stdoutOf(issueContext),
      reuseAudit,
      decomposition,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-601.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      verificationCommands,
      implementation,
      attempt,
    }, {
      key: `issue-601.verification.${attempt}`,
    });

    review = await ctx.task(reviewAgainstSpecTask, {
      issueContextStdout: stdoutOf(issueContext),
      reuseAudit,
      decomposition,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-601.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalPlanDeliveryGateTask, {
    inputs,
    issueContextStdout: stdoutOf(issueContext),
    reuseAudit,
    decomposition,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-601.final-delivery-gate',
  });

  if (finalGate?.requiresOverride === true) {
    await ctx.breakpoint({
      title: 'Issue #601 Final Gate Override',
      question: finalGate.question,
      options: ['Proceed with documented residual risk', 'Pause and repair before delivery'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-601', 'final-gate'],
      context: { finalGate, attempts: attempts.length },
    });
  }

  return {
    success: finalGate?.passed === true,
    issueContext,
    processLibraryResearch,
    reuseAudit,
    decomposition,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueAndRepoContextTask = defineTask('issue-601.read-issue-and-repo-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read #601 issue, prior PRs, and current repo evidence',
  labels: ['issue-601', 'context', 'runtime-read'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "%s\\n" "--- issue ---"',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url`,
      'printf "%s\\n" "--- related issues ---"',
      ...(args.relatedIssues ?? []).map((issue) => `gh issue view ${issue} --json title,body,labels,comments,state,url || true`),
      'printf "%s\\n" "--- prior prs ---"',
      ...(args.priorPrs ?? []).map((pr) => `gh pr view ${pr} --json number,state,title,body,files,comments,url || true`),
      'printf "%s\\n" "--- branch and status ---"',
      'git status --short --branch',
      `git branch --list ${JSON.stringify(args.workBranch)} origin/${JSON.stringify(args.workBranch)} || true`,
      'printf "%s\\n" "--- here-be-dragons ---"',
      'nl -ba docs/here-be-dragons.md | sed -n "1,240p"',
      'printf "%s\\n" "--- target evidence scan ---"',
      'rg -n "process\\.env\\[[^\\]]+\\] =|WeakMap|initPromise|/bin/bash|it\\.skip|skipLibCheck|here-be-dragons|backgroundProcessRegistry|createExecutionTools" docs packages tsconfig.json .a5c/processes -S',
      'printf "%s\\n" "--- focused files ---"',
      'for path in packages/agent-core/src/agenticTools/index.ts packages/agent-platform/src/harness/piWrapper.ts packages/agent-core/src/agenticTools/tools/execution.ts packages/agent-platform/src/harness/agenticTools/tools/execution.ts packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx tsconfig.json .a5c/processes/issue-601-remaining-dragons-plan.mjs; do if [ -f "$path" ]; then printf "\\n### %s\\n" "$path"; nl -ba "$path" | sed -n "1,220p"; fi; done',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readProcessLibraryContextTask = defineTask('issue-601.read-process-library-context', (_args, taskCtx) => ({
  kind: 'shell',
  title: 'Read matching process-library methodologies',
  labels: ['issue-601', 'process-library', 'runtime-read'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "%s\\n" "--- process authoring policy ---"',
      'sed -n "1,180p" docs/agent-reference/process-authoring.md',
      'printf "%s\\n" "--- spec-kit planning ---"',
      'sed -n "1,220p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/spec-kit/spec-kit-planning.js',
      'printf "%s\\n" "--- maestro maintenance ---"',
      'sed -n "1,220p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/maestro/maestro-maintenance.js',
      'printf "%s\\n" "--- process hardening ---"',
      'sed -n "1,220p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/process-hardening/process-hardening-patterns.js',
      'printf "%s\\n" "--- bugfix cradle ---"',
      'sed -n "1,180p" /home/runner/.a5c/process-library/babysitter-repo/library/cradle/bugfix.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const phaseZeroReuseAuditTask = defineTask('issue-601.phase-zero-reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for #601',
  labels: ['issue-601', 'reuse-audit', 'planning'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript monorepo planner',
      task: 'Perform the required Phase 0 reuse audit before any implementation planning.',
      instructions: [
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keywords from #601: here-be-dragons, process.env mutation, WeakMap disposal, piWrapper initPromise, /bin/bash portability, SessionDetailScreen skipped tests, skipLibCheck, E2E coverage gaps, duplicate utilities, docs caveats.',
        'Use the runtime issue and repo context verbatim below. Do not rely on memory.',
        'ISSUE AND REPO CONTEXT:',
        '---',
        args.issueContextStdout,
        '---',
        'PROCESS LIBRARY CONTEXT:',
        '---',
        args.processLibraryStdout,
        '---',
        'Identify existing process artifacts, prior PRs, current code paths, tests, package scripts, docs, dependencies, imports, env var usage, and any duplicated infrastructure that should be reused.',
        'Call out explicitly that no migrations, API routes, SDK installs, or new env vars are expected unless the runtime evidence contradicts that.',
        'Return JSON: { findingsMarkdown, existingArtifacts, priorWork, existingInfrastructure, candidateTestFiles, noNewInfrastructureNeeded, duplicationRisks, recommendations }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const decomposeUmbrellaTask = defineTask('issue-601.decompose-umbrella', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose #601 into current-state work streams',
  labels: ['issue-601', 'decomposition', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior architecture and maintenance planner',
      task: 'Create the implementation decomposition for issue #601 from current evidence.',
      instructions: [
        'Do not edit files.',
        'Treat #601 as an umbrella tracker. Do not duplicate #584 process.env coupling or #586 kanban exhaustiveness work.',
        'Account for PR #683 and PR #716. If current base already resolved a stream, classify it as alreadyResolved with evidence.',
        'ISSUE AND REPO CONTEXT:',
        '---',
        args.issueContextStdout,
        '---',
        'REUSE AUDIT JSON:',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'For each residual stream, provide runtimeCallPaths, likelyFiles, testsFirstPlan, implementationPlan, qualityGates, dependencyOrder, risk, rollbackRisk, stopConditions, and whether maintainer approval is required.',
        'Required stream classifications: coveredByRelatedIssue, alreadyResolved, residualImplementation, deferredFollowup, outOfScope.',
        'Return JSON: { umbrellaDisposition, coveredByRelatedIssues, alreadyResolved, residualStreams, deferredFollowups, outOfScope, dependencyOrder, qualityGateMatrix, needsMaintainerScopeDecision, scopeQuestion }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-601.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author tests-first plan for #601 residual streams',
  labels: ['issue-601', 'tests-first', 'quality'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'test-first TypeScript monorepo planner',
      task: 'Turn the approved decomposition into concrete regression-test tasks before implementation.',
      instructions: [
        'Do not edit files.',
        'Use runtime context and decomposition verbatim. Keep test design anchored to live runtime call paths.',
        'ISSUE AND REPO CONTEXT:',
        '---',
        args.issueContextStdout,
        '---',
        'REUSE AUDIT JSON:',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'DECOMPOSITION JSON:',
        '---',
        JSON.stringify(args.decomposition, null, 2),
        '---',
        'For every residualImplementation stream, specify exact candidate test files, failing behavior before fix, passing behavior after fix, fixtures/mocks, and the narrowest npm command that proves it.',
        'For deferredFollowup streams, specify the acceptance criteria a future issue must carry.',
        'Return JSON: { testStreams, sharedFixtures, verificationCommands, deferredAcceptanceCriteria, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementApprovedStreamsTask = defineTask('issue-601.implement-approved-streams', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement approved #601 residual streams',
  labels: ['issue-601', 'implementation', 'refactor'],
  agent: {
    name: 'compatibility-auditor',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior TypeScript monorepo implementer',
      task: 'Implement only the approved #601 residual streams with tests first.',
      instructions: [
        'Edit the repository directly.',
        'Do not touch unrelated dirty worktree files. Do not implement #584 or #586 inside this umbrella stream.',
        'Start by adding or unskipping regression tests from the regression plan, then implement the smallest live-path change that makes them pass.',
        'Update docs/here-be-dragons.md only for streams actually fixed or intentionally split into linked follow-up issues.',
        'If the base branch already contains the fix from PR #683, record evidence and do not churn code.',
        'ISSUE AND REPO CONTEXT:',
        '---',
        args.issueContextStdout,
        '---',
        'REUSE AUDIT JSON:',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'DECOMPOSITION JSON:',
        '---',
        JSON.stringify(args.decomposition, null, 2),
        '---',
        'REGRESSION PLAN JSON:',
        '---',
        JSON.stringify(args.regressionPlan, null, 2),
        '---',
        'PREVIOUS VERIFICATION:',
        JSON.stringify(args.previousVerification ?? null, null, 2),
        'PREVIOUS REVIEW:',
        JSON.stringify(args.previousReview ?? null, null, 2),
        'Return JSON: { changedFiles, implementedStreams, alreadyResolvedStreams, deferredStreams, testsAdded, docsUpdated, verificationCommands, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-601.run-verification-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run deterministic #601 quality gates',
  labels: ['issue-601', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run test --workspace=@a5c-ai/agent-core',
      'npm run test --workspace=@a5c-ai/agent-platform',
      'npm run test:realtime --workspace=@a5c-ai/agent-mux-ui',
      'npm run build:runtime',
      'npm run test:agent-mux',
      'npm run verify:metadata',
      'git diff --check',
      'if rg -n "it\\.skip\\(" packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx; then',
      '  echo "Unexplained SessionDetailScreen skipped tests remain" >&2',
      '  exit 1',
      'fi',
      ...(args.verificationCommands ?? []).map((command) => String(command)),
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewAgainstSpecTask = defineTask('issue-601.review-against-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review #601 implementation against spec',
  labels: ['issue-601', 'review', 'quality'],
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'senior code review and release gate reviewer',
      task: 'Compare #601 requirements to current artifacts and verification output.',
      instructions: [
        'Ignore any narrative in your context about how the artifacts were built.',
        'Use the SPEC block and JSON artifacts below directly.',
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'DECOMPOSITION JSON:',
        JSON.stringify(args.decomposition, null, 2),
        'REGRESSION PLAN JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
        'SPEC AND ISSUE CONTEXT (verbatim):',
        '---',
        args.issueContextStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Confirm related issues were not duplicated, current-state resolved streams were not churned, residual streams have tests or explicit deferral, docs match reality, and deterministic gates ran.',
        'Return JSON: { approved, issues, residualRisks, requiredFollowups, summary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalPlanDeliveryGateTask = defineTask('issue-601.final-plan-delivery-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final #601 delivery gate',
  labels: ['issue-601', 'delivery', 'quality'],
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'release readiness reviewer',
      task: 'Decide whether #601 implementation work is ready for PR delivery.',
      instructions: [
        'Inputs:',
        JSON.stringify({
          reuseAudit: args.reuseAudit,
          decomposition: args.decomposition,
          regressionPlan: args.regressionPlan,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          attempts: args.attempts,
        }, null, 2),
        'Pass only if the review approved the result, deterministic verification passed, and any unresolved #601 streams have explicit follow-up acceptance criteria.',
        'If verification is blocked by unrelated failures, require a clear command-level blocker and isolate the focused gates that did pass.',
        'Return JSON: { passed, requiresOverride, question, summary, changedFiles, verificationSummary, followups }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
