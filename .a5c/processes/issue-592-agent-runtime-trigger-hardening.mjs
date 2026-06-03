/**
 * @process repo/issue-592-agent-runtime-trigger-hardening
 * @description Plan and execute issue #592: harden daemon trigger scheduling, event sources, admission control, deduplication, and failed-trigger handling.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - .a5c/processes/issue-591-agent-runtime-observability.mjs
 * - .a5c/processes/issue-593-agent-runtime-background-process-lifecycle.mjs
 * - library/cradle/feature-request.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/README.md
 * - library/specializations/sdk-platform-development/sdk-architecture-design.js
 * - library/specializations/sdk-platform-development/sdk-testing-strategy.js
 * - library/specializations/qa-testing-automation/quality-gates.js
 * - library/specializations/devops-sre-platform/monitoring-setup.js
 * - library/specializations/security-compliance/security-logging-monitoring.js
 *
 * Note: the requested .a5c/process-library/ path was not present in this
 * checkout. Matching methodologies and specializations were researched under
 * the local repository process library root at library/.
 *
 * Repo policy note: this process intentionally uses agent tasks rather than
 * shell tasks to respect docs/agent-reference/process-authoring.md for direct
 * Babysitter workflows in this repository. Verification agents must run the
 * listed commands directly and report exact command, exit code, and output.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - agent-runtime already has a DurableTriggerQueue with retry, backoff,
 *   persisted trigger-queue.json records, dead-letter state, and loop status
 *   deadLetterRuns.
 * - agent-platform still carries a duplicated daemon implementation without the
 *   durable queue additions; the plan must include parity or centralization.
 * - Cron parsing is duplicated and remains a local-Date, five-field subset:
 *   numeric fields, ranges, commas, and steps. Named days/months, timezone
 *   semantics, L/# syntax, and macros are still absent.
 * - File watching is debounced per configured watcher but does not deduplicate
 *   the same changed file across overlapping rules.
 * - Webhooks validate method/path/bearer auth and body size but have no
 *   admission policy, token bucket, queue depth cap, or deferred/rejected
 *   response contract.
 * - packages/triggers-mux and packages/kradle/core have reusable trigger
 *   normalization/query and AgentTriggerRule concepts, but they are not a drop-
 *   in daemon event-source abstraction.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent security-reviewer specializations/security-compliance/agents/security-reviewer/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: "issue-592.read-issue-context",
  });

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueContext }, {
    key: "issue-592.reuse-audit",
  });

  const architectureTrace = await ctx.task(traceTriggerArchitectureTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: "issue-592.trace-trigger-architecture",
  });

  const capabilitySpec = await ctx.task(authorCapabilitySpecTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
  }, {
    key: "issue-592.capability-spec",
  });

  const regressionPlan = await ctx.task(authorRegressionCoverageTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    capabilitySpec,
  }, {
    key: "issue-592.regression-coverage",
  });

  const designReview = await ctx.task(reviewTriggerDesignTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    capabilitySpec,
    regressionPlan,
  }, {
    key: "issue-592.design-review",
  });

  if (designReview?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: "Issue #592 Trigger Semantics Need Maintainer Decision",
      question: designReview.question,
      options: ["Proceed with recommended trigger contract", "Pause for maintainer guidance"],
      expert: "owner",
      tags: ["approval-gate", "issue-592", "agent-runtime", "triggers"],
      context: { runId: ctx.runId, designReview },
    });
  }

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
      designReview,
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

    review = await ctx.task(reviewTriggerImplementationTask, {
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
    if (verification?.passed === true && review?.approved === true) break;
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    capabilitySpec,
    regressionPlan,
    designReview,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: "issue-592.final-acceptance",
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: "Issue #592 Final Acceptance Needs Maintainer Decision",
      question: finalGate.question,
      options: ["Proceed with documented follow-ups", "Pause for maintainer guidance"],
      expert: "owner",
      tags: ["approval-gate", "issue-592", "agent-runtime", "final-acceptance"],
      context: { runId: ctx.runId, finalGate, attempts: attempts.length },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      "issue-context",
      "reuse-audit",
      "trigger-architecture-trace",
      "capability-spec",
      "regression-coverage",
      "design-review",
      "incremental-implementation",
      "verification-loop",
      "security-compatibility-review",
      "final-acceptance",
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    reuseAudit,
    architectureTrace,
    capabilitySpec,
    regressionPlan,
    designReview,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask("issue-592.read-issue-context", (args, taskCtx) => ({
  kind: "agent",
  title: "Read issue #592 and related trigger context",
  labels: ["agent-runtime", "triggers", "research", "issue-context"],
  agent: {
    name: "platform-architect",
    prompt: {
      role: "senior Babysitter runtime maintainer",
      task: "Read the GitHub issue and produce the authoritative scope for issue #592.",
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        "Use the issue body, every comment, and labels as the source of truth.",
        "Inspect related issues #585 and #593 only enough to identify scope boundaries around durable queue/crash recovery and background process lifecycle.",
        "Inspect docs/agent-layer-gaps.md for trigger scheduling, event triggers, admission control, deduplication, and DLQ gaps.",
        "Return JSON: { title, labels, rawIssueSummary, commentsSummary, relatedIssues, acceptanceCriteria, explicitNonGoals, affectedFilesFromIssue, riskLevel, openQuestions }.",
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask("issue-592.reuse-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 reuse audit for daemon trigger infrastructure",
  labels: ["agent-runtime", "triggers", "reuse-audit", "phase:0"],
  agent: {
    name: "platform-architect",
    prompt: {
      role: "senior TypeScript monorepo architecture analyst",
      task: "Perform the repo-required Phase 0 reuse audit before proposing trigger infrastructure.",
      instructions: [
        "Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Extract keyword nouns and verbs from the issue: cron, timezone, named months, named days, L, #, @daily, @reboot, message queue, RabbitMQ, Kafka, SQS, git webhook, Slack, Discord, rate limiting, token bucket, backpressure, queue depth, deduplication, fingerprint, dead letter queue, retry, backoff, failure metrics.",
        "Scan for matching migrations, API routes, environment variables, SDK dependencies, package exports, and imports. Honor .a5c/reuse-audit.json if present.",
        "Inspect packages/agent-runtime/src/daemon first, then packages/tula/platform/src/daemon, packages/triggers-mux, packages/kradle/core trigger controllers, observability queue diagnostics, and docs/agent-layer-gaps.md.",
        "Call out existing infrastructure to reuse, especially DurableTriggerQueue, daemon status/diagnostics, triggers-mux normalization/query helpers, and kradle AgentTriggerRule ideas.",
        "Call out no-match areas where new implementation is still required.",
        "Do not edit files.",
        "Return JSON: { renderedFindings, keywords, existingInfrastructure, reusableModules, dependencyFindings, envVars, endpointFindings, gapsStillOpen, noMatchNotes, parityRisks, risksForNewInfrastructure }.",
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

export const traceTriggerArchitectureTask = defineTask("issue-592.trace-trigger-architecture", (args, taskCtx) => ({
  kind: "agent",
  title: "Trace daemon trigger architecture and duplicate implementations",
  labels: ["agent-runtime", "agent-platform", "triggers", "architecture-trace"],
  agent: {
    name: "platform-architect",
    prompt: {
      role: "senior TypeScript runtime engineer",
      task: "Map current trigger scheduling, queueing, dispatch, and parity surfaces before implementation changes.",
      instructions: [
        "Work from the issue context and reuse-audit JSON below.",
        "Inspect these likely files first, then follow imports/callers as needed:",
        JSON.stringify(args.inputs.targetFiles, null, 2),
        "Trace config validation for file, webhook, timer, and automation rules, including package type sources from @a5c-ai/agent-comm-mux.",
        "Trace timer parsing and scheduling behavior in both agent-runtime and agent-platform, including local Date usage and test coverage.",
        "Trace file watcher matching/debounce behavior and identify how overlapping rules produce duplicate events.",
        "Trace webhook listener response semantics, auth/body limits, queue handoff, and places where rate limit/backpressure responses could be returned.",
        "Trace runDaemonLoop memory queue and DurableTriggerQueue behavior, including retry, backoff, dead-letter, status, and crash-replay boundaries from #585.",
        "Trace duplicated agent-platform daemon code and recommend centralization or parity-update sequencing.",
        "Trace packages/triggers-mux and packages/kradle/core trigger code only enough to reuse concepts without coupling daemon internals to unrelated packages.",
        "Return JSON: { currentState, runtimeCallPaths, platformCallPaths, reusableContracts, likelyFiles, testFiles, missingSurfaces, compatibilityRisks, securityRisks, proposedImplementationSlices, outOfScope }.",
      ],
      context: {
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

export const authorCapabilitySpecTask = defineTask("issue-592.capability-spec", (args, taskCtx) => ({
  kind: "agent",
  title: "Author staged daemon trigger capability spec",
  labels: ["agent-runtime", "triggers", "design", "spec"],
  agent: {
    name: "platform-architect",
    prompt: {
      role: "principal runtime architect",
      task: "Define the accepted trigger-hardening contract for issue #592 before code changes.",
      instructions: [
        "Do not edit files in this task.",
        "Design implementation as staged slices so existing file/webhook/timer behavior remains compatible.",
        "Cron slice: define supported names/macros/timezone behavior, explicit rejects for unsupported L/#/@reboot if not implemented, timezone test strategy, and DST expectations.",
        "Event-source slice: define an extensible event-source interface for queue/git/chat integrations, but keep actual RabbitMQ/Kafka/SQS/Slack/Discord clients optional unless existing dependencies already support them.",
        "Admission-control slice: define queue depth, token bucket or sliding-window rate limits, accepted/deferred/rejected webhook responses, logging, metrics, and config shape.",
        "Deduplication slice: define fingerprint inputs for file, webhook, timer, and external events; include TTL/window behavior and log every suppression.",
        "Retry/DLQ slice: extend or reuse DurableTriggerQueue; do not create a second persistence model. Coordinate explicitly with #585 crash recovery.",
        "Parity slice: choose centralization or synchronized updates/tests for agent-runtime and agent-platform duplicate daemon code.",
        "Call out any decision that truly requires maintainer input. Keep breakpoints sparse.",
        "Return JSON: { capabilitySpec, configModel, publicApiChanges, implementationSlices, compatibilityPlan, metricsAndLogs, blockingDecisions, testMatrix, nonGoals }.",
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

export const authorRegressionCoverageTask = defineTask("issue-592.regression-coverage", (args, taskCtx) => ({
  kind: "agent",
  title: "Author trigger-hardening regression coverage",
  labels: ["agent-runtime", "agent-platform", "triggers", "tdd", "phase:red"],
  agent: {
    name: "test-strategy-architect",
    prompt: {
      role: "senior TypeScript test engineer",
      task: "Add focused failing regression tests for issue #592 before production implementation.",
      instructions: [
        "Follow TDD: add tests before changing production implementation.",
        "Prefer deterministic unit tests with fake timers, temporary directories, mocked trigger callbacks, and local HTTP requests; do not require live RabbitMQ, Kafka, SQS, Slack, Discord, Docker, Kubernetes, or external network services.",
        "Test cron names, macros, timezone behavior, and explicit unsupported syntax errors according to the capability spec.",
        "Test file deduplication for overlapping file rules and verify legitimate distinct rules still fire.",
        "Test webhook admission control responses for accepted, rate-limited, queue-full, and deferred cases.",
        "Test trigger fingerprinting and TTL/window behavior for file/webhook/timer automation events.",
        "Test DurableTriggerQueue reuse for retry metadata, backoff, dead-letter state, status counts, and safe redaction of payload details.",
        "Test agent-runtime and agent-platform parity, or tests proving both packages import the same shared implementation if centralization is chosen.",
        "Run the narrow tests and confirm they fail for expected missing behavior before implementation.",
        "Return JSON: { testFiles, testNames, redVerified, redCommands, failureMatchesIssue, outputSummary, coverageByGap, parityCoverage }.",
      ],
      context: {
        issueContext: args.issueContext,
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

export const reviewTriggerDesignTask = defineTask("issue-592.design-review", (args, taskCtx) => ({
  kind: "agent",
  title: "Review trigger-hardening design before implementation",
  labels: ["agent-runtime", "triggers", "design-review"],
  agent: {
    name: "compatibility-auditor",
    prompt: {
      role: "senior compatibility and security reviewer",
      task: "Review the trigger capability spec and regression plan before implementation begins.",
      instructions: [
        "Do not edit files.",
        "Check for unapproved scope expansion into #585 crash recovery or #593 background process lifecycle.",
        "Check whether the plan reuses DurableTriggerQueue instead of inventing competing persistence.",
        "Check cron compatibility for existing numeric expressions and deterministic timezone semantics.",
        "Check webhook admission behavior for API compatibility and denial-of-service risk.",
        "Check deduplication for false positives that would suppress legitimate triggers.",
        "Check DLQ records and logs for secret/payload leakage.",
        "Check agent-runtime and agent-platform parity strategy.",
        "Return JSON: { approved, needsMaintainerDecision, question, blockingFindings, nonBlockingFindings, requiredSpecChanges, securityConcerns, compatibilityConcerns }.",
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementTriggerHardeningTask = defineTask("issue-592.implement-trigger-hardening", (args, taskCtx) => ({
  kind: "agent",
  title: "Implement daemon trigger hardening slices",
  labels: ["agent-runtime", "agent-platform", "triggers", "implementation"],
  agent: {
    name: "agent-runtime-trigger-implementer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "senior TypeScript runtime maintainer",
      task: "Implement issue #592 according to the approved capability spec and regression coverage.",
      instructions: [
        "Edit the repository directly.",
        "Preserve unrelated worktree changes.",
        "Keep changes scoped to the approved trigger-hardening slices and target files unless traced call paths require more.",
        "Use existing daemon style, TypeScript conventions, ApiResult patterns, and Vitest patterns.",
        "Implement cron behavior with compatibility for existing numeric expressions and deterministic tests for timezone/named/macro behavior.",
        "Implement event-source abstraction only to the accepted level; avoid adding external broker/chat dependencies unless explicitly approved.",
        "Implement admission control with bounded queue behavior, rate-limit/backpressure responses, logs, metrics/status hooks, and config validation.",
        "Implement deduplication with explicit fingerprints and observability of suppression decisions.",
        "Reuse or extend DurableTriggerQueue for retry and DLQ; do not create a second durable trigger store.",
        "Close parity between agent-runtime and agent-platform by centralizing or updating both with parity tests.",
        "Update docs/agent-layer-gaps.md and package README claims only for gaps actually closed.",
        "Return JSON: { changedFiles, summary, implementedSlices, testsUpdated, compatibilityNotes, securityNotes, remainingFollowUps, risks }.",
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
        designReview: args.designReview,
        previousVerification: args.previousVerification,
        previousReview: args.previousReview,
        attempt: args.attempt,
      },
    },
    timeout: 300000,
    maxTurns: 10,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask("issue-592.verification-gate", (args, taskCtx) => ({
  kind: "agent",
  title: "Run trigger-hardening verification gates",
  labels: ["agent-runtime", "agent-platform", "triggers", "verification"],
  agent: {
    name: "verification-runner",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "deterministic quality gate runner",
      task: "Run the required verification commands and summarize exact results.",
      instructions: [
        "Run each command listed in inputs.verificationCommands.",
        "Also run git diff --check.",
        "For each command, report command, exit code, pass/fail, and concise output summary.",
        "If a command fails, determine whether it is caused by the current implementation or a pre-existing unrelated failure using focused reruns or git diff inspection.",
        "Do not hide failures. Do not mark passed unless all required gates pass or unrelated pre-existing failures are documented with evidence.",
        "Return JSON: { passed, commands, failingCommands, unrelatedFailures, outputSummary, rerunRecommendations }.",
      ],
      context: {
        verificationCommands: args.inputs.verificationCommands,
        issueContext: args.issueContext,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        attempt: args.attempt,
      },
    },
    timeout: 300000,
    maxTurns: 6,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewTriggerImplementationTask = defineTask("issue-592.implementation-review", (args, taskCtx) => ({
  kind: "agent",
  title: "Review trigger-hardening implementation",
  labels: ["agent-runtime", "agent-platform", "triggers", "review"],
  agent: {
    name: "trigger-hardening-reviewer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "senior code reviewer for runtime trigger systems",
      task: "Review the implementation diff for blocking issues, regressions, and missing coverage.",
      instructions: [
        "Use code-review stance: findings first, ordered by severity, with file and line references.",
        "Verify every issue gap is either implemented, explicitly rejected by the capability spec, or documented as a follow-up.",
        "Check existing cron/file/webhook/timer behavior for backward compatibility.",
        "Check rate limiting and queue caps for deterministic behavior under concurrent trigger storms.",
        "Check dedup fingerprints and TTL/window handling for false suppression and cross-rule correctness.",
        "Check DurableTriggerQueue and DLQ records for retry correctness, persistence consistency, crash-replay interactions, and secret redaction.",
        "Check agent-runtime and agent-platform parity.",
        "Check tests actually fail without the implementation and cover the relevant behavior.",
        "Return JSON: { approved, findings, blockingFindings, missingTests, compatibilityRisks, securityRisks, docsRisks, recommendedFixes }.",
      ],
      context: {
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
    timeout: 300000,
    maxTurns: 8,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask("issue-592.final-acceptance", (args, taskCtx) => ({
  kind: "agent",
  title: "Final acceptance gate for issue #592",
  labels: ["agent-runtime", "triggers", "final-gate"],
  agent: {
    name: "spec-guard",
    prompt: {
      role: "release readiness reviewer",
      task: "Decide whether issue #592 is ready to deliver.",
      instructions: [
        "Compare issue #592 requirements directly against implementation, verification, and review artifacts.",
        "Confirm Phase 0 reuse-audit findings were rendered before new infrastructure recommendations.",
        "Confirm regression coverage exists for cron, event-source abstraction, admission control, deduplication, retry/DLQ, and daemon parity.",
        "Confirm required verification passed or document exact unrelated pre-existing failures.",
        "Confirm source changes stayed scoped and did not absorb #585 or #593 without approval.",
        "Confirm docs only claim gaps actually closed.",
        "Return JSON: { passed, needsHumanDecision, question, changedFiles, acceptanceChecklist, verificationSummary, reviewSummary, followUps, releaseNoteCandidate }.",
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architectureTrace: args.architectureTrace,
        capabilitySpec: args.capabilitySpec,
        regressionPlan: args.regressionPlan,
        designReview: args.designReview,
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
