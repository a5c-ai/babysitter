/**
 * @process repo/issue-612-health-probes-durable-events
 * @description Implement issue #612: real Krate health probes plus durable cross-replica event streaming.
 * @inputs {
 *   issueNumber: number,
 *   baseBranch: string,
 *   branchName: string,
 *   targetFiles: string[],
 *   dependencyIssues: number[],
 *   brokerPreference: string,
 *   verificationCommands: string[],
 *   liveSmokeChecks: string[]
 * }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, delivery: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Existing health surfaces:
 *   - packages/krate/web/app/api/orgs/[org]/snapshot/route.js currently returns health for Kubernetes, Gitea, Agent Mux/Gateway, and external providers.
 *   - packages/krate/core/src/agent-adapter-controller.js already performs HTTP GET checks when an AgentAdapter has spec.healthEndpoint; it returns unknown/no-endpoint otherwise.
 *   - packages/krate/core/src/agent-stack-controller.js already performs HTTP GET checks for AgentMcpServer endpoints.
 *   - packages/krate/web/app/components/observability/health-monitor.jsx consumes snapshot health and expects status strings such as ok/error/unknown/not configured.
 * - Existing event streaming surfaces:
 *   - packages/krate/core/src/event-bus.js owns createEventBus/globalEventBus and persists only a local JSONL ring buffer capped at MAX_EVENTS = 1000.
 *   - packages/krate/core/src/http-server.js streams /api/orgs/:org/agents/events/stream from globalEventBus.
 *   - packages/krate/web/app/api/orgs/[org]/agents/events/stream/route.js proxies KRATE_CONTROLLER_URL when available and otherwise subscribes to the local SDK event bus.
 *   - Event emitters include packages/krate/core/src/api-controller.js, packages/krate/web/app/api/orgs/[org]/resources/route.js, packages/krate/web/app/api/orgs/[org]/resources/[kind]/[name]/route.js, packages/krate/web/app/api/orgs/[org]/agents/dispatch/route.js, and packages/krate/web/app/lib/jitsi-service.js.
 * - Existing deployment/config surfaces:
 *   - packages/krate/charts/values.yaml has demo.nats and externalDependencies.nats sections.
 *   - packages/krate/charts/templates/deployments.yaml wires KRATE_CONTROLLER_URL, KRATE_GITEA_HTTP_URL, AGENT_MUX_URL, and ANTHROPIC_API_KEY into workloads.
 *   - packages/krate/core/package.json currently has no runtime dependencies, so adding a NATS client is a package-surface decision.
 * - Matching process-library references:
 *   - specializations/devops-sre-platform/monitoring-setup
 *   - specializations/devops-sre-platform/iac-testing
 *   - specializations/sdk-platform-development/custom-transport-middleware
 *   - specializations/qa-testing-automation/contract-testing
 *   - methodologies/gsd/iterative-convergence
 *
 * Repo policy note:
 * - docs/agent-reference/process-authoring.md says direct processes in this repo should avoid kind: 'shell' subtasks unless explicitly requested.
 *   This process uses agent tasks that run and report verification commands instead of shell task effects.
 *
 * @process specializations/devops-sre-platform/monitoring-setup
 * @process specializations/devops-sre-platform/iac-testing
 * @process specializations/sdk-platform-development/custom-transport-middleware
 * @process specializations/qa-testing-automation/contract-testing
 * @process methodologies/gsd/iterative-convergence
 * @skill health-check-endpoint specializations/sdk-platform-development/skills/health-check-endpoint/SKILL.md
 * @skill kubernetes-ops specializations/devops-sre-platform/skills/kubernetes-ops/SKILL.md
 * @skill helm-charts specializations/devops-sre-platform/skills/helm-charts/SKILL.md
 * @skill contract-test-framework specializations/sdk-platform-development/skills/contract-test-framework/SKILL.md
 * @agent platform-engineer specializations/devops-sre-platform/agents/platform-engineer/AGENT.md
 * @agent kubernetes-expert specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * @agent observability-expert specializations/devops-sre-platform/agents/observability-expert/AGENT.md
 * @agent extensibility-architect specializations/sdk-platform-development/agents/extensibility-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent security-review-agent specializations/sdk-platform-development/agents/security-review-agent/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function value(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 612;

  const issueSpec = await ctx.task(readIssueSpecTask, { inputs, issueNumber }, {
    key: 'issue-612.read-issue-spec',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueSpec: value(issueSpec),
  }, {
    key: 'issue-612.reuse-audit',
  });

  const processLibraryResearch = await ctx.task(processLibraryResearchTask, {
    inputs,
    issueSpec: value(issueSpec),
    reuseAudit: value(reuseAudit),
  }, {
    key: 'issue-612.process-library-research',
  });

  const runtimeTrace = await ctx.task(runtimeTraceTask, {
    inputs,
    issueSpec: value(issueSpec),
    reuseAudit: value(reuseAudit),
    processLibraryResearch: value(processLibraryResearch),
  }, {
    key: 'issue-612.runtime-trace',
  });

  const architecturePlan = await ctx.task(architecturePlanTask, {
    inputs,
    issueSpec: value(issueSpec),
    reuseAudit: value(reuseAudit),
    runtimeTrace: value(runtimeTrace),
  }, {
    key: 'issue-612.architecture-plan',
  });

  if (architecturePlan?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #612 Architecture Decision',
      question: architecturePlan.question || 'A health/event transport decision needs maintainer input before implementation.',
      options: [
        'Proceed with recommended architecture',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['approval-gate', 'issue-612', 'architecture'],
      context: { runId: ctx.runId, issueNumber, architecturePlan },
    });
  }

  const contractTests = await ctx.task(authorContractTestsTask, {
    inputs,
    issueSpec: value(issueSpec),
    reuseAudit: value(reuseAudit),
    runtimeTrace: value(runtimeTrace),
    architecturePlan: value(architecturePlan),
  }, {
    key: 'issue-612.contract-tests',
  });

  let healthImplementation = null;
  let eventImplementation = null;
  let deploymentWiring = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    healthImplementation = await ctx.task(implementHealthProbesTask, {
      inputs,
      issueSpec: value(issueSpec),
      reuseAudit: value(reuseAudit),
      runtimeTrace: value(runtimeTrace),
      architecturePlan: value(architecturePlan),
      contractTests: value(contractTests),
      previousVerification: value(verification),
      previousReview: value(review),
      attempt,
    }, {
      key: `issue-612.health-implementation.${attempt}`,
    });

    eventImplementation = await ctx.task(implementDurableEventTransportTask, {
      inputs,
      issueSpec: value(issueSpec),
      reuseAudit: value(reuseAudit),
      runtimeTrace: value(runtimeTrace),
      architecturePlan: value(architecturePlan),
      contractTests: value(contractTests),
      healthImplementation: value(healthImplementation),
      previousVerification: value(verification),
      previousReview: value(review),
      attempt,
    }, {
      key: `issue-612.event-transport-implementation.${attempt}`,
    });

    deploymentWiring = await ctx.task(wireDeploymentDocsTask, {
      inputs,
      issueSpec: value(issueSpec),
      architecturePlan: value(architecturePlan),
      healthImplementation: value(healthImplementation),
      eventImplementation: value(eventImplementation),
      attempt,
    }, {
      key: `issue-612.deployment-docs-wiring.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueSpec: value(issueSpec),
      contractTests: value(contractTests),
      healthImplementation: value(healthImplementation),
      eventImplementation: value(eventImplementation),
      deploymentWiring: value(deploymentWiring),
      attempt,
    }, {
      key: `issue-612.verification.${attempt}`,
    });

    review = await ctx.task(adversarialReviewTask, {
      inputs,
      issueSpec: value(issueSpec),
      reuseAudit: value(reuseAudit),
      runtimeTrace: value(runtimeTrace),
      architecturePlan: value(architecturePlan),
      contractTests: value(contractTests),
      verification: value(verification),
      attempt,
    }, {
      key: `issue-612.review.${attempt}`,
    });

    attempts.push({ attempt, healthImplementation, eventImplementation, deploymentWiring, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueSpec: value(issueSpec),
    reuseAudit: value(reuseAudit),
    runtimeTrace: value(runtimeTrace),
    architecturePlan: value(architecturePlan),
    contractTests: value(contractTests),
    healthImplementation: value(healthImplementation),
    eventImplementation: value(eventImplementation),
    deploymentWiring: value(deploymentWiring),
    verification: value(verification),
    review: value(review),
    attempts,
  }, {
    key: 'issue-612.final-acceptance',
  });

  const delivery = await ctx.task(deliveryTask, {
    inputs,
    issueSpec: value(issueSpec),
    finalGate: value(finalGate),
    verification: value(verification),
    review: value(review),
  }, {
    key: 'issue-612.delivery',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-spec',
      'reuse-audit',
      'process-library-research',
      'runtime-trace',
      'architecture-plan',
      'contract-tests-first',
      'health-probes-implementation',
      'durable-event-transport-implementation',
      'deployment-and-docs-wiring',
      'verification-loop',
      'adversarial-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    issueSpec,
    reuseAudit,
    processLibraryResearch,
    runtimeTrace,
    architecturePlan,
    contractTests,
    healthImplementation,
    eventImplementation,
    deploymentWiring,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const readIssueSpecTask = defineTask('issue-612.read-issue-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #612 and freeze implementation spec',
  labels: ['issue-612', 'spec', 'github'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'senior Krate infrastructure maintainer',
      task: 'Read the authoritative GitHub issue context and turn it into a frozen implementation spec.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Preserve the issue body and comments as source-of-truth text in your output. Do not invent acceptance criteria.',
        'Call out dependency issue #608 and whether staging env var work appears required before live smoke checks.',
        'Return JSON with: title, labels, issueBody, comments, acceptanceCriteria, dependencies, nonGoals, openQuestions, riskLevel.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-612.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse audit for health and event infrastructure',
  labels: ['issue-612', 'reuse-audit', 'architecture'],
  agent: {
    name: 'observability-expert',
    prompt: {
      role: 'senior observability and eventing engineer',
      task: 'Perform the repo-specific Phase 0 reuse audit before proposing new health or event infrastructure.',
      instructions: [
        'Do not edit files.',
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract nouns and verbs from the issue spec, then scan for matching routes, controllers, event emitters, tests, Helm values/templates, package dependencies, and docs.',
        'Inspect these starting surfaces: packages/krate/core/src/event-bus.js, packages/krate/core/src/http-server.js, packages/krate/core/src/api-controller.js, packages/krate/core/src/agent-adapter-controller.js, packages/krate/core/src/agent-stack-controller.js, packages/krate/web/app/api/orgs/[org]/snapshot/route.js, packages/krate/web/app/api/orgs/[org]/agents/events/stream/route.js, packages/krate/charts/values.yaml, packages/krate/charts/templates/deployments.yaml.',
        'Search for NATS, JetStream, KRATE_EVENT, AGENT_MUX_URL, KRATE_CONTROLLER_URL, KRATE_GITEA_HTTP_URL, ANTHROPIC_API_KEY, KRATE_ASSISTANT_API_KEY, kubectl, healthz, and text/event-stream.',
        'Identify reusable tests and docs to update before adding any new files or dependencies.',
        'Return JSON with: findings, currentHealthSurfaces, currentEventSurfaces, configSurfaces, reusableTests, dependencyDecisions, noNewInfrastructureNotes, risks.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const processLibraryResearchTask = defineTask('issue-612.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process-library methodologies',
  labels: ['issue-612', 'process-library', 'methodology'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Babysitter process author',
      task: 'Research relevant active process-library methodologies and explain how they shape this run.',
      instructions: [
        'Do not edit files.',
        'Use the active library root reported by babysitter process-library:active --json.',
        'Inspect monitoring setup, IaC testing, custom transport middleware, contract testing, and iterative convergence references.',
        'Summarize only process ideas that directly apply to issue #612: test-first contracts, transport abstraction, strict verification gates, Helm/config validation, and final adversarial review.',
        'Return JSON with: activeLibraryRoot, referencesRead, selectedPatterns, rejectedPatterns, processImplications.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runtimeTraceTask = defineTask('issue-612.runtime-trace', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace health and event runtime call paths',
  labels: ['issue-612', 'runtime-trace', 'brownfield'],
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'brownfield runtime architect',
      task: 'Trace live execution paths before implementation and constrain the change surface.',
      instructions: [
        'Do not edit files.',
        'Trace the health path from HealthMonitor and snapshot API through controller/listResource checks and configured external service probes.',
        'Trace adapter/stack health paths through agent-adapter-controller and agent-stack-controller.',
        'Trace event emission paths from resource/apply/delete and agent dispatch emitters through SDK exports, globalEventBus, core HTTP SSE, and web Next.js SSE route.',
        'Trace deployment config flow from Helm values to workload env vars for controller, web, API, and optional NATS.',
        'Record runtimeCallPaths as ordered arrays of file paths and function/route names.',
        'Identify files that must not be changed because they are adjacent but not on the live path.',
        'Return JSON with: runtimeCallPaths, liveEntryPoints, emitters, subscribers, configFlow, scopedFiles, excludedFiles, openRisks.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const architecturePlanTask = defineTask('issue-612.architecture-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design shared health service and durable event transport',
  labels: ['issue-612', 'architecture', 'nats', 'health'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Krate platform architect',
      task: 'Design the smallest production-ready architecture that satisfies the frozen issue spec and runtime trace.',
      instructions: [
        'Do not edit files.',
        'Prefer NATS JetStream when brokerPreference is nats because the chart already has demo and external NATS values.',
        'Design a narrow health probing module with injectable fetch/exec/key validator dependencies, concurrent bounded probes, redacted secrets, and partial structured results.',
        'Define health statuses and compatibility mapping for existing HealthMonitor consumers.',
        'Design an event bus abstraction that preserves createEventBus/globalEventBus API compatibility while adding durable publish, subscribe, replay cursor, backpressure, reconnect, and broker-unavailable reporting.',
        'Decide whether event persistence should be JetStream-only, local queryable file/table fallback, or both. Justify the choice against restart replay and cross-replica delivery requirements.',
        'Define env vars and Helm values for NATS URL/creds/stream/subject/consumer settings without committing secrets.',
        'Set needsMaintainerDecision true only if a real ambiguity blocks implementation, such as rejecting NATS or requiring live Anthropic validation by default.',
        'Return JSON with: selectedBroker, healthServiceDesign, eventTransportDesign, persistenceDesign, envAndHelmDesign, apiCompatibilityPlan, testStrategy, rolloutPlan, needsMaintainerDecision, question.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractTestsTask = defineTask('issue-612.contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing contracts before implementation',
  labels: ['issue-612', 'tests', 'tdd', 'contracts'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior Node.js and Next.js test engineer',
      task: 'Author failing tests that lock the issue #612 acceptance criteria before production code changes.',
      instructions: [
        'Edit only tests and test fixtures in this phase.',
        'Use the issueSpec text in context as the source of truth. Do not author tests from existing implementation behavior.',
        'Cover health probe behavior: Gitea /api/v1/version, Agent Mux /healthz, Krate Controller /healthz, kubectl cluster-info, Anthropic/Krate assistant key presence/format by default, optional live validation only if architecturePlan explicitly enables it, bounded timeouts, concurrent partial results, and redacted errors.',
        'Cover health API output compatibility for the web HealthMonitor and snapshot route.',
        'Cover adapter and stack health contracts so no-endpoint/unknown remains explicit while configured endpoints do real bounded probes.',
        'Cover durable events: in-memory fallback, NATS/JetStream publish/subscribe with a fake broker or injectable client, replay from cursor/last-event-id, cross-subscriber fanout, backpressure/slow subscriber handling, broker unavailable reporting, and no loss of existing emitResourceChange shape.',
        'Confirm new tests fail for missing implementation rather than setup errors.',
        'Return JSON with: testFiles, fixturesCreated, behaviorsCovered, redCommandsRun, redResultSummary, gapsOrBlockers.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementHealthProbesTask = defineTask('issue-612.health-probes-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement real health probes',
  labels: ['issue-612', 'health', 'implementation'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'senior Node.js infrastructure engineer',
      task: 'Implement the issue #612 health probe track to satisfy the failing tests and architecture plan.',
      instructions: [
        'Keep changes scoped to files on runtimeTrace.scopedFiles unless tests prove another live-path file is required.',
        'Introduce or reuse a shared health probe service in Krate core/SDK/web boundaries so web health and controller checks do not drift.',
        'Probe configured Gitea with KRATE_GITEA_HTTP_URL plus /api/v1/version.',
        'Probe Agent Mux with AGENT_MUX_URL or AGENT_GATEWAY_URL plus /healthz, not /health.',
        'Probe Krate Controller with KRATE_CONTROLLER_URL plus /healthz.',
        'Represent Kubernetes connectivity explicitly using bounded kubectl cluster-info or an injectable equivalent that is testable and does not hang health routes.',
        'Validate Anthropic/Krate assistant credentials without leaking secrets; default to presence/format and only perform live validation if architecturePlan explicitly chose that mode.',
        'Run probes concurrently, apply strict timeouts, and return structured status/reason/latency/error data while preserving existing status strings for consumers that still expect ok/error/unknown.',
        'Update agent-adapter-controller and agent-stack-controller only where their current health semantics are part of the live path.',
        'Return JSON with: changedFiles, healthContract, statusMapping, timeoutBehavior, secretHandling, testsSatisfied, residualRisks.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementDurableEventTransportTask = defineTask('issue-612.durable-event-transport-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement durable event streaming',
  labels: ['issue-612', 'events', 'nats', 'sse', 'implementation'],
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'senior event-streaming engineer',
      task: 'Replace process-local-only event streaming with a durable broker-backed transport while preserving local development ergonomics.',
      instructions: [
        'Keep the public SDK surface compatible: createEventBus, globalEventBus, loadPersistedEvents where still relevant, subscribe/unsubscribe/emit/emitResourceChange.',
        'Add a transport abstraction with an in-memory implementation for tests/local development and a NATS JetStream implementation selected by explicit env/config.',
        'Use an injectable broker client in tests; do not require a live NATS server for the default unit test suite.',
        'Persist events to a queryable durable store or JetStream stream with stable event ids/cursors. Do not rely only on the old local JSONL capped ring buffer for production replay.',
        'Update core HTTP SSE and web route paths to subscribe through the abstraction and support replay from Last-Event-ID or an equivalent cursor query parameter.',
        'Handle slow subscribers and closed streams without blocking emitters; surface broker unavailable state in health/reporting rather than silently falling back in production.',
        'Preserve event payload compatibility for existing web and SDK consumers.',
        'Return JSON with: changedFiles, transportContract, brokerConfig, replaySemantics, backpressureSemantics, fallbackPolicy, testsSatisfied, residualRisks.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const wireDeploymentDocsTask = defineTask('issue-612.deployment-docs-wiring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Wire Helm values, manifests, and docs',
  labels: ['issue-612', 'helm', 'docs', 'configuration'],
  agent: {
    name: 'kubernetes-expert',
    prompt: {
      role: 'Kubernetes and Helm maintainer',
      task: 'Wire runtime configuration and documentation for issue #612 without committing secrets.',
      instructions: [
        'Update Helm values/templates only for health probe env vars, NATS event transport env vars, and workload wiring required by the implementation.',
        'Use existing demo.nats and externalDependencies.nats value families where possible instead of inventing unrelated chart structure.',
        'Keep secret values referenced through existingSecret/key style fields where credentials are required.',
        'Update docs/gaps/staging-status.md and docs/gaps/infrastructure-deps.md only if behavior changes make the existing gap docs stale.',
        'Update package READMEs or SDK docs if createEventBus/loadPersistedEvents semantics or env vars changed.',
        'Return JSON with: changedFiles, helmValues, envVars, docsUpdated, secretSafetyNotes, localDevInstructions.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-612.verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run issue #612 verification gates',
  labels: ['issue-612', 'verification', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior QA automation engineer',
      task: 'Run the verification commands and close scoped gaps for issue #612.',
      instructions: [
        'Run every command in inputs.verificationCommands and report exact pass/fail evidence.',
        'At minimum, verify focused health tests, focused event bus/SSE tests, full Krate core tests, full Krate web tests, package validation, build checks, Helm template/render checks if available, and git diff --check.',
        'If a verification command fails, inspect the full failure before changing files and fix only issue #612-related failures.',
        'Confirm the tests authored in the contract-tests phase now pass and still exercise the issueSpec criteria.',
        'Check that no unrelated dirty worktree files were staged or modified.',
        'Return JSON with: passed, commandsRun, passFail, fixesApplied, changedFilesAfterVerification, unresolvedFailures, evidence.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const adversarialReviewTask = defineTask('issue-612.adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adversarial review for operations and compatibility risk',
  labels: ['issue-612', 'review', 'security', 'compatibility'],
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'adversarial reviewer for production infrastructure changes',
      task: 'Review the final diff against issue #612, the reuse audit, and operational risk.',
      instructions: [
        'Do not make broad refactors.',
        'Review health probes for unbounded latency, secret leakage, live API calls by default, misleading healthy statuses, and route compatibility regressions.',
        'Review event transport for event loss, duplicate cursor behavior, cross-replica fanout, replay gaps, slow subscriber blocking, broker outage handling, and breaking SDK/export changes.',
        'Review Helm/docs for missing env wiring, secret exposure, invalid chart values, and local development breakage.',
        'If blocking defects are found, fix narrowly and rerun affected verification commands.',
        'Return JSON with: approved, findings, fixesApplied, residualRisks, finalVerificationNeeded.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-612.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance against issue #612',
  labels: ['issue-612', 'acceptance', 'quality-gate'],
  agent: {
    name: 'observability-expert',
    prompt: {
      role: 'release-minded Krate maintainer',
      task: 'Compare the produced artifacts directly to the issue #612 spec and decide whether the run is complete.',
      instructions: [
        'Compare issueSpec to the final diff, tests, verification evidence, and review result.',
        'Report each acceptance criterion as pass/fail with file-level evidence.',
        'Fail the gate if health probes are still superficial, if event delivery remains process-local-only in production, if replay is not durable/queryable, or if verification evidence is missing.',
        'Return JSON with: passed, criteria, changedFiles, runtimeCallPaths, verificationSummary, residualRisks, releaseNotes.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliveryTask = defineTask('issue-612.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare implementation PR and issue update',
  labels: ['issue-612', 'delivery', 'github'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'GitHub delivery engineer',
      task: 'Commit, push, open the implementation PR, and update issue #612 after all gates pass.',
      instructions: [
        'Use inputs.branchName for the implementation branch unless already on an equivalent issue branch.',
        'Do not include unrelated dirty worktree files in the commit.',
        'Commit only issue #612 implementation, tests, package metadata, chart/docs updates, and intentional process artifacts.',
        'Create a PR to inputs.baseBranch with a title like "Implement real health probes and durable event streaming".',
        'Link to issue #612 in the PR body.',
        'PR body must summarize health probe behavior, event transport semantics, Helm/env wiring, verification commands, and residual risks.',
        'Post a comment on issue #612 with the PR URL and verification summary.',
        'Return JSON with: branchName, commitSha, prUrl, issueCommentUrl, changedFiles.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
