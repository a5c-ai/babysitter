/**
 * @process repo/issue-589-agent-core-loop-strategy-gaps
 * @description Implement issue #589: harden agent-core loop strategies for concurrent partial results/timeouts, group-chat selection, handoff context, external cancellation, delegation timeout, oversight retry, and strategy composition.
 * @inputs { issueNumber: number, title: string, issueBody: string, issueComments: array, labels: string[], baseBranch: string, implementationBranch: string, targetFiles: string[], testTargets: string[], qualityCommands: string[], implementationSlices: array, maxVerificationAttempts?: number }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], reuseAudit: object, contractDesign: object, redTests: object, implementation: array, qualityGate: object, review: object, finalGate: object }
 *
 * Process-library research performed for this plan:
 * - Local checkout has no .a5c/process-library directory.
 * - Matching installed library sources are under /home/runner/.a5c/process-library/babysitter-repo/library.
 * - Relevant methodologies/specializations:
 *   - library/tdd-quality-convergence.js
 *   - library/methodologies/spec-kit-brownfield.js
 *   - library/methodologies/superpowers/test-driven-development.js
 *   - library/methodologies/process-hardening/process-hardening-patterns.js
 *   - library/specializations/qa-testing-automation/quality-gates.js
 * - Relevant local process patterns:
 *   - .a5c/processes/issue-575-agent-core-streaming-history.mjs
 *   - .a5c/processes/issue-588-agent-core-tool-system-gaps.mjs
 *   - .a5c/processes/issue-181-run-completed-idempotency.mjs
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's direct Babysitter process-authoring override.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_VERIFICATION_ATTEMPTS = 3;

function valueOf(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const maxVerificationAttempts =
    inputs?.maxVerificationAttempts ?? DEFAULT_MAX_VERIFICATION_ATTEMPTS;

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-589.read-issue-context',
  });

  const processLibraryResearch = await ctx.task(researchProcessLibraryTask, {
    inputs,
    issueContext: valueOf(issueContext),
  }, {
    key: 'issue-589.process-library-research',
  });

  const reuseAudit = await ctx.task(reuseAuditAndRuntimeTraceTask, {
    inputs,
    issueContext: valueOf(issueContext),
    processLibraryResearch: valueOf(processLibraryResearch),
  }, {
    key: 'issue-589.reuse-audit-runtime-trace',
  });

  const contractDesign = await ctx.task(designStrategyContractsTask, {
    inputs,
    issueContext: valueOf(issueContext),
    processLibraryResearch: valueOf(processLibraryResearch),
    reuseAudit: valueOf(reuseAudit),
  }, {
    key: 'issue-589.contract-design',
  });

  const redTests = await ctx.task(authorRedContractTestsTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    contractDesign: valueOf(contractDesign),
  }, {
    key: 'issue-589.red-tests',
  });

  const implementationResults = [];
  let qualityGate = null;
  let review = null;
  let verificationFeedback = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt++) {
    const attemptResults = [];

    for (const slice of inputs?.implementationSlices ?? []) {
      const result = await ctx.task(implementSliceTask, {
        inputs,
        issueContext: valueOf(issueContext),
        reuseAudit: valueOf(reuseAudit),
        contractDesign: valueOf(contractDesign),
        redTests: valueOf(redTests),
        previousSlices: implementationResults,
        verificationFeedback,
        slice,
        attempt,
      }, {
        key: `issue-589.implementation.${attempt}.${slice.id}`,
      });

      attemptResults.push(valueOf(result));
      implementationResults.push(valueOf(result));
    }

    qualityGate = await ctx.task(runQualityGateTask, {
      inputs,
      issueContext: valueOf(issueContext),
      reuseAudit: valueOf(reuseAudit),
      contractDesign: valueOf(contractDesign),
      redTests: valueOf(redTests),
      implementationResults,
      attempt,
      qualityCommands: inputs?.qualityCommands ?? [],
    }, {
      key: `issue-589.quality-gate.${attempt}`,
    });

    review = await ctx.task(reviewSemanticContractsTask, {
      inputs,
      issueContext: valueOf(issueContext),
      reuseAudit: valueOf(reuseAudit),
      contractDesign: valueOf(contractDesign),
      redTests: valueOf(redTests),
      implementationResults,
      qualityGate: valueOf(qualityGate),
      attempt,
    }, {
      key: `issue-589.semantic-review.${attempt}`,
    });

    if (valueOf(qualityGate)?.passed === true && valueOf(review)?.approved === true) {
      break;
    }

    verificationFeedback = {
      qualityGate: valueOf(qualityGate),
      review: valueOf(review),
      attemptResults,
    };
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext: valueOf(issueContext),
    processLibraryResearch: valueOf(processLibraryResearch),
    reuseAudit: valueOf(reuseAudit),
    contractDesign: valueOf(contractDesign),
    redTests: valueOf(redTests),
    implementationResults,
    qualityGate: valueOf(qualityGate),
    review: valueOf(review),
  }, {
    key: 'issue-589.final-acceptance',
  });

  if (valueOf(finalGate)?.passed !== true) {
    await ctx.breakpoint({
      breakpointId: 'issue-589.final-acceptance-failed',
      title: 'Issue #589 acceptance review failed',
      question: 'Issue #589 did not pass the final semantic acceptance gate within the configured attempts. Review the reported blockers before continuing?',
      options: [
        'Pause for maintainer review',
        'Continue with another implementation attempt',
      ],
      expert: 'maintainer',
      tags: ['issue-589', 'agent-core', 'quality-gate'],
      context: {
        runId: ctx.runId,
        finalGate: valueOf(finalGate),
        qualityGate: valueOf(qualityGate),
        review: valueOf(review),
      },
    });
  }

  return {
    success: valueOf(finalGate)?.passed === true,
    phases: [
      'issue-context',
      'process-library-research',
      'reuse-audit-runtime-trace',
      'contract-design',
      'red-contract-tests',
      'implementation-slices',
      'quality-gates',
      'semantic-review',
      'final-acceptance',
    ],
    changedFiles: valueOf(finalGate)?.changedFiles ?? valueOf(qualityGate)?.changedFiles ?? [],
    issueContext,
    processLibraryResearch,
    reuseAudit,
    contractDesign,
    redTests,
    implementation: implementationResults,
    qualityGate,
    review,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-589.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #589 authoritative context',
  labels: ['issue-589', 'agent-core', 'research', 'issue-context'],
  agent: {
    name: 'agent-core-architect',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Read issue #589 and produce the authoritative implementation spec before any source changes.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also attempt: gh pr view ${args.issueNumber} --json files,title,body,comments. If it is not a PR, record that explicitly.`,
        'Read docs/agent-layer-gaps.md and extract only the rows relevant to issue #589.',
        'Treat issue body, labels, and comments as source of truth, but note any prior plan or implementation PR comments as historical context rather than current source changes.',
        'Summarize related issues #579 and #581 only enough to keep this implementation scoped.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, relatedScopeBoundaries, acceptanceCriteria, nonGoals, riskLevel, targetFilesFromIssue, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
export const researchProcessLibraryTask = defineTask('issue-589.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process-library methodology',
  labels: ['issue-589', 'process-library', 'methodology', 'research'],
  agent: {
    name: 'process-methodologist',
    prompt: {
      role: 'Babysitter process authoring specialist',
      task: 'Research local process-library and process examples for the best methodology to execute issue #589.',
      instructions: [
        'Check whether .a5c/process-library exists in this checkout. If absent, inspect /home/runner/.a5c/process-library/babysitter-repo/library.',
        'Look specifically for TDD quality convergence, brownfield development, process hardening, strategy/orchestration, SDK platform, and quality gate guidance.',
        'Inspect nearby process examples for agent-core or SDK hardening work.',
        'Apply docs/agent-reference/process-authoring.md, especially the direct Babysitter override: use agent tasks rather than shell subtasks unless explicitly requested.',
        'Return JSON: { localProcessLibraryStatus, installedLibraryRoot, selectedMethodologies, selectedSpecializations, localProcessExamples, authoringConstraints, implicationsForThisRun }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditAndRuntimeTraceTask = defineTask('issue-589.reuse-audit-runtime-trace', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit and runtime trace for loop strategies',
  labels: ['issue-589', 'agent-core', 'reuse-audit', 'runtime-trace'],
  agent: {
    name: 'agent-core-runtime-researcher',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Perform Phase 0 reuse audit and trace live runtime paths for issue #589 before design or implementation.',
      instructions: [
        'Do not edit files in this phase.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Use these keywords and variants: AgentLoop, concurrent, Promise.allSettled, partial results, per-agent timeout, AbortSignal, cancellation, group-chat, moderator, speaker selection, validation, handoff, handoffTarget, sharedContext, SubagentInvoker, OversightRunner, maxRetries, timeoutMs, strategy composition.',
        'Inspect the loop strategy runners, AgentLoop implementation/types, subagent invoker/types/oversight, relevant tests, docs/agent-layer-gaps.md, package exports, and downstream SDK references.',
        'Identify existing timeout/cancellation helpers and any parallel dispatch semantics in agent-platform or tasks-mux that should be reused or kept compatible.',
        'Trace the live call path from createAgentLoop through run()/iterate(), strategy runner dispatch, promptFn invocation, subagent delegate/handoff, and result emission.',
        'Separate live runtime paths from tests, docs, and historical scaffolding.',
        'Return JSON: { reuseAudit, runtimeCallPaths, existingInfrastructure, affectedFiles, testSurfaces, compatibilityBoundaries, noMatchingInfrastructureNotes, risks, confidence }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'PROCESS LIBRARY RESEARCH:',
        JSON.stringify(args.processLibraryResearch ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designStrategyContractsTask = defineTask('issue-589.contract-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design hardened AgentLoop and Subagent contracts',
  labels: ['issue-589', 'agent-core', 'architecture', 'contract-design'],
  agent: {
    name: 'agent-loop-contract-architect',
    prompt: {
      role: 'senior SDK API designer',
      task: 'Design the additive public contracts and compatibility strategy for issue #589 before tests.',
      instructions: [
        'Base the design on the issue context and reuse audit. Do not broaden scope into unrelated agent-layer gaps.',
        'Define concurrent strategy semantics for per-agent timeout, partial result recording, timeout error shape, maxParallelism behavior, and predictable aggregation.',
        'Define external cancellation semantics for AgentLoop.run() and iterate(), including AbortSignal propagation to promptFn and strategy runners where possible.',
        'Define group-chat moderator output contract: structured selection first, validation against configured agent IDs, explicit errors for invalid/ambiguous selection, and any compatibility fallback.',
        'Define handoff semantics: entry/current agent validation, invalid handoff rejection, structured context transfer, and how output-provided context is merged with caller input/options.',
        'Define delegation timeout enforcement in SubagentInvokerImpl without relying on callers to enforce timeoutMs.',
        'Define oversight retry semantics: distinguish re-review-only retry from subagent reinvocation with feedback; document idempotency/side-effect risks.',
        'Define strategy composition scope for this issue: whether composition is first-class config, nested runners, or a documented adapter boundary, with tests for the chosen contract.',
        'Preserve source compatibility where practical using optional fields and clear validation errors. Identify any intentional behavior changes.',
        'Return JSON: { apiSurface, cancellationSemantics, concurrentSemantics, groupChatSemantics, handoffSemantics, subagentTimeoutSemantics, oversightRetrySemantics, compositionSemantics, migrationPlan, acceptanceCriteria, compatibilityRisks, openQuestions }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRedContractTestsTask = defineTask('issue-589.red-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing loop strategy contract tests',
  labels: ['issue-589', 'agent-core', 'tdd', 'red-phase'],
  agent: {
    name: 'agent-core-test-author',
    prompt: {
      role: 'senior TypeScript test engineer practicing strict TDD',
      task: 'Add failing behavioral tests for issue #589 before production implementation changes.',
      instructions: [
        'Follow strict TDD: write or update tests first, then run targeted tests and confirm intended failures.',
        'Do not skip, weaken, or delete existing tests.',
        'Add focused tests under packages/agent-core/src/loop/__tests__/agent-loop.test.ts or adjacent strategy tests for concurrent per-agent timeout, partial results, external cancellation, group-chat moderator validation, handoff validation/context transfer, and strategy composition.',
        'Add focused tests under packages/agent-core/src/subagent/__tests__/invoker.test.ts and oversight tests as needed for delegation timeout enforcement and configurable oversight retries.',
        'Use fake timers or deterministic deferred promises for timeout/cancellation tests; avoid sleeping tests.',
        'Assert public result/error shapes and observable state transitions, not only implementation internals.',
        'Run the narrow Vitest command(s) and verify they fail because behavior is missing, not due to setup errors.',
        'Return JSON: { testFiles, testNames, redVerified, redCommands, redOutputSummary, failureMatchesIssue, changedFiles, remainingTestGaps }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'CONTRACT DESIGN:',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '',
        'TEST TARGETS:',
        JSON.stringify(args.inputs?.testTargets ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSliceTask = defineTask('issue-589.implement-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement issue #589 slice: ${args.slice?.title ?? 'agent-core loop strategy hardening'}`,
  labels: ['issue-589', 'agent-core', 'implementation', args.slice?.id ?? 'slice'],
  agent: {
    name: 'agent-core-implementer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: `Implement the issue #589 slice: ${args.slice?.title ?? 'agent-core loop strategy hardening'}.`,
      instructions: [
        'Keep changes scoped to live runtime paths identified in the reuse audit and this slice.',
        'Use the red tests and contract design as the acceptance spec.',
        'Prefer additive typed options and clear validation errors over broad behavior rewrites.',
        'Preserve existing happy-path behavior unless the contract design explicitly changes it.',
        'Do not implement unrelated gaps from docs/agent-layer-gaps.md.',
        'Update package exports and README/docs only when public contracts change.',
        'Run focused tests for this slice and record exact commands and outcomes.',
        'If this is a retry, address the verification and review feedback directly before adding new scope.',
        'Return JSON: { sliceId, changedFiles, summary, testsRun, contractCriteriaCovered, compatibilityNotes, remainingRisks, needsFollowupSlice }.',
        '',
        'IMPLEMENTATION SLICE:',
        JSON.stringify(args.slice ?? {}, null, 2),
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        '',
        'CONTRACT DESIGN:',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '',
        'RED TESTS:',
        JSON.stringify(args.redTests ?? {}, null, 2),
        '',
        'PREVIOUS SLICES:',
        JSON.stringify(args.previousSlices ?? [], null, 2),
        '',
        'VERIFICATION FEEDBACK:',
        JSON.stringify(args.verificationFeedback ?? null, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runQualityGateTask = defineTask('issue-589.quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #589 quality gates attempt ${args.attempt}`,
  labels: ['issue-589', 'agent-core', 'verification', 'quality-gate'],
  agent: {
    name: 'agent-core-verifier',
    prompt: {
      role: 'senior TypeScript platform verifier',
      task: 'Run and interpret all quality gates for the issue #589 implementation.',
      instructions: [
        'Run the listed quality commands from the repository root and record exact results.',
        'Confirm the red tests failed for the intended missing behavior before implementation and now pass.',
        'Confirm concurrent timeout/partial result behavior is deterministic and does not hang on unresolved agent promises.',
        'Confirm cancellation propagates far enough to prevent additional loop iterations and records a clear cancelled/errored state.',
        'Confirm group-chat and handoff validation reject unknown or ambiguous targets.',
        'Confirm delegation timeout and oversight retry behavior are covered by tests.',
        'Confirm strategy composition has either a tested first-class contract or a documented, tested adapter/non-goal boundary.',
        'Inspect git diff for implementation files outside the issue scope.',
        'Return JSON: { passed, commands, failures, changedFiles, redGreenVerified, criteriaResults, outOfScopeChanges, notes }.',
        '',
        'QUALITY COMMANDS:',
        JSON.stringify(args.qualityCommands ?? [], null, 2),
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'CONTRACT DESIGN:',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '',
        'IMPLEMENTATION RESULTS:',
        JSON.stringify(args.implementationResults ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewSemanticContractsTask = defineTask('issue-589.semantic-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #589 semantic contracts attempt ${args.attempt}`,
  labels: ['issue-589', 'agent-core', 'review', 'semantic-contracts'],
  agent: {
    name: 'agent-core-code-reviewer',
    prompt: {
      role: 'senior code reviewer for agent orchestration runtimes',
      task: 'Review the final diff against issue #589 and the approved contract design.',
      instructions: [
        'Use code-review stance: prioritize behavioral bugs, regressions, missing tests, compatibility hazards, and leaked in-flight work.',
        'Compare every issue bullet directly to changed tests, implementation, and docs.',
        'Inspect timeout/cancellation cleanup for dangling timers, unresolved promises, orphaned subagents, and state transitions.',
        'Inspect concurrent result aggregation for stable ordering, partial results, error shape, and maxParallelism interactions.',
        'Inspect moderator and handoff target validation for ambiguity, unknown IDs, and compatibility messages.',
        'Inspect handoff context transfer for data loss, context bloat, and type clarity.',
        'Inspect oversight retry semantics for accidental duplicate side effects or hidden cost escalation.',
        'Inspect public exports and README/docs if typed public contracts changed.',
        'Return JSON: { approved, blockingIssues, nonBlockingSuggestions, compatibilityRisks, missingTests, finalSummary }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'QUALITY GATE:',
        JSON.stringify(args.qualityGate ?? {}, null, 2),
        '',
        'CONTRACT DESIGN:',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-589.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance review for issue #589',
  labels: ['issue-589', 'agent-core', 'acceptance', 'quality-gate'],
  agent: {
    name: 'agent-core-acceptance-reviewer',
    prompt: {
      role: 'principal TypeScript runtime maintainer',
      task: 'Decide whether the issue #589 implementation is complete and ready for PR.',
      instructions: [
        'Confirm qualityGate.passed is true and review.approved is true.',
        'Confirm every issue bullet has a tested implementation or an explicit maintainer-worthy non-goal.',
        'Confirm all source changes are within the affected components or necessary exports/docs.',
        'Confirm final verification includes package-local agent-core tests, build, metadata verification, and diff hygiene.',
        'Confirm there are no unrelated source changes staged for this issue.',
        'Return JSON: { passed, changedFiles, acceptedCriteria, unresolvedCriteria, requiredFollowups, prSummary, testSummary, commentSummary }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'PROCESS LIBRARY RESEARCH:',
        JSON.stringify(args.processLibraryResearch ?? {}, null, 2),
        '',
        'QUALITY GATE:',
        JSON.stringify(args.qualityGate ?? {}, null, 2),
        '',
        'SEMANTIC REVIEW:',
        JSON.stringify(args.review ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
