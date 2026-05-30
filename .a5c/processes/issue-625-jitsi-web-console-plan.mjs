/**
 * @process repo/issue-625-jitsi-web-console-plan
 * @description Plan and execute issue #625: Jitsi web console meeting management, settings, recordings, and MCP tools.
 * @inputs { issueNumber: number, dependencyIssueNumber: number, baseBranch: string, targetBranch: string, specFiles: string[], targetSurfaces: object, verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - methodologies/atdd-tdd/atdd-tdd.js
 * - methodologies/feature-driven-development/examples/brownfield.json
 * - specializations/web-development/nextjs-fullstack-app.js
 * - specializations/web-development/api-integration-testing.js
 * - specializations/web-development/e2e-testing-playwright.js
 * - specializations/cli-mcp-development/mcp-tool-implementation.js
 * - specializations/cli-mcp-development/mcp-server-security-hardening.js
 * - specializations/qa-testing-automation/quality-gates.js
 *
 * @agent web-fullstack-architect specializations/web-development/agents/web-fullstack-architect/AGENT.md
 * @agent mcp-tool-designer specializations/cli-mcp-development/agents/mcp-tool-designer/AGENT.md
 * @agent mcp-security-auditor specializations/cli-mcp-development/agents/mcp-security-auditor/AGENT.md
 * @agent mcp-testing-expert specializations/cli-mcp-development/agents/mcp-testing-expert/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent quality-assessor specializations/meta/agents/quality-assessor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readAuthoritativeIssueContextTask, inputs, {
    key: 'issue-625.read-authoritative-context',
  });

  const reuseAudit = await ctx.task(runReuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-625.reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceKrateJitsiRuntimeSurfacesTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-625.trace-runtime-surfaces',
  });

  const dependencyDecision = await ctx.task(assessIssue624DependencyTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-625.assess-issue-624-dependency',
  });

  if (dependencyDecision?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #625 Dependency Decision',
      question: dependencyDecision.question,
      options: ['Proceed using frozen #624 contracts', 'Pause until #624 lands'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-625', 'jitsi', 'dependency'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        dependencyIssueNumber: inputs.dependencyIssueNumber,
        dependencyDecision,
      },
    });
  }

  const acceptanceTests = await ctx.task(authorSpecDrivenAcceptanceTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    dependencyDecision,
  }, {
    key: 'issue-625.author-acceptance-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementJitsiWebConsoleSlicesTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      dependencyDecision,
      acceptanceTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-625.implementation.${attempt}`,
    });

    verification = await ctx.task(runQualityGateTask, {
      inputs,
      issueContext,
      acceptanceTests,
      implementation,
      attempt,
    }, {
      key: `issue-625.quality-gate.${attempt}`,
    });

    review = await ctx.task(reviewSecurityUxAndContractTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      dependencyDecision,
      acceptanceTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-625.review.${attempt}`,
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
    runtimeTrace,
    dependencyDecision,
    acceptanceTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-625.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'authoritative-issue-context',
      'reuse-audit',
      'runtime-surface-trace',
      'issue-624-dependency-readiness',
      'spec-driven-acceptance-tests',
      'implementation-loop',
      'quality-gates',
      'security-ux-contract-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    reuseAudit,
    dependencyDecision,
    acceptanceTests,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readAuthoritativeIssueContextTask = defineTask('issue-625.read-authoritative-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #625, dependency #624, and Jitsi specs',
  labels: ['krate', 'jitsi', 'research', 'issue-context'],
  agent: {
    name: 'web-fullstack-architect',
    prompt: {
      role: 'senior Krate full-stack engineer',
      task: 'Produce the authoritative implementation spec for issue #625 before any implementation work.',
      instructions: [
        `Run and preserve the output of: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Run and preserve the output of: gh issue view ${args.dependencyIssueNumber} --json title,body,labels,comments`,
        `Confirm whether #${args.issueNumber} is a PR by attempting: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read every file in inputs.specFiles. Treat packages/krate/docs/jitsi/04-web-management.md as the primary product spec and packages/krate/docs/jitsi/03-crds-and-controllers.md as the dependency contract.',
        'Return the exact issue title, labels, comments, dependency status, raw spec excerpts needed by downstream tasks, acceptance criteria, non-goals, risks, and any ambiguity that would require a maintainer decision.',
        'Return JSON: { title, labels, rawIssue, comments, dependencyIssue, specFilesRead, acceptanceCriteria, nonGoals, risks, ambiguities, targetSurfaces }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runReuseAuditTask = defineTask('issue-625.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for Jitsi meetings infrastructure',
  labels: ['krate', 'jitsi', 'reuse-audit', 'brownfield'],
  agent: {
    name: 'web-fullstack-architect',
    prompt: {
      role: 'senior brownfield architecture investigator',
      task: 'Run the mandatory reuse audit before proposing new infrastructure.',
      instructions: [
        'Extract keyword nouns and verbs from the issue and specs: Jitsi, meeting, meetings, recording, recordings, template, templates, provider, providers, join, invite, record, webhook, settings, MCP.',
        'Check for .a5c/reuse-audit.json. If absent, say so explicitly and use repo-wide Krate globs.',
        'Scan for matching migrations, API routes, environment variables, SDK dependencies, imports, resource kinds, controllers, components, settings forms, navigation groups, MCP tools, CRDs, and tests.',
        'Render a top-level section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'If no matching existing Jitsi implementation exists, include a concise "No matching existing Jitsi implementation found" note, while still listing adjacent reusable Krate infrastructure.',
        'Use ISSUE_CONTEXT below as source material:',
        JSON.stringify(args.issueContext, null, 2),
        'Return JSON: { heading, keywords, configFound, directMatches, adjacentInfrastructure, noMatchNotes, reuseRecommendations, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceKrateJitsiRuntimeSurfacesTask = defineTask('issue-625.trace-runtime-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate web, API, resource, and MCP execution surfaces',
  labels: ['krate', 'jitsi', 'runtime-trace', 'architecture'],
  agent: {
    name: 'web-fullstack-architect',
    prompt: {
      role: 'senior Krate architecture engineer',
      task: 'Trace live execution paths that issue #625 must extend.',
      instructions: [
        'Start from the reuse audit and inspect the current branch before planning file edits.',
        'Trace org-scoped web navigation from orgNavigationGroups to /orgs/[org] pages and shared loadKrateUi data hydration.',
        'Trace authenticated org API route patterns, including withAuth, errorResponse, orgNamespaceName, controller list/get/apply/delete helpers, cache invalidation, and webhook exceptions.',
        'Trace resource-model kind registration, validation, createResource/listResourceDefinitions/resourceSchemaForKind, CRD manifests, and existing resource contract tests.',
        'Trace MCP_TOOLS, executeTool, createMcpServer tests, and mock-controller patterns.',
        'Trace settings page composition through AppSettingsPage and existing settings components.',
        'Return JSON: { runtimeCallPaths, liveExecutionFiles, missingJitsiSurfaces, likelyFilesToChange, testsToAddOrUpdate, APIAuthPatterns, MCPPatterns, settingsPatterns, risks, outOfScope }.',
        'REUSE_AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const assessIssue624DependencyTask = defineTask('issue-625.assess-issue-624-dependency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess #624 Jitsi CRD and controller readiness',
  labels: ['krate', 'jitsi', 'dependency', 'schema'],
  agent: {
    name: 'web-fullstack-architect',
    prompt: {
      role: 'senior integration engineer',
      task: 'Decide whether issue #625 can proceed based on the #624 schema/controller dependency.',
      instructions: [
        'Inspect the current branch and GitHub issue/PR state for #624. Determine whether JitsiMeetProvider, JitsiMeetingTemplate, JitsiMeeting, JitsiParticipant if present in #624, and JitsiRecording contracts are landed, partially present, or absent.',
        'If #624 is not landed, define the smallest frozen contract that implementation can use without diverging from packages/krate/docs/jitsi/03-crds-and-controllers.md.',
        'Do not silently scope down issue #625. If proceeding would require inventing contracts that #624 has not frozen, set needsMaintainerDecision true and ask exactly one question.',
        'Return JSON: { dependencyState, frozenContracts, canProceed, needsMaintainerDecision, question, blockerRisks, coordinationPlan }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
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

export const authorSpecDrivenAcceptanceTestsTask = defineTask('issue-625.author-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author spec-driven acceptance and contract tests before implementation',
  labels: ['krate', 'jitsi', 'tests', 'atdd'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior Krate test engineer',
      task: 'Add failing or pending acceptance tests that lock issue #625 behavior before implementation.',
      instructions: [
        'Own test files only in this task. Do not modify implementation files.',
        'Read the issue and spec files directly from disk before writing tests. Author tests strictly from those specs and the current Krate route/test patterns.',
        'Cover at minimum: Jitsi resource definitions and validation contracts, org-scoped authenticated Jitsi API routes including webhook signature behavior, page structure for all meetings/templates/recordings routes, component/barrel exports for app/components/jitsi, navigation/settings integration, and four MCP tool definitions plus handler behavior.',
        'Prefer existing test styles in packages/krate/core/tests, packages/krate/web/tests, and packages/krate/cli/tests/mcp-server.test.js.',
        'Where the branch lacks #624 contracts, encode tests against dependencyDecision.frozenContracts rather than inventing unrelated schemas.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, coveredCriteria, commandsToRun, risks }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE_AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY_DECISION:',
        JSON.stringify(args.dependencyDecision, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementJitsiWebConsoleSlicesTask = defineTask('issue-625.implement-slices', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Jitsi web console slices attempt ${args.attempt}`,
  labels: ['krate', 'jitsi', 'implementation', 'full-stack'],
  agent: {
    name: 'web-fullstack-architect',
    prompt: {
      role: 'senior Krate full-stack engineer',
      task: 'Implement issue #625 in staged, testable slices.',
      instructions: [
        'Keep implementation scoped to live execution files identified by runtimeTrace and issue #625. Do not perform unrelated refactors.',
        'Slice 1: add or align Jitsi resource model/schema support needed by web/API/MCP, respecting #624 contracts and tests.',
        'Slice 2: add shared Jitsi service/controller helpers for providers, meetings, templates, recordings, join URLs/JWT payloads, invite, recording start/stop, and webhook ingest boundaries.',
        'Slice 3: add authenticated Next.js API routes under /api/orgs/[org]/jitsi/*, with withAuth on all non-webhook routes and mandatory signature validation for webhooks/ingest.',
        'Slice 4: add app/components/jitsi/* and all /orgs/[org]/meetings* pages, including templates, recordings, embedded meeting, participant list, controls, and recording playback/transcript states.',
        'Slice 5: add Meetings navigation and settings integration for Jitsi provider, TTL, auto-record, lobby, max agents, and agent auto-join settings using existing Krate settings patterns.',
        'Slice 6: add krate_create_meeting, krate_join_meeting, krate_list_meetings, and krate_invite_to_meeting MCP tools through the same backend/resource semantics as the API.',
        'Preserve auth, org scoping, cache invalidation, resource validation, and event emission patterns already used by adjacent Krate code.',
        'Use previous verification and review feedback to refine only failing surfaces.',
        'Return JSON: { changedFiles, implementedSlices, resourceSemantics, apiSemantics, uiSemantics, settingsSemantics, mcpSemantics, securitySemantics, testsExpectedToPass, deferredItems }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE_AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY_DECISION:',
        JSON.stringify(args.dependencyDecision, null, 2),
        'ACCEPTANCE_TESTS:',
        JSON.stringify(args.acceptanceTests, null, 2),
        'PREVIOUS_VERIFICATION:',
        JSON.stringify(args.previousVerification, null, 2),
        'PREVIOUS_REVIEW:',
        JSON.stringify(args.previousReview, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runQualityGateTask = defineTask('issue-625.quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run quality gates attempt ${args.attempt}`,
  labels: ['krate', 'jitsi', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior verification engineer',
      task: 'Run the full issue #625 verification matrix and report exact outcomes.',
      instructions: [
        'Run every command in inputs.verificationCommands from the repository root unless a command states another working directory.',
        'Also run any commands listed by acceptanceTests.commandsToRun and any narrower failing test commands needed to debug failures.',
        'Verify the implemented file set covers every route, component, settings field, and MCP tool named in the issue and docs.',
        'For browser or iframe-heavy surfaces, run Playwright smoke coverage when available. If the environment cannot run it, record the concrete blocker and residual risk.',
        'Return JSON: { passed, commandResults, failedCommands, specCoverage, authCoverage, mcpCoverage, browserCoverage, residualRisks, requiredFixes }.',
        'INPUT_VERIFICATION_COMMANDS:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'ACCEPTANCE_TESTS:',
        JSON.stringify(args.acceptanceTests, null, 2),
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewSecurityUxAndContractTask = defineTask('issue-625.review-security-ux-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review security, UX, and contract alignment attempt ${args.attempt}`,
  labels: ['krate', 'jitsi', 'review', 'security', 'ux', 'mcp'],
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior security, UX, and API contract reviewer',
      task: 'Review the implementation against issue #625, Jitsi docs, Krate conventions, and verification output.',
      instructions: [
        'Prioritize blocking findings: missing auth, webhook signature bypass, long-lived or leaked JWTs, org-scoping bugs, API/MCP semantic divergence, missing route/page/component surfaces, recording playback/transcript gaps, and UI patterns that conflict with existing Krate console style.',
        'Confirm the MCP tools route through the same resource/controller semantics as the web API rather than duplicating incompatible behavior.',
        'Confirm the UI is operational, dense, and consistent with the existing Krate application rather than a marketing page or static mock.',
        'Set approved true only when the implementation satisfies the issue and verification passed or remaining risks are explicitly acceptable.',
        'Return JSON: { approved, findings, blockingFindings, specCoverageNotes, securityNotes, uxNotes, mcpNotes, requiredFixes }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION:',
        JSON.stringify(args.verification, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-625.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #625',
  labels: ['krate', 'jitsi', 'final-acceptance'],
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior release readiness reviewer',
      task: 'Decide whether issue #625 is complete and ready for PR.',
      instructions: [
        'Compare the original issue and docs directly to the produced artifacts and verification output.',
        'Require every listed page, API route, component, settings field, sidebar link, recording surface, and MCP tool to be present or explicitly called out as blocked by #624.',
        'Require withAuth on every non-webhook API route and signature validation on webhook ingest.',
        'Require resource/API/MCP semantics to share org-scoped Krate resource contracts.',
        'Require all feasible verification commands to pass. If a command could not run, include the exact reason and whether that blocks acceptance.',
        'Return JSON: { passed, changedFiles, completeCriteria, incompleteCriteria, verificationSummary, reviewSummary, risks, prSummary }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE_AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY_DECISION:',
        JSON.stringify(args.dependencyDecision, null, 2),
        'ACCEPTANCE_TESTS:',
        JSON.stringify(args.acceptanceTests, null, 2),
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION:',
        JSON.stringify(args.verification, null, 2),
        'REVIEW:',
        JSON.stringify(args.review, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
