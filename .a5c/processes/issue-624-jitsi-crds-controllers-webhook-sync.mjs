/**
 * @process repo/issue-624-jitsi-crds-controllers-webhook-sync
 * @description Implement issue #624: Jitsi resource kinds, controllers, webhook sync, agent bridge, and event integration.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, maxReviewIterations?: number }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, runtimeCallPaths: string[], changedFiles: string[], verification: object, review: object, delivery: object }
 *
 * @process methodologies/spec-kit-brownfield
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process specializations/web-development/restful-api-nodejs
 * @process specializations/qa-testing-automation/api-testing
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function valueOf(result) {
  return result?.value ?? result ?? {};
}

function maybeChangedFiles(...results) {
  return results.flatMap((result) => {
    const value = valueOf(result);
    return Array.isArray(value.changedFiles) ? value.changedFiles : [];
  });
}

const commonIo = (taskCtx) => ({
  inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
  outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
});

const reuseAuditTask = defineTask('issue-624.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - REUSE-AUDIT for Jitsi CRDs, controllers, and webhook sync',
  labels: ['issue-624', 'reuse-audit', 'planning'],
  agent: {
    name: 'jitsi-reuse-auditor',
    prompt: {
      role: 'senior Krate platform engineer',
      task: 'Run the repository reuse audit required before implementing issue #624.',
      instructions: [
        'Do not implement changes in this task.',
        'Read the issue with: gh issue view 624 --json title,body,labels,comments.',
        'Read these spec sources verbatim before drawing conclusions: packages/krate/docs/jitsi/03-crds-and-controllers.md and packages/krate/docs/jitsi/01-architecture.md.',
        'Extract keyword nouns and verbs from the issue and specs.',
        'Search for matching existing infrastructure, including Jitsi-specific code, CRDs, routes, controllers, environment variables, imports, SDK exports, chart manifests, and tests.',
        'Honor .a5c/reuse-audit.json if it exists.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Call out whether there is existing Jitsi runtime implementation or only generic infrastructure that should be reused.',
        'Return JSON: { keywordNouns: string[], keywordVerbs: string[], existingMatches: object[], noMatchingExistingInfrastructure: boolean, reusableInfrastructure: string[], missingInfrastructure: string[], risks: string[] }.',
      ],
      context: {
        issueNumber: args.issueNumber,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const traceRuntimeTask = defineTask('issue-624.trace-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate resource, sync, webhook, event, and agent dispatch paths',
  labels: ['issue-624', 'brownfield', 'runtime-trace'],
  agent: {
    name: 'jitsi-runtime-tracer',
    prompt: {
      role: 'senior Krate architecture maintainer',
      task: 'Trace live code paths and define implementation boundaries for issue #624.',
      instructions: [
        'Do not implement changes in this task.',
        'Use the Phase 0 reuse audit as context, but read source files directly before deciding.',
        'Trace from these entry points to persistence and exports: resource model validation, generic /api/orgs/[org]/resources routes, external sync controller, external webhook controller, event bus, agent dispatch controller, agent mux client, core index exports, SDK exports, and chart CRD manifests.',
        'Identify exact files likely to need edits and exact files that should remain out of scope.',
        'Keep #623 deployment work, #625 web-console UX, and #627 deeper agent runtime work out of scope except for stable integration seams.',
        'Return JSON: { runtimeCallPaths: string[], implementationSurfaces: object[], outOfScope: string[], dependencyNotes: string[], requiresOwnerDecision: boolean, ownerDecisionQuestion?: string, testTargets: string[], verificationCommands: string[] }.',
      ],
      context: {
        issueNumber: args.issueNumber,
        reuseAudit: args.reuseAudit,
        knownSpecSources: args.specSources,
        expectedScope: args.expectedScope,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const prepareBranchTask = defineTask('issue-624.prepare-branch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare issue #624 implementation branch',
  labels: ['issue-624', 'git', 'branch'],
  agent: {
    name: 'jitsi-branch-preparer',
    prompt: {
      role: 'careful Git operator',
      task: 'Prepare the implementation branch for issue #624 without touching unrelated work.',
      instructions: [
        'Inspect current git status before changing branches.',
        `Create or switch to branch ${args.branchName} from ${args.baseBranch}.`,
        'If unrelated dirty files exist, preserve them and do not stage, revert, or overwrite them.',
        'Abort and report a blocker if switching branches would overwrite local changes.',
        'Return JSON: { branchName: string, baseBranch: string, statusSummary: string, unrelatedDirtyFiles: string[], blocker?: string }.',
      ],
      context: {
        issueNumber: args.issueNumber,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const acceptanceTestsTask = defineTask('issue-624.acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author acceptance and unit tests before implementation',
  labels: ['issue-624', 'atdd', 'tests'],
  agent: {
    name: 'jitsi-test-author',
    prompt: {
      role: 'senior Node.js test engineer for Krate core and web APIs',
      task: 'Add focused failing tests for issue #624 before implementing production code.',
      instructions: [
        'Edit the repository directly, but only add or update tests and test fixtures in this task.',
        'Read these spec sources verbatim at runtime before writing tests: packages/krate/docs/jitsi/03-crds-and-controllers.md, packages/krate/docs/jitsi/01-architecture.md, and the full issue #624 body/comments.',
        'Do not redefine acceptance criteria from implementation artifacts. Tests must be derived from the specs and issue only.',
        'Cover all four resource kinds with storage, plural, context, requiredSpec, createResource, validateResource, and schema behavior.',
        'Cover jitsi-meeting-controller.js public methods: validate, createRoom, endRoom, generateParticipantJwt, reconcile, listActiveMeetings, getMeetingStats, startRecording, stopRecording.',
        'Cover jitsi-sync-controller.js normalization, room lifecycle, participant join/left idempotency, recording lifecycle, and monotonic watermark updates.',
        'Cover jitsi-agent-bridge.js capability gating, context preparation, sidecar spec construction, join/left event emission, and non-meeting dispatch regression behavior.',
        'Cover /api/orgs/[org]/jitsi/webhooks/ingest with valid signature, invalid signature, duplicate delivery, room, participant, and recording events.',
        'Include event bus assertions for meeting-created, participant-joined, participant-left, recording-started, and agent-joined-meeting.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], expectedInitialFailures: string[], commandsToRun: string[], acceptanceMatrix: object[] }.',
      ],
      context: {
        issueNumber: args.issueNumber,
        runtimeCallPaths: args.runtimeCallPaths,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const resourceModelTask = defineTask('issue-624.resource-model-and-crds', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Jitsi resource kinds, schemas, exports, and chart CRDs',
  labels: ['issue-624', 'resource-model', 'crds'],
  agent: {
    name: 'jitsi-resource-model-implementer',
    prompt: {
      role: 'senior Krate resource-model maintainer',
      task: 'Implement the four Jitsi CRD resource kinds and associated exports/manifests.',
      instructions: [
        'Edit the repository directly.',
        'Read the issue and Jitsi CRD spec sources verbatim before editing.',
        'Add JitsiMeetProvider and JitsiMeetingTemplate as etcd/config kinds; add JitsiMeeting and JitsiRecording as postgres/aggregated kinds.',
        'Update RESOURCE_DEFINITIONS exactly according to the documented storage, context, plural, purpose, and requiredSpec contracts unless the traced runtime requires a documented compatibility adjustment.',
        'Extend validation field typing only where required by the new requiredSpec fields.',
        'Update core and SDK exports only for new public modules or symbols needed by downstream users.',
        'Add chart CRD manifests in the existing chart style and do not fold #623 Helm deployment values into this task.',
        'Run the relevant test commands yourself and record outcomes.',
        'Return JSON: { changedFiles: string[], summary: string, testsRun: object[], unresolvedRisks: string[] }.',
      ],
      context: {
        acceptanceTests: args.acceptanceTests,
        runtimeTrace: args.runtimeTrace,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const meetingControllerTask = defineTask('issue-624.meeting-controller', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Jitsi meeting lifecycle controller',
  labels: ['issue-624', 'controller', 'meeting-lifecycle'],
  agent: {
    name: 'jitsi-meeting-controller-implementer',
    prompt: {
      role: 'senior backend controller engineer',
      task: 'Implement jitsi-meeting-controller.js using injectable provider clients and resource gateways.',
      instructions: [
        'Edit the repository directly.',
        'Follow the documented controller boundary: own meeting lifecycle, participant tracking, recording management, JWT generation, and room template resolution; do not own Jitsi deployment or media transcoding.',
        'Use dependency injection for provider/resource clients so tests do not require a live Jitsi server.',
        'Validate meeting resources through the shared resource-model path.',
        'Generate short-lived participant JWTs with issuer, audience, room, expiry, and participant context checks. Do not leak secrets into persisted status or logs.',
        'Emit meeting-created and recording-started events through the existing event bus shape.',
        'Keep behavior idempotent where create/end/reconcile may be called repeatedly.',
        'Run focused tests for this slice and record outcomes.',
        'Return JSON: { changedFiles: string[], publicMethods: string[], testsRun: object[], securityNotes: string[], unresolvedRisks: string[] }.',
      ],
      context: {
        previousChanges: args.previousChanges,
        acceptanceTests: args.acceptanceTests,
        runtimeTrace: args.runtimeTrace,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const syncWebhookTask = defineTask('issue-624.sync-and-webhook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Jitsi sync controller and webhook ingest route',
  labels: ['issue-624', 'sync', 'webhook'],
  agent: {
    name: 'jitsi-sync-webhook-implementer',
    prompt: {
      role: 'senior API and sync-controller engineer',
      task: 'Implement jitsi-sync-controller.js and /api/orgs/[org]/jitsi/webhooks/ingest.',
      instructions: [
        'Edit the repository directly.',
        'Follow the existing external/sync-controller.js and external/webhook-controller.js patterns instead of creating a separate sync subsystem.',
        'Normalize Jitsi room, participant, and recording events to stable canonical events.',
        'Process room-created, room-destroyed, participant-joined, participant-left, recording-started, and recording-stopped idempotently.',
        'Validate webhook signatures using timing-safe HMAC checks and reject missing, malformed, invalid, or replayed deliveries.',
        'Persist delivery/sync state through existing resource-shaped patterns where available.',
        'Emit meeting-created, participant-joined, participant-left, and recording-started events through the existing event bus.',
        'Run focused sync/webhook/API route tests and record outcomes.',
        'Return JSON: { changedFiles: string[], normalizedEvents: string[], testsRun: object[], securityNotes: string[], unresolvedRisks: string[] }.',
      ],
      context: {
        previousChanges: args.previousChanges,
        acceptanceTests: args.acceptanceTests,
        runtimeTrace: args.runtimeTrace,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const agentBridgeTask = defineTask('issue-624.agent-bridge', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Jitsi agent bridge and non-meeting dispatch regression guard',
  labels: ['issue-624', 'agent-bridge', 'dispatch'],
  agent: {
    name: 'jitsi-agent-bridge-implementer',
    prompt: {
      role: 'senior Krate agent-dispatch engineer',
      task: 'Implement jitsi-agent-bridge.js and minimal dispatch integration seams.',
      instructions: [
        'Edit the repository directly.',
        'Implement hasMeetingCapability, prepareMeetingContext, buildSidecarSpec, onAgentJoined, and onAgentLeft.',
        'Gate all meeting behavior behind explicit stack capability and meetingRef checks so normal dispatch behavior remains unchanged.',
        'Inject only the Jitsi environment variables and sidecar container spec needed by the issue; leave deeper runtime participation to #627.',
        'Emit agent-joined-meeting on agent join and update participant state through the controller/sync seams.',
        'Add regression tests proving non-meeting dispatch and job generation paths are unchanged.',
        'Run focused agent bridge and dispatch tests and record outcomes.',
        'Return JSON: { changedFiles: string[], integrationPoints: string[], testsRun: object[], unresolvedRisks: string[] }.',
      ],
      context: {
        previousChanges: args.previousChanges,
        acceptanceTests: args.acceptanceTests,
        runtimeTrace: args.runtimeTrace,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const integrationTask = defineTask('issue-624.integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate exports, docs, route wiring, and package surfaces',
  labels: ['issue-624', 'integration', 'exports'],
  agent: {
    name: 'jitsi-integration-finisher',
    prompt: {
      role: 'senior Krate package maintainer',
      task: 'Finish package integration for issue #624 without expanding scope.',
      instructions: [
        'Edit the repository directly.',
        'Update core exports, SDK exports, route imports, chart references, and docs only where needed for the implemented Jitsi backend surfaces to be discoverable and usable.',
        'Ensure public names are consistent: createJitsiMeetingController, createJitsiSyncController, createJitsiAgentBridge, JitsiMeetProvider, JitsiMeetingTemplate, JitsiMeeting, JitsiRecording.',
        'Do not implement #625 management pages or #627 headless Jitsi runtime.',
        'Run relevant build/export checks and record outcomes.',
        'Return JSON: { changedFiles: string[], exportedSymbols: string[], testsRun: object[], unresolvedRisks: string[] }.',
      ],
      context: {
        previousChanges: args.previousChanges,
        runtimeTrace: args.runtimeTrace,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const verificationTask = defineTask('issue-624.verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run verification gates for issue #624',
  labels: ['issue-624', 'quality-gate', 'verification'],
  agent: {
    name: 'jitsi-verification-runner',
    prompt: {
      role: 'senior QA engineer for Krate core and web APIs',
      task: 'Run deterministic verification commands and analyze failures for issue #624.',
      instructions: [
        'Do not add new feature scope in this task. Only fix issues needed to make the requested implementation pass its tests and checks.',
        'Run focused tests added for issue #624 first, then broader Krate checks that are practical in this repo.',
        'Include at minimum the equivalent of npm run build:sdk, npm run test:sdk, npm run verify:metadata, relevant packages/krate/core tests, relevant packages/krate/web route tests if available, and git diff --check.',
        'If a command is unavailable or too broad for the environment, record the exact blocker and run the nearest narrower check.',
        'If verification fails, make tightly scoped fixes and rerun the failing checks.',
        'Return JSON: { passed: boolean, commands: object[], fixesMade: string[], changedFiles: string[], remainingFailures: object[], coverageNotes: string[] }.',
      ],
      context: {
        previousChanges: args.previousChanges,
        acceptanceTests: args.acceptanceTests,
        runtimeTrace: args.runtimeTrace,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const reviewTask = defineTask('issue-624.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final review against issue #624 and Jitsi specs',
  labels: ['issue-624', 'quality-gate', 'review'],
  agent: {
    name: 'jitsi-spec-reviewer',
    prompt: {
      role: 'senior Krate reviewer',
      task: 'Compare the final implementation directly to issue #624 and the Jitsi specs.',
      instructions: [
        'Do not implement new scope unless a blocking correctness issue is found; report such issues precisely.',
        'Read these spec sources verbatim at runtime: full issue #624 body/comments, packages/krate/docs/jitsi/03-crds-and-controllers.md, packages/krate/docs/jitsi/01-architecture.md.',
        'Read the produced git diff and test outputs verbatim before reviewing.',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Verify every requested CRD, controller method, webhook event, signature/dedup behavior, event bus event, export, and non-meeting dispatch regression guard.',
        'Verify that #623, #625, and #627 scope boundaries were not crossed.',
        'Return JSON: { approved: boolean, findings: object[], missingRequirements: string[], residualRisks: string[], requiredFixes: string[] }.',
      ],
      context: {
        verification: args.verification,
        changedFiles: args.changedFiles,
        specSources: args.specSources,
      },
    },
  },
  io: commonIo(taskCtx),
}));

const deliveryTask = defineTask('issue-624.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, create PR, and comment on issue #624',
  labels: ['issue-624', 'delivery', 'github'],
  agent: {
    name: 'jitsi-delivery-agent',
    prompt: {
      role: 'release-minded GitHub operator',
      task: 'Deliver the completed issue #624 implementation through a PR and issue comment.',
      instructions: [
        'Only stage files changed for issue #624. Do not stage unrelated dirty files.',
        `Commit with message: ${args.commitMessage}`,
        `Push branch: ${args.branchName}`,
        `Create a PR against ${args.baseBranch} with title: ${args.prTitle}`,
        'The PR body must link to #624, summarize implementation phases, list verification commands and outcomes, and call out residual risks.',
        'Post a comment on issue #624 with the same concise implementation summary and PR link.',
        'Return JSON: { committed: boolean, commitSha: string, pushed: boolean, prUrl: string, issueCommentUrl: string, stagedFiles: string[] }.',
      ],
      context: {
        issueNumber: args.issueNumber,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        verification: args.verification,
        review: args.review,
        changedFiles: args.changedFiles,
      },
    },
  },
  io: commonIo(taskCtx),
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 624;
  const branchName = inputs?.branchName ?? 'agent/issue-624-jitsi-crds-controllers-webhook-sync';
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const maxReviewIterations = inputs?.maxReviewIterations ?? 2;
  const specSources = inputs?.specSources ?? [
    'packages/krate/docs/jitsi/03-crds-and-controllers.md',
    'packages/krate/docs/jitsi/01-architecture.md',
  ];
  const expectedScope = inputs?.expectedScope ?? [
    'JitsiMeetProvider, JitsiMeetingTemplate, JitsiMeeting, and JitsiRecording resource model and chart CRDs',
    'jitsi-meeting-controller.js',
    'jitsi-sync-controller.js',
    'jitsi-agent-bridge.js',
    '/api/orgs/[org]/jitsi/webhooks/ingest',
    'meeting-created, participant-joined, participant-left, recording-started, and agent-joined-meeting events',
  ];

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueNumber,
    specSources,
  }, { key: 'issue-624.reuse-audit' });

  const runtimeTrace = await ctx.task(traceRuntimeTask, {
    issueNumber,
    reuseAudit: valueOf(reuseAudit),
    specSources,
    expectedScope,
  }, { key: 'issue-624.runtime-trace' });

  const traceValue = valueOf(runtimeTrace);
  if (traceValue.requiresOwnerDecision) {
    await ctx.breakpoint({
      title: 'Issue #624 Scope Decision',
      question: traceValue.ownerDecisionQuestion || 'The runtime trace found an ambiguity or dependency blocker. Approve the proposed mitigation before implementation?',
      context: {
        runId: ctx.runId,
        runtimeTrace: traceValue,
        issueNumber,
      },
      tags: ['scope', 'approval-gate'],
    });
  }

  const branch = await ctx.task(prepareBranchTask, {
    issueNumber,
    branchName,
    baseBranch,
  }, { key: 'issue-624.prepare-branch' });

  const acceptanceTests = await ctx.task(acceptanceTestsTask, {
    issueNumber,
    runtimeCallPaths: traceValue.runtimeCallPaths ?? [],
    specSources,
    branch: valueOf(branch),
  }, { key: 'issue-624.acceptance-tests' });

  const resourceModel = await ctx.task(resourceModelTask, {
    acceptanceTests: valueOf(acceptanceTests),
    runtimeTrace: traceValue,
    specSources,
  }, { key: 'issue-624.resource-model' });

  const meetingController = await ctx.task(meetingControllerTask, {
    previousChanges: valueOf(resourceModel),
    acceptanceTests: valueOf(acceptanceTests),
    runtimeTrace: traceValue,
    specSources,
  }, { key: 'issue-624.meeting-controller' });

  const syncWebhook = await ctx.task(syncWebhookTask, {
    previousChanges: [valueOf(resourceModel), valueOf(meetingController)],
    acceptanceTests: valueOf(acceptanceTests),
    runtimeTrace: traceValue,
    specSources,
  }, { key: 'issue-624.sync-webhook' });

  const agentBridge = await ctx.task(agentBridgeTask, {
    previousChanges: [valueOf(resourceModel), valueOf(meetingController), valueOf(syncWebhook)],
    acceptanceTests: valueOf(acceptanceTests),
    runtimeTrace: traceValue,
    specSources,
  }, { key: 'issue-624.agent-bridge' });

  const integration = await ctx.task(integrationTask, {
    previousChanges: [valueOf(resourceModel), valueOf(meetingController), valueOf(syncWebhook), valueOf(agentBridge)],
    runtimeTrace: traceValue,
    specSources,
  }, { key: 'issue-624.integration' });

  let changedFiles = maybeChangedFiles(acceptanceTests, resourceModel, meetingController, syncWebhook, agentBridge, integration);
  let verification = await ctx.task(verificationTask, {
    previousChanges: [valueOf(resourceModel), valueOf(meetingController), valueOf(syncWebhook), valueOf(agentBridge), valueOf(integration)],
    acceptanceTests: valueOf(acceptanceTests),
    runtimeTrace: traceValue,
  }, { key: 'issue-624.verification.1' });
  changedFiles = maybeChangedFiles(acceptanceTests, resourceModel, meetingController, syncWebhook, agentBridge, integration, verification);

  let review = await ctx.task(reviewTask, {
    verification: valueOf(verification),
    changedFiles,
    specSources,
  }, { key: 'issue-624.review.1' });

  for (let attempt = 2; attempt <= maxReviewIterations && valueOf(review).approved === false; attempt += 1) {
    const requiredFixes = valueOf(review).requiredFixes ?? [];
    if (requiredFixes.length === 0) break;

    verification = await ctx.task(verificationTask, {
      previousChanges: [valueOf(verification), valueOf(review)],
      acceptanceTests: valueOf(acceptanceTests),
      runtimeTrace: traceValue,
    }, { key: `issue-624.verification.${attempt}` });
    changedFiles = maybeChangedFiles(acceptanceTests, resourceModel, meetingController, syncWebhook, agentBridge, integration, verification);
    review = await ctx.task(reviewTask, {
      verification: valueOf(verification),
      changedFiles,
      specSources,
    }, { key: `issue-624.review.${attempt}` });
  }

  if (valueOf(review).approved === false) {
    return {
      success: false,
      phases: ['reuse-audit', 'runtime-trace', 'prepare-branch', 'acceptance-tests', 'resource-model', 'meeting-controller', 'sync-webhook', 'agent-bridge', 'integration', 'verification', 'review'],
      reuseAudit: valueOf(reuseAudit),
      runtimeCallPaths: traceValue.runtimeCallPaths ?? [],
      changedFiles,
      verification: valueOf(verification),
      review: valueOf(review),
    };
  }

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    branchName,
    baseBranch,
    commitMessage: 'feat(krate): add jitsi crds controllers and webhook sync',
    prTitle: 'Implement Jitsi CRDs controllers and webhook sync',
    verification: valueOf(verification),
    review: valueOf(review),
    changedFiles,
  }, { key: 'issue-624.delivery' });

  return {
    success: true,
    phases: ['reuse-audit', 'runtime-trace', 'prepare-branch', 'acceptance-tests', 'resource-model', 'meeting-controller', 'sync-webhook', 'agent-bridge', 'integration', 'verification', 'review', 'delivery'],
    reuseAudit: valueOf(reuseAudit),
    runtimeCallPaths: traceValue.runtimeCallPaths ?? [],
    changedFiles,
    verification: valueOf(verification),
    review: valueOf(review),
    delivery: valueOf(delivery),
  };
}
