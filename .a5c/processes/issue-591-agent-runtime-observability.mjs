/**
 * @process repo/issue-591-agent-runtime-observability
 * @description Plan and execute issue #591: close agent-runtime observability gaps for structured logging, metrics/diagnostics export, health percentiles, and distributed tracing.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - library/cradle/feature-request.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/deterministic-quality-gate.js
 * - library/specializations/sdk-platform-development/observability-integration.js
 * - library/specializations/sdk-platform-development/logging-diagnostics.js
 * - library/specializations/sdk-platform-development/telemetry-analytics-integration.js
 * - library/specializations/sdk-platform-development/sdk-testing-strategy.js
 * - library/specializations/devops-sre-platform/monitoring-setup.js
 * - library/specializations/qa-testing-automation/quality-gates.js
 * - library/specializations/collaboration/github/issue-linking.js
 *
 * Note: the requested .a5c/process-library/ path was not present in this checkout.
 * Matching methodologies and specializations were researched under the local
 * repository process library root at library/.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent telemetry-privacy-auditor specializations/sdk-platform-development/agents/telemetry-privacy-auditor/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-591.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-591.reuse-audit',
  });

  const architectureTrace = await ctx.task(traceRuntimeObservabilityTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-591.trace-runtime-observability',
  });

  const designPlan = await ctx.task(authorObservabilityDesignTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
  }, {
    key: 'issue-591.author-observability-design',
  });

  const regressionPlan = await ctx.task(authorRegressionCoverageTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    designPlan,
  }, {
    key: 'issue-591.author-regression-coverage',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementObservabilityHardeningTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      designPlan,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-591.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      architectureTrace,
      designPlan,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-591.verification.${attempt}`,
    });

    review = await ctx.task(reviewObservabilityImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      designPlan,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-591.review.${attempt}`,
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
    designPlan,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-591.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #591 Observability Semantics Need Decision',
      question: finalGate.question,
      options: ['Proceed with recommended observability defaults', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-591', 'agent-runtime', 'observability'],
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
      'runtime-observability-trace',
      'observability-design',
      'regression-coverage',
      'incremental-implementation',
      'verification-loop',
      'sre-security-compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    reuseAudit,
    architectureTrace,
    designPlan,
    regressionPlan,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-591.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #591 and related observability context',
  labels: ['agent-runtime', 'observability', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter runtime maintainer',
      task: 'Read the GitHub issue and produce the authoritative scope for issue #591.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, every comment, and labels as the source of truth.',
        'Inspect related issues mentioned in comments, especially #578 and #599, only enough to identify scope boundaries and integration points.',
        'Preserve concrete dates and issue references from comments when they affect sequencing.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, relatedIssues, acceptanceCriteria, nonGoals, severity, riskLevel, targetFilesFromIssue, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-591.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for observability infrastructure',
  labels: ['agent-runtime', 'observability', 'reuse-audit', 'phase:0'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior monorepo architecture analyst',
      task: 'Perform the repo-required Phase 0 reuse audit before proposing new observability infrastructure.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the issue: structured logging, log levels, filtering, rotation, sampling, health snapshots, percentiles, Prometheus, CloudWatch, webhook alerts, diagnostics API, health endpoint, metrics endpoint, config endpoint, queue endpoint, OTLP, W3C trace context, traceparent, correlation IDs, InMemoryTelemetryProvider.',
        'Scan the current repo for matching migrations, API routes, environment variables, SDK dependencies, package exports, and imports. Honor .a5c/reuse-audit.json if present.',
        'Inspect packages/agent-runtime first, then follow imports to agent-platform, transport-mux, agent-mux observability, SDK journal/cost code, and docs/agent-layer-gaps.md.',
        'Call out existing infrastructure to reuse and areas where no matching existing infrastructure was found.',
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

export const traceRuntimeObservabilityTask = defineTask('issue-591.trace-runtime-observability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace agent-runtime observability call paths',
  labels: ['agent-runtime', 'observability', 'runtime-trace'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Map the current agent-runtime observability surfaces before implementation changes.',
      instructions: [
        'Work from the issue context and reuse-audit JSON below.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Inspect these likely files first, then follow imports/callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Trace daemon logging from lifecycle/loop/webhook/timer/file-watcher code into daemonLog.ts, including current JSONL contract and consumers.',
        'Trace health snapshot computation and all existing observability exports from observability/types.ts, health.ts, runStatus.ts, timeline.ts, and webhooks.ts.',
        'Trace daemon loop status and queue state from daemon/loop.ts and daemon/types.ts to identify the safest diagnostics API boundary.',
        'Trace telemetry provider types, span creation, in-memory drain/flush behavior, span tree/audit-log helpers, package exports, and test coverage.',
        'Trace package boundaries relevant to distributed tracing, especially transport-mux and issue #599 integration points, without implementing #599 itself.',
        'Return JSON: { currentState, runtimeCallPaths, publicApiContracts, likelyFiles, testFiles, missingSurfaces, compatibilityRisks, securityRisks, proposedImplementationSlices, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorObservabilityDesignTask = defineTask('issue-591.author-observability-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design incremental observability hardening',
  labels: ['agent-runtime', 'observability', 'design'],
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'SRE-minded telemetry and SDK API designer',
      task: 'Design the issue #591 implementation in small, testable slices.',
      instructions: [
        'Use the issue, reuse audit, and trace JSON as the source of truth.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Design must preserve daemon JSONL backward compatibility: do not remove existing timestamp, event, or data fields.',
        'Structured logging design must add compatible levels, filtering, rotation, optional sampling, schema/version fields, and tests for old plus new entries.',
        'Health design must add P50/P95/P99 effect latency metrics while preserving avgEffectLatencyMs.',
        'Metrics/diagnostics design must expose safe local diagnostics for /health, /metrics, /config, and /queue with secret redaction and no external service requirement by default.',
        'Prometheus output should be a deterministic text-format endpoint or renderer; CloudWatch/remote exports should be optional extension points unless a lightweight existing dependency already supports them.',
        'Tracing design must add W3C traceparent parse/serialize helpers, correlation ID propagation primitives, optional exporter support, and default no-op/in-memory behavior that cannot break daemon startup.',
        'Do not broaden into queue persistence, crash recovery, cost tracking implementation for #578, or the transport-mux session-aware proxy implementation for #599.',
        'Return JSON: { implementationSlices, newOrChangedPublicTypes, configDefaults, redactionPolicy, exporterPolicy, tracingPropagationPolicy, compatibilityPlan, migrationPlan, testPlan, rolloutRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionCoverageTask = defineTask('issue-591.author-regression-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing observability regression coverage',
  labels: ['agent-runtime', 'observability', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #591 before implementation changes.',
      instructions: [
        'You own test files only in this task. Do not modify implementation files.',
        'Use the issue context, reuse audit, architecture trace, and design JSON as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.designPlan, null, 2),
        'Add focused tests for daemon log level filtering, compatible JSONL parsing, rotation threshold behavior, and deterministic sampling behavior if sampling is included.',
        'Add health tests proving avg plus p50/p95/p99 behavior for ordered, unordered, empty, and single-latency event sets.',
        'Add diagnostics/metrics tests proving local /health, /metrics, /config, and /queue behavior, Prometheus text output, and secret redaction.',
        'Add telemetry tests proving traceparent parse/serialize, invalid traceparent rejection, child trace inheritance from propagated context, correlation ID attachment, exporter flush/drain behavior, and no-op default safety.',
        'Keep tests model-free, network-free by default, and bounded. Prefer pure renderers and injected transports over opening real ports unless the implementation explicitly owns an HTTP listener.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, fixtureData, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementObservabilityHardeningTask = defineTask('issue-591.implement-observability-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement observability hardening attempt ${args.attempt}`,
  labels: ['agent-runtime', 'observability', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement the issue #591 observability hardening slices.',
      instructions: [
        'You own agent-runtime observability/logging/telemetry code and focused tests required by the issue. Keep edits scoped.',
        'Do not weaken or delete regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.designPlan, null, 2),
        'Regression coverage JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implementation order:',
        '1. Add compatible structured daemon logging policy: levels, filters, rotation, optional sampling, and schema/version metadata while preserving timestamp/event/data.',
        '2. Extend health metrics with p50/p95/p99 effect latency fields and deterministic percentile calculation.',
        '3. Add diagnostics and Prometheus metrics surfaces with local-safe defaults, secret redaction, and injectable HTTP/export plumbing.',
        '4. Add W3C trace context helpers, correlation ID propagation primitives, and optional telemetry exporters while preserving in-memory/no-op defaults.',
        '5. Export only stable public APIs from package index files and update README/docs only where necessary for discoverability.',
        'Avoid introducing mandatory external telemetry dependencies unless the reuse audit proves they already exist and are appropriate.',
        'Return JSON: { changedFiles, summary, loggingSemantics, healthMetricSemantics, diagnosticsSemantics, tracingSemantics, configSemantics, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-591.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run agent-runtime observability verification attempt ${args.attempt}`,
  labels: ['agent-runtime', 'observability', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior runtime verification engineer',
      task: 'Run targeted and full verification gates for issue #591.',
      instructions: [
        'Use the issue context, trace, design, tests, and implementation summaries below.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.designPlan, null, 2),
        'Regression coverage JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Run the verification commands listed in inputs unless implementation changed the relevant command set. Capture exact commands, pass/fail status, and failure excerpts.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Verify regression tests either fail against pre-fix behavior or are clearly documented as newly encoding previously absent behavior.',
        'Verify no generated dist output, lockfile churn, or unrelated files were modified unless the repo explicitly requires it.',
        'Return JSON: { passed, commands, failures, preExistingFailures, changedFiles, coverageNotes, performanceNotes, nextFixInstructions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewObservabilityImplementationTask = defineTask('issue-591.review-observability-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review observability implementation attempt ${args.attempt}`,
  labels: ['agent-runtime', 'observability', 'review', 'security', 'compatibility'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'SRE and SDK compatibility reviewer',
      task: 'Review the issue #591 implementation for production risks and contract drift.',
      instructions: [
        'Prioritize bugs, behavioral regressions, missing tests, security leaks, and compatibility risks. Findings must include file and line references.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.designPlan, null, 2),
        'Regression coverage JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Review daemon JSONL compatibility, log rotation/filter/sampling semantics, diagnostics endpoint redaction, metrics cardinality, exporter startup failure behavior, traceparent standards compliance, and public package exports.',
        'Check that defaults remain safe: no required external telemetry services, no network listener unless explicitly enabled, local-only binding or injectable server, and no secrets in /config or logs.',
        'Check coordination boundaries with #578 and #599 are documented without implementing those adjacent issues.',
        'Return JSON: { approved, findings, missingTests, securityRisks, compatibilityRisks, performanceRisks, docsRisks, requiredChanges, changedFiles }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-591.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #591',
  labels: ['agent-runtime', 'observability', 'final-gate', 'quality-gate'],
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'release-minded runtime observability reviewer',
      task: 'Decide whether the issue #591 run is complete and ready for PR.',
      instructions: [
        'Use the full run context below.',
        'Inputs JSON:',
        JSON.stringify(args.inputs, null, 2),
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.designPlan, null, 2),
        'Regression coverage JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Review JSON:',
        JSON.stringify(args.review, null, 2),
        'Attempts JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Pass only if structured logging, health percentiles, metrics/diagnostics export, and trace propagation/export acceptance items are satisfied, verification passed, review approved, and defaults are safe.',
        'If a maintainer decision is required, set needsHumanDecision true with a concise question and recommended option. Otherwise set it false.',
        'Return JSON: { passed, needsHumanDecision, question, acceptanceResults, changedFiles, verificationSummary, reviewSummary, releaseNotesCandidate, followUps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
