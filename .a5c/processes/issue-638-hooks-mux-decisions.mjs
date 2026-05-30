/**
 * @process repo/issue-638-hooks-mux-decisions
 * @description Implement issue #638: hooks-mux defer/block/retry decisions plus Claude updatedInput mutation and agent-platform effects.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, dependentIssues: number[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Matching existing infrastructure found in hooks-mux result types, merge engine, Claude renderer, adapter renderers, agent-platform governance, session, daemon watcher, and orchestration effects.
 * - Existing `toolMutation`, `continueSession`, `stopReason`, `suppressOutput`, `sessionTitle`, `reloadSkills`, and `displayContent` support means this run must focus on the remaining gaps instead of reimplementing stale documentation claims.
 * - No `.a5c/reuse-audit.json` was present when this process was authored; keyword scan used: defer, block, retry, updatedInput, watchPaths, UnifiedHookResult, DecisionVerb, toolMutation.
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-stack/hooks/missing-capabilities.md
 * - methodologies/atdd-tdd/atdd-tdd.js
 * - methodologies/process-hardening/process-hardening-patterns.js
 * - tdd-quality-convergence.js
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/sdk-platform-development/error-handling-debugging-support.js
 * - specializations/sdk-platform-development/backward-compatibility-management.js
 * - specializations/qa-testing-automation/quality-gates.js
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-638.read-issue-context',
  });

  const dependencyReadiness = await ctx.task(auditReuseAndDependenciesTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-638.reuse-audit-dependency-readiness',
  });

  if (dependencyReadiness?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #638 Dependency Or Interface Decision',
      question: dependencyReadiness.question,
      options: [
        'Proceed with compatibility seam and document assumption',
        'Pause until foundational work lands',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-638', 'parallel-dependency'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        dependentIssues: inputs.dependentIssues,
        dependencyReadiness,
      },
    });
  }

  const runtimeTrace = await ctx.task(traceRuntimeSurfacesTask, {
    inputs,
    issueContext,
    dependencyReadiness,
  }, {
    key: 'issue-638.trace-runtime-surfaces',
  });

  const semantics = await ctx.task(designHookDecisionSemanticsTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
  }, {
    key: 'issue-638.design-semantics',
  });

  if (semantics?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #638 Decision Semantics Need Maintainer Input',
      question: semantics.question,
      options: [
        'Use recommended semantics',
        'Pause for explicit maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-638', 'decision-semantics'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        semantics,
      },
    });
  }

  const contractTests = await ctx.task(authorContractTestsTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    semantics,
  }, {
    key: 'issue-638.author-contract-tests',
  });

  const coreImplementation = await ctx.task(implementHooksMuxCoreTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    semantics,
    contractTests,
  }, {
    key: 'issue-638.implement-hooks-mux-core',
  });

  const adapterImplementation = await ctx.task(implementClaudeAdapterTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    semantics,
    contractTests,
    coreImplementation,
  }, {
    key: 'issue-638.implement-claude-adapter',
  });

  const platformImplementation = await ctx.task(implementAgentPlatformEffectsTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    semantics,
    contractTests,
    coreImplementation,
    adapterImplementation,
  }, {
    key: 'issue-638.implement-agent-platform-effects',
  });

  const sessionDaemonDocsImplementation = await ctx.task(implementSessionDaemonDocsTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    semantics,
    contractTests,
    coreImplementation,
    adapterImplementation,
    platformImplementation,
  }, {
    key: 'issue-638.implement-session-daemon-docs',
  });

  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= (inputs.maxFixAttempts ?? MAX_FIX_ATTEMPTS); attempt++) {
    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      dependencyReadiness,
      runtimeTrace,
      semantics,
      contractTests,
      implementations: {
        coreImplementation,
        adapterImplementation,
        platformImplementation,
        sessionDaemonDocsImplementation,
      },
      attempt,
      previousReview: review,
    }, {
      key: `issue-638.verification.${attempt}`,
    });

    review = await ctx.task(reviewIntegrationTask, {
      inputs,
      issueContext,
      dependencyReadiness,
      runtimeTrace,
      semantics,
      contractTests,
      verification,
      attempt,
    }, {
      key: `issue-638.review.${attempt}`,
    });

    attempts.push({ attempt, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }

    if (attempt < (inputs.maxFixAttempts ?? MAX_FIX_ATTEMPTS)) {
      await ctx.task(refineImplementationTask, {
        inputs,
        issueContext,
        dependencyReadiness,
        runtimeTrace,
        semantics,
        contractTests,
        verification,
        review,
        attempt,
      }, {
        key: `issue-638.refine.${attempt}`,
      });
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    semantics,
    contractTests,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-638.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit-and-dependency-readiness',
      'runtime-trace',
      'semantics-design',
      'contract-tests-first',
      'hooks-mux-core',
      'claude-adapter',
      'agent-platform-effects',
      'session-daemon-docs',
      'verification-review-loop',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    dependencyReadiness,
    semantics,
    contractTests,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-638.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #638 and linked hook capability context',
  labels: ['hooks-mux', 'agent-platform', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK and hooks-mux engineer',
      task: 'Read the GitHub issue, comments, labels, related issues, and referenced hook gap document to establish the exact implementation scope.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} resolves as a PR in the current repository, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read related issues named by the issue/comments, especially #636 and #637, only enough to preserve boundaries and dependency assumptions.',
        'Read docs/agent-stack/hooks/missing-capabilities.md sections 2 and 6, but treat the issue comment correction as authoritative where the document is stale.',
        'Preserve raw issue body/comment excerpts in the result so downstream tasks can compare against source material directly.',
        'Return JSON: { title, labels, rawIssue, comments, relatedIssues, correctedScope, acceptanceCriteria, nonGoals, priority, risk, targetFilesFromIssue }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const auditReuseAndDependenciesTask = defineTask('issue-638.audit-reuse-and-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit and dependency readiness check',
  labels: ['hooks-mux', 'agent-platform', 'reuse-audit', 'dependencies'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior monorepo integration engineer',
      task: 'Audit existing infrastructure and parallel dependency state before implementation.',
      instructions: [
        'Use the issue context JSON below as the source of truth.',
        JSON.stringify(args.issueContext, null, 2),
        'Perform the repo-specific Phase 0 reuse audit for these keywords: defer, block, retry, updatedInput, watchPaths, UnifiedHookResult, DecisionVerb, toolMutation, continueSession, stopReason, suppressOutput, sessionTitle.',
        'Inspect current implementations instead of relying on the stale gap document. Confirm which fields already exist and which are absent.',
        'Check #636 and #637 status/comments/branches or PRs if available. Determine whether this run can proceed with stable interfaces, needs a temporary compatibility seam, or must pause.',
        'Do not implement #636 missing events or #637 handler types in this run.',
        'Return JSON: { reuseFindings, existingInfrastructure, missingInfrastructure, dependencyStatus, parallelWorkRisks, recommendedBoundary, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimeSurfacesTask = defineTask('issue-638.trace-runtime-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace hooks-mux to agent-platform live runtime surfaces',
  labels: ['hooks-mux', 'agent-platform', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Trace the live paths that must carry hook decisions and output effects end to end.',
      instructions: [
        'Work from the issue context and dependency readiness JSON below.',
        JSON.stringify({ issueContext: args.issueContext, dependencyReadiness: args.dependencyReadiness }, null, 2),
        'Inspect these likely files first, then follow imports and callers:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Trace result creation, merging, adapter rendering, hook output adaptation, agent-platform effect resolution, governance decisions, session state/title persistence, and daemon watcher registration.',
        'Identify test files that already cover merge precedence, adapter rendering, governance permission propagation, orchestration effects, session state, and file watching.',
        'Call out absent files or renamed paths explicitly rather than inventing them.',
        'Return JSON: { rootCause, runtimeCallPaths, liveExecutionFiles, testFiles, existingSemantics, absentSurfaces, integrationRisks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designHookDecisionSemanticsTask = defineTask('issue-638.design-hook-decision-semantics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design defer/block/retry and updatedInput semantics',
  labels: ['hooks-mux', 'agent-platform', 'design', 'feature'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior API and runtime semantics engineer',
      task: 'Design the smallest coherent semantics for the remaining #638 capability gaps.',
      instructions: [
        'Use the following JSON inputs as constraints.',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
        }, null, 2),
        'Define canonical internal semantics for decisions: deny, block, retry, ask, allow, defer, continue, noop. Specify precedence and which decisions are valid for each event family.',
        'Define Claude adapter behavior: defer should omit a decision when Claude should use normal flow; block must produce the appropriate native block/deny representation for blocking hook events; retry must map to Claude permission recovery semantics where available and degrade explicitly where unavailable.',
        'Resolve updatedInput against existing toolMutation. Prefer one canonical internal mutation model and adapter-level aliasing unless the current code proves a new canonical field is necessary.',
        'Define watchPaths propagation only where a runtime consumer exists. If current daemon APIs cannot register dynamic watchers safely, require an explicit unsupported/deferred note and tests proving unsupported fields are not silently accepted.',
        'Define continueSession false, stopReason, suppressOutput, sessionTitle, and existing fields only as end-to-end validation targets, not as fresh reinventions.',
        'Return JSON: { decisionPrecedence, eventValidityMatrix, updatedInputStrategy, watchPathsStrategy, agentPlatformEffectSemantics, backwardCompatibility, migrationNotes, testPlan, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractTestsTask = defineTask('issue-638.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests before implementation',
  labels: ['hooks-mux', 'agent-platform', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused failing coverage for #638 before implementation changes.',
      instructions: [
        'You own test files only in this task. Do not change implementation files.',
        'Use the issue context, runtime trace, and semantics JSON below as the executable spec source.',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          semantics: args.semantics,
        }, null, 2),
        'Add hooks-mux core tests for result types, merge precedence, reason aggregation, metadata preservation, updatedInput/toolMutation aliasing, watchPaths merge/validation, and compatibility with existing allow/deny/ask/continue/noop behavior.',
        'Add Claude adapter renderer/normalizer tests for defer/block/retry and updatedInput mapping on the native event outputs where Claude supports them.',
        'Add agent-platform tests for block/retry effect resolution, governance integration, continue:false session abort behavior, session title propagation, and dynamic watchPaths only if runtime support is implemented.',
        'Record commands that should fail before implementation and pass after implementation.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, unsupportedSubfeatures, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementHooksMuxCoreTask = defineTask('issue-638.implement-hooks-mux-core', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement hooks-mux core result and merge semantics',
  labels: ['hooks-mux', 'implementation', 'core'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior hooks-mux core engineer',
      task: 'Implement the core #638 semantics in hooks-mux without changing adapter or platform consumers yet.',
      instructions: [
        'You own hooks-mux core implementation files and the tests authored for core semantics. Do not weaken tests to fit implementation.',
        'Use this context JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          semantics: args.semantics,
          contractTests: args.contractTests,
        }, null, 2),
        'Extend UnifiedHookResult and merged result shape for defer/block/retry plus the chosen updatedInput/toolMutation strategy and watchPaths strategy.',
        'Update merge precedence, extraction, conflict behavior, diagnostics, and serialization boundaries consistently.',
        'Preserve existing continueSession, stopReason, suppressOutput, sessionTitle, reloadSkills, displayContent, and toolMutation behavior unless tests prove the current behavior conflicts with #638.',
        'Return JSON: { changedFiles, summary, decisionPrecedence, mutationSemantics, watchPathsSemantics, compatibilityNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementClaudeAdapterTask = defineTask('issue-638.implement-claude-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude adapter output mapping',
  labels: ['hooks-mux', 'adapter-claude', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Claude adapter engineer',
      task: 'Map #638 unified result semantics to Claude native hook input/output contracts.',
      instructions: [
        'You own packages/hooks-mux/adapter-claude implementation files and matching tests.',
        'Use this context JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          semantics: args.semantics,
          contractTests: args.contractTests,
          coreImplementation: args.coreImplementation,
        }, null, 2),
        'Implement defer/block/retry rendering only where Claude supports the field for the event. Unsupported mappings must degrade explicitly and be covered by tests.',
        'Map Claude updatedInput to the chosen canonical internal mutation model and render it back for PreToolUse where appropriate.',
        'Keep existing Stop, SessionStart, MessageDisplay, recursion guard, and hookSpecificOutput behavior intact unless directly required by #638 tests.',
        'Return JSON: { changedFiles, summary, nativeMappings, unsupportedMappings, compatibilityNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementAgentPlatformEffectsTask = defineTask('issue-638.implement-agent-platform-effects', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement agent-platform effect and governance handling',
  labels: ['agent-platform', 'governance', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior agent-platform orchestration engineer',
      task: 'Honor #638 hook decisions and mutation effects in agent-platform runtime consumers.',
      instructions: [
        'You own agent-platform orchestration, governance, and harness integration files on the traced live execution paths.',
        'Use this context JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          semantics: args.semantics,
          contractTests: args.contractTests,
          coreImplementation: args.coreImplementation,
          adapterImplementation: args.adapterImplementation,
        }, null, 2),
        'Implement block as a non-approval effect result that stops unsafe action and records an auditable reason.',
        'Implement retry with bounded, auditable retry semantics. Do not create unbounded retries or silent re-execution of unsafe effects.',
        'Implement updatedInput/toolMutation application at the tool input boundary only when the runtime can prove it is mutating the intended pending tool invocation.',
        'Honor continue:false as a session abort signal and propagate stopReason where the current session/output APIs support it.',
        'Integrate governance policy events without duplicating existing sandbox policy concepts.',
        'Return JSON: { changedFiles, summary, blockSemantics, retrySemantics, mutationApplication, sessionAbortSemantics, auditEvents, compatibilityNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSessionDaemonDocsTask = defineTask('issue-638.implement-session-daemon-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement remaining session, daemon, and documentation updates',
  labels: ['agent-platform', 'agent-runtime', 'docs', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior runtime integration engineer',
      task: 'Complete remaining #638 propagation work and update stale gap documentation.',
      instructions: [
        'Use this context JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          semantics: args.semantics,
          contractTests: args.contractTests,
          coreImplementation: args.coreImplementation,
          adapterImplementation: args.adapterImplementation,
          platformImplementation: args.platformImplementation,
        }, null, 2),
        'Implement sessionTitle propagation only through existing or clearly appropriate session APIs.',
        'Implement watchPaths dynamic registration only if the traced daemon/watch APIs support safe runtime registration. Otherwise document it as explicitly unsupported/deferred and ensure tests prevent false support.',
        'Update docs/agent-stack/hooks/missing-capabilities.md so it no longer claims already-supported fields are missing and accurately reflects any deferred subfeature.',
        'Return JSON: { changedFiles, summary, sessionTitleSemantics, watchPathsSemantics, docsUpdates, deferredItems }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-638.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run #638 verification gate attempt ${args.attempt}`,
  labels: ['hooks-mux', 'agent-platform', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run the deterministic verification commands and assess #638 acceptance coverage.',
      instructions: [
        'Run the verification commands listed below from the repository root. Capture exit codes and relevant failing output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Also run any focused test commands returned by the contract test task if they are not already covered.',
        'Do not edit source in this task.',
        'Compare results against issue context, semantics, and contract tests JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          semantics: args.semantics,
          contractTests: args.contractTests,
          implementations: args.implementations,
          previousReview: args.previousReview,
        }, null, 2),
        'Return JSON: { passed, commands, failingCommands, coverageByCriterion, missingCoverage, regressions, changedFilesObserved, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewIntegrationTask = defineTask('issue-638.review-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review #638 integration attempt ${args.attempt}`,
  labels: ['hooks-mux', 'agent-platform', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior compatibility and architecture reviewer',
      task: 'Review the implementation for behavioral regressions and issue fidelity.',
      instructions: [
        'Review the current git diff and relevant tests. Focus on bugs, regressions, ambiguous semantics, missed issue requirements, and stale docs.',
        'Use this context JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          semantics: args.semantics,
          contractTests: args.contractTests,
          verification: args.verification,
        }, null, 2),
        'Pay special attention to decision precedence regressions, duplicate mutation models, false watchPaths support, unbounded retry loops, and adapter behavior for unsupported events.',
        'Return JSON: { approved, findings, requiredFixes, optionalFollowUps, riskLevel, docsAccurate }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const refineImplementationTask = defineTask('issue-638.refine-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine #638 implementation attempt ${args.attempt}`,
  labels: ['hooks-mux', 'agent-platform', 'refinement'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript integration engineer',
      task: 'Fix only the required #638 verification and review failures from the previous attempt.',
      instructions: [
        'Use the verification and review outputs below. Keep changes narrowly scoped to required fixes.',
        JSON.stringify({
          verification: args.verification,
          review: args.review,
          issueContext: args.issueContext,
          semantics: args.semantics,
          runtimeTrace: args.runtimeTrace,
        }, null, 2),
        'Do not relax or delete tests unless the review identified a test as objectively wrong against the issue source.',
        'Return JSON: { changedFiles, fixesApplied, remainingRisks, expectedCommandsToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-638.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final #638 acceptance gate',
  labels: ['hooks-mux', 'agent-platform', 'final-acceptance'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior release readiness reviewer',
      task: 'Decide whether #638 is complete and ready for PR review.',
      instructions: [
        'Inspect final git diff, verification output, review output, and issue criteria.',
        'Use this JSON context:',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          semantics: args.semantics,
          contractTests: args.contractTests,
          verification: args.verification,
          review: args.review,
          attempts: args.attempts,
        }, null, 2),
        'Require explicit pass/fail for: defer/block/retry core types and merge precedence; Claude updatedInput mapping; agent-platform block/retry/effect behavior; existing output field regression safety; docs accuracy; dependent #636/#637 boundaries.',
        'Return JSON: { passed, changedFiles, acceptanceByCriterion, runtimeCallPaths, verificationSummary, residualRisks, recommendedPrSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
