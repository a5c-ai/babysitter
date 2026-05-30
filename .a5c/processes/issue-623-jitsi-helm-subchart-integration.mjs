/**
 * @process repo/issue-623-jitsi-helm-subchart-integration
 * @description Plan and execute issue #623: integrate jitsi-helm as a Krate Helm subchart with internal and external deployment modes.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, chartPath: string, specFiles: string[], targetFiles: object, qualityGateCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], reuseAudit: object, verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/docs/jitsi/01-architecture.md
 * - packages/krate/docs/jitsi/02-helm-deployment.md
 * - packages/krate/docs/jitsi/03-crds-and-controllers.md
 * - specializations/devops-sre-platform/kubernetes-setup.js
 * - specializations/devops-sre-platform/iac-implementation.js
 * - specializations/devops-sre-platform/iac-testing.js
 * - specializations/devops-sre-platform/secrets-management.js
 * - specializations/devops-sre-platform/skills/helm-charts/SKILL.md
 * - specializations/devops-sre-platform/skills/kubernetes-ops/SKILL.md
 * - specializations/devops-sre-platform/skills/secrets-management/SKILL.md
 * - specializations/qa-testing-automation/quality-gates.js
 * - methodologies/atdd-tdd/atdd-tdd.js
 *
 * Repo policy note: direct Babysitter processes in this repo should avoid
 * shell-task subtasks unless explicitly requested. This process therefore uses
 * agent tasks for implementation, command execution, verification, and evidence
 * capture while still requiring real command output in the agent results.
 *
 * @skill helm-charts specializations/devops-sre-platform/skills/helm-charts/SKILL.md
 * @skill kubernetes-ops specializations/devops-sre-platform/skills/kubernetes-ops/SKILL.md
 * @skill secrets-management specializations/devops-sre-platform/skills/secrets-management/SKILL.md
 * @agent platform-engineer specializations/devops-sre-platform/agents/platform-engineer/AGENT.md
 * @agent kubernetes-expert specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * @agent secops-expert specializations/devops-sre-platform/agents/secops-expert/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent quality-assessor specializations/meta/agents/quality-assessor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 623;

  const issueContext = await ctx.task(readAuthoritativeIssueContextTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-623.read-authoritative-context',
  });

  const reuseAudit = await ctx.task(runReuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-623.reuse-audit',
  });

  const processLibraryResearch = await ctx.task(researchProcessLibraryTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-623.process-library-research',
  });

  const chartSurfaceTrace = await ctx.task(traceKrateChartSurfacesTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
  }, {
    key: 'issue-623.trace-chart-surfaces',
  });

  if (reuseAudit?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Jitsi Helm Reuse Decision',
      question: reuseAudit.question || 'The reuse audit found a conflicting or partially implemented Jitsi chart surface. Choose how implementation should proceed.',
      options: [
        'Extend the existing Jitsi chart surface',
        'Replace the partial Jitsi chart surface',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-623', 'jitsi', 'helm', 'reuse-audit'],
      context: {
        runId: ctx.runId,
        issueNumber,
        reuseAudit,
        chartSurfaceTrace,
      },
    });
  }

  const acceptancePlan = await ctx.task(authorSpecFirstAcceptancePlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
    chartSurfaceTrace,
  }, {
    key: 'issue-623.author-acceptance-plan',
  });

  let implementation = null;
  let verification = null;
  let securityReview = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementJitsiHelmIntegrationTask, {
      inputs,
      issueContext,
      reuseAudit,
      processLibraryResearch,
      chartSurfaceTrace,
      acceptancePlan,
      previousVerification: verification,
      previousSecurityReview: securityReview,
      attempt,
    }, {
      key: `issue-623.implementation.${attempt}`,
    });

    verification = await ctx.task(runHelmQualityGateTask, {
      inputs,
      issueContext,
      acceptancePlan,
      implementation,
      attempt,
    }, {
      key: `issue-623.quality-gate.${attempt}`,
    });

    securityReview = await ctx.task(reviewChartSecurityAndOperationsTask, {
      inputs,
      issueContext,
      reuseAudit,
      chartSurfaceTrace,
      acceptancePlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-623.security-operations-review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, securityReview });

    if (verification?.passed === true && securityReview?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
    chartSurfaceTrace,
    acceptancePlan,
    implementation,
    verification,
    securityReview,
    attempts,
  }, {
    key: 'issue-623.final-acceptance',
  });

  const delivery = await ctx.task(deliverIssue623Task, {
    inputs,
    issueContext,
    finalGate,
    verification,
    securityReview,
  }, {
    key: 'issue-623.delivery',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'authoritative-issue-context',
      'reuse-audit',
      'process-library-research',
      'krate-chart-surface-trace',
      'spec-first-acceptance-plan',
      'implementation-loop',
      'helm-quality-gates',
      'security-and-operations-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: chartSurfaceTrace?.runtimeCallPaths ?? [],
    issueContext,
    reuseAudit,
    processLibraryResearch,
    chartSurfaceTrace,
    acceptancePlan,
    implementation,
    verification,
    securityReview,
    attempts,
    finalGate,
    delivery,
  };
}

export const readAuthoritativeIssueContextTask = defineTask('issue-623.read-authoritative-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #623, PR context, and Jitsi deployment specs',
  labels: ['issue-623', 'krate', 'jitsi', 'helm', 'context'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'senior Krate platform engineer',
      task: 'Build the authoritative implementation context for issue #623 before any code changes.',
      instructions: [
        `Run and preserve the output of: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm whether #${args.issueNumber} is a PR by attempting: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read every file listed in inputs.specFiles. Treat the issue body, comments, and Jitsi docs as the implementation contract.',
        'Read inputs.targetFiles and identify which files already exist, which are missing, and which files are likely implementation targets.',
        'Do not implement. Return exact acceptance criteria, issue dependencies, non-goals, risks, and ambiguities that could affect chart behavior.',
        'Return JSON: { title, labels, rawIssue, comments, prCheck, specFilesRead, targetFiles, acceptanceCriteria, dependencies, nonGoals, risks, ambiguities }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runReuseAuditTask = defineTask('issue-623.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 REUSE-AUDIT for Jitsi Helm chart infrastructure',
  labels: ['issue-623', 'reuse-audit', 'brownfield', 'krate'],
  agent: {
    name: 'kubernetes-expert',
    prompt: {
      role: 'senior brownfield Kubernetes chart investigator',
      task: 'Run the mandatory Phase 0 reuse audit before proposing or implementing new chart infrastructure.',
      instructions: [
        'Extract keyword nouns and verbs from issue #623 and the Jitsi docs: jitsi, jitsi-meet, meet, prosody, jicofo, jvb, jibri, jwt, webhook, recording, UDP 10000, external, install, subchart, CRD.',
        'Check for .a5c/reuse-audit.json. If present, use it to shape scan globs and keyword extraction; if absent, state that explicitly.',
        'Use inputs.reuseAuditSeedFindings as authoring-time research, then re-scan the live repository because staging may have moved since this plan was created.',
        'Scan existing chart dependencies, values, templates, CRDs, package validation, docs, API routes, environment variables, SDK dependencies, imports, and graph metadata for matching Jitsi or adjacent Helm infrastructure.',
        'Pay special attention to the distinction between existing Jitsi application surfaces and the still-missing Helm chart/deployment surface.',
        'Render a top-level section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'List direct Jitsi matches, adjacent reusable infrastructure, and any conflicting partial implementations. If none exist, include a concise "No matching existing Jitsi chart infrastructure found" note.',
        'Set needsMaintainerDecision true only if the audit finds conflicting chart semantics that cannot be resolved from the issue and docs.',
        'Return JSON: { heading, keywords, reuseAuditConfigFound, directMatches, adjacentInfrastructure, conflicts, noMatchNotes, reuseRecommendations, needsMaintainerDecision, question, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-623.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process-library methods and specializations',
  labels: ['issue-623', 'process-library', 'methodology', 'helm'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Babysitter process researcher',
      task: 'Research the active process library for methodologies and specializations that should guide issue #623 execution.',
      instructions: [
        'Run babysitter process-library:active --json and record the active library root.',
        'Search the active library root for Helm, Kubernetes, IaC, secrets-management, quality-gates, ATDD/TDD, and brownfield process patterns.',
        'Read only the relevant process and skill headers or concise sections needed for this work.',
        'Prefer devops-sre-platform Helm/Kubernetes/secrets guidance, qa-testing-automation quality gates, and ATDD/TDD style spec-first verification.',
        'Return JSON: { activeLibraryRoot, searchedPaths, selectedReferences, rejectedReferences, processShape, breakpointPolicy, verificationPolicy }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceKrateChartSurfacesTask = defineTask('issue-623.trace-chart-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate Helm chart, CRD, and package validation surfaces',
  labels: ['issue-623', 'helm', 'runtime-trace', 'krate'],
  agent: {
    name: 'kubernetes-expert',
    prompt: {
      role: 'senior Helm chart engineer',
      task: 'Trace the current Krate chart surfaces that issue #623 must extend.',
      instructions: [
        'Inspect packages/krate/charts/Chart.yaml dependency conventions, existing dependency aliases, annotations, and version style.',
        'Inspect packages/krate/charts/values.yaml layout and existing secret/external dependency conventions.',
        'Inspect packages/krate/charts/templates for network policy, secret, service, ingress, deployment, helper, and Argo CD patterns relevant to Jitsi.',
        'Inspect packages/krate/charts/crds/*.yaml for CRD schema/version/naming conventions before planning jitsi-resources.yaml.',
        'Inspect package validation and chart docs referenced by inputs.qualityGateCommands.',
        'Record runtimeCallPaths as chart packaging/rendering paths, from values and Chart.yaml dependency resolution through templates and CRD installation.',
        'Return JSON: { existingPatterns, targetFiles, missingFiles, runtimeCallPaths, chartDependencies, valuesConventions, crdConventions, secretConventions, networkPolicyConventions, validationSurfaces, implementationOrder, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorSpecFirstAcceptancePlanTask = defineTask('issue-623.author-acceptance-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author spec-first acceptance plan and failing checks',
  labels: ['issue-623', 'acceptance-tests', 'helm', 'jitsi'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'Krate Helm acceptance test architect',
      task: 'Define the spec-first guardrails that must fail before implementation and pass after implementation.',
      instructions: [
        'Base the plan only on the authoritative issue context, Jitsi docs, reuse audit, and chart trace. Do not redefine the issue scope from implementation convenience.',
        'Plan checks for Chart.yaml jitsi-meet dependency with condition jitsi.install and alias jitsi-subchart.',
        'Plan checks for values.yaml jitsi section covering install mode, external mode, web, prosody JWT auth, jicofo, jvb, optional jibri, Krate room/webhook defaults, and secret references without committed secret values.',
        'Plan checks for charts/crds/jitsi-resources.yaml with JitsiMeetProvider, JitsiMeetingTemplate, JitsiMeeting, JitsiParticipant if required by docs, and JitsiRecording. Explain any issue/doc mismatch, such as the issue naming JitsiRecording while docs also name JitsiParticipant.',
        'Plan checks for JWT/webhook secret management, external mode not rendering in-cluster Jitsi workload assumptions, and UDP 10000 media network policy behavior.',
        'Plan real verification evidence for every command in inputs.qualityGateCommands, including rendered-manifest assertions for internal and external modes.',
        'Return JSON: { acceptanceCriteria, plannedTestArtifacts, expectedInitialFailures, renderAssertions, commandEvidenceRequired, traceabilityMatrix, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementJitsiHelmIntegrationTask = defineTask('issue-623.implement-jitsi-helm-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Jitsi Helm subchart integration for Krate',
  labels: ['issue-623', 'implementation', 'helm', 'jitsi'],
  agent: {
    name: 'kubernetes-expert',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 18,
    approvalMode: 'yolo',
    prompt: {
      role: 'senior Kubernetes and Helm engineer',
      task: 'Implement issue #623 against the current branch, using the acceptance plan and prior feedback.',
      instructions: [
        'Make only the source/chart/test/doc edits required for issue #623. Do not modify .a5c/processes planning artifacts.',
        'Start with the planned failing checks or equivalent validation guardrails from the acceptance plan.',
        'Add the jitsi-meet dependency to packages/krate/charts/Chart.yaml with condition jitsi.install, repository, version, and alias aligned to the docs and upstream chart reality.',
        'Add a complete jitsi values section in packages/krate/charts/values.yaml using existing chart conventions for nested values, external dependencies, and secrets.',
        'Add packages/krate/charts/crds/jitsi-resources.yaml using existing CRD YAML conventions and the Jitsi docs as the schema source.',
        'Add or update templates for JWT/webhook secret references and JVB UDP 10000 media network policy behavior without committing literal secrets.',
        'Handle external mode clearly: when jitsi.external.enabled is true, Krate has connection settings for an existing deployment and should not require in-cluster Jitsi deployment.',
        'Update chart/package docs only if implementation changes documented install or verification behavior.',
        'If this is a refinement attempt, address previousVerification and previousSecurityReview directly before adding new scope.',
        'Return JSON: { changedFiles, testsOrChecksAdded, implementationNotes, externalModeBehavior, secretHandling, networkPolicyBehavior, crdKinds, risks, blockers }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runHelmQualityGateTask = defineTask('issue-623.run-helm-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Helm, package, render, and metadata quality gates',
  labels: ['issue-623', 'quality-gate', 'helm', 'verification'],
  agent: {
    name: 'test-strategy-architect',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 10,
    approvalMode: 'yolo',
    prompt: {
      role: 'Krate chart verification engineer',
      task: 'Run the required quality gates and capture pass/fail evidence for issue #623.',
      instructions: [
        'Run every command in inputs.qualityGateCommands from the repository root unless a command explicitly says otherwise.',
        'For Helm render checks, inspect output for jitsi-meet dependency wiring, Jitsi CRDs, no secret literal leakage, internal install mode resources, external mode connection settings, and UDP 10000 policy/service behavior.',
        'If helm dependency build or template fails because the upstream repository/version is wrong, report the exact failure and whether Chart.yaml needs correction.',
        'Do not mark passed unless every required command succeeds or an unavailable external tool is explicitly documented with a maintainer-actionable substitute.',
        'Return JSON: { passed, commands, renderAssertions, failures, changedFiles, evidenceSummary, nextFixes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewChartSecurityAndOperationsTask = defineTask('issue-623.review-chart-security-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Jitsi chart security and operational readiness',
  labels: ['issue-623', 'security', 'operations', 'network-policy'],
  agent: {
    name: 'secops-expert',
    prompt: {
      role: 'Kubernetes security and operations reviewer',
      task: 'Review the implementation for security, operational, and issue-contract risks.',
      instructions: [
        'Review the working tree diff and verification evidence for issue #623.',
        'Block approval if JWT app secrets or webhook secrets are committed as live values, if existingSecret/secretKeyRef behavior is missing where needed, or if external mode requires internal-only resources.',
        'Block approval if JVB UDP 10000 behavior is absent, overly broad beyond existing chart conventions without explanation, or not represented in render evidence.',
        'Block approval if CRD schemas omit issue-required Jitsi kinds without an explicit docs-backed decision.',
        'Block approval if the Helm dependency, values, CRDs, and templates do not render in both internal and external modes.',
        'Return JSON: { approved, findings, blockingFindings, recommendations, acceptedRisks, requiresAnotherAttempt }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-623.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final issue #623 acceptance comparison',
  labels: ['issue-623', 'final-acceptance', 'traceability'],
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'final acceptance reviewer',
      task: 'Compare the final implementation directly against issue #623 and the Jitsi docs.',
      instructions: [
        'Read the current git diff, issue #623 context, inputs.specFiles, acceptance plan, verification results, and security review.',
        'Compare the issue contract to artifacts directly. Ignore narrative about how artifacts were built.',
        'Require evidence for all issue scope items: subchart dependency, values section, external mode, CRDs, network policy, JWT secret management, and verification.',
        'Require that implementation changed only appropriate Krate chart/source/doc/test files and did not modify process artifacts.',
        'Return JSON: { passed, changedFiles, criteriaResults, missingCriteria, extraScope, verificationSummary, releaseNotes, followUps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue623Task = defineTask('issue-623.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare issue #623 delivery summary',
  labels: ['issue-623', 'delivery', 'github'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'implementation delivery lead',
      task: 'Prepare the final delivery summary for issue #623.',
      instructions: [
        'Summarize changed files, behavior, quality gates, remaining risks, and follow-up issues.',
        'If finalGate.passed is true, prepare a concise PR body and issue comment linking to #623.',
        'If finalGate.passed is false, prepare a blocker summary with the exact missing criteria and failed gates.',
        'Return JSON: { readyForPR, prTitle, prBody, issueComment, blockers, verificationSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
