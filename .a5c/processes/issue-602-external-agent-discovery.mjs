/**
 * @process repo/issue-602-external-agent-discovery
 * @description Implement issue #602: SDK external agent discovery API for tasks-mux routing consumers.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxReviewIterations?: number }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, architecture: object, tests: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * This process uses agent tasks rather than shell tasks to respect the
 * repository process-authoring override for direct Babysitter workflows.
 *
 * @process methodologies/pilot-shell/pilot-shell-feature
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/planning-with-files/planning-execution
 * @process processes/shared/tdd-triplet
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 * @agent tdd-enforcer methodologies/pilot-shell/agents/tdd-enforcer/AGENT.md
 * @agent unified-reviewer methodologies/pilot-shell/agents/unified-reviewer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const repositoryContext = [
  'You are working in the a5c-ai/babysitter repository.',
  'This is a planning/execution process for issue #602 only.',
  'Do not implement source changes outside the issue #602 boundary.',
  'Preserve unrelated worktree changes.',
  'Use the Babysitter skill requirements in AGENTS.md when working in this repository.',
].join('\n');

const sourceOfTruthInstructions = [
  'Before making decisions, read the source materials directly at execution time.',
  'Required command/file reads:',
  '- gh issue view 602 --json title,body,labels,comments',
  '- docs/agent-mux-babysitter-integrations/sdk-discovery.md',
  '- docs/agent-mux-babysitter-integrations/tasks-mux-routing.md',
  '- docs/agent-mux-babysitter-integrations/testing.md when selecting tests',
  '- packages/sdk/src/harness/discovery.ts',
  '- packages/sdk/src/harness/install.ts',
  '- packages/sdk/src/harness/index.ts',
  '- packages/sdk/src/index.ts',
  '- packages/adapters/core/src/adapter-registry.ts',
  '- packages/adapters/core/src/model-registry.ts',
  '- packages/adapters/core/src/client.ts',
  '- packages/adapters/cli/src/commands/doctor.ts',
  '- packages/tasks-mux/src/client/responder-matcher.ts',
  '- packages/tasks-mux/src/client/breakpoint-router.ts',
  '- packages/tasks-mux/src/types.ts',
  'Treat the issue body and comments as the authoritative spec. The May 30, 2026 redispatch comment supersedes any prior plan that framed SDK direct dispatch as the consumer.',
].join('\n');

const issueBoundaryInstructions = [
  'Implement the Phase 1 SDK discovery API only.',
  'Required API surface: discoverExternalAgents(options?: { timeout?: number; cwd?: string; force?: boolean }).',
  'Required returned unavailable shape: { available: false, agents: [], defaultProvider: null, defaultModel: null }.',
  'Required discovery strategy: optional agent-mux module discovery first, adapters doctor --json CLI fallback second, graceful unavailable result third.',
  'Required cache behavior: 60 second TTL with force:true invalidation.',
  'Required public exposure: SDK/harness exports so downstream packages can import the API.',
  'Downstream consumers are tasks-mux TaskRouter/matchAgentResponder (#630), process prompts (#605), SDK responderType validation (#635), and AgentMuxResponderBackend (#631).',
  'Do not implement #630, #631, #635, process prompt injection, SDK direct agent dispatch, plugin host tool discovery, or external tracker routing in this issue.',
].join('\n');

function asJson(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

const reuseAuditTask = defineTask(
  'issue-602.reuse-audit',
  async ({ issueNumber }) => ({
    kind: 'agent',
    title: 'Phase 0 reuse audit for issue #602',
    labels: ['issue-602', 'reuse-audit', 'planning'],
    agent: {
      name: 'repo-reuse-auditor',
      prompt: {
        role: 'senior monorepo maintainer',
        task: 'Run the repository reuse audit before planning or implementing issue #602.',
        instructions: [
          repositoryContext,
          sourceOfTruthInstructions,
          `Issue number: ${issueNumber}`,
          'Extract keyword nouns and verbs from the issue and redispatch comment.',
          'Scan for matching migrations, API routes, environment variables, SDK dependencies, imports, discovery helpers, adapter registry clients, responder matching, and tasks-mux routing code.',
          'Include existing infrastructure that should be reused or explicitly avoided.',
          'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Return JSON: { findingsTitle: string, keywords: string[], matchingInfrastructure: Array<{ path: string, reason: string }>, noMatchNotes: string[], implications: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Phase 0 reuse audit for issue #602', labels: ['issue-602', 'reuse-audit'] },
);

const architectureTask = defineTask(
  'issue-602.architecture',
  async ({ issueNumber, reuseAudit }) => ({
    kind: 'agent',
    title: 'Trace issue #602 architecture and implementation boundary',
    labels: ['issue-602', 'architecture', 'sdk', 'tasks-mux', 'agent-mux'],
    agent: {
      name: 'sdk-discovery-architect',
      prompt: {
        role: 'senior TypeScript SDK architect',
        task: 'Trace the live architecture for SDK external agent discovery and define the implementation boundary.',
        instructions: [
          repositoryContext,
          sourceOfTruthInstructions,
          issueBoundaryInstructions,
          `Issue number: ${issueNumber}`,
          'REUSE AUDIT (JSON):',
          asJson(reuseAudit),
          'Trace runtime call paths from the new SDK API and exports to the downstream tasks-mux consumer that will be added by #630.',
          'Differentiate existing SDK harness discovery from the new external agent discovery API.',
          'Identify the minimal local agent-mux client shape needed for optional dynamic import without hard SDK dependency behavior.',
          'Identify the adapters doctor --json output shape and normalization strategy.',
          'Identify files to create/modify and files that must remain out of scope.',
          'Return JSON: { runtimeCallPaths: string[], targetFiles: string[], outOfScopeFiles: string[], publicApiShape: object, optionalDependencyPlan: string[], cliFallbackPlan: string[], capabilityNormalizationPlan: string[], cachePlan: string[], downstreamConsumerContract: string[], risks: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Trace issue #602 architecture', labels: ['issue-602', 'architecture'] },
);

const branchTask = defineTask(
  'issue-602.branch',
  async ({ baseBranch, implementationBranch }) => ({
    kind: 'agent',
    title: 'Prepare implementation branch for issue #602',
    labels: ['issue-602', 'git', 'branch'],
    agent: {
      name: 'git-branch-preparer',
      prompt: {
        role: 'repository maintainer',
        task: 'Prepare the implementation branch for issue #602.',
        instructions: [
          repositoryContext,
          `Base branch: ${baseBranch}`,
          `Implementation branch: ${implementationBranch}`,
          'Check the current branch and worktree status.',
          'Create or switch to the implementation branch from the base branch without overwriting unrelated local changes.',
          'If unrelated local changes would block the branch operation, stop and report the blocker instead of stashing or reverting them.',
          'Return JSON: { branchReady: boolean, currentBranch: string, baseBranch: string, blockers: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Prepare implementation branch', labels: ['issue-602', 'git'] },
);

const testAuthoringTask = defineTask(
  'issue-602.tests',
  async ({ architecture }) => ({
    kind: 'agent',
    title: 'Author failing SDK discovery tests before implementation',
    labels: ['issue-602', 'tdd', 'tests'],
    agent: {
      name: 'sdk-discovery-test-author',
      prompt: {
        role: 'senior TypeScript test engineer',
        task: 'Write focused failing tests for the issue #602 SDK discovery API before implementing it.',
        instructions: [
          repositoryContext,
          sourceOfTruthInstructions,
          issueBoundaryInstructions,
          'ARCHITECTURE (JSON):',
          asJson(architecture),
          'Author tests strictly from the issue/design source materials read during this task.',
          'Primary target test file: packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts.',
          'Use existing SDK harness test style and mocking patterns.',
          'Cover unavailable optional dependency, in-process mocked agent-mux discovery, CLI doctor --json fallback, CLI/module failures, timeout behavior, cache hit within TTL, and force:true cache bypass.',
          'Cover that discovered agents expose installed+authenticated status and string capabilities suitable for tasks-mux matchAgentResponder() in #630.',
          'Do not implement production code in this task.',
          'Run the new targeted test and confirm it fails for the expected reason before handing off.',
          'Return JSON: { testFiles: string[], testsWritten: string[], redCommand: string, expectedFailure: string, notes: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author failing SDK discovery tests', labels: ['issue-602', 'tdd'] },
);

const implementationTask = defineTask(
  'issue-602.implementation',
  async ({ architecture, tests, previousReview }) => ({
    kind: 'agent',
    title: 'Implement SDK external agent discovery API',
    labels: ['issue-602', 'implementation', 'sdk', 'agent-mux'],
    agent: {
      name: 'sdk-discovery-implementer',
      prompt: {
        role: 'senior TypeScript SDK maintainer',
        task: 'Implement the issue #602 SDK external agent discovery API and make the pre-authored tests pass.',
        instructions: [
          repositoryContext,
          sourceOfTruthInstructions,
          issueBoundaryInstructions,
          'ARCHITECTURE (JSON):',
          asJson(architecture),
          'TEST AUTHORING RESULT (JSON):',
          asJson(tests),
          'PREVIOUS REVIEW, IF ANY (JSON):',
          asJson(previousReview),
          'Expected production file: packages/sdk/src/harness/externalAgentDiscovery.ts.',
          'Expected test file: packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts.',
          'Expected export files: packages/sdk/src/harness/index.ts and, if needed for public SDK import ergonomics, packages/sdk/src/index.ts.',
          'Modify packages/sdk/src/harness/discovery.ts only for a narrow integration point required by the issue; do not blend external agent discovery into legacy harness discovery unless the source materials justify it.',
          'Keep @a5c-ai/adapters optional through a dynamic/optional import boundary. Do not introduce a hard runtime dependency from SDK discovery.',
          'Normalize agent-mux adapter registry and CLI doctor data into the requested ExternalAgentInfo and ExternalAgentDiscovery shapes.',
          'Use env defaults AMUX_PROVIDER and AMUX_MODEL for defaultProvider/defaultModel unless the source materials identify an existing richer model registry default that should be preferred.',
          'Keep tasks-mux as the consumer contract only. Do not implement TaskRouter, matchAgentResponder, AgentMuxResponderBackend, SDK direct dispatch, or responderType validation in this phase.',
          'Run the targeted test while implementing, and stop only when the targeted tests pass.',
          'Return JSON: { changedFiles: string[], summary: string, apiShape: object, testsRun: string[], remainingRisks: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement SDK discovery API', labels: ['issue-602', 'implementation'] },
);

const verificationTask = defineTask(
  'issue-602.verification',
  async ({ implementation }) => ({
    kind: 'agent',
    title: 'Run issue #602 quality gates',
    labels: ['issue-602', 'verification', 'quality-gate'],
    agent: {
      name: 'sdk-discovery-verifier',
      prompt: {
        role: 'senior SDK release verifier',
        task: 'Run and report the deterministic quality gates for issue #602.',
        instructions: [
          repositoryContext,
          issueBoundaryInstructions,
          'IMPLEMENTATION RESULT (JSON):',
          asJson(implementation),
          'Run these gates from the repository root and capture pass/fail plus important output:',
          '- targeted Vitest for packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts',
          '- related SDK harness discovery/install tests if present',
          '- npm run build:sdk',
          '- npm run test:sdk',
          '- npm run verify:metadata',
          '- git diff --check',
          '- grep/search guard proving packages/sdk/src/harness/externalAgentDiscovery.ts does not statically import or require @a5c-ai/adapters',
          '- grep/search guard proving no tasks-mux router/backend implementation was added for #630/#631 in this issue branch',
          'If a gate fails, diagnose root cause and return the exact failing command and remediation needed.',
          'Return JSON: { passed: boolean, commands: Array<{ command: string, passed: boolean, summary: string }>, failures: string[], artifactsChecked: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Run issue #602 quality gates', labels: ['issue-602', 'verification'] },
);

const reviewTask = defineTask(
  'issue-602.review',
  async ({ architecture, implementation, verification }) => ({
    kind: 'agent',
    title: 'Review issue #602 against verbatim source materials',
    labels: ['issue-602', 'review', 'quality-gate'],
    agent: {
      name: 'sdk-discovery-reviewer',
      prompt: {
        role: 'senior SDK code reviewer',
        task: 'Review the issue #602 implementation against the source materials and final artifacts.',
        instructions: [
          repositoryContext,
          sourceOfTruthInstructions,
          issueBoundaryInstructions,
          'ARCHITECTURE (JSON):',
          asJson(architecture),
          'IMPLEMENTATION RESULT (JSON):',
          asJson(implementation),
          'VERIFICATION RESULT (JSON):',
          asJson(verification),
          'Read the final diff and relevant files directly during this review.',
          'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
          'Findings must prioritize bugs, API mismatches, optional-dependency regressions, cache bugs, timeout/fallback bugs, public export omissions, and scope creep into #630/#631/#635/#605.',
          'The review is approved only if the revised consumer contract is correct: tasks-mux matchAgentResponder() can later query discovery for installed+authenticated adapters, and SDK does not directly dispatch to agent-mux in this issue.',
          'Return JSON: { approved: boolean, findings: Array<{ severity: string, file: string, line: number, issue: string }>, summary: string, residualRisks: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review issue #602 implementation', labels: ['issue-602', 'review'] },
);

const deliveryTask = defineTask(
  'issue-602.delivery',
  async ({ issueNumber, baseBranch, implementationBranch, review, verification }) => ({
    kind: 'agent',
    title: 'Commit, push, open PR, and comment on issue #602',
    labels: ['issue-602', 'delivery', 'github'],
    agent: {
      name: 'github-delivery-maintainer',
      prompt: {
        role: 'repository maintainer',
        task: 'Deliver the completed issue #602 implementation through GitHub.',
        instructions: [
          repositoryContext,
          `Issue number: ${issueNumber}`,
          `Base branch: ${baseBranch}`,
          `Implementation branch: ${implementationBranch}`,
          'REVIEW RESULT (JSON):',
          asJson(review),
          'VERIFICATION RESULT (JSON):',
          asJson(verification),
          'Only proceed if review.approved is true and verification.passed is true.',
          'Stage only the files changed for issue #602.',
          'Commit with an issue-specific message.',
          'Push the implementation branch.',
          'Create a PR against the base branch that links #602.',
          'In the PR body, summarize SDK discovery API changes, tasks-mux downstream-consumer alignment, and quality gates run.',
          'Post a comment on issue #602 with the implementation PR link and the same concise quality-gate summary.',
          'Return JSON: { delivered: boolean, commit: string, prUrl: string, issueCommentUrl: string, blockers: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Deliver issue #602 implementation', labels: ['issue-602', 'delivery'] },
);

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 602;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const implementationBranch = inputs?.implementationBranch ?? 'agent/issue-602-external-agent-discovery';
  const maxReviewIterations = inputs?.maxReviewIterations ?? 2;

  const reuseAudit = await ctx.task(reuseAuditTask, { issueNumber }, {
    key: 'issue-602.reuse-audit',
  });

  const architecture = await ctx.task(architectureTask, {
    issueNumber,
    reuseAudit,
  }, {
    key: 'issue-602.architecture',
  });

  const branch = await ctx.task(branchTask, {
    baseBranch,
    implementationBranch,
  }, {
    key: 'issue-602.branch',
  });

  const tests = await ctx.task(testAuthoringTask, { architecture }, {
    key: 'issue-602.tests',
  });

  let implementation;
  let verification;
  let review = null;

  for (let iteration = 1; iteration <= maxReviewIterations; iteration += 1) {
    implementation = await ctx.task(implementationTask, {
      architecture,
      tests,
      previousReview: review,
    }, {
      key: `issue-602.implementation.${iteration}`,
    });

    verification = await ctx.task(verificationTask, { implementation }, {
      key: `issue-602.verification.${iteration}`,
    });

    review = await ctx.task(reviewTask, {
      architecture,
      implementation,
      verification,
    }, {
      key: `issue-602.review.${iteration}`,
    });

    if (review?.approved && verification?.passed) {
      break;
    }

    if (iteration >= maxReviewIterations) {
      await ctx.breakpoint({
        title: 'Issue #602 Review Gate Failed',
        question: 'The issue #602 implementation did not pass review or verification within the configured iteration budget. Continue refinement, increase the iteration budget, or stop for manual intervention?',
        options: ['continue refinement', 'stop for manual intervention'],
        context: {
          issueNumber,
          implementationBranch,
          verification,
          review,
        },
      });
    }
  }

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    baseBranch,
    implementationBranch,
    review,
    verification,
  }, {
    key: 'issue-602.delivery',
  });

  return {
    success: Boolean(review?.approved && verification?.passed && delivery?.delivered),
    phases: [
      'reuse-audit',
      'architecture',
      'branch',
      'test-authoring',
      'implementation',
      'verification',
      'review',
      'delivery',
    ],
    reuseAudit,
    architecture,
    branch,
    tests,
    implementation,
    verification,
    review,
    delivery,
    runtimeCallPaths: architecture?.runtimeCallPaths ?? [],
  };
}
