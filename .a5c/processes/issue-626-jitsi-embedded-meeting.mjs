/**
 * @process repo/issue-626-jitsi-embedded-meeting
 * @description Plan and execute issue #626: embed authenticated Jitsi meetings in the Krate web console with the Jitsi Meet External API.
 * @inputs { issueNumber: number, branchName: string, baseBranch: string, projectDir: string, webDir: string, coreDir: string, specPaths: string[], dependencyIssues: number[], qualityCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/docs/jitsi/04-web-management.md
 * - packages/krate/docs/jitsi/05-human-meeting-experience.md
 * - packages/krate/docs/jitsi/01-architecture.md
 * - methodologies/automaker/automaker-feature-pipeline.js
 * - methodologies/atdd-tdd/README.md
 * - specializations/web-development/nextjs-fullstack-app.js
 * - specializations/web-development/e2e-testing-playwright.js
 * - specializations/web-development/mobile-first-responsive.js
 * - specializations/web-development/jwt-authentication.js
 * - specializations/collaboration/github/issue-linking.js
 * - specializations/collaboration/github/pr-policies.js
 *
 * Repo policy note: this repository asks direct babysitter:call processes to avoid
 * shell-task subtasks unless the user asks for a shell-oriented workflow. This
 * process therefore uses agent tasks for command execution and evidence capture.
 *
 * @agent feature-planner methodologies/automaker/agents/feature-planner/AGENT.md
 * @agent code-generator methodologies/automaker/agents/code-generator/AGENT.md
 * @agent test-runner methodologies/automaker/agents/test-runner/AGENT.md
 * @agent code-reviewer methodologies/automaker/agents/code-reviewer/AGENT.md
 * @agent api-architect specializations/web-development/agents/api-architect/AGENT.md
 * @agent security-auditor specializations/web-development/agents/security-auditor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 626;
  const branchName = inputs?.branchName ?? 'agent/issue-626-jitsi-embedded-meeting';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueNumber }, {
    key: 'issue-626.reuse-audit',
  });

  const issueContext = await ctx.task(readIssueContextTask, { issueNumber, dependencyIssues: inputs?.dependencyIssues ?? [] }, {
    key: 'issue-626.read-issue-context',
  });

  const processLibraryResearch = await ctx.task(researchProcessLibraryTask, { inputs, issueContext, reuseAudit }, {
    key: 'issue-626.process-library-research',
  });

  const runtimeTrace = await ctx.task(traceKrateJitsiRuntimeTask, { inputs, issueContext, reuseAudit }, {
    key: 'issue-626.runtime-trace',
  });

  const dependencyContract = await ctx.task(assessDependencyContractTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
  }, {
    key: 'issue-626.dependency-contract',
  });

  if (dependencyContract?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #626 Dependency Contract Decision',
      question: dependencyContract.question || 'Prerequisite Jitsi contracts are missing or ambiguous. Proceed with a mocked/degraded implementation path, or pause until the dependencies land?',
      options: [
        'Proceed with explicit mocked/degraded contracts',
        'Pause until prerequisites land',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-626', 'jitsi', 'dependencies'],
      context: {
        runId: ctx.runId,
        issueNumber,
        dependencyContract,
      },
    });
  }

  const implementationPlan = await ctx.task(designEmbeddedMeetingPlanTask, {
    inputs,
    issueContext,
    processLibraryResearch,
    reuseAudit,
    runtimeTrace,
    dependencyContract,
  }, {
    key: 'issue-626.design-plan',
  });

  const acceptanceCoverage = await ctx.task(authorAcceptanceCoverageTask, {
    inputs,
    issueContext,
    runtimeTrace,
    dependencyContract,
    implementationPlan,
  }, {
    key: 'issue-626.acceptance-coverage',
  });

  let implementation = null;
  let verification = null;
  let securityReview = null;
  let uxReview = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementEmbeddedMeetingTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      dependencyContract,
      implementationPlan,
      acceptanceCoverage,
      attempt,
      previousVerification: verification,
      previousSecurityReview: securityReview,
      previousUxReview: uxReview,
    }, {
      key: `issue-626.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyEmbeddedMeetingTask, {
      inputs,
      issueContext,
      runtimeTrace,
      dependencyContract,
      implementationPlan,
      acceptanceCoverage,
      implementation,
      attempt,
    }, {
      key: `issue-626.verification.${attempt}`,
    });

    securityReview = await ctx.task(reviewJitsiSecurityTask, {
      inputs,
      issueContext,
      runtimeTrace,
      dependencyContract,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-626.security-review.${attempt}`,
    });

    uxReview = await ctx.task(reviewResponsiveMeetingUxTask, {
      inputs,
      issueContext,
      implementationPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-626.ux-review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, securityReview, uxReview });

    if (verification?.passed === true && securityReview?.approved === true && uxReview?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    processLibraryResearch,
    reuseAudit,
    runtimeTrace,
    dependencyContract,
    implementationPlan,
    acceptanceCoverage,
    implementation,
    verification,
    securityReview,
    uxReview,
    attempts,
  }, {
    key: 'issue-626.final-acceptance',
  });

  if (finalGate?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #626 Quality Gate Blocked',
      question: 'The embedded Jitsi meeting implementation did not satisfy final acceptance. Stop for maintainer review, or approve one more focused follow-up attempt?',
      options: ['Stop and report blocked quality gate', 'Approve one manual follow-up attempt'],
      expert: 'owner',
      tags: ['quality-gate', 'issue-626', 'jitsi'],
      context: {
        runId: ctx.runId,
        issueNumber,
        finalGate,
        attempts,
      },
    });

    return {
      success: false,
      phases: [
        'reuse-audit',
        'issue-context',
        'process-library-research',
        'runtime-trace',
        'dependency-contract',
        'implementation-plan',
        'acceptance-coverage',
        'implementation-loop',
        'final-acceptance',
      ],
      changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
      runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
      verification,
      review: { securityReview, uxReview, finalGate },
      delivery: null,
      blockers: finalGate?.blockers ?? [],
      metadata: { processId: 'repo/issue-626-jitsi-embedded-meeting', timestamp: ctx.now() },
    };
  }

  const delivery = await ctx.task(deliverIssue626Task, {
    inputs,
    issueNumber,
    branchName,
    baseBranch,
    implementation,
    verification,
    securityReview,
    uxReview,
    finalGate,
  }, {
    key: 'issue-626.delivery',
  });

  return {
    success: true,
    phases: [
      'reuse-audit',
      'issue-context',
      'process-library-research',
      'runtime-trace',
      'dependency-contract',
      'implementation-plan',
      'acceptance-coverage',
      'implementation-loop',
      'security-review',
      'responsive-ux-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    verification,
    review: { securityReview, uxReview, finalGate },
    delivery,
    metadata: { processId: 'repo/issue-626-jitsi-embedded-meeting', timestamp: ctx.now() },
  };
}

export const reuseAuditTask = defineTask('issue-626.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse-audit findings for Jitsi embedded meeting',
  labels: ['issue-626', 'reuse-audit', 'krate-web'],
  agent: {
    name: 'feature-planner',
    prompt: {
      role: 'senior brownfield feature planner',
      task: 'Run the repo-required reuse audit before any implementation planning.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from issue #626: Jitsi, embedded meeting, External API, iframe, JWT, join, participants, recording, invite, transcript, deep link, meetings route, context panel.',
        'Search the repository for matching migrations, API routes, environment variables, SDK dependencies, imports, existing components, tests, and docs.',
        'Check for .a5c/reuse-audit.json and honor it if present.',
        'At minimum inspect packages/krate/web/app, packages/krate/core/src, packages/krate/web/tests, packages/krate/docs/jitsi, package manifests, and chart paths that exist.',
        'Identify existing infrastructure to reuse, missing infrastructure that should come from dependency issues, and any duplicate risks.',
        'Return JSON: { findingsTitle, keywords, existingMatches, missingMatches, reuseTargets, dependencyRisks, noMatchingInfrastructureNotes }.',
        'Issue number:',
        String(args.issueNumber),
        'Inputs JSON:',
        JSON.stringify(args.inputs, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readIssueContextTask = defineTask('issue-626.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #626 and prerequisite GitHub context',
  labels: ['issue-626', 'github', 'context'],
  agent: {
    name: 'feature-planner',
    prompt: {
      role: 'Krate Jitsi roadmap planner',
      task: 'Read the authoritative GitHub issue context for issue #626 and prerequisite issues.',
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments.`,
        `Also try gh pr view ${args.issueNumber} --json files,title,body,comments and record whether it is not a PR.`,
        `For each dependency issue in ${JSON.stringify(args.dependencyIssues)}, run gh issue view <number> --json title,state,body,labels,comments.`,
        'Preserve the issue body, comments, labels, dependency status, acceptance criteria, scope, non-goals, related docs, and risk notes.',
        'Do not collapse dependency ambiguity into assumptions; record explicit unknowns.',
        'Return JSON: { title, labels, rawIssue, comments, isPullRequest, dependencies, acceptanceCriteria, scope, nonGoals, risks, requiredDocs }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-626.research-process-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research process-library methods for embedded web feature delivery',
  labels: ['issue-626', 'process-library', 'research'],
  agent: {
    name: 'feature-planner',
    prompt: {
      role: 'Babysitter process-library researcher',
      task: 'Find the process-library patterns that should guide this feature implementation.',
      instructions: [
        'Search /home/runner/.a5c/process-library/babysitter-repo/library for matching methodologies, specializations, skills, and agents.',
        'Prioritize Next.js full-stack apps, API integration testing, JWT authentication, mobile-first responsive design, Playwright E2E, TDD/ATDD, GitHub issue linking, and PR lifecycle policies.',
        'Read docs/agent-reference/process-authoring.md and apply the repo-specific override that avoids kind: shell subtasks in direct user-request processes.',
        'Return JSON: { references, applicablePatterns, repoPolicyConstraints, qualityGatePattern, breakpointPolicy, selectedAgents }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceKrateJitsiRuntimeTask = defineTask('issue-626.trace-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate web meeting runtime paths',
  labels: ['issue-626', 'runtime-trace', 'krate-web'],
  agent: {
    name: 'api-architect',
    prompt: {
      role: 'senior Krate web and API engineer',
      task: 'Trace the current runtime paths that an embedded Jitsi meeting implementation must use.',
      instructions: [
        'Inspect the current repository before proposing changes.',
        'Trace org page routing through packages/krate/web/app/orgs/[org], PageFrame/AppShell/navigation, page modules, and ui-shell exports.',
        'Trace org-scoped API route patterns under packages/krate/web/app/api/orgs/[org], withAuth, errorResponse, cache invalidation, and @a5c-ai/krate-sdk controller usage.',
        'Trace current resource model and controller surfaces for Jitsi resources. Record whether JitsiMeetProvider, JitsiMeetingTemplate, JitsiMeeting, JitsiParticipant, and JitsiRecording exist or are dependency-provided.',
        'Trace agent dispatch run links and participant/persona source paths needed by the context panel.',
        'Trace web test conventions in packages/krate/web/tests and Playwright config.',
        'Return JSON: { runtimeCallPaths, liveExecutionFiles, candidateFilesToModify, candidateFilesToCreate, existingTestPatterns, missingContracts, outOfScope }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'INPUTS JSON:',
        JSON.stringify(args.inputs, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const assessDependencyContractTask = defineTask('issue-626.dependency-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Jitsi prerequisite readiness and contracts',
  labels: ['issue-626', 'dependencies', 'contract'],
  agent: {
    name: 'api-architect',
    prompt: {
      role: 'Krate integration architect',
      task: 'Decide whether dependencies provide the contracts needed for the embedded meeting work.',
      instructions: [
        'Inspect current branch state and dependency issue context for #623, #624 if referenced, and #625.',
        'Confirm whether there is a reachable Jitsi server contract, provider endpoint contract, meeting resource contract, join route contract, invite route contract, record route contract, participant shape, recording/transcript shape, and dispatch-run linking shape.',
        'If prerequisite code is missing, prefer pausing or implementing against explicit mocked/degraded contracts rather than silently duplicating the full #625 management scope.',
        'Set needsMaintainerDecision true only if proceeding would require choosing between waiting for dependencies and adding temporary scaffolding.',
        'Return JSON: { ready, contracts, missingContracts, allowedFallbacks, blockedScope, needsMaintainerDecision, question, recommendedPath }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designEmbeddedMeetingPlanTask = defineTask('issue-626.design-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design embedded Jitsi meeting implementation plan',
  labels: ['issue-626', 'design', 'jitsi'],
  agent: {
    name: 'feature-planner',
    prompt: {
      role: 'senior Next.js feature architect',
      task: 'Design the smallest complete implementation plan for issue #626.',
      instructions: [
        'Use only the issue context, docs, dependency contract, reuse audit, and traced runtime paths as constraints.',
        'Plan for a client-only EmbeddedMeeting component using window.JitsiMeetExternalAPI and a page-scoped external_api.js loader for https://meet.krate.local/external_api.js or the provider endpoint from the join response.',
        'Plan for POST /api/orgs/{org}/jitsi/meetings/{id}/join to return short-lived JWT, room URL, display name, and meeting metadata, reusing #625 routes/controllers if present.',
        'Plan the meeting detail page /orgs/{org}/meetings/{id}, Krate context panel, participant list with human/agent persona avatars, dispatch run links, recording controls, invite actions, post-meeting recording/transcript links, and responsive panel collapse.',
        'Plan control synchronization through Jitsi External API commands/events rather than local-only duplicated state.',
        'Keep the scope focused on embedded meeting UX. Do not reimplement the full meeting management, template CRUD, recordings browser, Helm chart, CRDs, or agent sidecar work unless dependency tracing proves a narrow adapter is required.',
        'Return JSON: { recommendedDesign, milestones, changedFiles, runtimeCallPaths, apiContracts, componentContracts, testPlan, browserVerificationPlan, securityPlan, responsivePlan, outOfScope, risks }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'PROCESS LIBRARY RESEARCH JSON:',
        JSON.stringify(args.processLibraryResearch, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY CONTRACT JSON:',
        JSON.stringify(args.dependencyContract, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorAcceptanceCoverageTask = defineTask('issue-626.acceptance-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author acceptance coverage before implementation',
  labels: ['issue-626', 'tests', 'atdd'],
  agent: {
    name: 'test-runner',
    prompt: {
      role: 'senior web test engineer',
      task: 'Add focused acceptance and regression coverage for issue #626 before implementation.',
      instructions: [
        'Edit the repository directly.',
        'Preserve unrelated local changes.',
        'Read the issue, docs, and existing test patterns before authoring tests.',
        'Author tests from the issue/spec contracts before implementation changes. Cover the join flow, script loader behavior, External API lifecycle/dispose, event wiring, control commands, context panel rendering, post-meeting state, auth/error paths, and responsive structure.',
        'Use mocked JitsiMeetExternalAPI for deterministic component/browser coverage. Do not require a live meet.krate.local server for normal CI tests.',
        'Where the repo supports Playwright, add or update desktop and mobile smoke coverage for the meeting detail page with a mocked External API and responsive context panel.',
        'If prerequisite routes from #625 are not present, write contract tests that fail with clear missing-contract messages rather than inventing broad management scope.',
        'Return JSON: { changedFiles, testsAdded, expectedFailuresBeforeImplementation, mockedJitsiStrategy, commandsToRun, notes }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY CONTRACT JSON:',
        JSON.stringify(args.dependencyContract, null, 2),
        'IMPLEMENTATION PLAN JSON:',
        JSON.stringify(args.implementationPlan, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementEmbeddedMeetingTask = defineTask('issue-626.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement embedded Jitsi meeting experience',
  labels: ['issue-626', 'implementation', 'krate-web'],
  agent: {
    name: 'code-generator',
    prompt: {
      role: 'senior Next.js and Krate web engineer',
      task: 'Implement issue #626 according to the traced plan and pre-authored tests.',
      instructions: [
        'Edit the repository directly.',
        'Preserve unrelated local changes and stage nothing.',
        `This is implementation attempt ${args.attempt}.`,
        'Use only files on the traced live runtime path unless the plan justifies a new Jitsi component, API route, test, or style file.',
        'Implement or extend EmbeddedMeeting so it loads the Jitsi External API only on the meeting page, guards missing script/API states, creates one API instance per join response, wires participantJoined/participantLeft/readyToClose, sends toolbar/control commands through executeCommand, and disposes on unmount/route changes.',
        'Implement or extend the authenticated join flow: call POST /api/orgs/{org}/jitsi/meetings/{id}/join, keep JWT short-lived and browser-scoped, never expose long-lived app secrets, and handle 401/403/404/dependency-unavailable states explicitly.',
        'Implement or extend /orgs/{org}/meetings/{id} using existing PageFrame/AppShell/navigation conventions and #625 meeting data contracts if present.',
        'Implement the Krate context panel with human and agent participants, persona/avatar display where available, recording controls, invite actions, meeting metadata, dispatch run links, ended state, and recording/transcript links.',
        'Implement responsive layout so the context panel sits beside the iframe on desktop and collapses below it on narrow viewports without text overlap.',
        'Keep native Jitsi UI responsible for video tiles/chat/screen share while Krate controls mirror or invoke External API commands.',
        'Do not implement Helm chart, CRDs, full meeting management pages, template CRUD, recordings browser, or agent sidecar runtime unless they are already present and need narrow integration.',
        'Return JSON: { changedFiles, summary, apiContractsUsed, componentsImplemented, testsUpdated, risks, commitMessage }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY CONTRACT JSON:',
        JSON.stringify(args.dependencyContract, null, 2),
        'IMPLEMENTATION PLAN JSON:',
        JSON.stringify(args.implementationPlan, null, 2),
        'ACCEPTANCE COVERAGE JSON:',
        JSON.stringify(args.acceptanceCoverage, null, 2),
        'PREVIOUS VERIFICATION JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'PREVIOUS SECURITY REVIEW JSON:',
        JSON.stringify(args.previousSecurityReview, null, 2),
        'PREVIOUS UX REVIEW JSON:',
        JSON.stringify(args.previousUxReview, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyEmbeddedMeetingTask = defineTask('issue-626.verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify embedded meeting quality gates',
  labels: ['issue-626', 'verification', 'quality-gate'],
  agent: {
    name: 'test-runner',
    prompt: {
      role: 'senior web verification engineer',
      task: 'Run and interpret the quality gates for issue #626.',
      instructions: [
        'Run the concrete commands supplied in inputs.qualityCommands and any narrower focused checks needed by changed files.',
        'At minimum, verify the pre-authored tests, packages/krate/web test suite, import/export structure, page route structure, and git diff --check.',
        'Run Playwright or equivalent browser checks for desktop and mobile meeting detail layout when the repo has Playwright available. Use mocked Jitsi External API for deterministic CI.',
        'Check that there is no duplicate External API instance creation, dispose happens on unmount, and missing external_api.js produces a visible recoverable state.',
        'If a real Jitsi server is reachable at the configured endpoint, perform a smoke check that external_api.js loads. If not reachable, record residual risk and rely on mocked browser coverage.',
        'Return JSON: { passed, commandsRun, browserChecks, mockedJitsiChecks, liveJitsiSmoke, failures, residualRisk, changedFiles }.',
        'INPUT QUALITY COMMANDS:',
        JSON.stringify(args.inputs?.qualityCommands ?? [], null, 2),
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'IMPLEMENTATION PLAN JSON:',
        JSON.stringify(args.implementationPlan, null, 2),
        'ACCEPTANCE COVERAGE JSON:',
        JSON.stringify(args.acceptanceCoverage, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewJitsiSecurityTask = defineTask('issue-626.security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Jitsi auth, JWT, and iframe security',
  labels: ['issue-626', 'security', 'jwt'],
  agent: {
    name: 'security-auditor',
    prompt: {
      role: 'senior web security reviewer',
      task: 'Review the embedded Jitsi implementation for auth and iframe/script security.',
      instructions: [
        'Inspect the git diff and relevant changed files.',
        'Verify all non-webhook meeting routes are authenticated with existing withAuth patterns.',
        'Verify JWT generation remains server-side, short-lived, org-scoped, room-scoped, and does not expose long-lived Jitsi app secrets to browser state or logs.',
        'Verify external_api.js is loaded from the configured Jitsi/provider domain only for the meeting page and that failure states do not leak credentials.',
        'Verify invite, record, and end actions enforce org/meeting authorization and do not trust client-provided participant roles.',
        'Return JSON: { approved, issues, requiredChanges, residualRisk, summary }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY CONTRACT JSON:',
        JSON.stringify(args.dependencyContract, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewResponsiveMeetingUxTask = defineTask('issue-626.ux-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review responsive embedded meeting UX',
  labels: ['issue-626', 'ux', 'responsive'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior product-minded frontend reviewer',
      task: 'Review the embedded meeting experience for completeness and responsive quality.',
      instructions: [
        'Inspect the git diff, changed components, CSS, and browser evidence.',
        'Verify the first viewport is the usable meeting experience, not a marketing/placeholder page.',
        'Verify the iframe is sized and framed for practical video use, context panel is scannable, controls use existing Krate UI conventions, and mobile layout puts the context panel below the iframe without overlap.',
        'Verify participant statuses, agent/persona display, dispatch links, recording controls, invite actions, ended state, and transcript/recording links are visible or have explicit empty/degraded states.',
        'Reject purely static mock UI that does not call the join flow or wire External API events/commands.',
        'Return JSON: { approved, issues, requiredChanges, desktopFindings, mobileFindings, summary }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'IMPLEMENTATION PLAN JSON:',
        JSON.stringify(args.implementationPlan, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-626.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #626',
  labels: ['issue-626', 'acceptance', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release-minded Krate maintainer',
      task: 'Decide whether issue #626 is ready for PR delivery.',
      instructions: [
        'Read the final git diff, test evidence, browser evidence, issue context, dependency contract, security review, and UX review.',
        'Acceptance requires: deep link /orgs/{org}/meetings/{id}; authenticated join flow; External API script loading; one embedded Jitsi API lifecycle with cleanup; prejoin bypass; toolbar customization; context panel with participants/agents/recording/invite/metadata/dispatch links; controls wired through External API or authenticated APIs; ended/post-meeting state; responsive desktop/mobile layout; mocked deterministic tests; and clear residual risk for live Jitsi smoke if unavailable.',
        'Reject if the change silently implements unrelated #623/#625/#627/#628 scope, exposes Jitsi secrets, skips auth, leaves no automated coverage, or only builds static placeholders.',
        'Verify changed files are limited to Krate web/core integration surfaces, tests, and minimal docs if required.',
        'Return JSON: { passed, changedFiles, acceptance, blockers, residualRisk, prSummary, issueComment, commitMessage }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'PROCESS LIBRARY RESEARCH JSON:',
        JSON.stringify(args.processLibraryResearch, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'DEPENDENCY CONTRACT JSON:',
        JSON.stringify(args.dependencyContract, null, 2),
        'IMPLEMENTATION PLAN JSON:',
        JSON.stringify(args.implementationPlan, null, 2),
        'ACCEPTANCE COVERAGE JSON:',
        JSON.stringify(args.acceptanceCoverage, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
        'SECURITY REVIEW JSON:',
        JSON.stringify(args.securityReview, null, 2),
        'UX REVIEW JSON:',
        JSON.stringify(args.uxReview, null, 2),
        'ATTEMPTS JSON:',
        JSON.stringify(args.attempts, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue626Task = defineTask('issue-626.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, create PR, and comment on issue #626',
  labels: ['issue-626', 'github', 'delivery'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'repository delivery agent',
      task: 'Deliver the completed issue #626 implementation through GitHub.',
      instructions: [
        'Inspect git status and stage only files related to issue #626.',
        'Do not stage unrelated local changes, secrets, generated logs, or run artifacts.',
        `Commit on branch ${args.branchName} with the implementation commit message from finalGate or implementation.`,
        `Push ${args.branchName} to origin.`,
        `Create a PR against ${args.baseBranch} with a title linking to issue #${args.issueNumber} and a body summarizing phases, changed surfaces, tests, security/UX gates, dependency handling, and residual live-Jitsi risk.`,
        `Post a comment on issue #${args.issueNumber} with the implementation summary, verification evidence, residual risk, and PR link.`,
        'Return JSON: { committed, commitSha, prUrl, issueCommentUrl, stagedFiles, summary }.',
        'FINAL GATE JSON:',
        JSON.stringify(args.finalGate, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
        'SECURITY REVIEW JSON:',
        JSON.stringify(args.securityReview, null, 2),
        'UX REVIEW JSON:',
        JSON.stringify(args.uxReview, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
