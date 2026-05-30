/**
 * @process repo/issue-622-agent-identity-migration-compatibility
 * @description Implement issue #622: AgentStack to AgentPersona/AgentDefinition migration tooling and backward-compatible dispatch surfaces.
 * @inputs { issueNumber: number, title: string, issueBody: string, issueComments: string[], labels: string[], baseBranch: string, branchName: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, dependencyCheck: object, runtimeTrace: object, tests: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/docs/agent-identity/02-migration.md
 * - .a5c/processes/issue-620-agent-identity-decoupling.mjs
 * - library/methodologies/spec-kit-brownfield.js
 * - library/methodologies/atdd-tdd/atdd-tdd.js
 * - library/specializations/software-architecture/migration-strategy.js
 * - library/specializations/cli-mcp-development/mcp-tool-implementation.js
 * - library/methodologies/superpowers/verification-before-completion.js
 *
 * Repo policy note: AGENTS.md asks direct Babysitter processes in this repo to
 * avoid kind: "shell" subtasks unless the user explicitly asks for a shell
 * workflow. This process uses agent tasks for implementation and verification;
 * verification agents must run the commands listed in inputs and report exact
 * command results.
 *
 * @agent maintenance-engineer methodologies/maestro/agents/maintenance-engineer/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @agent migration-readiness-assessor specializations/code-migration-modernization/agents/migration-readiness-assessor/AGENT.md
 * @agent mcp-tool-designer specializations/cli-mcp-development/agents/mcp-tool-designer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_ATTEMPTS = 3;

function issueSpecBlock(args) {
  return [
    'ISSUE SPEC (runtime input, verbatim):',
    '---',
    args.issueBody || '',
    '---',
    '',
    'ISSUE COMMENTS (runtime input, verbatim JSON):',
    '---',
    JSON.stringify(args.issueComments || [], null, 2),
    '---',
    '',
    'LABELS:',
    JSON.stringify(args.labels || [], null, 2),
  ].join('\n');
}

function acceptanceBlock(args) {
  return [
    'ACCEPTANCE CRITERIA (runtime input, verbatim JSON):',
    '---',
    JSON.stringify(args.acceptanceCriteria || [], null, 2),
    '---',
  ].join('\n');
}

function phases(includeDelivery = false) {
  return [
    'reuse-audit',
    'dependency-and-gap-check',
    'runtime-call-path-trace',
    'test-design',
    'implementation-loop',
    'verification',
    'review',
    'final-acceptance',
    ...(includeDelivery ? ['delivery'] : []),
  ];
}

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 622;
  const branchName = inputs.branchName ?? 'agent/issue-622-agent-identity-migration-compatibility';
  const baseBranch = inputs.baseBranch ?? 'staging';

  const reuseAudit = await ctx.task(reuseAuditTask, { ...inputs, issueNumber }, {
    key: 'issue-622.reuse-audit',
  });

  const dependencyCheck = await ctx.task(dependencyAndGapCheckTask, {
    ...inputs,
    issueNumber,
    reuseAudit,
  }, {
    key: 'issue-622.dependency-gap-check',
  });

  if (dependencyCheck?.blockedByIssue620 === true || dependencyCheck?.requiresMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #622 Dependency Or Scope Decision',
      question: dependencyCheck.question || 'Issue #622 depends on identity core behavior from #620 or an ambiguous compatibility decision. Choose how to proceed.',
      options: [
        'Proceed using the compatibility-preserving path described in the issue',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['issue-622', 'agent-identity', 'dependency-check'],
      context: { runId: ctx.runId, issueNumber, dependencyCheck },
    });
  }

  const runtimeTrace = await ctx.task(runtimeTraceTask, {
    ...inputs,
    issueNumber,
    reuseAudit,
    dependencyCheck,
  }, {
    key: 'issue-622.runtime-trace',
  });

  const tests = await ctx.task(testDesignTask, {
    ...inputs,
    issueNumber,
    reuseAudit,
    dependencyCheck,
    runtimeTrace,
  }, {
    key: 'issue-622.test-design',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementationTask, {
      ...inputs,
      issueNumber,
      reuseAudit,
      dependencyCheck,
      runtimeTrace,
      tests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-622.implementation.${attempt}`,
    });

    verification = await ctx.task(verificationTask, {
      ...inputs,
      issueNumber,
      reuseAudit,
      dependencyCheck,
      runtimeTrace,
      tests,
      implementation,
      attempt,
    }, {
      key: `issue-622.verification.${attempt}`,
    });

    review = await ctx.task(reviewTask, {
      ...inputs,
      issueNumber,
      reuseAudit,
      dependencyCheck,
      runtimeTrace,
      tests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-622.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });
    if (verification?.passed === true && review?.approved === true) break;
  }

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    ...inputs,
    issueNumber,
    reuseAudit,
    dependencyCheck,
    runtimeTrace,
    tests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-622.final-acceptance',
  });

  if (finalAcceptance?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #622 Quality Gate Blocked',
      question: 'Final acceptance did not pass. Approve one manual follow-up attempt with the recorded failures, or stop for maintainer review?',
      options: [
        'Stop and report blocked quality gate',
        'Approve one manual follow-up attempt',
      ],
      expert: 'owner',
      tags: ['issue-622', 'quality-gate'],
      context: { runId: ctx.runId, issueNumber, finalAcceptance, attempts },
    });

    return {
      success: false,
      phases: phases(false),
      reuseAudit,
      dependencyCheck,
      runtimeTrace,
      tests,
      implementation,
      verification,
      review,
      attempts,
      finalAcceptance,
    };
  }

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    branchName,
    baseBranch,
    finalAcceptance,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-622.delivery',
  });

  return {
    success: true,
    phases: phases(true),
    reuseAudit,
    dependencyCheck,
    runtimeTrace,
    tests,
    implementation,
    verification,
    review,
    attempts,
    finalAcceptance,
    delivery,
  };
}

const reuseAuditTask = defineTask(
  'issue-622.reuse-audit',
  async (args) => ({
    kind: 'agent',
    title: 'Phase 0: Reuse-audit findings',
    labels: ['issue-622', 'reuse-audit', 'krate'],
    agent: {
      name: 'krate-agent-identity-reuse-auditor',
      prompt: {
        role: 'senior Krate maintainer doing a repo-specific reuse audit',
        task: 'Run the mandatory Phase 0 reuse audit before implementation.',
        instructions: [
          issueSpecBlock(args),
          '',
          'Start the response with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Extract keyword nouns and verbs from the issue: AgentStack, AgentPersona, AgentDefinition, migration, compatibility, dispatch, trigger, MCP, stack builder UI, inline prompts, deprecation warning.',
          'Scan existing Krate core, CLI, web, chart CRD, Atlas MCP descriptor, docs, and process artifacts for matching infrastructure.',
          'Explicitly note that #620 identity resources may already exist on the branch and identify what is already implemented versus still missing.',
          'Do not modify files in this phase.',
          'Return JSON: { findingsMarkdown, existingInfrastructure, likelyGaps, targetFiles, noCodeChanges }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Phase 0: Reuse-audit findings', labels: ['issue-622', 'reuse-audit'] },
);

const dependencyAndGapCheckTask = defineTask(
  'issue-622.dependency-and-gap-check',
  async (args) => ({
    kind: 'agent',
    title: 'Check #620 dependency and current #622 gaps',
    labels: ['issue-622', 'dependency-check', 'planning'],
    agent: {
      name: 'krate-migration-readiness-assessor',
      prompt: {
        role: 'migration readiness assessor',
        task: 'Determine whether #620 is available and define the remaining #622 scope.',
        instructions: [
          issueSpecBlock(args),
          '',
          'REUSE AUDIT:',
          JSON.stringify(args.reuseAudit || {}, null, 2),
          '',
          'Inspect the current branch for AgentPersona, AgentDefinition, prompt composition, TriggerRule compatibility, dispatch compatibility, web route compatibility, migration tooling, warnings, CLI MCP handling, and Atlas MCP descriptor metadata.',
          'If #620 primitives are absent, report the smallest dependency blocker and do not invent duplicate identity resources.',
          'If #620 primitives are present, scope work to the missing #622 compatibility and migration surfaces.',
          'Do not modify files in this phase.',
          'Return JSON: { blockedByIssue620, requiresMaintainerDecision, question, implementedAlready, remainingScope, excludedScope, targetFiles, risks }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Check #620 dependency and current #622 gaps', labels: ['issue-622', 'dependency-check'] },
);

const runtimeTraceTask = defineTask(
  'issue-622.runtime-trace',
  async (args) => ({
    kind: 'agent',
    title: 'Trace runtime call paths and contracts',
    labels: ['issue-622', 'runtime-trace', 'brownfield'],
    agent: {
      name: 'krate-runtime-path-tracer',
      prompt: {
        role: 'brownfield runtime path analyst',
        task: 'Trace live call paths before edits and constrain implementation to them.',
        instructions: [
          issueSpecBlock(args),
          '',
          'REUSE AUDIT:',
          JSON.stringify(args.reuseAudit || {}, null, 2),
          '',
          'DEPENDENCY CHECK:',
          JSON.stringify(args.dependencyCheck || {}, null, 2),
          '',
          'Trace these paths from entry point to resource or job creation: manual web dispatch, core createManualDispatch, trigger rule validation/evaluation, CRD validation, CLI MCP krate_dispatch_agent, Atlas MCP descriptor, stack builder output, and any migration script location selected by local package conventions.',
          'Record runtimeCallPaths with file paths and the fields flowing across each boundary.',
          'Identify tests that should fail before implementation. Include tests for legacy AgentStack dispatch staying valid.',
          'Do not modify files in this phase.',
          'Return JSON: { runtimeCallPaths, contracts, filesToModify, testsToAdd, docsToUpdate, riskyBoundaries }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Trace runtime call paths and contracts', labels: ['issue-622', 'runtime-trace'] },
);

const testDesignTask = defineTask(
  'issue-622.test-design',
  async (args) => ({
    kind: 'agent',
    title: 'Author failing compatibility and migration tests first',
    labels: ['issue-622', 'tdd', 'tests'],
    agent: {
      name: 'krate-test-engineer',
      prompt: {
        role: 'test engineer for Krate core, web, CLI MCP, and Atlas descriptors',
        task: 'Add focused failing tests before production changes.',
        instructions: [
          issueSpecBlock(args),
          '',
          acceptanceBlock(args),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(args.runtimeTrace || {}, null, 2),
          '',
          'Author tests strictly from the issue spec, comments, docs/agent-identity/02-migration.md, and traced live contracts. Do not redefine acceptance around current implementation.',
          'Cover: legacy AgentStack dispatch still works; AgentDefinition dispatch resolves persona and stack; TriggerRule accepts agentDefinition; migration tooling dry-run creates persona/definition/cleaned-stack plan without mutating; apply mode writes persona/definition before cleaning stack fields; deprecation warnings appear for legacy inline prompts/skills; web dispatch accepts agentDefinition or stackRef/agentStack; CLI MCP and Atlas descriptor accept definition or stack reference; stack builder remains AgentStack-only infrastructure creation.',
          'Run focused tests and report red results. If a criterion is already green from prior #620 work, record it as pre-existing coverage and add only missing tests.',
          'Do not implement production fixes in this phase beyond test-only scaffolding.',
          'Return JSON: { testsAdded, preExistingCoverage, redCommands, redResults, failedForExpectedReason, uncoveredCriteria }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author failing compatibility and migration tests first', labels: ['issue-622', 'tdd'] },
);

const implementationTask = defineTask(
  'issue-622.implementation',
  async (args) => ({
    kind: 'agent',
    title: `Implement issue #622 remaining scope (attempt ${args.attempt})`,
    labels: ['issue-622', 'implementation', 'migration'],
    agent: {
      name: 'krate-maintenance-engineer',
      responderType: 'agent',
      adapter: 'codex',
      fallbackType: 'internal',
      timeout: 900000,
      maxTurns: 24,
      prompt: {
        role: 'senior Krate maintenance engineer',
        task: 'Implement the remaining issue #622 scope on the live runtime paths.',
        instructions: [
          issueSpecBlock(args),
          '',
          acceptanceBlock(args),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(args.runtimeTrace || {}, null, 2),
          '',
          'TEST RESULTS:',
          JSON.stringify(args.tests || {}, null, 2),
          '',
          'PREVIOUS VERIFICATION:',
          JSON.stringify(args.previousVerification || {}, null, 2),
          '',
          'PREVIOUS REVIEW:',
          JSON.stringify(args.previousReview || {}, null, 2),
          '',
          'Implement only the remaining issue #622 gaps identified by dependency check and runtime trace.',
          'Use a phased compatibility change, not a rename: agentStack remains valid indefinitely.',
          'Centralize dispatch target resolution or reuse the existing persona controller path so web, trigger, core, CLI MCP, and descriptor behavior do not diverge.',
          'Migration tooling must default to dry-run, produce backup/reversible output, and in apply mode create AgentPersona and AgentDefinition successfully before cleaning stack identity fields. Do not clean stack fields on partial failure.',
          'Deprecation warnings should be emitted when dispatch resolves a legacy AgentStack containing inline systemPrompt, developerPrompt, taskPrompt, or skillRefs.',
          'Keep the stack builder creating AgentStack infrastructure only; do not turn this issue into full persona editor UI work.',
          'Update docs or command examples only where they describe changed contracts.',
          'Run focused tests as you work and keep the diff narrow.',
          'Return JSON: { changedFiles, summary, decisions, testCommands, testResults, residualRisks }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement issue #622 remaining scope', labels: ['issue-622', 'implementation'] },
);

const verificationTask = defineTask(
  'issue-622.verification',
  async (args) => ({
    kind: 'agent',
    title: `Verify issue #622 quality gates (attempt ${args.attempt})`,
    labels: ['issue-622', 'verification', 'quality-gate'],
    agent: {
      name: 'krate-verifier',
      responderType: 'agent',
      adapter: 'codex',
      fallbackType: 'internal',
      timeout: 900000,
      maxTurns: 14,
      prompt: {
        role: 'verification engineer',
        task: 'Run and report the quality gates for issue #622.',
        instructions: [
          issueSpecBlock(args),
          '',
          acceptanceBlock(args),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(args.implementation || {}, null, 2),
          '',
          'Run these verification commands from the repository root unless a command specifies otherwise:',
          JSON.stringify(args.verificationCommands || [], null, 2),
          '',
          'Also run focused tests added by the implementation if not covered by the listed commands.',
          'Report every command with exit code and relevant output. Do not mark passed if a command was skipped without a concrete environment reason.',
          'Confirm no source files outside the runtime trace were changed except tests/docs directly needed by the issue.',
          'Return JSON: { passed, commands, failures, skipped, changedFiles, notes }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify issue #622 quality gates', labels: ['issue-622', 'verification'] },
);

const reviewTask = defineTask(
  'issue-622.review',
  async (args) => ({
    kind: 'agent',
    title: `Review issue #622 against spec (attempt ${args.attempt})`,
    labels: ['issue-622', 'review', 'quality-gate'],
    agent: {
      name: 'krate-code-reviewer',
      prompt: {
        role: 'senior code reviewer',
        task: 'Review the actual diff against the issue spec and verification evidence.',
        instructions: [
          'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
          '',
          issueSpecBlock(args),
          '',
          acceptanceBlock(args),
          '',
          'ARTIFACTS AND VERIFICATION:',
          JSON.stringify({
            reuseAudit: args.reuseAudit,
            dependencyCheck: args.dependencyCheck,
            runtimeTrace: args.runtimeTrace,
            tests: args.tests,
            implementation: args.implementation,
            verification: args.verification,
          }, null, 2),
          '',
          'Review the working tree diff. Block on destructive migration behavior, missing dry-run/backup semantics, legacy stack regression, inconsistent target field behavior across surfaces, missing deprecation warning coverage, or unrelated implementation churn.',
          'Return JSON: { approved, issues, requiredFixes, residualRisk, changedFiles }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review issue #622 against spec', labels: ['issue-622', 'review'] },
);

const finalAcceptanceTask = defineTask(
  'issue-622.final-acceptance',
  async (args) => ({
    kind: 'agent',
    title: 'Final acceptance gate for issue #622',
    labels: ['issue-622', 'acceptance', 'quality-gate'],
    agent: {
      name: 'krate-acceptance-auditor',
      prompt: {
        role: 'acceptance auditor',
        task: 'Make the final pass/fail decision for issue #622.',
        instructions: [
          issueSpecBlock(args),
          '',
          acceptanceBlock(args),
          '',
          'ATTEMPTS:',
          JSON.stringify(args.attempts || [], null, 2),
          '',
          'Pass only if verification passed, review approved, and every acceptance criterion is either implemented with evidence or explicitly excluded because #620/#621 owns it and the issue scope says so.',
          'Return JSON: { passed, criteria, blockers, residualRisk, readyForDelivery }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Final acceptance gate for issue #622', labels: ['issue-622', 'acceptance'] },
);

const deliveryTask = defineTask(
  'issue-622.delivery',
  async (args) => ({
    kind: 'agent',
    title: 'Prepare PR and issue update for issue #622',
    labels: ['issue-622', 'delivery'],
    agent: {
      name: 'krate-delivery-engineer',
      responderType: 'agent',
      adapter: 'codex',
      fallbackType: 'internal',
      timeout: 600000,
      maxTurns: 10,
      prompt: {
        role: 'delivery engineer',
        task: 'Prepare the implementation branch for review.',
        instructions: [
          `Issue: #${args.issueNumber}`,
          `Base branch: ${args.baseBranch}`,
          `Implementation branch: ${args.branchName}`,
          '',
          'Ensure the branch contains only issue #622 implementation, tests, and directly relevant docs.',
          'Create a commit with a concise message, push the branch, open a PR against the base branch, link the issue, and post an issue comment summarizing implementation and quality gates.',
          'Do not force-push. Do not include unrelated dirty worktree files.',
          'Return JSON: { committed, pushed, prUrl, issueCommentUrl, summary }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Prepare PR and issue update for issue #622', labels: ['issue-622', 'delivery'] },
);
