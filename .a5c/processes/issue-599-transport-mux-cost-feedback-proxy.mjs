/**
 * @process repo/issue-599-transport-mux-cost-feedback-proxy
 * @description Implement issue #599: transport-mux cost feedback, session-aware proxy context, codec plugin discovery, and shared tool schema normalization.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, relatedIssues?: number[], scorecardGate?: string }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, architecture: object, tests: object, implementation: object, verification: object, reviews: object, delivery: object }
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/shared/root-cause-diagnosis
 * @process specializations/sdk-platform-development/custom-transport-middleware
 * @process specializations/sdk-platform-development/plugin-extension-architecture
 * @process specializations/sdk-platform-development/observability-integration
 * @agent proxy-expert specializations/network-programming/agents/proxy-expert/AGENT.md
 * @agent protocol-expert specializations/network-programming/agents/protocol-expert/AGENT.md
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent extensibility-architect specializations/sdk-platform-development/agents/extensibility-architect/AGENT.md
 * @agent telemetry-privacy-auditor specializations/sdk-platform-development/agents/telemetry-privacy-auditor/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskValue(result) {
  return result?.result ?? result?.value ?? result ?? {};
}

const commonContext = {
  repository: 'a5c-ai/babysitter',
  planningNotes: [
    'This is a brownfield integration task. Preserve unrelated worktree changes.',
    'Do not use the babysit skill inside delegated tasks.',
    'Before editing source, read issue #599, its comments and labels, docs/agent-layer-gaps.md, and the files on the live runtime paths.',
    'Treat #578 and #591 as related context, not as scope expansions unless the issue text requires it.',
    'Keep breakpoints sparse; pause only for ambiguous architecture decisions or final owner acceptance.',
  ],
};

export const reuseAuditTask = defineTask('issue-599.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse-audit findings',
  labels: ['issue-599', 'phase-0', 'reuse-audit', 'transport-mux'],
  agent: {
    name: 'transport-mux-reuse-auditor',
    prompt: {
      role: 'senior TypeScript platform maintainer',
      task: 'Render "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" for issue #599 before any design or implementation work.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        baseBranch: args.baseBranch,
        keywords: [
          'transport-mux',
          'cost feedback',
          'COST_TRACKED',
          'session-aware proxy',
          'runId',
          'sessionId',
          'trace context',
          'codec discovery',
          'plugin registry',
          'tool schema normalization',
          'scorecard:migration',
        ],
        likelyScanTargets: [
          '.a5c/reuse-audit.json',
          'docs/agent-layer-gaps.md',
          'packages/transport-mux',
          'packages/sdk/src/cost',
          'packages/agent-runtime/src/session',
          'packages/agent-mux/launch',
          'packages/tool-mux/src/schema-translation.ts',
          'plugins',
        ],
      },
      instructions: [
        'Read the issue with comments and labels using gh before summarizing anything.',
        'If .a5c/reuse-audit.json exists, follow its scan globs and keyword extraction rules.',
        'Extract keyword nouns and verbs from the issue and scan for matching existing routes, APIs, env vars, SDK helpers, imports, tests, plugin metadata, and migration gates.',
        'Report exact existing infrastructure to reuse. Do not propose new infrastructure when an existing surface can be extended.',
        'Explicitly call out "No matching existing infrastructure found" for any area where the scan finds nothing relevant.',
        'Return JSON with: issueTitle, labels, relatedIssues, findingsMarkdown, reusableSurfaces, missingSurfaces, liveRuntimeEntryPoints, recommendedNextPhaseInputs.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['findingsMarkdown', 'reusableSurfaces', 'missingSurfaces', 'liveRuntimeEntryPoints'],
      properties: {
        issueTitle: { type: 'string' },
        labels: { type: 'array' },
        relatedIssues: { type: 'array' },
        findingsMarkdown: { type: 'string' },
        reusableSurfaces: { type: 'array' },
        missingSurfaces: { type: 'array' },
        liveRuntimeEntryPoints: { type: 'array' },
        recommendedNextPhaseInputs: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const architectureTask = defineTask('issue-599.architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1 - Trace runtime paths and design contracts',
  labels: ['issue-599', 'phase-1', 'architecture', 'runtime-call-paths'],
  agent: {
    name: 'transport-mux-architecture-planner',
    prompt: {
      role: 'senior SDK and proxy architecture engineer',
      task: 'Design the implementation architecture for issue #599 after tracing live transport-mux runtime paths.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        reuseAudit: args.reuseAudit,
        requiredRuntimePaths: [
          'packages/transport-mux/src/server.ts',
          'packages/transport-mux/src/runtime.ts',
          'packages/transport-mux/src/config.ts',
          'packages/transport-mux/src/types.ts',
          'packages/transport-mux/src/codec.ts',
          'packages/transport-mux/src/codecs/index.ts',
          'packages/transport-mux/src/engines',
          'packages/agent-mux/launch/src/launch.ts',
          'packages/sdk/src/cost/journal.ts',
          'packages/agent-runtime/src/session/cost.ts',
          'packages/tool-mux/src/schema-translation.ts',
          'packages/transport-mux/scripts/migration-scorecard.mjs',
        ],
      },
      instructions: [
        'Do not edit files in this phase.',
        'Trace the live request path from agent-mux launch through transport-mux runtime/app/server, HTTP routes, WebSocket route, codec lookup, completion engine, metrics, and SDK cost journal surface.',
        'Design a narrow injected cost/event sink for transport-mux. Do not couple transport-mux to private SDK journal internals.',
        'Design request context propagation for runId, sessionId, trace/correlation IDs, and internal headers/env. Avoid forwarding orchestration metadata upstream unless explicitly allowed.',
        'Design pluggable codec discovery/registration backed by explicit descriptors or plugin metadata. Include duplicate, alias, unknown codec, and deterministic load-order behavior.',
        'Design how tool-mux schema translation and transport-mux codec normalization should share one canonical conversion path without circular package coupling.',
        'Identify any owner decision that must be made before implementation. Prefer a default if the repo already implies one.',
        'Return JSON with: runtimeCallPaths, proposedContracts, filePlan, testMatrix, migrationScorecardImpact, privacyAndLeakageControls, ownerDecisionNeeded, ownerQuestion, risks.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'proposedContracts', 'filePlan', 'testMatrix', 'ownerDecisionNeeded', 'risks'],
      properties: {
        runtimeCallPaths: { type: 'array' },
        proposedContracts: { type: 'object' },
        filePlan: { type: 'array' },
        testMatrix: { type: 'array' },
        migrationScorecardImpact: { type: 'object' },
        privacyAndLeakageControls: { type: 'array' },
        ownerDecisionNeeded: { type: 'boolean' },
        ownerQuestion: { type: 'string' },
        risks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const testAuthoringTask = defineTask('issue-599.test-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2 - Author regression tests from issue text',
  labels: ['issue-599', 'phase-2', 'tdd', 'tests'],
  agent: {
    name: 'transport-mux-test-author',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Author deterministic tests for issue #599 before implementation.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        architecture: args.architecture,
      },
      instructions: [
        'Read issue #599 and comments again at runtime before writing tests.',
        'Do not infer acceptance criteria from implementation files. Tests must be anchored to the issue and architecture output.',
        'Add focused tests before implementation for buffered and streaming cost emission, session/request context propagation, codec registration/discovery, and shared tool schema conversion.',
        'Cover OpenAI Chat, OpenAI Responses HTTP and WebSocket streaming, Anthropic, Google/Vertex, Bedrock, Azure, and passthrough behavior where the route exists.',
        'Assert cost is emitted exactly once per usage-bearing completion or stream done event, and that passthrough remains metrics-only unless usage parsing is implemented.',
        'Assert orchestration metadata is available to sinks/traces and is not forwarded upstream by default.',
        'Keep tests deterministic and free of live provider credentials.',
        'Run the targeted test commands you added or changed and record failures expected before implementation.',
        'Return JSON with: testsAdded, testsChanged, expectedRedFailures, commandsRun, commandResults, coverageByCriterion, unresolvedSpecGaps.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['testsAdded', 'commandsRun', 'coverageByCriterion', 'unresolvedSpecGaps'],
      properties: {
        testsAdded: { type: 'array' },
        testsChanged: { type: 'array' },
        expectedRedFailures: { type: 'array' },
        commandsRun: { type: 'array' },
        commandResults: { type: 'array' },
        coverageByCriterion: { type: 'object' },
        unresolvedSpecGaps: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementationTask = defineTask('issue-599.implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3 - Implement cost, context, codec, and schema integration',
  labels: ['issue-599', 'phase-3', 'implementation', 'transport-mux'],
  agent: {
    name: 'transport-mux-implementer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Implement issue #599 against the tests and architecture.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        branchName: args.branchName,
        architecture: args.architecture,
        tests: args.tests,
      },
      instructions: [
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Work in small slices: cost sink contract, request context contract, runtime/agent-mux propagation, codec registry discovery, tool schema sharing, docs/metadata if behavior changes.',
        'Use existing package patterns and public exports. Avoid new dependencies unless the repo already uses them for the same purpose.',
        'Keep transport-mux decoupled from SDK private journal code by exposing an injected sink and wiring SDK journal integration at the launch/runtime boundary.',
        'Handle streaming and buffered completions without double-counting. Include WebSocket streaming if the route emits usage-bearing done events.',
        'Redact or strip internal metadata before upstream passthrough by default.',
        'Update scorecard/migration-facing docs or metadata only if required to keep provisional cutover truthful.',
        'Run the focused tests during implementation and iterate until the issue-specific suite is green.',
        'Return JSON with: changedFiles, implementedContracts, costEmissionBehavior, contextPropagationBehavior, codecDiscoveryBehavior, schemaSharingBehavior, commandsRun, residualRisks.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'implementedContracts', 'commandsRun', 'residualRisks'],
      properties: {
        changedFiles: { type: 'array' },
        implementedContracts: { type: 'object' },
        costEmissionBehavior: { type: 'object' },
        contextPropagationBehavior: { type: 'object' },
        codecDiscoveryBehavior: { type: 'object' },
        schemaSharingBehavior: { type: 'object' },
        commandsRun: { type: 'array' },
        residualRisks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verificationTask = defineTask('issue-599.verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4 - Run integration and quality gates',
  labels: ['issue-599', 'phase-4', 'verification', 'quality-gate'],
  agent: {
    name: 'transport-mux-verifier',
    prompt: {
      role: 'release-quality engineer',
      task: 'Run the deterministic verification gates for issue #599 and summarize exact outcomes.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        implementation: args.implementation,
        requiredCommands: args.requiredCommands,
      },
      instructions: [
        'Run targeted transport-mux tests covering codecs, server routes, runtime, transport routes, passthrough, and WebSocket behavior.',
        'Run package build checks for transport-mux and any package whose public contract changed.',
        'Run the repo quick commands when practical: npm run build:sdk, npm run test:sdk, npm run verify:metadata.',
        'Run or inspect the transport-mux migration scorecard gate named in inputs when practical.',
        'Run git diff --check and inspect git status.',
        'Do not mark verification green if any command failed, was skipped without a concrete reason, or required live provider credentials.',
        'Return JSON with: passed, commandsRun, commandResults, skippedCommands, failures, changedFiles, riskNotes.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commandsRun', 'failures', 'changedFiles'],
      properties: {
        passed: { type: 'boolean' },
        commandsRun: { type: 'array' },
        commandResults: { type: 'array' },
        skippedCommands: { type: 'array' },
        failures: { type: 'array' },
        changedFiles: { type: 'array' },
        riskNotes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const architectureReviewTask = defineTask('issue-599.architecture-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5a - Architecture and privacy review',
  labels: ['issue-599', 'phase-5', 'review', 'architecture', 'privacy'],
  agent: {
    name: 'transport-mux-architecture-reviewer',
    prompt: {
      role: 'senior platform architecture and telemetry privacy reviewer',
      task: 'Review the implemented issue #599 architecture for coupling, leakage, double-counting, and plugin safety.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        architecture: args.architecture,
        implementation: args.implementation,
        verification: args.verification,
      },
      instructions: [
        'Read the changed files and relevant tests directly.',
        'Verify transport-mux uses a narrow injected cost/event sink instead of private SDK journal imports.',
        'Verify request context metadata is redacted from upstream requests by default.',
        'Verify cost events cannot be emitted twice for one buffered completion or one stream done event.',
        'Verify codec plugin registration/discovery is deterministic and rejects or reports duplicate/unknown codecs predictably.',
        'Verify schema translation avoids circular dependency problems and keeps tool-mux and transport-mux behavior consistent.',
        'Return JSON with: approved, findings, requiredFixes, residualRisks.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'requiredFixes', 'residualRisks'],
      properties: {
        approved: { type: 'boolean' },
        findings: { type: 'array' },
        requiredFixes: { type: 'array' },
        residualRisks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const acceptanceReviewTask = defineTask('issue-599.acceptance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5b - Acceptance review against issue',
  labels: ['issue-599', 'phase-5', 'review', 'acceptance'],
  agent: {
    name: 'transport-mux-acceptance-reviewer',
    prompt: {
      role: 'issue acceptance reviewer',
      task: 'Compare the final artifacts directly against issue #599 and report whether the implementation is ready for PR.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        reuseAudit: args.reuseAudit,
        architecture: args.architecture,
        tests: args.tests,
        implementation: args.implementation,
        verification: args.verification,
        architectureReview: args.architectureReview,
      },
      instructions: [
        'Re-read issue #599, all comments, and labels at runtime.',
        'Inspect the final diff and verification outputs.',
        'Compare issue requirements to artifacts directly. Ignore any narrative in prior context about how artifacts were built.',
        'Reject if any of the three major gaps is only documented but not implemented, unless the issue explicitly allowed staging that slice.',
        'Reject if tests do not cover cost feedback, session-aware tracing, codec plugin discovery, and schema normalization sharing.',
        'Return JSON with: approved, criterionStatus, missingWork, testGaps, prSummary, issueCommentSummary.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'criterionStatus', 'missingWork', 'testGaps', 'prSummary', 'issueCommentSummary'],
      properties: {
        approved: { type: 'boolean' },
        criterionStatus: { type: 'object' },
        missingWork: { type: 'array' },
        testGaps: { type: 'array' },
        prSummary: { type: 'string' },
        issueCommentSummary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliveryTask = defineTask('issue-599.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6 - Commit, push, PR, and issue comment',
  labels: ['issue-599', 'phase-6', 'delivery', 'github'],
  agent: {
    name: 'transport-mux-delivery-coordinator',
    prompt: {
      role: 'release delivery engineer',
      task: 'Prepare the issue #599 implementation branch for review.',
      context: {
        ...commonContext,
        issueNumber: args.issueNumber,
        baseBranch: args.baseBranch,
        branchName: args.branchName,
        acceptanceReview: args.acceptanceReview,
        verification: args.verification,
      },
      instructions: [
        'Only proceed if acceptanceReview.approved and verification.passed are both true.',
        'Inspect git status and stage only files changed for issue #599.',
        'Commit with a concise conventional commit message.',
        'Push the implementation branch.',
        'Create a PR against the configured base branch. Link to #599 in the PR body.',
        'Post a comment on #599 summarizing implemented phases, verification, residual risks, and the PR link.',
        'Return JSON with: delivered, commitSha, prUrl, issueCommentUrl, skippedReason.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['delivered'],
      properties: {
        delivered: { type: 'boolean' },
        commitSha: { type: 'string' },
        prUrl: { type: 'string' },
        issueCommentUrl: { type: 'string' },
        skippedReason: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 599;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const branchName = inputs?.branchName ?? 'agent/issue-599-transport-mux-cost-feedback-proxy';
  const requiredCommands = inputs?.requiredCommands ?? [
    'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/transport-mux/src/__tests__/codecs.test.ts packages/transport-mux/tests/server.test.ts packages/transport-mux/tests/runtime.test.ts packages/transport-mux/tests/transports/anthropic.test.ts packages/transport-mux/tests/transports/openai-chat.test.ts packages/transport-mux/tests/transports/openai-responses.test.ts packages/transport-mux/tests/transports/google.test.ts packages/transport-mux/tests/transports/vertex-native.test.ts packages/transport-mux/tests/transports/bedrock-converse.test.ts packages/transport-mux/tests/transports/azure-foundry.test.ts packages/transport-mux/tests/transports/passthrough.test.ts',
    'npm run build --workspace=@a5c-ai/transport-mux',
    'npm run build:sdk',
    'npm run test:sdk',
    'npm run verify:metadata',
    'node packages/transport-mux/scripts/migration-scorecard.mjs',
    'git diff --check',
  ];

  const reuseAudit = taskValue(await ctx.task(reuseAuditTask, {
    issueNumber,
    baseBranch,
  }, {
    key: 'issue-599.reuse-audit',
  }));

  const architecture = taskValue(await ctx.task(architectureTask, {
    issueNumber,
    baseBranch,
    reuseAudit,
  }, {
    key: 'issue-599.architecture',
  }));

  if (architecture.ownerDecisionNeeded) {
    const decision = await ctx.breakpoint('issue-599.architecture-decision', {
      question: architecture.ownerQuestion || 'Issue #599 architecture requires an owner decision before implementation. Approve the recommended default?',
      context: {
        issueNumber,
        architecture,
      },
      expert: 'owner',
      tags: ['architecture', 'approval-gate', 'issue-599'],
    });

    if (!decision?.approved) {
      return {
        success: false,
        phases: ['reuse-audit', 'architecture'],
        reuseAudit,
        architecture,
        blockedReason: 'Architecture decision was not approved.',
      };
    }
  }

  const tests = taskValue(await ctx.task(testAuthoringTask, {
    issueNumber,
    architecture,
  }, {
    key: 'issue-599.tests',
  }));

  const implementation = taskValue(await ctx.task(implementationTask, {
    issueNumber,
    branchName,
    architecture,
    tests,
  }, {
    key: 'issue-599.implementation',
  }));

  const verification = taskValue(await ctx.task(verificationTask, {
    issueNumber,
    implementation,
    requiredCommands,
  }, {
    key: 'issue-599.verification',
  }));

  const architectureReview = taskValue(await ctx.task(architectureReviewTask, {
    issueNumber,
    architecture,
    implementation,
    verification,
  }, {
    key: 'issue-599.architecture-review',
  }));

  const acceptanceReview = taskValue(await ctx.task(acceptanceReviewTask, {
    issueNumber,
    reuseAudit,
    architecture,
    tests,
    implementation,
    verification,
    architectureReview,
  }, {
    key: 'issue-599.acceptance-review',
  }));

  const approved = Boolean(
    verification.passed
    && architectureReview.approved
    && acceptanceReview.approved,
  );

  const delivery = taskValue(await ctx.task(deliveryTask, {
    issueNumber,
    baseBranch,
    branchName,
    acceptanceReview,
    verification,
  }, {
    key: 'issue-599.delivery',
  }));

  return {
    success: approved && delivery.delivered !== false,
    phases: [
      'reuse-audit',
      'architecture',
      'test-authoring',
      'implementation',
      'verification',
      'architecture-review',
      'acceptance-review',
      'delivery',
    ],
    reuseAudit,
    architecture,
    tests,
    implementation,
    verification,
    reviews: {
      architectureReview,
      acceptanceReview,
    },
    delivery,
  };
}
