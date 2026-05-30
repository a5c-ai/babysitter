/**
 * @process repo/issue-589-agent-core-loop-strategy-gaps
 * @description Plan and execute issue #589: harden agent-core loop strategies for concurrent, group-chat, handoff, cancellation, delegation timeout, oversight retry, and composition gaps.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, projectRoot: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Active process-library searched at:
 *   /home/runner/.a5c/process-library/babysitter-repo/library
 * - Methodology references used:
 *   - methodologies/cc10x/cc10x-build.js for TDD, review, and integration verification flow.
 *   - methodologies/cc10x/cc10x-plan.js for research, alternatives, and review gate shape.
 *   - tdd-quality-convergence.js and processes/shared/tdd-triplet.js for iterative quality gates.
 *   - reference/sdk.md and reference/ADVANCED_PATTERNS.md for shell verification gates and runtime-read prompt composition.
 * - Existing agent-core surfaces to reuse:
 *   - packages/agent-core/src/loop/types.ts owns AgentLoopStrategy, AgentLoopConfig, AgentLoopIterationResult, and AgentLoop interface contracts.
 *   - packages/agent-core/src/loop/agent-loop.ts owns run(), iterate(), state transitions, strategy dispatch, callbacks, and current iterationTimeoutMs.
 *   - packages/agent-core/src/loop/strategies/concurrent.ts owns concurrent batching and settled result aggregation.
 *   - packages/agent-core/src/loop/strategies/group-chat.ts owns round-robin turns and moderator selection.
 *   - packages/agent-core/src/loop/strategies/handoff.ts owns active-agent switching, maxHandoffs, and handoffTarget extraction.
 *   - packages/agent-core/src/subagent/invoker.ts, oversight.ts, and types.ts own delegation, handoff, timeout option declarations, and review loops.
 *   - packages/agent-core/src/loop/__tests__/agent-loop.test.ts and packages/agent-core/src/subagent/__tests__/invoker.test.ts already cover happy paths and should be extended first.
 * - Related scope boundaries:
 *   - #579 is related for concurrent effects; this process should use it only as design context, not implement unrelated agent-platform scheduling.
 *   - #581 is related for subagent effect history; this process should harden SubagentInvoker contracts without replacing external task routing.
 *
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/cc10x/cc10x-build
 * @process methodologies/cc10x/cc10x-plan
 * @process processes/shared/tdd-triplet
 * @process processes/shared/ci/idempotency-and-safe-abort
 * @process specializations/collaboration/github/issue-linking
 * @agent agent-core-architect methodologies/bmad-method/agents/architect/AGENT.md
 * @agent test-strategy-architect methodologies/ccpm/agents/test-engineer/AGENT.md
 * @agent implementation-engineer methodologies/bmad-method/agents/developer/AGENT.md
 * @agent compatibility-auditor methodologies/cc10x/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function compactResult(result) {
  return result?.value ?? result ?? null;
}

function stdoutOf(result) {
  const compact = compactResult(result);
  return compact?.stdout ?? compact?.output ?? compact?.text ?? JSON.stringify(compact, null, 2);
}

export async function process(inputs, ctx) {
  const issueSpec = await ctx.task(readIssueSpecTask, inputs, {
    key: 'issue-589.read-issue-spec',
  });

  const codeEvidence = await ctx.task(readCodeEvidenceTask, inputs, {
    key: 'issue-589.read-code-evidence',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
    codeEvidenceStdout: stdoutOf(codeEvidence),
  }, {
    key: 'issue-589.reuse-audit',
  });

  const architectureTrace = await ctx.task(traceArchitectureTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
    codeEvidenceStdout: stdoutOf(codeEvidence),
    reuseAudit: compactResult(reuseAudit),
  }, {
    key: 'issue-589.architecture-trace',
  });

  if (architectureTrace?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #589 Public Strategy Contract Decision',
      question: architectureTrace.question,
      options: [
        'Proceed with recommended additive contract',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['approval-gate', 'issue-589', 'agent-core', 'strategy-contract'],
      context: {
        runId: ctx.runId,
        architectureTrace,
      },
    });
  }

  const contractTests = await ctx.task(authorContractTestsTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
    architectureTrace: compactResult(architectureTrace),
  }, {
    key: 'issue-589.author-contract-tests',
  });

  const redGate = await ctx.task(runRedTestsTask, {
    inputs,
    contractTests: compactResult(contractTests),
  }, {
    key: 'issue-589.red-gate',
  });

  let implementation = null;
  let targetedVerification = null;
  let fullVerification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementStrategyGapsTask, {
      inputs,
      issueSpecStdout: stdoutOf(issueSpec),
      codeEvidenceStdout: stdoutOf(codeEvidence),
      reuseAudit: compactResult(reuseAudit),
      architectureTrace: compactResult(architectureTrace),
      contractTests: compactResult(contractTests),
      redGate: compactResult(redGate),
      previousTargetedVerification: compactResult(targetedVerification),
      previousFullVerification: compactResult(fullVerification),
      previousReview: compactResult(review),
      attempt,
    }, {
      key: `issue-589.implementation.${attempt}`,
    });

    targetedVerification = await ctx.task(runTargetedVerificationTask, {
      inputs,
      implementation: compactResult(implementation),
      attempt,
    }, {
      key: `issue-589.targeted-verification.${attempt}`,
    });

    const diffSnapshot = await ctx.task(readDiffTask, inputs, {
      key: `issue-589.diff.${attempt}`,
    });

    review = await ctx.task(reviewStrategyContractsTask, {
      inputs,
      issueSpecStdout: stdoutOf(issueSpec),
      diffStdout: stdoutOf(diffSnapshot),
      architectureTrace: compactResult(architectureTrace),
      contractTests: compactResult(contractTests),
      implementation: compactResult(implementation),
      targetedVerification: compactResult(targetedVerification),
      attempt,
    }, {
      key: `issue-589.review.${attempt}`,
    });

    attempts.push({
      attempt,
      implementation,
      targetedVerification,
      review,
    });

    if (review?.approved === true) {
      break;
    }
  }

  fullVerification = await ctx.task(runFullVerificationTask, {
    inputs,
    implementation: compactResult(implementation),
  }, {
    key: 'issue-589.full-verification',
  });

  const finalDiff = await ctx.task(readDiffTask, inputs, {
    key: 'issue-589.final-diff',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
    finalDiffStdout: stdoutOf(finalDiff),
    reuseAudit: compactResult(reuseAudit),
    architectureTrace: compactResult(architectureTrace),
    contractTests: compactResult(contractTests),
    implementation: compactResult(implementation),
    targetedVerification: compactResult(targetedVerification),
    fullVerification: compactResult(fullVerification),
    review: compactResult(review),
    attempts,
  }, {
    key: 'issue-589.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #589 Final Acceptance Decision',
      question: finalGate.question,
      options: [
        'Accept residual risk and proceed',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['approval-gate', 'issue-589', 'agent-core', 'final-acceptance'],
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
      'issue-spec-runtime-read',
      'code-evidence-runtime-read',
      'reuse-audit',
      'runtime-call-path-trace',
      'contract-tests-red-gate',
      'implementation-loop',
      'targeted-verification',
      'semantic-contract-review',
      'full-verification',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    issueSpec,
    codeEvidence,
    reuseAudit,
    architectureTrace,
    contractTests,
    redGate,
    implementation,
    targetedVerification,
    fullVerification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueSpecTask = defineTask('issue-589.read-issue-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #589 spec and comments',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'spec', 'runtime-read'],
}));

export const readCodeEvidenceTask = defineTask('issue-589.read-code-evidence', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read current agent-core loop and subagent evidence',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      'printf "\\n## docs/agent-layer-gaps excerpts\\n"',
      'rg -n "Concurrent|Group-chat|Handoff|loop cancellation|Oversight|Delegation timeout|Strategies are isolated|No loop cancellation|timeoutMs|maxRetries|handoff" docs/agent-layer-gaps.md packages/agent-core/README.md || true',
      'printf "\\n## loop and subagent files\\n"',
      'sed -n "1,230p" packages/agent-core/src/loop/types.ts',
      'sed -n "1,390p" packages/agent-core/src/loop/agent-loop.ts',
      'sed -n "1,190p" packages/agent-core/src/loop/strategies/concurrent.ts',
      'sed -n "1,190p" packages/agent-core/src/loop/strategies/group-chat.ts',
      'sed -n "1,190p" packages/agent-core/src/loop/strategies/handoff.ts',
      'sed -n "1,230p" packages/agent-core/src/subagent/types.ts',
      'sed -n "1,210p" packages/agent-core/src/subagent/invoker.ts',
      'sed -n "1,150p" packages/agent-core/src/subagent/oversight.ts',
      'printf "\\n## existing tests\\n"',
      'sed -n "1,340p" packages/agent-core/src/loop/__tests__/agent-loop.test.ts',
      'sed -n "1,260p" packages/agent-core/src/subagent/__tests__/invoker.test.ts',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'agent-core', 'runtime-read'],
}));

export const reuseAuditTask = defineTask('issue-589.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reuse audit for agent-core strategy hardening',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'agent-core-architect',
    prompt: {
      role: 'senior TypeScript monorepo architect',
      task: 'Find existing code, tests, process patterns, and related issue boundaries to reuse before implementation.',
      instructions: [
        'Do not edit files.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Search packages/agent-core, packages/agent-runtime, packages/agent-platform, docs, and .a5c/processes for reusable timeout, cancellation, parallel dispatch, target validation, handoff context, and retry patterns.',
        'Use the process-library references named in this process header as methodology context.',
        'Identify related issues #579 and #581 only as scope boundaries.',
        'Return JSON: { reusableImplementations, reusableTests, publicApiBoundaries, relatedIssueBoundaries, noNewInfrastructureNotes, risks }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.issueSpecStdout,
        '---',
        '',
        'CURRENT CODE EVIDENCE (verbatim):',
        '---',
        args.codeEvidenceStdout,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['reusableImplementations', 'reusableTests', 'publicApiBoundaries', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'reuse-audit', 'architecture'],
}));

export const traceArchitectureTask = defineTask('issue-589.trace-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace loop strategy runtime call paths and design additive contracts',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'agent-core-architect',
    prompt: {
      role: 'principal TypeScript runtime engineer',
      task: 'Trace the live execution paths and produce the smallest compatible design for all issue #589 gaps.',
      instructions: [
        'Do not edit files.',
        'Trace runtimeCallPaths from createAgentLoop() and AgentLoopImpl.run()/iterate() through sequential, concurrent, group-chat, and handoff runners, plus SubagentInvokerImpl.invoke()/delegate()/handoff().',
        'Record only files that are on the live execution path or necessary public docs/tests.',
        'Design additive typed options where possible. Preserve existing default behavior unless a current behavior is ambiguous or unsafe and tests explicitly lock the new contract.',
        'Cover concurrency timeout isolation, partial results, cancellation, moderator structured selection and validation, handoff target validation, handoff context transfer, delegation timeout, oversight retry/reinvoke semantics, and strategy composition/mixing.',
        'If strategy composition requires a non-additive public API choice, set needsMaintainerDecision=true with a concrete question.',
        'Return JSON: { runtimeCallPaths, targetFiles, publicContractPlan, testPlan, implementationMilestones, compatibilityRisks, needsMaintainerDecision, question }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.issueSpecStdout,
        '---',
        '',
        'CURRENT CODE EVIDENCE (verbatim):',
        '---',
        args.codeEvidenceStdout,
        '---',
        '',
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'targetFiles', 'publicContractPlan', 'testPlan', 'implementationMilestones', 'compatibilityRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'runtime-call-paths', 'architecture'],
}));

export const authorContractTestsTask = defineTask('issue-589.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests from issue spec',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Write failing Vitest contract tests for issue #589 before implementation.',
      instructions: [
        'Edit only test files and test fixtures under packages/agent-core.',
        'Do not read implementation source files under packages/agent-core/src except existing test files needed for local style.',
        'Author tests strictly from the SPEC block below and the public contract plan JSON.',
        'The tests must fail against the current implementation for the right behavioral reasons.',
        'Cover concurrent per-agent timeout, partial result retention, and error aggregation.',
        'Cover external AgentLoop cancellation and state transition semantics.',
        'Cover structured group-chat moderator selection with valid, invalid, and ambiguous target outputs.',
        'Cover handoff target validation and context transfer to the target agent.',
        'Cover SubagentInvoker timeoutMs enforcement and oversight retry/reinvoke behavior.',
        'Cover strategy composition/mixing according to the public contract plan.',
        'Return JSON: { testsCreated, testsModified, expectedFailingAssertions, redCommand, notes }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.issueSpecStdout,
        '---',
        '',
        'PUBLIC CONTRACT PLAN JSON:',
        JSON.stringify(args.architectureTrace?.publicContractPlan ?? args.architectureTrace, null, 2),
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['testsCreated', 'testsModified', 'expectedFailingAssertions', 'redCommand'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'tdd', 'red'],
}));

export const runRedTestsTask = defineTask('issue-589.run-red-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify issue #589 contract tests fail before implementation',
  shell: {
    command: [
      `cd "${args.inputs.projectRoot}"`,
      'cd packages/agent-core && npm exec --yes --package=vitest -- vitest run --config vitest.config.ts src/loop/__tests__/agent-loop.test.ts src/subagent/__tests__/invoker.test.ts',
    ].join(' && '),
    expectedExitCode: 1,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'tdd', 'red-gate'],
}));

export const implementStrategyGapsTask = defineTask('issue-589.implement-strategy-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement issue #589 strategy hardening attempt ${args.attempt}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement the issue #589 contract tests with the smallest compatible changes.',
      instructions: [
        `This is implementation attempt ${args.attempt}.`,
        'Modify only files in the architectureTrace targetFiles unless a newly discovered live call path is required; document any addition.',
        'Keep public API changes additive and typed. Do not remove existing strategy kinds or result fields.',
        'Implement timeout and cancellation cleanup so in-flight work does not leave the loop in running state after cancellation or timeout.',
        'Preserve partial concurrent results when one agent times out or rejects.',
        'Validate group-chat and handoff targets against configured agent IDs with clear errors or typed rejected results according to the contract plan.',
        'Transfer structured handoff context deterministically; do not rely on string concatenation when a structured option is available.',
        'Enforce delegation timeoutMs in SubagentInvokerImpl and make oversight retry behavior configurable.',
        'Implement strategy composition/mixing only to the extent specified by the public contract plan and covered by tests.',
        'Update packages/agent-core/README.md and docs/agent-layer-gaps.md if public contracts or documented gaps change.',
        'Return JSON: { filesModified, filesCreated, publicApiChanges, testsSatisfied, docsUpdated, residualRisks }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.issueSpecStdout,
        '---',
        '',
        'ARCHITECTURE TRACE JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        '',
        'CONTRACT TESTS JSON:',
        JSON.stringify(args.contractTests, null, 2),
        '',
        args.previousTargetedVerification ? `PREVIOUS TARGETED VERIFICATION JSON:\n${JSON.stringify(args.previousTargetedVerification, null, 2)}` : 'No previous targeted verification.',
        args.previousReview ? `PREVIOUS REVIEW JSON:\n${JSON.stringify(args.previousReview, null, 2)}` : 'No previous review.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'publicApiChanges', 'testsSatisfied', 'residualRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'implementation', 'agent-core'],
}));

export const runTargetedVerificationTask = defineTask('issue-589.run-targeted-verification', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run targeted issue #589 verification attempt ${args.attempt}`,
  shell: {
    command: [
      `cd "${args.inputs.projectRoot}"`,
      'cd packages/agent-core && npm exec --yes --package=vitest -- vitest run --config vitest.config.ts src/loop/__tests__/agent-loop.test.ts src/subagent/__tests__/invoker.test.ts',
      'cd ../..',
      'npm run build --workspace=@a5c-ai/agent-core',
      'git diff --check',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'verification', 'targeted'],
}));

export const readDiffTask = defineTask('issue-589.read-diff', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed artifacts for issue #589 review',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      'git diff -- packages/agent-core docs/agent-layer-gaps.md',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'diff', 'runtime-read'],
}));

export const reviewStrategyContractsTask = defineTask('issue-589.review-strategy-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #589 semantic contracts attempt ${args.attempt}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'principal TypeScript API compatibility reviewer',
      task: 'Review the implementation against the issue spec and changed artifacts. Gate the next iteration.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Check that every issue gap has a behavioral test and implementation support.',
        'Reject if timeout or cancellation can leave unresolved state, swallowed errors, or missing partial concurrent results.',
        'Reject if group-chat or handoff target validation falls back silently on invalid or ambiguous target selection.',
        'Reject if delegation timeoutMs is still only declared and not enforced.',
        'Reject if oversight retry cannot actually produce a revised output when configured to reinvoke.',
        'Reject if strategy composition is untested or only documented without a runtime contract.',
        'Return JSON: { approved, findings, missingCriteria, changedFiles, followUpRequired }.',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.diffStdout,
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.issueSpecStdout,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'missingCriteria', 'changedFiles'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'review', 'compatibility'],
}));

export const runFullVerificationTask = defineTask('issue-589.run-full-verification', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run full issue #589 verification gate',
  shell: {
    command: [
      `cd "${args.inputs.projectRoot}"`,
      'npm run test --workspace=@a5c-ai/agent-core',
      'npm run build --workspace=@a5c-ai/agent-core',
      'npm run verify:metadata',
      'git diff --check',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'verification', 'full'],
}));

export const finalAcceptanceGateTask = defineTask('issue-589.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance review for issue #589',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'release-minded TypeScript runtime reviewer',
      task: 'Make the final pass/fail decision for issue #589.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Confirm the implementation remains scoped to agent-core loop/subagent semantics and related docs/tests.',
        'Confirm all shell verification gates completed successfully.',
        'Confirm docs/agent-layer-gaps.md no longer claims gaps that are now fixed, or clearly preserves any intentional non-goal.',
        'Set needsHumanDecision=true only for an unresolved public API contract or accepted residual risk.',
        'Return JSON: { passed, changedFiles, acceptanceSummary, verificationSummary, residualRisks, needsHumanDecision, question }.',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.finalDiffStdout,
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.issueSpecStdout,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'changedFiles', 'acceptanceSummary', 'verificationSummary', 'residualRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-589', 'final-acceptance'],
}));
