/**
 * @process repo/issue-624-jitsi-crds-controllers-webhook-sync
 * @description Implement issue #624: complete Jitsi CRDs, core controllers, webhook sync, agent bridge, and event integration.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxImplementationAttempts?: number, specFiles: string[], currentBaselineHints?: object }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, gapAnalysis: object, changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/README.md
 * - /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/tdd-triplet.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/reference/ADVANCED_PATTERNS.md
 * - packages/krate/docs/jitsi/03-crds-and-controllers.md
 * - packages/krate/docs/jitsi/01-architecture.md
 *
 * The active process-library root for this environment is:
 * /home/runner/.a5c/process-library/babysitter-repo/library
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_ATTEMPTS = 3;

const io = (taskCtx) => ({
  inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
  outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
});

function unwrap(result) {
  return result?.value ?? result ?? {};
}

function changedFilesFrom(...results) {
  return [...new Set(results.flatMap((result) => {
    const value = unwrap(result);
    return Array.isArray(value.changedFiles) ? value.changedFiles : [];
  }))];
}

function specReadInstructions(args) {
  const specFiles = args.inputs?.specFiles ?? args.specFiles ?? [];
  return [
    'Before making task decisions, reread the authoritative sources directly in this execution:',
    `- Run: gh issue view ${args.inputs?.issueNumber ?? args.issueNumber} --json title,body,labels,comments`,
    `- Attempt: gh pr view ${args.inputs?.issueNumber ?? args.issueNumber} --json files,title,body,comments`,
    ...specFiles.map((file) => `- Read spec file: ${file}`),
    'Treat those freshly read issue/spec bytes as authoritative over any summary in task context.',
  ];
}

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readAuthoritativeIssueContextTask, inputs, {
    key: 'issue-624.read-authoritative-context',
  });

  const reuseAudit = await ctx.task(runReuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-624.phase-0-reuse-audit',
  });

  const gapAnalysis = await ctx.task(traceCurrentImplementationGapsTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-624.trace-current-gaps',
  });

  if (unwrap(gapAnalysis).needsOwnerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #624 Scope Decision',
      question: unwrap(gapAnalysis).ownerDecisionQuestion,
      options: ['Proceed with mocked provider contracts', 'Pause for dependency or scope clarification'],
      expert: 'owner',
      tags: ['issue-624', 'jitsi', 'scope-gate'],
      context: {
        issueNumber: inputs.issueNumber,
        gapAnalysis,
      },
    });
  }

  const acceptanceTests = await ctx.task(authorSpecDrivenTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    gapAnalysis,
  }, {
    key: 'issue-624.author-tests-first',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];
  const maxAttempts = inputs.maxImplementationAttempts ?? DEFAULT_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementMissingJitsiCoreTask, {
      inputs,
      issueContext,
      reuseAudit,
      gapAnalysis,
      acceptanceTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-624.implementation.${attempt}`,
    });

    verification = await ctx.task(runQualityGatesTask, {
      inputs,
      issueContext,
      gapAnalysis,
      acceptanceTests,
      implementation,
      attempt,
    }, {
      key: `issue-624.quality-gates.${attempt}`,
    });

    review = await ctx.task(reviewAgainstSpecTask, {
      inputs,
      issueContext,
      reuseAudit,
      gapAnalysis,
      acceptanceTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-624.spec-security-review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (unwrap(verification).passed === true && unwrap(review).approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalDeliveryGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    gapAnalysis,
    acceptanceTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-624.final-delivery-gate',
  });

  return {
    success: unwrap(finalGate).passed === true,
    phases: [
      'authoritative-issue-context',
      'phase-0-reuse-audit',
      'current-implementation-gap-trace',
      'tests-first',
      'implementation-loop',
      'quality-gates',
      'spec-security-review',
      'final-delivery-gate',
    ],
    reuseAudit: unwrap(reuseAudit),
    gapAnalysis: unwrap(gapAnalysis),
    changedFiles: changedFilesFrom(acceptanceTests, implementation),
    verification: unwrap(verification),
    review: unwrap(review),
    attempts,
    finalGate: unwrap(finalGate),
  };
}

export const readAuthoritativeIssueContextTask = defineTask('issue-624.read-authoritative-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #624, comments, labels, and Jitsi specs',
  labels: ['issue-624', 'jitsi', 'research'],
  agent: {
    name: 'jitsi-context-reader',
    prompt: {
      role: 'senior Krate platform engineer',
      task: 'Build the authoritative implementation context for issue #624 before any code edits.',
      instructions: [
        `Run and preserve: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Attempt PR detection with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read every file listed in inputs.specFiles. Treat packages/krate/docs/jitsi/03-crds-and-controllers.md as the primary source for CRDs and controllers.',
        'Read the latest issue comments carefully. If prior plan or implementation PRs are mentioned, capture their status and do not assume they landed correctly.',
        'Extract acceptance criteria, dependencies, non-goals, security-sensitive requirements, and comments that change the current scope.',
        'Return JSON: { title, labels, comments, isPullRequest, prContext, specFilesRead, acceptanceCriteria, dependencies, nonGoals, securityRequirements, eventTypes, controllerContracts, webhookContracts, ambiguities }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const runReuseAuditTask = defineTask('issue-624.phase-0-reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - REUSE-AUDIT for Jitsi backend surfaces',
  labels: ['issue-624', 'reuse-audit', 'brownfield'],
  agent: {
    name: 'jitsi-reuse-auditor',
    prompt: {
      role: 'senior brownfield architecture investigator',
      task: 'Run the mandatory reuse audit before proposing new infrastructure or edits.',
      instructions: [
        'Do not implement changes in this task.',
        ...specReadInstructions(args),
        'Extract keyword nouns and verbs from the issue and specs: Jitsi, meeting, provider, template, recording, participant, webhook, ingest, HMAC, dedup, JWT, room, sync, watermark, sidecar, event bus, dispatch.',
        'Check for .a5c/reuse-audit.json. If absent, say so explicitly and use repo-wide Krate globs.',
        'Scan for matching migrations, API routes, environment variables, package exports, imports, SDK dependencies, resource kinds, CRD manifests, controllers, tests, and docs.',
        'Render a top-level section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Separate direct Jitsi implementation already present from adjacent infrastructure that should be reused.',
        'Pay special attention to existing resource-model Jitsi entries, web Jitsi routes, MCP tools, generic external sync/webhook controllers, event bus APIs, agent dispatch, agent mux, chart CRDs, and tests.',
        'Return JSON: { heading, keywords, configFound, directMatches, adjacentInfrastructure, missingOrPartialSurfaces, reuseRecommendations, risks }.',
        'Use ISSUE_CONTEXT as source material:',
        JSON.stringify(args.issueContext, null, 2),
      ],
    },
  },
  io: io(taskCtx),
}));

export const traceCurrentImplementationGapsTask = defineTask('issue-624.trace-current-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace current Jitsi implementation gaps against the issue contract',
  labels: ['issue-624', 'runtime-trace', 'gap-analysis'],
  agent: {
    name: 'jitsi-runtime-tracer',
    prompt: {
      role: 'senior Krate architecture maintainer',
      task: 'Trace the live code paths and produce an exact gap map for issue #624.',
      instructions: [
        'Do not implement changes in this task.',
        ...specReadInstructions(args),
        'Start from the reuse audit and read source files directly. Do not rely only on filenames or tests.',
        'Trace resource-model definitions, generic resource APIs, Jitsi web service helpers, /api/orgs/[org]/jitsi routes, external/sync-controller.js, external/webhook-controller.js, event-bus.js, agent-dispatch-controller.js, agent-mux-client.js, core and SDK exports, chart CRD manifests, and package tests.',
        'Classify each requested surface as complete, partial, missing, or out of scope: JitsiMeetProvider, JitsiMeetingTemplate, JitsiMeeting, JitsiRecording, chart CRDs, jitsi-meeting-controller.js, jitsi-sync-controller.js, jitsi-agent-bridge.js, webhook ingest, event bus events, and package exports.',
        'Confirm whether current web/CLI Jitsi code is issue #625/#627 work that should remain compatible but not drive this issue beyond its backend/platform scope.',
        'Return JSON: { baselineSummary, runtimeCallPaths, gapMatrix, implementationSurfaces, filesLikelyToEdit, filesToAvoid, dependencyNotes, needsOwnerDecision, ownerDecisionQuestion, testTargets, verificationCommands }.',
      ],
      context: {
        currentBaselineHints: args.inputs.currentBaselineHints,
        reuseAudit: args.reuseAudit,
      },
    },
  },
  io: io(taskCtx),
}));

export const authorSpecDrivenTestsTask = defineTask('issue-624.author-tests-first', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author acceptance and unit tests before production edits',
  labels: ['issue-624', 'atdd', 'tests'],
  agent: {
    name: 'jitsi-test-author',
    prompt: {
      role: 'senior Node.js test engineer for Krate core and web APIs',
      task: 'Add or repair focused failing tests for the missing issue #624 contract before production edits.',
      instructions: [
        'Edit the repository directly, but only add or update tests and test fixtures in this task.',
        ...specReadInstructions(args),
        'Base tests on the issue, comments, and Jitsi specs, not on the current implementation shortcuts.',
        'Where a surface already has tests, strengthen them instead of duplicating shallow structure checks.',
        'Cover all four resource kinds for storage, context, plural, requiredSpec, validation, and schema behavior.',
        'Cover jitsi-meeting-controller.js methods: validate, createRoom, endRoom, generateParticipantJwt, reconcile, listActiveMeetings, getMeetingStats, startRecording, and stopRecording.',
        'Cover jitsi-sync-controller.js normalization, room created/destroyed, participant joined/left idempotency, recording started/stopped, and monotonic watermark behavior.',
        'Cover jitsi-agent-bridge.js capability gating, meeting context preparation, sidecar spec construction, join/left event handling, and non-meeting dispatch regression behavior.',
        'Cover /api/orgs/[org]/jitsi/webhooks/ingest with valid signature, missing signature, malformed signature, invalid signature, duplicate delivery, invalid JSON, room, participant, and recording events.',
        'Assert event bus emissions for meeting-created, participant-joined, participant-left, recording-started, and agent-joined-meeting.',
        'Return JSON: { changedFiles, testsAddedOrUpdated, acceptanceMatrix, expectedInitialFailures, commandsToRun, blockers }.',
      ],
      context: {
        issueContext: args.issueContext,
        gapAnalysis: args.gapAnalysis,
      },
    },
  },
  io: io(taskCtx),
}));

export const implementMissingJitsiCoreTask = defineTask('issue-624.implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement missing Jitsi core controllers, webhook sync, events, exports, and manifests',
  labels: ['issue-624', 'implementation', 'krate-core'],
  agent: {
    name: 'jitsi-core-implementer',
    prompt: {
      role: 'senior Krate backend/platform engineer',
      task: 'Implement only the missing or partial issue #624 backend/platform contract, preserving existing working Jitsi surfaces.',
      instructions: [
        'Edit the repository directly.',
        ...specReadInstructions(args),
        `This is implementation attempt ${args.attempt}. Start by reading previous verification and review feedback if present.`,
        'Respect the gap matrix. Do not rewrite completed Jitsi web console or MCP features unless a backend contract break requires a small compatibility fix.',
        'Complete resource model, schema, chart CRD, and package export gaps for JitsiMeetProvider, JitsiMeetingTemplate, JitsiMeeting, and JitsiRecording.',
        'Implement createJitsiMeetingController in packages/krate/core/src/jitsi-meeting-controller.js with injectable provider, resource, clock, JWT signer, and event bus dependencies.',
        'Implement createJitsiSyncController in packages/krate/core/src/jitsi-sync-controller.js by following the generic external sync-controller pattern for normalized events, idempotent upserts, participant/recording state, and watermarks.',
        'Implement createJitsiAgentBridge in packages/krate/core/src/jitsi-agent-bridge.js with explicit jitsiCapability and meetingRef gating, meeting context preparation, sidecar spec building, and agent join/left hooks.',
        'Harden /api/orgs/[org]/jitsi/webhooks/ingest so it uses timing-safe signature validation, delivery deduplication/replay protection, event normalization, and delegates persistence to the Jitsi sync/controller layer.',
        'Emit or persist meeting-created, participant-joined, participant-left, recording-started, and agent-joined-meeting using the existing event bus shape.',
        'Keep #623 Jitsi Helm deployment, #625 web console UX, and #627 deep agent meeting runtime outside this patch except for stable integration seams.',
        'Do not stage unrelated dirty files. Preserve user changes.',
        'Return JSON: { changedFiles, summary, publicApiAdded, securityNotes, testsRun, unresolvedRisks }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        gapAnalysis: args.gapAnalysis,
        acceptanceTests: args.acceptanceTests,
        previousVerification: args.previousVerification,
        previousReview: args.previousReview,
      },
    },
  },
  io: io(taskCtx),
}));

export const runQualityGatesTask = defineTask('issue-624.quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run deterministic quality gates for issue #624',
  labels: ['issue-624', 'quality-gate', 'verification'],
  agent: {
    name: 'jitsi-quality-gate-runner',
    prompt: {
      role: 'senior Krate verification engineer',
      task: 'Run focused and broad verification for the issue #624 implementation.',
      instructions: [
        ...specReadInstructions(args),
        'Run the focused tests named by the acceptance test task and gap analysis.',
        'Run npm run test:sdk, npm run build:sdk, and npm run verify:metadata unless the repository state proves a narrower package command is the established gate. If a command cannot run, record the exact blocker.',
        'Run package-specific Krate tests that cover core resource model/controllers, web API webhook ingest, CLI/SDK exports, and event bus integration.',
        'Verify webhook security negative cases: missing, malformed, invalid, replayed/duplicate signatures, invalid JSON, and unknown event type behavior.',
        'Verify non-meeting agent dispatch still produces the same job/spec behavior as before.',
        'Verify no unrelated dirty files were staged or modified by this process.',
        'Return JSON: { passed, commands, focusedResults, securityResults, regressionResults, changedFiles, failures, blockers }.',
      ],
      context: {
        gapAnalysis: args.gapAnalysis,
        acceptanceTests: args.acceptanceTests,
        implementation: args.implementation,
      },
    },
  },
  io: io(taskCtx),
}));

export const reviewAgainstSpecTask = defineTask('issue-624.spec-security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation against issue, specs, security, and scope',
  labels: ['issue-624', 'review', 'security'],
  agent: {
    name: 'jitsi-spec-security-reviewer',
    prompt: {
      role: 'senior code reviewer for Krate backend security and controller design',
      task: 'Review the diff against the issue #624 contract and verification output.',
      instructions: [
        'Use a code-review stance. Findings must lead and be ordered by severity with file and line references.',
        ...specReadInstructions(args),
        'Compare the diff directly to the issue body, issue comments, packages/krate/docs/jitsi/03-crds-and-controllers.md, and packages/krate/docs/jitsi/01-architecture.md.',
        'Block approval for missing controller methods, non-idempotent sync behavior, token or webhook secret leakage, missing timing-safe validation, missing duplicate delivery handling, missing event emissions, broken existing web/CLI surfaces, or untested non-meeting dispatch behavior.',
        'Check that #623, #625, and #627 scope boundaries were respected.',
        'Return JSON: { approved, findings, residualRisks, requiredFixes, changedFilesReviewed }.',
      ],
      context: {
        issueContext: args.issueContext,
        gapAnalysis: args.gapAnalysis,
        implementation: args.implementation,
        verification: args.verification,
      },
    },
  },
  io: io(taskCtx),
}));

export const finalDeliveryGateTask = defineTask('issue-624.final-delivery-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final delivery gate and PR handoff for issue #624',
  labels: ['issue-624', 'delivery', 'handoff'],
  agent: {
    name: 'jitsi-delivery-captain',
    prompt: {
      role: 'careful release handoff engineer',
      task: 'Prepare final delivery only after verification and review pass.',
      instructions: [
        ...specReadInstructions(args),
        'Confirm verification.passed is true and review.approved is true. If either is false, return passed false with the remaining blockers.',
        'Inspect git status and diff. Ensure only issue #624 implementation and tests are included.',
        'Prepare a PR-ready summary with implemented surfaces, tests, security notes, and out-of-scope boundaries.',
        'Link issue #624 and call out dependencies on #623, #625, and #627 only where relevant.',
        'Return JSON: { passed, changedFiles, summary, tests, securityNotes, outOfScope, blockers, pullRequestBody }.',
      ],
      context: {
        issueContext: args.issueContext,
        attempts: args.attempts,
        verification: args.verification,
        review: args.review,
      },
    },
  },
  io: io(taskCtx),
}));
