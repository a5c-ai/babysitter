/**
 * @process repo/issue-627-jitsi-agent-meeting-participation
 * @description Implement issue #627: let Jitsi-capable Krate agents join meetings through dispatch, a Job sidecar, and in-meeting MCP tools.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, dependencyIssues: object, specFiles: string[], targetSurfaces: object, verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], qualityGates: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/docs/jitsi/06-agent-meeting-participation.md
 * - packages/krate/docs/jitsi/07-agent-meeting-runtime.md
 * - packages/krate/docs/agent-identity/04-meeting-integration.md
 * - library/methodologies/atdd-tdd/atdd-tdd.js
 * - library/cradle/feature-implementation-contribute.js
 * - library/specializations/software-architecture/api-design-specification.js
 * - library/specializations/security-compliance/secrets-management.js
 * - library/specializations/cli-mcp-development/mcp-tool-implementation.js
 * - library/specializations/cli-mcp-development/mcp-server-security-hardening.js
 * - library/specializations/web-development/nextjs-fullstack-app.js
 * - library/specializations/web-development/e2e-testing-playwright.js
 * - library/specializations/qa-testing-automation/quality-gates.js
 *
 * Repo policy note: direct Babysitter processes in this repository should avoid
 * kind: 'shell' subtasks unless explicitly requested. This process uses agent
 * tasks and supplies concrete commands as instructions for verification agents.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function phases() {
  return [
    'authoritative-context',
    'phase-0-reuse-audit',
    'dependency-contract-audit',
    'process-library-research',
    'implementation-strategy',
    'acceptance-tests-first',
    'implementation-loop',
    'security-and-contract-review',
    'final-quality-gate',
    'delivery',
  ];
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 627;

  const issueContext = await ctx.task(readAuthoritativeContextTask, {
    inputs,
    issueNumber,
  }, {
    key: 'issue-627.authoritative-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-627.reuse-audit',
  });

  const dependencyContracts = await ctx.task(auditDependencyContractsTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-627.dependency-contracts',
  });

  if (dependencyContracts?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #627 Dependency Contract Decision',
      question: dependencyContracts.question || 'Issue #627 depends on #624 and #620. Should implementation proceed using the recorded compatibility contract, or pause until dependency interfaces are merged?',
      options: [
        'Proceed with compatibility shims and documented assumptions',
        'Pause until dependency interfaces are stable',
      ],
      expert: 'owner',
      tags: ['issue-627', 'jitsi', 'dependency-contract'],
      context: {
        runId: ctx.runId,
        issueNumber,
        dependencyContracts,
      },
    });
  }

  const libraryResearch = await ctx.task(researchProcessLibraryTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyContracts,
  }, {
    key: 'issue-627.process-library-research',
  });

  const strategy = await ctx.task(designImplementationStrategyTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyContracts,
    libraryResearch,
  }, {
    key: 'issue-627.strategy',
  });

  const acceptanceTests = await ctx.task(authorAcceptanceTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyContracts,
    strategy,
  }, {
    key: 'issue-627.acceptance-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementMeetingParticipationTask, {
      inputs,
      issueContext,
      reuseAudit,
      dependencyContracts,
      libraryResearch,
      strategy,
      acceptanceTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-627.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      strategy,
      acceptanceTests,
      implementation,
      attempt,
    }, {
      key: `issue-627.verification.${attempt}`,
    });

    review = await ctx.task(reviewSecurityContractsAndUxTask, {
      inputs,
      issueContext,
      reuseAudit,
      dependencyContracts,
      strategy,
      acceptanceTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-627.review.${attempt}`,
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
    dependencyContracts,
    libraryResearch,
    strategy,
    acceptanceTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-627.final-acceptance',
  });

  if (finalGate?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #627 Quality Gate Blocked',
      question: 'The implementation did not satisfy the final gate. Stop for maintainer review, or approve one manual remediation attempt using the recorded failures?',
      options: [
        'Stop and report blocked quality gate',
        'Approve one manual remediation attempt',
      ],
      expert: 'owner',
      tags: ['issue-627', 'jitsi', 'quality-gate'],
      context: {
        runId: ctx.runId,
        issueNumber,
        finalGate,
        attempts,
      },
    });

    return {
      success: false,
      phases: phases(),
      changedFiles: implementation?.changedFiles ?? [],
      issueContext,
      reuseAudit,
      dependencyContracts,
      libraryResearch,
      strategy,
      acceptanceTests,
      implementation,
      verification,
      review,
      attempts,
      finalGate,
    };
  }

  const delivery = await ctx.task(deliverIssue627Task, {
    inputs,
    issueNumber,
    finalGate,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-627.delivery',
  });

  return {
    success: delivery?.success === true,
    phases: phases(),
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    qualityGates: {
      verification,
      review,
      finalGate,
    },
    issueContext,
    reuseAudit,
    dependencyContracts,
    libraryResearch,
    strategy,
    acceptanceTests,
    implementation,
    attempts,
    finalGate,
    delivery,
  };
}

export const readAuthoritativeContextTask = defineTask('issue-627.read-authoritative-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #627, dependency issues, and product specs',
  labels: ['issue-627', 'jitsi', 'research', 'authoritative-context'],
  agent: {
    name: 'krate-jitsi-architect',
    prompt: {
      role: 'senior Krate architecture engineer',
      task: 'Build the authoritative implementation context for issue #627 before any source changes.',
      instructions: [
        `Run and preserve: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm whether #${args.issueNumber} is also a PR by attempting: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read every dependency issue listed in inputs.dependencyIssues with gh issue view, especially #624 Jitsi CRDs/controllers and #620 agent identity/persona.',
        'Read all files in inputs.specFiles. Treat packages/krate/docs/jitsi/06-agent-meeting-participation.md as the primary feature spec and packages/krate/docs/agent-identity/04-meeting-integration.md as the persona integration contract.',
        'Inspect the current branch before planning edits; do not assume #624 or #620 is merged.',
        'Return JSON: { title, labels, issueBody, comments, dependencyIssues, specFilesRead, acceptanceCriteria, nonGoals, risks, ambiguities, targetSurfaces }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-627.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for meeting-aware dispatch',
  labels: ['issue-627', 'reuse-audit', 'brownfield'],
  agent: {
    name: 'krate-brownfield-architect',
    prompt: {
      role: 'senior brownfield systems engineer',
      task: 'Run the mandatory Phase 0 reuse audit before proposing or creating new infrastructure.',
      instructions: [
        'Extract keyword nouns and verbs from the issue: Jitsi, meetingRef, meetingContext, AgentStack, AgentDefinition, AgentDispatchRun, sidecar, JWT, MCP tools, autoJoin, participant, transcript, raise hand, share screen, invite, recording, react.',
        'Check for .a5c/reuse-audit.json. If absent, state that and use Krate-focused globs across packages/krate/core, packages/krate/web, packages/krate/cli, packages/krate/charts, packages/krate/docs, and tests.',
        'Scan for matching CRDs, resource helpers, controllers, dispatch API routes, web forms, Jitsi service helpers, MCP tools, tests, environment variables, and existing sidecar/volume patterns.',
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Call out reusable adjacent infrastructure: jitsi-service JWT generation, Jitsi web pages, existing Jitsi CLI MCP tools, agent dispatch controller, agent-mux Job manifest builder, AgentStack reconciler, AgentDispatchRun CRD, and Jitsi resource model tests.',
        'Explicitly identify gaps: no dispatch meetingRef propagation, no runtime meetingContext, no Job sidecar/socket volume, no in-agent meeting MCP tool permission model, and no web dispatch meeting selector unless found otherwise.',
        'Return JSON: { heading, keywords, configFound, directMatches, adjacentInfrastructure, gaps, reuseRecommendations, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const auditDependencyContractsTask = defineTask('issue-627.dependency-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit #624 Jitsi and #620 identity dependency contracts',
  labels: ['issue-627', 'dependencies', 'contracts'],
  agent: {
    name: 'krate-contract-architect',
    prompt: {
      role: 'senior API and resource contract engineer',
      task: 'Determine the concrete dependency contract that issue #627 should build against.',
      instructions: [
        'Inspect whether the current branch already contains JitsiMeetProvider, JitsiMeeting, JitsiMeetingTemplate, JitsiRecording, AgentDefinition, AgentPersona, AgentAppearance, AgentVoiceProfile, and related controllers/tests.',
        'For #624, record available Jitsi controller/helper APIs, room URL/JWT generation flows, meeting phases, template auto-invite fields, and status participant shapes.',
        'For #620, record whether dispatch accepts agentDefinition, how persona/appearance/voice snapshots are resolved, and how meeting participant name/avatar/voice should be derived.',
        'Define compatibility rules when dependency surfaces are partial: prefer existing fields, add only narrow adapters, and avoid duplicate provider/persona resources.',
        'Flag a maintainer breakpoint only if neither dependency surface exposes a stable-enough contract for meeting dispatch.',
        'Return JSON: { issue624, issue620, availableContracts, missingContracts, compatibilityPlan, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-627.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process-library methodologies',
  labels: ['issue-627', 'process-library', 'methodology'],
  agent: {
    name: 'process-methodology-researcher',
    prompt: {
      role: 'Babysitter process library researcher',
      task: 'Select the methodology and specialization patterns this run should follow.',
      instructions: [
        'First check the active process-library root from babysitter process-library:active --json. If repo-local .a5c/process-library/ is absent, state that explicitly and use the active root instead.',
        'Read matching methodology files under the active root: methodologies/atdd-tdd/atdd-tdd.js, cradle/feature-implementation-contribute.js, methodologies/spec-kit-brownfield.js, and any brownfield/spec-driven methodology files that fit this feature.',
        'Read matching specializations for API/resource design, secrets handling, MCP tool implementation/security, Next.js full-stack UI, Playwright E2E, Kubernetes/IaC review, and quality gates.',
        'Translate the library guidance into concrete constraints for this issue: tests first, contract boundaries, no raw JWT persistence, no duplicate dependency contracts, and broad integration verification.',
        'Return JSON: { processLibraryPathChecked, selectedMethodologies, selectedSpecializations, constraints, qualityGatePattern }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designImplementationStrategyTask = defineTask('issue-627.strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design the meeting participation implementation strategy',
  labels: ['issue-627', 'architecture', 'plan'],
  agent: {
    name: 'krate-jitsi-architect',
    prompt: {
      role: 'senior Krate feature architect',
      task: 'Create the implementation strategy and ordered work slices for meeting-aware agent dispatch.',
      instructions: [
        'Use the reuse audit and dependency contracts as hard context. Do not invent parallel Jitsi provider or persona models.',
        'Choose the schema surface for jitsiCapability, jitsiMeetingProviderRef, and jitsiConfig. If AgentDefinition is present and is the durable identity surface, preserve backward compatibility for AgentStack as needed.',
        'Design AgentDispatchRun spec additions: meetingRef and meetingContext. meetingContext must contain only non-secret or secret-reference data; raw JWT must not be persisted in CRD status, UI models, issue comments, PR body, logs, or long-lived specs.',
        'Design how participant JWT reaches the Job. Prefer Secret-backed env or a short-lived runtime-only handoff if the current resource gateway supports it; if not, document the minimal compatibility shim and tests preventing exposure.',
        'Design agent-mux-client createAgentJob additions: jitsi-agent-sidecar, JITSI_ROOM_URL, JITSI_JWT, JITSI_ROOM_ID, JITSI_PARTICIPANT_NAME, JITSI_AUDIO_MODE, JITSI_CHAT_MODE, AGENT_SOCKET_PATH, main-container socket env, and shared emptyDir volume.',
        'Plan eight in-meeting MCP tools: send_chat_message, get_meeting_transcript, get_participant_list, raise_hand, share_screen, invite_to_meeting, start_recording, react. Gate each by role and jitsiConfig capabilities.',
        'Plan auto-dispatch when a meeting starts from a template with agentConfig.autoJoin true or participants.autoInvite agent entries, reusing createManualDispatch with meetingRef.',
        'Plan web UI updates: dispatch meeting selector for Jitsi-capable stacks, dispatch API forwarding, run detail meeting link, and participant list dispatch-run links.',
        'Return JSON: { orderedSlices, dataContracts, secretHandling, mcpToolMatrix, webPlan, autoDispatchPlan, changedFilesExpected, rollbackRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorAcceptanceTestsTask = defineTask('issue-627.acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing acceptance and regression tests first',
  labels: ['issue-627', 'tests-first', 'atdd'],
  agent: {
    name: 'krate-test-strategy-architect',
    prompt: {
      role: 'senior test strategy engineer',
      task: 'Create focused failing tests before implementation, then hand exact expectations to implementers.',
      instructions: [
        'Add or update tests only; do not implement feature code in this task.',
        'Core tests must cover AgentStack/AgentDefinition Jitsi capability validation, dispatch with meetingRef, inactive/nonexistent meeting rejection, non-capable stack rejection, redacted meetingContext, and no raw JWT in persistent resources.',
        'Agent mux tests must cover the generated Job manifest: main container env, sidecar env, shared emptyDir socket volume, sidecar resources, workspace volume coexistence, and no sidecar when meetingContext is absent.',
        'MCP tests must cover all eight in-meeting tools plus negative authorization for observer, read-only chat, no screenshare, and non-moderator recording/invite.',
        'Auto-dispatch tests must cover meeting start from a template with autoJoin/autoInvite agents and idempotency so the same meeting start does not create duplicate runs.',
        'Web/API tests must cover dispatch API forwarding meetingRef, the dispatch form showing a meeting field only for capable stacks, run detail meeting link rendering, and participant run links.',
        'Record the expected failing command output shape without relying on brittle snapshots.',
        'Return JSON: { testFilesChanged, expectedFailures, acceptanceMatrix, securityRegressionTests, commandsToRun }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementMeetingParticipationTask = defineTask('issue-627.implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Jitsi agent meeting participation',
  labels: ['issue-627', 'implementation', 'krate-core', 'krate-web', 'agent-mux'],
  agent: {
    name: 'krate-implementation-agent',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior Krate implementation engineer',
      task: 'Implement issue #627 according to the strategy and failing tests.',
      instructions: [
        'Keep edits scoped to the target surfaces listed in inputs and the strategy. Do not perform unrelated refactors.',
        'Implement schema/controller support for jitsiCapability, jitsiMeetingProviderRef, jitsiConfig, and AgentDispatchRun meetingRef/meetingContext according to the dependency contract.',
        'Extend createManualDispatch to validate active meetings, enforce Jitsi capability, derive participant identity from AgentDefinition/persona when available, create redacted meeting context, and pass runtime-only or Secret-backed JWT material to the Job path.',
        'Extend agent-mux-client createAgentJob to add the Jitsi sidecar, required env vars, main-container socket env, and shared emptyDir volume only when meeting context is present.',
        'Implement the eight in-meeting MCP tools and enforce role/capability gates. Reuse existing Jitsi meeting helpers and avoid broad tool access when the run is not meeting-aware.',
        'Wire meeting auto-dispatch through the Jitsi meeting/template controller path, reusing createManualDispatch and ensuring idempotency.',
        'Wire web/API surfaces: dispatch meeting selector, dispatch API meetingRef forwarding, run detail link, and participant run links.',
        'Never persist or print raw JWT values in CRD status, UI data, issue comments, PR body, or logs. Redact values in test output and summaries.',
        'Return JSON: { changedFiles, implementedSlices, secretHandlingEvidence, compatibilityNotes, remainingRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-627.verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run focused and repository quality gates',
  labels: ['issue-627', 'verification', 'quality-gate'],
  agent: {
    name: 'krate-verification-agent',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior QA automation engineer',
      task: 'Run the requested verification gates and summarize pass/fail evidence.',
      instructions: [
        'Run the focused tests identified by acceptanceTests.commandsToRun first, then the commands listed in inputs.verificationCommands.',
        'Also run git diff --check.',
        'Inspect generated resource/job manifests in tests to verify absence of raw JWT persistence outside the intended runtime env/secret mechanism.',
        'If a command cannot run because of missing local services, dependencies, or credentials, mark it blocked with exact reason and identify the smaller fallback verification that was run.',
        'Return JSON: { passed, commands, focusedTests, blockedCommands, jwtExposureCheck, diffCheck, failures, remediationHints }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewSecurityContractsAndUxTask = defineTask('issue-627.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review security, contracts, runtime, and UI behavior',
  labels: ['issue-627', 'review', 'security', 'contracts', 'ux'],
  agent: {
    name: 'krate-security-contract-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior security and architecture reviewer',
      task: 'Review the implementation for blocking risks before final acceptance.',
      instructions: [
        'Lead with findings ordered by severity and include file/line references in the task output.',
        'Check raw JWT non-exposure across CRDs, status fields, API responses, UI props, logs, test fixtures, PR summaries, and issue comments.',
        'Check role/capability gates for every meeting MCP tool, including negative paths for observer/read-only/non-moderator modes.',
        'Check AgentStack versus AgentDefinition/persona boundaries so implementation does not duplicate or fork #620 identity contracts.',
        'Check Jitsi provider/meeting/template resource handling against #624 contracts and avoid duplicate provider implementations.',
        'Check Kubernetes Job lifecycle and manifest safety: sidecar only when needed, socket volume mounted in both containers, resource limits present, workspace volumes preserved, and no secret values in labels/annotations.',
        'Check web UX for conditional meeting field behavior, error states, accessibility basics, and no token leakage into client-visible data.',
        'Return JSON: { approved, findings, securityFindings, contractFindings, uxFindings, requiredFixes, residualRisk }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-627.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #627',
  labels: ['issue-627', 'final-gate'],
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'release quality assessor',
      task: 'Decide whether issue #627 is ready for delivery.',
      instructions: [
        'Verify all issue acceptance criteria are satisfied or explicitly scoped out with maintainer approval.',
        'Require verification.passed true and review.approved true unless a maintainer explicitly accepted residual risk.',
        'Require evidence that raw Jitsi JWT material is not persisted in long-lived specs/status/UI/logs/comments and that MCP permission failures are tested.',
        'Require focused tests plus npm run build:sdk, npm run test:sdk, npm run verify:metadata, and git diff --check to be passed or explicitly blocked with acceptable reason.',
        'Return JSON: { passed, changedFiles, acceptedCriteria, rejectedCriteria, qualityEvidence, releaseNotes, residualRisk }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue627Task = defineTask('issue-627.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare delivery summary for issue #627',
  labels: ['issue-627', 'delivery'],
  agent: {
    name: 'delivery-coordinator',
    prompt: {
      role: 'delivery coordinator',
      task: 'Prepare the final PR and issue update for the completed implementation.',
      instructions: [
        'Summarize implemented behavior, tests run, residual risks, and security handling without including raw JWTs or secret values.',
        'Ensure the implementation branch is based on inputs.baseBranch and named inputs.implementationBranch unless maintainers chose otherwise.',
        'Prepare a PR body linking issue #627 and dependency issues #624/#620, with verification evidence and security notes.',
        'Prepare an issue comment summary with the PR link, changed surfaces, quality gates, and any follow-up items.',
        'Return JSON: { success, prTitle, prBodySummary, issueCommentSummary, verificationSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
