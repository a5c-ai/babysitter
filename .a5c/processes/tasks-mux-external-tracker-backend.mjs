/**
 * @process repo/tasks-mux-external-tracker-backend
 * @description Implement issue #632: tasks-mux ExternalTrackerBackend for Jira, Linear, GitHub Issues, and Generic REST sync.
 * @inputs { issueNumber: number, dependencyIssueNumber: number, dependencyPrNumber: number, baseBranch: string, branchName: string, issueContext: object, dependencyContext: object, reuseAuditFindings: object, targetFiles: string[], docs: string[], qualityCommands: string[] }
 * @outputs { success: boolean, phases: string[], dependencyGate: object, reuseAudit: object, design: object, implementation: object, qualityGate: object, review: object }
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/shared/integration-design
 * @process repo/tasks-mux-feature
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const dependencyAndSpecIntakeTask = defineTask(
  'issue-632.dependency-and-spec-intake',
  async ({ issueContext, dependencyContext, targetFiles, docs }) => ({
    kind: 'agent',
    title: 'Read issue #632 and dependency contract',
    labels: ['issue-632', 'tasks-mux', 'tracker', 'phase:spec-intake'],
    agent: {
      name: 'tasks-mux-tracker-spec-reader',
      prompt: {
        role: 'senior tasks-mux platform engineer',
        task: 'Read the issue, dependency, design docs, and existing tasks-mux surfaces before any implementation.',
        instructions: [
          'Do not edit files in this phase.',
          'Treat issue #632 as the source of truth for ExternalTrackerBackend scope.',
          'Treat issue #630 and PR #644 as the dependency contract source for ResponderType and TaskRouter work.',
          'Confirm whether #630 is merged, available on the current branch, or still only available in an open PR.',
          'Read the referenced docs and files listed below, then trace how BreakpointBackend, backend config, backend factory registration, MCP backend resolution, harness interaction routing, and GitHubIssuesBackend currently fit together.',
          'Explicitly identify dependency assumptions that must not be reimplemented in this issue.',
          'Return JSON: { dependencyReady: boolean, dependencySource: string, dependencyRisks: array, issueScope: array, outOfScope: array, runtimeCallPaths: array, existingPatterns: array, targetFiles: array }.',
          '',
          'ISSUE #632 CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DEPENDENCY CONTEXT:',
          JSON.stringify(dependencyContext, null, 2),
          '',
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
          `DOCS: ${JSON.stringify(docs ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Read tracker backend spec', labels: ['tasks-mux', 'tracker', 'spec'] },
);

const reuseAuditTask = defineTask(
  'issue-632.reuse-audit',
  async ({ issueContext, reuseAuditFindings }) => ({
    kind: 'agent',
    title: 'Phase 0 -- REUSE-AUDIT for tracker sync infrastructure',
    labels: ['issue-632', 'reuse-audit', 'tasks-mux'],
    agent: {
      name: 'tasks-mux-reuse-auditor',
      prompt: {
        role: 'senior repository reuse auditor',
        task: 'Render and validate reuse-audit findings before proposing new tracker infrastructure.',
        instructions: [
          'Do not edit files in this phase.',
          'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Use the supplied findings as initial evidence, then verify by scanning relevant source and docs.',
          'Extract keyword nouns and verbs from the issue: ExternalTrackerBackend, sync, Jira, Linear, GenericREST, GitHubIssues, bidirectional sync, webhook listener, field mapping, auth, idempotency, conflict resolution, ResponderType, tracker responder.',
          'Look for matching migrations, API routes, environment variables, SDK dependencies, backend factories, auth stores, webhook listeners, and imports.',
          'Call out infrastructure to reuse, infrastructure that is absent, and places where new code is justified.',
          'Return JSON: { renderedFindings: string, reusableInfrastructure: array, absentInfrastructure: array, newInfrastructureJustified: array, scanEvidence: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'INITIAL REUSE AUDIT FINDINGS:',
          JSON.stringify(reuseAuditFindings ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Run reuse audit', labels: ['reuse-audit', 'tasks-mux'] },
);

const designTrackerContractTask = defineTask(
  'issue-632.design-tracker-contract',
  async ({ issueContext, dependencyGate, reuseAudit }) => ({
    kind: 'agent',
    title: 'Design provider-neutral tracker contract',
    labels: ['issue-632', 'design', 'tracker-contract'],
    agent: {
      name: 'tasks-mux-tracker-architect',
      prompt: {
        role: 'senior TypeScript API and sync-system architect',
        task: 'Design the ExternalTrackerBackend contract and phased implementation boundary.',
        instructions: [
          'Do not edit files in this phase.',
          'Base the design on BreakpointBackend compatibility and the #630 ResponderType/TaskRouter contract.',
          'Reuse GitHubIssuesBackend behavior and payload markers as a compatibility baseline where possible.',
          'Define provider-neutral types for tracker identity, external issue references, field mapping, sync direction, sync cursor, provider event id, conflict strategy, and normalized tracker status.',
          'Define adapter boundaries for GitHub Issues, Jira REST, Linear GraphQL, and Generic REST without hard-coding provider details into the backend lifecycle methods.',
          'Define how submitBreakpoint, getBreakpoint, waitForAnswer, answerBreakpoint, cancelBreakpoint, listPendingBreakpoints, claimBreakpoint, and listResponders should behave for tracker-backed tasks.',
          'Define inbound webhook normalization and idempotency requirements before implementation.',
          'Define secret handling and redaction boundaries. Credentials must be read from config/env/auth stores and must not be written into issue bodies, comments, journal artifacts, logs, or test snapshots.',
          'Return JSON: { contract: object, adapters: array, configSchemaPlan: object, syncModel: object, webhookPlan: object, compatibilityPlan: object, risks: array, implementationPhases: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DEPENDENCY GATE:',
          JSON.stringify(dependencyGate ?? {}, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Design tracker contract', labels: ['tracker', 'design'] },
);

const authorContractTestsTask = defineTask(
  'issue-632.author-contract-tests',
  async ({ issueContext, design, testTargets }) => ({
    kind: 'agent',
    title: 'Author failing tracker contract and compatibility tests',
    labels: ['issue-632', 'tdd', 'tests', 'phase:red'],
    agent: {
      name: 'tasks-mux-tracker-test-author',
      prompt: {
        role: 'senior TypeScript test engineer',
        task: 'Write the red-phase tests for ExternalTrackerBackend before production implementation.',
        instructions: [
          'Edit the repository directly in this phase, but add tests only unless a tiny test fixture helper is unavoidable.',
          'Do not implement production code in this phase.',
          'Prefer deterministic unit and integration tests with mocked fetch/GraphQL calls. Do not require live Jira, Linear, GitHub, or REST credentials.',
          'Cover BackendConfigSchema discriminated union additions for external tracker config without breaking existing git-native/server/github-issues configs.',
          'Cover backend factory registration and listRegisteredBackends for tracker backend types.',
          'Cover provider-neutral adapter mapping: BreakpointContext/Routing to external issue fields, external issue/comment/status back to Breakpoint/BreakpointAnswer.',
          'Cover GitHubIssuesBackend compatibility or adapter wrapping so current durable gh-{number} IDs and hidden payload parsing do not regress.',
          'Cover Jira transition/status mapping, Linear workflow state mapping, Generic REST request/response mapping, conflict/idempotency primitives, and webhook event normalization.',
          'Cover secret redaction in generated issue bodies, comments, logs, and serialized artifacts.',
          'Run the narrow tests and verify they fail for missing implementation rather than test setup problems.',
          'Return JSON: { testFiles: array, testNames: array, redVerified: boolean, redCommand: string, redOutputSummary: string, failureMatchesIssue: boolean, productionFilesTouched: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DESIGN:',
          JSON.stringify(design ?? {}, null, 2),
          '',
          `TEST TARGETS: ${JSON.stringify(testTargets ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Write red-phase tests', labels: ['tracker', 'tdd', 'red'] },
);

const implementCoreBackendTask = defineTask(
  'issue-632.implement-core-backend',
  async ({ issueContext, dependencyGate, design, regression, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement ExternalTrackerBackend core and config',
    labels: ['issue-632', 'implementation', 'tracker-core'],
    agent: {
      name: 'tasks-mux-tracker-core-implementer',
      prompt: {
        role: 'senior TypeScript maintainer',
        task: 'Implement the provider-neutral ExternalTrackerBackend core, schemas, factory registration, and exports.',
        instructions: [
          'Edit the repository directly.',
          'Keep changes scoped to tasks-mux and directly required docs/tests unless dependency integration proves otherwise.',
          'Do not reimplement #630 ResponderType or TaskRouter; consume its merged/current contract. If the contract is unavailable, stop at the dependency breakpoint in the main process.',
          'Add provider-neutral tracker types and config schemas in the location that best matches existing tasks-mux patterns.',
          'Add ExternalTrackerBackend as a BreakpointBackend-compatible backend that delegates provider-specific operations through tracker adapters.',
          'Preserve all existing GitHubIssuesBackend public behavior and tests.',
          'Register new backend types conservatively: external-tracker plus provider aliases only if the design and tests require them.',
          'Make external references and sync metadata durable enough for round-trip get/wait/list behavior without relying on process memory.',
          'Keep auth tokens and webhook secrets out of serialized breakpoint content and test snapshots.',
          'Run the red-phase tests after implementation and summarize results.',
          'Return JSON: { changedFiles: array, summary: string, configSchemas: array, backendTypes: array, testsRun: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DEPENDENCY GATE:',
          JSON.stringify(dependencyGate ?? {}, null, 2),
          '',
          'DESIGN:',
          JSON.stringify(design ?? {}, null, 2),
          '',
          'REGRESSION TESTS:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement tracker core', labels: ['tracker', 'implementation'] },
);

const implementAdaptersTask = defineTask(
  'issue-632.implement-provider-adapters',
  async ({ issueContext, design, coreImplementation, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement Jira, Linear, GitHub Issues, and Generic REST adapters',
    labels: ['issue-632', 'implementation', 'adapters'],
    agent: {
      name: 'tasks-mux-tracker-adapter-implementer',
      prompt: {
        role: 'senior integration engineer',
        task: 'Implement tracker provider adapters and provider-specific mapping tests.',
        instructions: [
          'Edit the repository directly.',
          'Implement Jira REST, Linear GraphQL, Generic REST, and GitHub Issues compatibility adapter behavior behind the provider-neutral contract.',
          'Use fetch-compatible clients or existing dependencies; do not add SDK dependencies unless the reuse audit and design justify them.',
          'Jira adapter must support issue create/read/comment/status transition mapping through configurable project, issue type, fields, transitions, and status mapping.',
          'Linear adapter must support issue create/read/comment/workflow-state mapping through team/project/workflow-state configuration.',
          'Generic REST adapter must support configurable endpoint, method, headers/env-secret references, request field mapping, response extraction, comment/status operations, and polling.',
          'GitHub adapter must preserve existing GitHub Issues backend behavior or wrap it without changing current durable ids and answer parsing.',
          'All adapters must be deterministic under mocked HTTP tests, classify retryable vs terminal provider errors, and avoid logging secrets.',
          'Run provider-specific tests and summarize results.',
          'Return JSON: { changedFiles: array, adapters: array, providerMappings: object, testsRun: array, secretRedactionEvidence: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DESIGN:',
          JSON.stringify(design ?? {}, null, 2),
          '',
          'CORE IMPLEMENTATION:',
          JSON.stringify(coreImplementation ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement provider adapters', labels: ['tracker', 'adapters'] },
);

const implementSyncAndWebhookTask = defineTask(
  'issue-632.implement-sync-and-webhooks',
  async ({ issueContext, design, adapterImplementation, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement bidirectional sync and webhook ingestion',
    labels: ['issue-632', 'implementation', 'sync', 'webhooks'],
    agent: {
      name: 'tasks-mux-tracker-sync-implementer',
      prompt: {
        role: 'senior distributed systems engineer',
        task: 'Implement bidirectional tracker sync, webhook ingestion, and conflict/idempotency behavior.',
        instructions: [
          'Edit the repository directly.',
          'Implement outbound sync for breakpoint creation, answers/comments, claims/assignment where supported, cancellation, and status transitions.',
          'Implement inbound sync normalization from provider webhooks and/or polling events into Breakpoint and BreakpointAnswer changes.',
          'Make inbound sync idempotent using provider event ids, external issue updated timestamps, sync cursors, or equivalent durable metadata.',
          'Handle duplicate and out-of-order webhook events deterministically.',
          'Support configurable conflict strategy with conservative defaults that do not overwrite local answers unexpectedly.',
          'Integrate with existing tasks-mux MCP/backend resolution and harness surfaces only as needed for tracker responder routing after #630.',
          'Do not pull agent-platform daemon code into tasks-mux unless it is explicitly the chosen shared utility; prefer a tasks-mux-local listener or exported handler if package boundaries require it.',
          'Add tests for webhook signature/token checks, payload size/JSON validation if a listener is introduced, duplicate events, replay, polling fallback, and redaction.',
          'Run sync/webhook tests and summarize results.',
          'Return JSON: { changedFiles: array, syncFlows: array, webhookSurfaces: array, idempotencyMechanism: string, testsRun: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DESIGN:',
          JSON.stringify(design ?? {}, null, 2),
          '',
          'ADAPTER IMPLEMENTATION:',
          JSON.stringify(adapterImplementation ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement sync and webhooks', labels: ['tracker', 'sync', 'webhook'] },
);

const verifyQualityGateTask = defineTask(
  'issue-632.verify-quality-gate',
  async ({ issueContext, implementations, qualityCommands }) => ({
    kind: 'agent',
    title: 'Verify ExternalTrackerBackend quality gates',
    labels: ['issue-632', 'verification', 'quality-gate'],
    agent: {
      name: 'tasks-mux-tracker-verifier',
      prompt: {
        role: 'senior TypeScript verifier and release engineer',
        task: 'Run and interpret deterministic quality gates for issue #632.',
        instructions: [
          'Run the listed commands from the repository root.',
          'Confirm the red-phase tests were initially failing for missing implementation and now pass.',
          'Confirm existing GitHubIssuesBackend tests still pass.',
          'Confirm new Jira, Linear, Generic REST, webhook, idempotency, field mapping, and redaction tests pass without live provider credentials.',
          'Inspect the diff for accidental implementation of unrelated #630/#631/#633 surfaces.',
          'Confirm no secrets are present in fixtures, snapshots, logs, issue body builders, comments, or serialized metadata.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: array, issueScopeOnly: boolean, githubIssuesCompatibilityVerified: boolean, providerCoverageVerified: boolean, webhookIdempotencyVerified: boolean, secretRedactionVerified: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'IMPLEMENTATIONS:',
          JSON.stringify(implementations ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['tracker', 'verification'] },
);

const reviewTask = defineTask(
  'issue-632.review',
  async ({ issueContext, dependencyGate, reuseAudit, design, regression, implementations, qualityGate }) => ({
    kind: 'agent',
    title: 'Review ExternalTrackerBackend against issue #632',
    labels: ['issue-632', 'review', 'quality-gate'],
    agent: {
      name: 'tasks-mux-tracker-reviewer',
      prompt: {
        role: 'senior tasks-mux code reviewer',
        task: 'Review the final issue #632 changes against the issue, dependency, and quality evidence.',
        instructions: [
          'Use a code-review stance: findings first, ordered by severity, with file/line references where possible.',
          'Verify implementation satisfies issue #632 deliverables: ExternalTrackerBackend, Jira, Linear, Generic REST, GitHub Issues compatibility, bidirectional sync, webhook listener/handler, and field mapping configuration.',
          'Verify the implementation consumes the #630 ResponderType/router contract and does not duplicate that foundational work.',
          'Verify provider mappings are configurable, deterministic, and covered by tests.',
          'Verify webhook ingestion is idempotent, authenticated where configured, and safe for duplicate/out-of-order events.',
          'Verify secret redaction and auth boundaries.',
          'Verify existing git-native, server, and github-issues backend behavior is not regressed.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, specCoverage: object, residualRisks: array, finalSummary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DEPENDENCY GATE:',
          JSON.stringify(dependencyGate ?? {}, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'DESIGN:',
          JSON.stringify(design ?? {}, null, 2),
          '',
          'REGRESSION:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'IMPLEMENTATIONS:',
          JSON.stringify(implementations ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review tracker backend', labels: ['tracker', 'review'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 632,
    title: inputs?.title ?? 'tasks-mux: ExternalTrackerBackend -- sync tasks to Jira/Linear/REST',
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    comments: inputs?.issueComments ?? [],
    latestDependencyNote: inputs?.latestDependencyNote ?? 'Latest issue comment says this depends on #630 for the ResponderType system.',
    designDoc: inputs?.designDoc ?? 'docs/adapters-babysitter-integrations/tasks-mux-routing.md',
    userRequest: inputs?.userRequest,
  };

  const dependencyContext = inputs?.dependencyContext ?? {
    issueNumber: inputs?.dependencyIssueNumber ?? 630,
    prNumber: inputs?.dependencyPrNumber ?? 644,
    summary: 'ResponderType and TaskRouter foundational work must land before tracker responder routing is wired.',
  };

  const qualityCommands = inputs?.qualityCommands ?? [
    'npm exec --yes --package=vitest -- vitest run --config packages/tasks-mux/vitest.config.ts packages/tasks-mux/src/__tests__/github-issues-backend.test.ts packages/tasks-mux/src/__tests__/external-tracker*.test.ts packages/tasks-mux/src/__tests__/tracker-*.test.ts',
    'npm run typecheck --workspace=@a5c-ai/tasks-mux',
    'npm run lint --workspace=@a5c-ai/tasks-mux',
    'npm run test --workspace=@a5c-ai/tasks-mux',
    'npm run build --workspace=@a5c-ai/tasks-mux',
    'git diff --check',
  ];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const dependencyGate = await ctx.task(dependencyAndSpecIntakeTask, {
    issueContext,
    dependencyContext,
    targetFiles: inputs?.targetFiles ?? [],
    docs: inputs?.docs ?? [],
  }, { key: 'issue-632.dependency-and-spec-intake' });

  if (!dependencyGate?.dependencyReady) {
    await ctx.breakpoint({
      title: 'ExternalTrackerBackend dependency is not ready',
      question: 'Issue #632 depends on #630 ResponderType/TaskRouter work. Should implementation continue against the open dependency branch/PR contract, wait for #630 to merge, or narrow this run to tests/design only?',
      context: {
        runId: ctx.runId,
        dependencyGate,
        dependencyContext,
      },
    });
  }

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    reuseAuditFindings: inputs?.reuseAuditFindings ?? {},
  }, { key: 'issue-632.reuse-audit' });

  const design = await ctx.task(designTrackerContractTask, {
    issueContext,
    dependencyGate,
    reuseAudit,
  }, { key: 'issue-632.design' });

  const regression = await ctx.task(authorContractTestsTask, {
    issueContext,
    design,
    testTargets: inputs?.testTargets ?? [],
  }, { key: 'issue-632.contract-tests' });

  let coreImplementation = null;
  let adapterImplementation = null;
  let syncImplementation = null;
  let qualityGate = null;
  let verificationFeedback = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    coreImplementation = await ctx.task(implementCoreBackendTask, {
      issueContext,
      dependencyGate,
      design,
      regression,
      verificationFeedback,
    }, { key: `issue-632.core.${attempt}` });

    adapterImplementation = await ctx.task(implementAdaptersTask, {
      issueContext,
      design,
      coreImplementation,
      verificationFeedback,
    }, { key: `issue-632.adapters.${attempt}` });

    syncImplementation = await ctx.task(implementSyncAndWebhookTask, {
      issueContext,
      design,
      adapterImplementation,
      verificationFeedback,
    }, { key: `issue-632.sync-webhooks.${attempt}` });

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      implementations: {
        core: coreImplementation,
        adapters: adapterImplementation,
        sync: syncImplementation,
      },
      qualityCommands,
    }, { key: `issue-632.quality-gate.${attempt}` });

    if (
      qualityGate?.passed &&
      qualityGate?.githubIssuesCompatibilityVerified &&
      qualityGate?.providerCoverageVerified &&
      qualityGate?.webhookIdempotencyVerified &&
      qualityGate?.secretRedactionVerified
    ) {
      break;
    }

    verificationFeedback = qualityGate;
  }

  if (
    !qualityGate?.passed ||
    !qualityGate?.githubIssuesCompatibilityVerified ||
    !qualityGate?.providerCoverageVerified ||
    !qualityGate?.webhookIdempotencyVerified ||
    !qualityGate?.secretRedactionVerified
  ) {
    await ctx.breakpoint({
      title: 'ExternalTrackerBackend quality gate failed',
      question: 'The issue #632 quality gate did not pass within the configured attempts. Review the failures before further changes?',
      context: {
        runId: ctx.runId,
        qualityGate,
        implementations: {
          core: coreImplementation,
          adapters: adapterImplementation,
          sync: syncImplementation,
        },
      },
    });
  }

  const review = await ctx.task(reviewTask, {
    issueContext,
    dependencyGate,
    reuseAudit,
    design,
    regression,
    implementations: {
      core: coreImplementation,
      adapters: adapterImplementation,
      sync: syncImplementation,
    },
    qualityGate,
  }, { key: 'issue-632.review' });

  return {
    success: Boolean(
      qualityGate?.passed &&
      qualityGate?.githubIssuesCompatibilityVerified &&
      qualityGate?.providerCoverageVerified &&
      qualityGate?.webhookIdempotencyVerified &&
      qualityGate?.secretRedactionVerified &&
      review?.approved !== false,
    ),
    phases: [
      'dependency-and-spec-intake',
      'reuse-audit',
      'tracker-contract-design',
      'red-phase-contract-tests',
      'external-tracker-core',
      'provider-adapters',
      'bidirectional-sync-and-webhooks',
      'quality-gate',
      'review',
    ],
    dependencyGate,
    reuseAudit,
    design,
    regression,
    implementation: {
      core: coreImplementation,
      adapters: adapterImplementation,
      sync: syncImplementation,
    },
    qualityGate,
    review,
  };
}
