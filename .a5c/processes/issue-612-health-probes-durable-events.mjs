/**
 * @process repo/issue-612-health-probes-durable-events
 * @description Implementation process for issue #612: real Krate health probes and durable broker-backed event streaming.
 * @inputs { issueNumber: number, title: string, issueUrl: string, issueBody: string, labels: string[], issueCommentsSummary: string, targetFiles: string[], verificationCommands: string[], relatedIssues: number[], relatedPullRequests: number[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], reuseAudit: object, architecture: object, verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/core/src/agent-adapter-controller.js
 * - packages/krate/core/src/agent-stack-controller.js
 * - packages/krate/web/app/api/orgs/[org]/snapshot/route.js
 * - packages/krate/core/src/event-bus.js
 * - packages/krate/core/src/http-server.js
 * - packages/krate/web/app/api/orgs/[org]/agents/events/stream/route.js
 * - packages/krate/charts/values.yaml
 * - packages/krate/charts/templates/deployments.yaml
 * - packages/krate/docs/gaps/staging-status.md
 * - packages/krate/docs/gaps/infrastructure-deps.md
 *
 * Process-library references used:
 * - methodologies/atdd-tdd/atdd-tdd.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - methodologies/automaker/automaker-review-ship.js
 * - specializations/devops-sre-platform/monitoring-setup.js
 * - specializations/devops-sre-platform/iac-testing.js
 * - specializations/network-programming/health-check-system.js
 * - specializations/network-programming/realtime-messaging-system.js
 * - specializations/web-development/server-sent-events.js
 * - specializations/web-development/api-integration-testing.js
 * - specializations/web-development/secrets-management.js
 * - cradle/feature-implementation-contribute.js
 *
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/automaker/automaker-review-ship
 * @process specializations/devops-sre-platform/monitoring-setup
 * @process specializations/devops-sre-platform/iac-testing
 * @process specializations/network-programming/health-check-system
 * @process specializations/network-programming/realtime-messaging-system
 * @process specializations/web-development/server-sent-events
 * @process specializations/web-development/api-integration-testing
 * @process specializations/web-development/secrets-management
 * @process cradle/feature-implementation-contribute
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_REFINEMENTS = 2;

function specBlock(args) {
  return [
    'ISSUE SPEC (runtime input, verbatim):',
    '---',
    args.issueBody || '',
    '---',
    '',
    'ISSUE COMMENTS / PRIOR WORK SUMMARY:',
    '---',
    args.issueCommentsSummary || '',
    '---',
  ].join('\n');
}

function commonContext(args) {
  return {
    issueNumber: args.issueNumber,
    title: args.title,
    issueUrl: args.issueUrl,
    labels: args.labels,
    targetFiles: args.targetFiles,
    relatedIssues: args.relatedIssues,
    relatedPullRequests: args.relatedPullRequests,
  };
}

export async function process(inputs, ctx) {
  const shared = {
    issueNumber: inputs?.issueNumber ?? 612,
    title: inputs?.title ?? 'Implement real health probes and durable event streaming',
    issueUrl: inputs?.issueUrl ?? 'https://github.com/a5c-ai/babysitter/issues/612',
    issueBody: inputs?.issueBody ?? '',
    issueCommentsSummary: inputs?.issueCommentsSummary ?? '',
    labels: inputs?.labels ?? [],
    targetFiles: inputs?.targetFiles ?? [],
    verificationCommands: inputs?.verificationCommands ?? [],
    relatedIssues: inputs?.relatedIssues ?? [608],
    relatedPullRequests: inputs?.relatedPullRequests ?? [694, 702],
    acceptanceCriteria: inputs?.acceptanceCriteria ?? [],
    nonGoals: inputs?.nonGoals ?? [],
    preferredBroker: inputs?.preferredBroker ?? 'nats-jetstream',
    maxRefinements: inputs?.maxRefinements ?? MAX_REFINEMENTS,
  };

  const issueContext = await ctx.task(readIssueContextTask, shared, {
    key: 'issue-612.issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    ...shared,
    issueContext,
  }, {
    key: 'issue-612.reuse-audit',
  });

  const processResearch = await ctx.task(processLibraryResearchTask, {
    ...shared,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-612.process-library-research',
  });

  const runtimeTrace = await ctx.task(runtimeTraceTask, {
    ...shared,
    issueContext,
    reuseAudit,
    processResearch,
  }, {
    key: 'issue-612.runtime-trace',
  });

  const executionMode = await ctx.task(resolveExecutionModeTask, {
    ...shared,
    issueContext,
    reuseAudit,
    processResearch,
    runtimeTrace,
  }, {
    key: 'issue-612.execution-mode',
  });

  const architecture = await ctx.task(architectureTask, {
    ...shared,
    issueContext,
    reuseAudit,
    processResearch,
    runtimeTrace,
    executionMode,
  }, {
    key: 'issue-612.architecture',
  });

  const tests = await ctx.task(contractTestsTask, {
    ...shared,
    issueContext,
    reuseAudit,
    runtimeTrace,
    executionMode,
    architecture,
  }, {
    key: 'issue-612.contract-tests',
  });

  let implementation = await ctx.task(implementationTask, {
    ...shared,
    issueContext,
    reuseAudit,
    runtimeTrace,
    executionMode,
    architecture,
    tests,
  }, {
    key: 'issue-612.implementation.initial',
  });

  let verification = await ctx.task(verificationTask, {
    ...shared,
    implementation,
    tests,
    architecture,
  }, {
    key: 'issue-612.verification.initial',
  });

  let review = await ctx.task(reviewTask, {
    ...shared,
    issueContext,
    reuseAudit,
    runtimeTrace,
    architecture,
    tests,
    implementation,
    verification,
  }, {
    key: 'issue-612.review.initial',
  });

  const refinements = [];
  for (let attempt = 1; attempt <= shared.maxRefinements; attempt++) {
    if (verification?.passed === true && review?.approved === true) break;

    const refinement = await ctx.task(refinementTask, {
      ...shared,
      attempt,
      issueContext,
      reuseAudit,
      runtimeTrace,
      executionMode,
      architecture,
      tests,
      implementation,
      verification,
      review,
    }, {
      key: `issue-612.refinement.${attempt}`,
    });
    refinements.push(refinement);

    implementation = {
      ...(implementation || {}),
      ...(refinement || {}),
      refinementAttempts: refinements,
    };

    verification = await ctx.task(verificationTask, {
      ...shared,
      implementation,
      tests,
      architecture,
      attempt,
    }, {
      key: `issue-612.verification.${attempt}`,
    });

    review = await ctx.task(reviewTask, {
      ...shared,
      issueContext,
      reuseAudit,
      runtimeTrace,
      executionMode,
      architecture,
      tests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-612.review.${attempt}`,
    });
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    ...shared,
    issueContext,
    reuseAudit,
    processResearch,
    runtimeTrace,
    executionMode,
    architecture,
    tests,
    implementation,
    verification,
    review,
    refinements,
  }, {
    key: 'issue-612.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #612 Final Acceptance Needs Maintainer Decision',
      question: finalGate.question ?? 'Final acceptance found a broker, secret-validation, or deployment semantics decision that needs maintainer input.',
      options: ['Proceed with recommended final shape', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['issue-612', 'approval-gate', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        finalGate,
        relatedPullRequests: shared.relatedPullRequests,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'phase-0-reuse-audit',
      'process-library-research',
      'runtime-trace',
      'prior-implementation-execution-mode',
      'architecture',
      'contract-tests',
      'implementation',
      'verification',
      'review',
      'refinement',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? review?.changedFiles ?? implementation?.changedFiles ?? [],
    reuseAudit,
    processResearch,
    runtimeTrace,
    executionMode,
    architecture,
    tests,
    implementation,
    verification,
    review,
    refinements,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-612.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #612, comments, labels, and prior PRs',
  labels: ['issue-612', 'krate', 'research'],
  agent: {
    name: 'krate-planning-architect',
    prompt: {
      role: 'senior Krate platform architect',
      task: 'Read the issue, comments, labels, and related PR state before any implementation work.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm #${args.issueNumber} is not a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Inspect related PRs from inputs only enough to identify prior plan or implementation work and whether it is merged, closed, or still pending.',
        'Treat the issue body and comments as source of truth, but verify against the current branch before coding.',
        'If a prior implementation is already merged into the current branch, hand that evidence to the execution-mode phase so the run can switch to acceptance verification and documentation cleanup rather than reimplementing.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, priorWork, acceptanceCriteria, nonGoals, dependencies, currentStatus, openQuestions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['issueSummary', 'acceptanceCriteria', 'priorWork', 'currentStatus'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-612.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0: Reuse-audit findings',
  labels: ['issue-612', 'reuse-audit', 'krate'],
  agent: {
    name: 'krate-reuse-auditor',
    prompt: {
      role: 'senior Krate maintenance engineer',
      task: 'Run the repo-specific reuse audit before drafting new infrastructure or implementation changes.',
      instructions: [
        specBlock(args),
        '',
        'Extract keyword nouns and verbs: health probe, Gitea, Agent Mux, controller, kubectl cluster-info, Anthropic key, event bus, SSE, durable event streaming, NATS, JetStream, replay, backpressure.',
        'Start the response with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Scan current Krate health routes/controllers, event bus/SSE code, Helm values/templates, tests, docs, SDK exports, env names, and existing NATS/dependency configuration.',
        'Include any prior work from related PRs only as context; verify whether it exists in the working tree.',
        'Do not modify files in this phase.',
        'Return JSON: { findingsMarkdown, matchingInfrastructure, missingInfrastructure, envVars, runtimeCallPaths, targetFiles, testFiles, docsFiles, priorWorkStatus, noCodeChanges }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['findingsMarkdown', 'matchingInfrastructure', 'missingInfrastructure', 'runtimeCallPaths', 'targetFiles'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const processLibraryResearchTask = defineTask('issue-612.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process-library methodologies',
  labels: ['issue-612', 'process-library', 'planning'],
  agent: {
    name: 'process-methodology-researcher',
    prompt: {
      role: 'process-library researcher',
      task: 'Select the process-library methodologies and specializations that should guide implementation.',
      instructions: [
        'Research the local process library paths listed in this process header and any directly adjacent README files.',
        'Prefer ATDD/TDD for acceptance and contract tests, network-programming health/realtime messaging plus web-development/server-sent-events for probe and SSE semantics, web-development/api-integration-testing for route contract coverage, web-development/secrets-management for assistant key handling, devops-sre-platform IaC testing for Helm/env wiring, and verification-before-completion for final gates.',
        'Do not modify source files.',
        'Return JSON: { selectedReferences, rationale, patternsToApply, patternsToAvoid, noCodeChanges }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['selectedReferences', 'rationale', 'patternsToApply'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runtimeTraceTask = defineTask('issue-612.runtime-trace', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace health and event streaming runtime paths',
  labels: ['issue-612', 'architecture', 'runtime-trace'],
  agent: {
    name: 'krate-runtime-tracer',
    prompt: {
      role: 'senior Krate runtime engineer',
      task: 'Trace the exact current runtime paths for health status and agent event streaming before implementation.',
      instructions: [
        specBlock(args),
        '',
        'Use the reuse audit below as context:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        '',
        'Trace health from web health/snapshot components/routes through controller/resource helpers and environment variables.',
        'Trace resource-change events from API controller emitters through globalEventBus into core HTTP SSE and Next.js SSE routes.',
        'Trace Helm/env wiring for KRATE_GITEA_HTTP_URL, AGENT_MUX_URL, AGENT_GATEWAY_URL, KRATE_CONTROLLER_URL, ANTHROPIC_API_KEY, KRATE_ASSISTANT_API_KEY, and optional NATS values.',
        'Identify compatibility contracts that must be preserved for existing tests and SDK consumers.',
        'Do not modify files in this phase.',
        'Return JSON: { healthCallPaths, eventCallPaths, helmEnvPaths, existingTests, compatibilityContracts, implementationFiles, riskPoints, noCodeChanges }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['healthCallPaths', 'eventCallPaths', 'helmEnvPaths', 'compatibilityContracts', 'implementationFiles'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const resolveExecutionModeTask = defineTask('issue-612.resolve-execution-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resolve whether to implement or verify prior work',
  labels: ['issue-612', 'prior-work', 'quality-gate'],
  agent: {
    name: 'krate-release-triager',
    prompt: {
      role: 'senior Krate release triager',
      task: 'Determine whether this run should implement #612 from scratch or verify/finish prior work already present on the current branch.',
      instructions: [
        specBlock(args),
        '',
        'Use the issue context, reuse audit, process-library research, runtime trace, and related PRs to classify the current branch.',
        'Inspect current files and tests for evidence from prior implementation PRs, especially #702: shared health probes, memory plus NATS/JetStream event transport, SSE replay, Helm env wiring, SDK exports, docs, and contract tests.',
        'Return mode "implement" when required #612 behavior is absent or incomplete.',
        'Return mode "acceptance-only" when the implementation is already present and the remaining work is verification, docs consistency, or small plan-safe cleanup.',
        'Do not modify files in this phase.',
        'Return JSON: { mode, evidence, missingItems, verificationFocus, documentationFocus, implementationAllowed, noCodeChanges }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['mode', 'evidence', 'missingItems', 'verificationFocus', 'implementationAllowed'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const architectureTask = defineTask('issue-612.architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design health probe service and durable event transport',
  labels: ['issue-612', 'architecture', 'design'],
  agent: {
    name: 'krate-platform-architect',
    prompt: {
      role: 'senior production platform architect',
      task: 'Design a focused implementation for real health probes and durable event streaming.',
      instructions: [
        specBlock(args),
        '',
        'RUNTIME TRACE:',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        '',
        'EXECUTION MODE:',
        JSON.stringify(args.executionMode ?? {}, null, 2),
        '',
        'Design a shared health probe module/service used by web health/snapshot paths and, where appropriate, controller health/status surfaces.',
        'Health probes must run concurrently with bounded timeouts and return partial structured results for Gitea /api/v1/version, Agent Mux /healthz, Krate Controller /healthz, Kubernetes connectivity, and assistant credentials.',
        'Use safe assistant credential validation by default: presence and format check without secret leakage; make live validation explicit, cached, or opt-in if implemented.',
        'Design event transport as a narrow abstraction preserving createEventBus/globalEventBus compatibility where practical, with in-memory local/test fallback and NATS JetStream production transport selected by env/Helm.',
        'Define durable event semantics: stable event IDs, subject/stream names, replay cursor behavior, retention, multi-replica fanout, slow-subscriber/backpressure handling, reconnect behavior, and broker outage status.',
        'Choose NATS/JetStream because the Helm chart already exposes optional NATS; do not add Redis unless the current chart or issue comments prove it is preferred.',
        'If execution mode is acceptance-only, return a verification architecture that maps existing code and tests to each acceptance criterion and limits changes to missing docs or test evidence.',
        'Return JSON: { healthDesign, eventTransportDesign, publicContracts, envAndHelmDesign, migrationPlan, testPlan, docsPlan, risks, decisionsNeeded }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['healthDesign', 'eventTransportDesign', 'envAndHelmDesign', 'testPlan', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const contractTestsTask = defineTask('issue-612.contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write contract tests before implementation',
  labels: ['issue-612', 'atdd', 'tdd', 'tests'],
  agent: {
    name: 'krate-test-engineer',
    prompt: {
      role: 'test engineer for Krate production infrastructure',
      task: 'Add focused failing tests that encode the #612 acceptance criteria before implementation.',
      instructions: [
        specBlock(args),
        '',
        'ARCHITECTURE:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '',
        'EXECUTION MODE:',
        JSON.stringify(args.executionMode ?? {}, null, 2),
        '',
        'Add or update tests near existing Krate core/web/deployment tests. Keep test scaffolding minimal and deterministic with injectable fetch, broker clients, command runners, and clocks.',
        'Health tests must cover Gitea /api/v1/version, Agent Mux /healthz rather than /health, Krate Controller /healthz, bounded Kubernetes connectivity, assistant credential validation without leaking the key, timeouts, and partial failure results.',
        'Event tests must cover in-memory compatibility, NATS/JetStream transport behavior through injected clients, durable replay from cursor/last-event-id, cross-subscriber fanout, slow subscriber/backpressure semantics, broker-unavailable status, and SSE route replay behavior.',
        'Helm/deployment tests must cover NATS/event env wiring and no secret literals in templates.',
        'Run the narrow tests and confirm the newly added tests fail for expected missing behavior before implementation unless execution mode is acceptance-only or the current branch already implements the feature.',
        'If execution mode is acceptance-only, do not write duplicate tests; instead map existing tests and any missing narrow checks to the acceptance criteria.',
        'Return JSON: { testsAdded, testsUpdated, redCommands, redResults, failedForExpectedReason, alreadyImplementedEvidence, notes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['testsAdded', 'redCommands', 'failedForExpectedReason'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementationTask = defineTask('issue-612.implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement health probes, durable events, Helm wiring, and docs',
  labels: ['issue-612', 'implementation', 'krate'],
  agent: {
    name: 'krate-platform-engineer',
    prompt: {
      role: 'senior Krate platform engineer',
      task: 'Implement the #612 feature set using the architecture and red tests.',
      instructions: [
        specBlock(args),
        '',
        'ARCHITECTURE:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '',
        'RED TESTS:',
        JSON.stringify(args.tests ?? {}, null, 2),
        '',
        'EXECUTION MODE:',
        JSON.stringify(args.executionMode ?? {}, null, 2),
        '',
        'If execution mode is acceptance-only, do not reimplement working behavior. Limit changes to missing documentation, narrowly missing tests, or verification evidence needed to prove #612 on the current branch.',
        'Implement only the scoped Krate health, event streaming, Helm/env, SDK export, and docs changes needed for #612.',
        'Health: create or reuse a shared probe service with injectable fetch/command runners, strict timeouts, redacted errors, concurrent execution, and structured per-dependency status.',
        'Health: update web snapshot/health route behavior without breaking current HealthMonitor shape; include controller /healthz and assistant credential status.',
        'Kubernetes: prefer existing Kubernetes controller/listResource health where it is the project pattern, but support a bounded kubectl cluster-info check only behind an injectable runner if required by acceptance criteria.',
        'Events: replace direct process-local-only behavior with a transport abstraction. Preserve createEventBus/globalEventBus APIs for tests/local usage while allowing production NATS/JetStream transport through env/config.',
        'Events: update both packages/krate/core/src/http-server.js SSE and packages/krate/web/app/api/orgs/[org]/agents/events/stream/route.js to subscribe through the transport abstraction and support replay cursors/Last-Event-ID where practical.',
        'Events: maintain JSON event payload compatibility; add stable event IDs without removing existing fields.',
        'Helm/env: wire optional NATS values into api/controllers/web workloads as needed, without committing secrets or forcing NATS for local default installs unless explicitly configured.',
        'Docs: update staging/infrastructure docs and SDK docs only where they describe the changed operational behavior.',
        'Run narrow tests until the red tests pass before returning.',
        'Return JSON: { changedFiles, summary, decisions, compatibilityNotes, testCommands, testResults, residualRisk }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'testCommands', 'testResults'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verificationTask = defineTask('issue-612.verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run quality gates',
  labels: ['issue-612', 'verification', 'quality-gate'],
  agent: {
    name: 'krate-verifier',
    prompt: {
      role: 'verification engineer',
      task: 'Run and report the quality gates for #612.',
      instructions: [
        'Run these verification commands from the repository root unless a command specifies another working directory:',
        JSON.stringify(args.verificationCommands ?? [], null, 2),
        '',
        'Also run narrow commands from the test and implementation phases if not covered by the list.',
        'For each command, report the exact command, working directory, exit code, and relevant output summary.',
        'Do not mark passed if any command is skipped without a concrete reason. If a live NATS or Kubernetes smoke test cannot run locally, report it as residual staging validation with the exact missing dependency.',
        'Return JSON: { passed, commands, failures, skipped, residualStagingValidation, notes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'failures', 'skipped'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewTask = defineTask('issue-612.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation against #612',
  labels: ['issue-612', 'review', 'quality-gate'],
  agent: {
    name: 'krate-code-reviewer',
    prompt: {
      role: 'senior code reviewer for production infrastructure',
      task: 'Review the implementation diff against #612 acceptance criteria and verification evidence.',
      instructions: [
        'Compare the issue spec, architecture, tests, implementation diff, and verification results directly.',
        '',
        specBlock(args),
        '',
        'Block on missing health probes, Agent Mux probing /health instead of /healthz, missing controller /healthz, secret leakage, unbounded probe latency, process-local-only event delivery in production, no replay cursor, no broker outage behavior, breaking SDK/event payload compatibility, Helm wiring gaps, broad unrelated refactors, or failing/skipped required tests.',
        'Review security implications of assistant credential validation and broker configuration.',
        'Review operational semantics for multi-replica deployments and local fallback.',
        'Return JSON: { approved, issues, requiredFixes, changedFiles, securityNotes, operationalNotes, residualRisk }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'issues', 'requiredFixes', 'changedFiles'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const refinementTask = defineTask('issue-612.refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine after verification or review',
  labels: ['issue-612', 'refinement'],
  agent: {
    name: 'krate-platform-engineer',
    prompt: {
      role: 'senior Krate platform engineer',
      task: `Apply only blocking fixes from verification/review attempt ${args.attempt}.`,
      instructions: [
        specBlock(args),
        '',
        'VERIFICATION:',
        JSON.stringify(args.verification ?? {}, null, 2),
        '',
        'REVIEW:',
        JSON.stringify(args.review ?? {}, null, 2),
        '',
        'Apply only the required fixes. Do not broaden scope or refactor unrelated Krate surfaces.',
        'Rerun the narrow failing checks before returning.',
        'Return JSON: { changedFiles, summary, fixedIssues, testCommands, testResults, remainingRisk }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'fixedIssues', 'testCommands', 'testResults'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-612.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance and delivery readiness',
  labels: ['issue-612', 'final-acceptance'],
  agent: {
    name: 'krate-release-reviewer',
    prompt: {
      role: 'release readiness reviewer',
      task: 'Decide whether #612 is complete and ready to deliver.',
      instructions: [
        'Confirm every acceptance criterion is satisfied or explicitly deferred with a linked reason.',
        'Confirm verification passed, review approved, and no unrelated files were changed.',
        'Confirm health output remains backward compatible for the web HealthMonitor while adding the new deep probes.',
        'Confirm production event streaming no longer relies on process-local-only delivery when broker config is enabled.',
        'Confirm docs explain NATS/JetStream env/Helm configuration and residual staging validation needs.',
        'If final acceptance needs a maintainer decision, set needsHumanDecision true and provide one concrete question.',
        'Return JSON: { passed, needsHumanDecision, question, changedFiles, acceptanceChecklist, verificationSummary, residualRisk, deliveryNotes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'needsHumanDecision', 'changedFiles', 'acceptanceChecklist', 'verificationSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
