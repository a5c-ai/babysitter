/**
 * @process repo/issue-580-mcp-orchestration-wiring
 * @description Implement issue #580: wire MCP client, approval chains, cost tracking, compaction, and streaming into agent-platform orchestration.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string }
 * @outputs { success: boolean, audit: object, architecture: object, testPlan: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * References searched before authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - packages/tula/platform/src/harness/internal/createRun/orchestration/effects.ts
 * - packages/tula/platform/src/harness/internal/createRun/orchestration/externalPhase.ts
 * - packages/tula/platform/src/mcp/client/{manager,executor,toolRegistry}.ts
 * - packages/tula/platform/src/breakpoints/approvalChains.ts
 * - packages/tula/platform/src/cost/effectCost.ts
 * - packages/tula/platform/src/session/cost.ts
 * - packages/tula/platform/src/compression/compaction.ts
 * - methodologies/shared/root-cause-diagnosis.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - methodologies/planning-with-files/planning-orchestrator.js
 *
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process methodologies/planning-with-files/planning-verification
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? (typeof result?.value === 'string' ? result.value : '');
}

const collectContextTask = defineTask('issue-580.collect-context-and-reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Collect issue context and reuse-audit findings',
  labels: ['issue-580', 'context', 'reuse-audit', 'agent-platform'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "%s\\n" "=== Issue #580 ==="',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "%s\\n" "=== Reuse-audit findings (REVIEW BEFORE PROCEEDING) ==="',
      'printf "%s\\n" "Keywords: MCP client, transport, executor, effect resolution, breakpoint approval chains, governance, per-effect cost tracking, session budget, compaction, streaming output."',
      'printf "%s\\n" "--- Existing infrastructure matches ---"',
      'rg -n "McpToolExecutor|McpToolRegistry|McpClientManager|evaluateApprovalChain|computeEffectCosts|updateSessionCost|checkBudget|shouldAutoCompact|compactSession|StreamingOutputOptions|resolveEffectWithRetry|createStreamingProgressCallbacks" packages/tula/platform/src docs/agent-layer-gaps.md -S',
      'printf "%s\\n" "--- Live orchestration entrypoints ---"',
      'sed -n "1,240p" packages/tula/platform/src/harness/internal/createRun/orchestration/effects.ts',
      'sed -n "320,410p" packages/tula/platform/src/harness/internal/createRun/orchestration/externalPhase.ts',
      'printf "%s\\n" "--- Existing MCP/client and adjacent module tests ---"',
      'find packages/tula/platform/src -path "*__tests__*" -type f | sort | sed -n "1,220p"',
      'printf "%s\\n" "--- Process-library methodology references searched ---"',
      'printf "%s\\n" "methodologies/shared/root-cause-diagnosis.js"',
      'printf "%s\\n" "methodologies/superpowers/test-driven-development.js"',
      'printf "%s\\n" "methodologies/superpowers/verification-before-completion.js"',
      'printf "%s\\n" "methodologies/planning-with-files/planning-orchestrator.js"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const architectureTask = defineTask('issue-580.architecture-and-slice-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design the orchestration wiring boundary and vertical slices',
  labels: ['issue-580', 'architecture', 'no-code-changes'],
  agent: {
    name: 'agent-platform-architecture-planner',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Create an implementation architecture for issue #580 without editing files.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this task.',
        'Trace the live runtime call path from run iteration to effect resolution and result commit.',
        'Define a typed effect execution/routing boundary around the current resolver that preserves existing node/orchestrator_task, shell, breakpoint, sleep, agent, and subprocess behavior.',
        'Plan vertical slices in this order: resolver boundary and regression tests; MCP discovery/execution; approval-chain governance; per-effect cost and session budget; compaction overlay; streaming event propagation.',
        'Explicitly identify which modules should be integrated and which should remain out of scope for issue #580.',
        'Return JSON: { runtimeCallPaths: string[], reusableModules: string[], proposedFiles: string[], slices: array, outOfScope: string[], risks: string[], requiresUserDecision: boolean, decisionQuestion?: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const prepareBranchTask = defineTask('issue-580.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Create issue #580 implementation branch',
  labels: ['issue-580', 'git', 'branch'],
  shell: {
    command: [
      'set -euo pipefail',
      `git fetch origin ${args.baseBranch}`,
      `if git rev-parse --verify ${args.branchName} >/dev/null 2>&1; then`,
      `  git switch ${args.branchName}`,
      'else',
      `  git switch -c ${args.branchName} origin/${args.baseBranch}`,
      'fi',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorTestsTask = defineTask('issue-580.author-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing orchestration integration tests before implementation',
  labels: ['issue-580', 'tdd', 'tests'],
  agent: {
    name: 'agent-platform-test-author',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Author deterministic failing tests for issue #580 before production implementation.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARCHITECTURE PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '---',
        'Edit tests only. Do not change production source files in this task.',
        'Add or extend Vitest coverage for the live orchestration path under packages/tula/platform/src/harness/internal/createRun/__tests__/.',
        'Freeze existing resolver behavior for node/orchestrator_task, shell, breakpoint, agent, and subprocess where practical.',
        'Add acceptance tests proving: MCP-resolvable effects call McpToolExecutor with session/run context; approval-chain metadata is evaluated before breakpoint auto-approval; per-effect cost data is aggregated into session budget checks after resolution; compaction is triggered as an overlay when thresholds are exceeded; streaming callbacks receive effect output without changing existing CLI/json/tui behavior.',
        'Use fakes and injected factories. Do not require live MCP servers, provider credentials, or network access.',
        'Return JSON: { testFiles: string[], behaviorsCovered: string[], redCommand: string, expectedFailureSignals: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyRedTask = defineTask('issue-580.verify-red', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify new tests fail before implementation',
  labels: ['issue-580', 'tdd', 'red-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'set +e',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/tula/platform/src/harness/internal/createRun/__tests__/orchestration.test.ts packages/tula/platform/src/harness/internal/createRun/__tests__/effects.test.ts packages/tula/platform/src/harness/internal/createRun/__tests__/progress.test.ts packages/tula/platform/src/cost/__tests__/effectCost.test.ts packages/tula/platform/src/session/__tests__/cost.test.ts > /tmp/issue-580-red.log 2>&1',
      'status=$?',
      'set -e',
      'cat /tmp/issue-580-red.log',
      'test "$status" -ne 0',
      'rg -n "MCP|mcp|approval|budget|compact|stream|executor|expected|received" /tmp/issue-580-red.log',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementBoundaryAndMcpTask = defineTask('issue-580.implement-boundary-and-mcp', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement resolver boundary and MCP execution slice',
  labels: ['issue-580', 'implementation', 'mcp'],
  agent: {
    name: 'agent-platform-mcp-implementer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Implement the first issue #580 vertical slice: resolver boundary plus MCP tool routing.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARCHITECTURE PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '---',
        'TEST PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.testPlan ?? {}, null, 2),
        '---',
        'Edit production code and tests as needed, preserving unrelated worktree changes.',
        'Introduce the smallest typed routing boundary around resolveEffect/resolveEffectWithRetry that keeps existing effect kinds behaviorally compatible.',
        'Wire configured MCP server discovery and McpToolRegistry/McpToolExecutor into that boundary through injectable factories so tests use fakes.',
        'Pass runId/sessionId/workspace context into MCP routing metadata where the existing types allow it; do not require live MCP servers.',
        'Do not implement unrelated concurrent/background/multi-harness features.',
        'Return JSON: { changedFiles: string[], mcpRoutingSummary: string, preservedBehaviorNotes: string[], verificationFocus: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyMcpSliceTask = defineTask('issue-580.verify-mcp-slice', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify resolver boundary and MCP slice',
  labels: ['issue-580', 'verification', 'mcp'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/tula/platform/src/harness/internal/createRun/__tests__/orchestration.test.ts packages/tula/platform/src/harness/internal/createRun/__tests__/effects.test.ts',
      'rg -n "McpToolExecutor|McpToolRegistry|McpClientManager|mcp" packages/tula/platform/src/harness/internal/createRun packages/tula/platform/src/mcp/client -S',
      'git diff --check -- packages/tula/platform/src',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGovernanceCostCompactionTask = defineTask('issue-580.implement-governance-cost-compaction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement approval chains, cost budget checks, and compaction overlay',
  labels: ['issue-580', 'implementation', 'governance', 'cost', 'compaction'],
  agent: {
    name: 'agent-platform-governance-cost-implementer',
    prompt: {
      role: 'senior TypeScript orchestration engineer',
      task: 'Implement issue #580 governance, cost, and compaction slices on top of the resolver boundary.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARCHITECTURE PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '---',
        'MCP SLICE RESULT (verbatim JSON):',
        '---',
        JSON.stringify(args.mcpImplementation ?? {}, null, 2),
        '---',
        'Wire evaluateApprovalChain only when effect/task governance metadata configures an approval chain; preserve existing non-interactive/yolo auto-approval semantics when no chain is configured.',
        'After each resolved effect is committed or immediately before/after commit in the live orchestration loop, aggregate effect costs using computeEffectCosts and update session cost state with updateSessionCost/checkBudget.',
        'Treat missing cost data as missing, not zero-cost evidence; do not pause unless explicit budget config says autoPause.',
        'Trigger shouldAutoCompact/compactSession based on state size thresholds, writing overlays only and never mutating journal/task artifacts.',
        'Keep changes scoped to packages/tula/platform unless the runtime trace proves a narrow SDK type change is required.',
        'Return JSON: { changedFiles: string[], approvalSummary: string, costSummary: string, compactionSummary: string, compatibilityNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGovernanceCostCompactionTask = defineTask('issue-580.verify-governance-cost-compaction', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify governance, cost, and compaction slices',
  labels: ['issue-580', 'verification', 'governance', 'cost', 'compaction'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/tula/platform/src/harness/internal/createRun/__tests__/effects.test.ts packages/tula/platform/src/cost/__tests__/effectCost.test.ts packages/tula/platform/src/session/__tests__/cost.test.ts packages/tula/platform/src/session/__tests__/sessionHistory.test.ts',
      'rg -n "evaluateApprovalChain|computeEffectCosts|updateSessionCost|checkBudget|shouldAutoCompact|compactSession" packages/tula/platform/src/harness/internal/createRun packages/tula/platform/src/breakpoints packages/tula/platform/src/cost packages/tula/platform/src/session packages/tula/platform/src/compression -S',
      'git diff --check -- packages/tula/platform/src',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementStreamingTask = defineTask('issue-580.implement-streaming-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement streaming output propagation contract',
  labels: ['issue-580', 'implementation', 'streaming'],
  agent: {
    name: 'agent-platform-streaming-implementer',
    prompt: {
      role: 'senior TypeScript CLI/TUI runtime engineer',
      task: 'Implement issue #580 streaming propagation on the live effect path.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARCHITECTURE PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '---',
        'Prior slice results (verbatim JSON):',
        '---',
        JSON.stringify({ mcp: args.mcpImplementation, governanceCostCompaction: args.governanceCostCompaction }, null, 2),
        '---',
        'Propagate StreamingOutputOptions through MCP and effect routing where output is available.',
        'Preserve existing CLI, JSON, TUI, and adapters-events output-mode behavior; add contract tests for no duplicate output and no lost streamed text.',
        'Keep streaming changes explicit and typed rather than printing directly from low-level helpers.',
        'Return JSON: { changedFiles: string[], streamingSummary: string, outputModesCovered: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalVerificationTask = defineTask('issue-580.final-verification', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run final issue #580 quality gates',
  labels: ['issue-580', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/tula/platform/src/harness/internal/createRun/__tests__/orchestration.test.ts packages/tula/platform/src/harness/internal/createRun/__tests__/effects.test.ts packages/tula/platform/src/harness/internal/createRun/__tests__/progress.test.ts packages/tula/platform/src/cost/__tests__/effectCost.test.ts packages/tula/platform/src/session/__tests__/cost.test.ts packages/tula/platform/src/storage/__tests__/journalWatcher.test.ts',
      'npm run build --workspace=@a5c-ai/tula-platform',
      'rg -n "McpToolExecutor|McpToolRegistry|McpClientManager|evaluateApprovalChain|computeEffectCosts|updateSessionCost|checkBudget|shouldAutoCompact|compactSession|StreamingOutputOptions" packages/tula/platform/src/harness/internal/createRun packages/tula/platform/src/mcp packages/tula/platform/src/breakpoints packages/tula/platform/src/cost packages/tula/platform/src/session packages/tula/platform/src/compression -S',
      '! rg -n "Status: NOT INTEGRATED YET" packages/tula/platform/src/mcp packages/tula/platform/src/breakpoints packages/tula/platform/src/cost packages/tula/platform/src/session packages/tula/platform/src/compression -S',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-580.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read implementation artifacts for review',
  labels: ['issue-580', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/tula/platform/src packages/sdk/src packages/tasks-mux/src packages/tool-mux/src packages/transport-mux/src docs/agent-layer-gaps.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-580.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #580 implementation against spec and artifacts',
  labels: ['issue-580', 'review', 'quality-gate'],
  agent: {
    name: 'agent-platform-integration-reviewer',
    prompt: {
      role: 'senior runtime integration reviewer',
      task: 'Review the issue #580 implementation against the original spec and fresh artifacts.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification ?? {}, null, 2),
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Check for behavioral regressions in existing effect kinds, accidental live MCP/network dependency in tests, budget/yolo pauses without explicit config, journal mutation from compaction, and streaming output duplication.',
        'Return JSON: { approved: boolean, issues: string[], missingCoverage: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-580.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue #580',
  labels: ['issue-580', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add packages/tula/platform/src packages/sdk/src packages/tasks-mux/src packages/tool-mux/src packages/transport-mux/src docs/agent-layer-gaps.md',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged implementation changes to commit" >&2; exit 1; }',
      'git commit -m "feat(agent-platform): wire MCP into orchestration"',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Wire MCP client into agent-platform orchestration" --body "Fixes #${args.issueNumber}"$'\\n\\n## Summary\\n- add a typed effect routing boundary around the existing resolver\\n- wire MCP discovery/execution into orchestration with deterministic fakes in tests\\n- integrate configured approval chains, per-effect/session cost checks, compaction overlay triggers, and streaming propagation\\n\\n## Quality gates\\n- targeted agent-platform Vitest coverage for resolver/MCP/governance/cost/compaction/streaming\\n- npm run build --workspace=@a5c-ai/tula-platform\\n- static wiring checks for previously disconnected modules\\n- git diff --check')"`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implementation PR for #580 is ready: %s\\n\\nPlan executed:\\n- preserved existing effect resolver behavior behind a typed routing boundary\\n- wired MCP client/registry/executor through the live orchestration path\\n- integrated approval chains, cost budget checks, compaction overlay triggers, and streaming propagation\\n- verified with targeted Vitest coverage, agent-platform build, static wiring checks, and whitespace checks' "$PR_URL")"`,
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 580;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const branchName = inputs?.branchName ?? 'agent/issue-580-mcp-orchestration';

  const context = await ctx.task(collectContextTask, { issueNumber }, {
    key: 'issue-580.context',
  });

  const architecture = await ctx.task(architectureTask, {
    contextStdout: taskStdout(context),
  }, {
    key: 'issue-580.architecture',
  });

  if (architecture?.requiresUserDecision) {
    await ctx.breakpoint({
      title: 'Issue #580 Architecture Decision',
      question: architecture.decisionQuestion ?? 'The architecture task found an ambiguity that needs user approval before implementation. Continue with the proposed architecture?',
      context: { issueNumber, architecture },
    });
  }

  await ctx.task(prepareBranchTask, {
    baseBranch,
    branchName,
  }, {
    key: 'issue-580.branch',
  });

  const testPlan = await ctx.task(authorTestsTask, {
    contextStdout: taskStdout(context),
    architecture,
  }, {
    key: 'issue-580.tests',
  });

  const redVerification = await ctx.task(verifyRedTask, { testPlan }, {
    key: 'issue-580.red',
  });

  const mcpImplementation = await ctx.task(implementBoundaryAndMcpTask, {
    contextStdout: taskStdout(context),
    architecture,
    testPlan,
    redVerification,
  }, {
    key: 'issue-580.mcp-implementation',
  });

  const mcpVerification = await ctx.task(verifyMcpSliceTask, { mcpImplementation }, {
    key: 'issue-580.mcp-verification',
  });

  const governanceCostCompaction = await ctx.task(implementGovernanceCostCompactionTask, {
    contextStdout: taskStdout(context),
    architecture,
    mcpImplementation,
    mcpVerification,
  }, {
    key: 'issue-580.governance-cost-compaction',
  });

  const governanceVerification = await ctx.task(verifyGovernanceCostCompactionTask, {
    governanceCostCompaction,
  }, {
    key: 'issue-580.governance-verification',
  });

  const streamingImplementation = await ctx.task(implementStreamingTask, {
    contextStdout: taskStdout(context),
    architecture,
    mcpImplementation,
    governanceCostCompaction,
    governanceVerification,
  }, {
    key: 'issue-580.streaming',
  });

  const verification = await ctx.task(finalVerificationTask, {
    mcpVerification,
    governanceVerification,
    streamingImplementation,
  }, {
    key: 'issue-580.final-verification',
  });

  const artifacts = await ctx.task(readArtifactsTask, {}, {
    key: 'issue-580.artifacts',
  });

  const review = await ctx.task(reviewTask, {
    contextStdout: taskStdout(context),
    artifactsStdout: taskStdout(artifacts),
    verification,
  }, {
    key: 'issue-580.review',
  });

  if (review?.approved === false) {
    return {
      success: false,
      issueNumber,
      branchName,
      audit: context,
      architecture,
      testPlan,
      implementation: { mcpImplementation, governanceCostCompaction, streamingImplementation },
      verification,
      review,
    };
  }

  const delivery = await ctx.task(publishTask, {
    issueNumber,
    baseBranch,
    branchName,
  }, {
    key: 'issue-580.delivery',
  });

  return {
    success: true,
    issueNumber,
    branchName,
    audit: context,
    architecture,
    testPlan,
    implementation: { mcpImplementation, governanceCostCompaction, streamingImplementation },
    verification,
    review,
    delivery,
  };
}
