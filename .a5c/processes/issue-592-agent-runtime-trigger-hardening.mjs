/**
 * @process repo/issue-592-agent-runtime-trigger-hardening
 * @description Plan and execute issue #592: close agent-runtime scheduling gaps for cron semantics, event triggers, admission control, deduplication, and failed-trigger handling.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - library/methodologies/atdd-tdd/atdd-tdd.js
 * - library/methodologies/spec-kit/spec-kit-planning.js
 * - library/methodologies/event-storming/event-storming.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/deterministic-quality-gate.js
 * - library/processes/shared/cycle-aware-verification.js
 * - library/specializations/sdk-platform-development/sdk-architecture-design.js
 * - library/specializations/sdk-platform-development/api-design-specification.js
 * - library/specializations/sdk-platform-development/backward-compatibility-management.js
 * - library/specializations/sdk-platform-development/sdk-testing-strategy.js
 * - library/specializations/network-programming/event-driven-socket-handler.js
 * - library/specializations/network-programming/realtime-messaging-system.js
 * - library/specializations/web-development/nestjs-microservices.js
 * - library/specializations/collaboration/github/issue-linking.js
 *
 * Note: the requested .a5c/process-library/ path was not present in this checkout.
 * Matching methodologies and specializations were researched under the local
 * repository process library root at library/.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent api-design-reviewer specializations/sdk-platform-development/agents/api-design-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent security-review-agent specializations/sdk-platform-development/agents/security-review-agent/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-592.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-592.reuse-audit',
  });

  const architectureTrace = await ctx.task(traceTriggerRuntimeTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-592.trace-trigger-runtime',
  });

  const capabilitySpec = await ctx.task(authorTriggerCapabilitySpecTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
  }, {
    key: 'issue-592.author-capability-spec',
  });

  if (capabilitySpec?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #592 Trigger Scope Decision',
      question: capabilitySpec.question,
      options: [
        'Proceed with recommended staged scope',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-592', 'agent-runtime', 'triggers'],
      context: {
        runId: ctx.runId,
        capabilitySpec,
      },
    });
  }

  const regressionPlan = await ctx.task(authorRegressionCoverageTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    capabilitySpec,
  }, {
    key: 'issue-592.author-regression-coverage',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementTriggerHardeningTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      capabilitySpec,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-592.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      architectureTrace,
      capabilitySpec,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-592.verification.${attempt}`,
    });

    review = await ctx.task(reviewTriggerHardeningTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      capabilitySpec,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-592.review.${attempt}`,
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
    architectureTrace,
    capabilitySpec,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-592.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'trigger-runtime-trace',
      'trigger-capability-spec',
      'regression-coverage',
      'incremental-implementation',
      'verification-loop',
      'security-compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    reuseAudit,
    architectureTrace,
    capabilitySpec,
    regressionPlan,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-592.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #592 and related trigger context',
  labels: ['agent-runtime', 'triggers', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter runtime maintainer',
      task: 'Read the GitHub issue and produce the authoritative implementation scope for issue #592.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, every comment, and labels as the source of truth.',
        'Inspect related issues mentioned in comments, especially #585 and #593, only enough to define integration boundaries.',
        'Preserve concrete issue references and dates from comments when they affect sequencing.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, relatedIssues, acceptanceCriteria, nonGoals, severity, riskLevel, targetFilesFromIssue, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-592.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for trigger scheduling infrastructure',
  labels: ['agent-runtime', 'triggers', 'reuse-audit', 'phase:0'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior monorepo architecture analyst',
      task: 'Perform the repo-required Phase 0 reuse audit before proposing new trigger scheduling infrastructure.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the issue: cron, named months, named days, timezone, @daily, @reboot, L syntax, # syntax, message queue, RabbitMQ, Kafka, SQS, git webhook, Slack, Discord, rate limit, backpressure, adaptive throttling, deduplication, fingerprinting, dead letter queue, retry, backoff, failure metrics, durable queue.',
        'Scan the repo for matching migrations, API routes, environment variables, SDK dependencies, package exports, imports, queue abstractions, webhook services, automation rule types, governance rate-limit policies, daemon status, diagnostics queue metrics, and existing trigger code. Honor .a5c/reuse-audit.json if present.',
        'Inspect packages/agent-runtime first, then packages/agent-platform duplicated daemon code, packages/agent-mux gateway/webui automation services, packages/agent-mux/core automation types, governance rate limiting, docs/agent-layer-gaps.md, and existing daemon tests.',
        'Call out reusable infrastructure and areas where no matching existing infrastructure was found.',
        'Do not edit files.',
        'Return JSON: { renderedFindings, keywords, existingInfrastructure, reusableModules, dependencyFindings, envVars, endpointFindings, gapsStillOpen, noMatchNotes, risksForNewInfrastructure }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceTriggerRuntimeTask = defineTask('issue-592.trace-trigger-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace daemon trigger runtime and duplicated platform implementation',
  labels: ['agent-runtime', 'agent-platform', 'triggers', 'architecture-trace'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Map the current trigger runtime architecture, tests, and duplication risks before design or implementation.',
      instructions: [
        'Trace packages/agent-runtime/src/daemon/types.ts, config.ts, timerScheduler.ts, fileWatcher.ts, webhookListener.ts, loop.ts, lifecycle.ts, daemonLog.ts, automationExecutor.ts, and package exports.',
        'Trace the duplicated packages/agent-platform/src/daemon/* implementation and its tests. Identify exact parity requirements and whether centralization is feasible in this change.',
        'Inspect packages/agent-platform/src/daemon/__tests__/timerScheduler.test.ts, fileWatcher.test.ts, webhookListener.test.ts, loop.test.ts, config.test.ts, and automationExecutor.test.ts.',
        'Inspect existing agent-runtime daemon tests and identify coverage gaps that must be closed for this issue.',
        'Inspect packages/agent-mux/core/src/automation.ts and gateway/webui automation webhook services for reusable automation concepts and sourceEvent handling.',
        'Inspect governance rate-limit policy code only enough to decide whether it can be reused or should stay separate from trigger admission control.',
        'Do not edit files.',
        'Return JSON: { callPaths, currentCapabilities, duplicatedFiles, reusableTypes, missingTests, cronLimitations, eventSourceLimitations, admissionControlGaps, dedupGaps, retryDlqGaps, integrationBoundaries, recommendedSliceOrder, risks }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorTriggerCapabilitySpecTask = defineTask('issue-592.author-capability-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author staged trigger capability specification',
  labels: ['agent-runtime', 'triggers', 'design', 'capability-spec'],
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'runtime API designer and reliability architect',
      task: 'Create a staged capability specification for trigger hardening that can be implemented without turning the issue into an unbounded epic.',
      instructions: [
        'Define the concrete schema additions for daemon trigger config and automation rules, preserving existing file/webhook/timer behavior.',
        'For cron, specify supported named months/days, timezone behavior, macros, and the subset or deferral of L/#/@reboot semantics. Prefer explicit non-goals over ambiguous parser behavior.',
        'For event sources, define a pluggable event-source abstraction and implementable first adapters. Use provider-neutral interfaces and keep external SDK dependencies optional or avoided unless already present.',
        'For admission control, define queue-depth limits, max-per-window rate limiting, backpressure/defer/reject outcomes, webhook response semantics, and observable counters.',
        'For deduplication, define stable fingerprints that include source, rule identity, trigger payload/file path, time bucket where appropriate, and explicit logging of suppressed triggers.',
        'For retries and DLQ, define retry metadata, backoff policy, failed-trigger persistence format, and coordination boundaries with #585 crash recovery. Do not invent a competing durable queue design if #585 owns it.',
        'For duplicated daemon code, choose either centralization or synchronized parity edits with parity tests; justify the choice.',
        'Include a sparse breakpoint recommendation only if provider selection, durable queue ownership, or @reboot semantics need maintainer input before implementation.',
        'Return JSON: { summary, schemaChanges, cronSpec, eventSourceSpec, admissionControlSpec, dedupSpec, retryDlqSpec, parityStrategy, stagedImplementationPlan, nonGoals, compatibilityPlan, needsMaintainerDecision, question }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionCoverageTask = defineTask('issue-592.author-regression-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author trigger hardening regression coverage',
  labels: ['agent-runtime', 'triggers', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior Vitest and runtime reliability test designer',
      task: 'Design and, during execution, add failing regression tests before implementation changes.',
      instructions: [
        'Follow an ATDD/TDD sequence: acceptance tests and focused unit tests first, implementation second.',
        'Add or extend agent-runtime tests so runtime is not relying on agent-platform tests for daemon behavior.',
        'Cover cron compatibility and new cron semantics: existing numeric, comma, range, step forms; named months/days; timezone matching; supported macros; invalid expression handling; explicitly deferred syntax behavior.',
        'Cover file trigger deduplication for overlapping patterns and retention of legitimate distinct rules.',
        'Cover webhook admission control: allowed, queued/deferred, rate-limited, queue-full rejection, and response body/status semantics.',
        'Cover event-source abstraction with at least one deterministic in-process test adapter and provider-specific validation for git/chat/queue trigger config if implemented.',
        'Cover retry and DLQ behavior: retry attempts, backoff metadata, permanent failure persistence, metrics/log events, and no daemon crash on onTrigger failure.',
        'Cover parity between packages/agent-runtime and packages/agent-platform, either through shared implementation tests or explicit parity tests.',
        'Return JSON: { testFilesToAddOrUpdate, acceptanceTests, unitTests, integrationTests, fixtures, fakeClockStrategy, providerDependencyStrategy, expectedRedFailures, commandsToRun, risks }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementTriggerHardeningTask = defineTask('issue-592.implement-trigger-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement staged trigger hardening',
  labels: ['agent-runtime', 'agent-platform', 'triggers', 'implementation'],
  agent: {
    name: 'platform-architect',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement issue #592 in small, test-backed slices.',
      instructions: [
        'Edit the repository directly, but keep the implementation scoped to issue #592.',
        'Start by adding the regression tests from the regression plan and confirm they fail for the intended reasons before implementation.',
        'Implement cron parsing/timezone/macros while preserving existing supported syntax and deterministic fake-clock tests.',
        'Introduce an extensible trigger event-source abstraction. Implement deterministic local adapters and only add external provider dependencies if the reuse audit found an existing dependency and the capability spec explicitly allows it.',
        'Implement admission control in the daemon loop or a small helper: queue-depth bounds, max-per-window rate limits, defer/reject outcomes, backpressure-aware webhook responses, and metrics/log fields.',
        'Implement deduplication with explicit fingerprints and auditable suppressed-trigger log entries.',
        'Implement retry metadata, backoff calculation, failure persistence, and DLQ-style failed-trigger records without conflicting with #585 durable queue ownership.',
        'Reconcile packages/agent-runtime and packages/agent-platform duplicated daemon code according to the parity strategy. Prefer centralization when practical; otherwise update both and add parity tests.',
        'Update docs/agent-layer-gaps.md and package README/docs only for the capabilities actually implemented.',
        'Do not implement #585 crash recovery or #593 background process lifecycle beyond integration points needed by this issue.',
        'Do not commit unrelated dirty worktree files.',
        'Return JSON: { changedFiles, summary, testsAdded, implementationSlices, compatibilityNotes, deferredScope, verificationCommands }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
        previousVerification: args.previousVerification,
        previousReview: args.previousReview,
        attempt: args.attempt,
      },
    },
    timeout: 900000,
    maxTurns: 20,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-592.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run deterministic trigger hardening verification gates',
  labels: ['agent-runtime', 'triggers', 'verification', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior release verification engineer',
      task: 'Run the required verification commands and summarize exact results.',
      instructions: [
        'Run the targeted trigger tests first, then the broader workspace gates from inputs.verificationCommands.',
        'Include exact command lines, pass/fail status, and concise failure excerpts for any failure.',
        'Verify git diff --check passes.',
        'Verify docs changed only where they reflect implemented behavior.',
        'Verify no source file changes outside the issue scope unless justified by centralization/parity.',
        'Do not mark verification passed if commands were skipped without a concrete reason.',
        'Return JSON: { passed, commands, failures, skipped, changedFiles, evidence, recommendedFixes }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        attempt: args.attempt,
      },
    },
    timeout: 900000,
    maxTurns: 12,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewTriggerHardeningTask = defineTask('issue-592.review-trigger-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review trigger hardening for reliability, security, and compatibility',
  labels: ['agent-runtime', 'triggers', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior runtime reviewer focused on compatibility and operational reliability',
      task: 'Review the implementation against issue #592, the capability spec, and verification evidence.',
      instructions: [
        'Review the working tree diff directly.',
        'Check for cron compatibility regressions, timezone ambiguity, and unsupported syntax that silently misfires.',
        'Check that event-source abstractions are provider-neutral and do not require unavailable credentials or services for local daemon startup.',
        'Check admission control for unbounded memory growth, unfair starvation, bad webhook status semantics, and missing queue metrics.',
        'Check deduplication for false suppression of legitimate events and missing audit logs.',
        'Check retry/DLQ behavior for durable-enough failure records, bounded retries, backoff metadata, and coordination with #585.',
        'Check security: webhook/event payload handling, secret redaction in logs/DLQ, request body limits, and denial-of-service surfaces.',
        'Check that agent-runtime and agent-platform daemon behavior cannot drift unnoticed.',
        'Return JSON: { approved, findings, blockingIssues, nonBlockingIssues, compatibilityRisks, securityRisks, missingTests, summary }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        verification: args.verification,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-592.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #592',
  labels: ['agent-runtime', 'triggers', 'acceptance', 'quality-gate'],
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'release owner for runtime trigger reliability',
      task: 'Decide whether issue #592 is complete and ready for delivery.',
      instructions: [
        'Use the issue context, capability spec, implementation summary, verification evidence, and review findings.',
        'Pass only if all accepted scope has tests, verification passed, review approved, and deferred items are explicitly documented as non-goals or follow-ups.',
        'Confirm the working tree contains no unrelated source changes staged for delivery.',
        'Confirm docs/agent-layer-gaps.md no longer claims gaps that were actually closed, and still names deferred gaps honestly.',
        'Confirm the PR body can link to #592 and mention coordination with #585 and #593.',
        'Return JSON: { passed, changedFiles, acceptanceCriteriaSatisfied, deferredFollowUps, deliverySummary, prBodyBullets, issueCommentBullets, residualRisks }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        verification: args.verification,
        review: args.review,
        attempts: args.attempts,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
