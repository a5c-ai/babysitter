/**
 * @process repo/issue-611-api-route-sync-forwarding
 * @description Implement issue #611 for Kradle web API route/controller contract drift and curated catalog deploy error surfacing.
 * @inputs { issueNumber: number, title: string, issueUrl: string, issueBody: string, triageComment: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used when authoring this process:
 * - methodologies/shared/root-cause-diagnosis.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/maestro/maestro-development.js
 * - methodologies/pilot-shell/pilot-shell-bugfix.js
 *
 * This process intentionally uses agent tasks rather than kind: "shell" tasks to
 * respect the repository-specific authoring override for direct Babysitter
 * workflows. Verification agents must still run the listed commands and report
 * the exact command, exit code, and relevant output.
 *
 * @agent maintenance-engineer methodologies/maestro/agents/maintenance-engineer/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function specBlock(args) {
  return [
    'ISSUE SPEC (runtime input, verbatim):',
    '---',
    args.issueBody || '',
    '---',
    '',
    'TRIAGE COMMENT (runtime input, verbatim):',
    '---',
    args.triageComment || '',
    '---',
  ].join('\n');
}

const reuseAuditTask = defineTask(
  'issue-611.reuse-audit',
  async (args) => ({
    kind: 'agent',
    title: 'Phase 0: Reuse-audit findings',
    labels: ['kradle', 'reuse-audit', 'planning'],
    agent: {
      name: 'kradle-reuse-auditor',
      prompt: {
        role: 'senior Kradle maintenance engineer',
        task: 'Run the repo-specific reuse audit before implementation work.',
        instructions: [
          specBlock(args),
          '',
          'Extract keyword nouns and verbs from the issue, then scan existing Kradle web routes, tests, controller APIs, MCP forwarding, and UI error-state patterns.',
          'Start the response with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Do not modify files in this phase.',
          'Return JSON: { findingsMarkdown, matchingInfrastructure, runtimeCallPaths, targetFiles, recommendedTestFiles, noCodeChanges }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Phase 0: Reuse-audit findings', labels: ['kradle', 'reuse-audit'] },
);

const diagnosisTask = defineTask(
  'issue-611.diagnose-contract-drift',
  async (args) => ({
    kind: 'agent',
    title: 'Diagnose route/controller contract drift',
    labels: ['kradle', 'diagnosis', 'api-routes'],
    agent: {
      name: 'kradle-route-diagnostician',
      prompt: {
        role: 'senior debugger and API contract analyst',
        task: 'Confirm the live runtime call paths and exact root causes before code changes.',
        instructions: [
          specBlock(args),
          '',
          'Use the reuse audit below as context:',
          JSON.stringify(args.reuseAudit ?? {}, null, 2),
          '',
          'Inspect only the Kradle web/API/core files needed to confirm the live call paths.',
          'Confirm that assistant/generate already uses an existing controller method and should not be changed for that concern.',
          'Record runtimeCallPaths from entry route/component through controller or fetch boundary.',
          'Do not modify files in this phase.',
          'Return JSON: { rootCauses, runtimeCallPaths, falsePositives, filesToModify, testsToAdd, needsProductDecision, productDecisionQuestion, noCodeChanges }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Diagnose route/controller contract drift', labels: ['kradle', 'diagnosis'] },
);

const testDesignTask = defineTask(
  'issue-611.design-regression-tests',
  async (args) => ({
    kind: 'agent',
    title: 'Design and add regression tests before fixes',
    labels: ['kradle', 'tdd', 'tests'],
    agent: {
      name: 'kradle-test-engineer',
      prompt: {
        role: 'test engineer for Kradle web routes and React components',
        task: 'Add focused failing regression tests before implementing fixes.',
        instructions: [
          specBlock(args),
          '',
          'DIAGNOSIS:',
          JSON.stringify(args.diagnosis ?? {}, null, 2),
          '',
          'Author focused tests near the existing Kradle web tests. Prefer structural or route contract tests consistent with packages/kradle/web/tests unless a direct route/component test is already practical.',
          'Cover external sync forwarding of all supported body fields into syncExternalBinding options.',
          'Cover inference infer virtual model loading through an existing controller API, scoped to the org when appropriate.',
          'Cover curated catalog deploy partial-failure/error surfacing so the UI cannot report unconditional success when route auto-create fails.',
          'Do not implement production fixes in this phase except the minimal test scaffolding needed to express expected behavior.',
          'Run the narrow relevant tests and confirm at least one new test fails for the expected reason before implementation.',
          'Return JSON: { testsAdded, redCommands, redResults, failedForExpectedReason, notes }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Design and add regression tests before fixes', labels: ['kradle', 'tdd'] },
);

const implementationTask = defineTask(
  'issue-611.implement-focused-fixes',
  async (args) => ({
    kind: 'agent',
    title: 'Implement focused API route and UI fixes',
    labels: ['kradle', 'implementation', 'api-routes', 'ui'],
    agent: {
      name: 'kradle-maintenance-engineer',
      prompt: {
        role: 'senior Kradle web maintenance engineer',
        task: 'Implement the focused fixes for issue #611.',
        instructions: [
          specBlock(args),
          '',
          'DIAGNOSIS:',
          JSON.stringify(args.diagnosis ?? {}, null, 2),
          '',
          'RED TEST RESULT:',
          JSON.stringify(args.tests ?? {}, null, 2),
          '',
          'Implement only the files on the live runtime paths identified by diagnosis.',
          'External sync: preserve bindingName as the first controller argument and forward the supported optional body fields as the second options object. Include namespace if the controller/tool path supports it.',
          'Inference infer: replace the non-existent controller.listResources usage with an existing controller API. Prefer org-scoped listResourceForOrg(org, "KradleVirtualModel") unless diagnosis proves global matching is intended.',
          'Assistant generate: do not change listResourceForOrg just because the original issue listed it; it is a confirmed existing API.',
          'Curated model catalog: surface follow-up route auto-create failure to the user instead of only console.warn. Use explicit partial-success or failure semantics based on diagnosis; default to partial-success warning if route creation is a convenience and service deploy succeeded.',
          'Keep changes narrow. Do not refactor unrelated Kradle UI, route auth, pagination, or catalog behavior.',
          'Run the narrow tests until the new regressions pass.',
          'Return JSON: { changedFiles, summary, testCommands, testResults, decisions }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement focused API route and UI fixes', labels: ['kradle', 'implementation'] },
);

const verificationTask = defineTask(
  'issue-611.verify-quality-gates',
  async (args) => ({
    kind: 'agent',
    title: 'Verify quality gates',
    labels: ['kradle', 'verification', 'quality-gate'],
    agent: {
      name: 'kradle-verifier',
      prompt: {
        role: 'verification engineer',
        task: 'Run and report the quality gates for issue #611.',
        instructions: [
          specBlock(args),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(args.implementation ?? {}, null, 2),
          '',
          'Run these verification commands from the repository root unless a command specifies otherwise:',
          JSON.stringify(args.verificationCommands ?? [], null, 2),
          '',
          'Also run any narrower test commands added by the implementation if they are not covered by the list above.',
          'Report every command with exit code and relevant output. Do not mark passed if a command was skipped without a concrete reason.',
          'Return JSON: { passed, commands, failures, skipped, notes }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['kradle', 'verification'] },
);

const reviewTask = defineTask(
  'issue-611.review-against-spec',
  async (args) => ({
    kind: 'agent',
    title: 'Review implementation against issue spec',
    labels: ['kradle', 'review', 'quality-gate'],
    agent: {
      name: 'kradle-code-reviewer',
      prompt: {
        role: 'senior code reviewer',
        task: 'Review the working tree diff against the issue spec and verification evidence.',
        instructions: [
          'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
          '',
          specBlock(args),
          '',
          'ARTIFACTS AND VERIFICATION:',
          JSON.stringify({
            reuseAudit: args.reuseAudit,
            diagnosis: args.diagnosis,
            tests: args.tests,
            implementation: args.implementation,
            verification: args.verification,
          }, null, 2),
          '',
          'Review the actual diff in the working tree.',
          'Block on missing test coverage, broad unrelated changes, failing verification, assistant/generate churn for the false-positive concern, or silently swallowed curated deploy route failures.',
          'Return JSON: { approved, issues, requiredFixes, residualRisk, changedFiles }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review implementation against issue spec', labels: ['kradle', 'review'] },
);

const refinementTask = defineTask(
  'issue-611.refine-after-review',
  async (args) => ({
    kind: 'agent',
    title: 'Refine implementation after review',
    labels: ['kradle', 'refinement'],
    agent: {
      name: 'kradle-maintenance-engineer',
      prompt: {
        role: 'senior Kradle web maintenance engineer',
        task: 'Apply only the required fixes from review and verification.',
        instructions: [
          specBlock(args),
          '',
          'REVIEW:',
          JSON.stringify(args.review ?? {}, null, 2),
          '',
          'VERIFICATION:',
          JSON.stringify(args.verification ?? {}, null, 2),
          '',
          'Apply only blocking fixes. Do not broaden scope.',
          'Rerun the narrow failing checks before returning.',
          'Return JSON: { changedFiles, summary, testCommands, testResults }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Refine implementation after review', labels: ['kradle', 'refinement'] },
);

export async function process(inputs, ctx) {
  const shared = {
    issueNumber: inputs?.issueNumber,
    title: inputs?.title,
    issueUrl: inputs?.issueUrl,
    issueBody: inputs?.issueBody,
    triageComment: inputs?.triageComment,
    targetFiles: inputs?.targetFiles ?? [],
    verificationCommands: inputs?.verificationCommands ?? [],
  };

  const reuseAudit = await ctx.task(reuseAuditTask, shared, { key: 'issue-611.reuse-audit' });
  const diagnosis = await ctx.task(diagnosisTask, { ...shared, reuseAudit }, { key: 'issue-611.diagnosis' });

  if (diagnosis?.needsProductDecision) {
    await ctx.breakpoint({
      title: 'Curated Catalog Deploy Semantics',
      question: diagnosis.productDecisionQuestion || 'Should curated model deploy fail completely when route auto-create fails, or report partial success with a user-visible warning?',
      context: {
        issueNumber: inputs?.issueNumber,
        diagnosis,
      },
    });
  }

  const tests = await ctx.task(testDesignTask, { ...shared, diagnosis }, { key: 'issue-611.tests' });
  let implementation = await ctx.task(
    implementationTask,
    { ...shared, diagnosis, tests },
    { key: 'issue-611.implementation' },
  );
  let verification = await ctx.task(
    verificationTask,
    { ...shared, implementation },
    { key: 'issue-611.verification' },
  );
  let review = await ctx.task(
    reviewTask,
    { ...shared, reuseAudit, diagnosis, tests, implementation, verification },
    { key: 'issue-611.review' },
  );

  let refinements = 0;
  const maxRefinements = inputs?.maxRefinements ?? 2;
  while ((review?.approved === false || verification?.passed === false) && refinements < maxRefinements) {
    refinements += 1;
    const refinement = await ctx.task(
      refinementTask,
      { ...shared, review, verification },
      { key: `issue-611.refinement-${refinements}` },
    );
    implementation = {
      ...(implementation ?? {}),
      refinement,
      changedFiles: [
        ...new Set([
          ...((implementation?.changedFiles) ?? []),
          ...((refinement?.changedFiles) ?? []),
        ]),
      ],
    };
    verification = await ctx.task(
      verificationTask,
      { ...shared, implementation },
      { key: `issue-611.verification-${refinements}` },
    );
    review = await ctx.task(
      reviewTask,
      { ...shared, reuseAudit, diagnosis, tests, implementation, verification },
      { key: `issue-611.review-${refinements}` },
    );
  }

  return {
    success: review?.approved !== false && verification?.passed !== false,
    phases: ['reuse-audit', 'diagnosis', 'test-first-regressions', 'implementation', 'verification', 'review', 'refinement'],
    changedFiles: implementation?.changedFiles ?? review?.changedFiles ?? [],
    reuseAudit,
    diagnosis,
    tests,
    implementation,
    verification,
    review,
    refinements,
  };
}
