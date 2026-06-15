/**
 * @process repo/issue-621-agent-identity-web-console
 * @description Plan and execute issue #621: Kradle agent identity web console directory, profile pages, create wizard, typed APIs, and persona-aware existing UI.
 * @inputs { issueNumber: number, dependencyIssueNumber: number, baseBranch: string, targetBranch: string, specFiles: string[], targetSurfaces: object, verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/kradle/docs/agent-identity/03-web-experience.md
 * - packages/kradle/docs/agent-identity/01-resource-model.md
 * - packages/kradle/docs/agent-identity/02-migration.md
 * - library/methodologies/atdd-tdd/atdd-tdd.js
 * - library/methodologies/feature-driven-development/feature-driven-development.js
 * - library/specializations/web-development/nextjs-fullstack-app.js
 * - library/specializations/web-development/api-integration-testing.js
 * - library/specializations/web-development/e2e-testing-playwright.js
 * - library/specializations/qa-testing-automation/quality-gates.js
 * - .a5c/processes/issue-625-jitsi-web-console-plan.mjs
 *
 * Note: the requested .a5c/process-library/ path was not present in this
 * checkout. The plan uses the repo's local library/ methodologies and
 * specializations plus adjacent .a5c/processes conventions.
 *
 * @agent fullstack-architect library/specializations/web-development/agents/fullstack-architect/AGENT.md
 * @agent frontend-architect library/specializations/web-development/agents/frontend-architect/AGENT.md
 * @agent api-testing-expert library/specializations/qa-testing-automation/agents/api-testing-expert/AGENT.md
 * @agent test-strategy-architect library/specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent e2e-automation-expert library/specializations/qa-testing-automation/agents/e2e-automation-expert/AGENT.md
 * @agent quality-assessor library/specializations/meta/agents/quality-assessor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readAuthoritativeIssueContextTask, inputs, {
    key: 'issue-621.read-authoritative-context',
  });

  const reuseAudit = await ctx.task(runReuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-621.reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceKradleAgentIdentityWebTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-621.trace-runtime-surfaces',
  });

  const dependencyReadiness = await ctx.task(assessIssue620DependencyTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-621.assess-issue-620-readiness',
  });

  if (dependencyReadiness?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #621 Agent Identity Dependency Decision',
      question: dependencyReadiness.question,
      options: ['Proceed using landed #620 contracts', 'Pause until core identity contracts are clarified'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-621', 'agent-identity', 'dependency'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        dependencyIssueNumber: inputs.dependencyIssueNumber,
        dependencyReadiness,
      },
    });
  }

  const acceptanceTests = await ctx.task(authorAcceptanceTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    dependencyReadiness,
  }, {
    key: 'issue-621.author-acceptance-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementAgentIdentityWebConsoleTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      dependencyReadiness,
      acceptanceTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-621.implementation.${attempt}`,
    });

    verification = await ctx.task(runQualityGateTask, {
      inputs,
      issueContext,
      acceptanceTests,
      implementation,
      attempt,
    }, {
      key: `issue-621.quality-gate.${attempt}`,
    });

    review = await ctx.task(reviewUxApiContractTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      dependencyReadiness,
      acceptanceTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-621.review.${attempt}`,
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
    dependencyReadiness,
    acceptanceTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-621.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'authoritative-issue-context',
      'reuse-audit',
      'kradle-web-runtime-trace',
      'issue-620-dependency-readiness',
      'acceptance-and-contract-tests',
      'typed-persona-api-implementation',
      'directory-profile-wizard-ui',
      'persona-aware-existing-ui-integration',
      'quality-gates',
      'ux-api-contract-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    reuseAudit,
    dependencyReadiness,
    acceptanceTests,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readAuthoritativeIssueContextTask = defineTask('issue-621.read-authoritative-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #621, dependency #620, and agent identity specs',
  labels: ['kradle', 'kradle-web', 'agent-identity', 'research'],
  agent: {
    name: 'fullstack-architect',
    prompt: {
      role: 'senior Kradle full-stack engineer',
      task: 'Produce the authoritative implementation spec for issue #621 before any code changes.',
      instructions: [
        `Run and preserve the output of: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm whether #${args.issueNumber} is a PR by attempting: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        `Run and preserve the output of: gh issue view ${args.dependencyIssueNumber} --json title,body,labels,comments,state`,
        'Read every file in inputs.specFiles. Treat packages/kradle/docs/agent-identity/03-web-experience.md as the primary product spec.',
        'Preserve the issue comments that mention prior planning PRs and implementation status, but do not assume those artifacts are authoritative if they conflict with the current branch.',
        'Return the exact issue title, labels, comments, dependency status, raw spec excerpts needed downstream, acceptance criteria, non-goals, risks, and any ambiguity requiring a maintainer decision.',
        'Return JSON: { title, labels, rawIssue, comments, dependencyIssue, specFilesRead, acceptanceCriteria, nonGoals, risks, ambiguities, targetSurfaces }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runReuseAuditTask = defineTask('issue-621.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for agent identity web console',
  labels: ['kradle', 'kradle-web', 'reuse-audit', 'brownfield'],
  agent: {
    name: 'fullstack-architect',
    prompt: {
      role: 'senior brownfield architecture investigator',
      task: 'Run the mandatory reuse audit before proposing new routes, APIs, storage, or components.',
      instructions: [
        'Extract keyword nouns and verbs from the issue and specs: persona, personas, soul, souls, appearance, avatar, voice, definitions, agent directory, profile, wizard, dispatch, session, notification, command palette, identity resolution.',
        'Check for .a5c/reuse-audit.json. If absent, say so explicitly and use repo-wide Kradle globs.',
        'Scan for matching migrations, API routes, SDK dependencies, imports, resource kinds, controllers, components, navigation entries, MCP tools, CRDs, tests, and identity helper patterns.',
        'Render a top-level section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'If no matching web console implementation exists, include a concise "No matching existing agent directory implementation found" note while listing adjacent reusable Kradle infrastructure.',
        'Pay special attention to #620 artifacts already present on the branch: AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, AgentDefinition, createAgentPersonaController, resolveAgentPersona, resolveAgentDefinition, and MCP tools.',
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

export const traceKradleAgentIdentityWebTask = defineTask('issue-621.trace-runtime-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Kradle agent identity web, API, and UI surfaces',
  labels: ['kradle', 'kradle-web', 'runtime-trace', 'architecture'],
  agent: {
    name: 'fullstack-architect',
    prompt: {
      role: 'senior Kradle architecture engineer',
      task: 'Trace live execution paths that issue #621 must extend.',
      instructions: [
        'Start from the reuse audit and inspect the current branch before planning file edits.',
        'Trace org-scoped web navigation from orgNavigationGroups to /orgs/[org] page barrels, packages/kradle/web/app/ui-shell.jsx page components, and loadKradleUi data hydration.',
        'Trace authenticated org API route patterns: withAuth, errorResponse, orgNamespaceName, controller list/get/apply/delete helpers, validateResource, cache invalidation, and globalEventBus.',
        'Trace AgentPersona/AgentSoul/AgentAppearance/AgentVoiceProfile/AgentDefinition resource model support and controller helpers from Kradle SDK/core.',
        'Trace existing agent UI surfaces that still show raw stacks: dispatch-button, run-actions/run lists, session-shell, notification-bell, command-palette, meeting participant list, and any adjacent page components.',
        'Trace web tests that should encode structure and behavior: page-structure, api-routes, component-structure, component-exports, barrel-exports, resource-contract, e2e smoke/navigation.',
        'Return JSON: { runtimeCallPaths, liveExecutionFiles, missingIdentityWebSurfaces, likelyFilesToChange, testsToAddOrUpdate, apiAuthPatterns, uiPatterns, identityResolutionPatterns, risks, outOfScope }.',
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

export const assessIssue620DependencyTask = defineTask('issue-621.assess-issue-620-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess #620 core identity readiness',
  labels: ['kradle', 'agent-identity', 'dependency', 'contracts'],
  agent: {
    name: 'fullstack-architect',
    prompt: {
      role: 'senior integration engineer',
      task: 'Decide whether issue #621 can proceed based on the #620 core identity contracts in the current branch.',
      instructions: [
        'Inspect the current branch and GitHub issue/PR state for #620. Determine whether the five identity resource kinds, validators, controllers, dispatch compatibility, SDK exports, and MCP tools are landed, partially present, or absent.',
        'If the #620 contracts are present, define the exact APIs and resource shapes issue #621 should consume.',
        'If contracts are partially present, avoid creating UI-only storage. Identify the minimum server-side compatibility shim or maintainer decision needed before implementation.',
        'Set needsMaintainerDecision true only for a genuine ambiguity that would change product or storage semantics.',
        'Return JSON: { dependencyState, landedContracts, canProceed, needsMaintainerDecision, question, blockerRisks, coordinationPlan }.',
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

export const authorAcceptanceTestsTask = defineTask('issue-621.author-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author agent identity web acceptance and contract tests',
  labels: ['kradle', 'kradle-web', 'tests', 'atdd'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior Kradle web test engineer',
      task: 'Add failing or pending acceptance tests that lock issue #621 behavior before implementation.',
      instructions: [
        'Own test files only in this task. Do not modify implementation files.',
        'Read the issue and spec files directly from disk before writing tests. Author tests strictly from those specs and current Kradle route/test patterns.',
        'Cover page structure for /orgs/[org]/agents/directory, /orgs/[org]/agents/directory/[name], and /orgs/[org]/agents/directory/new.',
        'Cover component structure and barrel exports for agent-directory.jsx, agent-profile-card.jsx, agent-profile-page.jsx, agent-persona-editor.jsx, agent-soul-editor.jsx, agent-appearance-editor.jsx, agent-voice-editor.jsx, agent-definition-form.jsx, agent-create-wizard.jsx, and agent-personality-traits.jsx.',
        'Cover typed org-scoped API routes for personas, souls, appearances including avatar upload, voices including preview, and definitions. Require withAuth on every route and validateResource/controller-backed persistence for every resource write.',
        'Cover identity resolution behavior for dispatch, run list, session header, notification bell, command palette, and meeting participant display, including legacy AgentStack fallback when no AgentDefinition/persona exists.',
        'Cover wizard creation semantics: successful creation of all five resources, compensation or rollback on partial failure, validation error rendering, and no duplicate resources on retry.',
        'Prefer existing static web tests first, then targeted route handler/unit tests, then Playwright e2e smoke when available.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, coveredCriteria, commandsToRun, risks }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE_AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY_READINESS:',
        JSON.stringify(args.dependencyReadiness, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementAgentIdentityWebConsoleTask = defineTask('issue-621.implement-web-console', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement agent identity web console attempt ${args.attempt}`,
  labels: ['kradle', 'kradle-web', 'implementation', 'full-stack'],
  agent: {
    name: 'fullstack-architect',
    prompt: {
      role: 'senior Kradle full-stack engineer',
      task: 'Implement issue #621 in staged, testable slices.',
      instructions: [
        'Keep implementation scoped to live execution files identified by runtimeTrace and issue #621. Do not perform unrelated refactors.',
        'Slice 1: add a shared agent identity profile/resolution helper for composing persona, soul, appearance, voice, definitions, stack fallback, run/session metadata, and display labels.',
        'Slice 2: add typed authenticated API routes under /api/orgs/[org]/agents for personas, souls, appearances/avatar, voices/preview, and definitions. Use existing org resource controller patterns, validate resources before writes, set organizationRef/namespace labels, invalidate caches, and emit resource events.',
        'Slice 3: add route tree /orgs/[org]/agents/directory, /orgs/[org]/agents/directory/[name], and /orgs/[org]/agents/directory/new using existing page metadata, dynamic, error/loading, ui-shell, and PageFrame conventions.',
        'Slice 4: add app/components/agent directory/profile/editor/wizard components. Build dense operational UI consistent with Kradle, not a landing page. Include expected control states for markdown soul editing, avatar URL/upload/generate placeholders, color swatches, TTS preview controls, skill selection, stack binding, review, success, and validation failure.',
        'Slice 5: implement the multi-resource creation wizard with server-side or route-level compensation so partial creation is rolled back or explicitly marked recoverable. Test failure after each resource creation step.',
        'Slice 6: update existing UI references so dispatch, run lists, session detail, notification bell, command palette, and meeting participant list prefer persona display name/avatar/role while preserving legacy stack names as fallback.',
        'Slice 7: add navigation and component barrel exports for the directory without displacing existing stack-centric pages.',
        'Use previous verification and review feedback to refine only failing surfaces.',
        'Return JSON: { changedFiles, implementedSlices, apiSemantics, uiSemantics, identityResolutionSemantics, wizardTransactionSemantics, legacyFallbackSemantics, testsExpectedToPass, deferredItems }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE_AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY_READINESS:',
        JSON.stringify(args.dependencyReadiness, null, 2),
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

export const runQualityGateTask = defineTask('issue-621.quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run agent identity web quality gates attempt ${args.attempt}`,
  labels: ['kradle', 'kradle-web', 'verification', 'quality-gate'],
  agent: {
    name: 'api-testing-expert',
    prompt: {
      role: 'senior verification engineer',
      task: 'Run the full issue #621 verification matrix and report exact outcomes.',
      instructions: [
        'Run every command in inputs.verificationCommands from the repository root unless a command states another working directory.',
        'Also run any commands listed by acceptanceTests.commandsToRun and narrower failing test commands needed to debug failures.',
        'Verify the implemented file set covers every route, component, identity-reference surface, wizard step, and API route named in the issue and docs.',
        'Run Playwright smoke coverage for directory/profile/wizard routes when available. If the environment cannot run it, record the concrete blocker and residual risk.',
        'Return JSON: { passed, commandResults, failedCommands, specCoverage, apiCoverage, uiCoverage, wizardCoverage, browserCoverage, residualRisks, requiredFixes }.',
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

export const reviewUxApiContractTask = defineTask('issue-621.review-ux-api-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review UX, API, and contract alignment attempt ${args.attempt}`,
  labels: ['kradle', 'kradle-web', 'review', 'ux', 'api-contract'],
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior Kradle UX, API, and contract reviewer',
      task: 'Review the implementation against issue #621, agent identity docs, Kradle conventions, and verification output.',
      instructions: [
        'Prioritize blocking findings: unauthenticated org data, org-scoping bugs, UI-only persona storage, API/resource contract divergence, wizard partial-state leaks, missing legacy stack fallback, missing route/page/component surfaces, and persona labels that drift across dispatch/session/run/notification/command-palette surfaces.',
        'Confirm the UI is operational, dense, and consistent with the existing Kradle application rather than a static mock or marketing page.',
        'Confirm avatar and voice preview features do not require unavailable external providers to pass the base workflow; provider-backed generation may be stubbed behind route handlers if the contract is explicit and tested.',
        'Set approved true only when the implementation satisfies the issue and verification passed or remaining risks are explicitly acceptable.',
        'Return JSON: { approved, findings, blockingFindings, specCoverageNotes, apiNotes, uxNotes, accessibilityNotes, contractNotes, requiredFixes }.',
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

export const finalAcceptanceGateTask = defineTask('issue-621.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #621',
  labels: ['kradle', 'kradle-web', 'agent-identity', 'final-acceptance'],
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior release readiness reviewer',
      task: 'Decide whether issue #621 is complete and ready for PR.',
      instructions: [
        'Compare the original issue and docs directly to the produced artifacts and verification output.',
        'Require every listed page, API route, component, wizard step, and existing persona-reference surface to be present or explicitly called out as blocked by a dependency.',
        'Require withAuth on all org-scoped persona routes and resource/controller-backed persistence for persona, soul, appearance, voice, and definition resources.',
        'Require wizard transaction or compensation behavior to be tested for partial failures.',
        'Require legacy AgentStack fallback to continue working in dispatch, runs, sessions, notifications, and command palette.',
        'Require all feasible verification commands to pass. If a command could not run, include the exact reason and whether that blocks acceptance.',
        'Return JSON: { passed, changedFiles, completeCriteria, incompleteCriteria, verificationSummary, reviewSummary, risks, prSummary }.',
        'ISSUE_CONTEXT:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE_AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY_READINESS:',
        JSON.stringify(args.dependencyReadiness, null, 2),
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
