/**
 * @process repo/issue-585-agent-runtime-crash-k8s
 * @description Implement issue #585: agent-runtime crash recovery, persistent queue, Kubernetes executor, resource enforcement, and telemetry export.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, issueContext: object, targetFiles: string[], qualityCommands: string[] }
 * @outputs { success: boolean, reuseAudit: object, runtimeCallPaths: string[], changedFiles: string[], verification: object, review: object, delivery: object }
 *
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 * @process specializations/sdk-platform-development/telemetry-analytics-integration
 * @process specializations/devops-sre-platform/kubernetes-setup
 * @process specializations/qa-testing-automation/quality-gates
 * @process specializations/collaboration/github/issue-linking
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent kubernetes-expert specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * @agent observability-expert specializations/devops-sre-platform/agents/observability-expert/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 *
 * This process intentionally uses agent tasks for research, implementation, and
 * verification to respect this repository's process-authoring override for
 * direct Babysitter workflows. Agents are instructed to run deterministic
 * commands and report exact command outcomes.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_TARGET_FILES = [
  'docs/agent-layer-gaps.md',
  'packages/agent-runtime/src/daemon/loop.ts',
  'packages/agent-runtime/src/daemon/lifecycle.ts',
  'packages/agent-runtime/src/daemon/types.ts',
  'packages/agent-runtime/src/daemon/config.ts',
  'packages/agent-runtime/src/execution/modes/kubernetes.ts',
  'packages/agent-runtime/src/execution/types.ts',
  'packages/agent-runtime/src/execution/provider.ts',
  'packages/agent-runtime/src/resources/manager.ts',
  'packages/agent-runtime/src/resources/types.ts',
  'packages/agent-runtime/src/telemetry/provider.ts',
  'packages/agent-runtime/src/telemetry/types.ts',
  'packages/agent-runtime/src/execution/__tests__/provider.test.ts',
  'packages/agent-runtime/src/resources/__tests__/manager.test.ts',
  'packages/agent-runtime/src/telemetry/__tests__/provider.test.ts',
];

const DEFAULT_QUALITY_COMMANDS = [
  'npm run test --workspace=@a5c-ai/agent-runtime',
  'npm run build --workspace=@a5c-ai/agent-runtime',
  'npm run build:runtime:agent-core-deps',
  'npm run verify:metadata',
];

const reuseAuditTask = defineTask('issue-585.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0: reuse audit for agent-runtime durability surfaces',
  labels: ['issue-585', 'reuse-audit', 'phase:research'],
  agent: {
    name: 'agent-runtime-reuse-auditor',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Run the repo-required Phase 0 reuse audit before planning implementation.',
      instructions: [
        'Do not edit files.',
        'Extract keyword nouns and verbs from the issue prompt: crash recovery, watchdog, persistent queue, replay, dead-letter, Kubernetes executor, kubectl apply, log streaming, resource budgets, telemetry export, onTrigger errors.',
        'Scan for matching migrations, runtime APIs, queue persistence, daemon lifecycle helpers, Kubernetes execution helpers, telemetry exporters, resource admission controls, environment variables, SDK dependencies, and existing tests.',
        'Check the target files and adjacent tests. Also inspect .a5c/reuse-audit.json if it exists and honor its globs/rules.',
        'Render "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" in the output.',
        'Return JSON: { keywords: string[], existingInfrastructure: array, reusableFiles: string[], missingInfrastructure: string[], noMatchingExistingInfrastructure: boolean, recommendations: string[] }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        `TARGET FILES: ${JSON.stringify(args.targetFiles ?? [])}`,
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const traceRuntimeTask = defineTask('issue-585.trace-runtime-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace agent-runtime live paths and implementation boundaries',
  labels: ['issue-585', 'runtime-call-paths', 'phase:research'],
  agent: {
    name: 'agent-runtime-architect',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Trace the live runtime call paths for issue #585 and produce an implementation architecture.',
      instructions: [
        'Do not edit files.',
        'Use systematic debugging and brownfield runtime tracing. Record only live paths that execution actually uses.',
        'Trace daemon trigger flow from file/webhook/timer activation through runDaemonLoop queueing, dispatch, activeRuns tracking, status writes, shutdown, and daemon lifecycle start/stop/status.',
        'Trace Kubernetes execution from ExecutionProviderImpl through KubernetesExecutor.spawn/attach/list/destroy and the ExecutionHandle contract.',
        'Trace resource manager usage and gaps around admission/enforcement boundaries.',
        'Trace telemetry provider usage and the exporter surface needed for file and OTLP-compatible export without leaking secrets.',
        'Account for related issues #604, #590, #592, and #593 as risk context, but do not implement unrelated scope.',
        'Define the smallest phased architecture that addresses durable queue, crash replay, retries/backoff/dead-letter, onTrigger error containment, watchdog/restart semantics, Kubernetes job apply/poll/logs/cleanup, budget enforcement, and telemetry export.',
        'Return JSON: { confidence: number, runtimeCallPaths: string[], architecture: object, phasedImplementation: array, targetFiles: string[], newFilesLikely: string[], testSurfaces: string[], risks: array, breakpointNeeded: boolean, breakpointReason: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        '',
        `TARGET FILES: ${JSON.stringify(args.targetFiles ?? [])}`,
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionTestsTask = defineTask('issue-585.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression and integration tests first',
  labels: ['issue-585', 'tdd', 'phase:red'],
  agent: {
    name: 'agent-runtime-test-author',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Author focused failing tests for issue #585 before production implementation changes.',
      instructions: [
        'Follow TDD. Add or update tests first, then run the narrow tests and confirm they fail for the expected missing behavior.',
        'Author tests strictly from the issue context and traced runtime paths, not from any implementation you plan to write.',
        'Cover durable trigger queue persistence, replay after daemon restart, ack state transitions, retry/backoff, dead-letter handling, and onTrigger error containment.',
        'Cover crash/restart behavior without requiring a real long-lived daemon process when an in-process deterministic harness can prove the lifecycle semantics.',
        'Cover Kubernetes executor behavior with mocked child_process spawn or equivalent: kubectl apply receives a Job manifest, completion polling handles success/failure/timeout, attach streams logs, destroy deletes the Job, and no real cluster is required.',
        'Cover resource budget admission/enforcement so over-budget work fails explicitly before dispatch.',
        'Cover telemetry export using file exporter and mocked OTLP/HTTP sink with redaction checks for secret-like attributes.',
        'Do not skip, weaken, or delete existing tests.',
        'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommands: string[], failureMatchesIssue: boolean, notes: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'ARCHITECTURE:',
        JSON.stringify(args.architecture ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementQueueRecoveryTask = defineTask('issue-585.implement-queue-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement durable queue and crash recovery',
  labels: ['issue-585', 'implementation', 'daemon', 'queue', 'phase:green'],
  agent: {
    name: 'agent-runtime-daemon-implementer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement durable daemon queue and crash recovery for issue #585.',
      instructions: [
        'Edit the repository directly.',
        'Keep changes scoped to agent-runtime daemon durability and directly required shared types/tests.',
        'Implement disk-backed queue persistence under the daemon directory with stable event IDs, pending/running/succeeded/failed/dead-letter states, atomic writes, replay on daemon startup, and idempotent ack semantics.',
        'Add retry/backoff and dead-letter handling for failed trigger dispatches. A bad onTrigger callback must be caught, logged, tracked, and must not crash the daemon loop.',
        'Add watchdog/restart semantics around lifecycle without breaking foreground/dev mode or existing pid-file behavior. Preserve stale PID cleanup and graceful shutdown semantics.',
        'Implement queue drain behavior so shutdown does not silently drop queued work. Document any intentionally deferred orphaned active-run behavior as a risk if it depends on related issue #593.',
        'Run the queue/recovery tests from the red phase and report exact results.',
        'Return JSON: { changedFiles: string[], summary: string, invariants: string[], testsRun: array, remainingRisks: array }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'RUNTIME ARCHITECTURE:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '',
        'REGRESSION TESTS:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        '',
        'PRIOR VERIFICATION FEEDBACK:',
        JSON.stringify(args.feedback ?? null, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementKubernetesTask = defineTask('issue-585.implement-kubernetes-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Kubernetes Job executor',
  labels: ['issue-585', 'implementation', 'kubernetes', 'phase:green'],
  agent: {
    name: 'agent-runtime-kubernetes-implementer',
    prompt: {
      role: 'senior Kubernetes and TypeScript runtime engineer',
      task: 'Replace the Kubernetes executor stub with real kubectl-backed Job execution.',
      instructions: [
        'Edit the repository directly.',
        'Keep the public ExecutionHandle contract coherent. Add narrow config fields only when necessary for timeout, cleanup, kubectl path, or log behavior.',
        'Use a spawn/invocation seam that tests can mock. Do not require a live Kubernetes cluster for default tests.',
        'Implement kubectl apply for generated Job manifests, status polling for completion/failure/timeout, attach log streaming, and destroy cleanup via kubectl delete.',
        'Use predictable job names/labels, namespace scoping, service account support, resource requests/limits, and clear failed/stopped/running status transitions.',
        'Avoid logging secrets from environment/config. Surface kubectl stderr in typed failures without swallowing root cause.',
        'Run the Kubernetes executor tests from the red phase and report exact results.',
        'Return JSON: { changedFiles: string[], summary: string, kubectlContract: object, testsRun: array, remainingRisks: array }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'RUNTIME ARCHITECTURE:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '',
        'REGRESSION TESTS:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        '',
        'QUEUE/RECOVERY RESULT:',
        JSON.stringify(args.queueRecovery ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementResourcesTelemetryTask = defineTask('issue-585.implement-resources-telemetry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement resource enforcement and telemetry export',
  labels: ['issue-585', 'implementation', 'resources', 'telemetry', 'phase:green'],
  agent: {
    name: 'agent-runtime-observability-implementer',
    prompt: {
      role: 'senior runtime observability engineer',
      task: 'Implement resource budget enforcement and telemetry export for issue #585.',
      instructions: [
        'Edit the repository directly.',
        'Wire resource budgets into clear admission/enforcement boundaries used by agent-runtime dispatch paths. Over-budget work must fail explicitly before starting new work, not only warn after consume.',
        'Preserve existing budget tracker behavior and add focused API/tests for enforcement decisions.',
        'Add telemetry exporters with opt-in configuration. Include at least file export and an OTLP-compatible HTTP exporter or a clearly structured exporter interface with mocked OTLP tests.',
        'Implement redaction for secret-like attributes and events before export. Make flush export completed spans before clearing buffers.',
        'Keep default development behavior compatible with the current in-memory provider unless inputs/config enable export.',
        'Run resource and telemetry tests from the red phase and report exact results.',
        'Return JSON: { changedFiles: string[], summary: string, enforcementBoundaries: string[], exporters: string[], testsRun: array, remainingRisks: array }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'RUNTIME ARCHITECTURE:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '',
        'REGRESSION TESTS:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        '',
        'KUBERNETES RESULT:',
        JSON.stringify(args.kubernetes ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verificationTask = defineTask('issue-585.verify-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run full issue #585 quality gates',
  labels: ['issue-585', 'verification', 'quality-gate'],
  agent: {
    name: 'agent-runtime-quality-verifier',
    prompt: {
      role: 'senior TypeScript runtime verifier',
      task: 'Run and interpret the final quality gates for issue #585.',
      instructions: [
        'Run the listed commands from the repository root. Report each command exactly with exit status and a concise failure summary if it fails.',
        'Confirm the red-phase tests are now green and still exercise durable queue replay, crash recovery, onTrigger error containment, Kubernetes kubectl behavior, resource admission, and telemetry export/redaction.',
        'Inspect git diff for accidental changes outside packages/agent-runtime, directly related docs, and the process files.',
        'Check that no real Kubernetes cluster, network OTLP endpoint, or long-running daemon is required for default tests.',
        'If a gate fails, return passed=false with concrete remediation steps. Do not mark verification passed based on partial success.',
        'Return JSON: { passed: boolean, commands: array, changedFiles: string[], coverageByRequirement: object, failures: array, notes: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'IMPLEMENTATION RESULTS:',
        JSON.stringify(args.implementationResults ?? {}, null, 2),
        '',
        `QUALITY COMMANDS: ${JSON.stringify(args.qualityCommands ?? [])}`,
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-585.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #585 implementation against spec',
  labels: ['issue-585', 'review', 'quality-gate'],
  agent: {
    name: 'agent-runtime-code-reviewer',
    prompt: {
      role: 'senior runtime code reviewer',
      task: 'Review the final issue #585 changes against the issue requirements and verification results.',
      instructions: [
        'Compare the issue context directly to the final diff and tests. Ignore narrative about how the artifacts were built.',
        'Verify durable queue and crash recovery cannot lose queued pending work across daemon restart.',
        'Verify failed triggers are retried/backed off or dead-lettered and onTrigger errors cannot crash the daemon.',
        'Verify Kubernetes execution actually invokes kubectl through a testable seam, polls completion, streams logs, and cleans up.',
        'Verify resource enforcement blocks over-budget work at admission, and telemetry export is opt-in and redacted.',
        'Verify related issue risks are documented without silently implementing unrelated scope.',
        'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, requirementCoverage: object, residualRisks: array, finalSummary: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'ARCHITECTURE:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '',
        'VERIFICATION:',
        JSON.stringify(args.verification ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliveryTask = defineTask('issue-585.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare implementation PR and issue update',
  labels: ['issue-585', 'delivery', 'github'],
  agent: {
    name: 'agent-runtime-delivery-owner',
    prompt: {
      role: 'senior maintainer responsible for PR delivery',
      task: 'Commit the completed issue #585 implementation, open a PR, and comment on the issue.',
      instructions: [
        'Only proceed if verification.passed is true and review.approved is true. Otherwise return success=false and do not commit.',
        'Use branchName from inputs. Do not include unrelated dirty worktree files in the commit.',
        'Stage only files changed for issue #585 plus this process definition and inputs file if present.',
        'Commit with a concise implementation message, push the branch, create a PR against baseBranch, and link to issue #585.',
        'The PR body must summarize implemented behavior and list exact verification commands and outcomes.',
        'Post an issue comment summarizing the implementation, quality gates, residual risks, and PR link.',
        'Return JSON: { success: boolean, commit: string, prUrl: string, issueCommentUrl: string, stagedFiles: string[], notes: string }.',
        '',
        `BRANCH: ${args.branchName}`,
        `BASE: ${args.baseBranch}`,
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        '',
        'VERIFICATION:',
        JSON.stringify(args.verification ?? {}, null, 2),
        '',
        'REVIEW:',
        JSON.stringify(args.review ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 585;
  const branchName = inputs?.branchName ?? 'agent/issue-585';
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const targetFiles = inputs?.targetFiles ?? DEFAULT_TARGET_FILES;
  const qualityCommands = inputs?.qualityCommands ?? DEFAULT_QUALITY_COMMANDS;
  const issueContext = {
    issueNumber,
    title: inputs?.issueContext?.title,
    body: inputs?.issueContext?.body,
    labels: inputs?.issueContext?.labels ?? [],
    comments: inputs?.issueContext?.comments ?? [],
    relatedIssues: inputs?.issueContext?.relatedIssues ?? [604, 590, 592, 593],
  };

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    targetFiles,
  }, { key: 'issue-585.reuse-audit' });

  const architecture = await ctx.task(traceRuntimeTask, {
    issueContext,
    targetFiles,
    reuseAudit,
  }, { key: 'issue-585.architecture' });

  if (architecture?.breakpointNeeded || Number(architecture?.confidence ?? 1) < 0.65) {
    await ctx.breakpoint({
      title: 'Issue #585 architecture review',
      question: 'The runtime architecture confidence is low or scope is ambiguous. Review before implementation continues?',
      context: {
        runId: ctx.runId,
        issueNumber,
        architecture,
        reuseAudit,
      },
      expert: 'owner',
      tags: ['issue-585', 'architecture', 'approval-gate'],
    });
  }

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    issueContext,
    architecture,
  }, { key: 'issue-585.regression-tests' });

  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? 2;
  let verificationFeedback = null;
  let queueRecovery = null;
  let kubernetes = null;
  let resourcesTelemetry = null;
  let verification = null;

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt++) {
    queueRecovery = await ctx.task(implementQueueRecoveryTask, {
      issueContext,
      architecture,
      regressionTests,
      feedback: verificationFeedback,
    }, { key: `issue-585.queue-recovery.${attempt}` });

    kubernetes = await ctx.task(implementKubernetesTask, {
      issueContext,
      architecture,
      regressionTests,
      queueRecovery,
    }, { key: `issue-585.kubernetes.${attempt}` });

    resourcesTelemetry = await ctx.task(implementResourcesTelemetryTask, {
      issueContext,
      architecture,
      regressionTests,
      kubernetes,
    }, { key: `issue-585.resources-telemetry.${attempt}` });

    verification = await ctx.task(verificationTask, {
      issueContext,
      implementationResults: { queueRecovery, kubernetes, resourcesTelemetry },
      qualityCommands,
    }, { key: `issue-585.verification.${attempt}` });

    if (verification?.passed) {
      break;
    }

    verificationFeedback = verification;
  }

  const review = await ctx.task(reviewTask, {
    issueContext,
    architecture,
    verification,
  }, { key: 'issue-585.review' });

  if (!verification?.passed || !review?.approved) {
    await ctx.breakpoint({
      title: 'Issue #585 quality gate failed',
      question: 'Verification or review did not approve the implementation. Review before any delivery step?',
      context: {
        runId: ctx.runId,
        issueNumber,
        verification,
        review,
      },
      expert: 'owner',
      tags: ['issue-585', 'quality-gate', 'approval-gate'],
    });
  }

  const delivery = await ctx.task(deliveryTask, {
    issueContext,
    branchName,
    baseBranch,
    verification,
    review,
  }, { key: 'issue-585.delivery' });

  return {
    success: Boolean(delivery?.success),
    issueNumber,
    branchName,
    baseBranch,
    reuseAudit,
    runtimeCallPaths: architecture?.runtimeCallPaths ?? [],
    architecture,
    regressionTests,
    changedFiles: [
      ...(queueRecovery?.changedFiles ?? []),
      ...(kubernetes?.changedFiles ?? []),
      ...(resourcesTelemetry?.changedFiles ?? []),
    ],
    verification,
    review,
    delivery,
    metadata: {
      processId: 'repo/issue-585-agent-runtime-crash-k8s',
      qualityCommands,
      timestamp: ctx.now(),
    },
  };
}
