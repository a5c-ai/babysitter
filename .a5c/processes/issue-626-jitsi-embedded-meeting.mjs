/**
 * @process repo/issue-626-jitsi-embedded-meeting
 * @description Complete the Krate embedded Jitsi meeting experience with External API lifecycle, context panel, controls, post-meeting links, responsive layout, and quality gates.
 * @inputs { issueNumber: number, title: string, labels: string[], issueBody: string, issueComments: array, specPaths: string[], targetSurfaces: object, qualityCommands: string[] }
 * @outputs { success, phases, reuseAudit, runtimeCallPaths, changedFiles, qualityGate, securityReview, uxReview, finalAcceptance }
 * @process specializations/web-development/nextjs-fullstack-app
 * @process specializations/web-development/react-app-development
 * @process specializations/web-development/api-integration-testing
 * @process specializations/web-development/e2e-testing-playwright
 * @process specializations/web-development/jwt-authentication
 * @process specializations/web-development/mobile-first-responsive
 * @process specializations/web-development/owasp-security-audit
 * @process methodologies/atdd-tdd
 * @process methodologies/spec-kit-brownfield
 *
 * Repository policy note: direct Babysitter processes in this repository should
 * prefer agent and skill tasks over shell subtasks unless the user explicitly
 * asks for a shell-oriented workflow. Verification tasks below require agents
 * to run the concrete commands and report command results.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function issueContext(inputs) {
  return {
    issueNumber: inputs?.issueNumber ?? 626,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    comments: inputs?.issueComments ?? [],
    dependencies: inputs?.dependencies ?? ['#623', '#625'],
    priorPlanPr: inputs?.priorPlanPr ?? null,
    currentStagingFindings: inputs?.currentStagingFindings ?? [],
    specPaths: inputs?.specPaths ?? [],
  };
}

const reuseAuditTask = defineTask(
  'issue-626.reuse-audit',
  async ({ issue, auditKeywords, targetSurfaces }) => ({
    kind: 'agent',
    title: 'Phase 0 reuse audit for Jitsi embedded meeting',
    labels: ['krate-web', 'jitsi', 'reuse-audit', 'phase:0'],
    agent: {
      name: 'krate-reuse-auditor',
      prompt: {
        role: 'senior brownfield web engineer',
        task: 'Run the repo-required Phase 0 reuse audit before planning or implementation work.',
        instructions: [
          'Extract keyword nouns and verbs from issue #626 and the target surfaces.',
          'Scan the repository for existing Jitsi meeting pages, API routes, components, service helpers, CRDs, tests, env vars, and package dependencies.',
          'Treat currentStagingFindings as pre-flight evidence to verify, not as a substitute for scanning the working tree.',
          'Pay special attention to packages/krate/web/app/pages/jitsi-pages.jsx, packages/krate/web/app/components/jitsi, packages/krate/web/app/api/orgs/[org]/jitsi, packages/krate/web/app/lib/jitsi-service.js, packages/krate/docs/jitsi, and package manifests.',
          'Report findings under exactly this heading: "Reuse-audit findings (REVIEW BEFORE PROCEEDING)".',
          'Classify each finding as route, component, API, service, CRD, env var, dependency, test, or prior plan.',
          'Call out existing partial implementation that must be extended rather than duplicated.',
          'Call out missing infrastructure only after proving it is absent.',
          'Do not edit source files in this phase.',
          'Return JSON: { findingsMarkdown: string, existingInfrastructure: array, missingInfrastructure: array, duplicateRisk: array, recommendedReuse: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          `AUDIT KEYWORDS: ${JSON.stringify(auditKeywords ?? [])}`,
          '',
          'TARGET SURFACES:',
          JSON.stringify(targetSurfaces ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Reuse audit', labels: ['reuse-audit'] },
);

const sourceSpecTask = defineTask(
  'issue-626.source-spec',
  async ({ issue, reuseAudit, specPaths }) => ({
    kind: 'agent',
    title: 'Read issue, comments, and Jitsi UX specs',
    labels: ['krate-web', 'jitsi', 'spec', 'phase:research'],
    agent: {
      name: 'krate-spec-reader',
      prompt: {
        role: 'senior product-minded implementation planner',
        task: 'Build the issue #626 implementation spec from authoritative sources.',
        instructions: [
          'Treat the issue body, comments, and referenced docs as the source of truth.',
          'Read every path listed in specPaths, especially the human meeting experience spec and web management spec.',
          'Incorporate the reuse-audit findings before proposing any new route, component, API, dependency, or env var.',
          'Separate hard acceptance criteria from dependency assumptions and optional follow-ups.',
          'Preserve these expected surfaces: EmbeddedMeeting via Jitsi External API, authenticated join flow, Krate context panel, meeting controls, post-meeting state, responsive layout, deep links, and script loading from https://meet.krate.local/external_api.js.',
          'Do not edit source files in this phase.',
          'Return JSON: { acceptanceCriteria: array, dependencyAssumptions: array, nonGoals: array, sourceMap: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          `SPEC PATHS: ${JSON.stringify(specPaths ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Source spec', labels: ['spec'] },
);

const traceRuntimeTask = defineTask(
  'issue-626.trace-runtime-surfaces',
  async ({ issue, spec, reuseAudit, targetSurfaces }) => ({
    kind: 'agent',
    title: 'Trace Krate meeting runtime and UI call paths',
    labels: ['krate-web', 'jitsi', 'architecture', 'phase:research'],
    agent: {
      name: 'krate-runtime-tracer',
      prompt: {
        role: 'senior Next.js and Krate platform engineer',
        task: 'Trace the live execution path for the embedded Jitsi meeting experience before implementation.',
        instructions: [
          'Trace user-facing routes from /orgs/{org}/meetings/{id} through route files, page wrappers, PageFrame/navigation, data loading, Jitsi resource lookup, client components, and API endpoints.',
          'Trace meeting actions through POST /api/orgs/{org}/jitsi/meetings/{id}/join, invite, record, and DELETE meeting endpoints into jitsi-service/controller helpers.',
          'Trace agent dispatch links through existing AgentDispatchRun and agent page conventions.',
          'Identify existing tests and test harness conventions for Krate web components, API routes, and Playwright.',
          'Record runtimeCallPaths with file paths, functions/components, and why each path is live.',
          'Scope future modifications to live paths unless the spec requires a new file.',
          'Do not edit source files in this phase.',
          'Return JSON: { runtimeCallPaths: array, implementationSurfaces: array, testSurfaces: array, navigationSurfaces: array, dataContracts: array, unknowns: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'TARGET SURFACES:',
          JSON.stringify(targetSurfaces ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Trace runtime surfaces', labels: ['architecture'] },
);

const dependencyReadinessTask = defineTask(
  'issue-626.dependency-readiness',
  async ({ issue, spec, runtimeTrace }) => ({
    kind: 'agent',
    title: 'Assess #623/#625 dependency readiness',
    labels: ['krate-web', 'jitsi', 'dependency-gate', 'phase:planning'],
    agent: {
      name: 'krate-dependency-assessor',
      prompt: {
        role: 'senior delivery lead',
        task: 'Determine whether issue #626 can proceed against current #623/#625 contracts without expanding prerequisite scope.',
        instructions: [
          'Inspect the current repository and GitHub issue context for #623 and #625 status when needed.',
          'Confirm whether the reachable Jitsi server, External API script URL, meeting resources, and join API contracts exist or can be mocked deterministically.',
          'If a contract is missing, classify it as blocker, mockable dependency, or out-of-scope prerequisite.',
          'Do not reimplement Helm, CRDs, broad meeting management pages, or agent-side meeting runtime as part of #626.',
          'Return JSON: { ready: boolean, blockers: array, mockableContracts: array, prerequisiteScopeToAvoid: array, recommendedBreakpoint: boolean, question: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Dependency readiness', labels: ['dependency-gate'] },
);

const authorAcceptanceTestsTask = defineTask(
  'issue-626.author-acceptance-tests',
  async ({ issue, spec, runtimeTrace, testPlan }) => ({
    kind: 'agent',
    title: 'Author issue #626 acceptance tests before implementation',
    labels: ['krate-web', 'jitsi', 'atdd', 'phase:red'],
    agent: {
      name: 'krate-atdd-test-author',
      prompt: {
        role: 'senior React, Next.js, and Playwright test engineer',
        task: 'Write failing acceptance and integration coverage for issue #626 before implementation changes.',
        instructions: [
          'Follow outside-in ATDD. Author tests before implementation work.',
          'Base test names and assertions on the issue/spec criteria, not on current partial implementation behavior.',
          'Cover the join flow: POST /api/orgs/{org}/jitsi/meetings/{id}/join returns roomUrl and jwt, then the meeting page renders the iframe component with those values.',
          'Cover Jitsi External API lifecycle: page-scoped script loading from https://meet.krate.local/external_api.js, construction with JWT, prejoin disabled, toolbar customization, event listeners, commands, and dispose on unmount.',
          'Cover the Krate context panel: humans plus agents with persona/avatar treatment, recording state, invite user/agent actions, meeting metadata, and dispatch run links.',
          'Cover meeting controls: mute/unmute, camera, screen share, chat, recording, end meeting, and invite, wired through External API commands/events or Krate API endpoints as appropriate.',
          'Cover post-meeting state: ended phase, recording finalization, and transcript/recording links.',
          'Cover auth/error/degraded states and mobile responsive layout where the context panel collapses below the iframe.',
          'Use mocked Jitsi External API for deterministic component/browser tests. Treat a real Jitsi smoke path as conditional when #623 is available.',
          'Run the narrow tests and confirm they fail for missing issue #626 behavior, not for syntax or test harness errors.',
          'Do not weaken or skip existing tests.',
          'Return JSON: { testFiles: array, testNames: array, redVerified: boolean, redCommandSummaries: array, coverageMap: array, remainingSpecGaps: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'TEST PLAN HINTS:',
          JSON.stringify(testPlan ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author acceptance tests', labels: ['atdd'] },
);

const implementExternalApiTask = defineTask(
  'issue-626.implement-external-api',
  async ({ issue, spec, runtimeTrace, acceptanceTests, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement EmbeddedMeeting External API lifecycle',
    labels: ['krate-web', 'jitsi', 'implementation', 'phase:external-api'],
    agent: {
      name: 'krate-jitsi-component-implementer',
      prompt: {
        role: 'senior React client component engineer',
        task: 'Complete the EmbeddedMeeting/JitsiExternalAPI integration on the live Krate meeting path.',
        instructions: [
          'Extend existing Jitsi components instead of adding duplicate parallel components.',
          'Load https://meet.krate.local/external_api.js only for the embedded meeting experience and handle loading, ready, and failure states.',
          'Instantiate window.JitsiMeetExternalAPI with domain, roomName, jwt, parentNode, displayName, prejoin bypass, toolbar customization, and interface overrides required by the spec.',
          'Wire participantJoined, participantLeft, readyToClose, recording/status, mute/video/chat/screen-share-relevant events where available.',
          'Expose an integration boundary for meeting controls to execute External API commands without duplicating Jitsi state as source of truth.',
          'Dispose API instances and remove listeners on unmount or room/JWT changes.',
          'Preserve auth boundaries: do not store long-lived secrets in browser state and do not bypass the join route.',
          'Run the relevant tests and report results.',
          'Return JSON: { changedFiles: array, summary: string, commandResults: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(acceptanceTests ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement External API lifecycle', labels: ['implementation'] },
);

const implementMeetingExperienceTask = defineTask(
  'issue-626.implement-meeting-experience',
  async ({ issue, spec, runtimeTrace, acceptanceTests, externalApiImplementation, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement meeting page, context panel, controls, and post-meeting state',
    labels: ['krate-web', 'jitsi', 'implementation', 'phase:meeting-experience'],
    agent: {
      name: 'krate-meeting-experience-implementer',
      prompt: {
        role: 'senior full-stack Next.js engineer',
        task: 'Complete the issue #626 in-console meeting detail experience on the traced live path.',
        instructions: [
          'Reuse existing /orgs/{org}/meetings/{id}, Jitsi service, and API route patterns.',
          'Current staging has partial Jitsi meeting scaffolding; complete it in place rather than creating a second meeting-detail implementation.',
          'Ensure the page performs the authenticated join flow and renders the embedded iframe with JWT and room URL from POST /api/orgs/{org}/jitsi/meetings/{id}/join.',
          'Build the Krate context panel with participants, agents/persona avatars, recording controls, invite buttons, meeting metadata, and dispatch run links.',
          'Wire controls for mute/unmute, camera, screen share, chat, recording, end meeting, and invite through the External API integration or existing Krate Jitsi API endpoints.',
          'Handle ended/post-meeting state with recording finalization and transcript/recording links.',
          'Make the layout responsive so the context panel collapses below the iframe on narrow viewports without overlapping controls or unreadable text.',
          'Keep unrelated #623/#625 infrastructure and agent meeting runtime out of scope.',
          'Run relevant tests and report results.',
          'Return JSON: { changedFiles: array, summary: string, commandResults: array, behaviorCovered: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(acceptanceTests ?? {}, null, 2),
          '',
          'EXTERNAL API IMPLEMENTATION:',
          JSON.stringify(externalApiImplementation ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement meeting experience', labels: ['implementation'] },
);

const verifyQualityGateTask = defineTask(
  'issue-626.verify-quality-gate',
  async ({ issue, spec, implementation, qualityCommands, acceptanceTests }) => ({
    kind: 'agent',
    title: 'Run issue #626 quality gates',
    labels: ['krate-web', 'jitsi', 'verification', 'phase:quality-gate'],
    agent: {
      name: 'krate-quality-verifier',
      prompt: {
        role: 'senior Krate web verifier',
        task: 'Run and interpret the quality gates for the issue #626 implementation.',
        instructions: [
          'Run every command listed in qualityCommands from the repository root unless a command is impossible in the current environment; report exact command, exit status, and concise stdout/stderr summary.',
          'Confirm the pre-authored issue #626 acceptance tests pass after implementation.',
          'Confirm mocked Jitsi External API browser/component coverage validates script loading, JWT construction, command/event wiring, cleanup, and error/degraded states.',
          'Confirm Playwright or equivalent browser coverage checks desktop and mobile layout, including context panel collapse below the iframe.',
          'Inspect the final diff and reject unrelated changes outside issue #626 live paths.',
          'Do not skip, weaken, or delete tests to make the gate pass.',
          'Return JSON: { passed: boolean, commands: array, failingCommands: array, acceptanceCoveragePassed: boolean, responsiveCoveragePassed: boolean, diffScopeOk: boolean, changedFiles: array, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(acceptanceTests ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['verification'] },
);

const securityUxReviewTask = defineTask(
  'issue-626.security-ux-review',
  async ({ issue, spec, runtimeTrace, implementation, qualityGate }) => ({
    kind: 'agent',
    title: 'Review JWT/auth, iframe lifecycle, controls, and responsive UX',
    labels: ['krate-web', 'jitsi', 'security', 'ux', 'phase:review'],
    agent: {
      name: 'krate-security-ux-reviewer',
      prompt: {
        role: 'senior web security and product UX reviewer',
        task: 'Review issue #626 changes for security, integration correctness, and meeting UX completeness.',
        instructions: [
          'Security review: verify JWTs are short-lived and org-scoped, secrets are not exposed, join actions require auth, invite/record/end actions are authorized, and external script/iframe loading is constrained to the meeting page.',
          'Integration review: verify the External API is the source of truth for iframe commands/events, instances are cleaned up, and route changes do not leak listeners or iframes.',
          'UX review: verify the first viewport is the actual meeting experience, controls are discoverable, context panel content is scannable, mobile layout collapses cleanly, and post-meeting links are useful.',
          'Reject placeholder-only behavior that appears to satisfy tests without letting authenticated users join meetings in-console.',
          'Return JSON: { approved: boolean, blockingIssues: array, securityFindings: array, uxFindings: array, residualRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Security and UX review', labels: ['review'] },
);

const refineImplementationTask = defineTask(
  'issue-626.refine-implementation',
  async ({ issue, spec, runtimeTrace, acceptanceTests, implementation, qualityGate, review }) => ({
    kind: 'agent',
    title: 'Refine implementation after failed gate or review',
    labels: ['krate-web', 'jitsi', 'refinement'],
    agent: {
      name: 'krate-jitsi-refiner',
      prompt: {
        role: 'senior full-stack maintainer',
        task: 'Fix only the blocking failures from quality gate or review for issue #626.',
        instructions: [
          'Keep changes tightly scoped to the live paths traced earlier.',
          'Address failing tests, missing acceptance criteria, security blockers, UX blockers, or diff-scope problems directly.',
          'Do not broaden into prerequisite Helm, broad management-page, CRD, or agent meeting runtime scope.',
          'Rerun the relevant narrow tests after fixes and report the results.',
          'Return JSON: { changedFiles: array, summary: string, fixedIssues: array, commandResults: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(acceptanceTests ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
          '',
          'REVIEW:',
          JSON.stringify(review ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Refine implementation', labels: ['refinement'] },
);

const finalAcceptanceTask = defineTask(
  'issue-626.final-acceptance',
  async ({ issue, spec, reuseAudit, runtimeTrace, acceptanceTests, implementation, qualityGate, review }) => ({
    kind: 'agent',
    title: 'Final acceptance review for issue #626',
    labels: ['krate-web', 'jitsi', 'acceptance', 'phase:final'],
    agent: {
      name: 'krate-final-acceptance-reviewer',
      prompt: {
        role: 'senior maintainer performing final acceptance',
        task: 'Compare issue #626 acceptance criteria directly to final artifacts and determine whether the run can be delivered.',
        instructions: [
          'Review the final diff, tests, and command results.',
          'Verify every hard acceptance criterion from the issue and docs has corresponding implementation and test coverage.',
          'Verify reuse-audit recommendations were followed and no duplicate Jitsi infrastructure was introduced.',
          'Reject delivery if any of these are present: static placeholder instead of External API iframe, missing authenticated join flow, JWT exposure, no context panel, no recording/invite controls, no post-meeting state, no responsive validation, or unrelated prerequisite scope.',
          'Prepare a concise PR summary and test summary suitable for the implementation PR.',
          'Return JSON: { approved: boolean, blockingIssues: array, acceptanceMatrix: array, prSummary: string, testSummary: string, residualRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issue, null, 2),
          '',
          'SPEC:',
          JSON.stringify(spec ?? {}, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(acceptanceTests ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
          '',
          'SECURITY/UX REVIEW:',
          JSON.stringify(review ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Final acceptance', labels: ['acceptance'] },
);

export async function process(inputs, ctx) {
  const issue = issueContext(inputs);
  const targetSurfaces = inputs?.targetSurfaces ?? {};
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm --prefix packages/krate/web test',
    'npm --prefix packages/krate/web run build',
    'npm --prefix packages/krate/web run test:e2e',
    'git diff --check',
  ];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const phases = [];

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issue,
    auditKeywords: inputs?.auditKeywords ?? [
      'Jitsi',
      'EmbeddedMeeting',
      'JitsiMeetExternalAPI',
      'external_api',
      'meetings',
      'join',
      'recording',
      'transcript',
      'dispatch',
      'participants',
    ],
    targetSurfaces,
  }, { key: 'issue-626.reuse-audit' });
  phases.push({ id: 'phase-0-reuse-audit', status: 'completed' });

  const spec = await ctx.task(sourceSpecTask, {
    issue,
    reuseAudit,
    specPaths: inputs?.specPaths ?? [],
  }, { key: 'issue-626.source-spec' });
  phases.push({ id: 'phase-1-source-spec', status: 'completed' });

  const runtimeTrace = await ctx.task(traceRuntimeTask, {
    issue,
    spec,
    reuseAudit,
    targetSurfaces,
  }, { key: 'issue-626.runtime-trace' });
  phases.push({ id: 'phase-2-runtime-trace', status: 'completed' });

  const dependencyReadiness = await ctx.task(dependencyReadinessTask, {
    issue,
    spec,
    runtimeTrace,
  }, { key: 'issue-626.dependency-readiness' });
  phases.push({ id: 'phase-3-dependency-readiness', status: 'completed' });

  if (dependencyReadiness?.recommendedBreakpoint || dependencyReadiness?.blockers?.length) {
    await ctx.breakpoint({
      title: 'Jitsi dependency readiness decision',
      question: dependencyReadiness?.question || 'Issue #626 has unresolved #623/#625 dependency contracts. Proceed with mocked/degraded contracts, or pause until prerequisites are ready?',
      context: {
        runId: ctx.runId,
        dependencyReadiness,
        issue,
      },
      expert: 'maintainer',
      tags: ['dependency-gate', 'sparse-breakpoint'],
    });
  }

  const acceptanceTests = await ctx.task(authorAcceptanceTestsTask, {
    issue,
    spec,
    runtimeTrace,
    testPlan: inputs?.testPlan ?? {},
  }, { key: 'issue-626.acceptance-tests' });
  phases.push({ id: 'phase-4-acceptance-tests', status: 'completed' });

  let verificationFeedback = null;
  let externalApiImplementation = null;
  let meetingExperienceImplementation = null;
  let implementation = null;
  let qualityGate = null;
  let review = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    externalApiImplementation = await ctx.task(implementExternalApiTask, {
      issue,
      spec,
      runtimeTrace,
      acceptanceTests,
      verificationFeedback,
    }, { key: `issue-626.external-api.${attempt}` });

    meetingExperienceImplementation = await ctx.task(implementMeetingExperienceTask, {
      issue,
      spec,
      runtimeTrace,
      acceptanceTests,
      externalApiImplementation,
      verificationFeedback,
    }, { key: `issue-626.meeting-experience.${attempt}` });

    implementation = {
      attempt,
      externalApiImplementation,
      meetingExperienceImplementation,
      changedFiles: [
        ...(externalApiImplementation?.changedFiles ?? []),
        ...(meetingExperienceImplementation?.changedFiles ?? []),
      ],
    };

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issue,
      spec,
      implementation,
      qualityCommands,
      acceptanceTests,
    }, { key: `issue-626.quality-gate.${attempt}` });

    review = await ctx.task(securityUxReviewTask, {
      issue,
      spec,
      runtimeTrace,
      implementation,
      qualityGate,
    }, { key: `issue-626.security-ux-review.${attempt}` });

    if (qualityGate?.passed && qualityGate?.acceptanceCoveragePassed && qualityGate?.responsiveCoveragePassed && qualityGate?.diffScopeOk && review?.approved) {
      phases.push({ id: `phase-5-implementation-attempt-${attempt}`, status: 'completed' });
      phases.push({ id: `phase-6-quality-review-attempt-${attempt}`, status: 'completed' });
      break;
    }

    verificationFeedback = await ctx.task(refineImplementationTask, {
      issue,
      spec,
      runtimeTrace,
      acceptanceTests,
      implementation,
      qualityGate,
      review,
    }, { key: `issue-626.refinement.${attempt}` });
  }

  if (!qualityGate?.passed || !qualityGate?.acceptanceCoveragePassed || !qualityGate?.responsiveCoveragePassed || !qualityGate?.diffScopeOk || !review?.approved) {
    await ctx.breakpoint({
      title: 'Issue #626 quality gate unresolved',
      question: 'The issue #626 implementation did not satisfy all quality, security, UX, and diff-scope gates within the configured attempts. Review the failures before continuing?',
      context: {
        runId: ctx.runId,
        qualityGate,
        review,
        verificationFeedback,
      },
      expert: 'maintainer',
      tags: ['quality-gate', 'sparse-breakpoint'],
    });
  }

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    issue,
    spec,
    reuseAudit,
    runtimeTrace,
    acceptanceTests,
    implementation,
    qualityGate,
    review,
  }, { key: 'issue-626.final-acceptance' });
  phases.push({ id: 'phase-7-final-acceptance', status: finalAcceptance?.approved ? 'completed' : 'blocked' });

  if (!finalAcceptance?.approved) {
    await ctx.breakpoint({
      title: 'Final acceptance rejected',
      question: 'Final acceptance found blocking issue #626 gaps. Review the acceptance matrix before delivery?',
      context: {
        runId: ctx.runId,
        finalAcceptance,
      },
      expert: 'maintainer',
      tags: ['final-acceptance', 'sparse-breakpoint'],
    });
  }

  return {
    success: Boolean(finalAcceptance?.approved),
    phases,
    reuseAudit,
    spec,
    dependencyReadiness,
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    acceptanceTests,
    changedFiles: implementation?.changedFiles ?? [],
    qualityGate,
    securityReview: review?.securityFindings ?? [],
    uxReview: review?.uxFindings ?? [],
    finalAcceptance,
    plannedProcessEntry: '.a5c/processes/issue-626-jitsi-embedded-meeting.mjs#process',
  };
}
