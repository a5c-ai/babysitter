/**
 * @process repo/issue-577-tasks-mux-agent-stack-native-tools
 * @description Parent implementation workflow for wiring tasks-mux into the agent stack as the native task routing and tool surface.
 * @inputs { issueNumber: number, branch: string, targetPackages: string[], relatedIssues: number[], targetQualityScore?: number, maxImplementationIterations?: number }
 * @outputs { success: boolean, phases: string[], runtimeCallPaths: object, qualityGates: object, review: object }
 *
 * @process methodologies/spec-kit/spec-kit-implementation
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process babysitter/tdd-quality-convergence
 * @agent technical-planner methodologies/spec-kit/agents/technical-planner/AGENT.md
 * @agent implementation-engineer methodologies/spec-kit/agents/implementation-engineer/AGENT.md
 * @agent quality-auditor methodologies/spec-kit/agents/quality-auditor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_RELATED_ISSUES = [630, 631, 633, 635, 597, 581, 602, 603, 604];
const SPEC_DOCS = [
  'docs/agent-layer-gaps.md',
  'docs/agent-mux-babysitter-integrations/tasks-mux-routing.md',
  'docs/agent-mux-babysitter-integrations/effect-resolution.md',
  'docs/agent-mux-babysitter-integrations/external-agent-tasks.md',
  'docs/agent-mux-babysitter-integrations/testing.md',
  'docs/agent-reference/process-authoring.md',
];
const RUNTIME_PATHS = [
  'packages/tasks-mux/src/types.ts',
  'packages/tasks-mux/src/backend.ts',
  'packages/tasks-mux/src/backends/index.ts',
  'packages/tasks-mux/src/mcp/server.ts',
  'packages/tasks-mux/src/client/responder-matcher.ts',
  'packages/sdk/src/tasks/types.ts',
  'packages/sdk/src/tasks/kinds/index.ts',
  'packages/sdk/src/runtime/intrinsics/task.ts',
  'packages/sdk/src/runtime/orchestrateIteration.ts',
  'packages/agent-core/src/agenticTools/tools/delegation.ts',
  'packages/agent-core/src/types.ts',
  'packages/agent-platform/src/harness/agenticTools/tools/delegation.ts',
  'packages/agent-platform/src/harness/agenticTools/types.ts',
  'packages/agent-platform/src/mcp/client/toolRegistry.ts',
  'packages/agent-platform/src/breakpoints/delegation.ts',
  'packages/agent-platform/src/breakpoints/approvalChains.ts',
];

function asText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if (typeof value.stdout === 'string') return value.stdout;
    if (typeof value.output === 'string') return value.output;
  }
  return JSON.stringify(value ?? null, null, 2);
}

function shellTask(id, title, command, labels = [], timeout = 300000) {
  return defineTask(id, (_args, taskCtx) => ({
    kind: 'shell',
    title,
    command,
    expectedExitCode: 0,
    shell: {
      command,
      expectedExitCode: 0,
      timeout,
      outputPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      stdoutPath: `tasks/${taskCtx.effectId}/stdout.log`,
      stderrPath: `tasks/${taskCtx.effectId}/stderr.log`,
    },
    labels: ['issue-577', ...labels],
  }));
}

const readIssueSpecTask = defineTask('issue-577.read-issue-spec', (args, taskCtx) => {
  const issueNumber = Number(args.issueNumber);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error('issueNumber must be a positive integer');
  }
  const command = [
    `gh issue view ${issueNumber} --json title,body,labels,comments,state,url`,
    ...(args.relatedIssues ?? DEFAULT_RELATED_ISSUES).map((issue) =>
      `gh issue view ${Number(issue)} --json title,body,labels,comments,state,url || true`
    ),
  ].join('\n');
  return {
    kind: 'shell',
    title: 'Runtime-read GitHub issue specifications',
    command,
    expectedExitCode: 0,
    shell: { command, expectedExitCode: 0, timeout: 300000, outputPath: `tasks/${taskCtx.effectId}/output.json` },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      stdoutPath: `tasks/${taskCtx.effectId}/stdout.log`,
      stderrPath: `tasks/${taskCtx.effectId}/stderr.log`,
    },
    labels: ['issue-577', 'spec', 'github'],
  };
});

const readSpecDocsTask = shellTask(
  'issue-577.read-spec-docs',
  'Runtime-read design and gap documents',
  SPEC_DOCS.map((file) => `printf '\\n===== ${file} =====\\n'; sed -n '1,260p' ${file}`).join('\n'),
  ['spec', 'docs'],
);

const traceRuntimePathsTask = shellTask(
  'issue-577.trace-runtime-paths',
  'Trace live runtime call paths and current implementation gaps',
  [
    `printf '===== targeted files =====\\n'`,
    RUNTIME_PATHS.map((file) => `printf '\\n===== ${file} =====\\n'; sed -n '1,280p' ${file}`).join('\n'),
    `printf '\\n===== symbol search =====\\n'`,
    `rg -n "ResponderType|responderType|AgentMuxResponderBackend|TaskRouter|routeTask|submitTask|taskHandler|create_todo|assign_task|search_tasks|escalate|BreakpointBackend|approval|McpToolRegistry" packages docs || true`,
  ].join('\n'),
  ['research', 'runtime-call-paths'],
);

const dependencySnapshotTask = shellTask(
  'issue-577.dependency-snapshot',
  'Snapshot related plans, PRs, and branch state',
  [
    `git status --short --branch`,
    `gh pr list --state open --search "577 OR 630 OR 631 OR 633 OR 635" --json number,title,headRefName,baseRefName,state,url || true`,
    `gh pr view 644 --json number,title,state,headRefName,files,url,body || true`,
    `gh pr view 673 --json number,title,state,headRefName,files,url,body || true`,
    `gh pr view 676 --json number,title,state,headRefName,files,url,body || true`,
  ].join('\n'),
  ['research', 'dependencies'],
);

const architecturePlanTask = defineTask('issue-577.architecture-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create parent architecture and sequencing plan',
  agent: {
    name: 'technical-planner',
    prompt: {
      role: 'senior TypeScript monorepo architect',
      task: 'Plan the implementation sequence for issue #577 without changing source files.',
      instructions: [
        'Use the SPEC and DOCS blocks verbatim as the source of truth.',
        'Trace every planned architecture decision to a line or section from SPEC, DOCS, or RUNTIME TRACE.',
        'Record runtimeCallPaths from the traced files and identify which files are on the live execution path.',
        'Detect whether related slice plans or implementations already exist and avoid duplicate work.',
        'Preserve legacy ctx.task replay behavior while routing human, agent, tracker, internal, and auto responders through tasks-mux.',
        'Return JSON with: implementationOrder, runtimeCallPaths, dependencyRisks, sourceFilesInScope, testsToAuthorFirst, qualityGates, requiresUserDecision.',
        '',
        'SPEC (verbatim):',
        '---',
        asText(args.issueSpec),
        '---',
        '',
        'DOCS (verbatim):',
        '---',
        asText(args.specDocs),
        '---',
        '',
        'RUNTIME TRACE (verbatim):',
        '---',
        asText(args.runtimeTrace),
        '---',
        '',
        'DEPENDENCY SNAPSHOT (verbatim):',
        '---',
        asText(args.dependencySnapshot),
        '---',
      ],
      outputFormat: 'Strict JSON architecture plan.',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-577', 'architecture', 'planning'],
}));

const authorAcceptanceTestsTask = defineTask('issue-577.author-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing acceptance and integration tests first',
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'senior test-first TypeScript engineer',
      task: 'Author failing tests for issue #577 before implementation.',
      instructions: [
        'Do not read files under implementation directories. Author tests strictly from the spec text above.',
        'Use the architecture plan only for file placement and package boundaries, not for redefining acceptance criteria.',
        'Add or update tests that fail until tasks-mux is the unified routing hub for native agent tools, MCP tools, breakpoints, approvals, SDK task effects, and subtask dispatch.',
        'Cover legacy compatibility: existing ctx.task replay and current agent-core delegation must keep working unless the spec says otherwise.',
        'Prefer package-local Vitest tests and one end-to-end routing acceptance test spanning SDK -> tasks-mux -> selected backend.',
        'Return JSON with testFiles, acceptanceCriteriaCovered, expectedFailures, and any underspecified criteria.',
        '',
        'SPEC (verbatim):',
        '---',
        asText(args.issueSpec),
        '---',
        '',
        'ARCHITECTURE PLAN (verbatim):',
        '---',
        asText(args.architecturePlan),
        '---',
      ],
      outputFormat: 'Strict JSON test authoring report.',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-577', 'tdd', 'tests-first'],
}));

const verifyTestsFailTask = shellTask(
  'issue-577.verify-tests-fail',
  'Verify new acceptance tests fail before implementation',
  [
    `set +e`,
    `failures=0`,
    `npm run test --workspace=@a5c-ai/tasks-mux; code=$?; if [ "$code" -ne 0 ]; then failures=$((failures + 1)); fi`,
    `npm run test:sdk; code=$?; if [ "$code" -ne 0 ]; then failures=$((failures + 1)); fi`,
    `npm run test --workspace=@a5c-ai/agent-core; code=$?; if [ "$code" -ne 0 ]; then failures=$((failures + 1)); fi`,
    `npm run test --workspace=@a5c-ai/agent-platform; code=$?; if [ "$code" -ne 0 ]; then failures=$((failures + 1)); fi`,
    `if [ "$failures" -eq 0 ]; then echo "Expected at least one newly authored acceptance test to fail before implementation"; exit 1; fi`,
    `echo "Red gate observed $failures failing package test command(s), as expected before implementation."`,
  ].join('\n'),
  ['tdd', 'red-gate'],
  900000,
);

function implementationTask(id, title, focusedTask) {
  return defineTask(`issue-577.${id}`, (args, taskCtx) => ({
    kind: 'agent',
    title,
    agent: {
      name: 'implementation-engineer',
      prompt: {
        role: 'senior TypeScript integration engineer',
        task: focusedTask,
        instructions: [
          'Implement only files on the runtime call paths or tests/docs needed to prove the issue.',
          'Use the SPEC block verbatim as the source of truth and do not reduce scope silently.',
          'Keep changes compatible with existing public APIs unless the spec explicitly requires a new API.',
          'Preserve deterministic replay and journal behavior for existing SDK tasks.',
          'Prefer existing package patterns and local helper APIs; do not introduce unnecessary abstractions.',
          'Return JSON with changedFiles, summary, testsAddedOrUpdated, compatibilityNotes, and remainingRisks.',
          '',
          'SPEC (verbatim):',
          '---',
          asText(args.issueSpec),
          '---',
          '',
          'ARCHITECTURE PLAN (verbatim):',
          '---',
          asText(args.architecturePlan),
          '---',
          '',
          'PREVIOUS PHASES (verbatim):',
          '---',
          asText(args.previousPhases),
          '---',
        ],
        outputFormat: 'Strict JSON implementation phase report.',
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['issue-577', 'implementation', id],
  }));
}

const implementTasksMuxRoutingTask = implementationTask(
  'implement-tasks-mux-routing',
  'Implement tasks-mux responder router, task model, MCP/native task tools',
  'Implement the tasks-mux routing foundation and task/todo/escalation surfaces: ResponderType/router, AgentMuxResponderBackend integration point, create_todo, assign_task, search_tasks, escalate, MCP registration, backend exports, and compatibility with existing breakpoint backends.',
);

const implementSdkEffectRoutingTask = implementationTask(
  'implement-sdk-effect-routing',
  'Route SDK task effects and human-in-the-loop through tasks-mux',
  'Wire SDK task definitions/effect metadata and effect resolution so responderType routing intent flows to tasks-mux, legacy ctx.task replay remains compatible, and human-in-the-loop effects resolve through tasks-mux instead of parallel systems.',
);

const implementAgentStackToolsTask = implementationTask(
  'implement-agent-stack-tools',
  'Wire agent-core and agent-platform native tools to tasks-mux',
  'Register tasks-mux MCP tools in the agent harness, add native built-in agent tools create_todo, assign_task, search_tasks, and escalate, and route agent-core/agent-platform delegation through tasks-mux rather than generic taskHandler-only paths.',
);

const implementBreakpointApprovalTask = implementationTask(
  'implement-breakpoint-approval',
  'Wire breakpoint delegation and approval chains through tasks-mux',
  'Replace disconnected breakpoint delegation and approval-chain flows with tasks-mux BreakpointBackend routing, preserving existing rules while journaling routing decisions, escalations, and fallback reasons.',
);

const implementSubtaskDispatchTask = implementationTask(
  'implement-subtask-dispatch',
  'Route cross-agent subtask dispatch through tasks-mux and agent-mux adapters',
  'Route subtask and external agent dispatch through tasks-mux responder selection into agent-mux adapters, with unavailable adapter, auth failure, timeout, result propagation, cost, and journal metadata covered by tests.',
);

const verifyFocusedGateTask = shellTask(
  'issue-577.verify-focused-gates',
  'Run focused package verification gates',
  [
    `npm run test --workspace=@a5c-ai/tasks-mux`,
    `npm run typecheck --workspace=@a5c-ai/tasks-mux`,
    `npm run lint --workspace=@a5c-ai/tasks-mux`,
    `npm run test:sdk`,
    `npm run build:sdk`,
    `npm run test --workspace=@a5c-ai/agent-core`,
    `npm run test --workspace=@a5c-ai/agent-platform`,
    `npm run test:agent-mux`,
  ].join('\n'),
  ['verification', 'focused-gates'],
  1800000,
);

const verifyIntegrationGateTask = shellTask(
  'issue-577.verify-integration-gates',
  'Run cross-package integration and metadata gates',
  [
    `npm run build:runtime`,
    `npm run test:architecture`,
    `npm run verify:metadata`,
    `git diff --check`,
    `rg -n "create_todo|assign_task|search_tasks|escalate|ResponderType|responderType|AgentMuxResponderBackend|routeTask|submitTask" packages/tasks-mux packages/sdk packages/agent-core packages/agent-platform`,
  ].join('\n'),
  ['verification', 'integration-gates'],
  2400000,
);

const remediationTask = defineTask('issue-577.remediate-gate-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediate verification failures',
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'senior TypeScript integration engineer',
      task: 'Fix verification failures without expanding scope.',
      instructions: [
        'Compare SPEC to failing gate output directly.',
        'Fix root causes, not symptoms. Do not disable tests or weaken acceptance gates.',
        'Keep all changes within issue #577 scope and runtime call paths.',
        'Return JSON with changedFiles, rootCausesFixed, gatesToRerun, and residualRisk.',
        '',
        'SPEC (verbatim):',
        '---',
        asText(args.issueSpec),
        '---',
        '',
        'GATE OUTPUT (verbatim):',
        '---',
        asText(args.gateOutput),
        '---',
      ],
      outputFormat: 'Strict JSON remediation report.',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-577', 'remediation'],
}));

const finalReviewTask = defineTask('issue-577.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final spec-vs-artifacts review',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'adversarial release reviewer',
      task: 'Compare the original issue specification to the final artifacts and verification evidence.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Report every acceptance criterion as pass/fail/unknown.',
        'Check for missing native tools, missing MCP registration, parallel task/breakpoint systems left disconnected, broken legacy replay, and unjournaled routing/fallback decisions.',
        'Return JSON with approved, score, findingsBySeverity, missingAcceptanceCriteria, and recommendedNextAction.',
        '',
        'SPEC (verbatim):',
        '---',
        asText(args.issueSpec),
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        asText(args.artifacts),
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
      outputFormat: 'Strict JSON final review.',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-577', 'review', 'acceptance'],
}));

const collectArtifactsTask = shellTask(
  'issue-577.collect-artifacts',
  'Collect final diff and verification evidence',
  [
    `git status --short`,
    `git diff --stat`,
    `git diff -- packages/tasks-mux packages/sdk packages/agent-core packages/agent-platform packages/agent-mux docs package.json package-lock.json`,
  ].join('\n'),
  ['verification', 'artifacts'],
  300000,
);

export async function process(inputs, ctx) {
  const issueNumber = Number(inputs?.issueNumber ?? 577);
  const relatedIssues = inputs?.relatedIssues ?? DEFAULT_RELATED_ISSUES;
  const targetQualityScore = Number(inputs?.targetQualityScore ?? 90);
  const maxImplementationIterations = Number(inputs?.maxImplementationIterations ?? 2);

  ctx.log(`Issue #${issueNumber}: tasks-mux native agent-stack integration`);

  const [issueSpec, specDocs, runtimeTrace, dependencySnapshot] = await ctx.parallel.all([
    () => ctx.task(readIssueSpecTask, { issueNumber, relatedIssues }, { key: 'issue-577.spec.issue' }),
    () => ctx.task(readSpecDocsTask, {}, { key: 'issue-577.spec.docs' }),
    () => ctx.task(traceRuntimePathsTask, {}, { key: 'issue-577.runtime.trace' }),
    () => ctx.task(dependencySnapshotTask, {}, { key: 'issue-577.dependencies.snapshot' }),
  ]);

  const architecturePlan = await ctx.task(architecturePlanTask, {
    issueSpec,
    specDocs,
    runtimeTrace,
    dependencySnapshot,
  }, { key: 'issue-577.architecture-plan' });

  if (architecturePlan?.requiresUserDecision) {
    await ctx.breakpoint({
      title: 'Issue #577 architecture decision required',
      question: 'The architecture plan found a dependency or API ambiguity that needs maintainer direction before implementation. Review the plan and choose whether to proceed.',
      context: { runId: ctx.runId, architecturePlan },
    });
  }

  const authoredTests = await ctx.task(authorAcceptanceTestsTask, {
    issueSpec,
    architecturePlan,
  }, { key: 'issue-577.tests.author' });

  const redGate = await ctx.task(verifyTestsFailTask, { authoredTests }, { key: 'issue-577.tests.red-gate' });

  const phases = [];
  let previousPhases = { authoredTests, redGate };
  let finalFocusedGate = null;
  let finalIntegrationGate = null;

  for (let iteration = 1; iteration <= maxImplementationIterations; iteration += 1) {
    ctx.log(`Implementation iteration ${iteration}/${maxImplementationIterations}`);

    const tasksMuxRouting = await ctx.task(implementTasksMuxRoutingTask, {
      issueSpec,
      architecturePlan,
      previousPhases,
    }, { key: `issue-577.iteration-${iteration}.tasks-mux-routing` });
    phases.push(tasksMuxRouting);

    const sdkEffectRouting = await ctx.task(implementSdkEffectRoutingTask, {
      issueSpec,
      architecturePlan,
      previousPhases: { ...previousPhases, tasksMuxRouting },
    }, { key: `issue-577.iteration-${iteration}.sdk-routing` });
    phases.push(sdkEffectRouting);

    const agentStackTools = await ctx.task(implementAgentStackToolsTask, {
      issueSpec,
      architecturePlan,
      previousPhases: { ...previousPhases, tasksMuxRouting, sdkEffectRouting },
    }, { key: `issue-577.iteration-${iteration}.agent-stack-tools` });
    phases.push(agentStackTools);

    const breakpointApproval = await ctx.task(implementBreakpointApprovalTask, {
      issueSpec,
      architecturePlan,
      previousPhases: { ...previousPhases, tasksMuxRouting, sdkEffectRouting, agentStackTools },
    }, { key: `issue-577.iteration-${iteration}.breakpoint-approval` });
    phases.push(breakpointApproval);

    const subtaskDispatch = await ctx.task(implementSubtaskDispatchTask, {
      issueSpec,
      architecturePlan,
      previousPhases: { ...previousPhases, tasksMuxRouting, sdkEffectRouting, agentStackTools, breakpointApproval },
    }, { key: `issue-577.iteration-${iteration}.subtask-dispatch` });
    phases.push(subtaskDispatch);

    finalFocusedGate = await ctx.task(verifyFocusedGateTask, {}, { key: `issue-577.iteration-${iteration}.focused-gate` });
    finalIntegrationGate = await ctx.task(verifyIntegrationGateTask, {}, { key: `issue-577.iteration-${iteration}.integration-gate` });

    const focusedExitCode = finalFocusedGate?.exitCode ?? finalFocusedGate?.code ?? 0;
    const integrationExitCode = finalIntegrationGate?.exitCode ?? finalIntegrationGate?.code ?? 0;
    if (focusedExitCode === 0 && integrationExitCode === 0) break;

    previousPhases = await ctx.task(remediationTask, {
      issueSpec,
      gateOutput: { finalFocusedGate, finalIntegrationGate },
    }, { key: `issue-577.iteration-${iteration}.remediation` });
  }

  const artifacts = await ctx.task(collectArtifactsTask, {}, { key: 'issue-577.collect-artifacts' });
  const review = await ctx.task(finalReviewTask, {
    issueSpec,
    artifacts: { artifacts, finalFocusedGate, finalIntegrationGate, phases },
  }, { key: 'issue-577.final-review' });

  if (review?.approved === false || Number(review?.score ?? 0) < targetQualityScore) {
    await ctx.breakpoint({
      title: 'Issue #577 final acceptance below target',
      question: `Final review score is ${review?.score ?? 'unknown'}; target is ${targetQualityScore}. Review findings and decide whether to continue remediation.`,
      context: { runId: ctx.runId, review },
    });
  }

  return {
    success: review?.approved !== false && Number(review?.score ?? targetQualityScore) >= targetQualityScore,
    phases: [
      'runtime-spec-read',
      'runtime-call-path-trace',
      'architecture-plan',
      'tests-first',
      'tasks-mux-routing',
      'sdk-effect-routing',
      'agent-stack-tools',
      'breakpoint-approval-routing',
      'subtask-dispatch',
      'quality-gates',
      'final-review',
    ],
    runtimeCallPaths: architecturePlan?.runtimeCallPaths ?? {},
    qualityGates: {
      redGate,
      focused: finalFocusedGate,
      integration: finalIntegrationGate,
      targetQualityScore,
    },
    review,
  };
}
