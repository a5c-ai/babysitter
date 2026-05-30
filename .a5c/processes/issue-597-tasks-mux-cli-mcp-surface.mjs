/**
 * @process repo/issue-597-tasks-mux-cli-mcp-surface
 * @description Implement issue #597: tasks-mux CLI command, MCP tool, resource, and subscription surface parity.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, maxVerificationIterations: number }
 * @outputs { success: boolean, phases: string[], runtimeCallPaths: string[], changedFiles: string[], verification: object, delivery: object }
 *
 * @process cradle/feature-implementation-contribute
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/gsd/iterative-convergence
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function asJson(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

const reuseAuditTask = defineTask('issue-597.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse audit for tasks-mux command/tool surface',
  labels: ['issue-597', 'reuse-audit', 'tasks-mux'],
  agent: {
    name: 'tasks-mux-reuse-auditor',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Run the repo-specific babysitter:plan reuse audit before implementation planning.',
      instructions: [
        'Do not implement yet.',
        'Extract keyword nouns and verbs from the issue prompt and linked docs.',
        'Scan for matching migrations, API routes, environment variables, SDK dependencies, imports, tests, CLI commands, MCP tools, resources, subscriptions, backend methods, templates, and routing rules.',
        'Honor .a5c/reuse-audit.json if present.',
        'You must include a top-level section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Use at least these starting points: packages/tasks-mux/src, packages/tasks-mux/docs, packages/tasks-mux/specs, docs/agent-layer-gaps.md, packages/tasks-mux/src/__tests__.',
        'Return JSON: { findingsMarkdown: string, keywords: string[], existingInfrastructure: string[], missingInfrastructure: string[], recommendedReuse: string[], risks: string[] }.',
        '',
        'ISSUE CONTEXT:',
        asJson(args.issueContext),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const contextMapTask = defineTask('issue-597.context-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1 - Read issue, docs, and trace tasks-mux runtime paths',
  labels: ['issue-597', 'context', 'runtime-call-paths'],
  agent: {
    name: 'tasks-mux-architecture-mapper',
    prompt: {
      role: 'senior package architect',
      task: 'Read issue #597 and trace every live code path affected by the requested CLI and MCP surface.',
      instructions: [
        'Read the full issue with: gh issue view 597 --json title,body,labels,comments.',
        'Read docs/agent-layer-gaps.md, packages/tasks-mux/specs/architecture.md, packages/tasks-mux/README.md, and packages/tasks-mux/docs/setup-guide.md.',
        'Trace CLI entry paths from packages/tasks-mux/src/cli/program.ts through commands and client/backend helpers.',
        'Trace MCP entry paths from packages/tasks-mux/src/mcp/server.ts, tools, backend-resolver, HTTP transport tests, and stdio server start.',
        'Trace backend paths through packages/tasks-mux/src/backend.ts, types.ts, backends/git-native.ts, backends/server.ts, and backends/github-issues.ts.',
        'Trace test/documentation paths that enforce surface parity.',
        'Record only files on the live execution path or direct contract tests/docs.',
        'Return JSON: { issueSummary: string, runtimeCallPaths: string[], currentSurface: object, requestedSurface: object, likelyFiles: string[], testFiles: string[], docsFiles: string[], openQuestions: string[], risks: string[] }.',
        '',
        'REUSE AUDIT:',
        asJson(args.reuseAudit),
        '',
        'ISSUE CONTEXT:',
        asJson(args.issueContext),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const contractDesignTask = defineTask('issue-597.contract-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2 - Design CLI, backend, MCP, resource, and subscription contracts',
  labels: ['issue-597', 'contract', 'api-design'],
  agent: {
    name: 'tasks-mux-contract-designer',
    prompt: {
      role: 'senior API and CLI designer',
      task: 'Create the implementation contract before tests or code changes.',
      instructions: [
        'Do not edit source files in this phase.',
        'Define exact command grammar for breakpoints search, assign, reassign, close, approve, list --status; responders search, stats; templates list/show/create; rules list/add/remove.',
        'Define exact MCP tool names and schemas for create_todo, create_task, assign_task, search_tasks, cancel_breakpoint, escalate_breakpoint, and add_comment_to_breakpoint.',
        'Define breakpoint://[id] resource read/list behavior and resource subscription/notification semantics for state changes.',
        'Map every operation to backend methods, including which methods are new, which existing methods can be reused, and which backend-specific limitations must surface as explicit unsupported-feature errors.',
        'Prefer thin CLI/MCP wrappers over duplicate business logic.',
        'Preserve existing command behavior and compatibility where possible.',
        'If a user decision is genuinely required, set requiresDecision=true and describe the narrow choice. Otherwise keep requiresDecision=false.',
        'Return JSON: { requiresDecision: boolean, decisionPrompt?: string, cliContract: object, mcpToolContract: object, resourceContract: object, backendContract: object, acceptanceCriteria: string[], testPlan: string[], implementationSlices: string[], docsPlan: string[], risks: string[] }.',
        '',
        'CONTEXT MAP:',
        asJson(args.contextMap),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const writeContractTestsTask = defineTask('issue-597.write-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3 - Write failing contract tests first',
  labels: ['issue-597', 'tests', 'atdd'],
  agent: {
    name: 'tasks-mux-contract-test-author',
    prompt: {
      role: 'senior test engineer',
      task: 'Author failing tests that lock the issue #597 CLI/MCP/backend/resource contract before implementation.',
      instructions: [
        'Edit tests only in this phase, plus test fixtures when needed.',
        'Do not change implementation files to make tests pass yet.',
        'Update or replace tests that currently assert the old limited surface, including the absence of breakpoints claim and exactly 8 MCP tools.',
        'Cover CLI command registration, option parsing, JSON output shape, and error behavior for new breakpoints/responders/templates/rules commands.',
        'Cover backend interface/type contracts for search, assignment/reassignment, close/approve, comments, escalation, templates, rules, task/todo aliases, and explicit unsupported backend behavior.',
        'Cover MCP tool registration and handlers for create_todo/create_task, assign_task, search_tasks, cancel_breakpoint, escalate_breakpoint, and add_comment_to_breakpoint.',
        'Cover breakpoint://[id] resource read/list and state-change subscription notifications over both stdio-capable server construction and HTTP transport where practical.',
        'Run the focused tests and record the expected failures as proof the tests exercise missing behavior.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], expectedFailures: string[], commandsRun: string[], notes: string[] }.',
        '',
        'CONTRACT:',
        asJson(args.contract),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementBackendTask = defineTask('issue-597.implement-backend', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4 - Implement shared backend, types, and lifecycle semantics',
  labels: ['issue-597', 'backend', 'types'],
  agent: {
    name: 'tasks-mux-backend-implementer',
    prompt: {
      role: 'senior TypeScript backend engineer',
      task: 'Implement the shared tasks-mux backend and type support required by the contract tests.',
      instructions: [
        'Edit only files on the traced tasks-mux backend/type runtime paths unless tests reveal a directly related helper is needed.',
        'Extend schemas and backend interfaces for search/filter, assignment/reassignment, close/approve, comments, escalation, templates, rules, and task/todo aliases.',
        'Implement git-native behavior first because it is the local default and easiest to test deterministically.',
        'Implement server and GitHub Issues support where existing client/API primitives already exist; otherwise return explicit unsupported-feature errors rather than silently no-oping.',
        'Preserve existing breakpoint ask/answer/poll/list/claim/cancel behavior.',
        'Run focused backend/type tests and fix failures before moving on.',
        'Return JSON: { changedFiles: string[], implementedMethods: string[], unsupportedBackendBehaviors: string[], testsRun: string[], summary: string }.',
        '',
        'CONTRACT:',
        asJson(args.contract),
        '',
        'CONTRACT TEST RESULT:',
        asJson(args.contractTests),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementCliTask = defineTask('issue-597.implement-cli', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5 - Implement tasks-mux CLI command surface',
  labels: ['issue-597', 'cli', 'commander'],
  agent: {
    name: 'tasks-mux-cli-implementer',
    prompt: {
      role: 'senior CLI engineer',
      task: 'Implement the issue #597 tasks-mux CLI commands against the shared backend/client layer.',
      instructions: [
        'Add command groups and commands from the approved contract: breakpoints search/assign/reassign/close/approve/list --status, responders search/stats, templates list/show/create, rules list/add/remove.',
        'Keep output behavior consistent with existing formatTable, formatBreakpoint, formatResponder, printError, and --json conventions.',
        'Use existing client/backends and responder matcher helpers instead of duplicating data access.',
        'Make unsupported operations fail clearly with non-zero exit and JSON error shape in --json mode.',
        'Update CLI registration tests and focused command tests until they pass.',
        'Return JSON: { changedFiles: string[], commandsImplemented: string[], testsRun: string[], summary: string }.',
        '',
        'CONTRACT:',
        asJson(args.contract),
        '',
        'BACKEND IMPLEMENTATION:',
        asJson(args.backendImplementation),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementMcpTask = defineTask('issue-597.implement-mcp', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6 - Implement MCP tools, resources, and subscriptions',
  labels: ['issue-597', 'mcp', 'resources'],
  agent: {
    name: 'tasks-mux-mcp-implementer',
    prompt: {
      role: 'senior MCP integration engineer',
      task: 'Implement the issue #597 tasks-mux MCP tools, breakpoint resource, and state-change subscription support.',
      instructions: [
        'Register MCP tools create_todo, create_task, assign_task, search_tasks, cancel_breakpoint, escalate_breakpoint, and add_comment_to_breakpoint.',
        'Expose breakpoint://[id] resources with read/list behavior that resolves through the same backend resolver as tools.',
        'Add state-change subscription notifications for breakpoint resources where the MCP SDK/server transport supports them; document any transport limitation in code comments and tests.',
        'Keep tool schema style consistent with existing packages/tasks-mux/src/mcp/tools modules.',
        'Update HTTP and server tests so they assert the expanded public MCP surface instead of exactly 8 tools.',
        'Run focused MCP tests and fix failures before moving on.',
        'Return JSON: { changedFiles: string[], toolsImplemented: string[], resourcesImplemented: string[], subscriptionsImplemented: string[], testsRun: string[], summary: string }.',
        '',
        'CONTRACT:',
        asJson(args.contract),
        '',
        'BACKEND IMPLEMENTATION:',
        asJson(args.backendImplementation),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const docsAndParityTask = defineTask('issue-597.docs-and-parity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7 - Update docs, specs, exports, and packaged surface parity',
  labels: ['issue-597', 'docs', 'surface-parity'],
  agent: {
    name: 'tasks-mux-docs-parity-maintainer',
    prompt: {
      role: 'senior package maintainer',
      task: 'Bring documentation, package exports, and packaged surface parity checks in line with the new tasks-mux surface.',
      instructions: [
        'Update packages/tasks-mux/README.md, packages/tasks-mux/docs/setup-guide.md, and packages/tasks-mux/specs/architecture.md for the new CLI commands, MCP tools, resources, and subscriptions.',
        'Update package exports/index files only if the new modules need to be public.',
        'Update packaged-surface-parity tests so the published package includes the expected CLI/MCP modules and docs.',
        'Do not broaden docs beyond the implemented contract.',
        'Run docs/package-focused tests or checks that already exist.',
        'Return JSON: { changedFiles: string[], docsUpdated: string[], parityChecksUpdated: string[], testsRun: string[], summary: string }.',
        '',
        'CONTRACT:',
        asJson(args.contract),
        '',
        'CLI IMPLEMENTATION:',
        asJson(args.cliImplementation),
        '',
        'MCP IMPLEMENTATION:',
        asJson(args.mcpImplementation),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-597.verify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8 - Verification convergence iteration ${args.iteration}`,
  labels: ['issue-597', 'verification', `iteration-${args.iteration}`],
  agent: {
    name: 'tasks-mux-verifier',
    prompt: {
      role: 'senior release engineer and reviewer',
      task: 'Run full verification for issue #597 and repair only directly related failures.',
      instructions: [
        'Run the relevant verification commands yourself and include exact command results in the returned JSON.',
        'Required commands unless impossible: npm run build --workspace=@a5c-ai/tasks-mux; npm run typecheck --workspace=@a5c-ai/tasks-mux; npm run test --workspace=@a5c-ai/tasks-mux; npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-mux; npm pack --json --dry-run --workspace=@a5c-ai/tasks-mux; npm run verify:metadata.',
        'Also run focused CLI/MCP/backend tests for changed files if the broad suite does not isolate them.',
        'If any required verification fails because of issue #597 changes, fix the failure and rerun the command.',
        'Do not fix unrelated dirty worktree files or unrelated failures. Identify them as unrelated if they block full verification.',
        'Compare implementation directly against the issue and contract; do not accept partial surface parity.',
        'Return JSON: { passed: boolean, commands: Array<{ command: string, exitCode: number, summary: string }>, fixesApplied: string[], remainingFailures: string[], changedFiles: string[], coverageGaps: string[], readyForReview: boolean }.',
        '',
        'ISSUE CONTEXT:',
        asJson(args.issueContext),
        '',
        'CONTRACT:',
        asJson(args.contract),
        '',
        'CURRENT IMPLEMENTATION SUMMARY:',
        asJson(args.implementationSummary),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-597.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9 - Final spec-to-artifact review',
  labels: ['issue-597', 'review', 'quality-gate'],
  agent: {
    name: 'tasks-mux-final-reviewer',
    prompt: {
      role: 'senior code reviewer',
      task: 'Perform a final review of the issue #597 implementation against the issue, comments, and contract.',
      instructions: [
        'Review the git diff, tests, docs, and verification results.',
        'Lead with bugs, missing requirements, inconsistent schemas, CLI/MCP drift, unsupported backend behavior that is not explicit, and missing tests.',
        'Confirm whether the implementation covers all requested CLI commands, MCP tools, breakpoint resource, and subscription notifications.',
        'Confirm no unrelated source files were modified.',
        'Return JSON: { approved: boolean, findings: string[], missingRequirements: string[], residualRisks: string[], changedFiles: string[], summary: string }.',
        '',
        'ISSUE CONTEXT:',
        asJson(args.issueContext),
        '',
        'CONTRACT:',
        asJson(args.contract),
        '',
        'VERIFICATION:',
        asJson(args.verification),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliveryTask = defineTask('issue-597.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10 - Commit, push, PR, and issue comment for implementation',
  labels: ['issue-597', 'delivery', 'github'],
  agent: {
    name: 'tasks-mux-delivery-engineer',
    prompt: {
      role: 'senior maintainer',
      task: 'Deliver the completed issue #597 implementation through git and GitHub.',
      instructions: [
        'Only stage files directly changed for issue #597 implementation and its tests/docs.',
        'Do not stage unrelated dirty files already present in the worktree.',
        'Commit with a concise conventional message.',
        `Push the branch ${args.branchName} and open a PR against ${args.baseBranch}.`,
        'The PR title should be: Implement tasks-mux CLI and MCP task surface.',
        'The PR body must link #597 and summarize implemented CLI commands, MCP tools/resources/subscriptions, backend behavior, and verification commands.',
        'Post a comment on issue #597 with a concise implementation summary and PR link.',
        'Return JSON: { success: boolean, commit: string, prUrl: string, issueCommentUrl?: string, stagedFiles: string[], summary: string }.',
        '',
        'FINAL REVIEW:',
        asJson(args.finalReview),
        '',
        'VERIFICATION:',
        asJson(args.verification),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 597;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const branchName = inputs?.branchName ?? 'agent/issue-597-tasks-mux-surface';
  const maxVerificationIterations = inputs?.maxVerificationIterations ?? 3;

  const issueContext = {
    issueNumber,
    title: inputs?.issueTitle ?? 'tasks-mux: missing CLI commands and MCP tools',
    prompt: inputs?.prompt,
    requiredCliCommands: inputs?.requiredCliCommands,
    requiredMcpTools: inputs?.requiredMcpTools,
    requiredMcpResources: inputs?.requiredMcpResources,
    relatedIssues: inputs?.relatedIssues,
    labels: inputs?.labels,
  };

  const phases = [];

  const reuseAudit = await ctx.task(reuseAuditTask, { issueContext }, {
    key: 'issue-597.reuse-audit',
  });
  phases.push('reuse-audit');

  const contextMap = await ctx.task(contextMapTask, { issueContext, reuseAudit }, {
    key: 'issue-597.context-map',
  });
  phases.push('context-map');

  const contract = await ctx.task(contractDesignTask, { contextMap }, {
    key: 'issue-597.contract',
  });
  phases.push('contract-design');

  if (contract?.requiresDecision) {
    const decision = await ctx.breakpoint({
      title: 'Issue #597 Contract Decision',
      question: contract.decisionPrompt ?? 'The contract design found an ambiguous issue #597 decision. Approve the proposed contract or provide the required adjustment.',
      options: ['Approve', 'Request changes'],
      expert: 'owner',
      tags: ['issue-597', 'contract', 'approval'],
      context: { runId: ctx.runId },
    });
    if (!decision.approved) {
      return {
        success: false,
        reason: 'Contract decision was not approved',
        phases,
        reuseAudit,
        contextMap,
        contract,
        decision,
      };
    }
    phases.push('contract-decision');
  }

  const contractTests = await ctx.task(writeContractTestsTask, { contract }, {
    key: 'issue-597.contract-tests',
  });
  phases.push('contract-tests');

  const backendImplementation = await ctx.task(implementBackendTask, {
    contract,
    contractTests,
  }, {
    key: 'issue-597.backend',
  });
  phases.push('backend-implementation');

  const [cliImplementation, mcpImplementation] = await ctx.parallel.all([
    () => ctx.task(implementCliTask, { contract, backendImplementation }, {
      key: 'issue-597.cli',
    }),
    () => ctx.task(implementMcpTask, { contract, backendImplementation }, {
      key: 'issue-597.mcp',
    }),
  ]);
  phases.push('cli-implementation', 'mcp-implementation');

  const docsAndParity = await ctx.task(docsAndParityTask, {
    contract,
    cliImplementation,
    mcpImplementation,
  }, {
    key: 'issue-597.docs-parity',
  });
  phases.push('docs-and-parity');

  let verification;
  for (let iteration = 1; iteration <= maxVerificationIterations; iteration++) {
    verification = await ctx.task(verifyTask, {
      iteration,
      issueContext,
      contract,
      implementationSummary: {
        backendImplementation,
        cliImplementation,
        mcpImplementation,
        docsAndParity,
        previousVerification: verification,
      },
    }, {
      key: `issue-597.verification.${iteration}`,
    });
    phases.push(`verification-${iteration}`);
    if (verification?.passed && verification?.readyForReview !== false) {
      break;
    }
  }

  const finalReview = await ctx.task(finalReviewTask, {
    issueContext,
    contract,
    verification,
  }, {
    key: 'issue-597.final-review',
  });
  phases.push('final-review');

  if (finalReview?.approved === false) {
    return {
      success: false,
      reason: 'Final review did not approve the implementation',
      phases,
      reuseAudit,
      contextMap,
      contract,
      contractTests,
      backendImplementation,
      cliImplementation,
      mcpImplementation,
      docsAndParity,
      verification,
      finalReview,
      runtimeCallPaths: contextMap?.runtimeCallPaths ?? [],
      changedFiles: finalReview?.changedFiles ?? [],
    };
  }

  const delivery = await ctx.task(deliveryTask, {
    branchName,
    baseBranch,
    verification,
    finalReview,
  }, {
    key: 'issue-597.delivery',
  });
  phases.push('delivery');

  return {
    success: delivery?.success !== false,
    phases,
    reuseAudit,
    contextMap,
    contract,
    contractTests,
    backendImplementation,
    cliImplementation,
    mcpImplementation,
    docsAndParity,
    verification,
    finalReview,
    delivery,
    runtimeCallPaths: contextMap?.runtimeCallPaths ?? [],
    changedFiles: delivery?.stagedFiles ?? finalReview?.changedFiles ?? [],
  };
}
