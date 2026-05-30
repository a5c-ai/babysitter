/**
 * @process repo/issue-623-jitsi-helm-subchart-integration
 * @description Implement issue #623: integrate jitsi-helm as an optional Krate Helm subchart, external Jitsi mode, CRDs, secrets, media network policy, and verification gates.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, title: string, labels: string[], issueBody: string, triageComment: string, targetFiles: string[], specFiles: string[], qualityCommands: string[], maxImplementationAttempts?: number }
 * @outputs { success: boolean, reuseAudit: object, testPlan: object, implementation: object, securityReview: object, qualityGate: object, review: object, changedFiles: string[] }
 *
 * @process methodologies/spec-kit/spec-kit-implementation
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/devops-sre-platform/iac-implementation
 * @process specializations/devops-sre-platform/iac-testing
 * @process specializations/security-compliance/secrets-management
 * @process specializations/security-compliance/iac-security-review
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function issueContext(inputs) {
  return {
    issueNumber: inputs?.issueNumber ?? 623,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    triageComment: inputs?.triageComment,
    specFiles: inputs?.specFiles ?? [],
    targetFiles: inputs?.targetFiles ?? [],
  };
}

const reuseAuditTask = defineTask(
  'issue-623.reuse-audit',
  async ({ issueContext, specFiles, targetFiles }) => ({
    kind: 'agent',
    title: 'Phase 0: REUSE-AUDIT for Jitsi Helm integration',
    labels: ['issue-623', 'reuse-audit', 'krate', 'helm', 'phase:research'],
    agent: {
      name: 'krate-jitsi-reuse-auditor',
      prompt: {
        role: 'senior platform engineer',
        task: 'Run the mandatory Phase 0 reuse audit before implementation.',
        instructions: [
          'Do not edit files in this phase.',
          'Read the issue context below as the source of truth.',
          'Read every spec file listed below, especially the Jitsi Helm deployment and CRD/controller docs.',
          'Extract keyword nouns and verbs from the issue: jitsi, helm, subchart, external mode, CRD, network policy, UDP 10000, JWT secret, config.js, health probe.',
          'Scan for matching chart dependencies, values keys, templates, CRDs, secret templates, tests, validation scripts, docs, environment variables, and imports.',
          'Also scan the active process-library root for relevant DevOps/SRE, IaC, secrets, and quality-gate methodology references.',
          'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Include "No matching existing infrastructure found" only for surfaces where the audit truly has no match.',
          'Return JSON: { reuseAuditMarkdown: string, existingInfrastructure: array, missingSurfaces: array, runtimeCallPaths: array, recommendedImplementationOrder: array, testTargets: array, risks: array, openQuestions: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          `SPEC FILES: ${JSON.stringify(specFiles ?? [])}`,
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Run reuse audit', labels: ['issue-623', 'reuse-audit'] },
);

const authorTestsTask = defineTask(
  'issue-623.author-tests',
  async ({ issueContext, reuseAudit, qualityCommands }) => ({
    kind: 'agent',
    title: 'Author spec-first Helm and CRD guardrails',
    labels: ['issue-623', 'tests', 'tdd', 'helm', 'phase:red'],
    agent: {
      name: 'krate-chart-test-author',
      prompt: {
        role: 'senior Helm and Node.js test engineer',
        task: 'Add focused failing tests and validation guardrails for issue #623 before production chart changes.',
        instructions: [
          'Follow TDD: write tests before implementing chart/template/CRD changes.',
          'Read the issue body, triage comment, and spec files from ISSUE CONTEXT; do not redefine acceptance criteria from existing implementation.',
          'Target the existing Krate package validation style before introducing new tooling.',
          'Prefer adding checks to packages/krate/core/tests/deployment.test.js and packages/krate/core/scripts/validate-package.mjs where that matches existing patterns.',
          'Tests must cover: Chart.yaml jitsi-meet dependency with condition jitsi.install; values.yaml jitsi install/external/web/prosody/jicofo/jvb/jibri/krate settings; jitsi-resources CRDs; secret wiring without committed secret literals; network policy/media UDP 10000; Helm rendering for install and external modes; verification affordances for config.js and health checks.',
          'Ensure external mode does not render in-cluster Jitsi resources that should be gated by jitsi.install.',
          'Run the narrowest relevant commands and confirm the new checks fail for the missing issue #623 artifacts.',
          'Do not weaken, skip, or delete existing tests.',
          'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommands: array, redOutputSummary: string, criteriaCovered: array, remainingSpecGaps: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author failing guardrails', labels: ['issue-623', 'tests', 'tdd'] },
);

const implementChartTask = defineTask(
  'issue-623.implement-chart',
  async ({ issueContext, reuseAudit, testPlan, feedback }) => ({
    kind: 'agent',
    title: 'Implement Jitsi Helm chart integration',
    labels: ['issue-623', 'implementation', 'helm', 'krate', 'phase:green'],
    agent: {
      name: 'krate-jitsi-chart-implementer',
      prompt: {
        role: 'senior Kubernetes and Helm engineer',
        task: 'Implement the issue #623 Helm integration with minimal, spec-aligned changes.',
        instructions: [
          'Edit the repository directly, but keep changes scoped to issue #623 surfaces.',
          'Use the issue context and spec files as the source of truth.',
          'Implement the chart dependency, values, CRDs, secrets, and network-policy surfaces needed by the tests.',
          'Keep secret defaults empty or existingSecret-based; do not commit generated or real secret material.',
          'Preserve current Krate chart behavior when jitsi.install=false and jitsi.external.enabled=false.',
          'Support in-cluster mode and external mode without making them silently conflict; if validation is needed, add a Helm template failure or documented precedence consistent with existing chart patterns.',
          'Follow existing chart naming, labels, helper templates, and validation script style.',
          'Run the failing tests from the prior phase after implementing and report whether they pass.',
          'Return JSON: { changedFiles: string[], summary: string, acceptanceCriteriaImplemented: array, commandsRun: array, commandResults: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'TEST PLAN:',
          JSON.stringify(testPlan ?? {}, null, 2),
          '',
          'FEEDBACK FROM PRIOR ATTEMPT:',
          JSON.stringify(feedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement chart integration', labels: ['issue-623', 'implementation'] },
);

const securityReviewTask = defineTask(
  'issue-623.security-review',
  async ({ issueContext, implementation }) => ({
    kind: 'agent',
    title: 'Review Jitsi secrets, network, and IaC security',
    labels: ['issue-623', 'security', 'iac-review', 'phase:security'],
    agent: {
      name: 'krate-jitsi-security-reviewer',
      prompt: {
        role: 'senior Kubernetes security reviewer',
        task: 'Review the Jitsi Helm integration for secrets, network, and IaC risks before final verification.',
        instructions: [
          'Inspect the final diff and relevant chart/templates/tests directly.',
          'Check JWT app secret and webhook secret handling for committed secret literals, unsafe defaults, missing existingSecret support, and unexpected leakage in NOTES or values.',
          'Check network policy and services for the minimum JVB UDP 10000/media behavior required by the spec without opening unrelated traffic unnecessarily.',
          'Check CRD schemas for unsafe permissiveness beyond established Krate CRD style.',
          'Check in-cluster versus external mode for conflicting resources and auth configuration.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingIssues: array, securityNotes: array, requiredFixes: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Security review', labels: ['issue-623', 'security'] },
);

const verifyQualityTask = defineTask(
  'issue-623.verify-quality',
  async ({ issueContext, implementation, securityReview, qualityCommands }) => ({
    kind: 'agent',
    title: 'Verify Helm rendering and package quality gates',
    labels: ['issue-623', 'verification', 'quality-gate', 'phase:quality'],
    agent: {
      name: 'krate-jitsi-quality-verifier',
      prompt: {
        role: 'senior release and Helm verifier',
        task: 'Run and interpret the full quality gate for issue #623.',
        instructions: [
          'Run every command listed in QUALITY COMMANDS from the repository root.',
          'Additionally run Helm dependency/build/lint/render checks needed for both jitsi.install=true and jitsi.external.enabled=true modes if not already covered by QUALITY COMMANDS.',
          'Confirm Chart.lock/dependency artifacts are handled according to repo conventions and not accidentally omitted if required.',
          'Confirm rendered manifests contain the expected Jitsi dependency wiring, CRDs, secrets references, and UDP 10000 media policy/service behavior.',
          'Confirm rendered external mode does not install the Jitsi subchart.',
          'Inspect git diff for unrelated source changes and for accidental secret literals.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], helmDependencyVerified: boolean, installModeVerified: boolean, externalModeVerified: boolean, crdsVerified: boolean, secretsVerified: boolean, networkPolicyVerified: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          'SECURITY REVIEW:',
          JSON.stringify(securityReview ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['issue-623', 'verification'] },
);

const reviewTask = defineTask(
  'issue-623.final-review',
  async ({ issueContext, reuseAudit, testPlan, implementation, securityReview, qualityGate }) => ({
    kind: 'agent',
    title: 'Final review against issue #623 acceptance criteria',
    labels: ['issue-623', 'review', 'acceptance', 'phase:review'],
    agent: {
      name: 'krate-jitsi-acceptance-reviewer',
      prompt: {
        role: 'senior platform code reviewer',
        task: 'Compare issue #623 requirements to the final artifacts and quality-gate results.',
        instructions: [
          'Read the issue context and spec files directly, then compare them to the final diff.',
          'Verify each issue scope item is implemented or explicitly deferred with a reason: subchart dependency, values section, external mode, Jitsi CRDs, UDP 10000 network policy, JWT secret management, deployment verification hooks.',
          'Verify tests were authored before implementation and are meaningful against the spec.',
          'Verify no implementation work outside the Jitsi Helm/chart surface was added unless required by tests or validation.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, criteriaMatrix: array, finalSummary: string, changedFiles: string[] }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'TEST PLAN:',
          JSON.stringify(testPlan ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          'SECURITY REVIEW:',
          JSON.stringify(securityReview ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Final acceptance review', labels: ['issue-623', 'review'] },
);

export async function process(inputs, ctx) {
  const context = issueContext(inputs);
  const specFiles = inputs?.specFiles ?? [
    'packages/krate/docs/jitsi/01-architecture.md',
    'packages/krate/docs/jitsi/02-helm-deployment.md',
    'packages/krate/docs/jitsi/03-crds-and-controllers.md',
  ];
  const targetFiles = inputs?.targetFiles ?? [
    'packages/krate/charts/Chart.yaml',
    'packages/krate/charts/values.yaml',
    'packages/krate/charts/templates/networkpolicy.yaml',
    'packages/krate/charts/templates/auth-secret.yaml',
    'packages/krate/charts/crds/jitsi-resources.yaml',
    'packages/krate/core/scripts/validate-package.mjs',
    'packages/krate/core/tests/deployment.test.js',
  ];
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm --prefix packages/krate/core test',
    'npm --prefix packages/krate/core run package:check',
    'helm dependency build packages/krate/charts',
    'helm lint packages/krate/charts',
    'helm template krate packages/krate/charts -n krate-system --set jitsi.install=true --set argocd.enabled=false',
    'helm template krate packages/krate/charts -n krate-system --set jitsi.install=false --set jitsi.external.enabled=true --set jitsi.external.url=https://meet.example.test --set argocd.enabled=false',
    'npm run verify:metadata',
  ];
  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? 2;

  ctx.log('info', 'Phase 0: REUSE-AUDIT before issue #623 implementation.');
  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext: context,
    specFiles,
    targetFiles,
  }, { key: 'issue-623.reuse-audit' });

  if (Array.isArray(reuseAudit?.openQuestions) && reuseAudit.openQuestions.length > 0) {
    await ctx.breakpoint({
      title: 'Jitsi Helm integration questions',
      question: 'Reuse audit found open questions that may affect chart behavior. Review before continuing?',
      context: {
        runId: ctx.runId,
        issue: context.issueNumber,
        openQuestions: reuseAudit.openQuestions,
        risks: reuseAudit?.risks ?? [],
      },
    });
  }

  ctx.log('info', 'Phase 1: spec-first guardrails.');
  const testPlan = await ctx.task(authorTestsTask, {
    issueContext: context,
    reuseAudit,
    qualityCommands,
  }, { key: 'issue-623.test-plan' });

  let implementation = null;
  let securityReview = null;
  let qualityGate = null;
  let feedback = null;

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    ctx.log('info', `Phase 2: implement chart integration, attempt ${attempt}.`);
    implementation = await ctx.task(implementChartTask, {
      issueContext: context,
      reuseAudit,
      testPlan,
      feedback,
    }, { key: `issue-623.implementation.${attempt}` });

    ctx.log('info', `Phase 3: security review, attempt ${attempt}.`);
    securityReview = await ctx.task(securityReviewTask, {
      issueContext: context,
      implementation,
    }, { key: `issue-623.security.${attempt}` });

    ctx.log('info', `Phase 4: quality gate, attempt ${attempt}.`);
    qualityGate = await ctx.task(verifyQualityTask, {
      issueContext: context,
      implementation,
      securityReview,
      qualityCommands,
    }, { key: `issue-623.quality.${attempt}` });

    if (securityReview?.approved && qualityGate?.passed) break;

    feedback = {
      attempt,
      securityReview,
      qualityGate,
      instruction: 'Address only blocking security or quality-gate failures. Do not broaden the implementation scope.',
    };
  }

  ctx.log('info', 'Phase 5: final acceptance review.');
  const review = await ctx.task(reviewTask, {
    issueContext: context,
    reuseAudit,
    testPlan,
    implementation,
    securityReview,
    qualityGate,
  }, { key: 'issue-623.review' });

  const success = Boolean(review?.approved && securityReview?.approved && qualityGate?.passed);
  return {
    success,
    issueNumber: context.issueNumber,
    reuseAudit,
    testPlan,
    implementation,
    securityReview,
    qualityGate,
    review,
    changedFiles: review?.changedFiles ?? implementation?.changedFiles ?? [],
  };
}
