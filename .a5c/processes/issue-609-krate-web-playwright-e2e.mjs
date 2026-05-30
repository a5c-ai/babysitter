/**
 * @process repo/issue-609-krate-web-playwright-e2e
 * @description Implement issue #609: add Playwright E2E coverage for the Krate web console against staging.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, stagingUrl: string, e2eRoot: string, dependencyIssues: number[], routeSmokeMatrix: string[], crudFlows: object[], serviceDependentFlows: object[], qualityGateCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], testPlan: object, verification: object, review: object, finalGate: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/docs/gaps/testing-gaps.md
 * - packages/krate/docs/gaps/staging-status.md
 * - packages/krate/docs/gaps/README.md
 * - packages/krate/web/README.md
 * - packages/krate/web/playwright.config.js
 * - packages/krate/web/e2e/smoke.spec.js
 * - library/methodologies/atdd-tdd/README.md
 * - library/methodologies/bdd-specification-by-example/README.md
 * - library/specializations/qa-testing-automation/README.md
 * - library/specializations/web-development/README.md
 * - .a5c/processes/issue-625-jitsi-web-console-plan.mjs
 * - .a5c/processes/issue-608-staging-env-vars.mjs
 *
 * Process-library note: this checkout does not contain .a5c/process-library/.
 * The matching methodology and specialization sources are available under the
 * repo-local library/ tree, especially ATDD/TDD, BDD/specification-by-example,
 * QA testing automation, and web development. The process still includes an
 * explicit research task that must report source availability at execution time
 * and fall back to repo-local process examples and process-authoring policy
 * when a requested source is absent.
 *
 * Repo policy note: direct babysitter processes in this repo should avoid
 * shell-task subtasks unless explicitly requested. This process therefore uses
 * agent tasks for implementation, verification, and evidence capture.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 609;

  const issueContext = await ctx.task(readIssueContextTask, { ...inputs, issueNumber }, {
    key: 'issue-609.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueContext }, {
    key: 'issue-609.reuse-audit',
  });

  const processResearch = await ctx.task(researchProcessLibraryTask, { inputs, issueContext, reuseAudit }, {
    key: 'issue-609.process-library-research',
  });

  const runtimeTrace = await ctx.task(traceKrateWebE2ESurfacesTask, {
    inputs,
    issueContext,
    reuseAudit,
    processResearch,
  }, {
    key: 'issue-609.trace-krate-web-e2e-surfaces',
  });

  const readiness = await ctx.task(assessStagingAndDependencyReadinessTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-609.assess-staging-readiness',
  });

  if (readiness?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Krate E2E Staging Readiness',
      question: readiness.question || 'Confirm the staging auth and shared-data isolation strategy before CRUD E2E tests mutate staging resources.',
      options: [
        'Proceed with isolated staging test resources',
        'Limit implementation to non-mutating and env-gated tests',
        'Pause until staging auth and dependencies are documented',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-609', 'krate-web', 'playwright', 'staging'],
      context: {
        runId: ctx.runId,
        issueNumber,
        readiness,
      },
    });
  }

  const testPlan = await ctx.task(authorE2ETestPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    processResearch,
    runtimeTrace,
    readiness,
  }, {
    key: 'issue-609.author-e2e-test-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementPlaywrightE2ETestsTask, {
      inputs,
      issueContext,
      runtimeTrace,
      readiness,
      testPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-609.implementation.${attempt}`,
    });

    verification = await ctx.task(runE2EQualityGateTask, {
      inputs,
      issueContext,
      readiness,
      testPlan,
      implementation,
      attempt,
    }, {
      key: `issue-609.quality-gate.${attempt}`,
    });

    review = await ctx.task(reviewE2ECoverageAndStabilityTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      readiness,
      testPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-609.review.${attempt}`,
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
    processResearch,
    runtimeTrace,
    readiness,
    testPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-609.final-acceptance',
  });

  const delivery = await ctx.task(deliverIssue609Task, {
    inputs,
    issueNumber,
    branchName: inputs?.branchName ?? 'plan/issue-609',
    finalGate,
    verification,
    review,
  }, {
    key: 'issue-609.delivery',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'authoritative-issue-context',
      'reuse-audit',
      'process-library-research',
      'krate-web-e2e-surface-trace',
      'staging-and-dependency-readiness',
      'e2e-test-plan',
      'implementation-loop',
      'quality-gates',
      'coverage-and-stability-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    issueContext,
    reuseAudit,
    processResearch,
    runtimeTrace,
    readiness,
    testPlan,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const readIssueContextTask = defineTask('issue-609.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #609 and related GitHub context',
  labels: ['issue-609', 'krate-web', 'github', 'context'],
  agent: {
    name: 'krate-e2e-test-architect',
    prompt: {
      role: 'senior Krate web testing architect',
      task: 'Read the authoritative GitHub context for issue #609 before any implementation work.',
      instructions: [
        `Run and preserve the output of: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm whether #${args.issueNumber} is a PR by attempting: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read all comments and labels. Treat the comment that smoke Playwright coverage already exists as authoritative; do not plan duplicate smoke-only work.',
        'Read dependency issue #608 with gh issue view 608 --json title,body,labels,comments and record whether assistant/agent-flow tests can be fully enabled or must remain env-gated.',
        'Return JSON: { title, labels, comments, dependencyIssue608, acceptanceCriteria, staleClaims, risks, nonGoals }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-609.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for Krate web E2E testing',
  labels: ['issue-609', 'krate-web', 'reuse-audit', 'phase:0'],
  agent: {
    name: 'krate-e2e-test-architect',
    prompt: {
      role: 'senior brownfield testing investigator',
      task: 'Run the mandatory reuse audit before proposing test infrastructure.',
      instructions: [
        'Extract keyword nouns and verbs from the issue: Playwright, E2E, staging, smoke, CRUD, stack, trigger rule, project, memory repo, dispatch, session, transcript, assistant, playground, provider wizard, sync, EventSource, SSE, auth cookies.',
        'Check for .a5c/reuse-audit.json. If absent, say so explicitly and use repo-wide Krate web globs.',
        'Render a top-level section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Scan for matching Playwright config, existing e2e tests, package scripts, auth helpers, route handlers, resource CRUD helpers, page/component flows, env vars, CI workflows, and docs.',
        'Call out that packages/krate/web/playwright.config.js currently uses testDir ./e2e, while the issue text says packages/krate/web/tests/e2e/. Decide whether to extend the current e2e directory or intentionally update config and scripts.',
        'Return JSON: { heading, keywords, configFound, existingE2E, reusableHelpers, targetFiles, mismatches, reuseRecommendations, risks }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-609.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process methodologies and testing specializations',
  labels: ['issue-609', 'process-library', 'research'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process architect',
      task: 'Research process-library guidance relevant to Playwright E2E implementation.',
      instructions: [
        'Inspect .a5c/process-library/ if present. In this repo, also inspect library/methodologies/ and library/specializations/ for the local process library.',
        'Use library/methodologies/atdd-tdd/README.md for outside-in acceptance tests and executable "done" criteria.',
        'Use library/methodologies/bdd-specification-by-example/README.md for concrete workflow examples, user-visible behavior, and living documentation.',
        'Use library/specializations/qa-testing-automation/README.md for E2E testing strategy, maintainable automation, CI feedback, and flakiness controls.',
        'Use library/specializations/web-development/README.md for full-stack browser/API integration, auth, routing, and frontend-backend workflow considerations.',
        'Look specifically for brownfield feature work, Playwright E2E, web full-stack, test-strategy, staging-environment management, and verification-before-completion guidance.',
        'If .a5c/process-library/ is absent, say so explicitly but do not treat that as total process-library absence when library/methodologies or library/specializations exist.',
        'Fall back to docs/agent-reference/process-authoring.md plus existing process examples under .a5c/processes/ only for guidance not covered by the local library sources.',
        'Summarize the methodology constraints this run must follow: tests before implementation where practical, isolated staging resources, env-gated service-dependent flows, retries only after diagnosing flake causes, and evidence-backed quality gates.',
        'Return JSON: { sourcesFound, sourcesMissing, selectedMethodologies, selectedSpecializations, constraints, processShape, breakpointPolicy, fallbacksUsed }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceKrateWebE2ESurfacesTask = defineTask('issue-609.trace-krate-web-e2e-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate web E2E routes, APIs, and UI flows',
  labels: ['issue-609', 'krate-web', 'runtime-trace', 'playwright'],
  agent: {
    name: 'krate-web-fullstack-engineer',
    prompt: {
      role: 'senior Krate web full-stack engineer',
      task: 'Trace the live execution surfaces that the Playwright tests must exercise.',
      instructions: [
        'Inspect packages/krate/web/playwright.config.js, packages/krate/web/e2e/smoke.spec.js, and packages/krate/web/package.json.',
        'Trace org-scoped navigation from packages/krate/web/app/lib/krate-ui.jsx and PageFrame/sidebar rendering.',
        'Trace dashboard and major routes: /orgs/[org], /agents, /inference, /external, /repositories, /settings, /playground, /costs.',
        'Trace CRUD implementations for AgentStack, AgentTriggerRule, KrateProject, and AgentMemoryRepository through UI components and /api/orgs/[org]/resources routes.',
        'Trace agent dispatch through stack actions, /api/orgs/[org]/agents/dispatch, run detail, session detail, and transcript components.',
        'Trace external provider wizard and /api/orgs/[org]/external/sync.',
        'Trace assistant chat/playground APIs and the known #608 env dependency.',
        'Trace SSE/EventSource surfaces including /api/watch/[[...resource]], /api/orgs/[org]/agents/events/stream, live-updates.jsx, notification-bell.jsx, and code-editor.jsx.',
        'Return JSON: { playwrightConfig, existingTests, routeMatrix, crudFlowSurfaces, serviceDependentSurfaces, sseSurfaces, authSurfaces, likelyFilesToChange, testDataIsolationPlan, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const assessStagingAndDependencyReadinessTask = defineTask('issue-609.assess-staging-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess staging auth, data isolation, and #608 readiness',
  labels: ['issue-609', 'staging', 'dependency', 'quality-gate'],
  agent: {
    name: 'krate-e2e-test-architect',
    prompt: {
      role: 'senior E2E reliability engineer',
      task: 'Decide what can be run safely and deterministically against staging.',
      instructions: [
        'Determine how Playwright should authenticate against staging. Prefer existing documented auth storage state, delegated auth headers, or test-only auth fixtures; do not invent production auth bypasses.',
        'Define unique per-run resource names, tags/labels, and cleanup requirements for all CRUD tests so shared staging data is not damaged.',
        'Classify each flow as always-run, env-gated, dependency-gated by #608, or skip-with-diagnostic.',
        'Service-backed agent dispatch, assistant chat, and playground model calls must be gated until #608 has configured staging services. CRD-level dispatch can still be tested if it is explicit about expected limits.',
        'Set needsMaintainerDecision true only if no noninteractive auth/data isolation path is discoverable or if test execution would require destructive shared-staging behavior.',
        'Return JSON: { authPlan, dataIsolationPlan, dependencyStatus, runnableFlows, gatedFlows, skipPolicy, needsMaintainerDecision, question, risks }.',
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorE2ETestPlanTask = defineTask('issue-609.author-e2e-test-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author Playwright E2E test matrix and fixture design',
  labels: ['issue-609', 'playwright', 'test-plan', 'atdd'],
  agent: {
    name: 'playwright-test-strategy-architect',
    prompt: {
      role: 'Playwright E2E test strategy architect',
      task: 'Produce the concrete test plan before editing test files.',
      instructions: [
        'Partition tests into stable files such as auth.setup or fixtures, navigation smoke, resource CRUD, external providers, live updates/SSE, and service-dependent agent/assistant/playground specs.',
        'Prefer packages/krate/web/e2e unless the plan intentionally changes playwright.config.js and package scripts to use packages/krate/web/tests/e2e.',
        'Define reusable helpers for unique names, API-side setup/cleanup, route-safe navigation, console/pageerror capture, auth storage state, and conditional test.skip annotations for missing env/services.',
        'For navigation smoke, assert pages render without console/page errors, raw Next.js errors, or internal server errors, and assert stable landmarks/sidebar links rather than incidental prose.',
        'For CRUD, use UI actions where feasible and API cleanup in afterEach/afterAll. Cover create, list visibility, edit/toggle where applicable, and delete for stack, trigger rule, project, and memory repository.',
        'For agent dispatch/session/transcript and assistant/playground, encode explicit #608 gates so absent services produce skip diagnostics rather than false failures.',
        'For external provider sync and SSE, cover at least one wizard-created provider/binding path and one EventSource connection/event-reception path with timeout-safe cleanup.',
        'Return JSON: { filesToCreateOrUpdate, fixtures, routeSmokeTests, crudTests, externalProviderTests, sseTests, serviceDependentTests, selectorsStrategy, cleanupStrategy, qualityGates }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementPlaywrightE2ETestsTask = defineTask('issue-609.implement-playwright-e2e-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Krate Playwright E2E tests attempt ${args.attempt}`,
  labels: ['issue-609', 'krate-web', 'implementation', 'playwright'],
  agent: {
    name: 'krate-web-fullstack-engineer',
    prompt: {
      role: 'senior Krate web engineer implementing browser tests',
      task: 'Implement the planned Playwright E2E coverage without changing product behavior except for testability hooks that are justified by the plan.',
      instructions: [
        'Work only in files required by the accepted test plan, primarily packages/krate/web/e2e and package/config files if needed.',
        'Do not duplicate the existing smoke.spec.js coverage; extend it only when it is the most maintainable place.',
        'Add helpers/fixtures for auth, unique test data, API cleanup, console/pageerror capture, and env-gated skips.',
        'Use robust Playwright selectors: roles, labels, stable accessible names, URLs, and explicit data attributes only if the UI has no accessible selector.',
        'CRUD tests must create resources with unique issue-609/e2e names and delete them even when assertions fail.',
        'Service-dependent tests must be tagged or skipped using explicit env/readiness checks until #608 is available; their skip output must explain the missing dependency.',
        'Avoid broad source refactors, unrelated UI changes, and destructive staging assumptions.',
        'Return JSON: { changedFiles, testsAdded, helpersAdded, gatedTests, cleanupMechanisms, notes }.',
        'TEST_PLAN:',
        JSON.stringify(args.testPlan, null, 2),
        'PREVIOUS_VERIFICATION:',
        JSON.stringify(args.previousVerification ?? null, null, 2),
        'PREVIOUS_REVIEW:',
        JSON.stringify(args.previousReview ?? null, null, 2),
      ],
    },
    timeout: 600_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runE2EQualityGateTask = defineTask('issue-609.run-e2e-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Krate web E2E quality gates attempt ${args.attempt}`,
  labels: ['issue-609', 'verification', 'quality-gate', 'playwright'],
  agent: {
    name: 'playwright-qa-engineer',
    prompt: {
      role: 'senior QA automation engineer',
      task: 'Run and interpret the issue #609 quality gates.',
      instructions: [
        'Run the configured qualityGateCommands from inputs, starting with targeted Playwright specs and then the broader krate-web structural/build gates.',
        'When KRATE_E2E_URL is unavailable locally, run localhost-backed tests through the existing Playwright webServer. When staging is configured, run test:e2e:staging and record the URL without exposing secrets.',
        'Capture Playwright reports, traces, console errors, page errors, skipped tests with reasons, and cleanup results.',
        'If a failure is caused by missing #608 services, classify it as dependency-gated only if the spec was correctly skipped or explicitly expected to fail pending #608; otherwise fail the gate.',
        'Return JSON: { passed, commands, testResults, skippedWithReasons, consoleErrors, cleanupEvidence, failures, dependencyGated, artifacts }.',
        'QUALITY_GATE_COMMANDS:',
        JSON.stringify(args.inputs?.qualityGateCommands ?? [], null, 2),
      ],
    },
    timeout: 900_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewE2ECoverageAndStabilityTask = defineTask('issue-609.review-e2e-coverage-and-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review E2E coverage and flake risk attempt ${args.attempt}`,
  labels: ['issue-609', 'review', 'quality-gate', 'flake-risk'],
  agent: {
    name: 'e2e-coverage-reviewer',
    prompt: {
      role: 'senior test reviewer',
      task: 'Review the implementation for coverage, reliability, cleanup safety, and maintainability.',
      instructions: [
        'Lead with blocking findings. Check that every issue #609 acceptance area is covered, explicitly env-gated, or intentionally deferred with #608 linkage.',
        'Reject brittle selectors, tests that depend on shared staging data, missing cleanup, unbounded waits, hidden product behavior changes, or tests that pass while exercising only API non-500 responses.',
        'Confirm the directory/config mismatch from the issue text was handled so Playwright discovers the new tests.',
        'Confirm CRUD tests actually submit browser forms or exercise user-visible controls where feasible, not only raw API requests.',
        'Confirm service-dependent tests provide actionable skip diagnostics and can be enabled by documented env variables.',
        'Return JSON: { approved, findings, coverageMap, flakeRisks, cleanupAssessment, missingTests, recommendations }.',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION:',
        JSON.stringify(args.verification, null, 2),
      ],
    },
    timeout: 300_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-609.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #609',
  labels: ['issue-609', 'final-gate', 'playwright', 'krate-web'],
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'release-quality assessor',
      task: 'Decide whether issue #609 is complete and ready for review.',
      instructions: [
        'Pass only if the test suite adds meaningful browser-level Playwright coverage for navigation, CRUD, external provider/sync, SSE/live updates, and #608-gated agent/assistant/playground flows.',
        'Pass only if verification commands pass, all skips are explicit and justified, cleanup evidence exists, and the review has no blockers.',
        'Fail if the result only adds structural/file-pattern tests or API non-500 checks.',
        'Return JSON: { passed, changedFiles, coverageSummary, verificationSummary, gatedBy608, residualRisks, prSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue609Task = defineTask('issue-609.delivery', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, and comment on PR #688',
  labels: ['issue-609', 'issue-688', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add packages/krate/web .a5c/processes/issue-609-krate-web-playwright-e2e.mjs .a5c/processes/issue-609-krate-web-playwright-e2e.inputs.json',
      'git diff --cached --check',
      'if ! git diff --cached --quiet; then git commit -m "test(krate-web): add Playwright E2E coverage"; else echo "No staged changes to commit"; fi',
      'git push -u origin "$BRANCH_NAME"',
      'gh issue comment 688 --body "$COMMENT_BODY"',
    ].join('\n'),
    env: {
      BRANCH_NAME: args.branchName,
      COMMENT_BODY: [
        'Implemented the plan in PR #688 for issue #609.',
        '',
        'Summary:',
        '- Added Krate web Playwright E2E coverage for browser-rendered navigation and workflow surfaces.',
        '- Included isolated issue-609 test data patterns, cleanup, and #608-aware service gates.',
        '- Ran the process verification gates recorded in the Babysitter run.',
        '',
        `Final gate: ${args.finalGate?.passed === true ? 'passed' : 'not passed'}`,
      ].join('\n'),
    },
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
