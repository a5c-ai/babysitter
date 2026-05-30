/**
 * @process repo/issue-610-controller-persistence
 * @description Implement issue #610: wire durable persistence for Krate external sync/write/conflict routes, agent memory resources, and Envoy model-route manifests.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string, targetFiles: string[], verificationCommands: string[], qualityGates: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object, delivery: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Existing core external persistence exists in packages/krate/core/src/api-controller.js through syncExternalBinding, createExternalWriteIntent, approveExternalWriteIntent, cancelExternalWriteIntent, detectExternalConflict, and resolveExternalConflict.
 * - Existing legacy HTTP server routes in packages/krate/core/src/http-server.js already forward full external sync and approve/cancel option objects.
 * - Live Next.js web routes under packages/krate/web/app/api/orgs/[org]/external still need request-shape fixes for sync and approve.
 * - Agent memory resources are plan-only in packages/krate/core/src/agent-memory-controller.js; callers must apply AgentMemorySnapshot, AgentRunMemoryImport, and AgentMemoryUpdate at API/dispatch boundaries.
 * - Model routes already persist KrateModelRoute resources, but no code path applies generated AIGatewayRoute manifests from generateEnvoyRouteManifest().
 * - No matching existing reconciler for AIGatewayRoute application was found in the repo scan; prefer adding a narrow apply/reconcile boundary over route-side shelling out.
 *
 * References searched before authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/docs/gaps/controller-persistence.md
 * - packages/krate/docs/gaps/api-route-issues.md
 * - methodologies/spec-kit-brownfield.js
 * - methodologies/superpowers/verification-before-completion.js
 * - specializations/backend-development/README.md
 * - specializations/qa-testing-automation/agents/api-testing-expert/AGENT.md
 * - specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * - specializations/qa-testing-automation/api-testing.js
 * - specializations/devops-sre-platform/kubernetes-setup.js
 * - Active capability guidance from `babysitter instructions:babysit-skill --harness codex --no-interactive`
 *   for branch policy, issue linking, and PR lifecycle behavior.
 *
 * Repo policy note: direct babysitter processes in this repo should avoid
 * shell-task subtasks unless explicitly requested. This process therefore uses
 * agent tasks that execute commands and capture evidence rather than declaring
 * deterministic shell subtasks in the process definition.
 *
 * @process methodologies/spec-kit-brownfield
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/qa-testing-automation/api-testing
 * @process specializations/devops-sre-platform/kubernetes-setup
 * @skill growing-outside-in-systems specializations/backend-development/skills/growing-outside-in-systems/SKILL.md
 * @skill verification-before-completion methodologies/superpowers/skills/verification-before-completion/SKILL.md
 * @agent api-testing-expert specializations/qa-testing-automation/agents/api-testing-expert/AGENT.md
 * @agent kubernetes-expert specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 2;

function valueOf(result, fallback = {}) {
  return result?.value ?? result ?? fallback;
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 610;

  ctx.log('Phase 1: collect current issue, PR, and codebase context');
  const context = await ctx.task(collectIssueContextTask, { inputs, issueNumber }, {
    key: 'issue-610.context',
  });
  const contextValue = valueOf(context, {});

  ctx.log('Phase 2: audit reuse before proposing new persistence boundaries');
  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, context: contextValue }, {
    key: 'issue-610.reuse-audit',
  });

  ctx.log('Phase 3: trace live runtime call paths and narrow the edit set');
  const runtimeTrace = await ctx.task(traceRuntimeCallPathsTask, {
    inputs,
    context: contextValue,
    reuseAudit: valueOf(reuseAudit, {}),
  }, {
    key: 'issue-610.runtime-trace',
  });

  ctx.log('Phase 4: design acceptance tests before implementation');
  const testPlan = await ctx.task(designFailingTestsTask, {
    inputs,
    context: contextValue,
    reuseAudit: valueOf(reuseAudit, {}),
    runtimeTrace: valueOf(runtimeTrace, {}),
  }, {
    key: 'issue-610.test-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt += 1) {
    ctx.log(`Phase 5.${attempt}: implement persistence wiring attempt ${attempt}`);
    implementation = await ctx.task(implementPersistenceWiringTask, {
      inputs,
      context: contextValue,
      reuseAudit: valueOf(reuseAudit, {}),
      runtimeTrace: valueOf(runtimeTrace, {}),
      testPlan: valueOf(testPlan, {}),
      previousVerification: valueOf(verification, null),
      previousReview: valueOf(review, null),
      attempt,
    }, {
      key: `issue-610.implementation.${attempt}`,
    });

    ctx.log(`Phase 6.${attempt}: run targeted verification attempt ${attempt}`);
    verification = await ctx.task(verifyPersistenceWiringTask, {
      inputs,
      context: contextValue,
      runtimeTrace: valueOf(runtimeTrace, {}),
      testPlan: valueOf(testPlan, {}),
      implementation: valueOf(implementation, {}),
      attempt,
    }, {
      key: `issue-610.verification.${attempt}`,
    });

    ctx.log(`Phase 7.${attempt}: review implementation for persistence, scope, and Kubernetes safety`);
    review = await ctx.task(reviewPersistenceImplementationTask, {
      inputs,
      context: contextValue,
      reuseAudit: valueOf(reuseAudit, {}),
      runtimeTrace: valueOf(runtimeTrace, {}),
      testPlan: valueOf(testPlan, {}),
      implementation: valueOf(implementation, {}),
      verification: valueOf(verification, {}),
      attempt,
    }, {
      key: `issue-610.review.${attempt}`,
    });

    attempts.push({
      attempt,
      implementation: valueOf(implementation, {}),
      verification: valueOf(verification, {}),
      review: valueOf(review, {}),
    });

    if (valueOf(verification, {})?.passed === true && valueOf(review, {})?.approved === true) {
      break;
    }
  }

  ctx.log('Phase 8: final acceptance and delivery');
  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    context: contextValue,
    reuseAudit: valueOf(reuseAudit, {}),
    runtimeTrace: valueOf(runtimeTrace, {}),
    testPlan: valueOf(testPlan, {}),
    implementation: valueOf(implementation, {}),
    verification: valueOf(verification, {}),
    review: valueOf(review, {}),
    attempts,
  }, {
    key: 'issue-610.final-gate',
  });

  const delivery = await ctx.task(deliverIssue610Task, {
    inputs,
    context: contextValue,
    runtimeTrace: valueOf(runtimeTrace, {}),
    finalGate: valueOf(finalGate, {}),
  }, {
    key: 'issue-610.delivery',
  });

  const success = valueOf(finalGate, {})?.passed === true;

  return {
    success,
    phases: [
      'context',
      'reuse-audit',
      'runtime-call-path-trace',
      'test-plan',
      'implementation-loop',
      'targeted-verification',
      'persistence-and-kubernetes-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: valueOf(finalGate, {})?.changedFiles ?? valueOf(implementation, {})?.changedFiles ?? [],
    runtimeCallPaths: valueOf(runtimeTrace, {})?.runtimeCallPaths ?? [],
    context: contextValue,
    reuseAudit: valueOf(reuseAudit, {}),
    runtimeTrace: valueOf(runtimeTrace, {}),
    testPlan: valueOf(testPlan, {}),
    implementation: valueOf(implementation, {}),
    verification: valueOf(verification, {}),
    review: valueOf(review, {}),
    attempts,
    finalGate: valueOf(finalGate, {}),
    delivery: valueOf(delivery, {}),
  };
}

export const collectIssueContextTask = defineTask('issue-610.collect-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect issue #610 context',
  labels: ['issue-610', 'github', 'context'],
  agent: {
    name: 'issue-610-context-researcher',
    prompt: {
      role: 'senior Krate maintainer',
      task: 'Collect authoritative context for issue #610 without editing files.',
      instructions: [
        'Run: gh issue view 610 --json title,body,labels,comments.',
        'If #610 is a pull request, also run: gh pr view 610 --json files,title,body,comments. If it is not a PR, record that fact.',
        'Read packages/krate/docs/gaps/controller-persistence.md and packages/krate/docs/gaps/api-route-issues.md.',
        'Check issue comments for prior planning or implementation PRs. If a prior PR exists, verify which changes are already present on the current base branch before planning duplicate work.',
        'Summarize requested behavior, labels, dependencies, stale parts of the issue, and exact acceptance criteria.',
        'Do not edit source files.',
        'Return JSON: { title: string, labels: string[], dependencyNotes: array, acceptanceCriteria: array, staleOrAlreadyHandled: array, risks: array, summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-610.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reuse-audit existing persistence infrastructure',
  labels: ['issue-610', 'reuse-audit', 'brownfield'],
  agent: {
    name: 'issue-610-reuse-auditor',
    prompt: {
      role: 'brownfield architecture auditor',
      task: 'Find existing Krate persistence infrastructure and decide what must be reused instead of rebuilt.',
      instructions: [
        'Search for persistFn, applyResource, applyResourceForOrg, createMemorySnapshot, createMemoryImport, createMemoryUpdate, generateEnvoyRouteManifest, AIGatewayRoute, and KrateModelRoute.',
        'Inspect packages/krate/core/src/api-controller.js, packages/krate/core/src/http-server.js, packages/krate/core/src/agent-dispatch-controller.js, packages/krate/core/src/model-route-controller.js, and the live Next.js routes under packages/krate/web/app/api/orgs/[org].',
        'Identify existing tests that already cover external persistence, model route manifest generation, memory resource creation, org scoping, and web resource contracts.',
        'Find process-library references relevant to brownfield implementation, API testing, Kubernetes application, GitHub branch/PR policy, and verification-before-completion.',
        'Render a section named "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" in the returned summary.',
        'Do not create implementation code.',
        'Return JSON: { findings: array, reuseDecisions: array, avoidReimplementation: array, matchingTests: array, processLibraryReferences: array, summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimeCallPathsTask = defineTask('issue-610.trace-runtime-call-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace live persistence call paths',
  labels: ['issue-610', 'runtime-trace', 'krate'],
  agent: {
    name: 'krate-runtime-call-path-tracer',
    prompt: {
      role: 'senior backend engineer',
      task: 'Trace the live call paths from user/API entry points to persistence for issue #610.',
      instructions: [
        'Trace Next.js web routes and the core HTTP server separately. Mark which path is live for the web console and which is legacy or secondary.',
        'For external sync, trace request body fields from route handler to syncExternalBinding to createSyncController persistFn to resourceGateway.apply/applyResource.',
        'For external write intent approve/cancel and conflict resolve, trace parameter shape and whether resources/actor fields reach the controller.',
        'For agent memory, trace dispatchAgent and any memory import/update/snapshot API surfaces. Identify every returned AgentMemorySnapshot, AgentRunMemoryImport, AgentMemoryUpdate, and AgentMemoryQuery resource that is not durably applied.',
        'For model routes, trace KrateModelRoute POST/list/catalog through model-route-controller. Identify where an AIGatewayRoute manifest should be generated and applied without introducing ad hoc kubectl shell calls in a web route.',
        'Include auth registerLoginProfile and event-bus persistEvent as secondary error-handling audit items only if they are within the issue scope after reading the issue comments.',
        'Return JSON: { runtimeCallPaths: string[], missingApplyBoundaries: array, targetFiles: array, outOfScopeFiles: array, implementationOrder: array, openQuestions: array }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designFailingTestsTask = defineTask('issue-610.design-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design failing tests before implementation',
  labels: ['issue-610', 'tests', 'tdd'],
  agent: {
    name: 'api-persistence-test-designer',
    prompt: {
      role: 'senior API test engineer',
      task: 'Author or update focused tests that fail for the current persistence gaps before implementation.',
      instructions: [
        'Use the issue context and runtime trace as source material. Re-read the relevant route/controller files before editing tests.',
        'Add API-level or contract tests for the Next.js external sync route forwarding bindingName, kind, localName, spec, externalEnvelope, and watermark.',
        'Add API-level or contract tests proving external write-intent approve passes { intentName, approvedBy, resources } rather than a bare string.',
        'Add tests for conflict resolve only if the runtime trace shows a remaining live-route persistence or argument-shape gap.',
        'Add controller/API tests proving AgentMemorySnapshot, AgentRunMemoryImport, and AgentMemoryUpdate resources are applied at the selected API/dispatch boundary with org-scoped namespace and idempotent retry behavior where feasible.',
        'Add model-route tests proving KrateModelRoute creation also produces and applies an AIGatewayRoute manifest, and that apply failures are reported rather than silently succeeding.',
        'Do not update production implementation in this task.',
        'Return JSON: { changedFiles: string[], failingCommands: array, testCases: array, expectedFailures: array, scopeNotes: array }.',
        '',
        'RUNTIME TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementPersistenceWiringTask = defineTask('issue-610.implement-persistence-wiring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement persistence wiring',
  labels: ['issue-610', 'implementation', 'krate-core', 'krate-web'],
  agent: {
    name: 'krate-persistence-implementer',
    prompt: {
      role: 'senior Krate backend engineer',
      task: 'Implement the narrow persistence wiring required by issue #610.',
      instructions: [
        'Read files before editing and preserve unrelated worktree changes.',
        'Keep edits scoped to files identified by runtimeTrace.targetFiles unless a test proves another live call-path file must change.',
        'External routes: fix live Next.js routes so sync forwards full request options and approve/cancel/resolve routes pass the object shape expected by the core controller. Do not duplicate core persistFn wiring that already exists.',
        'Core external persistence: if changing persistFn callbacks, prefer the existing applyResource/applyResourceForOrg semantics so cache invalidation, audit events, org scoping, and errors are handled consistently. Avoid new in-memory persistence.',
        'Memory persistence: apply returned AgentMemorySnapshot, AgentRunMemoryImport, and AgentMemoryUpdate resources at the API/dispatch boundary selected by the runtime trace. Preserve returned DTOs and include apply errors in API responses instead of making the operation appear successful.',
        'Model routes: add a narrow controller/API/reconciler boundary that resolves a KrateModelRoute, generates its AIGatewayRoute manifest, and applies it through the existing resource gateway/controller apply path. Avoid spawning kubectl directly from a web route.',
        'Error handling: make persistence failures observable for the caller on newly awaited persistence paths. Keep existing fire-and-forget semantics only where the issue explicitly accepts eventual persistence and status is observable.',
        'Update docs only when behavior changes from existing docs or the runtime trace identifies stale gap docs that would mislead future maintainers.',
        'Return JSON: { changedFiles: string[], summary: string, persistenceBoundaries: array, errorHandling: array, docsUpdated: array, unresolvedItems: array }.',
        '',
        'TEST PLAN:',
        JSON.stringify(args.testPlan, null, 2),
        '',
        'PREVIOUS VERIFICATION:',
        JSON.stringify(args.previousVerification, null, 2),
        '',
        'PREVIOUS REVIEW:',
        JSON.stringify(args.previousReview, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyPersistenceWiringTask = defineTask('issue-610.verify-persistence-wiring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify persistence wiring',
  labels: ['issue-610', 'verification', 'quality-gate'],
  agent: {
    name: 'krate-persistence-verifier',
    prompt: {
      role: 'verification engineer',
      task: 'Run fresh verification and report evidence before any completion claim.',
      instructions: [
        'Run the targeted failing tests from the test plan and confirm they now pass.',
        'Run all verificationCommands from inputs that apply to the changed files. Record skipped commands with concrete reasons.',
        'At minimum, consider node --test packages/krate/core/tests/external-persistence.test.js, node --test packages/krate/core/tests/agent-memory-controller.test.js, node --test packages/krate/core/tests/model-route-controller.test.js, node --test packages/krate/web/tests/resource-contract.test.js, npm run build:sdk, npm run test:sdk, and git diff --check.',
        'Inspect the final diff to confirm source changes are limited to issue #610 scope.',
        'Verify no plaintext secrets, kubeconfigs, or environment-specific credentials were added.',
        'Return JSON: { passed: boolean, commandsRun: array, skippedCommands: array, evidence: array, failures: array, changedFiles: array }.',
        '',
        'IMPLEMENTATION SUMMARY:',
        JSON.stringify(args.implementation, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewPersistenceImplementationTask = defineTask('issue-610.review-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review persistence implementation',
  labels: ['issue-610', 'review', 'risk'],
  agent: {
    name: 'persistence-code-reviewer',
    prompt: {
      role: 'senior code reviewer and Kubernetes platform engineer',
      task: 'Review the implementation for behavioral correctness and issue coverage.',
      instructions: [
        'Lead with blocking findings, ordered by severity, with file and line references.',
        'Verify external web routes forward the same semantics as the already-working core HTTP server route path.',
        'Verify memory persistence uses org-scoped apply boundaries and cannot report success after an apply failure.',
        'Verify model-route manifest application is idempotent, uses existing Kubernetes resource gateway semantics, and does not introduce route-side kubectl shelling.',
        'Verify tests cover the bug class rather than only asserting implementation details.',
        'Check for regressions in cache invalidation, audit/event emission, and org namespace isolation.',
        'Return JSON: { approved: boolean, findings: array, residualRisks: array, requiredFixes: array, notes: string }.',
        '',
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

export const finalAcceptanceGateTask = defineTask('issue-610.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate',
  labels: ['issue-610', 'acceptance', 'delivery-gate'],
  agent: {
    name: 'issue-610-acceptance-verifier',
    prompt: {
      role: 'release gate reviewer',
      task: 'Decide whether issue #610 is complete based on direct evidence.',
      instructions: [
        'Compare the issue acceptance criteria, runtime trace, implementation summary, verification evidence, and review findings directly.',
        'Confirm each required area is covered: external web route persistence/argument forwarding, memory resource apply boundaries, model-route AIGatewayRoute application, and persistence error observability.',
        'Reject completion if any verification command failed without an accepted reason, if a blocker remains, or if implementation touched unrelated surfaces.',
        'Return JSON: { passed: boolean, changedFiles: string[], acceptanceMatrix: object, remainingRisks: array, requiredFollowUps: array }.',
        '',
        'ATTEMPTS:',
        JSON.stringify(args.attempts, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue610Task = defineTask('issue-610.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare PR and issue update',
  labels: ['issue-610', 'github', 'delivery'],
  agent: {
    name: 'issue-610-delivery-agent',
    prompt: {
      role: 'maintainer preparing delivery',
      task: 'Prepare the final branch, commit, PR, and issue update after acceptance passes.',
      instructions: [
        'Only proceed if finalGate.passed is true. If false, return without creating a PR.',
        'Check git status and stage only files changed for issue #610.',
        'Commit with a concise message that references issue #610.',
        'Push the implementation branch from inputs.workBranch.',
        'Create a pull request against inputs.baseBranch with a body that summarizes phases, tests, risk notes, and links #610.',
        'Post an issue comment on #610 with the implementation summary, verification evidence, and PR link.',
        'Return JSON: { published: boolean, branch: string, commit: string, prUrl: string, issueCommentUrl: string, notes: array }.',
        '',
        'FINAL GATE:',
        JSON.stringify(args.finalGate, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
