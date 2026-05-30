/**
 * @process repo/issue-596-tasks-mux-task-management
 * @description Implementation process for issue #596: expand tasks-mux from breakpoint routing into task-management primitives.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, relatedIssues: number[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], issueContext: object, reuseAudit: object, architecture: object, tests: object, implementations: object[], verification: object, review: object }
 *
 * References used while authoring:
 * - gh issue view 596 --json title,body,labels,comments
 * - docs/agent-layer-gaps.md
 * - docs/agent-reference/process-authoring.md
 * - packages/tasks-mux/src/types.ts
 * - packages/tasks-mux/src/backend.ts
 * - packages/tasks-mux/src/backends/git-native.ts
 * - packages/tasks-mux/src/backends/server.ts
 * - packages/tasks-mux/src/backends/github-issues.ts
 * - packages/tasks-mux/src/cli/commands/breakpoints.ts
 * - packages/tasks-mux/src/mcp/server.ts
 * - packages/tasks-mux/README.md
 *
 * Process-library audit:
 * - .a5c/process-library/ was absent in this checkout.
 * - Used local library references instead:
 *   - library/tdd-quality-convergence.md
 *   - library/specializations/sdk-platform-development/README.md
 *   - library/specializations/cli-mcp-development/README.md
 *   - library/specializations/software-architecture/README.md
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/v-model
 * @process specializations/sdk-platform-development
 * @process specializations/cli-mcp-development
 * @process specializations/software-architecture
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 596;

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-596.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-596.reuse-audit',
  });

  if (reuseAudit?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #596 Scope or Dependency Decision',
      question: reuseAudit.question ?? 'The reuse audit found an unresolved dependency or scope split. Choose how to proceed before implementation.',
      options: [
        'Proceed with staged core tasks-mux primitives',
        'Pause until related dependency work lands',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-596', 'tasks-mux'],
      context: {
        runId: ctx.runId,
        summary: reuseAudit.summary,
        blockers: reuseAudit.blockers ?? [],
        relatedIssues: inputs?.relatedIssues ?? [577, 597, 634, 630],
      },
    });
  }

  const architecture = await ctx.task(designTaskManagementArchitectureTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-596.design-architecture',
  });

  const acceptanceTests = await ctx.task(authorAcceptanceTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
  }, {
    key: 'issue-596.author-acceptance-tests',
  });

  const implementations = [];
  let verification = null;
  let review = null;

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    const coreImplementation = await ctx.task(implementCoreSchemaBackendTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      acceptanceTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-596.implementation.${attempt}.core-schema-backend`,
    });

    const backendImplementation = await ctx.task(implementBackendParityTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      acceptanceTests,
      coreImplementation,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-596.implementation.${attempt}.backend-parity`,
    });

    const cliMcpImplementation = await ctx.task(implementCliMcpDocsTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      acceptanceTests,
      coreImplementation,
      backendImplementation,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-596.implementation.${attempt}.cli-mcp-docs`,
    });

    const providerImplementation = await ctx.task(implementProviderGuardrailsTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      acceptanceTests,
      coreImplementation,
      backendImplementation,
      cliMcpImplementation,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-596.implementation.${attempt}.provider-guardrails`,
    });

    const implementation = {
      attempt,
      coreImplementation,
      backendImplementation,
      cliMcpImplementation,
      providerImplementation,
    };
    implementations.push(implementation);

    verification = await ctx.task(runQualityGatesTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      acceptanceTests,
      implementation,
      attempt,
    }, {
      key: `issue-596.verification.${attempt}`,
    });

    review = await ctx.task(reviewCompatibilityAndCompletenessTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      acceptanceTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-596.review.${attempt}`,
    });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
    acceptanceTests,
    implementations,
    verification,
    review,
  }, {
    key: 'issue-596.final-acceptance',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #596 Final Acceptance Decision',
      question: finalGate.question ?? 'Final acceptance found a product/API decision that should not be guessed.',
      options: [
        'Accept staged implementation and open follow-up issues',
        'Continue implementation in this issue',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-596', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: implementations.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'architecture',
      'tests-first',
      'core-schema-backend',
      'backend-parity',
      'cli-mcp-docs',
      'provider-guardrails',
      'quality-gates',
      'compatibility-review',
      'final-acceptance',
    ],
    issueContext,
    reuseAudit,
    architecture,
    tests: acceptanceTests,
    implementations,
    verification,
    review,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-596.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #596 and current tasks-mux context',
  labels: ['issue-596', 'tasks-mux', 'research'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior maintainer for tasks-mux and Babysitter SDK integration',
      task: 'Read the live issue context and current tasks-mux implementation before planning edits.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm whether #${args.issueNumber} is a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Treat the issue body, labels, and every comment as the source of truth, including links to #577, #597, #634, and #630.',
        'Read docs/agent-layer-gaps.md, especially the tasks-mux section.',
        'Inspect packages/tasks-mux/src/types.ts, backend.ts, backends/git-native.ts, backends/server.ts, backends/github-issues.ts, cli/commands/breakpoints.ts, mcp/server.ts, MCP tools, package tests, exports, and README.',
        'Inspect existing issue #606, #631, #633, and #635 process files only to identify local process style and adjacent task-routing dependencies.',
        'Do not implement code in this phase.',
        'Return JSON: { title, labels, commentsSummary, requestedCapabilities, relatedIssues, currentCapabilities, missingCapabilities, affectedFiles, acceptanceCriteria, nonGoals, risks, openQuestions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['requestedCapabilities', 'currentCapabilities', 'missingCapabilities', 'affectedFiles', 'acceptanceCriteria', 'risks'],
    },
  },
  io: io(taskCtx),
}));

export const reuseAuditTask = defineTask('issue-596.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Mandatory reuse audit',
  labels: ['issue-596', 'reuse-audit', 'planning'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior maintainer performing the repo-required reuse audit',
      task: 'Find existing infrastructure before proposing or adding new task-management surfaces.',
      context: args,
      instructions: [
        'Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from issue #596: priority, dependsOn, dependencies, search, filter, bulk approve, bulk close, reassign, assigned, in-progress, blocked, escalated, history, timeline, comments, discussion, metrics, SLA, notifications, escalation chains, forms, validation, audit, export, backup, migration.',
        'Scan current tasks-mux source, tests, docs, and package exports for matching schemas, API routes, environment variables, dependencies, imports, CLI commands, MCP tools, and backend methods.',
        'Scan process-library locations in order: .a5c/process-library/ if present, then library/methodologies and library/specializations for matching methodologies and specializations.',
        'Explicitly classify current overlap such as urgency, claimed status, responder profiles, responder matcher, GitHub issue comments, server API paths, and external tracker backends.',
        'Identify infrastructure to reuse rather than duplicating, and list missing seams that must be added.',
        'Flag blockers only when they require human input; otherwise produce a staged implementation recommendation.',
        'Do not modify source files in this phase.',
        'Return JSON: { summary, findings, reusableSeams, missingSeams, processLibraryMatches, dependencyStatus, blockers, needsMaintainerDecision, question }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'findings', 'reusableSeams', 'missingSeams', 'processLibraryMatches', 'needsMaintainerDecision'],
    },
  },
  io: io(taskCtx),
}));

export const designTaskManagementArchitectureTask = defineTask('issue-596.design-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design additive task-management architecture',
  labels: ['issue-596', 'architecture', 'tasks-mux'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'tasks-mux API architect',
      task: 'Design a backward-compatible staged architecture for the issue #596 task-management expansion.',
      context: args,
      instructions: [
        'Use an additive design that preserves existing Breakpoint JSON compatibility, CLI behavior, MCP tool names, and backend contracts unless a migration path is explicitly defined.',
        'Define schema changes for priority low/medium/high/critical, dependsOn[], richer statuses, assignee metadata, history/timeline events, comments/discussion, SLA/metrics, form definitions/submissions, audit entries, export/backup metadata, notification config, and escalation chains.',
        'Define a transition validator for pending, routed, assigned, claimed, in-progress, blocked, escalated, answered, completed, expired, cancelled, and closed-like terminal states; document aliases where needed.',
        'Define backend interface additions for search/filter, dependency operations, assignment/reassignment, state transitions, bulk operations, comments, history, metrics, forms, audit/export, and provider-backed notifications/escalation.',
        'Stage capabilities so core schema/search/state/history/comments/bulk ship before optional provider integrations.',
        'Specify compatibility defaults for old breakpoint files and server/GitHub payloads.',
        'Identify test fixture strategy and migration fixture format.',
        'Return JSON: { architectureSummary, stagedPlan, schemaContract, backendContract, stateMachine, compatibilityPlan, providerInterfaces, docsPlan, risks, qualityGates }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['stagedPlan', 'schemaContract', 'backendContract', 'stateMachine', 'compatibilityPlan', 'qualityGates'],
    },
  },
  io: io(taskCtx),
}));

export const authorAcceptanceTestsTask = defineTask('issue-596.author-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing acceptance and compatibility tests first',
  labels: ['issue-596', 'tests', 'tdd'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer for backend-agnostic task systems',
      task: 'Author the failing test suite for issue #596 before implementation changes.',
      context: args,
      instructions: [
        'Edit tests and fixtures only in this phase.',
        'Add focused tests for schema defaults and parsing compatibility with existing breakpoint JSON.',
        'Add shared backend capability tests for priorities, dependencies, assignment/reassignment, valid and invalid transitions, search/filter, bulk approve/close/reassign, comments, history, metrics/SLA, audit, and export/backup metadata.',
        'Add git-native tests for filesystem persistence, filtering without ad hoc test-only behavior, migration fixtures, and bulk atomicity or explicit partial-failure reporting.',
        'Add server and GitHub Issues backend mapping tests for capability parity or explicit unsupported-feature errors.',
        'Add CLI program tests for search, assign, reassign, close, approve, stats, comments, escalate, templates/forms, rules, and JSON output.',
        'Add MCP tests for create_todo/assign_task/search_tasks/cancel_breakpoint/add_comment/escalate plus compatibility with existing ask/list/answer tools.',
        'Keep external notification, escalation, and provider tests mocked and disabled by default.',
        'Return JSON: { changedFiles, fixturesAdded, testsAdded, expectedInitialFailures, verificationCommands, coverageMap }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'testsAdded', 'expectedInitialFailures', 'verificationCommands', 'coverageMap'],
    },
  },
  io: io(taskCtx),
}));

export const implementCoreSchemaBackendTask = defineTask('issue-596.implement-core-schema-backend', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement core schema, contracts, transitions, and migrations',
  labels: ['issue-596', 'implementation', 'schema', 'backend-contract'],
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior TypeScript engineer for tasks-mux core APIs',
      task: 'Implement the core schema and backend contract slice for issue #596.',
      context: args,
      instructions: [
        'Edit only files required by the architecture and tests.',
        'Add new schema types with compatibility defaults rather than breaking existing Breakpoint consumers.',
        'Prefer named exported schemas/types and shared helper functions over duplicating string unions across CLI, MCP, and backends.',
        'Implement state transition validation and clear error types/messages for invalid transitions.',
        'Extend the BreakpointBackend contract with capability methods and capability detection for optional backend support.',
        'Add migration/defaulting helpers for existing git-native JSON and legacy GitHub/server payloads.',
        'Keep provider-backed notifications/escalation/forms behind interfaces and disabled-by-default configuration.',
        'Return JSON: { changedFiles, exportedTypes, backendMethods, migrationBehavior, compatibilityNotes, testsExpectedToPass, residualRisks }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementBackendParityTask = defineTask('issue-596.implement-backend-parity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement git-native, server, GitHub, and tracker backend parity',
  labels: ['issue-596', 'implementation', 'backend-parity'],
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior backend engineer for tasks-mux storage adapters',
      task: 'Implement backend support for the issue #596 task-management contract.',
      context: args,
      instructions: [
        'Start with git-native as the canonical durable implementation for local/repo workflows.',
        'Implement search/filtering with deterministic semantics for status, priority, assignee/responder, tags, text, dependencies, dates, and project/repo scope.',
        'Implement bulk operations with explicit result reporting for per-item success/failure; do not hide partial failures.',
        'Persist comments/history/audit entries in a format that remains readable and migratable.',
        'Map server and GitHub Issues backends to the shared contract where possible, and return explicit unsupported-feature errors where the remote surface cannot support a feature yet.',
        'Preserve proven answer behavior and existing breakpoint wait/list/answer compatibility.',
        'Do not add real email/Slack/Discord side effects in this slice.',
        'Return JSON: { changedFiles, backendSupportMatrix, unsupportedFeatures, dataFormatNotes, testsExpectedToPass, residualRisks }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementCliMcpDocsTask = defineTask('issue-596.implement-cli-mcp-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement CLI, MCP, exports, and documentation surfaces',
  labels: ['issue-596', 'implementation', 'cli', 'mcp', 'docs'],
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior CLI and MCP developer',
      task: 'Expose issue #596 task-management capabilities through CLI, MCP, package exports, and docs.',
      context: args,
      instructions: [
        'Add CLI commands and tests for search, assign, reassign, close/cancel, approve, bulk operations, comments, escalate, stats, templates/forms, rules, and export/backup where included by the core contract.',
        'Add MCP tools with clear JSON schemas and backend-agnostic handlers for create_todo, assign_task, search_tasks, cancel_breakpoint, add_comment, escalate, and stats/forms where included by the core contract.',
        'Preserve existing breakpoints pending/answer/status/poll and existing MCP ask/list/answer/check/claim/poll behavior.',
        'Update package exports only for stable public types and helpers.',
        'Update README and relevant docs so CLI/MCP/backend support matrices match implementation.',
        'Return JSON: { changedFiles, cliCommands, mcpTools, exportsChanged, docsChanged, testsExpectedToPass, residualRisks }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementProviderGuardrailsTask = defineTask('issue-596.implement-provider-guardrails', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement notification, escalation, forms, audit, and export guardrails',
  labels: ['issue-596', 'implementation', 'providers', 'audit'],
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior platform engineer for controlled external side effects',
      task: 'Implement the optional provider and operational guardrails for issue #596 without enabling noisy side effects by default.',
      context: args,
      instructions: [
        'Implement notification provider interfaces and mocked test providers for email, Slack, Discord, and webhook targets only as far as the architecture requires.',
        'Implement escalation-chain evaluation with deterministic timeout/fallback behavior, but keep real external delivery disabled unless explicitly configured.',
        'Implement structured form definitions/submissions with validation and tests for required fields, conditional fields if supported, and invalid payloads.',
        'Implement metrics/SLA calculations from history/audit data without introducing nondeterministic timing tests.',
        'Implement export/backup operations as deterministic serialized output; ensure secrets/tokens are not exported.',
        'Add security-minded tests for audit integrity, provider disabled-by-default behavior, and credential redaction.',
        'Return JSON: { changedFiles, providers, guardrails, metrics, exportBehavior, testsExpectedToPass, residualRisks }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const runQualityGatesTask = defineTask('issue-596.run-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run targeted and repo quality gates',
  labels: ['issue-596', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior release engineer verifying tasks-mux changes',
      task: 'Run and summarize the quality gates for issue #596.',
      context: args,
      instructions: [
        'Run the verification commands from inputs.verificationCommands in order unless a command is clearly obsolete in the current package scripts; report any substitution with evidence.',
        'At minimum cover tasks-mux tests, tasks-mux typecheck/build if available, CLI/MCP focused tests, backend capability tests, git diff --check, npm run verify:metadata, and the repo quick commands from AGENTS.md where relevant.',
        'If tests fail, diagnose whether the failure is from implementation, stale baseline, dependency work, or environment.',
        'Do not mark passed unless all required gates pass or there is a documented maintainer-approved exception.',
        'Return JSON: { passed, commands, failures, substitutions, environmentNotes, followUpRequired }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'failures'],
    },
  },
  io: io(taskCtx),
}));

export const reviewCompatibilityAndCompletenessTask = defineTask('issue-596.review-compatibility-completeness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review compatibility, backend parity, and issue coverage',
  labels: ['issue-596', 'review', 'compatibility'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'strict code reviewer for API compatibility and task-system completeness',
      task: 'Review the issue #596 implementation for correctness, compatibility, and coverage.',
      context: args,
      instructions: [
        'Lead with blocking findings and file/line references where possible.',
        'Verify every issue-requested capability is implemented, intentionally deferred with explicit unsupported-feature behavior, or documented as a follow-up with rationale.',
        'Check old breakpoint files and existing CLI/MCP workflows still work.',
        'Check backend support matrix consistency across code, tests, and README.',
        'Check provider integrations are disabled by default, mocked in tests, and do not leak credentials in export/audit output.',
        'Check transition validation rejects invalid state moves and allows documented aliases/compatibility paths.',
        'Return JSON: { approved, score, blockingFindings, nonBlockingFindings, compatibilityAssessment, issueCoverage, requiredFixes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'blockingFindings', 'compatibilityAssessment', 'issueCoverage'],
    },
  },
  io: io(taskCtx),
}));

export const finalAcceptanceGateTask = defineTask('issue-596.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #596',
  labels: ['issue-596', 'final-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release owner deciding whether issue #596 is ready to merge',
      task: 'Produce the final acceptance decision for the issue #596 implementation.',
      context: args,
      instructions: [
        'Compare the final diff, tests, docs, and verification results against the issue body and comments.',
        'Require compatibility for existing Breakpoint schema/files, CLI commands, MCP tools, and backend behavior unless a migration is documented and tested.',
        'Require explicit backend capability tests and a clear support matrix.',
        'Require disabled-by-default external notification/escalation behavior and mocked integration tests.',
        'Require docs for new CLI/MCP APIs and migration/compatibility behavior.',
        'List any follow-up issues that should be opened for intentionally deferred provider integrations or remote-backend gaps.',
        'Return JSON: { passed, needsMaintainerDecision, question, summary, changedFiles, gates, coverage, followUps, mergeRecommendation }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'summary', 'gates', 'coverage', 'mergeRecommendation'],
    },
  },
  io: io(taskCtx),
}));

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}
