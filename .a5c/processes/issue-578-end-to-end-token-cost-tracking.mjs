/**
 * @process repo/issue-578-end-to-end-token-cost-tracking
 * @description Plan and execute issue #578: end-to-end token usage and cost tracking from agent-core through transport-mux, SDK journal events, and agent-platform budget enforcement.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, relatedIssues: number[], targetFiles: string[], verificationCommands: string[], maxVerificationAttempts: number }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], contract: object, implementation: object, qualityGate: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/user-guide/features/process-library.md
 * - library/tdd-quality-convergence.js
 * - library/specializations/sdk-platform-development/sdk-testing-strategy.js
 * - library/specializations/sdk-platform-development/backward-compatibility-management.js
 * - library/specializations/qa-testing-automation/contract-testing.js
 * - library/processes/shared/runtime-call-tracer.js
 * - library/processes/shared/deterministic-quality-gate.js
 * - docs/agent-layer-gaps.md
 * - docs/agent-mux/tutorials/cost-tracking.md
 * - docs/agent-mux-babysitter-integrations/effect-resolution.md
 *
 * Note: .a5c/process-library/ was not present in this checkout. The active
 * process library is under library/, so this process borrows its TDD,
 * contract-testing, backward-compatibility, and deterministic quality-gate
 * patterns while staying aligned with local .a5c/processes conventions.
 *
 * This process intentionally uses agent tasks rather than shell tasks to
 * respect the repository override for direct Babysitter workflows.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent api-design-reviewer specializations/sdk-platform-development/agents/api-design-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent telemetry-privacy-auditor specializations/sdk-platform-development/agents/telemetry-privacy-auditor/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_VERIFICATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? DEFAULT_MAX_VERIFICATION_ATTEMPTS;

  const issueContext = await ctx.task(readIssueContextTask, {
    issueNumber: inputs?.issueNumber ?? 578,
    relatedIssues: inputs?.relatedIssues ?? [575, 587, 599, 604],
    seed: {
      title: inputs?.title,
      labels: inputs?.labels ?? [],
      summary: inputs?.issueSummary,
      triageComment: inputs?.triageComment,
    },
  }, {
    key: 'issue-578.issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    targetFiles: inputs?.targetFiles ?? [],
    processLibraryReferences: inputs?.processLibraryReferences ?? [],
  }, {
    key: 'issue-578.reuse-audit',
  });

  const surfaceTrace = await ctx.task(traceTokenCostSurfacesTask, {
    issueContext,
    reuseAudit,
    targetFiles: inputs?.targetFiles ?? [],
    documentationReferences: inputs?.documentationReferences ?? [],
  }, {
    key: 'issue-578.surface-trace',
  });

  const contract = await ctx.task(designCostContractTask, {
    issueContext,
    reuseAudit,
    surfaceTrace,
    constraints: inputs?.constraints ?? [],
  }, {
    key: 'issue-578.cost-contract',
  });

  if (contract?.needsMaintainerDecision === true) {
    const decision = await ctx.breakpoint({
      breakpointId: 'issue-578.cost-contract-decision',
      title: 'Issue #578 cost contract decision',
      question: contract.question ?? 'Review the canonical token/cost event contract before implementation continues.',
      options: [
        'Proceed with recommended contract',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['issue-578', 'cost-tracking', 'contract', 'approval-gate'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs?.issueNumber ?? 578,
        contract,
        surfaceTrace,
      },
    });

    if (decision && decision.approved === false) {
      return {
        success: false,
        blocked: true,
        stoppedAt: 'cost-contract-decision',
        feedback: decision.feedback,
        phases: ['issue-context', 'reuse-audit', 'surface-trace', 'cost-contract'],
        issueContext,
        reuseAudit,
        surfaceTrace,
        contract,
      };
    }
  }

  const regressionPlan = await ctx.task(authorRegressionCoverageTask, {
    issueContext,
    reuseAudit,
    surfaceTrace,
    contract,
    testTargets: inputs?.testTargets ?? [],
  }, {
    key: 'issue-578.regression-coverage',
  });

  let implementation = null;
  let qualityGate = null;
  let review = null;
  let verificationFeedback = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    const agentCoreUsage = await ctx.task(implementAgentCoreUsageTask, {
      issueContext,
      surfaceTrace,
      contract,
      regressionPlan,
      verificationFeedback,
      attempt,
    }, {
      key: `issue-578.agent-core-usage.${attempt}`,
    });

    const transportSdkFeedback = await ctx.task(implementTransportSdkFeedbackTask, {
      issueContext,
      surfaceTrace,
      contract,
      regressionPlan,
      agentCoreUsage,
      verificationFeedback,
      attempt,
    }, {
      key: `issue-578.transport-sdk-feedback.${attempt}`,
    });

    const platformBudgetEnforcement = await ctx.task(implementPlatformBudgetEnforcementTask, {
      issueContext,
      surfaceTrace,
      contract,
      regressionPlan,
      agentCoreUsage,
      transportSdkFeedback,
      verificationFeedback,
      attempt,
    }, {
      key: `issue-578.platform-budget-enforcement.${attempt}`,
    });

    implementation = {
      attempt,
      agentCoreUsage,
      transportSdkFeedback,
      platformBudgetEnforcement,
      changedFiles: [
        ...(agentCoreUsage?.changedFiles ?? []),
        ...(transportSdkFeedback?.changedFiles ?? []),
        ...(platformBudgetEnforcement?.changedFiles ?? []),
      ],
    };

    qualityGate = await ctx.task(runQualityGateTask, {
      issueContext,
      reuseAudit,
      surfaceTrace,
      contract,
      regressionPlan,
      implementation,
      verificationCommands: inputs?.verificationCommands ?? [],
      attempt,
    }, {
      key: `issue-578.quality-gate.${attempt}`,
    });

    review = await ctx.task(reviewEndToEndCostChainTask, {
      issueContext,
      reuseAudit,
      surfaceTrace,
      contract,
      regressionPlan,
      implementation,
      qualityGate,
      attempt,
    }, {
      key: `issue-578.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, qualityGate, review });

    if (qualityGate?.passed === true && review?.approved === true) {
      break;
    }

    verificationFeedback = { qualityGate, review };
  }

  if (qualityGate?.passed !== true || review?.approved !== true) {
    const decision = await ctx.breakpoint({
      breakpointId: 'issue-578.quality-gate-failed',
      title: 'Issue #578 quality gate failed',
      question: 'The end-to-end cost tracking quality gate or review did not pass within the configured attempts. Continue another repair attempt or stop?',
      options: [
        'Continue with another repair attempt',
        'Stop and report current failures',
      ],
      expert: 'owner',
      tags: ['issue-578', 'quality-gate', 'cost-tracking'],
      context: {
        runId: ctx.runId,
        attempts,
        qualityGate,
        review,
      },
    });

    if (decision && decision.approved === false) {
      return {
        success: false,
        stoppedAt: 'quality-gate-failed',
        feedback: decision.feedback,
        phases: [
          'issue-context',
          'reuse-audit',
          'surface-trace',
          'cost-contract',
          'regression-coverage',
          'implementation-loop',
          'quality-gate',
          'review',
        ],
        issueContext,
        reuseAudit,
        surfaceTrace,
        contract,
        regressionPlan,
        implementation,
        qualityGate,
        review,
        attempts,
      };
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    issueContext,
    reuseAudit,
    surfaceTrace,
    contract,
    regressionPlan,
    implementation,
    qualityGate,
    review,
    attempts,
    allowedChangedFiles: inputs?.allowedChangedFiles ?? inputs?.targetFiles ?? [],
    acceptanceCriteria: inputs?.acceptanceCriteria ?? [],
  }, {
    key: 'issue-578.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'surface-trace',
      'cost-contract',
      'regression-coverage',
      'agent-core-usage',
      'transport-sdk-feedback',
      'platform-budget-enforcement',
      'quality-gate',
      'review',
      'final-acceptance',
    ],
    issueContext,
    reuseAudit,
    surfaceTrace,
    contract,
    regressionPlan,
    implementation,
    qualityGate,
    review,
    attempts,
    finalGate,
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
  };
}

export const readIssueContextTask = defineTask('issue-578.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #578 and related cost-tracking context',
  labels: ['issue-578', 'agent-core', 'transport-mux', 'sdk', 'agent-platform', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter platform engineer',
      task: 'Read the GitHub issue and produce the authoritative behavioral spec for the implementation run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read every comment and every label. Treat the issue, comments, and labels as the source of truth.',
        `Inspect related issues only enough to define scope boundaries: ${(args.relatedIssues ?? []).map((n) => `#${n}`).join(', ')}`,
        'Keep #575 streaming visibility, #587 token estimation accuracy, #599 transport-mux cost feedback, and #604 external agent effect cost journaling as related constraints, not automatic scope expansion unless directly required for #578.',
        'Return JSON: { title, labels, priority, risk, issueSummary, commentsSummary, relatedIssues, acceptanceCriteria, nonGoals, dependencies, openQuestions }.',
      ],
      context: args.seed,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-578.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reuse-audit existing token and cost infrastructure',
  labels: ['issue-578', 'reuse-audit', 'process-library', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior architecture researcher',
      task: 'Run the mandatory reuse audit before implementation planning.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from issue #578: token usage, cost tracking, costRecord, COST_TRACKED, appendCostEvent, runId, sessionId, effectId, idempotency, budget, auto-pause, transport-mux, agent-core, SDK journal, agent-platform.',
        'Scan for matching migrations, routes, environment variables, SDK dependencies, imports, helpers, tests, and docs before proposing new infrastructure.',
        'Search .a5c/reuse-audit.json if present and honor its scan globs and keyword rules.',
        'Research process-library methodology matches. Use library/tdd-quality-convergence.js, library/specializations/sdk-platform-development/sdk-testing-strategy.js, library/specializations/sdk-platform-development/backward-compatibility-management.js, library/specializations/qa-testing-automation/contract-testing.js, and library/processes/shared/README.md as the likely references.',
        'Prefer existing helpers and schemas: packages/sdk/src/cost/journal.ts, packages/sdk/src/cost/types.ts, packages/sdk/src/runtime/replay/effectIndex, transport-mux codec extractCostRecord hooks, agent-platform session/cost APIs.',
        'Return JSON: { renderedFindings, existingInfrastructure, reusableTests, processLibraryMatches, noNewInfrastructureUnless, risks, followUpReads }.',
      ],
      context: {
        issueContext: args.issueContext,
        targetFiles: args.targetFiles,
        processLibraryReferences: args.processLibraryReferences,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceTokenCostSurfacesTask = defineTask('issue-578.trace-token-cost-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace current token usage and cost surfaces',
  labels: ['issue-578', 'runtime-trace', 'agent-core', 'transport-mux', 'sdk', 'agent-platform'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior cross-layer runtime engineer',
      task: 'Map the current token/cost data path and all missing integration points before code changes.',
      instructions: [
        'Work from the issue context and reuse-audit JSON below.',
        'Trace agent-core prompt flow from packages/agent-core/src/session.ts through AgentCorePromptResult in packages/agent-core/src/types.ts and all downstream consumers in agent-platform.',
        'Trace transport-mux CompletionResult.usage/costRecord through codecs, server response paths, streaming done events, MetricsTracker, and tests.',
        'Trace SDK cost journaling: packages/sdk/src/cost/types.ts, packages/sdk/src/cost/journal.ts, packages/sdk/src/runtime/orchestrateIteration.ts, and packages/sdk/src/runtime/replay/effectIndex plus existing tests.',
        'Trace agent-platform cost APIs: packages/agent-platform/src/session/cost.ts, packages/agent-platform/src/cost/effectCost.ts, createRun orchestration/effect resolution files, and amux event mapper cost/token_usage handling.',
        'Identify the authoritative point where a completion/effect has enough runId/sessionId/effectId identity to append one COST_TRACKED event without double counting.',
        'Return JSON: { agentCorePath, transportMuxPath, sdkJournalPath, agentPlatformBudgetPath, identityAvailability, doubleCountRisks, streamingGaps, targetFiles, testsToUpdate, recommendedSequence }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        targetFiles: args.targetFiles,
        documentationReferences: args.documentationReferences,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designCostContractTask = defineTask('issue-578.design-cost-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design canonical cost event contract',
  labels: ['issue-578', 'api-design', 'cost-contract', 'compatibility'],
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'SDK API contract designer',
      task: 'Define the canonical normalized usage/cost contract for the L4 to transport-mux to SDK to L6 chain.',
      instructions: [
        'Design backward-compatible optional fields. Do not require old journals or old AgentCorePromptResult callers to change unless TypeScript exhaustiveness requires it.',
        'Unify naming across transport-mux cacheWriteTokens/cacheReadTokens and SDK cacheCreationTokens/cacheReadTokens. Call out any aliases needed for effectIndex compatibility, including cacheCreationInputTokens if currently consumed.',
        'Include run identity fields when available: runId, sessionId, effectId, taskId/taskKind, provider, model, input/output/cache tokens, costUsd, durationMs, timestamp, source, and idempotencyKey.',
        'Define exactly one authoritative COST_TRACKED emission point per effect/completion and describe idempotency behavior for retries, streaming final events, and late cost events.',
        'Specify how agent-core returns usage metadata without performing cost calculation when pricing is unavailable.',
        'Specify how transport-mux can report cost feedback to the SDK without becoming tightly coupled to run directory storage. Prefer an injectable sink/callback or explicit metadata bridge over global state.',
        'Specify how agent-platform updates session cost state, marks thresholds, and pauses only at orchestrator-safe checkpoints.',
        'Return JSON: { contractFields, compatibilityPlan, authoritativeEmissionPoint, idempotencyPlan, streamingPlan, budgetEnforcementPlan, needsMaintainerDecision, question, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        surfaceTrace: args.surfaceTrace,
        constraints: args.constraints,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionCoverageTask = defineTask('issue-578.author-regression-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression coverage for cost chain',
  labels: ['issue-578', 'tests', 'tdd', 'integration'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused failing regression tests before implementation changes.',
      instructions: [
        'You own test files only in this task. Do not modify implementation files.',
        'Use the issue context, surface trace, and contract JSON as the spec source.',
        'Add or update agent-core tests proving mocked OpenAI and Anthropic API usage is returned on AgentCorePromptResult. Include zero/missing usage behavior.',
        'Add or update transport-mux tests proving non-streaming and streaming completion usage/cost records can be emitted to a feedback sink with provider/model/cache tokens and no duplicate event for one completion.',
        'Add or update SDK tests proving the normalized event appends COST_TRACKED with effectId/taskKind and updates computeRunCostStats/effectIndex consistently.',
        'Add or update agent-platform tests proving session cost state updates from run/effect cost stats, thresholds are marked once, and autoPause produces an orchestrator-safe pause reason when budget is exceeded.',
        'Add an integration-style test that starts with a mocked completion/effect and observes one journaled COST_TRACKED event plus budget handling when configured over limit.',
        'Keep tests deterministic. Avoid live provider calls and network dependencies.',
        'Return JSON: { changedFiles, testsAdded, expectedRedFailures, coverageMatrix, outOfScope, notes }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        surfaceTrace: args.surfaceTrace,
        contract: args.contract,
        testTargets: args.testTargets,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementAgentCoreUsageTask = defineTask('issue-578.implement-agent-core-usage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement agent-core usage propagation',
  labels: ['issue-578', 'agent-core', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement the agent-core usage propagation slice for issue #578.',
      instructions: [
        'Modify only files needed for the agent-core slice and any tests directly tied to it.',
        'Extend AgentCorePromptResult with optional normalized usage metadata. Preserve backward compatibility for callers that ignore it.',
        'Return usage from prompt() for OpenAI/Azure and Anthropic direct API paths. Include totalTokens when derivable, and preserve raw provider differences only where useful for audit.',
        'Propagate usage through agent-platform AgentCorePromptResult type mirrors and createRun agent-core loop utilities if those types currently duplicate the shape.',
        'Make the tests from the regression plan pass for this slice without adding cost calculation in agent-core unless the contract explicitly requires it.',
        'Return JSON: { changedFiles, behaviorChanged, compatibilityNotes, testsTouched, remainingWork, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        surfaceTrace: args.surfaceTrace,
        contract: args.contract,
        regressionPlan: args.regressionPlan,
        verificationFeedback: args.verificationFeedback,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementTransportSdkFeedbackTask = defineTask('issue-578.implement-transport-sdk-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement transport-mux to SDK cost feedback',
  labels: ['issue-578', 'transport-mux', 'sdk', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior transport and SDK integration engineer',
      task: 'Implement the transport-mux and SDK cost feedback slice for issue #578.',
      instructions: [
        'Modify only transport-mux, SDK cost/journal/replay helpers, and direct tests needed for this slice.',
        'Add the agreed normalized cost feedback type or adapter at the narrowest shared boundary. Prefer reusing SDK CostEventData and transport-mux NormalizedCostRecord where practical.',
        'Add an injectable transport-mux cost feedback sink/callback so proxy completions can emit normalized cost data with runId/sessionId/effectId metadata when the caller supplies it.',
        'Ensure streaming records only once from the final done usage event, and non-streaming records once from CompletionResult usage/costRecord.',
        'Append SDK COST_TRACKED events from the authoritative emission point with idempotency keys or duplicate guards so retries do not double count the same effect/completion.',
        'Preserve existing response shapes and local MetricsTracker behavior.',
        'Make the transport-mux and SDK regression tests pass for this slice.',
        'Return JSON: { changedFiles, feedbackPath, idempotencyBehavior, testsTouched, compatibilityNotes, remainingWork, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        surfaceTrace: args.surfaceTrace,
        contract: args.contract,
        regressionPlan: args.regressionPlan,
        agentCoreUsage: args.agentCoreUsage,
        verificationFeedback: args.verificationFeedback,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementPlatformBudgetEnforcementTask = defineTask('issue-578.implement-platform-budget-enforcement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement agent-platform budget enforcement',
  labels: ['issue-578', 'agent-platform', 'budget', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior orchestration platform engineer',
      task: 'Implement the L6 session cost budget enforcement slice for issue #578.',
      instructions: [
        'Modify only agent-platform orchestration/session cost files and direct tests needed for this slice.',
        'Wire run/effect cost stats into session cost aggregation using existing packages/agent-platform/src/session/cost.ts APIs where possible.',
        'Call checkBudget() and markThresholdsTriggered() at an orchestrator-safe checkpoint after authoritative COST_TRACKED data is journaled and before more work is dispatched.',
        'When autoPause is enabled and budget is exceeded, pause with an explicit budget reason rather than failing the run unexpectedly.',
        'Ensure budget alerts are not repeatedly emitted for already-triggered thresholds.',
        'Keep old sessions without budget config and journals without cost events behaviorally unchanged.',
        'Make the agent-platform budget regression tests pass and update any type seams needed for agent-core usage fields.',
        'Return JSON: { changedFiles, enforcementPath, pauseBehavior, testsTouched, compatibilityNotes, remainingWork, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        surfaceTrace: args.surfaceTrace,
        contract: args.contract,
        regressionPlan: args.regressionPlan,
        agentCoreUsage: args.agentCoreUsage,
        transportSdkFeedback: args.transportSdkFeedback,
        verificationFeedback: args.verificationFeedback,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runQualityGateTask = defineTask('issue-578.run-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run deterministic quality gate for end-to-end cost tracking',
  labels: ['issue-578', 'verification', 'quality-gate', 'agent-core', 'transport-mux', 'sdk', 'agent-platform'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'quality gate owner',
      task: 'Run and evaluate the deterministic verification gate for issue #578.',
      instructions: [
        'Run the verification commands supplied in inputs, plus any directly relevant package-level targeted tests added by the regression plan.',
        'At minimum, verify TypeScript/build health and targeted tests for agent-core, transport-mux, SDK cost journal/effect index, and agent-platform session budget enforcement.',
        'Recommended baseline commands are in the inputs: npm run build:sdk, npm run test:sdk, npm run verify:metadata. Add package-specific test commands only when needed to exercise changed files.',
        'Capture exact commands, pass/fail status, and failure excerpts. Do not waive failures without proving they are unrelated pre-existing failures.',
        'Check the integration acceptance scenario: mocked completion/effect produces exactly one COST_TRACKED journal event with normalized usage/cost metadata and triggers budget pause behavior when over limit.',
        'Return JSON: { passed, commandsRun, targetedTests, integrationScenarioPassed, typecheckPassed, metadataPassed, failures, suspectedPreExistingFailures, nextFixHints }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        surfaceTrace: args.surfaceTrace,
        contract: args.contract,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        verificationCommands: args.verificationCommands,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewEndToEndCostChainTask = defineTask('issue-578.review-end-to-end-cost-chain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review cost chain implementation for correctness and compatibility',
  labels: ['issue-578', 'review', 'compatibility', 'cost-tracking'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior code reviewer',
      task: 'Review the issue #578 implementation as a blocking code review.',
      instructions: [
        'Prioritize findings that could cause under-counting, double-counting, missing budget pauses, type/API breakage, journal replay regressions, or provider-specific token loss.',
        'Verify AgentCorePromptResult additions are optional/backward-compatible and that mirrored types stay consistent.',
        'Verify transport-mux feedback is identity-aware only when metadata is supplied and does not couple generic proxy usage to SDK storage.',
        'Verify SDK journal events retain replay compatibility and computeRunCostStats/effectIndex behavior with old journals.',
        'Verify agent-platform budget enforcement pauses safely and does not continue dispatching after autoPause is exceeded.',
        'Verify privacy posture: no prompt text, API keys, or raw provider payloads are written to COST_TRACKED events unless explicitly sanitized.',
        'Return JSON: { approved, findings, requiredChanges, compatibilityRisks, privacyRisks, residualRisk, reviewSummary }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        surfaceTrace: args.surfaceTrace,
        contract: args.contract,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        qualityGate: args.qualityGate,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-578.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #578',
  labels: ['issue-578', 'final-acceptance', 'quality-gate'],
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'release acceptance auditor',
      task: 'Decide whether issue #578 is complete and ready for maintainer review.',
      instructions: [
        'Check all issue acceptance criteria and the contract acceptance criteria below.',
        'Require evidence that token usage returned by agent-core reaches downstream consumers, transport-mux feedback appends exactly one SDK COST_TRACKED event for a mocked completion/effect, SDK run cost stats include the event, and agent-platform budget autoPause triggers safely when over budget.',
        'Require passing quality gate and approving review. If either failed, finalGate.passed must be false.',
        'Confirm changed files are inside the expected package/docs/test scope for #578 and do not include unrelated refactors.',
        'Confirm no implementation leaks prompt text, raw credentials, or unsanitized provider payloads into cost events.',
        'Return JSON: { passed, changedFiles, acceptanceEvidence, unresolvedRisks, requiredFollowUps, summary }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        surfaceTrace: args.surfaceTrace,
        contract: args.contract,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        qualityGate: args.qualityGate,
        review: args.review,
        attempts: args.attempts,
        allowedChangedFiles: args.allowedChangedFiles,
        acceptanceCriteria: args.acceptanceCriteria,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
